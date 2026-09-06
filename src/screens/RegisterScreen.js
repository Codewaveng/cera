import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, KeyboardAvoidingView, Platform, Image,
  ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import CustomInput from '../components/CustomInput';

const LOGO = require('../../assets/logo.png');

// Nigerian flag — three vertical bars, no emoji
function NigeriaFlag() {
  return (
    <View style={flag.wrap}>
      <View style={[flag.bar, { backgroundColor: '#008751' }]} />
      <View style={[flag.bar, { backgroundColor: '#FFFFFF' }]} />
      <View style={[flag.bar, { backgroundColor: '#008751' }]} />
    </View>
  );
}
const flag = StyleSheet.create({
  wrap: {
    width: 26, height: 18, borderRadius: 3,
    flexDirection: 'row', overflow: 'hidden',
    borderWidth: 0.5, borderColor: '#D1D5DB',
  },
  bar: { flex: 1 },
});

function StrengthBar({ password }) {
  const level = !password ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const colors = ['#EF4444', '#F59E0B', '#10B981'];
  const labels = ['Weak', 'Fair', 'Strong'];
  if (!password) return null;
  const c = colors[level - 1];
  return (
    <View style={sb.wrap}>
      <View style={sb.bars}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[sb.bar, { backgroundColor: i <= level ? c : '#E2E8F0' }]} />
        ))}
      </View>
      <Text style={[sb.label, { color: c }]}>{labels[level - 1]}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -8, marginBottom: 16 },
  bars:  { flexDirection: 'row', gap: 4, flex: 1 },
  bar:   { flex: 1, height: 4, borderRadius: 2 },
  label: { fontSize: 12, fontFamily: FONTS.semibold },
});

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [fullName, setFullName]         = useState('');
  const [email, setEmail]               = useState('');
  const [phone, setPhone]               = useState('');
  const [password, setPassword]         = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showReferral, setShowReferral] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  const heroFade  = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(-20)).current;
  const cardFade  = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(36)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade,  { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.spring(heroSlide, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
      Animated.timing(cardFade,  { toValue: 1, duration: 480, delay: 150, useNativeDriver: true }),
      Animated.spring(cardSlide, { toValue: 0, tension: 55, friction: 9, delay: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password) return;
    setError('');
    setLoading(true);
    try {
      await register({
        name: fullName.trim(),
        email: email.trim(),
        phone: phone ? `+234${phone}` : '',
        password,
        referralCode: referralCode.trim() || undefined,
      });
      navigation.replace('PinSetup', { nextScreen: 'CeraTag' });
    } catch (err) {
      setError(err?.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = fullName.trim() && email.trim() && password.length >= 6;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#1A0550', '#3B0F90', '#5B21B6']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}
      />
      <View style={styles.ring1} />
      <View style={styles.ring2} />

      {/* ── Compact hero ── */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
        <Animated.View style={[styles.hero, { opacity: heroFade, transform: [{ translateY: heroSlide }] }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={19} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroRight}>
            <View style={styles.logoWrap}>
              <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
            </View>
            <View>
              <Text style={styles.heroTitle}>Create account</Text>
              <Text style={styles.heroSub}>Join thousands on CERA today</Text>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>

      {/* ── White form card ── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.View style={[styles.card, { opacity: cardFade, transform: [{ translateY: cardSlide }] }]}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
          >
            <Text style={styles.formTitle}>Your details</Text>

            <CustomInput
              label="Full name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="John Doe"
            />
            <CustomInput
              label="Email address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
            />

            {/* Phone with Nigerian flag */}
            <View style={styles.phoneWrapper}>
              <Text style={styles.phoneLabel}>Phone number</Text>
              <View style={styles.phoneRow}>
                <View style={styles.phonePrefix}>
                  <NigeriaFlag />
                  <Text style={styles.phonePrefixText}>+234</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                  placeholder="8012345678"
                  placeholderTextColor="#CBD5E1"
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
            </View>

            <CustomInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 6 characters"
              secureTextEntry
            />
            <StrengthBar password={password} />

            {/* Referral code (collapsible) */}
            <TouchableOpacity
              style={styles.referralToggle}
              onPress={() => setShowReferral((v) => !v)}
            >
              <Ionicons name="gift-outline" size={15} color={COLORS.primary} />
              <Text style={styles.referralToggleText}>
                {showReferral ? 'Remove referral code' : 'Have a referral code?'}
              </Text>
              <Ionicons name={showReferral ? 'chevron-up' : 'chevron-down'} size={14} color={COLORS.primary} />
            </TouchableOpacity>

            {showReferral && (
              <CustomInput
                label="Referral code"
                value={referralCode}
                onChangeText={(t) => setReferralCode(t.toUpperCase())}
                placeholder="e.g. CERA-ABC123"
              />
            )}

            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={14} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.btn, (!canSubmit || loading) && { opacity: 0.55 }]}
              onPress={handleRegister}
              disabled={!canSubmit || loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#5B21B6', '#7C3AED']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.btnInner}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.btnText}>Create Account</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.terms}>
              By signing up you agree to our{' '}
              <Text style={styles.termsLink}>Terms</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account?  </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.footerLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  ring1: {
    position: 'absolute', top: -70, right: -70,
    width: 220, height: 220, borderRadius: 110,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  ring2: {
    position: 'absolute', top: -120, right: -120,
    width: 340, height: 340, borderRadius: 170,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },

  // Hero — horizontal layout to save vertical space
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 14,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  heroRight: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  logoWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 8, elevation: 6,
    flexShrink: 0,
  },
  logoImg: { width: 38, height: 38 },
  heroTitle: {
    color: '#fff', fontSize: 20,
    fontFamily: FONTS.extrabold, letterSpacing: -0.3,
  },
  heroSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },

  // Card
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 26,
    paddingBottom: 32,
  },

  formTitle: {
    color: '#0F172A', fontSize: 20,
    fontFamily: FONTS.extrabold, letterSpacing: -0.3, marginBottom: 20,
  },

  // Phone field
  phoneWrapper: { marginBottom: 16 },
  phoneLabel: {
    color: '#475569', fontSize: 13,
    fontFamily: FONTS.semibold, marginBottom: 8, letterSpacing: 0.3,
  },
  phoneRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FAFAFA', borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.border,
    overflow: 'hidden', minHeight: 56,
  },
  phonePrefix: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, height: 56,
    borderRightWidth: 1.5, borderRightColor: COLORS.border,
  },
  phonePrefixText: { color: '#0F172A', fontSize: 14, fontFamily: FONTS.semibold },
  phoneInput: {
    flex: 1, color: '#0F172A', fontSize: 15,
    fontFamily: FONTS.medium, paddingHorizontal: 14, paddingVertical: 14,
  },

  // Referral
  referralToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', marginBottom: 14,
  },
  referralToggleText: { color: COLORS.primary, fontSize: 13, fontFamily: FONTS.semibold },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 12,
    padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { color: COLORS.error, fontSize: 13, fontFamily: FONTS.medium, flex: 1 },

  // Button
  btn: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  btnInner: { height: 56, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },

  terms: {
    color: '#94A3B8', fontSize: 12, fontFamily: FONTS.regular,
    textAlign: 'center', marginTop: 16, lineHeight: 18,
  },
  termsLink: { color: COLORS.primary, fontFamily: FONTS.semibold },

  footerRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: 18,
  },
  footerText: { color: '#94A3B8', fontSize: 14, fontFamily: FONTS.regular },
  footerLink: { color: COLORS.primary, fontSize: 14, fontFamily: FONTS.bold },
});
