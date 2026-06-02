import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Animated, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { UserStoryGroup } from '../../types/story';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story

export default function StoryViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const storyGroups: UserStoryGroup[] = route.params?.storyGroups || [];
  const initialGroupIndex = route.params?.initialGroupIndex || 0;

  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  
  const progressAnim = useRef(new Animated.Value(0)).current;

  const currentGroup = storyGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];

  useEffect(() => {
    if (!currentStory) {
      navigation.goBack();
      return;
    }

    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        goToNext();
      }
    });

    return () => progressAnim.stopAnimation();
  }, [currentGroupIndex, currentStoryIndex, currentStory]);

  const goToNext = () => {
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else if (currentGroupIndex < storyGroups.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
      setCurrentStoryIndex(0);
    } else {
      navigation.goBack();
    }
  };

  const goToPrev = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else if (currentGroupIndex > 0) {
      const prevGroup = storyGroups[currentGroupIndex - 1];
      setCurrentGroupIndex(currentGroupIndex - 1);
      setCurrentStoryIndex(prevGroup.stories.length - 1);
    } else {
      // At the very beginning, just restart the first story's progress
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: STORY_DURATION,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) goToNext();
      });
    }
  };

  const handlePress = (evt: any) => {
    const x = evt.nativeEvent.locationX;
    if (x < width / 3) {
      goToPrev();
    } else {
      goToNext();
    }
  };

  if (!currentGroup || !currentStory) return null;

  return (
    <View style={styles.container}>
      {Platform.OS !== 'web' && <StatusBar hidden />}
      
      {/* Background Image */}
      <Image source={{ uri: currentStory.imageUri }} style={styles.image} resizeMode="cover" />

      {/* Tap zones overlay */}
      <TouchableOpacity 
        style={styles.tapZone} 
        activeOpacity={1} 
        onPress={handlePress}
      />

      {/* Top UI Overlay */}
      <View style={styles.topOverlay}>
        {/* Progress Bars */}
        <View style={styles.progressRow}>
          {currentGroup.stories.map((s, i) => (
            <View key={s.id} style={styles.progressBarContainer}>
              {i === currentStoryIndex && (
                <Animated.View 
                  style={[
                    styles.progressBarFill, 
                    { width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%']
                      }) 
                    }
                  ]} 
                />
              )}
              {i < currentStoryIndex && <View style={[styles.progressBarFill, { width: '100%' }]} />}
            </View>
          ))}
        </View>

        {/* Header (Avatar, Name, Close) */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={{ uri: currentGroup.userAvatar }} style={styles.avatar} />
            <Text style={styles.username}>{currentGroup.userName.toLowerCase().replace(/\s+/g, '_')}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tapZone: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  topOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 0,
    right: 0,
    zIndex: 2,
    paddingHorizontal: 12,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  progressBarContainer: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  username: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 14,
    color: colors.white,
    textShadow: '0px 1px 2px rgba(0,0,0,0.5)',
  },
  closeButton: {
    padding: 4,
  },
});
