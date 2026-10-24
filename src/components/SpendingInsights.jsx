import { useEffect, useState } from 'react';
import {
  getMonthToDateCategorySpending,
  getMonthlySpending,
} from '../utils/expenseCalculations.js';
import { formatCurrency } from '../utils/formatters.js';

const percentageFormatter = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 1 });

function formatPercentage(value) {
  return `${percentageFormatter.format(value)}%`;
}

function useLocalToday() {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 50);
    const timer = window.setTimeout(
      () => setToday(new Date()),
      Math.max(1, nextMidnight.getTime() - Date.now())
    );
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        setToday(new Date());
      }
    };

    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [today]);

  return today;
}

function SpendingInsights({ categories, expenses }) {
  const today = useLocalToday();
  const categoryInsights = getMonthToDateCategorySpending(expenses, categories, today);
  const monthlySpending = getMonthlySpending(expenses, today);
  const largestCategoryAmount = Math.max(
    0,
    ...categoryInsights.categories.map((category) => category.amount)
  );
  const largestMonthlyAmount = Math.max(0, ...monthlySpending.map((month) => month.amount));
  const hasMonthlyTrendSpending = monthlySpending.some((month) => month.amount > 0);

  return (
    <section className="section insights-section" aria-labelledby="spending-insights-heading">
      <h3 id="spending-insights-heading" className="card__title">
        Spending Insights
      </h3>

      <div className="insights-grid">
        <section className="card insights-card" aria-labelledby="category-insights-heading">
          <h4 id="category-insights-heading" className="card__title">
            Category spending this month
          </h4>

          {categoryInsights.total === 0 ? (
            <p className="empty-state insights-empty">
              No spending recorded this month.
            </p>
          ) : (
            <ul className="insights-category-list">
              {categoryInsights.categories.map((category) => {
                const barWidth =
                  largestCategoryAmount > 0 ? (category.amount / largestCategoryAmount) * 100 : 0;

                return (
                  <li className="insights-category" key={category.id}>
                    <div className="insights-category__details">
                      <span className="insights-category__name">
                        <span aria-hidden="true">{category.icon}</span>
                        {category.name}
                      </span>
                      <span className="insights-category__values">
                        <span>{formatCurrency(category.amount)}</span>
                        <span>{formatPercentage(category.share)} of spending</span>
                      </span>
                    </div>
                    <div className="insights-bar-track" aria-hidden="true">
                      <span className="insights-bar" style={{ width: `${barWidth}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card insights-card" aria-labelledby="monthly-insights-heading">
          <h4 id="monthly-insights-heading" className="card__title">
            Spending trend — last six months
          </h4>
          {!hasMonthlyTrendSpending && (
            <p className="empty-state insights-empty">
              No spending recorded in the last six months.
            </p>
          )}
          <div className="insights-month-scroll">
            <ol className="insights-month-list">
              {monthlySpending.map((month) => {
                const barHeight =
                  largestMonthlyAmount > 0 ? (month.amount / largestMonthlyAmount) * 100 : 0;

                return (
                  <li className="insights-month" key={month.key}>
                    <span className="insights-month__amount">{formatCurrency(month.amount)}</span>
                    <div className="insights-month__track" aria-hidden="true">
                      <span
                        className="insights-month__bar"
                        style={{ '--bar-size': `${barHeight}%` }}
                      />
                    </div>
                    <span className="insights-month__label">{month.label}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      </div>
    </section>
  );
}

export default SpendingInsights;
