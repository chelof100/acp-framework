flowchart TB
    U[Usuario / Sistema Externo] --> ORQ[Orquestador GAT]
    ORQ --> A1[Agente A]
    ORQ --> A2[Agente B]
    subgraph "Agente (Modelo GAT)"
        DEC[Capa Decisión]
        VAL[Capa Validación]
        POL[Capa Política\n(ACP)]
        EXEC[Capa Ejecución]
        STATE[Capa Estado]
        OBS[Capa Observabilidad]
    end
    A1 --> DEC
    DEC --> VAL --> POL --> EXEC
    EXEC --> STATE
    DEC & VAL & POL & EXEC --> OBS
    EXEC --> SYS[Sistemas Corporativos]
    OBS --> LOG[Audit Ledger ACP]