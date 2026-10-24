import { describe, expect, it } from 'vitest';
import {
  calculateBudgetPercentage,
  calculateBudgetStatus,
  calculateCategoryRemaining,
  calculateCategorySpent,
  calculateTotalBudget,
  getMonthToDateCategorySpending,
  getMonthlySpending,
  getRecentCalendarMonths,
  getCategorySummaries,
  roundToCents,
  sortExpensesByCategory,
  sortExpensesByDate,
  validateBudgetTransfer,
} from '../src/utils/expenseCalculations.js';
import {
  DEFAULT_CATEGORIES,
  createSampleCategories,
  createSampleExpenses,
} from '../src/data/sampleData.js';
import { formatCurrency, formatDate, parseISODate, toISODate } from '../src/utils/formatters.js';

const categories = [
  { id: 'food', name: 'Food', budget: 100 },
  { id: 'fun', name: 'Fun', budget: 50 },
];

const expenses = [
  { id: 'e1', description: 'Lunch', amount: 12.5, categoryId: 'food', date: '2026-01-03' },
  { id: 'e2', description: 'Dinner', amount: 30.25, categoryId: 'food', date: '2026-01-05' },
  { id: 'e3', description: 'Movie', amount: 60, categoryId: 'fun', date: '2026-01-04' },
];

describe('calculateBudgetPercentage', () => {
  it('calculates spending as a percentage of the budget', () => {
    expect(calculateBudgetPercentage(80, 100)).toBe(80);
    expect(calculateBudgetPercentage(125, 100)).toBe(125);
  });

  it('uses cent-rounded inputs and avoids dividing by zero', () => {
    expect(calculateBudgetPercentage(79.999, 100)).toBe(80);
    expect(calculateBudgetPercentage(0, 0)).toBe(0);
    expect(calculateBudgetPercentage(1, 0)).toBe(100);
  });
});

describe('calculateBudgetStatus', () => {
  it('classifies exact 80% as warning and exact 100% as over budget', () => {
    expect(calculateBudgetStatus(80, 100)).toBe('warning');
    expect(calculateBudgetStatus(100, 100)).toBe('over');
  });

  it('uses cent-rounded amounts when classifying thresholds', () => {
    expect(calculateBudgetStatus(79.999, 100)).toBe('warning');
    expect(calculateBudgetStatus(99.999, 100)).toBe('over');
  });

  it('handles spending above budget and a zero budget without division', () => {
    expect(calculateBudgetStatus(120, 100)).toBe('over');
    expect(calculateBudgetStatus(0, 0)).toBe('ok');
    expect(calculateBudgetStatus(0.01, 0)).toBe('over');
  });

  it('returns on track below the warning threshold', () => {
    expect(calculateBudgetStatus(79.99, 100)).toBe('ok');
  });
});

describe('calculateTotalBudget', () => {
  it('adds up all category budgets', () => {
    expect(calculateTotalBudget(categories)).toBe(150);
  });

  it('returns 0 when there are no categories', () => {
    expect(calculateTotalBudget([])).toBe(0);
  });
});

describe('calculateCategorySpent', () => {
  it('adds up only the expenses in the given category', () => {
    expect(calculateCategorySpent(expenses, 'food')).toBe(42.75);
    expect(calculateCategorySpent(expenses, 'fun')).toBe(60);
  });

  it('returns 0 for a category with no expenses', () => {
    expect(calculateCategorySpent(expenses, 'travel')).toBe(0);
  });

  it('avoids floating point rounding errors', () => {
    const small = [
      { id: 'a', amount: 0.1, categoryId: 'food' },
      { id: 'b', amount: 0.2, categoryId: 'food' },
    ];
    expect(calculateCategorySpent(small, 'food')).toBe(0.3);
  });
});

describe('calculateCategoryRemaining', () => {
  it('subtracts spending from the category budget', () => {
    expect(calculateCategoryRemaining(categories[0], expenses)).toBe(57.25);
  });

  it('allows a negative remaining balance when over budget', () => {
    expect(calculateCategoryRemaining(categories[1], expenses)).toBe(-10);
  });
});

describe('getCategorySummaries', () => {
  it('adds spent, remaining and expenseCount to each category', () => {
    expect(getCategorySummaries(categories, expenses)).toEqual([
      {
        id: 'food',
        name: 'Food',
        budget: 100,
        spent: 42.75,
        remaining: 57.25,
        expenseCount: 2,
        percentUsed: 42.75,
        budgetStatus: 'ok',
      },
      {
        id: 'fun',
        name: 'Fun',
        budget: 50,
        spent: 60,
        remaining: -10,
        expenseCount: 1,
        percentUsed: 120,
        budgetStatus: 'over',
      },
    ]);
  });

  it('warns at 80%, alerts at 100%, and recalculates status from current spending', () => {
    const testCategories = [
      { id: 'warning', name: 'Warning', budget: 100 },
      { id: 'over', name: 'Over', budget: 100 },
      { id: 'empty', name: 'Empty', budget: 0 },
    ];
    const testExpenses = [
      { id: 'w', amount: 80, categoryId: 'warning' },
      { id: 'o', amount: 100, categoryId: 'over' },
      { id: 'e', amount: 1, categoryId: 'empty' },
    ];

    expect(getCategorySummaries(testCategories, testExpenses).map((category) => category.budgetStatus))
      .toEqual(['warning', 'over', 'over']);
    expect(getCategorySummaries(testCategories, testExpenses)[0].percentUsed).toBe(80);
  });

  it('does not modify the original categories', () => {
    const copy = structuredClone(categories);
    getCategorySummaries(categories, expenses);
    expect(categories).toEqual(copy);
  });
});

