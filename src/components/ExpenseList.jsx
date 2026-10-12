import { useState } from 'react';
import { sortExpensesByCategory, sortExpensesByDate } from '../utils/expenseCalculations.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

function ExpenseList({ expenses, categories, onDeleteExpense }) {
  const [sortOrder, setSortOrder] = useState('newest');

  const categoriesById = Object.fromEntries(categories.map((category) => [category.id, category]));
  const sortedExpenses =
    sortOrder === 'category'
      ? sortExpensesByCategory(expenses, categories)
      : sortExpensesByDate(expenses, sortOrder);

  function handleDelete(expense) {
    const confirmed = window.confirm(
      `Delete "${expense.description}" (${formatCurrency(expense.amount)})? This cannot be undone.`
    );
    if (confirmed) {
      onDeleteExpense(expense.id);
    }
  }

  return (
    <div className="card card--flush">
      <div className="card__toolbar">
        <h3 className="card__title">Recent Expenses</h3>
        <div className="sort-control">
          <label htmlFor="expense-sort">Sort</label>
          <select
            id="expense-sort"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="category">Category (A–Z)</option>
          </select>
        </div>
      </div>

      {sortedExpenses.length === 0 ? (
        <p className="empty-state">No expenses yet. Add your first expense to get started.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Description</th>
              <th scope="col">Category</th>
              <th scope="col">Date</th>
              <th scope="col" className="num">
                Amount
              </th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedExpenses.map((expense) => {
              const category = categoriesById[expense.categoryId];
              return (
                <tr key={expense.id}>
                  <th scope="row" data-label="Description">
                    {expense.description}
                  </th>
                  <td data-label="Category">
                    <span className="category-pill">
                      <span aria-hidden="true">{category?.icon ?? '❔'}</span>
                      {category?.name ?? 'Uncategorized'}
                    </span>
                  </td>
                  <td data-label="Date">
                    <time dateTime={expense.date}>{formatDate(expense.date)}</time>
                  </td>
                  <td className="num" data-label="Amount">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="actions">
                    <button
                      type="button"
                      className="btn btn--danger btn--small"
                      onClick={() => handleDelete(expense)}
                      aria-label={`Delete ${expense.description}`}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ExpenseList;
