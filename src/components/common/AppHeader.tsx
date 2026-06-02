import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
  const { firebaseUser } = useAuthStore();
  const [hasUnread, setHasUnread] = React.useState(false);

  React.useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = onNotificationsSnapshot(firebaseUser.uid, (notifs) => {
      setHasUnread(notifs.some((n) => !n.read));
    });
    return unsub;
  }, [firebaseUser?.uid]);

  return (
    <View style={styles.headerWrapper}>
      <View style={styles.header}>
        <Text style={styles.logoText}>RecipeVerse</Text>
        
        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.iconButton} onPress={onSearchPress} activeOpacity={0.7}>
            <Ionicons name="search-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={onNotificationPress || (() => navigation.navigate('Notifications'))} 
            activeOpacity={0.7}
          >
            {hasUnread && <View style={styles.notificationDot} />}
            <Ionicons name="heart-outline" size={26} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: layout.maxContentWidth,
    paddingHorizontal: layout.spacing.m,
    paddingTop: 56, // For iOS notch, can adjust for other platforms
    paddingBottom: layout.spacing.s,
  },
  logoText: {
    fontFamily: fonts.playfair.bold,
    fontSize: 24,
    color: colors.text,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    zIndex: 1,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
});
