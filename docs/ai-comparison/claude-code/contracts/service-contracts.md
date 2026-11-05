# Service Contracts

**Status:** AI-generated draft, not reviewed. Conventions and common failures are in [README.md](README.md).

## AccountService

| Operation | Inputs | Output | Validation failures | Other failures | Authorization | FR |
|---|---|---|---|---|---|---|
| `register` | `RegisterCommand(usernameText, displayNameText, password char[])` | `UserSummary` | Username not 3–30 characters; username taken, in any letter case; display name invalid (proposal 1–50, DQ-12); password under 8 characters, stating the minimum | | Visitor | FR-001, FR-004 |
| `login` | `LoginCommand(usernameText, password char[])` | `Session` | | `AuthenticationFailedException` with one message for wrong username or password; `AccountLockedException(lockedUntil)` during a lock | Visitor | FR-002, NFR-002 |
| `logout` | `Session` | none | | | Session holder | FR-002 |

**Rules:**
- The password array is cleared before returning.
- A successful login resets the failure count.
- A failure writes count and lock state. A locked account returns `AccountLockedException` without verifying the password, and without counting the attempt or extending the lock.

## GroupService

| Operation | Inputs | Output | Validation failures | Other failures | Authorization | FR |
|---|---|---|---|---|---|---|
| `createGroup` | `Session`, `nameText` | `GroupDetailView` | Name not 1–50 characters | | Any session | FR-005 |
| `renameGroup` | `Session`, `GroupId`, `nameText` | `GroupDetailView` | Name not 1–50 characters | | Admin | FR-008 |
| `addMember` | `Session`, `GroupId`, `usernameText` | `GroupDetailView` | Unknown username | `BusinessRuleException(ALREADY_MEMBER)` | Admin | FR-006 |
| `removeMember` | `Session`, `GroupId`, `UserId` | `GroupDetailView` | | `BusinessRuleException(MEMBER_HAS_BALANCE, amounts)`, `BusinessRuleException(MEMBER_IN_PENDING_EXPENSE, expenses)`, `BusinessRuleException(USE_LEAVE_FOR_SELF)` | Admin | FR-006, FR-007 (AD-15) |
| `leaveGroup` | `Session`, `GroupId` | none | | Same balance and pending failures | Active member | FR-006, FR-007 (AD-15, AD-16) |
| `listMyGroups` | `Session` | `List<GroupSummaryView>` | | | Any session; active memberships only | FR-003, FR-008 |
| `getGroupDetail` | `Session`, `GroupId` | `GroupDetailView` (name, admin, active members, `canManage`) | | | Active member | FR-003, FR-008 |

Post-MVP FR-009 (archive) has **no MVP operation**.

## ExpenseService

`ExpenseDraft` = `(groupId, amountText, dateText, descriptionText, payerId?, splitMethod, participants: ordered List<ParticipantInput(userId, percentText?)>)`. `ReceiptUpload` = `(fileName, InputStream supplier)`. `ReceiptChange` = KEEP, REMOVE, or REPLACE(`ReceiptUpload`).

| Operation | Inputs | Output | Validation failures | Other failures | Authorization | FR |
|---|---|---|---|---|---|---|
| `createExpense` | `Session`, `ExpenseDraft`, `ReceiptUpload?` | `ExpenseDetailView` (Pending) | **amount:** ≤ 0, over 1,000,000.00, over 2 decimals, unparseable. **date:** unparseable, after today. **description:** not 1–200 characters. **payer:** not an active member. **participants:** empty, duplicate, not active members, none other than creator. **percent:** unparseable, outside 0–100, over 2 decimals, total not exactly 100.00. **receipt:** not JPEG/PNG, over 5 MB | | Active member | FR-010–FR-015, FR-017, FR-020 |
| `updateExpense` | `Session`, `ExpenseId`, `expectedVersion`, `ExpenseDraft`, `ReceiptChange` | `ExpenseDetailView` | Same as create | `ConflictException(ALREADY_DECIDED, STALE_VERSION)`; `NotFoundException` | Creator, while Pending | FR-016, FR-017 (AD-14) |
| `deleteExpense` | `Session`, `ExpenseId`, `expectedVersion` | none | | Same as update | Creator, while Pending | FR-016 |
| `getExpense` | `Session`, `ExpenseId` | `ExpenseDetailView`: fields, ordered shares, status, version, `DecisionView?`, `hasReceipt`, `canEdit`, `canDecide` | | `NotFoundException` | Readable expense | FR-003, FR-012, FR-024 |
| `listGroupExpenses` | `Session`, `GroupId`, `statuses?` | `List<ExpenseSummaryView>` | | | Active member | FR-003, FR-008 |
| `getReceipt` | `Session`, `ExpenseId` | `ReceiptContent(mediaType, bytes)` | | `NotFoundException` when none | Active member of the expense's group | FR-014 |

**Rules:**
- All expense validation failures are reported together, and a receipt failure does not discard other entered data (FR-015).
- Creation writes notifications atomically (AD-09).
- Split calculation uses `SplitAllocator`; shares returned in listed order always sum to the amount.

## ApprovalService

