# SplitSmart Expense Sharing — Reconciliation Instructions

**Purpose:** Direct the team to produce one coherent, reviewable, final requirements and architecture/design baseline by reconciling the Spec Kit (Set A) and Claude Code (Set B) artifacts.

**Status:** Draft instructions for human review. These instructions do not approve either AI-generated set, resolve customer questions, amend the constitution, or authorize implementation.

**Repository:** `SWEDanielRaskin/cis285-lab6`  
**Related review:** [Architecture and Design Comparison Report](architecture-design-comparison-report.md)

---

## 1. Mission and expected outcome

Produce a single internally consistent documentation baseline for SplitSmart Expense Sharing. It must cover:

1. Customer, functional, and non-functional requirements.
2. Requirements decisions, assumptions, constraints, and open questions.
3. Architecture and design rationale.
4. Domain model, persistence/data model, and service/repository/UI contracts.
5. A complete, mutually consistent UML set: use-case, component, detailed class, sequence, state-machine, and activity diagrams.
6. Validation strategy, traceability, quickstart/developer guidance, and decision records.

The result is a **reconciled proposal for human approval**, not an automatic merge of the two AI sets. Prefer Set A's requirements-conservative structure and traceability. Selectively incorporate Set B's useful technical detail where it is supported by approved requirements or is clearly labeled as a proposal. Do not choose one set wholesale.

Do not implement application code, create Spec Kit task lists, run implementation workflows, or claim that any requirement has been verified by running software as part of this documentation reconciliation.

## 2. Governing sources and precedence

Read the current versions of these sources before changing any documentation:

1. `UserRequirement.md` — customer-level source.
2. `.specify/memory/constitution.md` — project principles and binding implementation decisions.
3. `specs/001-splitsmart-expense-sharing/spec.md` — clarified MVP scope, CR/FR/NFR inventory, scenarios, edge cases, assumptions, and open questions.
4. `docs/ai-comparison/review/architecture-design-comparison-report.md` — independent comparison findings and recommendations.
5. Set A artifacts under `specs/001-splitsmart-expense-sharing/` and `docs/uml/`.
6. Set B artifacts under `docs/ai-comparison/claude-code/`.

Precedence rules:

- Customer requirements are not changed by an architecture preference.
- The constitution governs project constraints and implementation decisions unless it is formally amended through the project's required process.
- The clarified feature specification is the working, detailed expression of requirements, but it must be corrected where it conflicts with higher-authority sources or contains unresolved ambiguity.
- The comparison report is an audit and recommendation, not a new source of requirements.
- AI-generated architecture decisions, data constraints, limits, algorithms, and workflows are proposals unless directly required by an approved source or accepted by a named human reviewer.
- When sources conflict, record the conflict, identify the decision owner, and obtain a decision. Do not silently choose a convenient interpretation.

Retain source IDs (CR, FR, NFR, principle, OC/DQ/SRC/AD identifiers) where possible. If an ID is split, merged, retired, or added, provide an ID migration table so no requirement disappears from traceability.

## 3. Critical gate: resolve OC-1 before calling the baseline final

The comparison report identifies a Critical conflict:

- CR-10 in `UserRequirement.md` requires a primarily web-based application.
- Constitution decision ID-03 selects a Java Swing desktop MVP.
- The constitution records OC-1 as unresolved and requires written customer/instructor acceptance before plan approval.

Both AI sets document the conflict honestly, but neither satisfies CR-10. A Swing application is not a web application. A GUI-independent service layer or future web-client option does not make the MVP web-based.

**Required action:**

1. Obtain and record the written customer/instructor decision, including who decided, date, exact scope, and any conditions.
2. If desktop is accepted for this MVP only, state explicitly that CR-10 is not satisfied by the MVP, record the accepted deviation and any deadline/expectation for web delivery, and update the spec's Q3/OC-1 wording consistently.
3. If web is required now, stop and obtain the necessary constitution/implementation decision change before finalizing architecture. Do not preserve Swing as if it were still an approved implementation constraint.
4. If the decision is not available, keep OC-1 **OPEN / BLOCKING**. The documentation may be prepared as a conditional draft, but must not be labeled approved, final, ready for task generation, or implementation-ready.

Record the decision in a dedicated decision log and cross-reference it from the requirements, plan, architecture, risk register, and quickstart. Do not invent customer acceptance.

