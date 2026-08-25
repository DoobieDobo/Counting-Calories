import type { Dish, Slot } from '../types'
import { drinkSlot, g, ml, oilSlot, opt, pc } from './helpers'

/**
 * The breakfast menu deliberately mixes Filipino silogs with American diner
 * plates, because that is what a breakfast table in a Filipino-American
 * household actually looks like.
 */

/** The "sí" in silog. Same options as dinner rice, different framing. */
function silogRiceSlot(): Slot {
  return {
    id: 'rice',
    label: 'Rice',
    prompt: 'The "sí" in silog. How much?',
    optional: true,
    options: [
      opt('rice-white', g(60), 'one cup cooked'),
      opt('rice-white', g(120), 'two cups cooked'),
      opt('rice-brown', g(60), 'one cup cooked'),
      opt('rice-white', g(30), 'half a cup'),
    ],
  }
}

function coffeeSlot(): Slot {
  return {
    id: 'coffee',
    label: 'Coffee',
    prompt: 'How do you take it?',
    optional: true,
    options: [
      opt('coffee-black', ml(250), 'black, one mug'),
      opt('coffee-3in1', pc(1), 'one sachet'),
      opt('milk-whole', ml(60), 'black, with a splash of milk'),
      opt('milk-skim', ml(60), 'black, with a splash of skim'),
    ],
  }
}

