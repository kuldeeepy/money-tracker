/**
 * TransactionSheet — form for adding or editing a transaction.
 *
 * Props:
 *   visible    boolean
 *   txn        existing transaction object, or null/empty for new
 *   onClose    () => void
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import Sheet from './Sheet';
import { Field, TextField, AmountInput, Segmented, Button } from './Form';
import { colors, fonts, radius } from '../theme/tokens';
import { useAppState } from '../lib/state';
import { useToast } from './Toast';
import { uid, today } from '../lib/format';

export default function TransactionSheet({ visible, txn, onClose }) {
  const { state, upsertTransaction, removeTransaction } = useAppState();
  const toast = useToast();
  const isEdit = !!(txn && txn.id);

  // Local form state — initialized from `txn` whenever the sheet opens
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [envelopeId, setEnvelopeId] = useState(null);
  const [payee, setPayee] = useState('');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) {
      // Reset form whenever we reopen — covers both new and edit cases
      setType(txn?.type || 'expense');
      setAmount(txn?.amount != null ? String(txn.amount) : '');
      setEnvelopeId(txn?.envelopeId || state.envelopes[0]?.id || null);
      setPayee(txn?.payee || '');
      setDate(txn?.date || today());
      setNote(txn?.note || '');
    }
  }, [visible, txn, state.envelopes]);

  const handleSave = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      toast.show('Enter an amount');
      return;
    }
    if (!envelopeId) {
      toast.show('Pick an envelope');
      return;
    }

    const data = {
      id: txn?.id || uid(),
      type,
      amount: num,
      envelopeId,
      payee: payee.trim(),
      note: note.trim(),
      date,
    };
    await upsertTransaction(data);
    onClose();
    toast.show(isEdit ? 'Updated' : 'Added');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete transaction?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeTransaction(txn.id);
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
      title={isEdit ? 'Edit transaction' : 'New transaction'}
      onClose={onClose}
    >
      <Segmented
        value={type}
        onChange={setType}
        options={[
          { value: 'expense', label: 'Expense' },
          { value: 'income', label: 'Income' },
        ]}
      />

      <Field label="Amount">
        <AmountInput
          value={amount}
          onChangeText={setAmount}
          currency={state.settings.currency}
          autoFocus={!isEdit}
        />
      </Field>

      <Field label="Envelope">
        {/* Custom select: chips that scroll horizontally so we don't need
            a native picker (which has poor styling control on Android). */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
        >
          {state.envelopes.map((e) => {
            const active = e.id === envelopeId;
            return (
              <TouchableOpacity
                key={e.id}
                onPress={() => setEnvelopeId(e.id)}
                style={[
                  styles.envChip,
                  active && { backgroundColor: e.color, borderColor: e.color },
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.envChipText, active && { color: colors.bg }]}>
                  {e.icon} {e.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Field>

      <Field label="Payee">
        <TextField
          value={payee}
          onChangeText={setPayee}
          placeholder="Where did it go?"
        />
      </Field>

      <Field label="Date">
        <TextField
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
        />
      </Field>

      <Field label="Note (optional)">
        <TextField
          value={note}
          onChangeText={setNote}
          placeholder="Anything to remember?"
        />
      </Field>

      <Button
        label={isEdit ? 'Save changes' : 'Add transaction'}
        kind="primary"
        onPress={handleSave}
      />
      {isEdit && (
        <Button
          label="Delete"
          kind="danger"
          onPress={handleDelete}
          style={{ marginTop: 10 }}
        />
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  envChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.bgElev2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  envChipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textDim,
  },
});
