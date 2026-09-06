import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, KeyboardAvoidingView, Platform, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import CustomInput from '../components/CustomInput';

const LOGO = require('../../assets/logo.png');

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

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

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      navigation.replace(user.pinSet ? 'Main' : 'PinSetup');
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = email.trim() && password;

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
          <View style={styles.logoWrap}>
            <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
          </View>
          <Text style={styles.heroTitle}>Welcome back</Text>
          <Text style={styles.heroSub}>Sign in to your CERA account</Text>
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
            <Text style={styles.formTitle}>Sign In</Text>

            <CustomInput
              label="Email address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
            />
            <CustomInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
            />
            <TouchableOpacity style={styles.forgotWrap}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={14} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Spacer pushes button to bottom */}
            <View style={{ flex: 1 }} />

            <TouchableOpacity
              style={[styles.btn, (!canSubmit || loading) && { opacity: 0.55 }]}
              onPress={handleLogin}
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
                  : <Text style={styles.btnText}>Sign In</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account?  </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.footerLink}>Create account</Text>
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

  hero: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 24,
    paddingHorizontal: 28,
  },
  logoWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
  },
  logoImg: { width: 52, height: 52 },
  heroTitle: {
    color: '#fff', fontSize: 26,
    fontFamily: FONTS.extrabold, letterSpacing: -0.4, marginBottom: 4,
  },
  heroSub: { color: 'rgba(255,255,255,0.52)', fontSize: 13, fontFamily: FONTS.regular },

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
    paddingTop: 28,
    paddingBottom: 32,
  },

  formTitle: {
    color: '#0F172A', fontSize: 21,
    fontFamily: FONTS.extrabold, letterSpacing: -0.3, marginBottom: 22,
  },

  forgotWrap: { alignSelf: 'flex-end', marginTop: -6, marginBottom: 16 },
  forgotText: { color: COLORS.primary, fontSize: 13, fontFamily: FONTS.semibold },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 12,
    padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { color: COLORS.error, fontSize: 13, fontFamily: FONTS.medium, flex: 1 },

  btn: { borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  btnInner: { height: 56, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },

  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: '#94A3B8', fontSize: 14, fontFamily: FONTS.regular },
  footerLink: { color: COLORS.primary, fontSize: 14, fontFamily: FONTS.bold },
});
