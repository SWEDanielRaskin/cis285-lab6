# UI Interaction Contracts (User → `ui` → `service`)

**Status**: Draft. AI-generated; not human reviewed. Swing is implementation decision ID-03, not a
customer requirement, and it does not satisfy CR-10 (OC-1).

## Rules for all Swing classes

1. Views collect input, call a controller, and render results. They contain no business rules or
   balance calculations (Principle III).
2. Controllers call services through `UiAsync`, which runs them off the Event Dispatch Thread and
   delivers results back on it (ID-03, research R-03).
3. While a call runs, the triggering control is disabled so it can't be submitted twice.
4. Failures go through `ErrorPresenter`, following the [error model](README.md#error-model).
5. Hiding a control is a convenience only. Services enforce permissions.
6. Amounts always display with a currency symbol and 2 decimals, and dates as `yyyy-MM-dd`, through one
   `DisplayFormats` class (FR-041).
7. Every primary task works with the keyboard alone: mnemonics, Tab order, Enter for the default button,
   and Escape to cancel (NFR-008).

## Navigation

Each primary task is at most 3 steps from Home (NFR-007):

| Task | Path from Home | Steps |
|------|----------------|-------|
| Create group | Groups → New Group | 2 |
| Create expense | New Expense | 1 |
| Approve or reject | Awaiting My Approval → choose an expense → Approve or Reject | 3 |
| Record payment | Record Payment | 1 |
| Run report | Reports → Generate | 2 |
| Register | Starts on the login screen, before Home: Create Account | 1 |

## Screens and controllers

| View | Controller | Service calls | FR/NFR |
|------|------------|---------------|--------|
| `LoginPanel` | `SessionController` | `AccountService.login`, `register` | FR-001, FR-002, NFR-002 |
| `HomePanel` | `SessionController`, `NotificationController` | `unreadCount`, `getMyBalances`, `listMyGroups` | FR-003, FR-019, FR-028 |
| `GroupsPanel`, `GroupDetailPanel` | `GroupController` | `GroupService.*`, `findUserByUsername`, `getGroupBalances` | FR-005 to FR-008 |
| `ExpenseFormDialog` | `ExpenseController` | `createExpense`, `editPendingExpense` | FR-010 to FR-016 |
| `ExpenseDetailDialog` | `ExpenseController`, `ApprovalController` | `getExpense`, `deletePendingExpense`, `approve`, `reject` | FR-016, FR-021 to FR-024 |
| `ReceiptViewerDialog` | `ExpenseController` | `getReceipt` | FR-014 |
| `ApprovalsPanel` | `ApprovalController` | `listAwaitingMyDecision` | FR-021 |
| `NotificationsPanel` | `NotificationController` | `listMine`, `markRead` | FR-017, FR-019, FR-023 |
| `BalancesPanel` | `BalanceController` | `getMyBalances` | FR-027, FR-028 |
| `PaymentDialog`, `PaymentHistoryPanel` | `PaymentController` | `recordPayment`, `listMyPayments` | FR-030 to FR-033 |
| `ReportPanel` | `ReportController` | `generateReport` | FR-034 to FR-037 |

`MainFrame` owns navigation, and `Session` holds the signed-in user's ID and name.

## Key interactions

### Log in and log out

| Step | Behavior |
|------|----------|
| Submit | Password is passed as characters; the field is cleared afterward |
| Success | `Session` is created and Home opens with the unread count |
| Wrong credentials | The same message for an unknown user or wrong password (FR-002) |
| Locked | "Temporarily locked" message (Story 1 scenario 6) |
| Log out | `Session` is cleared, **all user-specific views are disposed**, and the login screen opens (FR-002, Story 1 scenario 4) |

### Create or edit an expense

| Step | Behavior |
|------|----------|
| Open | Payer defaults to the signed-in user |
| Choose participants | An ordered list with move up and move down, because order decides who gets leftover cents (FR-012). The order is sent to the service as shown |
| Choose split | Percentage fields appear only for PERCENTAGE |
| Submit | Raw text goes to the service, and **the UI does not compute shares** |
| `ValidationException` | Each field shows its error, and **all entered data stays**, including when a receipt is refused (FR-015, Edge Cases) |
| Success | Shares returned by the service are displayed |

The form may show the percentage total as a typing aid. The service remains the authority.

### Decide on an expense

| Step | Behavior |
|------|----------|
| Open detail | Approve and Reject are enabled only if the service reports `canDecide` |
| Reject | The reason is required; the service enforces it (FR-023) |
| Submit | The version shown to the user is sent with the decision |
| `ConflictException` | "This expense is no longer pending" or "has changed", then reload (Edge Cases) |

### Record a payment

| Step | Behavior |
|------|----------|
| Submit | `recordPayment` with `overpaymentConfirmed = false` |
| `OverpaymentConfirmationRequiredException` | A dialog shows the amount owed and the amount entered, with **Cancel as the default choice** (FR-032) |
| User confirms | The call repeats with `overpaymentConfirmed = true` |
| User cancels | Nothing is saved |

The comparison happens in the service, never in the dialog.

### Notifications

| Step | Behavior |
|------|----------|
| Login and after each action | The unread count refreshes (FR-019) |
| Open the list | Newest first. A "needs your approval" marker appears when the service reports `needsApproval`. Text is also used, not color alone |
| Activate an item | Marks it read and opens the expense if it still exists |
| Delivery | Stored in-app, and read at the next login if the user was signed out. No polling (research R-19) |

### Reports

| Step | Behavior |
|------|----------|
| Filters | Start date, end date, group, other user, status; all optional (FR-035) |
| Generate | The service builds the report, and **the UI does not total anything** |
| Display | Lines with status, totals, and filtered and current balances shown under separate labels (NC-8) |
| No matches | An empty table with zero totals (Story 8 scenario 4) |

## Manual verification

Swing behavior that can't reasonably be unit tested gets written manual steps linked to FRs, as Principle
V requires. See scenarios V-20 and later in [quickstart.md](../quickstart.md).
