/**
 * Regression tests for the dashboard "Total Expenses" figure.
 * Run with: npm run test:bug
 */
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import App from '../../src/App.jsx';
import {
  calculateCategorySpent,
  calculateRemainingBalance,
  calculateTotalExpenses,
} from '../../src/utils/expenseCalculations.js';
import { createSampleCategories, createSampleExpenses } from '../../src/data/sampleData.js';

describe('Total Expenses', () => {
  it('adds up every expense, including several on the same day', () => {
    const expenses = [
      { id: 'a', amount: 1500.5, categoryId: 'food', date: '2026-01-05' },
      { id: 'b', amount: 2000.25, categoryId: 'food', date: '2026-01-05' },
      { id: 'c', amount: 999.99, categoryId: 'fun', date: '2026-01-06' },
    ];
    expect(calculateTotalExpenses(expenses)).toBe(4500.74);
  });

  it('matches the sum of every category in the sample data', () => {
    const categories = createSampleCategories();
    const expenses = createSampleExpenses();
    const sumOfCategories = categories.reduce(
      (total, category) => total + calculateCategorySpent(expenses, category.id),
      0
    );

    expect(calculateTotalExpenses(expenses)).toBe(Math.round(sumOfCategories * 100) / 100);
    expect(calculateTotalExpenses(expenses)).toBe(200697.78);
  });

  it('gives the correct remaining balance for the sample data', () => {
    // ₦270,000.00 budget - ₦200,697.78 spent
    expect(calculateRemainingBalance(createSampleCategories(), createSampleExpenses())).toBe(69302.22);
  });

  it('shows the correct total on the dashboard', () => {
    localStorage.clear();
    render(<App />);
    const dashboard = screen.getByRole('region', { name: 'Dashboard' });
    const card = within(dashboard).getByRole('heading', { name: 'Total Expenses' }).closest('article');

    expect(card).toHaveTextContent('₦200,697.78');
  });
});