Also verify the source discrepancy noted in the report: the report records that a separate lab handout may mention Android/iOS in addition to web, while `UserRequirement.md` does not. Confirm with the instructor/customer whether mobile is in scope. Do not add mobile requirements without an authoritative decision.

## 4. Reconciliation method

Work in a new branch from the current `main`. Preserve the existing AI outputs and comparison report unchanged as evidence. Do not overwrite Set A or Set B while reconciling.

Use this sequence:

### Step 1 — Inventory and classify

Create an artifact inventory showing each source/artifact, authority, owner, status, and intended disposition:

- Adopt unchanged.
- Adopt with edits.
- Incorporate selected content.
- Retain as a proposal pending decision.
- Supersede (with reason and replacement link).
- Reject (with reason).

Review complete files, not only summaries. Check every contract and every diagram. Preserve the provenance of significant ideas from Set A or Set B where helpful.

### Step 2 — Build a decision and ambiguity register

For every unresolved item record:

- Unique ID.
- Exact conflicting statements and source locations.
- User-visible/business impact.
- Options and consequences.
- Recommended option (if justified).
- Decision owner (customer, instructor, product owner, or team).
- Status: OPEN, PROPOSED, ACCEPTED, REJECTED, or DEFERRED.
- Decision evidence, author, and date.

At minimum revisit all Critical and High items in the comparison report, including OC-1; former-member visibility versus NFR-003; group leaving/removal and nonzero net versus pairwise debt; pending-expense membership dependencies; admin departure and succession; report totals and date-filter reconciliation; and local-installation collaboration constraints. Review medium/low issues too, including registration navigation, amount limits, constitution rounding language, data/FR traceability, and any mobile requirement in the handout.

### Step 3 — Reconcile requirements first

Do not finalize architecture or diagrams until the requirement wording and decisions are stable enough to drive them. For every CR, FR, and NFR:

- Preserve its ID and normative meaning.
- State scope (MVP, post-MVP, or out of scope).
- Define actors, preconditions, main behavior, alternate/error behavior, and observable acceptance criteria where applicable.
- Remove vague terms or define measurable meanings.
- Identify dependencies and related data/security rules.
- Link to at least one validation method.
- Mark unresolved content visibly; do not present proposals as approved facts.

Make the requirements baseline the source for all downstream artifacts.

### Step 4 — Reconcile architecture, design, and data

Adopt a single architecture and terminology. For each design decision, state whether it is mandated, approved, or proposed. Reconcile contracts, model names, transaction boundaries, validation order, concurrency assumptions, and diagram paths before publishing.

### Step 5 — Cross-artifact consistency review

Run a systematic ID and name check across requirements, data model, contracts, architecture, diagrams, validation plan, and quickstart. Every diagram element and contract operation must agree with the prose. Every persisted field must have a reason and traceability. Every business rule must have a clear enforcing layer and validation case.

### Step 6 — Human review and approval

Request review from the appropriate customer/instructor and named team reviewers. Record approvals and remaining conditions. Do not infer approval from a Git commit, AI output, or absence of comments.

---

## 5. Required final documentation set

Use the following structure as the target. Adjust only when a documented reason justifies it. Keep canonical project UML under `docs/uml/` (or the feature directory if the constitution directs otherwise); do not leave adopted diagrams only in the AI experiment folder.

```text
UserRequirement.md
.specify/
  memory/
    constitution.md
specs/
  001-splitsmart-expense-sharing/
    spec.md
    requirements-traceability.md
    plan.md
    research.md
    data-model.md
    design.md
    contracts/
      README.md
      service-contracts.md
      repository-contracts.md
      ui-interactions.md
    validation-plan.md
    quickstart.md
    decisions/
      README.md
      decision-log.md
    risks-and-open-questions.md
docs/
  architecture/
    architecture.md
    architecture-decisions.md
  uml/
    use-case.puml
    component.puml
    domain-class.puml
    service-class.puml
    expense-approval-sequence.puml
    payment-settlement-sequence.puml
    notification-sequence.puml
    authentication-lockout-sequence.puml
    expense-state.puml
    membership-state.puml
    authentication-state.puml
    create-expense-activity.puml
    approve-or-reject-expense-activity.puml
    record-payment-activity.puml
    generate-report-activity.puml
  ai-comparison/
    review/
      architecture-design-comparison-report.md
      reconciliation-instructions.md
```

