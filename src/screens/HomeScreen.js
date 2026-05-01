/**
 * HomeScreen — the dashboard.
 *
 * Sections, top to bottom:
 *   1. Hero amount: total left to spend this period
 *   2. Safe-to-spend pill
 *   3. Donut chart (this month's spending by category)
 *   4. 7-day trend bars
 *   5. Top envelopes preview (5 highest-budget, with progress)
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, radius, spacing } from '../theme/tokens';
import ScreenLayout from '../components/ScreenLayout';
import { Card, CardHeader, SectionHead, Empty } from '../components/Card';
import { SpendingDonut, DonutLegend, TrendBars, trendTotal } from '../components/Charts';
import EnvelopeRow from '../components/EnvelopeRow';
import EnvelopeSheet from '../components/EnvelopeSheet';
import { useAppState } from '../lib/state';
import { fmt, fmtParts } from '../lib/format';
import {
  totalBudget,
  totalSpent,
  safeToSpendToday,
} from '../lib/budget';

export default function HomeScreen() {
  const { state } = useAppState();
  const navigation = useNavigation();
  const [editingEnv, setEditingEnv] = useState(null);

  const currency = state.settings.currency;
  const budget = totalBudget(state);
  const spent = totalSpent(state);
  const left = budget - spent;
  const { intPart, fracPart } = fmtParts(left, currency);

  // Top 5 spending envelopes by budget (excluding goals)
  const topEnvelopes = [...state.envelopes]
    .filter((e) => e.type !== 'goal')
    .sort((a, b) => b.budget - a.budget)
    .slice(0, 5);

  return (
    <ScreenLayout>
      {/* Hero: total left + spent + safe-to-spend */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>TOTAL LEFT TO SPEND</Text>
        <View style={styles.heroAmountRow}>
          <Text style={styles.heroCur}>{currency}</Text>
          <Text style={styles.heroInt}>{intPart}</Text>
          <Text style={styles.heroFrac}>{fracPart}</Text>
        </View>
        <View style={styles.heroSub}>
          <Text style={styles.heroSubText}>
            of <Text style={styles.heroSubBold}>{fmt(budget, currency, { decimals: false })}</Text> budget
          </Text>
          <Text style={styles.heroSubText}>
            <Text style={styles.heroSubBold}>{fmt(spent, currency, { decimals: false })}</Text> spent
          </Text>
        </View>

        <View style={styles.safePill}>
          <View style={styles.safePillDot} />
          <Text style={styles.safePillText}>
            Safe to spend today:{' '}
            <Text style={styles.safePillBold}>
              {fmt(safeToSpendToday(state), currency, { decimals: false })}
            </Text>
          </Text>
        </View>
      </View>

      {/* Spending breakdown donut */}
      <Card>
        <CardHeader
          title="This month"
          rightLabel="Insights →"
          onRightPress={() => navigation.navigate('Insights')}
        />
        <View style={styles.donutWrap}>
          <SpendingDonut state={state} size={140} />
          <View style={{ flex: 1 }}>
            <DonutLegend state={state} />
          </View>
        </View>
      </Card>

      {/* 7-day trend */}
      <Card>
        <CardHeader
          title="Last 7 days"
          rightLabel={fmt(trendTotal(state), currency, { decimals: false })}
        />
        <TrendBars state={state} />
      </Card>

      {/* Envelopes preview */}
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
            onPress={() => setEditingEnv(env)}
          />
        ))
      ) : (
        <Empty
          icon="✉️"
          title="No envelopes yet"
          text="Tap + to add your first envelope"
        />
      )}

      <EnvelopeSheet
        visible={!!editingEnv}
        env={editingEnv}
        onClose={() => setEditingEnv(null)}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  heroLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
    letterSpacing: 1.4,
    marginBottom: 6,
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
    fontSize: 52,
    fontWeight: '500',
    color: colors.text,
    letterSpacing: -1,
    lineHeight: 56,
  },
  heroFrac: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.textDim,
  },
  heroSub: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 10,
  },
  heroSubText: {
    fontFamily: fonts.body,
    color: colors.textDim,
    fontSize: 13,
  },
  heroSubBold: {
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
    fontWeight: '600',
  },
  safePill: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.bgElev,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  safePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.good,
  },
  safePillText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textDim,
  },
  safePillBold: {
    fontFamily: fonts.display,
    fontWeight: '600',
    color: colors.text,
  },
  donutWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
});
