import React from 'react';
import { View, Text } from 'react-native';
import { FONTS } from '../constants/colors';

const PALETTE = ['#7C3AED', '#5B21B6', '#2563EB', '#0891B2', '#059669', '#D97706', '#DC2626', '#DB2777'];

export default function UserAvatar({ name, size = 44, radius, style }) {
  const initials = name
    ? name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?';
  const code = name ? name.toUpperCase().charCodeAt(0) : 0;
  const color = PALETTE[code % PALETTE.length];
  const r = radius !== undefined ? radius : Math.round(size * 0.32);

  return (
    <View style={[{
      width: size, height: size, borderRadius: r,
      backgroundColor: color + '1A',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: color + '40',
    }, style]}>
      <Text style={{
        color, fontSize: Math.round(size * 0.36),
        fontFamily: FONTS.extrabold, includeFontPadding: false,
      }}>
        {initials}
      </Text>
    </View>
  );
}
