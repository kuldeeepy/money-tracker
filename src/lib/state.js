/**
 * Global app state via React Context.
 *
 * The PWA kept a single `state` object in module scope and called
 * saveState() after every mutation. Here we use the same shape but
 * expose it through Context so screens can subscribe to changes
 * and re-render automatically.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { dbGet, dbSet, dbWipe } from './storage';

const DEFAULT_STATE = {
  settings: {
    currency: '₹',
    monthlyIncome: 0,
    periodStart: 1,
  },
  envelopes: [],     // { id, name, icon, color, type, budget, goalAmount? }
  transactions: [],  // { id, type, amount, envelopeId, payee, note, date }
};

const StateContext = createContext({
  state: DEFAULT_STATE,
  ready: false,
  setSettings: async () => {},
  upsertEnvelope: async () => {},
  removeEnvelope: async () => {},
  upsertTransaction: async () => {},
  removeTransaction: async () => {},
  importAll: async () => {},
  resetAll: async () => {},
});

export function StateProvider({ children }) {
  const [state, setState] = useState(DEFAULT_STATE);
  const [ready, setReady] = useState(false);

  // Boot: hydrate state from AsyncStorage once
  useEffect(() => {
    (async () => {
      const settings    = (await dbGet('settings'))     ?? DEFAULT_STATE.settings;
      const envelopes   = (await dbGet('envelopes'))    ?? DEFAULT_STATE.envelopes;
      const transactions = (await dbGet('transactions')) ?? DEFAULT_STATE.transactions;
      setState({ settings, envelopes, transactions });
      setReady(true);
    })();
  }, []);

  /**
   * Persist a slice and update memory.
   * We accept either a partial object or a function (state -> partial)
   * so callers can update in terms of current values atomically.
   */
  const persist = useCallback(async (slice) => {
    setState((prev) => {
      const partial = typeof slice === 'function' ? slice(prev) : slice;
      const next = { ...prev, ...partial };
      // Fire-and-forget DB writes for the slices that changed.
      // Order doesn't matter — they're independent keys.
      if (partial.settings)     dbSet('settings',     next.settings);
      if (partial.envelopes)    dbSet('envelopes',    next.envelopes);
      if (partial.transactions) dbSet('transactions', next.transactions);
      return next;
    });
  }, []);

  const setSettings = useCallback(async (patch) => {
    await persist((prev) => ({ settings: { ...prev.settings, ...patch } }));
  }, [persist]);

  const upsertEnvelope = useCallback(async (env) => {
    await persist((prev) => {
      const exists = prev.envelopes.some((e) => e.id === env.id);
      const envelopes = exists
        ? prev.envelopes.map((e) => (e.id === env.id ? env : e))
        : [...prev.envelopes, env];
      return { envelopes };
    });
  }, [persist]);

  const removeEnvelope = useCallback(async (id) => {
    await persist((prev) => ({
      envelopes: prev.envelopes.filter((e) => e.id !== id),
      // Unassign transactions rather than deleting them — preserves history
      transactions: prev.transactions.map((t) =>
        t.envelopeId === id ? { ...t, envelopeId: null } : t
      ),
    }));
  }, [persist]);

  const upsertTransaction = useCallback(async (txn) => {
    await persist((prev) => {
      const exists = prev.transactions.some((t) => t.id === txn.id);
      const transactions = exists
        ? prev.transactions.map((t) => (t.id === txn.id ? txn : t))
        : [...prev.transactions, txn];
      return { transactions };
    });
  }, [persist]);

  const removeTransaction = useCallback(async (id) => {
    await persist((prev) => ({
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  }, [persist]);

  /** Replace all data from a backup file. */
  const importAll = useCallback(async (data) => {
    const next = {
      settings:     data.settings     ?? DEFAULT_STATE.settings,
      envelopes:    data.envelopes    ?? DEFAULT_STATE.envelopes,
      transactions: data.transactions ?? DEFAULT_STATE.transactions,
    };
    setState(next);
    await dbSet('settings',     next.settings);
    await dbSet('envelopes',    next.envelopes);
    await dbSet('transactions', next.transactions);
  }, []);

  /** Wipe everything and reset to defaults. */
  const resetAll = useCallback(async () => {
    await dbWipe();
    setState(DEFAULT_STATE);
  }, []);

  return (
    <StateContext.Provider
      value={{
        state,
        ready,
        setSettings,
        upsertEnvelope,
        removeEnvelope,
        upsertTransaction,
        removeTransaction,
        importAll,
        resetAll,
      }}
    >
      {children}
    </StateContext.Provider>
  );
}

export function useAppState() {
  return useContext(StateContext);
}