Do not create empty placeholder files merely to match this tree. If a diagram is genuinely not applicable, explain why in the UML index. If a document is combined with another, preserve all required content and update links.

### 5.1 Requirements baseline — `spec.md`

Produce one authoritative, readable requirements specification containing:

- Product purpose, users, scope, MVP boundaries, and explicit exclusions.
- All CR-01–CR-10 (or formally revised inventory), with OC-1 status visible.
- All FR-001–FR-041, including post-MVP requirements clearly marked as deferred rather than deleted.
- All NFR-001–NFR-009 with measurable acceptance criteria.
- Actors, user stories/use cases, preconditions, postconditions, normal and alternate flows.
- Business rules, validation rules, error behavior, edge cases, assumptions, dependencies, and constraints.
- Acceptance scenarios and success criteria.
- A change history and links to decisions.

Do not quietly weaken a requirement to match the current design. If a requirement is changed, show the original, proposed wording, rationale, approving authority, and impact.

### 5.2 Non-functional requirements

Give every NFR a measurable verification method. In particular:

- **Money correctness:** define currency precision, accepted input scale, rounding modes by operation, overflow/range behavior, and invariants. Preserve the distinction between the constitution's general BigDecimal/HALF_EVEN policy and requirement-specific floor-to-cents/remainder-allocation rules; resolve any conflict explicitly rather than applying one mode indiscriminately.
- **Authentication:** specify password storage (never plaintext), generic credential errors, consecutive-failure definition, lockout start/duration, behavior during lockout, reset behavior, and clock/test strategy.
- **Authorization/privacy:** define active-member and former-member visibility precisely for screens, reports, receipts, notifications, history, and payments. Reconcile FR-003 and NFR-003 with the former-member history edge case.
- **Performance:** define dataset size, hardware/runtime assumptions, operation timing boundaries, and repeatable measurement procedure for the two-second target. Label unmeasured performance as unverified.
- **Reliability/durability:** define transaction guarantees, commit/rollback expectations, restart/crash recovery expectations, backup assumptions if applicable, and tests.
- **Auditability:** define immutable decision/payment fields, actor/time source, and protection against edits through application operations.
- **Usability/accessibility:** define the three-step navigation measurement and keyboard-only primary workflows with testable task scripts.
- **Testability:** identify business logic that must be executable without Swing/UI dependencies and list automated test coverage expectations.

Do not claim an NFR is met merely because the architecture proposes a mechanism.

### 5.3 Architecture — `architecture.md` and `plan.md`

Provide:

- System context, scope boundary, actors, external dependencies, and runtime/deployment model.
- A clear layered architecture and dependency direction.
- Responsibilities and public boundaries of `domain`, `service`, `repository`, and `ui`.
- Persistence and transaction strategy, error propagation, validation ownership, and concurrency strategy.
- Authentication/session and authorization enforcement.
- Receipt storage and validation approach.
- Notification behavior and its limits in the selected deployment model.
- Reporting/query approach and consistency semantics.
- Logging/audit and privacy considerations.
- Build/runtime constraints (including Java 21, Maven, Swing, and JUnit 5 only if they remain approved).
- Post-MVP extension seams without implying deferred features are part of MVP.
- Explicit tradeoffs, alternatives considered, and architecture decision references.

Use Set B's more detailed service decomposition, transaction/concurrency thinking, and pure calculation components selectively where they improve clarity and remain consistent with approved requirements. Consider `LedgerReader`, `BalanceCalculator`, `ReportCalculator`, session/access policy, notification dispatch, and conditional version updates as design candidates—not mandatory requirements. Choose one storage technology only after documenting rationale and approval; Set A's SQLite and Set B's H2 are alternatives, not simultaneous decisions.

Keep domain and service logic independent of Swing. Enforce the constitution's rule that Swing/AWT types remain in the UI layer if Swing remains approved. Use constructor injection where required by the constitution. Document the actual multi-user collaboration limitations of a local desktop deployment.

### 5.4 Design and contracts

The design document must describe:

- Domain concepts, entities, value objects, invariants, lifecycle behavior, and calculations.
- Service responsibilities and operation contracts.
- Repository responsibilities, transaction boundaries, uniqueness/foreign-key constraints, and concurrency behavior.
- UI-to-service interaction and validation/error presentation.
- Authentication, authorization, notifications, receipts, reporting, and payments.
- The source of each business rule and the layer that enforces it.

