/**
 * Formatting helpers — pure functions, no React, no side effects.
 * Ported directly from the PWA's <script> block.
 */

/**
 * Format an amount with the user's currency symbol.
 * Uses en-IN locale grouping for ₹ (so we get ₹1,23,456) and en-US otherwise.
 *
 * @param {number} amount
 * @param {string} currency  e.g. "₹", "$", "€"
 * @param {object} opts      { decimals: false } to drop the .00
 */
export function fmt(amount, currency = '₹', opts = {}) {
  const n = Number(amount) || 0;
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const locale = currency === '₹' ? 'en-IN' : 'en-US';
  const fixed = abs.toLocaleString(locale, {
    minimumFractionDigits: opts.decimals === false ? 0 : 2,
    maximumFractionDigits: opts.decimals === false ? 0 : 2,
  });
  return `${sign}${currency}${fixed}`;
}

/**
 * Split an amount into integer and fractional parts.
 * Used for the hero amount on Home where we render the decimals smaller.
 */
export function fmtParts(amount, currency = '₹') {
  const n = Math.abs(Number(amount) || 0);
  const locale = currency === '₹' ? 'en-IN' : 'en-US';
  const intPart = Math.floor(n).toLocaleString(locale);
  const fracPart = '.' + n.toFixed(2).split('.')[1];
  return { intPart, fracPart };
}

/**
 * Friendly day header for transaction grouping.
 * "Today" / "Yesterday" / "Mon, Apr 28"
 */
export function dayHeader(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);

  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yest)) return 'Yesterday';

  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** ISO date string for "today" — used as default for new transactions. */
export function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Short unique ID — not crypto-grade, just unique enough for local data. */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Mix a hex color with alpha for tinted backgrounds. */
export function hexAlpha(hex, alpha) {
  const m = hex.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  if (!m) return hex;
  const [r, g, b] = [m[1], m[2], m[3]].map((x) => parseInt(x, 16));
  return `rgba(${r},${g},${b},${alpha})`;
}
