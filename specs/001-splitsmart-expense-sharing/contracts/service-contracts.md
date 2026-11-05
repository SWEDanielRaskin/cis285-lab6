# Service Contracts (`ui` → `service`)

**Status**: Draft — Reconciliation Incomplete. Conventions and common failures are in [README.md](README.md). `VE` = `ValidationException`, `CE` = `ConflictException`, `BRE` = `BusinessRuleException`.

**Transaction** column: **Write** is one `inTransaction` in canonical order. **Read** is one `readOnly` scope. **Side effects** list everything other than the stated return value.

## AccountService

| Operation | Inputs | Output | Errors | Authorization | Transaction | Side effects | Requirements |
|---|---|---|---|---|---|---|---|
| `register` | `RegisterCommand(usernameText, displayNameText, password char[])` | `UserSummary` | VE: username not 3–30, or taken in any case; display name not 1–50; password under 8, stating the minimum | Visitor | Hash in PREPARE, then Write | Inserts `User`; clears the password array | FR-001, FR-004, BR-29 |
| `login` | `LoginCommand(usernameText, password char[])` | `Session` | `AuthenticationFailedException` with one message for wrong username or password; `AccountLockedException(lockedUntil)` during a lock | Visitor | **Special:** Read user; verify outside any transaction; Write login state and **commit before raising** | Updates `failedLoginCount` and `lockedUntil`; clears the password array | FR-002, NFR-002, BR-26 |
| `logout` | `Session` | none | none | Session holder | None | Invalidates the `Session` in memory; later calls with it get `AccessDeniedException` | FR-002 |

**Login rules:** A locked account is refused before any password check, and the attempt neither counts nor extends the lock. An unknown username still runs one hash. Comparison is constant-time. Success clears the count.

## GroupService

| Operation | Inputs | Output | Errors | Authorization | Transaction | Side effects | Requirements |
|---|---|---|---|---|---|---|---|
| `createGroup` | `Session`, `nameText` | `GroupDetailView` | VE: name not 1–50 | Any session | Write | Inserts `Group` and first `Membership`; creator is admin | FR-005 |
| `renameGroup` | `Session`, `GroupId`, `nameText` | `GroupDetailView` | VE: name not 1–50 | Admin | Write | Updates name | FR-008 |
| `addMember` | `Session`, `GroupId`, `usernameText` | `GroupDetailView` | VE: unknown username. `BRE(ALREADY_MEMBER)` | Admin | Write | Inserts `Membership`. A former member gets a new row | FR-006, BR-24 |
| `removeMember` | `Session`, `GroupId`, `UserId` | `GroupDetailView` | `BRE(MEMBER_HAS_BALANCE, pairs)`, `BRE(MEMBER_IN_PENDING_EXPENSE, expenses)`, `BRE(USE_LEAVE_FOR_SELF)` | Admin | Write | Ends the `Membership`, with `endedBy` = admin | FR-006, FR-007, BR-22 |
| `leaveGroup` | `Session`, `GroupId` | none | `BRE(MEMBER_HAS_BALANCE, pairs)`, `BRE(MEMBER_IN_PENDING_EXPENSE, expenses)` | Active member | Write | Ends the `Membership`; if the admin left and members remain, `Group.assignAdmin` to the next in order | FR-006, FR-007, BR-22, BR-23 |
| `listMyGroups` | `Session` | `List<GroupSummaryView>` | none | Own active memberships | Read | none | FR-003, FR-008 |
| `getGroupDetail` | `Session`, `GroupId` | `GroupDetailView` (name, admin, active members, `canManage`) | none beyond common | Active member | Read | none | FR-003, FR-008 |

FR-009 (archive) has **no MVP operation**.

## ExpenseService

`ExpenseDraft` = `(groupId, amountText, dateText, descriptionText, payerId?, splitMethod, participants: ordered List<ParticipantInput(userId, percentText?)>)`. `ReceiptUpload` = `(fileName, InputStream supplier)`. `ReceiptChange` = `KEEP`, `REMOVE`, or `REPLACE(ReceiptUpload)`.

