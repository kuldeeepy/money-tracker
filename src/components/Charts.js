/**
 * Charts for the Home dashboard.
 *
 * The PWA used inline SVG. Here we use react-native-svg, which gives us the
 * same primitives (Circle, Rect, etc.) with native rendering performance.
 *
 * - SpendingDonut:  category breakdown for the current period
 * - TrendBars:      7-day spending mini-chart
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { colors, fonts } from '../theme/tokens';
import { fmt } from '../lib/format';
import { currentPeriodStart } from '../lib/budget';

/**
 * Donut chart of expenses by envelope for the current period.
 * Renders concentric circle strokes with stroke-dasharray to slice the ring.
 */
export function SpendingDonut({ state, size = 140 }) {
  const start = currentPeriodStart(state);
  const totals = {};
  state.transactions
    .filter((t) => t.type === 'expense' && t.date >= start)
    .forEach((t) => {
      totals[t.envelopeId] = (totals[t.envelopeId] || 0) + t.amount;
    });

  // Resolve envelope ids → entries with full envelope refs for coloring/legend
  const entries = Object.entries(totals)
    .map(([id, amt]) => {
      const env = state.envelopes.find((e) => e.id === id);
      return env ? { env, amt } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.amt - a.amt);

  const sum = entries.reduce((s, x) => s + x.amt, 0);
  const r = 42;                       // circle radius (in viewBox units)
  const C = 2 * Math.PI * r;          // circumference
  const STROKE = 10;
  const VIEW = 100;

  // For empty state, just render the bg ring with no slices
  let cumulative = 0;
  const slices = sum > 0
    ? entries.map(({ env, amt }) => {
        const pct = amt / sum;
        const dash = pct * C;
        const offset = -cumulative;
        cumulative += dash;
        return {
          color: env.color,
          dash,
          rest: C - dash,
          offset,
        };
      })
    : [];

  return (
    <View style={[styles.donutWrap, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        {/* Background ring */}
        <Circle
          cx={VIEW / 2}
          cy={VIEW / 2}
          r={r}
          fill="none"
          stroke={colors.lineSoft}
          strokeWidth={STROKE}
        />
        {/* Slices */}
        {slices.map((s, i) => (
          <Circle
            key={i}
            cx={VIEW / 2}
            cy={VIEW / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={STROKE}
            strokeDasharray={`${s.dash} ${s.rest}`}
            strokeDashoffset={s.offset}
          />
        ))}
      </Svg>

      {/* Center label */}
      <View style={styles.donutCenter} pointerEvents="none">
        <Text style={styles.donutNum}>
          {fmt(sum, state.settings.currency, { decimals: false })}
        </Text>
        <Text style={styles.donutLbl}>SPENT</Text>
      </View>
    </View>
  );
}

/** Legend showing top 5 categories with swatches. */
export function DonutLegend({ state }) {
  const start = currentPeriodStart(state);
  const totals = {};
  state.transactions
    .filter((t) => t.type === 'expense' && t.date >= start)
    .forEach((t) => {
      totals[t.envelopeId] = (totals[t.envelopeId] || 0) + t.amount;
    });

  const entries = Object.entries(totals)
    .map(([id, amt]) => {
      const env = state.envelopes.find((e) => e.id === id);
      return env ? { env, amt } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.amt - a.amt)
    .slice(0, 5);

  if (entries.length === 0) {
    return (
      <View style={styles.legend}>
        <Text style={{ color: colors.textFaint, fontSize: 13, fontFamily: fonts.body }}>
          No spending yet this period.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.legend}>
      {entries.map(({ env, amt }) => (
        <View key={env.id} style={styles.legendRow}>
          <View style={[styles.swatch, { backgroundColor: env.color }]} />
          <Text style={styles.legendName} numberOfLines={1}>
            {env.icon} {env.name}
          </Text>
          <Text style={styles.legendVal}>
            {fmt(amt, state.settings.currency, { decimals: false })}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * 7-day mini bar chart with day labels (S M T W T F S).
 * Uses LinearGradient on each bar for the cream-fading-to-transparent effect.
 */
export function TrendBars({ state }) {
  const days = [];
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
    labels.push(d.toLocaleDateString('en-US', { weekday: 'narrow' }));
  }

  const sums = days.map((iso) =>
    state.transactions
      .filter((t) => t.type === 'expense' && t.date === iso)
      .reduce((s, t) => s + t.amount, 0)
  );
  const max = Math.max(...sums, 1);
  const total = sums.reduce((s, x) => s + x, 0);

  return (
    <>
      <View style={styles.trend}>
        {sums.map((s, i) => {
          const pct = Math.max(0.04, s / max); // min 4% so empty days still show a sliver
          return (
            <View key={i} style={styles.trendBarSlot}>
              <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
                <Defs>
                  <LinearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={s > 0 ? colors.accent : colors.line} stopOpacity="1" />
                    <Stop offset="1" stopColor={s > 0 ? colors.accent : colors.line} stopOpacity="0.5" />
                  </LinearGradient>
                </Defs>
                <Rect
                  x="0"
                  y={(1 - pct) * 100}
                  width="100"
                  height={pct * 100}
                  rx="3"
                  ry="3"
                  fill={`url(#grad-${i})`}
                />
              </Svg>
            </View>
          );
        })}
      </View>
      <View style={styles.trendLabels}>
        {labels.map((l, i) => (
          <Text key={i} style={styles.trendLabel}>{l}</Text>
        ))}
      </View>
      {/* Total in upper-right is rendered by parent via card-link prop */}
    </>
  );
}

/** Helper used by Home to display "₹1,234" total above the trend chart. */
export function trendTotal(state) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return state.transactions
    .filter((t) => t.type === 'expense' && days.includes(t.date))
    .reduce((s, t) => s + t.amount, 0);
}

const styles = StyleSheet.create({
  donutWrap: {
    position: 'relative',
  },
  donutCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutNum: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
  },
  donutLbl: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textFaint,
    letterSpacing: 1,
    marginTop: 4,
  },
  legend: {
    flex: 1,
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendName: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textDim,
  },
  legendVal: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },

  trend: {
    flexDirection: 'row',
    height: 90,
    gap: 6,
    alignItems: 'flex-end',
    marginTop: 4,
  },
  trendBarSlot: {
    flex: 1,
    height: '100%',
    overflow: 'hidden',
  },
  trendLabels: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  trendLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textFaint,
    letterSpacing: 0.5,
  },
});
