import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';

interface MacroBadgeProps {
  label: string;
  value: string;
  unit: string;
  color?: string;
}

const MacroBadge = ({ label, value, unit, color = '#2E7D32' }: MacroBadgeProps) => (
  <View style={styles.macroBadge}>
    <Text style={styles.macroLabel}>{label}</Text>
    <Text style={[styles.macroValue, { color }]}>{value}{unit}</Text>
  </View>
);

interface RecipeCardProps {
  imageUri: string;
  chefAvatar?: string;
  title: string;
  chefName: string;
  rating: number;
  likes: number | string;
  comments: number | string;
  macros: { carbs: number; protein: number; fat: number };
  tags?: string[];
  isLiked?: boolean;
  isSaved?: boolean;
  onLikePress?: () => void;
  onSavePress?: () => void;
}

export default function RecipeCard({
  imageUri,
  chefAvatar,
  title,
  chefName,
  rating,
  likes,
  comments,
  macros,
  tags,
  isLiked,
  isSaved,
  onLikePress,
  onSavePress,
}: RecipeCardProps) {
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleLike = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 50 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
    onLikePress?.();
  };

  const formatCount = (n: number | string) =>
    typeof n === 'number' && n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n;

  return (
    <View style={styles.container}>
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        {/* Rating pill */}
        <View style={styles.ratingPill}>
          <Ionicons name="star" size={12} color="#F5A623" />
          <Text style={styles.ratingText}>{rating}</Text>
        </View>
        {/* Save button on image */}
        <TouchableOpacity style={styles.saveOnImage} onPress={onSavePress} activeOpacity={0.8}>
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={isSaved ? colors.primary : colors.white}
          />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.infoRow}>
        {/* Avatar */}
        {chefAvatar ? (
          <Image source={{ uri: chefAvatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Ionicons name="person" size={14} color={colors.white} />
          </View>
        )}

        <View style={styles.infoText}>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          <Text style={styles.chefName}>by {chefName}</Text>
        </View>

        {/* Like button */}
        <TouchableOpacity style={styles.likeColumn} onPress={handleLike} activeOpacity={0.7}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={isLiked ? '#DE5A3D' : '#9E7A7A'}
            />
          </Animated.View>
          <Text style={[styles.likeCount, isLiked && styles.likeCountActive]}>
            {formatCount(likes)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tags + comments row */}
      <View style={styles.bottomRow}>
        {/* Tags */}
        <View style={styles.tagsRow}>
          {(tags ?? []).slice(0, 2).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        {/* Comments */}
        <View style={styles.commentsRow}>
          <Ionicons name="chatbubble-outline" size={14} color="#9E7A7A" />
          <Text style={styles.commentsText}>{formatCount(comments)}</Text>
        </View>
      </View>

      {/* Macros */}
      <View style={styles.macrosRow}>
        <MacroBadge label="Carbs" value={macros.carbs.toString()} unit="g" color="#D84315" />
        <MacroBadge label="Protein" value={macros.protein.toString()} unit="g" color="#2E7D32" />
        <MacroBadge label="Fat" value={macros.fat.toString()} unit="g" color="#9E9D24" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: layout.spacing.xl,
    marginHorizontal: layout.spacing.m,
  },
  imageContainer: {
    height: 230,
    borderRadius: layout.borderRadius.l,
    overflow: 'hidden',
    backgroundColor: '#E8CFC6',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ratingPill: {
    position: 'absolute',
    top: 12,
    left: 12,
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
  saveOnImage: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarFallback: {
    backgroundColor: '#1E3A5F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.inter.bold,
    fontSize: 18,
    color: '#3D2020',
    marginBottom: 3,
    lineHeight: 24,
  },
  chefName: {
    fontFamily: fonts.inter.medium,
    fontSize: 12,
    color: '#9E7A7A',
  },
  likeColumn: {
    alignItems: 'center',
    gap: 3,
  },
  likeCount: {
    fontFamily: fonts.inter.bold,
    fontSize: 11,
    color: '#9E7A7A',
  },
  likeCountActive: {
    color: '#DE5A3D',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
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
  commentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentsText: {
    fontFamily: fonts.inter.medium,
    fontSize: 12,
    color: '#9E7A7A',
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  macroBadge: {
    flexDirection: 'row',
    backgroundColor: '#F9EBE6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    alignItems: 'center',
  },
  macroLabel: {
    fontFamily: fonts.inter.medium,
    fontSize: 11,
    color: '#6B4A4A',
  },
  macroValue: {
    fontFamily: fonts.inter.bold,
    fontSize: 12,
  },
});
