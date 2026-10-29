# Feature Specification: SplitSmart Expense Sharing

**Feature Branch**: `001-splitsmart-expense-sharing`

**Created**: 2026-10-29

**Status**: Draft (AI-generated; requires human review per Constitution Principle VII)

**Input**: User description: "Read UserRequirement.md in this workspace as the authoritative
customer requirements. Write a testable SplitSmart feature specification: actors, user scenarios,
functional and non-functional requirements, acceptance criteria, requirement IDs (FR-001, etc.),
and open questions. Preserve all original customer features in the requirements inventory; label
the Java Swing MVP subset separately. Do not write Java code. Do not edit UserRequirement.md."

**Source of truth**: `UserRequirement.md` (read-only). Customer requirement IDs CR-01 to CR-10 are
defined in the constitution (`.specify/memory/constitution.md`). Where this spec and
`UserRequirement.md` differ, `UserRequirement.md` governs.

## Clarifications

### Session 2026-10-29

- Q: Who may approve an expense? → A: Any one participant other than the creator (FR-021).
- Q: Must the recipient confirm a payment before balances change? → A: No; a payment applies
  as soon as it is recorded (FR-031).

## Requirements Inventory

Every customer feature from `UserRequirement.md` is listed below. **Scope** says whether the
feature (or part of it) is in the **MVP**, which the constitution delivers as a Java Swing desktop
application (implementation decision ID-03), or is deferred to **Post-MVP**. Deferring a feature
does not remove it from the customer's requirements.

| CR    | Customer feature (from `UserRequirement.md`)                                   | MVP scope                                                     | Post-MVP scope                                          | FRs |
|-------|---------------------------------------------------------------------------------|---------------------------------------------------------------|---------------------------------------------------------|-----|
| CR-01 | User accounts; log in to see own expenses and balances                         | Register, log in, log out, see own data only                  | Password reset, profile editing                         | FR-001–FR-004 |
| CR-02 | Create and manage groups (roommates, trips, parties)                           | Create, rename, add/remove members, list groups               | Archive groups, group invitations                       | FR-005–FR-009 |
| CR-03 | Create expenses: amount, date, description, equal or % split, optional receipt image | All listed fields, including attaching a receipt image   | —                                                       | FR-010–FR-016 |
| CR-04 | Specify which users were involved so balances are adjusted                     | Choose payer and participants from group members              | —                                                       | FR-010, FR-026 |
| CR-05 | Notify users when other group members create an expense                        | In-app notifications shown at login and while signed in       | Notifications outside the app (e.g., email)             | FR-017–FR-019 |
| CR-06 | Review/approve expenses before they affect balances; single or multi-level     | Single-level approval                                         | Multi-level approval configured per group               | FR-020–FR-025 |
| CR-07 | Track what each user owes every other user across all expenses                 | Full pairwise balance tracking                                | —                                                       | FR-026–FR-029 |
| CR-08 | Record payments that settle balances                                           | Record and view payments                                      | —                                                       | FR-030–FR-033 |
| CR-09 | Reports of expenses, balances, payments; custom reports by date range and other parameters | Summary report with date-range, group, person, and status filters | Saved report definitions, export to file      | FR-034–FR-038 |
| CR-10 | OS supported: primary web-based                                                | **Not met by MVP** (see constitution open conflict OC-1)      | Web-browser access                                      | FR-039 |

**MVP subset (Java Swing)**: FR-001–FR-008, FR-010–FR-017, FR-019–FR-024, FR-026–FR-037,
FR-040, FR-041.

**Post-MVP**: FR-009 (archive), FR-018, FR-025, FR-038, FR-039.

## Actors

- **Registered User**: A person with a SplitSmart account. Can belong to any number of groups,
  create expenses, review expenses, record payments, and view their own balances and reports.
- **Group Creator / Group Admin**: The registered user who created a group. Manages the group's
  name and membership. A group has exactly one admin in the MVP.
- **Group Member**: A registered user who belongs to a group. Receives notifications about new
  expenses in that group and may be selected as a payer or participant.
- **Expense Creator**: The member who enters an expense. Defaults to being the payer.
- **Approver**: Any participant of a pending expense other than its creator (FR-021).
- **Visitor**: A person without an account or not logged in. Can only register or log in.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register and Log In (Priority: P1)

