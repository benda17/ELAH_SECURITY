# Install ELAH Founder on iPhone (not Expo Go)

The QR from `expo start --go` always opens **Expo Go**. Your App Store Expo Go is too old for SDK 57. That path will not work.

A real app QR comes from an **EAS development build** (cloud Xcode). After it installs, the home-screen icon is **ELAH Founder**.

## You need

- Expo account (you are logged in as `benda`)
- **Paid Apple Developer Program** ($99/year) — Apple does not allow QR-installing a custom iOS app with a free Apple ID
- iPhone with **Developer Mode** on

## 1. Register this iPhone (one-time)

On the Mac:

```bash
cd /Users/benda/elah-founder-mobile
npx eas-cli@latest device:create
```

Scan **that** QR with the iPhone. It registers the device UDID for signing.

## 2. Cloud-build the app (produces the install QR)

```bash
cd /Users/benda/elah-founder-mobile
npx eas-cli@latest build --platform ios --profile development
```

Sign in with your **Apple Developer** account when asked (let EAS manage certificates).

When the build finishes, Expo prints a page like:

`https://expo.dev/accounts/benda/projects/elah-founder/builds/...`

Open that on the phone (or scan the QR on that page) → **Install**. Trust the developer under Settings → General → VPN & Device Management if iOS asks.

## 3. After it’s installed

Stop using `--go`. From then on:

```bash
cd /Users/benda/elah-founder-mobile
npx expo start --dev-client --tunnel
```

Scan that Metro QR **with the ELAH Founder app** (not Expo Go). It loads the live JS into your installed app.

## Why not local `expo run:ios`

This Mac is macOS 13. Current Xcode needs macOS 26.2. EAS builds on Expo’s machines instead.
