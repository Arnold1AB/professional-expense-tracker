import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App.jsx';
import { STORAGE_KEYS, createSampleExpenses } from '../src/data/sampleData.js';
import { toISODate } from '../src/utils/formatters.js';

function readStorage(key) {
  return JSON.parse(localStorage.getItem(key));
}

function getCategoryRow(name) {
  const table = screen.getByRole('region', { name: 'Category Budgets' });
  return within(table).getByRole('row', { name: new RegExp(name) });
}

function getExpenseTable() {
  return within(screen.getByRole('region', { name: 'Expenses' })).getByRole('table');
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('localStorage initialization', () => {
    it('loads sample data and saves it on first launch', () => {
      render(<App />);

      expect(readStorage(STORAGE_KEYS.expenses)).toHaveLength(29);
      expect(readStorage(STORAGE_KEYS.categories)).toHaveLength(6);
      expect(screen.getByText('Lunch at the buka')).toBeInTheDocument();
    });

    it('uses existing saved data instead of overwriting it', () => {
      localStorage.setItem(
        STORAGE_KEYS.expenses,
        JSON.stringify([
          { id: 'x1', description: 'Saved expense', amount: 5, categoryId: 'food', date: '2026-01-01' },
        ])
      );

      render(<App />);

      const rows = within(getExpenseTable()).getAllByRole('row');
      expect(rows).toHaveLength(2); // header + 1 expense
      expect(screen.getByText('Saved expense')).toBeInTheDocument();
      expect(readStorage(STORAGE_KEYS.expenses)).toHaveLength(1);
    });
  });

  describe('dashboard', () => {
    it('shows the total allocated budget and a breakdown for every category', () => {
      render(<App />);
      const dashboard = screen.getByRole('region', { name: 'Dashboard' });

      expect(within(dashboard).getByText('₦270,000.00')).toBeInTheDocument();
      expect(within(dashboard).getAllByText('Food & Dining')).toHaveLength(2);
      expect(within(dashboard).getByText('₦85,498.98')).toBeInTheDocument();
      expect(within(dashboard).getAllByText('Health & Wellness')).toHaveLength(2);
    });

    it('updates category and monthly insights after adding and deleting an expense', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      localStorage.setItem(
        STORAGE_KEYS.categories,
        JSON.stringify([{ id: 'food', name: 'Food', icon: '🍽️', budget: 100 }])
      );
      localStorage.setItem(
        STORAGE_KEYS.expenses,
        JSON.stringify([
          { id: 'base', description: 'Base expense', amount: 5, categoryId: 'food', date: toISODate(new Date()) },
        ])
      );
      render(<App />);

      const categoryInsights = screen.getByRole('region', { name: 'Category spending this month' });
      const monthlyInsights = screen.getByRole('region', { name: 'Spending trend — last six months' });
      expect(within(categoryInsights).getByText('₦5.00')).toBeInTheDocument();
      expect(within(monthlyInsights).getByText('₦5.00')).toBeInTheDocument();

      await user.type(screen.getByLabelText('Description'), 'Added lunch');
      await user.type(screen.getByLabelText('Amount (₦)'), '12.50');
      await user.selectOptions(screen.getByLabelText('Category'), 'food');
      await user.click(screen.getByRole('button', { name: /add expense/i }));

      expect(within(categoryInsights).getByText('₦17.50')).toBeInTheDocument();
      expect(within(monthlyInsights).getByText('₦17.50')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Delete Added lunch' }));

      expect(within(categoryInsights).getByText('₦5.00')).toBeInTheDocument();
      expect(within(monthlyInsights).getByText('₦5.00')).toBeInTheDocument();
    });

    it('keeps displayed insights unchanged when an out-of-window expense is added and deleted', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const today = new Date();
      const outsideWindowDate = toISODate(
        new Date(today.getFullYear(), today.getMonth() - 6, 15)
      );
      localStorage.setItem(
        STORAGE_KEYS.categories,
        JSON.stringify([{ id: 'food', name: 'Food', icon: '🍽️', budget: 100 }])
      );
      localStorage.setItem(
        STORAGE_KEYS.expenses,
        JSON.stringify([
          {
            id: 'current',
            description: 'Current expense',
            amount: 5,
            categoryId: 'food',
            date: toISODate(today),
          },
        ])
      );
      render(<App />);

      const categoryInsights = screen.getByRole('region', { name: 'Category spending this month' });
      const monthlyInsights = screen.getByRole('region', { name: 'Spending trend — last six months' });
      const monthlySnapshot = () =>
        within(monthlyInsights).getAllByRole('listitem').map((item) => item.textContent);
      const initialMonthlySnapshot = monthlySnapshot();
      expect(within(categoryInsights).getByText('₦5.00')).toBeInTheDocument();

      await user.type(screen.getByLabelText('Description'), 'Outside window');
      await user.type(screen.getByLabelText('Amount (₦)'), '20');
      await user.selectOptions(screen.getByLabelText('Category'), 'food');
      await user.clear(screen.getByLabelText('Date'));
      await user.type(screen.getByLabelText('Date'), outsideWindowDate);
      await user.click(screen.getByRole('button', { name: /add expense/i }));

      expect(within(categoryInsights).getByText('₦5.00')).toBeInTheDocument();
      expect(monthlySnapshot()).toEqual(initialMonthlySnapshot);
      expect(screen.getByText('Outside window')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Delete Outside window' }));

      expect(within(categoryInsights).getByText('₦5.00')).toBeInTheDocument();
      expect(monthlySnapshot()).toEqual(initialMonthlySnapshot);
    });

    it('shows empty-state messaging and retains zero-value trend months', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 9, 23, 12));
      localStorage.setItem(
        STORAGE_KEYS.categories,
        JSON.stringify([{ id: 'food', name: 'Food', icon: '🍽️', budget: 100 }])
      );
      localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify([]));
      render(<App />);

      const categoryInsights = screen.getByRole('region', { name: 'Category spending this month' });
      const monthlyInsights = screen.getByRole('region', { name: 'Spending trend — last six months' });
      expect(within(categoryInsights).getByText('No spending recorded this month.')).toBeInTheDocument();
      expect(within(monthlyInsights).getByText('No spending recorded in the last six months.')).toBeInTheDocument();
      expect(
        within(monthlyInsights)
          .getAllByRole('listitem')
          .map((item) => within(item).getByText(/2026/).textContent)
      ).toEqual(['May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sept 2026', 'Oct 2026']);
      expect(within(monthlyInsights).getAllByText('₦0.00')).toHaveLength(6);
    });

    it('shows a zero-spend category and independent empty states when only older months have spending', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 9, 23, 12));
      localStorage.setItem(
        STORAGE_KEYS.categories,
        JSON.stringify([
          { id: 'food', name: 'Food', icon: '🍽️', budget: 100 },
          { id: 'travel', name: 'Travel', icon: '🚗', budget: 100 },
        ])
      );
      localStorage.setItem(
        STORAGE_KEYS.expenses,
        JSON.stringify([
          { id: 'past', description: 'September expense', amount: 25, categoryId: 'food', date: '2026-09-30' },
        ])
      );
      render(<App />);

      const categoryInsights = screen.getByRole('region', { name: 'Category spending this month' });
      const monthlyInsights = screen.getByRole('region', { name: 'Spending trend — last six months' });

      expect(within(categoryInsights).getByText('No spending recorded this month.')).toBeInTheDocument();
      expect(within(categoryInsights).queryByText('Travel')).not.toBeInTheDocument();
      expect(within(monthlyInsights).queryByText('No spending recorded in the last six months.')).not.toBeInTheDocument();
      expect(within(monthlyInsights).getByText('Sept 2026')).toBeInTheDocument();
      expect(within(monthlyInsights).getByText('₦25.00')).toBeInTheDocument();
    });

    it('shows every configured category amount and share when there is month-to-date spending', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 9, 23, 12));
      localStorage.setItem(
        STORAGE_KEYS.categories,
        JSON.stringify([
          { id: 'food', name: 'Food', icon: '🍽️', budget: 100 },
          { id: 'travel', name: 'Travel', icon: '🚗', budget: 100 },
        ])
      );
      localStorage.setItem(
        STORAGE_KEYS.expenses,
        JSON.stringify([
          { id: 'food-expense', description: 'Lunch', amount: 25, categoryId: 'food', date: '2026-10-01' },
        ])
      );
      render(<App />);

      const categoryInsights = screen.getByRole('region', { name: 'Category spending this month' });
      expect(within(categoryInsights).getByText('Food')).toBeInTheDocument();
      expect(within(categoryInsights).getByText('Travel')).toBeInTheDocument();
      expect(within(categoryInsights).getByText('₦25.00')).toBeInTheDocument();
      expect(within(categoryInsights).getByText('₦0.00')).toBeInTheDocument();
      expect(within(categoryInsights).getByText('100% of spending')).toBeInTheDocument();
      expect(within(categoryInsights).getByText('0% of spending')).toBeInTheDocument();
    });

    it('includes unknown categories and displays very large finite amounts', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 9, 23, 12));
      localStorage.setItem(
        STORAGE_KEYS.categories,
        JSON.stringify([{ id: 'food', name: 'Food', icon: '🍽️', budget: 100 }])
      );
      localStorage.setItem(
        STORAGE_KEYS.expenses,
        JSON.stringify([
          { id: 'unknown', description: 'Unknown category', amount: 1e308, categoryId: 'removed', date: '2026-10-23' },
        ])
      );
      render(<App />);

      const categoryInsights = screen.getByRole('region', { name: 'Category spending this month' });
      expect(within(categoryInsights).getByText('Uncategorized')).toBeInTheDocument();
      expect(within(categoryInsights).getByText('100% of spending')).toBeInTheDocument();
      expect(within(categoryInsights).getByText((content) => content.startsWith('₦100,000'))).toBeInTheDocument();
    });

    it('refreshes the date windows at local midnight and clears its timer on unmount', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 9, 31, 23, 59, 59));
      localStorage.setItem(
        STORAGE_KEYS.categories,
        JSON.stringify([{ id: 'food', name: 'Food', icon: '🍽️', budget: 100 }])
      );
      localStorage.setItem(
        STORAGE_KEYS.expenses,
        JSON.stringify([
          { id: 'october', description: 'October expense', amount: 15, categoryId: 'food', date: '2026-10-31' },
          { id: 'november', description: 'November expense', amount: 25, categoryId: 'food', date: '2026-11-01' },
        ])
      );
      const { unmount } = render(<App />);
      const categoryInsights = screen.getByRole('region', { name: 'Category spending this month' });
      const monthlyInsights = screen.getByRole('region', { name: 'Spending trend — last six months' });

      expect(within(categoryInsights).getByText('₦15.00')).toBeInTheDocument();
      expect(within(monthlyInsights).queryByText('Nov 2026')).not.toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1100);
      });

      expect(within(categoryInsights).getByText('₦25.00')).toBeInTheDocument();
      expect(within(monthlyInsights).getByText('Nov 2026')).toBeInTheDocument();
      expect(vi.getTimerCount()).toBe(1);
      unmount();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('adding an expense', () => {
    it('adds the expense to the list, updates the category and saves it', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByLabelText('Description'), 'Team lunch');
      await user.type(screen.getByLabelText('Amount (₦)'), '2500.5');
      await user.selectOptions(screen.getByLabelText('Category'), 'Entertainment');
      await user.click(screen.getByRole('button', { name: /add expense/i }));

      // Newest first, so the new expense (dated today) is near the top.
      expect(within(getExpenseTable()).getByText('Team lunch')).toBeInTheDocument();

      // Entertainment: 15,262.50 + 2,500.50 = 17,763.00 spent, 20,000 - 17,763 = 2,237.00 remaining.
      const row = getCategoryRow('Entertainment');
      expect(within(row).getByText('₦17,763.00')).toBeInTheDocument();
      expect(within(row).getByText('₦2,237.00')).toBeInTheDocument();

      const saved = readStorage(STORAGE_KEYS.expenses);
      expect(saved).toHaveLength(30);
      expect(saved.at(-1)).toMatchObject({
        description: 'Team lunch',
        amount: 2500.5,
        categoryId: 'entertainment',
        date: toISODate(new Date()),
      });
      expect(saved.at(-1).id).toEqual(expect.any(String));
    });

    it('shows validation errors and does not add an invalid expense', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.clear(screen.getByLabelText('Date'));
      await user.type(screen.getByLabelText('Amount (₦)'), '0');
      await user.click(screen.getByRole('button', { name: /add expense/i }));

      expect(screen.getByText('Please enter a description.')).toBeInTheDocument();
      expect(screen.getByText('Amount must be greater than zero.')).toBeInTheDocument();
      expect(screen.getByText('Please select a category.')).toBeInTheDocument();
      expect(screen.getByText('Please enter a valid date.')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toHaveAttribute('aria-invalid', 'true');
      expect(readStorage(STORAGE_KEYS.expenses)).toHaveLength(29);
    });
  });

  describe('viewing expenses', () => {
    it('lists expenses newest first and can switch to oldest first', async () => {
      const user = userEvent.setup();
      render(<App />);

      const firstExpense = () => within(getExpenseTable()).getAllByRole('row')[1];
      expect(firstExpense()).toHaveTextContent('Mosquito repellent');

      await user.selectOptions(screen.getByLabelText('Sort'), 'Oldest first');
      expect(firstExpense()).toHaveTextContent(/Electricity token|Gym membership/);
    });

    it('can sort expenses by category', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.selectOptions(screen.getByLabelText('Sort'), 'Category (A–Z)');

      const rows = within(getExpenseTable()).getAllByRole('row').slice(1);
      // Bills & Utilities comes first alphabetically; Transportation comes last.
      expect(rows[0]).toHaveTextContent('Airtime top-up');
      expect(rows[0]).toHaveTextContent('Bills & Utilities');
      expect(rows.at(-1)).toHaveTextContent('Ride-hailing trip to work');
      expect(rows.at(-1)).toHaveTextContent('Transportation');
    });
  });

  describe('deleting an expense', () => {
    it('removes the expense after confirmation and updates totals', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      render(<App />);

      await user.click(screen.getByRole('button', { name: 'Delete Wireless earbuds' }));

      expect(confirmSpy).toHaveBeenCalledOnce();
      expect(screen.queryByText('Wireless earbuds')).not.toBeInTheDocument();
      // Shopping: 32,669.55 - 12,820.75 = 19,848.80 spent, 10,151.20 remaining.
      const row = getCategoryRow('Shopping');
      expect(within(row).getByText('₦19,848.80')).toBeInTheDocument();
      expect(within(row).getByText('₦10,151.20')).toBeInTheDocument();
      expect(readStorage(STORAGE_KEYS.expenses).map((e) => e.id)).not.toContain('exp-012');
    });

    it('keeps the expense when the user cancels', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      render(<App />);

      await user.click(screen.getByRole('button', { name: 'Delete Wireless earbuds' }));

      expect(screen.getByText('Wireless earbuds')).toBeInTheDocument();
      expect(readStorage(STORAGE_KEYS.expenses)).toHaveLength(29);
    });
  });

  describe('category budgets', () => {
    it('shows the warning at exactly 80% and the alert at exactly 100%', () => {
      localStorage.setItem(
        STORAGE_KEYS.categories,
        JSON.stringify([
          { id: 'warning', name: 'Warning Category', icon: '⚠️', budget: 100 },
          { id: 'alert', name: 'Alert Category', icon: '🚨', budget: 100 },
        ])
      );
      localStorage.setItem(
        STORAGE_KEYS.expenses,
        JSON.stringify([
          { id: 'warning-expense', amount: 80, categoryId: 'warning', date: '2026-01-01' },
          { id: 'alert-expense', amount: 100, categoryId: 'alert', date: '2026-01-01' },
        ])
      );
      render(<App />);

      const warningRow = getCategoryRow('Warning Category');
      expect(within(warningRow).getByRole('status')).toHaveTextContent('Approaching budget');
      expect(within(warningRow).getByRole('progressbar')).toHaveAttribute(
        'aria-valuetext',
        '80% of budget used'
      );

      const alertRow = getCategoryRow('Alert Category');
      expect(within(alertRow).getByRole('alert')).toHaveTextContent('Over budget');
      expect(within(alertRow).getByRole('progressbar')).toHaveAttribute(
        'aria-valuetext',
        '100% of budget used'
      );
    });

    it('shows live budget progress and threshold alerts', async () => {
      const user = userEvent.setup();
      render(<App />);

      const shopping = getCategoryRow('Shopping');
      expect(within(shopping).getByRole('alert')).toHaveTextContent('Over budget');
      expect(within(shopping).getByRole('progressbar')).toHaveAttribute(
        'aria-valuetext',
        '109% of budget used'
      );

      await user.click(screen.getByRole('button', { name: 'Edit budget for Transportation' }));
      const input = screen.getByLabelText('Allocated budget for Transportation');
      await user.clear(input);
      await user.type(input, '27000');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(within(getCategoryRow('Transportation')).getByRole('status')).toHaveTextContent(
        'Approaching budget'
      );
    });

    it('transfers only unspent budget and updates both category budgets', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.selectOptions(screen.getByLabelText('From category'), 'transportation');
      expect(screen.getByText('Available to move: ₦28,017.05')).toBeInTheDocument();
      await user.selectOptions(screen.getByLabelText('To category'), 'food');
      await user.type(screen.getByLabelText('Transfer amount (₦)'), '1000');
      await user.click(screen.getByRole('button', { name: 'Transfer funds' }));

      expect(within(getCategoryRow('Transportation')).getByText('₦49,000.00')).toBeInTheDocument();
      expect(within(getCategoryRow('Food & Dining')).getByText('₦101,000.00')).toBeInTheDocument();
      expect(screen.getByText('₦270,000.00')).toBeInTheDocument();
      expect(screen.getByText('Transferred ₦1,000.00 from Transportation to Food & Dining.')).toBeInTheDocument();
      expect(readStorage(STORAGE_KEYS.categories).find((category) => category.id === 'transportation').budget)
        .toBe(49000);
    });

    it('rejects transfers larger than the source category’s unspent budget', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.selectOptions(screen.getByLabelText('From category'), 'transportation');
      await user.selectOptions(screen.getByLabelText('To category'), 'food');
      await user.type(screen.getByLabelText('Transfer amount (₦)'), '999999');
      await user.click(screen.getByRole('button', { name: 'Transfer funds' }));

      expect(screen.getByText(/no more than the source category’s available funds/)).toBeInTheDocument();
      expect(readStorage(STORAGE_KEYS.categories).find((category) => category.id === 'transportation').budget)
        .toBe(50000);
    });

    it('rejects transfers to the same category without changing budgets', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.selectOptions(screen.getByLabelText('From category'), 'transportation');
      await user.selectOptions(screen.getByLabelText('To category'), 'transportation');
      await user.type(screen.getByLabelText('Transfer amount (₦)'), '100');
      await user.click(screen.getByRole('button', { name: 'Transfer funds' }));

      expect(screen.getByText('Choose different source and destination categories.')).toBeInTheDocument();
      expect(readStorage(STORAGE_KEYS.categories).find((category) => category.id === 'transportation').budget)
        .toBe(50000);
    });

    it.each(['-1', '0', '0.001', ''])(
      'rejects transfer amount %j without changing budgets',
      async (amount) => {
        const user = userEvent.setup();
        render(<App />);

        await user.selectOptions(screen.getByLabelText('From category'), 'transportation');
        await user.selectOptions(screen.getByLabelText('To category'), 'food');
        const amountInput = screen.getByLabelText('Transfer amount (₦)');
        if (amount) {
          await user.type(amountInput, amount);
        }
        await user.click(screen.getByRole('button', { name: 'Transfer funds' }));

        expect(
          screen.getByText(
            'Enter an amount greater than 0 and no more than the source category’s available funds.'
          )
        ).toBeInTheDocument();
        expect(readStorage(STORAGE_KEYS.categories).find((category) => category.id === 'transportation').budget)
          .toBe(50000);
      }
    );

    it('does not offer an over-budget category as a transfer source', () => {
      render(<App />);

      const sourceSelect = screen.getByLabelText('From category');
      expect(within(sourceSelect).queryByRole('option', { name: 'Shopping' })).not.toBeInTheDocument();
      expect(readStorage(STORAGE_KEYS.categories).find((category) => category.id === 'shopping').budget)
        .toBe(30000);
    });

    it('updates a category budget and saves it', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole('button', { name: 'Edit budget for Transportation' }));
      const input = screen.getByLabelText('Allocated budget for Transportation');
      await user.clear(input);
      await user.type(input, '60000');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      // Transportation: 60,000 budget - 21,982.95 spent = 38,017.05 remaining.
      const row = getCategoryRow('Transportation');
      expect(within(row).getByText('₦60,000.00')).toBeInTheDocument();
      expect(within(row).getByText('₦38,017.05')).toBeInTheDocument();
      expect(screen.getByText('₦280,000.00')).toBeInTheDocument(); // total budget card

      const saved = readStorage(STORAGE_KEYS.categories);
      expect(saved.find((c) => c.id === 'transportation').budget).toBe(60000);
    });

    it('rejects a negative budget', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole('button', { name: 'Edit budget for Shopping' }));
      const input = screen.getByLabelText('Allocated budget for Shopping');
      await user.clear(input);
      await user.type(input, '-5');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(screen.getByText('Budget must be a number of 0 or more.')).toBeInTheDocument();
      expect(readStorage(STORAGE_KEYS.categories).find((c) => c.id === 'shopping').budget).toBe(30000);
    });

    it('shows a negative remaining balance when a category is over budget', () => {
      render(<App />);
      // Shopping: 30,000 - 32,669.55 = -2,669.55
      expect(within(getCategoryRow('Shopping')).getByText('-₦2,669.55')).toBeInTheDocument();
    });
  });

  describe('reset demo data', () => {
    it('restores the original sample data after confirmation', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify([]));
      localStorage.setItem(
        STORAGE_KEYS.categories,
        JSON.stringify([{ id: 'food', name: 'Food & Dining', icon: '🍽️', budget: 1 }])
      );
      render(<App />);
      expect(screen.getByText(/No expenses yet/)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /reset demo data/i }));

      expect(screen.queryByText(/No expenses yet/)).not.toBeInTheDocument();
      expect(readStorage(STORAGE_KEYS.expenses)).toEqual(createSampleExpenses());
      expect(readStorage(STORAGE_KEYS.categories)).toHaveLength(6);
      expect(screen.getByText('₦270,000.00')).toBeInTheDocument();
    });

    it('does nothing when the user cancels', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify([]));
      render(<App />);

      await user.click(screen.getByRole('button', { name: /reset demo data/i }));

      expect(readStorage(STORAGE_KEYS.expenses)).toEqual([]);
    });
  });
});