A person creates a SplitSmart account, logs in, and sees a home view with only their own groups,
balances, and notifications.

**Why this priority**: Every other feature depends on knowing who the user is (CR-01).

**Independent Test**: Register two accounts, log in as each, and confirm each sees only their own
(initially empty) data.

**Acceptance Scenarios**:

1. **Given** no account named "alex", **When** a visitor registers with username "alex", a display
   name, and a valid password, **Then** the account is created and the visitor can log in as alex.
2. **Given** an existing account "alex", **When** another visitor tries to register "alex" (any
   letter case), **Then** registration is refused with a message that the username is taken.
3. **Given** account "alex", **When** someone logs in with a wrong password, **Then** login is
   refused with a message that does not reveal whether the username or password was wrong.
4. **Given** alex is logged in, **When** alex logs out, **Then** no alex data is visible until
   someone logs in again.

---

### User Story 2 - Create a Group and Manage Members (Priority: P1)

A user creates a group (for example "Apartment 4B") and adds other registered users as members.

**Why this priority**: Expenses are shared within groups (CR-02); without a group there is no one
to split with.

**Independent Test**: Create a group, add two members, remove one, and confirm the member list and
each member's group list are correct.

**Acceptance Scenarios**:

1. **Given** alex is logged in, **When** alex creates group "Apartment 4B", **Then** the group
   exists with alex as its only member and its admin.
2. **Given** alex admins "Apartment 4B" and "sam" is registered, **When** alex adds sam, **Then**
   sam is a member and the group appears in sam's group list.
3. **Given** sam is a member with a non-zero balance in the group, **When** alex tries to remove
   sam, **Then** removal is refused and the outstanding balance is shown.
4. **Given** sam is a non-admin member, **When** sam tries to add or remove members, **Then** the
   action is refused.

---

### User Story 3 - Create an Expense with an Equal or Percentage Split (Priority: P1)

A group member enters an expense with amount, date, description, payer, participants, split
method, and optionally a receipt image.

**Why this priority**: Expense entry is the core of the product (CR-03, CR-04).

**Independent Test**: Create equal and percentage expenses and verify each participant's share,
including leftover cents, sums exactly to the total.

**Acceptance Scenarios**:

1. **Given** alex, sam, and jo are members, **When** alex enters $90.00 "Groceries" split equally
   among all three, **Then** the expense is saved as Pending with shares of $30.00 each.
2. **Given** the same group, **When** alex enters $100.00 split equally among three, **Then** the
   shares are $33.34, $33.33, $33.33 (the extra cent assigned by the documented rule in FR-012) and
   they total exactly $100.00.
3. **Given** the same group, **When** alex enters $200.00 split 50% / 30% / 20%, **Then** the
   shares are $100.00, $60.00, $40.00.
4. **Given** percentages of 50% / 30% / 15%, **When** alex saves, **Then** the expense is refused
   because the percentages total 95%, not 100%.
5. **Given** an amount of $0.00, a negative amount, or an amount with more than two decimals,
   **When** alex saves, **Then** the expense is refused with a message naming the amount field.
6. **Given** a valid expense, **When** alex attaches a receipt image, **Then** the image is saved
   with the expense and can be viewed later by any group member.

---

### User Story 4 - Approve or Reject a Pending Expense (Priority: P1)

An approver reviews a pending expense and approves or rejects it. Only approved expenses affect
balances.

**Why this priority**: The customer requires review before balances change (CR-06), and balances
(Story 5) depend on approval state.

**Independent Test**: Create a pending expense, confirm balances are unchanged, approve it, and
confirm balances change; reject another and confirm balances never change.

**Acceptance Scenarios**:

1. **Given** a pending $90.00 expense paid by alex, **When** balances are viewed, **Then** they do
   not include that expense.
2. **Given** the pending expense, **When** an authorized approver approves it, **Then** its status
   becomes Approved, balances update, and the decision, approver, and time are recorded.
3. **Given** a pending expense, **When** an approver rejects it with a reason, **Then** its status
   becomes Rejected, balances never include it, and the creator is notified with the reason.
