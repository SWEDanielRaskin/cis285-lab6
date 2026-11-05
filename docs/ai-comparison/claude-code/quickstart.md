# Reviewer Quickstart

**Status:** AI-generated draft, not reviewed. Requires named human review (Principle VII).

**This repository has no application to build or run.** It has no `pom.xml`, source code, or tests. This page separates what you can run today from checks that only become possible after implementation.

---

## 1. Verified prerequisites

Checked on the authoring machine (Windows 11) on 2026-11-04.

| Tool | Result | Needed for |
|---|---|---|
| Git | 2.55.0 installed | Inspecting this set |
| PowerShell 5.1 | Available | Commands in §2 |
| Java (JDK 21 required by ID-01) | **Not found** on PATH; `JAVA_HOME` unset | Future build |
| Apache Maven (ID-02) | **Not found** on PATH; `MAVEN_HOME` unset | Future build |
| PlantUML (ID-05) | **Not found**. It also needs Java. | Rendering diagrams |

Because of this, **the diagrams in `uml/` have not been rendered and their syntax has not been machine-checked.** Nothing has been compiled or executed.

---

## 2. Commands you can run today

Run from the repository root in PowerShell. Each was run on the authoring machine after these files were written; the expected results below are what it printed.

**2.1 Confirm no authoritative input changed**

```powershell
git status --short -- UserRequirement.md .specify specs/001-splitsmart-expense-sharing/spec.md specs/001-splitsmart-expense-sharing/checklists
```

Expected: no output.

**2.2 Confirm this folder is present and uncommitted**

```powershell
git status --short -- docs/ai-comparison
```

Expected: one line, `?? docs/ai-comparison/`.

A full `git status --short` may list other untracked paths. On the authoring machine it also listed `docs/uml/` and Spec Kit-named files in the feature directory. This work did not create or open them (SRC-14).

**2.3 List this document set**

```powershell
Get-ChildItem docs/ai-comparison/claude-code -Recurse -File | ForEach-Object { $_.FullName.Substring((Get-Location).Path.Length + 1) }
```

