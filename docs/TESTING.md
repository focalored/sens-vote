## Testing Principles

1. Zod handles structure at the controller, custom modules handle semantics at the service.
2. Each error type represents a specific contract violation.
3. Service focuses on workflow logic, so it is tested on state transitions and validation edges.

## Lessons Learned

- By dividing input validation across different layers of the backend, I was able to write tests that have good coverage with little overlap. For example, I could focus solely on semantic validation when writing service tests, such as whether the provided candidates list has duplicate names. No need to worry about the shape or type of the data object, as that has been handled by Zod middleware before it was passed to the service.

- Writing custom error classes can be an informal way of creating contracts around states and data flowing through the system, each corresponding to a certain violation of what's expected. `CandidateValidationError` would signal that the provided candidates list before starting a round or session contains duplicate/empty names.

## Errors

| Error Class                     | Trigger Condition                                 | HTTP Status |
|---------------------------------|---------------------------------------------------|-------------|
| `ZodValidationError`            | Schema violation by request input                 | 400         |
| `CandidateValidationError`      | Empty/duplicate names in candidate list           | 400         |
| `VoteCandidateValidationError`  | Vote for non-existent candidate                   | 400         |
| `SessionStatusError`            | Invalid service method call given session status  | 409         |
| `InvalidStateTransitionError`   | Invalid session status transition attempt         | 409         |
| `LogicConflictError`            | Strategy layer voting data/mode logic conflicts   | 409         |
| `NotFoundError`                 | Session/Round database query returns null         | 404         |
