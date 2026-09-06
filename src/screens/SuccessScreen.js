import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../constants/colors';
import GradientButton from '../components/GradientButton';

function Particle({ delay, color, startX, startY }) {
  const y = useRef(new Animated.Value(0)).current;
  const x = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
        Animated.timing(y, { toValue: -120 + Math.random() * 60, duration: 1000, useNativeDriver: true }),
        Animated.timing(x, { toValue: startX, duration: 1000, useNativeDriver: true }),
      ]),
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: color,
          transform: [{ translateY: y }, { translateX: x }, { scale }],
          opacity,
          left: '50%',
          top: '40%',
        },
      ]}
    />
  );
}

const PARTICLE_COLORS = [
  COLORS.primary, COLORS.secondary, '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#10B981',
];

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
  delay: i * 60,
  startX: (Math.random() - 0.5) * 200,
  startY: (Math.random() - 0.5) * 100,
}));

function generateRef() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return 'CRA-' + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function SuccessScreen({ navigation, route }) {
  const { crypto, cryptoAmount, ngnAmount, bank, accountNumber, accountName } = route.params;
  const ref = useRef(generateRef()).current;

  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(checkScale, { toValue: 1, tension: 50, friction: 5, useNativeDriver: true }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(contentSlide, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    const timer = setTimeout(() => pulse.start(), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      

      {PARTICLES.map((p) => (
        <Particle key={p.id} {...p} />
      ))}

      <View style={styles.content}>
        {/* Success Icon */}
        <Animated.View
          style={[
            styles.checkWrap,
            { transform: [{ scale: checkScale }, { scale: pulseAnim }], opacity: checkOpacity },
          ]}
        >
          <View style={styles.checkOuter}>
            <LinearGradient colors={GRADIENTS.secondary} style={styles.checkInner}>
              <Ionicons name="checkmark" size={44} color={COLORS.white} />
            </LinearGradient>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.textSection,
            { opacity: contentOpacity, transform: [{ translateY: contentSlide }] },
          ]}
        >
          <Text style={styles.title}>Transaction Successful!</Text>
          <Text style={styles.subtitle}>
            Your Naira is on the way to your bank account
          </Text>

          {/* Amount Highlight */}
          <LinearGradient colors={['#0B3D2E', '#0D4A36']} style={styles.amountCard}>
            <Text style={styles.amountLabel}>Amount Being Sent</Text>
            <Text style={styles.amountValue}>
              ₦{ngnAmount.toLocaleString('en-NG', { maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.amountSub}>
              {cryptoAmount} {crypto.symbol} → {bank}
            </Text>
          </LinearGradient>

          {/* Details */}
          <View style={styles.detailCard}>
            {[
              { label: 'Reference', value: ref },
              { label: 'Account Name', value: accountName },
              { label: 'Account Number', value: accountNumber },
              { label: 'Bank', value: bank },
              { label: 'ETA', value: '5–10 minutes' },
            ].map((row) => (
              <View key={row.label} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{row.label}</Text>
                <Text style={styles.detailValue}>{row.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <GradientButton
              title="Share Receipt"
              variant="outline"
              onPress={() => {}}
              icon={<Ionicons name="share-outline" size={18} color={COLORS.primary} />}
              style={{ flex: 1 }}
            />
            <GradientButton
              title="Go Home"
              onPress={() => navigation.replace('Main')}
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  checkWrap: { alignItems: 'center', marginBottom: 32 },
  checkOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSection: { flex: 1 },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  amountCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  amountLabel: { color: COLORS.secondaryLight, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  amountValue: { color: COLORS.white, fontSize: 30, fontWeight: '800', marginBottom: 4 },
  amountSub: { color: COLORS.textSecondary, fontSize: 13 },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { color: COLORS.textSecondary, fontSize: 13 },
  detailValue: { color: COLORS.text, fontSize: 13, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 12 },
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
