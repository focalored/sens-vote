graph TD
  Client --> Frontend
  
  subgraph fe [sens-vote frontend]
    Frontend[React]
    
  end

  subgraph be [sens-vote backend]
    Frontend --> Router[VotingSessionRouter]
    Router --> ReadService[VotingSessionReadService]
    Router --> WriteService[VotingSessionWriteService]
    WriteService[VotingSessionWriteService] --> |Build results
    for each round using| RoundBuilder
    ReadService --> StatsBuilder
    RoundBuilder --> |Compute winners and
    vote statistics| VotingStrategy
    VotingStrategy --> Solo
    VotingStrategy --> Exec
    VotingStrategy --> Membership[Pandahood]
  end

  subgraph db [sens-vote database]
    ReadService --> |Fetch and transform
    session data for display| VotingSessionModel[(MongoDB)]
    WriteService[VotingSessionWriteService] -->|Store and update 
    voting session data| VotingSessionModel[(MongoDB)]
  end
