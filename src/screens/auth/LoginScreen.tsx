import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  signInAnonymously,
} from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { auth } from '../../services/firebase';
import { colors } from '../../constants/colors';
import { layout } from '../../constants/layout';
import { fonts } from '../../constants/fonts';

// Required to complete the browser-based OAuth redirect
WebBrowser.maybeCompleteAuthSession();

// ─── Google OAuth Client IDs ────────────────────────────────
// Get your Web Client ID from:
//   Firebase Console → Authentication → Sign-in method → Google
//   → Web SDK configuration → Web client ID
// Get iOS/Android IDs from: Google Cloud Console → Credentials
const GOOGLE_IOS_CLIENT_ID = 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_WEB_CLIENT_ID = '94188710463-5k210aumijhbjduqr0i2chins2b4bjvn.apps.googleusercontent.com';

// Set to true only after you've replaced all three IDs above
const GOOGLE_CONFIGURED = true;
// ─────────────────────────────────────────────────────────────

type Mode = 'landing' | 'login' | 'signup';

/** Maps Firebase Auth error codes to friendly messages */
function friendlyError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try logging in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Please contact support.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});

  // ─── Google OAuth via expo-auth-session ──────────────────────
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleCredential(id_token);
    } else if (response?.type === 'error') {
      Alert.alert('Google Sign-In Error', response.error?.message ?? 'Sign-in was cancelled.');
    }
  }, [response]);

  const handleGoogleCredential = async (idToken: string) => {
    setLoading(true);
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      // onAuthStateChanged in authStore handles the rest automatically
    } catch (e: any) {
      Alert.alert('Google Sign-In Error', friendlyError(e.code ?? ''));
    } finally {
      setLoading(false);
    }
  };
  // ─────────────────────────────────────────────────────────────

  // ─── Form Validation ─────────────────────────────────────────
  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (mode === 'signup' && !name.trim()) errs.name = 'Name is required';
    if (!validateEmail(email)) errs.email = 'Enter a valid email address';
    if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  // ─────────────────────────────────────────────────────────────

  // ─── Auth Handlers ───────────────────────────────────────────
  const handleEmailSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      // Set displayName immediately so the Firestore profile picks it up
      await updateProfile(user, { displayName: name.trim() });
      // onAuthStateChanged fires automatically — no manual store update needed
    } catch (e: any) {
      Alert.alert('Sign Up Failed', friendlyError(e.code ?? ''));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // onAuthStateChanged fires automatically
    } catch (e: any) {
      Alert.alert('Login Failed', friendlyError(e.code ?? ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!GOOGLE_CONFIGURED) {
      Alert.alert(
        'Google Sign-In Not Set Up',
        'To enable Google Sign-In:\n\n1. Firebase Console → Authentication → Sign-in method → enable Google\n2. Copy the Web Client ID shown there\n3. Paste it into LoginScreen.tsx as GOOGLE_WEB_CLIENT_ID\n4. Set GOOGLE_CONFIGURED = true'
      );
      return;
    }

    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        // On web: Firebase's signInWithPopup uses its own authorized redirect URI — no mismatch
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        // onAuthStateChanged fires automatically and navigates away
      } else {
        // On iOS/Android: use expo-auth-session
        if (!request) {
          Alert.alert('Google Sign-In Unavailable', 'Could not initialise Google Sign-In. Please try again.');
          return;
        }
        await promptAsync();
        // Native result handled in the useEffect below — don't reset loading here
        return;
      }
    } catch (e: any) {
      Alert.alert('Google Sign-In Error', friendlyError(e.code ?? ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
      // onAuthStateChanged fires automatically
    } catch (e: any) {
      Alert.alert('Guest Login Failed', friendlyError(e.code ?? '') + '\n\n' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };
  // ─────────────────────────────────────────────────────────────

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setErrors({});
    setShowPassword(false);
  };

  const switchMode = (newMode: Mode) => {
    resetForm();
    setMode(newMode);
  };

  // ─── Email/Password Form ──────────────────────────────────────
  if (mode === 'login' || mode === 'signup') {
    const isSignup = mode === 'signup';
    return (
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80' }}
        style={styles.container}
      >
        <View style={styles.overlay}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
              {/* Back */}
              <TouchableOpacity style={styles.backButton} onPress={() => switchMode('landing')}>
                <Ionicons name="arrow-back" size={22} color={colors.white} />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>

              {/* Header */}
              <View style={styles.formHeader}>
                <View style={styles.iconWrapper}>
                  <Ionicons name="restaurant" size={32} color="#B43015" />
                </View>
                <Text style={styles.title}>RecipeVerse</Text>
                <Text style={styles.subtitle}>
                  {isSignup ? 'Create your account' : 'Welcome back, chef!'}
                </Text>
              </View>

              {/* Card */}
              <View style={styles.formCard}>
                {/* Name (signup only) */}
                {isSignup && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <View style={[styles.inputWrapper, errors.name ? styles.inputError : null]}>
                      <Ionicons name="person-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="John Doe"
                        placeholderTextColor={colors.textSecondary}
                        value={name}
                        onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }}
                        autoCapitalize="words"
                        returnKeyType="next"
                      />
                    </View>
                    {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
                  </View>
                )}

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={[styles.inputWrapper, errors.email ? styles.inputError : null]}>
                    <Ionicons name="mail-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor={colors.textSecondary}
                      value={email}
                      onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      returnKeyType="next"
                    />
                  </View>
                  {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
                    <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Min. 6 characters"
                      placeholderTextColor={colors.textSecondary}
                      value={password}
                      onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
                      secureTextEntry={!showPassword}
                      returnKeyType="done"
                      onSubmitEditing={isSignup ? handleEmailSignup : handleEmailLogin}
                    />
                    <TouchableOpacity onPress={() => setShowPassword((s) => !s)} style={styles.eyeButton}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                </View>

                {/* Primary CTA */}
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={isSignup ? handleEmailSignup : handleEmailLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {isSignup ? 'Create Account' : 'Log In'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google */}
                <TouchableOpacity
                  style={[styles.button, styles.googleButton, loading && styles.buttonDisabled]}
                  onPress={handleGoogleLogin}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <Ionicons name="logo-google" size={20} color="#3A2A2A" />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </TouchableOpacity>

                {/* Switch mode */}
                <TouchableOpacity
                  style={styles.switchModeContainer}
                  onPress={() => switchMode(isSignup ? 'login' : 'signup')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.switchModeText}>
                    {isSignup ? "Already have an account? " : "Don't have an account? "}
                    <Text style={styles.switchModeHighlight}>
                      {isSignup ? 'Log In' : 'Sign Up'}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </ImageBackground>
    );
  }

  // ─── Landing Page ─────────────────────────────────────────────
  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80' }}
      style={styles.container}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.logoGroup}>
            <View style={styles.iconWrapper}>
              <Ionicons name="restaurant" size={40} color="#B43015" />
            </View>
            <Text style={styles.title}>RecipeVerse</Text>
            <Text style={styles.subtitle}>Where Flavors Meet Community</Text>
          </View>

          <View style={styles.bottomSection}>
            <View style={styles.buttonContainer}>
              {/* Google */}
              <TouchableOpacity
                style={[styles.button, styles.googleButton, loading && styles.buttonDisabled]}
                onPress={handleGoogleLogin}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#3A2A2A" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={24} color={colors.text} />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Email Sign Up */}
              <TouchableOpacity
                style={[styles.button, styles.emailButton]}
                onPress={() => switchMode('signup')}
                activeOpacity={0.9}
              >
                <Ionicons name="mail-outline" size={22} color={colors.white} style={{ marginRight: 8 }} />
                <Text style={styles.emailButtonText}>Sign up with Email</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.loginLinkContainer}
              onPress={() => switchMode('login')}
              activeOpacity={0.8}
            >
              <Text style={styles.loginText}>
                Already have an account?{'  '}
                <Text style={styles.loginTextHighlight}>Login</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleGuestLogin} style={styles.guestButton} disabled={loading} activeOpacity={0.7}>
              <Text style={styles.guestText}>
                {loading ? 'Signing in…' : 'Continue as Guest'}
              </Text>
            </TouchableOpacity>

            <View style={styles.paginationIndicators}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', height: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.50)' },
  content: {
    flex: 1,
    paddingHorizontal: layout.spacing.xl,
    paddingTop: '35%',
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  logoGroup: { alignItems: 'center' },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1887A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: layout.spacing.m,
  },
  title: {
    fontSize: 48,
    fontFamily: fonts.inter.bold,
    color: colors.white,
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts.inter.medium,
    color: colors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  bottomSection: { alignItems: 'center', width: '100%' },
  buttonContainer: { width: '100%', gap: 14, marginBottom: layout.spacing.l },
  button: {
    flexDirection: 'row',
    height: 56,
    width: '100%',
    borderRadius: layout.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButton: { backgroundColor: colors.white, gap: 12 },
  googleButtonText: { fontSize: 16, fontFamily: fonts.inter.bold, color: '#3A2A2A' },
  emailButton: { backgroundColor: '#DE5A3D' },
  emailButtonText: { fontSize: 16, fontFamily: fonts.inter.bold, color: colors.white },
  loginLinkContainer: { marginBottom: 12 },
  loginText: { fontSize: 14, fontFamily: fonts.inter.medium, color: '#E8CFC6' },
  loginTextHighlight: { fontFamily: fonts.inter.bold, color: '#DE5A3D' },
  guestButton: { marginBottom: 28, paddingVertical: 6, paddingHorizontal: 16 },
  guestText: { fontSize: 13, fontFamily: fonts.inter.medium, color: 'rgba(255,255,255,0.6)', textDecorationLine: 'underline' },
  paginationIndicators: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { width: 24, height: 6, borderRadius: 3, backgroundColor: '#DE5A3D' },

  // Form styles
  formScroll: {
    flexGrow: 1,
    paddingHorizontal: layout.spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  backText: { fontFamily: fonts.inter.medium, color: colors.white, fontSize: 15 },
  formHeader: { alignItems: 'center', marginBottom: 28 },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontFamily: fonts.inter.semiBold, color: colors.text, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: '#FAF5F2',
    paddingHorizontal: 12,
    height: 50,
  },
  inputError: { borderColor: '#DE5A3D' },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, fontFamily: fonts.inter.regular, color: colors.text },
  eyeButton: { padding: 4 },
  errorText: { fontSize: 12, fontFamily: fonts.inter.regular, color: '#DE5A3D', marginTop: 4, marginLeft: 4 },
  primaryButton: { backgroundColor: '#DE5A3D', marginTop: 8 },
  primaryButtonText: { fontSize: 16, fontFamily: fonts.inter.bold, color: colors.white },
  buttonDisabled: { opacity: 0.7 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 12, fontFamily: fonts.inter.medium, color: colors.textSecondary },
  switchModeContainer: { marginTop: 16, alignItems: 'center' },
  switchModeText: { fontSize: 14, fontFamily: fonts.inter.medium, color: colors.textSecondary },
  switchModeHighlight: { fontFamily: fonts.inter.bold, color: '#DE5A3D' },
});