| Operation | Inputs | Output | Errors | Authorization | Transaction | Side effects | Requirements |
|---|---|---|---|---|---|---|---|
| `createExpense` | `Session`, `ExpenseDraft`, `ReceiptUpload?` | `ExpenseDetailView` (Pending) | VE: see field rules | Active member | Receipt read in PREPARE, then Write | Inserts expense, shares, receipt; `NotificationDispatcher.expenseCreated` | FR-010 to FR-015, FR-017, FR-020 |
| `updateExpense` | `Session`, `ExpenseId`, `expectedVersion`, `ExpenseDraft`, `ReceiptChange` | `ExpenseDetailView` | VE as above; CE(`ALREADY_DECIDED`, `STALE_VERSION`) | Creator | Write | Replaces fields and shares; version + 1; `NotificationDispatcher.expenseEdited` | FR-016, BR-18 |
| `deleteExpense` | `Session`, `ExpenseId`, `expectedVersion` | none | CE as above | Creator | Write | Removes expense, shares, receipt; clears notification links | FR-016, BR-18 |
| `getExpense` | `Session`, `ExpenseId` | `ExpenseDetailView`: fields, ordered shares, status, version, `DecisionView?`, `hasReceipt`, `canEdit`, `canDecide` | none beyond common | Readable expense | Read | none | FR-003, FR-012, FR-024 |
| `listGroupExpenses` | `Session`, `GroupId`, `statuses?` | `List<ExpenseSummaryView>` | none beyond common | Active member | Read | none | FR-003, FR-008 |
| `getReceipt` | `Session`, `ExpenseId` | `ReceiptContent(mediaType, bytes)` | `NotFoundException` when none | Active member of the group | Read | none | FR-014, BR-28 |

**Field rules (all reported together, FR-015):**

| Field | Rule | Checked in |
|---|---|---|
| amount | BR-27 | PREPARE |
| date | `yyyy-MM-dd`, real date, today or earlier | PREPARE |
| description | 1–200 characters | PREPARE |
| participants | At least one; no duplicates; at least one other than the creator | PREPARE |
| percentages | Percentage only: one per participant; 0.00–100.00; at most 2 decimals; total exactly 100.00 | PREPARE |
| receipt | BR-28 | PREPARE |
| payer | Active member; empty means the creator | VALIDATE |
| participants | All active members | VALIDATE |

## ApprovalService

| Operation | Inputs | Output | Errors | Authorization | Transaction | Side effects | Requirements |
|---|---|---|---|---|---|---|---|
| `approve` | `Session`, `ExpenseId`, `expectedVersion`, `reasonText?` | `ExpenseDetailView` (Approved) | VE: reason over 200; CE(`ALREADY_DECIDED`, `STALE_VERSION`) | Eligible approver; the creator gets `AccessDeniedException` | Write | Conditional status update; inserts `ApprovalDecision`; `NotificationDispatcher.expenseDecided`; expense enters balances at commit | FR-021, FR-022, FR-024, FR-026 |
| `reject` | `Session`, `ExpenseId`, `expectedVersion`, `reasonText` | `ExpenseDetailView` (Rejected) | VE: reason not 1–200; CE as above | Same | Write | Same, except balances never include it | FR-021 to FR-024 |
| `listPendingForMe` | `Session` | `List<ExpenseSummaryView>` | none | Own eligibility only | Read | none | FR-017, FR-021 |

## BalanceService

| Operation | Inputs | Output | Errors | Authorization | Transaction | Side effects | Requirements |
|---|---|---|---|---|---|---|---|
| `myBalances` | `Session` | `List<CounterpartyBalanceView(otherUser, netAmount, direction, groupLines: List<GroupBalanceLine(groupId, groupName, amount, direction)>)>` | none | Own pairs | Read | none | FR-027, FR-028 |
| `groupBalances` | `Session`, `GroupId` | `List<GroupPairBalanceView(debtor, creditor, amount)>`, including settled pairs | none beyond common | Active member | Read | none | FR-003, FR-027 |

**Guarantees:** Only Approved expenses and payments count (FR-020, FR-026). Per-group lines add up to the net, using direction as sign (FR-028). `netAmount` is non-negative, and `direction` is `OWES_ME`, `I_OWE`, or `SETTLED`.

## PaymentService

`PaymentDraft` = `(groupId, recipientId, amountText, dateText, noteText?, acknowledgedOwed?)`. The payer is always the session user.

| Operation | Inputs | Output | Errors | Authorization | Transaction | Side effects | Requirements |
|---|---|---|---|---|---|---|---|
| `recordPayment` | `Session`, `PaymentDraft` | Sealed `PaymentOutcome`: `Recorded(PaymentView)` or `OverpaymentWarning(owedNow, attempted)` | VE: amount (BR-27); date; note over 200; recipient is self or not an active member | Payer is an active member of the group | Write. `OverpaymentWarning` writes nothing | Inserts immutable `Payment`; balance changes at commit, with no recipient action | FR-030 to FR-032, BR-14, BR-15 |
| `paymentHistory` | `Session`, `GroupId?` | `List<PaymentView>` where the user is payer or recipient, newest first | none | Own payments, including former groups | Read | none | FR-033, BR-16 |