describe('spending insight calculations', () => {
  const insightCategories = [
    { id: 'food', name: 'Food', icon: '🍽️' },
    { id: 'travel', name: 'Travel', icon: '🚗' },
  ];

  it('generates recent months oldest first across a year boundary', () => {
    expect(getRecentCalendarMonths(new Date(2026, 0, 15)).map((month) => month.key)).toEqual([
      '2025-08',
      '2025-09',
      '2025-10',
      '2025-11',
      '2025-12',
      '2026-01',
    ]);
  });

  it('groups month-to-date spending and excludes past, future, and invalid records', () => {
    const result = getMonthToDateCategorySpending(
      [
        { amount: 10, categoryId: 'food', date: '2026-01-01' },
        { amount: 0.1, categoryId: 'food', date: '2026-01-15' },
        { amount: 20, categoryId: 'missing', date: '2026-01-15' },
        { amount: 30, categoryId: 'travel', date: '2026-01-16' },
        { amount: 40, categoryId: 'food', date: '2025-12-31' },
        { amount: 50, categoryId: 'food', date: '2026-02-01' },
        { amount: 60, categoryId: 'food', date: '2026-01-32' },
        { amount: Number.NaN, categoryId: 'food', date: '2026-01-15' },
      ],
      insightCategories,
      new Date(2026, 0, 15)
    );

    expect(result).toEqual({
      categories: [
        { id: 'food', name: 'Food', icon: '🍽️', amount: 10.1, share: (10.1 / 30.1) * 100 },
        { id: 'travel', name: 'Travel', icon: '🚗', amount: 0, share: 0 },
        { id: 'uncategorized', name: 'Uncategorized', icon: '❔', amount: 20, share: (20 / 30.1) * 100 },
      ],
      total: 30.1,
    });
    expect(result.categories.reduce((sum, category) => sum + category.share, 0)).toBeCloseTo(100);
  });

  it('returns configured zero-spend categories and safe zero shares for an empty period', () => {
    const result = getMonthToDateCategorySpending([], insightCategories, new Date(2026, 0, 15));

    expect(result.total).toBe(0);
    expect(result.categories).toEqual([
      { id: 'food', name: 'Food', icon: '🍽️', amount: 0, share: 0 },
      { id: 'travel', name: 'Travel', icon: '🚗', amount: 0, share: 0 },
    ]);
  });

  it('calculates six monthly totals including zero months and current-month future dates', () => {
    const result = getMonthlySpending(
      [
        { amount: 1.25, date: '2025-08-01' },
        { amount: 2.75, date: '2025-08-31' },
        { amount: 10, date: '2026-01-31' },
        { amount: 100, date: '2026-02-01' },
        { amount: 200, date: '2025-07-31' },
        { amount: 300, date: '2025-09-31' },
      ],
      new Date(2026, 0, 15)
    );

    expect(result.map(({ key, amount }) => [key, amount])).toEqual([
      ['2025-08', 4],
      ['2025-09', 0],
      ['2025-10', 0],
      ['2025-11', 0],
      ['2025-12', 0],
      ['2026-01', 10],
    ]);
  });

  it('retains very large finite amounts without overflowing during cent rounding', () => {
    const result = getMonthToDateCategorySpending(
      [{ amount: 1e308, categoryId: 'food', date: '2026-01-15' }],
      insightCategories,
      new Date(2026, 0, 15)
    );

    expect(result.categories[0].amount).toBe(1e308);
    expect(result.total).toBe(1e308);
    expect(Number.isFinite(result.categories[0].share)).toBe(true);
  });
});

describe('validateBudgetTransfer', () => {
  const source = { id: 'source', remaining: 25.5 };
  const destination = { id: 'destination', remaining: 0 };

  it('accepts a valid transfer and rounds it to cents', () => {
    expect(validateBudgetTransfer(source, destination, '10.129')).toEqual({
      valid: true,
      amount: 10.13,
    });
  });

  it.each(['', '   ', 'abc', '-1', '0', '0.001', '25.51'])(
    'rejects invalid or unavailable transfer amount %j',
    (amount) => {
      expect(validateBudgetTransfer(source, destination, amount)).toMatchObject({
        valid: false,
        error: expect.any(String),
      });
    }
  );

  it('rejects transfers to the same category or from an over-budget category', () => {
    expect(validateBudgetTransfer(source, source, 1)).toMatchObject({ valid: false });
    expect(validateBudgetTransfer({ id: 'over', remaining: -5 }, destination, 1)).toMatchObject({
      valid: false,
    });
  });
});

