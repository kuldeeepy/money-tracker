/**
 * SettingsSheet — currency, income, period start day, plus
 * data management actions (export/import/reset).
 *
 * Export: writes a JSON file to the cache dir, then opens the share sheet
 *         so users can save to Drive / send to themselves.
 * Import: lets users pick a JSON file via expo-document-picker.
 * Reset:  wipes all storage with double confirmation.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import Sheet from './Sheet';
import { Field, TextField, AmountInput, Button } from './Form';
import { colors, fonts, radius } from '../theme/tokens';
import { useAppState } from '../lib/state';
import { useToast } from './Toast';
import { today } from '../lib/format';

const CURRENCIES = ['₹', '$', '€', '£', '¥'];

export default function SettingsSheet({ visible, onClose }) {
  const { state, setSettings, importAll, resetAll } = useAppState();
  const toast = useToast();

  const [income, setIncome] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [periodStart, setPeriodStart] = useState('1');

  useEffect(() => {
    if (visible) {
      setIncome(state.settings.monthlyIncome ? String(state.settings.monthlyIncome) : '');
      setCurrency(state.settings.currency || '₹');
      setPeriodStart(String(state.settings.periodStart || 1));
    }
  }, [visible, state.settings]);

  const handleSave = async () => {
    const day = Math.min(28, Math.max(1, parseInt(periodStart, 10) || 1));
    await setSettings({
      monthlyIncome: parseFloat(income) || 0,
      currency,
      periodStart: day,
    });
    onClose();
    toast.show('Saved');
  };

  /** Export current state as a JSON file via the system share sheet. */
  const handleExport = async () => {
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        settings: state.settings,
        envelopes: state.envelopes,
        transactions: state.transactions,
      };
      const path = FileSystem.cacheDirectory + `paisa-backup-${today()}.json`;
      await FileSystem.writeAsStringAsync(path, JSON.stringify(data, null, 2));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, {
          mimeType: 'application/json',
          dialogTitle: 'Save Paisa backup',
        });
      } else {
        toast.show('Sharing not available');
      }
    } catch (e) {
      console.warn(e);
      toast.show('Export failed');
    }
  };

  /** Import data from a user-picked JSON file. */
  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const file = result.assets?.[0];
      if (!file) return;
      const txt = await FileSystem.readAsStringAsync(file.uri);
      const data = JSON.parse(txt);

      Alert.alert(
        'Import data?',
        'This will replace all current data.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            style: 'destructive',
            onPress: async () => {
              await importAll(data);
              onClose();
              toast.show('Imported');
            },
          },
        ]
      );
    } catch (e) {
      console.warn(e);
      toast.show('Bad file');
    }
  };

  /** Wipe everything with double confirmation. */
  const handleReset = () => {
    Alert.alert(
      'Reset everything?',
      'This will erase ALL your data permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Are you absolutely sure?',
              'This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Erase everything',
                  style: 'destructive',
                  onPress: async () => {
                    await resetAll();
                    onClose();
                    toast.show('Reset');
                  },
                },
              ]
            ),
        },
      ]
    );
  };

  return (
    <Sheet visible={visible} title="Settings" onClose={onClose}>
      <Field label="Monthly income">
        <AmountInput
          value={income}
          onChangeText={setIncome}
          currency={currency}
          placeholder="0"
        />
      </Field>

      <Field label="Currency">
        <View style={styles.currencyRow}>
          {CURRENCIES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCurrency(c)}
              style={[
                styles.currencyChip,
                c === currency && styles.currencyChipActive,
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.currencyText,
                  c === currency && styles.currencyTextActive,
                ]}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <Field label="Budget period starts on day">
        <TextField
          value={periodStart}
          onChangeText={setPeriodStart}
          placeholder="1"
          keyboardType="number-pad"
        />
      </Field>

      <Button label="Save" kind="primary" onPress={handleSave} />

      <View style={styles.divider} />

      <Button label="Export my data (JSON)" kind="ghost" onPress={handleExport} />
      <Button
        label="Import data"
        kind="ghost"
        onPress={handleImport}
        style={{ marginTop: 10 }}
      />
      <Button
        label="Reset everything"
        kind="danger"
        onPress={handleReset}
        style={{ marginTop: 10 }}
      />

      <Text style={styles.footer}>
        Paisa · v1.0 · all data stays on your device
      </Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyChip: {
    width: 50,
    height: 50,
    borderRadius: radius.sm,
    backgroundColor: colors.bgElev2,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  currencyText: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textDim,
  },
  currencyTextActive: {
    color: colors.accentInk,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 24,
  },
  footer: {
    fontFamily: fonts.body,
    textAlign: 'center',
    color: colors.textFaint,
    fontSize: 12,
    marginTop: 24,
  },
});
