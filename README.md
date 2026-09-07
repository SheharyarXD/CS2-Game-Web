# Skindle

**A Counter-Strike Inspired Daily Guesser.**

A standalone, Wordle/Pokédle-style guessing game for Counter-Strike 2 skins and maps. Built with Next.js
(App Router), TypeScript, Prisma, and Tailwind CSS, with an old-school CS:GO-inspired dark tactical UI.

This is a fan-made web app. It does **not** read from, write to, inject into, or otherwise interact with a
running CS2 game client — it's a fully independent browser game.

## Contents

- [Stack](#stack)
- [Gameplay rules](#gameplay-rules)
- [Daily reset](#daily-reset)
- [Original release case](#original-release-case)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Database](#database)
- [Skin data pipeline](#skin-data-pipeline)
- [Data quality](#data-quality)
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
  community-maintained JSON mirror of Valve's item schema (`skins.json`, `crates.json`, `collections.json`)
- **Tests:** Vitest

## Gameplay rules

**Skin Guess** — search for and guess a CS2 skin. Each guess is compared against a hidden target across
four attributes, shown in this order. **Year is always the last column.**

| # | Attribute | Exact match | Partial match | Rule |
|---|---|---|---|---|
| 1 | Weapon | Green | Yellow | The exact weapon (AK-47, M4A1-S, USP-S, Karambit). Yellow for a different weapon in the same family (see `src/lib/game/weaponMatching.ts`) |
| 2 | Collection | Green | — | Exact match only, against the skin's *original release* container (see `src/lib/game/caseMatching.ts`) |
| 3 | Rarity | Green | Yellow | Adjacent tier on the Consumer→Rare Special Item scale (see `src/lib/game/rarityMatching.ts`) |
| 4 | Year | Green | — | The skin's original release year, with an arrow on a miss (see `src/lib/game/yearMatching.ts`) |

M4A1-S and M4A4 are two different weapons, and so are USP-S and P2000, and AK-47 and Galil AR: those pairs
score yellow, never green. Only the same weapon is a match.

The **Year** arrow describes where the *guess* sits relative to the target: ▲ when the guessed skin is newer,
▼ when it is older, green with no arrow when the years are equal. A skin whose release year could not be
determined shows "Unknown" and compares as a miss rather than being given an invented year.

**Wear is no longer a category.** It was removed at the client's request and replaced by Weapon; nothing in
the comparison engine, the schema, the API or the UI still carries it.

Color is **not** a compared attribute either — skins vary too widely in palette for it to be a fair category.
The dominant color is still derived per skin at import time and powers the third clue.

All matching rules are documented with their reasoning directly in the respective module under
`src/lib/game/`. Nothing lives inside a React component — the comparison engine
(`src/lib/game/skinComparison.ts`) is a pure, independently-testable function.

**Winning** is decided by skin identity, not by an all-green row. With four attributes two different skins
can legitimately match on all of them, so an all-green row means "extremely close", not a win.

- **Daily mode**: one shared target for every player, derived deterministically from the calendar date in
  **Eastern Time** (SHA-256 of the date → index into the active skin pool), resolved server-side and stored
  in `DailySkinGame` so a day's target stays fixed even if the pool changes later. Resets at midnight
  `America/New_York`, and the in-game countdown re-fetches automatically when it elapses. See
  [Daily reset](#daily-reset) below.
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

## Daily reset

The daily challenge rolls over at **midnight Eastern Time**, not UTC.

The day's identity is the calendar date in `America/New_York`, resolved on the server through the IANA
timezone database (`Intl.DateTimeFormat`) rather than by subtracting a fixed offset. Eastern Time is UTC-5 in
winter and UTC-4 under daylight saving, so a constant offset would drift the reset by an hour twice a year;
the transition days are correspondingly 23 and 25 hours long and the countdown handles both.

- The browser's timezone is never consulted. Two players on opposite sides of the world get the same target
  for the same instant, because the date is computed in one fixed zone before the target is chosen.
- At 23:59 Eastern the current game is still live; at 00:00 Eastern the next one begins.
- Date-key arithmetic (`previousDateKey`, `nextDateKey`) is pure calendar maths on the `YYYY-MM-DD` string,
  so streaks stay correct across a clock change.

All of this lives in `src/lib/game/dailyTarget.ts`; `gameConfig.daily.timezone` names the zone.

## Original release case

Some skins — in practice every Rare Special Item — drop from more than one container. Butterfly Knife | Lore
is in both the Operation Riptide Case (2021-09-08) and the Dreams & Nightmares Case (2021-11-17).

The game always compares against the container the skin was **originally released in**, and takes its release
year from that same container. `scripts/lib/normalizeSkin.ts#pickOriginalRelease` resolves it:

1. Souvenir Package crates are dropped first — a bonus drop source for a few majors, not a skin's real home.
2. Every remaining container is dated from `crates.json` (`first_sale_date`) or `collections.json`
   (`release_date`).
3. The **earliest** one wins. Crates are preferred over collections when both are present, since a case is
   the more specific answer to "where did this come from"; a dated collection beats an undated crate.
4. Ties break on container id, so the result is stable across reseeds.

It is never the first entry in the array, the newest, or the alphabetically-first — the dataset's ordering
carries no meaning. The rule is generic: nothing about any individual skin is hardcoded.

Every container a skin appears in is kept in `Skin.containers` (JSON, earliest first) so the choice can be
audited or re-derived without a re-import. A skin sitting in five cases is still **one row** and one guess.

When several containers are candidates and none of them carries a date, the skin is flagged as ambiguous by
`npm run data:report` rather than having a release invented for it.

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

- **Skin** — normalized skin record (name, weapon, rarity, original case/collection, release date and year,
  every container it appears in, color, knife/glove flags, etc.)
- **GameMap** — one row per map in rotation (image, dimensions, focal point)
- **DailySkinGame** — one row per UTC calendar day, pre-materializing that day's deterministically-chosen
  target so historical days stay stable even if the active skin pool changes size later
- **GameSession** / **GameGuess** — server-authoritative game state per anonymous player (identified by an
  httpOnly random-UUID cookie, no accounts). The target id is never serialized to the client until the
  game ends.

`mode`/`status`/`rarity`/`color`/`caseType` are stored as plain strings rather than Prisma enums,
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

1. `npm run data:fetch` downloads three files from ByMykel/CSGO-API to `data/raw/` (gitignored cache):
   - `skins.json` — the *grouped* endpoint, where each entry is one recognizable skin with
     `stattrak`/`souvenir` as boolean availability flags rather than separate rows. That's exactly the
     granularity this game wants (no per-float-value or per-variant duplication).
   - `crates.json` — every container, carrying `first_sale_date`.
   - `collections.json` — every collection, carrying `release_date`.

   The two container files are what make the Year column and the original-release rule possible: `skins.json`
   says which crates a skin drops from but carries no dates of its own. All three are structured JSON
   straight from the source — nothing is scraped out of HTML.
2. `npm run seed:skins` normalizes and upserts **the whole catalogue** into the database:
   - **Coverage**: every skin that can be normalized — all case skins, all collection skins (active, armory,
     operation, inactive and discontinued alike), and the Rare Special Items from every case. Entries with no
     paint pattern (vanilla weapons) and equipment like the Zeus are skipped, since neither is guessable.
   - **One row per skin**: a skin in five containers is still a single guessable entry, with its canonical
     case/collection and year taken from the earliest (see [Original release case](#original-release-case)).
   - **Ranking, not filtering**: `scripts/data/popularSkinsAllowlist.ts` used to decide which skins existed.
     It now only grades them — an allowlisted skin gets a popularity boost so autocomplete surfaces AK-47 |
     Redline ahead of an obscure Mil-Spec. It affects ordering only, never eligibility.
   - **Souvenir exclusion**: tournament "Souvenir Package" crates are filtered out before picking a skin's
     case/collection (see `scripts/lib/normalizeSkin.ts`) — they're a bonus drop source, not the skin's
     real home.
   - **Color**: the dataset has no "main color" field, so `scripts/lib/extractDominantColor.ts` downloads
     each skin's actual rendered image and derives a deterministic color bucket from real pixel data
     (ignoring transparent background, classifying by hue/lightness/saturation, falling back to
     "multicolor" when no single hue dominates). Results are cached in `data/cache/colors.json` so re-runs
     don't re-fetch images. This is real derived data, not fabricated metadata.
   - **Release year**: taken from the original container's ship date, never from the import timestamp or a
     later re-release. Unresolvable years are stored as `null` and reported, not guessed at.

## Data quality

```bash
npm run data:report
```

Prints the totals (skins, Rare Special Items, distinct weapons, cases, collections, rarity spread, the range
of release years) and — the part that matters — everything the importer could **not** determine: missing
images, missing release years, missing weapon or rarity values, duplicate ids or display names, and skins
whose original container could not be resolved because none of their candidates carried a date.

Nothing is filled in with a guess. A field that cannot be established honestly stays null and shows up in
this report.

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

- **Comparison engine** (`src/lib/game/skinComparison.ts` + `caseMatching.ts`/`rarityMatching.ts`/
  `weaponMatching.ts`/`yearMatching.ts`) is pure, standalone, and unit-tested — no UI or persistence
  concerns. Components only render whatever it returns.
- **Server-authoritative state**: the daily date key is computed server-side in `America/New_York`, and the
  daily/unlimited/map target is never sent to the client until the game ends, and an un-revealed clue's value is never sent at all. Game sessions live in the database,
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
- **Rarity and weapon-family partial-match thresholds** are documented, deterministic engineering decisions
  where the brief left the exact rule open — see the doc comments in each `src/lib/game/*Matching.ts` file
  for the reasoning and how to change them.
- **Some skins have no determinable release year.** Their Year cell reads "Unknown" and always compares as a
  miss. `npm run data:report` lists them; they are flagged rather than given an invented date.
- **No authentication** — by design (not required by the brief); "streak" or cross-device history would
  need accounts to be added first.
