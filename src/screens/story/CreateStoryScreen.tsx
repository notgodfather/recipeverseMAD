import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';
import { useStoryStore } from '../../store/storyStore';
import { useAuthStore } from '../../store/authStore';

export default function CreateStoryScreen({ navigation }: any) {
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addStory } = useStoryStore();
  const { profile, firebaseUser } = useAuthStore();

  const handlePost = async () => {
    if (!imageUrl.trim()) {
      if (Platform.OS === 'web') window.alert('Please enter an image URL');
      else Alert.alert('Error', 'Please enter an image URL');
      return;
    }
    
    if (!firebaseUser?.uid) {
      if (Platform.OS === 'web') window.alert('You must be logged in to post a story');
      else Alert.alert('Error', 'You must be logged in to post a story');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const displayName = profile?.displayName ?? firebaseUser.displayName ?? 'Chef';
      const userAvatar = profile?.photoURL ?? firebaseUser.photoURL ?? 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=EFEFEF&color=262626&size=100`;

      await addStory(firebaseUser.uid, displayName, userAvatar, imageUrl);
      navigation.goBack();
    } catch (error) {
      if (Platform.OS === 'web') window.alert('Failed to post story');
      else Alert.alert('Error', 'Failed to post story');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Story</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="image-outline" size={64} color={colors.textSecondary} />
        </View>
        
        <Text style={styles.title}>Add a photo to your story</Text>
        <Text style={styles.subtitle}>Paste an image URL below to share a moment with your followers. It will disappear after 24 hours.</Text>
        
        <TextInput
          style={styles.input}
          placeholder="https://example.com/image.jpg"
          placeholderTextColor={colors.textSecondary}
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity 
          style={[styles.button, !imageUrl.trim() && styles.buttonDisabled]} 
          activeOpacity={0.8}
          onPress={handlePost}
          disabled={!imageUrl.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Post Story</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontFamily: fonts.inter.bold,
    fontSize: 16,
    color: colors.text,
  },
  iconButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: layout.spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingBottom: 100,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.inter.bold,
    fontSize: 22,
    color: colors.text,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: fonts.inter.regular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  input: {
    width: '100%',
    backgroundColor: colors.borderLight,
    borderRadius: 8,
    padding: 16,
    fontFamily: fonts.inter.regular,
    fontSize: 16,
    color: colors.text,
    marginBottom: 24,
  },
  button: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: fonts.inter.bold,
    fontSize: 16,
    color: colors.white,
  },
});
