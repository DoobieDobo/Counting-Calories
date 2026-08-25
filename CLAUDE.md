# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm install
npm run dev              # http://localhost:5173, hot reload
npm test                 # vitest run — 320 tests, ~4s
npm run typecheck
npm run lint
npm run build            # tsc -b && vite build
npm run build:standalone # + dist/standalone.html, the whole game in one file
```

One file, or one test by name:

```sh
npx vitest run src/engine/calories.test.ts
npx vitest run -t 'scales BMR by the activity multiplier'
npx vitest                                   # watch
```

`npm run build` with `GITHUB_PAGES=true` sets the asset base to
`/Counting-Calories/` for project-site hosting. Without it the base is `/`, which
is what dev and preview want.

## Branch and deploy

Work happens on `claude/calorie-grocery-game-eam565`. `main` is the published
branch: pushing to it triggers `.github/workflows/deploy.yml`, which builds and
publishes to <https://doobiedobo.github.io/Counting-Calories/>.

Pages deploys **from `main` only**, and this is not a preference. Switching Pages
on creates a `github-pages` environment whose deployment-branch policy admits the
default branch and nothing else. A deploy job on any other branch is refused
before it starts — it reports failure in about two seconds with no steps and no
log, which reads like a broken runner and is not one. `deploy.yml` therefore
triggers on `main` alone; `ci.yml` runs on every branch, so feature work stays
checked.

## The one idea worth knowing

**A grocery pack is not a serving.** A 500 g jar of sauce is not what you eat. So
a `Product` carries nutrition per some `basis` amount — as the product is *sold*,
dry pasta and uncooked rice — and each dish declares how much of it a serving
*uses*.

The consequence that bites: a player's choice keys on the **option id**, not the
product id. A slot routinely offers the same product at two portion sizes, and
one cup of rice versus two is the same product and a completely different
decision. Code that dedupes or looks up by product id will silently merge them.

## Layout

```
src/
├─ data/       shelves and recipes — products.ts (218), menus.ts, dishes/ (39), dietary.ts
├─ engine/     pure functions, no React: calories, cart, nutrition, shopping,
│              split, suggest, random
├─ state/      gameReducer (the whole game), GameContext, and four storage modules
├─ screens/    one component per phase
└─ components/ budget bar, product card, macro bar, vote panel, sidebar
```

`src/engine/**` and `src/data/**` are pure and carry the test suite. Screens and
components have no unit tests — they are verified in a browser. Put logic worth
testing in `engine/`, not in a component.

**Solo and co-op are one machine**: solo is the one-player case, not a separate
path. `state.mode` gates presentation (whose turn, the vote panel), never the
arithmetic.

## Calorie rules

`src/engine/calories.ts` is the file to read before touching any number a player
sees.

- **Pace is proportional**, not a flat ±500: `min(MAX_PACE, MAX_PACE_SHARE ×
  TDEE)` — 500 on a 2,600-calorie day, 290 on a 1,450-calorie one. A flat
  subtraction is 19% of one body and 34% of another, and it used to push about
  half of sedentary players wanting to lose below the floor.
- **The floor is band-aware.** `CALORIE_FLOOR` is 1,200/1,500, but `dailyTarget`
  derives a `safeFloor` from the BMI band: `max(floor, tdee)` from an underweight
  start so a deficit can never be set, `min(floor, tdee)` otherwise so the guard
  can never invent a *surplus* for someone who asked to lose or maintain. A
  target below 1,200 is therefore possible and correct.
- **Round first, then derive.** `pace` is computed from the already-rounded
  `target` and `tdee`, and `adviceFor` is judged on the same rounded pair. A
  budget screen whose own arithmetic does not add up reads as a bug even when it
  is not.
- **`PACE_TOLERANCE` exists so the game does not report noise.** A one-calorie
  easing is about nine grams a week; announcing it is candour theatre.

## Storage

One key per concern, never one blob:

```
counting-calories:run:v3          the run in progress   (v1, v2 retired)
counting-calories:rounds:v1       finished rounds, KEEP = 12
counting-calories:last-played:v1  the greeting stamp
counting-calories:theme:v1        light / dark / system
```

The run key gets **bumped** when its shape changes, and a bump discards. That is
why nothing else shares it: saved rounds survived a v2→v3 bump precisely because
they were never in it. When adding persisted state, give it its own key.

`index.html` duplicates the theme key in an inline `<head>` script so the theme
applies before first paint. Changing the key means changing it in both places —
the comment there says so.

## Data integrity

`src/data/data.test.ts` and `dietary.test.ts` are the guard rail for content.
They fail when a product id does not resolve, a slot offers fewer than two
options, a dish cannot be built inside the smallest budget the game hands out, or
the cheapest and priciest builds sit too close together to pose a real choice.
Adding a dish means running `npm test`, not eyeballing it.
