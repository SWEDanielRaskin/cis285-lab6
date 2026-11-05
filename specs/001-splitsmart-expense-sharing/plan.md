# Implementation Plan: SplitSmart Expense Sharing

**Feature ID**: `001-splitsmart-expense-sharing` | **Git branch**: `main` | **Date**: 2026-11-05
**Spec**: [spec.md](spec.md) | **Architecture**: [architecture.md](../../docs/architecture/architecture.md) | **Design**: [design.md](design.md)
**Status**: **Draft — Reconciliation Incomplete. Not approved.** Task generation and implementation are **not authorized**: OC-1 is open and no named human has reviewed this plan.

## Summary

SplitSmart is designed as a layered Java application. Business rules sit in `domain` and `service` with no Swing dependency, balances are computed from Approved expenses and payments, and all money flows through one `Money` value object. Set A supplied the structure and traceability, and Set B supplied the finer decomposition and transaction detail. The [disposition of each proposal](../../docs/architecture/architecture-decisions.md) is recorded.

**This plan does not meet CR-10.** See below.

## OC-1 restated (required by the constitution)

| | |
|---|---|
| **Conflict** | CR-10 asks for a primarily web-based product. ID-03 selects a Java Swing desktop MVP. This is a deviation, not a reinterpretation |
| **Status** | **OPEN / BLOCKING** ([DEC-01](decisions/decision-log.md#dec-01-platform-oc-1)). No written customer or instructor acceptance exists |
| **Plan approval** | Blocked. The constitution requires confirmation "recorded before the first plan is approved" |
| **Effect on delivery** | The MVP cannot be claimed to meet all customer requirements. FR-039 stays Post-MVP |
| **Related** | Mobile wording [DEC-02](decisions/decision-log.md#dec-02-android-and-ios), deployment [DEC-03](decisions/decision-log.md#dec-03-deployment-and-collaboration), risk [RISK-01](risks-and-open-questions.md#risk-register) |

## Technical context

| Item | Value | Basis |
|---|---|---|
| Language | Java 21 | Mandated, ID-01 |
| Build | Apache Maven, one module, explicit versions | Mandated, ID-02; one module proposed (PD-01) |
| UI | Java Swing; GUI work on the EDT; service calls on one background thread | Mandated, ID-03; thread model proposed (PD-02) |
| Testing | JUnit 5 through Surefire; hand-written fakes | Mandated, ID-04; fakes proposed (PD-18) |
| Design docs | PlantUML in `docs/uml/` | Mandated, ID-05, Principle VI |
| Money | `BigDecimal`, scale 2, one `Money` class | Mandated, ID-06; rounding paths DEC-06 |
| Storage | One SQLite file through `org.xerial:sqlite-jdbc` | Proposed, DEC-05 |
| Password hashing | JDK `PBKDF2WithHmacSHA256` | Proposed, PD-11 |
| Logging | `System.Logger` | Proposed, AD-21 |
| Target platform | Desktop JVM. **Not what CR-10 requests** | ID-03, OC-1 |
| Performance goal | NFR-004 under the DEC-28 definition. **Unmeasured** | Spec |
| Scope | 36 MVP FRs and 5 Post-MVP FRs | Spec |

**Toolchain observed on 2026-11-05:** JDK 21 is on PATH; `mvn` is not. PlantUML 1.2025.2 was run from a scratch download to compile all diagrams.

## Constitution check

Self-assessment by the authoring AI. **A named human must confirm it** (Principle VII).

| # | Principle | Result | Evidence or gap |
|---|---|---|---|
| I | Customer requirements are the source of truth | **Pass, with OC-1 and DEC-02 open** | `UserRequirement.md` unchanged; CR, ID, and proposals are labeled; divergence is stated |
| II | Requirement traceability | **Partial** | [Matrix](requirements-traceability.md) covers every CR, FR, and NFR. FR-040 and FR-041 are a documented exception (DEC-22). Task and test links wait for later phases |
| III | OO design with GUI separation | **Pass (design)** | Required packages planned; dependency rules scanned by ARCH-01; constructor injection |
| IV | Exact money with BigDecimal | **Pass (design); reader to confirm** | One `Money` class. A PATCH amendment is proposed (DEC-06), not applied |
| V | Automated testing with JUnit 5 | **Planned only** | [Validation plan](validation-plan.md) defined. **No test exists** |
| VI | Design in PlantUML | **Pass** | 15 diagrams in `docs/uml/` compiled with PlantUML on 2026-11-05 |
| VII | Human review of AI output | **Pending** | No named review of this baseline has occurred, and none is claimed |

**Stack gate:** Java 21, Maven, Swing, JUnit 5, PlantUML, layered separation, and BigDecimal are all addressed. **OC-1 restated:** yes. **Gate decision:** the design is complete as a draft; approval stays blocked.

## Project structure

```text
pom.xml                           # not created
src/main/java/com/splitsmart/     # not created
├── app/          SplitSmartApp, AppConfig
├── domain/       entities, value objects, SplitAllocator, BalanceCalculator, ReportCalculator
├── service/      service interfaces, Default* implementations, commands, views, errors
├── repository/   interfaces, TransactionRunner
│   └── sqlite/   SQLite implementations, schema, migrations
└── ui/           panels, controllers, UiTaskRunner
src/test/java/com/splitsmart/     # not created; mirrors main, plus architecture/
```

## Phasing after approval

These are planning notes. **No task list exists and none is authorized.**

| Order | Work | Depends on |
|---|---|---|
| 0 | Record DEC-01 and DEC-02; confirm PROPOSED decisions; named review | People |
| 1 | `/speckit-tasks`, `/speckit-analyze` | Order 0 |
| 2 | `pom.xml`, ARCH-01 scan, `Money`, `Percentage`, `SplitAllocator` with tests first | Order 1 |
| 3 | Domain entities, `BalanceCalculator`, `ReportCalculator` | Order 2 |
| 4 | Services with fakes | Order 3 |
| 5 | `repository.sqlite`, crash and restart tests | Order 4 |
| 6 | Swing `ui`, manual scripts, benchmark | Order 5 |

## Complexity tracking

| Item | Why needed | Simpler alternative rejected because |
|---|---|---|
| `FLOOR` alongside the constitution's `HALF_EVEN` in `Money` | FR-011 to FR-013 require rounding shares down | HALF_EVEN overshoots: $200.00 ÷ 3 gives $200.01. A PATCH amendment is proposed |
| `app` and `repository.sqlite` beyond the four named packages | Something must wire objects without tying `ui` to SQLite | Principle III says "at least these packages," so this is not a violation; noted for transparency |
| Sealed `SplitRequest` | Compiler-checked split shapes | An enum plus nullable percentages allows invalid combinations |
| Interface plus `Default*` implementation for each service | Principle III asks for interfaces at layer boundaries | Concrete classes would tie `ui` and tests to implementations |

**OC-1 is not listed as a justified deviation.** It is an open conflict that needs a recorded decision.

## Handoff state

| Question | Answer |
|---|---|
| Documents in the baseline | See [artifact inventory](decisions/README.md#artifact-inventory) |
| Task generation authorized? | **No** |
| Implementation authorized? | **No** |
| Requirements unmet or Post-MVP | CR-10 unmet. FR-009, FR-018, FR-025, FR-038, FR-039 are Post-MVP |
| Remaining risks and owners | [risks-and-open-questions.md](risks-and-open-questions.md) |
