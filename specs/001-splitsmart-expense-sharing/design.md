# SplitSmart Detailed Design

**Status**: Draft — Reconciliation Incomplete. **Date**: 2026-11-05
**Companions:** [spec.md](spec.md) · [architecture.md](../../docs/architecture/architecture.md) · [data-model.md](data-model.md) · [contracts](contracts/README.md) · [UML](../../docs/uml/README.md)

The MVP is a Swing desktop application and **does not satisfy CR-10** ([DEC-01](decisions/decision-log.md#dec-01-platform-oc-1)). Labels: **Mandated** comes from the constitution or spec. **Proposed** is adopted here and awaits confirmation.

## 1. Domain concepts

| Kind | Types | Status |
|---|---|---|
| Entities | `User`, `Group`, `Membership`, `Expense`, `ApprovalDecision`, `Payment`, `Notification` | Mandated by Principle III and spec Key Entities |
| Money | `Money`, `Percentage` | Mandated by Principle IV |
| Identity | `UserId`, `GroupId`, `MembershipId`, `ExpenseId`, `DecisionId`, `PaymentId`, `NotificationId` | Proposed |
| Value objects | `Username`, `PasswordHash`, `Share`, `Receipt`, `LedgerEntry`, `UserPair`, `PairBalance` | Proposed |
| Split input | Sealed `SplitRequest`: `EqualSplit`, `PercentageSplit`, with `ParticipantPercentage` | Proposed |
| Enums | `SplitMethod`, `ExpenseStatus`, `DecisionOutcome`, `GroupStatus`, `NotificationType`, `ReceiptMediaType` | Spec values; names proposed |
| Calculators | `SplitAllocator`, `BalanceCalculator` (produces `BalanceSheet`), `ReportCalculator` | Proposed; pure, no I/O |
| Report types | `ReportFilter`, `Report`, `ReportTotals`, `CounterpartyNetLine`, `StatusMemoLine`, `ReportExpenseLine`, `ReportPaymentLine` | Proposed; derived |
| Failure | `DomainRuleViolation`, an invariant breach translated by services | Proposed |

Field-level detail and invariants are in [data-model.md](data-model.md). Class diagrams: [domain-class](../../docs/uml/domain-class.puml), [service-class](../../docs/uml/service-class.puml).

## 2. Money and split calculation

### `Money`

| Method | Rounding | Used for |
|---|---|---|
| `Money.parseStrict(text)` | None. Accepts digits with up to 2 decimals (`\d+(\.\d{1,2})?`). Refuses signs, separators, symbols, exponents | Entered amounts |
| `Money.ofCents(long)`, `toCents()` | Exact | Repository boundary |
| `Money.normalized(BigDecimal)` | `HALF_EVEN` to scale 2 | Any other normalization; no MVP calculation reaches it (DEC-06) |
| `floorDividedBy(int)` | `FLOOR` to scale 2 | FR-011 |
| `floorPercent(Percentage)` | `FLOOR` to scale 2 | FR-013. Scale-2 amount × scale-2 percent ÷ 100 is exact at scale 6 before flooring |
| `plus`, `minus`, `times(int)`, `negated` | Exact | Sums and leftovers |
| `compareTo` | Compares values | Equality per Principle IV |

Range checks on entered amounts sit in validators against `Money.MAX_ENTERED` (1,000,000.00), because balances may legitimately be larger or negative. `BigDecimal` cannot overflow. The largest total, 10,000 × 100,000,000 cents, is about 10¹² cents and fits `INTEGER` storage for any SQL sum.

### `SplitAllocator`

1. **Equal:** `base = amount.floorDividedBy(n)`. **Percentage:** `floor_i = amount.floorPercent(pct_i)`.
2. `leftoverCents = (amount − Σ floors) ÷ 0.01`.
3. The first `leftoverCents` participants in listed order get 0.01 more, regardless of percentage (BR-06).

**One pass is always enough.** Each floor loses under one cent, so the leftover is smaller than the number of participants. Worked vectors are in the [spec](spec.md#worked-split-examples) and are test data for UT-02 and UT-03.

## 3. Business-rule enforcement

The spec's [business rules](spec.md#business-rules) define each rule. This table names who enforces it and which test checks it.

| Rule | Enforcing component | Backstop | Validation |
|---|---|---|---|
| BR-01 payer | `ExpenseDraftValidator` (default); `DefaultExpenseService` VALIDATE (active) | | SI-06 |
| BR-02 participants | `ExpenseDraftValidator` (distinct, order); `DefaultExpenseService` VALIDATE (active) | Unique `(expense_id, participant_id)` | SI-06, RP-01 |
| BR-03 non-creator participant | `Expense.create`, `Expense.revise` | | UT-04, SI-06 |
| BR-04 equal split | `SplitAllocator`, `Money.floorDividedBy` | | UT-02 |
| BR-05 percentage split | `Percentage`, `ExpenseDraftValidator`, `SplitAllocator` | Check on percent range | UT-03, SI-06 |
| BR-06 leftovers | `SplitAllocator` | `Expense` invariant E1 | UT-02, UT-03 |
| BR-07 zero share | `Expense.ledgerEntries`, `LedgerQueryRepository` | | UT-02, UT-05, RP-06 |
| BR-08 Pending no effect | `Expense.ledgerEntries`, `LedgerQueryRepository` | | UT-04, SI-07, RP-06 |
| BR-09 eligibility | `Expense.isEligibleApprover`, `AccessPolicy.requireEligibleApprover` | | UT-04, SI-05 |
| BR-10 one decision | `Expense.approve`, `Expense.reject`, `ExpenseRepository.updateStatusIfPending` | Unique decision; triggers | UT-04, SI-05, SI-11, RP-05 |
| BR-11 edit and delete | `Expense.revise`, `DefaultExpenseService`, conditional repository operations | Trigger on decided expense | UT-04, SI-06, RP-05 |
| BR-12 debt direction | `Expense.ledgerEntries`, `BalanceCalculator` | | UT-05, RP-06 |
| BR-13 netting | `BalanceCalculator`, `BalanceSheet` | | UT-05, SI-07 |
| BR-14 payment | `DefaultPaymentService`, `Payment` | Checks on amount and parties | SI-08, RP-01 |
| BR-15 overpayment | `DefaultPaymentService`, `LedgerReader.owedBy` | | SI-08, UI-08 |
| BR-16 payment visibility | `DefaultPaymentService.paymentHistory` | | SI-08, SEC-03 |
| BR-17 notification content and audience | `NotificationDispatcher.expenseCreated`, `DefaultNotificationService` (flag) | | SI-09 |
| BR-18 other notification events | `NotificationDispatcher.expenseEdited`, `expenseDecided` | FK `SET NULL` on delete | SI-09 |
| BR-19 report lines | `ExpenseRepository.findForReport`, `PaymentRepository.findForReport`, `AccessPolicy.visibleScope` | | SI-10, SEC-03 |
| BR-20 report totals | `ReportCalculator` | | UT-07, SI-10 |
| BR-21 reconciliation | `ReportCalculator`, `LedgerReader` | | UT-07, SI-10 |
| BR-22 exit guard | `GroupExitPolicy` | | SI-04 |
| BR-23 succession | `DefaultGroupService.leaveGroup`, `Group.assignAdmin` | | SI-04 |
| BR-24 rejoin | `DefaultGroupService.addMember` | Partial unique index | SI-04, RP-01 |
| BR-25 former members | `AccessPolicy` | | SEC-03 |
| BR-26 lockout | `User`, `DefaultAccountService.login` | Check on count | UT-06, SI-02, RP-02 |
| BR-27 amount entry | `Money.parseStrict`, validators | Check on cents range | UT-01, SI-06, SI-08 |
| BR-28 receipt | `ReceiptInspector` in `service`; `DefaultExpenseService`; `ReceiptViewerDialog` for dimensions | Check on size | UT-10, SI-06, SEC-04 |
| BR-29 usernames and text | `Username`, validators | Unique `username_key` | UT-09, SI-01, RP-01 |
| BR-30 dates | `FieldFormats`, validators with injected `Clock` | | UT-08, SI-06, SI-08 |

## 4. Business flows

All mutating flows follow the [canonical order](decisions/decision-log.md#dec-26-canonical-operation-order): PREPARE, BEGIN, AUTHORIZE, VALIDATE, GUARD, EFFECT, COMMIT.

### Expense creation

Diagrams: [sequence](../../docs/uml/expense-approval-sequence.puml), [activity](../../docs/uml/create-expense-activity.puml).

1. **PREPARE:** `ExpenseDraftValidator` parses all fields and collects `FieldError`s. `ReceiptInspector` reads at most 5,242,881 bytes and checks the file.
2. **BEGIN**, then **AUTHORIZE:** `requireActiveMember(session, group)`.
3. **VALIDATE:** Add errors for a payer or participant who is not active. Throw `ValidationException` if any exists.
4. **EFFECT:** `SplitAllocator.allocate`, `Expense.create` (Pending), insert expense, shares, receipt. `NotificationDispatcher.expenseCreated`.
5. **COMMIT** and return `ExpenseDetailView`. Balances are unchanged.

### Edit and delete

**Edit:** AUTHORIZE creator. VALIDATE as for creation. GUARD through `updateIfVersionMatches`, which is false if decided or stale. EFFECT recomputes shares, applies `ReceiptChange`, and calls `NotificationDispatcher.expenseEdited(expense, addedParticipants)`.

**Delete:** AUTHORIZE creator. GUARD through `deleteIfPending`. No new notification (DEC-16).

### Approval and rejection

Diagrams: [sequence](../../docs/uml/expense-approval-sequence.puml), [activity](../../docs/uml/approve-or-reject-expense-activity.puml), [state](../../docs/uml/expense-state.puml).

1. **PREPARE:** Reason length.
2. **BEGIN, AUTHORIZE:** Load the expense; not visible gives `NotFoundException`. `requireEligibleApprover`, which refuses the creator (FR-022).
3. **VALIDATE:** Throw on reason errors.
4. **GUARD:** Not Pending gives `ConflictException(ALREADY_DECIDED)`. A different version gives `ConflictException(STALE_VERSION)`.
5. **EFFECT:** `expense.approve` or `expense.reject`, then `updateStatusIfPending`. Zero rows updated gives `ALREADY_DECIDED`. Insert the decision. `NotificationDispatcher.expenseDecided`.
6. **COMMIT:** This is the moment an Approved expense enters balances. There is no balance row to update.

### Balances

`LedgerReader` gets entries from `LedgerQueryRepository` and `BalanceCalculator` folds them into a `BalanceSheet`.

- `myBalances` lists each counterparty with net, direction (`OWES_ME`, `I_OWE`, `SETTLED`), and a per-group breakdown. Pairs with any history and a $0.00 net show as settled.
- `groupBalances` lists all pairs in a group for any active member. It supports Story 5 scenario 1, where sam sees that jo owes alex.

### Payment

Diagrams: [sequence](../../docs/uml/payment-settlement-sequence.puml), [activity](../../docs/uml/record-payment-activity.puml).

1. **PREPARE:** Parse amount, date, note. Self-payment is an error.
2. **BEGIN, AUTHORIZE:** The payer is an active member of the group.
3. **VALIDATE:** Recipient is an active member. Throw if any error exists.
4. **GUARD:** `owedNow = LedgerReader.owedBy(payer, recipient, group)`. If `amount > owedNow` and `acknowledgedOwed` is absent or differs, roll back and return `OverpaymentWarning(owedNow, attempted)`.
5. **EFFECT:** Insert `Payment` with `overpaymentConfirmed` set if the guard fired. Commit, and the balance changes because it is derived (FR-031).

### Notifications

Diagram: [sequence](../../docs/uml/notification-sequence.puml). Creation happens only in `NotificationDispatcher`. `NotificationService` handles reads and read marks. Rules: BR-17, BR-18, BR-25.

### Reports

Diagram: [activity](../../docs/uml/generate-report-activity.puml).

1. **PREPARE:** Parse dates; `from` after `to` is an error.
2. **`readOnly`:** `AccessPolicy.visibleScope(session)`. A group filter outside the scope gives `NotFoundException`.
3. Fetch expense rows, payment rows, and the user's ledger entries within the group and other-user filters.
4. `ReportCalculator.calculate` computes lines, totals, memo, and counterparty lines. It splits each counterparty's entries by date into opening, period, and later, and ignores the status filter for nets.

### Group exit

Diagram: [state](../../docs/uml/membership-state.puml). `GroupExitPolicy.checkExit(groupId, userId)` uses `LedgerReader.sheetInvolving` and `ExpenseRepository.findPendingInvolving`. Any failure gives `BusinessRuleException(MEMBER_HAS_BALANCE or MEMBER_IN_PENDING_EXPENSE, details)`. On a successful admin departure, `leaveGroup` picks the next admin from `listActiveMembers` order.

### Authentication

Diagrams: [sequence](../../docs/uml/authentication-lockout-sequence.puml), [state](../../docs/uml/authentication-state.puml).

`login` deviates from the canonical order on purpose. A short read finds the user. If locked, it raises `AccountLockedException` without hashing. Verification runs outside any transaction. A second transaction writes the login state and **commits**, and only then is `AuthenticationFailedException` raised. Raising inside the transaction would roll back the count and disable lockout. Set A found this defect during its own review.

## 5. Services

Full contracts: [service-contracts.md](contracts/service-contracts.md).

| Interface (implementation) | Collaborators by constructor | FRs |
|---|---|---|
| `AccountService` (`DefaultAccountService`) | `UserRepository`, `PasswordHasher`, `TransactionRunner`, `Clock` | FR-001, FR-002, FR-004 |
| `GroupService` (`DefaultGroupService`) | `GroupRepository`, `MembershipRepository`, `UserRepository`, `GroupExitPolicy`, `AccessPolicy`, `TransactionRunner`, `Clock` | FR-005 to FR-008 |
| `ExpenseService` (`DefaultExpenseService`) | `ExpenseRepository`, `ReceiptRepository`, `MembershipRepository`, `ApprovalDecisionRepository`, `ExpenseDraftValidator`, `ReceiptInspector`, `SplitAllocator`, `NotificationDispatcher`, `AccessPolicy`, `TransactionRunner`, `Clock` | FR-010 to FR-017, FR-020 |
| `ApprovalService` (`DefaultApprovalService`) | `ExpenseRepository`, `ApprovalDecisionRepository`, `NotificationDispatcher`, `AccessPolicy`, `TransactionRunner`, `Clock` | FR-021 to FR-024 |
| `BalanceService` (`DefaultBalanceService`) | `LedgerReader`, `MembershipRepository`, `AccessPolicy`, `TransactionRunner` | FR-027 to FR-029 |
| `PaymentService` (`DefaultPaymentService`) | `PaymentRepository`, `LedgerReader`, `AccessPolicy`, `TransactionRunner`, `Clock` | FR-030 to FR-033 |
| `NotificationService` (`DefaultNotificationService`) | `NotificationRepository`, `AccessPolicy`, `TransactionRunner`, `Clock` | FR-017, FR-019 |
| `ReportService` (`DefaultReportService`) | `ExpenseRepository`, `PaymentRepository`, `MembershipRepository`, `LedgerReader`, `ReportCalculator`, `AccessPolicy`, `TransactionRunner`, `Clock` | FR-034 to FR-037 |

| Internal collaborator | Responsibility | Requirement |
|---|---|---|
| `Session` | Identifies the signed-in user; created only in `service` | FR-002, FR-003 |
| `AccessPolicy` | Session, membership, admin, readability, eligibility, and `visibleScope` | FR-003, FR-006, FR-014, FR-021, NFR-003 |
| `LedgerReader` | Shared balance read path | FR-007, FR-027, FR-032, FR-037 |
| `GroupExitPolicy` | The exit guard | FR-007 |
| `NotificationDispatcher` | Sole creator of notifications | FR-017, FR-023 |
| `PasswordHasher` (`Pbkdf2PasswordHasher`) | Hash and verify | FR-004, NFR-002 |
| `ExpenseDraftValidator` | Parses text; collects `FieldError`s | FR-010, FR-013, FR-015, NFR-007 |
| `ReceiptInspector` | Size, signature, trailer; no AWT | FR-014, DEC-25 |
| `FieldFormats` | Date pattern and money display | FR-041 |

## 6. Repositories

Full contracts: [repository-contracts.md](contracts/repository-contracts.md). Repositories check data integrity only. Business rules and authorization belong above them. Their conditional operations are concurrency safeguards. `ApprovalDecisionRepository` and `PaymentRepository` have **no update or delete**. `ExpenseRepository` has **no unconditional update or delete**.

Constraints and indexes are in [data-model.md §5](data-model.md#5-persistence-model-sqlite-proposed).

## 7. User interface

Full contracts: [ui-interactions.md](contracts/ui-interactions.md). Panels render and raise events. Controllers call services through `UiTaskRunner` and pass results back. Neither makes a business decision. A control's enabled state comes from fields the service computed (`canEdit`, `canDecide`, `canManage`), and the service rechecks at the action.

## 8. Errors

| Type | When | UI behavior |
|---|---|---|
| `ValidationException(List<FieldError>)` | Bad input; all fields together | Inline per field, input kept, focus on the first |
| `AuthenticationFailedException` | Wrong credentials | One non-specific message |
| `AccountLockedException(lockedUntil)` | During a lock | "Temporarily locked" |
| `AccessDeniedException` | Session invalid, or record visible but action not permitted | Generic refusal |
| `NotFoundException` | Does not exist, or not visible; identical either way | Message and refresh |
| `ConflictException(ALREADY_DECIDED, STALE_VERSION)` | State changed first | Message and reload |
| `BusinessRuleException(code, details)` | Valid input, rule refuses | Dialog naming the reason |
| `PersistenceFailureException` | Storage failure; rolled back | Generic message, input kept |

Each message names the field or rule and how to fix it (NFR-007). It is written once, in `service`, so the UI displays it without composing rule text. `PaymentOutcome` is a return value, not an error.

## 9. Transaction boundaries

| Use case | One transaction contains | On failure |
|---|---|---|
| Register | User insert (hash computed before) | No account |
| Login | Read; then, after verify, a separate login-state write that commits before any exception | Lockout state stays correct |
| Create group | Group and first membership | No group |
| Add member | Membership insert | Unchanged |
| Exit group | Guard reads, membership end, optional admin change | Still a member |
| Create expense | Expense, shares, receipt, all notifications | Nothing saved |
| Edit expense | Conditional update, share replacement, receipt change, notification changes | Prior version intact |
| Delete expense | Conditional delete | Expense intact |
| Approve or reject | Conditional status update, decision, creator notification | Still Pending |
| Record payment | Owed read, payment insert | No payment |
| Mark read | Update of own rows | Unchanged |
| Reports and multi-figure views | One read scope | Nothing |
