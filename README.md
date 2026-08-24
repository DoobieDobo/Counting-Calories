# Counting Calories

A grocery shopping game where **calories are the currency**.

You enter your height, weight and activity level, pick a goal, and the game
works out a calorie budget for each meal. Then you choose a dish from a menu and
shop for its ingredients one at a time — and every ingredient has several
varieties at wildly different prices.

Spaghetti sauce, for one serving of Filipino spaghetti:

| | |
|---|---:|
| Pinoy-style sweet spaghetti sauce | **216 cal** |
| American-style meat sauce | 171 cal |
| Italian-style marinara | 117 cal |
| Canned crushed tomatoes | 58 cal |
| Fresh tomatoes, chopped | 36 cal |

Same dish. Same slot. A six-fold difference. That's the game.

---

## Play it

**Easiest — nothing to install:** <https://claude.ai/code/artifact/bc528df3-e281-4bed-908a-f4eb35d599dc>

A snapshot of the whole game in one page. Works on a phone. It doesn't track this
repo, so it needs republishing after changes — see *A single-file build* below.

**Permanent URL:** <https://doobiedobo.github.io/Counting-Calories/> — updates on
every push, once Pages is switched on (Settings → Pages → Source: **GitHub
Actions**). Until someone does that once, this link 404s.

**Locally:**

```sh
npm install
npm run dev
```

---

## Playing

- **A run is one day** — breakfast, lunch, dinner. Each meal draws its share of
  your daily budget, and anything you don't spend carries over to the next.
- **Five menus**: Breakfast (Filipino silogs and American diner plates),
  Filipino, American, Arabic, Chinese. Thirty-nine dishes.
- **Roll** if you don't want to choose — for the menu, the dish, or a single
  ingredient.
- **Leave anything out.** Skipping the meat to save calories is a legitimate and
  instructive move, so the game warns rather than blocks.
- **Checkout refuses an over-budget cart**, but never just says no: it names the
  single biggest swap available and how much it saves.
- **Co-op**, two to four players on one screen. Budgets pool into one pot, and
  the picker rotates each ingredient — everyone discusses, one person commits.

## Running it

```sh
npm install
npm run dev        # http://localhost:5173
```

```sh
npm test           # engine + data-integrity tests
npm run typecheck
npm run lint
npm run build
```

No server, no API keys, no accounts. Everything runs in the browser and the
food data ships with the app.

### A single-file build

```sh
npm run build:standalone
```

The game makes no external requests — no CDN, no web fonts, no `fetch` — so it
folds into one self-contained file. `scripts/inline-build.mjs` writes two:

- `dist/standalone.html` — a complete document, ~294 KB. Open it straight from
  disk, email it, drop it on any static host.
- `dist/artifact.html` — the same thing without the `<!doctype>`/`<html>`/`<body>`
  wrapper, for hosts that supply their own.

## How it's put together

```
src/
├─ data/       the shelves and the recipes
│  ├─ types.ts        Product / Slot / SlotOption / Dish
│  ├─ products.ts     ~190 products, one shared catalogue
│  ├─ menus.ts        the five menus, and which meals serve them
│  └─ dishes/         one file per menu
├─ engine/     pure functions, no React
│  ├─ calories.ts     BMR → TDEE → daily target → meal budgets
│  ├─ cart.ts         option pricing, totals, affordability, swap hints
│  ├─ nutrition.ts    macro split, meal and day grading, coaching lines
│  └─ random.ts       seeded RNG for rolls
├─ state/      one reducer for the whole game (solo is the 1-player case)
├─ screens/    one component per phase
└─ components/ budget bar, product card, macro bar, vote panel
```

### The one idea worth knowing

**A grocery pack is not a serving.** A 500 g jar of sauce is not what you eat.

So a `Product` carries nutrition per some base amount, and each dish declares how
much of that product it *uses*:

```ts
{ id: 'sauce-pinoy', basis: { amount: 100, unit: 'g' }, kcal: 120, pack: '1 kg jar' }
opt('sauce-pinoy', g(180), 'the sweet red one')   // → 216 cal
```

The store shows both numbers side by side, because the gap between them is the
most useful thing the game has to teach.

A consequence: a player's choice keys on the **option id**, not the product id.
A slot routinely offers the same product at two portion sizes — one cup of rice
or two is the same product and a completely different decision.

### Grading

Coming in far under budget is deliberately **not** an A. A game that scored an
empty plate highest would be teaching the wrong thing. Landing near the budget,
with decent protein and something fresh in the cart, is what scores well.

## Adding a dish

1. Make sure every ingredient exists in `src/data/products.ts` (nutrition per
   `basis`, as the product is *sold* — dry pasta, uncooked rice).
2. Add the dish to the right file in `src/data/dishes/`:

```ts
{
  id: 'my-dish', name: 'My dish', menu: 'filipino', emoji: '🍲',
  blurb: 'One line that makes someone want to cook it.',
  slots: [
    {
      id: 'protein', label: 'Meat', prompt: 'What goes in?', optional: false,
      options: [
        opt('chicken-thigh', g(150), 'skin on'),
        opt('chicken-breast', g(150), 'skinless'),
        opt('tofu-firm', g(180), 'vegetarian'),
      ],
    },
    oilSlot(), riceSlot(), drinkSlot(),   // shared slots from ./helpers
  ],
}
```

3. `npm test`. The data-integrity sweep will tell you if a product id doesn't
   resolve, a slot has fewer than two options, the dish can't be built inside the
   smallest budget the game hands out, or the cheapest and priciest builds are too
   close together to pose a real choice.

## Where the numbers come from

Calorie and macro figures are standard composition-table values: USDA
FoodData Central for most items, the Philippine FNRI Food Composition Tables for
Filipino-specific ones (longganisa, tapa, kesong puti, tablea, bagoong).
Packaged goods use typical own-brand label values.

The budget uses the Mifflin-St Jeor equation with the conventional activity
multipliers, and ±500 kcal/day for a weight goal. It's clamped at 1200 (female)
/ 1500 (male) so a weight-loss goal can never produce an unsafe target.

**This is a game, not medical advice.** It's built to make the cost of food
choices *felt* — not to manage a health condition.
