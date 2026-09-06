import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS } from '../constants/colors';

function CoinLogo({ crypto, size = 44 }) {
  const [failed, setFailed] = useState(false);
  if (failed || !crypto.logoUrl) {
    return (
      <LinearGradient colors={crypto.gradient} style={{ width: size, height: size, borderRadius: size * 0.32, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontSize: size * 0.38, fontFamily: FONTS.bold }}>{crypto.symbol[0]}</Text>
      </LinearGradient>
    );
  }
  return (
    <Image
      source={{ uri: crypto.logoUrl }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      onError={() => setFailed(true)}
    />
  );
}

export default function CryptoCard({ crypto, onPress, selected = false, compact = false }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, tension: 120, friction: 6 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 6 }).start();

  const isPositive = crypto.change24h >= 0;

  if (compact) {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={1}
          style={[styles.compactCard, selected && { borderColor: crypto.color, borderWidth: 2 }]}
        >
          <CoinLogo crypto={crypto} size={44} />
          <Text style={styles.compactSymbol}>{crypto.symbol}</Text>
          <Text style={styles.compactName}>{crypto.name}</Text>
          {selected && (
            <View style={[styles.selectedBadge, { backgroundColor: crypto.color }]}>
              <Ionicons name="checkmark" size={10} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={styles.card}
      >
        <View style={styles.row}>
          <CoinLogo crypto={crypto} size={46} />
          <View style={styles.info}>
            <Text style={styles.name}>{crypto.name}</Text>
            <Text style={styles.symbol}>{crypto.symbol}</Text>
          </View>
          <View style={styles.priceSection}>
            <Text style={styles.price}>₦{crypto.priceNGN.toLocaleString()}</Text>
            <View style={[styles.changeBadge, { backgroundColor: isPositive ? '#0B3D2E' : '#3D0B0B' }]}>
              <Text style={[styles.change, { color: isPositive ? COLORS.success : COLORS.error }]}>
                {isPositive ? '▲' : '▼'} {Math.abs(crypto.change24h)}%
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: COLORS.text,
    fontSize: 15,
    fontFamily: FONTS.semibold,
  },
  symbol: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  price: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  changeBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginTop: 4,
  },
  change: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
  },
  compactCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    width: 100,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  compactSymbol: {
    color: COLORS.text,
    fontSize: 13,
    fontFamily: FONTS.bold,
    marginTop: 8,
  },
  compactName: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontFamily: FONTS.regular,
    marginTop: 2,
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTick: {
    color: COLORS.white,
    fontSize: 10,
    fontFamily: FONTS.bold,
  },
});
