import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { feedbackLight } from '../utils/feedback';

const DEFAULT_BANK = { bank: 'GTBank' };

export default function AutoProcessingSuccessScreen({ navigation, route }) {
  const { colors } = useTheme();
  const S = useMemo(() => makeStyles(colors), [colors]);
  const bank = route.params?.bank || DEFAULT_BANK;

  const ringScale = useRef(new Animated.Value(0.3)).current;
  const iconScale = useRef(new Animated.Value(0.3)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const btnsOpacity = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const ringPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(ringScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.spring(iconScale, { toValue: 1, tension: 80, friction: 6, delay: 80, useNativeDriver: true }),
        Animated.timing(iconRotate, { toValue: 1, duration: 400, delay: 80, useNativeDriver: true }),
      ]),
      Animated.timing(contentOpacity, { toValue: 1, duration: 360, useNativeDriver: true }),
      Animated.timing(btnsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(ringPulse, { toValue: 1.1, duration: 950, useNativeDriver: true }),
        Animated.timing(ringPulse, { toValue: 1, duration: 950, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const spin = iconRotate.interpolate({ inputRange: [0, 1], outputRange: ['-15deg', '0deg'] });
  const shimmerX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-80, 80] });

  return (
    <SafeAreaView style={S.container} edges={['top', 'bottom']}>
      <View style={S.inner}>

        <Animated.View style={[S.ringOuter, { transform: [{ scale: ringScale }, { scale: ringPulse }] }]}>
          <Animated.View style={[S.iconRing, { transform: [{ scale: iconScale }, { rotate: spin }] }]}>
            <LinearGradient colors={['#7C3AED', '#5B21B6']} style={S.iconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="flash" size={42} color="#fff" />
              <Animated.View style={[StyleSheet.absoluteFill, S.shimmerLine, { transform: [{ translateX: shimmerX }, { rotate: '25deg' }] }]} />
            </LinearGradient>
          </Animated.View>
        </Animated.View>

        <Animated.View style={{ opacity: contentOpacity, alignItems: 'center' }}>
          <Text style={S.title}>Auto Processing{'\n'}Active!</Text>
          <Text style={S.sub}>
            Any BTC, ETH, SOL, BNB, USDT or USDC received in your CERA wallet will automatically
            convert to Naira and be sent to your{' '}
            <Text style={{ color: colors.primary, fontFamily: FONTS.bold }}>{bank.bank}</Text> account.
          </Text>

          <View style={S.statusPill}>
            <View style={S.statusDot} />
            <Text style={S.statusText}>Live · Watching for deposits</Text>
          </View>
        </Animated.View>

        <Animated.View style={[S.btns, { opacity: btnsOpacity }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={S.primaryBtn}
            onPress={() => {
              feedbackLight();
              navigation.replace('AutoProcessingSettings');
            }}
          >
            <LinearGradient colors={['#7C3AED', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.primaryBtnInner}>
              <Text style={S.primaryBtnText}>View Settings</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={S.secondaryBtn} activeOpacity={0.7} onPress={() => { feedbackLight(); navigation.navigate('Main'); }}>
            <Text style={[S.secondaryBtnText, { color: colors.textSecondary }]}>Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 32 },

    ringOuter: {
      width: 156,
      height: 156,
      borderRadius: 46,
      backgroundColor: '#7C3AED18',
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconRing: {
      width: 122,
      height: 122,
      borderRadius: 36,
      backgroundColor: '#7C3AED22',
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconGradient: {
      width: 96,
      height: 96,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    shimmerLine: {
      width: 30,
      backgroundColor: 'rgba(255,255,255,0.35)',
      borderRadius: 4,
    },

    title: { color: C.text, fontSize: 28, fontFamily: FONTS.extrabold, textAlign: 'center', marginBottom: 12 },
    sub: { color: C.textSecondary, fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 22, marginBottom: 20 },

    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: C.success + '15',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor: C.success + '35',
    },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.success },
    statusText: { color: C.success, fontSize: 12, fontFamily: FONTS.semibold },

    btns: { width: '100%', gap: 8 },
    primaryBtn: { borderRadius: 16, overflow: 'hidden' },
    primaryBtnInner: { height: 58, alignItems: 'center', justifyContent: 'center' },
    primaryBtnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },
    secondaryBtn: { height: 50, alignItems: 'center', justifyContent: 'center' },
    secondaryBtnText: { fontSize: 15, fontFamily: FONTS.semibold },
  });
}
