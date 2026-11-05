# SplitSmart Data Model

**Status:** AI-generated draft, not reviewed. Requires named human review (Principle VII).

**Conventions.** The conceptual model in §1–§3 comes from the spec's Key Entities. Table and column names in §4 are a **proposal under AD-07**: no source specifies storage, and no schema or migration has been created. "AD" entries are design decisions, not customer requirements. `NEEDS CLARIFICATION` items are listed in [open-questions-and-risks.md](open-questions-and-risks.md).

---

## 1. Entity relationships

```text
User 1 ─── * Membership * ─── 1 Group
User 1 ─── * Expense (as creator)
User 1 ─── * Expense (as payer)
User 1 ─── * Share (as participant)
Group 1 ── * Expense 1 ── 1..* Share (ordered)
Expense 1 ── 0..1 Receipt
Expense 1 ── 0..1 ApprovalDecision  * ── 1 User (approver)
Group 1 ── * Payment; Payment * ── 1 User (payer); * ── 1 User (recipient)
User 1 ── * Notification (recipient); Notification * ── 0..1 Expense
Notification * ── 0..1 ApprovalDecision
```

Balance and Report are derived and have no storage. Diagram: [uml/domain-class.puml](uml/domain-class.puml).

---

## 2. Persisted entities

Every entity has a UUID identifier (AD-23). "Audit" lists fields that record who and when.

### 2.1 User (FR-001, FR-002, FR-004, NFR-002)

| Attribute | Type | Rule | FR |
|---|---|---|---|
| `id` | `UserId` | Immutable | |
| `username` | `Username` | 3–30 characters, stored as typed | FR-001 |
| `usernameKey` | derived from username | Lowercase in `Locale.ROOT`; **unique** | FR-001 |
| `displayName` | String | Required. Length not specified; **proposal 1–50 (DQ-12)** | FR-001 |
| `passwordHash` | `PasswordHash` | Algorithm, iterations, salt, hash; source password ≥ 8 characters; never readable | FR-001, FR-004 |
| `failedLoginCount` | int | 0–5; consecutive failures | NFR-002 |
| `lockedUntil` | `Instant?` | Set at the 5th failure, to now + 5 minutes | NFR-002 |
| `createdAt` | `Instant` | Audit | |

