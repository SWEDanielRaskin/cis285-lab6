# SplitSmart UML Index

**Status:** Draft — Reconciliation Incomplete. Not human reviewed (Principle VII). These diagrams are conditional on [DEC-01](../../specs/001-splitsmart-expense-sharing/decisions/decision-log.md#dec-01-platform-oc-1): they show a desktop MVP, which does **not** satisfy CR-10.

**Compile check:** All 15 files compiled with PlantUML 1.2025.2 on 2026-11-05 and were rendered and inspected by eye. That shows valid syntax and readable layout. It is not named review, and no code exists to compare them with. `-checkonly` alone is not enough: during this work a layout-engine crash passed it and showed only when rendering, so render as well after editing. No generated images are committed. Class, component, use-case, and state diagrams use `!pragma layout smetana`, so Graphviz is not needed.

```powershell
java -jar plantuml.jar -checkonly "docs/uml/*.puml"
```

| Category | Diagram | Purpose and scope | Linked requirements |
|---|---|---|---|
| Use case | [use-case.puml](use-case.puml) | System boundary, actors, and MVP use cases UC-01 to UC-13. Deferred items are listed in the legend, not drawn | CR-01 to CR-09, FR-001 to FR-037 |
| Component | [component.puml](component.puml) | Layers, interfaces, dependency direction, database, local-installation limit | Principle III, NFR-009, FR-040, DEC-03, DEC-05 |
| Class | [domain-class.puml](domain-class.puml) | Value objects and enums, persisted entities, and derived types, with attributes, operations, multiplicities, and constraints | FR-001 to FR-037, NFR-001, NFR-006 |
| Class | [service-class.puml](service-class.puml) | Service interfaces and implementations, collaborators, commands, errors, and repository operations. Names match the contracts | All MVP FRs, FR-015, NFR-003, NFR-009 |
| Sequence | [expense-approval-sequence.puml](expense-approval-sequence.puml) | Create, edit, delete, approve, and reject, with invalid-field, unauthorized, stale-version, and conflict paths | FR-010 to FR-017, FR-020 to FR-024 |
| Sequence | [payment-settlement-sequence.puml](payment-settlement-sequence.puml) | Recording, overpayment warning, confirm and cancel, history | FR-027, FR-030 to FR-033 |
| Sequence | [notification-sequence.puml](notification-sequence.puml) | Creation, write failure, edit, decision, retrieval, read marking | FR-017, FR-019, FR-023, DEC-16 |
| Sequence | [authentication-lockout-sequence.puml](authentication-lockout-sequence.puml) | Login outcomes, commit-before-raise on failure, logout | FR-002, FR-004, NFR-002 |
| State | [expense-state.puml](expense-state.puml) | Pending, Approved, Rejected, and creator deletion | FR-016, FR-020 to FR-024 |
| State | [membership-state.puml](membership-state.puml) | Active and Ended, exit guard, rejoin, admin succession | FR-005 to FR-007, DEC-08 to DEC-11 |
| State | [authentication-state.puml](authentication-state.puml) | Unlocked and Locked, boundary at +5:00 | NFR-002, DEC-23 |
| Activity | [create-expense-activity.puml](create-expense-activity.puml) | Expense entry through notification, with error paths | FR-010 to FR-015, FR-017, FR-020 |
| Activity | [approve-or-reject-expense-activity.puml](approve-or-reject-expense-activity.puml) | Eligibility, reason, exactly-once decision, ledger effect | FR-021 to FR-024, FR-026 |
| Activity | [record-payment-activity.puml](record-payment-activity.puml) | Validation, overpayment confirmation, immediate application, history | FR-030 to FR-033 |
| Activity | [generate-report-activity.puml](generate-report-activity.puml) | Filters, visibility, totals, memo, reconciliation | FR-034 to FR-037, DEC-12 to DEC-15 |

## Diagrams deliberately not provided

| Diagram | Why not |
|---|---|
| Payment state machine | A payment takes effect when saved and never changes (FR-031, NFR-006). Confirmation is a question to the user before a record exists, so a state diagram would invent states the data cannot represent. See the payment sequence and activity diagrams |
| Separate expense-creation sequence | Creation is the first section of `expense-approval-sequence.puml`, which keeps one authoritative operation order |
| Notification state machine | Unread and Read are one nullable field. `notification-sequence.puml` shows the transitions |
| Web, mobile, or deployment diagrams | Not part of this MVP. See DEC-01 and DEC-02 |

## Reading conventions

`FR-nnn`, `BR-nn`, and `DEC-nn` link diagram elements to the [spec](../../specs/001-splitsmart-expense-sharing/spec.md) and [decision log](../../specs/001-splitsmart-expense-sharing/decisions/decision-log.md). Mutating flows follow [the canonical operation order](../../specs/001-splitsmart-expense-sharing/decisions/decision-log.md#dec-26-canonical-operation-order). A changed class name or flow must update these files in the same change (Principle VI).

The original AI diagrams are preserved in `docs/ai-comparison/spec-kit/uml/` and `docs/ai-comparison/claude-code/uml/`. Files in those folders are evidence, not design.
