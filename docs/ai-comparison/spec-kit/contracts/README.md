# Contracts: SplitSmart Swing MVP

**Status**: Draft. AI-generated; not human reviewed (Constitution Principle VII).
**Date**: 2026-11-04 | **Plan**: [../plan.md](../plan.md) | **Data model**: [../data-model.md](../data-model.md)

These are design contracts between layers, written as tables. They are not code.

| File | Boundary | Direction |
|------|----------|-----------|
| [service-contracts.md](service-contracts.md) | `ui` → `service` | Use cases, validation, authorization |
| [repository-contracts.md](repository-contracts.md) | `service` → `repository` | Persistence |
| [ui-interactions.md](ui-interactions.md) | User → `ui` → `service` | Screens, controllers, keyboard |

## Contract types that do not apply

| Type | Why not |
|------|---------|
| Public REST or HTTP API | The Swing MVP runs in one process with no network interface. Inventing endpoints would imply a web deliverable that has not been authorized and would obscure OC-1. FR-039 remains Post-MVP |
| Inter-service messaging, webhooks | One process with no external systems |
| Email or push delivery | FR-018 is Post-MVP; ID-08 uses in-application delivery |
| File export format | FR-038 is Post-MVP |
| Public library API | SplitSmart is an application, not a library |

**OC-1 note**: Service contracts have no Swing types, which keeps a future web client possible. That
is a design property only. It does not satisfy CR-10.

## Conventions

- **Actor**: Each operation that needs a signed-in user takes `actor` (a `UserId`) as its first input
  and checks permission itself. The UI may hide controls, but that is not the enforcement.
- **Raw input**: Fields typed by users arrive as text, and `service` parses them, so validation does
  not live in Swing.
- **Money output**: `Money`. Formatting for display happens in `ui` (FR-041).
- **Threading**: Services are called off the Event Dispatch Thread (research R-03).
- **Transactions**: A service operation that writes runs in one transaction.

## Error model

All are unchecked exceptions, declared in `domain` so that every layer can use them.

| Exception | Meaning | UI behavior | Requirements |
|-----------|---------|-------------|--------------|
| `ValidationException` | Carries a list of `FieldError` (field, problem, how to fix it) | Marks each field and keeps all entered data | FR-015, NFR-007 |
| `AuthenticationFailedException` | Wrong username or password; does not say which | Generic login message | FR-002 |
| `AccountLockedException` | Too many failed logins | "Temporarily locked" message | NFR-002 |
| `AuthorizationException` | The actor may not do this or see this | "Not allowed" message; shows no protected data | FR-003, FR-006, FR-022, NFR-003 |
| `NotFoundException` | The item does not exist or is not visible to the actor. Both give the same result, so existence isn't leaked | Message; refresh the view | FR-003, NFR-003 |
| `ConflictException` | State changed first, such as "no longer pending" or a stale version | Message; reload the item | FR-024, Edge Cases |
| `OverpaymentConfirmationRequiredException` | Carries amount owed and amount entered | Confirmation dialog, then repeat the call with confirmation | FR-032 |
| `DataAccessException` | Unexpected storage failure, declared in `repository` | Generic message; logged; the transaction is rolled back | NFR-005 |
| `DuplicateKeyException` | A unique rule was violated, declared in `repository` | Never reaches the UI directly: services map it to `ValidationException` or `ConflictException` | FR-001, FR-006, FR-024 |
