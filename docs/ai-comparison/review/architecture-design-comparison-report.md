# SplitSmart Expense Sharing — Independent Architecture & Design Comparison Report

**Repository:** `SWEDanielRaskin/cis285-lab6`  
**Review branch:** `main`  
**Review type:** AI-assisted independent architecture, requirements, and design audit  
**Status:** Draft for human review; not an approval or implementation authorization

---

## 1. Executive Summary

**Neither design set is approved for the next phase.** Both are substantial and useful architecture/design drafts. Both preserve the core SplitSmart behavior, separate customer requirements from implementation decisions, and explicitly acknowledge OC-1. Neither silently claims that Swing satisfies the web requirement.

- **Set A — GitHub Spec Kit** is the more conservative design. It stays close to the clarified spec, uses the constitution's prescribed diagram location, and provides a useful requirement-to-contract-to-diagram-to-validation map.
- **Set B — Claude Code** is more detailed in service decomposition, transaction design, domain behavior, and risk analysis. It also proposes several additional rules beyond the spec. Those proposals may be sensible, but they are not customer-approved requirements.

**Recommendation:** Use Set A as the initial requirements-aligned baseline, selectively incorporate Set B's stronger technical detail, and do not select either whole set as the winner.

### Critical OC-1 finding

`UserRequirement.md` requires a **primarily web-based** application (CR-10), while constitution decision ID-03 selects a **Java Swing desktop MVP**. The constitution explicitly records that Swing does not satisfy CR-10 and requires written customer/instructor acceptance before plan approval.

Both sets:
- Make OC-1 explicit.
- Correctly state that Swing does not satisfy the web requirement.
- Preserve Swing as an implementation decision, not a customer requirement.
- Propose keeping domain/service logic independent of Swing for a possible future web client.
- Avoid claiming that a web deliverable is included in the MVP.

This is honest conflict management, but it does not satisfy CR-10. **OC-1 remains a Critical blocker.** A reusable service layer does not make a desktop MVP web-based.

### Overall comparison

| Area | Set A: Spec Kit | Set B: Claude Code |
|---|---|---|
| Customer requirement fidelity | Strong; conservative | Strong; more proposed behavior |
| OC-1 handling | Explicit and unresolved | Explicit and unresolved |
| Domain model | Good coverage | More detailed |
| Service/repository boundaries | Clear | More detailed |
| Transaction/concurrency design | Good | Stronger detail, with one runtime inconsistency |
| Reporting semantics | Identifies unresolved issues | More complete reconciliation proposal |
| Traceability | Strong | Strong |
| UML organization | Constitution-compliant location | Experiment folder, not required location |
| Open questions | 12 NC/OC items | Extensive DQ/SRC/A/R registers |
| Build/test verification | Not performed | Not performed |

Both designs describe a Swing application running on a local/shared installation. That creates a practical limitation: users cannot collaborate across separate computers as they would with a web application. Neither architecture eliminates this limitation.

---

## 2. Inputs Reviewed and Missing Evidence

### 2.1 Authoritative sources reviewed

1. `UserRequirement.md`
2. `.specify/memory/constitution.md`
3. `specs/001-splitsmart-expense-sharing/spec.md`

The feature specification includes the October 29, 2026 clarifications, CR/FR/NFR inventory, acceptance scenarios, edge cases, success criteria, assumptions, and open questions.

### 2.2 Set A — Spec Kit artifacts reviewed

- `specs/001-splitsmart-expense-sharing/plan.md`
  - Technical Context
  - Constitution Check
  - Architecture
  - OC-1 impact
  - Requirements Traceability
  - Project Structure
  - Complexity Tracking
- `specs/001-splitsmart-expense-sharing/research.md`
  - Proposed decisions R-01 onward
  - Split allocation and money policy
  - Storage and transaction proposals
  - Unresolved questions and risks
- `specs/001-splitsmart-expense-sharing/data-model.md`
- All four contract files:
  - `specs/001-splitsmart-expense-sharing/contracts/README.md`
  - `specs/001-splitsmart-expense-sharing/contracts/service-contracts.md`
  - `specs/001-splitsmart-expense-sharing/contracts/repository-contracts.md`
  - `specs/001-splitsmart-expense-sharing/contracts/ui-interactions.md`
- `specs/001-splitsmart-expense-sharing/quickstart.md`
- Five PlantUML files under `docs/uml/`:
  - `domain-class.puml`
  - `layer-component.puml`
  - `expense-approval-sequence.puml`
  - `payment-settlement-sequence.puml`
  - `notification-sequence.puml`

### 2.3 Set B — Claude Code artifacts reviewed

- `docs/ai-comparison/claude-code/architecture.md`
  - OC-1
  - Technical context
  - Constitution Check
  - Component/layer architecture
  - Runtime collaboration
  - Storage, security, privacy, performance
  - Post-MVP impact
  - AD decision register
- `docs/ai-comparison/claude-code/design.md`
  - Domain model
  - Money and split rules
  - Business flows
  - Services
  - Repository interfaces
  - User interface
  - Transaction boundaries
  - Traceability matrix
