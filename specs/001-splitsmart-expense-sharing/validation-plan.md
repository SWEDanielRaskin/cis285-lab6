# Validation Plan: SplitSmart Expense Sharing

**Status**: Draft — Reconciliation Incomplete. **Date**: 2026-11-05

**No test exists and none has been run. Every case below can be verified only after implementation.** Nothing here is a result. Automated test names must begin with the requirement ID (Principle II). Automated cases use JUnit 5 and hand-written fakes.

Common setup: users alex, sam, and jo in one group, with a fixed `Clock`, unless a case says otherwise.

## Unit tests (domain; no database, no display)

| ID | Scenario | Expected outcome | Covers |
|---|---|---|---|
| UT-01 | `Money.parseStrict` on `0`, `-1`, `1.234`, `1,000`, `$5`, `1e3`, `0.01`, `100`, `1000000.00`, `1000000.01`, then the validator's range check | First five non-positive or malformed inputs refused; `1e3` refused; `0.01`, `100`, `1000000.00` accepted; `1000000.01` refused; nothing rounded; `HALF_EVEN` used only by `normalized`, `FLOOR` only by floor methods | BR-27, FR-010, FR-030, NFR-001 |
| UT-02 | Equal split: every equal row in the [spec examples](spec.md#worked-split-examples), plus randomized amounts and counts | Exact listed shares; Σ shares = amount always; same input gives same output; $0.00 share valid | FR-011, FR-012, BR-04, BR-06, BR-07, SC-004 |
| UT-03 | Percentage split: every percentage row in the examples, including $10.00 at 33.33 / 33.33 / 33.34 and $1.00 at 0 / 33.33 / 33.33 / 33.34; totals of 95 and 100.01; 3 decimals; 101% | Exact listed shares; first listed gets the cent, including at 0%; bad percentages refused | FR-012, FR-013, BR-05, BR-06, NFR-001 |
| UT-04 | `Expense`: create, revise, `isEligibleApprover`, approve, reject, `ledgerEntries` in each state; creator as only participant; decide twice; revise after a decision | Starts Pending; no entries unless Approved; creator ineligible; non-participant payer ineligible; second decision refused; decided expense refuses revise; sole-creator participant refused | FR-016, FR-020, FR-021, FR-022, FR-024, BR-03, BR-08, BR-09, BR-10, BR-11 |
| UT-05 | `BalanceCalculator`: Story 5 data; payer in and out of participants; zero share; overpayment 40 on 30; randomized ledgers | sam owes alex 30.00; net 0.00; own share creates no entry; alex owes sam 10.00; total owed = total due; overall = Σ groups | FR-026, FR-027, FR-029, BR-07, BR-12, BR-13, NFR-001 |
| UT-06 | `User` lockout on a controlled clock: 5 failures; check at +4:59 and +5:00; failure after expiry; 4 failures, success, 4 failures | Locked at +4:59; unlocked at +5:00; count restarts after expiry; no lock in the last sequence | NFR-002, BR-26 |
| UT-07 | `ReportCalculator`: filtered and unfiltered data; each status set; `from` only; `to` only; no match | Totals count Approved and payments only; memo shows other statuses; opening + period + later = current on every line; `from` absent gives opening 0; `to` absent gives later 0; zero totals when empty | FR-036, FR-037, BR-20, BR-21, SC-005, SC-007 |
| UT-08 | `FieldFormats`: `2026-02-29`, `2026-13-01`, `02/03/2026`, today, tomorrow; money formats | Strict parse; bad dates refused; tomorrow refused by the validator; always `$` and 2 decimals | FR-041, BR-30 |
| UT-09 | Text limits: 2, 3, 30, 31 character usernames; spaces only; surrounding spaces; `ALEX` vs. `alex` key; description 200 and 201; name 50 and 51 | Boundaries hold after trim; blank is empty; keys equal; password spaces count | FR-001, FR-005, FR-010, BR-29 |
| UT-10 | `ReceiptInspector`: PNG, JPEG, GIF, text renamed `.png`, truncated PNG, empty file, 5,242,880 bytes, 5,242,881 bytes | PNG and JPEG accepted; others refused; limit is exact | FR-014, BR-28 |

## Service and integration tests (fakes; no display)

| ID | Scenario | Expected outcome | Covers |
|---|---|---|---|
| SI-01 | Register alex, `ALEX`, a 7-character password; log in with wrong password and with unknown user; log out and reuse the session | First succeeds; second "taken"; third states the minimum; both failures have identical message; reused session gets `AccessDeniedException` | FR-001, FR-002, FR-004, BR-29, NFR-002 |
| SI-02 | Five wrong passwords through `login`; correct at +4:59 and +5:00; attempts during a lock; inspect state after each exception | Failure count is committed despite the exception; locked message at +4:59; success at +5:00; attempts during a lock neither count nor extend | NFR-002, BR-26, DEC-23 |
| SI-03 | Create group; add sam by username; add unknown and existing names; sam tries add and remove; rename; list as each user | Creator is admin and member; lists correct; refusals as contracted | FR-005, FR-006, FR-008, Story 2 |
| SI-04 | Exit: (a) sam has a non-zero pair; (b) net 0 with non-zero pairs; (c) in a Pending expense as creator, payer, participant; (d) all clear; (e) admin leaves; (f) last member leaves; (g) admin removes self; (h) re-add former member | (a–c) refused, naming balances or expenses; (d) allowed, history kept; (e) earliest-joined becomes admin; (f) allowed, group retained, in no active list; (g) `USE_LEAVE_FOR_SELF`; (h) new row, full visibility back | FR-006, FR-007, BR-22, BR-23, BR-24 |
| SI-05 | $90.00 by alex: check balances; alex decides; jo approves; sam then decides; second expense rejected with no reason, then with one; inspect decision | Unchanged while Pending; creator refused; Approved updates balances and records approver and time; sam told no longer pending; reason required; Rejected never counts; no change operation exists | FR-020 to FR-024, NFR-006, SC-005 |
| SI-06 | Create with: $0.00; negative; 3 decimals; $1,000,000.01; future date; 201-character description; duplicate participant; only the creator; payer not active; non-participant payer; bad receipt. Then edit and delete as creator, as another, after a decision, with a stale version | All errors reported together and named; non-participant payer accepted; creator succeeds while Pending; others refused; decided gets CE; stale gets CE | FR-010, FR-014, FR-015, FR-016, BR-01, BR-02, BR-03, BR-11, BR-27, BR-28, BR-30 |
| SI-07 | Reference set of at least 100 expenses and 20 payments, with hand-calculated answers; two shared groups; Story 5 | 100% match to the cent; group lines add up; direction correct; total owed = total due | FR-026 to FR-029, NFR-001, SC-003 |
| SI-08 | Pay exactly owed; 40 on 30, unconfirmed then confirmed; 30 in a group with no debt; owed changes between warning and confirm; $0.00; negative; $1,000,000.01; future date; no group; self; recipient not active; history as both people | No warning when exact; warning writes nothing; alex owes sam 10.00 after confirm; other group unchanged; fresh warning; invalid inputs refused; both see it; applied with no recipient action; `overpaymentConfirmed` set | FR-030 to FR-033, BR-14, BR-15, BR-16, DEC-20, DEC-27 |
| SI-09 | Create with participants alex and sam: check sam and jo. Decide. Remove jo, create another. Edit to add a participant who has read, and one who has none. Edit otherwise. Delete. Record a payment | All fields in message; alex none; only sam flagged; flag clears on decision; removed jo not notified; added participants unread; other rows unchanged; deleted rows keep text, flag false; payment gives no notification; unread count and newest-first hold; alex gets decision and reason | FR-017, FR-019, FR-023, BR-17, BR-18, SC-006 |
| SI-10 | Reference set; each filter alone and in all combinations; boundary dates; reversed range; no match; Pending only; other-user filter; backdated item then re-run | Inclusive dates; correct lines; reversed refused; zero totals when empty; Pending never in totals; memo labeled; opening + period + later = current; current = `BalanceService` for the same scope, to the cent; re-run reflects new data | FR-034 to FR-037, BR-19 to BR-21, SC-005, SC-007, DEC-12 to DEC-15 |
| SI-11 | **Simulation, labeled as such:** two `Session` objects decide the same expense, sequentially and on two threads; decide after an edit | Exactly one decision; the other gets `ALREADY_DECIDED`; a stale decision gets `STALE_VERSION`. This does not show multi-user support (DEC-04) | FR-024, BR-10, DEC-04 |
| SI-12 | An outsider submits invalid fields to a group; a non-admin submits an invalid name; a valid member submits invalid fields and an inactive payer | Outsider gets `NotFoundException`, with no field errors; non-admin gets `AccessDeniedException`; member gets all errors together | DEC-26, FR-015, NFR-003 |

## Repository and persistence tests (temporary SQLite file)

| ID | Scenario | Expected outcome | Covers |
|---|---|---|---|
| RP-01 | Violate each unique rule, foreign key, and check | Each raises the contracted error; one active membership per pair holds, and a rejoin row succeeds | FR-001, FR-006, FR-024, BR-02, BR-14, BR-24, BR-29 |
| RP-02 | Lock an account; close and reopen the database | Lock and count survive | NFR-002 |
| RP-03 | Run a child process, commit, kill it forcibly; repeat with a kill during a transaction; reopen | Committed data present; uncommitted data entirely absent; integrity check passes | NFR-005, FR-040 |
| RP-04 | Save one of every record, close normally, reopen; force an exception inside `inTransaction` | All present, including receipt bytes; failed unit leaves nothing | FR-040, NFR-005 |
| RP-05 | Attempt update and delete on decisions and payments through SQL; on decided expenses | Triggers refuse; interface has no such operation | NFR-006, FR-016, BR-10, BR-11 |
| RP-06 | On the reference set, compare `LedgerQueryRepository` results with `Expense.ledgerEntries` and `Payment.ledgerEntry` | Identical; zero shares and payer shares excluded | FR-026, BR-07, BR-08, BR-12, RISK-10 |
| RP-07 | Open a second connection while the first holds the lock | Refused; startup path shows the second-instance message | DEC-03 |
| RP-08 | Money and percentage round trips at boundaries; recompute shares from stored amount, method, percentages, and order | Exact values; recomputed equals stored | NFR-001, FR-012 |
| RP-09 | Spy on queries: list and report queries; delete a Pending expense with a receipt | No receipt bytes loaded by lists; receipt and shares cascade; notification link is null | FR-014, FR-016, NFR-004, BR-18 |

## Architecture tests

| ID | Scenario | Expected outcome | Covers |
|---|---|---|---|
| ARCH-01 | Source scan | Fails if `domain`, `service`, or `repository` import `javax.swing`, `java.awt`, or `javax.imageio`; if `domain` or `service` import `java.sql` or `repository.sqlite`; if `ui` imports `repository.sqlite` | Principle III, NFR-009 |
| ARCH-02 | Source scan | Fails on `float` or `double` in money code, `new BigDecimal(double)`, or a `RoundingMode` outside `Money` | Principle IV, NFR-001 |

## UI and manual tests (written steps)

| ID | Script | Expected outcome | Covers |
|---|---|---|---|
| UI-01 | Count steps for each task from the [navigation table](contracts/ui-interactions.md#navigation) | At most 3; counts match the table | NFR-007, DEC-21 |
| UI-02 | Trigger each validation error from the spec's table; read each message | Each names the field and how to fix it; no stack traces | NFR-007, FR-015 |
| UI-03 | With the mouse disconnected: register, log in, create a group, add a member, create an equal and a percentage expense with a receipt and reordered participants, approve, reject with reason, record a payment including the overpayment dialog, read and mark notifications, run a filtered report, log out | Every step completes; focus is always visible | NFR-008 |
| UI-04 | Inspect amounts and dates on each screen | Always `$` and 2 decimals; one date format; direction in words | FR-041 |
| UI-05 | Log out during a slow call; log in as someone else | No prior user's data appears; late result is dropped | FR-002, FR-003, Story 1 |
| UI-06 | Open a valid PNG and JPEG; a corrupt file; an over-limit image | Valid images display; others show a message | FR-014, DEC-25 |
| UI-07 | Submit a form with a mix of errors, including a bad receipt | All data stays; focus on the first error | FR-015 |
| UI-08 | Trigger the overpayment dialog | Both amounts shown; Cancel is the default; Cancel writes nothing | FR-032 |
| UI-09 | Task timing and test-user study: set up an account and group; enter an expense; split a dinner bill and settle up | Under 3 minutes; under 1 minute; at least 9 of 10 unaided | SC-001, SC-002, SC-009 |

## Security and privacy tests

| ID | Scenario | Expected outcome | Covers |
|---|---|---|---|
| SEC-01 | Search the database file and logs for known passwords, descriptions, notes, and reasons | No readable password anywhere; logs contain none of the prohibited content; hash includes salt and differs for equal passwords | FR-004, NFR-002, AD-21 |
| SEC-02 | As an outsider, call every read operation for an existing group and a nonexistent one | No data; identical result | FR-003, NFR-003 |
| SEC-03 | As a former member: each row of the [visibility table](spec.md#former-member-visibility), including another member's expense, a receipt, group balances, notifications, reports. Rejoin and repeat | Only own items, read-only; receipts refused; balances settled; rejoin restores active view | FR-003, NFR-003, BR-16, BR-19, BR-25 |
| SEC-04 | Malformed and very-large-dimension images through save and view | Refused at save or reported at view; no crash | BR-28, RISK-15 |
| SEC-05 | Wrong password vs. unknown username: compare message and approximate timing | Same message; similar timing. The locked and taken messages are expected exceptions (DEC-23) | FR-002 |

## Performance tests

Unmeasured until implementation. Parameters are from [DEC-28](decisions/decision-log.md#dec-28-measurement-definitions).

| ID | Procedure | Pass | Covers |
|---|---|---|---|
| PERF-01 | Seed the reference dataset. On the reference machine, time each service read that backs a screen or report, and `login`. Discard 3 warm-up runs; time 20 | 95th percentile at most 2.0 seconds. Report the machine and raw numbers. If it fails, follow RISK-06 | NFR-004 |
| PERF-02 | Same data, stopwatch or instrumented timing from action to rendered result, on each primary screen and report | At most 2.0 seconds; UI stays responsive | NFR-004 |

## Acceptance tests

Each spec story is run end to end through the UI against a real database once it exists.

| ID | Story | Covers |
|---|---|---|
| AT-01 | Story 1 scenarios | FR-001, FR-002, NFR-002 |
| AT-02 | Story 2 scenarios | FR-005 to FR-008 |
| AT-03 | Story 3 scenarios | FR-010 to FR-015 |
| AT-04 | Story 4 scenarios | FR-020 to FR-024 |
| AT-05 | Story 5 scenarios | FR-026 to FR-028 |
| AT-06 | Story 6 scenarios | FR-030 to FR-033 |
| AT-07 | Story 7 scenarios | FR-017, FR-019 |
| AT-08 | Story 8 scenarios | FR-034 to FR-037 |

## Not validated in the MVP

FR-009, FR-018, FR-025, FR-038, and FR-039 are Post-MVP. **CR-10 is not met by the MVP**, and no case here should be read as showing otherwise.