**Overpayment rule:** `owedNow` = what the payer currently owes the recipient in that group, or 0. When `amount > owedNow`: if `acknowledgedOwed` is absent or differs from `owedNow`, return the warning. If it matches, record with `overpaymentConfirmed = true`. Paying exactly what is owed gives no warning.

## NotificationService

| Operation | Inputs | Output | Errors | Authorization | Transaction | Side effects | Requirements |
|---|---|---|---|---|---|---|---|
| `unreadCount` | `Session` | int | none | Own, within visibility scope | Read | none | FR-019 |
| `list` | `Session` | `List<NotificationView(id, type, message, needsApproval, read, expenseId?, expenseDeleted, createdAt)>`, newest first | none | Own, within visibility scope | Read | none | FR-017, FR-019, FR-023 |
| `markRead` | `Session`, `Set<NotificationId>` | none | Others' IDs are ignored | Own rows only | Write | Sets `readAt` | FR-019 |

**Creation is not on this interface.** `NotificationDispatcher` is internal and joins the caller's transaction:

| Method | Called by | Effect | Requirements |
|---|---|---|---|
| `expenseCreated(expense)` | `DefaultExpenseService` | `EXPENSE_CREATED` for every active member except the creator | FR-017 |
| `expenseEdited(expense, addedParticipants)` | `DefaultExpenseService` | For each added participant other than the creator: reset their row to unread, or insert one | BR-18, DEC-16 |
| `expenseDecided(expense, decision)` | `DefaultApprovalService` | `EXPENSE_APPROVED` or `EXPENSE_REJECTED` for the creator, with reason if any | FR-023 |

## ReportService

`ReportFilterInput` = `(fromText?, toText?, groupId?, otherUserId?, statuses?)`.

| Operation | Inputs | Output | Errors | Authorization | Transaction | Side effects | Requirements |
|---|---|---|---|---|---|---|---|
| `filterOptions` | `Session` | `ReportFilterOptions(groups, otherUsers)`: groups the user is or was in, and people who share a ledger entry or a group with them | none | Own | Read | none | FR-035, NFR-003 |
| `generate` | `Session`, `ReportFilterInput` | `Report` | VE: date unparseable; `from` after `to`. No matches gives zero totals, not an error | Own data, within visibility scope | Read | none | FR-034 to FR-037, NFR-003 |

**Guarantees:** BR-19, BR-20, BR-21. Save and export have **no MVP operation** (FR-038).

## Internal collaborators (not called by `ui`)

| Type | Operations | Errors | Requirements |
|---|---|---|---|
| `AccessPolicy` | `requireSession(Session)`, `requireActiveMember(Session, GroupId)`, `requireAdmin(Session, GroupId)`, `requireExpenseReadable(Session, Expense)`, `requireReceiptReadable(Session, Expense)`, `requireEligibleApprover(Session, Expense)`, `visibleScope(Session)` | `AccessDeniedException`, `NotFoundException` | FR-003, FR-006, FR-014, FR-021, FR-022, NFR-003 |
| `LedgerReader` | `sheetForGroups(Set<GroupId>)`, `sheetInvolving(GroupId, UserId)`, `owedBy(payerId, recipientId, GroupId)`, `entriesForUser(UserId, VisibilityScope)` | none | FR-007, FR-027, FR-032, FR-037 |
| `GroupExitPolicy` | `checkExit(GroupId, UserId)` | `BRE` | FR-007 |
| `PasswordHasher` | `hash(char[])`, `verify(char[], PasswordHash)` | none | FR-004, NFR-002 |
| `ExpenseDraftValidator` | `parse(ExpenseDraft)`: values plus `FieldError`s | none; errors are collected | FR-010, FR-013, FR-015 |
| `ReceiptInspector` | `inspect(ReceiptUpload)`: `Receipt` or a `FieldError` | none | FR-014, DEC-25 |
| `FieldFormats` | `parseDate(text)`, `date(LocalDate)`, `money(Money)` | none | FR-041 |

## Errors reference

| Type | Fields |
|---|---|
| `ValidationException` | `List<FieldError>` |
| `AuthenticationFailedException` | None; fixed message |
| `AccountLockedException` | `lockedUntil` |
| `AccessDeniedException` | None; generic message |
| `NotFoundException` | Entity kind |
| `ConflictException` | `ALREADY_DECIDED` or `STALE_VERSION` |
| `BusinessRuleException` | Code, message, details |
| `PersistenceFailureException` | Cause, which is logged and not displayed |

## Post-MVP operations intentionally absent

`archiveGroup` (FR-009), external notification preferences (FR-018), multi-level approval configuration (FR-025), saved or exported reports (FR-038), and any web interface (FR-039).
