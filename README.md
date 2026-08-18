# ELAH Founder — iPhone app

Sideload companion for the Founder Platform. Not App Store — install with your Apple ID in **Developer Mode**.

Talks to `https://elahfounderplatform.vercel.app` (same tasks as the web roadmap).

## What it does

- **Today brief** — overdue, due today, blocked, MVP %, and one “Focus now” task
- **Complete tasks** — one tap, writes `status: done` to the live database
- **WhatsApp** — share a task or send an outreach follow-up draft
- **Reminders** — local iOS notifications (no App Store push cert needed)
  - Morning brief 08:00
  - Evening wrap 18:30
  - Per-task: in 1 hour / tonight 9pm / tomorrow 8am
  - Due-date pings at 09:00
- **Capture** — add a founder task from the phone
- **Outreach** — overdue contact follow-ups

## Install on your iPhone (developer mode)

You need a Mac with **Xcode**, a USB cable, and a free Apple ID.

1. On the iPhone: **Settings → Privacy & Security → Developer Mode → On** (reboot if asked).
2. Trust the computer when you plug the phone in.
3. On the Mac:

```bash
cd /Users/benda/elah-founder-mobile
npm install
npx expo prebuild --platform ios
npx expo run:ios --device
```

4. First time, Xcode will ask you to sign with your Apple ID:
   - Open `ios/elahfounder.xcworkspace` (or the `.xcodeproj` Expo generated)
   - Select the **elahfounder** target → **Signing & Capabilities**
   - Team: your personal Apple ID
   - Bundle ID is `com.elahsecurity.founder` (change the last segment if Xcode says it’s taken)
5. If iOS says **Untrusted Developer**: Settings → General → VPN & Device Management → trust your Apple ID.

The free Apple developer account re-signs every **7 days**. Re-run `npx expo run:ios --device` to refresh.

### Faster loop while coding (simulator / Expo)

```bash
npx expo start
```

Then press `i` for the iOS Simulator. Notifications are more reliable on a **real device** with the development build above than in Expo Go.

## Login

Same Founder Platform credentials as the web app.

## Point at a local API

In **Settings → API host**, use your Mac’s LAN IP, e.g. `http://192.168.1.20:3001`.  
`localhost` on the phone is the phone itself.

The Founder Platform must be running with the new `/api/auth/login` route (Bearer tokens).
