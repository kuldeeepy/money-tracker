/**
 * EnvelopeRow — one card in the envelope list.
 * Renders different layouts for spending envelopes vs goal envelopes.
 *
 * For spending envelopes: shows budget progress bar that goes
 *   green (under 75%) → amber (75-100%) → red (over budget).
 *
 * For goal envelopes: shows a progress bar against the goal amount
 *   instead of a per-period budget.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '../theme/tokens';
import { fmt, hexAlpha } from '../lib/format';
import { envelopeSpent, envelopeGoalSaved } from '../lib/budget';

export default function EnvelopeRow({ env, state, onPress }) {
  const isGoal = env.type === 'goal';
  const currency = state.settings.currency;

  if (isGoal) {
    const saved = envelopeGoalSaved(state, env.id);
    const goal = env.goalAmount || env.budget || 1;
    const pct = Math.min(100, Math.round((saved / goal) * 100));
    const remaining = Math.max(0, goal - saved);

    return (
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
        <View style={[styles.iconBox, { backgroundColor: hexAlpha(env.color, 0.15) }]}>
          <Text style={styles.iconEmoji}>{env.icon}</Text>
        </View>

        <View style={styles.center}>
          <Text style={styles.name}>{env.name}</Text>
          <Text style={styles.meta}>
            {fmt(saved, currency, { decimals: false })} of{' '}
            {fmt(goal, currency, { decimals: false })}
          </Text>
          <View style={styles.goalBar}>
            <View style={styles.goalTrack}>
              <View style={[styles.goalFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.goalPct}>{pct}%</Text>
          </View>
        </View>

        <View style={styles.amountWrap}>
          <Text style={styles.amount}>
            {fmt(remaining, currency, { decimals: false })}
          </Text>
          <Text style={styles.amountSub}>to go</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Spending envelope
  const spent = envelopeSpent(state, env.id);
  const left = env.budget - spent;
  const pct = env.budget > 0 ? Math.min(100, (spent / env.budget) * 100) : 0;
  const overBudget = pct >= 100;
  const nearBudget = pct >= 75 && !overBudget;
  const fillColor = overBudget ? colors.bad : nearBudget ? colors.warn : colors.good;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.iconBox, { backgroundColor: hexAlpha(env.color, 0.15) }]}>
        <Text style={styles.iconEmoji}>{env.icon}</Text>
      </View>

      <View style={styles.center}>
        <Text style={styles.name}>{env.name}</Text>
        <Text style={styles.meta}>
          {fmt(spent, currency, { decimals: false })} of{' '}
          {fmt(env.budget, currency, { decimals: false })}
        </Text>
        <View style={styles.progress}>
          <View
            style={[
              styles.progressFill,
              { width: `${pct}%`, backgroundColor: fillColor },
            ]}
          />
        </View>
      </View>

      <View style={styles.amountWrap}>
        <Text style={[styles.amount, { color: left < 0 ? colors.bad : colors.text }]}>
          {fmt(left, currency, { decimals: false })}
        </Text>
        <Text style={styles.amountSub}>left</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElev,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 20,
  },
  center: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textDim,
    fontVariant: ['tabular-nums'],
  },
  amountWrap: {
    alignItems: 'flex-end',
  },
  amount: {
    fontFamily: fonts.display,
    fontSize: 17,
    fontWeight: '500',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  amountSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
    marginTop: 2,
  },

  // Spending progress bar
  progress: {
    height: 4,
    backgroundColor: colors.lineSoft,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Goal progress bar (with percentage label)
  goalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  goalTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.lineSoft,
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    backgroundColor: colors.good,
    borderRadius: 3,
  },
  goalPct: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textDim,
    fontVariant: ['tabular-nums'],
    minWidth: 32,
    textAlign: 'right',
  },
});
