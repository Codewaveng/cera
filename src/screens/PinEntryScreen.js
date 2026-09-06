import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { feedbackLight, feedbackError } from '../utils/feedback';
import NumericKeypad from '../components/NumericKeypad';

const _callbacks = {};
export function registerPinCallback(key, fn) { _callbacks[key] = fn; }

export default function PinEntryScreen({ navigation, route }) {
  const { colors } = useTheme();
  const S = useMemo(() => makeStyles(colors), [colors]);

  const { title = 'Enter your PIN', subtitle = 'Authorise this transaction', callbackKey } = route.params || {};

  const [pin, setPin]         = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const dotScales = [0, 1, 2, 3].map(() => useRef(new Animated.Value(1)).current);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeIn    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  function shake() {
    feedbackError();
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 14,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -14, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 9,   duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -9,  duration: 50, useNativeDriver: true }),
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
        setPin(next);
      }
      return;
    }
    if (pin.length >= 4) return;

    const next = pin + key;
    animateDot(next.length - 1, true);
    setPin(next);

    if (next.length === 4) setTimeout(() => submit(next), 180);
  }

  async function submit(entered) {
    const cb = _callbacks[callbackKey];
    if (!cb) { navigation.goBack(); return; }
    try {
      setLoading(true);
      await cb(entered, {
        onError: (msg) => {
          shake();
          setError(msg || 'Incorrect PIN');
          setPin('');
        },
        goBack: () => navigation.goBack(),
      });
    } catch (err) {
      shake();
      setError(err?.response?.data?.error || 'Something went wrong');
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={S.container} edges={['top', 'bottom']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => { feedbackLight(); navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Animated.View style={[S.top, { opacity: fadeIn }]}>
        <LinearGradient colors={['#7C3AED', '#5B21B6']} style={S.iconBox}>
          <Ionicons name="lock-closed" size={28} color="#fff" />
        </LinearGradient>
        <Text style={S.title}>{title}</Text>
        <Text style={S.subtitle}>{subtitle}</Text>

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

        {!!error  && <Text style={[S.error, { color: colors.error }]}>{error}</Text>}
        {loading  && <Text style={[S.hint,  { color: colors.textMuted }]}>Verifying…</Text>}
      </Animated.View>

      <View style={S.keypadWrap}>
        <NumericKeypad mode="pin" onKey={handleKey} disabled={loading} />
      </View>
    </SafeAreaView>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { paddingHorizontal: 20, paddingTop: 8 },
    backBtn: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: C.border,
    },

    top: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    iconBox: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    title:    { color: C.text, fontSize: 22, fontFamily: FONTS.extrabold, textAlign: 'center', marginBottom: 8 },
    subtitle: { color: C.textSecondary, fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center', marginBottom: 36 },

    dotsRow: { flexDirection: 'row', gap: 20, marginBottom: 14 },
    dot: {
      width: 20, height: 20, borderRadius: 10,
      borderWidth: 2, borderColor: C.primary, backgroundColor: 'transparent',
    },
    dotFilled: { backgroundColor: C.primary },

    error: { fontSize: 13, fontFamily: FONTS.semibold, marginTop: 4, textAlign: 'center' },
    hint:  { fontSize: 13, fontFamily: FONTS.regular,  marginTop: 4 },

    keypadWrap: { paddingBottom: 16 },
  });
}
