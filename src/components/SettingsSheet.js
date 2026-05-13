/**
 * SettingsSheet — currency, income, period start day, theme preference, plus
 * data management actions (export/import/reset).
 *
 * Export: writes a JSON file to the cache dir, then opens the share sheet
 *         so users can save to Drive / send to themselves.
 * Import: lets users pick a JSON file via expo-document-picker.
 * Reset:  wipes all storage with double confirmation.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { version } from '../../package.json';
import Sheet from './Sheet';
import { Field, TextField, AmountInput, Button } from './Form';
import { fonts, radius } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { useAppState } from '../lib/state';
import { useToast } from './Toast';
import { today } from '../lib/format';

const CURRENCIES = ['₹', '$', '€', '£', '¥'];
const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light',  label: 'Light' },
  { value: 'dark',   label: 'Dark' },
];

export default function SettingsSheet({ visible, onClose }) {
  const { state, setSettings, importAll, resetAll } = useAppState();
  const toast = useToast();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [income, setIncome] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [periodStart, setPeriodStart] = useState('1');
  const [themePref, setThemePref] = useState('system');
  const [resetStep, setResetStep] = useState(0);

  useEffect(() => {
    if (visible) {
      setIncome(state.settings.monthlyIncome ? String(state.settings.monthlyIncome) : '');
      setCurrency(state.settings.currency || '₹');
      setPeriodStart(String(state.settings.periodStart || 1));
      setThemePref(state.settings.themePreference || 'system');
      setResetStep(0);
    }
  }, [visible, state.settings]);

  const handleSave = async () => {
    const day = Math.min(28, Math.max(1, parseInt(periodStart, 10) || 1));
    await setSettings({
      monthlyIncome: parseFloat(income) || 0,
      currency,
      periodStart: day,
      themePreference: themePref,
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
      const json = JSON.stringify(data, null, 2);

      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `paisa-backup-${today()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.show('Backup downloaded');
        return;
      }

      const path = FileSystem.cacheDirectory + `paisa-backup-${today()}.json`;
      await FileSystem.writeAsStringAsync(path, json);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, {
          mimeType: 'application/json',
          dialogTitle: 'Save Paisa backup',
        });
        toast.show('Backup ready');
      } else {
        toast.show('Export is not available on this device');
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

  /** Wipe everything with an in-sheet confirmation that works consistently. */
  const handleReset = async () => {
    if (resetStep === 0) {
      setResetStep(1);
      return;
    }

    await resetAll();
    setResetStep(0);
    onClose();
    toast.show('Reset');
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

      <Field label="Theme">
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setThemePref(opt.value)}
              style={[
                styles.themeChip,
                opt.value === themePref && styles.themeChipActive,
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.themeText,
                  opt.value === themePref && styles.themeTextActive,
                ]}
              >
                {opt.label}
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
      <Text style={styles.helperText}>
        This is when a new budget cycle starts. Transactions stay in history; monthly envelope reporting resets from this day.
      </Text>

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
        label={resetStep === 0 ? 'Reset everything' : 'Tap again to erase all data'}
        kind="danger"
        onPress={handleReset}
        style={{ marginTop: 10 }}
      />
      {resetStep === 1 ? (
        <>
          <Text style={styles.resetWarn}>
            This will erase all envelopes, transactions, and settings from this device.
          </Text>
          <Button
            label="Cancel reset"
            kind="ghost"
            onPress={() => setResetStep(0)}
            style={{ marginTop: 10 }}
          />
        </>
      ) : null}

      <Text style={styles.footer}>
        Paisa · v{version} · all data stays on your device
      </Text>
    </Sheet>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
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
    themeRow: {
      flexDirection: 'row',
      gap: 8,
    },
    themeChip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: radius.sm,
      backgroundColor: colors.bgElev2,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    themeText: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textDim,
    },
    themeTextActive: {
      color: colors.accentInk,
      fontFamily: fonts.bodyMedium,
    },
    divider: {
      height: 1,
      backgroundColor: colors.line,
      marginVertical: 24,
    },
    helperText: {
      marginTop: -4,
      marginBottom: 14,
      fontFamily: fonts.body,
      fontSize: 13,
      lineHeight: 20,
      color: colors.textDim,
    },
    resetWarn: {
      marginTop: 12,
      fontFamily: fonts.body,
      fontSize: 13,
      lineHeight: 20,
      color: colors.textDim,
    },
    footer: {
      fontFamily: fonts.body,
      textAlign: 'center',
      color: colors.textFaint,
      fontSize: 12,
      marginTop: 24,
    },
  });
}
