import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';

interface CategoryChipProps {
  label: string;
  isActive?: boolean;
  onPress?: () => void;
}

export default function CategoryChip({ label, isActive, onPress }: CategoryChipProps) {
  return (
    <TouchableOpacity 
      style={[styles.container, isActive ? styles.activeContainer : styles.inactiveContainer]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, isActive ? styles.activeText : styles.inactiveText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
  },
  activeContainer: {
    backgroundColor: '#B43015', // Dark red from mockup
  },
  inactiveContainer: {
    backgroundColor: '#F9DBD1', // Light pink background for inactive tabs
  },
  text: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 13,
  },
  activeText: {
    color: colors.white,
  },
  inactiveText: {
    color: '#8A5A4A', // Brownish text for inactive
  },
});
