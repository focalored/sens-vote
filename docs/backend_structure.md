graph TD
  subgraph Frontend
    UI[React Interface]
    UI -->|/api/sessions| SessionAPI
  end

  subgraph Express API
    SessionAPI --> ExpressApp
    ExpressApp --> Middleware[Validation, Session]
    
  end

  subgraph Routers
    ExpressApp --> VotingRouter
    
  end

  subgraph Services
    VotingRouter -->|Route: GET /sessions/:id| VotingSessionService
    VotingRouter -->|Route: POST /sessions| VotingSessionService
    VotingRouter -->|Route: POST /sessions/:id/rounds| VotingSessionService
    VotingSessionService --> getSession
    VotingSessionService --> createSession
    VotingSessionService --> addRound
    addRound -->|Calls helpers like| _buildRound
    getSession --> VotingSessionModel[(MongoDB: VotingSessions)]
    createSession --> VotingSessionModel[(MongoDB: VotingSessions)]
    addRound --> VotingSessionModel[(MongoDB: VotingSessions)]
  end

  subgraph Strategy Layer
    _buildRound --> VotingStrategy
    VotingStrategy -->|Extends| BaseStrategy
    VotingStrategy -->|Methods like| getResult
    VotingStrategy -->|Optional| suggestNextCandidates
  end
