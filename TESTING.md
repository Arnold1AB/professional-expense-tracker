# Spending Insights — Testing and Validation

## Tests performed

### Automated

Ran the project test suite, the separate dashboard regression suite, and the
production build after the Spending Insights tests were in place.

| Command | Result |
| --- | --- |
| `npm test` | Passed — Test Files 2 passed (2); Tests 78 passed (78). |
| `npm run test:bug` | Passed — Test Files 1 passed (1); Tests 4 passed (4). |
| `npm run build` | Passed — Vite transformed 27 modules and built the production bundle. |

The automated coverage includes:

- Month-to-date category totals, percentage shares, zero-spend categories,
  unknown-category aggregation, invalid records, and very large amounts.
- Six calendar months in chronological order, year rollover, month-boundary
  dates, zero-value months, and inclusion/exclusion of dates outside the
  defined windows.
- Empty category and trend states, including retaining all six trend labels
  at zero.
- Adding and deleting expenses inside and outside the displayed windows.
- Refreshing date windows at local midnight.
- Existing dashboard, expense form/list, budget, persistence, and regression
  behavior through the existing Vitest and React Testing Library suites.

### Manual

Reviewed generated headless-browser screenshots at 1440px desktop width and
390px mobile width. The first desktop image exposed a clipped final month
label/value in the trend chart; the layout was corrected and both final
screenshots were reviewed. This was a visual check only, not manual
interaction testing. Screen-reader behavior and interactive use in a
non-headless browser remain to be checked.

## Commands and actual terminal results

`npm test`

```text
Test Files  2 passed (2)
     Tests  78 passed (78)
```

`npm run test:bug`

```text
Test Files  1 passed (1)
     Tests  4 passed (4)
```

`npm run build`

```text
✓ 27 modules transformed.
✓ built in 854ms
```

## Bugs found and fixed

- The first new month-label assertion expected `Sep 2026`; the app's
  `en-NG` locale formats that label as `Sept 2026`. Corrected the test to
  assert the actual locale output. This was a test expectation issue, not a
  product calculation bug.
- Visual review found the six-column trend chart could clip its last month
  label/value in a narrow two-column dashboard card. The desktop chart now
  fits its card; on mobile it changes to six labeled horizontal bars.

## Known limitations

- Screen-reader behavior and manual interactive browser testing remain
  outstanding.
- Expense editing is not implemented; add and delete behavior is tested.
- The tests verify that trend data includes dated expenses within the six
  displayed calendar months, including future dates in the current month as
  specified, but do not exercise a real browser across a timezone/DST change.
