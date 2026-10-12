const currencyFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
});

/** Formats a number as Naira, e.g. 1234.5 -> "₦1,234.50". */
export function formatCurrency(amount) {
  return currencyFormatter.format(Number(amount) || 0);
}

/** Converts a Date to a local 'YYYY-MM-DD' string. */
export function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a 'YYYY-MM-DD' string as a local date.
 * Returns null if the string is not a real calendar date.
 */
export function parseISODate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const isRealDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isRealDate ? date : null;
}

/** Formats a 'YYYY-MM-DD' string for display, e.g. "11 Oct 2026". */
export function formatDate(value) {
  const date = parseISODate(value);
  if (!date) return value;
  return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}
