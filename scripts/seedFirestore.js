/**
 * RecipeVerse — Firestore Seeder
 * ─────────────────────────────
 * Run once from the project root:
 *   node scripts/seedFirestore.js
 *
 * Requires Node 18+ (native fetch). No extra deps needed.
 * Uses the same Firebase project you already configured.
 */

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  serverTimestamp,
} = require('firebase/firestore');

// ── Your Firebase config ─────────────────────────────────────
const firebaseConfig = {
  apiKey: 'AIzaSyARSaFo5U0mh4PACiWQpYwR3bwrw98ULAs',
  authDomain: 'recipeverseapp.firebaseapp.com',
  projectId: 'recipeverseapp',
  storageBucket: 'recipeverseapp.firebasestorage.app',
  messagingSenderId: '94188710463',
  appId: '1:94188710463:web:fba38803e0625f039f668a',
};
// ─────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── Chef profiles ────────────────────────────────────────────
const CHEFS = [
  {
    uid: 'chef_marco',
    displayName: 'Marco Rossi',
    email: 'marco@recipeverseapp.com',
    photoURL: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=200&q=80',
    bio: 'Trained at Le Cordon Bleu Rome. 15 years in Michelin kitchens across Tuscany. Now sharing authentic Italian soul food with the world.',
    specialty: 'Italian & Mediterranean',
    followers: 14200,
    following: 320,
    recipeCount: 48,
  },
  {
    uid: 'chef_elena',
    displayName: 'Elena Vance',
    email: 'elena@recipeverseapp.com',
    photoURL: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?auto=format&fit=crop&w=200&q=80',
    bio: 'Plant-based chef and nutritionist. Proving every day that vegan food can be bold, satisfying, and absolutely delicious.',
    specialty: 'Vegan & Plant-Based',
    followers: 9800,
    following: 210,
    recipeCount: 61,
  },
  {
    uid: 'chef_hiro',
    displayName: 'Hiro Tanaka',
    email: 'hiro@recipeverseapp.com',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    bio: 'Third-generation ramen master from Sapporo. Obsessed with umami, fermentation, and the art of the perfect broth.',
    specialty: 'Japanese & Ramen',
    followers: 22400,
    following: 180,
    recipeCount: 34,
  },
  {
    uid: 'chef_sarah',
    displayName: 'Sarah Jenkins',
    email: 'sarah@recipeverseapp.com',
    photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
    bio: 'Registered dietitian and wellness chef. My food is designed to nourish your body and delight your taste buds.',
    specialty: 'Healthy & Balanced',
    followers: 11600,
    following: 450,
    recipeCount: 72,
  },
  {
    uid: 'chef_carlos',
    displayName: 'Carlos Reyes',
    email: 'carlos@recipeverseapp.com',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    bio: 'Born in Oaxaca, trained in Mexico City. Bringing the depth of traditional Mexican cooking — moles, salsas, and slow-cooked meats — to your kitchen.',
    specialty: 'Mexican & Latin',
    followers: 18900,
    following: 290,
    recipeCount: 55,
  },
  {
    uid: 'chef_mia',
    displayName: 'Mia Rossetti',
    email: 'mia@recipeverseapp.com',
    photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    bio: 'Coastal chef from the Amalfi Coast. I cook whatever the sea gives me that morning — the freshest seafood, the simplest preparations.',
    specialty: 'Seafood & Coastal',
    followers: 8300,
    following: 155,
    recipeCount: 29,
  },
];

