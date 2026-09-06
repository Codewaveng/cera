import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Animated, ActivityIndicator,
} from 'react-native';
import NumericKeypad from '../components/NumericKeypad';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { feedbackLight, feedbackSelect, feedbackCash, feedbackSuccess, feedbackError } from '../utils/feedback';
import { lookupUser, ceraTransfer } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AppModal from '../components/AppModal';
import UserAvatar from '../components/UserAvatar';
import { registerPinCallback } from './PinEntryScreen';

export default function CeraTransferScreen({ navigation }) {
  const { colors } = useTheme();
  const S = useMemo(() => makeStyles(colors), [colors]);
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState('form'); // 'form' | 'amount'
  const [query, setQuery]           = useState('');
  const [recipient, setRecipient]   = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError]     = useState('');
  const [amount, setAmount]         = useState('');
  const [modal, setModal]           = useState({ visible: false, type: 'success', title: '', message: '' });

  const formOpacity = useRef(new Animated.Value(0)).current;
  const formSlide   = useRef(new Animated.Value(24)).current;
  const recipientScale = useRef(new Animated.Value(0.94)).current;
  const recipientOpacity = useRef(new Animated.Value(0)).current;
  const amountFade = useRef(new Animated.Value(0)).current;
  const amountSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(formOpacity, { toValue: 1, duration: 420, delay: 100, useNativeDriver: true }),
      Animated.spring(formSlide, { toValue: 0, tension: 65, friction: 9, delay: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (step === 'amount') {
      amountFade.setValue(0);
      amountSlide.setValue(30);
      Animated.parallel([
        Animated.timing(amountFade, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(amountSlide, { toValue: 0, tension: 65, friction: 9, useNativeDriver: true }),
      ]).start();
    }
  }, [step]);

  function animateRecipientIn() {
    recipientScale.setValue(0.94);
    recipientOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(recipientOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(recipientScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
    ]).start();
  }

  async function handleLookup() {
    if (!query.trim()) return;
    feedbackSelect();
    setLookupError('');
    setRecipient(null);
    setLookupLoading(true);
    try {
      const res = await lookupUser(query.trim());
      setRecipient(res.data.user);
      animateRecipientIn();
    } catch (err) {
      feedbackError();
      setLookupError(err?.response?.data?.error || 'User not found');
    } finally {
      setLookupLoading(false);
    }
  }

  function handleProceed() {
    feedbackSelect();
    setStep('amount');
  }

  function handleAmountBack() {
    feedbackLight();
    setAmount('');
    setStep('form');
  }

  function handleAmountKey(key) {
    setAmount((prev) => {
      if (key === '⌫') return prev.slice(0, -1);
      if (key === '.' && prev.includes('.')) return prev;
      if (key === '.' && prev === '') return '0.';
      if (prev === '0' && key !== '.') return key;
      const next = prev + key;
      const parts = next.split('.');
      if (parts[1] && parts[1].length > 2) return prev;
      if (parts[0].length > 8) return prev;
      return next;
    });
  }

  function handleMax() {
    feedbackSelect();
    const maxVal = Number.isInteger(balance) ? String(balance) : balance.toFixed(2).replace(/\.?0+$/, '');
    setAmount(maxVal || '0');
  }

  function handleSend() {
    if (!canSend) return;
    feedbackSelect();

    registerPinCallback('ceraTransfer', async (pin, { onError, goBack }) => {
      try {
        const res = await ceraTransfer({
          recipientQuery: recipient.ceraId,
          amount: parseFloat(amount),
          pin,
        });
        feedbackSuccess();
        feedbackCash();
        refreshUser({ balance: res.data.newBalance });
        goBack();
        setModal({
          visible: true,
          type: 'cash',
          title: 'Transfer Sent!',
          message: `₦${parseFloat(amount).toLocaleString('en-NG')} sent to ${recipient.name} successfully.`,
        });
        setRecipient(null);
        setQuery('');
        setAmount('');
        setStep('form');
      } catch (err) {
        onError(err?.response?.data?.error || 'Transfer failed');
      }
    });

    navigation.navigate('PinEntry', {
      title: 'Confirm Transfer',
      subtitle: `Sending ₦${parseFloat(amount || 0).toLocaleString('en-NG')} to ${recipient?.name}`,
      callbackKey: 'ceraTransfer',
    });
  }

  const balance = user?.balance ?? 0;
  const activeAmount = parseFloat(amount) || 0;
  const fee = 0;
  const balanceAfter = Math.max(0, balance - activeAmount - fee);
  const canSend = !!(amount && parseFloat(amount) >= 50);

  return (
    <SafeAreaView style={S.container} edges={['top']}>

      {/* ══════════ FORM STEP ══════════ */}
      {step === 'form' && (
        <>
          <View style={S.header}>
            <TouchableOpacity style={S.backBtn} onPress={() => { feedbackLight(); navigation.goBack(); }}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={S.title}>CERA Transfer</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled">

            <Animated.View style={{ opacity: formOpacity }}>
              <View style={S.balancePill}>
                <Ionicons name="wallet-outline" size={14} color={colors.primary} />
                <Text style={[S.balanceText, { color: colors.primary }]}>
                  Balance: ₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </Animated.View>

            <Animated.View style={[S.card, { opacity: formOpacity, transform: [{ translateY: formSlide }] }]}>
              <Text style={S.cardTitle}>Who are you sending to?</Text>
              <View style={S.lookupRow}>
                <TextInput
                  style={[S.lookupInput, { flex: 1 }]}
                  placeholder="CERA ID or email address"
                  placeholderTextColor={colors.textMuted}
                  value={query}
                  onChangeText={(t) => { setQuery(t); setRecipient(null); setLookupError(''); }}
                  autoCapitalize="none"
                  returnKeyType="search"
                  onSubmitEditing={handleLookup}
                />
                <TouchableOpacity
                  style={[S.lookupBtn, { backgroundColor: colors.primary }]}
                  onPress={handleLookup}
                  activeOpacity={0.8}
                  disabled={lookupLoading || !query.trim()}
                >
                  {lookupLoading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Ionicons name="search" size={18} color="#fff" />
                  }
                </TouchableOpacity>
              </View>

              {!!lookupError && (
                <View style={S.errorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                  <Text style={[S.errorText, { color: colors.error }]}>{lookupError}</Text>
                </View>
              )}

              {recipient && (
                <Animated.View style={[S.recipientCard, { transform: [{ scale: recipientScale }], opacity: recipientOpacity }]}>
                  <UserAvatar name={recipient?.name} size={44} radius={14} />
                  <View style={{ flex: 1 }}>
                    <Text style={S.recipientName}>{recipient.name}</Text>
                    <Text style={S.recipientId}>{recipient.ceraId}</Text>
                  </View>
                  <View style={[S.verifiedBadge, { backgroundColor: colors.success + '18', borderColor: colors.success + '35' }]}>
                    <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                    <Text style={[S.verifiedText, { color: colors.success }]}>Found</Text>
                  </View>
                </Animated.View>
              )}
            </Animated.View>

          </ScrollView>

          {/* Proceed button — fixed bottom */}
          {!!recipient && (
            <View style={S.proceedFooter}>
              <TouchableOpacity style={S.proceedBtn} onPress={handleProceed} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#7C3AED', '#5B21B6']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={S.proceedBtnInner}
                >
                  <Text style={S.proceedBtnText}>Proceed</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* ══════════ AMOUNT STEP ══════════ */}
      {step === 'amount' && (
        <>
          <View style={S.header}>
            <TouchableOpacity style={S.backBtn} onPress={handleAmountBack}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={S.title}>Enter Amount</Text>
            <View style={{ width: 40 }} />
          </View>

          <Animated.View style={[S.amountBody, { opacity: amountFade, transform: [{ translateY: amountSlide }] }]}>

            {/* Recipient avatar */}
            <UserAvatar name={recipient?.name} size={84} radius={26} />

            <Text style={S.sendingToLabel}>Sending to</Text>
            <Text style={S.recipientBigName}>{recipient?.name}</Text>
            <Text style={S.recipientBigSub}>{recipient?.ceraId}</Text>

            {/* Balance + MAX */}
            <View style={S.balanceMaxRow}>
              <View style={S.balanceChip}>
                <Ionicons name="wallet-outline" size={13} color={colors.primary} />
                <Text style={[S.balanceChipText, { color: colors.primary }]}>
                  ₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <TouchableOpacity style={S.maxBtn} onPress={handleMax} activeOpacity={0.7}>
                <Text style={[S.maxBtnText, { color: colors.primary }]}>MAX</Text>
              </TouchableOpacity>
            </View>

            {/* Amount display */}
            <View style={S.amountDisplay}>
              <Text style={[S.amountText, activeAmount > 0 && { color: colors.text }]}>
                <Text style={S.nairaSymbol}>₦</Text>
                {amount || '0'}
              </Text>
              {activeAmount > 0 && activeAmount < 50 && (
                <Text style={[S.hint, { color: colors.warning }]}>Minimum ₦50</Text>
              )}
            </View>

            {/* Fee + balance after */}
            {activeAmount > 0 && (
              <View style={S.infoRow}>
                <View style={S.infoChip}>
                  <Text style={S.infoLabel}>Fee</Text>
                  <Text style={[S.infoVal, { color: colors.text }]}>₦{fee.toLocaleString('en-NG')}</Text>
                </View>
                <View style={[S.infoChip, { marginLeft: 8 }]}>
                  <Text style={S.infoLabel}>After</Text>
                  <Text style={[S.infoVal, { color: colors.text }]}>
                    ₦{balanceAfter.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>

          {/* Fixed bottom: send button + keypad */}
          <View style={S.keypadSection}>
            {canSend && (
              <TouchableOpacity style={S.sendBtn} onPress={handleSend} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#7C3AED', '#5B21B6']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={S.sendBtnInner}
                >
                  <Ionicons name="lock-closed-outline" size={16} color="#fff" />
                  <Text style={S.sendBtnText}>Send with PIN</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            <NumericKeypad mode="amount" onKey={handleAmountKey} />
          </View>
        </>
      )}

      <AppModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        primaryLabel="Done"
        onClose={() => setModal(m => ({ ...m, visible: false }))}
        onPrimary={() => setModal(m => ({ ...m, visible: false }))}
      />
    </SafeAreaView>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
    title: { color: C.text, fontSize: 18, fontFamily: FONTS.bold },

    scroll: { paddingHorizontal: 20, paddingBottom: 20 },

    balancePill: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: C.primary + '12', borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'flex-start',
      marginBottom: 16, borderWidth: 1, borderColor: C.primary + '25',
    },
    balanceText: { fontSize: 13, fontFamily: FONTS.semibold },

    card: { backgroundColor: C.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.border, marginBottom: 14 },
    cardTitle: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.semibold, marginBottom: 12, letterSpacing: 0.3 },

    lookupRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    lookupInput: { backgroundColor: C.inputBg, borderRadius: 13, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 13, color: C.text, fontSize: 14, fontFamily: FONTS.medium },
    lookupBtn: { width: 48, height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },

    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    errorText: { fontSize: 12, fontFamily: FONTS.medium },

    recipientCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, backgroundColor: C.primary + '0C', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.primary + '30' },
    recipientAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    recipientInitials: { color: '#fff', fontSize: 16, fontFamily: FONTS.extrabold },
    recipientName: { color: C.text, fontSize: 14, fontFamily: FONTS.bold },
    recipientId: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.regular, marginTop: 2, letterSpacing: 0.5 },
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
    verifiedText: { fontSize: 11, fontFamily: FONTS.bold },

    // Form step proceed button
    proceedFooter: {
      paddingHorizontal: 20, paddingBottom: 28, paddingTop: 12,
      borderTopWidth: 1, borderTopColor: C.border,
    },
    proceedBtn: { borderRadius: 14, overflow: 'hidden' },
    proceedBtnInner: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    proceedBtnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },

    // Amount step
    amountBody: {
      flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24,
    },
    avatarBig: { width: 84, height: 84, borderRadius: 26, marginBottom: 14 },
    sendingToLabel: { color: C.textMuted, fontSize: 12, fontFamily: FONTS.medium, marginBottom: 4 },
    recipientBigName: { color: C.text, fontSize: 22, fontFamily: FONTS.extrabold, textAlign: 'center', marginBottom: 4 },
    recipientBigSub: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.regular, marginBottom: 18 },

    balanceMaxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    balanceChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: C.primary + '12', borderRadius: 10,
      paddingHorizontal: 10, paddingVertical: 5,
      borderWidth: 1, borderColor: C.primary + '25',
    },
    balanceChipText: { fontSize: 12, fontFamily: FONTS.semibold },
    maxBtn: {
      backgroundColor: C.primary + '18', borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 5,
      borderWidth: 1, borderColor: C.primary + '30',
    },
    maxBtnText: { fontSize: 12, fontFamily: FONTS.bold, letterSpacing: 0.5 },

    amountDisplay: { alignItems: 'center', marginVertical: 4 },
    amountText: { color: C.textMuted, fontSize: 52, fontFamily: FONTS.extrabold, letterSpacing: -1 },
    nairaSymbol: { color: C.textMuted, fontSize: 28, fontFamily: FONTS.bold },
    hint: { fontSize: 12, fontFamily: FONTS.regular, marginTop: 4 },

    infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    infoChip: {
      backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border,
      paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6,
    },
    infoLabel: { color: C.textMuted, fontSize: 11, fontFamily: FONTS.regular },
    infoVal: { fontSize: 12, fontFamily: FONTS.semibold },

    // Fixed keypad section
    keypadSection: {
      borderTopWidth: 1, borderTopColor: C.border,
      backgroundColor: C.bg, paddingTop: 10,
    },
    sendBtn: { borderRadius: 14, overflow: 'hidden', marginHorizontal: 20, marginBottom: 8 },
    sendBtnInner: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    sendBtnText: { color: '#fff', fontSize: 15, fontFamily: FONTS.bold },
  });
}
