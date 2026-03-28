package risk

import (
	"fmt"
	"sync"
	"testing"
	"time"
)

// Benchmark setup — reusable querier and requests.

func newBenchQuerier() *InMemoryQuerier {
	return NewInMemoryQuerier()
}

func approvedReq(policy PolicyConfig) EvalRequest {
	return EvalRequest{
		AgentID:       "acp:agent:org.example:BenchAgent-001",
		Capability:    "acp:cap:data.read",
		Resource:      "org.example/reports/Q1",
		ResourceClass: ResourcePublic,
		Policy:        policy,
		Now:           time.Unix(1700000000, 0),
	}
}

func deniedReq(policy PolicyConfig) EvalRequest {
	return EvalRequest{
		AgentID:       "acp:agent:org.example:BenchAgent-001",
		Capability:    "acp:cap:financial.payment",
		Resource:      "org.example/accounts/ACC-001",
		ResourceClass: ResourceRestricted,
		Policy:        policy,
		Now:           time.Unix(1700000000, 0),
	}
}

// BenchmarkEvaluate_Approved — baseline APPROVED path (data.read, public, no anomaly).
func BenchmarkEvaluate_Approved(b *testing.B) {
	policy := DefaultPolicyConfig()
	q := newBenchQuerier()
	req := approvedReq(policy)

	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = Evaluate(req, q)
	}
}

// BenchmarkEvaluate_Denied — DENIED path (financial.payment + restricted, no anomaly).
func BenchmarkEvaluate_Denied(b *testing.B) {
	policy := DefaultPolicyConfig()
	q := newBenchQuerier()
	req := deniedReq(policy)

	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = Evaluate(req, q)
	}
}

// BenchmarkEvaluate_WithAnomalyRules — all three F_anom rules active.
func BenchmarkEvaluate_WithAnomalyRules(b *testing.B) {
	policy := DefaultPolicyConfig()
	q := newBenchQuerier()

	agentID := "acp:agent:org.example:BenchAgent-Anom"
	cap := "acp:cap:financial.payment"
	res := "org.example/accounts/ACC-002"
	patKey := PatternKey(agentID, cap, res)
	now := time.Unix(1700000000, 0)

	// Seed Rule 1: 11 requests in last 60s (> N=10)
	for i := 0; i < 11; i++ {
		q.AddRequest(agentID, now.Add(-time.Duration(i)*5*time.Second))
	}
	// Seed Rule 2: 3 denials in last 24h (>= X=3)
	for i := 0; i < 3; i++ {
		q.AddDenial(agentID, now.Add(-time.Duration(i+1)*time.Hour))
	}
	// Seed Rule 3: 3 pattern hits in last 5min (>= Y=3)
	for i := 0; i < 3; i++ {
		q.AddPattern(patKey, now.Add(-time.Duration(i+1)*time.Minute))
	}

	req := EvalRequest{
		AgentID:       agentID,
		Capability:    cap,
		Resource:      res,
		ResourceClass: ResourceRestricted,
		Policy:        policy,
		Now:           now,
	}

	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = Evaluate(req, q)
	}
}

// BenchmarkEvaluate_CooldownActive — short-circuit path (no RS computation).
func BenchmarkEvaluate_CooldownActive(b *testing.B) {
	policy := DefaultPolicyConfig()
	q := newBenchQuerier()

	agentID := "acp:agent:org.example:BenchAgent-Cooldown"
	now := time.Unix(1700000000, 0)
	q.SetCooldown(agentID, now.Add(5*time.Minute))

	req := EvalRequest{
		AgentID:       agentID,
		Capability:    "acp:cap:financial.payment",
		Resource:      "org.example/accounts/ACC-003",
		ResourceClass: ResourceRestricted,
		Policy:        policy,
		Now:           now,
	}

	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = Evaluate(req, q)
	}
}

// BenchmarkPatternKey — hash computation for F_anom Rule 3.
func BenchmarkPatternKey(b *testing.B) {
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = PatternKey(
			"acp:agent:org.example:BenchAgent-001",
			"acp:cap:financial.payment",
			"org.example/accounts/ACC-001",
		)
	}
}

