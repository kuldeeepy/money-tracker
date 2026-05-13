import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Sheet from './Sheet';
import { TransactionGroups } from './TransactionList';
import TransactionSheet from './TransactionSheet';
import { fonts, radius } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { dayHeader, fmt } from '../lib/format';

export default function DayDetailsSheet({ visible, state, selectedDay, onClose }) {
  const [editingTxn, setEditingTxn] = useState(null);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!selectedDay) return null;

  const currency = state.settings.currency;
  const transactions = state.transactions.filter(
    (txn) => txn.type === 'expense' && txn.date === selectedDay.date
  );
  const total = transactions.reduce((sum, txn) => sum + txn.amount, 0);

  return (
    <>
      <Sheet
        visible={visible}
        title={dayHeader(selectedDay.date)}
        onClose={onClose}
      >
        <View style={styles.hero}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Spent that day</Text>
            <Text style={styles.summaryValue}>
              {fmt(total, currency, { decimals: false })}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Transactions</Text>
            <Text style={styles.summaryValue}>{transactions.length}</Text>
          </View>
        </View>

        <Text style={styles.hint}>
          Every bar on the dashboard now drills into the real transactions behind it.
        </Text>

        <TransactionGroups
          state={state}
          transactions={transactions}
          onSelectTransaction={setEditingTxn}
          emptyTitle="No spending on this day"
          emptyText="This bar exists because the 7-day chart always shows the full week."
        />
      </Sheet>

      <TransactionSheet
        visible={!!editingTxn}
        txn={editingTxn}
        onClose={() => setEditingTxn(null)}
      />
    </>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    hero: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: colors.bgElev2,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.sm,
      padding: 12,
    },
    summaryLabel: {
      fontFamily: fonts.body,
      fontSize: 10,
      color: colors.textFaint,
      letterSpacing: 1,
      marginBottom: 6,
    },
    summaryValue: {
      fontFamily: fonts.display,
      fontSize: 20,
      color: colors.text,
    },
    hint: {
      marginBottom: 8,
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textDim,
      lineHeight: 20,
    },
  });
}
