# Paisa — React Native (Expo)

Envelope-budgeting app. No subscription, no envelope cap, your data stays on your phone.

This is the React Native / Expo port of the original PWA. All features and UI from the web version are preserved: dashboard with donut + 7-day trend, full envelope management (monthly / annual / goal types), transactions grouped by day, auto-generated insights, JSON export/import, and on-device-only storage.

---

## Run it on your phone

You'll need [Node.js](https://nodejs.org/) installed (any LTS version, 18+).

**1. Install dependencies**

```bash
cd paisa-rn
npm install
```

**2. Start the dev server**

```bash
npx expo start
```

This prints a QR code in your terminal.

**3. Install Expo Go on your Android phone**

Get it from the Play Store: [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)

**4. Scan the QR code**

Open Expo Go → "Scan QR code" → point at the terminal. The app will download and run on your phone in a few seconds.

> Your phone and computer need to be on the same Wi-Fi network. If they aren't, run `npx expo start --tunnel` instead — slower but works across networks.

---

## Project structure

```
paisa-rn/
├── App.js                    Root: fonts, providers, navigation, FAB
├── app.json                  Expo config
├── babel.config.js           Babel preset
├── package.json              Deps (Expo SDK 51)
└── src/
    ├── theme/tokens.js       Colors, fonts, spacing — single source of truth
    ├── lib/
    │   ├── storage.js        AsyncStorage wrapper (replaces IndexedDB)
    │   ├── format.js         Currency, dates, IDs
    │   ├── budget.js         Period math, totals, safe-to-spend
    │   └── state.js          Global Context with persistence
    ├── components/
    │   ├── Sheet.js          Animated bottom sheet
    │   ├── Toast.js          Toast notifications
    │   ├── Form.js           Field, AmountInput, Segmented, Button
    │   ├── Card.js           Card, SectionHead, Empty
    │   ├── Charts.js         SVG donut + 7-day bar chart
    │   ├── EnvelopeRow.js    Envelope list item
    │   ├── TransactionSheet  Add/edit transaction
    │   ├── EnvelopeSheet     Add/edit envelope
    │   ├── SettingsSheet     Currency, income, export/import/reset
    │   ├── ScreenLayout.js   Shared topbar + scroll body
    │   └── FAB.js            Floating + button
    └── screens/
        ├── HomeScreen        Dashboard
        ├── EnvelopesScreen   Full envelope list
        ├── TransactionsScreen Activity log grouped by day
        ├── InsightsScreen    Auto-generated observations
        └── Onboarding.js     First-launch flow
```

## Building a release APK

When you're ready to install Paisa as a real app (without needing the dev server running):

```bash
npm install -g eas-cli
eas build --profile preview --platform android
```

You'll need a free Expo account. EAS builds the APK in the cloud and gives you a download link. Install the APK on your phone and you're done.

---

## Notes on the migration from the PWA

A few things worth knowing if you want to extend it:

- **Storage** — The PWA used IndexedDB; this uses `AsyncStorage`. Same three keys (`settings`, `envelopes`, `transactions`), so a JSON backup from one version can be imported into the other.
- **Charts** — `react-native-svg` provides the same primitives (`<Circle>`, `<Rect>`, gradients) the PWA used inline, so the donut and trend bars look identical.
- **Sheets** — The PWA's slide-up `<div>` becomes a React Native `Modal` with an `Animated.View` for the slide animation. Drag handle is purely visual (tap-to-dismiss via the backdrop).
- **Fonts** — Loaded via `@expo-google-fonts/fraunces` and `@expo-google-fonts/inter-tight`, so no font files need to ship in the repo.
- **Insights** — The PWA used `innerHTML` with `<b>` tags for inline emphasis. Here, body text is an array of `string | {bold: '...'}` tokens rendered through nested `<Text>` for proper inline flow (RN siblings in a `View` would stack vertically).
