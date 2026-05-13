/**
 * Budget calculations — all pure functions.
 * Each takes `state` ({ settings, envelopes, transactions }) so they can be
 * tested without React or storage.
 */

import { isoDate, parseIsoDate } from './format';

const DAY_MS = 1000 * 60 * 60 * 24;

function clampPeriodStart(day) {
  return Math.min(28, Math.max(1, Number(day) || 1));
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, date.getDate());
}

function addDays(date, amount) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function rangeContains(range, dateStr) {
  return dateStr >= range.start && dateStr < range.end;
}

function sum(items, getValue) {
  return items.reduce((total, item) => total + getValue(item), 0);
}

export function currentPeriodStart(state, anchorDate = new Date()) {
  const periodStart = clampPeriodStart(state.settings.periodStart);
  const start = new Date(
    anchorDate.getFullYear(),
    anchorDate.getMonth(),
    periodStart
  );

  if (anchorDate.getDate() < periodStart) {
    start.setMonth(start.getMonth() - 1);
  }

  return isoDate(start);
}

export function currentPeriodRange(state, anchorDate = new Date()) {
  const startDate = parseIsoDate(currentPeriodStart(state, anchorDate));
  const endDate = addMonths(startDate, 1);
  return {
    start: isoDate(startDate),
    end: isoDate(endDate),
  };
}

export function previousPeriodRange(state, anchorDate = new Date()) {
  const current = currentPeriodRange(state, anchorDate);
  const endDate = parseIsoDate(current.start);
  const startDate = addMonths(endDate, -1);
  return {
    start: isoDate(startDate),
    end: isoDate(endDate),
  };
}

export function periodRangeForOffset(state, offset = 0, anchorDate = new Date()) {
  const shifted = addMonths(
    new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate()),
    offset
  );
  return currentPeriodRange(state, shifted);
}

export function rangeAnchorDate(range) {
  const end = parseIsoDate(range.end);
  return addDays(end, -1);
}

export function periodLabel(range) {
  const start = parseIsoDate(range.start);
  const end = addDays(parseIsoDate(range.end), -1);
  const sameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();

  if (start.getDate() === 1 && sameMonth) {
    return start.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  }

  const startLabel = start.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });
  const endLabel = end.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });
  return `${startLabel} - ${endLabel}`;
}

export function recentPeriodOptions(state, count = 6, anchorDate = new Date()) {
  return Array.from({ length: count }, (_, index) => {
    const range = periodRangeForOffset(state, -index, anchorDate);
    return {
      key: range.start,
      label: periodLabel(range),
      range,
      anchorDate: rangeAnchorDate(range),
      isCurrent: index === 0,
    };
  });
}

export function currentYearRange(anchorDate = new Date()) {
  const startDate = new Date(anchorDate.getFullYear(), 0, 1);
  const endDate = new Date(anchorDate.getFullYear() + 1, 0, 1);
  return {
    start: isoDate(startDate),
    end: isoDate(endDate),
  };
}

export function lastNDaysRange(days, anchorDate = new Date()) {
  const endDate = new Date(
    anchorDate.getFullYear(),
    anchorDate.getMonth(),
    anchorDate.getDate() + 1
  );
  const startDate = new Date(
    anchorDate.getFullYear(),
    anchorDate.getMonth(),
    anchorDate.getDate() - (days - 1)
  );
  return {
    start: isoDate(startDate),
    end: isoDate(endDate),
  };
}

export function dateRangeDays(range) {
  const start = parseIsoDate(range.start);
  const end = parseIsoDate(range.end);
  return Math.max(1, Math.round((end - start) / DAY_MS));
}

export function daysElapsedInRange(range, anchorDate = new Date()) {
  const start = parseIsoDate(range.start);
  const today = new Date(
    anchorDate.getFullYear(),
    anchorDate.getMonth(),
    anchorDate.getDate()
  );
  return Math.max(1, Math.floor((today - start) / DAY_MS) + 1);
}

export function daysRemainingInRange(range, anchorDate = new Date()) {
  const tomorrow = new Date(
    anchorDate.getFullYear(),
    anchorDate.getMonth(),
    anchorDate.getDate() + 1
  );
  const end = parseIsoDate(range.end);
  return Math.max(1, Math.ceil((end - tomorrow) / DAY_MS) + 1);
}

export function transactionsInRange(state, range, predicate = () => true) {
  return state.transactions.filter(
    (txn) => rangeContains(range, txn.date) && predicate(txn)
  );
}

export function envelopeActivityInRange(state, envelopeId, range) {
  const transactions = transactionsInRange(
    state,
    range,
    (txn) => txn.envelopeId === envelopeId
  );

  const income = sum(
    transactions.filter((txn) => txn.type === 'income'),
    (txn) => txn.amount
  );
  const expense = sum(
    transactions.filter((txn) => txn.type === 'expense'),
    (txn) => txn.amount
  );

  return {
    transactions,
    income,
    expense,
    net: income - expense,
  };
}

