# UI Interaction Contracts (User → `ui` → `service`)

**Status**: Draft — Reconciliation Incomplete. Swing is implementation decision ID-03, not a customer requirement, and it does not satisfy CR-10 (OC-1).

## Rules for every Swing class

| Rule | Meaning |
|---|---|
| No business rules | Panels and controllers never compare money, compute shares, or decide eligibility (Principle III). They use view flags (`canEdit`, `canDecide`, `canManage`) and service outcomes |
| Threading | Service calls run through `UiTaskRunner`: one background thread, with results rendered on the EDT (ID-03) |
| Double submission | `UiTaskRunner` disables the triggering control until the call returns |
| Parsing and formatting | Input goes as text. Display uses `FieldFormats`: amounts `$1,234.50`, dates `yyyy-MM-dd` (FR-041). Direction is in words, never a negative amount |
| Form state | Input is kept until a successful save (FR-015) |
| Hiding | Hiding a control is a convenience. Services enforce permissions |
| Logout | Discards `Session`, disposes all user-specific views, and clears cached data. `UiTaskRunner` drops any result that arrives after the session changed |
| Keyboard | Every action has a mnemonic or accelerator. Tab order follows visual order. Dialogs set default and cancel buttons. Labels use `setLabelFor`. `JTable` Enter opens the selected row. Focus is visible. On validation failure, focus moves to the first invalid field (NFR-008) |

## Navigation

A **step** is one activation that changes the view or commits an action. Entering field data is not a step (DEC-21).

| Task | Start | Path | Steps |
|---|---|---|---|
| Register | Login screen | Create Account (then submit) | 2 |
| Create group | Home | Groups → New Group (then submit) | 3 |
| Create expense | Home | New Expense (then submit) | 2 |
| Approve or reject | Home | Awaiting My Approval → open expense → Approve or Reject | 3 |
| Record payment | Home | Record Payment (then submit) | 2 |
| Run report | Home | Reports → Generate | 2 |

```text
Login ──▶ Register
  │ success
  ▼
Home ──┬─▶ Groups ──▶ Group Detail ──▶ Add Member / Remove / Leave / Rename / Group Balances
       ├─▶ New Expense
       ├─▶ Awaiting My Approval ──▶ Expense Detail ──▶ Approve / Reject / View Receipt
       ├─▶ Balances ──▶ Record Payment (prefilled)
       ├─▶ Record Payment
       ├─▶ Payment History
       ├─▶ Notifications ──▶ Expense Detail
       └─▶ Reports
```

## Screens and controllers

| Panel | Controller | Service calls | Requirements |
|---|---|---|---|
| `LoginPanel`, `RegisterPanel` | `SessionController` | `AccountService.login`, `register` | FR-001, FR-002, NFR-002 |
| `HomePanel` | `SessionController`, `NotificationController` | `unreadCount`, `listPendingForMe`, `myBalances`, `logout` | FR-002, FR-003, FR-019, FR-028 |
| `GroupListPanel`, `GroupDetailPanel` | `GroupController` | `createGroup`, `renameGroup`, `addMember`, `removeMember`, `leaveGroup`, `listMyGroups`, `getGroupDetail` | FR-005 to FR-008 |
| `ExpenseFormPanel` | `ExpenseController` | `getGroupDetail`, `createExpense`, `updateExpense` | FR-010 to FR-016 |
| `ExpenseDetailPanel` | `ExpenseController`, `ApprovalController` | `getExpense`, `deleteExpense`, `approve`, `reject` | FR-012, FR-016, FR-021 to FR-024 |
| `ReceiptViewerDialog` | `ExpenseController` | `getReceipt` | FR-014 |
| `PendingApprovalsPanel` | `ApprovalController` | `listPendingForMe` | FR-021 |
| `BalancesPanel`, `GroupBalancesPanel` | `BalanceController` | `myBalances`, `groupBalances` | FR-027, FR-028 |
| `PaymentFormPanel`, `OverpaymentConfirmDialog` | `PaymentController` | `recordPayment` | FR-030 to FR-032 |
| `PaymentHistoryPanel` | `PaymentController` | `paymentHistory` | FR-033 |
| `NotificationsPanel` | `NotificationController` | `list`, `markRead` | FR-017, FR-019, FR-023 |
| `ReportPanel` | `ReportController` | `filterOptions`, `generate` | FR-034 to FR-037 |
| `MainFrame` | wired in `SplitSmartApp` | `CardLayout` host | NFR-007 |
| `UiTaskRunner`, `ErrorPresenter` | helpers | | ID-03, NFR-004, NFR-007 |

