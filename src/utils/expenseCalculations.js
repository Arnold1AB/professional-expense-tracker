/**
 * Pure helper functions for expense and budget math.
 * Components should use these instead of calculating totals inline.
 */
import { parseISODate, toISODate } from './formatters.js';

/** Rounds a number to 2 decimal places to avoid floating point noise. */
export function roundToCents(value) {
  if (Number.isFinite(value) && Math.abs(value) > Number.MAX_VALUE / 100) {
    return value;
  }
  return Math.round(value * 100) / 100;
}

/** Spending as a percentage of budget, using a capped safe value for zero budgets. */
export function calculateBudgetPercentage(spent, budget) {
  const roundedSpent = roundToCents(Number(spent));
  const roundedBudget = roundToCents(Number(budget));

  if (roundedBudget <= 0) {
    return roundedSpent > 0 ? 100 : 0;
  }
  return (roundedSpent / roundedBudget) * 100;
}

/** Budget status based on cent-rounded spending and budget amounts. */
export function calculateBudgetStatus(spent, budget) {
  const spentInCents = Math.round(roundToCents(Number(spent)) * 100);
  const budgetInCents = Math.round(roundToCents(Number(budget)) * 100);

  if (budgetInCents <= 0) {
    return spentInCents > 0 ? 'over' : 'ok';
  }
  if (spentInCents >= budgetInCents) {
    return 'over';
  }
  if (spentInCents * 100 >= budgetInCents * 80) {
    return 'warning';
  }
  return 'ok';
}

/** Sum of all category budgets. */
export function calculateTotalBudget(categories) {
  return roundToCents(categories.reduce((total, category) => total + Number(category.budget), 0));
}

/** Sum of all recorded expenses. */
export function calculateTotalExpenses(expenses) {
  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  return roundToCents(total);
}

/** Total budget minus total expenses. May be negative. */
export function calculateRemainingBalance(categories, expenses) {
  return roundToCents(calculateTotalBudget(categories) - calculateTotalExpenses(expenses));
}

/** Sum of the expenses that belong to one category. */
export function calculateCategorySpent(expenses, categoryId) {
  return roundToCents(
    expenses
      .filter((expense) => expense.categoryId === categoryId)
      .reduce((total, expense) => total + Number(expense.amount), 0)
  );
}

/** Category budget minus what has been spent in it. May be negative. */
export function calculateCategoryRemaining(category, expenses) {
  return roundToCents(Number(category.budget) - calculateCategorySpent(expenses, category.id));
}

/**
 * Returns each category with its calculated `spent`, `remaining`
 * and `expenseCount` values. Does not modify the input.
 */
export function getCategorySummaries(categories, expenses) {
  return categories.map((category) => {
    const spent = calculateCategorySpent(expenses, category.id);
    const budget = Number(category.budget);

    return {
      ...category,
      spent,
      remaining: roundToCents(budget - spent),
      expenseCount: expenses.filter((expense) => expense.categoryId === category.id).length,
      percentUsed: calculateBudgetPercentage(spent, budget),
      budgetStatus: calculateBudgetStatus(spent, budget),
    };
  });
}

/** Returns calendar months in chronological order, including `today`'s month. */
export function getRecentCalendarMonths(today = new Date(), count = 6) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - count + index + 1, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    return {
      key,
      label: date.toLocaleDateString('en-NG', { month: 'short', year: 'numeric' }),
    };
  });
}

/** Month-to-date spending grouped by category, including unknown category IDs. */
export function getMonthToDateCategorySpending(expenses, categories, today = new Date()) {
  const todayDate = toISODate(today);
  const monthStart = `${todayDate.slice(0, 7)}-01`;
  const categoryTotals = new Map(categories.map((category) => [category.id, 0]));
  let uncategorizedTotal = 0;

  expenses.forEach((expense) => {
    if (
      !parseISODate(expense.date) ||
      expense.date < monthStart ||
      expense.date > todayDate
    ) {
      return;
    }

    const amount = Number(expense.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    if (categoryTotals.has(expense.categoryId)) {
      categoryTotals.set(expense.categoryId, categoryTotals.get(expense.categoryId) + amount);
    } else {
      uncategorizedTotal += amount;
    }
  });

  const categorySpending = categories.map((category) => ({
    id: category.id,
    name: category.name,
    icon: category.icon,
    amount: roundToCents(categoryTotals.get(category.id)),
  }));

  if (uncategorizedTotal > 0) {
    categorySpending.push({
      id: 'uncategorized',
      name: 'Uncategorized',
      icon: '❔',
      amount: roundToCents(uncategorizedTotal),
    });
  }

  const total = roundToCents(
    categorySpending.reduce((sum, category) => sum + category.amount, 0)
  );

  return {
    categories: categorySpending.map((category) => ({
      ...category,
      share: total > 0 ? (category.amount / total) * 100 : 0,
    })),
    total,
  };
}

/** Spending totals for the requested recent calendar months, oldest first. */
export function getMonthlySpending(expenses, today = new Date(), monthCount = 6) {
  const months = getRecentCalendarMonths(today, monthCount);
  const monthTotals = new Map(months.map(({ key }) => [key, 0]));

  expenses.forEach((expense) => {
    if (!parseISODate(expense.date)) {
      return;
    }

    const amount = Number(expense.amount);
    const monthKey = expense.date.slice(0, 7);
    if (Number.isFinite(amount) && amount > 0 && monthTotals.has(monthKey)) {
      monthTotals.set(monthKey, monthTotals.get(monthKey) + amount);
    }
  });

  return months.map((month) => ({
    ...month,
    amount: roundToCents(monthTotals.get(month.key)),
  }));
}

/** Validates and rounds a transfer using the source category's unspent budget. */
export function validateBudgetTransfer(source, destination, amount) {
  if (!source || !destination || source.id === destination.id) {
    return { valid: false, error: 'Choose different source and destination categories.' };
  }
  if (typeof amount === 'string' && amount.trim() === '') {
    return { valid: false, error: 'Enter an amount greater than 0 and no more than the source category’s available funds.' };
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return { valid: false, error: 'Enter an amount greater than 0 and no more than the source category’s available funds.' };
  }

  const roundedAmount = roundToCents(numericAmount);
  const availableFunds = Math.max(0, Number(source.remaining));
  if (roundedAmount <= 0 || roundedAmount > availableFunds) {
    return { valid: false, error: 'Enter an amount greater than 0 and no more than the source category’s available funds.' };
  }

  return { valid: true, amount: roundedAmount };
}

/** Returns a new array sorted by date, newest first (or oldest first). */
export function sortExpensesByDate(expenses, order = 'newest') {
  const direction = order === 'oldest' ? 1 : -1;
  return [...expenses].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -direction : direction;
    if (a.id === b.id) return 0;
    return a.id < b.id ? -direction : direction;
  });
}

/**
 * Returns a new array grouped by category name (A–Z), newest first within
 * each category. Expenses with an unknown category go last.
 */
export function sortExpensesByCategory(expenses, categories) {
  const namesById = Object.fromEntries(categories.map((category) => [category.id, category.name]));
  return sortExpensesByDate(expenses).sort((a, b) => {
    const nameA = namesById[a.categoryId];
    const nameB = namesById[b.categoryId];
    if (nameA === nameB) return 0;
    if (nameA === undefined) return 1;
    if (nameB === undefined) return -1;
    return nameA.localeCompare(nameB);
  });
}