Expected: 15 files. The five documents `architecture.md`, `data-model.md`, `design.md`, `open-questions-and-risks.md`, `quickstart.md`, four files in `contracts\`, and six `.puml` files in `uml\`.

**2.4 Check every FR appears in the traceability matrix**

```powershell
1..41 | ForEach-Object { $id = 'FR-{0:D3}' -f $_; if (-not (Select-String -Path docs/ai-comparison/claude-code/design.md -Pattern "^\| $id " -Quiet)) { "MISSING $id" } }
```

Expected: no output.

**2.5 Check every CR and NFR appears**

```powershell
(1..10 | ForEach-Object { 'CR-{0:D2}' -f $_ }) + (1..9 | ForEach-Object { 'NFR-{0:D3}' -f $_ }) | ForEach-Object { if (-not (Select-String -Path docs/ai-comparison/claude-code/design.md -Pattern $_ -Quiet)) { "MISSING $_" } }
```

Expected: no output.

**2.6 Check each PlantUML file has matching start and end tags**

```powershell
Get-ChildItem docs/ai-comparison/claude-code/uml/*.puml | ForEach-Object { '{0}: start={1} end={2}' -f $_.Name, (Select-String -Path $_.FullName -Pattern '^@startuml').Count, (Select-String -Path $_.FullName -Pattern '^@enduml').Count }
```

Expected: six lines, each with `start=1 end=1`. This is only a text check, not a syntax check.

**2.7 Confirm no build or source files were created**

```powershell
Test-Path pom.xml, src
```

Expected: `False`, `False`.

**2.8 Confirm OC-1 is stated in the main documents**

```powershell
Select-String -Path docs/ai-comparison/claude-code/architecture.md, docs/ai-comparison/claude-code/design.md, docs/ai-comparison/claude-code/open-questions-and-risks.md -Pattern 'OC-1' -List | ForEach-Object { $_.Filename }
```

Expected: all three file names.

---

## 3. What a reviewer should check by reading

These need human judgment and can't be scripted.

| # | Check | Where |
|---|---|---|
| 1 | OC-1 is stated honestly: Swing does not satisfy CR-10 | [architecture.md §1](architecture.md#1-oc-1-read-this-first) |
| 2 | Raise the Android and iOS difference with the instructor | [open-questions-and-risks.md](open-questions-and-risks.md), SRC-01 |
| 3 | Work the split examples by hand | [design.md §3.3](design.md#33-splitallocator-algorithm-ad-05) |
| 4 | Decide if the `HALF_EVEN` reading meets Principle IV | [design.md §3.2](design.md#32-how-half_even-and-the-floor-rule-coexist-src-03) |
| 5 | Decide each † AD: was anything invented that should not have been? | [architecture.md §12](architecture.md#12-ad-decision-register) |
| 6 | Compare each FR with its matrix row | [design.md §11.2](design.md#112-functional-requirements) |
| 7 | Read diagrams against written design, after rendering them | [uml/](uml/) |
| 8 | Record reviewer name and date before accepting anything | Principle VII |

---

## 4. Future implementation checks (cannot run today)

**None of these commands can run now.** They need a JDK, Maven, and a `pom.xml` that does not exist yet. They come from the constitution, not from anything in the repository.

| Command | Purpose | Source |
|---|---|---|
| `mvn test` | Run JUnit 5 tests | Principle V |
| `mvn clean verify` | Must pass from a clean checkout | ID-02, Implementation gate |
| PlantUML render of `uml/*.puml` (exact command depends on install) | Confirm diagrams compile | ID-05 |

---

## 5. Proposed validation scenarios

**Status: proposals only.** No tests exist, and none are created by this exercise. "Auto" = planned JUnit 5 without UI (NFR-009). "Manual" = written manual step (Principle V). Test names should begin with the FR ID (Principle II). Where a scenario depends on a † decision, the expected result may change with the answer.

| V | FRs | Type | Given → When | Expected result |
|---|---|---|---|---|
| V-01 | FR-001, FR-004 | Auto | Register "alex"; then "ALEX"; then a 7-character password; inspect stored record | First succeeds; second refused as taken; third states the 8-character minimum; stored form has no plaintext |
| V-02 | FR-002, NFR-002 | Auto with fake `Clock` | Wrong password 5 times; correct password at +4:59; correct at +5:00; separately, 4 wrong, 1 right, 4 wrong | Same message for wrong user or password; locked at +4:59 with correct password; success at +5:00; counter reset by success, so no lock in the last sequence. Lock survives a service restart. |
| V-03 | FR-003, NFR-003 | Auto | Two groups with different members; call each read operation as an outsider | Access refused or no data, identically for an existing and a nonexistent group |
| V-04 | FR-005, FR-006, FR-008 | Auto | Create; add member; non-admin tries add/remove; rename | Creator is admin and only member; member sees group; non-admin refused; rename by admin only |
| V-05 | FR-006, FR-007 | Auto | (a) Non-zero balance; (b) aggregate zero with non-zero pairs †; (c) in a Pending expense †; (d) admin leaves † | (a) Refused, showing the amount. (b)(c) Refused (AD-15). (d) Earliest-joined member becomes admin (AD-16) |
| V-06 | FR-011, FR-012, FR-013, NFR-001 | Auto | Every row in [design.md §3.3](design.md#33-splitallocator-algorithm-ad-05), plus randomized amounts and participant counts | Exact shares as listed; Σ shares = amount always (SC-004); same inputs give same output |
| V-07 | FR-010, FR-013, FR-015, NFR-007 | Auto + Manual | Amount 0, negative, `1.234`, `1000000.01`; future date; today; 201-character description; 50/30/15; duplicate participant; creator as only participant | Each refused naming its field; all errors reported at once; today accepted; 1,000,000.00 accepted; form keeps data (Manual) |
| V-08 | FR-014, FR-015 | Auto + Manual | PNG, JPEG, GIF, a PDF renamed `.png`, 5,242,880 bytes, 5,242,881 bytes; view as member, as non-member | Valid saved; invalid refused with other data intact; viewable by members only; image displays (Manual) |
| V-09 | FR-016 | Auto | Creator edits or deletes Pending; non-creator attempts; creator attempts on Approved and Rejected; stale version | Creator succeeds on Pending; all others refused |
| V-10 | FR-017 | Auto | Members alex, sam, jo; alex creates with participants alex and sam; removed member exists | sam flagged "needs your approval"; jo not flagged; alex none; removed member none; content has creator, group, description, amount, date; flag clears after decision |
| V-11 | FR-019 | Auto + Manual | Notifications while logged out; log in; mark read | Correct unread count at login; newest first; count falls after marking; visible in UI (Manual) |
| V-12 | FR-020, SC-005 | Auto | Create Pending; read balances; approve; read; separately reject; read | No effect while Pending; effect after approval; never after rejection |
| V-13 | FR-021, FR-022, FR-023 | Auto | Creator tries; non-participant member tries; payer-only non-participant tries; participant approves; another rejects with empty reason, then with reason | First three refused; approval decides; empty reason refused; creator notified including reason |
| V-14 | FR-024, NFR-006 | Auto | Two sessions and two threads decide at once; try to change a decision; inspect repository interfaces | Exactly one decision exists; the other gets "no longer pending"; no update or delete operation exists on decisions or payments; approver and time recorded |
| V-15 | FR-026, FR-027, FR-028, NFR-001 | Auto + Manual | Scenarios 5.1–5.3; payer not a participant; payer is a participant; two shared groups | $30.00 values as in spec; net $0.00; payer's own share no debt; group lines add up to overall; direction clear (Manual) |
| V-16 | FR-029, FR-026, SC-003 | Auto | Reference set of at least 100 expenses and 20 payments | Σ owed = Σ due; every pair matches hand-calculated values; `Expense.ledgerEntries` agrees with the query results (R-11) |
| V-17 | FR-030, FR-031, FR-033 | Auto | Scenario 6.1; zero, negative, no group, self, non-member, future date | Balance 0.00 immediately; visible to both; invalid inputs refused |
| V-18 | FR-032 | Auto + Manual | Pay exact owed; pay 40 on 30; pay in a group with no debt; owed changes between warning and confirm | No warning; warning then alex owes sam 10.00; warning and other group unchanged; fresh warning; dialog works by keyboard (Manual) |
| V-19 | FR-034, FR-035 | Auto | Scenario 8.1; each filter alone and combined; `to` before `from`; no match; boundary dates | Only 2026-02-15 returned; inclusive at both ends; refused with a message; empty with zero totals |
| V-20 | FR-036, FR-037, SC-005, SC-007 | Auto † | All filter combinations on the reference set | Totals match hand calculation; Pending and Rejected in memo only; opening + period + later = current; current = `BalanceService` to the cent |
| V-21 | FR-040, NFR-005 | Auto + Manual | Save all record types, restart; force-terminate the process right after a save | All present, including receipts; no partial expense without its shares and notifications |
| V-22 | FR-041 | Auto + Manual | Format and parse values; inspect all screens | One date format; always `$` and two decimals |
| V-23 | NFR-004 | Benchmark | Seed 50 users, 50 groups, 10,000 expenses; open each screen and report on a typical student laptop | Each appears within 2 seconds. **Unmeasured.** |
| V-24 | NFR-007, NFR-008 | Manual | Complete each primary task using only the keyboard; count steps from Home | All complete without a mouse; at most 3 steps; errors name the field and fix |
| V-25 | NFR-009, Principle III, IV | Build gate | Architecture rules (AD-22); run business-rule tests headless | No `javax.swing`, `java.awt`, or `javax.imageio` outside `ui`; no `float` or `double` money; rule tests need no display |

**Security negative checks for V-02 and V-21:** logs and the database must not contain the password in readable form. Also search logs for known descriptions and notes (AD-21).
