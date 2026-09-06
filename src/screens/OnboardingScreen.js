import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FONTS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const TOP_H    = height * 0.44;   // colored section height
const ICON_R   = 84;              // icon circle radius (half of 168)
const ICON_D   = ICON_R * 2;     // icon circle diameter
const ICON_TOP = TOP_H - ICON_R; // absolute top of icon circle (straddles split)

const SLIDES = [
  {
    id: '1',
    topColor:  '#5B21B6',
    ringA:     'rgba(255,255,255,0.07)',
    ringB:     'rgba(255,255,255,0.04)',
    iconColor: '#5B21B6',
    icon:      'flash',
    btnGrad:   ['#5B21B6', '#7C3AED'],
    tag:       'INSTANT CONVERSION',
    title:     'Convert in\nSeconds',
    subtitle:  'Sell your crypto and get paid instantly to any Nigerian bank account.',
  },
  {
    id: '2',
    topColor:  '#065F46',
    ringA:     'rgba(255,255,255,0.07)',
    ringB:     'rgba(255,255,255,0.04)',
    iconColor: '#065F46',
    icon:      'trending-up',
    btnGrad:   ['#047857', '#10B981'],
    tag:       'LIVE MARKET RATES',
    title:     'Best Rates,\nAlways',
    subtitle:  'Live prices so you always get the most Naira for BTC, ETH, SOL and USDT.',
  },
  {
    id: '3',
    topColor:  '#92400E',
    ringA:     'rgba(255,255,255,0.07)',
    ringB:     'rgba(255,255,255,0.04)',
    iconColor: '#92400E',
    icon:      'shield-checkmark',
    btnGrad:   ['#92400E', '#D97706'],
    tag:       'BANK-LEVEL SECURITY',
    title:     'Safe, Trusted,\nReliable',
    subtitle:  'Military-grade encryption, biometric login, and 2FA keep your funds safe.',
  },
];

// ─── Single slide ─────────────────────────────────────────────────────────────
function SlideItem({ item, index, scrollX, entranceFade, entranceSlide }) {
  const ir = [(index - 1) * width, index * width, (index + 1) * width];

  const iconScale   = scrollX.interpolate({ inputRange: ir, outputRange: [0.72, 1, 0.72],  extrapolate: 'clamp' });
  const iconOpacity = scrollX.interpolate({ inputRange: ir, outputRange: [0,    1, 0],      extrapolate: 'clamp' });
  const textOpacity = scrollX.interpolate({ inputRange: ir, outputRange: [0,    1, 0],      extrapolate: 'clamp' });
  const textSlideY  = scrollX.interpolate({ inputRange: ir, outputRange: [36,   0, 36],     extrapolate: 'clamp' });
  const parallax    = scrollX.interpolate({ inputRange: ir, outputRange: [-28,  0, 28],     extrapolate: 'clamp' });

  // For the first slide, blend entrance animation with scroll-driven opacity
  const isFirst = index === 0;

  return (
    <View style={styles.slide}>

      {/* ── Colored top section ── */}
      <Animated.View style={[
        styles.topSection,
        { backgroundColor: item.topColor },
        isFirst && { opacity: entranceFade },
      ]}>
        {/* Parallax inner content (rings shift slightly) */}
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: parallax }] }]}>
          <View style={[styles.ring, { width: width * 1.1, height: width * 1.1, borderRadius: width * 0.55, borderColor: item.ringA, top: -width * 0.35, right: -width * 0.35 }]} />
          <View style={[styles.ring, { width: width * 0.7, height: width * 0.7, borderRadius: width * 0.35, borderColor: item.ringB, bottom: -width * 0.08, left: -width * 0.18 }]} />
        </Animated.View>
      </Animated.View>

      {/* ── White bottom section ── */}
      <View style={styles.bottomSection} />

      {/* ── Floating icon circle ── */}
      <Animated.View style={[
        styles.iconFloat,
        {
          transform: [{ scale: isFirst ? entranceSlide.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) : iconScale }],
          opacity: isFirst ? entranceFade : iconOpacity,
        },
      ]}>
        <View style={styles.iconShadowWrap}>
          <View style={[styles.iconCircle, { borderColor: item.topColor + '20' }]}>
            <Ionicons name={item.icon} size={68} color={item.iconColor} />
          </View>
        </View>
      </Animated.View>

      {/* ── Text block ── */}
      <Animated.View style={[
        styles.textBlock,
        {
          opacity:   isFirst ? entranceFade   : textOpacity,
          transform: [{ translateY: isFirst ? entranceSlide.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) : textSlideY }],
        },
      ]}>
        <Text style={[styles.tag, { color: item.topColor }]}>{item.tag}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </Animated.View>

    </View>
  );
}

