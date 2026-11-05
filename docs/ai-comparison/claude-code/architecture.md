# SplitSmart Architecture Proposal

| | |
|---|---|
| **Status** | AI-generated draft. Not reviewed. Requires named human review under Constitution Principle VII. |
| **Author** | Claude Code (independent experiment; Spec Kit output not inspected) |
| **Baseline** | Commit `5521780` on `main`, 2026-11-04 |
| **Feature** | `001-splitsmart-expense-sharing` |

**How to read labels in this set**

| Label | Meaning | Source |
|---|---|---|
| CR-nn | Customer requirement | `UserRequirement.md`, IDs in the constitution |
| FR-nnn / NFR-nnn | Functional / non-functional requirement | `spec.md` |
| ID-nn | Team implementation decision, binding on this design | Constitution |
| OC-n | Open conflict registered in the constitution | Constitution |
| **AD-nn** | Architecture/design decision **proposed by this document**. Not a customer requirement and not yet accepted. | This document |
| SRC-nn, DQ-nn, A-nn, R-nn | Source conflict, design question, assumption, risk | [open-questions-and-risks.md](open-questions-and-risks.md) |
| `NEEDS CLARIFICATION` | No source answers this. Any behavior described is a labeled proposal, not a customer answer. | |

---

## 1. OC-1: read this first

**CR-10 asks for a primarily web-based product. ID-03 selects a Java Swing desktop MVP. The proposed architecture delivers a Swing desktop application and does not satisfy CR-10.** This is a deviation, not a reinterpretation of CR-10, and it stays open until the customer or instructor accepts it in writing.

Three consequences follow, and reviewers should weigh them directly:

1. **The constitution blocks plan approval on this.** Its Sync Impact Report says confirmation "MUST be recorded before the first plan is approved." No such record exists in the repository, so this design cannot be approved as the plan until it does.
2. **The deviation costs more than a change of platform.** The spec's "Local use" assumption means one shared installation. Roommates on separate computers cannot see each other's expenses. They would have to take turns on one machine, which weakens the practical value of CR-05 (notifications) and CR-06 (approval) even though each FR can pass its tests.
3. **The handout may widen the conflict.** `Lab_6_Requirement.docx` quotes the customer's platform line as "primary web-based *and also comes with app that can be run on Android and IOS*." `UserRequirement.md` stops after "primary web-based." See SRC-01. This design follows `UserRequirement.md`, as the constitution directs, and does not resolve the difference.

The design keeps domain and service logic free of Swing so a later web client could reuse them (§9). No web deliverable is designed or authorized here.

---

## 2. Goals, scope, and constraints

### 2.1 Goals

| Goal | Driven by |
|---|---|
| Every money figure is exact to the cent and reconciles everywhere it appears | NFR-001, FR-029, FR-037 |
| Only Approved expenses and recorded payments can move a balance | FR-020, FR-026, FR-027, FR-031 |
| Every business rule can be tested with no display | NFR-009, Principle V |
| Approval decisions and payments cannot be altered | FR-024, NFR-006 |
| A user never sees another group's data | FR-003, NFR-003 |
| Business logic survives replacement of the UI | Principle III, OC-1 |
| Every class traces to an FR and every FR to a CR | Principle II |

### 2.2 Scope

- **In the MVP:** FR-001–FR-008, FR-010–FR-017, FR-019–FR-024, FR-026–FR-037, FR-040, FR-041.
- **Post-MVP, visible but not designed in detail:** FR-009, FR-018, FR-025, FR-038, FR-039. §10 records what each would change. No classes are added for them, because Principle II treats untraced production work as scope creep.
- **Out of this exercise:** code, tests, tasks, migrations, build files. Principle II's forward trace to `tasks.md` is therefore incomplete by design (SRC-11).

### 2.3 Binding constraints

