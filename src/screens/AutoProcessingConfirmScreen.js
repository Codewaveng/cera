import React, { useRef, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { feedbackLight, feedbackSuccess, feedbackError } from '../utils/feedback';
import BankLogo from '../components/BankLogo';
import { useAuth } from '../context/AuthContext';
import { updateAutoProcessing } from '../services/api';

const DEFAULT_BANK = { bank: 'GTBank', accountNumber: '0123456789', accountName: 'Abdul Fataah' };

export default function AutoProcessingConfirmScreen({ navigation, route }) {
  const { colors } = useTheme();
  const S = useMemo(() => makeStyles(colors), [colors]);
  const { refreshUser } = useAuth();
  const bank = route.params?.bank || DEFAULT_BANK;
  const [saving, setSaving] = useState(false);

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(28)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, tension: 70, friction: 9, useNativeDriver: true }),
    ]).start();
    Animated.parallel([
      Animated.timing(btnOpacity, { toValue: 1, duration: 350, delay: 220, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, tension: 70, friction: 9, delay: 220, useNativeDriver: true }),
    ]).start();
  }, []);

  const STEPS = [
    { icon: 'logo-bitcoin',   color: '#F7931A', label: 'Crypto received in your CERA wallet' },
    { icon: 'swap-horizontal', color: '#10B981', label: 'Automatically converted to Naira at live rates' },
    { icon: 'card',            color: '#60A5FA', label: `Instantly sent to your ${bank.bank} account` },
  ];

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => { feedbackLight(); navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={S.title}>Confirm Setup</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={S.scroll}
        scrollEnabled={false}
      >
        <Animated.View style={{ opacity, transform: [{ translateY: slideY }], alignItems: 'center' }}>

          <LinearGradient colors={['#7C3AED', '#5B21B6']} style={S.iconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="flash" size={36} color="#fff" />
          </LinearGradient>

          <Text style={S.heading}>Activate Auto Processing?</Text>
          <Text style={S.sub}>Here's what happens when you receive supported crypto:</Text>

          <View style={S.stepsCard}>
            {STEPS.map((step, i) => (
              <View key={i} style={[S.stepRow, i < STEPS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={[S.stepIcon, { backgroundColor: step.color + '18' }]}>
                  <Ionicons name={step.icon} size={18} color={step.color} />
                </View>
                <Text style={S.stepText}>{step.label}</Text>
              </View>
            ))}
          </View>

          <Text style={S.bankLabel}>PAYOUT ACCOUNT</Text>
          <View style={[S.bankCard, { borderColor: colors.success + '40' }]}>
            <BankLogo bankName={bank.bank} size={42} />
            <View style={{ flex: 1 }}>
              <Text style={S.bankName}>{bank.bank}</Text>
              <Text style={S.bankAcc}>
                {'*'.repeat(6) + bank.accountNumber.slice(-4)} · {bank.accountName}
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          </View>

          <Text style={S.disclaimer}>
            You can turn off Auto Processing at any time from your profile settings.
          </Text>

        </Animated.View>
      </ScrollView>

      <Animated.View style={[S.footer, { opacity: btnOpacity, transform: [{ scale: btnScale }] }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={S.confirmBtn}
          disabled={saving}
          onPress={async () => {
            setSaving(true);
            try {
              await updateAutoProcessing({
                enabled: true,
                bankName: bank.bank,
                accountNumber: bank.accountNumber,
                accountName: bank.accountName,
              });
              refreshUser({ autoProcessing: { enabled: true, bankName: bank.bank, accountNumber: bank.accountNumber, accountName: bank.accountName } });
              feedbackSuccess();
              navigation.replace('AutoProcessingSuccess', { bank });
            } catch {
              feedbackError();
              setSaving(false);
            }
          }}
        >
          <LinearGradient colors={['#7C3AED', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.confirmBtnInner}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <><Ionicons name="checkmark" size={18} color="#fff" /><Text style={S.confirmBtnText}>Confirm & Activate</Text></>
            }
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={S.cancelBtn} activeOpacity={0.7} onPress={() => { feedbackLight(); navigation.goBack(); }}>
          <Text style={[S.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 12,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 12, backgroundColor: C.card,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border,
    },
    title: { color: C.text, fontSize: 18, fontFamily: FONTS.bold },
    scroll: { paddingHorizontal: 20, paddingBottom: 140, paddingTop: 8 },

    iconGradient: { width: 84, height: 84, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },

    heading: { color: C.text, fontSize: 22, fontFamily: FONTS.extrabold, textAlign: 'center', marginBottom: 8 },
    sub: { color: C.textSecondary, fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 8 },

    stepsCard: {
      width: '100%', backgroundColor: C.card, borderRadius: 18,
      borderWidth: 1, borderColor: C.border, marginBottom: 20,
    },
    stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    stepIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    stepText: { flex: 1, color: C.text, fontSize: 13, fontFamily: FONTS.medium, lineHeight: 18 },

    bankLabel: { color: C.textMuted, fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 1, marginBottom: 8, alignSelf: 'flex-start' },
    bankCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: C.card, borderRadius: 16, padding: 14,
      borderWidth: 1.5, width: '100%', marginBottom: 16,
    },
    bankName: { color: C.text, fontSize: 14, fontFamily: FONTS.bold },
    bankAcc: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.regular, marginTop: 3 },

    disclaimer: { color: C.textMuted, fontSize: 12, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 18, paddingHorizontal: 12 },

    footer: { paddingHorizontal: 20, paddingBottom: 36, gap: 6 },
    confirmBtn: { borderRadius: 16, overflow: 'hidden' },
    confirmBtnInner: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    confirmBtnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },
    cancelBtn: { height: 50, alignItems: 'center', justifyContent: 'center' },
    cancelText: { fontSize: 15, fontFamily: FONTS.semibold },
  });
}
