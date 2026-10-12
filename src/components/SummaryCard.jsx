import { formatCurrency } from '../utils/formatters.js';

/** A single dashboard statistic, e.g. "Total Expenses: ₦1,234.00". */
function SummaryCard({ label, amount, icon, description, variant = 'default' }) {
  return (
    <article className={`summary-card summary-card--${variant}`}>
      <div className="summary-card__header">
        <span className="summary-card__icon" aria-hidden="true">
          {icon}
        </span>
        <h3 className="summary-card__label">{label}</h3>
      </div>
      <p className="summary-card__amount">{formatCurrency(amount)}</p>
      {description && <p className="summary-card__description">{description}</p>}
    </article>
  );
}

export default SummaryCard;