For every public service/repository/UI contract, specify inputs, outputs, errors, authorization, transaction behavior, side effects, and relevant requirement IDs. Make validation order consistent across prose, contracts, sequence diagrams, and tests. Explicitly document whether an operation uses one transaction, optimistic version checking, locking, or another approved strategy.

Do not add behavior from AD-14, AD-15, AD-16, AD-18 or other Claude proposals unless the decision register records acceptance by the proper owner. If rejected, remove it from normative design and retain the rationale in the decision log.

### 5.5 Data model

Deliver both a conceptual domain model and a persistence model:

- Entity/value-object definitions, identifiers, attributes, types, nullability, constraints, relationships, cardinalities, and ownership.
- Primary/foreign keys, uniqueness rules, indexes, ordering guarantees, and deletion/retention behavior.
- Mapping from domain concepts to tables/records.
- Audit fields and immutable records.
- Derived versus persisted values (especially balances and reports).
- Receipt metadata/content storage decision and size/media validation.
- Migration/versioning strategy and transaction constraints.
- Data dictionary with requirement/decision references.

Resolve the membership history/rejoin approach, former-member access, admin succession, pending-expense references, and payment constraints before locking the schema. Do not persist a calculated balance unless there is an approved consistency strategy; explain how ledger-derived balances reconcile.

---

## 6. UML deliverables and required content

All `.puml` files must compile with PlantUML. Include a short index or README describing each diagram's purpose, scope, and linked requirements. Use consistent names, multiplicities, status names, actors, and service operations across every diagram.

### 6.1 Use-case diagram — `use-case.puml`

Show the system boundary and relevant actors (visitor, authenticated user/group member, group admin, and any external actor/system that is actually in scope). Include the MVP use cases for account registration/login/logout, group management, expense creation/edit/delete, receipt handling, notifications, approval/rejection, balance viewing, payment recording/history, and report generation/filtering. Distinguish admin-only behavior and actor generalization where useful. Do not draw deferred web/mobile/export functions as MVP use cases. Add notes for unresolved scope rather than hiding it.

### 6.2 Component diagram — `component.puml`

Show UI, application/service layer, domain model/calculators, repository interfaces/implementations, persistence/database, receipt storage, and notification mechanism. Draw dependency direction and interface boundaries. Show that UI depends on services, services depend inward on domain and repository abstractions, and domain does not depend on Swing, database implementations, or UI. Depict deployment/external systems only if they are part of the approved MVP. Include a note explaining local-installation collaboration constraints where relevant.

### 6.3 Detailed class diagrams — `domain-class.puml` and `service-class.puml`

Provide enough detail to review design, not merely a handful of boxes.

**Domain class diagram** should show key attributes/operations, visibility where meaningful, associations, multiplicities, composition/aggregation, inheritance/interfaces, enums, value objects, and invariants/constraints. Include at least User, Group, Membership, Expense, Share, ApprovalDecision, Payment, Notification, Receipt, Money/Percentage, relevant identifiers, and derived ledger/report concepts. Clearly distinguish persisted entities from derived/read-model types.

**Service class diagram** should show service classes, repository interfaces, injected dependencies, request/response/criteria objects, validators, calculators, notification interfaces, and important domain collaborators. Include responsibility boundaries and dependencies. Do not duplicate the component diagram without class-level contracts. Ensure class/method names match the contract documents.

### 6.4 Sequence diagrams

Provide sequence diagrams for the important time-ordered interactions, at minimum:

- Expense creation (including validation, split allocation, persistence, and notifications).
- Expense approval/rejection (eligibility, decision immutability, transaction, ledger/balance impact, notification).
- Payment settlement (authorization, overpayment warning/confirmation, persistence, immediate application, balance update/history).
- Notification creation and retrieval/read marking.
- Authentication/lockout (optional separate sequence if not clear in state/activity views).

Show actor, UI, service, domain/calculator, repository, transaction boundary, and notification participant as applicable. Include alternate/error paths: invalid fields, unauthorized actor, stale version/concurrent update, rejected expense, notification failure, and overpayment cancellation/confirmation. Keep operation order consistent with contracts and design. Do not imply external delivery if MVP only supports in-app notifications.

