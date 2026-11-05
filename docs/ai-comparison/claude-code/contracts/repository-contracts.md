# Repository Contracts

**Status:** AI-generated draft, not reviewed. Interfaces live in `repository`, and implementations in `repository.jdbc` (AD-01, AD-07). No operation exposes SQL, JDBC, or H2 types.

**Conventions:**
- All operations run in the current `TransactionRunner` transaction.
- Absent optional results return `Optional.empty`.
- `DuplicateKeyException` and `RepositoryException` are unchecked. Services translate them to `ValidationException`, `ConflictException`, or `PersistenceFailureException`.
- Repositories check data integrity only. **Authorization and business rules belong to services and domain objects.** The conditional operations below are concurrency safeguards.

## TransactionRunner

| Operation | Contract | FR |
|---|---|---|
| `inTransaction(work)` | Runs `work` atomically and returns its result; commits on return and rolls back on any exception. A nested call joins the outer transaction. | FR-040, NFR-005 |
| `readOnly(work)` | Single consistent read scope | FR-037 |

## UserRepository

| Operation | Input | Output | Notes | FR |
|---|---|---|---|---|
| `insert` | `User` | none | `DuplicateKeyException` on username key | FR-001 |
| `findByUsernameKey` | key | `Optional<User>` | Case-insensitive through the normalized key | FR-001, FR-002 |
| `findById` | `UserId` | `Optional<User>` | | FR-003 |
| `findSummaries` | `Set<UserId>` | `Map<UserId, UserSummary>` | Bulk display names | FR-028 |
| `updateLoginState` | `UserId`, count, `lockedUntil` | none | Only these fields are mutable in the MVP | NFR-002 |

## GroupRepository

| Operation | Input | Output | FR |
|---|---|---|---|
| `insert` | `Group` | none | FR-005 |
| `findById` | `GroupId` | `Optional<Group>` | FR-008 |
| `findByIds` | `Set<GroupId>` | `List<Group>` | FR-008 |
| `updateNameAndAdmin` | `Group` | none | FR-008; AD-16 |

## MembershipRepository

| Operation | Input | Output | Notes | FR |
|---|---|---|---|---|
| `insert` | `Membership` | none | `DuplicateKeyException` on a second active row | FR-005, FR-006 |
| `findActive` | `GroupId`, `UserId` | `Optional<Membership>` | | FR-003 |
| `listActiveMembers` | `GroupId` | `List<Membership>` ordered by `joinedAt`, then user ID | Notification audience; AD-16 succession | FR-008, FR-017 |
| `activeGroupIds` | `UserId` | `Set<GroupId>` | | FR-003 |
| `everGroupIds` | `UserId` | `Set<GroupId>` | AD-17 scope | FR-034 |
| `areActiveMembers` | `GroupId`, `Set<UserId>` | `Set<UserId>` (those active) | | FR-010, FR-030 |
| `end` | `MembershipId`, `leftAt`, `endedBy` | none | Row retained forever | FR-006 |
| `listCoMembers` | `UserId` | `Set<UserId>` | People who are or were in a shared group | FR-035 |

## ExpenseRepository

| Operation | Input | Output | Notes | FR |
|---|---|---|---|---|
| `insert` | `Expense` with shares | none | Atomic with shares | FR-010, FR-012 |
| `findById` | `ExpenseId` | `Optional<Expense>` | Shares in position order; no receipt bytes | FR-012 |
| `updateIfVersionMatches` | `Expense`, `expectedVersion` | boolean | Conditional on `status = PENDING` and version; replaces shares | FR-016 |
| `deleteIfPending` | `ExpenseId`, `expectedVersion` | boolean | Conditional; cascades shares and receipt; clears notification links | FR-016 |
| `updateStatusIfPending` | `ExpenseId`, `expectedVersion`, new status, `now` | boolean | **False means another decision or an edit won** (AD-10) | FR-021, FR-024 |
| `listByGroup` | `GroupId`, `statuses?` | `List<ExpenseSummaryRow>` | No share or receipt content | FR-008 |
| `listPendingAwaiting` | `UserId` | `List<ExpenseSummaryRow>` | Non-creator participant, Pending | FR-021 |
| `findPendingInvolving` | `GroupId`, `UserId` | `List<ExpenseSummaryRow>` | Creator, payer, or participant; for the exit guard | FR-007 (AD-15) |
| `findForReport` | `UserId`, `ReportFilter`, visible group scope | `List<ReportExpenseRow>` | Filter pushed down to the query | FR-034, FR-035 |

**There is deliberately no unconditional update or delete.** No operation can change an Approved or Rejected expense (FR-016, FR-024).

## ReceiptRepository

| Operation | Input | Output | FR |
|---|---|---|---|
| `put` | `ExpenseId`, `ReceiptImage`, uploader, time | none | FR-014 |
| `find` | `ExpenseId` | `Optional<ReceiptImage>` | FR-014 |
| `exists` | `ExpenseId` | boolean | FR-014 |
| `delete` | `ExpenseId` | none; only reachable through a Pending edit | FR-016 |

## ApprovalDecisionRepository: append-only

| Operation | Input | Output | Notes | FR |
|---|---|---|---|---|
| `insert` | `ApprovalDecision` | none | `DuplicateKeyException` on a second decision (AD-10 backstop) | FR-024 |
| `findByExpense` | `ExpenseId` | `Optional<ApprovalDecision>` | | FR-024 |

**No update or delete operation exists** (NFR-006, AD-11).

## PaymentRepository: append-only

| Operation | Input | Output | Notes | FR |
|---|---|---|---|---|
| `insert` | `Payment` | none | | FR-030 |
| `listForUser` | `UserId`, `GroupId?` | `List<Payment>` | As payer or recipient, newest first | FR-033 |
| `findForReport` | `UserId`, `ReportFilter`, visible group scope | `List<Payment>` | | FR-034, FR-035 |

**No update or delete operation exists** (NFR-006, AD-11).

## NotificationRepository

| Operation | Input | Output | Notes | FR |
|---|---|---|---|---|
| `insertAll` | `List<Notification>` | none | | FR-017, FR-023 |
| `findByExpenseAndType` | `ExpenseId`, type | `List<Notification>` | For revision | FR-017 (AD-14) |
| `updateSnapshots` | `List<Notification>` | none | Only while the expense is Pending | FR-017 (AD-14) |
| `countUnread` | `UserId`, visible scope | int | | FR-019 |
| `listForRecipient` | `UserId`, visible scope | `List<NotificationRow>` newest first | Each row states whether the expense is Pending and the user is a non-creator participant | FR-017, FR-019 |
| `markRead` | `UserId`, `Set<NotificationId>`, `now` | none | Restricted by recipient | FR-019 |

## LedgerQueryRepository: read-only

Returns only `LedgerEntry` projections. **Implementations must select Approved expenses and all payments, and exclude payer shares and zero shares.**

| Operation | Input | Output | FR |
|---|---|---|---|
| `entriesForGroups` | `Set<GroupId>` | `List<LedgerEntry>` | FR-026, FR-027 |
| `entriesForPair` | `GroupId`, `UserId`, `UserId` | `List<LedgerEntry>` | FR-032 |
| `entriesInvolving` | `GroupId`, `UserId` | `List<LedgerEntry>` | FR-007 |

`LedgerReader` passes these to `BalanceCalculator`. The rule for what counts as a ledger entry is written in `Expense.ledgerEntries` and `Payment.ledgerEntry`, and repeated as a query for efficiency. **That duplication is a real risk,** so a planned test must assert the two produce identical results on the same data (V-16).
