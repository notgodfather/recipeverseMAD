import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';
import { getChefOfTheWeek } from '../../services/firestoreService';
import { useAuthStore } from '../../store/authStore';
import type { UserProfile } from '../../types/user';

const FALLBACK_CHEF_IMAGE = 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80';

export default function ChefOfWeekBanner() {
  const navigation = useNavigation<any>();
  const { profile, firebaseUser } = useAuthStore();
  const [chef, setChef] = React.useState<UserProfile | null>(null);

  React.useEffect(() => {
    getChefOfTheWeek().then(setChef);
  }, []);

  const chefImage = chef?.photoURL || FALLBACK_CHEF_IMAGE;
  const chefName = chef?.displayName || 'Marco Rossi';
  
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
        <TouchableOpacity style={styles.storyItem} activeOpacity={0.8}>
          <View style={styles.myStoryImageContainer}>
            <Image source={{ uri: myAvatarUri }} style={styles.storyImage} />
            <View style={styles.addStoryIconContainer}>
              <Text style={styles.addStoryIcon}>+</Text>
            </View>
          </View>
          <Text style={styles.storyName} numberOfLines={1}>Your story</Text>
        </TouchableOpacity>

        {/* Featured Chef */}
        <TouchableOpacity 
          style={styles.storyItem} 
          activeOpacity={0.8}
          onPress={() => {
            if (chef?.uid) {
              navigation.navigate('Profile', { screen: 'ChefProfile', params: { chefId: chef.uid } });
            }
          }}
        >
          <View style={styles.storyRing}>
            <Image source={{ uri: chefImage }} style={styles.storyImage} />
          </View>
          <Text style={styles.storyName} numberOfLines={1}>{chefName}</Text>
        </TouchableOpacity>

        {/* Dummy stories to fill space and look like Instagram */}
        {[
          { id: '1', name: 'gordon_ramsay', img: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=200&q=80' },
          { id: '2', name: 'julia_childs', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80' },
          { id: '3', name: 'jamie_o', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80' },
        ].map((dummy) => (
          <TouchableOpacity key={dummy.id} style={styles.storyItem} activeOpacity={0.8}>
            <View style={styles.storyRing}>
              <Image source={{ uri: dummy.img }} style={styles.storyImage} />
            </View>
            <Text style={styles.storyName} numberOfLines={1}>{dummy.name}</Text>
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
    alignItems: 'center', // useful for web max-width
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
    borderColor: colors.primary, // Red ring for unseen story
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
