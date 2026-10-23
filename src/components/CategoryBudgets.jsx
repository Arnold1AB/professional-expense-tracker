import { useState } from 'react';
import {
  getCategorySummaries,
  validateBudgetTransfer,
} from '../utils/expenseCalculations.js';
import { formatCurrency } from '../utils/formatters.js';

function CategoryBudgets({ categories, expenses, onUpdateBudget, onTransferBudget }) {
  const [editingId, setEditingId] = useState(null);
  const [draftBudget, setDraftBudget] = useState('');
  const [error, setError] = useState('');
  const [fromCategoryId, setFromCategoryId] = useState('');
  const [toCategoryId, setToCategoryId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferError, setTransferError] = useState('');
  const [transferMessage, setTransferMessage] = useState('');

  const categorySummaries = getCategorySummaries(categories, expenses);
  const selectedSource = categorySummaries.find((category) => category.id === fromCategoryId);
  const availableFunds = Math.max(0, selectedSource?.remaining ?? 0);

  function startEditing(category) {
    setEditingId(category.id);
    setDraftBudget(String(category.budget));
    setError('');
  }

  function cancelEditing() {
    setEditingId(null);
    setDraftBudget('');
    setError('');
  }

  function saveBudget(event) {
    event.preventDefault();
    const budget = Number(draftBudget);
    if (draftBudget.trim() === '' || !Number.isFinite(budget) || budget < 0) {
      setError('Budget must be a number of 0 or more.');
      return;
    }
    onUpdateBudget(editingId, Math.round(budget * 100) / 100);
    cancelEditing();
  }

  function submitTransfer(event) {
    event.preventDefault();
    const source = categorySummaries.find((category) => category.id === fromCategoryId);
    const destination = categorySummaries.find((category) => category.id === toCategoryId);
    const validation = validateBudgetTransfer(source, destination, transferAmount);
    if (!validation.valid) {
      setTransferError(validation.error);
      return;
    }

    onTransferBudget(source.id, destination.id, validation.amount);
    setTransferMessage(
      `Transferred ${formatCurrency(validation.amount)} from ${source.name} to ${destination.name}.`
    );
    setFromCategoryId('');
    setToCategoryId('');
    setTransferAmount('');
    setTransferError('');
  }

  return (
    <section className="section" aria-labelledby="categories-heading">
      <h2 id="categories-heading" className="section__title">
        Category Budgets
      </h2>

      <div className="card card--flush">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col" className="num">
                Allocated Budget
              </th>
              <th scope="col" className="num">
                Spent
              </th>
              <th scope="col" className="num">
                Remaining
              </th>
              <th scope="col">Budget Status</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {categorySummaries.map((category) => {
              const isEditing = editingId === category.id;
              const inputId = `budget-${category.id}`;
              const errorId = `budget-error-${category.id}`;

              return (
                <tr key={category.id}>
                  <th scope="row" data-label="Category">
                    <span className="category-icon" aria-hidden="true">
                      {category.icon}
                    </span>
                    {category.name}
                  </th>
                  <td className="num" data-label="Allocated Budget">
                    {isEditing ? (
                      <form className="budget-form" onSubmit={saveBudget} noValidate>
                        <label htmlFor={inputId} className="visually-hidden">
                          Allocated budget for {category.name}
                        </label>
                        <input
                          id={inputId}
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          value={draftBudget}
                          onChange={(event) => setDraftBudget(event.target.value)}
                          aria-invalid={error ? 'true' : 'false'}
                          aria-describedby={error ? errorId : undefined}
                          autoFocus
                        />
                        <div className="budget-form__actions">
                          <button type="submit" className="btn btn--primary btn--small">
                            Save
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost btn--small"
                            onClick={cancelEditing}
                          >
                            Cancel
                          </button>
                        </div>
                        {error && (
                          <p id={errorId} className="field-error" role="alert">
                            {error}
                          </p>
                        )}
                      </form>
                    ) : (
                      formatCurrency(category.budget)
                    )}
                  </td>
                  <td className="num" data-label="Spent">
                    {formatCurrency(category.spent)}
                    <progress
                      className={`budget-progress budget-progress--${category.budgetStatus}`}
                      max="100"
                      value={Math.min(category.percentUsed, 100)}
                      aria-label={`${category.name} budget used`}
                      aria-valuetext={`${Math.round(category.percentUsed)}% of budget used`}
                    />
                    <span className="budget-progress__label">
                      {Math.round(category.percentUsed)}% used
                    </span>
                  </td>
                  <td className="num" data-label="Remaining">
                    {formatCurrency(category.remaining)}
                  </td>
                  <td data-label="Budget Status">
                    {category.budgetStatus === 'over' ? (
                      <span className="budget-status budget-status--over" role="alert">
                        Over budget
                      </span>
                    ) : category.budgetStatus === 'warning' ? (
                      <span className="budget-status budget-status--warning" role="status">
                        Approaching budget
                      </span>
                    ) : (
                      <span className="budget-status">On track</span>
                    )}
                  </td>
                  <td className="actions">
                    {!isEditing && (
                      <button
                        type="button"
                        className="btn btn--secondary btn--small"
                        onClick={() => startEditing(category)}
                        aria-label={`Edit budget for ${category.name}`}
                      >
                        ✏️ Edit
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card budget-transfer">
        <h3 className="card__title">Move Budget Between Categories</h3>
        <form className="budget-transfer__form" onSubmit={submitTransfer} noValidate>
          <div className="form-field">
            <label htmlFor="transfer-from">From category</label>
            <select
              id="transfer-from"
              value={fromCategoryId}
              onChange={(event) => {
                setFromCategoryId(event.target.value);
                setTransferError('');
                setTransferMessage('');
              }}
            >
              <option value="">Choose a source</option>
              {categorySummaries
                .filter((category) => category.remaining > 0)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
            {selectedSource && (
              <span className="form-hint">
                Available to move: {formatCurrency(availableFunds)}
              </span>
            )}
          </div>
          <div className="form-field">
            <label htmlFor="transfer-to">To category</label>
            <select
              id="transfer-to"
              value={toCategoryId}
              onChange={(event) => {
                setToCategoryId(event.target.value);
                setTransferError('');
                setTransferMessage('');
              }}
            >
              <option value="">Choose a destination</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="transfer-amount">Transfer amount (₦)</label>
            <input
              id="transfer-amount"
              type="number"
              min="0.01"
              max={availableFunds}
              step="0.01"
              inputMode="decimal"
              value={transferAmount}
              onChange={(event) => {
                setTransferAmount(event.target.value);
                setTransferError('');
                setTransferMessage('');
              }}
            />
          </div>
          <button type="submit" className="btn btn--primary">
            Transfer funds
          </button>
        </form>
        {transferError && (
          <p className="field-error budget-transfer__message" role="alert">
            {transferError}
          </p>
        )}
        <p className="form-status budget-transfer__message" role="status" aria-live="polite">
          {transferMessage}
        </p>
      </div>
    </section>
  );
}

export default CategoryBudgets;
