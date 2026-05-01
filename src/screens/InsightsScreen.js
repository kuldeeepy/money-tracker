/**
 * InsightsScreen — automatically generated observations.
 *
 * Builds 3-5 short cards from the user's data:
 *   - Biggest spending category
 *   - Envelopes over budget
 *   - Spending pace vs steady-budget expectation
 *   - Daily average
 *   - Goal progress milestones
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '../theme/tokens';
import ScreenLayout from '../components/ScreenLayout';
import { Empty } from '../components/Card';
import { useAppState } from '../lib/state';
import { fmt } from '../lib/format';
import {
  currentPeriodStart,
  totalBudget,
  totalSpent,
  envelopeSpent,
  envelopeGoalSaved,
} from '../lib/budget';

export default function InsightsScreen() {
  const { state } = useAppState();
  const insights = buildInsights(state);

  return (
    <ScreenLayout>
      <Text style={styles.title}>Insights</Text>
      <Text style={styles.sub}>A clearer picture of where your money goes.</Text>

      {insights.length === 0 ? (
        <Empty
          icon="📊"
          title="Not enough data yet"
          text="Add a few transactions and your insights will appear here."
        />
      ) : (
        insights.map((i, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.iconBox}>
              <Text style={{ fontSize: 16 }}>{i.icon}</Text>
            </View>
            <Text style={styles.cardTitle}>{i.title}</Text>
            {/* Inline-flow body: nested <Text> children inherit and wrap properly.
                Stacking them in a View instead would put each chunk on its own line. */}
            <Text style={styles.body}>
              {i.body.map((part, j) =>
                typeof part === 'string' ? (
                  <Text key={j}>{part}</Text>
                ) : (
                  <Text key={j} style={styles.bodyBold}>{part.bold}</Text>
                )
              )}
            </Text>
          </View>
        ))
      )}
    </ScreenLayout>
  );
}

/**
 * Build the array of insight cards.
 * Each card has: { icon, title, body: Array<string | {bold: string}> }
 *
 * Body uses an array so we can interleave bold spans (the PWA used innerHTML
 * with <b> tags; in RN we represent it as structured tokens instead).
 */
function buildInsights(state) {
  const currency = state.settings.currency;
  const start = currentPeriodStart(state);
  const expenses = state.transactions.filter(
    (t) => t.type === 'expense' && t.date >= start
  );
  const insights = [];

  // 1. Biggest category
  const byEnv = {};
  expenses.forEach((t) => {
    byEnv[t.envelopeId] = (byEnv[t.envelopeId] || 0) + t.amount;
  });
  const top = Object.entries(byEnv).sort((a, b) => b[1] - a[1])[0];
  if (top) {
    const env = state.envelopes.find((e) => e.id === top[0]);
    if (env) {
      insights.push({
        icon: '🥇',
        title: 'Biggest category this month',
        body: makeBody(
          { bold: `${env.icon} ${env.name}` },
          ' accounts for the most spending at ',
          { bold: fmt(top[1], currency, { decimals: false }) },
          '.'
        ),
      });
    }
  }

  // 2. Over-budget envelopes
  const over = state.envelopes.filter(
    (e) => e.type !== 'goal' && envelopeSpent(state, e.id) > e.budget && e.budget > 0
  );
  if (over.length > 0) {
    const list = over
      .map(
        (e) =>
          `${e.icon} ${e.name} (over by ${fmt(
            envelopeSpent(state, e.id) - e.budget,
            currency,
            { decimals: false }
          )})`
      )
      .join(' · ');
    insights.push({
      icon: '⚠️',
      title: `${over.length} envelope${over.length > 1 ? 's' : ''} over budget`,
      body: makeBody(list),
    });
  }

  // 3. Spending pace
  const today = new Date();
  const periodStart = new Date(currentPeriodStart(state));
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  const totalDays = Math.max(
    1,
    Math.round((periodEnd - periodStart) / (1000 * 60 * 60 * 24))
  );
  const daysIn = Math.max(
    1,
    Math.round((today - periodStart) / (1000 * 60 * 60 * 24))
  );
  const expected = (totalBudget(state) * daysIn) / totalDays;
  const actual = totalSpent(state);

  if (totalBudget(state) > 0) {
    const diff = actual - expected;
    const isAhead = diff > 0;
    insights.push({
      icon: isAhead ? '📈' : '🌿',
      title: isAhead ? 'Spending faster than usual' : 'Spending in good rhythm',
      body: isAhead
        ? makeBody(
            "You're ",
            { bold: fmt(diff, currency, { decimals: false }) },
            ` ahead of where a steady-pace budget would put you on day ${daysIn} of ${totalDays}.`
          )
        : makeBody(
            "You're ",
            { bold: fmt(Math.abs(diff), currency, { decimals: false }) },
            ` under a steady-pace budget on day ${daysIn} of ${totalDays}. Nicely on track.`
          ),
    });
  }

  // 4. Average daily spend
  if (expenses.length > 0) {
    const avg = totalSpent(state) / Math.max(1, daysIn);
    insights.push({
      icon: '📊',
      title: 'Average daily spend',
      body: makeBody(
        "So far this period you're averaging ",
        { bold: fmt(avg, currency, { decimals: false }) + ' / day' },
        '.'
      ),
    });
  }

  // 5. Goal milestones
  const goals = state.envelopes.filter((e) => e.type === 'goal');
  goals.forEach((g) => {
    const saved = envelopeGoalSaved(state, g.id);
    const pct = g.goalAmount ? Math.round((saved / g.goalAmount) * 100) : 0;
    if (pct >= 50 && pct < 100) {
      insights.push({
        icon: '🎯',
        title: `Halfway to "${g.name}"`,
        body: makeBody(
          "You've saved ",
          { bold: fmt(saved, currency, { decimals: false }) },
          ' of your ',
          { bold: fmt(g.goalAmount, currency, { decimals: false }) },
          ' goal — keep going.'
        ),
      });
    } else if (pct >= 100) {
      insights.push({
        icon: '🏆',
        title: `Goal reached: ${g.name}!`,
        body: makeBody(
          "You've fully funded this goal. Time to use it or roll it forward."
        ),
      });
    }
  });

  return insights;
}

// Helper: pack a list of strings/bold-spans into a single inline paragraph.
// We render them inline using <Text> nesting so they wrap naturally.
function makeBody(...parts) {
  // Each "card" body is an array of either strings or { bold: '...' } objects.
  // The renderer above checks `typeof part === 'string'`.
  return parts;
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.display,
    fontWeight: '500',
    fontSize: 28,
    color: colors.text,
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  sub: {
    fontFamily: fonts.body,
    color: colors.textDim,
    fontSize: 14,
    marginBottom: 18,
  },
  card: {
    backgroundColor: colors.bgElev,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 18,
    marginBottom: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.bgElev2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontWeight: '500',
    fontSize: 16,
    color: colors.text,
    marginBottom: 6,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textDim,
    lineHeight: 21,
  },
  bodyBold: {
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
    fontWeight: '600',
  },
});
