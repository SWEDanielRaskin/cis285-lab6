<!--
Sync Impact Report
==================
Version change: (unversioned template) → 1.0.0
Bump rationale: First ratified constitution; all placeholders replaced (initial MAJOR release).

Modified principles (template placeholder → new title):
  - [PRINCIPLE_1_NAME] → I. Customer Requirements Are the Source of Truth
  - [PRINCIPLE_2_NAME] → II. Requirement Traceability
  - [PRINCIPLE_3_NAME] → III. Object-Oriented Design with GUI/Business-Logic Separation
  - [PRINCIPLE_4_NAME] → IV. Exact Money Arithmetic with BigDecimal
  - [PRINCIPLE_5_NAME] → V. Automated Testing with JUnit 5
Added principles:
  - VI. Design Modeled in PlantUML
  - VII. Human Review of AI-Generated Output (NON-NEGOTIABLE)
Added sections:
  - Customer Requirements vs. Implementation Decisions (was [SECTION_2_NAME])
  - Development Workflow & Quality Gates (was [SECTION_3_NAME])
Removed sections: none

Templates reviewed (not modified by this command; they read the constitution at runtime):
  - .specify/templates/plan-template.md (Constitution Check gate) — compatible
  - .specify/templates/spec-template.md — compatible
  - .specify/templates/tasks-template.md — compatible

Follow-up TODOs:
  - Open conflict OC-1: customer requirement CR-10 states "primary web-based"; the
    implementation decision is a Java Swing desktop client. Customer/instructor
    confirmation is required and MUST be recorded before the first plan is approved.
-->

# SplitSmart Constitution

## Core Principles

### I. Customer Requirements Are the Source of Truth

- `UserRequirement.md` is the original SplitSmart customer request. It is read-only: no person
  or AI tool may edit, reformat, or "correct" it. Clarifications are recorded in specs, never
  by rewriting the source.
- Every statement in project artifacts MUST be classifiable as either a **Customer Requirement
  (CR)**, which originates in `UserRequirement.md` or a recorded customer clarification, or an
  **Implementation Decision (ID)**, which is chosen by the team to satisfy requirements.
- Specs (`spec.md`) describe customer-facing behavior (what and why) and MUST NOT state
  technology choices as requirements. Plans (`plan.md`) carry implementation decisions (how).
- An implementation decision MUST NOT be presented as something the customer asked for. Where
  an implementation decision diverges from a customer requirement, the divergence MUST be
  stated explicitly and logged as an open conflict until the customer accepts it.

Rationale: Mixing the customer's words with the team's choices hides scope changes and makes
it impossible to verify the delivered system against what was actually requested.

### II. Requirement Traceability

- Each customer requirement carries a stable ID (see the CR table below). Feature specs derive
  functional requirements (`FR-xxx`) that MUST cite their source CR ID(s).
- Every FR MUST trace forward to at least one design element (class or PlantUML diagram), at
  least one task in `tasks.md`, and at least one JUnit 5 test or documented manual check.
- Every task and every production class MUST trace back to at least one FR. Work with no
  traceable requirement is scope creep and MUST be removed or justified in the plan.
- Test names or `@DisplayName` values MUST reference the FR ID they verify
  (for example, `FR-012 equal split distributes remainder cents deterministically`).

Rationale: Traceability lets a reviewer prove that every customer request is covered and that
nothing unrequested was built.

### III. Object-Oriented Design with GUI/Business-Logic Separation

- The domain (users, groups, expenses, splits, approvals, balances, payments, notifications,
  reports) MUST be modeled as cohesive classes with encapsulated state, validated constructors
  or factories, and behavior placed on the object that owns the data.
- The code MUST be layered into at least these packages: `domain` (entities and value
  objects), `service` (use cases and business rules), `repository` (persistence interfaces and
  implementations), and `ui` (Java Swing views and controllers).
- `domain`, `service`, and `repository` MUST NOT import `javax.swing`, `java.awt`, or any
  other GUI type. Swing classes MUST NOT contain business rules or balance calculations; they
  only collect input, call services, and render results.