describe('sortExpensesByDate', () => {
  it('sorts newest first by default', () => {
    expect(sortExpensesByDate(expenses).map((e) => e.id)).toEqual(['e2', 'e3', 'e1']);
  });

  it('can sort oldest first', () => {
    expect(sortExpensesByDate(expenses, 'oldest').map((e) => e.id)).toEqual(['e1', 'e3', 'e2']);
  });

  it('does not modify the original array', () => {
    const ids = expenses.map((e) => e.id);
    sortExpensesByDate(expenses);
    expect(expenses.map((e) => e.id)).toEqual(ids);
  });
});

describe('sortExpensesByCategory', () => {
  it('groups by category name A–Z, newest first within each category', () => {
    expect(sortExpensesByCategory(expenses, categories).map((e) => e.id)).toEqual([
      'e2',
      'e1',
      'e3',
    ]);
  });

  it('puts expenses with an unknown category last', () => {
    const withUnknown = [
      { id: 'u1', amount: 5, categoryId: 'deleted', date: '2026-01-09' },
      ...expenses,
    ];
    expect(sortExpensesByCategory(withUnknown, categories).map((e) => e.id)).toEqual([
      'e2',
      'e1',
      'e3',
      'u1',
    ]);
  });

  it('does not modify the original array', () => {
    const ids = expenses.map((e) => e.id);
    sortExpensesByCategory(expenses, categories);
    expect(expenses.map((e) => e.id)).toEqual(ids);
  });
});

describe('roundToCents', () => {
  it('rounds to two decimal places', () => {
    expect(roundToCents(1.005 + 2.001)).toBe(3.01);
    expect(roundToCents(0.1 + 0.2)).toBe(0.3);
  });
});

describe('formatters', () => {
  it('formats currency as Naira', () => {
    expect(formatCurrency(1234.5)).toBe('₦1,234.50');
    expect(formatCurrency(-2669.55)).toBe('-₦2,669.55');
  });

  it('converts dates to and from YYYY-MM-DD', () => {
    expect(toISODate(new Date(2026, 0, 9))).toBe('2026-01-09');
    expect(parseISODate('2026-01-09')).toEqual(new Date(2026, 0, 9));
  });

  it('rejects invalid dates', () => {
    expect(parseISODate('')).toBeNull();
    expect(parseISODate('2026-02-30')).toBeNull();
    expect(parseISODate('not-a-date')).toBeNull();
  });

  it('formats dates for display', () => {
    expect(formatDate('2026-10-11')).toBe('11 Oct 2026');
  });
});

describe('sample data', () => {
  const sampleCategories = createSampleCategories();
  const sampleExpenses = createSampleExpenses(new Date(2026, 9, 11));
  const summaries = getCategorySummaries(sampleCategories, sampleExpenses);
  const percentUsed = (category) => (category.spent / category.budget) * 100;

  it('has six categories totalling a ₦270,000 budget', () => {
    expect(sampleCategories).toHaveLength(6);
    expect(calculateTotalBudget(sampleCategories)).toBe(270000);
  });

  it('has 25-30 expenses with unique IDs in known categories', () => {
    expect(sampleExpenses.length).toBeGreaterThanOrEqual(25);
    expect(sampleExpenses.length).toBeLessThanOrEqual(30);
    expect(new Set(sampleExpenses.map((e) => e.id)).size).toBe(sampleExpenses.length);
    const categoryIds = sampleCategories.map((c) => c.id);
    sampleExpenses.forEach((e) => expect(categoryIds).toContain(e.categoryId));
  });

  it('includes categories below 50%, between 80-99%, and at or above 100% of budget', () => {
    expect(summaries.some((c) => percentUsed(c) < 50)).toBe(true);
    expect(summaries.some((c) => percentUsed(c) >= 80 && percentUsed(c) < 100)).toBe(true);
    expect(summaries.some((c) => percentUsed(c) >= 100)).toBe(true);
  });

  it('has the expected spending per category', () => {
    const spentById = Object.fromEntries(summaries.map((c) => [c.id, c.spent]));
    expect(spentById).toEqual({
      food: 85498.98,
      transportation: 21982.95,
      shopping: 32669.55,
      entertainment: 15262.5,
      bills: 29968.75,
      health: 15315.05,
    });
  });

  it('generates dates relative to today, all within the last 28 days', () => {
    const dates = sampleExpenses.map((e) => e.date).sort();
    expect(dates[dates.length - 1]).toBe('2026-10-11');
    expect(dates[0]).toBe('2026-09-14');
  });

  it('returns fresh copies so callers cannot modify the defaults', () => {
    const copy = createSampleCategories();
    copy[0].budget = 1;
    expect(DEFAULT_CATEGORIES[0].budget).toBe(100000);
  });
});
