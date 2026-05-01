/**
 * Budget calculations — all pure functions.
 * Each takes `state` ({ settings, envelopes, transactions }) so they
 * can be unit-tested without mocking React.
 */

/**
 * Returns the ISO date string (YYYY-MM-DD) for the start of the current
 * budget period. If user's period starts on the 5th and today is the 3rd,
 * this returns the 5th of LAST month.
 */
export function currentPeriodStart(state) {
  const periodStart = state.settings.periodStart || 1;
  const today = new Date();
  const d = new Date(today.getFullYear(), today.getMonth(), periodStart);
  if (today.getDate() < periodStart) {
    d.setMonth(d.getMonth() - 1);
  }
  return d.toISOString().slice(0, 10);
}

/** Total spent in a given envelope this period. */
export function envelopeSpent(state, envelopeId) {
  const start = currentPeriodStart(state);
  return state.transactions
    .filter(
      (t) =>
        t.envelopeId === envelopeId &&
        t.type === 'expense' &&
        t.date >= start
    )
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * For goal envelopes we want lifetime accumulation (income - withdrawals),
 * not per-period spending. A goal is "savings", not "spending budget".
 */
export function envelopeGoalSaved(state, envelopeId) {
  const inc = state.transactions
    .filter((t) => t.envelopeId === envelopeId && t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const exp = state.transactions
    .filter((t) => t.envelopeId === envelopeId && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  return inc - exp;
}

/** Total budgeted across non-goal envelopes (goals are savings, not budget). */
export function totalBudget(state) {
  return state.envelopes
    .filter((e) => e.type !== 'goal')
    .reduce((s, e) => s + (e.budget || 0), 0);
}

/** Total spent this period across all envelopes. */
export function totalSpent(state) {
  const start = currentPeriodStart(state);
  return state.transactions
    .filter((t) => t.type === 'expense' && t.date >= start)
    .reduce((s, t) => s + t.amount, 0);
}

/**
 * "Safe to spend today" — divides remaining budget evenly across the
 * remaining days in the current period. Borrowed from PocketGuard's
 * killer "In My Pocket" feature, which users love because it converts
 * abstract numbers into a concrete daily limit.
 */
export function safeToSpendToday(state) {
  const remaining = totalBudget(state) - totalSpent(state);
  if (remaining <= 0) return 0;

  const today = new Date();
  const periodStart = new Date(currentPeriodStart(state));
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLeft = Math.max(1, Math.ceil((periodEnd - today) / msPerDay));
  return remaining / daysLeft;
}