- Dependencies point inward (`ui` → `service` → `domain`; `service` depends on `repository`
  interfaces). Collaborators are supplied through constructors so they can be replaced in tests.
- Prefer composition over inheritance, interfaces at layer boundaries, and the SOLID
  principles. Each departure MUST be justified in the plan's Complexity Tracking table.

Rationale: Keeping business logic free of the GUI makes it testable without a display and
leaves room to add a web front end later (see open conflict OC-1).

### IV. Exact Money Arithmetic with BigDecimal

- All monetary amounts, shares, balances, and payments MUST use `java.math.BigDecimal`.
  `float` and `double` MUST NOT be used for money anywhere, including tests and the UI layer.
- `BigDecimal` values MUST be created from `String` or integer values, never from `double`
  (`new BigDecimal(0.1)` and `BigDecimal.valueOf(double)` are prohibited for money).
- Money is held at scale 2 using `RoundingMode.HALF_EVEN`, applied in one place (a `Money`
  value object or a single utility), not scattered through the code.
- Equality checks on money MUST use `compareTo`, not `equals`, unless scales are normalized.
- Splits (equal or by percentage) MUST allocate the full expense amount: the sum of shares
  MUST equal the expense total exactly, with any leftover cents assigned by a documented,
  deterministic rule. Percentage splits MUST total exactly 100%.
- Each split and balance rule MUST have JUnit 5 tests covering rounding remainders,
  zero amounts, and invalid input.

Rationale: Binary floating point cannot represent cents exactly; a balance tracker that loses
a cent per split fails the customer's balance-tracking requirement (CR-07).

### V. Automated Testing with JUnit 5

- JUnit 5 (Jupiter) is the only unit-testing framework. Tests run with `mvn test` and MUST
  pass before any change is considered complete.
- Every `service` and `domain` class MUST have unit tests. Business rules (splits, approvals,
  balances, payments, report filters) MUST be tested without starting the Swing UI.
- For business logic, tests are written before or alongside the implementation, and a new
  test MUST be seen failing before the code that makes it pass is accepted.
- Swing UI behavior that cannot reasonably be unit tested MUST have a written manual test
  step linked to its FR.
- A failing, skipped, or `@Disabled` test MUST NOT be merged without a recorded reason and a
  follow-up task.

Rationale: Automated tests are the evidence that each traced requirement actually works.

### VI. Design Modeled in PlantUML

- Design diagrams MUST be written as PlantUML text files (`.puml`) committed with the source,
  under `docs/uml/` or the feature's spec directory.
- Each feature plan MUST include at least a class diagram of the affected domain and service
  classes. Multi-step flows (expense approval, payment settlement, notification) MUST also have
  a sequence or activity diagram.
- Diagrams MUST match the code. A change that alters class names, relationships, or
  responsibilities MUST update the affected `.puml` files in the same change.
- Diagram elements SHOULD note the FR IDs they realize.

Rationale: Text-based diagrams are versioned, reviewable, and diffable, which keeps the
documented design honest.

### VII. Human Review of AI-Generated Output (NON-NEGOTIABLE)

- All AI-generated artifacts (specs, plans, tasks, diagrams, code, tests, and documentation)
  are drafts until a named human team member has reviewed them.
- The reviewer MUST check the output against `UserRequirement.md` and this constitution,
  confirm traceability, run `mvn test`, and verify that no requirement was invented, dropped,
  or reworded into a different meaning.
- AI tools MUST NOT mark their own work as approved, MUST NOT modify `UserRequirement.md`, and
  MUST flag assumptions or uncertainty rather than silently resolving them.
- Each accepted artifact MUST record its review (reviewer name and date, in the artifact, the
  commit message, or the pull request).

Rationale: AI output can be confident and wrong. Accountability for the delivered system stays
with the people who submit it.

## Customer Requirements vs. Implementation Decisions

### Customer Requirements (source: `UserRequirement.md`, read-only)

