import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { onNotificationsSnapshot } from '../../services/firestoreService';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';

interface AppHeaderProps {
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
}

export default function AppHeader({ onSearchPress, onNotificationPress }: AppHeaderProps) {
  const navigation = useNavigation<any>();
  const { profile, firebaseUser } = useAuthStore();
  const [hasUnread, setHasUnread] = React.useState(false);

  React.useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = onNotificationsSnapshot(firebaseUser.uid, (notifs) => {
      setHasUnread(notifs.some((n) => !n.read));
    });
    return unsub;
  }, [firebaseUser?.uid]);

  const displayName = profile?.displayName ?? firebaseUser?.displayName ?? 'Chef';
  const firstName = displayName.split(' ')[0];
  const avatarUri =
    profile?.photoURL ??
    firebaseUser?.photoURL ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=D04C2E&color=fff&size=100`;

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
        <View>
          <Text style={styles.greeting}>Good cooking, 👋</Text>
          <Text style={styles.name}>{firstName}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.iconButton} onPress={onSearchPress} activeOpacity={0.7}>
          <Ionicons name="search-outline" size={22} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={onNotificationPress || (() => navigation.navigate('Notifications'))} 
          activeOpacity={0.7}
        >
          {hasUnread && <View style={styles.notificationDot} />}
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.l,
    paddingTop: 56,
    paddingBottom: layout.spacing.m,
    backgroundColor: colors.background,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: '#E8CFC6',
  },
  greeting: {
    fontFamily: fonts.inter.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  name: {
    fontFamily: fonts.inter.bold,
    fontSize: 18,
    color: colors.text,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    zIndex: 1,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
});
