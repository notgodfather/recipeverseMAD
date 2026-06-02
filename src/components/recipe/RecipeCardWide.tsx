import React, { useRef } from 'react';
import { View, Text, StyleSheet, ImageBackground, Image, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';

interface RecipeCardWideProps {
  imageUri: string;
  chefAvatar?: string;
  title: string;
  chefName: string;
  rating: number;
  description: string;
  prepTime: string;
  difficulty: string;
  calories: string;
  tags?: string[];
  likes?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  onLikePress?: () => void;
  onSavePress?: () => void;
  onViewPress?: () => void;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: '#2E7D32',
  Medium: '#F57C00',
  Pro: '#B43015',
};

export default function RecipeCardWide({
  imageUri,
  chefAvatar,
  title,
  chefName,
  rating,
  description,
  prepTime,
  difficulty,
  calories,
  tags,
  likes = 0,
  isLiked,
  isSaved,
  onLikePress,
  onSavePress,
  onViewPress,
}: RecipeCardWideProps) {
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleLike = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 50 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
    onLikePress?.();
  };

  const diffColor = DIFFICULTY_COLOR[difficulty] ?? colors.textSecondary;
  const formatCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n);

  return (
    <View style={styles.container}>
      {/* Hero image with gradient overlay */}
      <ImageBackground
        source={{ uri: imageUri }}
        style={styles.imageBackground}
        imageStyle={styles.imageStyle}
      >
        <View style={styles.overlay}>
          {/* Top row: rating + save */}
          <View style={styles.topRow}>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={12} color="#F5A623" />
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={onSavePress} activeOpacity={0.8}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={isSaved ? colors.accent : colors.white}
              />
            </TouchableOpacity>
          </View>

          {/* Title at bottom */}
          <Text style={styles.imageTitle} numberOfLines={2}>{title}</Text>
        </View>
      </ImageBackground>

      {/* Card body */}
      <View style={styles.body}>
        {/* Chef row */}
        <View style={styles.chefRow}>
          {chefAvatar ? (
            <Image source={{ uri: chefAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="person" size={14} color={colors.white} />
            </View>
          )}
          <View>
            <Text style={styles.chefName}>{chefName}</Text>
            <Text style={styles.chefLabel}>Recipe Author</Text>
          </View>
          {/* Tags */}
          <View style={styles.tagsRow}>
            {(tags ?? []).slice(0, 1).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.description} numberOfLines={3}>{description}</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <View>
              <Text style={styles.statLabel}>PREP TIME</Text>
              <Text style={styles.statValue}>{prepTime}</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="flame-outline" size={16} color={diffColor} />
            <View>
              <Text style={styles.statLabel}>DIFFICULTY</Text>
              <Text style={[styles.statValue, { color: diffColor }]}>{difficulty}</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="nutrition-outline" size={16} color={colors.textSecondary} />
            <View>
              <Text style={styles.statLabel}>CALORIES</Text>
              <Text style={styles.statValue}>{calories}</Text>
            </View>
          </View>
        </View>

        {/* Action row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.iconButton} onPress={handleLike} activeOpacity={0.7}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={20}
                color={isLiked ? '#DE5A3D' : '#8A5A4A'}
              />
            </Animated.View>
            <Text style={[styles.likeCount, isLiked && styles.likeCountActive]}>
              {formatCount(likes)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.viewButton} onPress={onViewPress} activeOpacity={0.85}>
            <Text style={styles.viewButtonText}>VIEW FULL RECIPE</Text>
            <View style={styles.viewButtonFab}>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: layout.spacing.m,
    marginBottom: layout.spacing.xxl,
    borderRadius: layout.borderRadius.xl,
    backgroundColor: colors.surface,
    shadowColor: '#3D2020',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    overflow: 'hidden',
  },
  imageBackground: {
    height: 240,
    justifyContent: 'flex-end',
  },
  imageStyle: {
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    padding: layout.spacing.m,
    justifyContent: 'space-between',
    background: 'transparent',
    backgroundImage: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
    backgroundColor: 'transparent',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingPill: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  ratingText: {
    fontFamily: fonts.inter.bold,
    fontSize: 12,
    color: '#3A2A2A',
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageTitle: {
    color: colors.white,
    fontFamily: fonts.playfair.bold,
    fontSize: 26,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    lineHeight: 34,
  },
  body: {
    padding: layout.spacing.m,
  },
  chefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F9EBE6',
  },
  avatarFallback: {
    backgroundColor: '#1F3438',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chefName: {
    fontFamily: fonts.inter.bold,
    fontSize: 14,
    color: colors.text,
  },
  chefLabel: {
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  tagsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  tag: {
    backgroundColor: '#F9EBE6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 11,
    color: '#B43015',
  },
  description: {
    fontFamily: fonts.inter.medium,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5F2',
    borderRadius: layout.borderRadius.m,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E8CFC6',
  },
  statLabel: {
    fontFamily: fonts.inter.bold,
    fontSize: 9,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  statValue: {
    fontFamily: fonts.inter.bold,
    fontSize: 12,
    color: colors.text,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9DBD1',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 6,
  },
  likeCount: {
    fontFamily: fonts.inter.bold,
    fontSize: 12,
    color: '#8A5A4A',
  },
  likeCountActive: {
    color: '#DE5A3D',
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B43015',
    height: 44,
    borderRadius: 22,
    paddingLeft: 20,
    overflow: 'hidden',
  },
  viewButtonText: {
    flex: 1,
    color: colors.white,
    fontFamily: fonts.inter.bold,
    fontSize: 11,
    letterSpacing: 1,
  },
  viewButtonFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DE5A3D',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -22,
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