- `docs/ai-comparison/claude-code/data-model.md`
- All four contract files:
  - `docs/ai-comparison/claude-code/contracts/README.md`
  - `docs/ai-comparison/claude-code/contracts/service-contracts.md`
  - `docs/ai-comparison/claude-code/contracts/repository-contracts.md`
  - `docs/ai-comparison/claude-code/contracts/ui-service-interactions.md`
- `docs/ai-comparison/claude-code/quickstart.md`
- `docs/ai-comparison/claude-code/open-questions-and-risks.md`
- Six PlantUML files under `docs/ai-comparison/claude-code/uml/`:
  - `domain-class.puml`
  - `service-class.puml`
  - `layer-component.puml`
  - `expense-creation-approval.puml`
  - `payment-settlement.puml`
  - `notification.puml`

### 2.4 Missing or unverifiable evidence

- **Neither set contains a separate completion report.** The prompt pack requested one from each tool; none was found in either output directory.
- No `pom.xml`, application source, or tests exist in the repository.
- Neither set's PlantUML diagrams have been rendered or syntax-checked as part of this review.
- No JUnit tests exist to verify the proposed algorithms or business rules.
- Neither storage proposal has been implemented or benchmarked.
- The authors' actual local command execution cannot be independently verified; the quickstarts state that build/test commands were unavailable.
- No named human review and acceptance record for these two design sets was found.

**Experiment independence warning:** Claude Code's `open-questions-and-risks.md`, SRC-14, says both sets were generated in the same `main` checkout. Claude reports seeing Spec Kit output paths appear in the working tree, although it says it did not open those files. The available evidence does not establish that the runs were fully isolated. The experiment protocol called for separate clean worktrees/branches. This weakens the claim of independent generation; it does not prove copying.

---

## 3. Side-by-Side Requirements Traceability Matrix

### Status definitions

- **Complete:** design-level coverage is present and appears consistent with the source. This is not implementation verification.
- **Partial:** ambiguity, conflict, or design qualification remains.
- **Missing:** no meaningful design coverage found.
- **Contradictory:** design conflicts with the source.
- **Not Applicable:** correctly deferred from MVP.

Evidence shorthand:
- **A plan:** `specs/001-splitsmart-expense-sharing/plan.md`, heading **Requirements Traceability**.
- **A model/contracts:** `data-model.md` and the three boundary contract files in `specs/001-splitsmart-expense-sharing/contracts/`.
- **A diagrams:** `docs/uml/`; DC = domain class, LC = layer/component, EA = expense approval, PS = payment settlement, N = notification.
- **A validation:** `specs/001-splitsmart-expense-sharing/quickstart.md`, **Part C: Validation scenarios for after implementation**.
- **B matrix:** `docs/ai-comparison/claude-code/design.md`, **11. Traceability matrix**.
- **B model/contracts:** `docs/ai-comparison/claude-code/data-model.md` and `contracts/`.
- **B diagrams:** `docs/ai-comparison/claude-code/uml/`; D = domain class, S = service class, L = layer/component, E = expense approval, P = payment, N = notification.
- **B validation:** `docs/ai-comparison/claude-code/quickstart.md`, **5. Proposed validation scenarios**.

### 3.1 Customer requirements

| ID | Concise meaning | Set A | Set B | Evidence / finding |
|---|---|---|---|---|
| CR-01 | User accounts and personal expense/balance information | Complete | Complete | Account/login and privacy boundaries covered |
| CR-02 | Group management | Complete | Complete | Creation, membership, admin, rename, removal and leaving covered |
| CR-03 | Expense creation and receipts | Complete | Complete | Required fields, split types, receipts covered |
| CR-04 | Identify expense participants | Complete | Complete | Payer and ordered participants modeled |
| CR-05 | Notify other group members | Complete | Complete | In-app notification design; local-install collaboration limitation remains |
| CR-06 | Review/approve expenses | Complete | Complete | Single-level MVP workflow; multi-level deferred |
| CR-07 | Pairwise balances | Complete | Complete | Per-group and overall balance design |
| CR-08 | Payment tracking | Complete | Complete | Payment recording and settlement covered |
| CR-09 | Reports and summaries | Partial | Partial | Report totals and reconciliation semantics need clarification |
| CR-10 | Primarily web-based | Contradictory | Contradictory | Both deliberately choose Swing MVP; neither meets CR-10 |

CR-10 remains a Critical issue even though both designs document the conflict correctly.

### 3.2 Functional requirements

