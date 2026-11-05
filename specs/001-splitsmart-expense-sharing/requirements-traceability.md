# Requirements Traceability Matrix

**Status**: Draft — Reconciliation Incomplete. **Date**: 2026-11-05

**How to read link status.** Every link from a requirement to a design element, contract, diagram, or test is **proposed**: no link has been accepted by a named reviewer. The **Req. status** column says what the requirement itself rests on:

| Req. status | Meaning |
|---|---|
| Clarified | Text from the spec clarified by Daniel Raskin on 2026-10-29, unchanged |
| Revised | Wording changed under a PROPOSED decision; see the [change history](spec.md#change-history) |
| Derived | No CR states it (DEC-22) |
| Deferred | Post-MVP; not designed |

**Not yet possible:** Principle II's forward links to `tasks.md` and passing JUnit tests. Tasks are not authorized and no test exists.

**Diagram keys:** UC use-case, CO component, DC domain-class, SC service-class, EAS expense-approval-sequence, PSS payment-settlement-sequence, NS notification-sequence, ALS authentication-lockout-sequence, ES expense-state, MS membership-state, AS authentication-state, CEA create-expense-activity, ARA approve-or-reject-expense-activity, RPA record-payment-activity, GRA generate-report-activity.

**Test IDs** are in the [validation plan](validation-plan.md). **Contract keys:** S service, R repository, U UI.

## Customer requirements

| CR | Customer requirement | FRs and NFRs | MVP status |
|---|---|---|---|
| CR-01 | User accounts | FR-001 to FR-004, NFR-002, NFR-003 | Designed. Password reset and profile editing are Post-MVP with no FR (DEC-32) |
| CR-02 | Group management | FR-005 to FR-009 | Designed, except FR-009 (deferred). Invitations are Post-MVP with no FR (DEC-32) |
| CR-03 | Expense creation | FR-010 to FR-016, NFR-001 | Designed |
| CR-04 | Expense participants | FR-010, FR-026 | Designed |
| CR-05 | Notifications | FR-017 to FR-019 | Designed, except FR-018 (deferred). Limited by DEC-03 |
| CR-06 | Approval workflow | FR-020 to FR-025, NFR-006 | Single-level designed. FR-025 deferred |
| CR-07 | Balance tracking | FR-026 to FR-029, NFR-001 | Designed |
| CR-08 | Payment tracking | FR-030 to FR-033, NFR-006 | Designed |
| CR-09 | Reporting | FR-034 to FR-038 | Designed, except FR-038 (deferred) |
| CR-10 | Primarily web-based | FR-039 | **NOT MET by the MVP. OC-1 is OPEN / BLOCKING (DEC-01).** Possible mobile wording: DEC-02 |

## Functional requirements

| FR | CR | Req. status | Scope | Use case / story | Rules and data | Service or contract | Component | UML | Tests |
|---|---|---|---|---|---|---|---|---|---|
| FR-001 | CR-01 | Clarified | MVP | UC-01 / S1 | BR-29; `User`, `Username` | `AccountService.register` (S, R, U) | service, domain | UC, DC, SC | UT-09, SI-01, RP-01, AT-01 |
| FR-002 | CR-01 | Clarified | MVP | UC-02, UC-03 / S1 | BR-26; `User` | `login`, `logout` (S, U) | service, ui | UC, SC, ALS, AS | SI-01, SEC-05, UI-05, AT-01 |
| FR-003 | CR-01 | Revised (DEC-07) | MVP | All / S1 | BR-25; `Membership` | `AccessPolicy`, all reads (S) | service | CO, SC | SEC-02, SEC-03, UI-05 |
| FR-004 | CR-01 | Clarified | MVP | UC-01 / S1 | `PasswordHash` | `PasswordHasher` (S) | service, domain | DC, SC, ALS | SI-01, SEC-01 |
| FR-005 | CR-02 | Clarified | MVP | UC-04 / S2 | `Group`, `Membership` | `createGroup` (S, R) | service, domain | UC, DC, SC, MS | SI-03, UT-09, AT-02 |
| FR-006 | CR-02 | Clarified | MVP | UC-04, UC-05 / S2 | BR-23, BR-24; `Membership.addedBy`, `endedBy` | `addMember`, `removeMember`, `leaveGroup` (S, R, U) | service | UC, SC, MS | SI-03, SI-04, RP-01, AT-02 |
| FR-007 | CR-02 | Revised (DEC-08, DEC-09) | MVP | UC-05 / S2 | BR-22; `BalanceSheet.nonZeroPairsFor` | `GroupExitPolicy` (S, R) | service | UC, SC, MS | SI-04, AT-02 |
| FR-008 | CR-02 | Clarified | MVP | UC-04 / S2 | `Group` | `listMyGroups`, `getGroupDetail`, `renameGroup` (S, R, U) | service, ui | UC, DC, SC | SI-03, AT-02 |
| FR-009 | CR-02 | Deferred | Post-MVP | None | `GroupStatus.ARCHIVED` reserved | None | None | DC note | Not in MVP |
| FR-010 | CR-03, CR-04 | Clarified | MVP | UC-06 / S3 | BR-01, BR-02, BR-03, BR-27, BR-30; `Expense` | `createExpense` (S, R, U) | service, domain | UC, DC, SC, EAS, CEA | SI-06, UT-01, AT-03 |
| FR-011 | CR-03 | Clarified | MVP | UC-06 / S3 | BR-04; `SplitAllocator`, `Money` | `createExpense` (S) | domain | DC, EAS, CEA | UT-02 |
| FR-012 | CR-03 | Clarified | MVP | UC-06 / S3 | BR-06; `Share.position` | `createExpense` (S, R, U) | domain | DC, EAS, CEA | UT-02, UT-03, RP-08 |
| FR-013 | CR-03 | Clarified | MVP | UC-06 / S3 | BR-05, BR-06; `Percentage` | `createExpense` (S) | domain, service | DC, EAS, CEA | UT-03, SI-06 |
| FR-014 | CR-03 | Clarified | MVP | UC-06, UC-08 / S3 | BR-28; `Receipt` | `getReceipt`, `ReceiptInspector` (S, R, U) | service, ui | UC, DC, SC | UT-10, SI-06, RP-09, UI-06, SEC-04 |
| FR-015 | CR-03 | Clarified | MVP | UC-06 / S3 | `FieldError` | `ExpenseDraftValidator` (S, U) | service, ui | SC, EAS, CEA | SI-06, SI-12, UI-02, UI-07 |
| FR-016 | CR-03 | Clarified | MVP | UC-07 | BR-11; `Expense.version` | `updateExpense`, `deleteExpense` (S, R, U) | service, domain | UC, DC, EAS, ES | UT-04, SI-06, RP-05, RP-09 |
| FR-017 | CR-05 | Clarified | MVP | UC-10 / S7 | BR-17, BR-18; `Notification` | `NotificationDispatcher`, `list` (S, R, U) | service | UC, SC, EAS, NS, CEA | SI-09, AT-07 |
| FR-018 | CR-05 | Deferred | Post-MVP | None | None | None | None | UC legend | Not in MVP |
| FR-019 | CR-05 | Clarified | MVP | UC-02, UC-10 / S7 | `Notification.readAt` | `unreadCount`, `list`, `markRead` (S, R, U) | service, ui | UC, SC, NS | SI-09, AT-07 |
| FR-020 | CR-06 | Clarified | MVP | UC-06, UC-09 / S4 | BR-08; `ExpenseStatus` | `createExpense`, `LedgerQueryRepository` (S, R) | domain, service | DC, EAS, ES, CEA | UT-04, SI-05, RP-06, AT-04 |
| FR-021 | CR-06 | Clarified | MVP | UC-09 / S4 | BR-09, BR-10 | `approve`, `reject`, `listPendingForMe` (S, R, U) | service, domain | UC, DC, SC, EAS, ES, ARA | UT-04, SI-05, AT-04 |
| FR-022 | CR-06 | Clarified | MVP | UC-09 / S4 | BR-09 | `requireEligibleApprover` (S) | service, domain | SC, EAS, ES, ARA | UT-04, SI-05, AT-04 |
| FR-023 | CR-06 | Clarified | MVP | UC-09, UC-10 / S4 | BR-10, BR-18; `ApprovalDecision.reason` | `reject`, `expenseDecided` (S, U) | service | SC, EAS, NS, ARA | SI-05, SI-09, AT-04 |
| FR-024 | CR-06 | Clarified | MVP | UC-09 / S4 | BR-10; `ApprovalDecision` | `getExpense`, `updateStatusIfPending` (S, R) | service, repository | DC, EAS, ES, ARA | UT-04, SI-05, SI-11, RP-01, RP-05 |
| FR-025 | CR-06 | Deferred | Post-MVP | None | One-decision rule would need relaxing | None | None | UC legend | Not in MVP |
| FR-026 | CR-04, CR-07 | Clarified | MVP | UC-09, UC-11 / S5 | BR-07, BR-12; `LedgerEntry` | `Expense.ledgerEntries`, `LedgerQueryRepository` (S, R) | domain | DC, EAS, ARA | UT-05, SI-07, RP-06, AT-05 |
| FR-027 | CR-07 | Clarified | MVP | UC-11 / S5 | BR-13; `BalanceSheet`, `PairBalance` | `myBalances`, `groupBalances`, `LedgerReader` (S, R) | service, domain | DC, SC, PSS | UT-05, SI-07, AT-05 |
| FR-028 | CR-07 | Clarified | MVP | UC-11 / S5 | BR-13; `CounterpartyBalanceView` | `myBalances` (S, U) | service, ui | UC, SC | SI-07, UI-04, AT-05 |
| FR-029 | CR-07 | Clarified | MVP | UC-11 | BR-13; invariant B3 | `BalanceCalculator` (S) | domain | DC | UT-05, SI-07 |
| FR-030 | CR-08 | Revised (DEC-20) | MVP | UC-12 / S6 | BR-14, BR-27, BR-30; `Payment` | `recordPayment` (S, R, U) | service, domain | UC, DC, SC, PSS, RPA | SI-08, UT-01, RP-01, AT-06 |
| FR-031 | CR-08 | Clarified | MVP | UC-12 / S6 | BR-14; `Payment.ledgerEntry` | `recordPayment` (S) | service, domain | DC, PSS, RPA | SI-08, AT-06 |
| FR-032 | CR-08 | Clarified | MVP | UC-12 / S6 | BR-15; `overpaymentConfirmed` | `PaymentOutcome`, `LedgerReader.owedBy` (S, U) | service, ui | UC, SC, PSS, RPA | SI-08, UI-08, AT-06 |
| FR-033 | CR-08 | Clarified | MVP | UC-12 / S6 | BR-16 | `paymentHistory` (S, R, U) | service, ui | UC, SC, PSS, RPA | SI-08, SEC-03, AT-06 |
| FR-034 | CR-09 | Clarified | MVP | UC-13 / S8 | BR-19; `Report` | `generate` (S, R, U) | service, domain | UC, DC, SC, GRA | SI-10, AT-08 |
| FR-035 | CR-09 | Revised (DEC-13, DEC-14, DEC-15) | MVP | UC-13 / S8 | BR-19; `ReportFilter` | `filterOptions`, `generate` (S, R, U) | service | UC, DC, SC, GRA | SI-10, AT-08 |
| FR-036 | CR-09 | Revised (DEC-12, DEC-13, DEC-14) | MVP | UC-13 / S8 | BR-20; `ReportTotals`, `StatusMemoLine` | `generate`, `ReportCalculator` (S, U) | domain, service | DC, GRA | UT-07, SI-10, AT-08 |
| FR-037 | CR-09 | Revised (DEC-14) | MVP | UC-13 / S8 | BR-21; `CounterpartyNetLine` | `ReportCalculator`, `LedgerReader` (S) | domain, service | DC, GRA | UT-07, SI-10, AT-08 |
| FR-038 | CR-09 | Deferred | Post-MVP | None | `ReportFilter` is a value only | None | None | UC legend | Not in MVP |
| FR-039 | CR-10 | Deferred; **CR-10 unmet** | Post-MVP | None | None | None. `service` boundary is reusable, not a deliverable | None | UC legend, CO note | Not in MVP |
| FR-040 | None. **Derived** (DEC-22): supports CR-01 to CR-09 by inference | Derived | MVP | All | All persisted entities | All repositories, `TransactionRunner` (R) | repository.sqlite | CO | RP-03, RP-04 |
| FR-041 | None. **Derived** (DEC-22): supports CR-03, CR-08, CR-09 and NFR-007 by inference | Derived | MVP | All | BR-30; INV-M1 | `FieldFormats` (S, U) | service, ui | SC | UT-08, UI-04 |

**Mapping note.** The constitution's spec gate says every FR cites a CR. FR-040 and FR-041 are a documented exception awaiting human acceptance. No customer link has been invented for them.

## Non-functional requirements

| NFR | Req. status | Supports | Design elements | UML | Measurable verification |
|---|---|---|---|---|---|
| NFR-001 Accuracy | Clarified | CR-03, CR-07, CR-08 | `Money`, `SplitAllocator`, `BalanceCalculator`, integer cents in storage | DC | UT-01, UT-02, UT-03, UT-05, SI-07, RP-08, ARCH-02 |
| NFR-002 Security | Clarified, timing per DEC-23 | CR-01 | `PasswordHasher`, `User` lockout, `Clock` | ALS, AS | UT-06, SI-01, SI-02, RP-02, SEC-01 |
| NFR-003 Privacy | Revised (DEC-07) | CR-01 | `AccessPolicy`, `VisibilityScope` | CO, SC | SEC-02, SEC-03, SI-12 |
| NFR-004 Performance | Revised (DEC-28) | All | Indexes, scoped queries, `UiTaskRunner`, separate receipt table | CO | PERF-01, PERF-02, RP-09. **Unmeasured** |
| NFR-005 Reliability | Clarified | All | `TransactionRunner`, SQLite settings | CO | RP-03, RP-04 |
| NFR-006 Auditability | Clarified | CR-06, CR-08 | `ApprovalDecision`, `Payment`, append-only repositories, triggers | DC, SC, EAS, PSS | SI-05, RP-05 |
| NFR-007 Usability | Revised (DEC-21) | All | `FieldError`, navigation table | EAS, CEA, RPA | UI-01, UI-02 |
| NFR-008 Accessibility | Clarified | All | Keyboard rules in UI contracts | None | UI-03 |
| NFR-009 Testability | Clarified | All | Pure calculators, fakes, injected `Clock`, layering | CO, SC | ARCH-01, all UT and SI cases |

## Success criteria

| SC | Verified by |
|---|---|
| SC-001, SC-002, SC-009 | UI-09 |
| SC-003 | SI-07 |
| SC-004 | UT-02, UT-03 |
| SC-005 | SI-05, UT-07, SI-10 |
| SC-006 | SI-09 |
| SC-007 | UT-07, SI-10 |
| SC-008 | This matrix, once tests exist |

## Supporting classes

Principle II asks every production class to trace to an FR.

| Class group | Traces to |
|---|---|
| `SplitSmartApp`, `AppConfig` | FR-040; wiring for all MVP FRs |
| `UiTaskRunner`, `ErrorPresenter` | ID-03, NFR-004, NFR-007, FR-015 |
| `MainFrame`, `HomePanel` | FR-003, FR-019, FR-028, NFR-007 |
| Typed IDs | FR-003, NFR-009 |
| `repository.sqlite` schema and migrations | FR-040 |
| `Session` | FR-002, FR-003 |
| `ServiceException` family | FR-015, NFR-007 |
| `DomainRuleViolation` | NFR-009 |