export function currentMonthAllocation(env) {
  if (env.type === 'annual') return (env.budget || 0) / 12;
  return env.budget || 0;
}

export function envelopeSpent(state, envelopeId) {
  return envelopeActivityInRange(
    state,
    envelopeId,
    currentPeriodRange(state)
  ).expense;
}

export function envelopeGoalSaved(state, envelopeId) {
  const allTime = {
    start: '0000-01-01',
    end: '9999-12-31',
  };
  return envelopeActivityInRange(state, envelopeId, allTime).net;
}

export function envelopeAvailable(state, envelopeId, anchorDate = new Date()) {
  const env = state.envelopes.find((item) => item.id === envelopeId);
  if (!env) return 0;

  if (env.type === 'goal') {
    return envelopeGoalSaved(state, envelopeId);
  }

  if (env.type === 'annual') {
    const range = currentYearRange(anchorDate);
    const activity = envelopeActivityInRange(state, envelopeId, range);
    const monthIndex = anchorDate.getMonth();
    const accrued = currentMonthAllocation(env) * (monthIndex + 1);
    return accrued + activity.net;
  }

  const range = currentPeriodRange(state, anchorDate);
  const activity = envelopeActivityInRange(state, envelopeId, range);
  return (env.budget || 0) + activity.net;
}

export function envelopeStatus(state, env, anchorDate = new Date()) {
  if (env.type === 'goal') {
    const saved = envelopeAvailable(state, env.id, anchorDate);
    const target = env.goalAmount || 0;
    return {
      planned: currentMonthAllocation(env),
      spent: Math.max(0, -saved),
      available: saved,
      progressPct: target > 0 ? Math.max(0, Math.min(100, (saved / target) * 100)) : 0,
      target,
    };
  }

  if (env.type === 'annual') {
    const range = currentYearRange(anchorDate);
    const activity = envelopeActivityInRange(state, env.id, range);
    const available = envelopeAvailable(state, env.id, anchorDate);
    const accrued = currentMonthAllocation(env) * (anchorDate.getMonth() + 1);
    return {
      planned: accrued,
      spent: activity.expense,
      available,
      progressPct: accrued > 0 ? Math.max(0, Math.min(100, (activity.expense / accrued) * 100)) : 0,
      target: env.budget || 0,
    };
  }

  const range = currentPeriodRange(state, anchorDate);
  const activity = envelopeActivityInRange(state, env.id, range);
  const available = envelopeAvailable(state, env.id, anchorDate);
  return {
    planned: env.budget || 0,
    spent: activity.expense,
    available,
    progressPct:
      env.budget > 0
        ? Math.max(0, Math.min(100, (activity.expense / env.budget) * 100))
        : 0,
    target: env.budget || 0,
  };
}

export function budgetSummary(state, anchorDate = new Date()) {
  const allocated = sum(state.envelopes, currentMonthAllocation);
  const spendableAvailable = sum(
    state.envelopes.filter((env) => env.type !== 'goal'),
    (env) => envelopeAvailable(state, env.id, anchorDate)
  );
  const goalAvailable = sum(
    state.envelopes.filter((env) => env.type === 'goal'),
    (env) => envelopeAvailable(state, env.id, anchorDate)
  );
  const currentRange = currentPeriodRange(state, anchorDate);
  const spentThisPeriod = sum(
    transactionsInRange(state, currentRange, (txn) => txn.type === 'expense'),
    (txn) => txn.amount
  );

  return {
    allocated,
    spendableAvailable,
    goalAvailable,
    totalAvailable: spendableAvailable + goalAvailable,
    spentThisPeriod,
    unallocated: (state.settings.monthlyIncome || 0) - allocated,
  };
}

export function totalBudget(state) {
  return budgetSummary(state).allocated;
}

export function totalSpent(state) {
  return budgetSummary(state).spentThisPeriod;
}

// Remaining budget across variable (non-fixed, non-goal) envelopes only.
// This is the honest "left to spend" number — fixed costs like rent are excluded.
export function variableRemaining(state, anchorDate = new Date()) {
  return Math.max(0, sum(
    state.envelopes.filter((e) => !e.fixed && e.type !== 'goal'),
    (env) => envelopeAvailable(state, env.id, anchorDate)
  ));
}

// Returns transactions that need to be auto-logged for fixed envelopes
// that haven't been logged yet in the current period.
export function pendingFixedLogs(state, anchorDate = new Date()) {
  const range = currentPeriodRange(state, anchorDate);
  const alreadyLogged = new Set(
    state.transactions
      .filter((t) => t.autoFixed && t.date >= range.start && t.date < range.end)
      .map((t) => t.envelopeId)
  );
  return state.envelopes
    .filter((env) => env.fixed && env.budget > 0 && env.type === 'monthly' && !alreadyLogged.has(env.id))
    .map((env) => ({
      type: 'expense',
      amount: env.budget,
      envelopeId: env.id,
      payee: env.name,
      note: '',
      date: range.start,
      autoFixed: true,
    }));
}