| Constraint | Source |
|---|---|
| Java 21 | ID-01 |
| Apache Maven with committed `pom.xml`; explicit dependency versions; `mvn clean verify` passes from clean checkout | ID-02 |
| Java Swing desktop client; GUI work on the Event Dispatch Thread | ID-03 (see OC-1) |
| JUnit 5 through Surefire | ID-04 |
| PlantUML `.puml` sources | ID-05 |
| `BigDecimal`, scale 2, `HALF_EVEN`, one money abstraction | ID-06 |
| Layered OO design with `domain`, `service`, `repository`, `ui` | ID-07, Principle III |
| In-app notifications | ID-08 |

### 2.4 Quality attributes

| Attribute | Requirement | Architectural response |
|---|---|---|
| Accuracy | NFR-001 | `Money` value object (AD-04); balances derived from immutable records, never stored (AD-06) |
| Security | NFR-002, FR-004 | Salted PBKDF2 and persisted lockout (AD-12) |
| Privacy | NFR-003, FR-003 | Authorization at the service boundary through `AccessPolicy` (AD-03) |
| Performance | NFR-004 | Indexed queries, off-EDT work, no receipt bytes in list queries (§8.5). **Not yet measured.** |
| Reliability | NFR-005, FR-040 | Atomic transactions in an embedded database with synchronous commit (AD-07, AD-09) |
| Auditability | NFR-006, FR-024 | Append-only repositories (AD-11) |
| Usability | NFR-007 | Field-level errors from services (AD-02, AD-20); Home-centered navigation |
| Accessibility | NFR-008 | Keyboard conventions applied to every screen (AD-19) |
| Testability | NFR-009 | Pure domain calculators, constructor injection, injected `Clock` |

---

## 3. Inputs inspected

| Input | Result |
|---|---|
| `UserRequirement.md` | Read in full |
| `.specify/memory/constitution.md` (v1.0.0) | Read in full |
| `specs/001-splitsmart-expense-sharing/spec.md` | Read in full, including 2026-10-29 clarifications |
| `specs/001-splitsmart-expense-sharing/checklists/requirements.md` | Read in full |
| `.specify/templates/plan-template.md` | Read in full; its Technical Context, Constitution Check, Project Structure, and Complexity Tracking sections appear here as §4, §5, §6, §13 |
| `Lab_6_Requirement.docx` | Text extracted and read; revealed SRC-01 |
| `docs/prompts/architecture-design-comparison-prompts.md` | Read in full |
| **Missing:** `pom.xml`, `src/`, tests, any `.puml`, `docs/uml/`, `CLAUDE.md`, `AGENTS.md`, root `.gitignore` | Confirmed absent when this work began. No build or source exists to constrain the design. |
| **Spec Kit design output** | **Not opened or used.** When this work began, the feature directory held only `spec.md` and `checklists/`. Before it finished, `git status` listed new untracked paths with Spec Kit's expected names in that directory and in `docs/uml/`. Only those path names were seen (SRC-14). |

---

## 4. Technical context

| Item | Value | Status |
|---|---|---|
| Language | Java 21 | ID-01 |
| Build | Apache Maven | ID-02 |
| UI | Java Swing | ID-03, OC-1 |
| Testing | JUnit 5 | ID-04 |
| Storage | Embedded H2 database through JDBC | **AD-07 proposal; no source specifies storage** |
| Password hashing | JDK `PBKDF2WithHmacSHA256` | AD-12 proposal |
| Logging | `System.Logger` over `java.util.logging` | AD-21 proposal |
| Target platform | Desktop JVM on a student laptop | Follows from ID-03; the customer asked for web (OC-1) |
| Scale | 50 users, 50 groups, 10,000 expenses | NFR-004 |
| Toolchain on the authoring machine | Java, Maven, and PlantUML **not found** on 2026-11-04 | See [quickstart.md](quickstart.md) |

---

## 5. Constitution Check

Evaluated after design. These results are the author's self-assessment and need human confirmation.