| ID | Concise requirement | Set A | Set B | Evidence / finding |
|---|---|---|---|---|
| FR-001 | Register with unique username, display name, minimum password length | Complete | Complete | AccountService, User model; DC/D |
| FR-002 | Login/logout; generic failed-credential message | Complete | Complete | Session and AccountService; DC/D, S |
| FR-003 | User-specific/group-scoped visibility | Partial | Partial | AccessPolicy; former-member interpretation conflicts with NFR-003 |
| FR-004 | Passwords never readable or stored plaintext | Complete | Complete | PasswordHasher, PasswordHash; DC/D |
| FR-005 | Create group; creator becomes admin/member | Complete | Complete | GroupService, Group, Membership; DC/D |
| FR-006 | Admin adds/removes; any member may leave | Complete | Complete | GroupService and membership contracts; admin-leaving policy unresolved/proposed |
| FR-007 | Prevent exit/removal when group net balance is nonzero | Partial | Partial | A flags pairwise/pending questions; B proposes stricter AD-15 |
| FR-008 | List groups, view members, rename by admin | Complete | Complete | GroupService and group UI contracts; DC/D, S |
| FR-009 | Archive zero-balance group | Not Applicable | Not Applicable | Post-MVP; status reserved, no MVP operation |
| FR-010 | Create expense with required fields, payer, participants and split method | Complete | Complete | Expense model and ExpenseService; DC/D, E |
| FR-011 | Equal split rounds down to cents | Complete | Complete | SplitAllocator; DC/D, E |
| FR-012 | Allocate leftover cents in listed order; save order | Complete | Complete | Ordered Share position; DC/D, E |
| FR-013 | Percentage split validates percentages and allocates remainder | Complete | Complete | Percentage and SplitAllocator; DC/D, E |
| FR-014 | Optional JPEG/PNG receipt; group members can view | Complete | Complete | ReceiptImage/Receipt; DC/D, E |
| FR-015 | Report all invalid fields without losing other input | Complete | Complete | ValidationException/ExpenseDraftValidator; E |
| FR-016 | Creator may edit/delete only Pending expenses | Complete | Complete | Versioned conditional updates; DC/D, E |
| FR-017 | Notify all other current group members; approval flag for participants | Complete | Complete | NotificationService/Dispatcher; N |
| FR-018 | External notifications | Not Applicable | Not Applicable | Post-MVP; no email/push delivery design |
| FR-019 | Unread count, newest-first list, mark read, show on next login | Complete | Complete | Notification contracts and UI; N |
| FR-020 | New expense Pending; no balance effect until Approved | Complete | Complete | Expense lifecycle and ledger filtering; DC/D, E |
| FR-021 | Any participant except creator may approve/reject | Complete | Complete | ApprovalService and eligibility checks; DC/D, E |
| FR-022 | Creator cannot approve/reject own expense | Complete | Complete | Explicit eligibility rule; E |
| FR-023 | Rejection requires reason; notify creator of decision | Complete | Complete | ApprovalDecision and notification contracts; E, N |
| FR-024 | Immutable decision, recorded and visible to group | Complete | Complete | Append-only repository contracts; DC/D, E |
| FR-025 | Configurable multi-level approval | Not Applicable | Not Applicable | Post-MVP; one-decision model intentionally limited to MVP |
| FR-026 | Approved expense creates debt from participant to payer, excluding payer's own share | Complete | Complete | BalanceLedger/BalanceCalculator; DC/D |
| FR-027 | Per-group net balances; overall sum across groups | Complete | Complete | BalanceService and ledger; DC/D, PS/P |
| FR-028 | View amount, direction, and per-group breakdown | Complete | Complete | BalanceService and balances UI; DC/D, S |
| FR-029 | Total owed equals total due | Complete | Complete | Balance invariants and planned tests; DC/D |
| FR-030 | Record payment with amount, date, group, recipient and note | Complete | Complete | PaymentService and Payment model; DC/D, PS/P |
| FR-031 | Payment applies immediately without recipient confirmation | Complete | Complete | PaymentService and ledger entry; PS/P |
| FR-032 | Warn and require confirmation for overpayment | Complete | Complete | Overpayment outcome and payment dialog; PS/P |
| FR-033 | Both parties can view payment history | Complete | Complete | PaymentRepository and history UI; DC/D, PS/P |
| FR-034 | Generate user's expense, balance and payment report | Complete | Complete | ReportService and Report model; DC/D, S |
| FR-035 | Inclusive date, group, other-user, status filters | Complete | Complete | ReportCriteria/ReportFilter; DC/D, S |
| FR-036 | Matching lines and all required totals | Partial | Partial | Approved-only totals are sensible under SC-005, but “total paid/received” and “net” meanings remain open |
| FR-037 | Report totals reconcile with balances | Partial | Partial | A separates filtered/current net; B uses opening + period + later = current. Customer semantics still needed |
| FR-038 | Save report filters and export | Not Applicable | Not Applicable | Post-MVP; no save/export implementation |
| FR-039 | Web browser access | Not Applicable | Not Applicable | Post-MVP in feature spec, but CR-10 remains the unmet platform requirement |
| FR-040 | Persist accounts, groups, expenses, receipts, approvals, notifications, payments | Complete | Complete | Proposed SQLite/H2 persistence and transactions; not implemented or verified |
| FR-041 | Consistent date and currency display formats | Complete | Complete | DisplayFormats/FieldFormats; DC/D, UI contracts |

**Post-MVP audit:** Both sets keep FR-009, FR-018, FR-025, FR-038 and FR-039 visible as deferred requirements. Neither silently represents these features as delivered by the MVP. CR-10 must nevertheless remain visibly unmet until resolved.