| ID    | Customer requirement (summarized; the source file wording governs)                     |
|-------|-----------------------------------------------------------------------------------------|
| CR-01 | User accounts: each person logs in and sees their own expenses and balances.           |
| CR-02 | Group management: create and manage groups (roommates, trips, parties, etc.).          |
| CR-03 | Expense creation: amount, date, description, split manner (equal or %), optional receipt image. |
| CR-04 | Expense participants: specify which users are involved so balances are adjusted.      |
| CR-05 | Notifications: notify users when other group members create a new expense.            |
| CR-06 | Approval workflow: review/approve expenses before they affect balances (single or multi-level). |
| CR-07 | Balance tracking: track what each user owes every other user across all expenses.     |
| CR-08 | Payment tracking: record payments that settle balances.                               |
| CR-09 | Reporting: summaries of expenses, balances, payments; custom reports by date range and other parameters. |
| CR-10 | Platform: "primary web-based".                                                         |

### Implementation Decisions (team-chosen; not customer requirements)

| ID    | Decision                                                                 | Satisfies       |
|-------|--------------------------------------------------------------------------|-----------------|
| ID-01 | Language: Java 21 (LTS). Modern features (records, sealed types, pattern matching, switch expressions) are permitted where they improve clarity. | All |
| ID-02 | Build: Apache Maven with a committed `pom.xml`; `mvn clean verify` MUST succeed from a clean checkout. Dependencies are declared with explicit versions. | All |
| ID-03 | User interface: Java Swing desktop client, running GUI work on the Event Dispatch Thread. | CR-01–CR-09 (see OC-1) |
| ID-04 | Testing: JUnit 5 (Jupiter) via Maven Surefire.                            | All             |
| ID-05 | Design documentation: PlantUML `.puml` files.                            | All             |
| ID-06 | Money: `BigDecimal`, scale 2, `HALF_EVEN`, wrapped in one money abstraction. | CR-03, CR-07, CR-08 |
| ID-07 | Architecture: layered OO design with GUI separated from business logic. | All             |
| ID-08 | Notifications are delivered in-application unless a spec records otherwise. | CR-05         |

### Open Conflicts

- **OC-1 (CR-10 vs. ID-03):** The customer asked for a primarily web-based system; the team has
  chosen a Java Swing desktop client. This is a deviation, not a reinterpretation of CR-10.
  Until the customer or instructor accepts it in writing, every plan MUST restate this conflict,
  and Principle III's GUI separation MUST be kept so a web front end can be added without
  rewriting business logic.

New conflicts are added here with the next `OC-n` ID and resolved only by a recorded customer
decision.

## Development Workflow & Quality Gates

- Workflow order: `/speckit-specify` → `/speckit-clarify` (when ambiguity exists) →
  `/speckit-plan` → `/speckit-tasks` → `/speckit-analyze` → `/speckit-implement`. A human
  review (Principle VII) is required after each step before moving to the next.
- **Spec gate:** every FR cites a CR ID; no technology choices appear as requirements;
  open questions are marked `[NEEDS CLARIFICATION]`.
- **Plan gate (Constitution Check):** confirms Java 21, Maven, Swing, JUnit 5, PlantUML, layer
  separation, BigDecimal money handling, the traceability matrix, and restates OC-1.
- **Implementation gate:** `mvn clean verify` passes; no `javax.swing`/`java.awt` imports
  outside `ui`; no `float`/`double` money fields; PlantUML diagrams updated; every new class
  and test traces to an FR.
- **Completion gate:** a human reviewer signs off with name and date.

## Governance

- This constitution supersedes conflicting practices, templates, and AI suggestions. Where it
  conflicts with `UserRequirement.md` on what the customer wants, `UserRequirement.md` wins;
  on how the team builds it, this constitution wins.
- Amendments require a written proposal stating the change and its rationale, human approval
  by the team, an updated Sync Impact Report, and a version bump:
  MAJOR for removing or redefining a principle, MINOR for adding a principle or materially
  expanding guidance, PATCH for clarifications and wording.
- Changing an implementation decision (ID table) is an amendment. Changing a customer
  requirement is not possible here; it requires a new recorded customer clarification.
- Every plan's Constitution Check and every review MUST verify compliance with all seven
  principles. Violations are either fixed or justified in the plan's Complexity Tracking table.

**Version**: 1.0.0 | **Ratified**: 2026-10-29 | **Last Amended**: 2026-10-29
