# Internal Contracts

**Status:** AI-generated draft, not reviewed. Requires named human review (Principle VII).

These contracts define in-process Java boundaries for the Swing MVP. **No REST, HTTP, or other network API is defined,** because the MVP has none. FR-039 (web access) is Post-MVP and depends on the unresolved OC-1.

| File | Boundary |
|---|---|
| [service-contracts.md](service-contracts.md) | `ui` → `service` |
| [repository-contracts.md](repository-contracts.md) | `service` → `repository` |
| [ui-service-interactions.md](ui-service-interactions.md) | How controllers use those services |

Signatures are descriptive, not code. Parameter and return shapes are proposals under AD-02.

## Conventions for every service operation

1. **Session first.** Except for `register` and `login`, every operation takes a `Session` issued by `AccountService.login` (AD-03).
2. **Raw inputs.** User-entered values arrive as text, and services parse them (AD-02). Nothing is rounded during parsing.
3. **Immutable outputs.** Operations return views or value objects. Mutable entities never cross the boundary.
4. **Off-EDT.** Callers invoke services off the Event Dispatch Thread through `UiTaskRunner`.
5. **One transaction per mutating call** (AD-09).
6. **Authorization precedes validation of business content**, so refusal messages do not reveal data.

## Common failures

These can occur on any operation and are not repeated in each table.

| Exception | Meaning |
|---|---|
| `AccessDeniedException` | The session may not do this, or the record's group is not visible to them. Same result whether or not the group exists. |
| `PersistenceFailureException` | Storage failed; the transaction rolled back. |

Every `ValidationException` carries a `List<FieldError>`, where `FieldError` = `(field, message)`. All invalid fields are reported together, and each message says how to fix the field (FR-015, NFR-007).

## Authorization vocabulary

| Term | Definition |
|---|---|
| **Active member** | Membership in the group with no `leftAt` |
| **Admin** | `Group.adminId` equals the session user |
| **Eligible approver** | Participant of the expense, not its creator, and an active member (FR-021, FR-022) |
| **Personally involved** | Creator, payer, or participant of the expense; or payer or recipient of the payment |
| **Readable expense** | Session user is an active member of its group, **or** was formerly a member and is personally involved (AD-17, `NEEDS CLARIFICATION` SRC-02) |