### 3.3 Non-functional requirements

| ID | Concise requirement | Set A | Set B | Evidence / finding |
|---|---|---|---|---|
| NFR-001 | Exact cents; no accumulated rounding error | Complete | Complete | Money, SplitAllocator, BalanceLedger/BalanceCalculator; planned test vectors |
| NFR-002 | Password protection and five-failure/five-minute lockout | Complete | Complete | PasswordHasher, persisted lockout fields, injected Clock |
| NFR-003 | No access to groups the user does not belong to | Partial | Partial | Service-level AccessPolicy exists; former-member report visibility unresolved |
| NFR-004 | Screens/reports within two seconds at stated scale | Partial | Partial | Indexes, projections, off-EDT calls; no benchmark performed |
| NFR-005 | Data survives normal or unexpected exit | Partial | Partial | Transaction design exists; storage durability and crash behavior unverified |
| NFR-006 | Decisions/payments record actor/time and cannot be altered | Complete | Complete | Append-only repository contracts; direct database tampering outside application controls |
| NFR-007 | Useful errors and three-step navigation | Partial | Partial | Error handling covered; “register from Home” conflicts with visitor/login navigation |
| NFR-008 | Keyboard-only primary tasks | Complete | Complete | UI conventions and manual validation scenarios |
| NFR-009 | Business rules testable automatically without UI | Partial | Partial | Architecture supports headless tests, but tests do not yet exist |

---

## 4. Constitution Compliance Matrix

| Principle | Set A | Set B | Evidence and assessment |
|---|---|---|---|
| I. Customer Requirements Are the Source of Truth | Pass | Pass | Both preserve UserRequirement.md, distinguish CRs from implementation decisions, and document OC-1 |
| II. Requirement Traceability | Partial | Partial | Both trace FRs to design and planned verification, but tasks/tests do not exist; FR-040/041 lack CR IDs |
| III. OO Design with GUI/Business-Logic Separation | Pass | Pass | Both define domain, service, repository, ui, inward dependencies, and constructor injection |
| IV. Exact Money Arithmetic with BigDecimal | Partial | Partial | Both use BigDecimal/scale 2 and distinguish HALF_EVEN from clarified floor/remainder; human acceptance of interpretation remains necessary |
| V. Automated Testing with JUnit 5 | Partial | Partial | Both specify JUnit 5, headless business-rule tests, and manual UI checks; no tests created or run |
| VI. Design Modeled in PlantUML | Partial | Partial | A has five diagrams in docs/uml; B has six in a noncanonical location. Neither set rendered or syntax-checked |
| VII. Human Review of AI-Generated Output | Partial / Pending | Partial / Pending | Both label artifacts drafts. No named human review and date found |

### Engineering constraint checks

| Check | Set A | Set B | Assessment |
|---|---|---|---|
| Java 21 | Yes | Yes | ID-01 acknowledged |
| Maven | Yes | Yes | ID-02 acknowledged; no pom.xml |
| Swing MVP | Yes | Yes | ID-03 acknowledged; OC-1 remains open |
| JUnit 5 | Yes | Yes | Planned only |
| PlantUML | Yes | Yes | Files exist; syntax/rendering unverified |
| Layered architecture | Yes | Yes | Both comply conceptually |
| No GUI dependencies in business layers | Yes | Yes | Explicitly prohibited |
| BigDecimal money | Yes | Yes | Explicitly required |
| Scale 2 and centralized rounding | Yes | Yes | Both distinguish general HALF_EVEN and split floor |
| Constructor injection | Yes | Yes | Explicitly described |
| SOLID/composition | Yes | Yes | Explicitly acknowledged |
| Requirement traceability | Partial | Partial | Task and test links cannot yet be completed |

**Principle VI note:** Set B diagrams are under `docs/ai-comparison/claude-code/uml/`. The constitution requires diagrams under `docs/uml/` or the feature directory. Set B acknowledges this in `architecture.md` §5 and `open-questions-and-risks.md` SRC-10. Adopted diagrams should be moved/copied to a compliant location.

---

## 5. Domain and Business-Rule Audit

### 5.1 Registration, authentication, privacy and lockout

Both sets correctly model:
- Case-insensitive username uniqueness.
- Password minimum length.
- Non-reversible password storage.
- Five consecutive failed attempts triggering a five-minute lockout.
- Successful login resetting the failure count.
- Generic messaging for wrong username versus wrong password.
- Session cleanup on logout.

Set A proposes PBKDF2-HMAC-SHA256 with 600,000 iterations. Set B proposes PBKDF2-HMAC-SHA256 with stored algorithm parameters and salt, but does not settle an equivalent iteration count in the same way.

Set B's constant-time comparison and dummy hash for unknown usernames are useful security refinements.

**Open nuance:** The spec's separate “account temporarily locked” message reveals that an account exists. Both designs recognize this tension with generic failed-login messaging. Document it as a deliberate trade-off.

### 5.2 Groups, membership and administration

