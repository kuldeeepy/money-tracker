/**
 * Floating Action Button — single + button in the bottom-right that
 * opens the new-transaction sheet from anywhere in the app.
 *
 * Wraps a TransactionSheet internally so screens don't have to manage it.
 * If the user has no envelopes yet, it opens the envelope sheet first.
 */

import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/tokens';
import { useAppState } from '../lib/state';
import { useToast } from './Toast';
import TransactionSheet from './TransactionSheet';
import EnvelopeSheet from './EnvelopeSheet';

export default function FAB() {
  const { state } = useAppState();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [txnOpen, setTxnOpen] = useState(false);
  const [envOpen, setEnvOpen] = useState(false);

  const handlePress = () => {
    if (state.envelopes.length === 0) {
      // Force them to create an envelope first — transactions need a target
      toast.show('Create an envelope first');
      setEnvOpen(true);
      return;
    }
    setTxnOpen(true);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.fab, { bottom: 80 + insets.bottom }]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.accentInk} />
      </TouchableOpacity>

      <TransactionSheet
        visible={txnOpen}
        txn={null}
        onClose={() => setTxnOpen(false)}
      />
      <EnvelopeSheet
        visible={envOpen}
        env={null}
        onClose={() => setEnvOpen(false)}
        onCreated={() => {
          // Right after creating their first envelope, prompt for a transaction
          setTimeout(() => setTxnOpen(true), 250);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
});