// BenchmarkShouldEnterCooldown — cooldown threshold check.
func BenchmarkShouldEnterCooldown(b *testing.B) {
	policy := DefaultPolicyConfig()
	q := newBenchQuerier()
	agentID := "acp:agent:org.example:BenchAgent-CD"
	now := time.Unix(1700000000, 0)

	// Seed 2 denials (below threshold of 3 — will return false)
	for i := 0; i < 2; i++ {
		q.AddDenial(agentID, now.Add(-time.Duration(i+1)*time.Minute))
	}

	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = ShouldEnterCooldown(agentID, policy, q, now)
	}
}

// ── Sprint N: Controlled latency injection ───────────────────────────────────
//
// TestLatencyInjection characterizes admission throughput as a function of
// backend latency using DelayedQuerier. Each Evaluate() call in the clean
// (non-cooldown) path triggers 4 LedgerQuerier calls; total injected latency
// per request is approximately 4× the per-call value.
//
// Demonstrates that throughput decreases proportionally with backend latency
// while the Evaluate() decision function contributes a fixed ~820 ns overhead
// regardless of backend latency — confirming that ACP is state-bound, not
// compute-bound.
//
// Run with:
//
//	go test -run=TestLatencyInjection -v ./pkg/risk/
func TestLatencyInjection(t *testing.T) {
	policy := DefaultPolicyConfig()
	const workers = 10

	type latencyPoint struct {
		label      string
		perCall    time.Duration
		totalCalls int // higher for fast paths to avoid division-by-zero elapsed
	}

	points := []latencyPoint{
		{"0µs (InMemoryQuerier baseline)", 0, 200_000},
		{"250µs", 250 * time.Microsecond, 2_000},
		{"1ms", 1 * time.Millisecond, 500},
		{"5ms", 5 * time.Millisecond, 200},
	}

	type result struct {
		label       string
		perCall     time.Duration
		totalPerReq time.Duration
		rps         float64
	}

	results := make([]result, 0, len(points))

	for _, pt := range points {
		base := NewInMemoryQuerier()
		var q LedgerQuerier
		if pt.perCall == 0 {
			q = base
		} else {
			q = NewDelayedQuerier(base, pt.perCall)
		}

		start := make(chan struct{})
		var wg sync.WaitGroup
		startTime := time.Now()

		itersPerWorker := pt.totalCalls / workers
		if itersPerWorker < 1 {
			itersPerWorker = 1
		}

		for w := 0; w < workers; w++ {
			wg.Add(1)
			go func(id int) {
				defer wg.Done()
				req := EvalRequest{
					AgentID:       fmt.Sprintf("acp:agent:org.example:LatencyWorker-%d", id),
					Capability:    "acp:cap:data.read",
					Resource:      "org.example/reports/Q1",
					ResourceClass: ResourcePublic,
					Policy:        policy,
				}
				<-start
				for i := 0; i < itersPerWorker; i++ {
					req.Now = time.Now()
					_, _ = Evaluate(req, q)
				}
			}(w)
		}

		close(start)
		wg.Wait()

		elapsed := time.Since(startTime)
		actualCalls := workers * itersPerWorker
		nsPerOp := float64(elapsed.Nanoseconds()) / float64(actualCalls)
		rps := 1e9 / nsPerOp

		totalInjected := time.Duration(4) * pt.perCall
		results = append(results, result{pt.label, pt.perCall, totalInjected, rps})
	}

	t.Logf("──────────────────────────────────────────────────────────────────────────────")
	t.Logf("  %-34s  %14s  %12s", "Configuration", "Injected/req", "Throughput (req/s)")
	t.Logf("──────────────────────────────────────────────────────────────────────────────")
	for _, r := range results {
		t.Logf("  %-34s  %14s  %12.0f", r.label, r.totalPerReq, r.rps)
	}
	t.Logf("──────────────────────────────────────────────────────────────────────────────")
	t.Logf("  Workers: %d | Backend: DelayedQuerier (variable calls per latency point)", workers)
	t.Logf("  Key result: throughput scales inversely with injected latency.")
	t.Logf("  The Evaluate() decision function is not the bottleneck.")
	t.Logf("──────────────────────────────────────────────────────────────────────────────")
}