Both cover group creation, membership, admin authority, rename, and membership history.

Differences:
- **Set A** implements FR-007's group net-balance wording and flags whether pairwise debt and Pending expenses should prevent exit; admin departure is unresolved.
- **Set B** AD-15 requires every pairwise balance to be zero and refuses exit/removal while the person is involved in any Pending expense. AD-16 introduces automatic admin succession to the earliest-joined remaining member.

Set B's rules are defensible but stricter/more specific than the source. Do not promote AD-15 or AD-16 into binding behavior without customer/instructor approval. Set A is safer as the requirements baseline because it leaves these choices open.

### 5.3 Expense fields, payer, participants, receipts, validation and lifecycle

Both preserve:
- Exactly one payer.
- Payer may be any current group member.
- Payer defaults to creator.
- Payer need not participate.
- One or more participants, all current group members.
- Participant order is persisted.
- Optional JPEG/PNG receipt, no more than 5 MB.
- Invalid fields reported together without losing entered data.
- Only the creator can edit/delete a Pending expense.

A file signature does not prove a file is a valid, safely decodable image. Set B identifies malformed-image and oversized-dimension risk in R-15. Set A should add corrupt-image and decompression/dimension tests.

### 5.4 Equal and percentage split arithmetic

Both preserve the clarified algorithm:
1. Calculate each share rounded down to cents.
2. Calculate leftover cents.
3. Distribute one cent at a time in saved participant order.
4. Ensure the sum of shares equals the expense total exactly.

Both preserve the $10.00 percentage example:
- Percentages: 33.33%, 33.33%, 33.34%.
- Floored shares: $3.33, $3.33, $3.33.
- Remaining cent goes to the **first listed participant**, not necessarily the largest percentage.

Set A uses `FLOOR`; Set B uses `DOWN`. For positive expense amounts and nonnegative percentages, these produce the same allocation result.

Both identify the 0% participant issue: under the literal leftover rule, a participant with 0% can receive a cent if first in participant order. This is a customer policy question, not necessarily an arithmetic defect.

**Recommendation:** Retain either algorithm, verify all worked examples, and have the human reviewer decide whether literal 0% behavior is acceptable.

### 5.5 Pending, Approved and Rejected transitions

Both correctly model:
- Pending as initial state.
- No balance effect until Approved.
- One participant other than creator may approve/reject.
- Creator cannot decide their own expense.
- Rejection reason required.
- Creator notified of approval/rejection.
- Decision records immutable and auditable.
- First valid decision wins in a concurrent decision race.

Set B's `expectedVersion` and conditional repository updates are a strong safeguard against deciding an expense after creator edit or another decision.

### 5.6 Notifications

Both notify every other current group member and distinguish participants who need to approve.

Set A leaves edit/delete notification behavior unresolved.

Set B AD-14 proposes:
- Refreshing existing notification snapshots when a Pending expense is edited.
- Resetting participant notifications to unread.
- Adding notifications for newly added participants.
- Keeping old notification text after deletion.

These behaviors may be useful, but FR-017 defines notification behavior on creation, not all edit/delete behavior. Treat AD-14 as a proposal, not an approved interpretation.

### 5.7 Pairwise balances and overall aggregation

Both correctly exclude Pending and Rejected expenses from balances. Both calculate payer debts from Approved shares, exclude the payer's own share, and apply payments to the named group immediately.

Both handle overpayment confirmation and the example where a $40 payment against a $30 debt reverses the direction by $10.

Set B's two-phase confirmation proposal binds confirmation to the amount owed that was shown, then checks whether it changed before recording. Set A rechecks inside the confirmed transaction but is less explicit about binding confirmation to the displayed amount.

**Recommendation:** Prefer Set B's `acknowledgedOwed` pattern.

### 5.8 Reports, filters, line items and reconciliation

The spec requires matching expense/payment lines, total expense amount, user's total share, total paid/received, net balance with each other user, inclusive date/group/person/status filters, and reconciliation with displayed balances.

Complications:
- Pending and Rejected expenses must not affect report totals, while status filters can select those expenses.
- A date-filtered report cannot simply equal a current balance if it excludes activity outside that date range.

Set A separates filtered net from current net.

Set B AD-18 proposes:
`opening + period + later = current`

It keeps current balance reconcilable while showing requested-period activity and excludes Pending/Rejected expenses from money totals.

**Finding:** Set B's reconciliation model is the stronger candidate, but status-filter semantics and the definition of “total paid/received” need customer confirmation.

### 5.9 Persistence, restart behavior, date/amount display and NFRs

Both propose durable persistence for accounts, groups, expenses, receipts, decisions, notifications and payments. Both define consistent display formatting. Neither has demonstrated crash durability or restart recovery.

Outstanding NFR issues:
- NFR-003 former-member visibility unresolved.
- NFR-004 performance unmeasured.
- NFR-005 durability unverified.
- NFR-007 registration/Home wording conflicts with visitor/login navigation.
- NFR-009 architecture supports headless tests, but no tests exist.

---

## 6. Architecture and Design Comparison

