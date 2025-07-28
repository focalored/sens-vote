# Sens-Vote: Voting Workflow Automation Engine

This repository contains the backend service for Sens-Vote, a workflow-based voting app built to streamline live in-person elections in my college a cappella group. The app uses a rule-based Strategy pattern and a simple state machine to automate round progression and result calculation for 4 different variations of elections (membership auditions - initial, membership auditions - callback, solo auditions, and exec role elections). It also enables the implementation of a simple frontend interface for admin access to voting history on the go.

## Tech Stack

<img width="163" height="100" alt="Image" src="https://github.com/user-attachments/assets/2fb20758-1b66-44dd-80e2-09f98d236bd0" />
<img width="100" height="100" alt="Image" src="https://github.com/user-attachments/assets/aa27ac7d-11f9-43e5-8d9c-08c95f76902f" />
<img width="393" height="100" alt="Image" src="https://github.com/user-attachments/assets/022bc7bd-67c6-4007-ab54-dc0165b75c35" />
<img width="100" height="100" alt="Image" src="https://github.com/user-attachments/assets/9effd1b7-26cc-4073-bf7d-da93b1337ad2" />

## Architecture

Workflow-driven backend with:
- Controller validation (Zod)
- Service orchestration
- State machine enforcement
- Strategy pattern implementation
- Builder-constructed domain objects
- Full test coverage in core business logic modules

For more info on this project's architecture, see [Architecture.md](docs/Architecture.md).

## Challenges

## Testing

### Testing Principles

1. Zod handles structure at the controller layer, custom validators handle semantics at the service layer.
2. Each error type represents a rule violation for some data.
3. Service focuses on workflow logic, so it is tested on state transitions and validation edges.

### Lessons Learned

- By dividing input validation across different layers of the backend, I was able to write tests that have good coverage with little overlap. For example, I could focus solely on semantic validation when writing service tests, such as whether the provided candidates list has duplicate names. No need to worry about the shape or type of the data object, as that has been handled by Zod middleware before it was passed to the service.

- Writing custom error classes can be an informal way of creating "contracts" for state transitions and data objects, each corresponding to a certain violation of what's expected. `CandidateValidationError` would signal that the provided candidates list before starting a round or session contains duplicate/empty names.

### Errors

| Error Class                     | Trigger Condition                                 | HTTP Status |
|---------------------------------|---------------------------------------------------|-------------|
| `ZodValidationError`            | Schema violation by request input                 | 400         |
| `CandidateValidationError`      | Empty/duplicate names in candidate list           | 400         |
| `VoteCandidateValidationError`  | Mismatch between votes and candidates lists       | 400         |
| `SessionStatusError`            | Invalid service method call given session status  | 409         |
| `InvalidStateTransitionError`   | Invalid session status transition attempt         | 409         |
| `LogicConflictError`            | Strategy layer voting data/mode logic conflicts   | 409         |
| `NotFoundError`                 | Session/Round database query returns null         | 404         |

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
