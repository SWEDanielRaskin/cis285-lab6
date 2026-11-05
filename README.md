# SplitSmart Expense Sharing

CIS 285, Labs 6 and 7.

SplitSmart lets friends, roommates, family members, or coworkers share expenses. Users have accounts, form groups, enter expenses split equally or by percentage, and review them before they affect balances. The software also covers notifications, balance tracking, payment recording, and reports.

This repository holds requirements and architecture and design documents. It contains no application code or tests.

> **Status: draft, pending the OC-1 platform decision.** The customer asked for a primarily web-based product (CR-10), while the project constitution selects a Java Swing desktop MVP (ID-03). No written acceptance of that difference exists, so the baseline is conditional and CR-10 is not satisfied. Task generation and implementation are not authorized. The remaining blockers are listed in the [reconciliation status](specs/001-splitsmart-expense-sharing/decisions/README.md).

## Process

1. **Requirements with Spec Kit.** The customer request in `UserRequirement.md` became a constitution and a clarified feature specification.
2. **Two alternative architectures.** [Spec Kit](docs/ai-comparison/spec-kit/) (Set A) and [Claude Code](docs/ai-comparison/claude-code/) (Set B) each produced an architecture and design set from the [same prompt pack](docs/prompts/architecture-design-comparison-prompts.md). The sets are kept as evidence. They cannot be claimed as independently generated unless the experiment is re-run in separate clean worktrees ([DEC-31](specs/001-splitsmart-expense-sharing/decisions/decision-log.md#dec-31-experiment-isolation-and-completion-reports)).
3. **ChatGPT comparison report.** ChatGPT audited both sets against the requirements. It approved neither and recommended using Set A as the base while selectively adding Set B's technical detail.
4. **Reconciliation instructions.** These turned the report's findings into rules for producing one baseline.
5. **Consolidated baseline.** Following those instructions, Claude Code merged the sets into the documents below and recorded each conflict in the decision log. No named human has reviewed the baseline yet, and no decision has been accepted by its owner.

## Key files

| File | Contents |
|---|---|
| [UserRequirement.md](UserRequirement.md) | Original customer request |
| [Specification](specs/001-splitsmart-expense-sharing/spec.md) | Final requirements, scenarios, and business rules |
| [Plan](specs/001-splitsmart-expense-sharing/plan.md) | Implementation plan and constitution check |
| [Architecture](docs/architecture/architecture.md) | Layers, deployment, persistence, security, and quality attributes |
| [Design](specs/001-splitsmart-expense-sharing/design.md) | Detailed design |
| [Data model](specs/001-splitsmart-expense-sharing/data-model.md) | Entities, rules, and storage |
| [Traceability](specs/001-splitsmart-expense-sharing/requirements-traceability.md) | Requirements traced through the design and validation |
| [Validation plan](specs/001-splitsmart-expense-sharing/validation-plan.md) | How each requirement will be verified |
| [Decision log](specs/001-splitsmart-expense-sharing/decisions/decision-log.md) | Conflicts, resolutions, and open items, including OC-1 as DEC-01 |
| [UML index](docs/uml/README.md) | All PlantUML diagrams, by category |
| [Comparison report](docs/ai-comparison/review/architecture-design-comparison-report.md) | ChatGPT's audit of Set A and Set B |
| [Reconciliation instructions](docs/ai-comparison/review/reconciliation-instructions.md) | Rules used to produce the baseline |