### 6.1 Layer boundaries and dependencies

Both follow:
`ui → service → domain`  
and `service → repository interfaces`.

Neither places business rules or balance arithmetic in Swing components.

Set B adds more explicit separation:
- `AccessPolicy`
- `LedgerReader`
- `NotificationDispatcher`
- `ExpenseDraftValidator`
- `BalanceCalculator`
- `ReportCalculator`
- `TransactionRunner`

These improve testability and reduce the risk of duplicate balance logic. Set A has the required boundaries, but some responsibilities are less explicitly isolated.

### 6.2 Persistence alternatives

| Area | Set A | Set B |
|---|---|---|
| Database | SQLite via JDBC | Embedded H2 via JDBC |
| Money storage | Integer cents | DECIMAL(12,2) |
| Receipt storage | Separate table | Separate BLOB table |
| Balance storage | Derived, not stored | Derived, not stored |
| Transactions | TransactionManager | TransactionRunner |
| Main advantage | Integer cents and SQLite transaction behavior | Pure Java and direct decimal mapping |
| Main concern | SQLite native driver and single-writer constraints | H2 behavior/durability assumptions need testing |

Neither database is required by the constitution. Choose based on deployment, transaction durability, concurrent access and whether a future web architecture is expected.

### 6.3 Security and authorization

Both enforce authorization at service level rather than relying on hidden UI buttons.

Set B's explicit `Session` object is preferable to ambient/global user state: it makes authorization dependencies visible and is easier to test.

Both recognize application-level immutability does not prevent direct database modification by someone with database access.

### 6.4 Transaction boundaries and concurrency

Set B provides more detail about transaction boundaries and optimistic concurrency.

However:
- `architecture.md` §7 and AD-24 describe one running application instance and one signed-in session.
- `design.md` §4.3 and quickstart V-14 propose testing two sessions and two threads deciding the same expense.

These can coexist as an artificial service-level test, but not as two simultaneous real users under the stated exclusive-instance deployment. Define whether concurrency testing is a service simulation or a supported runtime scenario.

Set A also has a transaction sequencing concern: `docs/uml/expense-approval-sequence.puml` performs membership authorization before opening the transaction. If membership can change between authorization and persistence, the check may become stale. Move authorization into the transaction or guarantee a consistent snapshot.

### 6.5 UI navigation, controllers and error handling

Both use controllers and passive Swing views, keep service calls off the Event Dispatch Thread, and define keyboard navigation.

Set B's UI/service interaction contract and `UiTaskRunner` approach are more detailed.

Both need to resolve NFR-007's requirement that registration be reachable from Home against the visitor/login navigation model.

### 6.6 Extensibility, maintainability, testability and SOLID

Set A is simpler and easier to adopt with fewer proposed collaborators.

Set B's decomposition is stronger for long-term maintainability, but adds interfaces and supporting types. Each abstraction should have a clear reason and traceable use.

**Recommendation:** Adopt Set B's `LedgerReader`, `NotificationDispatcher`, `AccessPolicy`, and transaction-boundary ideas selectively, while retaining Set A's scope discipline.

---

## 7. Artifact Consistency Findings

### 7.1 Set A — Spec Kit

Positive:
- `plan.md` and `data-model.md` use the same primary entities.
- Service and repository contracts generally agree with the layered architecture.
- Quickstart scenarios map to the traceability matrix.
- Five UML diagrams correspond to requested domain, layer, expense, payment and notification views.

Corrections:
1. **Notification relationship mismatch:** `data-model.md` says `Notification.expenseId` is optional and cleared on expense deletion. In `docs/uml/domain-class.puml`, `expenseId` appears non-optional and the relationship is drawn as `Expense "1" -- "*" Notification`. Diagram should represent the optional link.
2. **Authorization/transaction sequencing:** `docs/uml/expense-approval-sequence.puml` performs membership authorization before transaction start. Review for membership-change race.
3. **Service/model diagram completeness:** payer/recipient and creator/approver links are less explicit than the written model.
4. **Completion report missing.**

### 7.2 Set B — Claude Code

Positive:
- `architecture.md`, `design.md`, `data-model.md`, and contracts generally share terminology.
- `service-class.puml` adds a useful service/repository relationship view.
- Business-flow diagrams align with written flows.
- AD register distinguishes proposals from settled decisions.

Corrections:
1. **Authorization versus validation order:** `contracts/README.md` says authorization precedes validation of business content. But `design.md` §4.1 and `uml/expense-creation-approval.puml` validate the draft before transaction and authorization. Payment sequence has similar order. Align artifacts.
2. **Single-session versus concurrent-user test:** AD-24's exclusive single-instance/single-session model conflicts with apparent real-world interpretation of the two-user concurrency test. Define test as service-level simulation or revise runtime assumption.
3. **PlantUML location:** Six diagrams are in experiment folder, not constitution-required location.
4. **Report model complexity:** `opening + period + later = current` is useful but needs approval before becoming required report contract.
5. **Completion report missing.**

### 7.3 Experiment integrity

