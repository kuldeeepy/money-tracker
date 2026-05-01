/**
 * TransactionsScreen — all transactions, grouped by day, with filter chips.
 *
 * Each row shows: envelope icon, payee, envelope name + note, signed amount.
 * Tap a row to edit it.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, fonts, radius } from '../theme/tokens';
import ScreenLayout from '../components/ScreenLayout';
import { Empty } from '../components/Card';
import TransactionSheet from '../components/TransactionSheet';
import { useAppState } from '../lib/state';
import { fmt, dayHeader } from '../lib/format';

const FILTERS = [
  { key: 'all',     label: 'All' },
  { key: 'expense', label: 'Expenses' },
  { key: 'income',  label: 'Income' },
];

export default function TransactionsScreen() {
  const { state } = useAppState();
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);

  const currency = state.settings.currency;

  // Sort newest first, then group by date
  const grouped = useMemo(() => {
    let txns = [...state.transactions].sort(
      (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
    );
    if (filter !== 'all') txns = txns.filter((t) => t.type === filter);

    const byDay = {};
    txns.forEach((t) => {
      if (!byDay[t.date]) byDay[t.date] = [];
      byDay[t.date].push(t);
    });
    return byDay;
  }, [state.transactions, filter]);

  const dates = Object.keys(grouped);

  return (
    <ScreenLayout>
      <Text style={styles.title}>Transactions</Text>
      <Text style={styles.sub}>Every entry, grouped by day.</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, marginBottom: 8 }}
        style={{ marginBottom: 8 }}
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

      {dates.length === 0 ? (
        <Empty
          icon="💸"
          title="No transactions yet"
          text="Tap + to record one"
        />
      ) : (
        dates.map((date) => {
          const items = grouped[date];
          const dayTotal = items.reduce(
            (s, t) => s + (t.type === 'income' ? t.amount : -t.amount),
            0
          );
          return (
            <View key={date}>
              <View style={styles.dayHead}>
                <Text style={styles.dayHeadText}>{dayHeader(date).toUpperCase()}</Text>
                <Text
                  style={[
                    styles.dayHeadText,
                    { color: dayTotal >= 0 ? colors.good : colors.textDim },
                  ]}
                >
                  {dayTotal >= 0 ? '+' : '-'}
                  {fmt(Math.abs(dayTotal), currency, { decimals: false }).replace(/^-/, '')}
                </Text>
              </View>
              {items.map((t) => (
                <TxnRow
                  key={t.id}
                  t={t}
                  state={state}
                  currency={currency}
                  onPress={() => setEditing(t)}
                />
              ))}
            </View>
          );
        })
      )}

      <TransactionSheet
        visible={!!editing}
        txn={editing}
        onClose={() => setEditing(null)}
      />
    </ScreenLayout>
  );
}

function TxnRow({ t, state, currency, onPress }) {
  const env = state.envelopes.find((e) => e.id === t.envelopeId);
  const icon = env ? env.icon : t.type === 'income' ? '💰' : '💸';
  const envName = env
    ? env.name
    : t.type === 'income'
    ? 'Income'
    : 'Uncategorized';

  return (
    <TouchableOpacity style={styles.txnRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.txnIcon}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txnPayee}>{t.payee || '—'}</Text>
        <Text style={styles.txnEnv} numberOfLines={1}>
          {envName}{t.note ? ` · ${t.note}` : ''}
        </Text>
      </View>
      <Text
        style={[
          styles.txnAmt,
          { color: t.type === 'income' ? colors.good : colors.text },
        ]}
      >
        {t.type === 'income' ? '+' : '-'}
        {fmt(t.amount, currency, { decimals: false }).replace(currency, currency)}
      </Text>
    </TouchableOpacity>
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
  dayHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  dayHeadText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textFaint,
    letterSpacing: 1.4,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderColor: colors.lineSoft,
    gap: 12,
  },
  txnIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.bgElev,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnPayee: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  txnEnv: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textDim,
    marginTop: 2,
  },
  txnAmt: {
    fontFamily: fonts.display,
    fontWeight: '500',
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
});
