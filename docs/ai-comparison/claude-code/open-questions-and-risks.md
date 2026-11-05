# Open Questions and Risks

**Status:** AI-generated draft, not reviewed. Nothing here has been resolved by this document. Proposals (AD) describe what the design does in the absence of an answer, and any of them can be overturned. No customer answer is invented.

Severity is the author's estimate: **Critical** blocks approval, **High** can change behavior or structure, **Medium** needs a decision before the affected work, **Low** can be confirmed in review.

---

## 1. OC-1: web-based request vs. Swing desktop MVP (Critical, open)

| | |
|---|---|
| **Conflict** | CR-10 ("OS supported: primary web-based") vs. ID-03 (Java Swing desktop client) |
| **Status** | **Unresolved.** No written customer or instructor acceptance exists in the repository. |
| **Does the MVP satisfy CR-10?** | **No.** |
| **Design response** | Follows ID-03, as the constitution directs, and states the deviation. Business logic has no GUI dependency (architecture §9). No web deliverable is designed. |
| **Blocks** | The constitution requires confirmation to be "recorded before the first plan is approved." |
| **Practical effect** | Under the spec's "Local use" assumption, people sharing expenses must use one installation. Notifications and approvals only work across people who take turns on one machine. This weakens CR-05 and CR-06 in practice, even if each FR passes. |
| **Needed** | Written decision from customer or instructor. Options: (a) accept desktop for this MVP only; (b) require web, which changes ID-03 through a constitution amendment; (c) accept desktop and require a date for web. |
| **Related** | SRC-01, SRC-06, FR-039, spec Q3 |

---

## 2. Source conflicts and inconsistencies

