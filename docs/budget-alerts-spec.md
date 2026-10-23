# Budget Alerts Specification

## Purpose

Help users monitor spending against category budgets, identify categories that
are nearing or over budget, and reallocate unspent funds without changing the
overall budget.

## Scope and behavior

For each category, calculate spending from its current expenses and compare it
with the current allocated budget. Show this status with a progress bar and
plain-language text:

- **On track:** spending is below 80% of the budget.
- **Approaching budget:** spending is at least 80% but below 100%.
- **Over budget:** spending is at least 100% of the budget.

The progress bar represents spending as a percentage of the allocated budget.
Its visual fill is capped at 100%; the displayed percentage and textual status
must still communicate spending above 100%.

Users can transfer funds between two different categories. A transfer reduces
the source budget and increases the destination budget by the same amount, so
the total allocated budget is unchanged. Available funds are the source
category's budget minus its spending, but never less than zero. Transfers may
not reduce a source budget below its current spending.

## Acceptance criteria

1. Each category displays its current spent amount, budget-relative progress,
   and a textual budget status.
2. At 80% and below 100%, the category displays an “Approaching budget”
   warning.
3. At 100% or more, the category displays an “Over budget” alert.
4. Below 80%, the category displays an “On track” status.
5. Progress, status, and remaining funds recalculate when an expense is added
   or deleted, or when a category budget is edited or transferred.
6. The transfer form lets the user select a source category, destination
   category, and amount, and communicates the amount currently available from
   the selected source.
7. A valid transfer increases the destination budget and decreases the source
   budget by the same amount, persists both changes, and refreshes affected
   progress and statuses.
8. Invalid transfers show an understandable error and leave all budgets
   unchanged.
9. Transfer amounts use the app's currency precision of two decimal places.
10. Status and progress are understandable without color. Progress indicators
    have accessible names and current values, and warning/alert text is
    exposed to screen readers. Status changes must be announced accessibly
    without making the whole page noisy.

## Edge cases and decisions

- **Zero budget:** Do not divide by zero. If both budget and spending are zero,
  show 0% and “On track.” If the budget is zero and spending is positive, show
  “Over budget”; expose that fact in text and use a capped, nonzero progress
  indication rather than presenting an invalid percentage.
- **Threshold boundaries:** Exactly 80% is “Approaching budget.” Exactly 100%
  is “Over budget.” Compare using currency-rounded spending and budget values
  so cent-level values at a boundary are classified consistently.
- **Spending above budget:** Keep the progress fill capped at 100%, but show the
  actual percentage or an explicit over-budget amount in accessible text.
- **Transfer greater than available:** Reject the transfer; do not modify
  either budget. Available funds are `max(0, budget - spending)`.
- **Transfer to the same category:** Reject it and leave budgets unchanged.
- **Negative, zero, blank, or non-numeric transfer amount:** Reject it. Reject
  non-finite values as well. Round accepted amounts to cents and validate the
  rounded value so an amount that rounds to zero is not accepted.
- **Transfer from an over-budget category:** Do not allow it. Its available
  amount is zero; the user must first increase its budget or reduce its
  spending before it can fund another category.
- **Transfer into an over-budget or zero-budget category:** Allow it when the
  source has sufficient available funds and the destination is different. The
  destination status must recalculate immediately.
- **Accessibility:** Do not use color as the only status signal. Use a
  semantic progress indicator with an accessible category-specific name and
  current value/text, and expose warning and over-budget messages to assistive
  technology.
- **Changing budgets or expenses:** Recompute from current data rather than
  retaining stale alert state. A status may move in either direction after a
  budget edit, transfer, expense addition, or expense deletion.

## Out of scope

- Automatic transfers, cross-currency transfers, or changing expense amounts.
- Changing the existing expense-category assignment or the overall budgeting
  model.