export const BREAKFAST_DISHES: Dish[] = [
  {
    id: 'tapsilog',
    name: 'Tapsilog',
    menu: 'breakfast',
    emoji: '🍳',
    blurb: 'Cured beef, garlic rice, fried egg. The full stop of Filipino breakfasts.',
    slots: [
      {
        id: 'tapa',
        label: 'Tapa',
        prompt: 'How much cured beef?',
        optional: false,
        options: [
          opt('beef-tapa', g(120), 'a full serving'),
          opt('beef-tapa', g(80), 'a smaller serving'),
          opt('beef-sirloin', g(120), 'fresh sirloin, cured yourself'),
        ],
      },
      silogRiceSlot(),
      {
        id: 'egg',
        label: 'Egg',
        prompt: 'Sunny side up, or not at all?',
        optional: true,
        options: [
          opt('egg', pc(1), 'one, fried'),
          opt('egg', pc(2), 'two, fried'),
          opt('egg-white', pc(2), 'whites only'),
        ],
      },
      oilSlot(12),
      {
        id: 'side',
        label: 'On the side',
        prompt: 'Something sharp to cut the fat.',
        optional: true,
        options: [
          opt('vinegar-cane', ml(30), 'sukang may sili'),
          opt('tomato-fresh', g(100), 'one, sliced'),
          opt('banana-ketchup', g(30), 'two tablespoons'),
        ],
      },
      coffeeSlot(),
    ],
  },

  {
    id: 'longsilog',
    name: 'Longsilog',
    menu: 'breakfast',
    emoji: '🌭',
    blurb: 'Sweet garlicky sausage, rice, egg. The one that stains the plate orange.',
    slots: [
      {
        id: 'longganisa',
        label: 'Longganisa',
        prompt: 'How many links?',
        optional: false,
        options: [
          opt('longganisa', g(100), 'three links'),
          opt('longganisa', g(65), 'two links'),
          opt('tocino', g(100), 'tocino instead — tocilog'),
          opt('luncheon-meat', g(80), 'spamsilog'),
        ],
      },
      silogRiceSlot(),
      {
        id: 'egg',
        label: 'Egg',
        prompt: 'The "log" in longsilog.',
        optional: true,
        options: [
          opt('egg', pc(1), 'one, fried'),
          opt('egg', pc(2), 'two, fried'),
          opt('egg-white', pc(2), 'whites only'),
        ],
      },
      oilSlot(10),
      {
        id: 'side',
        label: 'On the side',
        prompt: 'Anything to dip it in?',
        optional: true,
        options: [
          opt('vinegar-cane', ml(30), 'spiced vinegar'),
          opt('banana-ketchup', g(30), 'two tablespoons'),
          opt('tomato-fresh', g(100), 'sliced'),
        ],
      },
      coffeeSlot(),
    ],
  },

  {
    id: 'champorado',
    name: 'Champorado',
    menu: 'breakfast',
    emoji: '🍫',
    blurb: 'Chocolate rice porridge, with salted dried fish on the side. Trust it.',
    slots: [
      {
        id: 'rice',
        label: 'Glutinous rice',
        prompt: 'How big a bowl?',
        optional: false,
        options: [
          opt('rice-glutinous', g(60), 'a normal bowl, dry'),
          opt('rice-glutinous', g(90), 'a big bowl, dry'),
          opt('rice-glutinous', g(40), 'a small bowl, dry'),
        ],
      },
      {
        id: 'chocolate',
        label: 'Chocolate',
        prompt: 'Tablea or cocoa powder?',
        optional: false,
        options: [
          opt('tablea', g(25), 'three discs'),
          opt('cocoa-powder', g(15), 'two tablespoons'),
          opt('tablea', g(15), 'two discs'),
        ],
      },
      {
        id: 'sweet',
        label: 'Sweetener',
        prompt: 'Tablea is bitter on its own.',
        optional: true,
        options: [
          opt('sugar-white', g(20), 'a heaped tablespoon'),
          opt('sugar-white', g(10), 'half that'),
          opt('sweetener', g(1), 'one sachet'),
        ],
      },
      {
        id: 'milk',
        label: 'Milk on top',
        prompt: 'The swirl that goes on last.',
        optional: true,
        options: [
          opt('condensed-milk', g(30), 'two tablespoons'),
          opt('evap-milk', ml(50), 'a good pour'),
          opt('milk-skim', ml(60), 'plain skim'),
        ],
      },
      {
        id: 'tuyo',
        label: 'Tuyo on the side',
        prompt: 'Salted dried fish with chocolate porridge. It works.',
        optional: true,
        options: [
          opt('tuyo', g(30), 'one small fish'),
          opt('tuyo', g(60), 'two'),
        ],
      },
      coffeeSlot(),
    ],
  },

  {
    id: 'pandesal-breakfast',
    name: 'Pandesal & kesong puti',
    menu: 'breakfast',
    emoji: '🥖',
    blurb: 'Warm rolls, white cheese, hot coffee. Nothing else needed.',
    slots: [
      {
        id: 'bread',
        label: 'Pandesal',
        prompt: 'How many rolls?',
        optional: false,
        options: [
          opt('pandesal', pc(2), 'two'),
          opt('pandesal', pc(3), 'three'),
          opt('pandesal', pc(1), 'just the one'),
          opt('bread-wholewheat', pc(2), 'wholewheat toast instead'),
        ],
      },
      {
        id: 'filling',
        label: 'What goes in it',
        prompt: 'Split it open — then what?',
        optional: false,
        options: [
          opt('kesong-puti', g(50), 'a thick slice'),
          opt('cheddar', g(30), 'grated'),
          opt('peanut-butter', g(25), 'a spread'),
          opt('butter', g(12), 'just butter'),
          opt('margarine', g(12), 'just margarine'),
        ],
      },
      {
        id: 'egg',
        label: 'An egg?',
        prompt: 'Something to make it a real meal.',
        optional: true,
        options: [
          opt('egg', pc(1), 'one, fried'),
          opt('egg', pc(2), 'two, scrambled'),
          opt('egg-white', pc(2), 'whites only'),
        ],
      },
      {
        id: 'fruit',
        label: 'Fruit',
        prompt: 'Anything fresh?',
        optional: true,
        options: [
          opt('banana', g(120), 'one'),
          opt('apple', g(150), 'one'),
          opt('berries', g(100), 'a handful'),
        ],
      },
      coffeeSlot(),
    ],
  },

  {
    id: 'pancakes',
    name: 'Pancakes & syrup',
    menu: 'breakfast',
    emoji: '🥞',
    blurb: 'A stack, a pat of butter, and a pour that always goes too far.',
    slots: [
      {
        id: 'batter',
        label: 'Pancake batter',
        prompt: 'How big a stack?',
        optional: false,
        options: [
          opt('pancake-mix', g(80), 'three pancakes'),
          opt('pancake-mix', g(120), 'a tall stack'),
          opt('pancake-mix', g(50), 'two pancakes'),
        ],
      },
      {
        id: 'liquid',
        label: 'Mixed with',
        prompt: 'What goes into the batter?',
        optional: true,
        options: [
          opt('milk-whole', ml(120), 'whole milk'),
          opt('milk-skim', ml(120), 'skim milk'),
          opt('egg', pc(1), 'one egg'),
          opt('water', ml(120), 'just water'),
        ],
      },
      {
        id: 'syrup',
        label: 'Syrup',
        prompt: 'The pour. This is where breakfast usually goes wrong.',
        optional: true,
        options: [
          opt('pancake-syrup', g(60), 'a generous pour'),
          opt('pancake-syrup', g(25), 'a restrained pour'),
          opt('maple-syrup', g(30), 'the real stuff'),
          opt('syrup-sugarfree', g(60), 'sugar-free'),
          opt('honey', g(25), 'honey instead'),
        ],
      },
      {
        id: 'topping',
        label: 'On top',
        prompt: 'Anything else on the stack?',
        optional: true,
        options: [
          opt('butter', g(10), 'a pat'),
          opt('berries', g(100), 'a handful'),
          opt('banana', g(100), 'sliced'),
          opt('yogurt-greek', g(80), 'a spoonful'),
        ],
      },
      {
        id: 'side',
        label: 'On the side',
        prompt: 'Making it a diner plate?',
        optional: true,
        options: [
          opt('bacon', g(40), 'two rashers'),
          opt('turkey-bacon', g(40), 'two rashers'),
          opt('egg', pc(2), 'two, scrambled'),
        ],
      },
      coffeeSlot(),
    ],
  },

  {
    id: 'bacon-and-eggs',
    name: 'Bacon & eggs',
    menu: 'breakfast',
    emoji: '🥓',
    blurb: 'The plate every diner in America can make in its sleep.',
    slots: [
      {
        id: 'eggs',
        label: 'Eggs',
        prompt: 'How many, and how?',
        optional: false,
        options: [
          opt('egg', pc(2), 'two, any style'),
          opt('egg', pc(3), 'three'),
          opt('egg', pc(1), 'just one'),
          opt('egg-white', pc(4), 'four whites'),
        ],
      },
      {
        id: 'bacon',
        label: 'Bacon',
        prompt: 'How many rashers?',
        optional: false,
        options: [
          opt('bacon', g(60), 'three rashers'),
          opt('bacon', g(40), 'two rashers'),
          opt('turkey-bacon', g(60), 'turkey bacon, three'),
          opt('longganisa', g(65), 'sausage instead'),
        ],
      },
      {
        id: 'toast',
        label: 'Toast',
        prompt: 'Something to mop the yolk.',
        optional: true,
        options: [
          opt('bread-white', pc(2), 'two slices'),
          opt('bread-wholewheat', pc(2), 'two slices'),
          opt('pandesal', pc(2), 'two rolls'),
          opt('hash-brown', pc(1), 'a hash brown instead'),
        ],
      },
      {
        id: 'spread',
        label: 'On the toast',
        prompt: 'Butter it?',
        optional: true,
        options: [
          opt('butter', g(12), 'a pat'),
          opt('margarine', g(12), 'a pat'),
          opt('avocado', g(60), 'smashed avocado'),
        ],
      },
      oilSlot(8),
      {
        id: 'juice',
        label: 'Juice',
        prompt: 'The glass on the side.',
        optional: true,
        options: [
          opt('orange-juice', ml(250), 'a full glass'),
          opt('orange-juice', ml(125), 'a small glass'),
          opt('water', ml(330), 'water instead'),
        ],
      },
      coffeeSlot(),
    ],
  },

  {
    id: 'oatmeal-bowl',
    name: 'Oatmeal bowl',
    menu: 'breakfast',
    emoji: '🥣',
    blurb: 'Cheap, filling, and entirely defined by what you put on it.',
    slots: [
      {
        id: 'oats',
        label: 'Oats',
        prompt: 'Rolled or the instant sachets?',
        optional: false,
        options: [
          opt('oats-rolled', g(50), 'half a cup, dry'),
          opt('oats-rolled', g(80), 'a big bowl, dry'),
          opt('oats-instant-sweet', g(40), 'one flavoured sachet'),
          opt('cornflakes', g(40), 'cornflakes instead'),
        ],
      },
      {
        id: 'liquid',
        label: 'Cooked in',
        prompt: 'Water, or something richer?',
        optional: true,
        options: [
          opt('water', ml(250), 'water'),
          opt('milk-skim', ml(200), 'skim milk'),
          opt('milk-whole', ml(200), 'whole milk'),
          opt('soy-milk', ml(200), 'soy milk'),
        ],
      },
      {
        id: 'fruit',
        label: 'Fruit',
        prompt: 'What goes on top?',
        optional: true,
        options: [
          opt('banana', g(120), 'one, sliced'),
          opt('berries', g(100), 'a handful'),
          opt('apple', g(120), 'diced'),
          opt('raisins', g(30), 'a scattering'),
        ],
      },
      {
        id: 'sweet',
        label: 'Sweetener',
        prompt: 'Plain oats need something.',
        optional: true,
        options: [
          opt('honey', g(20), 'a drizzle'),
          opt('sugar-brown', g(15), 'a spoonful'),
          opt('maple-syrup', g(20), 'a drizzle'),
          opt('sweetener', g(1), 'one sachet'),
        ],
      },
      {
        id: 'extra',
        label: 'Something rich',
        prompt: 'The thing that makes it stick.',
        optional: true,
        options: [
          opt('peanut-butter', g(25), 'a spoonful'),
          opt('almonds', g(20), 'a small handful'),
          opt('yogurt-greek', g(100), 'a dollop'),
          opt('coconut-shredded', g(15), 'a sprinkle'),
        ],
      },
      coffeeSlot(),
    ],
  },

  {
    id: 'breakfast-burrito',
    name: 'Breakfast burrito',
    menu: 'breakfast',
    emoji: '🌯',
    blurb: 'Everything on the diner plate, rolled up and eaten one-handed.',
    slots: [
      {
        id: 'wrap',
        label: 'Tortilla',
        prompt: 'What are you wrapping it in?',
        optional: false,
        options: [
          opt('tortilla-flour', pc(1), 'one large'),
          opt('tortilla-wholewheat', pc(1), 'one large'),
          opt('tortilla-flour', pc(2), 'two — it is a big burrito'),
        ],
      },
      {
        id: 'egg',
        label: 'Eggs',
        prompt: 'Scrambled, and how many?',
        optional: false,
        options: [
          opt('egg', pc(2), 'two'),
          opt('egg', pc(3), 'three'),
          opt('egg-white', pc(4), 'four whites'),
        ],
      },
      {
        id: 'meat',
        label: 'Meat',
        prompt: 'What else goes in?',
        optional: true,
        options: [
          opt('bacon', g(40), 'two rashers, chopped'),
          opt('turkey-bacon', g(40), 'two rashers'),
          opt('longganisa', g(60), 'sausage, crumbled'),
          opt('luncheon-meat', g(60), 'diced and crisped'),
        ],
      },
      {
        id: 'starch',
        label: 'Potato',
        prompt: 'Hash brown inside the burrito?',
        optional: true,
        options: [
          opt('hash-brown', pc(1), 'one, chopped in'),
          opt('potato', g(120), 'home fries'),
        ],
      },
      {
        id: 'cheese',
        label: 'Cheese',
        prompt: 'How much cheese?',
        optional: true,
        options: [
          opt('cheddar', g(30), 'a good handful'),
          opt('cheese-slice', pc(1), 'one slice'),
          opt('cheddar', g(15), 'just a little'),
        ],
      },
      {
        id: 'salsa',
        label: 'Salsa & extras',
        prompt: 'Anything fresh in there?',
        optional: true,
        options: [
          opt('salsa', g(50), 'two tablespoons'),
          opt('avocado', g(60), 'a third of one'),
          opt('sriracha', g(15), 'a squeeze'),
          opt('bell-pepper', g(60), 'diced'),
        ],
      },
      oilSlot(8),
      drinkSlot(),
    ],
  },
]
