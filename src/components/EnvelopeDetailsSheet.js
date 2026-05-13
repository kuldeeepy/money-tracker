import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Sheet from './Sheet';
import { Button } from './Form';
import { TransactionGroups } from './TransactionList';
import TransactionSheet from './TransactionSheet';
import EnvelopeSheet from './EnvelopeSheet';
import { fonts, radius } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { fmt } from '../lib/format';
import { currentMonthAllocation, envelopeStatus } from '../lib/budget';

export default function EnvelopeDetailsSheet({ visible, env, state, onClose }) {
  const [editingEnvelope, setEditingEnvelope] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);
  const [addingTxn, setAddingTxn] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const transactions = useMemo(() => {
    if (!env) return [];
    return state.transactions.filter((txn) => txn.envelopeId === env.id);
  }, [env, state.transactions]);

  if (!env) return null;

  const currency = state.settings.currency;
  const status = envelopeStatus(state, env);
  const monthlyPlan = currentMonthAllocation(env);
  const headlineValue =
    env.type === 'goal'
      ? status.available
      : status.available;
  const headlineLabel =
    env.type === 'goal'
      ? 'saved'
      : 'available now';

  return (
    <>
      <Sheet visible={visible} title={`${env.icon} ${env.name}`} onClose={onClose}>
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>{env.type.toUpperCase()} ENVELOPE</Text>
          <Text style={styles.heroValue}>
            {fmt(headlineValue, currency, { decimals: false })}
          </Text>
          <Text style={styles.heroSub}>{headlineLabel}</Text>
        </View>

        <View style={styles.stats}>
          <StatCard
            label={env.type === 'annual' ? 'Monthly contribution' : 'Planned'}
            value={fmt(monthlyPlan, currency, { decimals: false })}
            styles={styles}
          />
          <StatCard
            label={env.type === 'goal' ? 'Target' : 'Spent'}
            value={fmt(
              env.type === 'goal' ? status.target : status.spent,
              currency,
              { decimals: false }
            )}
            styles={styles}
          />
        </View>

        <View style={styles.actions}>
          <Button
            label="Log expense"
            kind="primary"
            onPress={() => setAddingTxn(true)}
          />
          <Button
            label="Edit envelope"
            kind="ghost"
            onPress={() => setEditingEnvelope(true)}
            style={{ marginTop: 10 }}
          />
        </View>

        <Text style={styles.sectionTitle}>Transactions</Text>
        <TransactionGroups
          state={state}
          transactions={transactions}
          onSelectTransaction={setEditingTxn}
          emptyTitle="No transactions in this envelope"
          emptyText="Use the + button to record spending or add back money."
        />
      </Sheet>

      <EnvelopeSheet
        visible={editingEnvelope}
        env={env}
        onClose={() => setEditingEnvelope(false)}
      />
      <TransactionSheet
        visible={!!editingTxn}
        txn={editingTxn}
        onClose={() => setEditingTxn(null)}
      />
      <TransactionSheet
        visible={addingTxn}
        txn={{ envelopeId: env.id, type: 'expense' }}
        onClose={() => setAddingTxn(false)}
      />
    </>
  );
}

function StatCard({ label, value, styles }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    hero: {
      paddingBottom: 18,
    },
    heroLabel: {
      fontFamily: fonts.body,
      fontSize: 11,
      letterSpacing: 1.2,
      color: colors.textFaint,
      marginBottom: 8,
    },
    heroValue: {
      fontFamily: fonts.display,
      fontSize: 34,
      color: colors.text,
    },
    heroSub: {
      marginTop: 4,
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textDim,
    },
    stats: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.bgElev2,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.sm,
      padding: 12,
    },
    statLabel: {
      fontFamily: fonts.body,
      fontSize: 10,
      color: colors.textFaint,
      letterSpacing: 1,
      marginBottom: 6,
    },
    statValue: {
      fontFamily: fonts.display,
      fontSize: 18,
      color: colors.text,
    },
    actions: {
      marginBottom: 8,
    },
    sectionTitle: {
      marginTop: 10,
      fontFamily: fonts.display,
      fontSize: 18,
      color: colors.text,
    },
  });
}
