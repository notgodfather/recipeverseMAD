import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';
import { useAuthStore } from '../../store/authStore';
import { useStoryStore } from '../../store/storyStore';

export default function ChefOfWeekBanner() {
  const navigation = useNavigation<any>();
  const { profile, firebaseUser } = useAuthStore();
  const { groupedStories, initStoriesFeed } = useStoryStore();

  useEffect(() => {
    const unsubscribe = initStoriesFeed();
    return unsubscribe;
  }, []);
  
  const myAvatarUri = profile?.photoURL ?? firebaseUser?.photoURL ?? 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.displayName || 'Chef')}&background=E84040&color=fff&size=100`;

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* "Your Story" item */}
        <TouchableOpacity 
          style={styles.storyItem} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('CreateStory')}
        >
          <View style={styles.myStoryImageContainer}>
            <Image source={{ uri: myAvatarUri }} style={styles.storyImage} />
            <View style={styles.addStoryIconContainer}>
              <Text style={styles.addStoryIcon}>+</Text>
            </View>
          </View>
          <Text style={styles.storyName} numberOfLines={1}>Your story</Text>
        </TouchableOpacity>

        {/* Dynamic Stories from Firestore */}
        {groupedStories.map((group, index) => (
          <TouchableOpacity 
            key={group.userId} 
            style={styles.storyItem} 
            activeOpacity={0.8}
            onPress={() => {
              navigation.navigate('StoryViewer', { 
                storyGroups: groupedStories, 
                initialGroupIndex: index 
              });
            }}
          >
            <View style={styles.storyRing}>
              <Image source={{ uri: group.userAvatar }} style={styles.storyImage} />
            </View>
            <Text style={styles.storyName} numberOfLines={1}>
              {group.userName.toLowerCase().replace(/\s+/g, '_')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center', 
  },
  scrollContent: {
    paddingHorizontal: layout.spacing.m,
    gap: 16,
    width: '100%',
    maxWidth: layout.maxContentWidth,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
  },
  storyRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: colors.primary, 
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myStoryImageContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
    backgroundColor: colors.borderLight,
  },
  addStoryIconContainer: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addStoryIcon: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: 'bold',
  },
  storyName: {
    marginTop: 4,
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    color: colors.text,
    textAlign: 'center',
  },
});
