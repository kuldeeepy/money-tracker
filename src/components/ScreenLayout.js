/**
 * ScreenLayout — shared screen chrome.
 *
 * Provides:
 *   - Topbar with the Paisa wordmark + settings cog
 *   - Safe-area padding at the top
 *   - Scrollable body that respects the bottom nav
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '../theme/tokens';
import SettingsSheet from './SettingsSheet';

export default function ScreenLayout({ children, scrollable = true }) {
  const insets = useSafeAreaInsets();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <Text style={styles.brand}>
          Paisa<Text style={styles.brandDot}>.</Text>
        </Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setSettingsOpen(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={20} color={colors.textDim} />
        </TouchableOpacity>
      </View>

      {/* Body */}
      {scrollable ? (
        <ScrollView
          style={styles.body}
          contentContainerStyle={[
            styles.bodyContent,
            // Reserve room so FAB doesn't overlap the last item
            { paddingBottom: 100 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.body}>{children}</View>
      )}

      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 18,
    paddingBottom: 12,
  },
  brand: {
    fontFamily: fonts.display,
    fontWeight: '600',
    fontSize: 22,
    color: colors.text,
    letterSpacing: -0.2,
  },
  brandDot: {
    color: colors.good,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: spacing.xl,
  },
});
