# Repository Contracts (`service` → `repository`)

**Status**: Draft. AI-generated; not human reviewed.

Interfaces live in `repository`. Proposed SQLite implementations live in `repository.sqlite` (PD-06).
Nothing here exposes JDBC, SQL, or Swing types to `service`, so a storage change stays inside the
implementations. Repositories store and find data; business rules stay in `domain` and `service`.
Unexpected failures raise `DataAccessException`.

## TransactionManager

| Operation | Behavior | Requirements |
|-----------|----------|--------------|
| `inTransaction(work)` | Runs the work and commits on normal return. Rolls back on any exception and rethrows it. Nested calls join the outer transaction | NFR-005, FR-024, FR-029 |

A committed transaction must survive an unexpected exit; an uncommitted one must leave no trace.

## UserRepository

| Operation | Behavior | FR/NFR |
|-----------|----------|--------|
| `insert(user)` | Saves a user. A duplicate `usernameKey` raises `DuplicateKeyException`, which `AccountService` maps to a field error | FR-001 |
| `findById(id)` | Optional User | FR-003 |
| `findByUsernameKey(key)` | Optional User | FR-001, FR-002, FR-006 |
| `updateLoginState(id, failedCount, lockedUntil)` | Saves lockout fields | NFR-002 |
| `findSummaries(ids)` | Names for display | FR-028 |

## GroupRepository

Groups and their memberships.

| Operation | Behavior | FR |
|-----------|----------|----|
| `insert(group, adminMembership)` | Saves the group and first member | FR-005 |
| `findById(id)` | Optional Group | FR-008 |
| `updateName(id, name)` | Renames | FR-008 |
| `findCurrentMembership(groupId, userId)` | Optional Membership | FR-003, FR-006 |
| `hadMembership(groupId, userId)` | True if ever a member. Supports NC-3 | FR-003 |
| `findCurrentMembers(groupId)` | Current members | FR-008, FR-017 |
| `findGroupsForUser(userId)` | Groups with a current membership | FR-008 |
| `addMembership(membership)` | Adds a row. Violating the one-current-membership rule raises `DuplicateKeyException` | FR-006 |
| `endMembership(groupId, userId, leftAt)` | Sets `leftAt`; never deletes history | FR-006, FR-007 |

## ExpenseRepository

Expenses and their ordered shares.

| Operation | Behavior | FR |
|-----------|----------|----|
| `insert(expense)` | Saves the expense and its shares in order | FR-010, FR-012 |
| `findById(id)` | Optional Expense with shares in saved order | FR-012, FR-024 |
| `findByGroup(groupId, optionalStatus)` | Summaries | FR-003 |
| `replaceIfPending(expense, expectedVersion)` | Conditional: replaces the fields and shares only if still Pending at that version. Returns false otherwise | FR-016 |
| `deleteIfPending(id, expectedVersion)` | Conditional, with the same rule. The receipt is removed too, and notification links are cleared | FR-016 |
| `decideIfPending(id, expectedVersion, status)` | Conditional status update. **Returns false if already decided or stale**, which gives the "first decision wins" rule | FR-021, FR-024 |
| `findApprovedByGroup(groupId)` | **Approved only**, with shares; input to `BalanceLedger` | FR-020, FR-026, FR-027, SC-005 |
| `findAwaitingDecisionBy(userId)` | Pending expenses where the user is a participant and not the creator | FR-021 |
| `findForReport(userId, criteria)` | Expenses involving the user that match the filters, all statuses | FR-034, FR-035 |

## ReceiptRepository

| Operation | Behavior | FR |
|-----------|----------|----|
| `save(expenseId, receipt)` | Adds or replaces the single receipt | FR-014, FR-016 |
| `find(expenseId)` | Optional receipt, with bytes | FR-014 |

Separate from `ExpenseRepository`, so expense lists do not load images (NFR-004).

## ApprovalDecisionRepository

| Operation | Behavior | FR/NFR |
|-----------|----------|--------|
| `insert(decision)` | Saves it. A second decision for an expense raises `DuplicateKeyException` | FR-024, NFR-006 |
| `findByExpense(expenseId)` | Optional decision | FR-024 |

**There are deliberately no update or delete operations.**

## PaymentRepository

| Operation | Behavior | FR/NFR |
|-----------|----------|--------|
| `insert(payment)` | Saves it | FR-030, FR-031 |
| `findByGroup(groupId)` | Input to `BalanceLedger` | FR-027 |
| `findForUser(userId, optionalGroupId)` | As payer or recipient, for history | FR-033 |
| `findForReport(userId, criteria)` | Matching payments involving the user | FR-034, FR-035 |

**There are deliberately no update or delete operations** (NFR-006).

## NotificationRepository

| Operation | Behavior | FR |
|-----------|----------|----|
| `insertAll(notifications)` | Saves them in the caller's transaction | FR-017, FR-023 |
| `findByRecipient(userId)` | Newest first | FR-019 |
| `countUnread(userId)` | Count | FR-019 |
| `markRead(id, recipientId, readAt)` | Marks read only if it belongs to the recipient. Returns false otherwise | FR-019 |

## Implementation expectations (proposed for SQLite)

- Foreign keys turned on for each connection, with `synchronous=FULL` (NFR-005).
- One connection used by the single background thread (research R-03, R-12).
- A short busy timeout, in case a second copy of the application is writing.
- Money and percentages stored as integers; never SQLite `REAL` (Principle IV, R-11).
- The schema is created on first run. How later schema changes are handled is left to implementation
  and is not part of the MVP scope.

## Test doubles

Each interface gets an in-memory fake for service tests, and `TransactionManager`'s fake runs the work
directly (research R-22). Fakes must honor the same conditional and duplicate behavior. SQLite
implementations are tested separately against a temporary database file.
