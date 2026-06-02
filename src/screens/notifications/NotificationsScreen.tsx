import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import {
  AppNotification,
  onNotificationsSnapshot,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../services/firestoreService';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationsScreen({ navigation }: any) {
  const { firebaseUser } = useAuthStore();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = onNotificationsSnapshot(firebaseUser.uid, (notifs) => {
      setNotifications(notifs);
    });
    return unsub;
  }, [firebaseUser?.uid]);

  // Mark all as read when leaving the screen
  useEffect(() => {
    return () => {
      if (firebaseUser?.uid && notifications.length > 0) {
        markAllNotificationsAsRead(firebaseUser.uid, notifications);
      }
    };
  }, [firebaseUser?.uid, notifications]);

  const handleNotificationPress = (notif: AppNotification) => {
    if (firebaseUser?.uid && !notif.read) {
      markNotificationAsRead(firebaseUser.uid, notif.id);
    }
    
    if (notif.type === 'follow') {
      navigation.navigate('ChefProfile', { chefId: notif.sourceUserId });
    } else if (notif.recipeId) {
      navigation.navigate('RecipeDetail', { id: notif.recipeId });
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    let icon = 'notifications';
    let iconColor = colors.primary;
    let message = '';

    if (item.type === 'like') {
      icon = 'heart';
      iconColor = '#FF6B6B';
      message = `liked your recipe "${item.recipeTitle}"`;
    } else if (item.type === 'comment') {
      icon = 'chatbubble';
      iconColor = '#8A5A4A';
      message = `commented on "${item.recipeTitle}": "${item.text}"`;
    } else if (item.type === 'follow') {
      icon = 'person-add';
      iconColor = '#2E7D32';
      message = `started following you`;
    }

    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.read && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {item.sourceUserAvatar ? (
            <Image source={{ uri: item.sourceUserAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.fallbackAvatar]}>
              <Ionicons name="person" size={16} color={colors.white} />
            </View>
          )}
          <View style={[styles.iconBadge, { backgroundColor: iconColor }]}>
            <Ionicons name={icon as any} size={10} color={colors.white} />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.messageText}>
            <Text style={styles.boldText}>{item.sourceUserName}</Text> {message}
          </Text>
          <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
        </View>

        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={48} color="#E8CFC6" />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>
            When people like, comment, or follow you, you'll see it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.spacing.l,
    paddingTop: 60,
    paddingBottom: layout.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0DB',
    backgroundColor: colors.surface,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: fonts.inter.bold,
    fontSize: 18,
    color: colors.text,
  },
  listContent: {
    padding: layout.spacing.m,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: layout.spacing.m,
    borderRadius: layout.borderRadius.m,
    marginBottom: 10,
    gap: 12,
  },
  unreadCard: {
    backgroundColor: '#FFF2ED',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8CFC6',
  },
  fallbackAvatar: {
    backgroundColor: '#8A5A4A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  messageText: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  boldText: {
    fontFamily: fonts.inter.bold,
  },
  timeText: {
    fontFamily: fonts.inter.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: -50,
  },
  emptyTitle: {
    fontFamily: fonts.inter.bold,
    fontSize: 18,
    color: colors.text,
    marginTop: layout.spacing.m,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
