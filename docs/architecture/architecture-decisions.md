# SplitSmart Architecture Decisions

**Baseline status:** Draft — Reconciliation Incomplete. Not reviewed under Principle VII.

This file records what happened to every architecture proposal from the two AI sets, so no proposal stays normative by accident. Business-rule and scope decisions are in the [decision log](../../specs/001-splitsmart-expense-sharing/decisions/decision-log.md).

| Label | Meaning |
|---|---|
| **Mandated** | Required by the constitution (ID-nn or a Principle). Team-binding |
| **Proposed** | Adopted in this baseline by delegated decision; a named reviewer must confirm it |
| **Rejected** | Removed from normative design |

Approving authority for every Proposed row is **pending**: the [architecture reviewer](../../specs/001-splitsmart-expense-sharing/decisions/README.md#sign-off-record) or the owner of the cited decision. Delegation came from Daniel Raskin's 2026-11-05 instruction.

## Mandated constraints

These hold only while the constitution is unchanged. DEC-01 could change ID-03.

| ID | Decision | Used for |
|---|---|---|
| ID-01 | Java 21 | All code |
| ID-02 | Apache Maven; `mvn clean verify` from a clean checkout | Build |
| ID-03 | Java Swing desktop client; GUI work on the Event Dispatch Thread. **Does not satisfy CR-10** | `ui` |
| ID-04 | JUnit 5 through Surefire | Tests |
| ID-05 | PlantUML `.puml` sources | `docs/uml/` |
| ID-06 | `BigDecimal`, scale 2, `HALF_EVEN`, one money abstraction; see DEC-06 for the split rule | `Money` |
| ID-07 | Layered object-oriented design, GUI separated from business logic | Packages |
| ID-08 | In-application notifications | `NotificationDispatcher` |

## Set B proposals (AD-nn)

| ID | Proposal | Disposition | Final form and reason |
|---|---|---|---|
| AD-01 | Single module; four required packages plus `app` and a persistence package | **Proposed**, edited | `repository.sqlite` replaces `repository.jdbc`, per DEC-05 |
| AD-02 | Services take raw text and return immutable views | **Proposed** | Rules stay out of Swing. Supports FR-015 |
| AD-03 | Explicit `Session`; `AccessPolicy` | **Proposed** | Replaces Set A's bare `actor` ID. A session cannot be forged outside `service` |
| AD-04 | `Money` holds all rounding, `DOWN` for floors | **Proposed**, edited | `FLOOR` replaces `DOWN` (DEC-06) |
| AD-05 | Pure `SplitAllocator`; shares saved with position; literal FR-012 | **Proposed** | DEC-18 |
| AD-06 | Balances derived on read by `BalanceCalculator` | **Proposed** | One source of truth. Agrees with Set A PD-09 |
| AD-07 | Embedded H2 | **Rejected** | DEC-05 selects SQLite |
| AD-08 | Separate receipt table; no AWT below `ui` | **Proposed**, edited | Adds trailer check; drops `sha256` (DEC-25) |
| AD-09 | One use case, one transaction; notifications commit with their trigger | **Proposed** | `TransactionRunner` |
| AD-10 | First decision wins: conditional update, unique decision, `expectedVersion` | **Proposed** | DEC-04 |
| AD-11 | Append-only repositories for decisions and payments | **Proposed** | Adds database triggers as defense in depth |
| AD-12 | JDK PBKDF2 with stored parameters; persisted lockout; injected `Clock` | **Proposed** | Starts at Set A's 600,000 iterations; DEC-23 |
| AD-13 | Overpayment as a two-phase `PaymentOutcome` | **Proposed** | DEC-27 |
| AD-14 | Snapshot refresh and reset-to-unread on edit; derived flag | **Rejected in part** | Only the derived flag and the "deleted keeps text" rule survive (DEC-16). Structured snapshot fields are replaced by saved `message` text |
| AD-15 | Exit needs pairwise zero and no Pending involvement | **Proposed** | DEC-08, DEC-09 |
| AD-16 | Admin succession to earliest-joined | **Proposed** | DEC-10 |
| AD-17 | Former members see only their own records, read-only | **Proposed** | DEC-07 |
| AD-18 | Approved-only totals, memo, opening + period + later = current | **Proposed** | DEC-12 to DEC-14 |
| AD-19 | Passive panels, one controller per area, `CardLayout`, `UiTaskRunner` | **Proposed** | Set A's single-thread executor is added |
| AD-20 | Sealed `ServiceException`; outcomes as values | **Proposed**, edited | `NotFoundException` hides existence; `AccessDeniedException` means visible but not permitted (DEC-26) |
| AD-21 | `System.Logger` file logging with prohibited content | **Proposed** | Backed by `java.util.logging`; no added dependency |
| AD-22 | ArchUnit-style architecture rules | **Rejected** | Set A's JUnit source scan gives the same gate without a dependency. Principle V names JUnit 5 as the only framework |
| AD-23 | Typed UUID IDs; `Instant` for events; `LocalDate` for business dates | **Proposed** | Agrees with Set A |
| AD-24 | One instance, one session | **Proposed** | DEC-03, DEC-04 |

## Set A proposals (PD-nn)

| ID | Proposal | Disposition | Final form and reason |
|---|---|---|---|
| PD-01 | One Maven module | **Proposed** | Same as AD-01 |
| PD-02 | `SwingWorker` on one background thread | **Proposed** | Implemented inside `UiTaskRunner` |
| PD-03 | JUnit 5 line, not JUnit 6 | **Proposed** | Confirm exact version at `pom.xml` creation |
| PD-04 | `app` package | **Proposed** | Same as AD-01 |
| PD-05 | `Percentage` value object | **Proposed** | |
| PD-06 | SQLite | **Proposed** | DEC-05 |
| PD-07 | Integer cents, ISO-8601 text | **Proposed** | Conversion only in `repository.sqlite` |
| PD-08 | One connection, conditional update, unique decision | **Proposed** | Merged with AD-10 |
| PD-09 | Balances computed on read | **Proposed** | `BalanceLedger` is replaced by Set B's `BalanceCalculator` and `BalanceSheet`, which split reading from calculating |
| PD-10 | Receipts in their own table | **Proposed** | DEC-25 |
| PD-11 | PBKDF2-HMAC-SHA256, 600,000 iterations | **Proposed** | Not OWASP's first choice (Argon2id); chosen for no third-party cryptography. Replaceable behind `PasswordHasher` |
| PD-12 | Persisted lockout; attempts during a lock do nothing | **Proposed** | DEC-23 |
| PD-13 | `Session` in `ui`; bare actor ID to services | **Rejected** | AD-03 |
| PD-14 | JUnit source scan for layer rules | **Proposed** | ARCH-01 |
| PD-15 | Notifications saved with their trigger; derived flag; no polling | **Proposed** | Merged with AD-09 and AD-14's flag |
| PD-16 | Overpayment as an exception | **Rejected** | AD-13: a warning is a question, not a failure |
| PD-17 | `Clock`, `yyyy-MM-dd`, `$1,234.50`, UUIDs, `java.util.logging` | **Proposed**, edited | DEC-24; logging through AD-21 |
| PD-18 | Hand-written fakes, no mocking library | **Proposed** | |

## Components adopted from Set B as design candidates

| Component | Why adopted | Requirement |
|---|---|---|
| `LedgerReader`, `LedgerQueryRepository` | One shared path for every balance read, so group exit, payments, balances, and reports cannot disagree | FR-007, FR-027, FR-032, FR-037 |
| `BalanceCalculator`, `BalanceSheet` | Pure and testable with no I/O | FR-026 to FR-029, NFR-009 |
| `ReportCalculator` | Pure report math | FR-036, FR-037, NFR-009 |
| `AccessPolicy` | One place to audit privacy | FR-003, NFR-003 |
| `NotificationDispatcher` | Sole creator of notifications, inside the trigger's transaction | FR-017, FR-023, SC-006 |
| `ExpenseDraftValidator` | Collects all field errors | FR-015 |

Added during reconciliation: `GroupExitPolicy`, the one place for BR-22. Set A's NC-6 recommended keeping this in one policy method so that it can change.

## Key trade-offs

| Topic | Chosen | Alternative | Why |
|---|---|---|---|
| Balances | Derive on read | Stored running totals | A stored total can drift, and drift breaks NFR-001. Revisit only if PERF-01 fails, under a new decision |
| Storage | SQLite | H2, files, server DB | DEC-05 |
| Authorization timing | Inside the transaction | Before the transaction | A check made outside can go stale. DEC-26 |
| Data access | Hand-written JDBC | JPA or Hibernate | Nine tables do not justify the weight, and mapping pressure on domain classes |
| Architecture | Layered monolith | Hexagonal, multi-module | The constitution names these layers; a source scan enforces them |
| Client and server now | Not proposed | Local server plus Swing | Scope grows without closing OC-1 |
