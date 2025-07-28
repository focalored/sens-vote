# Sens-Vote: Voting Workflow Automation Engine

This repository contains the backend service for Sens-Vote, a workflow-based voting app built to streamline live in-person elections in my college a cappella group. The app uses a rule-based Strategy pattern and a simple state machine to automate round progression and result calculation for 4 different variations of elections (membership auditions - initial, membership auditions - callback, solo auditions, and exec role elections). It also enables the implementation of a simple frontend interface for admin access to voting history on the go.

## Architecture

For more info on this project's architecture, see [Architecture.md](docs/Architecture.md).

## Testing

For info on this project's testing principles, see [TESTING.md](docs/TESTING.md).

## Changelog

### June 2025

- **7/11/2025:** Created voting session schema and connected to MongoDB!
- **7/13/2025:** Built `votingSessions` router, `VotingService` class, and `SoloStrategy` class.
- **7/14/2025:** Fixed some major bugs in `SoloStrategy`, now enforcing different rules for understudy tiebreakers in a solo audition session.
- **7/15/2025:** Refactored excessive business logic in `VotingService` by creating a `RoundBuilder` to process inputs and manage context for strategy layer to consume.
- **7/17/2025:** Because of how frequently round data needs to be mutated, I refactored it into a separate schema so it's no longer deeply embedded in its session. Nonetheless, dependency on previous round data will complicate testing for edge cases. Implemented a basic state machine to efficiently guard how voting session status evolves in `VotingService`. Split `RoundBuilder` into `RoundInitializer` and `RoundFinalizer` to separate concerns.
- **7/20/2025:** Completed all strategy implementations with unit testing! Expanded the semantic scope of `Round.candidates`, now supporting options (e.g., admit/reject) for a single candidate as an alternative to containing candidate names. Created a new `VoteCandidateValidationError` to centralize validation in the strategy layer.
- **7/22/2025:** Added structural validation to the router with Zod and began implementing semantic validation and custom error handling at the service layer. Now strategies focus on checking for logic conflict errors only, focusing only on domain logic.
- **7/23/2025:** API tests are failing with generic status codes and swallowed exceptions, which makes debugging hard. Going to turn to unit testing my service layer for now, so I can debug with more info at my fingertips.
- **7/25/2025:** Finished unit tests for `VotingService` with good coverage! This prompted a lot of refactoring of the validation and error handling, which led to new custom error classes and clearer separation of validation between the controller and service layers.
