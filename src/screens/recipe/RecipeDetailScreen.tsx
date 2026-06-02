import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';
import { useRecipeStore } from '../../store/recipeStore';
import { useAuthStore } from '../../store/authStore';
import {
  onCommentsSnapshot,
  addComment as addCommentFn,
  deleteComment as deleteCommentFn,
  deleteRecipe as deleteRecipeFn,
  followUser as followUserFn,
  unfollowUser as unfollowUserFn,
  isFollowing as isFollowingCheck,
  Comment as FirestoreComment,
} from '../../services/firestoreService';

/** Converts a Date to a human-friendly relative time string */
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

const HeaderButton = ({ 
  icon, 
  onPress, 
  color = colors.text,
  label
}: { 
  icon: keyof typeof Ionicons.glyphMap, 
  onPress?: () => void,
  color?: string,
  label?: string | number,
}) => (
  <TouchableOpacity style={[styles.headerButton, label ? styles.headerButtonWithLabel : null]} onPress={onPress}>
    <Ionicons name={icon} size={22} color={color} />
    {label !== undefined && <Text style={[styles.headerButtonLabel, { color }]}>{label}</Text>}
  </TouchableOpacity>
);

const NutritionItem = ({ label, value, unit, color }: any) => (
  <View style={styles.nutritionItem}>
    <Text style={styles.nutritionValue}>{value}</Text>
    <Text style={styles.nutritionUnit}>{unit}</Text>
    <View style={styles.nutritionLabelContainer}>
      <Text style={styles.nutritionLabel}>{label}</Text>
      <View style={[styles.nutritionBar, { backgroundColor: color }]} />
    </View>
  </View>
);