| ID | Sev. | Sources | Conflict | Design's handling | Needs |
|---|---|---|---|---|---|
| SRC-01 | **High** | `Lab_6_Requirement.docx` vs. `UserRequirement.md`, constitution CR-10, spec CR-10 | The handout's copy of the customer request reads "primary web-based **and also comes with app that can be run on Android and IOS**." The repository file stops at "primary web-based." No CR or FR covers mobile. | Follows `UserRequirement.md` as the authoritative file. Mobile is **not designed and not silently dropped**: it is reported here. The file was not edited. | Instructor: is mobile required? If so, a recorded clarification, a new FR, and a wider OC-1. |
| SRC-02 | **High** | NFR-003, FR-003 vs. spec edge case | "No screen or report MAY show data from a group the user does not belong to," but "a user who is removed from a group keeps their history in that group visible in their reports." | AD-17: former members see only records they were personally part of, read-only. | Customer |
| SRC-03 | Medium | Constitution IV, ID-06 vs. FR-011, FR-013 | The constitution says scale 2 with `HALF_EVEN`; the clarified FRs round shares *down*. | Coexist by operation, with both modes inside `Money` ([design.md §3.2](design.md#32-how-half_even-and-the-floor-rule-coexist-src-03)). `HALF_EVEN` almost never alters a value in the MVP. | Human reviewer to confirm this satisfies Principle IV, or amend the constitution's wording. |
| SRC-04 | **High** | FR-036, FR-037, SC-005, SC-007 vs. FR-035 | Report net must agree with balances for every filter combination (SC-007), but date filters narrow the data. Pending/Rejected must never affect a report total (SC-005), yet reports can be filtered to those statuses. | AD-18: totals count Approved and payments only; other statuses in a memo; net shown as opening + period + later = current. | Customer: is this what "reconcile" means? |
| SRC-05 | Medium | Constitution II, spec gate vs. FR-040, FR-041 | "Every FR cites a CR ID," but the spec's **Data** section cites none. | Matrix says "none cited." The author's inference is that they support CR-01–CR-09 generally, which is not a citation. | Team to amend the spec (not done here). |
| SRC-06 | **High** | Spec Q3 vs. constitution OC-1 | Spec Q3's default says "Treated as an accepted deviation for MVP only." The constitution says it remains an open conflict until accepted in writing, and the spec's inventory says "Not met." | Treats it as **open**. "Accepted" is not used anywhere in this set. | Team to reword Q3 after the OC-1 decision. |
| SRC-07 | Low | CR-06, CR-07 vs. spec | The customer says review happens "before they are added to the system," and that balances reflect "all expenses that have been entered." The spec stores Pending expenses, and balances exclude them. | Follows the spec; the interpretation seems sound, since CR-06 explains the intent. | Reviewer confirm. |
| SRC-08 | Low | FR-030 vs. edge case | FR-030 sets no maximum for payments; the edge case on "very large amounts" sets 1,000,000.00 without saying which amounts. | Cap applied to both. | Reviewer confirm. |
| SRC-09 | Low | NFR-007 vs. Actors, Story 1 | NFR-007 says "register" is reachable from the home view, but a visitor can only register or log in, and Home follows login. | Register is measured from Login. | Team to reword. |
| SRC-10 | Low | Principle VI vs. this exercise's prompt | Constitution puts `.puml` under `docs/uml/` or the feature directory; the prompt requires `docs/ai-comparison/claude-code/uml/`. | Followed the prompt, since the experiment requires isolation. | Move on adoption. |
| SRC-11 | Low | Principle II vs. this exercise's prompt | Every FR must trace to a task and test, but tasks and tests are forbidden here. | FR→validation scenario only. | Complete in a later phase. |
| SRC-12 | Low | Spec inventory vs. FR list | Post-MVP items "password reset, profile editing" and "group invitations" have no FR. | Listed in the CR table, not designed. | Team to add FRs when scheduled. |
| SRC-13 | Low | Spec checklist vs. this review | The checklist marks requirements "testable and unambiguous" with no clarification markers left. The items in §3 of this document show real gaps. | Reported. The checklist was not edited. | Reviewer to reassess. |
| SRC-14 | **High** | Prompt pack protocol vs. this run | The protocol calls for separate clean worktrees or branches, while this prompt said not to change branches. Both sets ended up uncommitted in the same `main` checkout: while this set was being written, untracked `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, and `contracts/` appeared in the feature directory, along with `docs/uml/`. | This author saw those path names through `git status` and did not open them. **This author cannot say whether the Spec Kit run could see or read this folder.** | Experimenter: assess whether the experiment's independence held, and preserve both raw sets. |

---

## 3. Design questions: `NEEDS CLARIFICATION`

| ID | Sev. | Question | Why it matters | Current proposal (not an answer) | Who |
|---|---|---|---|---|---|
| DQ-01 | Medium | May a 0% participant receive a leftover cent? | FR-012 and FR-013 taken literally: $1.00 at 0/33.33/33.33/33.34 charges the 0% person $0.01. | Literal FR-012 (AD-05) | Customer |
| DQ-02 | **High** | Does FR-007's "net balance" mean the member's aggregate across the group, or each pairwise balance? | Aggregate allows exit with live debts that can then never be settled, since FR-030 requires current membership. | Every pair must be zero (AD-15). Stricter than the literal text. | Customer |
| DQ-03 | **High** | Can someone leave or be removed while involved in a Pending expense? | Unaddressed. Allowing it can strand an expense with no approver, or create a debt for someone who cannot pay it. | Refused (AD-15). New refusal not in the spec. | Customer |
| DQ-04 | **High** | What happens when the admin leaves? Last member leaves? | FR-006 says any member may leave; Actors says exactly one admin. | Earliest-joined member succeeds; empty group retained (AD-16). Invented behavior. | Customer |
| DQ-05 | Medium | Does "total paid" in FR-036 mean settlement payments, or also expenses the user fronted? Is a creator who is neither payer nor participant "involved"? | Changes report figures. | Payments only (A-04). Creator counts as involved (A-09). | Customer |
| DQ-06 | Medium | Should editing a Pending expense re-notify? Should deleting one notify? | Spec covers creation only. An approver could act on outdated information. | Refresh snapshots and reset participants to unread; no delete notice (AD-14). | Customer |
| DQ-07 | Low | Can a recipient record a payment they received, on the payer's behalf? | FR-030 says "they made." A cash recipient may be the one who remembers. | Payer only. | Customer |
| DQ-08 | **High** | How are mistakes corrected? A wrong payment or wrongly approved expense cannot be changed (FR-016, FR-024, NFR-006), and no reversal exists. | Permanent wrong balances. Only a workaround exists: a counter-payment by the other party, or an offsetting expense. | No reversal feature. Gap reported, not filled. | Customer |
| DQ-09 | Low | Can former members view receipts of expenses they were in? | FR-014 says "any group member," and "member" means current. | No. | Customer |
| DQ-10 | Low | Can a participant with a 0% or $0.00 share approve? | FR-021 says "any participant." They have no stake in the cost. | Yes, literally. | Customer |
| DQ-11 | Low | Does the report date filter use expense date or approval date? | Changes which period an item falls in. | Expense or payment date. | Customer |
| DQ-12 | Low | Username character set? Display name length? Do leading and trailing spaces count toward limits? | Unspecified. | Any characters; display name 1–50; trim before checking (A-10). | Reviewer |
| DQ-13 | Low | Which date format? FR-041 requires one but does not name it. | User-visible. | `yyyy-MM-dd`, matching the spec's examples. | Reviewer |
| DQ-14 | Medium | Does "one shared installation" mean one OS account, or several on the same computer? | Default data directory is per OS account, so several accounts would see separate data. | Per-user default with an override property (AD-07). | Instructor |

### Spec open questions still unanswered

These have defaults in the spec, marked there as "default if unanswered." **They are not resolved by this design.**

| ID | Question | Spec's default, as used here |
|---|---|---|
| Q3 | Will the customer accept a desktop MVP? | See OC-1 and SRC-06; treated as **open** here |
| Q4 | Which other report parameters? | Group, other user, expense status |
| Q5 | Can rejected expenses be resubmitted? | No; create a new one |
| Q6 | Can a former member rejoin with history? | Yes (new membership row) |
| Q7 | Should notifications cover approvals, rejections, and payments? | New expenses and decisions on the creator's own expenses. So a **payment recipient is not notified,** although payments apply without their confirmation. |

---

## 4. Assumptions

These are the author's, unless noted. Each could be wrong.

| ID | Assumption | Affects |
|---|---|---|
| A-01 | US dollars, single currency (spec assumption) | FR-041 |
| A-02 | One shared installation; no sync (spec assumption) | AD-07, AD-24 |
| A-03 | "Typical student laptop" is not defined by the spec. Benchmark on the team's slowest machine. | NFR-004 |
| A-04 | "Total paid" and "total received" mean settlement payments | FR-036 |
| A-05 | With an other-user filter, both people must be involved in the same expense | FR-035 |
| A-06 | The expense status filter does not hide payments | FR-035 |
| A-07 | 5 MB = 5,242,880 bytes | FR-014 |
| A-08 | "Today" means the computer's local date | FR-010, FR-030 |
| A-09 | "Involving the user" includes the creator | FR-034, Scenario 8.2 |
| A-10 | Text limits apply after trimming; blank-only input is empty | FR-001, FR-005, FR-010 |

---

## 5. Technical risks

| ID | Sev. | Risk | Consequence | Mitigation | Status |
|---|---|---|---|---|---|
| R-01 | **High** | OC-1 is resolved in favor of web after build begins | UI rewritten; storage replaced; concurrency revisited | Layer separation limits the loss to `ui` and `repository.jdbc`. Get the decision first. | Open |
| R-02 | **High** | Local data file is readable and editable by anyone with file access | Privacy controls and immutability can be bypassed outside the app; NFR-003 and NFR-006 hold only through the application | State the limit plainly. Rely on OS file permissions. No credible key storage exists for a shared desktop. | Accepted risk **requires human decision** |
| R-03 | Medium | H2 does not guarantee committed data survives power loss | Recent data could be lost. NFR-005 names application exit, so this may be outside its scope. | `WRITE_DELAY=0`; crash test (V-21); consider backup guidance | Open |
| R-04 | Medium | H2 behaviors assumed here are unverified: generated-column uniqueness, BLOB behavior, FK actions, durability settings | Mapping changes | Short spike before implementation | Open |
| R-05 | **High** | NFR-004 is unmeasured; derived balances and PBKDF2 are the likely hot spots | 2-second target missed | Benchmark V-23 with seeded data; if needed, add a rebuildable cache under a new AD and retest | Open |
| R-06 | Medium | Receipt BLOBs grow the database: 10,000 × 5 MB is about 50 GB at worst | Slow backups, disk pressure | Separate table; swap behind `ReceiptRepository` if needed | Open |
| R-07 | **High** | Java, Maven, and PlantUML were not found on the authoring machine on 2026-11-04 | Nothing here has been compiled, run, or rendered; diagram syntax is unverified | Reviewer installs the toolchain and renders diagrams | Open |
| R-08 | Medium | AI-authored design may contain errors that read as confident | Wrong rule goes unnoticed | Principle VII review; the cross-tool comparison | Open |
| R-09 | Low | Registration and lockout messages reveal that a username exists | Enumeration on a shared install | Required by Scenarios 1.2, 1.6; low value in this setting | Accepted by spec wording; needs reviewer confirmation |
| R-10 | Low | Changing the system clock shortens lockout or changes "today" | Lockout bypass by someone with OS control | Same trust limit as R-02 | Open |
| R-11 | Medium | Ledger rule exists in Java and again in a SQL query | The two could drift, breaking NFR-001 | Test that compares them (V-16) | Open |
| R-12 | Medium | Exit guard, succession, and report semantics go beyond the literal spec | The customer may reject them; a reviewer may see them as invented | Flagged with † in the AD register, each tied to a question | Open |
| R-13 | Low | Swing threading errors | Frozen UI or inconsistent painting | All service calls through `UiTaskRunner` | Open |
| R-14 | Low | Long-running `SwingWorker` result arrives after logout | Prior user's data could render | `UiTaskRunner` drops results when the session has changed. Test manually. | Open |
| R-15 | Low | A file with a valid signature can still be malformed, or be a decompression bomb | Failed display or high memory | Check declared dimensions before decoding; handle decode failure in `ReceiptViewerDialog` | Open |

---

## 6. Decisions needing customer or instructor input

Ordered by how much they could change the design.

| # | Decision | Refs | Who |
|---|---|---|---|
| 1 | Accept or reject the Swing desktop MVP in writing | OC-1, SRC-06, Q3 | Customer or instructor |
| 2 | Are Android and iOS apps part of the requirement? | SRC-01 | Instructor |
| 3 | How are mistaken payments or approvals corrected? | DQ-08 | Customer |
| 4 | Exit rules: pairwise or aggregate; pending involvement; admin succession | DQ-02, DQ-03, DQ-04 | Customer |
| 5 | Former-member visibility | SRC-02, DQ-09 | Customer |
| 6 | Report semantics | SRC-04, DQ-05, DQ-11 | Customer |
| 7 | 0% participants: cents and approval rights | DQ-01, DQ-10 | Customer |
| 8 | Notifications on edit, delete, and payment | DQ-06, Q7 | Customer |
| 9 | Remaining spec defaults | Q4, Q5, Q6 | Customer |
| 10 | Whether the `HALF_EVEN` reading meets Principle IV | SRC-03 | Team (human reviewer) |
