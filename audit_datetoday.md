# Debts Module Audit — 2025-11-13

## Scope & Method
- Reviewed debt-focused pages (`src/pages/DebtsPage.tsx`, `CustomerDebtPage.tsx`, `PostDayDebtWizard.tsx`) and shared debt components under `src/components/debts`.
- Inspected supporting hooks and queries (`src/lib/hooks/useDebts.ts`, `src/lib/queries/debtsQueries.ts`, API adapters) plus existing automated tests.
- Static code inspection only; no runtime validation or command execution performed during this pass.

## Page-Level Findings
### src/pages/DebtsPage.tsx
- Strengths: merges customer registry with live debt summary, offers quick search/actions, and adapts pagination for small screens.
- Gaps: lacks loading/empty-state messaging; `location` is typed as `string` leading to `location as never` casts; customers without tabs default to epoch timestamps that would read as 1970 if surfaced.
- Risks: payment dialog relies solely on summary cache for `currentBalance`, so stale data can allow unexpected partial payments until the modal refreshes; missing error surfacing if queries fail.

### src/pages/CustomerDebtPage.tsx
- Strengths: consolidates open/closed tab views, action dialogs, and inline pagination with highlight support for deep links.
- Gaps: notes tab is placeholder text; casts customer payload from `unknown` instead of adapting types; no skeleton or error banner while data loads.
- Risks: `markPaidNow` ignores mutation errors (dialog closes even on failure); `useTodaySalesQuery` loads the full "today" dataset and filters client-side, which may scale poorly; recurring `matchMedia` listeners are registered twice (modern `addEventListener` plus legacy `addListener`).

### src/pages/PostDayDebtWizard.tsx
- Strengths: clear four-step flow with contextual metrics and balance previews; reuses shared pricing helpers.
- Gaps: wizard only submits a single line item, so batching multiple customers requires reruns; payment step does not validate against outstanding balances; relies on integer-only inputs which block centavo values; lacks asynchronous state feedback (spinners, error toasts) on `createCharge`/`createPayment` failures.
- Risks: submissions use `transactionDate` in `YYYY-MM-DD` format while other forms send full ISO timestamps—risk of inconsistent backend ordering; payment path allows overpayment and negative balances if backend validation loosens; state is never reset when revisiting prior steps, so stale form data can leak across customers.

## Component Findings
### Forms & Previews (`DebtAdjustmentForm`, `DebtPaymentForm`, `DebtChargeForm`, `BalancePreview`)
- `DebtAdjustmentForm` enforces a zero minimum via `NumberInput`, yet the helper copy still references negative adjustments; tighten the messaging and validation so the UI consistently reflects whole-number, positive-only adjustments.
- `DebtPaymentForm` inherits the integer-only limitation and omits quick-value buttons by passing `[]`, forcing manual entry even for common payments.
- `DebtChargeForm` works for positive whole containers but allows submission with stale customer selection if the list refetches while the popover is open; success resets do not clear `customerId` when invoked outside a customer context.
- `BalancePreview` reports 100% increase whenever the current balance is zero and a new charge is entered, which overstates changes for first-time customers; consider toggling the bar logic based on delta direction.

### Timeline & History (`DebtTimeline`, `DebtHistoryTable`, `DebtCustomerCard`)
- `DebtTimeline` renders raw numeric values for `unitPrice` and `amount` instead of using `formatCurrency`, and assumes every transaction type maps to the `tone` dictionary (no fallback for future types such as write-offs).
- `DebtHistoryTable` lacks loading/empty states, re-registers `matchMedia` listeners twice, and exposes filters via clickable `Badge` components without button semantics (hurts keyboard users); PDF export depends on `window.open`, which many browsers block by default.
- `DebtCustomerCard` relies on the upstream `location as never` cast and provides no fallback when balances are negative (e.g., refunds), always labeling them "Outstanding".

## Hooks, Queries, and Adapters
- `useDebts` returns a helper that itself calls hooks; consumers must ensure they only call `useTransactions` at the top level—documenting this pattern would reduce misuse risk.
- API adapters still surface `customer` payloads as `unknown`, forcing downstream casts; introducing typed adapters would eliminate runtime surprises.
- Query consumers on the UI side almost never read `isLoading`/`error`, so request failures silently fail aside from global toasts; missing refetch triggers on tab change may keep stale data visible after mutations.

## Testing Coverage
- Only `tests/debts-cache.spec.ts` exists, validating cache invalidation helpers; there are no component or integration tests for forms, timeline rendering, or wizard flows.

## Recommended Actions
- **High**: Ensure debt form guardrails and helper text match the whole-number, positive-only policy (`DebtAdjustmentForm`, `DebtPaymentForm`); reinforce overpayment checks and fetch fresh `currentBalance` data before opening payment dialogs to avoid stale limits.
- **High**: Surface query states (loading, error, empty) across debt pages and history tables; add at least basic inline feedback to prevent blank screens during network issues.
- **High**: Replace the `location as never` workaround by typing merged customer data with `Location`, and adapt API responses to avoid `unknown` casts.
- **Medium**: Normalize timestamp usage (full ISO vs date-only) across all debt mutations to keep backend ordering deterministic.
- **Medium**: Harden `DebtTimeline`/`DebtHistoryTable` displays (currency formatting, accessible filter controls, export fallbacks) and add guards for unexpected transaction types.
- **Medium**: Expand automated coverage beyond cache invalidation—focus on form validation, timeline rendering with mixed transaction types, and wizard navigation.
- **Low**: Consider extending the post-day wizard to support batching multiple entries before submission, or rename the screen to set expectations.
