# Quickstart and Validation Guide: SplitSmart

**Status**: Draft. AI-generated; not human reviewed (Constitution Principle VII).
**Date**: 2026-11-04 | **Plan**: [plan.md](plan.md)

## Current state: there is nothing to build yet

This guide separates what works today from checks that become possible after implementation.

| Item | Status on 2026-11-04 | Evidence |
|------|----------------------|----------|
| Application source, tests, `pom.xml` | **Do not exist** | Repository listing |
| `java`, `javac`, `mvn`, `plantuml`, `dot` | **Not found on this machine's PATH**; `JAVA_HOME` unset | `Get-Command` |
| PowerShell, git, Spec Kit scripts | Available | Used during planning |
| Diagram syntax | **Not checked** | PlantUML is unavailable |

**No build, test, or application run has been performed. No test has passed, because none exist.**

## Prerequisites for later phases

These are required by the constitution, but installing them is not yet verified on this machine:

- JDK 21 (ID-01)
- Apache Maven (ID-02). The minimum Maven version is to be confirmed when the `pom.xml` is created.
- PlantUML, for diagram checks (ID-05). It needs a Java runtime. Whether syntax checking also needs
  Graphviz is not stated in its documentation.

## Part A: Commands you can run today

Run from the repository root in PowerShell. These were run while preparing this guide.

**1. Confirm the customer request is unchanged** (Principle I). Expected: no output and exit code 0.

```powershell
git diff --exit-code -- UserRequirement.md
```

**2. Confirm Spec Kit finds the feature.** Expected: JSON that includes `FEATURE_DIR`.

```powershell
& .specify/scripts/powershell/check-prerequisites.ps1 -Json -PathsOnly
```

**3. Confirm every requirement ID appears in the plan** (Principle II). Expected: no output.

```powershell
$ids = (1..10 | ForEach-Object { 'CR-{0:D2}' -f $_ }) + (1..41 | ForEach-Object { 'FR-{0:D3}' -f $_ }) + (1..9 | ForEach-Object { 'NFR-{0:D3}' -f $_ })
$ids | Where-Object { -not (Select-String -Path specs/001-splitsmart-expense-sharing/plan.md -SimpleMatch $_ -Quiet) }
```

**4. Confirm the five diagrams exist with matching start and end markers.** This is a basic text check,
**not** a PlantUML syntax check. Expected: five lines, each ending `True True`.

```powershell
Get-ChildItem docs/uml/*.puml | ForEach-Object { "$($_.Name) $((Select-String -Path $_.FullName -Pattern '^@startuml' -Quiet)) $((Select-String -Path $_.FullName -Pattern '^@enduml' -Quiet))" }
```

**5. List open conflicts and open questions in the plan.** Expected: matching lines, including OC-1. They
should disappear only when a human records a decision.

```powershell
Select-String -Path specs/001-splitsmart-expense-sharing/plan.md,specs/001-splitsmart-expense-sharing/research.md -Pattern 'OC-1|NEEDS CLARIFICATION' | Select-Object -First 15
```

## Part B: Commands that will not work yet

These come from the constitution or PlantUML's documentation. **Running them today fails**, because the
tools and project files do not exist.

