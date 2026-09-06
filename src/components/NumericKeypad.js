import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { feedbackLight, feedbackSelect } from '../utils/feedback';

// mode='pin'    → bottom-left key is blank (hidden)
// mode='amount' → bottom-left key is '.' (decimal point)
const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['LEFT', '0', '⌫'],
];

function KeyCell({ char, mode, onPress, colors }) {
  const scale = useRef(new Animated.Value(1)).current;

  const isBlank   = char === 'LEFT' && mode === 'pin';
  const label     = char === 'LEFT' ? (mode === 'amount' ? '.' : '') : char;
  const isBack    = char === '⌫';
  const isDisabled = isBlank;

  const pressIn = () => {
    if (isDisabled) return;
    Animated.spring(scale, { toValue: 0.82, useNativeDriver: true, tension: 320, friction: 10 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 320, friction: 10 }).start();
  };

  if (isBlank) return <View style={styles.cell} />;

  return (
    <Animated.View style={[styles.cell, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={[styles.keyBtn, { backgroundColor: isBack ? colors.keyBackspaceBg : colors.keyBg }]}
        onPress={() => { Keyboard.dismiss(); if (isBack) feedbackLight(); else feedbackSelect(); onPress(label); }}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={0.85}
      >
        {isBack
          ? <Ionicons name="backspace-outline" size={26} color={colors.text} />
          : <Text style={[styles.keyText, { color: colors.text }]}>{label}</Text>
        }
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function NumericKeypad({ mode = 'pin', onKey, disabled = false }) {
  const { colors } = useTheme();

  return (
    <View style={styles.keypad}>
      {ROWS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((char) => (
            <KeyCell
              key={char}
              char={char}
              mode={mode}
              colors={colors}
              onPress={(k) => { if (!disabled) onKey(k); }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  keypad: { width: '100%', paddingHorizontal: 8, paddingBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 6 },
  cell: { flex: 1, paddingHorizontal: 5 },
  keyBtn: {
    height: 66,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 26,
    fontFamily: FONTS.semibold,
    includeFontPadding: false,
  },
});
