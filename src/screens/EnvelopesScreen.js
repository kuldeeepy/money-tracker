/**
 * EnvelopesScreen — full envelope list.
 *
 * Top: 3 KPI cards (Budgeted / Available / Unallocated)
 * Middle: filter chips (All / Monthly / Goals / Annual)
 * Below: scrollable list of EnvelopeRows, tappable to edit.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme/tokens';
import ScreenLayout from '../components/ScreenLayout';
import { Empty } from '../components/Card';
import EnvelopeRow from '../components/EnvelopeRow';
import EnvelopeSheet from '../components/EnvelopeSheet';
import { useAppState } from '../lib/state';
import { fmt } from '../lib/format';
import { envelopeSpent } from '../lib/budget';

const FILTERS = [
  { key: 'all',     label: 'All' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'goal',    label: 'Goals' },
  { key: 'annual',  label: 'Annual' },
];

export default function EnvelopesScreen() {
  const { state } = useAppState();
  const [filter, setFilter] = useState('all');
  const [editingEnv, setEditingEnv] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);

  const currency = state.settings.currency;

  // Totals row (excludes goal envelopes — those are savings, not spending)
  const totalB = state.envelopes
    .filter((e) => e.type !== 'goal')
    .reduce((s, e) => s + e.budget, 0);

  const totalAvail = state.envelopes
    .filter((e) => e.type !== 'goal')
    .reduce((s, e) => s + Math.max(0, e.budget - envelopeSpent(state, e.id)), 0);

  const unalloc = (state.settings.monthlyIncome || 0) - totalB;

  const filtered = filter === 'all'
    ? state.envelopes
    : state.envelopes.filter((e) => e.type === filter);

  return (
    <ScreenLayout>
      <Text style={styles.title}>Envelopes</Text>
      <Text style={styles.sub}>Allocate your income into categories. Tap any to manage.</Text>

      {/* KPI grid */}
      <View style={styles.kpis}>
        <KpiCell label="Budgeted" value={fmt(totalB, currency, { decimals: false })} />
        <KpiCell
          label="Available"
          value={fmt(totalAvail, currency, { decimals: false })}
          color={colors.good}
        />
        <KpiCell
          label="Unallocated"
          value={fmt(unalloc, currency, { decimals: false })}
          color={unalloc < 0 ? colors.bad : colors.text}
        />
      </View>

      {/* Filter chips + Add button on the right */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
        >
          {FILTERS.map((f) => {
            const active = f.key === filter;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          onPress={() => setCreatingNew(true)}
          style={styles.addBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {filtered.length > 0 ? (
        filtered.map((env) => (
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
          title="No envelopes here"
          text="Tap + Add to create one"
        />
      )}

      <EnvelopeSheet
        visible={!!editingEnv}
        env={editingEnv}
        onClose={() => setEditingEnv(null)}
      />
      <EnvelopeSheet
        visible={creatingNew}
        env={null}
        onClose={() => setCreatingNew(false)}
      />
    </ScreenLayout>
  );
}

function KpiCell({ label, value, color }) {
  return (
    <View style={styles.kpiCell}>
      <Text style={styles.kpiLabel}>{label.toUpperCase()}</Text>
      <Text style={[styles.kpiValue, color && { color }]}>{value}</Text>
    </View>
  );
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
  kpis: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  kpiCell: {
    flex: 1,
    backgroundColor: colors.bgElev,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    padding: 12,
  },
  kpiLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textFaint,
    letterSpacing: 1,
    marginBottom: 6,
  },
  kpiValue: {
    fontFamily: fonts.display,
    fontWeight: '500',
    fontSize: 18,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.bgElev,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textDim,
  },
  chipTextActive: {
    color: colors.accentInk,
    fontFamily: fonts.bodyMedium,
  },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.bgElev2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  addBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.text,
  },
});
