/**
 * EnvelopeSheet — form for adding or editing an envelope.
 *
 * Three envelope types:
 *   - monthly: budget renews each period
 *   - annual:  budget for the year (sinking fund)
 *   - goal:    savings target with a goal amount
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import Sheet from './Sheet';
import { Field, TextField, AmountInput, Segmented, Button } from './Form';
import { colors, fonts, ICON_SET, COLOR_SET } from '../theme/tokens';
import { useAppState } from '../lib/state';
import { useToast } from './Toast';
import { uid } from '../lib/format';

export default function EnvelopeSheet({ visible, env, onClose, onCreated }) {
  const { state, upsertEnvelope, removeEnvelope } = useAppState();
  const toast = useToast();
  const isEdit = !!(env && env.id);

  const [type, setType] = useState('monthly');
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [goal, setGoal] = useState('');
  const [icon, setIcon] = useState(ICON_SET[0]);
  const [color, setColor] = useState(COLOR_SET[0]);

  useEffect(() => {
    if (visible) {
      setType(env?.type || 'monthly');
      setName(env?.name || '');
      setBudget(env?.budget != null ? String(env.budget) : '');
      setGoal(env?.goalAmount != null ? String(env.goalAmount) : '');
      setIcon(env?.icon || ICON_SET[0]);
      setColor(env?.color || COLOR_SET[0]);
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
    };
    await upsertEnvelope(data);
    onClose();
    toast.show(isEdit ? 'Saved' : 'Envelope created');
    onCreated && onCreated(data);
  };

  const handleDelete = () => {
    const txnsForEnv = state.transactions.filter(
      (t) => t.envelopeId === env.id
    ).length;
    const msg =
      txnsForEnv > 0
        ? `Delete "${env.name}"? Its ${txnsForEnv} transaction(s) will be unassigned.`
        : `Delete "${env.name}"?`;
    Alert.alert(
      'Delete envelope?',
      msg,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeEnvelope(env.id);
            onClose();
            toast.show('Deleted');
          },
        },
      ]
    );
  };

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
        <Button
          label="Delete envelope"
          kind="danger"
          onPress={handleDelete}
          style={{ marginTop: 10 }}
        />
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
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
});