Claude's SRC-14 matters. The required protocol called for separate clean worktrees/branches. Available evidence says both outputs were produced in one checkout. This does not prove copying, but the experiment cannot establish complete isolation. Repeat from separate clean worktrees from the same baseline if independent generation is important to the project evaluation.

---

## 8. Prioritized Risk and Ambiguity Register

| ID | Severity | Finding | Evidence | Consequence / recommendation | Customer/instructor input? |
|---|---|---|---|---|---|
| R-01 | **Critical** | OC-1: web request vs Swing MVP | Constitution OC-1; both architecture files | Obtain written acceptance or revise implementation decision. Do not approve plan while unresolved. | Yes |
| R-02 | High | Experiment isolation not demonstrated | Claude `open-questions-and-risks.md` SRC-14 | Repeat using separate clean worktrees if independent comparison is required. | Experiment owner |
| R-03 | High | Member exit/removal semantics | Spec FR-007; A NC-4/NC-6; B AD-15 | Decide aggregate vs pairwise balance and Pending-expense handling. | Yes |
| R-04 | High | Former-member data visibility | Spec NFR-003 and Edge Cases; A NC-3; B SRC-02/AD-17 | Define access to reports, receipts, expenses and payments after leaving. | Yes |
| R-05 | High | Report reconciliation and totals | Spec FR-036/FR-037, SC-005/SC-007; A NC-8/NC-10; B SRC-04/AD-18 | Approve total paid/received, status filtering and period reconciliation. | Yes |
| R-06 | High | Local installation limits collaboration | Spec local-use assumption; A plan; B architecture §1 | Confirm whether one shared computer supports intended approval/notification workflows. | Yes |
| R-07 | Medium | HALF_EVEN vs split-floor interpretation | Constitution Principle IV; FR-011–FR-013; A R-07; B SRC-03 | Confirm rules coexist as described or amend constitution. | Human reviewer |
| R-08 | Medium | Storage engine not selected | A research R-10; B architecture §8.1 | Compare deployment, transaction durability, concurrent access and sharing. | Technical team |
| R-09 | Medium | Mistaken payments/approvals lack correction workflow | B DQ-08; A research RK-5 | Define auditable correction/reversal without changing immutable originals. | Yes |
| R-10 | Medium | Receipt signature does not guarantee safe decoding | B R-15; A receipt validation contracts | Add corrupt-image, oversized-dimension and memory-safety tests. | Technical reviewer |
| R-11 | Medium | Runtime session model vs concurrent decision behavior | B AD-24 and V-14; A R-12 | Define whether multiple instances/users are supported. | Technical team |
| R-12 | Medium | FR-040/FR-041 have no CR source IDs | A NC-12; B SRC-05 | Add justified traceability links or classify as derived system requirements. | Team |
| R-13 | Medium | NFR-007 registration/Home ambiguity | Spec NFR-007 and Story 1; B SRC-09 | Clarify registration reachability for visitors. | Yes |
| R-14 | Medium | Payment maximum not explicit in FR-030 | A NC-11; B SRC-08 | Confirm whether $1,000,000 limit applies to payments. | Yes |
| R-15 | Medium | Completion reports missing | Both output directories | Add reports including skipped artifacts and final gate status. | Authors |
| R-16 | Low | Account enumeration through lockout messaging | A research RK-7; B R-09 | Document accepted trade-off and test generic wrong-credential messages. | Security reviewer |
| R-17 | Low | Admin succession is invented behavior | B AD-16 | Do not implement without approval; keep open as Set A does. | Yes |
| R-18 | Low | Edit/delete notification policy unspecified | A NC-9; B AD-14/DQ-06 | Decide whether edits reset notifications and deletion sends notice. | Yes |

---

## 9. Reconciliation Recommendations

### 9.1 Retain from Set A

- Requirements-first structure and traceability matrix.
- Explicit distinction between CR, FR/NFR, ID, PD and unresolved questions.
- Conservative treatment of membership exit and notification questions.
- PlantUML location under `docs/uml/`.
- Quickstart separation of checks runnable today from future implementation tests.
- Clear warning that no build, test or application run has occurred.

### 9.2 Retain from Set B

- `LedgerReader` as shared boundary for ledger queries.
- `BalanceCalculator` and `ReportCalculator` as pure, testable domain logic.
- Explicit `Session` arguments and centralized `AccessPolicy`.
- `NotificationDispatcher` as sole notification creation mechanism.
- `expectedVersion` and conditional updates for expense edit/approval races.
- Append-only payment and approval-decision repository contracts.
- Two-phase overpayment confirmation tied to amount shown.
- Report reconciliation concept `opening + period + later = current`, pending customer approval.
- More detailed risk and AD decision registers.

### 9.3 Revise or reject

