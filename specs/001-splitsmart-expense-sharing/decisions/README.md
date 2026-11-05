# SplitSmart Reconciliation Status

**Baseline label: Draft — Reconciliation Incomplete.** This is a reconciled proposal for human approval, built from `main` at commit `731f81b`. It does not approve either AI set, amend the constitution, or authorize tasks or implementation.

## Blockers

| # | Blocker | What clears it |
|---|---|---|
| 1 | **OC-1: CR-10 asks for web; the MVP is desktop.** No written acceptance exists ([DEC-01](decision-log.md#dec-01-platform-oc-1)) | A written customer or instructor decision, recorded in DEC-01 |
| 2 | **Mobile wording conflict** between `UserRequirement.md` and the lab handout ([DEC-02](decision-log.md#dec-02-android-and-ios)) | The instructor's answer, recorded in DEC-02 |
| 3 | **No named human review** of this baseline (Principle VII) | Reviewers sign below |
| 4 | **PROPOSED decisions are unconfirmed** by their owners | [Owner confirmation record](decision-log.md#owner-confirmation-record) |

## Handoff state

| Question | Answer |
|---|---|
| Task generation authorized? | **No** |
| Implementation authorized? | **No** |
| Requirements unmet | CR-10 |
| Post-MVP | FR-009, FR-018, FR-025, FR-038, FR-039 |
| Decisions accepted | None yet |
| Decisions rejected | AD-07, AD-14 in part, AD-22, PD-13, PD-16 ([details](../../../docs/architecture/architecture-decisions.md)) |
| Decisions deferred | DEC-31, DEC-32 |
| Remaining risks and owners | [risks-and-open-questions.md](../risks-and-open-questions.md) |

## Quality gate results

Results as of 2026-11-05, assessed by the authoring AI, except where a command result is stated.

| Gate | Result | Evidence |
|---|---|---|
| OC-1 resolved or visibly blocking; no claim that Swing satisfies CR-10 | **Pass (visibly blocking)** | Stated in spec, plan, architecture, quickstart, risks, UML |
| Mobile discrepancy resolved or recorded | **Not resolved; recorded** | DEC-02 |
| CR, FR, NFR inventories complete; no ID lost | Pass | Scripted ID check on the spec and matrix |
| Deferred requirements visible and not shown as MVP | Pass | Spec, matrix, UML legend |
| Every NFR measurable with a verification method | Pass on paper; **none verified** | Spec NFR table |
| Each domain rule has one definition and an enforcement owner | Pass | Spec business rules; design §3 |
| Consistent terms, types, statuses, and operation order | Pass by scripted name check and reading; needs reviewer confirmation | Service class and contract comparison |
| Contracts state errors, authorization, side effects, transactions | Pass | Contracts |
| No unsupported AI-proposed constraints remain | **Fail by definition** | Team-added limits and all PROPOSED decisions lack owner acceptance |
| Derived balances and reports have a reconciliation model | Pass (design) | Data model §4; DEC-14 |
| Component dependencies respect layering | Pass (design) | `component.puml`; ARCH-01 planned |
| All six UML categories and required workflows and states | Pass | [UML index](../../../docs/uml/README.md) |
| PlantUML parses and renders | **Pass (run)** | PlantUML 1.2025.2 `-checkonly` exit 0 on all 15 files; rendered and inspected. No images committed |
| Links resolve; adopted artifacts are outside the experiment folder | Pass | Scripted relative-link check |
| No implementation or test success claimed | Pass | No code or tests exist |
| Human reviewers, decisions, dates, and blockers recorded | **Fail** | Sign-off record is empty |

## Artifact inventory

| Source or artifact | Authority | Owner | Status | Disposition |
|---|---|---|---|---|
| `UserRequirement.md` | Highest; read-only | Customer | Unchanged | Adopt unchanged |
| `.specify/memory/constitution.md` | Project rules | Team | Unchanged; PATCH proposed (DEC-06) | Adopt unchanged |
| `Lab_6_Requirement.docx` | Assignment; conflict source | Instructor | Unchanged | Retain as a pending question (DEC-02) |
| Set A `spec.md` | Clarified requirements | Daniel Raskin | Copied to `docs/ai-comparison/spec-kit/` | Adopt with edits; replacement [spec.md](../spec.md) |
| Set A `plan.md` | Proposal | AI | Copied | Supersede: [plan.md](../plan.md), because decisions are now resolved and the architecture has moved out |
| Set A `research.md` | Proposal | AI | Copied | Incorporate selected content: [research.md](../research.md), architecture decisions |
| Set A `data-model.md` | Proposal | AI | Copied | Adopt with edits: [data-model.md](../data-model.md) |
| Set A `contracts/` | Proposal | AI | Copied | Incorporate selected content: [contracts](../contracts/README.md), merged with Set B |
| Set A `quickstart.md` | Proposal | AI | Copied | Split: [quickstart.md](../quickstart.md), [validation-plan.md](../validation-plan.md) |
| Set A `checklists/requirements.md` | Historical | Spec Kit | Note added at top; copied | Retain as history |
| Set A `docs/uml/domain-class.puml` | Proposal | AI | Copied | Supersede: new `domain-class.puml`; optional notification link fixed; service classes moved out |
| Set A `docs/uml/layer-component.puml` | Proposal | AI | Copied | Supersede: `component.puml` |
| Set A three sequence diagrams | Proposal | AI | Copied | Supersede: same file names; authorization moved inside the transaction |
| Set B `architecture.md` | Proposal | AI | Unchanged | Incorporate selected content: [architecture.md](../../../docs/architecture/architecture.md) |
| Set B `design.md` | Proposal | AI | Unchanged | Incorporate selected content: [design.md](../design.md) |
| Set B `data-model.md` | Proposal | AI | Unchanged | Incorporate selected content: indexes, derived model |
| Set B `contracts/` | Proposal | AI | Unchanged | Incorporate selected content: operation names and shapes |
| Set B `open-questions-and-risks.md` | Proposal | AI | Unchanged | Incorporate selected content: decision log, risks |
| Set B `quickstart.md` | Proposal | AI | Unchanged | Incorporate selected content: validation scenarios |
| Set B six `.puml` files | Proposal | AI | Unchanged | Incorporate selected content: class and flow detail |
| Set B AD-07, AD-22; Set A PD-13, PD-16 | Proposal | AI | Unchanged | Reject, with reasons |
| `docs/ai-comparison/review/architecture-design-comparison-report.md` | Audit | Reviewer | Unchanged | Adopt unchanged as history |
| `docs/ai-comparison/review/reconciliation-instructions.md` | Process | Team | Unchanged | Adopt unchanged; governs this work |

Comparison-report corrections are addressed as follows: Set A's notification UML (domain-class), authorization sequencing (DEC-26), Set B's validation order (DEC-26), the concurrency mismatch (DEC-04), and UML location (`docs/uml/`). Completion reports for the AI sets are not added (DEC-31).

## Structure notes

Two items differ from the target tree in the instructions:

- `docs/ai-comparison/spec-kit/` is added to keep Set A visible as evidence (DEC-30).
- `docs/uml/README.md` is added because the instructions require a diagram index.

## Sign-off record

Complete by hand. AI tools must not fill this in, and approval cannot be inferred from a commit or from silence.

| Role | Checks | Name | Date | Decision and conditions |
|---|---|---|---|---|
| Requirements owner, customer, or instructor | Scope and material business rules, or accepts a conditional baseline | | | |
| Instructor or team | Constitution compliance and amendments | | | |
| Architecture reviewer | Layering, transactions, persistence, concurrency, security, deployment | | | |
| Domain and requirements reviewer | Business rules, traceability, acceptance criteria | | | |
| UML reviewer | Syntax and consistency with prose, contracts, and data | | | |

**Approved baseline commit:** ____________ **Task generation authorized:** ____ **Implementation authorized:** ____