| Purpose | Command | Source | Available when |
|---------|---------|--------|----------------|
| Run tests | `mvn test` | Principle V | `pom.xml` and JDK 21 and Maven exist |
| Full verification | `mvn clean verify` | ID-02 | Same |
| Check diagram syntax | `java -jar plantuml.jar --check-syntax docs/uml` | [PlantUML docs](https://plantuml.com/command-line) | Java and the PlantUML jar are installed |

**How to start the application is deliberately not listed.** It depends on the `pom.xml`, which does not
exist, and any command written now would be invented. Implementation must add it here.

## Part C: Validation scenarios for after implementation

These are planned checks, not results. **Type**: A = automated JUnit 5 test without Swing, named with the FR
ID (Principle II, NFR-009). M = written manual step, for Swing behavior (Principle V). Setup: users alex,
sam, and jo in one group, unless stated otherwise. `NC-n` marks a result that depends on an open question.

| ID | Scenario | Expected result | Type | FRs |
|----|----------|-----------------|------|-----|
| V-01 | Register alex; register "ALEX"; register with a 7-character password; log in with a wrong password and an unknown user | First succeeds; second and third refused with field messages; both login failures show identical text; no readable password is stored | A | FR-001, FR-002, FR-004 |
| V-02 | Five wrong passwords, then the correct one; advance the test clock 5 minutes; try again. Restart between attempts | Locked even with correct password, including after restart; works after 5 minutes; success resets the count | A | NFR-002 |
| V-03 | Log in as a user outside the group; open any data. Log out | Group data is not returned; after logout no prior user's data is visible | A, M | FR-002, FR-003, NFR-003 |
| V-04 | Create a group; add sam and jo; rename; sam tries to add a member | Creator is admin and member; lists are correct; sam refused | A | FR-005, FR-006, FR-008 |
| V-05 | sam has a non-zero group net; alex removes sam and sam tries to leave. Repeat at $0.00 | Refused with balance shown; allowed at $0.00. History remains. Admin leaving, pairwise, and Pending rules depend on NC-4, NC-5, and NC-6 | A | FR-006, FR-007 |
| V-06 | Create expenses with: $0.00; negative; 3 decimals; $1,000,000.01; future date; empty description; 201-character description; only the creator as participant. Then a payer who is not a participant | Each refused, naming the field, with all errors reported together and other data kept. The non-participant payer is accepted | A, M | FR-010, FR-015 |
| V-07 | Split arithmetic: use all rows in [research R-08](research.md#r-08-split-allocation-algorithm). Then percentages of 50 / 30 / 15 and 3 decimal places | Shares match the table exactly and always total the amount; order is saved and reproducible; bad percentages refused. 0% leftover case per NC-7 | A | FR-011, FR-012, FR-013 |
| V-08 | Attach JPEG and PNG under 5 MB; a 6 MB file; a text file renamed `.png`. Open as another member | Valid files saved and viewable; invalid ones refused with entered data kept | A, M | FR-014 |
| V-09 | Creator edits and deletes a Pending expense. Another user tries. Creator tries on Approved and Rejected | Creator succeeds on Pending only; all others refused; shares recalculated on edit | A | FR-016 |
| V-10 | alex creates an expense with participants alex and sam. Check sam and jo. Approve it, then recheck. Remove jo and create another | sam and jo notified with all fields; alex not; only sam marked "needs your approval"; marker gone when decided; removed jo not notified; unread count and read state work; newest first; alex notified of decision and reason | A, M | FR-017, FR-019, FR-023 |
| V-11 | $90.00 expense by alex with all three: check balances; alex tries to decide; jo approves; sam then tries; a second expense is rejected with no reason, then with one | Balances unchanged while Pending; creator refused; Approved updates balances and records approver and time; sam told it is no longer pending; reason required; Rejected never counts; decisions unchangeable | A | FR-020, FR-021, FR-022, FR-023, FR-024, NFR-006 |
| V-12 | Spec Story 5, then the same pair in two groups, then a dataset of at least 100 expenses and 20 payments against hand-calculated values | sam owes alex $30.00; then $0.00 net; group amounts add up to the overall amount; 100% match to the cent; all owed equals all due | A | FR-026, FR-027, FR-028, FR-029, NFR-001 |
| V-13 | sam owes alex $30.00 and pays $30.00. Attempt $0.00, negative, no group, and a recipient outside the group. Attempt to change a saved payment | Balance is $0.00 immediately with no confirmation; visible to both; invalid attempts refused; no change operation exists | A | FR-030, FR-031, FR-033, NFR-006 |
| V-14 | Pay $40.00 when $30.00 is owed: unconfirmed, then confirmed. Pay $30.00 in a group where $0.00 is owed | Warned first; after confirmation alex owes sam $10.00; other group's balance is unchanged | A, M | FR-032 |
| V-15 | Spec Story 8 data. Reports with each filter and combinations; a reversed date range; filters matching nothing; a status filter of Pending | Inclusive dates; correct lines and totals; reversed range refused; empty result with zero totals; Pending never in totals. With no date or status filter, filtered and current nets match (NC-8, NC-10) | A | FR-034, FR-035, FR-036, FR-037 |
| V-16 | Create one of every record; close normally; reopen. Repeat, ending the process forcibly after a save | All data present, including receipts; a half-finished transaction leaves no partial data | A, M | FR-040, NFR-005 |
| V-17 | View amounts and dates on each screen | Always a currency symbol and 2 decimals; one date format | A, M | FR-041 |
| V-18 | Source scan: forbidden imports and floating-point use, per research R-18 | Fails on any violation of the layer or money rules | A | Principle III, Principle IV |
| V-19 | With 50 users, 50 groups, and 10,000 expenses, time each screen's data and each report on a typical student laptop | Each appears within 2 seconds | A, M | NFR-004 |
| V-20 | Complete each primary task with the keyboard only | All are possible, with visible focus | M | NFR-008 |
| V-21 | Count the steps from Home to each primary task; review error messages | At most 3 steps; messages name the field and how to fix it | M | NFR-007 |
| V-22 | Task timing and test-user study: register and set up a group; enter an expense; split a bill and settle up | Under 3 minutes; under 1 minute; at least 9 of 10 users succeed unaided | M | SC-001, SC-002, SC-009 |

**Not validated in the MVP (Post-MVP):** FR-009, FR-018, FR-025, FR-038, FR-039. **CR-10 is not met by the
MVP (OC-1)**, and no scenario here should be read as showing otherwise.

## Human reviewer's design check

Use this after reading the plan. Complete it yourself; AI tools must not mark it as done.

- [ ] Plan checked against `UserRequirement.md` and the constitution
- [ ] OC-1 and NC-2 confirmed with the instructor or customer, or recorded as still unresolved
- [ ] Working defaults NC-3 through NC-12 accepted or changed
- [ ] Proposed decisions PD-01 through PD-18 accepted or changed, especially storage (PD-06) and password
      hashing (PD-11)
- [ ] Split examples in research R-08 recalculated by hand
- [ ] Diagrams syntax-checked and reviewed once PlantUML is available
- [ ] Reviewer name and date recorded
