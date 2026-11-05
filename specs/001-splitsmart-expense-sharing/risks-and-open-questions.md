# Risks and Open Questions

**Status**: Draft — Reconciliation Incomplete. **Date**: 2026-11-05. Decisions and their rationale are in the [decision log](decisions/decision-log.md). Every unresolved item from the comparison report is carried in the [ID migration table](decisions/decision-log.md#id-migration) until an authorized owner resolves it.

## Open questions

| ID | Priority | Question | Working assumption | Owner | Blocks |
|---|---|---|---|---|---|
| DEC-01 / OC-1 | **Critical** | Will the customer or instructor accept a desktop MVP in writing, or require web? | Conditional draft assuming a desktop MVP. CR-10 **not satisfied** | Customer or instructor | Plan approval, task generation, implementation |
| DEC-02 | **High** | Are Android and iOS in scope? The handout says so and `UserRequirement.md` does not | Out of this baseline | Instructor | Any claim that platform scope is settled |

All other decisions are PROPOSED. Each has one normative behavior and needs owner confirmation, listed in the [owner confirmation record](decisions/decision-log.md#owner-confirmation-record). The ones most likely to change behavior if the customer disagrees:

| Priority | Decisions |
|---|---|
| High | DEC-03 (one shared computer), DEC-07 (former-member visibility), DEC-08 and DEC-09 (exit rules), DEC-10 (admin succession), DEC-12 to DEC-14 (report meaning), DEC-29 (data at rest) |
| Medium | DEC-04, DEC-05, DEC-06, DEC-11, DEC-15 to DEC-22, DEC-25 to DEC-28, DEC-33 |
| Low | DEC-23, DEC-24, DEC-30, DEC-32 |

## Risk register

| ID | Priority | Risk | Effect | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|
| RISK-01 | **Critical** | OC-1 resolves toward web, possibly after work begins | `ui` and storage replaced; sessions and concurrency redone | Get the decision first. Layering limits the loss, but reuse is not free | Customer or instructor; team | Open |
| RISK-02 | High | Mobile is required | Scope grows well beyond this design | Ask now (DEC-02). `UserRequirement.md` may be a shortened copy of the handout's text | Instructor | Open |
| RISK-03 | High | One shared computer does not match how people actually split bills | Notifications and approvals work only by taking turns. Each FR can pass while the customer's need is unmet | State the limit plainly in the demo and handoff | Customer or instructor | Open |
| RISK-04 | High | The customer rejects a PROPOSED business rule | Rework. Exit rules and report semantics touch design, tests, and UML | Rules sit in `GroupExitPolicy`, `ReportCalculator`, and `AccessPolicy`, so most changes stay local | Customer; team | Open |
| RISK-05 | Medium | The four-part report reconciliation confuses users | Usability complaint | Show clear labels. Hide opening and later when no date filter is set. Revisit with test users (UI-09) | Team | Open |
| RISK-06 | High | NFR-004 is unmeasured. Derived balances and PBKDF2 are the likely slow spots | 2-second target missed | PERF-01 and PERF-02. Tune iterations and queries. Add a rebuildable cache only under a new recorded decision | Team | Open |
| RISK-07 | Medium | SQLite assumptions are unverified: `STRICT` support in the chosen driver, exclusive locking, native library on target machines | Mapping or packaging changes | Short spike at the start of implementation; RP-03, RP-07. Repositories can be replaced | Team | Open |
| RISK-08 | High | The data file is readable and editable by anyone with file access | Privacy and audit hold only through the application | OS file permissions. Owner must accept (DEC-29) | Customer or instructor | Open |
| RISK-09 | Medium | Crash durability is unproven; power loss is untested | Lost recent data | RP-03. Vendor documentation is supportive, but it is not evidence for this build. Back up by copying the folder | Team | Open |
| RISK-10 | Medium | The ledger rule exists in both Java and SQL | The two could drift, breaking NFR-001 | RP-06 compares them | Team | Open |
| RISK-11 | Medium | A payment recipient is not notified, although payments need no confirmation | A false or mistaken payment can go unnoticed | Shown in both histories. Owner may extend Q7 (DEC-17) | Customer | Open |
| RISK-12 | Medium | Correcting a mistake needs the other party's cooperation | Wrong balances can persist | Compensating payment (DEC-19). A reversal feature would be new scope | Customer | Open |
| RISK-13 | Low | Anyone who knows a username can lock it for 5 minutes | Nuisance | The lock expires on its own; required by NFR-002 | Security reviewer | Accepted in DEC-23, pending confirmation |
| RISK-14 | Medium | Receipt BLOBs grow the file: 10,000 × 5 MB is about 50 GB at worst | Slow backups, disk pressure | Separate table; `ReceiptRepository` can move bytes to files later | Team | Open |
| RISK-15 | Medium | A file with a valid signature can be malformed or a decompression bomb | Failed display, high memory | Trailer check at save; dimension limit and decode on a background thread at view; SEC-04, UI-06 | Technical reviewer | Open |
| RISK-16 | Low | Swing threading errors; a late result arrives after logout | Frozen UI, or prior user's data rendered | `UiTaskRunner`; UI-05 | Team | Open |
| RISK-17 | Medium | AI-authored design may contain errors that read as confident | A wrong rule goes unnoticed | Principle VII review; hand-check worked examples | Named reviewers | Open |
| RISK-18 | Medium | Nothing has been compiled or run; Maven is not installed here. PlantUML compile shows only that the syntax is valid | Design defects appear late | Early spike; tests first | Team | Open |
| RISK-19 | High for the experiment | Set A and Set B were produced in one checkout, so independence cannot be shown | The comparison's claim of independent generation is weakened. No product effect | Re-run in clean worktrees if it matters (DEC-31) | Experiment owner | Deferred |
| RISK-20 | Low | Changing the system clock shortens a lockout or changes "today" | Lockout bypass by someone with OS control | Same trust limit as RISK-08 | Security reviewer | Open |
| RISK-21 | Medium | No idle logout on a shared computer | The next person acts as the signed-in user | Log out when done; DEC-29 | Customer or instructor | Open |
| RISK-22 | Low | A member becomes admin with no notice under DEC-10 | Surprise | Shown on Group Detail; low consequence | Customer | Open |