| Item | Recommendation |
|---|---|
| OC-1 | Neither set can resolve it. Obtain written decision first. |
| B AD-15 | Keep as proposal; do not make pairwise-zero and Pending-expense exit restrictions binding yet. |
| B AD-16 | Do not adopt admin succession until approved. |
| B AD-14 | Keep as proposal; confirm edit/delete notification behavior. |
| B AD-18 | Preferred report design candidate, but obtain approval for totals/filter semantics. |
| A SQLite / B H2 | Keep both as alternatives until deployment and durability needs are confirmed. |
| B PlantUML location | Move adopted diagrams into constitution-compliant location. |
| A notification UML | Correct optional expense relationship. |
| B validation ordering | Align contracts, design and sequence diagrams. |
| B AD-24 | Clarify single-session restriction against concurrency requirement. |

### 9.4 Recommended merged documentation baseline

After human decisions, use a structure such as:

```text
specs/001-splitsmart-expense-sharing/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   ├── README.md
│   ├── service-contracts.md
│   ├── repository-contracts.md
│   └── ui-interactions.md
└── quickstart.md

docs/
├── uml/
│   ├── domain-class.puml
│   ├── service-class.puml
│   ├── layer-component.puml
│   ├── expense-approval-sequence.puml
│   ├── payment-settlement-sequence.puml
│   └── notification-sequence.puml
└── ai-comparison/
    ├── claude-code/
    └── review/
```

Keep original unmodified AI outputs under `ai-comparison` as experiment evidence. The accepted design should be a separately reviewed artifact, not a silent rewrite of either AI's work.

---

## 10. Scoring and Readiness Verdict

Scores assess design artifact quality, not implemented software quality.

| Criterion | Set A | Set B |
|---|---:|---:|
| Requirements coverage | 4.5 / 5 | 4.5 / 5 |
| Constitution compliance | 4.0 / 5 | 3.5 / 5 |
| Domain correctness | 4.0 / 5 | 3.5 / 5 |
| Architecture quality | 4.0 / 5 | 4.5 / 5 |
| Design completeness | 4.0 / 5 | 4.5 / 5 |
| Traceability | 4.5 / 5 | 4.5 / 5 |
| Internal consistency | 3.5 / 5 | 3.0 / 5 |
| Review readiness | 3.5 / 5 | 3.5 / 5 |

### Set A — Spec Kit

**Verdict: Conditionally ready — corrections required.**

A sound starting point for human review. Strengths are conservative requirements interpretation, traceability, and canonical UML placement. Correct its diagram relationship mismatch and review transaction sequencing.

### Set B — Claude Code

**Verdict: Conditionally ready — corrections required.**

A strong source of technical design improvements, particularly service decomposition and reconciliation. Correct validation-order inconsistency, session/concurrency mismatch, and UML location before adoption.

**Neither set is ready for task generation or implementation approval.** The Critical OC-1 issue blocks plan approval under the constitution. High-priority report and membership questions also affect core behavior. A high average cannot compensate for an unresolved customer requirement conflict.

This is an AI review, **not Principle VII human approval**.

---

## 11. Human Reviewer Sign-off Checklist

- [ ] Written customer/instructor decision recorded for OC-1.
- [ ] Confirm whether Android/iOS requirements in the separate lab handout apply; UserRequirement.md remains authoritative unless formally clarified.
- [ ] Confirm former-member visibility against NFR-003.
- [ ] Decide pairwise versus aggregate balance rules for leaving/removal.
- [ ] Decide what happens to Pending expenses when a participant leaves.
- [ ] Decide admin succession and last-member departure.
- [ ] Approve report totals, status filtering and date-period reconciliation.
- [ ] Confirm whether total paid/received means payments only or includes expenses paid on behalf of others.
- [ ] Confirm 0% participant leftover-cent behavior.
- [ ] Confirm edit/delete notification behavior.
- [ ] Confirm payment correction/reversal policy.
- [ ] Confirm payment amount maximum.
- [ ] Confirm storage engine and shared-installation behavior.
- [ ] Reconcile authorization and transaction sequencing.
- [ ] Resolve single-session/concurrency design.
- [ ] Review all domain, service and sequence diagrams.
- [ ] Render and syntax-check every PlantUML file.
- [ ] Complete FR-to-CR-to-design-to-task-to-test traceability.
- [ ] Run JUnit 5 tests and `mvn clean verify` after implementation exists.
- [ ] Record reviewer name and date.

**Reviewer:** ____________________  
**Review date:** ____________________  
**Accepted design baseline / commit:** ____________________  
**Outstanding issues:** ____________________

---

## Corrections Required Before Spec Kit Task Generation or Implementation

1. Obtain written resolution of OC-1.
2. Resolve former-member privacy and group-exit rules.
3. Approve report reconciliation and total definitions.
4. Select and justify storage/deployment model.
5. Adopt Set B's stronger service decomposition selectively, without adopting unapproved AD decisions.
6. Fix Set A notification UML relationship.
7. Fix Set B validation-order and concurrency inconsistencies.
8. Put adopted UML files in constitution-compliant directory and validate syntax.
9. Add missing completion reports.
10. Have a named human reviewer sign off on the merged plan and design.

**Bottom line:** Set A is the safer starting baseline; Set B contributes worthwhile technical improvements. The best result is a reviewed synthesis—not a wholesale win for either tool.
