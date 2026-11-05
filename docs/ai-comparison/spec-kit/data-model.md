# Data Model: SplitSmart Expense Sharing

**Status**: Draft. AI-generated; not human reviewed (Constitution Principle VII).
**Date**: 2026-11-04 | **Plan**: [plan.md](plan.md) | **Research**: [research.md](research.md)
**Diagram**: [docs/uml/domain-class.puml](../../docs/uml/domain-class.puml)

This model describes logical data, not code or database migrations. Entity names come from the
spec's Key Entities. Storage types are proposals (research R-10, R-11). `NC-n` items are open
questions from [research.md](research.md#unresolved-questions), and rules affected by them are working
defaults, not settled decisions.

## Overview

| Entity | Kind | Persisted? | FRs |
|--------|------|------------|-----|
| User | Entity | Yes | FR-001 to FR-004 |
| Group | Entity | Yes | FR-005, FR-008, FR-009 |
| Membership | Entity | Yes | FR-005 to FR-007 |
| Expense | Aggregate root | Yes | FR-010, FR-016, FR-020 to FR-024 |
| Share | Part of Expense | Yes | FR-010 to FR-013, FR-026 |
| ReceiptImage | Part of Expense | Yes, separately | FR-014 |
| ApprovalDecision | Entity | Yes, immutable | FR-021 to FR-024 |
| Payment | Entity | Yes, immutable | FR-030 to FR-033 |
| Notification | Entity | Yes | FR-017, FR-019, FR-023 |
| Balance (`BalanceLedger`, `PairBalance`) | Derived | **No** | FR-026 to FR-029 |
| Report | Derived | **No** in the MVP | FR-034 to FR-037 |
| Money, Percentage | Value objects | As integers | FR-010 to FR-013, NFR-001 |

## Shared invariants

**Money (Principle IV, NFR-001)**

- **INV-M1**: Every monetary value is a `Money` wrapping `BigDecimal` at scale 2. `float` and `double`
  are never used.
- **INV-M2**: Values come from `String` or integers only. Equality uses `compareTo` or normalized
  scale.
- **INV-M3**: User-entered amounts with more than 2 decimals are refused, not rounded.
- **INV-M4**: Rounding has two paths in `Money`: `HALF_EVEN` for general normalization, and `FLOOR` for
  split allocation only (research R-07).
- **INV-M5**: `Money` may be negative so it can represent signed net balances. Entered expense and
  payment amounts must be greater than 0 and at most 1,000,000.00 (the payment maximum is NC-11).
- **INV-M6**: One currency, displayed in US dollars (spec assumption).

**Dates and times (FR-041, NFR-006)**

- **INV-D1**: Expense and payment dates are calendar dates with no time zone, and may not be later
  than today by the injected `Clock`.
- **INV-D2**: Audit timestamps are UTC instants from the injected `Clock`.
- **INV-D3**: Dates are displayed and entered as `yyyy-MM-dd` (proposed, PD-17).

**Identity and audit (NFR-006)**

- **INV-I1**: Each entity has a UUID in a typed wrapper (`UserId`, `GroupId`, `ExpenseId`, and so on),
  created by the application.
- **INV-A1**: `ApprovalDecision` and `Payment` records are insert-only. No operation changes or deletes
  them.
- **INV-A2**: Every `ApprovalDecision` and `Payment` records who acted and when.

**Balance effect (FR-020, SC-005)**

- **INV-B1**: Only `APPROVED` expenses and recorded payments feed `BalanceLedger`. `PENDING` and
  `REJECTED` expenses cannot contribute.

## User

| Field | Type | Rules |
|-------|------|-------|
| id | UserId | Immutable |
| username | Text | 3 to 30 characters; preserved as typed |
| usernameKey | Text | Lowercase form of username; **unique**, giving case-insensitive uniqueness (FR-001) |
| displayName | Text | Required. The spec sets no length limit |
| passwordHash | Text | Non-reversible, with its salt and iteration count (FR-004, NFR-002). Never displayed or logged |
| failedLoginCount | Integer | 0 or more; reset to 0 by a successful login |
| lockedUntil | Instant, optional | Set on the 5th consecutive failure to now + 5 minutes |
| createdAt | Instant | Immutable |

- **Validation**: Password of at least 8 characters (FR-001). The plaintext is checked and hashed, and
  never stored.
- **Lockout states**:

```text
Unlocked (count < 5) --wrong password--> count + 1
Unlocked (count = 4) --wrong password--> Locked (lockedUntil = now + 5 min)
Unlocked             --correct password--> count = 0
Locked               --any attempt before lockedUntil--> refused; state unchanged (assumption, R-16)
Locked               --lockedUntil reached--> Unlocked (count = 0)
```

- **Relationships**: One user has many Memberships.

## Group

| Field | Type | Rules |
|-------|------|-------|
| id | GroupId | Immutable |
| name | Text | 1 to 50 characters; need not be unique (the spec does not require it) |
| adminId | UserId | Exactly one admin in the MVP; initially the creator (FR-005) |
| status | ACTIVE or ARCHIVED | Always ACTIVE in the MVP. ARCHIVED is reserved for Post-MVP FR-009, and no MVP operation sets it |
| createdAt | Instant | Immutable |

- **Relationships**: One group has many Memberships, Expenses, and Payments.
- **Open**: Whether the admin can leave is NC-5.

## Membership

| Field | Type | Rules |
|-------|------|-------|
| groupId | GroupId | Required |
| userId | UserId | Required |
| joinedAt | Instant | Required |
| leftAt | Instant, optional | Empty means current member |

- **Constraints**: At most one current membership per group and user. Rejoining adds a new row, so
  history is kept (spec Q6 default).
- **Lifecycle**: `Current --removed or left, FR-007 check passes--> Former --rejoined--> new Current row`.
- **Validation**: FR-007 refuses removal or leaving when the member's net balance in that group is not
  $0.00. NC-6 asks whether this should be pairwise, and NC-4 asks about Pending expenses.
- **Visibility**: A current member sees the group's data. A former member sees only items they were
  personally part of (NC-3 working default).

## Expense

| Field | Type | Rules |
|-------|------|-------|
| id | ExpenseId | Immutable |
| groupId | GroupId | Immutable |
| creatorId | UserId | Immutable; a current member when created |
| payerId | UserId | Exactly one; any current member; defaults to the creator; need not be a participant (FR-010) |
| amount | Money | Greater than 0, at most 1,000,000.00, at most 2 decimals |
| date | Calendar date | Not later than today |
| description | Text | 1 to 200 characters |
| splitMethod | EQUAL or PERCENTAGE | Required |
| status | PENDING, APPROVED, or REJECTED | Starts PENDING (FR-020) |
| shares | Ordered list of Share | See below; order is saved (FR-012) |
| version | Integer | Starts at 1; increases on each edit; used to detect stale decisions |
| createdAt | Instant | Immutable |

**Validation (all failures reported together, FR-015):**

- At least one participant, all current group members, with no duplicates.
- At least one participant other than the creator, or no one could approve it (Edge Cases, FR-021,
  FR-022). This means the payer can be the only participant only when the payer is not the creator.
- Percentage rules apply only when `splitMethod` is PERCENTAGE.

**Lifecycle (FR-016, FR-020 to FR-024):**

```text
(new) --create--> PENDING
PENDING --creator edits--> PENDING (version + 1; shares recalculated)
PENDING --creator deletes--> removed
PENDING --eligible approver approves--> APPROVED  (final; now affects balances)
PENDING --eligible approver rejects, with reason--> REJECTED  (final; never affects balances)
```

- APPROVED and REJECTED allow no edit, delete, or further status change. Correcting a rejected expense
  means creating a new one (spec Q5 default).
- **Eligible approver**: a participant other than the creator (FR-021, FR-022), who is a current
  member, because the spec defines "group member" as current unless stated otherwise. NC-4 covers
  people who leave while an expense is Pending. One decision settles the expense.
- **Delete**: Removes the expense, its shares, and its receipt. Existing notifications keep their text,
  and their expense link is cleared (NC-9 working default).

## Share

| Field | Type | Rules |
|-------|------|-------|
| expenseId | ExpenseId | Part of its expense |
| position | Integer | 0-based participant order (FR-012); unique per expense |
| participantId | UserId | Unique per expense |
| percentage | Percentage, optional | Present only for PERCENTAGE: 0.00 to 100.00, at most 2 decimals |
| amount | Money | Calculated by `SplitAllocator`; 0.00 or more; never entered |

**Invariants:**

- **INV-S1**: The sum of share amounts equals the expense amount exactly (FR-012, SC-004).
- **INV-S2**: For PERCENTAGE, percentages total exactly 100.00 (FR-013).
- **INV-S3**: Allocation is reproducible from the amount, method, percentages, and saved order.

**Allocation** is defined in [research.md R-08](research.md#r-08-split-allocation-algorithm). A $0.00
share is valid: $0.01 split among three gives 0.01, 0.00, 0.00. NC-7 asks whether a 0% participant may
receive a leftover cent.

## ReceiptImage

| Field | Type | Rules |
|-------|------|-------|
| expenseId | ExpenseId | At most one receipt per expense (FR-014) |
| mediaType | JPEG or PNG | Checked from the file's leading bytes |
| bytes | Binary | At most 5 MB |
| originalFileName | Text | Display only |

- **Rules**: Attaching or replacing is allowed only while the expense is PENDING, because FR-016
  disallows edits afterward. Any current group member may view it (FR-014). An invalid file is refused
  without losing the other entered data (Edge Cases).
- **Persistence**: Stored in its own table so that lists and reports do not load image bytes.

## ApprovalDecision

| Field | Type | Rules |
|-------|------|-------|
| id | DecisionId | Immutable |
| expenseId | ExpenseId | **Unique**: one decision per expense in the MVP |
| approverId | UserId | Eligible approver at decision time |
| decision | APPROVE or REJECT | Required |
| reason | Text, optional | Required for REJECT, 1 to 200 characters (FR-023). Optional for APPROVE (FR-024: "if any") |
| decidedAt | Instant | From `Clock` |

- **Immutable**: Insert-only (INV-A1, FR-024, NFR-006). Visible to group members.
- **Atomicity**: The status update, decision insert, and creator notification commit together (PD-08).
- **Post-MVP**: Multi-level approval (FR-025) would require relaxing the unique rule and adding approval
  configuration per group. Not designed in the MVP.

## Payment

| Field | Type | Rules |
|-------|------|-------|
| id | PaymentId | Immutable |
| groupId | GroupId | **Required** (FR-030). Both users must be current members |
| payerId | UserId | The acting user: users record payments they made |
| recipientId | UserId | Different from the payer |
| amount | Money | Greater than 0, at most 2 decimals; maximum per NC-11 |
| date | Calendar date | Not later than today |
| note | Text, optional | Up to 200 characters |
| recordedAt | Instant | From `Clock`; audit (NFR-006) |

- **Lifecycle**: None. A payment takes effect as soon as it is saved, with no recipient confirmation
  (FR-031), and cannot be changed or deleted (NFR-006). A mistake is corrected by an opposite payment
  (research RK-5).
- **Overpayment** (FR-032): If the amount exceeds what the payer currently owes the recipient in that
  group, saving requires explicit confirmation, checked again inside the transaction.

## Notification

| Field | Type | Rules |
|-------|------|-------|
| id | NotificationId | Immutable |
| recipientId | UserId | Required |
| type | EXPENSE_CREATED, EXPENSE_APPROVED, or EXPENSE_REJECTED | Required |
| expenseId | ExpenseId, optional | Cleared if the expense is deleted |
| groupId | GroupId | Required |
| message | Text | Saved text. EXPENSE_CREATED states the creator, group, description, amount, and date (FR-017). Decision types include the reason, if any (FR-023) |
| createdAt | Instant | Sort newest first (FR-019) |
| readAt | Instant, optional | Empty means unread |

- **Recipients of EXPENSE_CREATED**: Every current group member except the creator (FR-017).
- **Recipient of a decision type**: The expense creator (FR-023).
- **Computed, not stored**: `needsApproval` is true when `expenseId` is present, that expense is
  PENDING, the recipient is a participant, and the recipient is not the creator (FR-017, research R-19).
- **Lifecycle**: `Unread --mark read--> Read`.

## Balance (derived)

Never stored. `BalanceLedger` computes it from Approved shares and payments (research R-13).

For viewer **V**, other user **O**, and group **G**, a positive result means "O owes V":

```text
net(V, O, G) =   sum of O's share in APPROVED expenses in G paid by V
               - sum of V's share in APPROVED expenses in G paid by O
               + sum of payments in G from V to O
               - sum of payments in G from O to V
```

| Derived item | Definition | FR |
|--------------|------------|----|
| Payer's own share | Creates no entry, because a user never owes themselves | FR-026 |
| Overall pair balance | Sum of net(V, O, G) across their groups | FR-027, FR-028 |
| Member net in group | Sum of net(V, O, G) over all O in G | FR-007 |
| Amount payer owes recipient in G | net(recipient, payer, G) when positive, otherwise 0 | FR-032 |

**Invariants:**

- **INV-B2**: net(V, O, G) = −net(O, V, G).
- **INV-B3**: Member nets within each group sum to $0.00, so all amounts owed equal all amounts due
  (FR-029).
- **INV-B4**: Overall pair balance equals the sum of its per-group balances (FR-027).

**Checks against spec scenarios**

- $90.00 paid by alex, equal among alex, sam, and jo: net(alex, sam) = +30.00 and net(alex, jo) = +30.00.
- Plus $60.00 paid by sam, equal between alex and sam: net(alex, sam) = 30.00 − 30.00 = 0.00.
- sam owes alex $30.00, and sam pays $40.00 after confirming: net(alex, sam) = 30.00 − 40.00 = −10.00,
  so alex owes sam $10.00.

## Report (derived)

Generated on demand; not stored in the MVP. Saved definitions and export are Post-MVP (FR-038).

**ReportCriteria (FR-035; any combination):** optional inclusive start and end date, optional group,
optional other user, optional expense statuses. An end date before the start date is refused.

**Scope:** Items involving the acting user. Former-member visibility follows NC-3.

| Output | Definition | FR |
|--------|------------|----|
| Expense lines | Matching expenses where the user is creator, payer, or participant, showing status | FR-036 |
| Payment lines | Matching payments where the user is payer or recipient | FR-036 |
| totalExpenseAmount | Sum of amounts on matching **APPROVED** lines | FR-036 |
| userShareTotal | Sum of the user's shares on matching **APPROVED** lines | FR-036 |
| totalPaid, totalReceived | Sums of matching payment lines (NC-10) | FR-036 |
| filteredNetByUser | `BalanceLedger` result using only matching APPROVED expenses and payments | FR-036, FR-037 |
| currentNetByUser | Current balance, honoring group and other-user filters but not dates or statuses | Story 8 scenario 2 |

**Rules (working defaults under NC-8):**

- Pending and Rejected expenses can appear as lines but never enter a money total (SC-005).
- The status filter applies to expense lines only, because payments have no status.
- When no date or status filter is used, `filteredNetByUser` must equal `currentNetByUser` to the cent
  (FR-037, SC-007).
- No matches produce an empty report with zero totals, not an error (Story 8 scenario 4).

## Relationships

```text
User 1---* Membership *---1 Group
Group 1---* Expense 1---1..* Share *---1 User (participant)
Expense *---1 User (creator), *---1 User (payer)
Expense 1---0..1 ReceiptImage
Expense 1---0..1 ApprovalDecision *---1 User (approver)
Group 1---* Payment *---1 User (payer), *---1 User (recipient)
User 1---* Notification *---0..1 Expense
```

## Persistence versus derived data

| Persisted | Derived on read |
|-----------|-----------------|
| User, Group, Membership, Expense, Share, ReceiptImage, ApprovalDecision, Payment, Notification | Balances, member nets, overpayment amount, `needsApproval`, unread count, reports |

**Proposed storage mapping (PD-06, PD-07), not a migration:**

- Money is stored as integer cents, and percentages as integer hundredths of a percent.
- Dates are `yyyy-MM-dd` text; instants are UTC ISO-8601 text; IDs are UUID text.
- Foreign keys are enforced, and SQLite requires this to be turned on per connection.
- Unique rules: `usernameKey`; one decision per expense; one share position and participant per
  expense; one current membership per group and user.
- Indexes (for NFR-004): expenses by group and status; expenses by date; shares by participant; payments
  by group; payments by payer and recipient; memberships by user; notifications by recipient.

## FR traceability

| FRs | Model elements |
|-----|----------------|
| FR-001, FR-002, FR-004 | User (usernameKey, passwordHash, lockout fields) |
| FR-003 | Membership visibility rule; Report scope |
| FR-005 to FR-008 | Group, Membership, member net |
| FR-009 (Post-MVP) | Group.status reserved only |
| FR-010 to FR-013 | Expense, Share, Money, Percentage, allocation |
| FR-014 | ReceiptImage |
| FR-015 | Expense validation with all failures reported |
| FR-016 | Expense lifecycle and version |
| FR-017, FR-019 | Notification, computed needsApproval |
| FR-018 (Post-MVP) | Not modeled |
| FR-020 to FR-024 | Expense status, ApprovalDecision |
| FR-025 (Post-MVP) | Not modeled; the required change is noted above |
| FR-026 to FR-029 | Balance formula and invariants |
| FR-030 to FR-033 | Payment |
| FR-034 to FR-037 | Report, ReportCriteria |
| FR-038, FR-039 (Post-MVP) | Not modeled |
| FR-040 | All persisted entities |
| FR-041 | INV-D3, INV-M6 |
