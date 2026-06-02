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
      activeOpacity={0.8}
    >
      <Text style={[styles.text, isActive ? styles.activeText : styles.inactiveText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  activeContainer: {
    backgroundColor: colors.text, // Black background like IG selected pills
    borderColor: colors.text,
  },
  inactiveContainer: {
    backgroundColor: colors.white, 
    borderColor: colors.border,
  },
  text: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
  },
  activeText: {
    color: colors.white,
  },
  inactiveText: {
    color: colors.text,
  },
});