// ── Recipes ──────────────────────────────────────────────────
const RECIPES = [
  // ── Marco Rossi ────────────────────────────────────────────
  {
    id: 'recipe_001',
    type: 'wide',
    chefId: 'chef_marco',
    chefName: 'Marco Rossi',
    chefAvatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=200&q=80',
    title: 'Heirloom Tomato & Basil Pizza',
    description: 'A deep-dive into long fermentation and heritage wheat. Learn to achieve the perfect leopard-spotted Neapolitan crust at home with a 48-hour cold-proof dough.',
    imageUri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    category: 'Italian',
    tags: ['Italian', 'Baked', 'Sourdough'],
    rating: 4.9,
    likes: 0,
    comments: 412,
    prepTime: '48 hrs',
    difficulty: 'Pro',
    calories: '840 kcal',
    macros: { carbs: 92, protein: 28, fat: 22 },
    steps: [
      'Mix 500g heritage flour with 325ml cold water. Rest 30 minutes.',
      'Add 10g salt and 2g dry yeast. Knead 10 minutes until smooth.',
      'Cold-ferment in fridge for 48 hours.',
      'Shape into 250g balls. Rest at room temperature 4 hours.',
      'Stretch by hand to 30cm. Top with crushed San Marzano tomatoes.',
      'Bake at maximum oven temperature (280°C+) for 5–7 minutes.',
      'Finish with fresh buffalo mozzarella and basil.',
    ],
    ingredients: [
      '500g heritage "00" flour',
      '325ml cold water',
      '10g fine sea salt',
      '2g dry active yeast',
      '200g San Marzano tomatoes (crushed)',
      '150g fresh buffalo mozzarella',
      'Fresh basil leaves',
      '2 tbsp extra-virgin olive oil',
    ],
  },
  {
    id: 'recipe_002',
    type: 'standard',
    chefId: 'chef_marco',
    chefName: 'Marco Rossi',
    chefAvatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=200&q=80',
    title: 'Cacio e Pepe',
    description: 'Three ingredients. One Roman masterpiece. Master the emulsification technique that separates pro pasta from the rest.',
    imageUri: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80',
    category: 'Italian',
    tags: ['Italian', 'Pasta', 'Quick'],
    rating: 4.8,
    likes: 0,
    comments: 287,
    prepTime: '20 mins',
    difficulty: 'Medium',
    calories: '620 kcal',
    macros: { carbs: 78, protein: 24, fat: 18 },
    steps: [
      'Toast 2 tsp black pepper in a dry pan until fragrant. Grind coarsely.',
      'Cook 200g tonnarelli in well-salted boiling water.',
      'Reserve 200ml starchy pasta water before draining.',
      'In a wide pan, combine 80g Pecorino Romano with hot pasta water to form a cream.',
      'Add drained pasta and pepper. Toss vigorously off heat.',
      'Add more pasta water as needed for glossy sauce.',
    ],
    ingredients: [
      '200g tonnarelli or thick spaghetti',
      '80g Pecorino Romano (finely grated)',
      '20g Parmigiano Reggiano',
      '2 tsp whole black peppercorns',
    ],
  },
  {
    id: 'recipe_003',
    type: 'standard',
    chefId: 'chef_marco',
    chefName: 'Marco Rossi',
    chefAvatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=200&q=80',
    title: 'Classic Tiramisu',
    description: 'The definitive recipe — no raw eggs shortcut, no cream substitutions. Just pure Venetian tradition with espresso-soaked ladyfingers and silky mascarpone.',
    imageUri: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',
    category: 'Dessert',
    tags: ['Dessert', 'Italian', 'No-Bake'],
    rating: 4.9,
    likes: 0,
    comments: 534,
    prepTime: '30 mins + 4 hrs chill',
    difficulty: 'Easy',
    calories: '480 kcal',
    macros: { carbs: 42, protein: 8, fat: 28 },
    steps: [
      'Whisk 6 egg yolks with 120g sugar until pale and thick.',
      'Fold in 500g mascarpone until smooth.',
      'Whip 300ml heavy cream to soft peaks. Fold into mascarpone mixture.',
      'Brew strong espresso and cool with 2 tbsp Marsala or rum.',
      'Dip savoiardi quickly (1 second per side) and layer in dish.',
      'Spread half the cream. Repeat layers. Refrigerate 4+ hours.',
      'Dust generously with fine cocoa powder before serving.',
    ],
    ingredients: [
      '6 egg yolks',
      '120g caster sugar',
      '500g mascarpone',
      '300ml heavy cream',
      '24 savoiardi (ladyfinger biscuits)',
      '300ml strong espresso',
      '2 tbsp Marsala wine or dark rum',
      'Unsweetened cocoa powder for dusting',
    ],
  },

  // ── Elena Vance ─────────────────────────────────────────────
  {
    id: 'recipe_004',
    type: 'standard',
    chefId: 'chef_elena',
    chefName: 'Elena Vance',
    chefAvatar: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?auto=format&fit=crop&w=200&q=80',
    title: 'Zesty Avocado Buddha Bowl',
    description: 'A rainbow of whole foods — creamy avocado, crispy chickpeas, roasted sweet potato — united by a tahini-lemon dressing that will change how you think about salad.',
    imageUri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    category: 'Vegan',
    tags: ['Vegan', 'Gluten-Free', 'Healthy'],
    rating: 4.8,
    likes: 0,
    comments: 198,
    prepTime: '35 mins',
    difficulty: 'Easy',
    calories: '520 kcal',
    macros: { carbs: 54, protein: 18, fat: 26 },
    steps: [
      'Roast sweet potato cubes at 200°C with olive oil, cumin and paprika for 25 minutes.',
      'Rinse chickpeas and toss with oil, garlic powder and salt. Air fry or bake until crispy.',
      'Cook quinoa according to packet. Fluff and season.',
      'Whisk tahini, lemon juice, garlic, maple syrup and water for dressing.',
      'Assemble bowls: quinoa base, roasted vegetables, fresh greens, avocado slices.',
      'Top with crispy chickpeas, cucumber, cherry tomatoes and edamame.',
      'Drizzle dressing and sprinkle with sesame seeds.',
    ],
    ingredients: [
      '150g quinoa',
      '1 large sweet potato (diced)',
      '400g canned chickpeas',
      '2 ripe avocados',
      '100g mixed greens',
      '100g cherry tomatoes',
      '100g edamame',
      '½ cucumber (sliced)',
      '3 tbsp tahini',
      '2 tbsp lemon juice',
      '1 tbsp maple syrup',
    ],
  },
  {
    id: 'recipe_005',
    type: 'wide',
    chefId: 'chef_elena',
    chefName: 'Elena Vance',
    chefAvatar: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?auto=format&fit=crop&w=200&q=80',
    title: 'Thai Green Curry (Vegan)',
    description: 'An aromatic vegan green curry that rivals any restaurant version. The secret is making your own paste — it only takes 10 minutes and transforms the entire dish.',
    imageUri: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80',
    category: 'Asian',
    tags: ['Vegan', 'Asian', 'Thai'],
    rating: 4.7,
    likes: 0,
    comments: 167,
    prepTime: '45 mins',
    difficulty: 'Medium',
    calories: '440 kcal',
    macros: { carbs: 48, protein: 14, fat: 20 },
    steps: [
      'Blend lemongrass, green chillies, galangal, garlic, coriander stems and kaffir lime zest into paste.',
      'Fry paste in coconut oil for 3 minutes until fragrant.',
      'Add 400ml coconut milk and 200ml vegetable stock. Bring to simmer.',
      'Add tofu cubes, courgette, baby corn and sugar snap peas.',
      'Simmer 15 minutes until vegetables are just tender.',
      'Season with tamari, lime juice and brown sugar.',
      'Serve over jasmine rice, topped with Thai basil and sliced red chilli.',
    ],
    ingredients: [
      '400ml full-fat coconut milk',
      '200g firm tofu (pressed and cubed)',
      '1 courgette',
      '100g baby corn',
      '100g sugar snap peas',
      '2 stalks lemongrass',
      '4 green chillies',
      'Fresh galangal or ginger',
      '4 cloves garlic',
      '2 tbsp tamari',
      'Fresh Thai basil',
      'Jasmine rice to serve',
    ],
  },

  // ── Hiro Tanaka ─────────────────────────────────────────────
  {
    id: 'recipe_006',
    type: 'wide',
    chefId: 'chef_hiro',
    chefName: 'Hiro Tanaka',
    chefAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    title: '12-Hour Tonkotsu Ramen',
    description: 'The mythical bowl — a collagen-rich pork broth with handmade wavy noodles, melt-in-your-mouth chashu, a perfect marinated soft egg, and nori.',
    imageUri: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
    category: 'Asian',
    tags: ['Japanese', 'Ramen', 'Asian'],
    rating: 5.0,
    likes: 0,
    comments: 621,
    prepTime: '12 hrs',
    difficulty: 'Pro',
    calories: '780 kcal',
    macros: { carbs: 68, protein: 42, fat: 32 },
    steps: [
      'Blanch 1kg pork bones for 5 minutes. Rinse thoroughly under cold water.',
      'Simmer bones with onion, ginger and garlic on high heat for 12 hours. Skim constantly.',
      'For chashu: roll pork belly tightly, tie with string, sear all sides.',
      'Braise chashu in soy, mirin, sake and sugar for 3 hours at 120°C.',
      'Marinate soft-boiled eggs in chashu braising liquid for 4 hours.',
      'Make tare: combine soy sauce, mirin and sea salt.',
      'Cook fresh ramen noodles per packet. 2 minutes max.',
      'Assemble: 2 tbsp tare in bowl, add hot broth, noodles, chashu slices, egg, nori and spring onion.',
    ],
    ingredients: [
      '1kg pork neck bones',
      '500g pork belly (for chashu)',
      '4 portions fresh wavy ramen noodles',
      '4 soft-boiled eggs',
      '4 sheets nori',
      '100ml soy sauce',
      '50ml mirin',
      '50ml sake',
      '2 tbsp sugar',
      '2 spring onions',
      'Bamboo shoots and bean sprouts',
    ],
  },
  {
    id: 'recipe_007',
    type: 'standard',
    chefId: 'chef_hiro',
    chefName: 'Hiro Tanaka',
    chefAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    title: 'Crispy Salmon Onigiri',
    description: 'Japanese rice balls stuffed with sesame salmon, wrapped in nori. Crispy on the outside from a quick pan-fry, perfectly seasoned inside.',
    imageUri: 'https://images.unsplash.com/photo-1617196034182-0b32a5e58450?auto=format&fit=crop&w=800&q=80',
    category: 'Asian',
    tags: ['Japanese', 'Snack', 'Seafood'],
    rating: 4.7,
    likes: 0,
    comments: 142,
    prepTime: '40 mins',
    difficulty: 'Medium',
    calories: '360 kcal',
    macros: { carbs: 52, protein: 22, fat: 8 },
    steps: [
      'Cook 300g sushi rice per packet. Season with rice vinegar, sugar and salt while hot.',
      'Flake 200g cooked salmon. Mix with sesame oil, soy sauce and sesame seeds.',
      'Wet hands with salted water. Take a fistful of rice, press a dent, fill with salmon.',
      'Fold rice around filling and shape into a triangle.',
      'Wrap the base with a strip of nori.',
      'Optional: pan-fry in butter until golden for a crispy shell.',
    ],
    ingredients: [
      '300g sushi rice',
      '200g salmon fillet (cooked)',
      '3 tbsp rice vinegar',
      '1 tbsp sugar',
      '1 tsp sesame oil',
      '1 tbsp soy sauce',
      '1 tbsp sesame seeds',
      '4 sheets nori',
    ],
  },

  // ── Sarah Jenkins ───────────────────────────────────────────
  {
    id: 'recipe_008',
    type: 'wide',
    chefId: 'chef_sarah',
    chefName: 'Sarah Jenkins',
    chefAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
    title: 'Quinoa & Roasted Veggie Power Bowl',
    description: 'Every component of this bowl is designed to maximise nutrition without sacrificing flavour. High protein, high fibre, anti-inflammatory, and genuinely delicious.',
    imageUri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80',
    category: 'Healthy',
    tags: ['Healthy', 'Gluten-Free', 'High-Protein'],
    rating: 4.7,
    likes: 0,
    comments: 214,
    prepTime: '45 mins',
    difficulty: 'Easy',
    calories: '420 kcal',
    macros: { carbs: 46, protein: 22, fat: 12 },
    steps: [
      'Preheat oven to 200°C. Chop broccoli florets, red pepper, courgette and red onion.',
      'Toss vegetables in olive oil, garlic, cumin and smoked paprika. Spread on baking tray.',
      'Roast 25 minutes, turning halfway, until edges are lightly charred.',
      'Cook quinoa in vegetable broth for extra flavour.',
      'Whisk lemon juice, tahini, garlic, and water for dressing.',
      'Assemble: quinoa, roasted vegetables, chickpeas, and microgreens.',
      'Top with pumpkin seeds, drizzle with dressing and a squeeze of lemon.',
    ],
    ingredients: [
      '200g quinoa',
      '1 head broccoli',
      '1 red bell pepper',
      '1 courgette',
      '1 red onion',
      '400g canned chickpeas',
      '50g microgreens or rocket',
      '3 tbsp tahini',
      '2 tbsp lemon juice',
      '2 tbsp pumpkin seeds',
      'Smoked paprika, cumin',
    ],
  },
  {
    id: 'recipe_009',
    type: 'standard',
    chefId: 'chef_sarah',
    chefName: 'Sarah Jenkins',
    chefAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
    title: 'Greek Yoghurt Protein Pancakes',
    description: 'Fluffy, golden, high-protein breakfast pancakes made with Greek yoghurt and oats. 28g protein per serving. Ready in 15 minutes.',
    imageUri: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80',
    category: 'Breakfast',
    tags: ['Breakfast', 'High-Protein', 'Quick'],
    rating: 4.8,
    likes: 0,
    comments: 308,
    prepTime: '15 mins',
    difficulty: 'Easy',
    calories: '380 kcal',
    macros: { carbs: 34, protein: 28, fat: 10 },
    steps: [
      'Blend 150g oats to a rough flour in a blender.',
      'Mix oat flour with 200g Greek yoghurt, 2 eggs, 1 tsp baking powder and a pinch of salt.',
      'Stir in 1 tbsp honey and ½ tsp vanilla extract.',
      'Heat a non-stick pan on medium. Add a small knob of butter.',
      'Pour ¼ cup batter per pancake. Cook 2–3 minutes each side until golden.',
      'Serve with fresh berries, a dollop of yoghurt and a drizzle of honey.',
    ],
    ingredients: [
      '150g rolled oats',
      '200g full-fat Greek yoghurt',
      '2 large eggs',
      '1 tsp baking powder',
      '1 tbsp honey',
      '½ tsp vanilla extract',
      'Pinch of salt',
      'Fresh berries to serve',
    ],
  },

  // ── Carlos Reyes ────────────────────────────────────────────
  {
    id: 'recipe_010',
    type: 'wide',
    chefId: 'chef_carlos',
    chefName: 'Carlos Reyes',
    chefAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    title: 'Street-Style Carne Asada Tacos',
    description: 'Authentic Oaxacan street tacos with 24-hour marinated skirt steak, hand-pressed corn tortillas, salsa verde, and all the right garnishes.',
    imageUri: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80',
    category: 'Mexican',
    tags: ['Mexican', 'Street Food', 'Grilled'],
    rating: 4.9,
    likes: 0,
    comments: 547,
    prepTime: '24 hrs marinade + 30 mins',
    difficulty: 'Medium',
    calories: '580 kcal',
    macros: { carbs: 42, protein: 36, fat: 24 },
    steps: [
      'Marinade: blend orange juice, lime juice, garlic, cumin, chilli, coriander and oil.',
      'Score skirt steak and marinate refrigerated for 24 hours.',
      'Make salsa verde: char tomatillos, jalapeño and garlic under the grill. Blend with coriander.',
      'Make corn tortillas: mix masa harina with warm water and salt. Press with tortilla press.',
      'Cook tortillas on dry comal 1 minute each side. Keep warm.',
      'Grill steak on screaming hot cast iron, 3 minutes per side. Rest 5 minutes.',
      'Chop steak finely. Serve on double-stacked tortillas with onion, coriander, salsa and lime.',
    ],
    ingredients: [
      '600g skirt or flank steak',
      '2 oranges (juiced)',
      '4 limes',
      '6 cloves garlic',
      '2 tsp cumin',
      'Fresh coriander',
      '300g masa harina (for tortillas)',
      '500g tomatillos (for salsa)',
      '2 jalapeños',
      '1 white onion',
      'Radishes and lime to garnish',
    ],
  },
  {
    id: 'recipe_011',
    type: 'standard',
    chefId: 'chef_carlos',
    chefName: 'Carlos Reyes',
    chefAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    title: 'Dark Mole Negro',
    description: 'The king of Mexican sauces. 28 ingredients, 3 hours, a flavour unlike anything else on earth. Served over pulled turkey with sesame and plantain.',
    imageUri: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    category: 'Mexican',
    tags: ['Mexican', 'Traditional', 'Advanced'],
    rating: 4.9,
    likes: 0,
    comments: 398,
    prepTime: '3 hrs',
    difficulty: 'Pro',
    calories: '620 kcal',
    macros: { carbs: 48, protein: 38, fat: 22 },
    steps: [
      'Toast ancho, mulato and pasilla chillies on a dry comal. Soak in hot water 30 minutes.',
      'Char tomatoes, tomatillos, onion and garlic directly in the flame.',
      'Fry tortilla pieces in lard until dark brown. Add to blender.',
      'Toast sesame seeds, peanuts, plantain, raisins and spices separately.',
      'Blend everything in batches until silky smooth.',
      'Fry mole paste in lard for 20 minutes, stirring constantly.',
      'Add turkey broth and dark chocolate. Simmer 1 hour.',
      'Season with salt and piloncillo (brown sugar). Serve over turkey.',
    ],
    ingredients: [
      '4 ancho chillies (dried)',
      '4 mulato chillies',
      '2 pasilla chillies',
      '50g dark chocolate (80%)',
      '50g sesame seeds',
      '50g peanuts',
      '1 ripe plantain',
      '2 corn tortillas',
      'Lard or oil',
      'Turkey thighs',
      'Dried whole spices (cloves, cumin, cinnamon, black pepper)',
    ],
  },

  // ── Mia Rossetti ────────────────────────────────────────────
  {
    id: 'recipe_012',
    type: 'standard',
    chefId: 'chef_mia',
    chefName: 'Mia Rossetti',
    chefAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    title: 'Pan-Seared Salmon with Beurre Blanc',
    description: 'Restaurant-quality seared salmon with a crispy skin and a classic French butter sauce. On the table in 20 minutes.',
    imageUri: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
    category: 'Seafood',
    tags: ['Seafood', 'French', 'Quick'],
    rating: 4.8,
    likes: 0,
    comments: 276,
    prepTime: '20 mins',
    difficulty: 'Medium',
    calories: '520 kcal',
    macros: { carbs: 4, protein: 44, fat: 34 },
    steps: [
      'Pat salmon fillets completely dry with paper towels. Season generously.',
      'Heat a stainless steel pan until smoking. Add neutral oil.',
      'Place salmon skin-side down. Press gently for 10 seconds to prevent curling.',
      'Cook 4 minutes without moving. Flip and cook 90 seconds.',
      'Rest salmon while making sauce.',
      'For beurre blanc: reduce white wine and shallots until almost dry.',
      'Whisk in cold butter cubes off the heat, one at a time, until emulsified.',
      'Season with lemon, salt and white pepper. Spoon over salmon.',
    ],
    ingredients: [
      '4 salmon fillets (skin-on)',
      '150ml dry white wine',
      '2 shallots (finely diced)',
      '150g cold unsalted butter (cubed)',
      '1 lemon (juice)',
      'White pepper',
      'Fresh dill or chervil',
      'Asparagus or green beans to serve',
    ],
  },
  {
    id: 'recipe_013',
    type: 'wide',
    chefId: 'chef_mia',
    chefName: 'Mia Rossetti',
    chefAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    title: 'Spaghetti alle Vongole',
    description: 'The definitive Neapolitan clam pasta — briny, garlicky, finished with white wine and barely any fuss. The kind of dish you eat standing on a dock in Napoli.',
    imageUri: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=800&q=80',
    category: 'Seafood',
    tags: ['Seafood', 'Italian', 'Pasta'],
    rating: 4.9,
    likes: 0,
    comments: 321,
    prepTime: '25 mins',
    difficulty: 'Medium',
    calories: '560 kcal',
    macros: { carbs: 62, protein: 32, fat: 14 },
    steps: [
      'Scrub clams and soak in cold salted water 30 minutes to purge sand.',
      'Cook spaghetti 2 minutes less than al dente. Reserve 300ml pasta water.',
      'Heat olive oil with 6 sliced garlic cloves and dried chilli until golden.',
      'Add clams and white wine. Cover and cook 3–4 minutes until clams open. Discard any closed ones.',
      'Add pasta to clam pan with a ladleful of pasta water. Toss on high heat 2 minutes.',
      'Remove from heat. Add parsley, lemon zest and a generous drizzle of raw olive oil.',
    ],
    ingredients: [
      '320g spaghetti',
      '800g fresh clams (vongole veraci)',
      '6 cloves garlic',
      '150ml dry white wine',
      '1 dried chilli',
      'Large bunch flat-leaf parsley',
      '1 lemon (zest)',
      '6 tbsp extra-virgin olive oil',
    ],
  },
];

