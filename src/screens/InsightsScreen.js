import React, { useEffect, useRef, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { fonts, radius } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import ScreenLayout from '../components/ScreenLayout';
import { Empty } from '../components/Card';
import { useAppState } from '../lib/state';
import { fmt, parseIsoDate } from '../lib/format';
import {
  currentMonthAllocation,
  envelopeActivityInRange,
  envelopeStatus,
  recentPeriodOptions,
  transactionsInRange,
} from '../lib/budget';

const DOW_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function InsightsScreen() {
  const { state } = useAppState();
  const { colors } = useTheme();
  const [selectedPeriodKey, setSelectedPeriodKey] = useState(null);

  const periods = useMemo(() => recentPeriodOptions(state, 6), [state]);
  const selectedPeriod = periods.find((p) => p.key === selectedPeriodKey) || periods[0];
  const prevPeriod = periods[periods.indexOf(selectedPeriod) + 1] ?? null;

  const history      = useMemo(() => buildHistory(state, periods), [state, periods]);
  const cashFlow     = useMemo(() => buildCashFlow(state, selectedPeriod.range), [state, selectedPeriod]);
  const biggest      = useMemo(() => buildBiggestExpense(state, selectedPeriod.range), [state, selectedPeriod]);
  const dowPattern   = useMemo(() => buildDayOfWeek(state, selectedPeriod.range), [state, selectedPeriod]);
  const merchants    = useMemo(() => buildTopMerchants(state, selectedPeriod.range), [state, selectedPeriod]);
  const envelopes    = useMemo(() => buildEnvelopeBreakdown(state, selectedPeriod.range, prevPeriod?.range ?? null), [state, selectedPeriod, prevPeriod]);
  const recurring    = useMemo(() => buildRecurring(state, periods), [state, periods]);
  const goals        = useMemo(() => buildGoals(state), [state]);

  const hasData = state.envelopes.length > 0 || state.transactions.length > 0;
  if (!hasData) {
    return (
      <ScreenLayout>
        <Text style={styles.title}>Insights</Text>
        <Empty
          icon="📊"
          title="Nothing to show yet"
          text="Add some transactions. Insights get useful once you have real history."
        />
      </ScreenLayout>
    );
  }

  const styles = useMemo(() => makeStyles(colors), [colors]);
  const maxSpent = Math.max(...history.map((h) => h.spent), 1);
  const currency = state.settings.currency;

  const selectedHistory = history.find((h) => h.key === selectedPeriod.key);
  const savingsRate = cashFlow.income > 0
    ? Math.round((cashFlow.net / cashFlow.income) * 100)
    : null;
  const envelopeTotal = envelopes.reduce((s, e) => s + e.amount, 0);

  return (
    <ScreenLayout>
      <Text style={styles.title}>Insights</Text>

      {/* ── 6-month bar chart ──────────────────────────────── */}
      <FadeSlideIn delay={60}><View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionLabel}>SPENDING HISTORY</Text>
          {selectedHistory && (
            <Text style={styles.historySelectedAmt}>
              {fmt(selectedHistory.spent, currency, { decimals: false })}
              {selectedHistory.overBudget
                ? <Text style={styles.historyOverTag}> over</Text>
                : null}
            </Text>
          )}
        </View>
        <View style={styles.bars}>
          {history.map((item) => {
            const barH = Math.max(4, (item.spent / maxSpent) * 72);
            const isSelected = item.key === selectedPeriod.key;
            const barColor = item.overBudget ? colors.bad : colors.good;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.barSlot, isSelected && selectedPeriodKey !== null && styles.barSlotSelected]}
                onPress={() => setSelectedPeriodKey(item.key)}
                activeOpacity={0.75}
              >
                <View style={styles.barTrack}>
                  <View style={[
                    styles.barFill,
                    {
                      height: barH,
                      backgroundColor: barColor,
                      opacity: isSelected ? 1 : 0.25,
                    },
                  ]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.barLabels}>
          {history.map((item) => (
            <Text key={item.key} style={[
              styles.barLabel,
              item.key === selectedPeriod.key && styles.barLabelActive,
            ]}>
              {item.shortLabel}
            </Text>
          ))}
        </View>
      </View></FadeSlideIn>

      {/* ── Cash flow ─────────────────────────────────────── */}
      <FadeSlideIn delay={120}><View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionLabel}>CASH FLOW</Text>
          {savingsRate !== null && (
            <View style={[
              styles.savingsRatePill,
              { backgroundColor: savingsRate >= 0 ? colors.goodSubtle : colors.badSubtle },
            ]}>
              <Text style={[
                styles.savingsRateText,
                { color: savingsRate >= 0 ? colors.good : colors.bad },
              ]}>
                {savingsRate >= 0 ? '↑' : '↓'} {Math.abs(savingsRate)}% saved
              </Text>
            </View>
          )}
        </View>
        <CashFlowBar income={cashFlow.income} expenses={cashFlow.expenses} />
        <View style={styles.cashFlowStats}>
          <View style={styles.cashFlowStat}>
            <Text style={styles.cashFlowValue} numberOfLines={1}>
              {fmt(cashFlow.income, currency, { decimals: false })}
            </Text>
            <Text style={[styles.cashFlowLabel, { color: colors.good }]}>INCOME</Text>
          </View>
          <View style={[styles.cashFlowStat, styles.cashFlowStatCenter]}>
            <Text style={styles.cashFlowValue} numberOfLines={1}>
              {fmt(cashFlow.expenses, currency, { decimals: false })}
            </Text>
            <Text style={styles.cashFlowLabel}>SPENT</Text>
          </View>
          <View style={[styles.cashFlowStat, { alignItems: 'flex-end' }]}>
            <Text style={[
              styles.cashFlowValue,
              { color: cashFlow.net >= 0 ? colors.good : colors.bad },
            ]} numberOfLines={1}>
              {fmt(cashFlow.net, currency, { decimals: false })}
            </Text>
            <Text style={styles.cashFlowLabel}>SAVED</Text>
          </View>
        </View>
      </View></FadeSlideIn>

      {/* ── Biggest single expense ─────────────────────────── */}
      {biggest && (
        <FadeSlideIn delay={180}><View style={[styles.card, styles.biggestCard]}>
          <Text style={styles.sectionLabel}>BIGGEST SPEND</Text>
          <View style={styles.biggestRow}>
            <View style={styles.biggestLeft}>
              <Text style={styles.biggestAmount}>
                {fmt(biggest.amount, currency, { decimals: false })}
              </Text>
              <Text style={styles.biggestMeta}>
                {[biggest.payee, biggest.envelopeName].filter(Boolean).join(' · ')}
              </Text>
              <Text style={styles.biggestDate}>{biggest.dateLabel}</Text>
            </View>
            <View style={styles.biggestPct}>
              <Text style={styles.biggestPctNum}>{biggest.pctOfTotal}%</Text>
              <Text style={styles.biggestPctLabel}>of total{'\n'}spend</Text>
            </View>
          </View>
        </View></FadeSlideIn>
      )}

      {/* ── Day of week pattern ────────────────────────────── */}
      {dowPattern.hasData && (
        <FadeSlideIn delay={240}><View style={styles.card}>
          <Text style={styles.sectionLabel}>WHEN YOU SPEND MOST</Text>
          <View style={styles.dowBars}>
            {dowPattern.days.map((day, i) => {
              const barH = Math.max(4, (day.avg / dowPattern.maxAvg) * 52);
              return (
                <View key={i} style={styles.dowSlot}>
                  <View style={styles.dowTrack}>
                    <View style={[
                      styles.dowFill,
                      {
                        height: barH,
                        backgroundColor: day.isHighest ? colors.warn : colors.bgElev2,
                      },
                    ]} />
                  </View>
                  <Text style={[styles.dowLabel, day.isHighest && styles.dowLabelHighest]}>
                    {DOW_LABELS[i]}
                  </Text>
                </View>
              );
            })}
          </View>
          {dowPattern.highestDay !== null && (
            <View style={styles.dowHighlight}>
              <Text style={styles.dowHighlightLabel}>You spend most on</Text>
              <Text style={styles.dowHighlightDay}>
                {['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'][dowPattern.highestDay]}
              </Text>
              <Text style={styles.dowHighlightSep}>·</Text>
              <Text style={styles.dowHighlightAmt}>
                {fmt(dowPattern.highestAvg, currency, { decimals: false })}
                <Text style={styles.dowHighlightLabel}> avg/day</Text>
              </Text>
            </View>
          )}
        </View></FadeSlideIn>
      )}

      {/* ── Top merchants ──────────────────────────────────── */}
      {merchants.length > 0 && (
        <FadeSlideIn delay={300}><View style={styles.card}>
          <Text style={styles.sectionLabel}>WHERE THE MONEY WENT</Text>
          {merchants.map((m, i) => (
            <View key={m.name} style={[styles.merchantRow, i === merchants.length - 1 && { marginBottom: 0 }]}>
              <View style={styles.merchantRank}>
                <Text style={styles.merchantRankText}>{i + 1}</Text>
              </View>
              <Text style={styles.merchantName} numberOfLines={1}>{m.name}</Text>
              <View style={styles.merchantBarWrap}>
                <View style={[styles.merchantBarFill, { width: `${m.pct}%` }]} />
              </View>
              <Text style={styles.merchantAmount}>
                {fmt(m.amount, currency, { decimals: false })}
              </Text>
            </View>
          ))}
        </View></FadeSlideIn>
      )}

      {/* ── Envelope breakdown with delta ─────────────────── */}
      {envelopes.length > 0 && (
        <FadeSlideIn delay={360}><View style={styles.card}>
          <Text style={styles.sectionLabel}>BY ENVELOPE</Text>
          {envelopes.map((item, i) => {
            const widthPct = envelopeTotal > 0 ? (item.amount / envelopeTotal) * 100 : 0;
            return (
              <View key={item.env.id} style={[styles.envRow, i === envelopes.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[styles.envIcon, { borderLeftColor: item.env.color }]}>
                  <Text style={styles.envEmoji}>{item.env.icon}</Text>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={styles.envTopRow}>
                    <Text style={styles.envName} numberOfLines={1}>{item.env.name}</Text>
                    <Text style={styles.envAmount}>
                      {fmt(item.amount, currency, { decimals: false })}
                    </Text>
                    {item.delta !== null ? (
                      <View style={[
                        styles.deltaPill,
                        { backgroundColor: item.delta > 0 ? colors.badSubtle : colors.goodSubtle },
                      ]}>
                        <Text style={[
                          styles.deltaText,
                          { color: item.delta > 0 ? colors.bad : colors.good },
                        ]}>
                          {item.delta > 0 ? '↑' : '↓'}{Math.abs(item.delta)}%
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.envBar}>
                    <View style={[styles.envBarFill, { width: `${widthPct}%`, backgroundColor: item.env.color }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View></FadeSlideIn>
      )}

      {/* ── Recurring spend ────────────────────────────────── */}
      {recurring.length > 0 && (
        <FadeSlideIn delay={420}><View style={styles.card}>
          <Text style={styles.sectionLabel}>RECURRING SPEND</Text>
          <Text style={styles.recurringHero}>
            {fmt(recurring.reduce((s, r) => s + r.avgAmount, 0), currency, { decimals: false })}
            <Text style={styles.recurringHeroSub}>/mo committed</Text>
          </Text>
          {recurring.map((item, i) => (
            <View key={item.payee} style={[styles.recurringRow, i === recurring.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={styles.recurringName} numberOfLines={1}>{item.payee}</Text>
              <Text style={styles.recurringMonths}>{item.count}mo</Text>
              <Text style={styles.recurringAmount}>
                ~{fmt(item.avgAmount, currency, { decimals: false })}/mo
              </Text>
            </View>
          ))}
        </View></FadeSlideIn>
      )}

      {/* ── Goals ──────────────────────────────────────────── */}
      {goals.length > 0 && (
        <FadeSlideIn delay={480}><View style={styles.card}>
          <Text style={styles.sectionLabel}>GOALS</Text>
          {goals.map((item, i) => (
            <View key={item.env.id} style={[styles.goalItem, i === goals.length - 1 && { marginBottom: 0 }]}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalName}>{item.env.icon} {item.env.name}</Text>
                <View style={styles.goalRight}>
                  <Text style={styles.goalPct}>{Math.round(item.pct)}%</Text>
                  {item.etaMonths !== null && (
                    <Text style={styles.goalEta}>~{item.etaMonths}mo to go</Text>
                  )}
                </View>
              </View>
              <View style={styles.goalBarTrack}>
                <View style={[
                  styles.goalBarFill,
                  { width: `${item.pct}%`, backgroundColor: item.env.color || colors.good },
                ]} />
              </View>
              <View style={styles.goalFooter}>
                <Text style={styles.goalSaved}>
                  {fmt(item.saved, currency, { decimals: false })} saved
                </Text>
                <Text style={styles.goalTarget}>
                  of {fmt(item.target, currency, { decimals: false })}
                </Text>
              </View>
            </View>
          ))}
        </View></FadeSlideIn>
      )}
    </ScreenLayout>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function FadeSlideIn({ children, delay = 0 }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  // Only animate on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// Visual bar showing income vs expenses proportionally
function CashFlowBar({ income, expenses }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const total = Math.max(income, expenses, 1);
  const incomePct = (income / total) * 100;
  const expensesPct = (expenses / total) * 100;
  return (
    <View style={styles.cashFlowBarWrap}>
      <View style={[styles.cashFlowBarIncome, { flex: incomePct }]} />
      <View style={[styles.cashFlowBarExpenses, { flex: expensesPct }]} />
    </View>
  );
}

// ── Pure data builders ──────────────────────────────────────────────────────

function buildHistory(state, periods) {
  const allocated = state.envelopes.reduce((s, e) => s + currentMonthAllocation(e), 0);
  // Reverse so bars display oldest → newest left to right
  return [...periods].reverse().map((period) => {
    const spent = transactionsInRange(state, period.range, (t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    return {
      key: period.key,
      shortLabel: period.label.slice(0, 3),
      spent,
      allocated,
      left: allocated - spent,
      overBudget: spent > allocated,
    };
  });
}

function buildCashFlow(state, range) {
  const txns = transactionsInRange(state, range);
  const incomeFromTxns = txns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  // Base income from settings + any additional income transactions logged
  const income = (state.settings.monthlyIncome || 0) + incomeFromTxns;
  const expenses = txns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return { income, expenses, net: income - expenses };
}

function buildBiggestExpense(state, range) {
  const expenses = transactionsInRange(state, range, (t) => t.type === 'expense');
  if (expenses.length === 0) return null;

  const biggest = expenses.reduce((max, t) => (t.amount > max.amount ? t : max));
  const totalSpend = expenses.reduce((s, t) => s + t.amount, 0);
  const env = state.envelopes.find((e) => e.id === biggest.envelopeId);
  const d = parseIsoDate(biggest.date);
  const dateLabel = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return {
    amount: biggest.amount,
    payee: biggest.payee || null,
    envelopeName: env ? `${env.icon} ${env.name}` : null,
    dateLabel,
    pctOfTotal: totalSpend > 0 ? Math.round((biggest.amount / totalSpend) * 100) : 0,
  };
}

function buildDayOfWeek(state, range) {
  const expenses = transactionsInRange(state, range, (t) => t.type === 'expense');
  if (expenses.length < 3) return { hasData: false, days: [], maxAvg: 1, highestDay: null };

  const totals = Array(7).fill(0);
  const dates = Array(7).fill(null).map(() => new Set());
  expenses.forEach((t) => {
    const dow = parseIsoDate(t.date).getDay();
    totals[dow] += t.amount;
    dates[dow].add(t.date);
  });

  // avg per day (e.g. avg spend on a Saturday), not avg per transaction
  const avgs = totals.map((total, i) => (dates[i].size > 0 ? total / dates[i].size : 0));
  const maxAvg = Math.max(...avgs, 1);
  const highestDay = avgs.indexOf(Math.max(...avgs));

  return {
    hasData: true,
    days: avgs.map((avg, i) => ({ avg, isHighest: i === highestDay })),
    maxAvg,
    highestDay,
    highestAvg: avgs[highestDay],
  };
}

function buildTopMerchants(state, range) {
  const totals = {};
  transactionsInRange(state, range, (t) => t.type === 'expense' && t.payee?.trim())
    .forEach((t) => {
      const key = t.payee.trim();
      totals[key] = (totals[key] || 0) + t.amount;
    });

  const sorted = Object.entries(totals)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  if (sorted.length === 0) return [];
  const max = sorted[0].amount;
  return sorted.map((m) => ({ ...m, pct: Math.round((m.amount / max) * 100) }));
}

function buildEnvelopeBreakdown(state, range, prevRange) {
  const curr = {};
  transactionsInRange(state, range, (t) => t.type === 'expense' && t.envelopeId)
    .forEach((t) => { curr[t.envelopeId] = (curr[t.envelopeId] || 0) + t.amount; });

  const prev = {};
  if (prevRange) {
    transactionsInRange(state, prevRange, (t) => t.type === 'expense' && t.envelopeId)
      .forEach((t) => { prev[t.envelopeId] = (prev[t.envelopeId] || 0) + t.amount; });
  }

  return Object.entries(curr)
    .map(([id, amount]) => {
      const env = state.envelopes.find((e) => e.id === id);
      if (!env) return null;
      const prevAmt = prev[id] ?? 0;
      const delta = prevAmt > 0 ? Math.round(((amount - prevAmt) / prevAmt) * 100) : null;
      return { env, amount, delta };
    })
    .filter(Boolean)
    .sort((a, b) => b.amount - a.amount);
}

function buildRecurring(state, periods) {
  // A payee is recurring if it appears as an expense in 3+ of the last 6 periods
  const payeePeriodSums = {};

  periods.forEach((period) => {
    const seen = {};
    transactionsInRange(state, period.range, (t) => t.type === 'expense' && t.payee?.trim())
      .forEach((t) => {
        const key = t.payee.trim();
        seen[key] = (seen[key] || 0) + t.amount;
      });
    Object.entries(seen).forEach(([payee, amount]) => {
      if (!payeePeriodSums[payee]) payeePeriodSums[payee] = [];
      payeePeriodSums[payee].push(amount);
    });
  });

  return Object.entries(payeePeriodSums)
    .filter(([, amounts]) => amounts.length >= 3)
    .map(([payee, amounts]) => ({
      payee,
      count: amounts.length,
      avgAmount: amounts.reduce((s, a) => s + a, 0) / amounts.length,
    }))
    .sort((a, b) => b.avgAmount - a.avgAmount)
    .slice(0, 6);
}

function buildGoals(state) {
  return state.envelopes
    .filter((env) => env.type === 'goal' && (env.goalAmount || 0) > 0)
    .map((env) => {
      const status = envelopeStatus(state, env);
      const saved = Math.max(0, status.available);
      const target = env.goalAmount || 0;
      const pct = Math.min(100, target > 0 ? (saved / target) * 100 : 0);

      // ETA: average net contribution over last 3 closed periods
      const closedPeriods = recentPeriodOptions(state, 4).slice(1);
      const contributions = closedPeriods
        .map((p) => {
          const net = envelopeActivityInRange(state, env.id, p.range).net;
          return net > 0 ? net : 0;
        })
        .filter((n) => n > 0);
      const avgMonthly = contributions.length > 0
        ? contributions.reduce((s, n) => s + n, 0) / contributions.length
        : 0;
      const etaMonths = avgMonthly > 0 ? Math.ceil(Math.max(0, target - saved) / avgMonthly) : null;

      return { env, saved, target, pct, etaMonths };
    })
    .sort((a, b) => b.pct - a.pct);
}

// ── Styles ──────────────────────────────────────────────────────────────────

function makeStyles(colors) {
  return StyleSheet.create({
  title: {
    fontFamily: fonts.display,
    fontWeight: '500',
    fontSize: 28,
    color: colors.text,
    letterSpacing: -0.5,
    marginVertical: 4,
    marginBottom: 18,
  },
  card: {
    backgroundColor: colors.bgElev,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textFaint,
    letterSpacing: 1.2,
  },

  // History bars
  historySelectedAmt: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  historyOverTag: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.bad,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    gap: 5,
  },
  barSlot: {
    flex: 1,
    height: '100%',
    borderRadius: 6,
    padding: 3,
    backgroundColor: colors.bgElev2,
  },
  barSlotSelected: {
    backgroundColor: colors.bgElev2,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  barTrack: {
    flex: 1,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 4,
  },
  barFill: {
    width: '100%',
    borderRadius: 3,
  },
  barLabels: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 8,
  },
  barLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textFaint,
  },
  barLabelActive: {
    color: colors.text,
    fontFamily: fonts.bodyMedium,
  },

  // Cash flow
  savingsRatePill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  savingsRateText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
  },
  cashFlowBarWrap: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.bgElev2,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 16,
    gap: 2,
  },
  cashFlowBarIncome: {
    height: '100%',
    backgroundColor: colors.good,
    borderRadius: 5,
  },
  cashFlowBarExpenses: {
    height: '100%',
    backgroundColor: colors.bad,
    borderRadius: 5,
  },
  cashFlowStats: {
    flexDirection: 'row',
    marginTop: 4,
  },
  cashFlowStat: {
    flex: 1,
    alignItems: 'flex-start',
  },
  cashFlowStatCenter: {
    alignItems: 'center',
  },
  cashFlowLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textFaint,
    letterSpacing: 1,
    marginTop: 3,
  },
  cashFlowValue: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },

  // Biggest spend
  biggestCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.bad,
  },
  biggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  biggestLeft: {
    flex: 1,
  },
  biggestAmount: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.text,
    fontVariant: ['tabular-nums'],
    marginBottom: 4,
  },
  biggestMeta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textDim,
    marginBottom: 2,
  },
  biggestDate: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  biggestPct: {
    alignItems: 'center',
    backgroundColor: colors.badSubtle,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  biggestPctNum: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.bad,
    fontVariant: ['tabular-nums'],
  },
  biggestPctLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.bad,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 14,
    opacity: 0.8,
  },

  // Day of week
  dowBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 64,
    gap: 6,
  },
  dowSlot: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  dowTrack: {
    width: '100%',
    height: 52,
    justifyContent: 'flex-end',
  },
  dowFill: {
    width: '100%',
    borderRadius: 3,
  },
  dowLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textFaint,
  },
  dowLabelHighest: {
    color: colors.warn,
    fontFamily: fonts.bodyMedium,
  },
  dowHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.bgElev2,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.warn,
  },
  dowHighlightLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  dowHighlightDay: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.warn,
  },
  dowHighlightSep: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  dowHighlightAmt: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },

  // Top merchants
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  merchantRank: {
    width: 20,
    alignItems: 'center',
  },
  merchantRankText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  merchantName: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text,
    width: 80,
  },
  merchantBarWrap: {
    flex: 1,
    height: 5,
    backgroundColor: colors.bgElev2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  merchantBarFill: {
    height: '100%',
    backgroundColor: colors.info,
    borderRadius: 3,
  },
  merchantAmount: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.text,
    fontVariant: ['tabular-nums'],
    width: 72,
    textAlign: 'right',
  },

  // Envelope breakdown
  envRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  envIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.bgElev2,
    borderWidth: 1,
    borderColor: colors.line,
    borderLeftWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  envEmoji: { fontSize: 16 },
  envTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  envName: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
  },
  envAmount: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  envBar: {
    height: 3,
    backgroundColor: colors.bgElev2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  envBarFill: {
    height: '100%',
    borderRadius: 2,
    opacity: 0.6,
  },
  deltaPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    alignItems: 'center',
  },
  deltaText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
  },

  // Recurring
  recurringHero: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.text,
    fontVariant: ['tabular-nums'],
    marginBottom: 16,
  },
  recurringHeroSub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textFaint,
  },
  recurringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  recurringName: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
  },
  recurringMonths: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
    width: 30,
    textAlign: 'right',
  },
  recurringAmount: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.text,
    fontVariant: ['tabular-nums'],
    width: 80,
    textAlign: 'right',
  },

  // Goals
  goalItem: {
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  goalRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  goalPct: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  goalEta: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textFaint,
  },
  goalBarTrack: {
    height: 8,
    backgroundColor: colors.bgElev2,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  goalBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalSaved: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.text,
  },
  goalTarget: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textDim,
  },
  });
}
