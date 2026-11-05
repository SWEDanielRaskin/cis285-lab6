# SplitSmart Decision Log

**Baseline status:** Draft — Reconciliation Incomplete. See [README.md](README.md#quality-gate-results) for gate results.
**Decisions recorded on:** 2026-11-05

This log is the single register of reconciliation decisions. Every other baseline document cites `DEC-nn` and does not restate the rationale.

## How to read a decision

| Status | Meaning in this baseline |
|---|---|
| **OPEN** | Needs evidence that only the named owner can supply. The baseline carries a labeled working assumption and must not be called final. |
| **PROPOSED** | Resolved for this baseline and normative in all downstream documents, so the design has one behavior. It still needs confirmation from the named owner. |
| **ACCEPTED** | Confirmed by the named owner, with evidence. **No decision has this status yet.** |
| **REJECTED** | Considered and removed from normative design. |
| **DEFERRED** | Moved out of this baseline by a recorded reason. |

**Decision authority used here.** Daniel Raskin instructed on 2026-11-05: "For any conflicts you run into, make the proper decision to resolve it." Under that instruction Claude (AI) selected each resolution below. That delegation resolves ambiguity so that the documents agree. It is not customer acceptance, and it is not Principle VII review, because the constitution bars AI tools from approving their own work. A decision moves to ACCEPTED only when the owner records a name and date in the confirmation table at the end of this log.

## Summary

| ID | Topic | Severity | Status | Confirmation owner |
|---|---|---|---|---|
| DEC-01 | Platform: web request vs. Swing MVP (OC-1) | **Critical** | **OPEN / BLOCKING** | Customer or instructor, in writing |
| DEC-02 | Android and iOS wording in the lab handout | High | **OPEN** | Instructor |
| DEC-03 | Deployment and collaboration model | High | PROPOSED | Customer or instructor |
| DEC-04 | Runtime concurrency meaning | Medium | PROPOSED | Team |
| DEC-05 | Storage engine: SQLite | Medium | PROPOSED | Team |
| DEC-06 | Money rounding policy | Medium | PROPOSED | Team (constitution PATCH) |
| DEC-07 | Former-member visibility | High | PROPOSED | Customer |
| DEC-08 | Group exit: every pairwise balance must be zero | High | PROPOSED | Customer |
| DEC-09 | Group exit: no Pending-expense involvement | High | PROPOSED | Customer |
| DEC-10 | Admin departure and last member | High | PROPOSED | Customer |
| DEC-11 | Rejoining a group | Medium | PROPOSED | Customer |
| DEC-12 | Report "total paid" and "total received" | High | PROPOSED | Customer |
| DEC-13 | Report status filter and memo | High | PROPOSED | Customer |
| DEC-14 | Report date semantics and reconciliation | High | PROPOSED | Customer |
| DEC-15 | Report parameters and "involving the user" | Medium | PROPOSED | Customer |
| DEC-16 | Notifications on edit, delete, and membership change | Medium | PROPOSED | Customer |
| DEC-17 | Notification event scope | Medium | PROPOSED | Customer |
| DEC-18 | 0% participants and leftover cents | Medium | PROPOSED | Customer |
| DEC-19 | Correcting mistakes | Medium | PROPOSED | Customer |
| DEC-20 | Payment amount cap and who records | Medium | PROPOSED | Customer |
| DEC-21 | Registration navigation | Medium | PROPOSED | Customer |
| DEC-22 | FR-040 and FR-041 traceability | Medium | PROPOSED | Team |
| DEC-23 | Lockout details and account-existence exposure | Low | PROPOSED | Security reviewer |
| DEC-24 | Text limits, formats, and direct member add | Low | PROPOSED | Team |
| DEC-25 | Receipt validation and viewing | Medium | PROPOSED | Technical reviewer |
| DEC-26 | Canonical operation order | Medium | PROPOSED | Architecture reviewer |
| DEC-27 | Overpayment confirmation | Medium | PROPOSED | Architecture reviewer |
| DEC-28 | Measurement definitions for NFRs | Medium | PROPOSED | Team |
| DEC-29 | Data at rest and shared-computer privacy | High | PROPOSED | Customer or instructor |
| DEC-30 | Preserving Set A while reusing its paths | Low | PROPOSED | Team |
| DEC-31 | Experiment isolation and completion reports | High for the experiment; none for product behavior | DEFERRED | Experiment owner |
| DEC-32 | Post-MVP features that have no FR | Low | DEFERRED | Team |
| DEC-33 | "Added to the system" and "all expenses entered" | Low | PROPOSED | Customer |

---

## Critical and open decisions

### DEC-01: Platform (OC-1)

| | |
|---|---|
| **Conflict** | `UserRequirement.md`: "OS supported: primary web-based" (CR-10). Constitution ID-03: "Java Swing desktop client." Constitution OC-1 and its Sync Impact Report: customer or instructor confirmation "MUST be recorded before the first plan is approved." Former spec Q3: "Treated as an accepted deviation for MVP only, pending written confirmation." |
| **Impact** | A Swing application is not a web application. Roommates on separate computers cannot collaborate (see DEC-03). A GUI-free service layer does not change this. |
| **Options** | (a) Accept desktop for this MVP only, with CR-10 recorded as unmet. (b) Require web now, which requires a constitution amendment and a redesign of `ui`, persistence, and sessions. (c) Accept desktop with a stated date for web delivery. |
| **Evidence found** | The lab handout's constitution prompt names Java Swing and its specify prompt says to "label the Java Swing MVP subset separately." This suggests the stack is instructor-directed, but it does not accept the deviation from CR-10. **No written acceptance exists.** |
| **Recommendation** | Option (a) or (c). The handout evidence points that way, and either one keeps the implementation decision the constitution already holds. |
| **Status** | **OPEN / BLOCKING.** Acceptance cannot be supplied by delegation. |
| **Baseline handling** | This is a conditional draft built on the assumption of option (a). CR-10 is **not satisfied**. FR-039 stays Post-MVP. The baseline must not be called approved, final, ready for task generation, or implementation-ready. Former Q3 wording is replaced so it no longer says "accepted." |
| **If the decision is (b)** | Stop. Amend ID-03 first, then rework `ui`, DEC-03, DEC-04, DEC-05, and the session design. `domain` is expected to carry over; `service` needs a request-scoped session review. |
| **Record to complete** | Who decided: ______ Date: ______ Exact scope: ______ Conditions: ______ Deadline for web delivery, if any: ______ Evidence link: ______ |

### DEC-02: Android and iOS

| | |
|---|---|
| **Conflict** | `UserRequirement.md` ends "OS supported: primary web-based." `Lab_6_Requirement.docx`, under "UserRequirement.md content as following," ends "primary web-based and also comes with app that can be run on Android and IOS." Both were confirmed by reading the files on 2026-11-05. |
| **Impact** | If the handout's wording is the customer's, CR-10 is wider and OC-1 is larger. The repository file may be a truncated copy of what the handout told students to add. |
| **Decision** | Constitution Principle I and Governance make `UserRequirement.md` authoritative and read-only, so it was not changed. **No mobile requirement, use case, or design element exists in this baseline.** |
| **Status** | **OPEN.** The instructor must confirm which text is correct. Non-blocking for the design of a desktop MVP, but blocking for any claim that platform scope is settled. |
| **Proposed constitution entry** | If mobile is confirmed, add `OC-2 (CR-10 vs. ID-03: mobile)`. Constitution not edited: new conflicts follow its amendment process. |

---

## Deployment, runtime, and technology

### DEC-03: Deployment and collaboration

- **Conflict:** Spec assumption "Local use" (one shared installation) vs. CR-05, CR-06, and CR-07, which assume people interact. R-06 in the comparison report; Set A RK-4; Set B AD-24 and DQ-14.
- **Options:** (1) one shared computer and data folder; (2) shared network file; (3) local server.
- **Decision:** Option 1. One data folder on one computer, one running application process, and one signed-in user at a time. People take turns and see each other's activity at next login. The data folder defaults to `${user.home}/.splitsmart`. Setting `splitsmart.data.dir` lets several OS accounts on the same computer share a folder they can all write. Network shares and cloud-synced folders are **unsupported** because SQLite warns against multi-computer writers over network file systems. A second launch shows a clear message and exits.
- **Consequence:** The product works for a household sharing a computer. It does **not** work for roommates on separate computers. Every FR can pass while the customer's practical need is unmet, which is the real cost of OC-1.
- **Rejected:** Option 2 risks corruption. Option 3 adds scope without satisfying CR-10.

### DEC-04: Runtime concurrency

- **Conflict:** Set B AD-24 (single session) vs. its V-14 (two users racing), and the spec edge case "two users act on the same pending expense." Comparison report R-11.
- **Decision:** Real simultaneous users are **not a supported runtime scenario** in this deployment. Expense-state safety is still enforced at the data layer with `expectedVersion`, conditional updates, and a unique decision per expense, for three reasons: it defends against stale screens, against a defect that bypasses the instance lock, and against a future multi-client deployment. The two-actor test is a **service-level simulation** using two `Session` objects and is labeled as such. It is not evidence of multi-user support.

### DEC-05: Storage engine

- **Conflict:** Set A: SQLite. Set B: H2. The constitution names neither.
- **Decision:** **SQLite** through `org.xerial:sqlite-jdbc`, with `journal_mode=DELETE`, `synchronous=FULL`, `foreign_keys=ON`, `locking_mode=EXCLUSIVE`, and `STRICT` tables.
- **Rationale:**
  - NFR-005 needs durable commits. SQLite documents atomic commit through process and OS crashes. Set B itself records that H2's documentation does not guarantee this.
  - SQLite has partial unique indexes, which express "one active membership" directly. Set B records that H2 needs a generated-column workaround that it had not tested.
  - Exclusive locking gives the single-instance rule of DEC-03 directly.
- **Costs accepted:** A native library inside the driver, and money stored as integer cents with conversion at the repository boundary. Principle IV permits `BigDecimal` built from integers.
- **Rejected:** H2 (reasons above), JSON files (no atomic multi-record commit), server databases (installation burden). `repository.sqlite` is replaceable behind interfaces if DEC-01 resolves toward web.
- **Unverified:** No benchmark or crash test has run. Validation cases PERF-01 and RP-03 cover this.

### DEC-06: Money rounding

- **Conflict:** Constitution Principle IV and ID-06: "scale 2 using `RoundingMode.HALF_EVEN`." FR-011 and FR-013: "rounded down to the cent." Applying HALF_EVEN to shares would overshoot: $200.00 ÷ 3 gives 66.67 × 3 = $200.01.
- **Decision:** All rounding lives in `Money`, with paths chosen by operation:

| Operation | Rule | Authority |
|---|---|---|
| Parsing entered text | No rounding. More than 2 decimals is refused | FR-010, FR-030 |
| Sums and differences of scale-2 values | Exact | NFR-001 |
| Computing a split share | `RoundingMode.FLOOR`, then the FR-012 leftover pass | FR-011 to FR-013 |
| Normalizing any other value to scale 2 | `RoundingMode.HALF_EVEN` | Principle IV, ID-06 |

- **Stated plainly:** No MVP calculation reaches the HALF_EVEN path. It exists so that any future non-allocation calculation follows the constitution. `FLOOR` is chosen over Set B's `DOWN` because it says what the requirement says. Inputs are non-negative, so both give the same result.
- **Proposed PATCH amendment, not applied:** add to Principle IV "Split allocation rounds each share down to the cent, then applies the documented leftover-cent rule. `HALF_EVEN` applies to other normalization." This needs human approval and a Sync Impact Report.

---

## Membership and privacy

### DEC-07: Former-member visibility

- **Conflict:** NFR-003 "No screen or report MAY show data from a group the user does not belong to." Spec edge case: "A user who is removed from a group keeps their history in that group visible in their reports." Comparison report R-04; Set A NC-3; Set B AD-17.
- **Decision:** A former member keeps **read-only access to records they were personally part of**, and nothing else from that group. Personally part of means creator, payer, or participant of the expense, or payer or recipient of the payment. Full table: [spec.md, Former-member visibility](../spec.md#former-member-visibility). Receipts are excluded (FR-014 says "group member," and the spec defines that as current).
- **Wording change:** FR-003 and NFR-003 gain an explicit exception. Original and revised text are in the [spec change history](../spec.md#change-history).

### DEC-08: Exit requires every pairwise balance at zero

- **Conflict:** FR-007 "net balance within that group is not $0.00." If Ann owes Bob $10 and Cara owes Ann $10, Ann's net is $0.00. If Ann then leaves, both debts remain, and FR-030 stops them being paid because both parties must be current members. This contradicts CR-07 and CR-08. Report R-03; Set A NC-6; Set B AD-15.
- **Decision:** Removal or leaving is refused unless **every pairwise balance between the member and anyone else in that group is $0.00**. This implies the original net-zero test and is stricter, so no original refusal is lost. FR-007 keeps its ID, with revised wording in the change history.
- **Resulting invariant (INV-EXIT-1):** A former member's pair balances in that group stay $0.00 until they rejoin, because no new ledger entry can involve them.

### DEC-09: Exit is refused while involved in a Pending expense

- **Conflict:** FR-007 ignores Pending amounts. If a leaver's Pending expense is later approved, they gain a debt they cannot pay under FR-030. If every eligible approver leaves, no one can decide the expense. Report R-03; Set A NC-4; Set B AD-15.
- **Decision:** Exit is also refused while the member is creator, payer, or participant of a Pending expense in that group.
- **No deadlock:** The creator can edit or delete. A non-creator participant can decide. A payer who is not a participant can ask either one to act.
- **Resulting invariant (INV-EXIT-2):** Everyone referenced by a Pending expense is an active member, so a Pending expense always has an eligible approver.

### DEC-10: Admin departure and last member

- **Conflict:** FR-006 "any member MAY leave" vs. Actors "exactly one admin." Report R-17; Set A NC-5 (refuse while others remain); Set B AD-16 (automatic succession).
- **Decision:** Adopt succession. When the admin leaves under the normal guard, the **earliest-joined remaining active member** becomes admin, with ties broken by user ID. Admins use `leaveGroup` for themselves, and `removeMember` on oneself is refused. The last member may leave. The group then has no active members, stays stored for former members' history, and appears in no active list. No operation can reactivate it.
- **Why not refuse:** With no transfer feature, refusing would trap an admin permanently and contradict FR-006. Succession satisfies both statements with no new screen. An explicit transfer feature would be new scope.
- **Limit:** No notification tells the new admin. The Group Detail screen shows who the admin is. DEC-17 keeps notification events to the stated set.

### DEC-11: Rejoining

- **Source:** Spec Q6 default.
- **Decision:** An admin can re-add a former member. This creates a **new Membership row**, and old rows stay as history. While active again, the person sees the group as any active member does, including records from the time they were away.

---

## Reports

### DEC-12: Total paid and total received

- **Conflict:** FR-036 could mean settlement payments only, or could also include expenses fronted. Report checklist; Set A NC-10; Set B DQ-05.
- **Decision:** **Settlement payments only.** `totalPaidByUser` sums matching payments where the user is payer. `totalReceivedByUser` sums those where the user is recipient. Expense money is shown in `totalExpenseAmount` and `userShareTotal`, so nothing is counted twice.

### DEC-13: Status filter and memo

- **Conflict:** FR-035 lets users select Pending and Rejected. SC-005 forbids them in totals. Set A NC-8; Set B SRC-04.
- **Decision:** The status filter selects **expense lines only**. Payments have no status and are not hidden by it. Money totals and net balances count Approved expenses and payments only. A `statusMemo` shows count and amount per status among matching expenses, labeled "Not included in totals." If the filter excludes Approved, expense totals are $0.00 and the memo still explains the lines shown.

### DEC-14: Date semantics and reconciliation

- **Conflict:** FR-037 and SC-007 require agreement with balances under every filter combination, but a date-filtered subset cannot equal a current balance. Report R-05; Set B AD-18.
- **Decision:** Adopt AD-18. Each counterparty gets a line that always reconciles:

```text
opening (before from) + period (from..to) + later (after to) = current
```

- All four ignore the status filter, count Approved expenses and payments only, and honor the group and other-user filters.
- `current` equals `BalanceService` for the same group scope, to the cent. This is the precise meaning of FR-037 and SC-007.
- Dates are the **expense date** and **payment date**, not the entry or approval time (DQ-11). With no `from`, `opening` is $0.00. With no `to`, `later` is $0.00.
- Reports are computed from present data, not stored as snapshots. Approving or backdating an item can change the figures of an earlier period when the report is run again. Reports must say "as of" their generation time.

### DEC-15: Report parameters and involvement

- **Source:** Spec Q4; Set B A-05, A-06, A-09.
- **Decision:** Parameters are date range, group, other user, and status. An expense involves the user when they are creator, payer, or participant. With an other-user filter, that person must also be creator, payer, or participant of the same expense. Payments must be between the two people.

---

## Notifications

### DEC-16: Edit, delete, and membership change

- **Conflict:** FR-017 covers creation only. Set A NC-9 (minimal). Set B AD-14 (snapshot refresh, reset everyone to unread).
- **Decision:**
  - **Edit:** No general re-notification. A person who **becomes a participant through the edit** gets their existing EXPENSE_CREATED row reset to unread, or a new row if they have none, so they learn of the approval duty. Other rows stay as created.
  - **Stale text is safe:** A decision requires opening the live detail, and `expectedVersion` refuses an outdated one.
  - **Delete:** No new notification. Rows stay, their expense link is cleared, the flag becomes false, and the UI labels them "(expense deleted)."
  - **Membership change:** Former members receive nothing new. Their existing rows follow DEC-07: visible only if the linked expense still exists and they were personally part of it. Rows are hidden, not deleted, and return on rejoin.
- **Rejected from AD-14:** Snapshot refresh and reset-to-unread for all participants. Both add mutable state with little benefit.
- **Adopted from AD-14:** "Needs your approval" is derived at read time and never stored.

### DEC-17: Event scope

- **Source:** Spec Q7 default.
- **Decision:** Notify on expense creation (FR-017) and decisions on one's own expense (FR-023). **Payments do not notify** in the MVP. A recipient sees a payment in history (FR-033). This matters because payments apply without confirmation; the gap is recorded as RISK-11.

---

## Splits, corrections, and payments

### DEC-18: 0% participants

- **Conflict:** FR-012 sends leftover cents in listed order with no exception, and FR-013 allows 0%. $1.00 at 0 / 33.33 / 33.33 / 33.34 charges the 0% person $0.01. Set A NC-7; Set B DQ-01.
- **Decision:** **Apply FR-012 literally.** The rule is a recorded 2026-10-29 clarification, and an exception would change it without the customer. A 0% participant remains a participant and may approve (DQ-10). A $0.00 share creates no ledger entry.
- **Mitigation:** Users can list that person last, or leave them out. The worked example appears in the validation plan so that the customer sees it when confirming.

### DEC-19: Correcting mistakes

- **Conflict:** FR-016, FR-024, and NFR-006 make decided expenses and payments unchangeable, yet people make mistakes. Report R-09; Set A RK-5; Set B DQ-08.
- **Decision:** No reversal feature in the MVP. A mistake is corrected by a **compensating payment**, recorded by the other party with an explanatory note. The overpayment warning applies. Rejected expenses are not resubmitted (Q5); the creator enters a new one. Originals are never altered.
- **Limit:** An incorrect *payment* cannot be undone by the person who recorded it, since FR-030 only lets people record payments they made. The other party has to cooperate. See RISK-12.

### DEC-20: Payment cap and who records

- **Conflict:** FR-030 has no maximum, while the general edge case caps amounts at 1,000,000.00. Report R-14; Set A NC-11; Set B SRC-08, DQ-07.
- **Decision:** The cap applies to payments too. Only the payer records a payment. FR-030 wording is revised to state the cap.

### DEC-27: Overpayment confirmation

- **Conflict:** Set A retries with a boolean confirmation. Set B binds confirmation to the amount shown (AD-13).
- **Decision:** Adopt AD-13. `recordPayment` returns `OverpaymentWarning(owedNow, attempted)` and writes nothing when the amount exceeds what is owed. The user's confirmation resubmits with `acknowledgedOwed = owedNow`. If the amount owed changed in between, a fresh warning is returned. A warning is a return value, not an exception, because it is a question for the user. `overpaymentConfirmed` is stored for audit.

### DEC-33: "Added to the system" and "all expenses entered"

- **Conflict:** CR-06 says review happens "before they are added to the system." CR-07 says balances reflect "all expenses that have been entered." The spec stores Pending expenses, and balances exclude them. Set B SRC-07.
- **Decision:** Follow the spec. "Added" means added to balances, as CR-06's own wording continues ("and used to adjust balances"). Balances reflect all **Approved** expenses.

---

## Usability, security, and measurement

### DEC-21: Registration navigation

- **Conflict:** NFR-007 lists "register" as reachable from Home, but a visitor has no Home view. Report R-13; Set B SRC-09.
- **Decision:** Register is measured from the Login screen, one step. All other tasks are measured from Home. A step is one activation of a menu item, button, or list row that changes the view or commits an action. Entering field data is not a step.

### DEC-22: FR-040 and FR-041 traceability

- **Conflict:** The constitution's spec gate says every FR cites a CR. FR-040 and FR-041 cite none. Report R-12; Set A NC-12; Set B SRC-05.
- **Decision:** Classify both as **derived system requirements**. No CR is invented. FR-040 supports CR-01 to CR-09, whose tracking and reporting are impossible without retained data, labeled as an inference. FR-041 supports NFR-007 and CR-03, CR-08, CR-09 presentation, also labeled as an inference.
- **Needs:** Human acceptance of this documented exception to the spec gate.

### DEC-23: Lockout details and account-existence exposure

- **Source:** NFR-002; Story 1 scenario 6; report R-16; Set A PD-12, RK-6, RK-7; Set B R-09.
- **Decision:**
  - "Consecutive" counts failures per account across sessions and restarts. Only a success or a lock expiry clears the count.
  - The fifth failure sets `lockedUntil = now + 5 minutes`. Locked means `now < lockedUntil`, so the account is usable at exactly +5:00.
  - An attempt during a lock is refused before any password check and neither counts nor extends the lock.
  - State is persisted so that a restart cannot clear it. Time comes from an injected `Clock`.
  - The "temporarily locked" and "username is taken" messages reveal that an account exists. The spec requires both, so this exposure is **accepted as a documented trade-off**. Wrong-password and unknown-username messages are identical, and an unknown username still runs one hash to limit timing differences.
  - Anyone who knows a username can lock that account for 5 minutes. Recorded as RISK-13.

### DEC-24: Text limits, formats, and direct member add

- **Source:** Set A PD-17, NC-11; Set B DQ-12, DQ-13, A-08, A-10.
- **Decision:**
  - Text limits apply after trimming, and blank-only input counts as empty. Passwords are not trimmed. "Characters" means Unicode code points.
  - Usernames accept any characters within 3–30. Their uniqueness key is lowercase in `Locale.ROOT`.
  - Display name is 1–50 characters. This limit is **team-added**, since FR-001 sets none.
  - Dates are entered and shown as `yyyy-MM-dd`, strictly parsed. Amounts are shown as `$1,234.50`. "Today" is the computer's local date. Balance direction is shown in words, so no negative amounts appear.
  - The admin adds a registered member directly by exact username, without consent. Invitations are Post-MVP.

### DEC-25: Receipt validation and viewing

- **Source:** FR-014; report R-10; Set B R-15, AD-08, A-07, DQ-09; Set A PD-10.
- **Decision:**
  - 5 MB means 5,242,880 bytes. Empty files are refused.
  - `service` checks size and the JPEG or PNG leading signature and trailing marker. It does not import AWT or `javax.imageio`.
  - A signature does not prove a safe image, so `ReceiptViewerDialog` in `ui` checks declared dimensions against a 50-megapixel limit (team-added), then decodes on a background thread, and reports a corrupt file as a message.
  - Bytes live in a separate table, committed with the expense. Only active members can view (DEC-07). `sha256` and original file name from the AI sets are dropped because no requirement needs them.

### DEC-26: Canonical operation order

- **Conflict:** Set B's contract says authorization precedes validation, while its diagrams validate first. Set A authorizes before opening the transaction, so a check can go stale. Report §6.4 and §7.
- **Decision:** Every mutating service operation follows one order:

| Step | Name | What happens | Failure |
|---|---|---|---|
| 1 | PREPARE | Check `Session`. Parse stateless fields, collecting `FieldError`s without throwing. Read receipt bytes, hash a password. No transaction is open for slow work | Session invalid: `AccessDeniedException` |
| 2 | BEGIN | Open the transaction | `PersistenceFailureException` |
| 3 | AUTHORIZE | Check membership, admin, or eligibility against this transaction's data | `NotFoundException` if the record is not visible; `AccessDeniedException` if visible but not permitted |
| 4 | VALIDATE | Add state-dependent `FieldError`s, such as payer not an active member. Throw if any error exists | `ValidationException`, all fields together |
| 5 | GUARD | Check business state and version | `ConflictException`, `BusinessRuleException`, or an `OverpaymentWarning` return |
| 6 | EFFECT | Change domain objects, write, and create notifications | `PersistenceFailureException` |
| 7 | COMMIT | Commit, or roll back on any exception | |

Authorizing before reporting validation means a person outside a group learns nothing from field errors. FR-015's "all fields together" still holds because stateless errors are collected in step 1 and reported in step 4. `login` is the one exception, with its own contract, because its failure state must commit before the exception is raised.

### DEC-28: Measurement definitions

- **Source:** Reconciliation instructions §5.2; NFR-004; Set B A-03.
- **Decision:** The spec's "typical student laptop" and "data set" become measurable. Reference machine: 4 CPU cores, 8 GB RAM, SSD, Windows 11, JDK 21 default heap. Dataset: 50 users, 50 groups, 10,000 expenses as the spec states, plus team-added assumptions of an average 3 shares per expense, 2,000 payments (the 5:1 ratio from SC-003), 10,000 notifications, and 500 receipts at 1 MB. Pass: 95th percentile of 20 warm runs is at most 2.0 seconds per screen and report. These are team-added test parameters. **They have not been measured.**

### DEC-29: Data at rest and shared-computer privacy

- **Source:** Set A RK-3; Set B R-02, R-10.
- **Decision:** The database is not encrypted, and there is no idle logout. Privacy and audit rules hold **through the application only**. Anyone with file access can read or alter data, and anyone at an unattended signed-in screen acts as that user. Rely on OS file permissions and logging out. The instructor or customer must accept this; no credible key storage exists on a shared desktop.

---

## Documentation and process

### DEC-30: Preserving Set A while reusing its paths

- **Conflict:** The instructions say "Do not overwrite Set A," and they also place the final `spec.md`, `plan.md`, contracts, and `docs/uml/*.puml` at Set A's paths.
- **Decision:** Copy Set A byte-for-byte to `docs/ai-comparison/spec-kit/` before writing the baseline, so the evidence stays visible beside Set B, and write the baseline at the target paths. Commit `731f81b` on `main` also holds the originals. `docs/uml/layer-component.puml` is replaced by `component.puml`.

### DEC-31: Experiment isolation and completion reports

- **Source:** Report R-02, R-15; Set B SRC-14.
- **Decision:** Deferred to the experiment owner. No product behavior depends on it. Neither AI set was edited to add a completion report. The two sets cannot be claimed as independently generated unless the experiment is re-run in separate clean worktrees.

### DEC-32: Post-MVP features that have no FR

- **Source:** Set B SRC-12; spec inventory.
- **Decision:** Password reset, profile editing, and group invitations stay in the inventory as Post-MVP with no FR. FRs are added when they are scheduled.

---

## ID migration

No CR, FR, NFR, or SC ID was split, merged, or retired, and none was added. Open-item IDs from the sources map as follows.

| Source ID | Now tracked as |
|---|---|
| OC-1, spec Q3, Set B SRC-06, report R-01 | DEC-01 |
| Set A NC-2, Set B SRC-01 | DEC-02 |
| Report R-06, Set A RK-4, Set B DQ-14, A-02 | DEC-03 |
| Report R-11, Set B AD-24 | DEC-03, DEC-04 |
| Report R-08, Set A PD-06, Set B AD-07, R-03, R-04 | DEC-05, RISK-07 |
| Report R-07, Set B SRC-03, AD-04 | DEC-06 |
| Report R-04, Set A NC-3, Set B SRC-02, AD-17, DQ-09 | DEC-07 |
| Report R-03, Set A NC-4, NC-6, Set B AD-15, DQ-02, DQ-03 | DEC-08, DEC-09 |
| Report R-17, Set A NC-5, Set B AD-16, DQ-04 | DEC-10 |
| Spec Q6 | DEC-11 |
| Report R-05, Set A NC-8, NC-10, Set B SRC-04, AD-18, DQ-05, DQ-11 | DEC-12, DEC-13, DEC-14 |
| Spec Q4, Set B A-04, A-05, A-06, A-09 | DEC-12, DEC-13, DEC-15 |
| Report R-18, Set A NC-9, Set B AD-14, DQ-06 | DEC-16 |
| Spec Q7 | DEC-17 |
| Set A NC-7, Set B AD-05, DQ-01, DQ-10 | DEC-18 |
| Report R-09, Set A RK-5, Set B DQ-08, spec Q5 | DEC-19 |
| Report R-14, Set A NC-11, Set B SRC-08, DQ-07 | DEC-20, DEC-24 |
| Report R-13, Set B SRC-09 | DEC-21 |
| Report R-12, Set A NC-12, Set B SRC-05 | DEC-22 |
| Report R-16, Set A RK-6, RK-7, PD-12, Set B R-09, AD-12 | DEC-23 |
| Set A PD-17, Set B DQ-12, DQ-13, A-01, A-08, A-10 | DEC-24 |
| Report R-10, Set B R-15, A-07, AD-08, Set A PD-10 | DEC-25 |
| Report §6.4 and §7 ordering findings | DEC-26 |
| Set B AD-13 | DEC-27 |
| Set B A-03, R-05, Set A RK-2 | DEC-28, RISK-06 |
| Set A RK-3, Set B R-02, R-10 | DEC-29 |
| Set B SRC-10 | DEC-30 |
| Report R-02, R-15, Set B SRC-14 | DEC-31 |
| Set B SRC-11, SRC-12 | DEC-32; task links wait for task generation |
| Set B SRC-13 | Note added to `checklists/requirements.md` |
| Set B SRC-07 | DEC-33 |
| All AD-nn and PD-nn | [architecture-decisions.md](../../../docs/architecture/architecture-decisions.md) |

## Owner confirmation record

Complete by hand. AI tools must not fill this in.

| Decision(s) | Owner | Name | Date | Accept / change | Conditions or evidence |
|---|---|---|---|---|---|
| DEC-01 | Customer or instructor | | | | |
| DEC-02 | Instructor | | | | |
| DEC-03, DEC-29 | Customer or instructor | | | | |
| DEC-07 to DEC-21, DEC-33 | Customer or instructor | | | | |
| DEC-04, DEC-05, DEC-06, DEC-22, DEC-24, DEC-28, DEC-30 | Team | | | | |
| DEC-23, DEC-25, DEC-26, DEC-27 | Named technical reviewer | | | | |
