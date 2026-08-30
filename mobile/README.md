# REAL VOICES — powered by BrisVO.com

An iOS and Android app for the BrisVO voice-over collective. Browse Brisbane's
voice talent, play their demo reels with background audio and lock-screen
controls, keep a shortlist that works offline, and send an enquiry straight to
the artist.

It reads from the **same Supabase project as the website** in the repository
root, so published artists and demos appear in both without a separate CMS.

## Stack

- Expo SDK 57 / React Native 0.86 (New Architecture)
- expo-router for file-based navigation
- expo-audio for playback, background audio and lock-screen controls
- Plain `fetch` against Supabase PostgREST (anonymous, read-only plus enquiry insert)
- AsyncStorage for the on-device shortlist

## Getting started

```bash
cd mobile
npm install
cp .env.example .env   # then fill in the two values
npm start
```

`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON` are the same values
the website uses for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON`.

> These are inlined into the app bundle at build time. Only ever use the public
> **anon** key — never the service role key. The app relies on the row-level
> security policies in `supabase/artist-registration.sql`, which already limit
> anonymous reads to `is_published = true` artists and their demos.

## Checks

```bash
npm run typecheck    # tsc --noEmit
npm run export:ios   # full Metro bundle — catches anything typecheck cannot
```

## Project layout

```
app/                     expo-router routes
  (tabs)/index.tsx       browse + filter voices
  (tabs)/shortlist.tsx   saved voices (offline)
  (tabs)/info.tsx        about, newsletter, studio links, rate card
  artist/[id].tsx        profile + demo player
  enquiry/[id].tsx       enquiry form (modal)
src/lib/                 supabase client, queries, audio player, shortlist, theme
src/components/          Avatar, ArtistCard, DemoRow, MiniPlayer, states
scripts/generate-icons.mjs  regenerates every app icon from code
```

## Building for the App Store

The app has no native directories checked in — `eas build` generates them from
`app.json`, so there is nothing to keep in sync by hand.

```bash
npm install -g eas-cli
eas login
eas build:configure          # one-off: creates the EAS project ID
eas build --platform ios --profile production
eas submit --platform ios --latest
```

Set the Supabase values as EAS secrets so builds get them without committing a
`.env`:

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://xxxx.supabase.co"
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON --value "eyJ..."
```

### Before the first submission

These are the App Store Connect items the code cannot supply:

- **Apple Developer Program membership** for the BrisVO entity, and an App
  Store Connect app record using the bundle ID `com.brisvo.realvoices`.
- **Screenshots** for 6.7" and 6.5" iPhone (App Store Connect requires at
  least one size).
- **Privacy policy URL.** The app collects a name, email, optional company and
  message when someone sends an enquiry or joins the newsletter — that must be
  declared under App Privacy as "Contact Info" and "User Content", linked to
  the user, used for App Functionality.
- **Support URL** — `https://brisvo.com` works.
- **Age rating** questionnaire (this app is 4+).
- **Export compliance** is already answered in `app.json` via
  `ios.config.usesNonExemptEncryption: false` — the app uses only standard
  HTTPS.

Two review guidelines worth knowing about for this app:

- **4.2 Minimum Functionality.** A web view wrapped in a shell gets rejected.
  This build is native throughout, with background audio, lock-screen
  transport controls, an offline shortlist, native share and haptics — none of
  which the website can do.
- **5.1.1 Account deletion** does not apply: the app has no sign-in. Artists
  manage their profiles on the website dashboard, not in the app.

## Design notes

The palette, the Georgia display face and the accent `#FF3D57` are lifted from
the website (`src/App.css`) so the two read as one brand. The studio directory
and About copy in `src/lib/content.ts` were ported from `src/App.jsx`; if that
copy changes on the site, update it here too.
