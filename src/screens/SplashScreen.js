import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS } from '../constants/colors';

const LOGO = require('../../assets/logo.png');

export default function SplashScreen({ navigation }) {
  const logoScale = useRef(new Animated.Value(0.2)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.5)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 45, friction: 7, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(glowScale, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(tagOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.delay(600),
      Animated.timing(screenOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => navigation.replace('Onboarding'));

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <LinearGradient colors={['#080A1A', '#100B28', '#080A1A']} style={StyleSheet.absoluteFill} />

      <View style={styles.center}>
        <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
          <Animated.View style={[styles.glow, { transform: [{ scale: pulseAnim }], opacity: glowOpacity }]} />
          <View style={styles.logoBox}>
            <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
          </View>
        </Animated.View>

        <Animated.Text style={[styles.appName, { opacity: textOpacity }]}>
          CE<Text style={styles.purple}>RA</Text>
        </Animated.Text>

        <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
          Crypto to Naira, Instantly
        </Animated.Text>
      </View>

      <Animated.Text style={[styles.footer, { opacity: tagOpacity }]}>
        Secure · Fast · Reliable
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { alignItems: 'center' },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#7C3AED',
    opacity: 0.22,
  },
  logoBox: {
    width: 110,
    height: 110,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  logoImg: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 38,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  purple: { color: '#9D5BFF' },
  tagline: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontFamily: FONTS.regular,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.medium,
    letterSpacing: 2.5,
  },
});
