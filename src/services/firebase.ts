import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyARSaFo5U0mh4PACiWQpYwR3bwrw98ULAs',
  authDomain: 'recipeverseapp.firebaseapp.com',
  projectId: 'recipeverseapp',
  storageBucket: 'recipeverseapp.firebasestorage.app',
  messagingSenderId: '94188710463',
  appId: '1:94188710463:web:fba38803e0625f039f668a',
};

let app, auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  if (Platform.OS === 'web') {
    auth = getAuth(app);
  } else {
    // Only use React Native persistence on iOS/Android
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
}

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