4. **Given** alex created the expense, **When** alex tries to approve it, **Then** the action is
   refused.

---

### User Story 5 - View Balances Between Users (Priority: P1)

A user sees how much they owe each other user and how much each other user owes them, in total
and broken down by group.

**Why this priority**: Knowing who owes whom is the customer's main outcome (CR-07).

**Independent Test**: Approve a known set of expenses and check every pairwise balance against
hand-calculated values.

**Acceptance Scenarios**:

1. **Given** an approved $90.00 equal split paid by alex among alex, sam, and jo, **When** sam
   views balances, **Then** sam owes alex $30.00 and jo owes alex $30.00.
2. **Given** that expense plus an approved $60.00 expense paid by sam split equally between alex
   and sam, **When** alex views balances, **Then** sam owes alex $0.00 net ($30.00 − $30.00).
3. **Given** alex and sam share two groups, **When** alex views the balance with sam, **Then** the
   overall net amount and each group's amount are shown, and the group amounts add up to the
   overall net.

---

### User Story 6 - Record a Payment (Priority: P2)

A user records that they paid another user money to settle a balance.

**Why this priority**: Without payments, balances only grow (CR-08). Users can still track debts
without it, so it ranks below Stories 1–5.

**Independent Test**: With sam owing alex $30.00, record a $30.00 payment from sam to alex and
confirm the balance becomes $0.00.

**Acceptance Scenarios**:

1. **Given** sam owes alex $30.00, **When** sam records a $30.00 payment to alex, **Then** the
   balance between them becomes $0.00 and the payment appears in both users' payment history.
2. **Given** sam owes alex $30.00, **When** sam records a $40.00 payment, **Then** the system warns
   that this exceeds the amount owed and, if sam confirms, alex then owes sam $10.00.
3. **Given** any user, **When** they record a payment of $0.00 or a negative amount, **Then** it is
   refused.

---

### User Story 7 - Receive Notifications About New Expenses (Priority: P2)

When a member creates an expense, the other group members are notified.

**Why this priority**: Required by CR-05 and needed for approvers to learn of pending expenses,
but users can still find pending expenses by browsing the group.

**Independent Test**: alex creates an expense; log in as sam and jo and confirm each has one
unread notification; confirm alex has none for their own expense.

**Acceptance Scenarios**:

1. **Given** alex, sam, and jo are members, **When** alex creates an expense, **Then** sam and jo
   each receive a notification naming alex, the group, the description, and the amount, and alex
   does not.
2. **Given** sam has unread notifications, **When** sam logs in, **Then** the unread count is
   shown and sam can open the list and mark items read.
3. **Given** sam was removed from a group, **When** a new expense is created in that group,
   **Then** sam is not notified.

---

### User Story 8 - Generate Reports (Priority: P3)

A user produces a summary of their expenses, balances, and payments, filtered by date range and
other parameters.

**Why this priority**: Valuable for review (CR-09) but depends on all earlier stories.

**Independent Test**: Load a known set of expenses and payments across dates and groups, run
reports with different filters, and compare totals against hand-calculated values.

**Acceptance Scenarios**:

1. **Given** expenses on 2026-01-10, 2026-02-15, and 2026-03-20, **When** a user runs a report for
   2026-02-01 to 2026-02-28, **Then** only the 2026-02-15 expense is included.
2. **Given** a report with no filters other than the user, **When** it is generated, **Then** it
   shows total expenses involving the user, the user's total share, total paid, total received,
   and current net balance with each other user.
3. **Given** a date range whose end is before its start, **When** the report is requested,
   **Then** it is refused with an explanatory message.
4. **Given** filters that match nothing, **When** the report is generated, **Then** it shows an
   empty result with zero totals rather than an error.

---

### Edge Cases

- An expense whose only participant is the payer creates no debt. It is allowed only when the
  payer is not the creator, because the creator cannot approve their own expense.
- A payer who is not a participant (for example, alex pays for a gift for sam and jo) is owed the
  full amount by the participants.
- Equal split where the amount does not divide evenly (e.g., $0.01 among three): shares are
  $0.01, $0.00, $0.00 by the FR-012 rule and still total exactly the amount.
- Percentages with decimals (e.g., 33.33 / 33.33 / 33.34) are accepted when they total exactly
  100.00.
