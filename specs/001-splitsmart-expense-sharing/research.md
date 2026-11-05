# Research Notes: SplitSmart Expense Sharing

**Status**: Draft — Reconciliation Incomplete. **Date**: 2026-11-05

This file keeps the evidence behind technical choices. Decisions themselves live in the [decision log](decisions/decision-log.md) and [architecture-decisions.md](../../docs/architecture/architecture-decisions.md). Set A's and Set B's original research is preserved in `docs/ai-comparison/`.

## Facts checked on 2026-11-05

| Fact | Evidence |
|---|---|
| No `pom.xml`, `src/`, or tests exist | Repository listing |
| `java` (JDK 21) is on PATH; `mvn` and `dot` are not | `which` |
| PlantUML 1.2025.2 runs on this machine from a scratch download, using its built-in layout engine | Run on 2026-11-05 |
| `UserRequirement.md` ends `OS supported: primary web-based` | File contents |
| `Lab_6_Requirement.docx`, under "UserRequirement.md content as following," ends `primary web-based and also comes with app that can be run on Android and IOS.` | Extracted document text |
| The handout's constitution prompt names Java Swing and its specify prompt says to label "the Java Swing MVP subset" | Extracted document text. **Suggestive, but not acceptance of the deviation from CR-10** |
| All split worked examples in the spec are arithmetically correct | Recalculated independently with a scratch Python `Decimal` script. This checks the arithmetic, not an implementation |

## Storage evidence (DEC-05)

External documents below were read and cited by Set A on 2026-11-04. They were **not re-fetched** during reconciliation, and nothing was run against SQLite.

| Claim | Source |
|---|---|
| A transaction's changes occur completely or not at all, even after a program crash, OS crash, or power failure | <https://www.sqlite.org/transactional.html> |
| SQLite suits desktop applications, allows one writer at a time, and warns against many computers writing over a network file system | <https://www.sqlite.org/whentouse.html> |
| The driver bundles native libraries for Windows, macOS, and Linux | <https://github.com/xerial/sqlite-jdbc> |
| H2 lacks partial indexes, and its documentation does not guarantee commits survive power loss | Set B `design.md` §10 and `architecture.md` §8.1. Set B's claim; not independently re-verified |

| Criterion | SQLite | H2 |
|---|---|---|
| Documented crash durability | Strong | Weaker, per Set B |
| One-active-membership rule | Partial unique index | Generated-column workaround, untested |
| Exact money mapping | Integer cents; needs conversion | Direct `DECIMAL` |
| Single-instance rule | `locking_mode=EXCLUSIVE` | Default file lock |
| Packaging | Native library in a JAR | Pure Java |
| Future web use | Would be replaced | Would be replaced |

## Password storage evidence (PD-11)

| Claim | Source |
|---|---|
| OWASP's default is Argon2id, with scrypt as a fallback. PBKDF2-HMAC-SHA256 at 600,000 iterations is listed, and preferred where FIPS-140 compliance is required | <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html> (cited by Set A) |

The baseline trades OWASP's first choice for no third-party cryptography dependency. Hashing time on target machines is **unmeasured**, and PERF-01 covers login.

## Threading evidence (PD-02)

The Java 21 `SwingWorker` documentation says time-consuming tasks should not run on the EDT and that `done()` runs on it: <https://docs.oracle.com/en/java/javase/21/docs/api/java.desktop/javax/swing/SwingWorker.html> (cited by Set A).

## Versions to confirm at `pom.xml` creation

Observed by Set A on Maven Central on 2026-11-04. **Not rechecked or tested.**

| Artifact | Observed | Note |
|---|---|---|
| `org.junit.jupiter:junit-jupiter` | 5.14.4 | Stay on 5.x. JUnit 6 would need a constitution amendment (ID-04) |
| `org.apache.maven.plugins:maven-surefire-plugin` | 3.6.1 | |
| `org.xerial:sqlite-jdbc` | 3.54.1.0 | Must support `STRICT` tables (SQLite 3.37 or later) |
