# Spending Insights Feature Specification

## Problem statement

ExpenseFlow currently shows overall totals and a category spending breakdown,
but users cannot readily compare how much they spend across categories or see
whether their spending is changing over time. This makes it harder to spot
high-spend categories and understand monthly spending patterns.

## Feature overview

Add a **Spending Insights** section to the dashboard with:

- A category chart showing spending from the start of the current calendar
  month through today.
- A monthly trend chart showing totals for the current calendar month and the
  five preceding calendar months.

Both charts use the app's existing expenses and categories. Amounts are shown
in Nigerian Naira (₦). The feature is informational: it does not change
expenses, category budgets, or stored data.

## Functional requirements

**FR1 — Category spending visualization.** Show spending by category for the
current calendar month-to-date. Include every configured category, including
categories with no expenses in the period. For each category, show its name,
total amount, and share of total spending represented in this chart. If
expenses have unknown category IDs, include them in an “Uncategorized” group
and in the share denominator. Use a chart that makes relative amounts easy
to compare, and provide the exact values in text.

**FR2 — Spending trend visualization.** Show total spending for each of the
six calendar months from the current month back through the preceding five
months. Display all six months in chronological order, including months with
zero spending. Each period's total is the sum of expenses dated within that
calendar month.

**FR3 — Keep insights current.** Derive chart values from the current expense
and category data. Update both charts immediately after an expense is added
or deleted, without requiring a page reload. Recompute the current month and
six-month window when the user's local calendar date changes, including while
the page remains open; do not persist derived chart values.

**FR4 — Handle empty and unusual data.** Provide clear empty-state text when
there are no expenses in the relevant period. A category with no spending
must still appear with ₦0 and a 0% share when the category chart has data.
Handle a single expense, very large finite amounts, and expenses whose
category ID does not match a configured category without rendering errors or
misleading chart scales. Unmatched-category expenses must be represented as
“Uncategorized” so chart totals reconcile with the expenses included in the
period.

**FR5 — Make charts accessible and readable.** Charts must not rely on color
alone to distinguish categories or convey values. Provide an accessible name
and an equivalent text or tabular representation of every plotted period,
category, amount, and share. Format amounts consistently with the app's
existing Naira currency formatting. Keep labels and data usable at narrow
screen widths.

## Acceptance criteria

1. **FR1:** In a fixed test date, the category chart includes each configured
   category and sums only that category's expenses dated from the first day
   of the current month through today. It displays the category amount and
   percentage share; percentages total 100% when total spending is greater
   than zero (subject only to display rounding).
2. **FR1:** Expenses dated before the current month or after today do not
   affect the month-to-date category chart.
3. **FR2:** The trend chart contains exactly six monthly periods, ordered
   oldest to newest, with each month's value equal to the sum of expenses
   dated within that month. Empty months appear with a zero value.
4. **FR2:** An expense on a month boundary is counted in the month specified
   by its `YYYY-MM-DD` date, not shifted to an adjacent day or month by
   timezone conversion.
5. **FR3:** Adding an expense dated in a displayed period changes the
   corresponding category and monthly totals immediately. Deleting that
   expense removes its amount from both charts immediately.
6. **FR3:** Adding or deleting an expense outside the displayed periods does
   not change any displayed chart total.
7. **FR3:** When the local date advances to a new month while the page remains
   open, the category chart uses the new month-to-date period and the trend
   chart advances to the new six-month window without requiring a reload.
8. **FR4:** With no month-to-date expenses, show a clear category-chart empty
    message. If there are no expenses in the entire six-month trend window,
    show a clear trend empty message and retain all six labeled months with
    zero values. The page remains usable in both cases.
9. **FR4:** With one expense, its category and month show the full expense
    amount and the category share is 100%. Other configured categories and
    empty trend months remain visible with zero values.
10. **FR4:** A category with no spending alongside other expenses appears with
    ₦0 and 0%. An expense with an unknown category ID is included in an
    “Uncategorized” total rather than silently omitted.
11. **FR4:** Large finite expense amounts remain included in the correct
    totals, are formatted as Naira, and do not cause chart rendering errors
    or make other values unreadable.
12. **FR5:** A user or assistive technology can determine each category's
    name, amount, and share, and each trend month's label and amount, without
    relying on chart color or visual position alone.
13. **FR5:** All displayed amounts use the app's standard currency formatting;
    charts remain readable at a narrow mobile viewport without clipping
    essential labels or values.

## Assumptions and constraints

- Calendar periods use the user's local calendar date. Expense dates are
  date-only `YYYY-MM-DD` values, and comparisons must not introduce timezone
  shifts.
- “Current month-to-date” includes the first day of the current month and
  today, but excludes future-dated expenses.
- The six-month trend includes the current calendar month, even if it is not
  complete, and the five immediately preceding calendar months.
- If the page stays open across local midnight, the date windows refresh for
  the new local date without requiring an expense change or page reload.
- Existing expense amounts are positive Naira values with up to two decimal
  places, as enforced by the expense form. Totals and shares are calculated
  from expense data rather than category budgets.
- Category names and IDs come from the app's current category data. No new
  expense fields or backend services are required.
- Empty-state messaging is evaluated independently for each displayed
  period. A zero-spend category is shown when there is other spending in the
  category chart; if the whole period is empty, the chart-level empty state
  takes precedence.
- The charts are read-only and must coexist with the existing dashboard,
  budget, expense, and localStorage behavior.

## Out-of-scope functionality

- User-selectable date ranges, arbitrary date filters, or daily/weekly trends.
- Forecasting, spending targets, recommendations, alerts, or budget-versus-
  actual analysis.
- Editing expenses, changing categories, adding categories, or modifying
  budgets from the insights section.
- Exporting, printing, sharing, or syncing insights; accounts, server storage,
  and cross-device data.
- Currency conversion or support for currencies other than Nigerian Naira.
