/**
 * TransactionsScreen — all transactions, grouped by day, with filter chips.
 *
 * Each row shows: envelope icon, payee, envelope name + note, signed amount.
 * Tap a row to edit it.
 */

import React, { useMemo, useState } from 'react';
import {
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { fonts } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import ScreenLayout from '../components/ScreenLayout';
import { Empty } from '../components/Card';
import TransactionSheet from '../components/TransactionSheet';
import { TransactionGroups } from '../components/TransactionList';
import { useAppState } from '../lib/state';

const FILTERS = [
  { key: 'all',     label: 'All' },
  { key: 'expense', label: 'Expenses' },
  { key: 'income',  label: 'Income' },
];

export default function TransactionsScreen() {
  const { state } = useAppState();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const filteredTransactions = useMemo(() => {
    return filter === 'all'
      ? state.transactions
      : state.transactions.filter((txn) => txn.type === filter);
  }, [state.transactions, filter]);

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

      {filteredTransactions.length === 0 ? (
        <Empty
          icon="💸"
          title="No transactions yet"
          text="Tap + to record one"
        />
      ) : (
        <TransactionGroups
          state={state}
          transactions={filteredTransactions}
          onSelectTransaction={setEditing}
        />
      )}

      <TransactionSheet
        visible={!!editing}
        txn={editing}
        onClose={() => setEditing(null)}
      />
    </ScreenLayout>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
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
  });
}
