import { useState } from 'react';
import { parseISODate, toISODate } from '../utils/formatters.js';

function createEmptyForm() {
  return { description: '', amount: '', categoryId: '', date: toISODate(new Date()) };
}

/** Returns an object of field -> error message. Empty object means valid. */
function validateExpense(values, categories) {
  const errors = {};
  const amount = Number(values.amount);

  if (!values.description.trim()) {
    errors.description = 'Please enter a description.';
  }
  if (values.amount === '' || !Number.isFinite(amount) || amount <= 0) {
    errors.amount = 'Amount must be greater than zero.';
  }
  if (!categories.some((category) => category.id === values.categoryId)) {
    errors.categoryId = 'Please select a category.';
  }
  if (!parseISODate(values.date)) {
    errors.date = 'Please enter a valid date.';
  }
  return errors;
}

function ExpenseForm({ categories, onAddExpense }) {
  const [values, setValues] = useState(createEmptyForm);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setSuccessMessage('');
  }

  function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateExpense(values, categories);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    onAddExpense({
      description: values.description.trim(),
      amount: Math.round(Number(values.amount) * 100) / 100,
      categoryId: values.categoryId,
      date: values.date,
    });
    setValues(createEmptyForm());
    setSuccessMessage(`Added "${values.description.trim()}".`);
  }

  function fieldProps(name) {
    return {
      id: `expense-${name}`,
      name,
      value: values[name],
      onChange: handleChange,
      'aria-invalid': errors[name] ? 'true' : 'false',
      'aria-describedby': errors[name] ? `expense-${name}-error` : undefined,
    };
  }

  function fieldError(name) {
    return errors[name] ? (
      <p id={`expense-${name}-error`} className="field-error">
        {errors[name]}
      </p>
    ) : null;
  }

  return (
    <div className="card">
      <h3 className="card__title">Add Expense</h3>
      <form className="expense-form" onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="expense-description">Description</label>
          <input type="text" placeholder="e.g. Lunch at the buka" {...fieldProps('description')} />
          {fieldError('description')}
        </div>

        <div className="form-field">
          <label htmlFor="expense-amount">Amount (₦)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            {...fieldProps('amount')}
          />
          {fieldError('amount')}
        </div>

        <div className="form-field">
          <label htmlFor="expense-categoryId">Category</label>
          <select {...fieldProps('categoryId')}>
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {fieldError('categoryId')}
        </div>

        <div className="form-field">
          <label htmlFor="expense-date">Date</label>
          <input type="date" {...fieldProps('date')} />
          {fieldError('date')}
        </div>

        <button type="submit" className="btn btn--primary btn--block">
          ＋ Add Expense
        </button>
        <p className="form-status" role="status" aria-live="polite">
          {successMessage}
        </p>
      </form>
    </div>
  );
}

export default ExpenseForm;
