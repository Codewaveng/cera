import React, { useRef, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { CERA_USER } from '../constants/data';
import { useTheme } from '../context/ThemeContext';
import { feedbackLight, feedbackMedium } from '../utils/feedback';
import AppModal from '../components/AppModal';

const FEATURES = [
  { icon: 'flash-outline', color: '#F59E0B', title: 'Instant Top-up', desc: 'Load your card instantly from your CERA Naira balance' },
  { icon: 'globe-outline', color: '#10B981', title: 'Global Payments', desc: 'Pay anywhere Mastercard is accepted worldwide' },
  { icon: 'shield-checkmark-outline', color: '#7C3AED', title: 'Zero Fraud Liability', desc: 'Fully insured with real-time transaction alerts' },
  { icon: 'phone-portrait-outline', color: '#627EEA', title: 'Apple & Google Pay', desc: 'Add to phone wallet for instant tap-to-pay' },
];

function AnimatedCard() {
  const floatY = useRef(new Animated.Value(0)).current;
  const floatRotate = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.88)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance
    Animated.spring(cardScale, { toValue: 1, tension: 55, friction: 8, delay: 100, useNativeDriver: true }).start();

    // Continuous float
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(floatY, { toValue: -10, duration: 2200, useNativeDriver: true }),
          Animated.timing(floatRotate, { toValue: 1, duration: 2200, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(floatY, { toValue: 0, duration: 2200, useNativeDriver: true }),
          Animated.timing(floatRotate, { toValue: 0, duration: 2200, useNativeDriver: true }),
        ]),
      ])
    ).start();

    // Shimmer sweep
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.delay(1200),
        Animated.timing(shimmer, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const tilt = floatRotate.interpolate({ inputRange: [0, 1], outputRange: ['-1.5deg', '1.5deg'] });
  const shimmerX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-320, 420] });

  return (
    <Animated.View style={{ transform: [{ scale: cardScale }, { translateY: floatY }, { rotate: tilt }] }}>
      <LinearGradient
        colors={['#3D1F8C', '#5B21B6', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.decoA} />
        <View style={styles.decoB} />
        <View style={styles.decoC} />

        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.shimmer,
            { transform: [{ translateX: shimmerX }, { rotate: '20deg' }] },
          ]}
        />

        <View style={styles.cardTop}>
          <Text style={styles.cardBrand}>CERA</Text>
          <View style={styles.cardChip}>
            <View style={styles.chipLine} />
            <View style={styles.chipLine} />
            <View style={styles.chipLine} />
          </View>
        </View>

        <Text style={styles.cardNumber}>•••• •••• •••• 4291</Text>

        <View style={styles.cardBottom}>
          <View>
            <Text style={styles.miniLabel}>CARD HOLDER</Text>
            <Text style={styles.cardName}>{CERA_USER.name.toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.miniLabel}>EXPIRES</Text>
            <Text style={styles.cardName}>••/••</Text>
          </View>
          <View style={styles.networkPair}>
            <View style={[styles.netCircle, { backgroundColor: 'rgba(255,255,255,0.9)', marginLeft: -8 }]} />
            <View style={[styles.netCircle, { backgroundColor: 'rgba(255,255,255,0.5)' }]} />
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function FeatureItem({ f, index }) {
  const itemAnim  = useRef(new Animated.Value(0)).current;
  const itemSlide = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(itemAnim,  { toValue: 1, duration: 350, delay: 300 + index * 80, useNativeDriver: true }),
      Animated.spring(itemSlide, { toValue: 0, tension: 70, friction: 9, delay: 300 + index * 80, useNativeDriver: true }),
    ]).start();
  }, []);
  const { colors } = useTheme();
  const S = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Animated.View style={{ opacity: itemAnim, transform: [{ translateY: itemSlide }] }}>
      <View style={S.featureRow}>
        <View style={[S.featureIcon, { backgroundColor: f.color + '18' }]}>
          <Ionicons name={f.icon} size={20} color={f.color} />
        </View>
        <View style={S.featureText}>
          <Text style={S.featureTitle}>{f.title}</Text>
          <Text style={S.featureDesc}>{f.desc}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

function ComingSoonBadge() {
  const badgeScale = useRef(new Animated.Value(0.5)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.spring(badgeScale, { toValue: 1, tension: 90, friction: 5, useNativeDriver: true }),
        Animated.timing(badgeOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.badgeWrap, { opacity: badgeOpacity, transform: [{ scale: Animated.multiply(badgeScale, pulse) }] }]}>
      <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.badgeGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Ionicons name="time-outline" size={13} color="#fff" />
        <Text style={styles.badgeText}>Coming Soon</Text>
      </LinearGradient>
    </Animated.View>
  );
}

