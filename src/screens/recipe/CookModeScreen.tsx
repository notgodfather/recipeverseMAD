import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';

const { width, height } = Dimensions.get('window');

interface CookModeProps {
  route: any;
  navigation: any;
}

export default function CookModeScreen({ route, navigation }: CookModeProps) {
  const { steps = [], ingredients = [], title = 'Recipe' } = route.params || {};
  const [currentStep, setCurrentStep] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDuration, setTimerDuration] = useState(60); // default 1 min
  const [showIngredients, setShowIngredients] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<any>(null);

  const totalSteps = steps.length;

  // Animate progress bar when step changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / totalSteps,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep, totalSteps]);

  // Timer logic
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            clearInterval(intervalRef.current);
            // Simple alert when timer is done
            if (Platform.OS === 'web') {
              window.alert('⏰ Timer is up!');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerRunning]);

  const startTimer = () => {
    setTimerSeconds(timerDuration);
    setTimerRunning(true);
  };

  const stopTimer = () => {
    setTimerRunning(false);
    setTimerSeconds(0);
    clearInterval(intervalRef.current);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      stopTimer();
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      stopTimer();
    }
  };

  if (totalSteps === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="restaurant-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No steps available for this recipe.</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.closeBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <TouchableOpacity onPress={() => setShowIngredients(!showIngredients)} style={styles.headerBtn}>
          <Ionicons name={showIngredients ? 'list' : 'list-outline'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.stepIndicator}>Step {currentStep + 1} of {totalSteps}</Text>

      {/* Main content */}
      {showIngredients ? (
        <ScrollView style={styles.ingredientsPanel} contentContainerStyle={styles.ingredientsPanelContent}>
          <Text style={styles.ingredientsTitle}>📋 Ingredients</Text>
          {ingredients.map((item: string, i: number) => (
            <View key={i} style={styles.ingredientRow}>
              <View style={styles.ingredientBullet} />
              <Text style={styles.ingredientText}>{item}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.stepContent}>
          <Text style={styles.stepNumber}>Step {currentStep + 1}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.stepText}>{steps[currentStep]}</Text>
          </ScrollView>
        </View>
      )}

      {/* Timer section */}
      <View style={styles.timerSection}>
        {timerRunning ? (
          <View style={styles.timerActive}>
            <Text style={styles.timerDisplay}>{formatTime(timerSeconds)}</Text>
            <TouchableOpacity style={styles.timerStopBtn} onPress={stopTimer}>
              <Ionicons name="stop" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.timerSetup}>
            <View style={styles.timerPresets}>
              {[30, 60, 120, 300, 600].map((secs) => (
                <TouchableOpacity
                  key={secs}
                  style={[styles.presetBtn, timerDuration === secs && styles.presetBtnActive]}
                  onPress={() => setTimerDuration(secs)}
                >
                  <Text style={[styles.presetText, timerDuration === secs && styles.presetTextActive]}>
                    {secs < 60 ? `${secs}s` : `${secs / 60}m`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.timerStartBtn} onPress={startTimer}>
              <Ionicons name="timer-outline" size={18} color="#fff" />
              <Text style={styles.timerStartText}>Start Timer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navBtn, currentStep === 0 && styles.navBtnDisabled]}
          onPress={goPrev}
          disabled={currentStep === 0}
        >
          <Ionicons name="chevron-back" size={24} color={currentStep === 0 ? '#555' : '#fff'} />
          <Text style={[styles.navBtnText, currentStep === 0 && styles.navBtnTextDisabled]}>Previous</Text>
        </TouchableOpacity>

        {currentStep === totalSteps - 1 ? (
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
            <Text style={styles.doneBtnText}>Done!</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.navBtnNext} onPress={goNext}>
            <Text style={styles.navBtnNextText}>Next</Text>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 16,
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  stepIndicator: {
    fontFamily: fonts.inter.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  stepNumber: {
    fontFamily: fonts.inter.bold,
    fontSize: 14,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  stepText: {
    fontFamily: fonts.inter.regular,
    fontSize: 24,
    color: '#fff',
    lineHeight: 36,
  },
  // Ingredients panel
  ingredientsPanel: {
    flex: 1,
    paddingHorizontal: 24,
  },
  ingredientsPanelContent: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  ingredientsTitle: {
    fontFamily: fonts.inter.bold,
    fontSize: 20,
    color: '#fff',
    marginBottom: 20,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  ingredientBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 14,
  },
  ingredientText: {
    fontFamily: fonts.inter.regular,
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
  },
  // Timer
  timerSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  timerSetup: {
    gap: 12,
  },
  timerPresets: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  presetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  presetBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetText: {
    fontFamily: fonts.inter.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  presetTextActive: {
    color: '#fff',
  },
  timerStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  timerStartText: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 14,
    color: '#fff',
  },
  timerActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  timerDisplay: {
    fontFamily: fonts.inter.bold,
    fontSize: 48,
    color: colors.primary,
    letterSpacing: 4,
  },
  timerStopBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E84040',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Navigation
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 8,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 6,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navBtnText: {
    fontFamily: fonts.inter.medium,
    fontSize: 15,
    color: '#fff',
  },
  navBtnTextDisabled: {
    color: '#555',
  },
  navBtnNext: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    gap: 6,
  },
  navBtnNextText: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 15,
    color: '#fff',
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    gap: 8,
  },
  doneBtnText: {
    fontFamily: fonts.inter.bold,
    fontSize: 15,
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontFamily: fonts.inter.medium,
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
  },
  closeBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  closeBtnText: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 14,
    color: '#fff',
  },
});
