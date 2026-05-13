import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { fonts, radius } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { fmt, dayHeader } from '../lib/format';

export function groupTransactionsByDate(transactions) {
  const grouped = {};
  [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .forEach((txn) => {
      if (!grouped[txn.date]) grouped[txn.date] = [];
      grouped[txn.date].push(txn);
    });

  return grouped;
}

export function TransactionGroups({
  state,
  transactions,
  onSelectTransaction,
  emptyTitle = 'No transactions found',
  emptyText = 'There is nothing here yet.',
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const grouped = groupTransactionsByDate(transactions);
  const dates = Object.keys(grouped);
  const currency = state.settings.currency;

  if (dates.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  return dates.map((date) => {
    const items = grouped[date];
    const dayTotal = items.reduce(
      (total, txn) => total + (txn.type === 'income' ? txn.amount : -txn.amount),
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

        {items.map((txn) => (
          <TransactionRow
            key={txn.id}
            txn={txn}
            state={state}
            onPress={() => onSelectTransaction?.(txn)}
          />
        ))}
      </View>
    );
  });
}

export function TransactionRow({ txn, state, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const env = state.envelopes.find((item) => item.id === txn.envelopeId);
  const currency = state.settings.currency;
  const icon = env ? env.icon : txn.type === 'income' ? '💰' : '💸';
  const envName = env
    ? env.name
    : txn.type === 'income'
    ? 'Income'
    : 'Uncategorized';

  return (
    <TouchableOpacity style={styles.txnRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.txnIcon}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txnPayee}>{txn.payee || '—'}</Text>
        <Text style={styles.txnEnv} numberOfLines={1}>
          {envName}
          {txn.note ? ` · ${txn.note}` : ''}
        </Text>
      </View>
      <Text
        style={[
          styles.txnAmt,
          { color: txn.type === 'income' ? colors.good : colors.text },
        ]}
      >
        {txn.type === 'income' ? '+' : '-'}
        {fmt(txn.amount, currency, { decimals: false })}
      </Text>
    </TouchableOpacity>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
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
    empty: {
      paddingVertical: 24,
    },
    emptyTitle: {
      fontFamily: fonts.display,
      fontSize: 18,
      color: colors.text,
    },
    emptyText: {
      marginTop: 6,
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textDim,
    },
  });
}
