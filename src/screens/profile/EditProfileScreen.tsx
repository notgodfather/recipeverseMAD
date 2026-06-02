import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { updateUserProfile } from '../../services/firestoreService';
import { uploadImageToStorage } from '../../services/storageService';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';

export default function EditProfileScreen({ navigation }: any) {
  const { profile, firebaseUser, refreshProfile } = useAuthStore();

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [specialty, setSpecialty] = useState(profile?.specialty ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.photoURL ?? null);
  const [newAvatarLocal, setNewAvatarLocal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewAvatarLocal(result.assets[0].uri);
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!firebaseUser) return;
    if (!displayName.trim()) {
      Alert.alert('Validation', 'Display name is required.');
      return;
    }

    setSaving(true);
    try {
      let photoURL = profile?.photoURL ?? null;

      // Upload new avatar if user picked one
      if (newAvatarLocal) {
        photoURL = await uploadImageToStorage(
          newAvatarLocal,
          `avatars/${firebaseUser.uid}/profile.jpg`
        );
      }

      await updateUserProfile(firebaseUser.uid, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        specialty: specialty.trim(),
        photoURL,
      });

      // Refresh profile in auth store so all screens update
      await refreshProfile();
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Save Failed', e.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const displayAvatar =
    avatarUri ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'Chef')}&background=D04C2E&color=fff&size=200`;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <TouchableOpacity style={styles.avatarSection} onPress={pickImage} activeOpacity={0.8}>
            <Image source={{ uri: displayAvatar }} style={styles.avatar} />
            <View style={styles.avatarOverlay}>
              <Ionicons name="camera" size={20} color={colors.white} />
            </View>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>

          {/* Fields */}
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Display Name *</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor="#B09090"
                maxLength={50}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Specialty</Text>
              <TextInput
                style={styles.input}
                value={specialty}
                onChangeText={setSpecialty}
                placeholder="e.g. Italian Cuisine, Pastry Chef"
                placeholderTextColor="#B09090"
                maxLength={60}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell the community about yourself..."
                placeholderTextColor="#B09090"
                multiline
                maxLength={300}
              />
              <Text style={styles.charCount}>{bio.length}/300</Text>
            </View>
          </View>

          {/* Account Info (read-only) */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>Email</Text>
              <Text style={styles.readOnlyValue}>{profile?.email ?? firebaseUser?.email ?? 'N/A'}</Text>
            </View>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>Member since</Text>
              <Text style={styles.readOnlyValue}>
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: layout.spacing.l,
    paddingBottom: layout.spacing.m,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fonts.inter.bold,
    fontSize: 18,
    color: colors.text,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 72,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontFamily: fonts.inter.bold,
    fontSize: 14,
    color: colors.white,
  },
  scrollContent: {
    padding: layout.spacing.l,
    paddingBottom: 60,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: layout.spacing.xl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8CFC6',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 80,
    right: '38%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  changePhotoText: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 13,
    color: colors.primary,
    marginTop: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius.l,
    padding: layout.spacing.l,
    marginBottom: layout.spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: layout.spacing.l,
  },
  inputLabel: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 13,
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FAF5F2',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: layout.spacing.m,
    fontFamily: fonts.inter.medium,
    fontSize: 15,
    color: colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: fonts.inter.bold,
    fontSize: 16,
    color: colors.text,
    marginBottom: layout.spacing.m,
  },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2E8E4',
  },
  readOnlyLabel: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  readOnlyValue: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 14,
    color: colors.text,
  },
});
