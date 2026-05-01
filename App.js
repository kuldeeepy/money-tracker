/**
 * App root.
 *
 * Bootstraps:
 *   1. Loads custom fonts (Fraunces + Inter Tight) via expo-font
 *   2. Hides splash until fonts AND state are ready
 *   3. Decides whether to show Onboarding or the tab navigator
 *   4. Wires up the global FAB (anchored above the tab bar on every screen)
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts as useFraunces, Fraunces_400Regular, Fraunces_500Medium } from '@expo-google-fonts/fraunces';
import { useFonts as useInterTight, InterTight_400Regular, InterTight_500Medium, InterTight_600SemiBold } from '@expo-google-fonts/inter-tight';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';

import { StateProvider, useAppState } from './src/lib/state';
import { ToastProvider } from './src/components/Toast';
import { colors, fonts } from './src/theme/tokens';

import HomeScreen from './src/screens/HomeScreen';
import EnvelopesScreen from './src/screens/EnvelopesScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import Onboarding from './src/screens/Onboarding';
import FAB from './src/components/FAB';

// Keep the splash screen up until fonts and storage are both ready
SplashScreen.preventAutoHideAsync().catch(() => {});

const Tab = createBottomTabNavigator();

/**
 * React Navigation theme — overrides the defaults to match our dark palette.
 * Without this, screen backgrounds flash white during navigation.
 */
const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.line,
    primary: colors.accent,
  },
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: 'rgba(14, 14, 14, 0.95)',
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: 68,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.body,
          fontSize: 10,
          letterSpacing: 0.5,
        },
        tabBarIcon: ({ color, size }) => {
          const map = {
            Home:         'home-outline',
            Envelopes:    'mail-outline',
            Activity:     'swap-horizontal-outline',
            Insights:     'trending-up-outline',
          };
          return <Ionicons name={map[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"      component={HomeScreen} />
      <Tab.Screen name="Envelopes" component={EnvelopesScreen} />
      <Tab.Screen name="Activity"  component={TransactionsScreen} />
      <Tab.Screen name="Insights"  component={InsightsScreen} />
    </Tab.Navigator>
  );
}

/**
 * Inner shell — has access to state via useAppState.
 * Picks Onboarding vs main app based on whether the user has set up anything.
 */
function AppShell() {
  const { state, ready } = useAppState();
  const [onboarded, setOnboarded] = useState(null);

  // Decide once on first render whether to show onboarding
  useEffect(() => {
    if (!ready) return;
    const hasData = state.envelopes.length > 0 || state.settings.monthlyIncome > 0;
    setOnboarded(hasData);
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready || onboarded === null) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  if (!onboarded) {
    return <Onboarding onDone={() => setOnboarded(true)} />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Tabs />
      {/* FAB lives outside the navigator so it floats over every tab */}
      <FAB />
    </NavigationContainer>
  );
}

export default function App() {
  // expo-google-fonts ships the .ttf files via npm, so we don't need to
  // commit any font files to the repo. The keys must match the names we
  // reference everywhere in the theme (see src/theme/tokens.js → fonts).
  const [frauncesLoaded] = useFraunces({
    Fraunces:           Fraunces_400Regular,
    Fraunces_500Medium: Fraunces_500Medium,
  });
  const [interLoaded] = useInterTight({
    InterTight:               InterTight_400Regular,
    InterTight_500Medium:     InterTight_500Medium,
    InterTight_600SemiBold:   InterTight_600SemiBold,
  });
  const fontsLoaded = frauncesLoaded && interLoaded;

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StateProvider>
        <ToastProvider>
          <View style={styles.root} onLayout={onLayoutRootView}>
            <StatusBar style="light" />
            <AppShell />
          </View>
        </ToastProvider>
      </StateProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
