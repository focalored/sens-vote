# Sens-Vote: Voting Tool for Sens A cappella

This repository contains the backend service for Sens-Vote, an app built to streamline voting/election processes in my college a cappella group, including running multi-round voting sessions, computing results, and organizing data.

## Changelog

### June 2025

- **7/11/2025:** Created voting session schema and connected to MongoDB!
- **7/13/2025:** Built votingSessions router, VotingSessionService class, and SoloStrategy class.
- **7/14/2025:** Fixed some major bugs in SoloStrategy, now enforcing different rules for understudy tiebreakers in a solo audition session.
- **7/15/2025:** Refactored excessive business logic in VotingSessionService by creating a RoundBuilder to process inputs and manage context for strategy layer to consume.
