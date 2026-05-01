/**
 * Onboarding — runs on first launch.
 *
 * Two screens:
 *   1. Welcome (brand mark + value prop + CTA)
 *   2. Monthly income entry, then seed 6 sensible default envelopes
 *      sized as percentages of stated income.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../theme/tokens';
import { Button } from '../components/Form';
import { useAppState } from '../lib/state';
import { uid } from '../lib/format';

// Seed envelopes are sized as a percentage of stated monthly income,
// then rounded to the nearest 100 for tidy round numbers.
const SEEDS = [
  { name: 'Groceries',     icon: '🛒', color: '#a8d18d', type: 'monthly', pct: 0.15 },
  { name: 'Rent',          icon: '🏠', color: '#8db4d1', type: 'monthly', pct: 0.30 },
  { name: 'Utilities',     icon: '💡', color: '#e8c468', type: 'monthly', pct: 0.05 },
  { name: 'Eating out',    icon: '🍜', color: '#e87b5e', type: 'monthly', pct: 0.08 },
  { name: 'Transport',     icon: '🚌', color: '#c89bd1', type: 'monthly', pct: 0.05 },
  { name: 'Subscriptions', icon: '📱', color: '#8dd1c5', type: 'monthly', pct: 0.03 },
];

export default function Onboarding({ onDone }) {
  const { setSettings, upsertEnvelope } = useAppState();
  const [step, setStep] = useState('welcome');
  const [income, setIncome] = useState('');
  const insets = useSafeAreaInsets();

  const handleFinish = async () => {
    const num = parseFloat(income) || 0;
    await setSettings({ monthlyIncome: num, currency: '₹' });

    if (num > 0) {
      // Seed default envelopes — user can edit/delete freely afterwards
      for (const s of SEEDS) {
        await upsertEnvelope({
          id: uid(),
          name: s.name,
          icon: s.icon,
          color: s.color,
          type: s.type,
          budget: Math.round((num * s.pct) / 100) * 100,
        });
      }
    }
    onDone();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[
        styles.root,
        { paddingTop: 40 + insets.top, paddingBottom: 40 + insets.bottom },
      ]}
    >
      {step === 'welcome' ? (
        <View style={styles.step}>
          <Text style={styles.mark}>
            Paisa<Text style={styles.markAccent}>.</Text>
          </Text>
          <Text style={styles.h1}>
            Envelope budgeting,{'\n'}without limits.
          </Text>
          <Text style={styles.p}>
            Allocate every rupee. Spend with intention. No subscriptions, no
            cap on envelopes, your data never leaves your phone.
          </Text>
          <Button label="Get started" kind="primary" onPress={() => setStep('income')} />
        </View>
      ) : (
        <View style={styles.step}>
          <Text style={styles.h1}>What's your{'\n'}monthly income?</Text>
          <Text style={styles.p}>
            This is the total you'll divide into envelopes each month. You can
            change it later.
          </Text>
          <View style={styles.amountWrap}>
            <Text style={styles.cur}>₹</Text>
            <TextInput
              value={income}
              onChangeText={setIncome}
              keyboardType="decimal-pad"
              placeholder="50000"
              placeholderTextColor={colors.textFaint}
              autoFocus
              style={styles.amountInput}
              selectionColor={colors.text}
            />
          </View>
          <Button label="Create my budget" kind="primary" onPress={handleFinish} />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
  },
  step: {
    flex: 1,
    justifyContent: 'center',
  },
  mark: {
    fontFamily: fonts.display,
    fontSize: 64,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 64,
    marginBottom: 20,
  },
  markAccent: {
    color: colors.good,
  },
  h1: {
    fontFamily: fonts.display,
    fontWeight: '500',
    fontSize: 36,
    color: colors.text,
    letterSpacing: -1,
    lineHeight: 40,
    marginBottom: 12,
  },
  p: {
    fontFamily: fonts.body,
    color: colors.textDim,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 28,
    maxWidth: 400,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: colors.bgElev2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 28,
  },
  cur: {
    fontFamily: fonts.display,
    color: colors.textDim,
    fontSize: 28,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 32,
    fontWeight: '500',
    color: colors.text,
    padding: 0,
  },
});
