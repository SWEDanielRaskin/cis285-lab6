# Repository Contracts (`service` → `repository`)

**Status**: Draft — Reconciliation Incomplete. Interfaces live in `repository`, and implementations in `repository.sqlite` (DEC-05). No operation exposes SQL, JDBC, or SQLite types.

**Conventions:**

- Every operation runs in the current `TransactionRunner` scope; calling one outside a scope is a defect.
- Absent optional results return `Optional.empty`.
- Errors: `RepositoryException` and `DuplicateKeyException` are unchecked. Services translate them to `ValidationException`, `ConflictException`, or `PersistenceFailureException`.
- Authorization: none here. Repositories check data integrity only. Conditional operations are concurrency safeguards, not business rules.
- Side effects: only those listed.

## TransactionRunner

| Operation | Contract | Requirements |
|---|---|---|
| `inTransaction(work)` | Runs `work` atomically and returns its result. Commits on return and rolls back on any exception. A nested call joins the outer transaction. A committed transaction survives process exit; an uncommitted one leaves no trace | FR-040, NFR-005 |
| `readOnly(work)` | One consistent read scope | FR-037 |

## UserRepository

| Operation | Input | Output | Errors and notes | Requirements |
|---|---|---|---|---|
| `insert` | `User` | none | `DuplicateKeyException` on `usernameKey` | FR-001 |
| `findByUsernameKey` | key | `Optional<User>` | | FR-001, FR-002, FR-006 |
| `findById` | `UserId` | `Optional<User>` | | FR-003 |
| `findSummaries` | `Set<UserId>` | `Map<UserId, UserSummary>` | Bulk display names | FR-028 |
| `updateLoginState` | `UserId`, count, `lockedUntil` | none | The only mutable user fields in the MVP | NFR-002 |

## GroupRepository

| Operation | Input | Output | Notes | Requirements |
|---|---|---|---|---|
| `insert` | `Group` | none | | FR-005 |
| `findById` | `GroupId` | `Optional<Group>` | | FR-008 |
| `findByIds` | `Set<GroupId>` | `List<Group>` | | FR-008 |
| `updateNameAndAdmin` | `Group` | none | | FR-008, BR-23 |

## MembershipRepository

| Operation | Input | Output | Errors and notes | Requirements |
|---|---|---|---|---|
| `insert` | `Membership` | none | `DuplicateKeyException` on a second active row | FR-005, FR-006 |
| `findActive` | `GroupId`, `UserId` | `Optional<Membership>` | | FR-003 |
| `listActiveMembers` | `GroupId` | `List<Membership>` by `joinedAt`, then user ID | Notification audience; succession order | FR-008, FR-017, BR-23 |
| `activeGroupIds` | `UserId` | `Set<GroupId>` | | FR-003 |
| `everGroupIds` | `UserId` | `Set<GroupId>` | Former-member scope | FR-034, DEC-07 |
| `areActiveMembers` | `GroupId`, `Set<UserId>` | `Set<UserId>` (those active) | | FR-010, FR-030 |
| `end` | `MembershipId`, `leftAt`, `endedBy` | none | The row is retained forever | FR-006 |
| `listCoMembers` | `UserId` | `Set<UserId>` | People who are or were in a shared group; for report filters | FR-035 |

## ExpenseRepository

| Operation | Input | Output | Notes | Requirements |
|---|---|---|---|---|
| `insert` | `Expense` with shares | none | Atomic with shares | FR-010, FR-012 |
| `findById` | `ExpenseId` | `Optional<Expense>` | Shares in position order; no receipt bytes | FR-012 |
| `updateIfVersionMatches` | `Expense`, `expectedVersion` | boolean | Conditional on `PENDING` and version; replaces shares | FR-016 |
| `deleteIfPending` | `ExpenseId`, `expectedVersion` | boolean | Conditional. Shares and receipt cascade; notification links clear | FR-016 |
| `updateStatusIfPending` | `ExpenseId`, `expectedVersion`, new status, `now` | boolean | **False means another decision or an edit won** | FR-021, FR-024 |
| `listByGroup` | `GroupId`, `statuses?` | `List<ExpenseSummaryRow>` | No share or receipt content | FR-008 |
| `listPendingAwaiting` | `UserId` | `List<ExpenseSummaryRow>` | Non-creator participant, Pending, active member | FR-021 |
| `findPendingInvolving` | `GroupId`, `UserId` | `List<ExpenseSummaryRow>` | Creator, payer, or participant; for the exit guard | FR-007 |
| `findForReport` | `UserId`, `ReportFilter`, `VisibilityScope` | `List<ReportExpenseRow>` | Filter pushed down to the query; all statuses | FR-034, FR-035 |

