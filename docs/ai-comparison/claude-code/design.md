# SplitSmart Detailed Design

**Status:** AI-generated draft, not reviewed. Requires named human review (Principle VII). All design choices here are proposals; AD IDs are defined in [architecture.md §12](architecture.md#12-ad-decision-register). The MVP is a Swing desktop application and **does not satisfy CR-10** (OC-1, unresolved).

**Companions:** [data-model.md](data-model.md) · [contracts/](contracts/README.md) · [uml/](uml/) · [open-questions-and-risks.md](open-questions-and-risks.md)

---

## 1. Domain model overview

Diagram: [uml/domain-class.puml](uml/domain-class.puml). Field-level details: [data-model.md](data-model.md).

| Kind | Types | Owner responsibility |
|---|---|---|
| Entities | `User`, `Group`, `Membership`, `Expense`, `ApprovalDecision`, `Payment`, `Notification` | Encapsulated state and validated construction (Principle III) |
| Money and percent | `Money`, `Percentage` | Exact arithmetic and the only rounding code (AD-04) |
| Identity | `UserId`, `GroupId`, `MembershipId`, `ExpenseId`, `DecisionId`, `PaymentId`, `NotificationId` | Typed wrappers around UUID (AD-23) |
| Other value objects | `Username`, `PasswordHash`, `Share`, `ReceiptImage`, `LedgerEntry`, `UserPair`, `PairBalance` | Self-validating and immutable |
| Split input | sealed `SplitRequest` → `EqualSplit`, `PercentageSplit`; `ParticipantPercentage` | Makes invalid split shapes unrepresentable |
| Enums | `SplitMethod`, `ExpenseStatus`, `DecisionOutcome`, `GroupStatus`, `NotificationType`, `ReceiptMediaType` | Closed value sets |
| Pure calculators | `SplitAllocator`, `BalanceCalculator` (produces `BalanceSheet`), `ReportCalculator` | Business math with no I/O, tested directly (NFR-009) |
| Report types | `ReportFilter`, `Report`, `ReportTotals`, `CounterpartyNetLine`, `StatusMemoLine`, `ReportExpenseLine`, `ReportPaymentLine` | Derived results, not persisted |
| Failure | `DomainRuleViolation` | Invariant breach, translated by services |

---

## 2. Entities: invariants and behavior

### 2.1 User (FR-001, FR-002, FR-004, NFR-002)

- `Username`: 3–30 characters after trimming; comparison key is lowercase in `Locale.ROOT`.
- `displayName`: required. **Length is unspecified.** Proposal 1–50 characters (DQ-12).
- `PasswordHash` holds algorithm, iterations, salt, and hash, and has no readable form. Its `toString` must not expose contents.
- Behavior:
  - `isLockedAt(now)`: true while `now` is before `lockedUntil`.
  - `recordFailedLogin(now)`: if a previous lock has expired, start from zero; then increment; at 5, set `lockedUntil = now + 5 minutes`.
  - `recordSuccessfulLogin()`: clears count and lock.

**Lockout states:** `Unlocked (count 0..4)` → 5th consecutive failure → `Locked` → 5 minutes elapse → `Unlocked (count 0)`. Attempts during `Locked` are refused before any password check, and do not count or extend the lock.

### 2.2 Group and Membership (FR-005–FR-009)

- `Group`: name 1–50 characters after trimming; exactly one `adminId` while any active member exists; `status` is ACTIVE in the MVP (ARCHIVED reserved for FR-009 and never written in the MVP).
- `Membership`: `(groupId, userId, joinedAt, addedBy, leftAt?, endedBy?)`. At most one active row per user and group. A rejoin creates a new row, following the Q6 default ("history kept and linked"), which is **still unconfirmed**.
- **Exit guard (AD-15; `NEEDS CLARIFICATION` DQ-02, DQ-03)**, applied to both removal and leaving:
  1. Every pairwise balance between the member and anyone else in that group must be $0.00.
  2. The member must not be creator, payer, or participant of a Pending expense in that group.

  **Why stricter than FR-007's "net balance."** If Ann owes Bob $10 and Cara owes Ann $10, Ann's aggregate net is $0.00. If Ann leaves, both debts remain and neither can be paid, because FR-030 requires both parties to be current members. Likewise, if a pending expense involving Ann is approved after Ann leaves, Ann gains a debt that cannot be settled.
- **Admin leaving (AD-16; `NEEDS CLARIFICATION` DQ-04):** the earliest-joined remaining active member becomes admin, ties broken by user ID. A last member leaving leaves the group with no active members and invisible to everyone except through former members' history.

### 2.3 Expense aggregate (FR-010–FR-016, FR-020–FR-024, FR-026)

`Expense` owns its ordered `Share` list and is the only type that changes its status.

**Invariants, enforced at construction and on revision:**

| # | Invariant | Source |
|---|---|---|
| E1 | `0 < amount ≤ 1,000,000.00`, at most 2 decimals | FR-010 |
| E2 | `date ≤ today` | FR-010, edge case |
| E3 | Description 1–200 characters | FR-010 |
| E4 | Exactly one payer, a current member; defaults to creator | FR-010 |
| E5 | One or more distinct participants, all current members; order preserved | FR-010, FR-012 |
| E6 | At least one participant is not the creator | Edge case; FR-021, FR-022 |
| E7 | Shares total exactly `amount` | FR-012, Principle IV |
| E8 | Percentage split: each 0–100, at most 2 decimals, total exactly 100.00 | FR-013 |
| E9 | At most one receipt; JPEG or PNG; at most 5 MB | FR-014 |
| E10 | Status changes only from Pending, exactly once | FR-020, FR-024 |

E6 also covers the payer-only edge case: an expense whose only participant is the payer is allowed exactly when that payer is not the creator.

**Behavior:**

| Method | Effect | Refuses when |
|---|---|---|
| `Expense.create(...)` | New Pending expense, version 1 | Any invariant fails |
| `revise(actor, ...)` | Replaces fields and shares; version + 1 | Actor is not creator; not Pending |
| `isEligibleApprover(user)` | `user` is a participant and not the creator | |
| `approve(approver, now)` | Status Approved; returns `ApprovalDecision` | Not Pending; approver ineligible |
| `reject(approver, reason, now)` | Status Rejected; returns `ApprovalDecision` | As above; reason not 1–200 characters |
| `ledgerEntries()` | One entry per participant with a non-zero share who is not the payer; **empty unless Approved** | |

**State transitions:**

```text
             create
               │
               ▼
          ┌─────────┐  revise (creator only; version + 1)
          │ PENDING │◀──────┐
          │         │───────┘
          └─┬──┬──┬─┘
 approve    │  │  │  delete (creator only; row removed)
 (eligible) │  │  └──────────────▶ (gone)
            │  │ reject (eligible, reason required)
            ▼  ▼
     APPROVED  REJECTED     ← terminal; never edited, deleted, or changed
```

The payer has no separate approval right unless also a participant (edge case). Rejected expenses cannot be resubmitted; the creator enters a new one (Q5 default, **unconfirmed**).

### 2.4 ApprovalDecision (FR-021–FR-024, NFR-006)

Immutable record of `(expenseId, approverId, outcome, reason?, decidedAt)`. A rejection requires a reason of 1–200 characters. An approval may carry an optional reason of up to 200 characters, since FR-024 says "reason (if any)." At most one per expense in the MVP.

### 2.5 Payment (FR-030–FR-033, NFR-006)

Immutable record of `(groupId, payerId, recipientId, amount, date, note?, recordedAt, overpaymentConfirmed)`.

- `payerId` is always the signed-in user, since FR-030 says "a payment they made." `payerId ≠ recipientId`.
- Both are current members of the group when recording.
- `0 < amount`, at most 2 decimals. The `≤ 1,000,000.00` cap comes from the general edge case, because FR-030 itself is silent (SRC-08).
- `ledgerEntry()` returns `debtor = recipient, creditor = payer`. Paying reduces what the payer owes; an excess reverses the direction. This produces Scenario 6.2 directly: 30 owed by sam, plus a 40 entry the other way, leaves alex owing sam 10.

### 2.6 Notification (FR-017, FR-019, FR-023; AD-14)

`NotificationType` is one of NEW_EXPENSE, EXPENSE_APPROVED, EXPENSE_REJECTED. The record snapshots actor name, group name, description, amount, and date so it stays readable. `message()` renders from these fields. The record has `readAt?` and a nullable `expenseId`.

**"Needs your approval" is computed, never stored:** `type = NEW_EXPENSE`, the linked expense is Pending, and the recipient is a non-creator participant. Once decided or deleted, the flag vanishes by itself, satisfying FR-017's "while the expense is Pending."

### 2.7 Balance and Report

Both are derived and never stored; see §4.4, §4.7, and [data-model.md §3](data-model.md#3-derived-models).

---

## 3. Money and the split rule

### 3.1 `Money` (AD-04)

- Wraps a `BigDecimal` always at scale 2. May be negative, which net balances need. Domain rules enforce positivity where required.
- Created only from `String` or integer values. The `double` factories the constitution prohibits do not exist on this type, and AD-22 checks for `float` and `double` fields.
- Equality and comparison use normalized scale 2 and `compareTo`.
- All rounding code lives on this class:

| Method | Rounding | Used for |
|---|---|---|
| `Money.parseStrict(text)` | **None.** Refuses more than two decimals, signs, exponents, and separators | User input (FR-010, FR-030) |
| `Money.normalized(BigDecimal)` | `HALF_EVEN`, scale 2 | Reading values back from storage or any computed value needing normalization (ID-06) |
| `floorDividedBy(int n)` | `DOWN`, scale 2 | FR-011 |
| `floorPercent(Percentage p)` | `DOWN`, scale 2 | FR-013 |
| `plus`, `minus`, `times(int)`, `negated` | Exact | Sums, differences, and leftover calculation |

### 3.2 How `HALF_EVEN` and the floor rule coexist (SRC-03)

The constitution says money is "held at scale 2 using `RoundingMode.HALF_EVEN`, applied in one place." It also says leftover cents go by "a documented, deterministic rule," and FR-011 and FR-013 specify that rule as rounding *down*. They govern different operations:

| Situation | Rule that applies | Why |
|---|---|---|
| Computing one participant's share | **`DOWN`, then FR-012 leftovers** | A specific clarified customer-facing answer from 2026-10-29. HALF_EVEN cannot work here: $10.00 ÷ 6 at HALF_EVEN gives 1.67 × 6 = $10.02, which exceeds the total. |
| Parsing user input | **No rounding: refuse** | FR-010 says "at most two decimal places" |
| Adding or subtracting scale-2 values | **Exact, no rounding needed** | Scale-2 sums are already exact |
| Normalizing any other value to scale 2 | **`HALF_EVEN`** | ID-06 |

**Reviewers should know:** with this design, `HALF_EVEN` almost never changes a value. Stored data is already at scale 2, and no MVP calculation produces excess scale outside the split rule. `Money.normalized` satisfies the constitution's policy and protects the storage boundary, but the policy does not visibly affect balances. Both rounding modes stay in one class, so "one place" holds at class level. Whether this reading satisfies Principle IV is for a human to confirm.

### 3.3 `SplitAllocator` algorithm (AD-05)

**Equal split (FR-011, FR-012):**

1. `base = amount.floorDividedBy(n)`.
2. `leftoverCents = (amount − base × n) / 0.01`.
3. Participant at position `i` (from 0) gets `base + 0.01` if `i < leftoverCents`, otherwise `base`.

**Percentage split (FR-013, FR-012):**

1. Require each percentage in 0–100 with at most 2 decimals, totaling exactly 100.00 by `compareTo`.
2. `floor_i = amount.floorPercent(pct_i)`. The product of a scale-2 amount and a scale-2 percentage, divided by 100, is exact at scale 6 before truncation.
3. `leftoverCents = (amount − Σ floor_i) / 0.01`.
4. The first `leftoverCents` participants in listed order each get 0.01 more, **regardless of their percentage**.

**One pass is always enough.** Each floor loses less than one cent, so the total loss across `n` participants is under `n` cents, and `leftoverCents < n`. FR-012's "one cent at a time" never wraps around.

**`DOWN` equals floor here.** Expense amounts are positive and percentages non-negative, so no input is negative.

**Worked examples, to be used as test vectors:**

| Amount | Split | Floors | Leftover | Final shares | Source |
|---|---|---|---|---|---|
| 90.00 | equal, 3 | 30.00 each | 0 | 30.00, 30.00, 30.00 | Scenario 3.1 |
| 100.00 | equal, 3 | 33.33 each | 1 | 33.34, 33.33, 33.33 | Scenario 3.2 |
| 0.01 | equal, 3 | 0.00 each | 1 | 0.01, 0.00, 0.00 | Edge case |
| 0.02 | equal, 3 | 0.00 each | 2 | 0.01, 0.01, 0.00 | Derived |
| 10.00 | equal, 6 | 1.66 each | 4 | 1.67, 1.67, 1.67, 1.67, 1.66, 1.66 | Derived |
| 200.00 | 50 / 30 / 20 | 100.00, 60.00, 40.00 | 0 | 100.00, 60.00, 40.00 | Scenario 3.3 |
| 10.00 | 33.33 / 33.33 / 33.34 | 3.33, 3.33, 3.33 | 1 | **3.34**, 3.33, 3.33 | Derived; the extra cent goes to the first, not the 33.34% participant |
| 1.00 | 0 / 33.33 / 33.33 / 33.34 | 0.00, 0.33, 0.33, 0.33 | 1 | **0.01**, 0.33, 0.33, 0.33 | Derived; **literal FR-012 gives a 0% participant a cent** (DQ-01) |

**DQ-01 `NEEDS CLARIFICATION`.** FR-013 allows 0%, and FR-012 sends leftovers to participants in listed order with no exception. The design implements this literally because the clarification is explicit. A customer might reasonably object to being charged a cent at 0%.

A $0.00-share participant remains a participant: they can approve, and they generate no ledger entry.

---

## 4. Business flows

### 4.1 Expense creation (FR-010–FR-015, FR-017, FR-020)

Diagram: [uml/expense-creation-approval.puml](uml/expense-creation-approval.puml).

1. `ExpenseFormPanel` shows active members; the payer defaults to the creator; the user orders participants with Move Up/Move Down.
2. `ExpenseController` builds `ExpenseDraft` from raw values, and `UiTaskRunner` calls `ExpenseService.createExpense`.
3. `ExpenseDraftValidator` parses every field and collects all `FieldError`s (FR-015). The receipt stream is read here, up to 5 MB + 1 byte.
4. Within one transaction:
   - `AccessPolicy.requireActiveMember` for the creator.
   - Confirm payer and participants are active members.
   - `SplitAllocator.allocate` → `Expense.create` (Pending).
   - Insert expense, shares, and receipt if any.
   - `NotificationDispatcher.expenseCreated` writes one notification for every other current member (§4.5).
5. Return `ExpenseDetailView`.

On `ValidationException`, the form keeps all entered data and focuses the first bad field. A refused receipt has the same effect.

### 4.2 Edit and delete while Pending (FR-016; AD-14)

- **Edit:** creator only; requires `expectedVersion`; re-validates and recomputes shares. Payer and participants must be active members. `NotificationDispatcher.expenseRevised` then refreshes existing NEW_EXPENSE snapshots, sets participant recipients back to unread, and adds a notification for any current member who has none. `NEEDS CLARIFICATION` DQ-06.
- **Delete:** creator only; Pending only. Removes the expense, shares, and receipt. Notifications keep their snapshot, and their `expense_id` becomes null, so the UI shows "(expense deleted)." No new notification is sent. `NEEDS CLARIFICATION` DQ-06.

### 4.3 Approval and rejection (FR-021–FR-024; AD-10)

Within one transaction:

1. Load the expense, confirm the actor is an active member.
2. If not Pending → `ConflictException(ALREADY_DECIDED)`. If `expectedVersion` differs → `ConflictException(STALE_VERSION)`.
3. `expense.approve` or `expense.reject` enforces eligibility, creator exclusion (FR-022), and reason rules (FR-023).
4. `ExpenseRepository.updateStatusIfPending` is a conditional update. Zero rows updated → `ALREADY_DECIDED`.
5. Insert `ApprovalDecision`; a unique constraint on `expense_id` is the final backstop.
6. `NotificationDispatcher.expenseDecided` notifies the creator, with the reason if any (FR-023).

Commit is the moment the expense enters balances. The first recorded decision wins, and the second actor is told it is no longer pending (edge case).

### 4.4 Balance calculation (FR-026–FR-029)

`LedgerReader` obtains `LedgerEntry` rows and `BalanceCalculator` folds them into a `BalanceSheet`.

- **Inputs:** one entry per non-payer participant with a non-zero share of an **Approved** expense (`debtor = participant, creditor = payer`), and one per payment (`debtor = recipient, creditor = payer`). Pending and Rejected expenses cannot appear: the query filters on status, and `Expense.ledgerEntries()` returns nothing for them.
- **Per group:** for each `(groupId, UserPair)`, keep one signed net. `UserPair` orders the two IDs canonically, and a positive net means the lower-ordered user owes the higher-ordered one.
- **Overall:** the sum of per-group nets for a pair (FR-027). Debts are not simplified across users (spec assumption).
- **FR-029 holds by construction:** each signed net is one person's debt and the other's credit, so total owed equals total due. Tests still check it.

**Views:**
- `BalanceService.myBalances`: the viewer's counterparties with net, direction (OWES_ME, I_OWE, SETTLED), and a per-group breakdown summing to the net (FR-028). Pairs with any ledger history and a $0.00 net show as settled (Scenario 5.2).
- `BalanceService.groupBalances`: all pairs in a group, for any active member. This supports Scenario 5.1, where sam sees "jo owes alex," and FR-003's "or those groups."

### 4.5 Notifications (FR-017, FR-019, FR-023)

Diagram: [uml/notification.puml](uml/notification.puml).

- **Creation** happens only in `NotificationDispatcher`, in the triggering transaction (AD-09).
- **Audience of NEW_EXPENSE:** all current members except the creator, evaluated at commit. Former members get nothing (Scenario 7.4). The creator gets nothing (Scenario 7.1).
- **Decision notifications** go to the creator only. Notifications for payments and other events are not sent, per Q7's default, **which is unconfirmed**.
- **Reading:** `NotificationService.unreadCount` runs at login and on each navigation to Home. `list` returns newest first with the derived flag. `markRead` affects only the viewer's own rows.
- **Visibility:** the list and count apply AD-17 for groups the user has left.

### 4.6 Payment settlement (FR-030–FR-033; AD-13)

Diagram: [uml/payment-settlement.puml](uml/payment-settlement.puml).

Within one transaction:

1. Parse and validate; group, recipient, amount, and date are checked (FR-030).
2. `AccessPolicy.requireActiveMember` for payer and recipient. Self-payment refused.
3. `LedgerReader.owedBy(payer, recipient, group)` gives `owed = max(0, net owed by payer)`.
4. If `amount > owed`:
   - If `acknowledgedOwed` is absent or differs from current `owed` → return `OverpaymentWarning(owed, amount)` and write nothing.
   - If it matches → continue with `overpaymentConfirmed = true`.
5. Insert the `Payment` and return `Recorded`. The balance changes immediately because it is derived; the recipient does not confirm (FR-031).

Scenario 6.3 follows without special handling: paying in "Ski Trip" has `owed = 0`, so it warns, and "Apartment 4B" stays unchanged because the ledger is per group. An exact payoff gives no warning.

Payments cannot be edited or deleted (NFR-006). Correcting a mistake has no defined path (DQ-08).

### 4.7 Reports (FR-034–FR-037; AD-18)

**Filter:** optional inclusive `from`/`to`, group, other user, and status set, in any combination (FR-035). `from > to` is refused (Scenario 8.3). No matches yield zero totals, not an error (Scenario 8.4).

**Inclusion:**
- An expense is included when the user is its creator, payer, or participant. With an other-user filter, that person must also be one of these on the same expense (A-05).
- A payment is included when the user is payer or recipient. With an other-user filter, the other party must match.
- The date filter uses the expense date or payment date, not the time entered or approved.
- The status filter applies to expenses only. Payments have no status and stay listed (A-06).
- For groups the user has left, AD-17 applies.

**Totals (FR-036), computed by `ReportCalculator`:**

| Field | Definition |
|---|---|
| `totalExpenseAmount` | Sum of amounts of matching **Approved** expenses |
| `userShareTotal` | Sum of the user's share in those expenses |
| `totalPaidByUser` | Sum of matching payments where the user is payer (interpretation, A-04) |
| `totalReceivedByUser` | Sum of matching payments where the user is recipient (A-04) |
| `statusMemo` | Count and amount of matching expenses per status, labeled as not included in totals |

**Net balances and reconciliation (FR-036, FR-037; SRC-04).** The spec's filters raise two problems:
- A date-filtered subset cannot equal a current balance on its own, yet SC-007 requires agreement for all filter combinations.
- SC-005 forbids Pending or Rejected amounts in any report total, yet FR-035 allows filtering to those statuses.

**Proposal:** every counterparty gets a line that always reconciles:

```text
opening (before from) + period (from..to) + later (after to) = current
```

- All four use only Approved expenses and payments, within the group and other-user filter, and **ignore the status filter**.
- `current` must equal `BalanceService`'s value for the same scope to the cent. With no group filter, it equals the overall balance.
- With no date filter, `opening` and `later` are $0.00 and `period = current`.

`NEEDS CLARIFICATION`: the customer may prefer something simpler.

### 4.8 Accounts and groups (FR-001–FR-008)

- **Register:** validate fields; check `username_key` for uniqueness (a unique constraint is the backstop); hash; insert. Password under 8 characters → message stating the minimum (Scenario 1.5).
- **Login:** load by key → if locked, `AccountLockedException` → verify hash → record failure or success in the same transaction. A wrong password or unknown username gives `AuthenticationFailedException` with one message. An unknown username still runs a hash.
- **Groups:** creating adds the creator as first member and admin. Adding a member is by username, by the admin only, with no consent step; invitations are Post-MVP. Non-admin add or remove → `AccessDeniedException` (Scenario 2.4). A failed exit guard → `BusinessRuleException` carrying the outstanding balance or pending item (Scenario 2.3).

---

## 5. Services

Full contracts: [contracts/service-contracts.md](contracts/service-contracts.md). Class diagram: [uml/service-class.puml](uml/service-class.puml).

| Interface (implementation) | Operations | Collaborators (constructor-injected) | FRs |
|---|---|---|---|
| `AccountService` (`DefaultAccountService`) | register, login, logout | `UserRepository`, `PasswordHasher`, `TransactionRunner`, `Clock` | FR-001, FR-002, FR-004 |
| `GroupService` (`DefaultGroupService`) | createGroup, renameGroup, addMember, removeMember, leaveGroup, listMyGroups, getGroupDetail | `GroupRepository`, `MembershipRepository`, `UserRepository`, `ExpenseRepository`, `LedgerReader`, `AccessPolicy`, `TransactionRunner`, `Clock` | FR-005–FR-008 |
| `ExpenseService` (`DefaultExpenseService`) | createExpense, updateExpense, deleteExpense, getExpense, listGroupExpenses, getReceipt | `ExpenseRepository`, `ReceiptRepository`, `MembershipRepository`, `ApprovalDecisionRepository`, `ExpenseDraftValidator`, `SplitAllocator`, `NotificationDispatcher`, `AccessPolicy`, `TransactionRunner`, `Clock` | FR-010–FR-017, FR-020 |
| `ApprovalService` (`DefaultApprovalService`) | approve, reject, listPendingForMe | `ExpenseRepository`, `ApprovalDecisionRepository`, `NotificationDispatcher`, `AccessPolicy`, `TransactionRunner`, `Clock` | FR-021–FR-024 |
| `BalanceService` (`DefaultBalanceService`) | myBalances, groupBalances | `LedgerReader`, `MembershipRepository`, `AccessPolicy`, `TransactionRunner` | FR-027–FR-029 |
| `PaymentService` (`DefaultPaymentService`) | recordPayment, paymentHistory | `PaymentRepository`, `LedgerReader`, `AccessPolicy`, `TransactionRunner`, `Clock` | FR-030–FR-033 |
| `NotificationService` (`DefaultNotificationService`) | unreadCount, list, markRead | `NotificationRepository`, `AccessPolicy`, `TransactionRunner`, `Clock` | FR-019 |
| `ReportService` (`DefaultReportService`) | filterOptions, generate | `ExpenseRepository`, `PaymentRepository`, `MembershipRepository`, `LedgerReader`, `ReportCalculator`, `AccessPolicy`, `TransactionRunner` | FR-034–FR-037 |

**Internal collaborators in `service`:**

| Class | Responsibility | FRs |
|---|---|---|
| `Session` | Identifies the signed-in user; only `service` can create one | FR-002, FR-003 |
| `AccessPolicy` | `requireActiveMember`, `requireAdmin`, `requireExpenseReadable`, `requireReceiptReadable`, and a scope query for groups visible to a user | FR-003, FR-006, FR-008, FR-014, FR-024, NFR-003 |
| `LedgerReader` | Runs `LedgerQueryRepository` and `BalanceCalculator`; shared by balance, payment, group, and report services | FR-007, FR-027, FR-032, FR-037 |
| `NotificationDispatcher` | Sole creator of notifications | FR-017, FR-023 |
| `PasswordHasher` (`Pbkdf2PasswordHasher`) | Hash and verify | FR-004, NFR-002 |
| `ExpenseDraftValidator` | Parses text and collects all `FieldError`s | FR-010, FR-013–FR-015, NFR-007 |
| `FieldFormats` | The one date pattern (`yyyy-MM-dd`, strict) and money display (`$1,234.50`), for parsing and rendering | FR-041 |

---

## 6. Repository interfaces

Full contracts: [contracts/repository-contracts.md](contracts/repository-contracts.md).

| Interface | Purpose | Note |
|---|---|---|
| `UserRepository` | Accounts, lockout state | Lookups by case-insensitive key |
| `GroupRepository` | Group header | |
| `MembershipRepository` | Join/leave history, active lookups | Never deletes rows |
| `ExpenseRepository` | Aggregate with shares | `updateStatusIfPending`, `updateIfVersionMatches`, `deleteIfPending` |
| `ReceiptRepository` | Receipt bytes | Separate from expense reads |
| `ApprovalDecisionRepository` | Decisions | **Insert and read only** |
| `PaymentRepository` | Payments | **Insert and read only** |
| `NotificationRepository` | Notifications | Only read state and snapshot refresh are mutable |
| `LedgerQueryRepository` | `LedgerEntry` projections | Read-only |
| `TransactionRunner` | Runs a unit of work atomically | Connection handling is hidden in `repository.jdbc` |

Decided expenses are protected in the repository too: `updateIfVersionMatches` and `deleteIfPending` include `status = PENDING` in their conditions.

---

## 7. User interface

### 7.1 Navigation

```text
Login ──▶ Register
  │ success
  ▼
Home ──┬─▶ Groups ──▶ Group Detail ──▶ Add Member / Remove / Leave / Rename
       │                    └────────▶ Group Balances
       ├─▶ New Expense (form; choose group first)
       ├─▶ Needs Approval ──▶ Expense Detail ──▶ Approve / Reject
       ├─▶ Balances ──▶ Record Payment (prefilled)
       ├─▶ Record Payment
       ├─▶ Payment History
       ├─▶ Notifications ──▶ Expense Detail
       └─▶ Reports
```

Expense Detail is also reachable from Group Detail, and shows shares, status, decision, and receipt.

**Steps from Home (NFR-007, at most 3):**

| Task | Path | Steps |
|---|---|---|
| Register | Login → Register. Home requires being signed in (SRC-09). | 1 from Login |
| Create group | Home → Groups → New Group | 2 |
| Create expense | Home → New Expense | 1 |
| Approve | Home → Needs Approval → select and open → Approve | 3 |
| Record payment | Home → Record Payment | 1 |
| Run report | Home → Reports | 1 |

### 7.2 Screens and controllers (AD-19)

Panels render and raise events. Controllers call services and pass results back. Neither makes a business decision: a controller never compares money, computes a share, or decides eligibility. Buttons such as Approve are enabled from fields on the view (`canDecide`) that the service computed. The service rechecks at the action.

| Panel | Controller | Displays | FRs |
|---|---|---|---|
| `LoginPanel`, `RegisterPanel` | `SessionController` | Credentials, errors | FR-001, FR-002 |
| `HomePanel` | `SessionController`, `NotificationController` | Unread count, pending count, net summary, navigation | FR-003, FR-019, NFR-007 |
| `GroupListPanel`, `GroupDetailPanel` | `GroupController` | Groups, members, admin actions | FR-005–FR-008 |
| `ExpenseFormPanel` | `ExpenseController` | Create/edit form, ordered participants, percent fields, receipt picker | FR-010–FR-016 |
| `ExpenseDetailPanel` | `ExpenseController`, `ApprovalController` | Shares in order, status, decision, actions | FR-012, FR-016, FR-021–FR-024 |
| `ReceiptViewerDialog` | `ExpenseController` | Decodes and shows the image; reports a corrupt file | FR-014 |
| `PendingApprovalsPanel` | `ApprovalController` | Expenses awaiting this user | FR-021 |
| `BalancesPanel`, `GroupBalancesPanel` | `BalanceController` | Net, direction, per-group lines | FR-027, FR-028 |
| `PaymentFormPanel` | `PaymentController` | Form and overpayment confirmation dialog | FR-030–FR-032 |
| `PaymentHistoryPanel` | `PaymentController` | Payments as payer and recipient | FR-033 |
| `NotificationsPanel` | `NotificationController` | List newest first, flag, mark read | FR-017, FR-019 |
| `ReportPanel` | `ReportController` | Filters, lines, totals, memo, reconciliation | FR-034–FR-037 |
| `MainFrame` | wired in `SplitSmartApp` | `CardLayout` host | NFR-007 |
| `UiTaskRunner` | (helper) | `SwingWorker` wrapper: background call, EDT callback, disables the triggering action while running | ID-03, NFR-004 |

### 7.3 Display and keyboard conventions

- **Formats (FR-041):** every date as `yyyy-MM-dd` and every amount as `$#,##0.00` through `FieldFormats`. Directions are shown in words, so no negative amounts appear.
- **Keyboard (NFR-008):**
  - Every action has a mnemonic or accelerator, and dialogs set default and cancel buttons.
  - Labels use `setLabelFor`, tab order follows the visual order, and `JTable` Enter opens the selected row.
  - The participant list reorders with Alt+Up and Alt+Down, and the receipt picker works through the keyboard-operable `JFileChooser`.
  - On a validation failure, focus moves to the first invalid field.
- **Manual testing:** keyboard behavior is not reasonably unit-testable, so Principle V's written manual steps apply.

---

## 8. Error strategy

| Type | When | UI behavior | Examples |
|---|---|---|---|
| `ValidationException(List<FieldError>)` | Bad input; all fields reported | Inline per-field, keep input, focus first | Amount over 2 decimals; percent total 95 (Scenarios 3.4, 3.5) |
| `AuthenticationFailedException` | Wrong credentials | One non-specific message | Scenario 1.3 |
| `AccountLockedException` | During lockout | "Temporarily locked" | Scenario 1.6 |
| `AccessDeniedException` | Not allowed, or group/record not visible | Generic refusal | Non-admin add; creator self-approval |
| `NotFoundException` | Referenced item gone, where the user was allowed to know of it | Message and refresh | Deleted pending expense |
| `ConflictException(ALREADY_DECIDED / STALE_VERSION)` | Concurrent change | Message and reload | Second approver |
| `BusinessRuleException(code, details)` | Valid input, rule refuses | Dialog naming the reason | Non-zero balance on exit; no eligible approver |
| `PersistenceFailureException` | Storage failure | Generic message; input preserved | Disk full |

Every message names the field or rule and how to fix it (NFR-007), and is written once in `service`, so the UI displays it without composing rule text. Message wording is not a rule, but centralizing it means a future client inherits it.

`PaymentOutcome` (`Recorded`, `OverpaymentWarning`) is a return value because a warning is a question for the user, not a failure.

---

## 9. Transaction boundaries (AD-09)

| Use case | One transaction contains | Failure leaves |
|---|---|---|
| Register | User insert | No account |
| Login | Two short transactions: read the user, then write lockout fields. Password verification runs between them. | Lockout unchanged |
| Add member | Membership insert | Unchanged |
| Exit group | Guard reads, membership end, optional admin change | Member still active |
| Create expense | Expense, shares, receipt, all notifications | Nothing saved, no notifications |
| Edit expense | Conditional update, share replacement, receipt change, notification refresh | Previous version intact |
| Delete expense | Conditional delete (receipt and shares cascade, notification link cleared) | Expense intact |
| Approve or reject | Conditional status update, decision insert, creator notification | Still Pending |
| Record payment | Owed read, payment insert | No payment |
| Reports and views | Single read transaction, for a consistent snapshot of totals | Nothing |

Password hashing and receipt reading run **outside** any transaction, to avoid holding locks during slow work.

---

## 10. Persistence mapping considerations (no migrations)

No schema files or migrations are created in this exercise. The logical mapping is in [data-model.md §4](data-model.md#4-persistence-mapping-proposal). Points for whoever implements it:

- Money columns are `DECIMAL(12,2)`, read through `Money.normalized`. Balances are not stored, so aggregate size is not limited by this precision.
- Percent columns are `DECIMAL(5,2)`.
- `Share.position` is required for reproducing FR-012.
- H2 has no partial indexes. One-active-membership needs a workaround, such as a generated column that is null for ended memberships plus a unique constraint (nulls are distinct). **Spike this; it has not been run.**
- Row mappers rebuild entities through a dedicated `rehydrate` factory, which rechecks invariants but must not apply creation-time rules such as "date not in the future" or "payer is a current member." Those can legitimately be different on a later read.

---

## 11. Traceability matrix

**Diagram keys:** D = domain-class, S = service-class, L = layer-component, E = expense-creation-approval, P = payment-settlement, N = notification. **V-nn** = proposed validation scenario in [quickstart.md](quickstart.md). "Auto" means planned JUnit 5 without UI; "Manual" means a written manual step (Principle V). **No tests exist yet.**

### 11.1 Customer requirements

| CR | Customer requirement | FRs | MVP status |
|---|---|---|---|
| CR-01 | User accounts | FR-001–FR-004 | Covered; password reset and profile editing Post-MVP (no FR yet, SRC-12) |
| CR-02 | Group management | FR-005–FR-009 | Covered; archive Post-MVP; invitations Post-MVP (no FR yet, SRC-12) |
| CR-03 | Expense creation | FR-010–FR-016 | Covered |
| CR-04 | Participants and balance effect | FR-010, FR-026 | Covered |
| CR-05 | Notifications | FR-017–FR-019 | Covered in-app; external Post-MVP |
| CR-06 | Approval before balance effect | FR-020–FR-025 | Single-level covered; multi-level Post-MVP |
| CR-07 | Balance tracking | FR-026–FR-029 | Covered |
| CR-08 | Payment tracking | FR-030–FR-033 | Covered |
| CR-09 | Reporting | FR-034–FR-038 | Covered; saved reports and export Post-MVP |
| CR-10 | Primarily web-based | FR-039 | **NOT MET by the MVP. OC-1 open. See also SRC-01.** |

### 11.2 Functional requirements

| FR | CR | Scope | Domain | Service / contract | UI | UML | Validation |
|---|---|---|---|---|---|---|---|
| FR-001 | CR-01 | MVP | `User`, `Username`, `PasswordHash` | `AccountService.register` | `RegisterPanel` | D, S | V-01 Auto |
| FR-002 | CR-01 | MVP | `User` | `AccountService.login`, `logout` | `LoginPanel` | D, S | V-02 Auto |
| FR-003 | CR-01 | MVP | n/a | `AccessPolicy`; all read operations | all panels | S, L | V-03 Auto |
| FR-004 | CR-01 | MVP | `PasswordHash` | `PasswordHasher` | `JPasswordField` use | D, S | V-01 Auto |
| FR-005 | CR-02 | MVP | `Group`, `Membership` | `GroupService.createGroup` | `GroupListPanel` | D, S | V-04 Auto |
| FR-006 | CR-02 | MVP | `Membership` | `GroupService.addMember`, `removeMember`, `leaveGroup` | `GroupDetailPanel` | D, S | V-04 Auto |
| FR-007 | CR-02 | MVP | `BalanceSheet` | `GroupService.removeMember`, `leaveGroup`; `LedgerReader` | `GroupDetailPanel` | S | V-05 Auto |
| FR-008 | CR-02 | MVP | `Group` | `GroupService.listMyGroups`, `getGroupDetail`, `renameGroup` | `GroupListPanel`, `GroupDetailPanel` | D, S | V-04 Auto |
| FR-009 | CR-02 | Post-MVP | `GroupStatus` (reserved) | None in MVP | None | L note | Not in MVP |
| FR-010 | CR-03, CR-04 | MVP | `Expense`, `Money` | `ExpenseService.createExpense`; `ExpenseDraftValidator` | `ExpenseFormPanel` | D, S, E | V-06, V-07 Auto |
| FR-011 | CR-03 | MVP | `SplitAllocator`, `Money` | `ExpenseService.createExpense` | n/a | D, E | V-06 Auto |
| FR-012 | CR-03 | MVP | `SplitAllocator`, `Share` | `ExpenseService.createExpense` | `ExpenseFormPanel` ordering | D, E | V-06 Auto |
| FR-013 | CR-03 | MVP | `SplitAllocator`, `Percentage` | `ExpenseService.createExpense` | `ExpenseFormPanel` | D, E | V-06, V-07 Auto |
| FR-014 | CR-03 | MVP | `ReceiptImage` | `ExpenseService.getReceipt`; `ReceiptRepository` | `ReceiptViewerDialog` | D, S, E | V-08 Auto + Manual |
| FR-015 | CR-03 | MVP | n/a | `ExpenseDraftValidator`; `ValidationException` | `ExpenseFormPanel` | S, E | V-07 Auto + Manual |
| FR-016 | CR-03 | MVP | `Expense.revise` | `ExpenseService.updateExpense`, `deleteExpense` | `ExpenseDetailPanel` | D, S, E | V-09 Auto |
| FR-017 | CR-05 | MVP | `Notification` | `NotificationDispatcher` | `NotificationsPanel` | D, S, E, N | V-10 Auto |
| FR-018 | CR-05 | Post-MVP | None | None in MVP | None | L note | Not in MVP |
| FR-019 | CR-05 | MVP | `Notification` | `NotificationService` | `HomePanel`, `NotificationsPanel` | S, N | V-11 Auto + Manual |
| FR-020 | CR-06 | MVP | `Expense`, `ExpenseStatus` | `ExpenseService.createExpense`; `LedgerQueryRepository` | n/a | D, E | V-12 Auto |
| FR-021 | CR-06 | MVP | `Expense.isEligibleApprover` | `ApprovalService.approve`, `reject` | `PendingApprovalsPanel`, `ExpenseDetailPanel` | D, S, E | V-13 Auto |
| FR-022 | CR-06 | MVP | `Expense.isEligibleApprover` | `ApprovalService` | `ExpenseDetailPanel` | D, E | V-13 Auto |
| FR-023 | CR-06 | MVP | `ApprovalDecision`, `Notification` | `ApprovalService.reject`; `NotificationDispatcher` | `ExpenseDetailPanel` | D, E, N | V-13 Auto |
| FR-024 | CR-06 | MVP | `ApprovalDecision` | `ApprovalDecisionRepository`; `ExpenseService.getExpense` | `ExpenseDetailPanel` | D, E | V-14 Auto |
| FR-025 | CR-06 | Post-MVP | None | None in MVP | None | L note | Not in MVP |
| FR-026 | CR-07, CR-04 | MVP | `Expense.ledgerEntries`, `LedgerEntry` | `LedgerReader` | n/a | D, S | V-15 Auto |
| FR-027 | CR-07 | MVP | `BalanceCalculator`, `BalanceSheet`, `PairBalance` | `BalanceService` | `BalancesPanel` | D, S, P | V-15 Auto |
| FR-028 | CR-07 | MVP | `BalanceSheet` | `BalanceService.myBalances` | `BalancesPanel` | S | V-15 Auto + Manual |
| FR-029 | CR-07 | MVP | `BalanceCalculator`, `UserPair` | `LedgerReader` | n/a | D | V-16 Auto |
| FR-030 | CR-08 | MVP | `Payment`, `Money` | `PaymentService.recordPayment` | `PaymentFormPanel` | D, S, P | V-17 Auto |
| FR-031 | CR-08 | MVP | `Payment.ledgerEntry` | `PaymentService.recordPayment` | n/a | D, P | V-17 Auto |
| FR-032 | CR-08 | MVP | `BalanceSheet` | `PaymentService.recordPayment`; `PaymentOutcome` | `PaymentFormPanel` | S, P | V-18 Auto + Manual |
| FR-033 | CR-08 | MVP | `Payment` | `PaymentService.paymentHistory` | `PaymentHistoryPanel` | S, P | V-17 Auto |
| FR-034 | CR-09 | MVP | `ReportCalculator`, `Report` | `ReportService.generate` | `ReportPanel` | D, S | V-19 Auto |
| FR-035 | CR-09 | MVP | `ReportFilter` | `ReportService.generate`, `filterOptions` | `ReportPanel` | D, S | V-19 Auto |
| FR-036 | CR-09 | MVP | `ReportTotals`, `CounterpartyNetLine` | `ReportService.generate` | `ReportPanel` | D, S | V-20 Auto |
| FR-037 | CR-09 | MVP | `ReportCalculator`, `BalanceCalculator` | `ReportService`, `LedgerReader` | n/a | D, S | V-20 Auto |
| FR-038 | CR-09 | Post-MVP | `ReportFilter` (value only) | None in MVP | None | L note | Not in MVP |
| FR-039 | CR-10 | Post-MVP | None | None in MVP | None | L note | Not in MVP; OC-1 |
| FR-040 | none cited (SRC-05) | MVP | All entities | All repositories; `TransactionRunner` | n/a | L | V-21 Auto + Manual |
| FR-041 | none cited (SRC-05) | MVP | `Money` | `FieldFormats` | All panels | S | V-22 Auto + Manual |

### 11.3 Non-functional requirements

| NFR | Design response | Elements | Validation |
|---|---|---|---|
| NFR-001 Accuracy | Exact `Money`; derived balances | `Money`, `SplitAllocator`, `BalanceCalculator` | V-06, V-15, V-16 Auto |
| NFR-002 Security | Hashing, persisted lockout | `PasswordHasher`, `User` | V-02 Auto |
| NFR-003 Privacy | Service-level authorization | `AccessPolicy` | V-03 Auto |
| NFR-004 Performance | §8.5 of architecture | Indexes, `UiTaskRunner` | V-23 Benchmark; **unmeasured** |
| NFR-005 Reliability | Atomic commits, embedded database | `TransactionRunner`, `repository.jdbc` | V-21 Auto + Manual |
| NFR-006 Auditability | Append-only interfaces | `ApprovalDecisionRepository`, `PaymentRepository` | V-14 Auto |
| NFR-007 Usability | Field errors; three-step navigation | `FieldError`, `HomePanel` | V-07 Auto; V-24 Manual |
| NFR-008 Accessibility | Keyboard conventions (§7.3) | All panels | V-24 Manual |
| NFR-009 Testability | Pure calculators; constructor injection; `Clock` | `domain`, `service`, AD-22 | V-25 build gate |

### 11.4 Production class traceability

| Class group | FR coverage |
|---|---|
| `Money`, `Percentage` | FR-010–FR-013, FR-030, FR-041 |
| `User`, `Username`, `PasswordHash`, `PasswordHasher`, `Pbkdf2PasswordHasher` | FR-001, FR-002, FR-004 |
| `Group`, `Membership`, `GroupStatus` | FR-005–FR-008, FR-009 reserved |
| `Expense`, `Share`, `SplitRequest`, `EqualSplit`, `PercentageSplit`, `ParticipantPercentage`, `SplitAllocator`, `SplitMethod`, `ExpenseStatus` | FR-010–FR-013, FR-016, FR-020, FR-021 |
| `ReceiptImage`, `ReceiptMediaType`, `ReceiptRepository` | FR-014 |
| `ApprovalDecision`, `DecisionOutcome` | FR-021–FR-024 |
| `LedgerEntry`, `UserPair`, `PairBalance`, `BalanceCalculator`, `BalanceSheet`, `LedgerReader`, `LedgerQueryRepository` | FR-026–FR-029, FR-031, FR-037 |
| `Payment`, `PaymentOutcome` | FR-030–FR-033 |
| `Notification`, `NotificationType`, `NotificationDispatcher` | FR-017, FR-019, FR-023 |
| `ReportFilter`, `Report`, `ReportTotals`, `CounterpartyNetLine`, `StatusMemoLine`, `ReportExpenseLine`, `ReportPaymentLine`, `ReportCalculator` | FR-034–FR-037 |
| ID records | FR-040 (persistent identity) |
| `TransactionRunner`, `repository.jdbc.*`, `SplitSmartApp` | FR-040, NFR-005; wiring for all FRs |
| `ServiceException` family, `FieldError` | FR-015, NFR-007 |
| `MainFrame`, `UiTaskRunner` | NFR-004, NFR-007, ID-03 |