### 6.5 State-machine diagrams

Provide explicit state diagrams for:

- **Expense:** Pending, Approved, Rejected, and creator-only deletion/removal from Pending. Show guards, actor eligibility, rejection reason, and terminal states. Approved/Rejected must not be edited/deleted if that is the approved rule.
- **Authentication/lockout:** unlocked, failed attempts, locked for five minutes, expiry/reset, successful login. Define whether attempts during lockout are ignored and how the counter resets.
- **Membership:** active to ended/removed/left and any approved rejoin lifecycle. Include admin succession only if accepted. Show exit guards and unresolved behavior if not decided.
- **Payment lifecycle** only if the approved design has meaningful states (e.g., confirmation pending); do not invent asynchronous states for an immediately applied payment.

State diagrams must align with the domain model and persisted status fields. Do not show a state that cannot be represented or reached by the system.

### 6.6 Activity diagrams

Provide activity diagrams for the primary business workflows:

- Create expense, validate inputs, select/validate payer and participants, allocate shares, save Pending expense, notify recipients.
- Approve or reject expense, including eligibility, reason validation, exactly-once decision, transaction/ledger effects, and notifications.
- Record payment, including authorization, amount validation, overpayment warning/confirmation, immediate application, and history.
- Generate report, including filters, data visibility, approved/pending/rejected treatment, totals, and reconciliation.

Use decision/merge nodes for alternate flows, swimlanes where responsibility crosses actors/layers, and explicit error/end paths. Ensure the report activity reflects the final approved meaning of report totals and date filters.

---

## 7. Domain rules that must be explicitly reconciled

Use the source specification and report as the checklist. At minimum, confirm and document:

- Payer is exactly one user, defaults to creator, may be any group member, and need not participate.
- Participants are distinct, ordered, and are valid group members under the approved membership policy.
- Equal split: floor each share to cents, then allocate remaining cents deterministically in persisted participant order.
- Percentage split: validate allowed precision and exact total; define deterministic cent allocation and remainder behavior.
- Zero-cent shares and very small amounts are handled consistently with acceptance examples.
- Pending expenses do not affect balances. Only Approved expenses create ledger effects.
- Creator cannot approve/reject own expense; eligible approver is a participant other than creator; one immutable decision; rejection reason required.
- Edit/delete permissions and lifecycle are consistent across domain, contracts, UI, data, and UML.
- Approved expense debt is from each non-payer participant to payer for that participant's share; payer's own share is excluded.
- Per-group pairwise netting and aggregate balances are mathematically consistent; total owed equals total due.
- Payment applies immediately without recipient confirmation, subject to the specified overpayment warning/confirmation.
- Payment visibility/history and membership restrictions are explicit.
- Notifications identify recipients and approval-required status; define what happens when an expense is deleted or a recipient's membership changes.
- Reports define approved expense totals, payment totals, status-filter behavior, date semantics, opening/period/later/current balance treatment, and reconciliation against live balances.
- Group leave/removal must reconcile net balance, pairwise obligations, pending expenses, and payment settlement rules. Do not adopt the stricter pairwise-zero/pending-expense guard without customer/team approval.
- Admin removal/departure and last-member behavior must be decided, not guessed.

For each rule, include a source ID, normative statement, enforcing component, and validation scenario.

---

## 8. Traceability and validation package

Create `requirements-traceability.md` with a complete matrix:

- CR → FR/NFR → user story/use case → domain rule/data element → service/contract → architecture component → UML diagram/element → acceptance criterion/test.
- Include all CRs, FRs, and NFRs; explicitly account for deferred requirements and OC-1.
- Every FR should trace to a customer requirement or carry a documented explanation if the source genuinely provides no CR mapping. Resolve the current FR-040/FR-041 mapping gap rather than inventing a customer link.
- Every NFR must trace to measurable verification.
- Mark each link as proposed or approved where relevant.

Create `validation-plan.md` with test scenarios and expected outcomes for:

- Split calculations and deterministic remainder allocation, including edge amounts.
- Balance invariants and group/aggregate reconciliation.
- Approval eligibility, one-decision enforcement, and immutable audit.
- Payment settlement and overpayment paths.
- Authentication/lockout boundary times.
- Authorization and former-member privacy.
- Report filters/totals/reconciliation.
- Persistence, transaction rollback, crash/restart, and concurrent updates.
- Keyboard-only UI and navigation.
- Performance at the specified data scale.

