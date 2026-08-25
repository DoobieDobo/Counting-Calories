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

**On a phone, with nothing installed:** build the single file and open it.

```sh
npm install
npm run build:standalone     # → dist/standalone.html
```

`dist/standalone.html` is the entire game in one 347 KB file. Put it anywhere — a
phone's Downloads folder, a USB stick, an email attachment — and open it in a
browser. It runs offline and saves your progress.

**Permanent URL:** <https://doobiedobo.github.io/Counting-Calories/> — live, and
rebuilt by `.github/workflows/deploy.yml` on every push to `main`.

Deploys come from `main` alone. Turning Pages on creates a `github-pages`
environment whose deployment-branch policy admits the default branch and nothing
else, so a deploy job on any other branch is refused before it starts — two
seconds, no steps, no log. Feature branches still get CI; they just do not
publish.

**Locally, for development:**

```sh
npm run dev
```

> There's also a short explainer page at
> [claude.ai/code/artifact/bc528df3…](https://claude.ai/code/artifact/bc528df3-e281-4bed-908a-f4eb35d599dc)
> describing the game and these routes. It is *not* the game — that host truncates
> page content at roughly 36 KB, and the game is eight times that, so a published
> build renders blank.

---

## Playing

- **A run is three days** — breakfast, lunch and dinner each day. Each meal draws
  its share of that day's budget, and anything you don't spend carries over to
  the next meal.
- **Day three ends in a meal plan**, with a shopping list for the whole run:
  every ingredient, totalled, with a per-player breakdown you can expand when
  more than one of you is eating. Finished runs are kept — reach them from
  ☰ Game menu → Saved rounds.
- **Five menus**: Breakfast (Filipino silogs and American diner plates),
  Filipino, American, Arabic, Chinese. Thirty-nine dishes.
- **Roll** if you don't want to choose — for the menu, the dish, or a single
  ingredient.
- **Leave anything out.** Skipping the meat to save calories is a legitimate and
  instructive move, so the game warns rather than blocks.
- **Checkout refuses an over-budget cart**, but never just says no: it names the
  single biggest swap available and how much it saves.
- **Tell it what to flag** — seventeen concerns, opt-in: gout (purines), halal,
  vegetarian, vegan, caffeine, the major allergens (peanuts, tree nuts,
  shellfish, fish, milk, egg, soy, gluten, sesame) and the intolerances
  (lactose, fructose, FODMAPs). Turn any of them on and affected products carry
  a tag on the shelf, in the vote panel and at checkout. It labels; it does not
  hide.
- **Night mode** is in ☰ Game menu, and follows the phone's own setting until you
  say otherwise.
- **Co-op**, two to six players on one screen. Budgets pool into one pot and
  portions are shared out in proportion to each player's own target, so the
  bigger eater gets the bigger plate. The picker rotates each ingredient —
  everyone discusses, one person commits. The rotation carries *across* meals
  rather than restarting, which is what makes the fairness guarantee hold: six
  players cannot each get two turns inside one meal — the largest dish has eight
  slots — but everyone gets at least two over a day, for every dish combination
  the game can deal.

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
folds into one self-contained file. `scripts/inline-build.mjs` writes
`dist/standalone.html`: a complete document, ~347 KB. Open it straight from disk,
email it, drop it on any static host. It runs offline and keeps your progress in
the browser it was opened in.

## How it's put together

```
src/
├─ data/       the shelves and the recipes
│  ├─ types.ts        Product / Slot / SlotOption / Dish
│  ├─ products.ts     218 products, one shared catalogue
│  ├─ menus.ts        the five menus, and which meals serve them
│  └─ dishes/         one file per menu
├─ engine/     pure functions, no React
│  ├─ calories.ts     BMR → TDEE → daily target → meal budgets
│  ├─ cart.ts         option pricing, totals, affordability, swap hints
│  ├─ nutrition.ts    macro split, meal and day grading, coaching lines
│  ├─ shopping.ts     three days of meals → one aisle-sorted shopping list
│  ├─ split.ts        largest-remainder apportionment, shared by cals and grams
│  ├─ suggest.ts      what to try next, read off the run just played
│  └─ random.ts       seeded RNG for rolls
├─ state/      one reducer for the whole game (solo is the 1-player case)
│  ├─ persistence.ts  the run in progress
│  ├─ rounds.ts       finished runs, on their own key so a bump cannot bin them
│  ├─ session.ts      when you were last here, for the welcome-back screen
│  └─ theme.ts        light / dark / system
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
multipliers. What the goal does to that number is deliberately *not* the
conventional flat ±500.

**The pace is sized to the person:** `min(500, 20% of maintenance)`. A flat 500 is
19% of a 2,600-calorie day and 34% of a 1,450-calorie one — the same subtraction
means something very different depending on whose body it lands on, and the flat
version pushed roughly half of sedentary players wanting to lose weight straight
through the safety floor. So a 2,600-calorie day still gets the full 500, and a
1,450-calorie one gets 290.

**The floor knows which way is dangerous.** `CALORIE_FLOOR` is 1,200 (female) /
1,500 (male), but the guard applied depends on where the player's BMI sits:

- **Underweight** — the floor can only push the target *up*. A weight-loss goal
  from here is never given a deficit, and the game says why.
- **Anywhere else** — the floor can only push the target *down* to maintenance,
  never above it. Someone whose maintenance is genuinely below 1,200 and who asks
  to maintain gets their maintenance, not 1,200. The old clamp handed them a
  surplus from the guard that exists to prevent bad advice.

So a target below 1,200 is possible, and when it happens it is the honest answer
rather than a failure of the clamp. What the game will not do is turn a request
to lose or maintain into a gain.

Where the goal *was* eased — by the floor or by the 20% cap — the budget screen
says so in plain words rather than quietly serving a different plan: that you may
already be at a healthy weight, that losing more may not be wise, or that
maintenance is already as low as the game will set a target.

**This is a game, not medical advice.** It's built to make the cost of food
choices *felt* — not to manage a health condition.
