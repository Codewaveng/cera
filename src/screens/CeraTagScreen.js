import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { checkCeraTag, claimCeraTag } from '../services/api';
import { feedbackLight, feedbackMedium } from '../utils/feedback';

const INVALID_RE = /[^a-z0-9_]/;

export default function CeraTagScreen({ navigation }) {
  const { colors } = useTheme();
  const [tag, setTag]             = useState('');
  const [status, setStatus]       = useState('idle'); // idle | checking | available | taken | invalid
  const [claimed, setClaimed]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const checkTimer = useRef(null);
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const inputScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    return () => clearTimeout(checkTimer.current);
  }, []);

  const handleTagChange = (raw) => {
    const clean = raw.toLowerCase().replace(/[^a-z0-9_.]/g, '');
    setTag(clean);
    setError('');

    if (clean.length === 0) { setStatus('idle'); return; }
    if (clean.length < 3)   { setStatus('invalid'); return; }

    setStatus('checking');
    clearTimeout(checkTimer.current);
    checkTimer.current = setTimeout(() => runCheck(clean), 600);
  };

  const runCheck = useCallback(async (t) => {
    try {
      const res = await checkCeraTag(t);
      setStatus(res.data.available ? 'available' : 'taken');
    } catch {
      // if backend doesn't support tag check yet, default to available
      setStatus('available');
    }
  }, []);

  const handleClaim = async () => {
    if (status !== 'available' || loading) return;
    feedbackMedium();
    setLoading(true);
    setError('');
    try {
      await claimCeraTag(tag);
      setClaimed(true);
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } catch (e) {
      setError(e?.response?.data?.error || 'Could not claim tag. Try another.');
      setStatus('taken');
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = {
    idle:      { icon: null,                  color: colors.textMuted,      text: '' },
    checking:  { icon: null,                  color: colors.textMuted,      text: 'Checking availability...' },
    available: { icon: 'checkmark-circle',    color: '#10B981',             text: '@' + tag + ' is available!' },
    taken:     { icon: 'close-circle',        color: '#EF4444',             text: '@' + tag + ' is already taken' },
    invalid:   { icon: 'alert-circle-outline', color: colors.warning,       text: 'Tag must be at least 3 characters' },
  };
  const si = statusInfo[status];

  if (claimed) {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.successWrap, { opacity: successOpacity, transform: [{ scale: successScale }] }]}>
          <LinearGradient colors={['#7C3AED', '#5B21B6']} style={styles.successCircle}>
            <Ionicons name="at" size={52} color="#fff" />
          </LinearGradient>
          <Text style={styles.successTitle}>Tag Claimed!</Text>
          <Text style={styles.successTag}>@{tag}</Text>
          <Text style={styles.successSub}>
            People can now send you money using your CERA tag. Share it anywhere!
          </Text>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => { feedbackLight(); navigation.replace('Main'); }}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#7C3AED', '#5B21B6']} style={styles.doneBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.doneBtnText}>Go to Home</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <LinearGradient colors={['#7C3AED', '#9D5BFF']} style={styles.headerIcon}>
              <Ionicons name="at" size={32} color="#fff" />
            </LinearGradient>
            <Text style={styles.title}>Claim your CERA Tag</Text>
            <Text style={styles.subtitle}>
              Your unique tag lets anyone send you money without needing your bank details.
            </Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Choose your tag</Text>
            <Animated.View style={[styles.inputWrap, status === 'available' && styles.inputWrapGreen, status === 'taken' && styles.inputWrapRed, { transform: [{ scale: inputScale }] }]}>
              <Text style={styles.atSign}>@</Text>
              <TextInput
                style={styles.input}
                value={tag}
                onChangeText={handleTagChange}
                placeholder="yourname"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                maxLength={20}
              />
              {status === 'checking' && (
                <ActivityIndicator size="small" color="#7C3AED" style={{ marginRight: 12 }} />
              )}
              {status === 'available' && <Ionicons name="checkmark-circle" size={22} color="#10B981" style={{ marginRight: 12 }} />}
              {status === 'taken' && <Ionicons name="close-circle" size={22} color="#EF4444" style={{ marginRight: 12 }} />}
            </Animated.View>

            {si.text ? (
              <View style={styles.statusRow}>
                {si.icon && <Ionicons name={si.icon} size={14} color={si.color} />}
                <Text style={[styles.statusText, { color: si.color }]}>{si.text}</Text>
              </View>
            ) : null}

            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          <View style={styles.tips}>
            {['Letters, numbers and underscores only', '3–20 characters', 'Cannot be changed later'].map((tip) => (
              <View key={tip} style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.claimBtn, status !== 'available' && { opacity: 0.45 }]}
            onPress={handleClaim}
            disabled={status !== 'available' || loading}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#7C3AED', '#5B21B6']} style={styles.claimBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.claimBtnText}>Claim @{tag || 'tag'}</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => { feedbackLight(); navigation.replace('Main'); }}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },

  header: { alignItems: 'center', marginBottom: 36 },
  headerIcon: {
    width: 80, height: 80, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 10,
  },
  title: { color: '#0F172A', fontSize: 26, fontFamily: FONTS.extrabold, textAlign: 'center', marginBottom: 10 },
  subtitle: { color: '#64748B', fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 22, maxWidth: 280 },

  inputSection: { marginBottom: 20 },
  inputLabel: { color: '#475569', fontSize: 13, fontFamily: FONTS.semibold, marginBottom: 10, letterSpacing: 0.3 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FAFAFA', borderRadius: 16,
    borderWidth: 2, borderColor: '#EDE9FE',
    overflow: 'hidden',
  },
  inputWrapGreen: { borderColor: '#10B981' },
  inputWrapRed:   { borderColor: '#EF4444' },
  atSign: { color: '#7C3AED', fontSize: 22, fontFamily: FONTS.bold, paddingLeft: 16, paddingRight: 4 },
  input: {
    flex: 1, color: '#0F172A', fontSize: 18, fontFamily: FONTS.semibold,
    paddingVertical: 16, paddingRight: 4,
    letterSpacing: 0.5,
  },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingLeft: 4 },
  statusText: { fontSize: 13, fontFamily: FONTS.medium },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#FFF5F5', borderRadius: 10, padding: 10, marginTop: 8,
    borderWidth: 1, borderColor: '#FCA5A5',
  },
  errorText: { color: '#EF4444', fontSize: 12, fontFamily: FONTS.medium, flex: 1 },

  tips: { gap: 8, marginBottom: 32, paddingLeft: 4 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#A78BFA' },
  tipText: { color: '#64748B', fontSize: 13, fontFamily: FONTS.regular },

  claimBtn: { borderRadius: 18, overflow: 'hidden', marginBottom: 16 },
  claimBtnInner: { height: 58, alignItems: 'center', justifyContent: 'center' },
  claimBtnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },

  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipText: { color: '#94A3B8', fontSize: 14, fontFamily: FONTS.medium },

  // Success state
  successWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
  },
  successCircle: {
    width: 120, height: 120, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4, shadowRadius: 24, elevation: 12,
  },
  successTitle: { color: '#0F172A', fontSize: 28, fontFamily: FONTS.extrabold, marginBottom: 8 },
  successTag: { color: '#7C3AED', fontSize: 22, fontFamily: FONTS.bold, marginBottom: 16 },
  successSub: {
    color: '#64748B', fontSize: 14, fontFamily: FONTS.regular,
    textAlign: 'center', lineHeight: 22, marginBottom: 36, maxWidth: 280,
  },
  doneBtn: { borderRadius: 18, overflow: 'hidden', width: '100%' },
  doneBtnInner: { height: 58, alignItems: 'center', justifyContent: 'center' },
  doneBtnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },
});
