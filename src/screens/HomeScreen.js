import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import ScreenLayout from '../components/ScreenLayout';
import { Card, CardHeader, SectionHead, Empty } from '../components/Card';
import { SpendingDonut, DonutLegend, TrendBars, trendTotal } from '../components/Charts';
import EnvelopeRow from '../components/EnvelopeRow';
import EnvelopeDetailsSheet from '../components/EnvelopeDetailsSheet';
import DayDetailsSheet from '../components/DayDetailsSheet';
import { useAppState } from '../lib/state';
import { fmt, fmtParts } from '../lib/format';
import {
  budgetSummary,
  variableRemaining,
  currentPeriodRange,
  dateRangeDays,
  daysElapsedInRange,
} from '../lib/budget';

export default function HomeScreen() {
  const { state, autoLogFixed } = useAppState();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [selectedEnv, setSelectedEnv] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  // Auto-log fixed envelopes (rent, EMI etc.) for the current period on mount
  useEffect(() => { autoLogFixed(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const currency = state.settings.currency;
  const summary = budgetSummary(state);
  const leftToSpend = variableRemaining(state);
  const { intPart, fracPart } = fmtParts(leftToSpend, currency);
  const fixedBudget = state.envelopes
    .filter((e) => e.fixed && e.type === 'monthly')
    .reduce((s, e) => s + (e.budget || 0), 0);

  const range = currentPeriodRange(state);
  const totalDays = dateRangeDays(range);
  const daysIn = daysElapsedInRange(range);
  const periodPct = daysIn / totalDays;
  const budgetPct = summary.allocated > 0
    ? Math.min(1, summary.spentThisPeriod / summary.allocated)
    : 0;

  // Budget bar color: is spend outpacing the period clock?
  const lag = budgetPct - periodPct;
  const spendColor = lag > 0.08 ? colors.bad : lag > -0.05 ? colors.warn : colors.good;

  const topEnvelopes = [...state.envelopes]
    .filter((e) => e.type !== 'goal')
    .sort((a, b) => b.budget - a.budget)
    .slice(0, 5);

  return (
    <ScreenLayout>
      {/* ── Hero ───────────────────────────────────────────── */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>LEFT TO SPEND</Text>
        <View style={styles.heroAmountRow}>
          <Text style={styles.heroCur}>{currency}</Text>
          <Text style={styles.heroInt}>{intPart}</Text>
          <Text style={styles.heroFrac}>{fracPart}</Text>
        </View>
        <Text style={styles.heroCaption}>
          {fixedBudget > 0
            ? `excludes ${fmt(fixedBudget, currency, { decimals: false })} in fixed costs`
            : 'across your variable envelopes'}
        </Text>
      </View>

      {/* ── Pace card ──────────────────────────────────────── */}
      <View style={styles.paceCard}>
        <PaceRow
          label="PERIOD"
          pct={periodPct}
          barColor={colors.textFaint}
          right={`Day ${daysIn} of ${totalDays}`}
          styles={styles}
          colors={colors}
        />
        <View style={styles.paceDivider} />
        <PaceRow
          label="BUDGET"
          pct={budgetPct}
          barColor={spendColor}
          right={`${fmt(summary.spentThisPeriod, currency, { decimals: false })} used`}
          styles={styles}
          colors={colors}
        />
        <View style={styles.paceFooter}>
          <Text style={styles.paceFooterText}>
            <Text style={styles.paceFooterBold}>
              {fmt(summary.spentThisPeriod, currency, { decimals: false })}
            </Text>
            {' '}spent
          </Text>
          <Text style={styles.paceFooterDot}>·</Text>
          <Text style={styles.paceFooterText}>
            <Text style={styles.paceFooterBold}>
              {fmt(summary.allocated, currency, { decimals: false })}
            </Text>
            {' '}budgeted
          </Text>
          {fixedBudget > 0 && (
            <>
              <Text style={styles.paceFooterDot}>·</Text>
              <Text style={styles.paceFooterText}>
                <Text style={styles.paceFooterBold}>
                  {fmt(fixedBudget, currency, { decimals: false })}
                </Text>
                {' '}fixed
              </Text>
            </>
          )}
        </View>
      </View>

      {/* ── Spending donut ─────────────────────────────────── */}
      <Card>
        <CardHeader
          title="This month"
          rightLabel="Insights →"
          onRightPress={() => navigation.navigate('Insights')}
        />
        <View style={styles.donutWrap}>
          <SpendingDonut state={state} size={140} />
          <View style={{ flex: 1 }}>
            <DonutLegend state={state} onSelectEnvelope={setSelectedEnv} />
          </View>
        </View>
      </Card>

      {/* ── 7-day trend ────────────────────────────────────── */}
      <Card>
        <CardHeader
          title="Last 7 days"
          rightLabel={fmt(trendTotal(state), currency, { decimals: false })}
        />
        <TrendBars
          state={state}
          selectedDate={selectedDay?.date}
          onSelectDay={setSelectedDay}
        />
      </Card>

      {/* ── Envelopes preview ──────────────────────────────── */}
      <SectionHead
        title="Envelopes"
        rightLabel="See all →"
        onRightPress={() => navigation.navigate('Envelopes')}
      />

      {topEnvelopes.length > 0 ? (
        topEnvelopes.map((env) => (
          <EnvelopeRow
            key={env.id}
            env={env}
            state={state}
            onPress={() => setSelectedEnv(env)}
          />
        ))
      ) : (
        <Empty
          icon="✉️"
          title="No envelopes yet"
          text="Tap + to add your first envelope"
        />
      )}

      <EnvelopeDetailsSheet
        visible={!!selectedEnv}
        env={selectedEnv}
        state={state}
        onClose={() => setSelectedEnv(null)}
      />
      <DayDetailsSheet
        visible={!!selectedDay}
        state={state}
        selectedDay={selectedDay}
        onClose={() => setSelectedDay(null)}
      />
    </ScreenLayout>
  );
}

function PaceRow({ label, pct, barColor, right, styles, colors }) {
  return (
    <View style={styles.paceRow}>
      <Text style={styles.paceLabel}>{label}</Text>
      <View style={styles.paceTrackWrap}>
        <View style={styles.paceTrack}>
          <View
            style={[
              styles.paceFill,
              { width: `${Math.min(100, pct * 100)}%`, backgroundColor: barColor },
            ]}
          />
        </View>
      </View>
      <Text style={styles.paceRight}>{right}</Text>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    // ── Hero ──────────────────────────────────────────────────
    hero: {
      paddingTop: 8,
      paddingBottom: 20,
    },
    heroLabel: {
      fontFamily: fonts.body,
      fontSize: 11,
      color: colors.textFaint,
      letterSpacing: 1.4,
      marginBottom: 8,
    },
    heroAmountRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    heroCur: {
      fontFamily: fonts.display,
      fontSize: 28,
      color: colors.textDim,
      marginRight: 4,
    },
    heroInt: {
      fontFamily: fonts.display,
      fontSize: 58,
      fontWeight: '500',
      color: colors.text,
      letterSpacing: -1.5,
      lineHeight: 62,
    },
    heroFrac: {
      fontFamily: fonts.display,
      fontSize: 28,
      color: colors.textDim,
    },
    heroCaption: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textFaint,
      marginTop: 6,
    },

    // ── Pace card ─────────────────────────────────────────────
    paceCard: {
      backgroundColor: colors.bgElev,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 18,
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 14,
      marginBottom: 14,
      gap: 12,
    },
    paceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    paceLabel: {
      fontFamily: fonts.body,
      fontSize: 10,
      color: colors.textFaint,
      letterSpacing: 1,
      width: 46,
    },
    paceTrackWrap: {
      flex: 1,
    },
    paceTrack: {
      height: 5,
      backgroundColor: colors.bgElev2,
      borderRadius: 3,
      overflow: 'hidden',
    },
    paceFill: {
      height: '100%',
      borderRadius: 3,
    },
    paceRight: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textDim,
      fontVariant: ['tabular-nums'],
      width: 100,
      textAlign: 'right',
    },
    paceDivider: {
      height: 1,
      backgroundColor: colors.lineSoft,
      marginHorizontal: -18,
    },
    paceFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingTop: 2,
    },
    paceFooterText: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textDim,
    },
    paceFooterBold: {
      fontFamily: fonts.display,
      color: colors.text,
      fontSize: 13,
    },
    paceFooterDot: {
      color: colors.textFaint,
      fontSize: 13,
    },

    donutWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 18,
    },
  });
}
