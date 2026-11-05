# Data Model: SplitSmart Expense Sharing

**Status**: Draft — Reconciliation Incomplete. **Date**: 2026-11-05
**Diagram**: [domain-class.puml](../../docs/uml/domain-class.puml) | **Requirements**: [spec.md](spec.md) | **Decisions**: [decision-log.md](decisions/decision-log.md)

§1 to §4 are the conceptual domain model. §5 is the persistence model, a design under [DEC-05](decisions/decision-log.md#dec-05-storage-engine). **No schema has been created or run.**

## 1. Overview

| Concept | Kind | Persisted? | Requirements |
|---|---|---|---|
| `User` | Entity | Yes | FR-001, FR-002, FR-004, NFR-002 |
| `Group` | Entity | Yes | FR-005, FR-006, FR-008, FR-009 (status reserved) |
| `Membership` | Entity | Yes | FR-005 to FR-007, FR-017, FR-030 |
| `Expense` | Aggregate root | Yes | FR-010, FR-016, FR-020 to FR-024 |
| `Share` | Value object in `Expense` | Yes | FR-010 to FR-013, FR-026 |
| `Receipt` | Value object, stored separately | Yes | FR-014 |
| `ApprovalDecision` | Entity, immutable | Yes | FR-021 to FR-024, NFR-006 |
| `Payment` | Entity, immutable | Yes | FR-030 to FR-033, NFR-006 |
| `Notification` | Entity | Yes | FR-017, FR-019, FR-023 |
| `Money`, `Percentage`, `Username`, `PasswordHash`, typed IDs | Value objects | As column values | NFR-001, FR-001, FR-004, NFR-009 |
| `LedgerEntry`, `PairBalance`, `BalanceSheet` | Derived | **No** | FR-026 to FR-029 |
| `Report` and its lines | Derived | **No** | FR-034 to FR-037 |

## 2. Shared invariants

| ID | Invariant | Source |
|---|---|---|
| INV-M1 | Every monetary value is a `Money` wrapping `BigDecimal` at scale 2. `float` and `double` never hold money, including in tests and `ui` | Principle IV |
| INV-M2 | `BigDecimal` for money is built from `String` or integers only. Equality uses `compareTo` | Principle IV |
| INV-M3 | Entered amounts are 0.01–1,000,000.00 with at most 2 decimals. Excess decimals are refused, never rounded | BR-27 |
| INV-M4 | Rounding modes appear only inside `Money`: `FLOOR` for allocation and `HALF_EVEN` for other normalization | DEC-06 |
| INV-M5 | `Money` may be negative internally for signed nets. The UI shows direction in words | DEC-24 |
| INV-D1 | Expense and payment dates are `LocalDate`, today or earlier by the injected `Clock` in the system zone | BR-30 |
| INV-D2 | Event times are UTC `Instant`s from the injected `Clock` | NFR-006 |
| INV-I1 | Identifiers are UUIDs in typed wrappers, created by the application | NFR-009 |
| INV-A1 | `ApprovalDecision` and `Payment` are insert-only and record actor and time | NFR-006 |
| INV-B1 | Only `APPROVED` expenses and recorded payments produce ledger entries | BR-08 |
| INV-EXIT-1 | A former member's pair balances in that group stay $0.00 until they rejoin | DEC-08 |
| INV-EXIT-2 | Everyone referenced by a Pending expense is an active member | DEC-09 |

## 3. Entities

### User

| Attribute | Type | Null? | Rule | Requirement |
|---|---|---|---|---|
| `id` | `UserId` | No | Immutable | NFR-009 |
| `username` | `Username` | No | 3–30 characters after trim; stored as typed | FR-001 |
| `usernameKey` | derived from `username` | No | Lowercase in `Locale.ROOT`; **unique** | FR-001 |
| `displayName` | String | No | 1–50 characters after trim (team-added) | FR-001, DEC-24 |
| `passwordHash` | `PasswordHash` | No | Algorithm, iterations, salt, hash. `toString` exposes nothing | FR-004 |
| `failedLoginCount` | int | No | 0–5 | NFR-002 |
| `lockedUntil` | `Instant` | Yes | Set at the 5th failure | NFR-002 |
| `createdAt` | `Instant` | No | Immutable | Support |

Behavior: `isLockedAt(now)` is true while `now < lockedUntil`. `recordFailedLogin(now)` restarts from 0 if an earlier lock has expired, then increments, and locks at 5. `recordSuccessfulLogin()` clears both fields. See [authentication-state.puml](../../docs/uml/authentication-state.puml). There is no account deletion in the MVP, so user references stay valid.

### Group

| Attribute | Type | Null? | Rule | Requirement |
|---|---|---|---|---|
| `id` | `GroupId` | No | Immutable | NFR-009 |
| `name` | String | No | 1–50 characters; need not be unique | FR-005, FR-008 |
| `adminId` | `UserId` | No | The one admin. An active member whenever the group has an active member | FR-005, FR-006, DEC-10 |
| `status` | `GroupStatus` | No | Always `ACTIVE` in the MVP. `ARCHIVED` is reserved for FR-009 and never written | FR-009 |
| `createdAt` | `Instant` | No | Immutable | Support |

Behavior: `rename(name)`, `assignAdmin(userId)`. A group with no active members has no status of its own; this is derived from memberships (DEC-10).

### Membership

| Attribute | Type | Null? | Rule | Requirement |
|---|---|---|---|---|
| `id` | `MembershipId` | No | Immutable | NFR-009 |
| `groupId`, `userId` | IDs | No | **At most one active row per pair** | FR-005, FR-006 |
| `joinedAt` | `Instant` | No | Orders admin succession | FR-006, DEC-10 |
| `addedBy` | `UserId` | No | The user themself for the founder | FR-006 |
| `leftAt` | `Instant` | Yes | Null means active; not before `joinedAt` | FR-006 |
| `endedBy` | `UserId` | Yes | Equal to `userId` means left; otherwise removed by that admin | FR-006 |

Rows are never deleted. Rejoining adds a row (DEC-11). See [membership-state.puml](../../docs/uml/membership-state.puml).

### Expense

| Attribute | Type | Null? | Rule | Requirement |
|---|---|---|---|---|
| `id` | `ExpenseId` | No | Immutable | NFR-009 |
| `groupId` | `GroupId` | No | Immutable | FR-010, BR-11 |
| `creatorId` | `UserId` | No | Immutable; an active member at creation | FR-010 |
| `payerId` | `UserId` | No | Active member at save; defaults to creator | BR-01 |
| `amount` | `Money` | No | INV-M3 | FR-010 |
| `date` | `LocalDate` | No | INV-D1 | FR-010 |
| `description` | String | No | 1–200 characters | FR-010 |
| `splitMethod` | `SplitMethod` | No | `EQUAL` or `PERCENTAGE` | FR-010 |
| `status` | `ExpenseStatus` | No | Starts `PENDING` | FR-020 |
| `shares` | ordered `List<Share>` | No | At least 1 | FR-012 |
| `version` | int | No | Starts at 1; +1 per edit | FR-016, DEC-04 |
| `createdAt`, `updatedAt` | `Instant` | No | Shown on detail; support audit | Support |

Invariants: E1 shares total exactly `amount` (FR-012). E2 at least one participant is not the creator (BR-03). E3 participants are distinct (BR-02). E4 percentage splits total exactly 100.00 (BR-05). E5 status changes once, from Pending only (BR-10).

Behavior: `create(...)`, `revise(actor, ...)`, `isEligibleApprover(userId)`, `approve(approver, reason, now)`, `reject(approver, reason, now)`, `isInvolved(userId)`, `ledgerEntries()` (empty unless Approved). See [expense-state.puml](../../docs/uml/expense-state.puml).

### Share

| Attribute | Type | Null? | Rule | Requirement |
|---|---|---|---|---|
| `position` | int | No | 0-based listed order; unique per expense | FR-012 |
| `participantId` | `UserId` | No | Unique per expense | BR-02 |
| `percentage` | `Percentage` | Yes | Required for `PERCENTAGE`, absent for `EQUAL` | FR-013 |
| `amount` | `Money` | No | At least 0.00; computed by `SplitAllocator`; never entered | FR-011 to FR-013 |

Share amounts are persisted as the snapshot of a deterministic calculation. Recomputing from amount, method, percentages, and order must give the same values (RP-08).

### Receipt

| Attribute | Type | Null? | Rule | Requirement |
|---|---|---|---|---|
| `mediaType` | `ReceiptMediaType` | No | `JPEG` or `PNG`, by file content | FR-014 |
| `sizeBytes` | long | No | 1 to 5,242,880 | FR-014, DEC-25 |
| `content` | bytes | No | Loaded only for viewing | FR-014 |
| `uploadedAt` | `Instant` | No | Support | Support |

At most one per expense. The uploader is always the creator, so no separate field exists.

### ApprovalDecision (immutable)

| Attribute | Type | Null? | Rule | Requirement |
|---|---|---|---|---|
| `id` | `DecisionId` | No | | NFR-009 |
| `expenseId` | `ExpenseId` | No | **Unique** in the MVP | FR-021, FR-024 |
| `approverId` | `UserId` | No | Eligible approver at decision time | FR-021 |
| `outcome` | `DecisionOutcome` | No | `APPROVED` or `REJECTED` | FR-024 |
| `reason` | String | Yes | Required for `REJECTED`, 1–200 characters; optional for `APPROVED`, up to 200 | FR-023, FR-024 |
| `decidedAt` | `Instant` | No | From `Clock` | NFR-006 |

### Payment (immutable)

| Attribute | Type | Null? | Rule | Requirement |
|---|---|---|---|---|
| `id` | `PaymentId` | No | | NFR-009 |
| `groupId` | `GroupId` | No | Both parties are active members when recording | FR-030 |
| `payerId` | `UserId` | No | Always the recording user | BR-14 |
| `recipientId` | `UserId` | No | Differs from payer | BR-14 |
| `amount` | `Money` | No | INV-M3 | FR-030, DEC-20 |
| `date` | `LocalDate` | No | INV-D1 | FR-030 |
| `note` | String | Yes | Up to 200 characters | FR-030 |
| `recordedAt` | `Instant` | No | Audit actor is `payerId` | NFR-006 |
| `overpaymentConfirmed` | boolean | No | True when the FR-032 warning was confirmed | FR-032 |

**A payment has no lifecycle states.** It takes effect when saved (FR-031), so no state diagram applies.

### Notification

| Attribute | Type | Null? | Rule | Requirement |
|---|---|---|---|---|
| `id` | `NotificationId` | No | | NFR-009 |
| `recipientId` | `UserId` | No | | FR-017, FR-023 |
| `type` | `NotificationType` | No | `EXPENSE_CREATED`, `EXPENSE_APPROVED`, `EXPENSE_REJECTED` | FR-017, FR-023 |
| `groupId` | `GroupId` | No | Visibility scope | FR-003 |
| `expenseId` | `ExpenseId` | Yes | Cleared when a Pending expense is deleted | DEC-16 |
| `message` | String | No | Saved text as created. Created type states creator, group, description, amount, date. Decision types include the reason, if any | FR-017, FR-023 |
| `createdAt` | `Instant` | No | Newest first | FR-019 |
| `readAt` | `Instant` | Yes | Null means unread. Can reset to null only under DEC-16 | FR-019 |

At most one row per recipient, expense, and type while `expenseId` is present. **"Needs your approval" is not stored.** It is true when the type is `EXPENSE_CREATED`, the linked expense is `PENDING`, and the recipient is a participant other than the creator.

## 4. Derived models

| Value | Definition | Requirement |
|---|---|---|
| `LedgerEntry(groupId, debtorId, creditorId, amount, date)` | **Approved expense:** one per share where participant ≠ payer and amount > 0; debtor = participant, creditor = payer, date = expense date. **Payment:** debtor = recipient, creditor = payer, date = payment date | FR-026, FR-027, FR-031 |
| `PairBalance(groupId, UserPair(lowId, highId), net)` | Sum of entries where low owes high, minus those where high owes low. Positive means low owes high | FR-027 |
| `BalanceSheet.owedBy(debtor, creditor, group)` | That pair's net in the debtor's direction, or 0 if negative | FR-032 |
| `BalanceSheet.overall(a, b)` | Sum of per-group nets for the pair | FR-027 |
| `BalanceSheet.nonZeroPairsFor(user, group)` | Pairs that block exit | FR-007 |
| `BalanceSheet.memberNet(user, group)` | Signed total, for display | FR-028 |
| Unread count, "needs your approval," visibility scope | Computed on read | FR-017, FR-019, NFR-003 |

A payment entry names the recipient as debtor because a payment reduces what the payer owes and an excess reverses the direction. Example: sam owes alex $30.00 and pays $40.00. Entries are sam→alex 30.00 and alex→sam 40.00, so alex owes sam $10.00.

**Balance invariants:** B1 Pending and Rejected produce no entries. B2 A payer's own share produces no entry. B3 Each pair has one signed net per group, so total owed equals total due (FR-029). B4 Overall equals the sum of per-group nets. B5 Recomputing from the same records gives the same result.

**How derived balances reconcile.** No balance is ever persisted, so no consistency strategy is needed. `LedgerQueryRepository` selects the same set `Expense.ledgerEntries()` and `Payment.ledgerEntry()` produce, and RP-06 asserts the two agree.

### Report

| Type | Fields |
|---|---|
| `ReportFilter` | `from?`, `to?` (inclusive), `groupId?`, `otherUserId?`, `statuses?` |
| `ReportExpenseLine` | expenseId, group, date, description, payer, status, amount, user's share |
| `ReportPaymentLine` | paymentId, group, date, payer, recipient, amount, note |
| `ReportTotals` | `totalExpenseAmount`, `userShareTotal`, `totalPaidByUser`, `totalReceivedByUser` |
| `StatusMemoLine` | status, count, amount; labeled "Not included in totals" |
| `CounterpartyNetLine` | otherUser, `opening`, `period`, `later`, `current` |
| `Report` | filter, generatedAt, expense lines, payment lines, totals, memo, counterparty lines |

Rules: BR-19, BR-20, BR-21. Invariants: R1 `opening + period + later = current` on every line. R2 `current` equals `BalanceService` for the same group scope. R3 Pending and Rejected amounts never appear in `ReportTotals` or `CounterpartyNetLine`.

Counterparty lines use only ledger entries in which the viewer is a party, so they cannot leak another member's activity to a former member.

## 5. Persistence model (SQLite, proposed)

**Conventions:** all tables `STRICT`. IDs `TEXT` (UUID). Instants `TEXT` (UTC ISO-8601). Dates `TEXT` (`yyyy-MM-dd`). Money `INTEGER` cents. Percentages `INTEGER` hundredths. Booleans `INTEGER` 0 or 1. Foreign keys are `RESTRICT` unless stated.

| Table | Key | Columns | Foreign keys | Constraints |
|---|---|---|---|---|
| `app_user` | `id` | `username`, `username_key`, `display_name`, `password_hash` (BLOB), `password_salt` (BLOB), `password_algorithm`, `password_iterations`, `failed_login_count`, `locked_until`?, `created_at` | | **UNIQUE** `username_key`; CHECK count 0–5 |
| `expense_group` | `id` | `name`, `admin_user_id`, `status`, `created_at` | `admin_user_id` → `app_user` | CHECK status in (`ACTIVE`, `ARCHIVED`) |
| `membership` | `id` | `group_id`, `user_id`, `joined_at`, `added_by`, `left_at`?, `ended_by`? | → `expense_group`, → `app_user` | **UNIQUE INDEX** `(group_id, user_id) WHERE left_at IS NULL`; CHECK `left_at >= joined_at` |
| `expense` | `id` | `group_id`, `creator_id`, `payer_id`, `amount_cents`, `expense_date`, `description`, `split_method`, `status`, `version`, `created_at`, `updated_at` | → `expense_group`, → `app_user` | CHECK `amount_cents BETWEEN 1 AND 100000000`; CHECK enums |
| `expense_share` | `(expense_id, position)` | `participant_id`, `percent_hundredths`?, `amount_cents` | `expense_id` → `expense` **CASCADE**; → `app_user` | **UNIQUE** `(expense_id, participant_id)`; CHECK `amount_cents >= 0`; CHECK percent 0–10000 |
| `expense_receipt` | `expense_id` | `media_type`, `size_bytes`, `content` (BLOB), `uploaded_at` | `expense_id` → `expense` **CASCADE** | CHECK `size_bytes BETWEEN 1 AND 5242880` |
| `approval_decision` | `id` | `expense_id`, `approver_id`, `outcome`, `reason`?, `decided_at` | → `expense`, → `app_user` | **UNIQUE** `expense_id`; CHECK `outcome <> 'REJECTED' OR reason IS NOT NULL` |
| `payment` | `id` | `group_id`, `payer_id`, `recipient_id`, `amount_cents`, `payment_date`, `note`?, `recorded_at`, `overpayment_confirmed` | → `expense_group`, → `app_user` | CHECK `amount_cents BETWEEN 1 AND 100000000`; CHECK `payer_id <> recipient_id` |
| `notification` | `id` | `recipient_id`, `type`, `group_id`, `expense_id`?, `message`, `created_at`, `read_at`? | `expense_id` → `expense` **SET NULL**; others restrict | **UNIQUE INDEX** `(recipient_id, expense_id, type) WHERE expense_id IS NOT NULL` |

`?` marks a nullable column.

**Triggers (defense in depth, NFR-006, FR-016):** Refuse `UPDATE` and `DELETE` on `approval_decision` and `payment`. Refuse `UPDATE` and `DELETE` on `expense` when `OLD.status <> 'PENDING'`.

**Rules checked in Java, not SQL:** shares total the amount; percentages total 100.00; at least one non-creator participant; dates not in the future (a database clock would disagree with the injected `Clock`); membership-dependent rules.

**Deletion and retention:** Only a Pending expense can be deleted. Shares and receipt cascade, and notification links become null. Users, groups, memberships, decisions, and payments are never deleted in the MVP. Nothing expires. Former members keep history.

**Ordering guarantees:** Shares by `position`. Notifications by `created_at` descending, then `id`. Payment history and report lines by date descending, then `id`. Members by `joined_at`, then `user_id`, which is also the succession order.

**Indexes for NFR-004 (effect unmeasured):**

| Index | Serves |
|---|---|
| `membership (user_id, left_at)` | "My groups," access checks |
| `membership (group_id, left_at)` | Member lists, notification audience, succession |
| `expense (group_id, status, expense_date)` | Ledger queries, group lists, report filters |
| `expense (creator_id)`, `expense (payer_id)` | Reports, exit guard |
| `expense_share (participant_id, expense_id)` | Pending approvals, reports, exit guard |
| `payment (group_id, payment_date)` | Ledger queries, report filters |
| `payment (payer_id)`, `payment (recipient_id)` | Payment history |
| `notification (recipient_id, read_at, created_at)` | Unread count, newest-first list |

**Migration and versioning:** `PRAGMA user_version` holds the schema version. At startup `repository.sqlite` applies ordered migration scripts inside one transaction, starting from version 0 for a new file, which gives schema version 1. A file with a newer version than the application understands is refused with a message. Users back up by copying the data folder while the application is closed; no automatic backup exists.

## 6. Domain-to-table mapping

| Domain concept | Table | Note |
|---|---|---|
| `User`, `Username`, `PasswordHash` | `app_user` | Flattened value objects |
| `Group` | `expense_group` | `group` is an SQL keyword |
| `Membership` | `membership` | |
| `Expense` | `expense`, `expense_share` | One aggregate; saved together |
| `Share` | `expense_share` | |
| `Receipt` | `expense_receipt` | Separate so that lists never load bytes |
| `ApprovalDecision` | `approval_decision` | |
| `Payment` | `payment` | |
| `Notification` | `notification` | |
| `Money` | `*_cents` | `Money.ofCents` and `toCents` at the boundary |
| `Percentage` | `percent_hundredths` | |
| `LedgerEntry`, `Report` | none | Query projections and calculated values |

Row mappers rebuild entities through a `rehydrate` factory. It rechecks structural invariants but not creation-time rules such as "date not in the future" or "payer is active," which can legitimately differ on later reads.

## 7. Data dictionary notes

Every persisted field above carries its requirement in the entity tables. Fields marked "Support" (`createdAt`, `updatedAt`, `uploadedAt`) have no direct FR. They are retained for ordering and diagnosis, and a reviewer may drop them. Fields proposed by the AI sets and **not** retained: `Group.updatedAt`, `Receipt.sha256`, `Receipt.originalFileName`, `Receipt.uploadedBy`, `Notification.decisionId`, and structured notification snapshot columns.

FR-009, FR-018, FR-025, FR-038, and FR-039 are not modeled, beyond the reserved `ARCHIVED` value.
