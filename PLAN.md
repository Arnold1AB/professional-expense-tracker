# Spending Insights — Technical Implementation Plan

This plan maps `SPEC.md` to the current React/Vite application. It is a
planning document only; no feature code or charting dependency is introduced
by this change.

## Proposed technical approach

- Add a read-only **Spending Insights** section to the existing dashboard.
  Keep expenses and categories as the source of truth in `App.jsx` and
  `localStorage`; calculate all insights at render time from the current props.
- Put date-window and aggregation logic in pure functions in
  `src/utils/expenseCalculations.js`, alongside existing expense helpers.
  Reuse existing `roundToCents` and `parseISODate` helpers, and pass an
  explicit `today` value into new functions so periods are deterministic in
  tests and use the user's local calendar date in the app. Use the existing
  `formatCurrency` helper for displayed Naira amounts.
- Build the visualizations from native React markup and CSS bars rather than
  adding a charting package. The category comparison can use horizontal bars;
  the six-month trend can use six labeled columns/bars. Pair each visual with
  a semantic text/table equivalent containing all values, so chart meaning
  does not depend on color, position, SVG interpretation, or hover behavior.
- Keep chart state out of storage. Expense additions/deletions already update
  React state in `App.jsx`; passing the updated expense list into the insights
  component naturally recalculates the charts.

## Existing files or components that need to change

- **`src/App.jsx`** — Continue to pass the current expense and category
  collections through the dashboard. No changes to expense persistence or
  mutation handlers are expected. The page's local-date refresh may be
  implemented in the insights component or a small date hook; it must
  re-render the date windows at local midnight even if expense state is idle.
- **`src/components/Dashboard.jsx`** — Add the Spending Insights section
  beneath the existing summary cards and expense breakdown, or delegate that
  section to a new component. Preserve the existing budget summary and
  `Expense Breakdown` behavior.
- **`src/utils/expenseCalculations.js`** — Add pure period-generation and
  category/month aggregation helpers, reusing existing date and rounding
  utilities. Do not change the existing budget or total helper semantics.
- **`src/utils/formatters.js`** — No change expected; reuse `formatCurrency`,
  `parseISODate`, and `toISODate` where appropriate.
- **`src/styles.css`** — Add chart layout, bar, label, and mobile styles.
  Reuse existing CSS variables and card patterns; prevent narrow-screen
  clipping and provide visible labels/values without color-only encoding.
- **`tests/expenseCalculations.test.js`** — Add fixed-date unit tests for
  period boundaries, totals, percentages, zero-value categories, and unknown
  categories.
- **`tests/components.test.jsx`** — Add dashboard-level tests for displayed
  chart values, empty states, updates after add/delete, accessibility
  equivalents, and month rollover.
- **`package.json`** — No dependency change is planned. The project currently
  has React/Vite and testing dependencies but no chart library.

## New components or functions required

Suggested small, focused additions:

- **`src/components/SpendingInsights.jsx`** (new component) — Accept
  `expenses` and `categories`, determine the current local date, call the
  aggregation helper, and render the category and monthly insight cards. It
  may contain chart markup directly unless the resulting component becomes
  unwieldy.
- **`getSpendingInsights(categories, expenses, today)`** — Return a stable
  composed data shape with month-to-date category rows and six monthly
  totals, delegating the calculations to the separate pure functions below.
- **`getMonthToDateCategorySpending(expenses, categories, today)`** — Return
  every configured category with its ID/name, rounded amount, and share.
  Include an `Uncategorized` row only when an in-period expense has an
  unknown category ID; include it in the share denominator.
- **`getMonthlySpending(expenses, today, monthCount = 6)`** — Return one row
  per month in chronological order with a `YYYY-MM` key, display label, and
  rounded total, including months with zero spending.
- **`getRecentCalendarMonths(today, count = 6)`** (or an equivalent private
  helper) — Generate six month keys in oldest-to-newest order using local
  calendar constructors, including year transitions. Keep this date-window
  helper independently testable as well.
- **Local-date refresh** — Use a small `useEffect` timer to schedule a
  re-render at the next local midnight and reschedule after each refresh.
  Clean up the timer on unmount. Recheck the date when the document becomes
  visible so a throttled background timer does not leave stale periods on
  return to the page. A hook is optional; avoid adding one if this behavior
  remains clear and contained in the insights component.

## Data processing and aggregation approach

1. Generate six month keys from the local current month back five months.
   Construct month boundaries with local `Date` fields, not UTC parsing, so
   January/year transitions and local date semantics are explicit.
2. Establish the category-chart range from the first day of the current
   month through today's local date, inclusive. Exclude future-dated records
   from this chart.
3. Establish the trend range from the first day of the oldest displayed month
   through the last day of the current month. Follow FR2's per-calendar-month
   definition for this chart; a valid dated record contributes to its
   calendar month, including a future-dated record within the current month.
4. Compare valid `YYYY-MM-DD` date strings against similarly formatted local
   date boundaries, using the existing `parseISODate` helper to reject
   malformed values. Do not use `new Date('YYYY-MM-DD')` for expense-date
   comparison because UTC interpretation can shift a date across a local
   month boundary.