export default function CardsScreen({ navigation }) {
  const { colors } = useTheme();
  const S = useMemo(() => makeStyles(colors), [colors]);
  const [notifyModal, setNotifyModal] = useState(false);

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <View style={S.header}>
        <Text style={S.title}>Cards</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>

        <View style={S.cardSection}>
          <AnimatedCard />
          <ComingSoonBadge />
        </View>

        <View style={S.infoCard}>
          <Ionicons name="sparkles-outline" size={20} color={colors.primary} style={{ marginBottom: 8 }} />
          <Text style={S.infoTitle}>Your CERA Card is almost here</Text>
          <Text style={S.infoSub}>
            Spend your Naira balance anywhere in the world. Virtual cards launch first, physical cards to follow shortly after.
          </Text>
        </View>

        <Text style={S.featuresLabel}>WHAT YOU'LL GET</Text>

        {FEATURES.map((f, i) => <FeatureItem key={f.title} f={f} index={i} />)}

        <TouchableOpacity
          style={S.notifyBtn}
          activeOpacity={0.85}
          onPress={() => { feedbackMedium(); setNotifyModal(true); }}
        >
          <LinearGradient colors={['#7C3AED', '#5B21B6']} style={S.notifyInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="notifications-outline" size={18} color="#fff" />
            <Text style={S.notifyText}>Notify Me When It Launches</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>

      <AppModal
        visible={notifyModal}
        type="success"
        title="You're on the list!"
        message="We'll notify you the moment CERA Cards launches. You're one of the first to know."
        primaryLabel="Awesome!"
        onClose={() => setNotifyModal(false)}
        onPrimary={() => setNotifyModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 24,
    height: 210,
    overflow: 'hidden',
    justifyContent: 'space-between',
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 14,
  },
  decoA: { position: 'absolute', top: -70, right: -70, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.07)' },
  decoB: { position: 'absolute', bottom: -50, left: -50, width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(255,255,255,0.05)' },
  decoC: { position: 'absolute', top: 50, right: 50, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.05)' },
  shimmer: { width: 60, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardBrand: { color: '#FFFFFF', fontSize: 22, fontFamily: FONTS.extrabold, letterSpacing: 2 },
  cardChip: { width: 36, height: 28, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 6, justifyContent: 'space-evenly', paddingHorizontal: 5 },
  chipLine: { height: 2, backgroundColor: 'rgba(255,255,255,0.65)', borderRadius: 1 },
  cardNumber: { color: 'rgba(255,255,255,0.8)', fontSize: 19, fontFamily: FONTS.medium, letterSpacing: 3.5 },
  cardBottom: { flexDirection: 'row', alignItems: 'flex-end', gap: 20 },
  miniLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 8, fontFamily: FONTS.semibold, letterSpacing: 1, marginBottom: 3 },
  cardName: { color: '#FFFFFF', fontSize: 12, fontFamily: FONTS.bold, letterSpacing: 0.8 },
  networkPair: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' },
  netCircle: { width: 30, height: 30, borderRadius: 15 },
  badgeWrap: {
    position: 'absolute',
    top: 6,
    right: 0,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  badgeGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22 },
  badgeText: { color: '#FFFFFF', fontSize: 13, fontFamily: FONTS.bold },
});

function makeStyles(C) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
    title: { color: C.text, fontSize: 24, fontFamily: FONTS.extrabold },
    scroll: { paddingHorizontal: 20, paddingBottom: 60 },

    cardSection: { marginBottom: 30, position: 'relative', paddingTop: 50 },

    infoCard: {
      backgroundColor: C.card,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: C.border,
      marginBottom: 26,
      alignItems: 'center',
    },
    infoTitle: { color: C.text, fontSize: 17, fontFamily: FONTS.bold, marginBottom: 8, textAlign: 'center' },
    infoSub: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.regular, lineHeight: 21, textAlign: 'center' },

    featuresLabel: { color: C.textMuted, fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1.2, marginBottom: 12 },

    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: C.card,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: C.border,
    },
    featureIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    featureText: { flex: 1 },
    featureTitle: { color: C.text, fontSize: 14, fontFamily: FONTS.semibold, marginBottom: 3 },
    featureDesc: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.regular, lineHeight: 17 },

    notifyBtn: { borderRadius: 18, overflow: 'hidden', marginTop: 8 },
    notifyInner: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    notifyText: { color: '#FFFFFF', fontSize: 15, fontFamily: FONTS.bold },
  });
}
