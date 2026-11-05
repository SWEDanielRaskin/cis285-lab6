# Quickstart: SplitSmart Reconciled Baseline

**Status**: Draft — Reconciliation Incomplete. **Date**: 2026-11-05

**There is nothing to build or run.** No `pom.xml`, source, or tests exist. Implementation is not authorized while OC-1 is open ([DEC-01](decisions/decision-log.md#dec-01-platform-oc-1)). The desktop assumption, deployment limits ([DEC-03](decisions/decision-log.md#dec-03-deployment-and-collaboration)), and open risks ([risk register](risks-and-open-questions.md#risk-register)) apply to everything below.

## Reading order

| For | Read |
|---|---|
| What is blocking | [decisions/README.md](decisions/README.md), then [decision-log.md](decisions/decision-log.md) |
| What the product does | [spec.md](spec.md) |
| How it is built | [architecture.md](../../docs/architecture/architecture.md), [design.md](design.md), [data-model.md](data-model.md), [contracts](contracts/README.md) |
| Diagrams | [docs/uml/README.md](../../docs/uml/README.md) |
| Coverage and tests | [requirements-traceability.md](requirements-traceability.md), [validation-plan.md](validation-plan.md) |

## Checks you can run today

Run from the repository root in PowerShell.

**1. Confirm the customer request is unchanged.** Expected: no output.

```powershell
git diff --exit-code 731f81b -- UserRequirement.md
```

**2. Confirm the AI evidence is unchanged.** Expected: no output.

```powershell
git diff --exit-code 731f81b -- docs/ai-comparison/claude-code docs/ai-comparison/review
```

**3. Confirm every requirement ID appears in the traceability matrix.** Expected: no output.

```powershell
$ids = (1..10 | ForEach-Object { 'CR-{0:D2}' -f $_ }) + (1..41 | ForEach-Object { 'FR-{0:D3}' -f $_ }) + (1..9 | ForEach-Object { 'NFR-{0:D3}' -f $_ })
$ids | Where-Object { -not (Select-String -Path specs/001-splitsmart-expense-sharing/requirements-traceability.md -SimpleMatch $_ -Quiet) }
```

**4. Compile the diagrams.** Needs Java and a PlantUML jar. PlantUML 1.2025.2 from Maven Central was used on 2026-11-05. Graphviz is not required, because the diagrams select the built-in layout engine. Expected: exit code 0, with no errors listed.

```powershell
java -jar plantuml.jar -checkonly "docs/uml/*.puml"
```

**5. List what stays open.** Expected: DEC-01 and DEC-02 shown as OPEN.

```powershell
Select-String -Path specs/001-splitsmart-expense-sharing/decisions/decision-log.md -Pattern '\*\*OPEN'
```

## Commands that will not work yet

| Purpose | Command | Available when |
|---|---|---|
| Run tests | `mvn test` | `pom.xml` and Maven exist |
| Full verification | `mvn clean verify` | Same |
| Start the application | Not listed: any command written now would be invented | Implementation adds it here |

## Developer guidance for later

Applies only after approval.

- Write business-rule tests first and see them fail (Principle V). Name tests with the requirement ID.
- Follow the [canonical operation order](decisions/decision-log.md#dec-26-canonical-operation-order).
- Put every balance read through `LedgerReader`, and create every notification through `NotificationDispatcher`.
- No rounding mode outside `Money`. No `float` or `double` for money.
- Change a `.puml` in the same commit as any change to the class or flow it shows (Principle VI).
- Data folder: `${user.home}/.splitsmart`, or set `splitsmart.data.dir`. Back up by copying it while the application is closed. Network and cloud-synced folders are unsupported.
- Tests use a temporary folder through the same property.
