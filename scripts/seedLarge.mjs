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

const CHIEF_NAMES = [
  'Alice Waters', 'Thomas Keller', 'Alain Ducasse', 'Julia Child', 'Marcus Samuelsson',
  'Rene Redzepi', 'Nigella Lawson', 'Ferran Adria', 'Emeril Lagasse', 'Yotam Ottolenghi',
  'David Chang', 'Daniel Boulud', 'Rick Bayless', 'Nobu Matsuhisa', 'Ina Garten',
  'Giada De Laurentiis', 'Bobby Flay', 'Guy Fieri', 'José Andrés', 'Wolfgang Puck'
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function fetchRandomMeal() {
  const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
  const data = await res.json();
  return data.meals[0];
}

async function seedData() {
  console.log('Starting massive 20-item seed process...');
  
  try {
    await signInAnonymously(auth);
    console.log('Signed in anonymously');

    for (let i = 0; i < 20; i++) {
      // 1. Create Chef
      const chefName = CHIEF_NAMES[i];
      const chefId = `chef_${chefName.toLowerCase().replace(/\\s+/g, '_')}_${Date.now()}`;
      // Use different avatar styles using unavatar or ui-avatars to ensure uniqueness, or unsplash source
      const avatarNum = getRandomInt(1, 99);
      const photoURL = `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${avatarNum}.jpg`;

      const chef = {
        uid: chefId,
        email: `${chefName.toLowerCase().replace(/\\s+/g, '')}@example.com`,
        displayName: chefName,
        photoURL,
        bio: `Award-winning chef passionate about bringing people together through beautiful, delicious food.`,
        followers: getRandomInt(5000, 5000000),
        following: getRandomInt(50, 1000),
      };

      await setDoc(doc(db, 'users', chef.uid), chef);
      console.log(`[${i+1}/20] Added user: ${chef.displayName}`);

      // 2. Fetch & Create Recipe
      const meal = await fetchRandomMeal();
      
      const ingredients = [];
      for (let j = 1; j <= 20; j++) {
        const ing = meal[`strIngredient${j}`];
        const measure = meal[`strMeasure${j}`];
        if (ing && ing.trim() !== '') {
          ingredients.push(`${measure ? measure.trim() + ' ' : ''}${ing.trim()}`);
        }
      }

      const stepsRaw = meal.strInstructions || '';
      const steps = stepsRaw
        .split(/\\r\\n|\\n|\\r/)
        .filter(s => s.trim().length > 5)
        .map(s => s.replace(/^\\d+\\.\\s*/, '').trim()); // remove leading numbers

      const recipeId = `recipe_${meal.idMeal}_${Date.now()}`;
      const rating = (Math.random() * (5 - 4.2) + 4.2).toFixed(1); // 4.2 to 5.0

      const recipe = {
        id: recipeId,
        type: 'standard',
        chefId: chefId,
        chefName: chefName,
        chefAvatar: photoURL,
        title: meal.strMeal,
        description: `A traditional ${meal.strArea || 'global'} ${meal.strCategory || 'dish'} that is sure to impress.`,
        imageUri: meal.strMealThumb,
        category: meal.strCategory || 'Dinner',
        tags: meal.strTags ? meal.strTags.split(',') : [meal.strArea || 'Delicious'],
        rating: parseFloat(rating),
        likes: getRandomInt(1000, 50000),
        comments: getRandomInt(100, 2000),
        macros: { 
          carbs: getRandomInt(10, 80), 
          protein: getRandomInt(10, 60), 
          fat: getRandomInt(5, 40) 
        },
        prepTime: `${getRandomInt(15, 120)} mins`,
        difficulty: ['Easy', 'Medium', 'Hard'][getRandomInt(0, 2)],
        calories: `${getRandomInt(300, 1200)} kcal`,
        steps: steps.length > 0 ? steps : ['Mix all ingredients.', 'Cook until done.', 'Serve hot and enjoy!'],
        ingredients: ingredients.length > 0 ? ingredients : ['Love and passion'],
        createdAt: new Date(Date.now() - getRandomInt(10000, 1000000000)) // Random past date
      };

      await setDoc(doc(db, 'recipes', recipe.id), recipe);
      console.log(`[${i+1}/20] Added recipe: ${recipe.title}`);
      
      // Delay slightly to respect API limits
      await new Promise(res => setTimeout(res, 500));
    }

    console.log('\\n\\nSuccessfully generated 20 chefs and 20 detailed recipes!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