**Lifecycle:** `Unlocked` ⇄ `Locked` (§2.1 of [design.md](design.md#21-user-fr-001-fr-002-fr-004-nfr-002)). There is no account deletion, password reset, or profile edit in the MVP. Accordingly, every user reference remains valid forever.

**Character set for usernames is unspecified** (DQ-12). The proposal trims surrounding spaces and otherwise accepts any characters.

### 2.2 Group (FR-005–FR-009)

| Attribute | Type | Rule | FR |
|---|---|---|---|
| `id` | `GroupId` | | |
| `name` | String | 1–50 characters after trimming; not required to be unique | FR-005, FR-008 |
| `adminId` | `UserId` | Exactly one. Active member whenever any active member exists. May change under AD-16. | FR-005, FR-006 |
| `status` | `GroupStatus` | ACTIVE in the MVP. ARCHIVED reserved for FR-009 and never written in the MVP. | FR-009 |
| `createdAt`, `updatedAt` | `Instant` | Audit | |

### 2.3 Membership (FR-005–FR-007, FR-030)

| Attribute | Type | Rule |
|---|---|---|
| `id` | `MembershipId` | |
| `groupId`, `userId` | ids | FK. **At most one active row per pair.** |
| `joinedAt` | `Instant` | Audit |
| `addedBy` | `UserId` | Audit. The user themself for the founder. |
| `leftAt` | `Instant?` | Null means active; `leftAt ≥ joinedAt` |
| `endedBy` | `UserId?` | Equals `userId` for leaving, or the admin for removal |

**Lifecycle:** `Active` → `Ended`. Terminal per row. A rejoin adds a new row, following spec Q6's default (**unconfirmed**). Rows are never deleted.

**Exit guard:** AD-15, `NEEDS CLARIFICATION` DQ-02 and DQ-03.

### 2.4 Expense (FR-010–FR-016, FR-020)

| Attribute | Type | Rule | FR |
|---|---|---|---|
| `id` | `ExpenseId` | | |
| `groupId` | `GroupId` | FK; immutable | FR-010 |
| `creatorId` | `UserId` | FK; immutable; active member at creation | FR-010 |
| `payerId` | `UserId` | FK; active member at create or edit; defaults to creator; need not be a participant | FR-010 |
| `amount` | `Money` | `0 < amount ≤ 1,000,000.00`, at most 2 decimals | FR-010 |
| `date` | `LocalDate` | Not later than today | FR-010 |
| `description` | String | 1–200 characters | FR-010 |
| `splitMethod` | `SplitMethod` | EQUAL or PERCENTAGE | FR-010 |
| `status` | `ExpenseStatus` | PENDING, APPROVED, or REJECTED | FR-020 |
| `shares` | ordered list of `Share` | At least 1; see §2.5 | FR-010, FR-012 |
| `createdAt`, `updatedAt` | `Instant` | Audit | |
| `version` | int | Starts at 1; incremented by each edit | FR-016 (AD-10) |

**Cross-field invariants:**
- At least one participant is not the creator (edge case).
- Σ share amounts = `amount`, exactly.
- When PERCENTAGE, Σ percentages = 100.00, exactly.

**Lifecycle:**

| From | Event | To | Who | Effect |
|---|---|---|---|---|
| none | create | PENDING | Active member | No balance effect (FR-020) |
| PENDING | edit | PENDING, version + 1 | Creator | Shares recomputed |
| PENDING | delete | removed | Creator | Shares and receipt removed; notifications retained |
| PENDING | approve | APPROVED | Non-creator participant | Enters balances |
| PENDING | reject (reason) | REJECTED | Non-creator participant | Never enters balances |
| APPROVED or REJECTED | anything | **refused** | | FR-016, FR-024 |

### 2.5 Share (FR-011–FR-013, FR-026)

Owned by `Expense`, with no independent lifecycle.

| Attribute | Type | Rule |
|---|---|---|
| `expenseId` | `ExpenseId` | Part of the key |
| `position` | int | 0-based, unique within the expense; **the creator's listed order** (FR-012) |
| `participantId` | `UserId` | Unique within the expense; current group member when set |
| `percentage` | `Percentage?` | Required for PERCENTAGE, absent for EQUAL; 0.00–100.00, at most 2 decimals |
| `amount` | `Money` | ≥ 0.00, final after leftover cents |

A share of $0.00 is valid (Edge case: $0.01 among three). Its participant can still approve, and it produces no ledger entry.

### 2.6 Receipt (FR-014)

| Attribute | Type | Rule |
|---|---|---|
| `expenseId` | `ExpenseId` | Key; at most one per expense |
| `mediaType` | `ReceiptMediaType` | JPEG or PNG, determined by file signature, not by extension |
| `sizeBytes` | long | 1 to 5,242,880 (5 MB read as 5 × 1024², A-07) |
| `sha256` | bytes | Integrity check |
| `content` | bytes | Loaded only when viewing |
| `uploadedBy`, `uploadedAt` | | Audit |

Replaceable or removable only while the expense is Pending and only by the creator (FR-014, FR-016).

### 2.7 Approval Decision (FR-021–FR-024, NFR-006)

Immutable. **No update or delete operation exists.**

| Attribute | Type | Rule |
|---|---|---|
| `id` | `DecisionId` | |
| `expenseId` | `ExpenseId` | FK; **unique** (one decision decides, in the MVP) |
| `approverId` | `UserId` | FK; a non-creator participant at decision time |
| `outcome` | `DecisionOutcome` | APPROVED or REJECTED |
| `reason` | String? | REJECTED: required, 1–200 characters. APPROVED: optional, up to 200 characters |
| `decidedAt` | `Instant` | Audit |

### 2.8 Payment (FR-030–FR-033, NFR-006)

Immutable. **No update or delete operation exists.**

| Attribute | Type | Rule |
|---|---|---|
| `id` | `PaymentId` | |
| `groupId` | `GroupId` | FK; required; both parties are active members when recording |
| `payerId` | `UserId` | FK; always the signed-in user |
| `recipientId` | `UserId` | FK; differs from payer |
| `amount` | `Money` | `> 0`, at most 2 decimals; `≤ 1,000,000.00` from the general edge case (SRC-08) |
| `date` | `LocalDate` | Not later than today |
| `note` | String? | Up to 200 characters |
| `recordedAt` | `Instant` | Audit |
| `overpaymentConfirmed` | boolean | True when the user confirmed the FR-032 warning; audit |

**Lifecycle:** `Recorded` only. Applies immediately, with no recipient confirmation (FR-031).

### 2.9 Notification (FR-017, FR-019, FR-023; AD-14)

| Attribute | Type | Rule |
|---|---|---|
| `id` | `NotificationId` | |
| `recipientId` | `UserId` | FK |
| `type` | `NotificationType` | NEW_EXPENSE, EXPENSE_APPROVED, EXPENSE_REJECTED |
| `groupId` | `GroupId` | FK |
| `expenseId` | `ExpenseId?` | FK; cleared if the Pending expense is deleted |
| `decisionId` | `DecisionId?` | FK; present on decision notifications |
| `actorName`, `groupName`, `description`, `amount`, `expenseDate` | snapshots | FR-017 content; `amount` is `Money` |
| `reason` | String? | On rejections (FR-023) |
| `createdAt` | `Instant` | Audit |
| `readAt` | `Instant?` | Null means unread |

**Unique:** `(recipientId, expenseId, type)`.

**Mutable only as follows:** `readAt`, and snapshot refresh while a linked expense is Pending (AD-14, DQ-06).

**Lifecycle:** `Unread` → `Read`, with one exception: an edit may reset a participant's NEW_EXPENSE to `Unread` (AD-14).

**The "needs your approval" flag is not an attribute.** It is computed: `type = NEW_EXPENSE`, linked expense is PENDING, and the recipient is a participant other than the creator.

---

## 3. Derived models

| Item | Persisted? | Why |
|---|---|---|
| Share amounts | **Yes** | Snapshot for fast queries; independently recomputable by `SplitAllocator` from amount, order, and percentages |
| Balance, per group and overall | **No** | One source of truth (AD-06); spec calls it derived |
| Report | **No** | Spec: not stored in the MVP |
| "Needs your approval" | **No** | Must follow expense state exactly |
| Unread count | **No** | Counted on demand |
| Display message of a notification | **No** | Rendered from snapshot fields |
| Group admin history | **No** | Not required; current admin only |

### 3.1 Balance (FR-026–FR-029, NFR-001)

```text
LedgerEntry(groupId, debtorId, creditorId, amount, date)

Sources:
  Approved expense: for each share where participant ≠ payer and amount > 0
                    → debtor = participant, creditor = payer
  Payment:          → debtor = recipient, creditor = payer

PairBalance(groupId, UserPair(lowId, highId), net)
  net = Σ entries where low owes high − Σ entries where high owes low
  net > 0: low owes high; net < 0: high owes low; net = 0: settled

Overall(a, b) = Σ per-group net across their groups
```

**Invariants (each has a planned test):**
- B1: Pending and Rejected expenses produce no ledger entries (FR-020, SC-005).
- B2: A payer's own share produces no entry (FR-026).
- B3: Each pair holds one signed net per group, so Σ owed = Σ due across the system (FR-029).
- B4: Overall = Σ per-group (FR-027).
- B5: Recomputing from the same records always gives the same result (NFR-001).

### 3.2 Report (FR-034–FR-037; AD-18)

| Type | Fields |
|---|---|
| `ReportFilter` | `from?`, `to?` (inclusive), `groupId?`, `otherUserId?`, `statuses?` |
| `ReportExpenseLine` | Expense id, group, date, description, payer, status, amount, viewer's share |
| `ReportPaymentLine` | Payment id, group, date, payer, recipient, amount, note |
| `ReportTotals` | `totalExpenseAmount`, `userShareTotal`, `totalPaidByUser`, `totalReceivedByUser` (Approved and payments only) |
| `StatusMemoLine` | Status, count, amount; informational, excluded from totals |
| `CounterpartyNetLine` | Other user, `opening`, `period`, `later`, `current` |
| `Report` | Filter, lines, totals, memo, counterparty lines, generation time |

**Invariants:**
- R1: `opening + period + later = current`, on every line.
- R2: `current` equals `BalanceService`'s value for the same group scope, to the cent (FR-037, SC-007).
- R3: Pending and Rejected amounts never appear in `ReportTotals` or `CounterpartyNetLine` (SC-005).

Exact semantics: `NEEDS CLARIFICATION`, SRC-04.

---

## 4. Persistence mapping (proposal)

**Not a migration.** This is a logical description for review. It assumes AD-07 (H2) and has not been executed.

| Table | Key | Columns of note | Foreign keys | Constraints |
|---|---|---|---|---|
| `app_user` | `id` | `username VARCHAR(30)`, `username_key VARCHAR(30)`, `display_name VARCHAR(50)`, `password_hash VARBINARY`, `password_salt VARBINARY`, `password_algorithm`, `password_iterations INT`, `failed_login_count INT`, `locked_until TIMESTAMP WITH TIME ZONE NULL`, `created_at` | | **UNIQUE** `username_key`; CHECK count 0–5 |
| `expense_group` | `id` | `name VARCHAR(50)`, `admin_user_id`, `status`, `created_at`, `updated_at` | `admin_user_id` → `app_user` RESTRICT | CHECK status |
| `membership` | `id` | `group_id`, `user_id`, `joined_at`, `added_by`, `left_at NULL`, `ended_by NULL`, generated `active_user_id` | → `expense_group`, → `app_user` RESTRICT | **UNIQUE** `(group_id, active_user_id)` for one-active rule; CHECK `left_at ≥ joined_at` |
| `expense` | `id` | `group_id`, `creator_id`, `payer_id`, `amount DECIMAL(12,2)`, `expense_date DATE`, `description VARCHAR(200)`, `split_method`, `status`, `created_at`, `updated_at`, `version INT` | → `expense_group`, → `app_user` RESTRICT | CHECK `amount > 0 AND amount <= 1000000.00`; CHECK enums |
| `expense_share` | `(expense_id, position)` | `participant_id`, `percentage DECIMAL(5,2) NULL`, `amount DECIMAL(12,2)` | `expense_id` → `expense` CASCADE; → `app_user` RESTRICT | **UNIQUE** `(expense_id, participant_id)`; CHECK `amount >= 0`; CHECK percent 0–100 |
| `expense_receipt` | `expense_id` | `media_type`, `size_bytes`, `sha256`, `content BLOB`, `uploaded_by`, `uploaded_at` | `expense_id` → `expense` CASCADE | CHECK size ≤ 5,242,880 |
| `approval_decision` | `id` | `expense_id`, `approver_id`, `outcome`, `reason VARCHAR(200) NULL`, `decided_at` | → `expense`, → `app_user` RESTRICT | **UNIQUE** `expense_id`; CHECK `outcome <> 'REJECTED' OR reason IS NOT NULL` |
| `payment` | `id` | `group_id`, `payer_id`, `recipient_id`, `amount DECIMAL(12,2)`, `payment_date DATE`, `note VARCHAR(200) NULL`, `recorded_at`, `overpayment_confirmed` | → `expense_group`, → `app_user` RESTRICT | CHECK `amount > 0 AND amount <= 1000000.00`; CHECK `payer_id <> recipient_id` |
| `notification` | `id` | `recipient_id`, `type`, `group_id`, `expense_id NULL`, `decision_id NULL`, snapshots, `reason NULL`, `created_at`, `read_at NULL` | `expense_id` → `expense` **SET NULL**; others RESTRICT | **UNIQUE** `(recipient_id, expense_id, type)` |

**Rules checked by Java, not the database:**
- Sum of shares equals the amount.
- Percentages total 100.00.
- At least one non-creator participant.
- Dates are not in the future. A CHECK against the database clock would disagree with the injected `Clock`.

**Referential integrity:** RESTRICT prevents deleting anything audit records reference. Only a Pending expense can be deleted, so a decision can never block a permitted delete.

**Timestamps** are stored in UTC. `LocalDate` business dates have no zone. "Today" uses the injected `Clock` in the system default zone (A-08).

---

## 5. Indexes for NFR-004

Proposed; effectiveness **unmeasured**.

| Index | Serves |
|---|---|
| `membership (user_id, left_at)` | "My groups" and access checks |
| `membership (group_id, left_at)` | Member lists, notification audience |
| `expense (group_id, status, expense_date)` | Ledger queries, group lists, report filters |
| `expense (creator_id)` | Reports, pending-exit guard |
| `expense (payer_id)` | Reports, pending-exit guard |
| `expense_share (participant_id, expense_id)` | Pending approvals, reports, pending-exit guard |
| `payment (group_id, payment_date)` | Ledger queries, report filters |
| `payment (payer_id)`, `payment (recipient_id)` | Payment history |
| `notification (recipient_id, read_at, created_at)` | Unread count, newest-first list |

---

## 6. Money and date invariants

| # | Invariant | FR / principle |
|---|---|---|
| M1 | Every monetary field is `Money` wrapping `BigDecimal` at scale 2; `float` and `double` never hold money, including in `ui` and tests | Principle IV |
| M2 | `BigDecimal` for money is built from `String` or integers only | Principle IV |
| M3 | User-entered money with more than two decimals is refused, not rounded | FR-010, FR-030 |
| M4 | Rounding modes appear only inside `Money` | ID-06, AD-04 |
| M5 | Shares use `DOWN` then FR-012 leftovers; Σ shares = amount, always | FR-011–FR-013, SC-004 |
| M6 | Money equality uses `compareTo`, or normalized scale | Principle IV |
| M7 | All amounts are in one currency, shown with `$` and two decimals | Spec assumption, FR-041 |
| D1 | Business dates are `LocalDate`, parsed strictly in one format (`yyyy-MM-dd`) | FR-041 |
| D2 | Expense and payment dates ≤ today; today is accepted | FR-010, FR-030 |
| D3 | Report ranges include both endpoints; `from ≤ to` when both exist | FR-035 |
| D4 | Event times are `Instant`, from the injected `Clock` | NFR-006, AD-23 |

---

## 7. FR traceability by entity

| Entity | FRs |
|---|---|
| User | FR-001, FR-002, FR-003, FR-004 |
| Group | FR-005, FR-006, FR-008, FR-009 (status only) |
| Membership | FR-005, FR-006, FR-007, FR-008, FR-017 (audience), FR-030 |
| Expense | FR-010, FR-015, FR-016, FR-020, FR-021, FR-022, FR-024, FR-026 |
| Share | FR-010, FR-011, FR-012, FR-013, FR-026 |
| Receipt | FR-014, FR-040 |
| Approval Decision | FR-021, FR-022, FR-023, FR-024 |
| Payment | FR-027, FR-030, FR-031, FR-032, FR-033 |
| Notification | FR-017, FR-019, FR-023 |
| Balance (derived) | FR-007, FR-026, FR-027, FR-028, FR-029, FR-032, FR-037 |
| Report (derived) | FR-034, FR-035, FR-036, FR-037 |
| All | FR-040 (persistence), FR-041 (format) |
| Not modeled in the MVP | FR-018, FR-025, FR-038, FR-039 ([architecture.md §10](architecture.md#10-post-mvp-impact-notes)) |
