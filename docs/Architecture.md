## Session Lifecycle

| Endpoint                  | State Transition        | Data Transformations          |
|---------------------------|-------------------------|-------------------------------|
| POST /                    | undefined → draft       |                               |
| POST /:id/start           | draft → awaiting_mod    | candidates → shuffled+stored  |
| POST /:id/next            | awaiting_mod → votes    | → RoundInitializer → strategy |
| POST /:id/rounds/:id/vote | awaiting_votes → mod    | → RoundFinalizer → results    |
| POST /:id/finalize        | awaiting_mod → complete |                               |

## Data Transformations

### Candidates Transformation

1. Controller:
    - Raw string[] from HTTP request
    - Validated with Zod (length, type)

2. Service:
    - Semantic validation (duplicates, empty values)
    - Shuffled for fairness
    - Stores initial candidates in session.initialCandidates
    - In callback & pandahood rounds, replaced with 'Yes'/'No' buckets

3. RoundInitializer:
    - Uses strategy-suggested candidates if not provided in subsequent rounds
    - Stores round-specific candidates in round.candidates
    - Sets candidateType metadata

4. Strategy:
    - Previous round candidates ranked then filtered based on evalMode
    - Winning candidates returned

5. RoundFinalizer:
    - Winning candidates stored in round.result

### Votes Transformation

