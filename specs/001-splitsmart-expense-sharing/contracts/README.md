# Contracts: SplitSmart Swing MVP

**Status**: Draft — Reconciliation Incomplete. **Date**: 2026-11-05

These contracts define in-process Java boundaries, written as tables. They are not code. Parameter and return shapes are proposals (AD-02). Rules are defined in [spec.md](../spec.md#business-rules).

| File | Boundary |
|---|---|
| [service-contracts.md](service-contracts.md) | `ui` → `service` |
| [repository-contracts.md](repository-contracts.md) | `service` → `repository` |
| [ui-interactions.md](ui-interactions.md) | User → `ui` → `service` |

## Contract types that do not apply

| Type | Why not |
|---|---|
| REST or HTTP API | The MVP runs in one process with no network interface. Inventing endpoints would imply a web deliverable that nobody has authorized (OC-1) |
| Messaging, webhooks | One process, no external systems |
| Email or push | FR-018 is Post-MVP; ID-08 uses in-app delivery |
| File export format | FR-038 is Post-MVP |

**OC-1 note:** Service contracts contain no Swing types, which keeps a later web client possible. That is a design property only. It does not satisfy CR-10.

## Conventions for every service operation

1. **Session first.** Except for `register` and `login`, every operation takes a `Session` (AD-03).
2. **Raw input.** Typed values arrive as text, and services parse them (AD-02). Nothing is rounded.
3. **Immutable output.** Operations return views or value objects. Mutable entities never cross the boundary.
4. **Off the EDT.** Callers invoke services through `UiTaskRunner`.
5. **Canonical order.** Mutating calls run PREPARE → BEGIN → AUTHORIZE → VALIDATE → GUARD → EFFECT → COMMIT ([DEC-26](../decisions/decision-log.md#dec-26-canonical-operation-order)). Authorization runs inside the transaction and before validation failures are reported, so refusals reveal nothing.
6. **One transaction per mutating call.** Commit on return, roll back on any exception. Read operations that combine figures use one `readOnly` scope.
7. **Time.** All time comes from the injected `Clock`.

## Common failures

These can occur on any `Session` operation and are not repeated in each table.

| Exception | Meaning |
|---|---|
| `AccessDeniedException` | The session is ended, or the record is visible but this action is not permitted |
| `NotFoundException` | The record does not exist or is not visible. Identical either way, so existence does not leak |
| `PersistenceFailureException` | Storage failed; the transaction rolled back |

`ValidationException` carries `List<FieldError>`, where `FieldError` = `(field, message)`. All invalid fields are reported together, and each message says how to fix the field (FR-015, NFR-007).

## Authorization vocabulary

| Term | Definition |
|---|---|
| **Active member** | Has a membership in the group with no `leftAt` |
| **Admin** | `Group.adminId` equals the session user, who is an active member |
| **Eligible approver** | Participant of the expense, not its creator, and an active member |
| **Personally involved** | Creator, payer, or participant of the expense; or payer or recipient of the payment |
| **Readable expense** | Session user is an active member of its group, or is a former member and personally involved |

## Requirement tags

Each contract row lists requirement IDs. Open semantics are decided in the [decision log](../decisions/decision-log.md).
