/**
 * Charts for the Home dashboard.
 *
 * The PWA used inline SVG. Here we use react-native-svg, which gives us the
 * same primitives (Circle, Rect, etc.) with native rendering performance.
 *
 * - SpendingDonut:  category breakdown for the current period
 * - TrendBars:      7-day spending mini-chart
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import ReAnimated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing as REasing,
} from 'react-native-reanimated';
import { fonts } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { fmt } from '../lib/format';
import { currentPeriodStart } from '../lib/budget';

const AnimatedCircle = ReAnimated.createAnimatedComponent(Circle);

// Each slice is its own component so useAnimatedProps can be called per-slice
// without violating the rules of hooks (no hooks in loops).
function DonutSlice({ cx, cy, r, C, color, strokeWidth, dash, offset, progress }) {
  const animatedProps = useAnimatedProps(() => {
    const drawn = progress.value * dash;
    return { strokeDasharray: [drawn, C - drawn] };
  });
  return (
    <AnimatedCircle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDashoffset={offset}
      animatedProps={animatedProps}
    />
  );
}

/**
 * Donut chart of expenses by envelope for the current period.
 * Slices animate in (draw from 0 → full arc) whenever spending data changes.
 */
export function SpendingDonut({ state, size = 140 }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
    .sort((a, b) => b.amt - a.amt);

  const sum = entries.reduce((s, x) => s + x.amt, 0);
  const r = 42;
  const C = 2 * Math.PI * r;
  const STROKE = 10;
  const VIEW = 100;

  let cumulative = 0;
  const slices = sum > 0
    ? entries.map(({ env, amt }) => {
        const dash = (amt / sum) * C;
        const offset = -cumulative;
        cumulative += dash;
        return { color: env.color, dash, offset };
      })
    : [];

  // Single progress value drives all slices together: 0 → 1
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 700,
      easing: REasing.out(REasing.cubic),
    });
  // Re-animate whenever the spending total changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sum]);

  return (
    <View style={[styles.donutWrap, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={VIEW / 2}
          cy={VIEW / 2}
          r={r}
          fill="none"
          stroke={colors.lineSoft}
          strokeWidth={STROKE}
        />
        {slices.map((s, i) => (
          <DonutSlice
            key={i}
            cx={VIEW / 2}
            cy={VIEW / 2}
            r={r}
            C={C}
            color={s.color}
            strokeWidth={STROKE}
            dash={s.dash}
            offset={s.offset}
            progress={progress}
          />
        ))}
      </Svg>

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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
export function TrendBars({ state, selectedDate, onSelectDay }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { days, labels } = useMemo(() => {
    const d = [], l = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      d.push(date.toISOString().slice(0, 10));
      l.push(date.toLocaleDateString('en-US', { weekday: 'narrow' }));
    }
    return { days: d, labels: l };
  // days only need recomputing if the date changes (once per day at most)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sums = useMemo(
    () => days.map((iso) =>
      state.transactions
        .filter((t) => t.type === 'expense' && t.date === iso)
        .reduce((s, t) => s + t.amount, 0)
    ),
    // Re-run only when transaction data changes, not on every parent render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.transactions]
  );

  const max = Math.max(...sums, 1);
  const todayIndex = sums.length - 1;
  const fillHeights = useMemo(
    () => sums.map(() => new Animated.Value(0)),
    // sums is always 7 items; keep the animation array stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    const animations = sums.map((value, index) => {
      const target = Math.max(0.04, value / max);
      fillHeights[index].setValue(0);
      return Animated.timing(fillHeights[index], {
        toValue: target,
        duration: 520,
        delay: index * 45,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      });
    });
    Animated.stagger(45, animations).start();
  }, [fillHeights, max, sums]);

  return (
    <>
      <View style={styles.trend}>
        {sums.map((s, i) => {
          const pct = Math.max(0.04, s / max); // min 4% so empty days still show a sliver
          const isToday = i === todayIndex;
          const targetHeight = pct * 68;
          return (
            <TouchableOpacity
              key={i}
              activeOpacity={0.75}
              onPress={() => onSelectDay?.({ date: days[i], amount: s })}
              style={[
                styles.trendBarSlot,
                isToday && styles.trendBarSlotToday,
                selectedDate === days[i] && styles.trendBarSlotSelected,
              ]}
            >
              <View style={styles.trendBarTrack}>
                <Animated.View
                  style={[
                    styles.trendBarFill,
                    {
                      height: fillHeights[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, targetHeight],
                      }),
                      backgroundColor:
                        s > 0 ? (isToday ? colors.info : colors.accent) : colors.line,
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.trendLabels}>
        {labels.map((l, i) => {
          const isToday = i === todayIndex;
          return (
            <View key={i} style={styles.trendLabelWrap}>
              <Text style={[styles.trendLabel, isToday && styles.trendLabelToday]}>{l}</Text>
              {isToday ? <View style={styles.todayDot} /> : null}
            </View>
          );
        })}
      </View>
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

function makeStyles(colors) {
  return StyleSheet.create({
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
      paddingHorizontal: 2,
      paddingTop: 2,
      borderRadius: 8,
      backgroundColor: colors.bgElev2,
      borderWidth: 1,
      borderColor: colors.lineSoft,
    },
    trendBarSlotToday: {
      borderColor: colors.info,
      backgroundColor: colors.bgElev,
    },
    trendBarSlotSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.bgElev,
    },
    trendBarTrack: {
      flex: 1,
      justifyContent: 'flex-end',
      overflow: 'hidden',
      borderRadius: 6,
      backgroundColor: 'transparent',
    },
    trendBarFill: {
      width: '100%',
      borderRadius: 3,
    },
    trendLabels: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 8,
    },
    trendLabelWrap: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    trendLabel: {
      textAlign: 'center',
      fontFamily: fonts.body,
      fontSize: 10,
      color: colors.textFaint,
      letterSpacing: 0.5,
    },
    trendLabelToday: {
      color: colors.text,
      fontFamily: fonts.bodyMedium,
    },
    todayDot: {
      width: 5,
      height: 5,
      borderRadius: 999,
      backgroundColor: colors.info,
    },
  });
}
