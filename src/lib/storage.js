/**
 * Storage layer.
 * The PWA used IndexedDB; here we use AsyncStorage which is the
 * standard React Native key/value store.
 *
 * Same three keys as the PWA so we could one day import a JSON backup
 * exported from the web version verbatim:
 *   - "settings"
 *   - "envelopes"
 *   - "transactions"
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'paisa:';

/** Read a JSON value by key, or return `fallback` if missing/corrupt. */
export async function dbGet(key, fallback = null) {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('dbGet failed for', key, e);
    return fallback;
  }
}

/** Write a JSON value by key. */
export async function dbSet(key, value) {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('dbSet failed for', key, e);
  }
}

/** Erase all Paisa keys. Used by the "Reset everything" button. */
export async function dbWipe() {
  const keys = await AsyncStorage.getAllKeys();
  const ours = keys.filter((k) => k.startsWith(PREFIX));
  await AsyncStorage.multiRemove(ours);
}
