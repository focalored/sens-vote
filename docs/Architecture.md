graph TD
  Client --> Frontend
  
  subgraph fe [sens-vote frontend]
    Frontend[React/Vite]
    
  end

  subgraph be [sens-vote backend]
    Frontend --> Router[VotingSessionsRouter]
    Router --> Service[VotingService]
    SessionStateMachine --> Service
    Service --> StatsBuilder
    Service --> RoundInitializer
    Service --> RoundFinalizer
    RoundInitializer --> VotingStrategy
    RoundFinalizer --> VotingStrategy
    VotingStrategy --> Solo
    VotingStrategy --> Exec
    VotingStrategy --> Membership[Pandahood]
  end

  subgraph db [sens-vote database]
    Service --> SessionModel[(MongoDB:Session)]
    Service --> RoundModel[(MongoDB:Round)]
  end