- An expense with no participant other than its creator has no eligible approver, so the system
  refuses it with a message to add another participant (follows from FR-021 and FR-022).
- A pending expense whose payer is not its creator is approved by any non-creator participant;
  the payer has no separate approval right unless they are also a participant.
- A user who is removed from a group keeps their history in that group visible in their reports.
- An expense or payment dated after today is refused; today and earlier dates are accepted.
- Very large amounts: amounts up to 1,000,000.00 are accepted; larger amounts are refused.
- Two users act on the same pending expense (one approves, one rejects): the first recorded
  decision wins and the second user is told the expense is no longer pending.
- A receipt file that is not a supported image type or exceeds the size limit is refused without
  losing the rest of the expense data entered.

## Requirements *(mandatory)*

All amounts below are in a single currency and are exact to the cent. "Group member" means a
current member unless stated otherwise.

### Functional Requirements

**User accounts (CR-01)**

- **FR-001** [MVP]: The system MUST let a visitor register with a username (3–30 characters,
  unique ignoring letter case), a display name, and a password of at least 8 characters.
- **FR-002** [MVP]: The system MUST let a registered user log in with username and password, and
  log out. Failed logins MUST NOT reveal which of the two was wrong.
- **FR-003** [MVP]: A logged-in user MUST only see groups they belong to, and only expenses,
  payments, balances, notifications, and reports involving them or those groups.
- **FR-004** [MVP]: Passwords MUST never be displayed or stored in readable form.

**Group management (CR-02)**

- **FR-005** [MVP]: A user MUST be able to create a group with a name (1–50 characters); the
  creator becomes its first member and its admin.
- **FR-006** [MVP]: The group admin MUST be able to add registered users as members and remove
  members. Non-admins MUST NOT add or remove members, but any member MAY leave a group.
- **FR-007** [MVP]: The system MUST refuse to remove (or let leave) a member whose net balance
  within that group is not $0.00.
- **FR-008** [MVP]: A user MUST be able to list their groups, view each group's members, and the
  admin MUST be able to rename the group.
- **FR-009** [Post-MVP]: The admin MUST be able to archive a group with all balances at $0.00;
  archived groups accept no new expenses but remain in reports.

**Expense creation (CR-03, CR-04)**

- **FR-010** [MVP]: A group member MUST be able to create an expense in that group with: amount
  (greater than 0, at most 1,000,000.00, at most two decimal places), date (not later than
  today), description (1–200 characters), payer (a group member, defaulting to the creator),
  one or more participants (group members), and split method (equal or percentage).
- **FR-011** [MVP]: For an equal split, each participant's share MUST be the amount divided by
  the number of participants, rounded down to the cent.
- **FR-012** [MVP]: Leftover cents from any split MUST be assigned one cent at a time to
  participants in the order they appear in the expense's participant list, so the shares always
  total exactly the expense amount.
- **FR-013** [MVP]: For a percentage split, each participant MUST have a percentage between 0 and
  100 with at most two decimal places, the percentages MUST total exactly 100.00, and each share
  MUST be the amount times the percentage, rounded down to the cent, with leftovers handled by
  FR-012.
- **FR-014** [MVP]: The creator MAY attach one receipt image (JPEG or PNG, at most 5 MB) to an
  expense; any group member MUST be able to view it.
- **FR-015** [MVP]: The system MUST refuse an invalid expense and name each invalid field, without
  discarding the other data entered.
- **FR-016** [MVP]: The creator MUST be able to edit or delete their expense while it is Pending.
  Approved and Rejected expenses MUST NOT be edited or deleted.

**Notifications (CR-05)**

- **FR-017** [MVP]: When an expense is created, every other current group member MUST receive an
  in-app notification stating the creator, group, description, amount, and date.
- **FR-018** [Post-MVP]: Users MUST be able to choose to receive notifications outside the
  application (for example, by email).
- **FR-019** [MVP]: Users MUST see an unread-notification count when logged in, open the list of
  notifications (newest first), and mark notifications as read. Notifications received while
  logged out MUST be shown at the next login.

**Approval workflow (CR-06)**

- **FR-020** [MVP]: Every new expense MUST start in Pending status and MUST NOT affect balances
  until Approved.