5. In `getMonthToDateCategorySpending`, initialize each configured category
   to zero and accumulate only expenses in the inclusive month-to-date range.
   Match category IDs against the current categories; aggregate unknown IDs
   under `Uncategorized`. Round returned monetary totals with the existing
   `roundToCents`.
6. In `getMonthlySpending`, initialize each of the six generated months to
   zero and sum expenses by their `YYYY-MM` date prefix when their date is
   valid and in the six-month window. Follow FR2's per-calendar-month
   definition, including future dates within the current month. Round
   returned totals with `roundToCents`.
7. Exclude non-finite or non-positive amounts defensively; normal
   app-created expenses already satisfy the form's amount/date validation.
   Calculate category shares from the total represented in the category
   chart. When the total is greater than zero, round shares only for display;
   when it is zero, avoid division and show the specified empty message.
   Trend totals do not use budgets.
8. Keep all six month labels and zero-valued periods in the trend data even
   when the entire six-month window is empty. Show the specified empty
   message while retaining those labeled zero values.

## Charting or visualisation approach

- **Category chart:** Use a list of horizontal, proportionally sized bars,
  one for each configured category, with a visible category name, formatted
  Naira amount, and percentage. If applicable, include an `Uncategorized`
  row. A zero value has a visible label and an empty track. Use a common
  scale based on the largest category value; guard the all-zero case.
- **Monthly trend:** Use six bars in chronological order, with month labels
  and formatted totals always visible. Scale heights against the largest
  period total and show zero values with labels even when the bar has no
  height. Keep month names and amounts in a semantic table or list adjacent
  to, or directly following, the visual.
- **Accessibility:** Give each chart region a heading and accessible name.
  Use semantic lists/tables for the equivalent data; do not rely on
  `title`-only tooltips or color. Ensure the category/month labels and values
  remain available to screen readers and keyboard users. Static chart bars
  need not be interactive.
- **Responsive behavior:** Let category rows wrap names and values without
  overlap. On narrow screens, make the six-month visual fit the card or
  allow deliberate horizontal scrolling while keeping the text equivalent
  fully readable. Avoid fixed-width labels that clip large currency totals.
- **Dependency decision:** Native CSS is sufficient for two simple,
  non-interactive charts and avoids bundle/dependency cost. If implementation
  later requires a chart package, review accessibility and bundle impact
  before changing this decision.

## Implementation steps

Keep each step independently reviewable, with its tests added alongside the
behavior it covers:

1. Add the local calendar-month window helper and its tests for six-month
   ordering, year rollover, and month boundaries.
2. Add `getMonthToDateCategorySpending` and focused tests for inclusion
   boundaries, zero categories, shares, unknown categories, and empty data.
3. Add `getMonthlySpending` and focused tests for monthly totals, empty
   months, future dates in the current month, invalid records, and large
   amounts.
4. Add the local-date refresh behavior (midnight timer, visibility recheck,
   cleanup) and isolated tests for rollover and timer cleanup.
5. Add `SpendingInsights` with semantic headings and the complete text/table
   representation; integrate it into `Dashboard.jsx` without changing
   existing dashboard calculations.
6. Add CSS bar visuals and responsive styling, checking readable labels,
   zero bars, large currency values, and narrow viewports.
7. Add end-to-end component coverage for add/delete recalculation, empty
   states, and accessibility, using the existing App data flow.
8. Run the full `npm test` suite and `npm run build`, then review behavior and
   layout against `SPEC.md`.

## Testing strategy

### Pure calculation tests

- Freeze `today` and verify the month-to-date range includes the first and
  last day, excludes the previous month, and excludes a future date.
- Verify six month keys are exactly six, ordered oldest to newest, include
  the current month, and cross a year boundary correctly.
- Verify monthly totals for entries on the first and last day of a month and
  ensure a date-only value is not shifted by timezone parsing.
- Verify every configured category is present, zero-spend categories have
  amount/share zero, and displayed shares sum to approximately 100% when
  there is spending.
- Verify unknown category IDs contribute to `Uncategorized` and the share
  denominator.
- Verify one expense yields a 100% category share; zero expenses avoid
  division by zero; large finite amounts remain accurately rounded and
  included; malformed dates and invalid amounts are safely excluded.
- Verify helpers do not mutate categories or expenses.

### Component and integration tests

- Render fixed test data and assert the accessible chart regions, category
  names, month labels, currency totals, shares, and equivalent text/table
  values.
- Add and delete an expense through the existing UI and assert the relevant
  month/category values update immediately without a reload.
- Cover no month-to-date expenses and no expenses in the six-month window:
  show the appropriate message while retaining six zero-valued month labels
  for the trend.
- Cover a zero-spend configured category, one expense, an unknown category,
  and a very large amount without rendering errors or inaccessible values.
- With fake timers/local system time, advance across local midnight and a
  month boundary; verify the category window and six-month trend update.
  Verify component unmount clears scheduled timers.
- Run the full existing `npm test` suite to guard dashboard, expense,
  budget, and persistence behavior, then run `npm run build`.
