import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';

interface RecipeCardProps {
  imageUri: string;
  chefAvatar?: string;
  title: string;
  chefName: string;
  rating?: number;
  likes: number | string;
  comments: number | string;
  macros?: { carbs: number; protein: number; fat: number };
  tags?: string[];
  isLiked?: boolean;
  isSaved?: boolean;
  onLikePress?: () => void;
  onSavePress?: () => void;
  onViewPress?: () => void;
  description?: string;
}

export default function RecipeCard({
  imageUri,
  chefAvatar,
  title,
  chefName,
  likes,
  comments,
  isLiked,
  isSaved,
  onLikePress,
  onSavePress,
  onViewPress,
  description,
}: RecipeCardProps) {
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleLike = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.3, useNativeDriver: true, speed: 50 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
    onLikePress?.();
  };

  const formatCount = (n: number | string) => {
    if (typeof n === 'number') {
      return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    return n;
  };

  const avatarSrc = chefAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chefName)}&background=EFEFEF&color=262626&size=100`;

  return (
    <View style={styles.container}>
      {/* Post Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: avatarSrc }} style={styles.avatar} />
          <Text style={styles.chefNameHeader}>{chefName.toLowerCase().replace(/\s+/g, '_')}</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Image */}
      <TouchableOpacity activeOpacity={1} onPress={onViewPress}>
        <Image source={{ uri: imageUri }} style={styles.image} />
      </TouchableOpacity>

      {/* Actions Row */}
      <View style={styles.actionsRow}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity onPress={handleLike} activeOpacity={0.7} style={styles.actionIcon}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={28}
                color={isLiked ? colors.primary : colors.text}
              />
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={onViewPress}>
            <Ionicons name="chatbubble-outline" size={26} color={colors.text} style={{ transform: [{ scaleX: -1 }] }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}>
            <Ionicons name="paper-plane-outline" size={26} color={colors.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onSavePress} activeOpacity={0.7} style={styles.actionIconRight}>
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={26}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Likes */}
      <Text style={styles.likesText}>{formatCount(likes)} likes</Text>

      {/* Caption */}
      <View style={styles.captionContainer}>
        <Text style={styles.captionText}>
          <Text style={styles.captionUsername}>{chefName.toLowerCase().replace(/\s+/g, '_')} </Text>
          {title} {description ? `- ${description}` : ''}
        </Text>
      </View>

      {/* Comments link */}
      <TouchableOpacity onPress={onViewPress}>
        <Text style={styles.viewCommentsText}>View all {formatCount(comments)} comments</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    marginBottom: 16,
    width: '100%',
    alignSelf: 'center',
    maxWidth: layout.maxContentWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    borderColor: colors.borderLight,
  },
  chefNameHeader: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 14,
    color: colors.text,
  },
  moreButton: {
    padding: 4,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 5, // Instagram portrait ratio
    resizeMode: 'cover',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconRight: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -4, // optical alignment
  },
  likesText: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 14,
    color: colors.text,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  captionContainer: {
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  captionUsername: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 14,
    color: colors.text,
  },
  captionText: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.text,
    lineHeight: 18,
  },
  viewCommentsText: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
});