export default function RecipeDetailScreen({ route, navigation }: any) {
  const { id } = route.params || {};
  
  const { recipes, likedRecipes, savedRecipes, toggleLike, toggleSave } = useRecipeStore();
  const { firebaseUser, profile } = useAuthStore();
  const recipe = recipes.find(r => r.id === id);

  // ── Follow state ──────────────────────────────────────────
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!firebaseUser?.uid || !recipe?.chefId || firebaseUser.uid === recipe.chefId) return;
    isFollowingCheck(firebaseUser.uid, recipe.chefId).then(setFollowing);
  }, [firebaseUser?.uid, recipe?.chefId]);

  const handleFollow = async () => {
    if (!firebaseUser?.uid || !recipe?.chefId) return;
    setFollowLoading(true);
    try {
      if (following) {
        await unfollowUserFn(firebaseUser.uid, recipe.chefId);
        setFollowing(false);
      } else {
        await followUserFn(firebaseUser.uid, recipe.chefId);
        setFollowing(true);
      }
    } catch (e) {
      console.error('Follow error:', e);
    } finally {
      setFollowLoading(false);
    }
  };

  // ── Comments state ────────────────────────────────────────
  const [comments, setComments] = useState<FirestoreComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsub = onCommentsSnapshot(id, setComments);
    return unsub;
  }, [id]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !firebaseUser?.uid || !id) return;
    setSubmittingComment(true);
    try {
      await addCommentFn(id, {
        userId: firebaseUser.uid,
        userName: profile?.displayName ?? firebaseUser.displayName ?? 'Chef',
        userAvatar: profile?.photoURL ?? firebaseUser.photoURL ?? null,
        text: commentText.trim(),
      });
      setCommentText('');
    } catch (e) {
      Alert.alert('Error', 'Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert('Delete Comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteCommentFn(id, commentId).catch(console.error),
      },
    ]);
  };

  // ── Delete recipe ─────────────────────────────────────────
  const isOwner = firebaseUser?.uid && recipe?.chefId === firebaseUser.uid;

  const handleDelete = () => {
    Alert.alert(
      'Delete Recipe',
      'This action cannot be undone. Are you sure you want to delete this recipe?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecipeFn(id);
              navigation.goBack();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete recipe.');
            }
          },
        },
      ]
    );
  };

  if (!recipe) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Recipe not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLiked = likedRecipes.includes(recipe.id);
  const isSaved = savedRecipes.includes(recipe.id);
  const formatCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n);

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        <ImageBackground
          source={{ uri: recipe.imageUri }}
          style={styles.heroImage}
        >
          <View style={styles.heroTopActions}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            {isOwner && (
              <TouchableOpacity style={styles.backButton} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.heroOverlay}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>CHEF'S CHOICE</Text>
            </View>
            <Text style={styles.title}>{recipe.title}</Text>
          </View>
        </ImageBackground>

        <View style={styles.content}>
          {/* Chef Card */}
          <View style={styles.chefCard}>
            <TouchableOpacity
              style={styles.chefInfo}
              onPress={() => {
                if (recipe.chefId && !isOwner) {
                  navigation.navigate('ChefProfile', { chefId: recipe.chefId });
                }
              }}
              activeOpacity={isOwner ? 1 : 0.7}
            >
              {recipe.chefAvatar ? (
                <Image source={{ uri: recipe.chefAvatar }} style={styles.chefAvatarImg} />
              ) : (
                <View style={styles.chefAvatar} />
              )}
              <View>
                <Text style={styles.chefName}>{recipe.chefName}</Text>
                <Text style={styles.chefTitle}>
                  {recipe.difficulty ? `${recipe.difficulty} Chef` : 'Culinary Expert'}
                </Text>
              </View>
            </TouchableOpacity>
            {!isOwner && (
              <TouchableOpacity
                style={[styles.followButton, following && styles.followingButton]}
                onPress={handleFollow}
                disabled={followLoading}
              >
                <Text style={[styles.followButtonText, following && styles.followingButtonText]}>
                  {followLoading ? '...' : following ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <HeaderButton 
              icon={isLiked ? "heart" : "heart-outline"} 
              color={isLiked ? colors.primary : colors.text}
              onPress={() => toggleLike(recipe.id, firebaseUser?.uid)}
              label={formatCount(recipe.likes || 0)}
            />
            <HeaderButton 
              icon={isSaved ? "bookmark" : "bookmark-outline"} 
              color={isSaved ? colors.primary : colors.text}
              onPress={() => toggleSave(recipe.id, firebaseUser?.uid)}
            />
            <HeaderButton 
              icon="share-social-outline" 
              onPress={async () => {
                try {
                  await Share.share({
                    message: `Check out "${recipe.title}" by ${recipe.chefName} on RecipeVerse!`,
                    url: recipe.imageUri,
                  });
                } catch (error) {
                  console.error(error);
                }
              }}
            />
          </View>

          {/* Start Cooking Button */}
          {recipe.steps && recipe.steps.length > 0 && (
            <TouchableOpacity
              style={styles.startCookingBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('CookMode', {
                steps: recipe.steps,
                ingredients: recipe.ingredients,
                title: recipe.title,
              })}
            >
              <Ionicons name="flame" size={20} color="#fff" />
              <Text style={styles.startCookingText}>Start Cooking</Text>
            </TouchableOpacity>
          )}

          {/* Nutritional Profile */}
          <View style={styles.nutritionSection}>
            <Text style={styles.sectionTitle}>Nutritional Profile</Text>
            <View style={styles.nutritionGrid}>
              <NutritionItem 
                label="CALORIES" 
                value={recipe.calories ? recipe.calories.replace(' kcal', '') : "640"} 
                unit="kcal" 
                color="#DE5A3D" 
              />
              <NutritionItem 
                label="PROTEIN" 
                value={recipe.macros?.protein || "42"} 
                unit="g" 
                color="#4CAF50" 
              />
              <NutritionItem 
                label="CARBS" 
                value={recipe.macros?.carbs || "58"} 
                unit="g" 
                color="#F1C40F" 
              />
              <NutritionItem 
                label="FAT" 
                value={recipe.macros?.fat || "18"} 
                unit="g" 
                color="#B43015" 
              />
            </View>
          </View>

          {/* Preparation Steps */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preparation</Text>
            {(recipe.steps && recipe.steps.length > 0
              ? recipe.steps
              : ['Follow the standard culinary steps to bring this masterpiece to life.']
            ).map((stepText, index) => (
              <View key={index} style={styles.stepContainer}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                </View>
                <View style={styles.stepContentBox}>
                  <Text style={styles.stepTitle}>Step {index + 1}</Text>
                  <Text style={styles.stepText}>{stepText}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {(recipe.ingredients && recipe.ingredients.length > 0
              ? recipe.ingredients
              : ['Main Element', 'Fresh Herbs', 'Specialty Spices', 'Olive Oil']
            ).map((item, index) => (
              <View key={index} style={styles.ingredientRow}>
                <View style={styles.ingredientCircle} />
                <Text style={styles.ingredientText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Pro Tip */}
          {recipe.tip ? (
            <View style={styles.proTipContainer}>
              <Text style={styles.proTipTitle}>CHEF'S TIP</Text>
              <Text style={styles.proTipText}>"{recipe.tip}"</Text>
            </View>
          ) : (
            <View style={styles.proTipContainer}>
              <Text style={styles.proTipTitle}>PRO TIP</Text>
              <Text style={styles.proTipText}>
                "Quality ingredients are the key to a great dish. Take your time and cook with passion!"
              </Text>
            </View>
          )}

          {/* ── Comments Section ──────────────────────────── */}
          <View style={styles.commentsSection}>
            <TouchableOpacity
              style={styles.commentsHeader}
              onPress={() => setShowComments(!showComments)}
              activeOpacity={0.7}
            >
              <View style={styles.commentsHeaderLeft}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
                <Text style={styles.sectionTitle}>
                  Comments ({comments.length})
                </Text>
              </View>
              <Ionicons
                name={showComments ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {showComments && (
              <>
                {/* Add comment input */}
                {firebaseUser && (
                  <View style={styles.addCommentRow}>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Add a comment..."
                      placeholderTextColor="#A08080"
                      value={commentText}
                      onChangeText={setCommentText}
                      multiline
                      maxLength={500}
                    />
                    <TouchableOpacity
                      style={[
                        styles.sendButton,
                        (!commentText.trim() || submittingComment) && styles.sendButtonDisabled,
                      ]}
                      onPress={handleAddComment}
                      disabled={!commentText.trim() || submittingComment}
                    >
                      {submittingComment ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <Ionicons name="send" size={16} color={colors.white} />
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* Comments list */}
                {comments.length === 0 ? (
                  <Text style={styles.noComments}>
                    No comments yet. Be the first to share your thoughts!
                  </Text>
                ) : (
                  comments.map((comment) => (
                    <View key={comment.id} style={styles.commentCard}>
                      <View style={styles.commentTop}>
                        {comment.userAvatar ? (
                          <Image source={{ uri: comment.userAvatar }} style={styles.commentAvatar} />
                        ) : (
                          <View style={[styles.commentAvatar, styles.commentAvatarFallback]}>
                            <Ionicons name="person" size={12} color={colors.white} />
                          </View>
                        )}
                        <View style={styles.commentMeta}>
                          <Text style={styles.commentUserName}>{comment.userName}</Text>
                          <Text style={styles.commentTime}>
                            {formatTimeAgo(comment.createdAt)}
                          </Text>
                        </View>
                        {comment.userId === firebaseUser?.uid && (
                          <TouchableOpacity
                            onPress={() => handleDeleteComment(comment.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="trash-outline" size={14} color="#B43015" />
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={styles.commentText}>{comment.text}</Text>
                    </View>
                  ))
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroImage: {
    width: '100%',
    height: 380,
    justifyContent: 'space-between',
  },
  heroTopActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: layout.spacing.l,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    padding: layout.spacing.l,
    paddingBottom: layout.spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  badge: {
    backgroundColor: colors.accent,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: layout.borderRadius.m,
    marginBottom: 12,
  },
  badgeText: {
    fontFamily: fonts.inter.bold,
    fontSize: 10,
    color: colors.text,
  },
  title: {
    fontFamily: fonts.inter.bold,
    fontSize: 32,
    color: colors.white,
    lineHeight: 38,
  },
  content: {
    backgroundColor: colors.background,
    borderTopLeftRadius: layout.borderRadius.xl,
    borderTopRightRadius: layout.borderRadius.xl,
    marginTop: -24,
    padding: layout.spacing.l,
    paddingBottom: 100,
  },
  chefCard: {
    backgroundColor: colors.surface,
    padding: layout.spacing.m,
    borderRadius: layout.borderRadius.l,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  chefInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chefAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8CFC6',
  },
  chefAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E3A5F',
  },
  chefName: {
    fontFamily: fonts.inter.bold,
    fontSize: 16,
    color: colors.text,
  },
  chefTitle: {
    fontFamily: fonts.inter.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  followButton: {
    backgroundColor: '#8FF0A4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: {
    fontFamily: fonts.inter.bold,
    fontSize: 12,
    color: '#1A5322',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: layout.spacing.m,
    justifyContent: 'flex-start',
  },
  startCookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: layout.spacing.xl,
  },
  startCookingText: {
    fontFamily: fonts.inter.bold,
    fontSize: 16,
    color: '#fff',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9DBD1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonWithLabel: {
    width: 'auto',
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 6,
  },
  headerButtonLabel: {
    fontFamily: fonts.inter.bold,
    fontSize: 12,
  },
  sectionTitle: {
    fontFamily: fonts.inter.bold,
    fontSize: 20,
    color: '#3A2A2A',
    marginBottom: layout.spacing.l,
  },
  nutritionSection: {
    backgroundColor: '#F9EDE8',
    padding: layout.spacing.l,
    borderRadius: layout.borderRadius.l,
    marginBottom: layout.spacing.xl,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    marginBottom: layout.spacing.m,
  },
  nutritionValue: {
    fontFamily: fonts.inter.bold,
    fontSize: 24,
    color: '#3A2A2A',
  },
  nutritionUnit: {
    fontFamily: fonts.inter.medium,
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  nutritionLabelContainer: {
    marginTop: 4,
  },
  nutritionLabel: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 1,
  },
  nutritionBar: {
    height: 4,
    borderRadius: 2,
    width: '80%',
  },
  section: {
    marginBottom: layout.spacing.xl,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: layout.spacing.l,
  },
  stepNumberContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F9DBD1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: layout.spacing.m,
    marginTop: 4,
  },
  stepNumber: {
    fontFamily: fonts.inter.bold,
    fontSize: 12,
    color: colors.primary,
  },
  stepContentBox: {
    flex: 1,
    backgroundColor: '#FFF2ED',
    padding: layout.spacing.m,
    borderRadius: layout.borderRadius.m,
  },
  stepTitle: {
    fontFamily: fonts.inter.bold,
    fontSize: 14,
    color: '#3A2A2A',
    marginBottom: 4,
  },
  stepText: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: '#6B4A4A',
    lineHeight: 22,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF2ED',
    padding: layout.spacing.m,
    borderRadius: layout.borderRadius.m,
    marginBottom: layout.spacing.s,
  },
  ingredientCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.white,
    marginRight: layout.spacing.m,
  },
  ingredientText: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: '#6B4A4A',
  },
  proTipContainer: {
    backgroundColor: '#FDF1D6',
    padding: layout.spacing.l,
    borderRadius: layout.borderRadius.l,
  },
  proTipTitle: {
    fontFamily: fonts.inter.bold,
    fontSize: 12,
    color: '#8B6A2A',
    letterSpacing: 1,
    marginBottom: 8,
  },
  proTipText: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: '#5C4A1A',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  // ── Follow button states ─────────────────────────────────
  followingButton: {
    backgroundColor: '#E8CFC6',
  },
  followingButtonText: {
    color: '#6B4A4A',
  },
  // ── Comments ─────────────────────────────────────────────
  commentsSection: {
    marginTop: layout.spacing.xl,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: layout.spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#E8CFC6',
  },
  commentsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addCommentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: layout.spacing.m,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#FFF2ED',
    borderRadius: layout.borderRadius.m,
    padding: layout.spacing.m,
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: colors.text,
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  noComments: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: layout.spacing.l,
  },
  commentCard: {
    backgroundColor: '#FFF8F5',
    padding: layout.spacing.m,
    borderRadius: layout.borderRadius.m,
    marginBottom: layout.spacing.s,
  },
  commentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8CFC6',
  },
  commentAvatarFallback: {
    backgroundColor: '#1E3A5F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentMeta: {
    flex: 1,
  },
  commentUserName: {
    fontFamily: fonts.inter.bold,
    fontSize: 12,
    color: colors.text,
  },
  commentTime: {
    fontFamily: fonts.inter.regular,
    fontSize: 10,
    color: colors.textSecondary,
  },
  commentText: {
    fontFamily: fonts.inter.medium,
    fontSize: 13,
    color: '#6B4A4A',
    lineHeight: 20,
    marginLeft: 36,
  },
});
