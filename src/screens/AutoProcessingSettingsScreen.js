import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { feedbackLight, feedbackMedium, feedbackSelect, feedbackError } from '../utils/feedback';
import BankLogo from '../components/BankLogo';
import { useAuth } from '../context/AuthContext';
import { updateAutoProcessing } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

const SUPPORTED_COINS = [
  { symbol: 'BTC', color: '#F7931A', name: 'Bitcoin' },
  { symbol: 'ETH', color: '#627EEA', name: 'Ethereum' },
  { symbol: 'SOL', color: '#9945FF', name: 'Solana' },
  { symbol: 'BNB', color: '#F3BA2F', name: 'BNB' },
  { symbol: 'USDT', color: '#26A17B', name: 'Tether USDT' },
  { symbol: 'USDC', color: '#2775CA', name: 'USD Coin' },
];

export default function AutoProcessingSettingsScreen({ navigation }) {
  const { colors } = useTheme();
  const S = useMemo(() => makeStyles(colors), [colors]);
  const { user, refreshUser } = useAuth();

  const ap = user?.autoProcessing || {};
  const [isActive, setIsActive] = useState(ap.enabled ?? false);
  const bank = {
    bank: ap.bankName || '',
    accountNumber: ap.accountNumber || '0000000000',
    accountName: ap.accountName || '',
  };

  useFocusEffect(useCallback(() => {
    const fresh = user?.autoProcessing || {};
    setIsActive(fresh.enabled ?? false);
  }, [user]));

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(20)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const statusPulse = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, tension: 70, friction: 9, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (pulseLoop.current) {
      pulseLoop.current.stop();
      statusPulse.setValue(1);
    }
    if (isActive) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(statusPulse, { toValue: 1.18, duration: 850, useNativeDriver: true }),
          Animated.timing(statusPulse, { toValue: 1, duration: 850, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    }
    return () => pulseLoop.current?.stop();
  }, [isActive]);

  const handleToggle = async (val) => {
    feedbackMedium();
    Animated.sequence([
      Animated.spring(cardScale, { toValue: 0.96, tension: 250, friction: 8, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, tension: 250, friction: 8, useNativeDriver: true }),
    ]).start();
    setIsActive(val);
    try {
      const fresh = user?.autoProcessing || {};
      await updateAutoProcessing({
        enabled: val,
        bankName: fresh.bankName,
        accountNumber: fresh.accountNumber,
        accountName: fresh.accountName,
      });
      refreshUser({ autoProcessing: { ...fresh, enabled: val } });
    } catch {
      feedbackError();
      setIsActive(!val);
    }
  };

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => { feedbackLight(); navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={S.title}>Auto Processing</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>
        <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideY }] }}>

          {/* Status toggle card */}
          <Animated.View style={{ transform: [{ scale: cardScale }], marginBottom: 24 }}>
            {isActive ? (
              <LinearGradient colors={['#3D1F8C', '#5B21B6', '#7C3AED']} style={S.statusCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={S.decoA} />
                <View style={S.decoB} />
                <View style={S.toggleRow}>
                  <View style={S.statusIndicator}>
                    <Animated.View style={[S.dotRing, { transform: [{ scale: statusPulse }] }]}>
                      <View style={[S.statusDot, { backgroundColor: '#10B981' }]} />
                    </Animated.View>
                    <View>
                      <Text style={[S.statusLabel, { color: '#fff' }]}>Active</Text>
                      <Text style={[S.statusSub, { color: 'rgba(255,255,255,0.6)' }]}>Watching for deposits</Text>
                    </View>
                  </View>
                  <Switch
                    value={isActive}
                    onValueChange={handleToggle}
                    trackColor={{ false: colors.border, true: '#10B981' }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor={colors.border}
                  />
                </View>
                <View style={S.flowDivider} />
                <View style={S.flowRow}>
                  <View style={S.flowStep}>
                    <View style={[S.flowIconBox, { backgroundColor: '#F7931A20' }]}>
                      <Ionicons name="logo-bitcoin" size={20} color="#F7931A" />
                    </View>
                    <Text style={S.flowLabel}>Crypto{'\n'}Received</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
                  <View style={S.flowStep}>
                    <View style={[S.flowIconBox, { backgroundColor: '#10B98120' }]}>
                      <Ionicons name="swap-horizontal" size={20} color="#10B981" />
                    </View>
                    <Text style={S.flowLabel}>Auto{'\n'}Convert</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
                  <View style={S.flowStep}>
                    <View style={[S.flowIconBox, { backgroundColor: '#60A5FA20' }]}>
                      <Ionicons name="card" size={20} color="#60A5FA" />
                    </View>
                    <Text style={S.flowLabel}>Sent to{'\n'}Bank</Text>
                  </View>
                </View>
              </LinearGradient>
            ) : (
              <View style={[S.statusCard, S.statusCardOff]}>
                <View style={S.toggleRow}>
                  <View style={S.statusIndicator}>
                    <View style={[S.dotRing, { backgroundColor: colors.card }]}>
                      <View style={[S.statusDot, { backgroundColor: colors.textMuted }]} />
                    </View>
                    <View>
                      <Text style={[S.statusLabel, { color: colors.text }]}>Off</Text>
                      <Text style={[S.statusSub, { color: colors.textSecondary }]}>Crypto stays in CERA balance</Text>
                    </View>
                  </View>
                  <Switch
                    value={isActive}
                    onValueChange={handleToggle}
                    trackColor={{ false: colors.border, true: '#10B981' }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor={colors.border}
                  />
                </View>
              </View>
            )}
          </Animated.View>

          {/* Bank account */}
          <Text style={S.sectionLabel}>PAYOUT ACCOUNT</Text>
          {bank.bank ? (
            <View style={[S.bankCard, isActive && { borderColor: colors.primary + '45' }]}>
              <BankLogo bankName={bank.bank} size={46} />
              <View style={{ flex: 1 }}>
                <Text style={S.bankName}>{bank.bank}</Text>
                <Text style={S.bankAcc}>{'*'.repeat(6) + bank.accountNumber.slice(-4)}</Text>
                <Text style={S.bankHolder}>{bank.accountName}</Text>
              </View>
              <TouchableOpacity
                style={[S.changeBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
                onPress={() => { feedbackSelect(); navigation.navigate('AutoProcessingSetup'); }}
                activeOpacity={0.7}
              >
                <Text style={[S.changeBtnText, { color: colors.primary }]}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[S.bankCard, { borderStyle: 'dashed', borderColor: colors.primary + '40' }]}
              onPress={() => { feedbackSelect(); navigation.navigate('AutoProcessingSetup'); }}
              activeOpacity={0.7}
            >
              <View style={[S.bankIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[S.bankName, { color: colors.primary }]}>Add Payout Bank</Text>
                <Text style={S.bankHolder}>Link your Nigerian bank account</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}

          {/* Supported coins */}
          <Text style={S.sectionLabel}>SUPPORTED COINS</Text>
          <View style={[S.coinsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {SUPPORTED_COINS.map((coin, i) => (
              <View key={coin.symbol} style={[S.coinRow, i < SUPPORTED_COINS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={[S.coinDot, { backgroundColor: coin.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={S.coinSymbol}>{coin.symbol}</Text>
                  <Text style={S.coinName}>{coin.name}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              </View>
            ))}
          </View>

          {/* Off state — setup prompt */}
          {!isActive && (
            <>
              <View style={S.offInfo}>
                <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
                <Text style={[S.offInfoText, { color: colors.textSecondary }]}>
                  When Off, crypto received stays in your CERA balance and you process it manually.
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={S.activateBtn}
                onPress={() => { feedbackMedium(); navigation.navigate('AutoProcessingSetup'); }}
              >
                <LinearGradient colors={['#7C3AED', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.activateBtnInner}>
                  <Ionicons name="flash-outline" size={18} color="#fff" />
                  <Text style={S.activateBtnText}>Activate Auto Processing</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

        </Animated.View>
      </ScrollView>
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
    scroll: { paddingHorizontal: 20, paddingBottom: 60 },

    statusCard: { borderRadius: 22, padding: 20, overflow: 'hidden' },
    statusCardOff: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
    decoA: { position: 'absolute', top: -30, right: -30, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.06)' },
    decoB: { position: 'absolute', bottom: -40, left: -20, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.04)' },

    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    statusIndicator: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    dotRing: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#10B98130', alignItems: 'center', justifyContent: 'center' },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    statusLabel: { fontSize: 17, fontFamily: FONTS.extrabold },
    statusSub: { fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },

    flowDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 16 },
    flowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    flowStep: { alignItems: 'center', gap: 6, flex: 1 },
    flowIconBox: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    flowLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontFamily: FONTS.semibold, textAlign: 'center', lineHeight: 14 },

    sectionLabel: { color: C.textMuted, fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 1, marginBottom: 10 },

    bankCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: C.card, borderRadius: 18, padding: 14,
      borderWidth: 1.5, borderColor: C.border, marginBottom: 22,
    },
    bankIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    bankName: { color: C.text, fontSize: 14, fontFamily: FONTS.bold },
    bankAcc: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.medium, letterSpacing: 1, marginTop: 3 },
    bankHolder: { color: C.textMuted, fontSize: 11, fontFamily: FONTS.regular, marginTop: 2 },
    changeBtn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
    changeBtnText: { fontSize: 12, fontFamily: FONTS.semibold },

    coinsCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, marginBottom: 20 },
    coinRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
    coinDot: { width: 10, height: 10, borderRadius: 5 },
    coinSymbol: { color: C.text, fontSize: 14, fontFamily: FONTS.bold },
    coinName: { color: C.textSecondary, fontSize: 11, fontFamily: FONTS.regular, marginTop: 1 },

    offInfo: {
      flexDirection: 'row', gap: 10, alignItems: 'flex-start',
      backgroundColor: C.card, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: C.border, marginBottom: 20,
    },
    offInfoText: { fontSize: 13, fontFamily: FONTS.regular, flex: 1, lineHeight: 18 },

    activateBtn: { borderRadius: 16, overflow: 'hidden' },
    activateBtnInner: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    activateBtnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },
  });
}