| Principle | Result | Evidence or gap |
|---|---|---|
| I. Customer requirements are the source of truth | Pass, with OC-1 and SRC-01 open | `UserRequirement.md` untouched; every AD labeled as team-proposed; deviation stated in §1 |
| II. Requirement traceability | Partial by design | FR→CR→design complete in [design.md §11](design.md#11-traceability-matrix). No `tasks.md` or tests, because this exercise forbids them. FR-040 and FR-041 cite no CR in the spec (SRC-05). |
| III. OO design with GUI separation | Pass | §6; forbidden imports enforced by AD-22 |
| IV. Exact money with BigDecimal | Pass, with SRC-03 flagged for review | AD-04 and [design.md §3](design.md#3-money-and-the-split-rule) |
| V. JUnit 5 | Planned only | Strategy in [quickstart.md](quickstart.md); nothing written, as instructed |
| VI. PlantUML | Pass on content; location deviates | Prompt requires `docs/ai-comparison/claude-code/uml/`; the constitution requires `docs/uml/` or the feature directory. Move on adoption (SRC-10). Diagrams not rendered because PlantUML is unavailable. |
| VII. Human review | **Pending** | Nothing here is approved. Review must be recorded by a named person. |
| OC-1 restated | Yes | §1 |

---

## 6. Component and layer architecture

The system is one layered Java application in a single Maven module, running as one process (AD-01). See [uml/layer-component.puml](uml/layer-component.puml).

```text
         ┌───────────────────────────────────────────┐
         │ app  composition root: wires everything   │   AD-01
         └───┬───────────┬───────────┬───────────────┘
             ▼           │           ▼
   ┌──────────────┐      │   ┌───────────────────────┐
   │ ui (Swing)   │      │   │ repository.jdbc (H2)  │
   └──────┬───────┘      │   └───────────┬───────────┘
          ▼              ▼               │ implements
   ┌─────────────────────────┐           ▼
   │ service                 │──▶ ┌──────────────────┐
   │ use cases, authorization│    │ repository       │
   └───────────┬─────────────┘    │ interfaces only  │
               ▼                  └────────┬─────────┘
   ┌─────────────────────────┐             │
   │ domain                  │◀────────────┘
   │ entities, value objects │
   │ pure calculators        │
   └─────────────────────────┘
```

### 6.1 Proposed source layout

```text
src/main/java/com/splitsmart/
├── app/                 SplitSmartApp (composition root, main)
├── domain/              Entities, value objects, SplitAllocator, BalanceCalculator, ReportCalculator
├── service/             Service interfaces, Default* implementations, commands, views, errors
├── repository/          Repository interfaces, TransactionRunner
│   └── jdbc/            H2 implementations
└── ui/                  Panels, controllers, UiTaskRunner, keyboard helpers
src/test/java/com/splitsmart/   Mirrors main (future; not created here)
```

The base package name `com.splitsmart` is a proposal under AD-01. `app` and `repository.jdbc` go beyond the four named packages, which Principle III allows ("at least these packages").

### 6.2 Responsibilities and allowed dependencies

| Layer | Owns | May depend on | Must never depend on |
|---|---|---|---|
| `domain` | Entities with invariants, `Money`, split allocation, balance and report calculation | JDK only (`java.math`, `java.time`, `java.util`) | `service`, `repository`, `ui`, JDBC, `javax.swing`, `java.awt`, `javax.imageio` |
| `service` | Use cases, authorization, input parsing, transaction scope, orchestration, notification creation | `domain`, `repository` interfaces, `java.time.Clock`, `javax.crypto` | `ui`, `repository.jdbc`, any GUI type |
| `repository` | Persistence contracts, including append-only rules | `domain` | `service`, `ui`, any GUI type |
| `repository.jdbc` | SQL and row mapping | `repository`, `domain`, `java.sql`, H2 driver at runtime | `service`, `ui`, any GUI type |
| `ui` | Swing panels, event handling, rendering, off-EDT scheduling, image decoding for display | `service` interfaces, commands and views; immutable `domain` value objects and enums | `repository`, `repository.jdbc`, JDBC, entity mutation, business rules |
| `app` | Object graph construction | All of the above | Business logic |

**Receipts and AWT.** Decoding an image with `javax.imageio` yields `java.awt.image.BufferedImage`, which is forbidden outside `ui`. The service layer therefore validates receipts by file signature and size only; `ui` decodes them for display (AD-08).

### 6.3 Interfaces at the boundary

| Boundary | Interfaces | Contract |
|---|---|---|
| `ui` → `service` | `AccountService`, `GroupService`, `ExpenseService`, `ApprovalService`, `BalanceService`, `PaymentService`, `NotificationService`, `ReportService` | [contracts/service-contracts.md](contracts/service-contracts.md) |
| `service` → `repository` | `UserRepository`, `GroupRepository`, `MembershipRepository`, `ExpenseRepository`, `ApprovalDecisionRepository`, `PaymentRepository`, `NotificationRepository`, `ReceiptRepository`, `LedgerQueryRepository`, `TransactionRunner` | [contracts/repository-contracts.md](contracts/repository-contracts.md) |
| `service` internal collaborators | `AccessPolicy`, `LedgerReader`, `NotificationDispatcher`, `PasswordHasher`, `ExpenseDraftValidator`, `FieldFormats` | [design.md §5](design.md#5-services) |

All collaborators arrive through constructors. There are no singletons, no service locator, and no static mutable state, which keeps every service replaceable in tests (Principle III).

---

## 7. Runtime collaboration

Each UI action follows the same path:

1. A Swing **panel** raises an event on the EDT and the **controller** reads the raw field values.
2. The controller gives the service call to **`UiTaskRunner`**, which runs it on a background thread using `SwingWorker` (ID-03).
3. The **service** checks authorization through `AccessPolicy`, parses and validates input, and opens one transaction through `TransactionRunner`.
4. **Domain objects** enforce invariants and compute splits, balances, and report totals.
5. **Repositories** read and write within that transaction, and the transaction commits.
6. The service returns an immutable **view**, an outcome, or a typed error.
7. Back on the EDT, the controller tells the panel to render it. On `ValidationException`, the form keeps all input and shows each field's error (FR-015).

Sequence diagrams: [expense creation and approval](uml/expense-creation-approval.puml), [payment settlement](uml/payment-settlement.puml), [notifications](uml/notification.puml).

**Single instance, single session (AD-24).** One process owns the database, and one person is signed in at a time. Consequences:
- Notifications cannot arrive from another person while someone is signed in. Refreshing the unread count at login and on each navigation satisfies FR-019 without polling.
- The "two users act on the same pending expense" edge case still has to work. It can occur through a stale screen, and a future multi-client deployment would hit it for real. AD-10 enforces it at the data layer, and it can be tested with two sessions and two threads against the services.

---

## 8. Cross-cutting concerns

### 8.1 Persistence boundary and proposed storage

Nothing in the sources specifies storage. FR-040 and NFR-005 require only that data survives restarts and unexpected exits. **The following is a proposal (AD-07).**

- Embedded **H2** in file mode with hand-written JDBC and no ORM. H2 is pure Java and its `DECIMAL(p,2)` maps directly to `BigDecimal`, so money needs no conversion.
- Commits flush synchronously (`WRITE_DELAY=0`).
- Data directory defaults to `${user.home}/.splitsmart`, overridable by the system property `splitsmart.data.dir`. If several OS accounts must share one installation, the property must point to a shared location (DQ-14).
- Nothing outside `repository.jdbc` may mention SQL, H2, or JDBC.

H2's documentation does not guarantee that committed transactions survive power loss. NFR-005 covers "normal or unexpected application exit," so a process crash is in scope and power loss is a residual risk (R-03).

### 8.2 Security

| Concern | Design | Requirement |
|---|---|---|
| Password storage | PBKDF2-HMAC-SHA256 with a per-user 16-byte random salt; algorithm and iteration count stored so they can be raised later | FR-004, NFR-002 |
| Password handling | `char[]` from `JPasswordField`, cleared after hashing; never logged | FR-004 |
| Login failure | One message for wrong username or wrong password; unknown usernames still run a hash to reduce timing differences; hash comparison is constant-time | FR-002 |
| Lockout | Persisted count and `lockedUntil`, so restarting the app does not bypass it; 5 consecutive failures block for 5 minutes; attempts during a lock neither count nor extend it; success resets | NFR-002 |
| Authorization | Every service method takes a `Session` and checks `AccessPolicy` before doing work | FR-003, FR-006, FR-022, NFR-003 |
| Session | `Session` has a package-private constructor, so only `service` can issue one; held only in memory; on logout the UI discards the session and all cached views | FR-002 |

**Limit of these controls.** Authorization is enforced by the application. Anyone with file access to the data directory can open the database and read names, amounts, and receipts, or alter records. There is no server and no safe place to keep an encryption key on a shared desktop install (R-02). A web deployment would address this; the desktop MVP does not.

**Username enumeration.** Scenario 1.2 ("username is taken") and scenario 1.6 ("account is temporarily locked") both reveal that an account exists. The spec requires both messages, so this design keeps them and logs the residual exposure (R-09).

### 8.3 Privacy

- All reads are scoped by `AccessPolicy`, not by what the UI chooses to show.
- A group the user does not belong to returns the same `AccessDeniedException` whether or not it exists.
- Former members: FR-003 and NFR-003 appear to conflict with the spec edge case that says history stays visible in a removed user's reports (SRC-02). **AD-17 proposes** that former members see only items they were personally part of, read-only, and nothing else from that group. `NEEDS CLARIFICATION`.

### 8.4 Audit, errors, and logging

**Audit (AD-11).** `ApprovalDecisionRepository` and `PaymentRepository` expose insert and read operations only, so application code has no means of altering these records. Each record stores actor and timestamp. Expenses store creator, timestamps, and a version; memberships store who added and who ended them. Direct database edits remain possible (R-02).

**Errors (AD-20).** Services throw a sealed `ServiceException` hierarchy (`ValidationException`, `AuthenticationFailedException`, `AccountLockedException`, `AccessDeniedException`, `NotFoundException`, `ConflictException`, `BusinessRuleException`, `PersistenceFailureException`). Overpayment is not an error, so it comes back as a `PaymentOutcome` value. Domain invariant failures (`DomainRuleViolation`) indicate a defect or a validation gap, and services translate them. Unexpected exceptions reach a default handler that logs the detail and shows a generic message, keeping internals off the screen. Details: [design.md §8](design.md#8-error-strategy).

**Logging (AD-21).** `System.Logger` writes to a rotating file in the data directory. Logs carry event names, entity IDs, and error causes. They must not carry passwords, hashes, salts, receipt bytes, descriptions, notes, or rejection reasons. Logs are operational and are not the audit record; the audit record is the immutable data itself.

### 8.5 Performance

NFR-004 allows 2 seconds per screen or report at 50 users, 50 groups, and 10,000 expenses on a typical student laptop. **No measurement exists.** Design tactics:

| Tactic | Purpose |
|---|---|
| All service calls off the EDT through `UiTaskRunner` | UI stays responsive, including during password hashing |
| Indexes on the query paths listed in [data-model.md §5](data-model.md#5-indexes-for-nfr-004) | Avoid table scans |
| Receipt bytes live in a separate table and load only on request | List and report queries never touch BLOBs |
| `LedgerQueryRepository` returns small `LedgerEntry` projections scoped to the viewer's groups | Balance calculation is linear in a bounded number of rows |
| `JTable` over an in-memory model of immutable rows | Report rendering does not build per-row components |

A benchmark against a seeded data set must confirm this before NFR-004 is called met (R-05). PBKDF2's iteration count must be tuned on the reference laptop, since login is also a screen. OWASP's guidance as the author recalls it is 600,000 iterations for PBKDF2-HMAC-SHA256; check the current figure at implementation.

---

## 9. Possible future web client (not part of the MVP)

This section records what today's design preserves. **It does not propose, schedule, or claim a web deliverable,** and FR-039 stays Post-MVP pending the OC-1 decision. No REST endpoints are defined.

| Design property | Why it would help | What would still be required |
|---|---|---|
| `domain` and `service` have no GUI dependency | A new UI module can call the same use cases | A web UI, its hosting, and its tests |
| Inputs are raw text commands and outputs are immutable views | Transport-neutral shapes | Serialization at a new boundary |
| `Session` is an explicit parameter, never ambient UI state | Works per request | Session issuance, expiry, and revocation across requests; `Session`'s package-private constructor would need a deliberate design |
| Repositories are interfaces | A server database can replace H2 | New implementations and a real concurrency review |
| Conditional status update, unique decision, and version checks (AD-10) | Remain correct under concurrent clients | Load testing |
| Authorization at the service boundary | The rules carry over | Transport security, CSRF and related web threats, server-side receipt handling |

Web delivery would also close the shared-computer limitation in §1 and the file-access exposure in §8.2. A desktop MVP keeps both open.

---

## 10. Post-MVP impact notes

Each is customer-derived and remains in the requirements inventory. Nothing below is built in the MVP.

| FR | What would change |
|---|---|
| FR-009 archive | `Group.status` already distinguishes ACTIVE and ARCHIVED because the spec's Key Entities list it. Add a transition, and guard expense creation. |
| FR-018 external notifications | `NotificationDispatcher` is the single creation point, so outbound delivery attaches there, after commit. |
| FR-025 multi-level approval | Replace "one decision decides" in `Expense`; relax the unique `approval_decision.expense_id` constraint; add a per-group policy. This is a real change to AD-10. |
| FR-038 saved reports and export | `ReportFilter` is already a value; add persistence and a file writer. |
| FR-039 web access | See §9. Depends on OC-1. |

---

## 11. Alternatives and trade-offs

| Topic | Chosen (proposal) | Alternative | Why not |
|---|---|---|---|
| Balance storage | Derive on read (AD-06) | Stored running-balance table | Second source of truth; a missed update or bug causes drift that violates NFR-001 and FR-029. Worth reconsidering only if the benchmark fails. |
| Storage engine | H2 embedded (AD-07) | SQLite | No native decimal type, so money would need integer or text mapping; ships a native library. Better multi-process story. |
| | | JSON or serialized files | No atomic multi-record commit, no indexes; NFR-004 and NFR-005 would need hand-built equivalents. |
| | | Derby | Workable; smaller community momentum. No decisive advantage over H2. |
| Data access | Hand-written JDBC | JPA/Hibernate | Dependency weight, and entity-mapping pressure on domain classes. The nine tables do not justify it. |
| Receipts | BLOB table (AD-08) | Files on disk beside the database | Atomicity needs orphan handling. Files scale better; R-06 tracks growth. The `ReceiptRepository` boundary keeps this reversible. |
| Split math | `BigDecimal` with explicit `DOWN` in `Money` (AD-04) | Integer cents internally | Simpler arithmetic but conflicts with the constitution's `BigDecimal` rule. |
| Auth context | Explicit `Session` argument (AD-03) | Ambient current-user holder | Hidden state, harder tests, and it would not carry over to request-based clients. |
| Validation | Services parse raw text (AD-02) | Swing input verifiers and formatted fields | Puts rules in the UI, breaking Principle III and FR-015's reporting of all fields at once. |
| Architecture | Layered monolith (AD-01) | Hexagonal or multi-module Maven | The constitution names these layers. More modules add ceremony; ArchUnit-style rules give the same enforcement (AD-22). |
| Client/server now | Not proposed | Local server plus Swing client | Scope growth without closing OC-1, because it is still not web-based. |

---

## 12. AD decision register

Every entry has status **Proposed**. None is a customer requirement or a constitution decision. Entries marked **†** depend on a `NEEDS CLARIFICATION` item and may change with the answer.

| ID | Decision | Rationale | Consequences | Traces to |
|---|---|---|---|---|
| AD-01 | Single-module layered application under `com.splitsmart` with the four required packages plus `app` (composition root) and `repository.jdbc` | Satisfies Principle III. `ui` must not see JDBC classes, so wiring needs its own home. | Dependency rules need automated enforcement (AD-22) | ID-07; all FRs |
| AD-02 | Services accept raw text commands and return immutable views; parsing and validation live in `service` | Keeps rules out of Swing; can report every bad field at once | Slight duplication between command and domain types; UI receives no mutable entities | FR-010, FR-015, FR-030, NFR-007, NFR-009 |
| AD-03 | Explicit `Session` parameter; authorization centralized in `AccessPolicy`, invoked by every service method | One place to audit privacy; testable with no UI | Every signature carries `Session` | FR-003, FR-006, FR-008, FR-021, FR-022, NFR-003 |
| AD-04 | `Money` is the only class that sets money scale or chooses a rounding mode: `HALF_EVEN` for normalization and an explicit `DOWN` for allocation floors; strict parser refuses over two decimals | Honors ID-06's "one place" and FR-011–FR-013's floor rule together (SRC-03) | Reviewer must accept this reading of the constitution | FR-010–FR-013, FR-029, FR-041, NFR-001 |
| AD-05 † | Pure `SplitAllocator`; shares persisted with position as a snapshot; FR-012 applied literally, including to 0% participants (DQ-01) | Deterministic and easy to test; preserves listed order | A 0% participant can receive a leftover cent | FR-011, FR-012, FR-013, FR-026 |
| AD-06 | Balances derived on read from Approved expense shares and payments by a pure `BalanceCalculator`; no balance table | One source of truth; FR-029 holds structurally because each pair stores one signed net | Each balance read runs a query and aggregation; depends on R-05 | FR-026–FR-029, FR-031, FR-037, NFR-001 |
| AD-07 | Embedded H2 in file mode, hand-written JDBC, synchronous commits, configurable data directory | Exact decimals, atomic commits, pure Java, no server | Exclusive process lock; file readable by anyone with OS access (R-02); power-loss limit (R-03) | FR-040, NFR-004, NFR-005 |
| AD-08 | Receipts in a separate BLOB table; signature and size checked in `service`; decoded only in `ui`; 5 MB = 5,242,880 bytes (A-07) | Atomic with the expense; keeps `java.awt` out of lower layers | A corrupt file with a valid signature passes save and fails at view time; database grows (R-06) | FR-014, FR-015, FR-040 |
| AD-09 | One use case = one transaction through `TransactionRunner`; notifications commit atomically with their trigger | No partial writes; a notification cannot be lost after its expense is saved | Connection bound to the thread inside `repository.jdbc`; hidden from `service` | FR-017, FR-023, FR-040, NFR-005 |
| AD-10 | First decision wins through a conditional status update, a unique decision per expense, and an `expectedVersion` check | Holds at the data layer, not just the UI; stale approval of an edited expense is refused | FR-025 would need rework; UI handles two conflict messages | FR-016, FR-021, FR-024 |
| AD-11 | Append-only repository interfaces for decisions and payments | Application code cannot alter audit records | Mistakes cannot be corrected in place (DQ-08) | FR-024, NFR-006 |
| AD-12 | JDK PBKDF2-HMAC-SHA256 with per-user salt and stored parameters; lockout state persisted on `User`; injected `Clock` | No added dependency; deterministic lockout tests; survives restarts | Iterations need tuning; a changed system clock can affect lockout (R-10) | FR-002, FR-004, NFR-002 |
| AD-13 | Overpayment as a two-phase `PaymentOutcome`: first call may return `OverpaymentWarning`; second must echo the owed amount the user saw; recheck in the transaction | Confirmation stays tied to current facts; rule lives in `service` | Slightly richer command | FR-031, FR-032 |
| AD-14 † | Notifications snapshot their display fields; the "needs your approval" flag is derived at read time; edits refresh snapshots and add any missing participant notification; deletes keep the row with its expense reference cleared | The flag cannot go stale; FR-017 stays true after edits. Edit and delete behavior is unspecified (DQ-06). | Some invented behavior on edit, flagged for confirmation | FR-016, FR-017, FR-019, FR-023 |
| AD-15 † | A member may exit a group only if every pairwise balance with them in that group is $0.00 **and** they are not creator, payer, or participant of any Pending expense there (DQ-02, DQ-03) | Otherwise debts can exist with no way to settle them, since FR-030 requires both parties to be current members | Stricter than FR-007's literal text | FR-006, FR-007, FR-030 |
| AD-16 † | If the admin leaves, the earliest-joined remaining active member becomes admin; if the admin was the last member, the group remains with no active members (DQ-04) | Satisfies both FR-006 ("any member MAY leave") and "exactly one admin" | Invented succession rule; may be rejected | FR-006, FR-008 |
| AD-17 † | Former members see only records they were personally part of (creator, payer, participant, payment party, or notification about those), read-only (SRC-02) | Reconciles FR-003/NFR-003 with the edge case most narrowly | May be stricter or looser than the customer wants | FR-003, FR-033, FR-034, NFR-003 |
| AD-18 † | Report money totals use Approved expenses and payments only; other statuses are listed and shown in a separate memo; net balances appear as opening + period + later = current (SRC-04) | Satisfies SC-005 and SC-007 under every filter | More report rows than FR-036 lists; semantics need confirmation | FR-034–FR-037 |
| AD-19 | Swing panels with passive rendering, one controller per feature area, `CardLayout` navigation, `UiTaskRunner`, and project-wide keyboard conventions | Keeps panels free of rules; keeps long work off the EDT | More classes than event handlers inside panels | FR-019, FR-028, FR-041, NFR-007, NFR-008 |
| AD-20 | Sealed unchecked `ServiceException` hierarchy with `FieldError` lists; outcomes that need user choice are return values | Exhaustive UI handling; accurate messages | UI must handle each type | FR-002, FR-007, FR-015, FR-032, NFR-007 |
| AD-21 | `System.Logger` file logging with a prohibited-content list | No extra dependency; protects privacy | Limited diagnostics | NFR-002, NFR-003 |
| AD-22 | Automated architecture rules using ArchUnit-style tests (exact library decided at implementation) covering forbidden GUI imports, dependency direction, and float/double money fields | Turns constitution gates into failing builds | One test-scope dependency | Principle III, Principle IV, Implementation gate |
| AD-23 | UUID-based typed ID records; `Instant` (UTC) for event times; `LocalDate` for business dates | Prevents ID mix-ups; IDs exist before insert; separates "when entered" from "what date" | UUIDs less readable in logs | FR-010, FR-024, FR-030, FR-035, FR-041, NFR-006 |
| AD-24 | One running instance with an exclusive database lock and one signed-in session; second launch shows a clear message | Simplest correct behavior under "Local use" | Rules out simultaneous use; makes the OC-1 limitation concrete | FR-019, spec Assumptions (Local use) |

---

## 13. Complexity tracking

| Departure | Why | Simpler alternative rejected because |
|---|---|---|
| Two packages beyond the four named (`app`, `repository.jdbc`) | `ui` cannot wire JDBC classes without breaking its dependency rule | Placing `main` in `ui` would import repository implementations into `ui`. Not a violation, since the constitution says "at least," but recorded for review. |
| Sealed `SplitRequest` hierarchy (`EqualSplit`, `PercentageSplit`) uses interface implementation, not class inheritance | Compiler-checked exhaustiveness | An enum plus nullable percentages allows invalid combinations |

No constitution principle is knowingly violated. The location deviation in Principle VI comes from the prompt's explicit output path (SRC-10).
