# Service Contracts (`ui` → `service`)

**Status**: Draft. AI-generated; not human reviewed.

Conventions and the error model are in [README.md](README.md). All failures below use those exception
types. `VE` = `ValidationException`, `AE` = `AuthorizationException`, `NF` = `NotFoundException`,
`CE` = `ConflictException`. `NC-n` marks a working default that is still an open question
([research.md](../research.md#unresolved-questions)).

## AccountService

| Operation | Inputs | Output | Validation and failures | Authorization | FR/NFR |
|-----------|--------|--------|-------------------------|---------------|--------|
| `register` | username, displayName, password | UserSummary | VE: username 3 to 30 characters; username taken, ignoring case; display name missing; password under 8 characters | None (visitor) | FR-001, FR-004 |
| `login` | username, password | UserSummary | `AuthenticationFailedException` with an identical message for unknown username and wrong password. `AccountLockedException` during a lock, even with the correct password | None (visitor) | FR-002, NFR-002 |
| `findUserByUsername` | actor, username | UserSummary | NF if there is no exact match, ignoring case | Any signed-in user. Exact match only; no browsing of all users | FR-006 |

- Login side effects, in one transaction: count a failure and possibly start a lock, or reset the count.
  **The failure exception is raised only after that transaction commits.** Raising it inside would roll
  back the count, and the lockout would never trigger.
- Passwords are never returned or logged. `UserSummary` has only ID, username, and display name.
- Logout is a UI session action and needs no service call (FR-002; see
  [ui-interactions.md](ui-interactions.md)).

## GroupService

| Operation | Inputs | Output | Validation and failures | Authorization | FR |
|-----------|--------|--------|-------------------------|---------------|----|
| `createGroup` | actor, name | GroupSummary | VE: name 1 to 50 characters | Any signed-in user. Actor becomes admin and first member | FR-005 |
| `renameGroup` | actor, groupId, name | GroupSummary | VE: name 1 to 50 characters | Admin only | FR-008 |
| `addMember` | actor, groupId, userId | MemberSummary | NF: unknown user. CE: already a current member | Admin only | FR-006 |
| `removeMember` | actor, groupId, userId | None | CE with the outstanding balance if member net is not $0.00 (FR-007, NC-6). Pending-expense rule: NC-4. Removing the admin: NC-5 | Admin only | FR-006, FR-007 |
| `leaveGroup` | actor, groupId | None | Same checks as `removeMember` for the actor | Current member | FR-006, FR-007 |
| `listMyGroups` | actor | List of GroupSummary | None | Own current memberships only | FR-003, FR-008 |
| `getGroupDetail` | actor, groupId | GroupDetail (name, admin, current members) | NF if not visible | Current member | FR-003, FR-008 |

- A former member's visibility follows NC-3.
- `archiveGroup` is **not** in the MVP (FR-009, Post-MVP).

## ExpenseService

`ExpenseInput` holds: groupId, amountText, dateText, description, payerId (empty means the creator),
ordered participant IDs, splitMethod, percentage text per participant (percentage only), and an optional
`ReceiptUpload` (file name and bytes).

| Operation | Inputs | Output | Validation and failures | Authorization | FR |
|-----------|--------|--------|-------------------------|---------------|----|
| `createExpense` | actor, ExpenseInput | ExpenseDetail with status PENDING | VE lists every invalid field; see rules below | Actor is a current member of the group | FR-010 to FR-015, FR-017, FR-020 |
| `editPendingExpense` | actor, expenseId, expectedVersion, ExpenseInput | ExpenseDetail with new version | Same VE rules. CE: not Pending, or stale version | Creator only | FR-016 |
| `deletePendingExpense` | actor, expenseId, expectedVersion | None | CE: not Pending, or stale version | Creator only | FR-016 |
| `getExpense` | actor, expenseId | ExpenseDetail (shares in saved order, decision if any, `canDecide` for actor) | NF if not visible | Current member, or per NC-3 | FR-003, FR-024 |
| `listGroupExpenses` | actor, groupId, optional status | List of ExpenseSummary | NF if not visible | Current member, or per NC-3 | FR-003 |
| `getReceipt` | actor, expenseId | ReceiptImage, or empty | NF if not visible | Current group member | FR-014 |

**ExpenseInput validation (all reported together, FR-015):**

| Field | Rule |
|-------|------|
| amountText | Parses exactly; greater than 0; at most 1,000,000.00; at most 2 decimals. Never rounded |
| dateText | `yyyy-MM-dd`; not later than today |
| description | 1 to 200 characters |
| payerId | Current group member |
| participants | At least one; no duplicates; all current members; at least one other than the creator |
| splitMethod | EQUAL or PERCENTAGE |
| percentages | PERCENTAGE only: one per participant; 0.00 to 100.00; at most 2 decimals; total exactly 100.00 |
| receipt | Optional; JPEG or PNG by file content; at most 5 MB |

**Effects of `createExpense`, in one transaction:** allocate shares with `SplitAllocator`, save the
expense, shares, and receipt, and notify through `NotificationService`. Balances do not change.

**Effects of an edit:** recalculate shares and increase the version. Notification behavior on edit and
delete is NC-9.

## ApprovalService

| Operation | Inputs | Output | Validation and failures | Authorization | FR |
|-----------|--------|--------|-------------------------|---------------|----|
| `approve` | actor, expenseId, expectedVersion, optional reason | ApprovalDecisionView | CE: not Pending, or stale version | Eligible approver | FR-021, FR-022, FR-024 |
| `reject` | actor, expenseId, expectedVersion, reason | ApprovalDecisionView | VE: reason 1 to 200 characters. CE: not Pending, or stale version | Eligible approver | FR-021 to FR-024 |
| `listAwaitingMyDecision` | actor | List of ExpenseSummary | None | Own items only | FR-021 |

- **Eligible approver**: A participant other than the creator, and a current member. Otherwise AE,
  including when the actor is the creator (FR-022).
- **Effects, in one transaction**: Conditional status update, insert the immutable decision, and notify
  the creator. If the conditional update finds the expense already decided, the result is CE, the "first
  decision wins" rule.
- Only `approve` can make an expense count toward balances.

## NotificationService

| Operation | Inputs | Output | Validation and failures | Authorization | FR |
|-----------|--------|--------|-------------------------|---------------|----|
| `listMine` | actor | List of NotificationView, newest first, each with computed `needsApproval` | None | Own only | FR-017, FR-019 |
| `unreadCount` | actor | Integer | None | Own only | FR-019 |
| `markRead` | actor, notificationId | None | NF if it is not the actor's | Own only | FR-019 |
| `notifyExpenseCreated` | expense | None | Internal; joins the caller's transaction | Called by `ExpenseService` | FR-017 |
| `notifyExpenseDecided` | expense, decision | None | Internal; joins the caller's transaction | Called by `ApprovalService` | FR-023 |

- `notifyExpenseCreated` sends to every **current** group member except the creator, so removed members
  get nothing (Story 7 scenario 4).
- `notifyExpenseCreated` and `notifyExpenseDecided` are not for UI use.
- No delivery outside the app (FR-018, Post-MVP).

## BalanceService

| Operation | Inputs | Output | Validation and failures | Authorization | FR |
|-----------|--------|--------|-------------------------|---------------|----|
| `getMyBalances` | actor | List of PairBalance: other user, overall net and direction, per-group amounts adding up to it | None | Only pairs involving the actor | FR-027, FR-028, NFR-003 |
| `getGroupBalances` | actor, groupId | Pair balances for that group | NF if not visible | Current member | FR-027, FR-003 |
| `memberNetInGroup` | groupId, userId | Money | Internal | Used by `GroupService` | FR-007 |
| `owedInGroup` | groupId, payerId, recipientId | Money, 0 or more | Internal | Used by `PaymentService` | FR-032 |

- All operations use `BalanceLedger`, which reads Approved expenses and payments only (FR-020, SC-005).

## PaymentService

`PaymentInput` holds: groupId, recipientId, amountText, dateText, and an optional note.

| Operation | Inputs | Output | Validation and failures | Authorization | FR |
|-----------|--------|--------|-------------------------|---------------|----|
| `recordPayment` | actor, PaymentInput, overpaymentConfirmed | PaymentView | VE: see rules below. `OverpaymentConfirmationRequiredException` when the amount exceeds what is owed and confirmation is false | The actor is the payer | FR-030 to FR-032 |
| `listMyPayments` | actor, optional groupId | List of PaymentView, as payer or recipient | None | Own only | FR-033 |

**PaymentInput rules:**

| Field | Rule |
|-------|------|
| groupId | Required; the actor and the recipient are both current members |
| recipientId | Required; not the actor |
| amountText | Greater than 0; at most 2 decimals; maximum per NC-11 |
| dateText | `yyyy-MM-dd`; not later than today |
| note | Optional; up to 200 characters |

**Effects:** The overpayment check and the insert run in one transaction, with `overpaymentConfirmed`
applied to the amount owed at that moment. The payment applies immediately, with no recipient
confirmation (FR-031). There are no update or delete operations (NFR-006).

## ReportService

| Operation | Inputs | Output | Validation and failures | Authorization | FR |
|-----------|--------|--------|-------------------------|---------------|----|
| `generateReport` | actor, ReportCriteria | Report | VE: invalid date text, or end before start. No matches gives zero totals, not an error | Data involving the actor only; NF for a group that isn't visible | FR-034 to FR-037, NFR-003 |

- Definitions are in [data-model.md](../data-model.md#report-derived), under NC-8 and NC-10.
- Save and export are **not** in the MVP (FR-038, Post-MVP).

## Supporting collaborators (not called by `ui`)

| Type | Package | Responsibility | FR/NFR |
|------|---------|----------------|--------|
| `AccessPolicy` | service | Member, admin, participant, and visibility checks | FR-003, FR-006, FR-021, FR-022, NFR-003 |
| `PasswordHasher` | service | Hash and verify, behind an interface (`Pbkdf2PasswordHasher` proposed) | FR-004, NFR-002 |
| `SplitAllocator` | domain | Equal and percentage allocation with leftover cents | FR-011 to FR-013 |
| `BalanceLedger` | domain | Net balance calculation from supplied records | FR-026 to FR-029 |
| `java.time.Clock` | JDK | "Today" and timestamps, injected | NFR-002, NFR-006, NFR-009 |

## Post-MVP operations intentionally absent

`archiveGroup` (FR-009), external notification preferences (FR-018), multi-level approval configuration
(FR-025), saved or exported reports (FR-038), and any web interface (FR-039). They stay customer
requirements or derived requirements in the spec; they are simply not in this MVP design.