**There is deliberately no unconditional update or delete.** No operation can change an Approved or Rejected expense (FR-016, FR-024).

## ReceiptRepository

| Operation | Input | Output | Notes | Requirements |
|---|---|---|---|---|
| `put` | `ExpenseId`, `Receipt`, `uploadedAt` | none | Adds or replaces the one receipt | FR-014, FR-016 |
| `find` | `ExpenseId` | `Optional<Receipt>` | Loads bytes | FR-014 |
| `exists` | `ExpenseId` | boolean | No bytes | FR-014 |
| `delete` | `ExpenseId` | none | Reachable only through a Pending edit | FR-016 |

## ApprovalDecisionRepository: append-only

| Operation | Input | Output | Errors and notes | Requirements |
|---|---|---|---|---|
| `insert` | `ApprovalDecision` | none | `DuplicateKeyException` on a second decision | FR-024 |
| `findByExpense` | `ExpenseId` | `Optional<ApprovalDecision>` | | FR-024 |

**No update or delete exists** (NFR-006).

## PaymentRepository: append-only

| Operation | Input | Output | Notes | Requirements |
|---|---|---|---|---|
| `insert` | `Payment` | none | | FR-030 |
| `listForUser` | `UserId`, `GroupId?` | `List<Payment>` | As payer or recipient, newest first | FR-033 |
| `findForReport` | `UserId`, `ReportFilter`, `VisibilityScope` | `List<Payment>` | | FR-034, FR-035 |

**No update or delete exists** (NFR-006).

## NotificationRepository

| Operation | Input | Output | Notes | Requirements |
|---|---|---|---|---|
| `insertAll` | `List<Notification>` | none | In the caller's transaction | FR-017, FR-023 |
| `findCreatedForRecipient` | `ExpenseId`, `UserId` | `Optional<Notification>` | For `expenseEdited` | BR-18 |
| `resetToUnread` | `NotificationId` | none | Only for DEC-16 | BR-18 |
| `countUnread` | `UserId`, `VisibilityScope` | int | | FR-019 |
| `listForRecipient` | `UserId`, `VisibilityScope` | `List<NotificationRow>` newest first | Each row states whether the expense is Pending and the user is a non-creator participant | FR-017, FR-019 |
| `markRead` | `UserId`, `Set<NotificationId>`, `now` | none | Restricted to the recipient's own rows | FR-019 |

## LedgerQueryRepository: read-only

Returns only `LedgerEntry` projections. **Implementations select Approved expenses and all payments, and exclude payer shares and zero shares.**

| Operation | Input | Output | Requirements |
|---|---|---|---|
| `entriesForGroups` | `Set<GroupId>` | `List<LedgerEntry>` | FR-026, FR-027 |
| `entriesForPair` | `GroupId`, `UserId`, `UserId` | `List<LedgerEntry>` | FR-032 |
| `entriesInvolving` | `GroupId`, `UserId` | `List<LedgerEntry>` | FR-007 |
| `entriesForUser` | `UserId`, `VisibilityScope` | `List<LedgerEntry>` | FR-037 |

The ledger rule is written in `Expense.ledgerEntries` and `Payment.ledgerEntry`, and repeated as a query for efficiency. **That duplication is a real risk (RISK-10).** Test RP-06 asserts both give identical results on the same data.

## Implementation expectations

- Per connection: `foreign_keys=ON`, `synchronous=FULL`, `journal_mode=DELETE`, `locking_mode=EXCLUSIVE`.
- One connection, used by the single background thread.
- If the exclusive lock cannot be obtained at startup, `AppConfig` shows the second-instance message and exits (DEC-03).
- Money and percentages are integers. SQLite `REAL` is never used (Principle IV).
- Schema details and migrations are in [data-model.md §5](../data-model.md#5-persistence-model-sqlite-proposed).

## Test doubles

Each interface gets a hand-written in-memory fake for service tests, and `TransactionRunner`'s fake runs the work directly. Fakes must honor the same conditional and duplicate behavior. SQLite implementations are tested separately against a temporary file.
