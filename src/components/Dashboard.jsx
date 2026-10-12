import SummaryCard from './SummaryCard.jsx';
import {
  calculateRemainingBalance,
  calculateTotalBudget,
  calculateTotalExpenses,
  getCategorySummaries,
} from '../utils/expenseCalculations.js';
import { formatCurrency } from '../utils/formatters.js';

function Dashboard({ categories, expenses }) {
  const totalBudget = calculateTotalBudget(categories);
  const totalExpenses = calculateTotalExpenses(expenses);
  const remainingBalance = calculateRemainingBalance(categories, expenses);
  const categorySummaries = getCategorySummaries(categories, expenses);

  return (
    <section className="section" aria-labelledby="dashboard-heading">
      <h2 id="dashboard-heading" className="section__title">
        Dashboard
      </h2>

      <div className="summary-grid">
        <SummaryCard
          label="Total Allocated Budget"
          amount={totalBudget}
          icon="💰"
          variant="budget"
          description={`Across ${categories.length} categories`}
        />
        <SummaryCard
          label="Total Expenses"
          amount={totalExpenses}
          icon="🧾"
          variant="expenses"
          description={`${expenses.length} transactions recorded`}
        />
        <SummaryCard
          label="Remaining Balance"
          amount={remainingBalance}
          icon="🏦"
          variant="remaining"
          description="Allocated budget minus expenses"
        />
      </div>

      <div className="card">
        <h3 className="card__title">Expense Breakdown</h3>
        <ul className="breakdown-list">
          {categorySummaries.map((category) => (
            <li key={category.id} className="breakdown-list__item">
              <span className="category-icon" aria-hidden="true">
                {category.icon}
              </span>
              <span className="breakdown-list__name">
                {category.name}
                <span className="breakdown-list__count">
                  {category.expenseCount} {category.expenseCount === 1 ? 'expense' : 'expenses'}
                </span>
              </span>
              <span className="breakdown-list__amount">{formatCurrency(category.spent)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default Dashboard;
