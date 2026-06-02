import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyARSaFo5U0mh4PACiWQpYwR3bwrw98ULAs',
  authDomain: 'recipeverseapp.firebaseapp.com',
  projectId: 'recipeverseapp',
  storageBucket: 'recipeverseapp.firebasestorage.app',
  messagingSenderId: '94188710463',
  appId: '1:94188710463:web:fba38803e0625f039f668a',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const chefs = [
  {
    uid: 'chef_gordon',
    email: 'gordon@ramsay.com',
    displayName: 'Gordon Ramsay',
    photoURL: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&q=80',
    bio: 'Multi-Michelin starred chef and star of the small screen.',
    followers: 14500000,
    following: 120,
  },
  {
    uid: 'chef_massimo',
    email: 'massimo@bottura.it',
    displayName: 'Massimo Bottura',
    photoURL: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&q=80',
    bio: 'Chef patron of Osteria Francescana, a three-Michelin-star restaurant based in Modena, Italy.',
    followers: 2100000,
    following: 340,
  },
  {
    uid: 'chef_dominique',
    email: 'dom@crenn.com',
    displayName: 'Dominique Crenn',
    photoURL: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&q=80',
    bio: 'French chef and owner of Atelier Crenn in San Francisco.',
    followers: 850000,
    following: 450,
  }
];

const recipes = [
  {
    id: 'recipe_beef_wellington',
    type: 'standard',
    chefId: 'chef_gordon',
    chefName: 'Gordon Ramsay',
    chefAvatar: chefs[0].photoURL,
    title: 'Classic Beef Wellington',
    description: 'The ultimate dinner party showstopper. Tender beef wrapped in puff pastry.',
    imageUri: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
    category: 'Dinner',
    tags: ['Beef', 'Dinner Party', 'Classic'],
    rating: 4.9,
    likes: 12500,
    comments: 843,
    macros: { carbs: 45, protein: 55, fat: 35 },
    prepTime: '2 hours',
    difficulty: 'Hard',
    calories: '850 kcal',
    steps: [
      'Sear the beef fillet in a hot pan with olive oil until browned all over.',
      'Blend mushrooms with chestnuts to make a duxelles paste. Cook until moisture evaporates.',
      'Wrap the beef in prosciutto spread with the duxelles, then wrap tightly in cling film and chill.',
      'Roll out the puff pastry, unwrap the beef and place it in the center. Fold pastry over and seal edges.',
      'Brush with egg wash, score the pastry, and bake at 200°C for 35 minutes.',
      'Rest for 10 minutes before carving into thick slices.'
    ],
    ingredients: [
      '1kg beef fillet center cut',
      '3 tbsp olive oil',
      '250g mushrooms',
      '50g butter',
      '1 sprig fresh thyme',
      '12 slices prosciutto',
      '500g puff pastry',
      '2 egg yolks (for egg wash)'
    ],
    tip: 'Ensure the mushrooms are completely dry before wrapping to avoid soggy pastry!',
    createdAt: new Date(Date.now() - 10000000)
  },
  {
    id: 'recipe_tortellini',
    type: 'standard',
    chefId: 'chef_massimo',
    chefName: 'Massimo Bottura',
    chefAvatar: chefs[1].photoURL,
    title: 'Tortellini in Brodo',
    description: 'A comforting Italian classic from Emilia-Romagna.',
    imageUri: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80',
    category: 'Pasta',
    tags: ['Pasta', 'Italian', 'Comfort Food'],
    rating: 5.0,
    likes: 8400,
    comments: 420,
    macros: { carbs: 60, protein: 25, fat: 15 },
    prepTime: '3 hours',
    difficulty: 'Medium',
    calories: '450 kcal',
    steps: [
      'Prepare the filling by combining pork, prosciutto, mortadella, Parmigiano-Reggiano, and nutmeg.',
      'Make the egg pasta dough and rest it for 30 minutes.',
      'Roll the dough out until paper thin.',
      'Cut into small squares, add a tiny bit of filling, and fold into tortellini shapes.',
      'Simmer gently in rich capon broth until they float to the top.',
      'Serve immediately in the hot broth with extra Parmigiano.'
    ],
    ingredients: [
      '300g 00 flour',
      '3 large eggs',
      '100g pork loin',
      '100g prosciutto di Parma',
      '100g mortadella',
      '150g Parmigiano-Reggiano',
      'Nutmeg to taste',
      '2 liters capon broth'
    ],
    tip: 'The smaller the tortellini, the better. They should fit on a spoon perfectly.',
    createdAt: new Date(Date.now() - 5000000)
  },
  {
    id: 'recipe_avocado_toast',
    type: 'standard',
    chefId: 'chef_dominique',
    chefName: 'Dominique Crenn',
    chefAvatar: chefs[2].photoURL,
    title: 'Artisan Avocado Toast',
    description: 'Elevated morning staple with poached egg and microgreens.',
    imageUri: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=800&q=80',
    category: 'Breakfast',
    tags: ['Breakfast', 'Healthy', 'Quick'],
    rating: 4.8,
    likes: 3200,
    comments: 150,
    macros: { carbs: 30, protein: 15, fat: 22 },
    prepTime: '15 mins',
    difficulty: 'Easy',
    calories: '320 kcal',
    steps: [
      'Toast a thick slice of sourdough bread until golden brown.',
      'Mash half a ripe avocado with a squeeze of lemon juice, salt, and pepper.',
      'Spread the avocado evenly over the toast.',
      'Poach an egg for exactly 3 minutes in simmering water with a splash of vinegar.',
      'Place the poached egg on top of the avocado.',
      'Garnish with chili flakes, microgreens, and a drizzle of extra virgin olive oil.'
    ],
    ingredients: [
      '1 slice thick sourdough bread',
      '1/2 ripe avocado',
      '1 large fresh egg',
      '1 tsp lemon juice',
      'Chili flakes',
      'Microgreens',
      'Extra virgin olive oil'
    ],
    tip: 'Use the freshest eggs possible for the perfect poached egg shape.',
    createdAt: new Date(Date.now() - 1000000)
  }
];

const stories = [
  {
    id: 'story_1',
    userId: 'chef_gordon',
    userName: 'Gordon Ramsay',
    userAvatar: chefs[0].photoURL,
    mediaUri: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&q=80',
    mediaType: 'image',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000)
  },
  {
    id: 'story_2',
    userId: 'chef_massimo',
    userName: 'Massimo Bottura',
    userAvatar: chefs[1].photoURL,
    mediaUri: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80',
    mediaType: 'image',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000)
  }
];

async function seedData() {
  console.log('Starting seed process...');
  
  try {
    await signInAnonymously(auth);
    console.log('Signed in anonymously');

    for (const chef of chefs) {
      await setDoc(doc(db, 'users', chef.uid), chef);
      console.log(`Added user: ${chef.displayName}`);
    }

    for (const recipe of recipes) {
      await setDoc(doc(db, 'recipes', recipe.id), recipe);
      console.log(`Added recipe: ${recipe.title}`);
    }
    
    for (const story of stories) {
      await setDoc(doc(db, 'stories', story.id), story);
      console.log(`Added story: ${story.id}`);
    }

    console.log('Seed process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