// ── Seeding functions ────────────────────────────────────────
async function seedChefs() {
  console.log('\n👨‍🍳  Seeding chef profiles...');
  for (const chef of CHEFS) {
    const ref = doc(db, 'users', chef.uid);
    await setDoc(ref, {
      ...chef,
      createdAt: serverTimestamp(),
    }, { merge: true });
    console.log(`  ✓ ${chef.displayName}`);
  }
}

async function seedRecipes() {
  console.log('\n🍽️  Seeding recipes...');
  for (const recipe of RECIPES) {
    const ref = doc(db, 'recipes', recipe.id);
    await setDoc(ref, {
      ...recipe,
      createdAt: serverTimestamp(),
    }, { merge: true });
    console.log(`  ✓ ${recipe.title} — by ${recipe.chefName}`);
  }
}

async function checkAlreadySeeded() {
  const snap = await getDocs(collection(db, 'recipes'));
  return snap.size > 0;
}

async function main() {
  console.log('🚀 RecipeVerse Firestore Seeder');
  console.log('═══════════════════════════════');

  const alreadySeeded = await checkAlreadySeeded();
  if (alreadySeeded) {
    console.log('\n⚠️  Recipes already exist in Firestore.');
    console.log('   Add --force flag to re-seed and overwrite: node scripts/seedFirestore.js --force');
    if (!process.argv.includes('--force')) {
      process.exit(0);
    }
    console.log('   --force detected. Re-seeding...');
  }

  await seedChefs();
  await seedRecipes();

  console.log('\n✅ Done! Firestore now has:');
  console.log(`   • ${CHEFS.length} chef profiles in /users`);
  console.log(`   • ${RECIPES.length} recipes in /recipes`);
  console.log('\n   Reload your app to see live data from Firestore.\n');
  process.exit(0);
}

main().catch((e) => {
  console.error('\n❌ Seeding failed:', e.message);
  process.exit(1);
});
