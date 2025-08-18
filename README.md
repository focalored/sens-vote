# Sens-Vote: Voting Workflow Automation Engine

This repository contains the backend service for Sens-Vote, a workflow-based voting app built to streamline in-person elections in my college a cappella group. The app uses a Strategy pattern-based rules engine and a simple state machine to automate round progression and result calculation for 4 different voting contexts (membership auditions - initial, membership auditions - callback, solo auditions, and exec role elections). It also enables the implementation of a simple frontend interface for admin access to voting history on the go.

## Tech Stack

<img width="163" height="100" alt="Image" src="https://github.com/user-attachments/assets/2fb20758-1b66-44dd-80e2-09f98d236bd0" />
<img width="100" height="100" alt="Image" src="https://github.com/user-attachments/assets/9effd1b7-26cc-4073-bf7d-da93b1337ad2" />
<img width="393" height="100" alt="Image" src="https://github.com/user-attachments/assets/022bc7bd-67c6-4007-ab54-dc0165b75c35" />
<img width="100" height="100" alt="Image" src="https://github.com/user-attachments/assets/aa27ac7d-11f9-43e5-8d9c-08c95f76902f" />

## Architecture

Workflow-driven backend with:
- Controller validation (Zod)
- Service-level orchestration
- State machine enforcement
- Strategy pattern implementation
- Builder-constructed domain objects
- Full test coverage in core business logic modules

For more info on this project's architecture, see [Architecture.md](docs/Architecture.md).

## Challenges

### Lessons

- **Validation layering:** By dividing input validation across different layers of the backend, I was able to write tests that have high coverage with little overlap (only ~160 unit tests to cover 22 modules). For example, I could focus solely on semantic validation when writing service tests, such as whether the provided candidates list has duplicate names. No need to worry about the shape or type of the data object, as that has been handled by Zod middleware before it was passed to the service.
- **Custom errors:** Writing custom error classes can be an informal way of creating "contracts" for state transitions and data objects, each corresponding to a certain violation of what's expected. `CandidateValidationError` would signal that the provided candidates list before starting a round or session contains duplicate/empty names.

### Refactors
- 

### Tradeoffs
- **Single user:** Since single-user, skipped MongoDB transactions and role-based authentication.
- **Session and Round schema separation:** I chose to refactor Rounds out of the Session model because I found it difficult to update fields in Round when they were embedded deep in Session documents. One risk to this is that rounds no longer truly belong to a session (linked only by a sessionId field), but an advantage is 

### Gaps
- **Vanilla JS:** Failed to migrate part of the code base (service and models) to TypeScript. My unit tests completely broke down because of the mixed JS/TS testing environment - still trying to figure out how to properly mock dependencies when they are written in TypeScript.
- **Strategies are hardcoded:** Configuring strategies with margins, thresholds, and multi-round rules would make it possible to customize voting rules without touching code. Maybe even a strategy builder class for full customization.
- **Not scaled to real-time voting:** The app is currently run by a single moderator, taking in manually tallied votes. There is no queueing for concurrent, real-time vote submission.

## Testing

### Overview

1. Zod handles structure at the controller layer, custom validators handle semantics at the service layer.
2. Service focuses on workflow logic, so it is tested on state transitions and validation edges.
3. Each error type represents a rule violation for some data.

### Errors

| Error Class                     | Trigger Condition                                 | HTTP Status |
|---------------------------------|---------------------------------------------------|-------------|
| `ValidationError`               | Generic validation error for basic defense        | 400         |
| `ZodValidationError`            | Schema violation by request input                 | 400         |
| `CandidateValidationError`      | Empty/duplicate names in candidate list           | 400         |
| `VoteCandidateValidationError`  | Mismatch between votes and candidates lists       | 400         |
| `AuthError`                     | Generic authorization error                       | 401         |
| `InvalidTokenError`             | Decoded token undefined or missing user id field  | 401         |
| `MissingTokenError`             | Token missing under authorization header          | 401         |
| `ExpiredTokenError`             | Token expired (1h)                                | 401         |
| `NotFoundError`                 | Session/Round database query returns null         | 404         |
| `SessionStatusError`            | Invalid service method call given session status  | 409         |
| `InvalidStateTransitionError`   | Invalid session status transition attempt         | 409         |
| `LogicConflictError`            | Strategy layer voting data/mode logic conflicts   | 409         |

## Changelog

### July 2025

- **7/11/2025:** Created voting session schema and connected to MongoDB!
- **7/13/2025:** Built `votingSessions` router, `VotingService` class, and `SoloStrategy` class.
- **7/14/2025:** Fixed some major bugs in `SoloStrategy`, now enforcing different rules for understudy tiebreakers in a solo audition session.
- **7/15/2025:** Refactored excessive business logic in `VotingService` by creating a `RoundBuilder` to process inputs and manage context for strategy layer to consume.
- **7/17/2025:** Because of how frequently round data needs to be mutated, I refactored it into a separate schema so it's no longer deeply embedded in its session. Nonetheless, dependency on previous round data will complicate testing for edge cases. Implemented a basic state machine to efficiently guard how voting session status evolves in `VotingService`. Split `RoundBuilder` into `RoundInitializer` and `RoundFinalizer` to separate concerns.
- **7/20/2025:** Completed all strategy implementations with unit testing! Expanded the semantic scope of `Round.candidates`, now supporting options (e.g., admit/reject) for a single candidate as an alternative to containing candidate names. Created a new `VoteCandidateValidationError` to centralize validation in the strategy layer.
- **7/22/2025:** Added structural validation to the router with Zod and began implementing semantic validation and custom error handling at the service layer. Now strategies focus on checking for logic conflict errors only, focusing only on domain logic.
- **7/23/2025:** API tests are failing with generic status codes and swallowed exceptions, which makes debugging hard. Going to turn to unit testing my service layer for now, so I can debug with more info at my fingertips.
- **7/25/2025:** Finished unit tests for `VotingService` with good coverage! This prompted a lot of refactoring of the validation and error handling, which led to new custom error classes and clearer separation of validation between the controller and service layers.

### August 2025

- **8/13/2025:** Implemented integration tests (request&rarr;router&rarr;server&rarr;db) for all voting API endpoints.
- **8/16/2025:** Added user authorization and JSON Web Token (JWT) authentication to backend with full testing! This involved back-breaking debugging in order to update existing modules and tests, but it was well worth it for my first time learning auth.