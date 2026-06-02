import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { layout } from '../../constants/layout';
import { getChefOfTheWeek } from '../../services/firestoreService';
import type { UserProfile } from '../../types/user';

const FALLBACK_CHEF_IMAGE = 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=800&q=80';

export default function ChefOfWeekBanner() {
  const navigation = useNavigation<any>();
  const [chef, setChef] = React.useState<UserProfile | null>(null);

  React.useEffect(() => {
    getChefOfTheWeek().then(setChef);
  }, []);

  const bgImage = chef?.photoURL || FALLBACK_CHEF_IMAGE;
  const chefName = chef?.displayName || 'Marco Rossi';
  const chefBio = chef?.bio || chef?.specialty || 'Bringing the authentic soul of Tuscany to your home kitchen.';

  return (
    <View style={styles.wrapper}>
      <ImageBackground
        source={{ uri: bgImage }}
        style={styles.container}
        imageStyle={styles.image}
      >
        <View style={styles.overlay}>
          {/* Badge */}
          <View style={styles.badge}>
            <Ionicons name="trophy" size={10} color="#3A2A2A" />
            <Text style={styles.badgeText}>CHEF OF THE WEEK</Text>
          </View>

          {/* Name block */}
          <View style={styles.textBlock}>
            <Text style={styles.meetText}>Meet Chef</Text>
            <Text style={styles.chefName}>{chefName}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {chefBio}
            </Text>

            {/* CTA */}
            <TouchableOpacity 
              style={styles.button} 
              activeOpacity={0.85}
              onPress={() => {
                if (chef?.uid) {
                  navigation.navigate('ChefProfile', { chefId: chef.uid });
                }
              }}
            >
              <Text style={styles.buttonText}>View Profile</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: layout.spacing.m,
    marginBottom: layout.spacing.l,
    borderRadius: layout.borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#3D2020',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  container: {
    height: 200,
    justifyContent: 'flex-end',
  },
  image: {
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    padding: layout.spacing.l,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(20, 10, 5, 0.5)',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accent,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: layout.borderRadius.m,
  },
  badgeText: {
    fontFamily: fonts.inter.bold,
    fontSize: 9,
    color: '#3A2A2A',
    letterSpacing: 1,
  },
  textBlock: {
    gap: 4,
  },
  meetText: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  chefName: {
    fontFamily: fonts.playfair.bold,
    fontSize: 28,
    color: colors.white,
    fontStyle: 'italic',
  },
  description: {
    fontFamily: fonts.inter.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 18,
    marginBottom: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DE5A3D',
    alignSelf: 'flex-start',
    paddingHorizontal: layout.spacing.l,
    paddingVertical: 10,
    borderRadius: layout.borderRadius.round,
  },
  buttonText: {
    fontFamily: fonts.inter.bold,
    color: colors.white,
    fontSize: 13,
  },
});
