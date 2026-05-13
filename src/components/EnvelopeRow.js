/**
 * EnvelopeRow — one card in the envelope list.
 * Renders different layouts for spending envelopes vs goal envelopes.
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { fonts, radius } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { fmt } from '../lib/format';
import { currentMonthAllocation, envelopeStatus } from '../lib/budget';

export default function EnvelopeRow({ env, state, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isGoal = env.type === 'goal';
  const currency = state.settings.currency;
  const status = envelopeStatus(state, env);

  if (isGoal) {
    const saved = status.available;
    const goal = status.target || currentMonthAllocation(env) || 1;
    const pct = Math.round(status.progressPct);
    const remaining = Math.max(0, goal - saved);

    return (
      <TouchableOpacity
        style={[styles.row, { borderLeftColor: env.color }]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <View style={styles.iconBox}>
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

  const spent = status.spent;
  const left = status.available;
  const pct = status.progressPct;
  const overBudget = left < 0;
  const nearBudget = pct >= 75 && !overBudget;
  const fillColor = overBudget ? colors.bad : nearBudget ? colors.warn : colors.good;
  const metaTarget =
    env.type === 'annual'
      ? `${fmt(spent, currency, { decimals: false })} spent · ${fmt(
          env.budget || 0,
          currency,
          { decimals: false }
        )}/yr`
      : `${fmt(spent, currency, { decimals: false })} of ${fmt(
          env.budget || 0,
          currency,
          { decimals: false }
        )}`;

  return (
    <TouchableOpacity
      style={[styles.row, { borderLeftColor: env.color }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.iconBox}>
        <Text style={styles.iconEmoji}>{env.icon}</Text>
      </View>

      <View style={styles.center}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{env.name}</Text>
          {env.fixed && <Text style={styles.fixedBadge}>FIXED</Text>}
        </View>
        <Text style={styles.meta}>{metaTarget}</Text>
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

function makeStyles(colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bgElev,
      borderWidth: 1,
      borderColor: colors.line,
      borderLeftWidth: 3,
      // borderLeftColor is set dynamically via env.color
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
      backgroundColor: colors.bgElev2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconEmoji: {
      fontSize: 20,
    },
    center: {
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    name: {
      fontFamily: fonts.bodyMedium,
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
    },
    fixedBadge: {
      fontFamily: fonts.body,
      fontSize: 9,
      letterSpacing: 0.8,
      color: colors.textFaint,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 1,
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
}
