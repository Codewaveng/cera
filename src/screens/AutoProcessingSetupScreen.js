import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { NIGERIAN_BANKS } from '../constants/data';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { feedbackLight, feedbackSelect, feedbackSuccess } from '../utils/feedback';
import BankLogo from '../components/BankLogo';
import { verifyBankAccount } from '../services/api';

const SUPPORTED_COINS = [
  { symbol: 'BTC', color: '#F7931A' },
  { symbol: 'ETH', color: '#627EEA' },
  { symbol: 'SOL', color: '#9945FF' },
  { symbol: 'BNB', color: '#F3BA2F' },
  { symbol: 'USDT', color: '#26A17B' },
  { symbol: 'USDC', color: '#2775CA' },
];

export default function AutoProcessingSetupScreen({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const S = useMemo(() => makeStyles(colors), [colors]);

  const existing = user?.autoProcessing || {};

  const [bank, setBank] = useState(existing.bankName || '');
  const [accountNumber, setAccountNumber] = useState(existing.accountNumber || '');
  const [accountName, setAccountName] = useState(existing.accountName || '');
  const [resolving, setResolving] = useState(false);
  const [bankModal, setBankModal] = useState(false);

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroSlide   = useRef(new Animated.Value(30)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const btnScale    = useRef(new Animated.Value(0.94)).current;
  const btnOpacity  = useRef(new Animated.Value(0)).current;
  const arrowPulse  = useRef(new Animated.Value(1)).current;
  const verifyRef   = useRef(null);

  useEffect(() => {
    Animated.stagger(80, [
      Animated.parallel([
        Animated.timing(heroOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.spring(heroSlide, { toValue: 0, tension: 70, friction: 9, useNativeDriver: true }),
      ]),
      Animated.timing(formOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(btnOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(btnScale, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowPulse, { toValue: 1.2, duration: 700, useNativeDriver: true }),
        Animated.timing(arrowPulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  function runVerify(accNum, bankName) {
    if (verifyRef.current) clearTimeout(verifyRef.current);
    setAccountName('');
    if (accNum.length !== 10 || !bankName) return;
    setResolving(true);
    verifyRef.current = setTimeout(async () => {
      try {
        const res = await verifyBankAccount(accNum, bankName);
        feedbackSuccess();
        setAccountName(res.data.accountName);
      } catch {
        setAccountName('');
      } finally {
        setResolving(false);
      }
    }, 800);
  }

  const handleAccountNumber = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    setAccountNumber(cleaned);
    runVerify(cleaned, bank);
  };

  const selectBank = (b) => {
    feedbackSelect();
    setBank(b);
    setBankModal(false);
    runVerify(accountNumber, b);
  };

  const canProceed = !!(bank && accountNumber.length === 10 && accountName);

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => { feedbackLight(); navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={S.title}>Payout Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled">

        {/* Hero */}
        <Animated.View style={{ opacity: heroOpacity, transform: [{ translateY: heroSlide }] }}>
          <LinearGradient colors={['#3D1F8C', '#5B21B6', '#7C3AED']} style={S.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={S.heroDeco1} />
            <View style={S.heroDeco2} />
            <Text style={S.heroEyebrow}>Set it once. Forget it.</Text>
            <View style={S.flowRow}>
              <View style={S.flowStep}>
                <View style={[S.flowIconBox, { backgroundColor: '#F7931A20' }]}>
                  <Ionicons name="logo-bitcoin" size={24} color="#F7931A" />
                </View>
                <Text style={S.flowLabel}>Crypto{'\n'}Received</Text>
              </View>
              <Animated.View style={{ transform: [{ scale: arrowPulse }] }}>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
              </Animated.View>
              <View style={S.flowStep}>
                <View style={[S.flowIconBox, { backgroundColor: '#10B98120' }]}>
                  <Ionicons name="swap-horizontal" size={24} color="#10B981" />
                </View>
                <Text style={S.flowLabel}>Auto{'\n'}Convert</Text>
              </View>
              <Animated.View style={{ transform: [{ scale: arrowPulse }] }}>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
              </Animated.View>
              <View style={S.flowStep}>
                <View style={[S.flowIconBox, { backgroundColor: '#60A5FA20' }]}>
                  <Ionicons name="card" size={24} color="#60A5FA" />
                </View>
                <Text style={S.flowLabel}>Sent to{'\n'}Bank</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Supported coins */}
        <Animated.View style={{ opacity: formOpacity }}>
          <Text style={S.sectionLabel}>SUPPORTED COINS</Text>
          <View style={S.coinsRow}>
            {SUPPORTED_COINS.map((coin) => (
              <View key={coin.symbol} style={[S.coinChip, { borderColor: coin.color + '40', backgroundColor: coin.color + '12' }]}>
                <View style={[S.coinDot, { backgroundColor: coin.color }]} />
                <Text style={[S.coinText, { color: coin.color }]}>{coin.symbol}</Text>
              </View>
            ))}
          </View>

          {/* Bank account form */}
          <Text style={S.sectionLabel}>YOUR PAYOUT ACCOUNT</Text>
          <View style={S.formCard}>

            {/* Bank selector */}
            <View style={S.field}>
              <Text style={S.fieldLabel}>Bank</Text>
              <TouchableOpacity
                style={[S.bankSelector, bank && { borderColor: colors.primary + '60' }]}
                onPress={() => { feedbackSelect(); setBankModal(true); }}
                activeOpacity={0.7}
              >
                {bank ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <BankLogo bankName={bank} size={30} />
                    <Text style={[S.selectorText, { color: colors.text }]}>{bank}</Text>
                  </View>
                ) : (
                  <Text style={[S.selectorText, { color: colors.textMuted }]}>Select your bank</Text>
                )}
                <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Account number */}
            <View style={[S.field, { marginBottom: 0 }]}>
              <Text style={S.fieldLabel}>Account Number</Text>
              <TextInput
                style={[S.input, { color: colors.text, borderColor: accountNumber.length === 10 ? colors.primary + '60' : colors.border }]}
                placeholder="Enter 10-digit account number"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                value={accountNumber}
                onChangeText={handleAccountNumber}
                maxLength={10}
              />
              {accountNumber.length === 10 && (
                <View style={S.nameHint}>
                  {resolving ? (
                    <>
                      <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                      <Text style={[S.nameText, { color: colors.textMuted }]}>Resolving account name…</Text>
                    </>
                  ) : accountName ? (
                    <>
                      <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                      <Text style={[S.nameText, { color: colors.success }]}>{accountName}</Text>
                    </>
                  ) : null}
                </View>
              )}
            </View>
          </View>

          <View style={S.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={[S.infoText, { color: colors.textSecondary }]}>
              Auto Processing is free. You can change or disable it at any time from your settings.
            </Text>
          </View>
        </Animated.View>

      </ScrollView>

      {/* Proceed button */}
      <Animated.View style={[S.footer, { opacity: btnOpacity, transform: [{ scale: btnScale }] }]}>
        <TouchableOpacity
          activeOpacity={canProceed ? 0.85 : 1}
          disabled={!canProceed}
          onPress={() => {
            feedbackSelect();
            navigation.navigate('AutoProcessingConfirm', {
              bank: { bank, accountNumber, accountName },
            });
          }}
          style={S.activateBtn}
        >
          <LinearGradient
            colors={canProceed ? ['#7C3AED', '#5B21B6'] : [colors.border, colors.border]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={S.activateBtnInner}
          >
            <Ionicons name="flash" size={18} color={canProceed ? '#fff' : colors.textMuted} />
            <Text style={[S.activateBtnText, !canProceed && { color: colors.textMuted }]}>
              Continue
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Bank picker modal */}
      <Modal visible={bankModal} animationType="slide" transparent onRequestClose={() => setBankModal(false)}>
        <TouchableOpacity style={S.modalOverlay} activeOpacity={1} onPress={() => setBankModal(false)}>
          <View style={[S.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[S.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[S.modalTitle, { color: colors.text }]}>Select Bank</Text>
            <FlatList
              data={NIGERIAN_BANKS}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[S.bankOption, bank === item && { backgroundColor: colors.primary + '12' }]}
                  onPress={() => selectBank(item)}
                  activeOpacity={0.7}
                >
                  <BankLogo bankName={item} size={36} />
                  <Text style={[S.bankOptionText, { color: bank === item ? colors.primary : colors.text }]}>{item}</Text>
                  {bank === item && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
    title: { color: C.text, fontSize: 18, fontFamily: FONTS.bold },
    scroll: { paddingHorizontal: 20, paddingBottom: 120 },

    hero: { borderRadius: 22, padding: 24, marginBottom: 24, overflow: 'hidden' },
    heroDeco1: { position: 'absolute', top: -40, right: -40, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.06)' },
    heroDeco2: { position: 'absolute', bottom: -30, left: -20, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.04)' },
    heroEyebrow: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: FONTS.medium, marginBottom: 22, letterSpacing: 0.3 },
    flowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    flowStep: { alignItems: 'center', gap: 8, flex: 1 },
    flowIconBox: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    flowLabel: { color: '#fff', fontSize: 11, fontFamily: FONTS.semibold, textAlign: 'center', lineHeight: 16 },

    sectionLabel: { color: C.textMuted, fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 1, marginBottom: 10 },

    coinsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
    coinChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
    coinDot: { width: 6, height: 6, borderRadius: 3 },
    coinText: { fontSize: 12, fontFamily: FONTS.bold, letterSpacing: 0.3 },

    formCard: { backgroundColor: C.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.border, marginBottom: 14 },
    field: { marginBottom: 16 },
    fieldLabel: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.semibold, marginBottom: 8 },
    bankSelector: {
      backgroundColor: C.inputBg, borderRadius: 14, borderWidth: 1, borderColor: C.border,
      paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row',
      alignItems: 'center', justifyContent: 'space-between', minHeight: 52,
    },
    selectorText: { fontSize: 15, fontFamily: FONTS.medium },
    input: {
      backgroundColor: C.inputBg, borderRadius: 14, borderWidth: 1,
      paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: FONTS.medium,
    },
    nameHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingHorizontal: 4 },
    nameText: { fontSize: 13, fontFamily: FONTS.semibold },

    infoBox: {
      flexDirection: 'row', gap: 10, backgroundColor: C.primary + '10',
      borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.primary + '25',
      alignItems: 'flex-start', marginBottom: 14,
    },
    infoText: { fontSize: 12, fontFamily: FONTS.regular, flex: 1, lineHeight: 18 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 36, paddingTop: 14, backgroundColor: C.bg },
    activateBtn: { borderRadius: 16, overflow: 'hidden' },
    activateBtnInner: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    activateBtnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '75%' },
    modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 17, fontFamily: FONTS.bold, marginBottom: 14 },
    bankOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: C.border },
    bankOptionText: { flex: 1, fontSize: 15, fontFamily: FONTS.medium },
  });
}