| Operation | Inputs | Output | Validation failures | Other failures | Authorization | FR |
|---|---|---|---|---|---|---|
| `approve` | `Session`, `ExpenseId`, `expectedVersion`, `reasonText?` | `ExpenseDetailView` (Approved) | Reason over 200 characters | `ConflictException(ALREADY_DECIDED, STALE_VERSION)`; `NotFoundException` | Eligible approver; the creator is always refused | FR-021, FR-022, FR-024 |
| `reject` | `Session`, `ExpenseId`, `expectedVersion`, `reasonText` | `ExpenseDetailView` (Rejected) | Reason not 1–200 characters | Same | Same | FR-021–FR-024 |
| `listPendingForMe` | `Session` | `List<ExpenseSummaryView>` | | | Any session; own eligibility only | FR-017, FR-021 |

**Rules:**
- The first recorded decision wins (AD-10).
- The creator is notified in the same transaction, with the reason if any (FR-023).
- A decision is never changed afterward.

## BalanceService

| Operation | Inputs | Output | Failures | Authorization | FR |
|---|---|---|---|---|---|
| `myBalances` | `Session` | `List<CounterpartyBalanceView(otherUser, netAmount, direction, groupLines: List<GroupBalanceLine(groupId, groupName, amount, direction)>)>` | | Own pairs, within groups visible to the user | FR-027, FR-028 |
| `groupBalances` | `Session`, `GroupId` | `List<GroupPairBalanceView(debtor, creditor, amount)>` including settled pairs | | Active member | FR-003, FR-027 |

**Guarantees:**
- Only Approved expenses and payments are counted (FR-020, FR-026).
- Per-group lines add up to the net, using direction as sign (FR-028).
- `netAmount` is non-negative and `direction` is OWES_ME, I_OWE, or SETTLED.

## PaymentService

`PaymentDraft` = `(groupId, recipientId, amountText, dateText, noteText?, acknowledgedOwed?)`. The payer is always the session user.

| Operation | Inputs | Output | Validation failures | Authorization | FR |
|---|---|---|---|---|---|
| `recordPayment` | `Session`, `PaymentDraft` | sealed `PaymentOutcome`: `Recorded(PaymentView)` or `OverpaymentWarning(owedNow, attempted)` | **amount:** ≤ 0, over 2 decimals, over 1,000,000.00 (SRC-08). **date:** unparseable, after today. **group:** absent. **recipient:** self, not an active member. **note:** over 200 characters | Payer and recipient both active members of the group | FR-030–FR-032 |
| `paymentHistory` | `Session`, `GroupId?` | `List<PaymentView>` where the session user is payer or recipient | | Own payments, including former groups (AD-17) | FR-033 |

**Rules (AD-13):**
- `owedNow = max(0, what the payer currently owes the recipient in that group)`.
- If `amount > owedNow` and `acknowledgedOwed` is absent or differs from `owedNow`, return `OverpaymentWarning` and write nothing.
- If it matches, record with `overpaymentConfirmed = true`.
- A recorded payment applies immediately, without recipient action (FR-031).

## NotificationService

| Operation | Inputs | Output | Failures | Authorization | FR |
|---|---|---|---|---|---|
| `unreadCount` | `Session` | int | | Own, AD-17 scope | FR-019 |
| `list` | `Session` | `List<NotificationView(id, type, message, actor, group, description, amount, date, reason?, needsApproval, read, expenseId?, createdAt)>`, newest first | | Own, AD-17 scope | FR-017, FR-019, FR-023 |
| `markRead` | `Session`, `Set<NotificationId>` | none | Others' IDs are ignored | Own rows only | FR-019 |

**Notification creation is not on this interface.** `NotificationDispatcher` is internal to `service`:

| Method | Called by | Recipients | FR |
|---|---|---|---|
| `expenseCreated(expense)` | `ExpenseService` | All current members except creator | FR-017 |
| `expenseRevised(expense)` | `ExpenseService` | Refreshes existing; adds any missing; resets participants to unread (AD-14) | FR-017 |
| `expenseDecided(expense, decision)` | `ApprovalService` | Creator | FR-023 |

## ReportService

`ReportFilterInput` = `(fromText?, toText?, groupId?, otherUserId?, statuses?)`.

| Operation | Inputs | Output | Validation failures | Authorization | FR |
|---|---|---|---|---|---|
| `filterOptions` | `Session` | `ReportFilterOptions(groups, otherUsers)`: groups the user is or was in, and people who shared them | | Own | FR-035, NFR-003 |
| `generate` | `Session`, `ReportFilterInput` | `Report` (lines, `ReportTotals`, `StatusMemoLine`s, `CounterpartyNetLine`s) | Date unparseable; `from` after `to` | Own data; AD-17 scope | FR-034–FR-037, NFR-003 |

**Guarantees (AD-18, `NEEDS CLARIFICATION` SRC-04):**
- Filters combine freely and ranges are inclusive (FR-035).
- No matches returns zero totals, not an error (Scenario 8.4).
- `ReportTotals` and `CounterpartyNetLine` count Approved expenses and payments only (SC-005).
- `opening + period + later = current`, and `current` equals `BalanceService` for the same group scope to the cent (FR-037).

Post-MVP FR-038 (saved filters, export) has **no MVP operation**.

## Service errors reference

| Type | Fields |
|---|---|
| `ValidationException` | `List<FieldError>` |
| `AuthenticationFailedException` | None; message fixed |
| `AccountLockedException` | `lockedUntil` |
| `AccessDeniedException` | None; message generic |
| `NotFoundException` | Entity kind |
| `ConflictException` | `ALREADY_DECIDED` or `STALE_VERSION` |
| `BusinessRuleException` | Code, message, details |
| `PersistenceFailureException` | Cause (logged, not displayed) |
