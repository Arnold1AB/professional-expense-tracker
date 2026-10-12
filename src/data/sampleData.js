/**
 * Sample data used on first launch and when "Reset Demo Data" is clicked.
 * Amounts are in Nigerian Naira (NGN) and reflect a typical monthly budget
 * for a young working professional in a Nigerian city.
 *
 * Data format (also used in localStorage):
 *
 *   Category: { id: string, name: string, icon: string, budget: number }
 *   Expense:  { id: string, description: string, amount: number,
 *               categoryId: string, date: 'YYYY-MM-DD' }
 *
 * Amounts, IDs and categories are fixed so every participant sees the same
 * numbers. Dates are generated relative to "today" so the demo always looks
 * current.
 */
import { toISODate } from '../utils/formatters.js';

// localStorage keys where the app saves its data.
export const STORAGE_KEYS = {
  expenses: 'expenseflow.expenses',
  categories: 'expenseflow.categories',
};

export const DEFAULT_CATEGORIES = [
  { id: 'food', name: 'Food & Dining', icon: '🍽️', budget: 100000 },
  { id: 'transportation', name: 'Transportation', icon: '🚗', budget: 50000 },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', budget: 30000 },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', budget: 20000 },
  { id: 'bills', name: 'Bills & Utilities', icon: '💡', budget: 50000 },
  { id: 'health', name: 'Health & Wellness', icon: '💪', budget: 20000 },
];

// daysAgo: how many days before today the expense happened.
const SAMPLE_EXPENSE_TEMPLATES = [
  // Food & Dining
  { id: 'exp-001', description: 'Foodstuff from the market', amount: 25000, categoryId: 'food', daysAgo: 26 },
  { id: 'exp-002', description: 'Lunch at the buka', amount: 3500, categoryId: 'food', daysAgo: 21 },
  { id: 'exp-003', description: 'Supermarket groceries', amount: 15745.85, categoryId: 'food', daysAgo: 17 },
  { id: 'exp-004', description: 'Suya with friends', amount: 5000, categoryId: 'food', daysAgo: 12 },
  { id: 'exp-005', description: 'Fast food meal', amount: 5912.5, categoryId: 'food', daysAgo: 8 },
  { id: 'exp-006', description: 'Foodstuff restock', amount: 18000, categoryId: 'food', daysAgo: 4 },
  { id: 'exp-007', description: 'Dinner date', amount: 12340.63, categoryId: 'food', daysAgo: 1 },

  // Transportation
  { id: 'exp-008', description: 'Ride-hailing trip to work', amount: 4850, categoryId: 'transportation', daysAgo: 23 },
  { id: 'exp-009', description: 'Fuel (petrol)', amount: 12632.95, categoryId: 'transportation', daysAgo: 15 },
  { id: 'exp-010', description: 'BRT & danfo fares', amount: 3000, categoryId: 'transportation', daysAgo: 9 },
  { id: 'exp-011', description: 'Keke ride', amount: 1500, categoryId: 'transportation', daysAgo: 3 },

  // Shopping
  { id: 'exp-012', description: 'Wireless earbuds', amount: 12820.75, categoryId: 'shopping', daysAgo: 24 },
  { id: 'exp-013', description: 'Sneakers', amount: 11000, categoryId: 'shopping', daysAgo: 16 },
  { id: 'exp-014', description: 'Toiletries & detergent', amount: 5348.8, categoryId: 'shopping', daysAgo: 10 },
  { id: 'exp-015', description: 'Birthday gift for my sister', amount: 3500, categoryId: 'shopping', daysAgo: 2 },

  // Entertainment
  { id: 'exp-016', description: 'Cinema ticket & popcorn', amount: 6762.5, categoryId: 'entertainment', daysAgo: 20 },
  { id: 'exp-017', description: 'Streaming subscription', amount: 5000, categoryId: 'entertainment', daysAgo: 18 },
  { id: 'exp-018', description: 'Game lounge with the guys', amount: 2000, categoryId: 'entertainment', daysAgo: 11 },
  { id: 'exp-019', description: 'Beach day entry', amount: 1500, categoryId: 'entertainment', daysAgo: 5 },

  // Bills & Utilities
  { id: 'exp-020', description: 'Electricity token (prepaid)', amount: 12000, categoryId: 'bills', daysAgo: 27 },
  { id: 'exp-021', description: 'Monthly data plan', amount: 6500, categoryId: 'bills', daysAgo: 26 },
  { id: 'exp-022', description: 'Cable TV subscription', amount: 6900, categoryId: 'bills', daysAgo: 22 },
  { id: 'exp-023', description: 'Waste disposal (PSP) bill', amount: 2000, categoryId: 'bills', daysAgo: 19 },
  { id: 'exp-024', description: 'Bank charges & SMS alerts', amount: 568.75, categoryId: 'bills', daysAgo: 14 },
  { id: 'exp-025', description: 'Airtime top-up', amount: 2000, categoryId: 'bills', daysAgo: 6 },

  // Health & Wellness
  { id: 'exp-026', description: 'Gym membership', amount: 6000, categoryId: 'health', daysAgo: 27 },
  { id: 'exp-027', description: 'Pharmacy (malaria meds)', amount: 4850.75, categoryId: 'health', daysAgo: 13 },
  { id: 'exp-028', description: 'Multivitamins', amount: 3264.3, categoryId: 'health', daysAgo: 7 },
  { id: 'exp-029', description: 'Mosquito repellent', amount: 1200, categoryId: 'health', daysAgo: 0 },
];

/** Returns a fresh copy of the default categories. */
export function createSampleCategories() {
  return DEFAULT_CATEGORIES.map((category) => ({ ...category }));
}

/** Returns the sample expenses with dates relative to `today`. */
export function createSampleExpenses(today = new Date()) {
  return SAMPLE_EXPENSE_TEMPLATES.map(({ daysAgo, ...expense }) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo);
    return { ...expense, date: toISODate(date) };
  });
}
