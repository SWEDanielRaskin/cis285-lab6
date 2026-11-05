# Implementation Plan: SplitSmart Expense Sharing

**Branch**: `001-splitsmart-expense-sharing` is the Spec Kit feature ID. The git branch is `main`; no git
branch with the feature's name exists. | **Date**: 2026-11-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-splitsmart-expense-sharing/spec.md`

**Status**: **Draft.** AI-generated; not human reviewed; not approved (Principle VII). The constitution also
requires OC-1 to be recorded before the first plan is approved.

## How statements are labeled

| Label | Meaning | Where it comes from |
|-------|---------|---------------------|
| **CR** | Customer requirement | `UserRequirement.md` |
| **FR / NFR / SC** | Clarified requirement | `spec.md` |
| **ID** | Implementation decision, binding on the team, **not** a customer requirement | Constitution |
| **PD** | Proposed decision from this plan, open to human change | [research.md](research.md) |
| **Fact** | Checked in the repository or a cited source | [research.md](research.md#facts-established-from-the-repository-checked-2026-11-04) |
| **Assumption** | Spec assumption or working default | `spec.md`, research |
| **NC / OC** | `NEEDS CLARIFICATION` or an open conflict | [research.md](research.md#unresolved-questions) |

## Summary

SplitSmart lets people share expenses within groups: they register, form groups, enter expenses split
equally or by percentage, approve them, track who owes whom, record payments, and run reports (CR-01 to
CR-09).

This plan designs the MVP as a Java Swing desktop application, because the constitution selects that stack
(ID-03). **It does not meet CR-10, which asks for a primarily web-based product.** That conflict, OC-1, stays
open. See [OC-1 impact](#oc-1-impact).

The design is a layered object-oriented application in one Maven module. Business rules sit in `domain` and
`service`, with no Swing dependency. Balances are computed from Approved expenses and payments, not stored.
All money uses `BigDecimal` through one `Money` value object.

## Technical Context

| Item | Value | Basis |
|------|-------|-------|
| **Language/Version** | Java 21 | ID-01 |
| **Primary Dependencies** | JDK only for the application code (Swing, `java.time`, `javax.crypto`, JDBC), plus the `org.xerial:sqlite-jdbc` driver | ID-03; driver is PD-06 |
| **Storage** | SQLite database file | **PD-06, proposed.** No source specifies storage; a human must confirm |
| **Testing** | JUnit 5 (Jupiter, 5.x line) through Maven Surefire | ID-04; version is PD-03 |
| **Build** | Apache Maven, single module, explicit dependency versions | ID-02; single module is PD-01 |
| **Design documentation** | PlantUML in `docs/uml/` | ID-05, Principle VI |
| **Target Platform** | Desktop with a JDK 21 runtime. Test platform so far: none, since no JDK is installed on the authoring machine (Windows 11) | ID-03; Fact |
| **Project Type** | Desktop application | ID-03; **not** what CR-10 requests (OC-1) |
| **Performance Goals** | Any screen or report within 2 seconds at 50 users, 50 groups, and 10,000 expenses | NFR-004. **Unmeasured** |
| **Constraints** | Exact money; work off the Event Dispatch Thread; no Swing or AWT outside `ui`; data survives unexpected exit | Principle III, IV; ID-03; NFR-005 |
| **Scale/Scope** | 36 MVP FRs and 5 Post-MVP FRs; one shared installation | Spec; assumption "Local use" |

**Runtime context (proposed, PD-02, PD-08)**: One application process with one signed-in user. The UI runs
on the Event Dispatch Thread, and service calls run on one background thread with one database connection.

**Data location (proposed)**: A folder under the user's home directory, overridable by a system property
for tests. **NEEDS CLARIFICATION**: whether this fits "one shared installation" across different OS accounts
(research RK-4).

**Unknowns**: Technical context has no blocking unknown, but storage is a proposal, and the open questions in
[research.md](research.md#unresolved-questions) remain open.

## Constitution Check: before design

*Gate before Phase 0.*

| # | Principle | Result | Evidence or condition |
|---|-----------|--------|-----------------------|
| I | Customer requirements are the source of truth | **Pass** | `UserRequirement.md` read-only. CR, ID, and PD are labeled separately. Divergence stated as OC-1 |
| II | Requirement traceability | **Pass with gap** | Matrix planned. FR-040 and FR-041 cite no CR in the spec (NC-12). The task link is not possible until `/speckit-tasks` |
| III | OO design with GUI separation | **Pass** | Required packages planned |
| IV | Exact money with BigDecimal | **Pass with tension** | HALF_EVEN policy and FLOOR clarified rule both apply; explained in research R-07 |
| V | Automated testing with JUnit 5 | **Pass (planned)** | No code exists yet to test |
| VI | Design in PlantUML | **Pass (planned)** | Five diagrams required |
| VII | Human review of AI output (NON-NEGOTIABLE) | **Pending** | This plan is a draft. The spec's status line says Draft, and git history records "reviewed by Daniel" for earlier artifacts |

**Stack gate**: Java 21, Maven, Swing, JUnit 5, PlantUML, layered separation, and BigDecimal are all
addressed. **OC-1 restated**: Yes.

**Gate decision**: Proceed with design. Approval stays blocked by OC-1 and human review.

## Architecture

**Style**: Layered object-oriented architecture (ID-07), with one composition root.

**Rationale**:

- It is required by Principle III.
- Rules can be tested without a display (NFR-009).
- It is simple enough for a team this size at this scale.
- Keeping `service` free of Swing helps any future front end, without claiming to deliver one.

**Alternatives considered**: Hexagonal or clean architecture adds ceremony beyond the constitution's required
layers. A rule-heavy Swing app would violate Principle III. Client and server would be a different product
direction, and that decision belongs to OC-1.

**Diagrams**: [layer-component](uml/layer-component.puml),
[domain-class](uml/domain-class.puml),
[expense-approval](uml/expense-approval-sequence.puml),
[payment-settlement](uml/payment-settlement-sequence.puml),
[notification](uml/notification-sequence.puml).

### Layers and responsibilities

The base Java package `com.splitsmart` is proposed.

| Package | Responsibility | Contains | May depend on |
|---------|----------------|----------|---------------|
| `domain` | Entities, value objects, invariants, and pure rules | `User`, `Group`, `Membership`, `Expense`, `Share`, `ReceiptImage`, `ApprovalDecision`, `Payment`, `Notification`, `Money`, `Percentage`, IDs, enums, `SplitAllocator`, `BalanceLedger`, `PairBalance`, `Report` and its parts, `ReportCriteria`, shared exceptions | JDK only, no GUI or SQL |
| `service` | Use cases, authorization, transaction scope, and notification triggers | The eight services, `AccessPolicy`, `PasswordHasher`, `Pbkdf2PasswordHasher`, input and view types | `domain`, `repository` interfaces |
| `repository` | Persistence interfaces and `TransactionManager` | Interfaces in [repository contracts](contracts/repository-contracts.md) | `domain` |
| `repository.sqlite` | Proposed implementations | SQLite classes, schema setup | `repository`, `domain`, JDBC |
| `ui` | Swing views and controllers | See [UI contracts](contracts/ui-interactions.md) | `service`, `domain` |
| `app` | Startup, creating and connecting objects | `SplitSmartApplication`, `AppConfig` | All of the above |

### Dependency direction

```text
app ──creates──▶ ui, service, repository.sqlite

ui ──▶ service ──▶ domain
          │           ▲
          ▼           │
      repository ─────┘
          ▲
          │ implements
   repository.sqlite ──▶ SQLite file
```

**Forbidden, and tested by a source scan (PD-14)**:

- `domain`, `service`, and `repository` importing `javax.swing` or `java.awt`.
- `domain` or `service` importing `repository.sqlite` or `java.sql`.
- `ui` importing `repository.sqlite`.
- Business rules in `ui`.

### Money policy

`Money` holds `BigDecimal` at scale 2 and is the only place that rounds (Principle IV, ID-06).

| Situation | Behavior | Authority |
|-----------|----------|-----------|
| Typed amount | Refused above 2 decimals; never rounded | FR-010 |
| General normalization | `HALF_EVEN`, the constitution's policy | Principle IV |
| Split allocation only | `FLOOR`, then leftover cents one at a time in saved participant order | FR-011 to FR-013, recorded clarification |

**How they coexist**: Principle IV also requires splits to use "a documented, deterministic rule", and FR-011
to FR-013 are that rule, so the floor is a defined case inside the policy and rewrites neither source. The
design has no MVP calculation that reaches `HALF_EVEN`, since exact sums need no rounding and input is refused
instead. See [research R-07](research.md#r-07-money-policy-and-how-it-coexists-with-the-split-rule). The human
reviewer should confirm this reading (see Complexity Tracking).

### Persistence (proposed; PD-06, PD-07, PD-08, PD-10)

- **Fact**: No source specifies storage.
- **Proposal**: One SQLite file, with money as integer cents, receipts in their own table, and balances not
  stored.
- **Transactions**: Each write operation is one transaction. Expense plus notifications, and status plus
  decision plus notification, commit together.
- **Replaceable**: Only `repository.sqlite` knows about SQLite.
- **Unknowns**: See Data location above. Future schema migration is outside MVP design.

### Cross-cutting concerns

| Concern | Design | Requirements | Status |
|---------|--------|--------------|--------|
| **Authentication** | Hash is PBKDF2-HMAC-SHA256 with salt, 600,000 iterations. Lockout state is stored, so a restart cannot clear it. Failure counts commit before the failure is raised | FR-002, FR-004, NFR-002 | Rule binding; method PD-11, PD-12 |
| **Authorization and privacy** | Every service call takes the actor and uses `AccessPolicy`. Not-visible and not-found give the same result. UI hiding is only a convenience | FR-003, NFR-003 | PD-13; former-member view is NC-3 |
| **Data at rest** | The database file is not encrypted (research RK-3) | None requires it | Risk for human acceptance |
| **Audit** | Decisions and payments are insert-only, with actor and timestamp; no update or delete operation exists | FR-024, NFR-006 | Binding rule |
| **Errors** | A small exception set; all field errors together; entered data kept | FR-015, NFR-007 | PD-16 |
| **Logging** | `java.util.logging` for unexpected errors; never passwords or hashes | None; supports diagnosis | PD-17 |
| **Concurrency** | Conditional update and a unique rule give "first decision wins" | FR-024, Edge Cases | PD-08 |
| **Reliability** | Commit durability from the storage engine | NFR-005 | PD-06; V-16 to confirm |
| **Performance** | Group-scoped queries, indexes, images excluded from list queries, background thread | NFR-004 | **Unmeasured**; V-19 |
| **Accessibility, usability** | Keyboard operation; at most 3 steps from Home | NFR-007, NFR-008 | Manual checks V-20, V-21 |
| **Testability** | Injected `Clock`, repositories, and hasher; fakes; no Swing in rules | NFR-009, Principle V | PD-18 |

### Testing strategy

| Level | Target | Approach |
|-------|--------|----------|
| Unit | `domain`, `service` | JUnit 5 with fakes and a fixed `Clock`; test names include FR IDs; tests are seen failing first (Principle V) |
| Repository | `repository.sqlite` | JUnit 5 with a temporary database file |
| Architecture | Source tree | Source scan test (PD-14, V-18) |
| Manual | Swing behavior | Written steps linked to FRs ([quickstart.md](quickstart.md)) |

## OC-1 impact

**The conflict**: CR-10 asks for a primarily web-based product. ID-03 selects a Java Swing desktop MVP. This
is a deviation, not a reinterpretation. **Swing does not satisfy CR-10.**

**Status**: Unresolved. No written customer or instructor acceptance is recorded. This plan does not change the
stack or resolve the conflict.

| Area | Effect |
|------|--------|
| **Delivery** | The MVP cannot be claimed as meeting all customer requirements. FR-039 stays visible as Post-MVP |
| **Approval** | The constitution requires OC-1 to be recorded before the first plan is approved |
| **Architecture** | `domain` and `service` have no Swing dependency, so a web client could reuse them |
| **Limits of reuse** | A shared web product would still need multi-user storage and server-side sessions. The proposed SQLite layer and in-process session would not carry over as designed (research RK-1) |
| **Scope** | No web interface, REST API, or server is designed, because none is authorized |

**Related question NC-2**: The lab document's copy of the customer request adds "and also comes with app that can
be run on Android and IOS", which `UserRequirement.md` does not contain. `UserRequirement.md` governs under project
rules and was not changed, and Android and iOS are not in any CR or FR. The instructor should confirm which text
is correct, since it could widen OC-1.

## Requirements Traceability

### Customer requirements

| CR | Requirement (the source file's wording governs) | FRs | MVP status |
|----|-------------------------------------------------|-----|------------|
| CR-01 | User accounts | FR-001 to FR-004 | Designed. Password reset and profile editing are Post-MVP with no FR |
| CR-02 | Group management | FR-005 to FR-009 | Designed, except FR-009. Invitations are Post-MVP with no FR |
| CR-03 | Expense creation | FR-010 to FR-016 | Designed |
| CR-04 | Expense participants | FR-010, FR-026 | Designed |
| CR-05 | Notifications | FR-017 to FR-019 | Designed, except FR-018 |
| CR-06 | Approval workflow | FR-020 to FR-025 | Single-level designed. FR-025 is Post-MVP |
| CR-07 | Balance tracking | FR-026 to FR-029 | Designed |
| CR-08 | Payment tracking | FR-030 to FR-033 | Designed |
| CR-09 | Reporting | FR-034 to FR-038 | Designed, except FR-038 |
| CR-10 | Primarily web-based | FR-039 | **Not met by the MVP** (OC-1) |

### Functional requirements

Contract key: **S** = [service](contracts/service-contracts.md), **R** =
[repository](contracts/repository-contracts.md), **U** = [UI](contracts/ui-interactions.md). Diagram key: **DC** =
domain-class, **LC** = layer-component, **EA** = expense-approval, **PS** = payment-settlement, **N** = notification.
**Verification** refers to [quickstart scenarios](quickstart.md#part-c-validation-scenarios-for-after-implementation).
The link to `tasks.md` is added by `/speckit-tasks`, and no tasks exist yet.

| FR | CR | Scope | Design elements | Contract | Diagram | Verification |
|----|----|-------|-----------------|----------|---------|--------------|
| FR-001 | CR-01 | MVP | `User`, `AccountService.register` | S, R, U | DC | V-01 |
| FR-002 | CR-01 | MVP | `AccountService.login`, `Session` | S, U | DC | V-01, V-03 |
| FR-003 | CR-01 | MVP | `AccessPolicy`, service queries | S | DC, LC | V-03 |
| FR-004 | CR-01 | MVP | `PasswordHasher`, `User.passwordHash` | S | DC | V-01 |
| FR-005 | CR-02 | MVP | `Group`, `Membership`, `GroupService.createGroup` | S, R | DC | V-04 |
| FR-006 | CR-02 | MVP | `GroupService.addMember`, `removeMember`, `leaveGroup` | S, R, U | DC | V-04, V-05 |
| FR-007 | CR-02 | MVP | `GroupService`, `BalanceService.memberNetInGroup` | S | DC | V-05 |
| FR-008 | CR-02 | MVP | `GroupService`, `GroupDetailPanel` | S, U | DC | V-04 |
| FR-009 | CR-02 | **Post-MVP** | `GroupStatus.ARCHIVED` reserved; no operation | None | DC note | Not in MVP |
| FR-010 | CR-03, CR-04 | MVP | `Expense`, `ExpenseService.createExpense` | S, R, U | DC, EA | V-06 |
| FR-011 | CR-03 | MVP | `SplitAllocator`, `Money.floorToCent` | S | DC, EA | V-07 |
| FR-012 | CR-03 | MVP | `SplitAllocator`, `Share.position` | S, R, U | DC, EA | V-07 |
| FR-013 | CR-03 | MVP | `SplitAllocator`, `Percentage` | S | DC, EA | V-07 |
| FR-014 | CR-03 | MVP | `ReceiptImage`, `ReceiptRepository`, `ReceiptViewerDialog` | S, R, U | DC | V-08 |
| FR-015 | CR-03 | MVP | `ValidationException`, `FieldError`, `ExpenseFormDialog` | S, U | EA | V-06 |
| FR-016 | CR-03 | MVP | `Expense.reviseWhilePending`, conditional repository operations | S, R | DC | V-09 |
| FR-017 | CR-05 | MVP | `NotificationService.notifyExpenseCreated`, `Notification` | S, R, U | N, EA | V-10 |
| FR-018 | CR-05 | **Post-MVP** | None | None | N note | Not in MVP |
| FR-019 | CR-05 | MVP | `NotificationService`, `NotificationsPanel` | S, R, U | N | V-10 |
| FR-020 | CR-06 | MVP | `ExpenseStatus`, `Expense.create`, `findApprovedByGroup` | S, R | DC, EA | V-11 |
| FR-021 | CR-06 | MVP | `ApprovalService`, `Expense.isEligibleApprover` | S, R, U | DC, EA | V-11 |
| FR-022 | CR-06 | MVP | `Expense.isEligibleApprover` | S | EA | V-11 |
| FR-023 | CR-06 | MVP | `ApprovalService.reject`, `notifyExpenseDecided` | S, U | EA, N | V-10, V-11 |
| FR-024 | CR-06 | MVP | `ApprovalDecision`, `decideIfPending` | S, R | DC, EA | V-11 |
| FR-025 | CR-06 | **Post-MVP** | None. The one-decision rule would need relaxing | None | None | Not in MVP |
| FR-026 | CR-04, CR-07 | MVP | `BalanceLedger` | S | DC | V-12 |
| FR-027 | CR-07 | MVP | `BalanceLedger`, `PairBalance`, `BalanceService` | S, R | DC, PS | V-12 |
| FR-028 | CR-07 | MVP | `BalanceService.getMyBalances`, `BalancesPanel` | S, U | DC | V-12 |
| FR-029 | CR-07 | MVP | `BalanceLedger` invariants | S | DC | V-12 |
| FR-030 | CR-08 | MVP | `Payment`, `PaymentService.recordPayment` | S, R, U | DC, PS | V-13 |
| FR-031 | CR-08 | MVP | `PaymentService`, derived balances | S | PS | V-13 |
| FR-032 | CR-08 | MVP | `OverpaymentConfirmationRequiredException`, `owedInGroup`, `PaymentDialog` | S, U | PS | V-14 |
| FR-033 | CR-08 | MVP | `PaymentService.listMyPayments`, `PaymentHistoryPanel` | S, R, U | PS | V-13 |
| FR-034 | CR-09 | MVP | `ReportService`, `Report` | S, R, U | DC | V-15 |
| FR-035 | CR-09 | MVP | `ReportCriteria` | S, R, U | DC | V-15 |
| FR-036 | CR-09 | MVP | `ReportTotals`, report lines | S, U | DC | V-15 |
| FR-037 | CR-09 | MVP | `ReportService` using `BalanceLedger` | S | DC | V-15 |
| FR-038 | CR-09 | **Post-MVP** | None | None | None | Not in MVP |
| FR-039 | CR-10 | **Post-MVP** | None. `service` boundary is reusable | None | LC note | Not in MVP. **CR-10 unmet** |
| FR-040 | Inferred: CR-01 to CR-09 (NC-12) | MVP | `repository`, `repository.sqlite`, `TransactionManager` | R | LC | V-16 |
| FR-041 | Inferred: CR-03, CR-08, CR-09 (NC-12) | MVP | `DisplayFormats`, date parsing in services | S, U | None | V-17 |

### Non-functional requirements

| NFR | Design elements | Verification |
|-----|-----------------|--------------|
| NFR-001 Accuracy | `Money`, `SplitAllocator`, integer cents in storage | V-07, V-12 |
| NFR-002 Security | `PasswordHasher`, `User` lockout fields, injected `Clock` | V-01, V-02 |
| NFR-003 Privacy | `AccessPolicy` (former-member case NC-3) | V-03 |
| NFR-004 Performance | Scoped queries, indexes, `UiAsync` | V-19 |
| NFR-005 Reliability | `TransactionManager`, storage engine | V-16 |
| NFR-006 Auditability | `ApprovalDecision`, `Payment`, no change operations | V-11, V-13 |
| NFR-007 Usability | Field errors, navigation | V-21 |
| NFR-008 Accessibility | Keyboard rules in UI contracts | V-20 |
| NFR-009 Testability | Layering, fakes, injected `Clock` | All A scenarios |

### Supporting classes

Principle II says every production class traces to an FR. Supporting classes trace as follows.

| Class | Traces to |
|-------|-----------|
| `SplitSmartApplication`, `AppConfig` | FR-040, all MVP FRs through wiring |
| `UiAsync`, `ErrorPresenter` | ID-03, NFR-007, FR-015 |
| `MainFrame`, `HomePanel` | FR-003, FR-019, FR-028, NFR-007 |
| Typed IDs | FR-003, NFR-009 |
| SQLite schema setup | FR-040 |

## Project Structure

### Documentation (this feature)

```text
specs/001-splitsmart-expense-sharing/
├── spec.md                       # Existing
├── checklists/requirements.md    # Existing
├── plan.md                       # This file
├── research.md                   # Phase 0
├── data-model.md                 # Phase 1
├── quickstart.md                 # Phase 1
├── contracts/
│   ├── README.md
│   ├── service-contracts.md
│   ├── repository-contracts.md
│   └── ui-interactions.md
└── tasks.md                      # NOT created; comes from /speckit-tasks

docs/uml/
├── domain-class.puml
├── layer-component.puml
├── expense-approval-sequence.puml
├── payment-settlement-sequence.puml
└── notification-sequence.puml
```

### Source code

**Fact**: None of this exists yet. The repository holds only requirements, Spec Kit files, prompts, and these
design documents. Proposed layout:

```text
pom.xml
src/main/java/com/splitsmart/
├── app/
├── domain/
├── service/
├── repository/
│   └── sqlite/
└── ui/
src/test/java/com/splitsmart/
├── architecture/      # Source scan (PD-14)
├── domain/
├── service/
└── repository/sqlite/
```

**Structure Decision**: One Maven module in the standard Maven layout (PD-01), with the packages the
constitution requires, plus `app`.

## Constitution Check: after design

*Re-evaluated after Phase 1.*

| # | Principle | Result | Evidence or condition |
|---|-----------|--------|-----------------------|
| I | Customer requirements are the source of truth | **Pass** | `UserRequirement.md` unchanged. Every proposal is labeled PD. OC-1 and NC-2 are explicit |
| II | Requirement traceability | **Pass with gap** | All 41 FRs and 9 NFRs are mapped. Gaps: FR-040 and FR-041 citations are inferred (NC-12), and the task link awaits `/speckit-tasks` |
| III | OO design with GUI separation | **Pass** | Behavior is on owning objects (`Expense.decide`, `User.recordFailedLogin`). Services hold rules such as overpayment. Constructor injection used. No Swing in contracts |
| IV | Exact money with BigDecimal | **Pass; reader to confirm** | One `Money` class; strict input; no `double`. Allocation follows the clarified rule. See Complexity Tracking |
| V | Automated testing with JUnit 5 | **Pass (design only)** | Strategy and scenarios defined. Rules are testable without Swing. **No tests exist or have been run** |
| VI | Design in PlantUML | **Partial** | All five required diagrams written with FR notes. **Syntax not checked**, because PlantUML is unavailable here |
| VII | Human review of AI output | **Pending** | No human review of these artifacts has occurred. None is claimed |

**Stack gate**: Java 21, Maven, Swing, JUnit 5, PlantUML, layered separation, and BigDecimal are all addressed.
**OC-1 restated**: Yes. **New unjustified violations**: None.

**Design consistency found during review**: A failed login throws an exception, and transactions roll back on
exceptions, which would have erased the failure count and disabled lockout. The
[service contract](contracts/service-contracts.md#accountservice) now requires the count to commit first.

**Gate decision**: Design phase complete as a **draft**. **Not approved.** Approval remains blocked until OC-1 is
recorded and a named human reviews these artifacts. The open questions should be settled before
`/speckit-tasks`, because several would change tasks (NC-3 to NC-8).

**Note on the Spec Kit rule**: The workflow says to stop on unresolved clarifications. The instruction for this run
was to mark unknowns instead of inventing answers, so they are recorded here as open, not resolved.

## Complexity Tracking

| Item | Why needed | Simpler alternative rejected because |
|------|------------|--------------------------------------|
| `FLOOR` alongside the constitution's `HALF_EVEN` in `Money` | FR-011 to FR-013 and the recorded clarification require rounding shares down. Treated as the "documented, deterministic rule" in Principle IV. **A reviewer may prefer a PATCH amendment that names this explicitly** | HALF_EVEN for shares can overshoot the total ($200.00 ÷ 3 gives $200.01). Rewriting the clarification isn't permitted |
| `app` package beyond the four named packages | Something must create and connect objects. Principle III says "at least these packages", so this is not a violation; it is noted for transparency | Putting this in `ui` would tie `ui` to SQLite |

**OC-1 is not listed as a justified deviation.** It is an open conflict that needs a recorded decision.
