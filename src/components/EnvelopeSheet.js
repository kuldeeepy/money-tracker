/**
 * EnvelopeSheet — form for adding or editing an envelope.
 *
 * Three envelope types:
 *   - monthly: budget renews each period
 *   - annual:  budget for the year (sinking fund)
 *   - goal:    savings target with a goal amount
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Sheet from './Sheet';
import { Field, TextField, AmountInput, Segmented, Button } from './Form';
import { fonts, ICON_SET, COLOR_SET } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { useAppState } from '../lib/state';
import { useToast } from './Toast';
import { uid } from '../lib/format';

export default function EnvelopeSheet({ visible, env, onClose, onCreated }) {
  const { state, upsertEnvelope, removeEnvelope } = useAppState();
  const toast = useToast();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isEdit = !!(env && env.id);

  const [type, setType] = useState('monthly');
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [goal, setGoal] = useState('');
  const [icon, setIcon] = useState(ICON_SET[0]);
  const [color, setColor] = useState(COLOR_SET[0]);
  const [fixed, setFixed] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0);

  useEffect(() => {
    if (visible) {
      setType(env?.type || 'monthly');
      setName(env?.name || '');
      setBudget(env?.budget != null ? String(env.budget) : '');
      setGoal(env?.goalAmount != null ? String(env.goalAmount) : '');
      setIcon(env?.icon || ICON_SET[0]);
      setColor(env?.color || COLOR_SET[0]);
      setFixed(env?.fixed || false);
      setDeleteStep(0);
    }
  }, [visible, env]);

  // Adjust the budget label depending on envelope type
  const budgetLabel =
    type === 'annual' ? 'Budget per year' :
    type === 'goal'   ? 'Save per month (optional)' :
    'Budget per month';

  const handleSave = async () => {
    if (!name.trim()) {
      toast.show('Give it a name');
      return;
    }
    const data = {
      id: env?.id || uid(),
      name: name.trim(),
      icon,
      color,
      type,
      budget: parseFloat(budget) || 0,
      goalAmount: type === 'goal' ? (parseFloat(goal) || 0) : undefined,
      fixed: type === 'monthly' ? fixed : false,
    };
    await upsertEnvelope(data);
    onClose();
    toast.show(isEdit ? 'Saved' : 'Envelope created');
    onCreated && onCreated(data);
  };

  const handleDelete = async () => {
    if (deleteStep === 0) {
      setDeleteStep(1);
      return;
    }

    await removeEnvelope(env.id);
    setDeleteStep(0);
    onClose();
    toast.show('Deleted');
  };

  const txnsForEnv = env
    ? state.transactions.filter((t) => t.envelopeId === env.id).length
    : 0;

  return (
    <Sheet
      visible={visible}
      title={isEdit ? 'Edit envelope' : 'New envelope'}
      onClose={onClose}
    >
      <Segmented
        value={type}
        onChange={setType}
        options={[
          { value: 'monthly', label: 'Monthly' },
          { value: 'annual', label: 'Annual' },
          { value: 'goal', label: 'Goal' },
        ]}
      />

      <Field label="Name">
        <TextField
          value={name}
          onChangeText={setName}
          placeholder="e.g. Groceries"
        />
      </Field>

      <Field label={budgetLabel}>
        <AmountInput
          value={budget}
          onChangeText={setBudget}
          currency={state.settings.currency}
          placeholder="0"
        />
      </Field>

      {type === 'monthly' && (
        <TouchableOpacity
          style={styles.fixedRow}
          onPress={() => setFixed((v) => !v)}
          activeOpacity={0.8}
        >
          <View style={styles.fixedText}>
            <Text style={styles.fixedLabel}>Fixed cost</Text>
            <Text style={styles.fixedHint}>Auto-logs this amount at the start of each period (rent, EMI, subscriptions)</Text>
          </View>
          <View style={[styles.fixedToggle, fixed && styles.fixedToggleOn]}>
            <View style={[styles.fixedThumb, fixed && styles.fixedThumbOn]} />
          </View>
        </TouchableOpacity>
      )}

      {type === 'goal' && (
        <Field label="Total goal amount">
          <AmountInput
            value={goal}
            onChangeText={setGoal}
            currency={state.settings.currency}
            placeholder="0"
          />
        </Field>
      )}

      <Field label="Icon">
        <View style={styles.iconGrid}>
          {ICON_SET.map((i) => {
            const selected = i === icon;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.iconCell, selected && styles.iconCellSelected]}
                onPress={() => setIcon(i)}
                activeOpacity={0.7}
              >
                <Text style={styles.iconText}>{i}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Field>

      <Field label="Color">
        <View style={styles.colorRow}>
          {COLOR_SET.map((c) => {
            const selected = c === color;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  selected && styles.colorDotSelected,
                ]}
                activeOpacity={0.7}
              />
            );
          })}
        </View>
      </Field>

      <Button
        label={isEdit ? 'Save changes' : 'Create envelope'}
        kind="primary"
        onPress={handleSave}
      />
      {isEdit && (
        <>
          <Button
            label={deleteStep === 0 ? 'Delete envelope' : 'Tap again to delete envelope'}
            kind="danger"
            onPress={handleDelete}
            style={{ marginTop: 10 }}
          />
          {deleteStep === 1 ? (
            <>
              <Text style={styles.deleteWarn}>
                {txnsForEnv > 0
                  ? `This will remove "${env.name}" and unassign ${txnsForEnv} transaction${txnsForEnv === 1 ? '' : 's'}.`
                  : `This will remove "${env.name}" from your budget.`}
              </Text>
              <Button
                label="Cancel delete"
                kind="ghost"
                onPress={() => setDeleteStep(0)}
                style={{ marginTop: 10 }}
              />
            </>
          ) : null}
        </>
      )}
    </Sheet>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    iconCell: {
      width: '11.5%',
      aspectRatio: 1,
      backgroundColor: colors.bgElev2,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconCellSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.bgElev,
    },
    iconText: {
      fontSize: 18,
    },
    colorRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    colorDot: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    colorDotSelected: {
      borderColor: colors.text,
      transform: [{ scale: 1.1 }],
    },
    fixedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.lineSoft,
      marginBottom: 16,
    },
    fixedText: {
      flex: 1,
    },
    fixedLabel: {
      fontFamily: fonts.bodyMedium,
      fontSize: 14,
      color: colors.text,
      marginBottom: 2,
    },
    fixedHint: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textFaint,
      lineHeight: 16,
    },
    fixedToggle: {
      width: 44,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.bgElev2,
      borderWidth: 1,
      borderColor: colors.line,
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    fixedToggleOn: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    fixedThumb: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.textFaint,
    },
    fixedThumbOn: {
      backgroundColor: colors.accentInk,
      alignSelf: 'flex-end',
    },
    deleteWarn: {
      marginTop: 12,
      fontFamily: fonts.body,
      fontSize: 13,
      lineHeight: 20,
      color: colors.textDim,
    },
  });
}
