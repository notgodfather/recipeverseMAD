import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../store/themeStore';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';
import { useAuthStore } from '../../store/authStore';
import { useStoryStore } from '../../store/storyStore';

export default function ChefOfWeekBanner() {
  const navigation = useNavigation<any>();
  const { profile, firebaseUser } = useAuthStore();
  const { groupedStories, initStoriesFeed } = useStoryStore();
  const theme = useTheme();

  useEffect(() => {
    const unsubscribe = initStoriesFeed();
    return unsubscribe;
  }, []);
  
  const myAvatarUri = profile?.photoURL ?? firebaseUser?.photoURL ?? 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.displayName || 'Chef')}&background=E84040&color=fff&size=100`;

  return (
    <View style={[styles.container, { backgroundColor: theme.background, borderBottomColor: theme.borderLight }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity 
          style={styles.storyItem} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('CreateStory')}
        >
          <View style={styles.myStoryImageContainer}>
            <Image source={{ uri: myAvatarUri }} style={[styles.storyImage, { backgroundColor: theme.borderLight }]} />
            <View style={[styles.addStoryIconContainer, { borderColor: theme.background }]}>
              <Text style={styles.addStoryIcon}>+</Text>
            </View>
          </View>
          <Text style={[styles.storyName, { color: theme.text }]} numberOfLines={1}>Your story</Text>
        </TouchableOpacity>

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
              <Image source={{ uri: group.userAvatar }} style={[styles.storyImage, { backgroundColor: theme.borderLight }]} />
            </View>
            <Text style={[styles.storyName, { color: theme.text }]} numberOfLines={1}>
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
    borderBottomWidth: 0.5,
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
  storyItem: { alignItems: 'center', width: 72 },
  storyRing: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2, borderColor: '#E84040',
    padding: 3, justifyContent: 'center', alignItems: 'center',
  },
  myStoryImageContainer: {
    width: 72, height: 72, borderRadius: 36,
    padding: 3, justifyContent: 'center', alignItems: 'center',
  },
  storyImage: { width: '100%', height: '100%', borderRadius: 33 },
  addStoryIconContainer: {
    position: 'absolute', bottom: 2, right: 2,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#E84040', borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  addStoryIcon: { color: '#fff', fontSize: 14, lineHeight: 16, fontWeight: 'bold' },
  storyName: { marginTop: 4, fontFamily: fonts.inter.regular, fontSize: 11, textAlign: 'center' },
});