Separate automated unit, service/integration, repository/persistence, UI/manual, security/privacy, performance, and acceptance tests. Identify scenarios that cannot be verified until implementation exists. No test execution is required for this documentation task.

---

## 9. Required risk and decision handling

Maintain `risks-and-open-questions.md` and the decision log. Carry forward every unresolved item from the comparison report until explicitly resolved or deferred by an authorized owner.

Priority guidance:

- **Critical:** OC-1; any issue that invalidates the selected platform/scope or blocks plan approval.
- **High:** privacy/authorization ambiguity; membership exit and settlement; report reconciliation semantics; local desktop collaboration limitations; any source-of-requirement discrepancy that changes scope.
- **Medium:** storage selection, concurrency/version strategy, money-policy wording, limits not fixed by the source, and incomplete requirement-to-customer traceability.
- **Low:** naming, document organization, or editorial issues that do not change behavior.

For every adopted Set B proposal (including AD-14/15/16/18 and other AD items), record the approving authority and rationale. If not approved, mark it rejected/deferred and ensure it does not remain as normative behavior in other documents.

---

## 10. Consistency and quality gates

Before requesting sign-off, verify all of the following:

- [ ] OC-1 is either resolved with written evidence or remains visibly blocking; no false claim that Swing satisfies CR-10.
- [ ] Any mobile scope discrepancy is resolved or explicitly recorded as out of scope by the proper authority.
- [ ] CR/FR/NFR inventories are complete; no IDs silently disappear.
- [ ] All deferred requirements remain visible and are not represented as MVP functionality.
- [ ] Every NFR is measurable and has a verification method.
- [ ] Every domain rule has one authoritative definition and a clear enforcement owner.
- [ ] Requirements, design, contracts, data model, and UML use consistent terms, types, status names, and operation order.
- [ ] All service and repository contracts specify errors, authorization, side effects, and transaction behavior.
- [ ] Data model constraints support the approved domain rules; no unsupported AI-proposed constraints remain.
- [ ] Derived balances and reports have a defined reconciliation model.
- [ ] Component dependencies respect the constitution's layering and UI isolation.
- [ ] UML includes all six requested diagram categories and all required workflows/states.
- [ ] PlantUML files parse/render successfully; generated images (if committed) correspond to the current source.
- [ ] Links resolve, diagrams are referenced from relevant documents, and no adopted artifact remains only in the experiment directory.
- [ ] No implementation or test success is claimed without actual evidence.
- [ ] Human reviewers, decisions, dates, conditions, and remaining blockers are recorded.

If any gate fails, label the baseline **Draft — Reconciliation Incomplete** and list the blockers.

## 11. Sign-off and handoff

The reconciliation package is ready for human sign-off only when:

1. The requirements owner/customer/instructor has resolved scope and material business-rule questions, or explicitly accepted a conditional baseline with visible blockers.
2. The instructor/team has confirmed constitution compliance and any necessary amendments.
3. A named architecture reviewer has reviewed layering, transactions, persistence, concurrency, security, and deployment constraints.
4. A named domain/requirements reviewer has checked all business rules, CR/FR/NFR traceability, and acceptance criteria.
5. A named UML reviewer has checked diagram syntax and semantic consistency with the prose/contracts/data.
6. All reviewers' decisions and outstanding conditions are recorded.

The handoff should state:
- Which documents constitute the approved baseline and their revision/commit.
- Which decisions were accepted/rejected/deferred.
- Which requirements are unmet or post-MVP.
- Remaining risks and owners.
- Whether Spec Kit task generation is authorized.
- Whether implementation is authorized.

**Do not authorize task generation or implementation while a Critical blocker remains unless the constitution's required written exception/acceptance has been obtained and recorded.**

---

## 12. Recommended reconciliation posture

Use Set A as the starting point for requirements fidelity, traceability, and canonical organization. Incorporate Set B's stronger decomposition, transaction/concurrency detail, and explicit risk analysis selectively. Resolve its proposed business-rule additions before adoption. Keep the comparison report as the historical audit record; this instruction file governs the reconciliation work, not the final product behavior.

The final baseline must be understandable without reading either AI set, while preserving traceability to the authoritative customer and project sources.