// ─── Progress bar indicator ───────────────────────────────────────────────────
function ProgressBar({ scrollX, count }) {
  const fillWidth = scrollX.interpolate({
    inputRange: [0, width * (count - 1)],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });
  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { width: fillWidth }]} />
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollX       = useRef(new Animated.Value(0)).current;
  const flatRef       = useRef(null);
  const btnScale      = useRef(new Animated.Value(1)).current;
  const uiFade        = useRef(new Animated.Value(0)).current;
  const entranceFade  = useRef(new Animated.Value(0)).current;
  const entranceSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(uiFade,       { toValue: 1, duration: 480, delay: 100, useNativeDriver: true }),
      Animated.timing(entranceFade, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
      Animated.spring(entranceSlide, { toValue: 1, tension: 55, friction: 8, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const onMomentumEnd = (e) => {
    setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const goNext = () => {
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.94, useNativeDriver: true, tension: 300, friction: 5 }),
      Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 5 }),
    ]).start();

    if (activeIndex < SLIDES.length - 1) {
      const next = activeIndex + 1;
      flatRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    } else {
      navigation.replace('Login');
    }
  };

  const slide = SLIDES[activeIndex];

  return (
    <View style={styles.root}>
      <StatusBar style="auto" />

      {/* ── Slides ── */}
      <Animated.FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumEnd}
        renderItem={({ item, index }) => (
          <SlideItem
            item={item}
            index={index}
            scrollX={scrollX}
            entranceFade={entranceFade}
            entranceSlide={entranceSlide}
          />
        )}
        style={{ flex: 1 }}
      />

      {/* ── Skip button (top-right) ── */}
      {activeIndex < SLIDES.length - 1 && (
        <Animated.View style={[styles.skipWrap, { top: insets.top + 14, opacity: uiFade }]}>
          <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.replace('Login')}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Footer ── */}
      <Animated.View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 28), opacity: uiFade }]}>

        <ProgressBar scrollX={scrollX} count={SLIDES.length} />

        <Animated.View style={{ width: '100%', transform: [{ scale: btnScale }] }}>
          <TouchableOpacity onPress={goNext} activeOpacity={0.88} style={styles.btn}>
            <LinearGradient colors={slide.btnGrad} style={styles.btnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.btnText}>
                {activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
              </Text>
              <Ionicons
                name={activeIndex === SLIDES.length - 1 ? 'arrow-forward-circle' : 'arrow-forward'}
                size={20}
                color="#fff"
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account?  </Text>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={[styles.loginLink, { color: slide.topColor }]}>Sign in</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </View>
  );
}

const FOOTER_H = 190;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  // ── Slide layout ──
  slide: {
    width,
    height,
    backgroundColor: '#FFFFFF',
  },
  topSection: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: TOP_H,
    borderBottomLeftRadius: 44,
    borderBottomRightRadius: 44,
    overflow: 'hidden',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: height - TOP_H,
    backgroundColor: '#FFFFFF',
  },

  // ── Floating icon ──
  iconFloat: {
    position: 'absolute',
    top: ICON_TOP,
    alignSelf: 'center',
  },
  iconShadowWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 14,
    borderRadius: ICON_R,
    backgroundColor: '#fff',
  },
  iconCircle: {
    width: ICON_D,
    height: ICON_D,
    borderRadius: ICON_R,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
  },

  // ── Text ──
  textBlock: {
    position: 'absolute',
    top: ICON_TOP + ICON_D + 32,
    left: 0, right: 0,
    paddingHorizontal: 34,
    alignItems: 'center',
  },
  tag: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 2,
    marginBottom: 14,
  },
  title: {
    color: '#0F172A',
    fontSize: 36,
    fontFamily: FONTS.extrabold,
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: -0.8,
    marginBottom: 14,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 15,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 290,
  },

  // ── Skip ──
  skipWrap: { position: 'absolute', right: 24, zIndex: 10 },
  skipBtn: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20,
  },
  skipText: { color: '#1E293B', fontSize: 13, fontFamily: FONTS.semibold },

  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 28,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    gap: 18,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },

  // Progress
  progressTrack: {
    width: '100%', height: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 2,
  },

  // Button
  btn: { borderRadius: 16, overflow: 'hidden', width: '100%' },
  btnInner: {
    height: 56, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
  },
  btnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold, letterSpacing: 0.2 },

  // Login row
  loginRow: { flexDirection: 'row', alignItems: 'center' },
  loginText: { color: '#94A3B8', fontSize: 13, fontFamily: FONTS.regular },
  loginLink: { fontSize: 13, fontFamily: FONTS.bold },
});
