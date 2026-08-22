# CS2 Guessing Game

A standalone, Wordle/Pokédle-style guessing game for Counter-Strike 2 skins and maps. Built with Next.js
(App Router), TypeScript, Prisma, and Tailwind CSS, with an old-school CS:GO-inspired dark tactical UI.

This is a fan-made web app. It does **not** read from, write to, inject into, or otherwise interact with a
running CS2 game client — it's a fully independent browser game.

## Contents

- [Stack](#stack)
- [Gameplay rules](#gameplay-rules)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Database](#database)
- [Skin data pipeline](#skin-data-pipeline)
- [Map art](#map-art)
- [Development commands](#development-commands)
- [Switching to Postgres](#switching-to-postgres)
- [Deployment](#deployment)
- [Adding a new map](#adding-a-new-map)
- [Updating skin data](#updating-skin-data)
- [Architecture notes](#architecture-notes)
- [Known limitations](#known-limitations)

## Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript (strict), Tailwind CSS, Framer Motion
- **Backend:** Next.js Route Handlers, Prisma ORM
- **Database:** SQLite for local dev (zero setup); Postgres-ready for production (Neon/Supabase/Railway)
- **Data source:** [ByMykel/CSGO-API](https://github.com/ByMykel/CSGO-API) — a public, no-auth-required,
  community-maintained JSON mirror of Valve's item schema
- **Tests:** Vitest

## Gameplay rules

**Skin Guess** — search for and guess a CS2 skin. Each guess is compared against a hidden target across
five attributes:

| Attribute | Exact match | Partial match | Rule |
|---|---|---|---|
| Color | Green | Yellow | Adjacent on a defined color wheel (see `src/lib/game/colorMatching.ts`) |
| Wear | Green | Yellow | Adjacent tier on the FN→BS scale (see `src/lib/game/wearMatching.ts`) |
| Rarity | Green | Yellow | Adjacent tier on the Consumer→Extraordinary scale (see `src/lib/game/rarityMatching.ts`) |
| Case/Collection | Green | — | Exact match only (see `src/lib/game/caseMatching.ts`) |
| Knife | Green | — | Exact boolean match only |

All matching rules are documented with their reasoning directly in the respective module under
`src/lib/game/`. Nothing lives inside a React component — the comparison engine
(`src/lib/game/skinComparison.ts`) is a pure, independently-testable function.

- **Daily mode**: one shared target for every player, derived deterministically from the UTC calendar
  date (SHA-256 hash of the date, never computed or trusted client-side). Resets at 00:00 UTC.
- **Unlimited mode**: a new random target every game, no guess limit.
- **Clues**: case, rarity, and color can each be revealed once per game.

**Map Guess** — identify one of 12 CS2 maps from a heavily zoomed-in view. You get 11 guesses; each wrong
guess reveals roughly another ~9% of the image (tuned so the 11th guess always reveals exactly 100% — see
`src/lib/game/mapGame.ts`).

## Local setup

Prerequisites: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init   # creates prisma/dev.db and applies the schema
npm run seed                         # fetches skin data, generates map art, seeds both
npm run dev                          # http://localhost:3000
```

## Environment variables

See `.env.example`. Only two variables exist:

- `DATABASE_URL` — Prisma connection string. Defaults to a local SQLite file.
- `SKIN_DATA_SOURCE_URL` — optional override for the upstream skin dataset URL used by
  `npm run data:fetch`. Defaults to the public ByMykel/CSGO-API mirror.

No API keys are required — the chosen data source needs no authentication.

## Database

Schema: `prisma/schema.prisma`. Key models:

- **Skin** — normalized skin record (name, weapon, rarity, case/collection, wear, color, knife/glove
  flags, etc.)
- **GameMap** — one row per map in rotation (image, dimensions, focal point)
- **DailySkinGame** — one row per UTC calendar day, pre-materializing that day's deterministically-chosen
  target so historical days stay stable even if the active skin pool changes size later
- **GameSession** / **GameGuess** — server-authoritative game state per anonymous player (identified by an
  httpOnly random-UUID cookie, no accounts). The target id is never serialized to the client until the
  game ends.

`mode`/`status`/`rarity`/`wear`/`color`/`caseType` are stored as plain strings rather than Prisma enums —
SQLite's connector doesn't support enums, and this schema is written to run unmodified against both SQLite
and Postgres. Validity is enforced at the application layer via the TS unions in `src/lib/game/types.ts`.

Run migrations with:

```bash
npm run prisma:migrate     # dev: create + apply a new migration
npm run prisma:deploy      # prod: apply existing migrations, no schema diffing
npm run prisma:studio      # visual DB browser
```

## Skin data pipeline

1. `npm run data:fetch` downloads `skins.json` from ByMykel/CSGO-API to `data/raw/` (gitignored cache).
   This is the *grouped* endpoint — each entry is one recognizable skin with `stattrak`/`souvenir` as
   boolean availability flags, not separate rows, which is exactly the granularity this game wants (no
   per-float-value or per-variant duplication).
2. `npm run seed:skins` normalizes and upserts a **curated subset** into the database:
   - **Curation**: `scripts/data/popularSkinsAllowlist.ts` is the single source of truth for which ~225
     recognizable skins are in rotation (rifles, pistols, SMGs, knives, gloves, spanning all rarities). To
     add a skin, add a row there and re-run the seed — it's an idempotent upsert.
   - **Souvenir exclusion**: tournament "Souvenir Package" crates are filtered out before picking a skin's
     case/collection (see `scripts/lib/normalizeSkin.ts`) — they're a bonus drop source, not the skin's
     real home.
   - **Color**: the dataset has no "main color" field, so `scripts/lib/extractDominantColor.ts` downloads
     each skin's actual rendered image and derives a deterministic color bucket from real pixel data
     (ignoring transparent background, classifying by hue/lightness/saturation, falling back to
     "multicolor" when no single hue dominates). Results are cached in `data/cache/colors.json` so re-runs
     don't re-fetch images. This is real derived data, not fabricated metadata.
   - **Wear**: a skin can drop across a range of wears; each skin deterministically gets one canonical wear
     (hash of its id) for comparison purposes — see the doc comment in
     `scripts/lib/normalizeSkin.ts#pickCanonicalWear` for the reasoning and how to change the strategy.

## Map art

Valve's actual top-down map radar images have no public, hotlink-friendly CDN the way Steam Community
Market skin images do, so **`public/maps/*.svg` are original, procedurally-generated placeholder
artwork** (`npm run generate:map-art`), not real Valve assets. They're good enough to fully exercise the
reveal/zoom mechanic. To use real map imagery in production: drop a top-down image at
`public/maps/<id>.jpg|png|webp` (from a source you have the rights to use), update the `imageUrl` written
by `scripts/seed-maps.ts` to point at it, and re-run `npm run seed:maps`. No other code changes are
needed — `src/lib/game/mapGame.ts` only cares about a URL + dimensions + focal point.

## Development commands

```bash
npm run dev          # start dev server
npm run build         # production build
npm run start          # run the production build
npm run lint            # eslint
npm run typecheck        # tsc --noEmit
npm run test              # vitest run
npm run test:watch         # vitest watch mode
```

## Switching to Postgres

1. In `prisma/schema.prisma`, change the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set `DATABASE_URL` to your Postgres connection string (Neon/Supabase/Railway all work).
3. `npx prisma migrate dev --name init` against the new database, then `npm run seed`.

No application code needs to change — the schema deliberately avoids SQLite/Postgres-incompatible
features (enums, `mode: "insensitive"` filters) so it runs unmodified against either.

## Deployment

- **App**: deploy to Vercel (or any Node host) — it's a standard Next.js app, no special config.
- **Database**: provision Postgres on Neon/Supabase/Railway, switch the datasource as above, run
  `npm run prisma:deploy` then `npm run seed` against production `DATABASE_URL`.
- Set `DATABASE_URL` (and optionally `SKIN_DATA_SOURCE_URL`) in your hosting provider's environment
  variables — never commit `.env`.

## Adding a new map

1. Add an entry to `data/maps.ts` (id, name, optional focal point).
2. `npm run generate:map-art` (or drop a real image at `public/maps/<id>.jpg` and point `seed-maps.ts` at
   it).
3. `npm run seed:maps`.

No game-logic changes required — the map pool, reveal mechanic, and guess validation are all generic over
whatever's in the `GameMap` table.

## Updating skin data

```bash
npm run data:fetch    # refresh the cached upstream dataset
npm run seed:skins    # re-normalize and upsert
```

Add/remove entries in `scripts/data/popularSkinsAllowlist.ts` to change which skins are in rotation.

## Architecture notes

- **Comparison engine** (`src/lib/game/skinComparison.ts` + `colorMatching.ts`/`wearMatching.ts`/
  `rarityMatching.ts`/`caseMatching.ts`) is pure, standalone, and unit-tested — no UI or persistence
  concerns. Components only render whatever it returns.
- **Server-authoritative state**: the daily/unlimited/map target is never sent to the client until the
  game ends. Game sessions live in the database, keyed by an anonymous httpOnly cookie
  (`src/lib/server/session.ts`) — no accounts, but daily-mode progress survives a page refresh.
- **Config-driven gameplay**: guess limits, reveal percentages, clue keys, and all category orderings live
  in `src/lib/game/config.ts` — nothing is hardcoded through the UI layer.

## Known limitations

- **Map art is placeholder**, not real Valve map imagery (see [Map art](#map-art) above) — legal/licensing
  reasons, not a technical shortcut.
- **Next.js is pinned to the patched 14.2.x line**, not the latest major (15/16). Next 15+ requires React
  19 and makes `cookies()`/dynamic route `params` asynchronous — a breaking change across this entire
  codebase. 14.2.35 has the critical Server Actions DoS (GHSA-7m27-7ghc-44w9) fixed; one remaining
  moderate-severity, high-attack-complexity advisory in the self-hosted Image Optimizer
  (GHSA-9g9p-9gw9-jx7f) is unpatched on 14.x. Risk is mitigated by this app's narrowly-scoped
  `remotePatterns` (two specific hostnames, no wildcards), but a pre-high-traffic-production upgrade to
  Next 15+ is recommended.
- **Color/wear/rarity partial-match thresholds** are documented, deterministic engineering decisions where
  the brief left the exact rule open — see the doc comments in each `src/lib/game/*Matching.ts` file for
  the reasoning and how to change them.
- **No authentication** — by design (not required by the brief); "streak" or cross-device history would
  need accounts to be added first.
