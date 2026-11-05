# Phase 0 Research: SplitSmart Expense Sharing

**Status**: Draft. AI-generated; not human reviewed (Constitution Principle VII).
**Date**: 2026-11-04 | **Plan**: [plan.md](plan.md) | **Spec**: [spec.md](spec.md)

## How to read this document

Each topic states a decision, why it was chosen, what else was considered, and the evidence.

- **Binding**: already decided by the constitution or the clarified spec. Research explains how to
  apply it and does not reopen it.
- **Proposed**: a recommendation from this plan. It is not a customer requirement and not a settled
  fact. A human reviewer can change it. Proposed decisions carry `PD-nn` IDs.

Research cannot override the constitution. Where a source conflict was found, it is listed under
[Unresolved questions](#unresolved-questions) instead of being settled here.

## Facts established from the repository (checked 2026-11-04)

| Fact | Evidence |
|------|----------|
| No `pom.xml`, `src/`, or existing `.puml` files exist | Repository file listing |
| `java`, `javac`, `mvn`, `plantuml`, and `dot` are not on this machine's PATH; `JAVA_HOME` is unset | `Get-Command` checks |
| `.specify/extensions.yml` does not exist, so no plan hooks are configured | `Test-Path` |
| The current git branch is `main`. `001-splitsmart-expense-sharing` is a Spec Kit feature ID, not a git branch | `git branch -a`; `setup-plan.ps1` output |
| `UserRequirement.md` ends with `OS supported: primary web-based` | File contents |
| `Lab_6_Requirement.docx` prints the same request ending `primary web-based and also comes with app that can be run on Android and IOS.` | Document text (see NC-2) |

## Binding decisions

### R-01 Language and runtime: Java 21

- **Status**: Binding (ID-01).
- **Decision**: Java 21. Records, sealed types, pattern matching, and switch expressions are allowed
  where they make the code clearer.
- **Rationale**: Set by the constitution.
- **Alternatives considered**: None; not reopened.
- **Evidence**: Constitution ID-01. A JDK is not installed on this machine yet.

### R-02 Build: Apache Maven

- **Status**: Maven is binding (ID-02). A single-module layout is proposed (PD-01).
- **Decision**: One Maven module, with a committed `pom.xml`, explicit dependency versions, and
  `mvn clean verify` as the full check.
- **Rationale**: One module is enough for one desktop application. The layer rules are enforced by
  a test (R-18).
- **Alternatives considered**: One Maven module per layer enforces boundaries at compile time and
  would ease later web reuse, but it adds build overhead the MVP does not need yet. It remains an
  available refactor if OC-1 is resolved in favor of a web client.
- **Evidence**: Constitution ID-02 and Principle III.

### R-03 User interface: Java Swing, with work off the Event Dispatch Thread

- **Status**: Swing is binding (ID-03). `SwingWorker` on one background thread is proposed (PD-02).
- **Decision**: UI code runs on the Event Dispatch Thread (EDT). Service calls run in a
  `SwingWorker` submitted to one single-thread executor, so calls run one at a time. Results are
  rendered in `done()`.
- **Rationale**: Password hashing and database calls would otherwise freeze the window. One
  background thread also fits one database connection (R-12).
- **Alternatives considered**: Running services on the EDT freezes the UI. The default `SwingWorker`
  pool allows parallel calls and would need more connection handling.
- **Evidence**: The Java 21 `SwingWorker` API documentation says time-consuming tasks should not run
  on the EDT, and that `done()` runs on the EDT:
  <https://docs.oracle.com/en/java/javase/21/docs/api/java.desktop/javax/swing/SwingWorker.html>
- **OC-1 note**: Swing does not satisfy CR-10. See [plan.md](plan.md#oc-1-impact).

### R-04 Testing: JUnit 5

- **Status**: JUnit 5 is binding (ID-04). The specific version is proposed (PD-03).
- **Decision**: Use the JUnit 5 line, not JUnit 6, through Maven Surefire. Observed on Maven Central
  on 2026-11-04: `junit-jupiter` 5.14.4 is the highest 5.x release, and `maven-surefire-plugin` is
  3.6.1. Confirm both when the `pom.xml` is created.
- **Rationale**: The constitution names JUnit 5. Maven Central now lists 6.1.3 as latest, so a
  "use the latest" habit would silently break ID-04.
- **Alternatives considered**: JUnit 6 would need a constitution amendment.
- **Evidence**: <https://repo1.maven.org/maven2/org/junit/jupiter/junit-jupiter/maven-metadata.xml>
  and
  <https://repo1.maven.org/maven2/org/apache/maven/plugins/maven-surefire-plugin/maven-metadata.xml>.
  Compatibility of these versions with a particular Maven version was not tested, because Maven is
  not installed here.

### R-05 Design documentation: PlantUML

- **Status**: Binding (ID-05, Principle VI).
- **Decision**: Store `.puml` sources in `docs/uml/`, which the constitution names first.
- **Rationale**: Text diagrams can be diffed and reviewed with the code.
- **Alternatives considered**: The feature directory is also allowed. `docs/uml/` was chosen so
  diagrams can outlive this one feature.
- **Evidence**: Constitution Principle VI. PlantUML documents `--check-syntax` for checking without
  generating images: <https://plantuml.com/command-line>. The diagrams have **not** been
  syntax-checked, because neither Java nor PlantUML is available here.

### R-06 Architecture: layered object-oriented design

- **Status**: Binding (ID-07, Principle III). The extra `app` package is proposed (PD-04).
- **Decision**: Packages `domain`, `service`, `repository`, and `ui`, plus `app` for the startup
  code that connects them. Collaborators are passed through constructors.
- **Rationale**: Principle III says "at least these packages". Something must create the concrete
  objects, and giving that job to `app` keeps `ui` and `service` from depending on the SQLite code.
- **Alternatives considered**: Creating objects in `ui` would tie `ui` to persistence classes. A
  dependency injection framework is unjustified for this number of classes.
- **Evidence**: Constitution Principle III.

### R-07 Money policy and how it coexists with the split rule

- **Status**: Binding (Principle IV, ID-06, FR-011 to FR-013). The explanation below is this plan's
  reading and needs human confirmation.
- **Decision**: One `Money` value object owns all money conversion, at scale 2. It has three separate
  paths:

| Path | Used for | Behavior |
|------|----------|----------|
| Strict parse | Amounts typed by users | Refuses more than 2 decimals. Never rounds (FR-010, Story 3 scenario 5) |
| General normalization | Any non-allocation value that arrives at a higher scale | `RoundingMode.HALF_EVEN` (Principle IV default) |
| Allocation floor | Split shares only, called by `SplitAllocator` | `RoundingMode.FLOOR`, followed by the leftover-cent pass (FR-011 to FR-013) |

- **How they coexist**: The constitution sets a general policy and also requires splits to use "a
  documented, deterministic rule". FR-011 to FR-013 are that rule. The floor applies only inside
  allocation. Neither rule rewrites the other, and both live in one place, as Principle IV requires.
- **Honest limitation**: Sums and differences of scale-2 values are exact, and user input is refused
  rather than rounded. **This design has no MVP calculation that actually reaches the HALF_EVEN
  path.** The path stays available so that any future non-allocation calculation follows the
  constitution rather than choosing its own rule.
- **Why not HALF_EVEN for shares**: $200.00 split three ways gives 66.67 each with HALF_EVEN, which
  totals $200.01. Flooring gives 66.66 each, leaving 2 cents, so the shares become 66.67, 66.67, and
  66.66, totaling exactly $200.00.
- **Other rules kept**: Values are built from `String` or integers, never `double`. Comparison uses
  `compareTo`. `float` and `double` are not used for money, including in tests and the UI.
- **Alternatives considered**: Rewriting FR-011 to use HALF_EVEN would contradict a recorded
  clarification. Amending the constitution to name the exception is left to the human reviewer (see
  Complexity Tracking in the plan).
- **Evidence**: Constitution Principle IV; spec Clarifications 2026-10-29.

### R-08 Split allocation algorithm

- **Status**: Binding (FR-011, FR-012, FR-013).
- **Decision**:
  1. Compute each raw share. Equal: amount ÷ number of participants. Percentage: amount × percentage ÷ 100.
  2. Floor each raw share to the cent.
  3. Leftover = expense amount − sum of floored shares.
  4. Starting with the first listed participant, add one cent per participant until the leftover is 0.
  5. Save the participant order with the expense (FR-012).
- **Why one pass is enough**: Each floor loses less than one cent, so the leftover is always fewer
  cents than there are participants.
- **Worked examples** (also used as test cases in [quickstart.md](quickstart.md)):

| Amount | Split | Floored | Final shares |
|--------|-------|---------|--------------|
| $90.00 | Equal, 3 | 30.00, 30.00, 30.00 | 30.00, 30.00, 30.00 |
| $100.00 | Equal, 3 | 33.33, 33.33, 33.33 | 33.34, 33.33, 33.33 |
| $200.00 | Equal, 3 | 66.66, 66.66, 66.66 | 66.67, 66.67, 66.66 |
| $0.01 | Equal, 3 | 0.00, 0.00, 0.00 | 0.01, 0.00, 0.00 |
| $200.00 | 50 / 30 / 20 % | 100.00, 60.00, 40.00 | 100.00, 60.00, 40.00 |
| $10.00 | 33.33 / 33.33 / 33.34 % | 3.33, 3.33, 3.33 | 3.34, 3.33, 3.33 |

- **Consequence**: The extra cent goes to the first listed participant, not the largest percentage.
  The $10.00 row shows this. It matches the recorded clarification and is not an error.
- **Alternatives considered**: Rejected during clarification (payer absorbs, largest remainder, last
  participant adjusted).
- **Evidence**: Spec Clarifications 2026-10-29; Story 3 scenario 2; Edge Cases.

## Proposed decisions

### R-09 Percentages as a value object (PD-05)

- **Status**: Proposed.
- **Decision**: `Percentage` wraps a `BigDecimal` at scale 2 and refuses values outside 0.00 to
  100.00 or with more than 2 decimals. The total is checked against exactly 100.00 with `compareTo`.
- **Rationale**: Share calculations depend on it, and floating point could make a valid total look
  wrong.
- **Alternatives considered**: Plain `BigDecimal` scatters the validation.
- **Evidence**: FR-013; Principle IV.

### R-10 Storage engine: SQLite through JDBC (PD-06)

- **Status**: Proposed. The constitution and spec do not name a storage technology, so a human must
  confirm this. All access goes through repository interfaces, so changing it does not touch
  `domain`, `service`, or `ui`.
- **Decision**: One SQLite database file, using the `org.xerial:sqlite-jdbc` driver (3.54.1.0 on
  Maven Central on 2026-11-04; confirm when the `pom.xml` is created).
- **Rationale**: FR-040 and NFR-005 require data to survive restarts and unexpected exits, and a
  single approval must update several records together. SQLite provides this without a server, and
  the spec assumes one shared installation.
- **Alternatives considered**:

| Option | Why not chosen |
|--------|----------------|
| JSON or serialized files | The application would have to build its own crash safety and multi-record atomic updates |
| H2 or Apache Derby (embedded) | Workable Java-only options. They were not evaluated in depth; SQLite was chosen for its documented crash behavior and single-file form. A reasonable alternative if a native library is unwelcome |
| PostgreSQL or MySQL | A server is too much to install for a local desktop MVP. Would become relevant if OC-1 leads to a web product |

- **Evidence**:
  - SQLite states that transaction changes occur completely or not at all, even if interrupted by a
    program crash, operating system crash, or power failure: <https://www.sqlite.org/transactional.html>
  - SQLite lists desktop applications as a good fit, allows one writer at a time, and warns against
    many computers writing over a network filesystem: <https://www.sqlite.org/whentouse.html>
  - The driver README says native libraries for Windows, macOS, and Linux are in one JAR:
    <https://github.com/xerial/sqlite-jdbc>. Running on Java 21 was not tested here.
  - Version: <https://repo1.maven.org/maven2/org/xerial/sqlite-jdbc/maven-metadata.xml>

### R-11 How values are stored (PD-07)

- **Status**: Proposed.
- **Decision**: Money as integer cents. Percentages as integer hundredths of a percent. Calendar dates
  as `yyyy-MM-dd` text. Timestamps as UTC ISO-8601 text. IDs as UUID text. In Java, all money stays
  `BigDecimal` inside `Money`; the integer form exists only at the database boundary.
- **Rationale**: SQLite has no exact decimal type. Integers keep values exact, and conversion is
  built from integers, as Principle IV allows.
- **Alternatives considered**: Decimal text cannot be summed safely in SQL. SQLite `REAL` is a binary
  floating-point type and is prohibited by Principle IV.
- **Evidence**: Principle IV; FR-029; NFR-001.

### R-12 Transactions and concurrency (PD-08)

- **Status**: Proposed.
- **Decision**: One `TransactionManager` interface in `repository`, and one database connection used
  by the single background thread (R-03). Deciding an expense uses a conditional update: "set the
  status only if it is still Pending and the version matches". A unique rule allows one decision per
  expense.
- **Rationale**: The first decision wins, and the second person is told the expense is no longer
  Pending (Edge Cases, FR-024). The check lives in storage, so it also holds if someone opens a second
  copy of the application.
- **Alternatives considered**: Checking only in memory fails with two running copies. Pessimistic
  locks are unnecessary at this scale.
- **Evidence**: Spec Edge Cases; SQLite single-writer behavior (R-10).

### R-13 Balances computed on read (PD-09)

- **Status**: Proposed. The spec already says Balance is "Derived, not entered".
- **Decision**: No balance table. `BalanceLedger` computes balances from Approved shares and payments
  whenever they are needed.
- **Rationale**: A stored total can drift from its source records. Computing from the source means a
  Pending or Rejected expense cannot affect a balance if the query only reads Approved rows (FR-020,
  SC-005), and the same logic can back reports (FR-037).
- **Alternatives considered**: A stored running balance reads faster but duplicates the truth and
  needs repair logic. Revisit only if NFR-004 cannot be met.
- **Evidence**: Spec Key Entities; NFR-004. Performance is an expectation until measured (see Risks).

### R-14 Receipt images in the database (PD-10)

- **Status**: Proposed.
- **Decision**: Store image bytes in a separate receipt table, keyed by expense. Check the type by the
  file's leading bytes, not only its name. Enforce the 5 MB limit in `ExpenseService`.
- **Rationale**: The receipt saves or fails with its expense in one transaction, and expense and
  report queries never load image bytes.
- **Alternatives considered**: Image files plus a database path are lighter on the database, but a
  crash can leave orphan files or missing images, which would then need cleanup logic.
- **Evidence**: FR-014, FR-040; spec assumption that images are stored with the application's data.

### R-15 Password storage (PD-11)

- **Status**: Proposed. The spec only requires a non-reversible form (FR-004, NFR-002).
- **Decision**: `PBKDF2WithHmacSHA256` from the JDK, with a random per-user salt and 600,000
  iterations, behind a `PasswordHasher` interface.
- **Rationale**: It meets the requirement with no extra dependency. It runs off the EDT (R-03), so it
  will not freeze the window.
- **Alternatives considered**: OWASP's default recommendation is Argon2id, with scrypt as fallback,
  and PBKDF2 preferred where FIPS-140 compliance is required. **This design does not choose OWASP's
  first choice**; it trades that for no third-party cryptography dependency in a classroom MVP. A
  reviewer can switch to Argon2id through the interface. Plain SHA-256 is unacceptable for passwords.
- **Evidence**: OWASP Password Storage Cheat Sheet (PBKDF2-HMAC-SHA256: 600,000 iterations):
  <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>. Java standard
  names list the `PBKDF2With<prf>` pattern:
  <https://docs.oracle.com/en/java/javase/21/docs/specs/security/standard-names.html>. Hashing time
  on the target laptops has not been measured.

### R-16 Lockout state (PD-12)

- **Status**: The rule is binding (NFR-002). Where the state lives is proposed.
- **Decision**: Store the failure count and lock end time on `User`, so restarting the application
  does not clear a lock. Time comes from an injected `Clock`, so tests do not wait 5 minutes. Attempts
  during a lock do not extend it. When a lock expires, the count starts again from zero.
- **Rationale**: In-memory state would let anyone bypass the lock by restarting. An injected clock
  makes the rule testable (NFR-009).
- **Alternatives considered**: In-memory counters, rejected above.
- **Evidence**: Spec Story 1 scenario 6; NFR-002. Whether an attempt during a lock extends it is not
  stated in the spec; this is an assumption.

### R-17 Authorization and session (PD-13)

- **Status**: Proposed. The rules themselves are binding (FR-003, NFR-003).
- **Decision**: `Session` lives in `ui`. Every service operation takes the acting user's ID and
  checks permission through `AccessPolicy`. The UI may hide buttons, but services decide.
- **Rationale**: Rules stay out of Swing (Principle III), can be tested without a UI (NFR-009), and
  would still apply if a web client were later added.
- **Alternatives considered**: A global "current user" hides dependencies and makes tests harder.
  Checks only in the UI would break Principle III.
- **Evidence**: Principle III; FR-003.

### R-18 Enforcing layer rules (PD-14)

- **Status**: The rule is binding (Principle III). The mechanism is proposed.
- **Decision**: A JUnit 5 test scans source files. It fails if `domain`, `service`, or `repository`
  imports `javax.swing` or `java.awt`, if `domain` or `service` imports the SQLite package or
  `java.sql`, if `ui` imports the SQLite package, or if `float` or `double` appear in `domain`.
- **Rationale**: This automates the constitution's implementation gate without another dependency.
- **Alternatives considered**: ArchUnit is more capable but adds a dependency. Separate Maven modules
  are covered in R-02. Review alone is easy to miss.
- **Evidence**: Constitution implementation gate.

### R-19 Notifications (PD-15)

- **Status**: In-app delivery is binding (ID-08). The mechanism is proposed.
- **Decision**: Save notifications in the same transaction as the expense or decision that caused
  them. The UI reads them at login and when views refresh; there is no background polling. The
  "needs your approval" flag is **computed**, not stored: it is true when the expense is still
  Pending and the recipient is a non-creator participant.
- **Rationale**: Saving them together means none are lost (SC-006). A computed flag stops showing
  once the expense is decided and stays right if a Pending expense's participants are edited.
- **Alternatives considered**: A stored flag has to be updated on every decision and edit. Polling
  has little value when the MVP normally has one signed-in user per running copy.
- **Evidence**: FR-017, FR-019; ID-08. FR-018 (outside the app) stays Post-MVP.

### R-20 Errors (PD-16)

- **Status**: Proposed.
- **Decision**: Services throw a small set of unchecked exception types, listed in
  [contracts/README.md](contracts/README.md). `ValidationException` carries all field errors at once.
  The overpayment warning is an exception that the UI turns into a confirmation dialog, followed by a
  second call with confirmation set. The rule therefore stays in `PaymentService`.
- **Rationale**: Supports FR-015 and NFR-007, and keeps FR-032 out of the UI.
- **Alternatives considered**: Result objects on every method add ceremony in a project of this size.
- **Evidence**: FR-015, FR-032; NFR-007.

### R-21 Time, identity, format, and logging (PD-17)

- **Status**: Proposed.
- **Decision**:
  - "Today" and all timestamps come from an injected `java.time.Clock`.
  - The display and entry date format is `yyyy-MM-dd`. FR-041 asks for one consistent format but does
    not choose one.
  - Money displays as `$1,234.50`.
  - Identifiers are UUIDs in typed wrappers, created by the application.
  - Logging uses `java.util.logging` for unexpected errors, and never logs passwords or hashes.
- **Rationale**: No added dependencies, and deterministic tests. Typed IDs stop a `GroupId` being
  passed as a `UserId`.
- **Alternatives considered**: Auto-increment IDs need a database round trip before an object is
  complete. SLF4J and Logback add dependencies without a current need.
- **Evidence**: FR-041, NFR-009. The spec has no logging requirement, so this exists only to support
  diagnosis.

### R-22 Test doubles (PD-18)

- **Status**: Proposed.
- **Decision**: Hand-written in-memory repository fakes for service tests, and a temporary SQLite file
  for repository tests. No mocking library.
- **Rationale**: Principle V names JUnit 5 as the only unit-testing framework. Fakes are enough.
- **Alternatives considered**: Mockito is common but is an extra dependency with no clear gain here.
- **Evidence**: Principle V.

## Unresolved questions

These are **not** closed by this plan. Where a working default is listed, it lets design continue,
but it is not a decision until a human confirms it.

| ID | Status | Question | Sources | Working default | Needs |
|----|--------|----------|---------|-----------------|-------|
| OC-1 | NEEDS CLARIFICATION | Will the customer or instructor accept a Swing desktop MVP instead of a primarily web-based product? | CR-10, ID-03, spec Q3 | None. The conflict remains open. Swing is built because of ID-03, not because it meets CR-10 | Customer or instructor, in writing |
| NC-2 | NEEDS CLARIFICATION | `UserRequirement.md` says "primary web-based". The lab document's copy adds "and also comes with app that can be run on Android and IOS." Which is the customer's wording? | `UserRequirement.md`, `Lab_6_Requirement.docx` | `UserRequirement.md` governs by project rule and is unchanged. Android and iOS are not in CR-10 or any FR | Instructor |
| NC-3 | NEEDS CLARIFICATION | Spec conflict: former members keep their group history visible in reports (Edge Cases), but no report may show data from a group the user "does not belong to" (NFR-003). | Edge Cases, NFR-003, FR-003 | Former members see only items they were personally part of | Human reviewer |
| NC-4 | NEEDS CLARIFICATION | What happens to a Pending expense when a listed person leaves? FR-007 only checks balances, and Pending amounts are not balances. If approved later, the person owes money but FR-030 stops them recording a payment in that group. If every eligible approver leaves, no one can decide it. | FR-007, FR-021, FR-030 | Recommend refusing removal or leaving while the person is the payer or a participant on a Pending expense in that group. Not applied as a settled rule | Human reviewer |
| NC-5 | NEEDS CLARIFICATION | Can the admin leave? FR-006 says any member may leave, and Actors says a group has exactly one admin. | FR-006, Actors | Recommend refusing while other members remain, with no transfer feature in the MVP | Human reviewer |
| NC-6 | NEEDS CLARIFICATION | FR-007 tests a member's "net balance within that group". A member owing A $5 and being owed $5 by B nets $0.00 and could leave, stranding both debts because FR-030 needs both people in the group. | FR-007, FR-030, Story 2 | Implemented as written (net), kept in one policy method so it can change. Recommend also requiring each pairwise balance to be $0.00 | Human reviewer |
| NC-7 | NEEDS CLARIFICATION | Can a 0% participant receive a leftover cent? $1.00 at 0 / 33.33 / 66.67 % floors to 0.00, 0.33, 0.66; FR-012 read literally gives the first participant, at 0%, one cent. Whether 0% should be allowed was also never confirmed. | FR-012, FR-013 | FR-012 applied literally | Human reviewer |
| NC-8 | NEEDS CLARIFICATION | How do filtered reports "agree" with balances? A date-filtered total cannot equal a current balance (FR-037, SC-007), and a status filter can select Pending items while SC-005 bars them from report totals. | FR-035 to FR-037, SC-005, SC-007, Story 8 | Pending and Rejected appear as lines but never in money totals. Reports show filtered activity and the current balance separately. The two must be equal when no date or status filter is used | Human reviewer |
| NC-9 | NEEDS CLARIFICATION | Does editing or deleting a Pending expense notify anyone? What of a member added to the group after the expense was created and then added to it? | FR-016, FR-017 | No new notification on edit or delete; a deleted expense's existing notifications remain as text. A newly added participant gets a notification when added | Human reviewer |
| NC-10 | NEEDS CLARIFICATION | "Total paid" and "total received" could mean payments, or also expenses the user paid for. | FR-036, Story 8 | Payments only; expense amounts are in other totals | Human reviewer |
| NC-11 | NEEDS CLARIFICATION | These assumptions were never confirmed by a person: the admin adds members directly with no invitation; the $1,000,000.00 maximum; whether that maximum applies to payments (FR-030 omits it, but the Edge Cases bullet is general). | FR-006, FR-010, FR-030 | Used as written, with the cap applied to payments too | Human reviewer |
| NC-12 | NEEDS CLARIFICATION | FR-040 and FR-041 cite no CR ID and are not in the Requirements Inventory. The constitution's spec gate requires a citation. | Spec, constitution workflow gate | Shown as inferred, labeled as such in the traceability matrix. Spec not changed | Human reviewer |
| Q4 to Q7 | Open with defaults | Spec open questions on report parameters, resubmitting rejected expenses, rejoining a group, and notification scope. | Spec Open Questions | The spec's stated defaults | Human reviewer |

**Evidence note on OC-1**: The lab document's constitution prompt itself names Java Swing. That
suggests the stack was instructor-directed, but it is an inference. It is not a recorded acceptance
of the deviation from CR-10, so it does not resolve OC-1.

## Risks

| ID | Risk | Effect | Mitigation |
|----|------|--------|------------|
| RK-1 | OC-1 resolves toward web | The `ui` layer and possibly storage must be replaced | `domain` and `service` have no Swing dependency, but a shared multi-user server would still need new persistence and authentication work. Reuse is likely, not free |
| RK-2 | NFR-004 (2 seconds at 10,000 expenses) is unmeasured | Computed balances or reports could be slow | Scoped queries and indexes, plus a timed test (V-19). Fall back to stored totals only if measured results fail |
| RK-3 | Database file is not encrypted | Anyone with access to the file can read expenses, and copy receipts and password hashes. FR-003 and NFR-003 are enforced in the application only | Hashes are non-reversible. Encryption is not required by the spec. Reviewer should accept or reject this risk |
| RK-4 | A shared data folder is tied to one OS account | The spec's "one shared installation" may not hold for different Windows accounts | Data folder setting (see plan). Multi-computer use stays out of scope until FR-039 |
| RK-5 | Payments are immutable and unconfirmed | A false or mistaken payment lowers a balance until corrected, with no dispute feature | Follows clarified FR-031 and NFR-006. Correction is an opposite payment, which FR-030 already allows. Visible to both parties (FR-033) |
| RK-6 | Lockout can be triggered by anyone who knows a username | A nuisance denial of login for 5 minutes | Accepted by the clarified rule; the lock expires on its own |
| RK-7 | The locked message reveals that an account exists | Slight tension with FR-002's non-disclosure | Required by Story 1 scenario 6. Registration already reveals taken usernames |
| RK-8 | SQLite driver includes a native library | Could fail on an unusual platform | The driver covers major platforms per its README. Repositories are replaceable. Untested here |
| RK-9 | Diagrams and versions are unverified on this machine | A syntax error or incompatibility may appear later | [quickstart.md](quickstart.md) lists the checks to run once tools are installed |
