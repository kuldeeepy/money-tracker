/**
 * Reusable form primitives used inside sheets.
 * Mirror the styling of the PWA's `.field`, `.field-amount`, `.segmented`, `.btn`.
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, fonts, radius, spacing } from '../theme/tokens';

/** Labeled wrapper for any input. */
export function Field({ label, children, style }) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

/** Plain text input (single line). */
export function TextField({ value, onChangeText, placeholder, keyboardType, autoFocus }) {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textFaint}
      keyboardType={keyboardType}
      autoFocus={autoFocus}
      // Force selection color on Android since the default is invisible on dark bg
      selectionColor={colors.text}
    />
  );
}

/** Amount input — large serif font, currency symbol prefix, decimal keyboard. */
export function AmountInput({ value, onChangeText, currency = '₹', placeholder = '0.00', autoFocus }) {
  return (
    <View style={styles.amount}>
      <Text style={styles.amountCur}>{currency}</Text>
      <TextInput
        style={styles.amountInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        autoFocus={autoFocus}
        selectionColor={colors.text}
      />
    </View>
  );
}

/** Two- or three-option segmented control. */
export function Segmented({ options, value, onChange }) {
  return (
    <View style={styles.segmented}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.segItem, active && styles.segItemActive]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.segText, active && styles.segTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** Primary / ghost / danger button. */
export function Button({ label, onPress, kind = 'primary', style, icon }) {
  const palette = {
    primary: { bg: colors.accent, fg: colors.accentInk, border: 'transparent' },
    ghost:   { bg: colors.bgElev2, fg: colors.text,     border: colors.line },
    danger:  { bg: 'transparent',  fg: colors.bad,      border: 'rgba(232,123,94,0.3)' },
  }[kind];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.btn,
        { backgroundColor: palette.bg, borderColor: palette.border },
        style,
      ]}
      activeOpacity={0.85}
    >
      {icon}
      <Text style={[styles.btnText, { color: palette.fg }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 14,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.bgElev2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.body,
  },

  amount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: colors.bgElev2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  amountCur: {
    fontFamily: fonts.display,
    color: colors.textDim,
    fontSize: 24,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 28,
    fontWeight: '500',
    color: colors.text,
    padding: 0,
  },

  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.bgElev2,
    borderRadius: radius.sm,
    padding: 4,
    marginBottom: 14,
  },
  segItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segItemActive: {
    backgroundColor: colors.bgElev,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  segText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textDim,
  },
  segTextActive: {
    color: colors.text,
  },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  btnText: {
    fontFamily: fonts.bodyMedium,
    fontWeight: '500',
    fontSize: 15,
  },
});
