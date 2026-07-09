# Building the Android APK

The web app is wrapped with [Capacitor](https://capacitorjs.com). All data is
stored on-device via the browser's `localStorage`, so no server or internet
connection is required at runtime.

## Prerequisites

- Node.js 20+ and `npm` (or `bun`)
- **Android Studio** (latest)
- **JDK 17**
- Android SDK Platform 34 + Build-Tools installed via Android Studio

## First-time setup

Run these once, from the project root:

```bash
npm install
npm run build                 # produces .output/public
npx cap add android           # creates the ./android/ native project
npx cap sync android          # copies web assets into ./android/
```

## Every time you change the app

```bash
npm run build
npx cap sync android
npx cap open android          # opens Android Studio
```

## Producing an APK

Inside Android Studio:

1. Wait for Gradle sync to finish.
2. Menu: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
3. When it finishes, click **locate** in the toast to open the folder.
   The debug APK is at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

For a signed release APK, use **Build → Generate Signed Bundle / APK…** and
follow the wizard (create a keystore the first time, keep it safe — you'll
need the same keystore for every future update).

## Notes

- Data lives in the app's WebView storage. Uninstalling the app deletes the
  data. Use **Settings → Export JSON** in-app to back it up.
- To change the app name or icon, edit `capacitor.config.ts` (`appName`) and
  replace the icons under `android/app/src/main/res/`.
