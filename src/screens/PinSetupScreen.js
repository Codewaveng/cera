import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { feedbackLight, feedbackSuccess, feedbackError } from '../utils/feedback';
import { setPin } from '../services/api';
import { useAuth } from '../context/AuthContext';
import NumericKeypad from '../components/NumericKeypad';

export default function PinSetupScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { refreshUser } = useAuth();
  const S = useMemo(() => makeStyles(colors), [colors]);

  const [step, setStep]         = useState('set');
  const [firstPin, setFirstPin] = useState('');
  const [pin, setLocalPin]      = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const dotScales = [0, 1, 2, 3].map(() => useRef(new Animated.Value(1)).current);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeIn    = useRef(new Animated.Value(0)).current;
  const stepAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  function shake() {
    feedbackError();
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 50, useNativeDriver: true }),
    ]).start();
  }

  function animateDot(index, filled) {
    Animated.spring(dotScales[index], {
      toValue: filled ? 1.4 : 1, tension: 220, friction: 7, useNativeDriver: true,
    }).start(() =>
      Animated.spring(dotScales[index], { toValue: 1, tension: 220, friction: 7, useNativeDriver: true }).start()
    );
  }

  async function handleKey(key) {
    if (loading) return;
    setError('');

    if (key === '⌫') {
      if (pin.length > 0) {
        const next = pin.slice(0, -1);
        animateDot(next.length, false);
        setLocalPin(next);
      }
      return;
    }
    if (pin.length >= 4) return;

    const next = pin + key;
    animateDot(next.length - 1, true);
    setLocalPin(next);

    if (next.length === 4) setTimeout(() => handleComplete(next), 180);
  }

  async function handleComplete(entered) {
    if (step === 'set') {
      setFirstPin(entered);
      setLocalPin('');
      // Reset dots
      [0, 1, 2, 3].forEach((i) => dotScales[i].setValue(1));
      // Slide to confirm step
      Animated.timing(stepAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start(() => {
        stepAnim.setValue(0);
        setStep('confirm');
      });
      return;
    }

    if (entered !== firstPin) {
      shake();
      setError("PINs don't match. Start again.");
      setLocalPin('');
      setStep('set');
      setFirstPin('');
      return;
    }

    try {
      setLoading(true);
      await setPin(entered);
      feedbackSuccess();
      refreshUser({ pinSet: true });
      const nextScreen = route?.params?.nextScreen || 'Main';
      navigation.replace(nextScreen);
    } catch (err) {
      shake();
      setError(err?.response?.data?.error || 'Failed to set PIN');
      setLocalPin('');
    } finally {
      setLoading(false);
    }
  }

  const isConfirm = step === 'confirm';

  return (
    <SafeAreaView style={S.container} edges={['top', 'bottom']}>
      <Animated.View style={[S.inner, { opacity: fadeIn }]}>

        {/* Progress bar */}
        <View style={S.progressTrack}>
          <Animated.View style={[S.progressFill, { width: isConfirm ? '100%' : '50%' }]} />
        </View>

        <LinearGradient colors={['#7C3AED', '#5B21B6']} style={S.iconBox}>
          <Ionicons name={isConfirm ? 'shield-checkmark' : 'lock-closed'} size={28} color="#fff" />
        </LinearGradient>

        <Text style={S.title}>{isConfirm ? 'Confirm Your PIN' : 'Create Your PIN'}</Text>
        <Text style={S.subtitle}>
          {isConfirm
            ? 'Re-enter the same PIN to confirm'
            : 'This 4-digit PIN secures every transaction'}
        </Text>

        <Animated.View style={[S.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
          {[0, 1, 2, 3].map((i) => (
            <Animated.View
              key={i}
              style={[
                S.dot,
                pin.length > i && S.dotFilled,
                { transform: [{ scale: dotScales[i] }] },
              ]}
            />
          ))}
        </Animated.View>

        {!!error && <Text style={[S.error, { color: colors.error }]}>{error}</Text>}
      </Animated.View>

      <View style={S.keypadWrap}>
        <NumericKeypad mode="pin" onKey={handleKey} disabled={loading} />

        {step === 'set' && (
          <TouchableOpacity onPress={() => { feedbackLight(); navigation.replace(route?.params?.nextScreen || 'Main'); }} style={S.skipBtn}>
            <Text style={[S.skipText, { color: colors.textMuted }]}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

    progressTrack: {
      position: 'absolute', top: 16, left: 32, right: 32,
      height: 3, backgroundColor: C.border, borderRadius: 2,
    },
    progressFill: {
      height: 3, backgroundColor: C.primary, borderRadius: 2,
    },

    iconBox: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
    title:    { color: C.text, fontSize: 24, fontFamily: FONTS.extrabold, textAlign: 'center', marginBottom: 8 },
    subtitle: { color: C.textSecondary, fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center', marginBottom: 36 },

    dotsRow: { flexDirection: 'row', gap: 20, marginBottom: 14 },
    dot: {
      width: 20, height: 20, borderRadius: 10,
      borderWidth: 2, borderColor: C.primary, backgroundColor: 'transparent',
    },
    dotFilled: { backgroundColor: C.primary },

    error: { fontSize: 13, fontFamily: FONTS.semibold, marginTop: 4, textAlign: 'center' },

    keypadWrap: { paddingBottom: 12 },
    skipBtn: { alignItems: 'center', paddingVertical: 12 },
    skipText: { fontSize: 14, fontFamily: FONTS.medium },
  });
}
