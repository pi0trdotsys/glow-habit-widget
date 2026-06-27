# Loop - Habit Tracker

Build healthy habits and keep your streak alive. Loop is a fast, offline-first
habit tracker that runs as a web app **and** as a native Android app with a real
**home-screen widget** you can tick habits off from - without opening the app.

<p align="center">
  <img src="docs/screenshots/today.png" width="220" alt="Today screen" />
  <img src="docs/screenshots/report.png" width="220" alt="Weekly report" />
  <img src="docs/screenshots/home-widget.png" width="220" alt="Native Android home-screen widget" />
</p>

> From left: Today, Weekly report, and the **native home-screen widget**
> showing today's progress with tap-to-complete.

## Download

Grab the latest signed APK from the
[**Releases**](https://github.com/pi0trdotsys/glow-habit-widget/releases/latest)
page and sideload it (you'll need to allow "install from unknown sources").

> The app replaces any earlier TWA build of Loop - same package id
> (`app.lovable.glow_habit_widget`). Uninstall the old one first if present.

## Features

- **Daily / weekday / times-per-week** habit schedules
- **Hold to complete** with streaks and weekly progress
- **Weekly report** with per-habit breakdown
- **Native home-screen widget** - today's habits, progress, and tap-to-toggle
- **100% offline** - all data lives on-device (no account, no backend)

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React 19, file-based routing)
- Tailwind CSS v4, Radix UI, Zustand (persisted to `localStorage`)
- [Capacitor](https://capacitorjs.com/) for the native Android shell
- A native Android **App Widget** (Java, `RemoteViews`)

## How the home-screen widget works

The web app is fully client-side; its data lives in `localStorage`. A native
widget can't read that, so habit data is bridged into Android `SharedPreferences`:

```
Web app (Zustand → localStorage)
   │  startWidgetBridge()  - native only, no-op on web
   ▼
@capacitor/preferences  →  SharedPreferences "CapacitorStorage"
   │   widget_state  (today's snapshot)
   │   widget_pending (taps queued while the app is closed)
   ▼
Native App Widget (RemoteViews) - renders habits + progress
   │   tap a habit → updates the snapshot + queues an absolute-state op
   ▼
App reconciles the queue on next open (idempotent), then re-publishes
```

Key files: [`src/lib/widget/bridge.ts`](src/lib/widget/bridge.ts) and
[`android/app/src/main/java/app/lovable/glow_habit_widget/`](android/app/src/main/java/app/lovable/glow_habit_widget/).

## Development (web)

```bash
bun install
bun run dev          # http://localhost:8080
bun run build        # production SSR build (used for web deploy)
```

## Building the Android app

Requirements: **JDK 21** (Capacitor 8), Android SDK with `build-tools;34.0.0`.

```bash
# 1. Static, client-only SPA build for Capacitor (separate from the SSR build)
bun run build:cap
bun x cap sync android

# 2. Build a release APK
cd android
JAVA_HOME=/path/to/jdk-21 ./gradlew :app:assembleRelease

# 3. Align + sign (replace with your keystore)
$ANDROID_HOME/build-tools/34.0.0/zipalign -f -p 4 \
  app/build/outputs/apk/release/app-release-unsigned.apk app-aligned.apk
$ANDROID_HOME/build-tools/34.0.0/apksigner sign \
  --ks your.keystore --ks-key-alias your-alias \
  --out loop-release.apk app-aligned.apk
```

Then install with `adb install -r loop-release.apk` and add the **Loop** widget
from the launcher's widget picker.

> The widget is empty until you open the app once - that first launch publishes
> the snapshot the widget reads.
