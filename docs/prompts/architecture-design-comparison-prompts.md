# SplitSmart Architecture & Design — Independent AI Prompt Pack

**Project:** CIS 285 Lab 6 — SplitSmart Expense Sharing  
**Repository:** \`SWEDanielRaskin/cis285-lab6\`  
**Feature:** \`001-splitsmart-expense-sharing\`

> **Draft branch:** This prompt pack belongs on \`draft/architecture-design-comparison-prompts\`, not \`main\`. GitHub's file API creates a commit on that branch; it cannot create an uncommitted working-tree file. Review/edit this branch before merging anything into \`main\`.

## Experiment protocol

1. Run Spec Kit and Claude Code from separate clean worktrees/branches created from the same baseline commit.
2. Run them independently. Do not let either tool see the other's generated artifacts.
3. Preserve both raw output sets without editing or reconciling them.
4. Give ChatGPT both complete sets and the same authoritative source artifacts for comparison.
5. All outputs remain drafts until human review under Constitution Principle VII.

### Source-of-truth order

1. \`UserRequirement.md\`: original customer request, read-only and authoritative for customer intent.
2. \`.specify/memory/constitution.md\`: binding engineering principles and current implementation decisions, subject to its customer-requirement precedence rule.
3. \`specs/001-splitsmart-expense-sharing/spec.md\`: clarified, testable feature requirements.
4. Existing repository files/templates: evidence of current project setup, not authorization to invent requirements.

**Known critical conflict:** OC-1 — CR-10 asks for a primarily web-based application, while constitution ID-03 selects a Java Swing desktop MVP. This remains unresolved pending written customer/instructor acceptance. Neither tool may silently resolve it or claim Swing satisfies the web requirement.

**Scope:** Architecture and design documentation only. Do not implement the application, generate implementation tasks, modify source code, alter the constitution/spec/customer request, or commit/push/merge.

---

# Prompt 1 — GitHub Spec Kit

**Run in the Spec Kit-enabled repository environment.** Use the installed \`/speckit-plan\` workflow (or exact configured equivalent). This prompt is for the planning/design workflow through Phase 1, not task generation or implementation.

Copy everything below:

---

You are executing the architecture and design planning stage for CIS 285 Lab 6, SplitSmart Expense Sharing.

## Mandatory source review

Read the complete contents of:
- \`UserRequirement.md\`
- \`.specify/memory/constitution.md\`
- \`specs/001-splitsmart-expense-sharing/spec.md\`
- \`.specify/templates/plan-template.md\`
- Relevant Spec Kit workflow/skill instructions and repository configuration
- Existing project structure and relevant files, if any

Do not assume a file exists because a template mentions it. Treat \`UserRequirement.md\` as read-only. The feature spec contains Clarifications dated 2026-10-29; honor those recorded answers and do not ask the user to answer them again unless you find a material contradiction.

## Non-negotiable constraints

1. Follow all seven constitution principles.
2. Preserve CR-01 through CR-10 and FR-001 through FR-041, including MVP/Post-MVP distinctions.
3. Never present an implementation decision as a customer requirement.
4. Explicitly carry forward OC-1. Do not claim Swing satisfies CR-10. Do not change the stack or resolve this conflict without a recorded customer/instructor decision.
5. Use current implementation decisions unless source artifacts conflict: Java 21, Apache Maven, Java Swing MVP, JUnit 5, PlantUML, layered OO architecture, and BigDecimal for all money.
6. Domain, service, and repository layers must not depend on Swing/AWT. UI classes must not contain business rules.
7. Use BigDecimal, scale 2, and the constitution's centralized rounding policy. Implement the exact clarified split algorithm in FR-011–FR-013 (round shares down, then distribute leftover cents in participant-list order). Explain how the general money policy and this specific allocation rule coexist; do not silently rewrite either.
8. Every FR must cite source CR ID(s) and trace to design elements. Do not invent requirements or unsupported technical choices.
9. Mark unknowns as \`NEEDS CLARIFICATION\`; distinguish facts, assumptions, recommendations, and decisions.
10. AI artifacts are drafts; do not mark them approved or claim human review.

## Execute

- Run the repository's Spec Kit planning workflow, including its pre-plan checks and configured mandatory hooks.
- Fill the plan template using actual project context.
- Complete Phase 0 research: for each decision, document decision, rationale, alternatives, and evidence. Research must not silently override constitution decisions.
- Complete Phase 1 design and re-evaluate the Constitution Check after design.
- Stop after Phase 1. Do not generate tasks or implementation.

## Required artifacts

Generate in the established feature directory, normally \`specs/001-splitsmart-expense-sharing/\`:

### 1. plan.md
Include summary, technical context, architecture style and rationale, runtime/build context, layer/package responsibilities, dependency direction, persistence approach (flag unknowns), security/privacy/audit/error/performance considerations, Constitution Check before and after design, actual project structure, Complexity Tracking for justified deviations, and explicit OC-1 impact.

### 2. research.md
For each topic include decision, rationale, alternatives considered, evidence/source, and whether it is binding or proposed. List unresolved questions and risks. Do not use research to override the constitution.

### 3. data-model.md
Describe User, Group, Membership, Expense, Share, Approval Decision, Payment, Notification, derived Balance, and Report as applicable. Include fields, relationships, constraints, validation, lifecycle/state transitions, persistence versus derived data, money/date/identity/audit invariants, and FR traceability.

### 4. contracts/
Define appropriate internal service/use-case, repository, and UI interaction contracts for this Swing application. Do not invent public REST endpoints for the Swing MVP. If a contract type is inapplicable, explain why. Include inputs, outputs, validation/authorization behavior, and FR IDs.

### 5. quickstart.md
Use only verified prerequisites and commands supported by repository files. Document build/test/run and design-validation scenarios, expected results, and FR IDs. Do not invent unverified commands.

### 6. PlantUML diagrams
Store under \`docs/uml/\` or the feature directory, consistently with the constitution:
- Domain class diagram for domain/service design
- Layer/component diagram
- Expense creation/approval sequence or activity diagram
- Payment settlement sequence diagram
- Notification sequence diagram
Annotate relevant FR IDs and keep diagrams consistent with written artifacts.

## Domain rules to preserve

Check the complete spec; this list is not exhaustive:
- Exactly one payer, any group member, default creator; payer need not participate.
- One or more participants.
- Equal split: floor each share to cents, distribute remaining cents one at a time in participant-list order.
- Percentage split: percentages have at most two decimals and total exactly 100.00; calculate shares per spec and distribute leftover cents by the same deterministic order. Persist participant order.
- New expenses are Pending and do not affect balances until Approved.
- Any participant other than creator can approve/reject; one decision decides the expense. Rejection requires a reason; decisions are immutable/auditable.
- Notify all other current group members; non-creator participants see an approval flag while Pending.
- Balances are per group; overall pair balance is the sum across shared groups.
- Payments name a group and apply immediately; recipient confirmation is not required. Overpayment requires warning and confirmation.
- Reports support inclusive date range, group, other user, expense status filters and reconcile with balances.
- Passwords are not stored in readable form; five consecutive failed logins lock account for five minutes.
- Preserve all remaining FR/NFR details, including privacy, persistence, reliability, accessibility, performance, auditability, and testability.

## Quality gates

Before completion verify:
- All CR-01–CR-10 remain visible; MVP/Post-MVP boundaries match the spec.
- OC-1 is explicit and unresolved unless a recorded decision exists.
- Java 21, Maven, Swing, JUnit 5, PlantUML, layered separation, BigDecimal are addressed.
- Every FR traces to CR(s), design element, and later test/manual-check strategy.
- Pending/Rejected expenses never affect balances.
- Split math, approval, payment, balance, notification, reporting, and privacy rules match the clarified spec.
- No unsupported choice is presented as settled fact.
- Constitution Check is re-evaluated after design.
- No code or implementation tasks were generated.

## Completion report

Report branch, plan path, all created/updated artifacts, skipped artifacts and reasons, unresolved questions, constitution violations, and final gate status. Summarize major architecture decisions. Do not claim tests passed unless actually run.

---

# Prompt 2 — Claude Code (independent architecture and design)

**Run in a separate clean checkout/worktree or branch from the same baseline as Prompt 1.** Do not let Claude inspect Spec Kit's generated output. Do not run the Spec Kit planning command for this experiment.

Copy everything below:

---

Act as the solution architect and senior Java designer for CIS 285 Lab 6, SplitSmart Expense Sharing. Independently produce a complete architecture and design proposal from the repository's authoritative inputs. This is an independent experiment to compare your work with a separate Spec Kit-generated design.

## Inspect first

Read the complete:
- \`UserRequirement.md\`
- \`.specify/memory/constitution.md\`
- \`specs/001-splitsmart-expense-sharing/spec.md\`
- \`.specify/templates/plan-template.md\`
- Relevant Maven/build configuration and source files, if present
- Existing UML, documentation, and project structure, if present
- Relevant repository instructions such as \`CLAUDE.md\`

Report missing files; do not assume they exist. Honor the 2026-10-29 clarified decisions.

## Independence and scope

- Do not inspect/copy/use the Spec Kit output from the other experiment.
- Do not run \`/speckit-plan\`, \`/speckit-tasks\`, \`/speckit-implement\`, or competing generation commands.
- Do not edit source requirements, constitution, spec, source code, tests, migrations, or build files.
- Do not generate implementation tasks or application code.
- Do not commit, push, merge, or change branches.
- Generate design documentation only.
- Label unknowns \`NEEDS CLARIFICATION\`; never invent customer answers.
- Do not claim approval or human review.

## Authority and conflict

\`UserRequirement.md\` governs customer intent. The constitution governs engineering principles/implementation decisions but gives customer requirements precedence on what the customer wants. The clarified spec provides testable behavior; flag conflicts with either higher source.

Explicitly preserve OC-1: CR-10 requests a primarily web-based product, while ID-03 selects a Java Swing desktop MVP. This remains unresolved pending written customer/instructor acceptance. Do not claim Swing fulfills the web requirement. Keep domain/service logic independent enough that a future web front end could reuse it, but do not design or implement an unauthorized web deliverable.

## Binding engineering constraints

- Java 21; Apache Maven; Java Swing MVP; JUnit 5; PlantUML.
- Layered OO packages: \`domain\`, \`service\`, \`repository\`, \`ui\`.
- No Swing/AWT dependencies in domain/service/repository.
- UI gathers input, invokes services, renders results; no business rules in UI.
- Constructor injection at boundaries; prefer composition/SOLID.
- BigDecimal for every monetary amount; never float/double for money.
- Scale 2 and constitution's centralized rounding policy.
- Implement the exact split floor/remainder rule in FR-011–FR-013. Explain its interaction with general money rounding.
- Business rules need JUnit 5 verification, but do not create tests in this exercise.
- Design elements trace to FR IDs; FRs trace to CR IDs.
- All generated artifacts need human review.

Distinguish Customer Requirements (CR), Functional Requirements (FR), Non-Functional Requirements (NFR), constitution decisions (ID), your Architecture/Design Decisions (AD), assumptions, and unresolved questions. Do not label an AD as a customer requirement.

## Required output location

Write only under \`docs/ai-comparison/claude-code/\`. Do not overwrite the Spec Kit feature directory.

### 1. architecture.md
Architecture goals/scope/constraints/quality attributes; component/layer architecture; responsibilities/interfaces/dependency direction; runtime collaboration; persistence boundary and proposed storage (label as proposal if not specified); security/privacy/audit/error/logging/performance; future web-client extension path without claiming web MVP; alternatives/trade-offs; AD decision register with status, rationale, consequences, and requirement traceability.

### 2. design.md
Domain model/value objects; attributes/relationships/invariants/validation/state transitions; services/use cases/repository interfaces; UI navigation/screens/controller responsibilities; expense/split/approval/balance/payment/notification/report flows; error strategy and transaction boundaries; persistence mapping considerations (no migrations); FR/CR/NFR traceability matrix.

### 3. data-model.md
Detailed User, Group, Membership, Expense, Share, Approval Decision, Payment, Notification, Balance, Report model; state/lifecycle; uniqueness/referential integrity/validation/audit fields; derived versus persisted data; money/date invariants; FR traceability.

### 4. contracts/
Internal service/use-case and repository contracts; UI-service interactions where useful; no fictional REST endpoints for Swing MVP. Specify inputs, outputs, validation failures, authorization, and FR IDs.

### 5. quickstart.md
Verified prerequisites and existing repository commands only; reviewer validation instructions; proposed validation scenarios and expected results with FR IDs. Clearly distinguish runnable commands from future implementation checks.

### 6. uml/
PlantUML source for domain class, layer/component, expense creation/approval, payment settlement, and notification sequence diagrams. Annotate FR IDs and ensure names/responsibilities agree with written design.

### 7. open-questions-and-risks.md
Unresolved source conflicts, assumptions, technical risks, decisions needing customer/instructor input, and explicit OC-1. Do not close open issues just to make the design look complete.

## Domain rules to preserve

Verify these against the complete spec:
- Exactly one payer; any group member; defaults to creator; payer need not be a participant.
- One or more participants; preserve participant order.
- Equal split: floor shares to cents and allocate leftover cents in participant order.
- Percentage split: at most two decimal places, totals 100.00; shares and remainder per FR-013/FR-012.
- Pending expenses do not affect balances; only Approved expenses do.
- Any participant other than creator can decide; one decision; rejection reason required; decisions immutable/auditable.
- Notifications go to all other current members; non-creator participants flagged for approval while Pending.
- Per-group pairwise balances; overall balances sum relevant group balances.
- Payment names group and applies immediately; no recipient confirmation; overpayment warns and requires confirmation.
- Reports filter by inclusive date range, group, other user, expense status and reconcile to balances.
- Passwords protected; five consecutive failed logins trigger five-minute lockout.
- Preserve all other FR/NFR details, including privacy, persistence, auditability, keyboard accessibility, performance, reliability, and testability.

## Quality review

Verify all CR-01–CR-10 and FR-001–FR-041, including Post-MVP; all NFRs; traceability of classes/services/contracts/diagrams; layer separation; no UI business rules; exact money behavior; approval/payment/balance invariants; security/privacy/persistence/auditability/accessibility/performance/testability; OC-1 remains explicit; proposed decisions are labeled AD. No code/tests/tasks/commits.

## Completion report

Summarize architecture, list files, list AD decisions, unresolved questions/risks, source contradictions, and each quality check as Pass/Fail/Needs human review. Do not claim commands/tests were run unless actually run.

---

# Prompt 3 — ChatGPT comparison and cross-check

**Run only after both independent sets are complete.** Supply ChatGPT the full Spec Kit output, full Claude Code output, and all authoritative source artifacts. Do not provide summaries alone.

Copy everything below:

---

Act as an independent architecture reviewer, requirements auditor, and design comparison analyst for CIS 285 Lab 6 — SplitSmart Expense Sharing.

Two tools independently generated architecture/design artifacts:
- Set A: GitHub Spec Kit
- Set B: Claude Code

Compare both sets and independently cross-check them against the source of truth. Do not assume either is correct because it is longer, more polished, or more confident.

## Required inputs

Read the full contents of:

**Authoritative sources**
1. \`UserRequirement.md\`
2. \`.specify/memory/constitution.md\`
3. \`specs/001-splitsmart-expense-sharing/spec.md\`

**Spec Kit set**
- \`plan.md\`, \`research.md\`, \`data-model.md\`
- Every file in \`contracts/\`
- \`quickstart.md\`
- All PlantUML diagrams
- Completion report

**Claude Code set**
- \`architecture.md\`, \`design.md\`, \`data-model.md\`
- Every file in \`contracts/\`
- \`quickstart.md\`
- All PlantUML diagrams
- \`open-questions-and-risks.md\`
- Completion report

List missing/inaccessible inputs. Do not infer contents. Continue with qualifications unless missing evidence prevents a reliable conclusion.

## Review principles

- Original customer intent comes from UserRequirement.md.
- Constitution governs engineering principles and implementation decisions while preserving customer requirements as authoritative for intent.
- Clarified spec supplies testable behavior and recorded answers; cross-check it against both.
- Distinguish contradiction from legitimate design alternative.
- Judge both sets by identical criteria.
- Never silently resolve a source conflict or turn assumption into fact.
- Do not edit files, create replacement architecture, or implement fixes.
- Do not mark AI artifacts approved; human review remains mandatory.

## Critical OC-1 audit

CR-10 requires primarily web-based. ID-03 selects Java Swing desktop MVP. OC-1 is unresolved pending written customer/instructor acceptance.

For each set determine:
- Is OC-1 explicit?
- Does it accurately state Swing does not satisfy the web requirement?
- Does it preserve Swing as an implementation decision, not customer requirement?
- Is domain/service logic sufficiently independent for a future web client?
- Does it avoid claiming an unauthorized web deliverable?

Any silent erasure or misstatement is a Critical finding.

## Required analysis

### A. Executive comparison
Assess completeness, requirement/constitution fidelity, internal consistency, implementability, strengths/weaknesses, and whether either set is a safe baseline for the next phase. Do not select a winner based on length/presentation.

### B. Requirements traceability audit
Create a matrix for CR-01–CR-10, FR-001–FR-041, and NFR-001–NFR-009. For each: concise meaning; Spec Kit file/section/diagram reference; Claude file/section/diagram reference; coverage status for each (Complete / Partial / Missing / Contradictory / Not Applicable); evidence; recommended correction. Confirm Post-MVP requirements remain visible and are not silently treated as MVP commitments.

### C. Constitution compliance
Audit all seven principles:
1. Customer Requirements Are the Source of Truth
2. Requirement Traceability
3. Object-Oriented Design with GUI/Business-Logic Separation
4. Exact Money Arithmetic with BigDecimal
5. Automated Testing with JUnit 5
6. Design Modeled in PlantUML
7. Human Review of AI-Generated Output

For each set and principle report Pass / Partial / Fail / Cannot Verify with file-level evidence. Check Java 21, Maven, Swing MVP, JUnit 5, PlantUML, layering, inward dependencies, BigDecimal/scale/rounding, constructor injection, and SOLID.

### D. Domain/business-rule cross-check
Independently validate both designs against the clarified spec:
- Registration/authentication/privacy/lockout
- Group creation, membership, admin authority, leave/removal restrictions
- Expense fields, payer, participants, receipts, validation, edit/delete lifecycle
- Equal/percentage split arithmetic, deterministic leftover cents, participant ordering
- Pending/Approved/Rejected transitions
- Approver eligibility, creator exclusion, rejection reason, immutable decisions
- Notification audience/content/read state/approval flags
- Per-group pairwise balances and overall aggregation
- Payment recording, immediate application, group restriction, overpayment confirmation
- Report filters, line items, totals, reconciliation
- Persistence/restart behavior; date/amount display
- All NFR security, privacy, performance, reliability, auditability, usability, accessibility, testability

Flag subtle semantic changes, not just missing headings.

### E. Architecture/design quality
Compare layer boundaries/dependencies; domain cohesion/responsibilities; service/use-case decomposition; repository/persistence abstraction; transaction boundaries/consistency; UI navigation/controllers; validation/error handling; authentication/authorization; notification/approval; balance calculation; reporting; extensibility/maintainability/testability; UML accuracy and consistency.

Identify duplication, missing components, unnecessary complexity, tight coupling, and decisions unsupported by sources.

### F. Artifact consistency
Cross-check plan vs data model/contracts/quickstart; architecture/design vs data model; written design vs diagrams; names, relationships, responsibilities, state transitions, and source structure. Identify contradictions, stale terms, missing references, and diagram mismatches.

### G. Risk/ambiguity register
Prioritize findings with ID, severity (Critical/High/Medium/Low), finding, evidence/files, affected requirement/principle, consequence, recommendation, and whether customer/instructor input is needed. Include OC-1 and other genuine source conflicts.

### H. Reconciliation recommendations
State which decisions/artifacts from A and B to retain, revise, or reject; which need customer/instructor input; and which artifacts should form the merged baseline. Do not merge or rewrite files. Give precise recommendations and proposed wording only where useful.

### I. Final readiness verdict
For each set score 0–5 with rubric:
- Requirements coverage
- Constitution compliance
- Domain correctness
- Architecture quality
- Design completeness
- Traceability
- Internal consistency
- Review readiness

Choose:
- Ready for human review
- Conditionally ready — corrections required
- Not ready — major redesign required

A high average must not hide a Critical failure. State clearly this is AI review, not Principle VII human approval.

## Required report format

1. Executive Summary
2. Inputs Reviewed and Missing Evidence
3. Side-by-Side Requirements Traceability Matrix
4. Constitution Compliance Matrix
5. Domain and Business-Rule Audit
6. Architecture and Design Comparison
7. Artifact Consistency Findings
8. Prioritized Risk and Ambiguity Register
9. Reconciliation Recommendations
10. Scoring and Readiness Verdict
11. Human Reviewer Sign-off Checklist

Use exact file paths and section headings as evidence. Separate facts, interpretations, and recommendations. If a claim cannot be verified, say Cannot Verify. End with specific corrections required before Spec Kit task generation or implementation.

---

## Suggested run sequence

| Step | Tool | Action | Result |
|---|---|---|---|
| 1 | Git | Create clean worktree/branch A from baseline | Isolated Spec Kit workspace |
| 2 | Spec Kit | Run Prompt 1 | Spec Kit design set |
| 3 | Git | Create clean worktree/branch B from same baseline | Isolated Claude workspace |
| 4 | Claude Code | Run Prompt 2 | Independent Claude design set |
| 5 | ChatGPT | Supply both sets and source files; run Prompt 3 | Comparison/cross-check report |
| 6 | Human reviewer | Resolve findings and sign off | Accepted design baseline |

## Human review checklist

- [ ] Reviewed architecture against original customer request.
- [ ] Confirmed CR-10 / OC-1 with instructor/customer or documented that it remains unresolved.
- [ ] Checked CR/FR/NFR traceability and MVP/Post-MVP boundaries.
- [ ] Verified money arithmetic and deterministic split behavior.
- [ ] Checked approval, payment, and balance invariants.
- [ ] Reviewed class, component, sequence/activity diagrams.
- [ ] Verified GUI dependencies do not leak into business logic.
- [ ] Reviewed persistence/security choices and assumptions.
- [ ] Reviewed open questions and risks.
- [ ] Recorded reviewer name/date before accepting artifacts.

**Reviewer:** ____________________  
**Review date:** ____________________  
**Accepted baseline / commit:** ____________________  
**Outstanding issues:** ____________________
