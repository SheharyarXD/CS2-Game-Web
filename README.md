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
- [Deployment (Vercel)](#deployment-vercel)
- [Adding a new map](#adding-a-new-map)
- [Updating skin data](#updating-skin-data)
- [Architecture notes](#architecture-notes)
- [Known limitations](#known-limitations)

## Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript (strict), Tailwind CSS, Framer Motion
- **Backend:** Next.js Route Handlers, Prisma ORM
- **Database:** PostgreSQL, in both development and production (Neon, Supabase, Railway, or your own)
- **Data source:** [ByMykel/CSGO-API](https://github.com/ByMykel/CSGO-API) — a public, no-auth-required,
  community-maintained JSON mirror of Valve's item schema
- **Tests:** Vitest

## Gameplay rules

**Skin Guess** — search for and guess a CS2 skin. Each guess is compared against a hidden target across
four attributes, shown in this order:

| Attribute | Exact match | Partial match | Rule |
|---|---|---|---|
| Wear | Green | Yellow | Adjacent tier on the FN→BS scale (see `src/lib/game/wearMatching.ts`) |
| Collection | Green | — | Exact match only (see `src/lib/game/caseMatching.ts`) |
| Rarity | Green | Yellow | Adjacent tier on the Consumer→Rare Special Item scale (see `src/lib/game/rarityMatching.ts`) |
| Weapon Type | Green | Yellow | Same weapon exactly; yellow for a different weapon in the same family (see `src/lib/game/weaponMatching.ts`) |

Color is **not** a compared attribute — skins vary too widely in palette for it to be a fair category. The
dominant color is still derived per skin at import time and powers the third clue.

All matching rules are documented with their reasoning directly in the respective module under
`src/lib/game/`. Nothing lives inside a React component — the comparison engine
(`src/lib/game/skinComparison.ts`) is a pure, independently-testable function.

**Winning** is decided by skin identity, not by an all-green row. With four attributes two different skins
can legitimately match on all of them, so an all-green row means "extremely close", not a win.

- **Daily mode**: one shared target for every player, derived deterministically from the UTC calendar
  date (SHA-256 of the date → index into the active skin pool), resolved server-side and stored in
  `DailySkinGame` so a day's target stays fixed even if the pool changes later. Resets at 00:00 UTC, and
  the in-game countdown re-fetches automatically when it elapses.
- **Unlimited mode**: a new random target every game, no guess limit, entirely separate from Daily.
- **Clues** unlock as guesses are spent, and each can be revealed once per game:

  | After | Clue |
  |---|---|
  | 3 guesses | Case / Collection |
  | 5 guesses | Rarity |
  | 7 guesses | Color |

  Thresholds live in `src/lib/game/config.ts` and are enforced server-side — an un-revealed clue's value
  is never sent to the browser, so the lock can't be bypassed from the client.

**Map Guess** — identify one of 12 CS2 maps from a heavily zoomed-in view. You get 11 guesses; each wrong
guess reveals roughly another ~9% of the image (tuned so the 11th guess always reveals exactly 100% — see
`src/lib/game/mapGame.ts`).

## Local setup

Prerequisites: Node.js 20+, npm, and a PostgreSQL database you can connect to. A free Neon or Supabase
instance works fine, and so does a local Postgres.

```bash
npm install                          # `postinstall` runs `prisma generate` for you
cp .env.example .env                 # then edit .env and fill in your two connection strings
npm run prisma:deploy                # applies the existing migration to your database
npm run seed                         # fetches skin data, generates map art, seeds skins/agents/maps
npm run dev                          # http://localhost:3000
```

If you are changing the schema rather than just setting up, use `npm run prisma:migrate` instead of
`prisma:deploy` so a new migration file gets written.

## Environment variables

See `.env.example`.

| Variable | Required | What it is |
|---|---|---|
| `DATABASE_URL` | yes | Pooled Postgres connection string. This is what the running app uses. On a serverless host every invocation can open its own connection, so point it at a pooler (Neon's `-pooler` host, Supabase port 6543, or PgBouncer). |
| `DIRECT_URL` | yes | Direct, unpooled connection. Prisma uses it for migrations, which a transaction pooler cannot run. If your provider does not distinguish the two, set both to the same string. |
| `SKIN_DATA_SOURCE_URL` | no | Override for the upstream skin dataset used by `npm run data:fetch`. Defaults to the public ByMykel/CSGO-API mirror. |
| `AGENT_DATA_SOURCE_URL` | no | Same idea, for the agent portrait dataset used by `npm run seed:agents`. |

No API keys are required — the chosen data source needs no authentication. `.env` is gitignored and must
never be committed.

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

`mode`/`status`/`rarity`/`wear`/`color`/`caseType` are stored as plain strings rather than Prisma enums,
and search goes through a lowercased `searchText` column rather than a case-insensitive filter. Both are
holdovers from an earlier SQLite setup that cost nothing to keep, and they keep the schema portable.
Validity is enforced at the application layer via the TS unions in `src/lib/game/types.ts`.

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

## Deployment (Vercel)

The app is a standard Next.js App Router project, so Vercel needs no special configuration — no
`vercel.json`, no custom build command. The only thing to get right is the database.

1. **Provision Postgres.** Neon, Supabase, and Railway all have a free tier that works. Grab both the
   pooled and the direct connection string.
2. **Set the environment variables** in the Vercel project (Production, Preview, and Development):
   `DATABASE_URL` (pooled), `DIRECT_URL` (direct), and optionally the two data source overrides.
3. **Apply the migration** once, from your machine, against the production database:
   ```bash
   npm run prisma:deploy
   ```
   `prisma migrate deploy` only applies migrations that have not run yet. It never drops or resets
   anything, which is why it is the right command to point at production.
4. **Seed the content tables** once, also from your machine:
   ```bash
   npm run seed
   ```
   Every seed script is an idempotent upsert, so re-running it after a data refresh is safe and will not
   duplicate rows or disturb in-flight game sessions.
5. **Deploy.** Push to the connected branch, or run `vercel --prod`. `prisma generate` runs automatically
   during install via the `postinstall` script, which is required because Vercel caches `node_modules`
   between builds and the generated client would otherwise go stale.

Notes on running this on serverless:

- Nothing is written to the filesystem at runtime. The skin images are hotlinked from Steam's CDN and the
  map art is served from `public/`, both of which are read-only and fine on Vercel.
- The home page is marked `force-dynamic` because it reads live counts from the database. Without that,
  Next would prerender it at build time and bake in whatever the build machine saw.
- All game state lives in Postgres and is keyed by an httpOnly cookie, so it survives cold starts and does
  not depend on any one instance staying alive.

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

- **Comparison engine** (`src/lib/game/skinComparison.ts` + `wearMatching.ts`/`caseMatching.ts`/
  `rarityMatching.ts`/`weaponMatching.ts`) is pure, standalone, and unit-tested — no UI or persistence
  concerns. Components only render whatever it returns.
- **Server-authoritative state**: the daily/unlimited/map target is never sent to the client until the
  game ends, and an un-revealed clue's value is never sent at all. Game sessions live in the database,
  keyed by an anonymous httpOnly cookie (`src/lib/server/session.ts`) — no accounts, but daily progress
  survives a refresh. The browser only ever stores a session id, never the target.
- **Server-enforced rules**: duplicate guesses, clue unlock thresholds, session ownership and the
  exact-identity win condition are all validated in `src/lib/server/skinGame.ts`, not just in the UI.
- **Config-driven gameplay**: guess limits, reveal percentages, clue keys and thresholds, and all category
  orderings live in `src/lib/game/config.ts` — nothing is hardcoded through the UI layer.
- **Progression** (`src/lib/game/playerRank.ts`): profile level 1-40; reaching the cap resets the level and
  awards that calendar year's Service Medal, after which the level climbs freely until the year turns
  over. The daily streak only advances on an actual daily win, and never twice for the same day.

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