- **FR-021** [MVP]: An authorized approver MUST be able to approve or reject a Pending expense.
  An authorized approver is any participant of the expense other than its creator; one approval
  or one rejection decides the expense.
- **FR-022** [MVP]: The creator of an expense MUST NOT approve or reject it.
- **FR-023** [MVP]: Rejection MUST require a reason (1–200 characters); the creator MUST be
  notified of approvals and rejections, including the reason.
- **FR-024** [MVP]: Each decision MUST be recorded with approver, decision, reason (if any), and
  date and time, and MUST be visible to group members. Once decided, an expense's status MUST NOT
  change.
- **FR-025** [Post-MVP]: A group admin MUST be able to configure multi-level approval (a number
  of required approvals or an ordered list of approvers) for the group.

**Balance tracking (CR-07)**

- **FR-026** [MVP]: For each Approved expense, each participant other than the payer MUST owe the
  payer their share. The payer's own share MUST NOT create a debt.
- **FR-027** [MVP]: The system MUST maintain the net balance between every pair of users across
  all groups, combining all Approved expenses and all recorded payments.
- **FR-028** [MVP]: A user MUST be able to view, for every other user they share a balance with,
  the net amount and direction (owes me / I owe), with a per-group breakdown that adds up to the
  net amount.
- **FR-029** [MVP]: Across the whole system, the sum of all amounts owed MUST equal the sum of
  all amounts due, to the cent.

**Payment tracking (CR-08)**

- **FR-030** [MVP]: A user MUST be able to record a payment they made to another user with
  amount (greater than 0, at most two decimals), date (not later than today), optional group, and
  optional note (up to 200 characters).
- **FR-031** [MVP]: A recorded payment MUST reduce what the payer owes the recipient by the
  payment amount as soon as it is recorded; the recipient does not need to confirm it.
- **FR-032** [MVP]: When a payment exceeds the amount currently owed, the system MUST warn the
  payer and require confirmation before recording it.
- **FR-033** [MVP]: Both payer and recipient MUST be able to view the payment in their payment
  history.

**Reporting (CR-09)**

- **FR-034** [MVP]: A user MUST be able to generate a report of their expenses, balances, and
  payments.
- **FR-035** [MVP]: Reports MUST support filtering by date range (inclusive start and end), group,
  other user, and expense status, in any combination.
- **FR-036** [MVP]: A report MUST list each matching expense and payment and show totals: total
  amount of expenses, the user's total share, total paid by the user, total received by the user,
  and the net balance with each other user.
- **FR-037** [MVP]: Report totals MUST agree to the cent with the balances in FR-027 for the same
  data.
- **FR-038** [Post-MVP]: Users MUST be able to save report filter settings by name and export a
  report to a file.

**Platform (CR-10)**

- **FR-039** [Post-MVP]: Users MUST be able to use SplitSmart through a web browser. *(MVP does not
  meet CR-10; see constitution OC-1.)*

**Data**

- **FR-040** [MVP]: All accounts, groups, expenses, receipt images, approvals, notifications, and
  payments MUST persist across application restarts.
- **FR-041** [MVP]: Dates MUST be shown and entered in a single consistent format, and amounts
  MUST always be shown with two decimal places and a currency symbol.

### Non-Functional Requirements

- **NFR-001 Accuracy**: All money calculations MUST be exact to the cent, with no accumulated
  rounding difference after any number of expenses and payments.
- **NFR-002 Security**: Stored passwords MUST be in a non-reversible form. Five consecutive failed
  logins for an account MUST block further attempts on that account for 5 minutes.
- **NFR-003 Privacy**: No screen or report MAY show data from a group the user does not belong to.
- **NFR-004 Performance**: With up to 50 users, 50 groups, and 10,000 expenses, any screen or
  report MUST appear within 2 seconds on a typical student laptop.
- **NFR-005 Reliability**: Data saved before a normal or unexpected application exit MUST be
  present on restart.
- **NFR-006 Auditability**: Approval decisions and payments MUST record who acted and when, and
  MUST NOT be altered after being saved.
- **NFR-007 Usability**: Error messages MUST name the field at fault and how to fix it. Each
  primary task (register, create group, create expense, approve, record payment, run report) MUST
  be reachable from the home view in at most 3 steps.
