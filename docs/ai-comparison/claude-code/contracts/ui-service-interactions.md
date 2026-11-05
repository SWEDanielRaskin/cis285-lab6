# UI–Service Interactions

**Status:** AI-generated draft, not reviewed. These contracts describe how Swing controllers use services (AD-19). The UI contains no business rules: it gathers input, invokes services, and renders results.

## Rules for every controller

| Rule | Meaning |
|---|---|
| Thread | Service calls run through `UiTaskRunner`, never on the EDT. Results render on the EDT (ID-03). |
| No rule evaluation | A controller never compares money, computes shares, or decides eligibility. It uses view flags such as `canEdit`, `canDecide`, and `canManage`, or service outcomes. |
| No parsing or rounding of money | Input goes as text and display comes from `FieldFormats`. |
| Form state | Input is kept until a successful save (FR-015). |
| Double submission | `UiTaskRunner` disables the triggering control until the call returns. |
| Logout | Discards `Session` and clears all panels and cached views, so nothing from the previous user remains (Scenario 1.4). `UiTaskRunner` drops any result that arrives after the session changed (R-14). |

## Mapping results to the screen

| Result | Controller behavior |
|---|---|
| View | Passes it to the panel |
| `ValidationException` | Shows each `FieldError` beside its field, keeps all input, focuses the first (FR-015, NFR-007, NFR-008) |
| `AuthenticationFailedException` | One message, password cleared (FR-002) |
| `AccountLockedException` | "Temporarily locked" (NFR-002) |
| `AccessDeniedException` | Generic refusal, returns to the prior screen |
| `NotFoundException` | Message, refreshes the list |
| `ConflictException(ALREADY_DECIDED)` | "This expense is no longer pending," reloads detail |
| `ConflictException(STALE_VERSION)` | "This expense changed. Review it again," reloads detail |
| `BusinessRuleException` | Dialog with the service's message and details |
| `PersistenceFailureException` or unexpected | Generic message, form retained, details only in the log |

## Key interactions

### Log in (FR-002, FR-019)

| Step | Panel/Controller | Service |
|---|---|---|
| 1 | `LoginPanel` submits username and password array | `AccountService.login` |
| 2 | `SessionController` stores `Session`, opens Home | `NotificationService.unreadCount`, `ApprovalService.listPendingForMe`, `BalanceService.myBalances` |
| 3 | `HomePanel` shows counts and summary | |

### Create expense (FR-010–FR-015)

| Step | Panel/Controller | Service |
|---|---|---|
| 1 | `ExpenseFormPanel` selects a group | `GroupService.getGroupDetail` for member choices |
| 2 | User enters fields, orders participants, optionally picks a receipt | |
| 3 | `ExpenseController` builds `ExpenseDraft` and `ReceiptUpload` | `ExpenseService.createExpense` |
| 4a | On success, opens `ExpenseDetailPanel` showing shares in order | |
| 4b | On `ValidationException`, stays with all data intact | |

The form shows no computed preview of shares in the MVP. A preview would need a service operation, or else the UI would duplicate the rule.

### Approve or reject (FR-021–FR-024)

| Step | Panel/Controller | Service |
|---|---|---|
| 1 | `PendingApprovalsPanel` or a flagged notification opens the detail | `ExpenseService.getExpense` |
| 2 | `ExpenseDetailPanel` enables actions when `canDecide` is true | |
| 3 | Approve, or Reject with a reason dialog; `expectedVersion` from the view | `ApprovalService.approve` or `reject` |
| 4 | Rendered status, decision, approver, and time | |

### Record payment with overpayment (FR-030–FR-032)

| Step | Panel/Controller | Service |
|---|---|---|
| 1 | `PaymentFormPanel` submits `PaymentDraft`, no acknowledgment | `PaymentService.recordPayment` |
| 2a | `Recorded`: shows confirmation and refreshes balances | `BalanceService.myBalances` |
| 2b | `OverpaymentWarning(owedNow, attempted)`: dialog from the values provided | |
| 3 | On confirm, resubmits with `acknowledgedOwed = owedNow` | `PaymentService.recordPayment` |
| 4 | On cancel, form stays; nothing was written | |

If the amount owed changed between steps, the service returns a fresh warning rather than recording.

### Run report (FR-034–FR-037)

| Step | Panel/Controller | Service |
|---|---|---|
| 1 | `ReportPanel` opens and loads choices | `ReportService.filterOptions` |
| 2 | User sets filters and runs | `ReportService.generate` |
| 3 | Renders lines, totals, memo, and reconciliation; rendering performs no arithmetic | |

### Notifications (FR-017, FR-019)

| Step | Panel/Controller | Service |
|---|---|---|
| 1 | `HomePanel` shows the unread count, refreshed at login and on return to Home | `NotificationService.unreadCount` |
| 2 | `NotificationsPanel` lists newest first | `NotificationService.list` |
| 3 | User marks items read; flagged items open the expense | `NotificationService.markRead`, `ExpenseService.getExpense` |

### View receipt (FR-014)

| Step | Panel/Controller | Service |
|---|---|---|
| 1 | `ExpenseDetailPanel` offers View Receipt when `hasReceipt` is true | `ExpenseService.getReceipt` |
| 2 | `ReceiptViewerDialog` checks declared dimensions, then decodes on a background thread with `javax.imageio` | |
| 3 | A corrupt or oversized-dimension image shows an error, not a stack trace | |
