# SplitSmart Architecture

**Baseline status:** Draft — Reconciliation Incomplete. Conditional on [DEC-01](../../specs/001-splitsmart-expense-sharing/decisions/decision-log.md#dec-01-platform-oc-1).
**Requirements:** [spec.md](../../specs/001-splitsmart-expense-sharing/spec.md) | **Decisions:** [architecture-decisions.md](architecture-decisions.md) | **Diagram:** [component.puml](../uml/component.puml)

## 1. Read this first: OC-1

**The customer asked for a primarily web-based product (CR-10). This architecture delivers a Java Swing desktop application (ID-03) and does not satisfy CR-10.** No written acceptance exists, so the baseline is a conditional draft. A GUI-independent service layer keeps a later web client possible. It does not make this MVP web-based.

Nothing here is designed for a browser, a server, or mobile devices. If DEC-01 requires web now, stop and amend the constitution first; §12 shows what survives.

## 2. System context

| Element | In scope? | Notes |
|---|---|---|
| Visitor, registered user, group member, group admin | Yes | People at one computer, taking turns |
| SplitSmart desktop application | Yes | One Java process |
| Local SQLite database file | Yes | In the data folder; holds receipts too |
| Web browser, mobile app, email, cloud storage, other computers | **No** | No external system exists in the MVP |

**Runtime and deployment (DEC-03).** One JVM process, one exclusive database connection, one signed-in user at a time. The data folder is `${user.home}/.splitsmart`, overridable with `splitsmart.data.dir`. A second launch cannot get the exclusive lock, so it shows a message and exits. See the [deployment diagram](../uml/deployment.puml).

**Practical collaboration limit.** Roommates on separate computers cannot share data. On one computer, people see each other's activity at their next login. Notifications therefore cannot arrive from another person during a session. Every FR can pass while this limit remains, which is why DEC-03 and DEC-01 go to the customer.

## 3. Layers and dependency direction

```text
app ──creates──▶ ui, service implementations, repository.sqlite

ui ──▶ service ──▶ domain
          │           ▲
          ▼           │
      repository ─────┘
          ▲
          │ implements
   repository.sqlite ──▶ SQLite file
```

| Package (`com.splitsmart.*`) | Responsibilities | Public boundary | May depend on | Must never depend on |
|---|---|---|---|---|
| `domain` | Entities, value objects, invariants, pure calculators | Classes in [data-model.md](../../specs/001-splitsmart-expense-sharing/data-model.md) | JDK only | `service`, `repository`, `ui`, JDBC, `javax.swing`, `java.awt`, `javax.imageio` |
| `service` | Use cases, authorization, parsing, validation orchestration, transaction scope, notifications | [Service contracts](../../specs/001-splitsmart-expense-sharing/contracts/service-contracts.md) | `domain`, `repository` interfaces, `java.time.Clock`, `javax.crypto` | `ui`, `repository.sqlite`, `java.sql`, any GUI type |
| `repository` | Persistence interfaces and `TransactionRunner` | [Repository contracts](../../specs/001-splitsmart-expense-sharing/contracts/repository-contracts.md) | `domain` | `service`, `ui`, any GUI or SQL type |
| `repository.sqlite` | SQL, row mapping, schema and migrations | Implements `repository` | `repository`, `domain`, `java.sql`, SQLite driver | `service`, `ui`, any GUI type |
| `ui` | Swing panels, controllers, off-EDT scheduling, image decoding for display | [UI contracts](../../specs/001-splitsmart-expense-sharing/contracts/ui-interactions.md) | `service` interfaces and views; immutable `domain` values and enums | `repository`, `repository.sqlite`, JDBC, entity mutation, business rules |
| `app` | `SplitSmartApp` and `AppConfig`: build the object graph | `main` | All of the above | Business logic |

**Rules:** Every collaborator arrives through a constructor. There are no singletons, service locators, or static mutable state. Swing and AWT types stay in `ui`. A JUnit source scan (ARCH-01) fails the build on any violation.

## 4. Persistence, transactions, and concurrency

**Storage (DEC-05).** One SQLite file with `STRICT` tables, `foreign_keys=ON`, `synchronous=FULL`, `journal_mode=DELETE`, `locking_mode=EXCLUSIVE`. Money is stored as integer cents and percentages as integer hundredths; values become `BigDecimal` inside `Money` at the repository boundary.

**Transactions.** Each mutating service call is one `TransactionRunner.inTransaction` unit. Commit on return, roll back on any exception. Nested calls join the outer one. Reads that assemble several figures use `readOnly`, so the totals on one screen come from one snapshot.

**Canonical order (DEC-26).** PREPARE → BEGIN → AUTHORIZE → VALIDATE → GUARD → EFFECT → COMMIT. Slow work (password hashing, reading a receipt) happens in PREPARE, outside the transaction. Sequence diagrams and contracts follow this order.

**Errors.** Repositories raise `RepositoryException` and `DuplicateKeyException`. Services translate them. `ui` shows only typed `ServiceException`s, and unexpected failures reach a default handler that logs detail and shows a generic message.

**Concurrency (DEC-04).** One background thread and one connection serve all service calls, so calls run one at a time. Expense state changes still use `expectedVersion` and conditional updates, and a unique rule allows one decision per expense. Simultaneous users are not a supported runtime scenario. The two-actor test is a service-level simulation.

**Balances.** Never stored. `LedgerReader` reads `LedgerEntry` projections and `BalanceCalculator` folds them. A Pending or Rejected expense cannot move a balance because the query selects Approved rows and `Expense.ledgerEntries()` returns nothing otherwise.

## 5. Authentication, session, and authorization

| Concern | Design | Requirement |
|---|---|---|
| Password storage | PBKDF2-HMAC-SHA256, per-user 16-byte random salt, 600,000 iterations to start; algorithm and iterations stored with the hash | FR-004, NFR-002 |
| Password handling | `char[]` from `JPasswordField`; cleared after use; never logged | FR-004 |
| Login failure | One message for wrong username or password; an unknown username still runs one hash; constant-time comparison | FR-002, DEC-23 |
| Lockout | `failedLoginCount` and `lockedUntil` on `User`; failure state commits **before** the exception is raised, or rollback would erase it | NFR-002, DEC-23 |
| Session | `Session` can be created only inside `service`; held in memory by `SessionController`; invalidated at logout. No idle timeout (DEC-29) | FR-002 |
| Authorization | Every operation takes `Session` and checks `AccessPolicy` inside its transaction. UI hiding is only a convenience | FR-003, FR-006, FR-022, NFR-003 |
| Visibility | Not visible and not found give the same `NotFoundException`. `AccessDeniedException` means visible but not permitted | NFR-003, DEC-26 |
| Former members | `AccessPolicy.visibleScope` limits them to items they were part of | DEC-07 |

## 6. Receipts

Bytes live in `expense_receipt`, separate from `expense`, so list and report queries never load them, and they commit with the expense. `service` checks size, signature, and trailer without AWT. `ReceiptViewerDialog` in `ui` checks declared dimensions, decodes off the EDT, and reports failure as a message (DEC-25).

## 7. Notifications and their limits

`NotificationDispatcher` is the only creator of notifications and runs inside the triggering transaction, so a saved expense cannot lose its notifications (SC-006). "Needs your approval" is derived on each read. Delivery is in-app (ID-08). The UI refreshes the count at login and on returning to Home, with no polling, because no one else can act during a session. Email and push are Post-MVP (FR-018).

## 8. Reports and consistency

`ReportService` gathers rows and ledger entries in one read snapshot, then `ReportCalculator` computes the result with no I/O. Totals follow BR-20 and reconciliation follows BR-21. Reports reflect data at generation time and are not stored, so a later approval or backdated entry can change an earlier period's figures (DEC-14).

## 9. Audit, logging, and privacy

| Concern | Design |
|---|---|
| Immutable records | `ApprovalDecision` and `Payment` repositories have insert and read only. Database triggers refuse update and delete |
| Actor and time | Stored on each record. Time comes from the injected `Clock` as UTC instants |
| Logs | `System.Logger` to a rotating file in the data folder. Event names, IDs, and error causes only. **Never** passwords, hashes, salts, receipt bytes, descriptions, notes, or rejection reasons. Logs are not the audit record |
| Limit | The data file is not encrypted, so anyone with file access can read or edit it. These controls hold through the application only (DEC-29) |

## 10. Quality attributes: mechanism versus evidence

A mechanism below is a design intention. **None of these NFRs is met until its test passes.**

| NFR | Mechanism | Evidence today |
|---|---|---|
| NFR-001 | `Money`, `SplitAllocator`, derived balances | Worked examples recalculated by a scratch script on 2026-11-05. No implementation |
| NFR-002 | Salted hash, persisted lockout | None |
| NFR-003 | `AccessPolicy` at the service boundary | None |
| NFR-004 | Indexes, scoped queries, off-EDT calls, receipts excluded from lists | **Unmeasured** |
| NFR-005 | SQLite atomic commit, `synchronous=FULL` | Vendor documentation only |
| NFR-006 | Append-only repositories, triggers | None |
| NFR-007 | Field errors, navigation table | None |
| NFR-008 | Keyboard conventions | None |
| NFR-009 | Pure calculators, fakes, injected `Clock` | None |

## 11. Build and runtime constraints

Java 21, Maven single module with explicit dependency versions, Swing, JUnit 5 through Surefire, and the `org.xerial:sqlite-jdbc` driver. These remain conditional on DEC-01 and the constitution. No `pom.xml`, source, or tests exist yet.

## 12. Post-MVP extension seams

These are not MVP features. Nothing is built for them.

| FR | Seam | What it would still require |
|---|---|---|
| FR-009 archive | `Group.status` has a reserved value | Transition and guard on expense creation |
| FR-018 external notifications | `NotificationDispatcher` is the single creation point | Delivery after commit, user preferences |
| FR-025 multi-level approval | `Expense` owns decision logic | Relax the unique decision rule and "one decision settles"; a real redesign |
| FR-038 saved reports, export | `ReportFilter` is a value | Persistence and a file writer |
| FR-039 web | `domain` and `service` have no GUI types; repositories are interfaces | A web UI, hosting, multi-user storage, request-scoped sessions, a real concurrency review, and web security work. Reuse is likely but not free |

## 13. Diagrams

[use-case](../uml/use-case.puml), [component](../uml/component.puml), [domain-class](../uml/domain-class.puml), [service-class](../uml/service-class.puml), and the rest of the [UML index](../uml/README.md).
