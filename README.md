# 🍳 RecipeVerse

RecipeVerse is a beautiful, community-driven recipe sharing platform built with **React Native (Expo)**, **Firebase**, and **Zustand**. It allows chefs and food enthusiasts to discover, share, and save their favorite recipes, complete with a real-time feed, custom notifications, and interactive step-by-step cooking guides.

![RecipeVerse](https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=1200&q=80)

## ✨ Features

- **Authentication System**: Secure email/password and Google OAuth sign-in, plus a "Guest" mode for quick exploration.
- **Real-Time Feed**: Powered by Firebase Firestore, new recipes appear in the feed instantly as they are published by the community.
- **Multi-Step Recipe Creator**: A sleek, intuitive wizard for publishing recipes with ingredients, macros, instructions, and cover photos.
- **Save & Like**: Optimistic UI updates allow users to instantly like and save recipes to their personal cookbook.
- **Notifications**: Real-time in-app notifications when someone likes your recipe or follows your profile.
- **Cross-Platform**: Codebase compiles seamlessly to Web, iOS, and Android.

## 🛠️ Tech Stack

- **Frontend**: React Native, Expo, React Navigation
- **State Management**: Zustand
- **Backend & Database**: Firebase Auth, Cloud Firestore, Firebase Storage
- **Styling**: React Native StyleSheet with custom design system tokens

---

## 🚀 How to Run Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Clone the Repository
```bash
git clone https://github.com/notgodfather/recipeverseMAD.git
cd recipeverseMAD
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Firebase (Optional but Recommended)
The app comes with a default Firebase configuration in `src/services/firebase.ts`. If you are setting up your own Firebase backend:
1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** (Email/Password & Anonymous).
3. Enable **Cloud Firestore** and **Storage**. 
4. Update the Firestore and Storage rules to allow read/write access (e.g., `allow read, write: if request.auth != null;`).
5. Replace the credentials in `src/services/firebase.ts` with your own.

### 4. Start the Development Server
To start the Expo Metro Bundler, run:
```bash
npm start
```

You can then run the app on your preferred platform:
- **Web**: Press `w` in the terminal or run `npm run web` (Available at `http://localhost:8081`).
- **iOS Simulator**: Press `i` in the terminal.
- **Android Emulator**: Press `a` in the terminal.
- **Physical Device**: Download the Expo Go app on your phone and scan the QR code in the terminal.

---

## 🌐 Deployment (Vercel)

This project is configured to be easily deployed as a web application via Vercel.

1. Create a new project on [Vercel](https://vercel.com/new).
2. Import this GitHub repository.
3. Vercel will automatically detect the settings. Ensure the following configurations:
   - **Framework Preset**: Other (or Create React App)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**.

## 📄 License
This project is open-source and available under the MIT License.
