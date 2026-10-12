import { useState } from 'react';
import { getCategorySummaries } from '../utils/expenseCalculations.js';
import { formatCurrency } from '../utils/formatters.js';

function CategoryBudgets({ categories, expenses, onUpdateBudget }) {
  const [editingId, setEditingId] = useState(null);
  const [draftBudget, setDraftBudget] = useState('');
  const [error, setError] = useState('');

  const categorySummaries = getCategorySummaries(categories, expenses);

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
                  </td>
                  <td className="num" data-label="Remaining">
                    {formatCurrency(category.remaining)}
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
    </section>
  );
}

export default CategoryBudgets;