- **NFR-008 Accessibility**: All primary tasks MUST be completable using only the keyboard.
- **NFR-009 Testability**: Every business rule (split, approval, balance, payment, report total)
  MUST be verifiable automatically without operating the user interface.

### Key Entities

- **User**: A person with an account. Username, display name, password (protected), groups.
- **Group**: A named set of users. Name, admin, members, status (active / archived).
- **Membership**: A user's participation in a group, with join date and, if they left, leave date.
- **Expense**: Something paid for one or more people. Group, creator, payer, amount, date,
  description, split method, status (Pending / Approved / Rejected), optional receipt image.
- **Share**: One participant's portion of an expense. Participant, percentage (if a percentage
  split), amount.
- **Approval Decision**: Approver, expense, decision (approve / reject), reason, date and time.
- **Payment**: Money paid from one user to another. Payer, recipient, amount, date, optional
  group, optional note.
- **Notification**: Recipient, related expense or decision, message, created time, read flag.
- **Balance**: Derived, not entered. Net amount between two users, overall and per group.
- **Report**: Derived, not stored in the MVP. Filter settings plus the matching items and totals.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can register, log in, create a group, and add two members in under
  3 minutes on their first attempt.
- **SC-002**: A user can enter a complete expense (including choosing participants and split) in
  under 1 minute.
- **SC-003**: For a reference data set of at least 100 expenses and 20 payments, 100% of pairwise
  balances match hand-calculated values to the cent.
- **SC-004**: In 100% of tested splits, the participants' shares total exactly the expense amount.
- **SC-005**: 0 pending or rejected expenses affect any displayed balance or report total.
- **SC-006**: 100% of other group members see a notification for a new expense at or before their
  next login.
- **SC-007**: Report totals agree with displayed balances to the cent for 100% of tested filter
  combinations.
- **SC-008**: Every MVP functional requirement has at least one passing automated test or
  documented manual test.
- **SC-009**: At least 9 of 10 test users complete the "split a dinner bill and settle up" task
  without help.

## Assumptions

- **Single currency**: All amounts use one currency (US dollars); currency conversion is out of
  scope.
- **Payer**: The customer request does not name a payer; the spec assumes every expense has
  exactly one payer, defaulting to the creator.
- **Balance scope**: "Balance owed by each user to every other user" is read as a net balance per
  pair of users across all groups, with a per-group breakdown.
- **Notification audience**: "Other group members" means all current members of the expense's
  group except its creator, not only the participants.
- **Single-level approval in MVP**: The customer allows "multiple levels of approval or a single
  review process"; MVP implements single-level approval, and multi-level is Post-MVP (FR-025).
- **Debt simplification**: Balances are not simplified across users (e.g., A owes B, B owes C is
  not turned into A owes C).
- **Local use**: The MVP runs for users on one shared installation; multi-computer synchronization
  is out of scope until FR-039.
- **Receipt images**: Images are stored with the application's data; image editing and text
  recognition are out of scope.
- **Account recovery**: Password reset and email verification are out of scope for MVP.

## Open Questions

| ID  | Question | Related | Default if unanswered |
|-----|----------|---------|-----------------------|
| Q1  | Who may approve an expense? | CR-06, FR-021 | **Resolved 2026-10-29**: any one participant other than the creator |
| Q2  | Must the recipient confirm a payment before balances change? | CR-08, FR-031 | **Resolved 2026-10-29**: no; payments apply immediately |
| Q3  | Will the customer accept a desktop MVP instead of web-based delivery (constitution OC-1)? | CR-10, FR-039 | Treated as an accepted deviation for MVP only, pending written confirmation |
| Q4  | Which "other parameters" should custom reports support beyond date range? | CR-09, FR-035 | Group, other user, expense status |
| Q5  | Should rejected expenses be resubmittable after correction? | CR-06 | No; the creator creates a new expense |
| Q6  | Can a member who leaves a group rejoin with their history intact? | CR-02 | Yes; history is kept and linked |
| Q7  | Should notifications also cover approvals, rejections, and payments, or only new expenses as stated? | CR-05 | New expenses (required) plus decisions on the creator's own expenses |
