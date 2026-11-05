# Feature Specification: SplitSmart Expense Sharing

**Feature ID**: `001-splitsmart-expense-sharing`
**Created**: 2026-10-29 | **Reconciled**: 2026-11-05 | **Clarified by**: Daniel Raskin, 2026-10-29
**Status**: **Draft — Reconciliation Incomplete.** AI-reconciled. Not reviewed under Constitution Principle VII. Not ready for task generation or implementation while [DEC-01](decisions/decision-log.md#dec-01-platform-oc-1) is open.
**Source of truth**: [`UserRequirement.md`](../../UserRequirement.md) (read-only). CR IDs are defined in the [constitution](../../.specify/memory/constitution.md). Where this spec differs from `UserRequirement.md`, `UserRequirement.md` governs.

Requirement wording that the reconciliation changed is marked **(revised)** and listed in the [change history](#change-history), with the original text. Decisions marked PROPOSED are normative in this baseline and await confirmation by the owner named in the [decision log](decisions/decision-log.md).

## Open blockers

| Item | State | Effect |
|---|---|---|
| **OC-1 / CR-10** ([DEC-01](decisions/decision-log.md#dec-01-platform-oc-1)) | **OPEN / BLOCKING** | The customer asked for a primarily web-based product. The MVP is a desktop application and **does not satisfy CR-10**. No written acceptance of this deviation exists |
| **Mobile wording** ([DEC-02](decisions/decision-log.md#dec-02-android-and-ios)) | **OPEN** | The lab handout's copy of the request also mentions Android and iOS apps. No mobile requirement exists here, pending the instructor's answer |

## Product summary

SplitSmart lets friends, roommates, family members, or coworkers share expenses. People register, form groups, enter expenses split equally or by percentage, approve them, see who owes whom, record payments, and run reports.

**In the MVP:** FR-001–FR-008, FR-010–FR-017, FR-019–FR-024, FR-026–FR-037, FR-040, FR-041.

**Deferred, not deleted (Post-MVP):** FR-009, FR-018, FR-025, FR-038, FR-039.

**Explicitly excluded from the MVP:** web or mobile clients, use across separate computers, email or push notifications, multi-level approval, saved or exported reports, password reset, profile editing, group invitations, group archiving, currency conversion, debt simplification across users, image editing, and text recognition.

## Clarifications

### Session 2026-10-29 (confirmed by Daniel Raskin)

- Who may approve an expense? Any one participant other than the creator (FR-021).
- Must the recipient confirm a payment before balances change? No; a payment applies as soon as it is recorded (FR-031).
- Are balances and payments per group or combined? Per group; every payment names a group, and the overall balance between two people is the sum of their group balances (FR-027, FR-030).
- Who can be the payer, and must the payer share the cost? Exactly one payer, any group member, defaulting to the creator; the payer need not be a participant (FR-010).
- Who gets leftover cents? Round every share down, then give one leftover cent each to participants in the order they were listed (FR-011–FR-013).
- Who is notified of a new expense? Every other current group member; participants other than the creator see it flagged "needs your approval" (FR-017).
- Password and login protection? At least 8 characters; 5 consecutive failed logins lock the account for 5 minutes (FR-001, NFR-002).

### Reconciliation 2026-11-05 (PROPOSED, awaiting owner confirmation)

See the [decision log](decisions/decision-log.md). The rules are stated in [Business rules](#business-rules) below.

## Requirements inventory

| CR | Customer feature (from `UserRequirement.md`) | MVP scope | Post-MVP scope | FRs |
|---|---|---|---|---|
| CR-01 | User accounts; log in to see own expenses and balances | Register, log in, log out, see own data only | Password reset, profile editing (no FR yet, DEC-32) | FR-001–FR-004 |
| CR-02 | Create and manage groups | Create, rename, add and remove members, leave, list | Archive groups (FR-009), invitations (no FR yet, DEC-32) | FR-005–FR-009 |
| CR-03 | Create expenses: amount, date, description, equal or % split, optional receipt image | All listed fields, including a receipt image | — | FR-010–FR-016 |
| CR-04 | Specify which users were involved | Choose payer and participants from group members | — | FR-010, FR-026 |
| CR-05 | Notify users when other group members create an expense | In-app notifications, shown at login and while signed in | Notifications outside the app (FR-018) | FR-017–FR-019 |
| CR-06 | Review and approve expenses before they affect balances | Single-level approval | Multi-level approval per group (FR-025) | FR-020–FR-025 |
| CR-07 | Track what each user owes every other user | Full pairwise balances per group and overall | — | FR-026–FR-029 |
| CR-08 | Record payments that settle balances | Record and view payments | — | FR-030–FR-033 |
| CR-09 | Reports; custom reports by date range and other parameters | Report with date, group, other-user, and status filters | Saved definitions, export (FR-038) | FR-034–FR-038 |
| CR-10 | OS supported: primary web-based | **Not met by the MVP. OC-1 is open** | Web-browser access (FR-039) | FR-039 |

## Actors

| Actor | Definition |
|---|---|
| **Visitor** | Not logged in. Can register or log in, and nothing else |
| **Registered User** | Has an account. Can create groups and sees only data allowed by [visibility rules](#former-member-visibility) |
| **Group Member** | A registered user with an active membership in a group. "Group member" means current member unless stated otherwise |
| **Former Member** | A user whose membership in a group has ended and who has no active membership there |
| **Group Admin** | The one member who manages a group's name and membership. Initially the creator; changes only under BR-23 |
| **Expense Creator** | The member who entered an expense |
| **Payer** | The one member recorded as having paid an expense. Defaults to the creator |
| **Participant** | A member who shares an expense's cost |
| **Approver** | A participant other than the creator who is an active member |

The MVP has no external actor or external system.

## Use cases

Each use case has an observable postcondition. Failure rules are in the matching FRs and [Validation and error behavior](#validation-and-error-behavior).

| ID | Use case | Actor | Preconditions | Main flow | Alternate and error flows | Postcondition | FRs |
|---|---|---|---|---|---|---|---|
| UC-01 | Register | Visitor | On the login screen | Enter username, display name, password; submit | Username taken; password too short; other invalid fields are named | Account exists; visitor may log in | FR-001, FR-004 |
| UC-02 | Log in | Visitor | Account exists | Enter credentials; Home opens | Wrong credentials give one generic message; five failures lock the account | Signed-in session; unread count shown | FR-002, FR-019, NFR-002 |
| UC-03 | Log out | User | Signed in | Choose Log Out | — | No user data is visible | FR-002 |
| UC-04 | Manage a group | User, Admin, Member | Signed in | Create; rename; add a member by exact username; list; view members | Non-admin refused; unknown username; already a member | Membership recorded | FR-005, FR-006, FR-008 |
| UC-05 | Leave or remove a member | Member, Admin | Active member | Member leaves, or admin removes a member | Refused with details if BR-22 fails | Membership ended; BR-23 applied if the admin left | FR-006, FR-007 |
| UC-06 | Create an expense | Member | Active member | Enter fields; list participants in order; optionally attach a receipt | All invalid fields named; entered data kept | Pending expense with shares; other members notified; balances unchanged | FR-010–FR-015, FR-017, FR-020 |
| UC-07 | Edit or delete a Pending expense | Creator | Expense is Pending | Change fields or delete | Refused if not creator, decided, or the version is stale | Revised shares, or expense removed | FR-016 |
| UC-08 | View a receipt | Member | Expense has a receipt | Open the receipt | Corrupt file gives a message | Image displayed | FR-014 |
| UC-09 | Approve or reject | Approver | Expense is Pending | Open the expense; approve, or reject with a reason | Creator or non-participant refused; reason missing; already decided or changed | Immutable decision; status final; creator notified; Approved enters balances | FR-021–FR-024 |
| UC-10 | Read notifications | User | Signed in | See the count; open the list; mark read | — | Read state recorded | FR-017, FR-019, FR-023 |
| UC-11 | View balances | User | Signed in | Open Balances | — | Net amount, direction, and per-group breakdown shown | FR-027, FR-028 |
| UC-12 | Record a payment | Member (payer) | Payer and recipient are active members of the group | Enter group, recipient, amount, date, optional note | Invalid fields named; overpayment warning; on cancel nothing is saved | Immutable payment; balance changes at once; visible to both | FR-030–FR-033 |
| UC-13 | Generate a report | User | Signed in | Set optional filters; generate | Reversed dates refused; no matches gives zero totals | Lines, totals, memo, and reconciliation shown | FR-034–FR-037 |

## User stories and acceptance scenarios

### Story 1: Register and log in (P1)

*Independent test:* Register two accounts, log in as each, and confirm each sees only their own empty data.

1. **Given** no account "alex", **when** a visitor registers "alex" with a display name and valid password, **then** the account is created and alex can log in.
2. **Given** account "alex", **when** another visitor registers "alex" in any letter case, **then** registration is refused with a message that the username is taken.
3. **Given** account "alex", **when** someone logs in with a wrong password, **then** the message does not reveal whether the username or password was wrong.
4. **Given** alex is logged in, **when** alex logs out, **then** no alex data is visible until someone logs in again.
5. **Given** a 7-character password, **when** a visitor registers, **then** registration is refused, stating the 8-character minimum.
6. **Given** 5 consecutive failed logins for "alex", **when** anyone logs in as alex within the next 5 minutes, even with the correct password, **then** login is refused with a message that the account is temporarily locked; from exactly 5 minutes on, the correct password works.

### Story 2: Create a group and manage members (P1)

*Independent test:* Create a group, add two members, remove one, and check each member list and group list.

1. **Given** alex is logged in, **when** alex creates "Apartment 4B", **then** alex is its only member and its admin.
2. **Given** alex is admin and "sam" is registered, **when** alex adds sam, **then** sam is a member and the group appears in sam's list.
3. **Given** sam has a non-zero balance with anyone in the group, **when** alex removes sam, **then** removal is refused and the outstanding balances are shown.
4. **Given** sam is not the admin, **when** sam adds or removes a member, **then** the action is refused.
5. **(added)** **Given** sam owes alex $10.00 and jo owes sam $10.00, **when** sam tries to leave, **then** it is refused even though sam's net is $0.00.
6. **(added)** **Given** sam is creator, payer, or participant of a Pending expense, **when** sam leaves or is removed, **then** it is refused and the expense is named.
7. **(added)** **Given** alex is admin, sam joined before jo, and alex meets all exit conditions, **when** alex leaves, **then** sam becomes admin.

### Story 3: Create an expense with an equal or percentage split (P1)

*Independent test:* Create equal and percentage expenses and verify that shares, including leftover cents, total exactly the amount.

1. **Given** alex, sam, and jo are members, **when** alex enters $90.00 split equally among all three, **then** it is saved as Pending with shares of $30.00 each.
2. **When** alex enters $100.00 split equally among three, **then** shares are $33.34, $33.33, $33.33 and total exactly $100.00.
3. **When** alex enters $200.00 split 50 / 30 / 20 %, **then** shares are $100.00, $60.00, $40.00.
4. **Given** percentages of 50 / 30 / 15, **when** alex saves, **then** it is refused because they total 95%.
5. **Given** $0.00, a negative amount, or more than two decimals, **when** alex saves, **then** it is refused, naming the amount field.
6. **Given** a valid expense with a receipt image attached, **then** the image is saved and any active group member can view it.

### Story 4: Approve or reject a Pending expense (P1)

*Independent test:* Confirm balances are unchanged while Pending, change on approval, and never change on rejection.

1. **Given** a Pending $90.00 expense paid by alex, **when** balances are viewed, **then** they exclude it.
2. **When** an approver approves it, **then** it becomes Approved, balances update, and the decision, approver, and time are recorded.
3. **When** an approver rejects it with a reason, **then** it becomes Rejected, balances never include it, and the creator is notified with the reason.
4. **Given** alex created it, **when** alex tries to approve it, **then** the action is refused.

### Story 5: View balances between users (P1)

*Independent test:* Approve a known set of expenses and check every pairwise balance against hand calculation.

1. **Given** an Approved $90.00 equal split paid by alex among alex, sam, and jo, **when** sam views balances, **then** sam owes alex $30.00 and jo owes alex $30.00.
2. **Given** that expense plus an Approved $60.00 expense paid by sam split equally between alex and sam, **when** alex views balances, **then** sam owes alex $0.00 net.
3. **Given** alex and sam share two groups, **when** alex views the balance with sam, **then** the overall net and each group's amount are shown and add up.

### Story 6: Record a payment (P2)

*Independent test:* With sam owing alex $30.00, record $30.00 from sam to alex and confirm the balance is $0.00.

1. **Given** sam owes alex $30.00 in "Apartment 4B", **when** sam records $30.00 to alex there, **then** that balance is $0.00 and both histories show the payment.
2. **When** sam records $40.00 there instead, **then** the system warns of overpayment and, if sam confirms, alex owes sam $10.00 in that group.
3. **Given** sam owes alex $30.00 in "Apartment 4B" and $0.00 in "Ski Trip", **when** sam records $30.00 in "Ski Trip", **then** the system warns of overpayment for that group and "Apartment 4B" is unchanged.
4. **When** anyone records $0.00, a negative amount, or no group, **then** it is refused.

### Story 7: Receive notifications about new expenses (P2)

*Independent test:* alex creates an expense; sam and jo each have one unread notification; alex has none.

1. **Given** alex, sam, and jo are members, **when** alex creates an expense, **then** sam and jo are notified of creator, group, description, amount, and date, and alex is not.
2. **Given** participants alex and sam only, **then** sam's notification is marked "needs your approval" and jo's is not.
3. **Given** sam has unread notifications, **when** sam logs in, **then** the unread count is shown and sam can open the list and mark items read.
4. **Given** sam was removed from a group, **when** a new expense is created there, **then** sam is not notified.

### Story 8: Generate reports (P3)

*Independent test:* Load known data across dates and groups, run filtered reports, and compare with hand calculation.

1. **Given** expenses on 2026-01-10, 2026-02-15, and 2026-03-20, **when** a user reports on 2026-02-01 to 2026-02-28, **then** only the 2026-02-15 expense is listed.
2. **Given** no filters, **when** the report is generated, **then** it shows the total of expenses involving the user, the user's share, total paid, total received, and current net with each other user.
3. **Given** an end date before the start date, **then** the report is refused with an explanation.
4. **Given** filters that match nothing, **then** the report shows an empty result with zero totals, not an error.
5. **(added)** **Given** any date filter, **then** each other user's line shows opening + period + later = current, and current equals the Balances screen for the same group scope.
6. **(added)** **Given** a status filter of Pending, **then** Pending lines are listed, money totals are $0.00 for them, and a memo shows their count and amount as not included in totals.

## Requirements

All amounts are in one currency and exact to the cent.

### Functional requirements

**User accounts (CR-01)**

- **FR-001** [MVP]: The system MUST let a visitor register with a username (3–30 characters, unique ignoring letter case), a display name, and a password of at least 8 characters.
- **FR-002** [MVP]: The system MUST let a registered user log in with username and password, and log out. Failed logins MUST NOT reveal which of the two was wrong.
- **FR-003** [MVP] **(revised)**: A logged-in user MUST only see groups they currently belong to, and only expenses, payments, balances, notifications, and reports involving them or those groups, plus the former-member history defined in [Former-member visibility](#former-member-visibility).
- **FR-004** [MVP]: Passwords MUST never be displayed or stored in readable form.

**Group management (CR-02)**

- **FR-005** [MVP]: A user MUST be able to create a group with a name (1–50 characters); the creator becomes its first member and its admin.
- **FR-006** [MVP]: The group admin MUST be able to add registered users as members and remove members. Non-admins MUST NOT add or remove members, but any member MAY leave a group.
- **FR-007** [MVP] **(revised)**: The system MUST refuse to remove, or let leave, a member who has a non-zero pairwise balance with anyone in that group, or who is creator, payer, or participant of a Pending expense in that group. The refusal MUST show the balances or expenses at fault.
- **FR-008** [MVP]: A user MUST be able to list their groups and view each group's members, and the admin MUST be able to rename the group.
- **FR-009** [Post-MVP]: The admin MUST be able to archive a group with all balances at $0.00; archived groups accept no new expenses but remain in reports.

**Expense creation (CR-03, CR-04)**

- **FR-010** [MVP]: A group member MUST be able to create an expense in that group with: amount (greater than 0, at most 1,000,000.00, at most two decimal places), date (not later than today), description (1–200 characters), exactly one payer (any group member, defaulting to the creator), one or more participants (group members; the payer MAY or MAY NOT be among them), and split method (equal or percentage). Multiple payers per expense are not supported.
- **FR-011** [MVP]: For an equal split, each participant's share MUST be the amount divided by the number of participants, rounded down to the cent.
- **FR-012** [MVP]: Leftover cents from any split MUST be assigned one cent at a time to participants in the order the creator listed them, starting with the first, so the shares always total exactly the expense amount. The participant order MUST be saved with the expense so shares are reproducible.
- **FR-013** [MVP]: For a percentage split, each participant MUST have a percentage between 0 and 100 with at most two decimal places, the percentages MUST total exactly 100.00, and each share MUST be the amount times the percentage, rounded down to the cent, with leftovers handled by FR-012.
- **FR-014** [MVP]: The creator MAY attach one receipt image (JPEG or PNG, at most 5 MB) to an expense; any group member MUST be able to view it.
- **FR-015** [MVP]: The system MUST refuse an invalid expense and name each invalid field, without discarding the other data entered.
- **FR-016** [MVP]: The creator MUST be able to edit or delete their expense while it is Pending. Approved and Rejected expenses MUST NOT be edited or deleted.

**Notifications (CR-05)**

- **FR-017** [MVP]: When an expense is created, every other current group member MUST receive an in-app notification stating the creator, group, description, amount, and date. For each participant other than the creator, the notification MUST also be marked "needs your approval" while the expense is Pending.
- **FR-018** [Post-MVP]: Users MUST be able to choose to receive notifications outside the application (for example, by email).
- **FR-019** [MVP]: Users MUST see an unread-notification count when logged in, open the list of notifications (newest first), and mark notifications as read. Notifications received while logged out MUST be shown at the next login.

**Approval workflow (CR-06)**

- **FR-020** [MVP]: Every new expense MUST start in Pending status and MUST NOT affect balances until Approved.
- **FR-021** [MVP]: An authorized approver MUST be able to approve or reject a Pending expense. An authorized approver is any participant of the expense other than its creator; one approval or one rejection decides the expense.
- **FR-022** [MVP]: The creator of an expense MUST NOT approve or reject it.
- **FR-023** [MVP]: Rejection MUST require a reason (1–200 characters); the creator MUST be notified of approvals and rejections, including the reason.
- **FR-024** [MVP]: Each decision MUST be recorded with approver, decision, reason (if any), and date and time, and MUST be visible to group members. Once decided, an expense's status MUST NOT change.
- **FR-025** [Post-MVP]: A group admin MUST be able to configure multi-level approval (a number of required approvals or an ordered list of approvers) for the group.

**Balance tracking (CR-07)**

- **FR-026** [MVP]: For each Approved expense, each participant other than the payer MUST owe the payer their share. The payer's own share MUST NOT create a debt.
- **FR-027** [MVP]: The system MUST maintain, for each group, the net balance between every pair of users in that group, combining the group's Approved expenses and recorded payments. The overall balance between two users MUST equal the sum of their per-group balances.
- **FR-028** [MVP]: A user MUST be able to view, for every other user they share a balance with, the net amount and direction (owes me / I owe), with a per-group breakdown that adds up to the net amount.
- **FR-029** [MVP]: Across the whole system, the sum of all amounts owed MUST equal the sum of all amounts due, to the cent.

**Payment tracking (CR-08)**

- **FR-030** [MVP] **(revised)**: A user MUST be able to record a payment they made to another user with amount (greater than 0, at most 1,000,000.00, at most two decimals), date (not later than today), group (required; a group both users currently belong to), and optional note (up to 200 characters).
- **FR-031** [MVP]: A recorded payment MUST reduce what the payer owes the recipient in the payment's group by the payment amount as soon as it is recorded; the recipient does not need to confirm it.
- **FR-032** [MVP]: When a payment exceeds the amount the payer currently owes the recipient in that group, the system MUST warn the payer and require confirmation before recording it.
- **FR-033** [MVP]: Both payer and recipient MUST be able to view the payment in their payment history.

**Reporting (CR-09)**

- **FR-034** [MVP]: A user MUST be able to generate a report of their expenses, balances, and payments.
- **FR-035** [MVP] **(revised)**: Reports MUST support filtering by date range (inclusive start and end, using expense date and payment date), group, other user, and expense status, in any combination. The status filter selects expense lines only.
- **FR-036** [MVP] **(revised)**: A report MUST list each matching expense and payment and show: total amount of matching Approved expenses, the user's total share of them, total settlement payments paid by the user, total settlement payments received by the user, a labeled memo of matching expenses by status, and, for each other user, opening, period, later, and current net balances.
- **FR-037** [MVP] **(revised)**: On every line, opening + period + later MUST equal current. Current MUST agree to the cent with the balances in FR-027 for the same group scope. Pending and Rejected expenses MUST NOT enter any money total or net balance.
- **FR-038** [Post-MVP]: Users MUST be able to save report filter settings by name and export a report to a file.

**Platform (CR-10)**

- **FR-039** [Post-MVP]: Users MUST be able to use SplitSmart through a web browser. *(The MVP does not meet CR-10; see OC-1 and DEC-01.)*

**Data (derived; no CR states these, see DEC-22)**

- **FR-040** [MVP]: All accounts, groups, expenses, receipt images, approvals, notifications, and payments MUST persist across application restarts.
- **FR-041** [MVP]: Dates MUST be shown and entered in a single consistent format, and amounts MUST always be shown with two decimal places and a currency symbol.

### Non-functional requirements

Measurement definitions come from [DEC-28](decisions/decision-log.md#dec-28-measurement-definitions). **No NFR has been verified. No software exists.** Test IDs refer to the [validation plan](validation-plan.md).

| ID | Normative statement | Measurable acceptance criterion | Verified by |
|---|---|---|---|
| **NFR-001 Accuracy** | All money calculations MUST be exact to the cent, with no accumulated rounding difference after any number of expenses and payments | Entered amounts with more than 2 decimals are refused, not rounded. Shares always total the amount. On the reference set of at least 100 expenses and 20 payments, 100% of pairwise balances match hand calculation, and total owed equals total due | UT-01, UT-02, UT-05, SI-07 |
| **NFR-002 Security** | Stored passwords MUST be in a non-reversible form. Five consecutive failed logins for an account MUST block further attempts on that account for 5 minutes; a successful login resets the failure count | Lock holds at +4:59 and releases at +5:00 on a controlled clock. Attempts during a lock neither count nor extend it. Four failures, a success, then four failures do not lock. Lock survives a restart. No readable password appears in the database or logs | SI-01, SI-02, RP-02, SEC-01 |
| **NFR-003 Privacy (revised)** | No screen or report MAY show data from a group the user does not belong to, except the personal history a former member keeps under [Former-member visibility](#former-member-visibility) | Every read operation returns nothing and reveals nothing to an outsider. Results are identical for an existing and a nonexistent group. Each row of the visibility table has a passing case | SEC-02, SEC-03 |
| **NFR-004 Performance (revised)** | With up to 50 users, 50 groups, and 10,000 expenses, any screen or report MUST appear within 2 seconds on a typical student laptop | On the DEC-28 reference machine and dataset, the 95th percentile of 20 warm runs is at most 2.0 seconds per screen and report, from the triggering action to rendered result. Login includes password hashing. **Unmeasured** | PERF-01, PERF-02 |
| **NFR-005 Reliability** | Data saved before a normal or unexpected application exit MUST be present on restart | After a forced process kill, every committed record is present, no uncommitted record is partially present, and the database integrity check passes. Power loss is outside this requirement's "application exit" wording and is not verified | RP-03, RP-04 |
| **NFR-006 Auditability** | Approval decisions and payments MUST record who acted and when, and MUST NOT be altered after being saved | Each record carries actor and time from the application clock. No application operation can update or delete one. Direct edits to the data file are outside this control (DEC-29) | SI-05, RP-05 |
| **NFR-007 Usability (revised)** | Error messages MUST name the field at fault and how to fix it. Each primary task (create group, create expense, approve, record payment, run report) MUST be reachable from the home view in at most 3 steps, and register from the login screen in at most 3 steps | A step is one activation that changes the view or commits an action (DEC-21). Step counts match the [navigation table](contracts/ui-interactions.md#navigation). Every validation message is reviewed against this wording | UI-01, UI-02 |
| **NFR-008 Accessibility** | All primary tasks MUST be completable using only the keyboard | The written task script in UI-03 completes every primary task with the mouse disconnected, and focus is always visible | UI-03 |
| **NFR-009 Testability** | Every business rule (split, approval, balance, payment, report total) MUST be verifiable automatically without operating the user interface | All BR rules below have automated cases that run with no display. A source scan fails the build if GUI imports appear outside the UI layer | ARCH-01, all UT and SI cases |

## Business rules

This catalog is the one definition of each rule. [design.md](design.md#3-business-rule-enforcement) names the enforcing component, and the [validation plan](validation-plan.md) names the test.

| ID | Rule | Source |
|---|---|---|
| BR-01 | An expense has exactly one payer, who defaults to the creator, may be any active group member, and need not participate | FR-010 |
| BR-02 | Participants are one or more distinct active members, kept in the creator's listed order | FR-010, FR-012 |
| BR-03 | At least one participant is not the creator; otherwise nobody could approve | Edge cases, FR-021, FR-022 |
| BR-04 | Equal split: floor each share to the cent, then apply BR-06 | FR-011 |
| BR-05 | Percentage split: each 0.00–100.00 with at most 2 decimals, total exactly 100.00; floor each share to the cent, then apply BR-06 | FR-013 |
| BR-06 | Leftover cents go one each to participants in listed order, starting with the first and regardless of percentage, including 0%. Shares always total the amount | FR-012, DEC-18 |
| BR-07 | A $0.00 share is valid, creates no debt, and leaves the person a participant who may approve | Edge cases, DEC-18 |
| BR-08 | Pending and Rejected expenses never affect balances. Only Approved expenses create debts | FR-020, FR-026 |
| BR-09 | An eligible approver is a participant other than the creator who is an active member. The payer has no approval right unless also a participant | FR-021, FR-022 |
| BR-10 | One decision settles an expense, and the first recorded decision wins. Rejection needs a reason of 1–200 characters; approval may carry one of up to 200. Decisions are immutable | FR-021, FR-023, FR-024 |
| BR-11 | Only the creator may edit or delete, and only while Pending. The group never changes. Approved and Rejected are final. Rejected expenses are not resubmitted | FR-016, DEC-19 |
| BR-12 | For an Approved expense, each non-payer participant owes the payer their share. The payer's own share creates no debt | FR-026 |
| BR-13 | Debts net per group and pair. The overall balance is the sum across groups. Total owed equals total due. No simplification across users | FR-027, FR-029 |
| BR-14 | The payer is always the recording user. Both people are active members of the named group, and they differ. The amount applies immediately | FR-030, FR-031, DEC-20 |
| BR-15 | An amount above what the payer owes in that group needs confirmation of the amount shown. A changed amount owed means a new warning | FR-032, DEC-27 |
| BR-16 | Payer and recipient both see the payment in history, including after leaving the group | FR-033, DEC-07 |
| BR-17 | A new expense notifies every other active member with creator, group, description, amount, and date. "Needs your approval" is true only while Pending, for non-creator participants | FR-017 |
| BR-18 | The creator is notified of each decision. Edits notify only people who newly became participants. Deletes create no notification. Payments create no notification | FR-023, DEC-16, DEC-17 |
| BR-19 | Report lines cover expenses where the user is creator, payer, or participant and payments where the user is a party. Dates are inclusive and use expense or payment date. Filters combine. The status filter applies to expense lines | FR-034, FR-035, DEC-15 |
| BR-20 | Report money totals use Approved expenses and settlement payments only. Other statuses appear in a memo labeled as excluded | FR-036, DEC-12, DEC-13 |
| BR-21 | opening + period + later = current on each line. Current equals the Balances figure for the same group scope. Reports reflect data at generation time | FR-037, DEC-14 |
| BR-22 | Leaving or removal needs every pairwise balance in the group at $0.00 and no involvement in a Pending expense there | FR-007, DEC-08, DEC-09 |
| BR-23 | When the admin leaves, the earliest-joined remaining active member becomes admin, ties by user ID. The last member may leave, and the group is then retained with no active members | FR-006, DEC-10 |
| BR-24 | An admin can re-add a former member as a new membership. History stays, and full active-member visibility returns | DEC-11 |
| BR-25 | Former members follow the visibility table below | FR-003, NFR-003, DEC-07 |
| BR-26 | Five consecutive failures lock an account for 5 minutes under the timing in DEC-23 | NFR-002, DEC-23 |
| BR-27 | Entered amounts are 0.01 to 1,000,000.00 with at most 2 decimals and are refused, never rounded | FR-010, FR-030, DEC-06, DEC-20 |
| BR-28 | One optional receipt per expense: JPEG or PNG, at most 5,242,880 bytes, changeable only while Pending, viewable by active members | FR-014, DEC-25 |
| BR-29 | Usernames are unique ignoring case. Text limits apply after trimming, except that passwords are not trimmed | FR-001, DEC-24 |
| BR-30 | Expense and payment dates may be today or earlier by the computer's local date | FR-010, FR-030, DEC-24 |

### Worked split examples

| Amount | Split | Final shares, in listed order |
|---|---|---|
| $90.00 | Equal, 3 | 30.00, 30.00, 30.00 |
| $100.00 | Equal, 3 | 33.34, 33.33, 33.33 |
| $200.00 | Equal, 3 | 66.67, 66.67, 66.66 |
| $0.01 | Equal, 3 | 0.01, 0.00, 0.00 |
| $0.02 | Equal, 3 | 0.01, 0.01, 0.00 |
| $10.00 | Equal, 6 | 1.67, 1.67, 1.67, 1.67, 1.66, 1.66 |
| $200.00 | 50 / 30 / 20 % | 100.00, 60.00, 40.00 |
| $10.00 | 33.33 / 33.33 / 33.34 % | 3.34, 3.33, 3.33 (the first listed gets the cent, not the largest percentage) |
| $1.00 | 0 / 33.33 / 33.33 / 33.34 % | 0.01, 0.33, 0.33, 0.33 (the 0% participant gets the cent; DEC-18) |

### Former-member visibility

| Data | Active member | Former member |
|---|---|---|
| Group name | Yes | Only as a label on their own history lines |
| Member list, group balances, group expense list | Yes | No |
| Expense detail | All in the group | Only where they were creator, payer, or participant; read-only |
| Approval decision | All in the group | Only on expenses they can see |
| Receipt | All in the group | **No** |
| Payment history | Their own payments | Their own payments |
| Their balances | Yes | Always $0.00 while former (INV-EXIT-1); shown as settled |
| Notifications | All addressed to them | Only where the linked expense still exists and they were part of it |
| Reports | Everything involving them in the group | Same lines, limited to items they were part of |

Rejoining restores the active-member column, including records from the time they were away (BR-24). Someone who was never a member sees nothing, and the result does not reveal whether the group exists.

## Validation and error behavior

| Field or action | Rule | On failure |
|---|---|---|
| username | 3–30 characters after trimming; unique ignoring case | Field error; "taken" if a duplicate |
| display name | 1–50 characters after trimming (team-added limit, DEC-24) | Field error |
| password | At least 8 characters, not trimmed | Field error stating the minimum |
| login | Valid credentials and not locked | One generic message for wrong credentials; "temporarily locked" during a lock |
| group name | 1–50 characters | Field error |
| amount | BR-27 | Field error naming amount |
| date | `yyyy-MM-dd`; a real date; today or earlier | Field error naming date |
| description | 1–200 characters | Field error |
| payer, participants | BR-01, BR-02, BR-03 | Field error |
| percentages | BR-05; percentage splits only | Field error stating the total |
| receipt | BR-28 | Field error; other data kept |
| rejection reason | BR-10 | Field error |
| payment recipient, group, note | BR-14; note up to 200 characters | Field error |
| report dates | Both optional; start on or before end | Field error; empty results are not errors |
| not allowed, or not visible | FR-003, FR-006, FR-022 | Generic refusal that reveals no protected data |
| state changed first | BR-10, BR-11 | "No longer pending" or "changed, review again," then reload |
| business rule refusal | BR-22 | Names the balance or expense at fault |

All invalid fields of one submission are reported together, and entered data is kept (FR-015). A valid field is never lost because another was invalid.

## Edge cases

- An expense whose only participant is the payer creates no debt. It is allowed only when the payer is not the creator, because the creator cannot approve their own expense.
- A payer who is not a participant is owed the full amount by the participants.
- An expense with no participant other than its creator has no eligible approver and is refused.
- A Pending expense whose payer is not its creator is approved by any non-creator participant.
- Percentages with decimals (33.33 / 33.33 / 33.34) are accepted when they total exactly 100.00.
- An expense or payment dated after today is refused.
- Amounts up to 1,000,000.00 are accepted; larger amounts are refused.
- Two actors deciding the same Pending expense: the first recorded decision wins, and the second is told it is no longer pending. In the MVP's one-user-at-a-time deployment this is a safeguard rather than an everyday event (DEC-04).
- A decision against a version that was edited meanwhile is refused with "changed, review again."
- A receipt that is not a supported image or is too large is refused without losing other data. A file that passes these checks but cannot be decoded shows a message when viewed (DEC-25).
- A mistaken payment or wrongly approved expense is corrected by a compensating payment from the other party (DEC-19).

## Key entities

| Entity | Summary |
|---|---|
| **User** | Username, display name, protected password, lockout state |
| **Group** | Name, admin, status (Active; Archived is reserved for FR-009) |
| **Membership** | A user's period in a group; rejoining adds another |
| **Expense** | Group, creator, payer, amount, date, description, split method, status |
| **Share** | Participant, listed position, percentage if any, amount |
| **Receipt** | One optional image for an expense |
| **Approval Decision** | Expense, approver, outcome, reason, time; immutable |
| **Payment** | Group, payer, recipient, amount, date, note, time recorded; immutable |
| **Notification** | Recipient, group, optional expense, message, created time, read time |
| **Balance** | Derived, never stored. Net between two users, per group and overall |
| **Report** | Derived, not stored in the MVP |

## Success criteria

- **SC-001**: A new user can register, log in, create a group, and add two members in under 3 minutes on their first attempt.
- **SC-002**: A user can enter a complete expense in under 1 minute.
- **SC-003**: For a reference data set of at least 100 expenses and 20 payments, 100% of pairwise balances match hand-calculated values to the cent.
- **SC-004**: In 100% of tested splits, the participants' shares total exactly the expense amount.
- **SC-005**: 0 Pending or Rejected expenses affect any displayed balance or report money total.
- **SC-006**: 100% of other group members see a notification for a new expense at or before their next login.
- **SC-007** **(revised)**: For 100% of tested filter combinations, each report line satisfies opening + period + later = current, and current agrees with displayed balances for the same group scope, to the cent.
- **SC-008**: Every MVP functional requirement has at least one passing automated test or documented manual test.
- **SC-009**: At least 9 of 10 test users complete the "split a dinner bill and settle up" task without help.

## Assumptions, dependencies, and constraints

| Item | Statement | Status |
|---|---|---|
| Single currency | US dollars; no conversion | Spec assumption |
| Single-level approval | The customer allows either form; the MVP uses a single review, and multi-level is Post-MVP | Spec assumption |
| Debt simplification | Not performed across users | Spec assumption |
| Deployment | One shared computer and data folder, one user signed in at a time. **People on separate computers cannot share data.** | [DEC-03](decisions/decision-log.md#dec-03-deployment-and-collaboration) |
| Privacy boundary | Rules are enforced by the application; the data file is not encrypted | [DEC-29](decisions/decision-log.md#dec-29-data-at-rest-and-shared-computer-privacy) |
| Member add | The admin adds registered users directly; no invitation or consent | [DEC-24](decisions/decision-log.md#dec-24-text-limits-formats-and-direct-member-add) |
| Account recovery | No password reset or email verification in the MVP; a forgotten password cannot be recovered | Spec assumption |
| Dependency | Implementation choices are recorded in [plan.md](plan.md), not here, as Principle I requires | Constitution |

## Open questions

| ID | Question | Answer in this baseline | Status |
|---|---|---|---|
| Q1 | Who may approve? | Any one participant other than the creator | Resolved 2026-10-29 |
| Q2 | Must the recipient confirm a payment? | No | Resolved 2026-10-29 |
| Q3 **(revised)** | Will the customer accept a desktop MVP instead of web-based delivery? | **Unanswered.** The baseline is a conditional draft that assumes a desktop MVP for design purposes only. This is not an accepted deviation | **OPEN / BLOCKING**, DEC-01 |
| Q4 | Which other report parameters? | Group, other user, expense status | PROPOSED, DEC-15 |
| Q5 | Can rejected expenses be resubmitted? | No; create a new expense | PROPOSED, DEC-19 |
| Q6 | Can a former member rejoin? | Yes, as a new membership | PROPOSED, DEC-11 |
| Q7 | What do notifications cover? | New expenses and decisions on one's own expenses; not payments | PROPOSED, DEC-17 |
| Q8 | Are Android and iOS apps required? | Not in this baseline | **OPEN**, DEC-02 |

All remaining unresolved items are tracked in [risks-and-open-questions.md](risks-and-open-questions.md).

## Change history

| Date | Change | Author |
|---|---|---|
| 2026-10-29 | Spec created and clarified | Spec Kit; clarified by Daniel Raskin |
| 2026-11-05 | Reconciled against the comparison report. No requirement ID added, split, merged, or retired. Original text preserved in `docs/ai-comparison/spec-kit/spec.md` | Claude (AI) under Daniel Raskin's delegation; **not yet human-reviewed** |

### Requirement wording changes

Approving authority for all rows: **pending**, with the owner named in the cited decision. None weakens a customer requirement. The FR-003 and NFR-003 rows narrow a conflict the source already held.

| ID | Original | Revised | Rationale | Impact |
|---|---|---|---|---|
| FR-003 | "A logged-in user MUST only see groups they belong to, and only expenses, payments, balances, notifications, and reports involving them or those groups." | Adds "currently" and the former-member history exception | DEC-07 | AccessPolicy, all reads |
| FR-007 | "The system MUST refuse to remove (or let leave) a member whose net balance within that group is not $0.00." | Every pairwise balance at zero, plus no Pending involvement, plus the refusal shows why | DEC-08, DEC-09. Stricter than the original | GroupExitPolicy, Story 2 |
| FR-030 | Amount "greater than 0, at most two decimals" | Adds "at most 1,000,000.00" and "currently" | DEC-20 | PaymentService |
| FR-035 | "inclusive start and end" | Adds which dates apply and that status selects expense lines only | DEC-13, DEC-14 | ReportCalculator |
| FR-036 | "total amount of expenses, the user's total share, total paid by the user, total received by the user, and the net balance with each other user" | Approved only; settlement payments; memo; four-part net | DEC-12, DEC-13, DEC-14 | Report model |
| FR-037 | "Report totals MUST agree to the cent with the balances in FR-027 for the same data." | The reconciliation identity, and current agrees for the same group scope | DEC-14 | ReportCalculator |
| NFR-003 | "No screen or report MAY show data from a group the user does not belong to." | Adds the former-member exception | DEC-07 | AccessPolicy |
| NFR-004 | No measurable definition of machine or timing | Reference machine, dataset, percentile | DEC-28 | Benchmark |
| NFR-007 | Register listed among tasks reachable "from the home view" | Register measured from the login screen; "step" defined | DEC-21 | Navigation |
| SC-005 | "any displayed balance or report total" | "report money total," since the memo shows labeled excluded amounts | DEC-13 | Report UI |
| SC-007 | "Report totals agree with displayed balances to the cent for 100% of tested filter combinations." | The reconciliation identity | DEC-14 | Tests |
| Q3 | "Treated as an accepted deviation for MVP only, pending written confirmation" | "Unanswered… not an accepted deviation" | The old wording contradicted the constitution. DEC-01 | All documents |
| Scenario 1.6 | "after 5 minutes" | "from exactly 5 minutes on" | DEC-23 | Lockout tests |
| Scenario 2.3 | "non-zero balance in the group" | "non-zero balance with anyone in the group" | DEC-08 | Tests |
