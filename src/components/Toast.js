/**
 * Toast — small message that appears above the bottom nav for ~1.8s
 * after actions like "saved", "deleted", "imported".
 *
 * Usage:
 *   const toast = useToast();
 *   toast.show('Saved');
 *
 * The provider wraps the app at the root; useToast() returns the controller.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '../theme/tokens';

const ToastContext = createContext({ show: () => {} });

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const timerRef = useRef(null);
  const insets = useSafeAreaInsets();

  const show = useCallback((message) => {
    setMsg(message);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    // Reset the auto-dismiss timer
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
      ]).start(() => setMsg(null));
    }, 1800);
  }, [opacity, translateY]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {msg != null && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            {
              opacity,
              transform: [{ translateY }, { translateX: -0.5 }],
              bottom: 90 + insets.bottom + 60,
            },
          ]}
        >
          <Text style={styles.text}>{msg}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: colors.text,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  text: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.bg,
    fontWeight: '500',
  },
});