## Mapping results to the screen

| Result | Behavior |
|---|---|
| View | Passes it to the panel |
| `ValidationException` | Shows each `FieldError` beside its field, keeps all input, focuses the first (FR-015, NFR-007, NFR-008) |
| `AuthenticationFailedException` | One message; password field cleared (FR-002) |
| `AccountLockedException` | "Temporarily locked" (NFR-002) |
| `AccessDeniedException` | Generic refusal; returns to the prior screen |
| `NotFoundException` | Message; refreshes the list |
| `ConflictException(ALREADY_DECIDED)` | "This expense is no longer pending"; reloads detail |
| `ConflictException(STALE_VERSION)` | "This expense changed. Review it again"; reloads detail |
| `BusinessRuleException` | Dialog with the service's message and details |
| `PersistenceFailureException` or unexpected | Generic message; form kept; detail goes only to the log |

## Key interactions

### Log in and log out

| Step | Panel and controller | Service |
|---|---|---|
| 1 | `LoginPanel` submits username and password characters; the field is cleared | `AccountService.login` |
| 2 | `SessionController` stores `Session` and opens Home | `unreadCount`, `listPendingForMe`, `myBalances` |
| 3 | Log Out disposes user views and opens Login | `AccountService.logout` |

### Create or edit an expense

| Step | Panel and controller | Service |
|---|---|---|
| 1 | `ExpenseFormPanel` selects a group; payer defaults to the signed-in user | `getGroupDetail` for member choices |
| 2 | User enters fields and orders participants with Move Up and Move Down, or Alt+Up and Alt+Down, because order decides who gets leftover cents (FR-012). Percentage fields appear only for percentage splits | |
| 3 | `ExpenseController` builds `ExpenseDraft`; the UI computes no shares | `createExpense` or `updateExpense` |
| 4a | Success opens `ExpenseDetailPanel` showing service-computed shares in order | |
| 4b | `ValidationException` stays on the form with all data intact, including when a receipt is refused | |

No share preview exists in the MVP, because it would duplicate a rule in the UI or need a new operation.

### Approve or reject

| Step | Panel and controller | Service |
|---|---|---|
| 1 | `PendingApprovalsPanel` or a flagged notification opens the detail | `getExpense` |
| 2 | Approve and Reject are enabled only when `canDecide` is true | |
| 3 | Approve, or Reject with a reason dialog; `expectedVersion` comes from the view shown | `approve` or `reject` |
| 4 | Status, decision, approver, and time are displayed | |

### Record a payment

| Step | Panel and controller | Service |
|---|---|---|
| 1 | `PaymentFormPanel` submits `PaymentDraft` with no acknowledgment | `recordPayment` |
| 2a | `Recorded`: shows confirmation and refreshes balances | `myBalances` |
| 2b | `OverpaymentWarning(owedNow, attempted)`: `OverpaymentConfirmDialog` shows both amounts, with **Cancel as the default** | |
| 3 | Confirm resubmits with `acknowledgedOwed = owedNow` | `recordPayment` |
| 4 | Cancel keeps the form; nothing was written | |

If the amount owed changed between steps, a fresh warning appears. The comparison happens in the service, never in the dialog.

### Notifications

| Step | Panel and controller | Service |
|---|---|---|
| 1 | `HomePanel` shows the unread count, refreshed at login and on return to Home. No polling | `unreadCount` |
| 2 | `NotificationsPanel` lists newest first. "Needs your approval" uses text, not color alone. A deleted expense shows "(expense deleted)" | `list` |
| 3 | Marking read, or activating an item, marks it read and opens the expense if it still exists | `markRead`, `getExpense` |

### Reports

| Step | Panel and controller | Service |
|---|---|---|
| 1 | `ReportPanel` loads choices | `filterOptions` |
| 2 | User sets optional filters and generates | `generate` |
| 3 | Renders lines, totals, "Not included in totals" memo, and opening, period, later, and current for each person. Shows "As of" the generation time. Rendering does no arithmetic | |

### View a receipt

| Step | Panel and controller | Service |
|---|---|---|
| 1 | `ExpenseDetailPanel` offers View Receipt when `hasReceipt` is true | `getReceipt` |
| 2 | `ReceiptViewerDialog` checks declared dimensions against the 50-megapixel limit, then decodes off the EDT with `javax.imageio` | |
| 3 | A corrupt or over-limit image shows a message, not a stack trace | |

## Manual verification

Swing behavior that cannot reasonably be unit tested has written manual steps linked to FRs, as Principle V requires. See UI-01 to UI-09 in the [validation plan](../validation-plan.md).
