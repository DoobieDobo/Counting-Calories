/**
 * The shelves.
 *
 * One shared catalogue so that onions, cooking oil and rice are authored once
 * and reused by every dish that needs them. Dishes reference products by id and
 * declare how much they use; see `data/types.ts` for why those are separate.
 *
 * Calorie and macro figures are per `basis` and come from standard composition
 * tables — USDA FoodData Central for most items, the Philippine FNRI Food
 * Composition Tables for Filipino-specific ones (longganisa, tapa, kesong puti,
 * tablea, bagoong). Packaged goods use typical own-brand label values. They are
 * rounded to the precision a nutrition label would print, which is the right
 * precision for a game: close enough to teach, not pretending to be clinical.
 *
 * Products are listed as sold — dry pasta, uncooked rice — because that is what
 * you actually put in a trolley. Recipes account for the cooked yield.
 */

import type { Product, Qty } from './types'

const PER_100G: Qty = { amount: 100, unit: 'g' }
const PER_100ML: Qty = { amount: 100, unit: 'ml' }
const EACH: Qty = { amount: 1, unit: 'piece' }

export const PRODUCTS: Product[] = [
  // ── Produce ────────────────────────────────────────────────────────────────
  {
    id: 'tomato-fresh', name: 'Fresh tomatoes', emoji: '🍅', category: 'produce',
    basis: PER_100G, kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2,
    pack: '500 g pack', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'tomato-cherry', name: 'Cherry tomatoes', emoji: '🍅', category: 'produce',
    basis: PER_100G, kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2,
    pack: '250 g punnet', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'onion', name: 'Red onion', emoji: '🧅', category: 'produce',
    basis: PER_100G, kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1,
    pack: '1 kg bag', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'garlic', name: 'Garlic', emoji: '🧄', category: 'produce',
    basis: PER_100G, kcal: 149, protein: 6.4, carbs: 33, fat: 0.5,
    pack: '3 heads', tags: ['fresh', 'vegan'],
  },
  {
    id: 'ginger', name: 'Fresh ginger', emoji: '🫚', category: 'produce',
    basis: PER_100G, kcal: 80, protein: 1.8, carbs: 18, fat: 0.8,
    pack: '150 g', tags: ['fresh', 'vegan'],
  },
  {
    id: 'scallion', name: 'Spring onions', emoji: '🌿', category: 'produce',
    basis: PER_100G, kcal: 32, protein: 1.8, carbs: 7.3, fat: 0.2,
    pack: '1 bunch', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'carrot', name: 'Carrots', emoji: '🥕', category: 'produce',
    basis: PER_100G, kcal: 41, protein: 0.9, carbs: 9.6, fat: 0.2,
    pack: '1 kg bag', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'potato', name: 'Potatoes', emoji: '🥔', category: 'produce',
    basis: PER_100G, kcal: 77, protein: 2, carbs: 17, fat: 0.1,
    pack: '2 kg bag', tags: ['fresh', 'vegan'],
  },
  {
    id: 'cabbage', name: 'Cabbage', emoji: '🥬', category: 'produce',
    basis: PER_100G, kcal: 25, protein: 1.3, carbs: 5.8, fat: 0.1,
    pack: '1 head', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'napa-cabbage', name: 'Napa cabbage', emoji: '🥬', category: 'produce',
    basis: PER_100G, kcal: 16, protein: 1.2, carbs: 3.2, fat: 0.2,
    pack: '1 head', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'pechay', name: 'Pechay (bok choy)', emoji: '🥬', category: 'produce',
    basis: PER_100G, kcal: 13, protein: 1.5, carbs: 2.2, fat: 0.2,
    pack: '1 bunch', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'kangkong', name: 'Kangkong (water spinach)', emoji: '🥬', category: 'produce',
    basis: PER_100G, kcal: 19, protein: 2.6, carbs: 3.1, fat: 0.2,
    pack: '1 bunch', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'spinach', name: 'Spinach', emoji: '🥬', category: 'produce',
    basis: PER_100G, kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4,
    pack: '200 g bag', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'lettuce-romaine', name: 'Romaine lettuce', emoji: '🥬', category: 'produce',
    basis: PER_100G, kcal: 17, protein: 1.2, carbs: 3.3, fat: 0.3,
    pack: '2 hearts', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'sitaw', name: 'String beans (sitaw)', emoji: '🫛', category: 'produce',
    basis: PER_100G, kcal: 47, protein: 2.8, carbs: 8, fat: 0.4,
    pack: '1 bundle', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'green-beans', name: 'Green beans', emoji: '🫛', category: 'produce',
    basis: PER_100G, kcal: 31, protein: 1.8, carbs: 7, fat: 0.1,
    pack: '300 g pack', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'eggplant', name: 'Eggplant', emoji: '🍆', category: 'produce',
    basis: PER_100G, kcal: 25, protein: 1, carbs: 5.9, fat: 0.2,
    pack: '3 pieces', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'okra', name: 'Okra', emoji: '🌿', category: 'produce',
    basis: PER_100G, kcal: 33, protein: 1.9, carbs: 7, fat: 0.2,
    pack: '250 g pack', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'ampalaya', name: 'Bitter melon (ampalaya)', emoji: '🥒', category: 'produce',
    basis: PER_100G, kcal: 17, protein: 1, carbs: 3.7, fat: 0.2,
    pack: '2 pieces', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'labanos', name: 'Radish (labanos)', emoji: '🥬', category: 'produce',
    basis: PER_100G, kcal: 16, protein: 0.7, carbs: 3.4, fat: 0.1,
    pack: '2 pieces', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'kalabasa', name: 'Squash (kalabasa)', emoji: '🎃', category: 'produce',
    basis: PER_100G, kcal: 26, protein: 1, carbs: 6.5, fat: 0.1,
    pack: '1 kg wedge', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'gabi', name: 'Taro (gabi)', emoji: '🥔', category: 'produce',
    basis: PER_100G, kcal: 112, protein: 1.5, carbs: 26, fat: 0.2,
    pack: '500 g', tags: ['fresh', 'vegan'],
  },
  {
    id: 'broccoli', name: 'Broccoli', emoji: '🥦', category: 'produce',
    basis: PER_100G, kcal: 34, protein: 2.8, carbs: 7, fat: 0.4,
    pack: '1 head', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'cauliflower', name: 'Cauliflower', emoji: '🥦', category: 'produce',
    basis: PER_100G, kcal: 25, protein: 1.9, carbs: 5, fat: 0.3,
    pack: '1 head', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'bell-pepper', name: 'Bell pepper', emoji: '🫑', category: 'produce',
    basis: PER_100G, kcal: 26, protein: 1, carbs: 6, fat: 0.3,
    pack: '3 pieces', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'chili-labuyo', name: "Bird's eye chili (labuyo)", emoji: '🌶️', category: 'produce',
    basis: PER_100G, kcal: 40, protein: 1.9, carbs: 8.8, fat: 0.4,
    pack: '50 g', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'chili-haba', name: 'Long green chili (siling haba)', emoji: '🌶️', category: 'produce',
    basis: PER_100G, kcal: 40, protein: 2, carbs: 9, fat: 0.2,
    pack: '100 g', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'cucumber', name: 'Cucumber', emoji: '🥒', category: 'produce',
    basis: PER_100G, kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1,
    pack: '2 pieces', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'zucchini', name: 'Zucchini', emoji: '🥒', category: 'produce',
    basis: PER_100G, kcal: 17, protein: 1.2, carbs: 3.1, fat: 0.3,
    pack: '2 pieces', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'celery', name: 'Celery', emoji: '🥬', category: 'produce',
    basis: PER_100G, kcal: 16, protein: 0.7, carbs: 3, fat: 0.2,
    pack: '1 bunch', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'mushroom', name: 'Button mushrooms', emoji: '🍄', category: 'produce',
    basis: PER_100G, kcal: 22, protein: 3.1, carbs: 3.3, fat: 0.3,
    pack: '250 g punnet', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'bean-sprouts', name: 'Bean sprouts (togue)', emoji: '🌱', category: 'produce',
    basis: PER_100G, kcal: 30, protein: 3, carbs: 6, fat: 0.2,
    pack: '250 g bag', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'snow-peas', name: 'Snow peas (chicharo)', emoji: '🫛', category: 'produce',
    basis: PER_100G, kcal: 42, protein: 2.8, carbs: 7.6, fat: 0.2,
    pack: '200 g pack', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'corn-kernels', name: 'Sweetcorn kernels', emoji: '🌽', category: 'produce',
    basis: PER_100G, kcal: 86, protein: 3.2, carbs: 19, fat: 1.2,
    pack: '400 g can', tags: ['canned', 'vegan'],
  },
  {
    id: 'parsley', name: 'Flat-leaf parsley', emoji: '🌿', category: 'produce',
    basis: PER_100G, kcal: 36, protein: 3, carbs: 6.3, fat: 0.8,
    pack: '2 bunches', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'mint', name: 'Fresh mint', emoji: '🌿', category: 'produce',
    basis: PER_100G, kcal: 70, protein: 3.8, carbs: 15, fat: 0.9,
    pack: '1 bunch', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'cilantro', name: 'Coriander (cilantro)', emoji: '🌿', category: 'produce',
    basis: PER_100G, kcal: 23, protein: 2.1, carbs: 3.7, fat: 0.5,
    pack: '1 bunch', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'lemon', name: 'Lemon', emoji: '🍋', category: 'produce',
    basis: PER_100G, kcal: 29, protein: 1.1, carbs: 9, fat: 0.3,
    pack: '4 pieces', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'calamansi', name: 'Calamansi', emoji: '🍋', category: 'produce',
    basis: PER_100G, kcal: 30, protein: 0.9, carbs: 9, fat: 0.2,
    pack: '250 g bag', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'banana-saba', name: 'Saba banana', emoji: '🍌', category: 'produce',
    basis: PER_100G, kcal: 105, protein: 1.1, carbs: 27, fat: 0.2,
    pack: '1 bunch', tags: ['fresh', 'vegan'],
  },
  {
    id: 'banana', name: 'Banana', emoji: '🍌', category: 'produce',
    basis: PER_100G, kcal: 89, protein: 1.1, carbs: 23, fat: 0.3,
    pack: '1 bunch', tags: ['fresh', 'vegan'],
  },
  {
    id: 'berries', name: 'Mixed berries', emoji: '🫐', category: 'produce',
    basis: PER_100G, kcal: 43, protein: 1, carbs: 10, fat: 0.4,
    pack: '300 g pack', tags: ['frozen', 'vegan', 'lowcal'],
  },
  {
    id: 'apple', name: 'Apple', emoji: '🍎', category: 'produce',
    basis: PER_100G, kcal: 52, protein: 0.3, carbs: 14, fat: 0.2,
    pack: '6 pieces', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'pineapple-chunks', name: 'Pineapple chunks', emoji: '🍍', category: 'produce',
    basis: PER_100G, kcal: 50, protein: 0.5, carbs: 13, fat: 0.1,
    pack: '400 g can', tags: ['canned', 'vegan'],
  },
  {
    id: 'avocado', name: 'Avocado', emoji: '🥑', category: 'produce',
    basis: PER_100G, kcal: 160, protein: 2, carbs: 8.5, fat: 14.7,
    pack: '2 pieces', tags: ['fresh', 'vegan', 'fatty'],
  },

  // ── Protein ────────────────────────────────────────────────────────────────
  {
    id: 'chicken-breast', name: 'Chicken breast, skinless', emoji: '🍗', category: 'protein',
    basis: PER_100G, kcal: 165, protein: 31, carbs: 0, fat: 3.6,
    pack: '500 g tray', tags: ['fresh', 'lean'],
  },
  {
    id: 'chicken-thigh', name: 'Chicken thigh, skin on', emoji: '🍗', category: 'protein',
    basis: PER_100G, kcal: 229, protein: 25, carbs: 0, fat: 15.5,
    pack: '600 g tray', tags: ['fresh', 'fatty'],
  },
  {
    id: 'chicken-drumstick', name: 'Chicken drumsticks', emoji: '🍗', category: 'protein',
    basis: PER_100G, kcal: 216, protein: 24, carbs: 0, fat: 13,
    pack: '700 g tray', tags: ['fresh'],
  },
  {
    id: 'chicken-wings', name: 'Chicken wings', emoji: '🍗', category: 'protein',
    basis: PER_100G, kcal: 203, protein: 30, carbs: 0, fat: 8.1,
    pack: '1 kg bag', tags: ['fresh'],
  },
  {
    id: 'pork-belly', name: 'Pork belly (liempo)', emoji: '🥓', category: 'protein',
    basis: PER_100G, kcal: 518, protein: 9.3, carbs: 0, fat: 53,
    pack: '500 g slab', tags: ['fresh', 'fatty'],
  },
  {
    id: 'pork-shoulder', name: 'Pork shoulder (kasim)', emoji: '🍖', category: 'protein',
    basis: PER_100G, kcal: 217, protein: 17, carbs: 0, fat: 16,
    pack: '500 g', tags: ['fresh'],
  },
  {
    id: 'pork-loin', name: 'Pork loin, trimmed', emoji: '🍖', category: 'protein',
    basis: PER_100G, kcal: 143, protein: 21, carbs: 0, fat: 5.9,
    pack: '500 g', tags: ['fresh', 'lean'],
  },
  {
    id: 'ground-pork', name: 'Ground pork', emoji: '🥩', category: 'protein',
    basis: PER_100G, kcal: 263, protein: 17, carbs: 0, fat: 21,
    pack: '500 g pack', tags: ['fresh', 'fatty'],
  },
  {
    id: 'ground-beef-regular', name: 'Ground beef, 80/20', emoji: '🥩', category: 'protein',
    basis: PER_100G, kcal: 254, protein: 17, carbs: 0, fat: 20,
    pack: '500 g pack', tags: ['fresh', 'fatty'],
  },
  {
    id: 'ground-beef-lean', name: 'Ground beef, 93/7 lean', emoji: '🥩', category: 'protein',
    basis: PER_100G, kcal: 152, protein: 21, carbs: 0, fat: 7,
    pack: '500 g pack', tags: ['fresh', 'lean'],
  },
  {
    id: 'ground-turkey', name: 'Ground turkey', emoji: '🦃', category: 'protein',
    basis: PER_100G, kcal: 148, protein: 20, carbs: 0, fat: 7.7,
    pack: '500 g pack', tags: ['fresh', 'lean'],
  },
  {
    id: 'beef-sirloin', name: 'Beef sirloin', emoji: '🥩', category: 'protein',
    basis: PER_100G, kcal: 201, protein: 21, carbs: 0, fat: 12,
    pack: '400 g', tags: ['fresh'],
  },
  {
    id: 'beef-chuck', name: 'Beef chuck, cubed', emoji: '🥩', category: 'protein',
    basis: PER_100G, kcal: 250, protein: 19, carbs: 0, fat: 19,
    pack: '500 g', tags: ['fresh', 'fatty'],
  },
  {
    id: 'oxtail', name: 'Oxtail', emoji: '🍖', category: 'protein',
    basis: PER_100G, kcal: 262, protein: 19, carbs: 0, fat: 20,
    pack: '800 g', tags: ['fresh', 'fatty'],
  },
  {
    id: 'beef-shank', name: 'Beef shank', emoji: '🍖', category: 'protein',
    basis: PER_100G, kcal: 180, protein: 21, carbs: 0, fat: 10,
    pack: '600 g', tags: ['fresh'],
  },
  {
    id: 'bacon', name: 'Streaky bacon', emoji: '🥓', category: 'protein',
    basis: PER_100G, kcal: 541, protein: 37, carbs: 1.4, fat: 42,
    pack: '250 g pack', tags: ['processed', 'fatty'],
  },
  {
    id: 'turkey-bacon', name: 'Turkey bacon', emoji: '🥓', category: 'protein',
    basis: PER_100G, kcal: 226, protein: 29, carbs: 3, fat: 10,
    pack: '250 g pack', tags: ['processed', 'lean'],
  },
  {
    id: 'longganisa', name: 'Longganisa (sweet)', emoji: '🌭', category: 'protein',
    basis: PER_100G, kcal: 380, protein: 14, carbs: 12, fat: 31,
    pack: '10 pieces', tags: ['processed', 'fatty', 'sweetened'],
  },
  {
    id: 'tocino', name: 'Pork tocino', emoji: '🍖', category: 'protein',
    basis: PER_100G, kcal: 280, protein: 15, carbs: 20, fat: 15,
    pack: '400 g pack', tags: ['processed', 'sweetened'],
  },
  {
    id: 'beef-tapa', name: 'Beef tapa (cured)', emoji: '🥩', category: 'protein',
    basis: PER_100G, kcal: 220, protein: 24, carbs: 6, fat: 11,
    pack: '300 g pack', tags: ['processed'],
  },
  {
    id: 'luncheon-meat', name: 'Luncheon meat', emoji: '🥫', category: 'protein',
    basis: PER_100G, kcal: 315, protein: 13, carbs: 4.6, fat: 27,
    pack: '340 g can', tags: ['canned', 'processed', 'fatty'],
  },
  {
    id: 'hotdog', name: 'Red hotdogs', emoji: '🌭', category: 'protein',
    basis: PER_100G, kcal: 290, protein: 11, carbs: 8, fat: 24,
    pack: '500 g pack', tags: ['processed', 'fatty'],
  },
  {
    id: 'egg', name: 'Egg, large', emoji: '🥚', category: 'protein',
    basis: EACH, kcal: 72, protein: 6.3, carbs: 0.4, fat: 4.8,
    pack: 'Tray of 12', tags: ['fresh'],
  },
  {
    id: 'egg-white', name: 'Egg white', emoji: '🥚', category: 'protein',
    basis: EACH, kcal: 17, protein: 3.6, carbs: 0.2, fat: 0.1,
    pack: 'Tray of 12', tags: ['fresh', 'lean', 'lowcal'],
  },
  {
    id: 'tofu-firm', name: 'Firm tofu', emoji: '🧊', category: 'protein',
    basis: PER_100G, kcal: 144, protein: 17, carbs: 3, fat: 9,
    pack: '400 g block', tags: ['fresh', 'vegan', 'vegetarian'],
  },
  {
    id: 'tofu-fried', name: 'Fried tofu cubes', emoji: '🟨', category: 'protein',
    basis: PER_100G, kcal: 271, protein: 17, carbs: 10, fat: 20,
    pack: '300 g pack', tags: ['fried', 'vegetarian', 'vegan', 'fatty'],
  },
  {
    id: 'shrimp', name: 'Shrimp, peeled', emoji: '🍤', category: 'protein',
    basis: PER_100G, kcal: 99, protein: 24, carbs: 0.2, fat: 0.3,
    pack: '400 g bag', tags: ['frozen', 'lean'],
  },
  {
    id: 'tilapia', name: 'Tilapia fillet', emoji: '🐟', category: 'protein',
    basis: PER_100G, kcal: 96, protein: 20, carbs: 0, fat: 1.7,
    pack: '400 g', tags: ['fresh', 'lean'],
  },
  {
    id: 'bangus', name: 'Bangus (milkfish)', emoji: '🐟', category: 'protein',
    basis: PER_100G, kcal: 148, protein: 20, carbs: 0, fat: 6.7,
    pack: '2 pieces', tags: ['fresh'],
  },
  {
    id: 'salmon', name: 'Salmon fillet', emoji: '🐟', category: 'protein',
    basis: PER_100G, kcal: 208, protein: 20, carbs: 0, fat: 13,
    pack: '300 g', tags: ['fresh', 'fatty'],
  },
  {
    id: 'tuna-water', name: 'Canned tuna in water', emoji: '🥫', category: 'protein',
    basis: PER_100G, kcal: 116, protein: 26, carbs: 0, fat: 0.8,
    pack: '185 g can', tags: ['canned', 'lean'],
  },
  {
    id: 'tuna-oil', name: 'Canned tuna in oil', emoji: '🥫', category: 'protein',
    basis: PER_100G, kcal: 198, protein: 29, carbs: 0, fat: 8,
    pack: '185 g can', tags: ['canned', 'fatty'],
  },
  {
    id: 'chickpeas', name: 'Chickpeas', emoji: '🫘', category: 'protein',
    basis: PER_100G, kcal: 139, protein: 7.1, carbs: 22, fat: 2.6,
    pack: '400 g can', tags: ['canned', 'vegan', 'vegetarian'],
  },
  {
    id: 'chickpeas-dried', name: 'Dried chickpeas', emoji: '🫘', category: 'protein',
    basis: PER_100G, kcal: 364, protein: 19, carbs: 61, fat: 6,
    pack: '500 g bag', tags: ['dried', 'vegan', 'vegetarian'],
  },
  {
    id: 'monggo', name: 'Dried mung beans (monggo)', emoji: '🫘', category: 'protein',
    basis: PER_100G, kcal: 347, protein: 24, carbs: 63, fat: 1.2,
    pack: '500 g bag', tags: ['dried', 'vegan', 'vegetarian'],
  },
  {
    id: 'lentils', name: 'Dried brown lentils', emoji: '🫘', category: 'protein',
    basis: PER_100G, kcal: 353, protein: 25, carbs: 60, fat: 1.1,
    pack: '500 g bag', tags: ['dried', 'vegan', 'vegetarian'],
  },
  {
    id: 'kidney-beans', name: 'Red kidney beans', emoji: '🫘', category: 'protein',
    basis: PER_100G, kcal: 127, protein: 8.7, carbs: 23, fat: 0.5,
    pack: '400 g can', tags: ['canned', 'vegan', 'vegetarian'],
  },
  {
    id: 'falafel', name: 'Frozen falafel balls', emoji: '🧆', category: 'protein',
    basis: EACH, kcal: 57, protein: 2.3, carbs: 5.4, fat: 3.1,
    pack: 'Bag of 20', tags: ['frozen', 'fried', 'vegan', 'vegetarian'],
  },
  {
    id: 'tuyo', name: 'Tuyo (dried salted fish)', emoji: '🐟', category: 'protein',
    basis: PER_100G, kcal: 335, protein: 47, carbs: 0, fat: 16,
    pack: '200 g pack', tags: ['dried', 'processed'],
  },

  // ── Grains & bread ─────────────────────────────────────────────────────────
  {
    id: 'spaghetti-dry', name: 'Spaghetti', emoji: '🍝', category: 'grain',
    basis: PER_100G, kcal: 371, protein: 13, carbs: 75, fat: 1.5,
    pack: '500 g pack', tags: ['dried', 'refined', 'vegan'],
  },
  {
    id: 'spaghetti-wholewheat', name: 'Wholewheat spaghetti', emoji: '🍝', category: 'grain',
    basis: PER_100G, kcal: 348, protein: 15, carbs: 72, fat: 2.5,
    pack: '500 g pack', tags: ['dried', 'wholegrain', 'vegan'],
  },
  {
    id: 'macaroni', name: 'Elbow macaroni', emoji: '🍝', category: 'grain',
    basis: PER_100G, kcal: 371, protein: 13, carbs: 75, fat: 1.5,
    pack: '500 g pack', tags: ['dried', 'refined', 'vegan'],
  },
  {
    id: 'rice-white', name: 'White rice', emoji: '🍚', category: 'grain',
    basis: PER_100G, kcal: 360, protein: 6.6, carbs: 79, fat: 0.6,
    pack: '5 kg sack', tags: ['dried', 'refined', 'vegan'],
  },
  {
    id: 'rice-brown', name: 'Brown rice', emoji: '🍚', category: 'grain',
    basis: PER_100G, kcal: 370, protein: 7.9, carbs: 77, fat: 2.9,
    pack: '2 kg bag', tags: ['dried', 'wholegrain', 'vegan'],
  },
  {
    id: 'rice-glutinous', name: 'Glutinous rice (malagkit)', emoji: '🍚', category: 'grain',
    basis: PER_100G, kcal: 370, protein: 6.8, carbs: 82, fat: 0.6,
    pack: '1 kg bag', tags: ['dried', 'refined', 'vegan'],
  },
  {
    id: 'pandesal', name: 'Pandesal', emoji: '🥖', category: 'grain',
    basis: EACH, kcal: 110, protein: 3, carbs: 21, fat: 1.5,
    pack: 'Bag of 10', tags: ['refined', 'vegetarian'],
  },
  {
    id: 'bread-white', name: 'White bread', emoji: '🍞', category: 'grain',
    basis: EACH, kcal: 75, protein: 2.6, carbs: 14, fat: 1,
    pack: 'Loaf, 20 slices', tags: ['refined', 'vegetarian'],
  },
  {
    id: 'bread-wholewheat', name: 'Wholewheat bread', emoji: '🍞', category: 'grain',
    basis: EACH, kcal: 82, protein: 4, carbs: 14, fat: 1.1,
    pack: 'Loaf, 20 slices', tags: ['wholegrain', 'vegetarian'],
  },
  {
    id: 'burger-bun', name: 'Burger bun', emoji: '🍞', category: 'grain',
    basis: EACH, kcal: 170, protein: 6, carbs: 30, fat: 2.5,
    pack: 'Pack of 6', tags: ['refined', 'vegetarian'],
  },
  {
    id: 'burger-bun-wholewheat', name: 'Wholewheat burger bun', emoji: '🍞', category: 'grain',
    basis: EACH, kcal: 140, protein: 7, carbs: 25, fat: 2,
    pack: 'Pack of 6', tags: ['wholegrain', 'vegetarian'],
  },
  {
    id: 'lettuce-wrap', name: 'Lettuce wrap (no bun)', emoji: '🥬', category: 'grain',
    basis: EACH, kcal: 8, protein: 0.6, carbs: 1.5, fat: 0.1,
    pack: '1 head', tags: ['fresh', 'vegan', 'lowcal'],
  },
  {
    id: 'pita', name: 'White pita bread', emoji: '🫓', category: 'grain',
    basis: EACH, kcal: 165, protein: 5.5, carbs: 33, fat: 0.7,
    pack: 'Pack of 6', tags: ['refined', 'vegan'],
  },
  {
    id: 'pita-wholewheat', name: 'Wholewheat pita', emoji: '🫓', category: 'grain',
    basis: EACH, kcal: 170, protein: 6, carbs: 35, fat: 1.7,
    pack: 'Pack of 6', tags: ['wholegrain', 'vegan'],
  },
  {
    id: 'tortilla-flour', name: 'Flour tortilla', emoji: '🫓', category: 'grain',
    basis: EACH, kcal: 140, protein: 4, carbs: 24, fat: 3.5,
    pack: 'Pack of 8', tags: ['refined', 'vegan'],
  },
  {
    id: 'tortilla-wholewheat', name: 'Wholewheat tortilla', emoji: '🫓', category: 'grain',
    basis: EACH, kcal: 120, protein: 4, carbs: 21, fat: 3,
    pack: 'Pack of 8', tags: ['wholegrain', 'vegan'],
  },
  {
    id: 'oats-rolled', name: 'Rolled oats', emoji: '🥣', category: 'grain',
    basis: PER_100G, kcal: 379, protein: 13, carbs: 67, fat: 6.5,
    pack: '1 kg tub', tags: ['wholegrain', 'vegan'],
  },
  {
    id: 'oats-instant-sweet', name: 'Instant oats, flavoured', emoji: '🥣', category: 'grain',
    basis: PER_100G, kcal: 380, protein: 8, carbs: 75, fat: 5,
    pack: 'Box of 10 sachets', tags: ['processed', 'sweetened', 'vegetarian'],
  },
  {
    id: 'cornflakes', name: 'Cornflakes', emoji: '🥣', category: 'grain',
    basis: PER_100G, kcal: 357, protein: 7, carbs: 84, fat: 0.4,
    pack: '500 g box', tags: ['refined', 'processed', 'vegetarian'],
  },
  {
    id: 'pancake-mix', name: 'Pancake mix', emoji: '🥞', category: 'grain',
    basis: PER_100G, kcal: 360, protein: 8, carbs: 72, fat: 4,
    pack: '900 g box', tags: ['refined', 'processed', 'vegetarian'],
  },
  {
    id: 'noodles-canton', name: 'Pancit canton noodles', emoji: '🍜', category: 'grain',
    basis: PER_100G, kcal: 400, protein: 10, carbs: 65, fat: 11,
    pack: '454 g pack', tags: ['dried', 'refined', 'vegetarian'],
  },
  {
    id: 'noodles-bihon', name: 'Bihon (rice noodles)', emoji: '🍜', category: 'grain',
    basis: PER_100G, kcal: 364, protein: 6, carbs: 80, fat: 0.6,
    pack: '227 g pack', tags: ['dried', 'refined', 'vegan'],
  },
  {
    id: 'noodles-egg', name: 'Fresh egg noodles', emoji: '🍜', category: 'grain',
    basis: PER_100G, kcal: 280, protein: 10, carbs: 52, fat: 3.5,
    pack: '400 g pack', tags: ['refined', 'vegetarian'],
  },
  {
    id: 'wonton-wrapper', name: 'Wonton wrapper', emoji: '🥟', category: 'grain',
    basis: EACH, kcal: 24, protein: 0.8, carbs: 5, fat: 0.1,
    pack: 'Pack of 50', tags: ['refined', 'vegetarian'],
  },
  {
    id: 'dumpling-wrapper', name: 'Dumpling wrapper', emoji: '🥟', category: 'grain',
    basis: EACH, kcal: 22, protein: 0.7, carbs: 4.6, fat: 0.1,
    pack: 'Pack of 40', tags: ['refined', 'vegetarian'],
  },
  {
    id: 'lumpia-wrapper', name: 'Lumpia wrapper', emoji: '🌯', category: 'grain',
    basis: EACH, kcal: 30, protein: 1, carbs: 6, fat: 0.2,
    pack: 'Pack of 25', tags: ['refined', 'vegetarian'],
  },
  {
    id: 'bulgur', name: 'Bulgur wheat', emoji: '🌾', category: 'grain',
    basis: PER_100G, kcal: 342, protein: 12, carbs: 76, fat: 1.3,
    pack: '500 g bag', tags: ['wholegrain', 'vegan'],
  },
  {
    id: 'couscous', name: 'Couscous', emoji: '🌾', category: 'grain',
    basis: PER_100G, kcal: 376, protein: 13, carbs: 77, fat: 0.6,
    pack: '500 g box', tags: ['refined', 'vegan'],
  },
  {
    id: 'breadcrumbs', name: 'Panko breadcrumbs', emoji: '🍞', category: 'grain',
    basis: PER_100G, kcal: 395, protein: 13, carbs: 72, fat: 5,
    pack: '200 g box', tags: ['refined', 'vegetarian'],
  },
  {
    id: 'french-fries', name: 'Frozen french fries', emoji: '🍟', category: 'grain',
    basis: PER_100G, kcal: 274, protein: 3.4, carbs: 36, fat: 13,
    pack: '1 kg bag', tags: ['frozen', 'fried', 'processed', 'vegan'],
  },
  {
    id: 'hash-brown', name: 'Frozen hash browns', emoji: '🥔', category: 'grain',
    basis: EACH, kcal: 120, protein: 1.5, carbs: 14, fat: 6.5,
    pack: 'Box of 10', tags: ['frozen', 'fried', 'processed', 'vegan'],
  },
  {
    id: 'croutons', name: 'Croutons', emoji: '🍞', category: 'grain',
    basis: PER_100G, kcal: 407, protein: 12, carbs: 74, fat: 6.6,
    pack: '150 g bag', tags: ['refined', 'processed', 'vegetarian'],
  },
  {
    id: 'flour', name: 'All-purpose flour', emoji: '🌾', category: 'grain',
    basis: PER_100G, kcal: 364, protein: 10, carbs: 76, fat: 1,
    pack: '1 kg bag', tags: ['refined', 'vegan'],
  },
  {
    id: 'cornstarch', name: 'Cornstarch', emoji: '🌽', category: 'grain',
    basis: PER_100G, kcal: 381, protein: 0.3, carbs: 91, fat: 0.1,
    pack: '400 g box', tags: ['refined', 'vegan'],
  },

  // ── Dairy & alternatives ───────────────────────────────────────────────────
  {
    id: 'milk-whole', name: 'Whole milk', emoji: '🥛', category: 'dairy',
    basis: PER_100ML, kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3,
    pack: '1 L carton', tags: ['vegetarian'],
  },
  {
    id: 'milk-skim', name: 'Skim milk', emoji: '🥛', category: 'dairy',
    basis: PER_100ML, kcal: 34, protein: 3.4, carbs: 5, fat: 0.1,
    pack: '1 L carton', tags: ['vegetarian', 'lean', 'lowcal'],
  },
  {
    id: 'soy-milk', name: 'Unsweetened soy milk', emoji: '🥛', category: 'dairy',
    basis: PER_100ML, kcal: 33, protein: 2.8, carbs: 1.8, fat: 1.8,
    pack: '1 L carton', tags: ['vegan', 'vegetarian', 'lowcal'],
  },
  {
    id: 'evap-milk', name: 'Evaporated milk', emoji: '🥫', category: 'dairy',
    basis: PER_100ML, kcal: 134, protein: 6.8, carbs: 10, fat: 7.6,
    pack: '370 mL can', tags: ['canned', 'vegetarian'],
  },
  {
    id: 'condensed-milk', name: 'Condensed milk', emoji: '🥫', category: 'dairy',
    basis: PER_100G, kcal: 321, protein: 7.9, carbs: 54, fat: 8.7,
    pack: '390 g can', tags: ['canned', 'sweetened', 'vegetarian'],
  },
  {
    id: 'coconut-milk', name: 'Coconut milk', emoji: '🥥', category: 'dairy',
    basis: PER_100ML, kcal: 230, protein: 2.3, carbs: 5.5, fat: 24,
    pack: '400 mL can', tags: ['canned', 'vegan', 'fatty'],
  },
  {
    id: 'coconut-milk-lite', name: 'Light coconut milk', emoji: '🥥', category: 'dairy',
    basis: PER_100ML, kcal: 73, protein: 0.8, carbs: 2, fat: 7,
    pack: '400 mL can', tags: ['canned', 'vegan'],
  },
  {
    id: 'cheddar', name: 'Grated cheddar', emoji: '🧀', category: 'dairy',
    basis: PER_100G, kcal: 402, protein: 25, carbs: 1.3, fat: 33,
    pack: '200 g bag', tags: ['vegetarian', 'fatty'],
  },
  {
    id: 'quickmelt', name: 'Quickmelt cheese', emoji: '🧀', category: 'dairy',
    basis: PER_100G, kcal: 330, protein: 18, carbs: 6, fat: 26,
    pack: '165 g block', tags: ['processed', 'vegetarian', 'fatty'],
  },
  {
    id: 'kesong-puti', name: 'Kesong puti', emoji: '🧀', category: 'dairy',
    basis: PER_100G, kcal: 220, protein: 15, carbs: 3, fat: 16,
    pack: '200 g', tags: ['fresh', 'vegetarian'],
  },
  {
    id: 'parmesan', name: 'Parmesan', emoji: '🧀', category: 'dairy',
    basis: PER_100G, kcal: 431, protein: 38, carbs: 4.1, fat: 29,
    pack: '100 g wedge', tags: ['vegetarian', 'fatty'],
  },
  {
    id: 'mozzarella', name: 'Mozzarella', emoji: '🧀', category: 'dairy',
    basis: PER_100G, kcal: 300, protein: 22, carbs: 2.2, fat: 22,
    pack: '250 g ball', tags: ['vegetarian', 'fatty'],
  },
  {
    id: 'cheese-slice', name: 'American cheese slice', emoji: '🧀', category: 'dairy',
    basis: EACH, kcal: 70, protein: 3.5, carbs: 1.5, fat: 5.5,
    pack: 'Pack of 12 slices', tags: ['processed', 'vegetarian'],
  },
  {
    id: 'feta', name: 'Feta', emoji: '🧀', category: 'dairy',
    basis: PER_100G, kcal: 264, protein: 14, carbs: 4.1, fat: 21,
    pack: '200 g block', tags: ['vegetarian', 'fatty'],
  },
  {
    id: 'labneh', name: 'Labneh', emoji: '🥛', category: 'dairy',
    basis: PER_100G, kcal: 174, protein: 8, carbs: 5, fat: 14,
    pack: '250 g tub', tags: ['vegetarian'],
  },
  {
    id: 'yogurt-greek', name: 'Greek yogurt, plain', emoji: '🥛', category: 'dairy',
    basis: PER_100G, kcal: 59, protein: 10, carbs: 3.6, fat: 0.4,
    pack: '500 g tub', tags: ['vegetarian', 'lean', 'lowcal'],
  },
  {
    id: 'yogurt-flavoured', name: 'Flavoured yogurt', emoji: '🥛', category: 'dairy',
    basis: PER_100G, kcal: 95, protein: 8, carbs: 13, fat: 1.5,
    pack: '4 × 125 g pots', tags: ['vegetarian', 'sweetened'],
  },
  {
    id: 'butter', name: 'Butter', emoji: '🧈', category: 'dairy',
    basis: PER_100G, kcal: 717, protein: 0.9, carbs: 0.1, fat: 81,
    pack: '225 g block', tags: ['vegetarian', 'fatty'],
  },
  {
    id: 'margarine', name: 'Margarine', emoji: '🧈', category: 'dairy',
    basis: PER_100G, kcal: 717, protein: 0.2, carbs: 0.7, fat: 81,
    pack: '250 g tub', tags: ['processed', 'vegetarian', 'fatty'],
  },
  {
    id: 'cream-heavy', name: 'Heavy cream', emoji: '🥛', category: 'dairy',
    basis: PER_100ML, kcal: 340, protein: 2.1, carbs: 2.8, fat: 36,
    pack: '250 mL carton', tags: ['vegetarian', 'fatty'],
  },
  {
    id: 'sour-cream', name: 'Sour cream', emoji: '🥛', category: 'dairy',
    basis: PER_100G, kcal: 198, protein: 2.4, carbs: 4.6, fat: 19,
    pack: '200 g tub', tags: ['vegetarian', 'fatty'],
  },
  {
    id: 'cream-cheese', name: 'Cream cheese', emoji: '🧀', category: 'dairy',
    basis: PER_100G, kcal: 342, protein: 6, carbs: 4.1, fat: 34,
    pack: '200 g tub', tags: ['vegetarian', 'fatty'],
  },

  // ── Sauces, dressings & condiments ─────────────────────────────────────────
  {
    id: 'sauce-pinoy', name: 'Pinoy-style sweet spaghetti sauce', emoji: '🫙', category: 'sauce',
    basis: PER_100G, kcal: 120, protein: 1.5, carbs: 26, fat: 1,
    pack: '1 kg jar', tags: ['jarred', 'processed', 'sweetened'],
  },
  {
    id: 'sauce-italian', name: 'Italian-style marinara', emoji: '🫙', category: 'sauce',
    basis: PER_100G, kcal: 65, protein: 1.6, carbs: 10, fat: 2,
    pack: '680 g jar', tags: ['jarred', 'vegan'],
  },
  {
    id: 'sauce-american-meat', name: 'American-style meat sauce', emoji: '🫙', category: 'sauce',
    basis: PER_100G, kcal: 95, protein: 3, carbs: 12, fat: 4,
    pack: '680 g jar', tags: ['jarred', 'processed'],
  },
  {
    id: 'tomato-canned', name: 'Canned crushed tomatoes', emoji: '🥫', category: 'sauce',
    basis: PER_100G, kcal: 32, protein: 1.6, carbs: 7, fat: 0.3,
    pack: '400 g can', tags: ['canned', 'vegan', 'lowcal'],
  },
  {
    id: 'tomato-sauce-can', name: 'Plain tomato sauce', emoji: '🥫', category: 'sauce',
    basis: PER_100G, kcal: 29, protein: 1.3, carbs: 6.4, fat: 0.2,
    pack: '250 g pouch', tags: ['canned', 'vegan', 'lowcal'],
  },
  {
    id: 'tomato-paste', name: 'Tomato paste', emoji: '🥫', category: 'sauce',
    basis: PER_100G, kcal: 82, protein: 4.3, carbs: 19, fat: 0.5,
    pack: '150 g tin', tags: ['canned', 'vegan'],
  },
  {
    id: 'soy-sauce', name: 'Soy sauce', emoji: '🍶', category: 'sauce',
    basis: PER_100ML, kcal: 53, protein: 8, carbs: 5, fat: 0.1,
    pack: '385 mL bottle', tags: ['vegan', 'lowcal'],
  },
  {
    id: 'vinegar-cane', name: 'Cane vinegar', emoji: '🍶', category: 'sauce',
    basis: PER_100ML, kcal: 18, protein: 0, carbs: 0.4, fat: 0,
    pack: '385 mL bottle', tags: ['vegan', 'lowcal'],
  },
  {
    id: 'fish-sauce', name: 'Fish sauce (patis)', emoji: '🍶', category: 'sauce',
    basis: PER_100ML, kcal: 35, protein: 5, carbs: 3.6, fat: 0,
    pack: '350 mL bottle', tags: ['lowcal'],
  },
  {
    id: 'oyster-sauce', name: 'Oyster sauce', emoji: '🍶', category: 'sauce',
    basis: PER_100G, kcal: 120, protein: 2, carbs: 27, fat: 0.3,
    pack: '255 g bottle', tags: ['processed'],
  },
  {
    id: 'hoisin', name: 'Hoisin sauce', emoji: '🍶', category: 'sauce',
    basis: PER_100G, kcal: 220, protein: 3.3, carbs: 44, fat: 3.4,
    pack: '250 g jar', tags: ['jarred', 'processed', 'sweetened', 'vegan'],
  },
  {
    id: 'sweet-sour-sauce', name: 'Sweet & sour sauce', emoji: '🍶', category: 'sauce',
    basis: PER_100G, kcal: 180, protein: 0.3, carbs: 44, fat: 0.2,
    pack: '300 g jar', tags: ['jarred', 'processed', 'sweetened', 'vegan'],
  },
  {
    id: 'black-bean-sauce', name: 'Black bean sauce', emoji: '🍶', category: 'sauce',
    basis: PER_100G, kcal: 150, protein: 6, carbs: 20, fat: 5,
    pack: '220 g jar', tags: ['jarred', 'vegan'],
  },
  {
    id: 'doubanjiang', name: 'Chili bean paste (doubanjiang)', emoji: '🌶️', category: 'sauce',
    basis: PER_100G, kcal: 130, protein: 8, carbs: 14, fat: 4,
    pack: '200 g jar', tags: ['jarred', 'vegan'],
  },
  {
    id: 'chili-garlic-sauce', name: 'Chili garlic sauce', emoji: '🌶️', category: 'sauce',
    basis: PER_100G, kcal: 90, protein: 1.5, carbs: 15, fat: 2.5,
    pack: '220 g jar', tags: ['jarred', 'vegan', 'lowcal'],
  },
  {
    id: 'sriracha', name: 'Sriracha', emoji: '🌶️', category: 'sauce',
    basis: PER_100G, kcal: 93, protein: 1.9, carbs: 19, fat: 0.9,
    pack: '435 mL bottle', tags: ['vegan', 'lowcal'],
  },
  {
    id: 'ketchup', name: 'Tomato ketchup', emoji: '🍅', category: 'sauce',
    basis: PER_100G, kcal: 101, protein: 1.2, carbs: 25, fat: 0.1,
    pack: '500 g bottle', tags: ['processed', 'sweetened', 'vegan'],
  },
  {
    id: 'banana-ketchup', name: 'Banana ketchup', emoji: '🍌', category: 'sauce',
    basis: PER_100G, kcal: 120, protein: 0.5, carbs: 30, fat: 0.1,
    pack: '550 g bottle', tags: ['processed', 'sweetened', 'vegan'],
  },
  {
    id: 'mayonnaise', name: 'Mayonnaise', emoji: '🥫', category: 'sauce',
    basis: PER_100G, kcal: 680, protein: 1, carbs: 0.6, fat: 75,
    pack: '470 mL jar', tags: ['jarred', 'processed', 'fatty'],
  },
  {
    id: 'mayo-light', name: 'Light mayonnaise', emoji: '🥫', category: 'sauce',
    basis: PER_100G, kcal: 238, protein: 0.9, carbs: 9, fat: 22,
    pack: '470 mL jar', tags: ['jarred', 'processed'],
  },
  {
    id: 'salsa', name: 'Tomato salsa', emoji: '🥫', category: 'sauce',
    basis: PER_100G, kcal: 36, protein: 1.5, carbs: 7, fat: 0.2,
    pack: '300 g jar', tags: ['jarred', 'vegan', 'lowcal'],
  },
  {
    id: 'mustard', name: 'Yellow mustard', emoji: '🌭', category: 'sauce',
    basis: PER_100G, kcal: 66, protein: 4, carbs: 5.8, fat: 3.3,
    pack: '250 g bottle', tags: ['vegan', 'lowcal'],
  },
  {
    id: 'ranch-dressing', name: 'Ranch dressing', emoji: '🥗', category: 'sauce',
    basis: PER_100G, kcal: 430, protein: 1, carbs: 6, fat: 45,
    pack: '350 mL bottle', tags: ['processed', 'fatty'],
  },
  {
    id: 'caesar-dressing', name: 'Caesar dressing', emoji: '🥗', category: 'sauce',
    basis: PER_100G, kcal: 460, protein: 2, carbs: 3, fat: 49,
    pack: '350 mL bottle', tags: ['processed', 'fatty'],
  },
  {
    id: 'caesar-dressing-light', name: 'Light Caesar dressing', emoji: '🥗', category: 'sauce',
    basis: PER_100G, kcal: 160, protein: 1.5, carbs: 9, fat: 13,
    pack: '350 mL bottle', tags: ['processed'],
  },
  {
    id: 'vinaigrette', name: 'Lemon vinaigrette', emoji: '🥗', category: 'sauce',
    basis: PER_100G, kcal: 130, protein: 0.2, carbs: 6, fat: 12,
    pack: '250 mL bottle', tags: ['vegan'],
  },
  {
    id: 'bbq-sauce', name: 'Barbecue sauce', emoji: '🍶', category: 'sauce',
    basis: PER_100G, kcal: 172, protein: 0.8, carbs: 41, fat: 0.6,
    pack: '500 g bottle', tags: ['processed', 'sweetened', 'vegan'],
  },
  {
    id: 'buffalo-sauce', name: 'Buffalo wing sauce', emoji: '🌶️', category: 'sauce',
    basis: PER_100G, kcal: 96, protein: 0.5, carbs: 5, fat: 8,
    pack: '350 mL bottle', tags: ['processed'],
  },
  {
    id: 'gravy-mix', name: 'Brown gravy mix', emoji: '🥣', category: 'sauce',
    basis: PER_100G, kcal: 350, protein: 8, carbs: 62, fat: 7,
    pack: 'Box of 4 sachets', tags: ['processed'],
  },
  {
    id: 'tahini', name: 'Tahini', emoji: '🥜', category: 'sauce',
    basis: PER_100G, kcal: 595, protein: 17, carbs: 21, fat: 54,
    pack: '400 g jar', tags: ['jarred', 'vegan', 'fatty'],
  },
  {
    id: 'toum', name: 'Garlic sauce (toum)', emoji: '🧄', category: 'sauce',
    basis: PER_100G, kcal: 590, protein: 1.5, carbs: 6, fat: 63,
    pack: '250 g tub', tags: ['vegan', 'fatty'],
  },
  {
    id: 'yogurt-sauce', name: 'Yogurt-garlic sauce', emoji: '🥛', category: 'sauce',
    basis: PER_100G, kcal: 80, protein: 4, carbs: 5, fat: 5,
    pack: '250 g tub', tags: ['vegetarian'],
  },
  {
    id: 'hummus', name: 'Hummus', emoji: '🫓', category: 'sauce',
    basis: PER_100G, kcal: 166, protein: 8, carbs: 14, fat: 10,
    pack: '250 g tub', tags: ['vegan', 'vegetarian'],
  },
  {
    id: 'peanut-butter', name: 'Peanut butter', emoji: '🥜', category: 'sauce',
    basis: PER_100G, kcal: 588, protein: 25, carbs: 20, fat: 50,
    pack: '340 g jar', tags: ['jarred', 'vegan', 'fatty'],
  },
  {
    id: 'kare-kare-mix', name: 'Kare-kare peanut sauce mix', emoji: '🥜', category: 'sauce',
    basis: PER_100G, kcal: 380, protein: 12, carbs: 40, fat: 20,
    pack: '80 g sachet', tags: ['processed'],
  },
  {
    id: 'sinigang-mix', name: 'Sinigang sa sampalok mix', emoji: '🥣', category: 'sauce',
    basis: PER_100G, kcal: 250, protein: 3, carbs: 55, fat: 1,
    pack: '40 g sachet', tags: ['processed', 'vegan'],
  },
  {
    id: 'tamarind-fresh', name: 'Fresh tamarind', emoji: '🫘', category: 'sauce',
    basis: PER_100G, kcal: 239, protein: 2.8, carbs: 63, fat: 0.6,
    pack: '250 g', tags: ['fresh', 'vegan'],
  },
  {
    id: 'bagoong', name: 'Bagoong (shrimp paste)', emoji: '🦐', category: 'sauce',
    basis: PER_100G, kcal: 130, protein: 12, carbs: 8, fat: 5,
    pack: '230 g jar', tags: ['jarred'],
  },
  {
    id: 'maple-syrup', name: 'Maple syrup', emoji: '🍁', category: 'sauce',
    basis: PER_100G, kcal: 260, protein: 0, carbs: 67, fat: 0.1,
    pack: '250 mL bottle', tags: ['sweetened', 'vegan'],
  },
  {
    id: 'pancake-syrup', name: 'Pancake syrup', emoji: '🍯', category: 'sauce',
    basis: PER_100G, kcal: 260, protein: 0, carbs: 65, fat: 0,
    pack: '350 mL bottle', tags: ['processed', 'sweetened', 'vegan'],
  },
  {
    id: 'syrup-sugarfree', name: 'Sugar-free syrup', emoji: '🍯', category: 'sauce',
    basis: PER_100G, kcal: 40, protein: 0, carbs: 10, fat: 0,
    pack: '350 mL bottle', tags: ['processed', 'vegan', 'lowcal'],
  },
  {
    id: 'honey', name: 'Honey', emoji: '🍯', category: 'sauce',
    basis: PER_100G, kcal: 304, protein: 0.3, carbs: 82, fat: 0,
    pack: '350 g jar', tags: ['jarred', 'sweetened', 'vegetarian'],
  },

  // ── Cooking fats ───────────────────────────────────────────────────────────
  {
    id: 'oil-vegetable', name: 'Vegetable oil', emoji: '🛢️', category: 'fat',
    basis: PER_100ML, kcal: 884, protein: 0, carbs: 0, fat: 100,
    pack: '1 L bottle', tags: ['vegan', 'fatty'],
  },
  {
    id: 'oil-olive', name: 'Olive oil', emoji: '🫒', category: 'fat',
    basis: PER_100ML, kcal: 884, protein: 0, carbs: 0, fat: 100,
    pack: '500 mL bottle', tags: ['vegan', 'fatty'],
  },
  {
    id: 'oil-sesame', name: 'Sesame oil', emoji: '🛢️', category: 'fat',
    basis: PER_100ML, kcal: 884, protein: 0, carbs: 0, fat: 100,
    pack: '250 mL bottle', tags: ['vegan', 'fatty'],
  },
  {
    id: 'oil-coconut', name: 'Coconut oil', emoji: '🥥', category: 'fat',
    basis: PER_100ML, kcal: 862, protein: 0, carbs: 0, fat: 100,
    pack: '500 mL jar', tags: ['vegan', 'fatty'],
  },
  {
    id: 'cooking-spray', name: 'Cooking spray', emoji: '💨', category: 'fat',
    basis: PER_100ML, kcal: 500, protein: 0, carbs: 0, fat: 57,
    pack: '200 mL can', tags: ['processed', 'vegan', 'lowcal'],
  },
  {
    id: 'lard', name: 'Lard', emoji: '🐖', category: 'fat',
    basis: PER_100G, kcal: 902, protein: 0, carbs: 0, fat: 100,
    pack: '250 g tub', tags: ['fatty'],
  },

  // ── Pantry & flavourings ───────────────────────────────────────────────────
  {
    id: 'aromatics', name: 'Bay leaf & peppercorns', emoji: '🍃', category: 'pantry',
    basis: PER_100G, kcal: 255, protein: 8, carbs: 60, fat: 8,
    pack: 'Spice rack pair', tags: ['dried', 'vegan'],
  },
  {
    id: 'black-pepper', name: 'Ground black pepper', emoji: '🧂', category: 'pantry',
    basis: PER_100G, kcal: 251, protein: 10, carbs: 64, fat: 3.3,
    pack: '50 g shaker', tags: ['dried', 'vegan'],
  },
  {
    id: 'salt', name: 'Salt', emoji: '🧂', category: 'pantry',
    basis: PER_100G, kcal: 0, protein: 0, carbs: 0, fat: 0,
    pack: '1 kg box', tags: ['vegan', 'lowcal'],
  },
  {
    id: 'bouillon-cube', name: 'Chicken bouillon cube', emoji: '🧊', category: 'pantry',
    basis: EACH, kcal: 10, protein: 0.4, carbs: 1, fat: 0.3,
    pack: 'Box of 12', tags: ['processed', 'lowcal'],
  },
  {
    id: 'kabsa-spice', name: 'Kabsa spice mix', emoji: '🧂', category: 'pantry',
    basis: PER_100G, kcal: 300, protein: 11, carbs: 50, fat: 8,
    pack: '50 g sachet', tags: ['dried', 'vegan'],
  },
  {
    id: 'zaatar', name: "Za'atar", emoji: '🌿', category: 'pantry',
    basis: PER_100G, kcal: 350, protein: 10, carbs: 40, fat: 16,
    pack: '100 g pack', tags: ['dried', 'vegan'],
  },
  {
    id: 'cumin', name: 'Ground cumin', emoji: '🧂', category: 'pantry',
    basis: PER_100G, kcal: 375, protein: 18, carbs: 44, fat: 22,
    pack: '50 g jar', tags: ['dried', 'vegan'],
  },
  {
    id: 'chili-powder', name: 'Chili powder', emoji: '🌶️', category: 'pantry',
    basis: PER_100G, kcal: 282, protein: 13, carbs: 50, fat: 14,
    pack: '60 g jar', tags: ['dried', 'vegan'],
  },
  {
    id: 'atsuete', name: 'Annatto (atsuete) powder', emoji: '🧂', category: 'pantry',
    basis: PER_100G, kcal: 50, protein: 2, carbs: 10, fat: 1,
    pack: '25 g sachet', tags: ['dried', 'vegan', 'lowcal'],
  },
  {
    id: 'sugar-white', name: 'White sugar', emoji: '🍬', category: 'pantry',
    basis: PER_100G, kcal: 387, protein: 0, carbs: 100, fat: 0,
    pack: '1 kg bag', tags: ['sweetened', 'vegan'],
  },
  {
    id: 'sugar-brown', name: 'Brown sugar', emoji: '🍬', category: 'pantry',
    basis: PER_100G, kcal: 380, protein: 0, carbs: 98, fat: 0,
    pack: '1 kg bag', tags: ['sweetened', 'vegan'],
  },
  {
    id: 'sweetener', name: 'Zero-calorie sweetener', emoji: '🍬', category: 'pantry',
    basis: PER_100G, kcal: 0, protein: 0, carbs: 0, fat: 0,
    pack: 'Box of 100 sachets', tags: ['processed', 'vegan', 'lowcal'],
  },
  {
    id: 'tablea', name: 'Tablea (pure cacao)', emoji: '🍫', category: 'pantry',
    basis: PER_100G, kcal: 480, protein: 20, carbs: 30, fat: 30,
    pack: 'Pack of 20 discs', tags: ['vegan', 'fatty'],
  },
  {
    // Carbohydrate here is net of fibre — cocoa is roughly a third fibre by
    // weight, and counting it would make the macro bar claim nearly twice the
    // calories the product actually has.
    id: 'cocoa-powder', name: 'Unsweetened cocoa powder', emoji: '🍫', category: 'pantry',
    basis: PER_100G, kcal: 228, protein: 20, carbs: 21, fat: 14,
    pack: '250 g tin', tags: ['vegan'],
  },
  {
    id: 'peanuts', name: 'Roasted peanuts', emoji: '🥜', category: 'pantry',
    basis: PER_100G, kcal: 587, protein: 24, carbs: 21, fat: 50,
    pack: '250 g bag', tags: ['vegan', 'fatty'],
  },
  {
    id: 'cashews', name: 'Cashews', emoji: '🥜', category: 'pantry',
    basis: PER_100G, kcal: 553, protein: 18, carbs: 30, fat: 44,
    pack: '200 g bag', tags: ['vegan', 'fatty'],
  },
  {
    id: 'almonds', name: 'Almonds', emoji: '🥜', category: 'pantry',
    basis: PER_100G, kcal: 579, protein: 21, carbs: 22, fat: 50,
    pack: '200 g bag', tags: ['vegan', 'fatty'],
  },
  {
    id: 'sesame-seeds', name: 'Sesame seeds', emoji: '🌰', category: 'pantry',
    basis: PER_100G, kcal: 573, protein: 18, carbs: 23, fat: 50,
    pack: '100 g pack', tags: ['vegan', 'fatty'],
  },
  {
    id: 'raisins', name: 'Raisins', emoji: '🍇', category: 'pantry',
    basis: PER_100G, kcal: 299, protein: 3.1, carbs: 79, fat: 0.5,
    pack: '250 g box', tags: ['dried', 'vegan', 'sweetened'],
  },
  {
    id: 'olives', name: 'Green olives', emoji: '🫒', category: 'pantry',
    basis: PER_100G, kcal: 115, protein: 0.8, carbs: 6, fat: 11,
    pack: '300 g jar', tags: ['jarred', 'vegan'],
  },
  {
    id: 'pickles', name: 'Dill pickles', emoji: '🥒', category: 'pantry',
    basis: PER_100G, kcal: 12, protein: 0.6, carbs: 2.3, fat: 0.2,
    pack: '500 g jar', tags: ['jarred', 'vegan', 'lowcal'],
  },
  {
    id: 'pickle-relish', name: 'Sweet pickle relish', emoji: '🥒', category: 'pantry',
    basis: PER_100G, kcal: 130, protein: 0.4, carbs: 35, fat: 0.5,
    pack: '300 g jar', tags: ['jarred', 'sweetened', 'vegan'],
  },
  {
    id: 'coconut-shredded', name: 'Desiccated coconut', emoji: '🥥', category: 'pantry',
    basis: PER_100G, kcal: 660, protein: 6.9, carbs: 24, fat: 65,
    pack: '200 g bag', tags: ['dried', 'vegan', 'fatty'],
  },

  // ── Drinks ─────────────────────────────────────────────────────────────────
  {
    id: 'water', name: 'Water', emoji: '💧', category: 'drink',
    basis: PER_100ML, kcal: 0, protein: 0, carbs: 0, fat: 0,
    pack: '1.5 L bottle', tags: ['vegan', 'lowcal'],
  },
  {
    id: 'coffee-black', name: 'Black coffee', emoji: '☕', category: 'drink',
    basis: PER_100ML, kcal: 2, protein: 0.1, carbs: 0, fat: 0,
    pack: '200 g jar', tags: ['vegan', 'lowcal'],
  },
  {
    id: 'coffee-3in1', name: '3-in-1 instant coffee', emoji: '☕', category: 'drink',
    basis: EACH, kcal: 90, protein: 0.8, carbs: 16, fat: 2.5,
    pack: 'Box of 10 sachets', tags: ['processed', 'sweetened'],
  },
  {
    id: 'orange-juice', name: 'Orange juice', emoji: '🍊', category: 'drink',
    basis: PER_100ML, kcal: 45, protein: 0.7, carbs: 10, fat: 0.2,
    pack: '1 L carton', tags: ['vegan'],
  },
  {
    id: 'cola', name: 'Cola', emoji: '🥤', category: 'drink',
    basis: PER_100ML, kcal: 42, protein: 0, carbs: 11, fat: 0,
    pack: '1.5 L bottle', tags: ['processed', 'sweetened', 'vegan'],
  },
  {
    id: 'cola-diet', name: 'Diet cola', emoji: '🥤', category: 'drink',
    basis: PER_100ML, kcal: 0.3, protein: 0, carbs: 0, fat: 0,
    pack: '1.5 L bottle', tags: ['processed', 'vegan', 'lowcal'],
  },
  {
    id: 'iced-tea', name: 'Sweet iced tea', emoji: '🧋', category: 'drink',
    basis: PER_100ML, kcal: 30, protein: 0, carbs: 7.5, fat: 0,
    pack: '1 L carton', tags: ['processed', 'sweetened', 'vegan'],
  },
]

/** Lookup by id, built once at module load. */
export const CATALOG: Record<string, Product> = Object.fromEntries(
  PRODUCTS.map((p) => [p.id, p]),
)

export function getProduct(id: string): Product | undefined {
  return CATALOG[id]
}
