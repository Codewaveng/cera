import React, { useState, useMemo, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Modal, FlatList, Animated, ActivityIndicator, BackHandler,
} from 'react-native';
import NumericKeypad from '../components/NumericKeypad';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { NIGERIAN_BANKS } from '../constants/data';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { feedbackLight, feedbackSelect, feedbackCash, feedbackSuccess, feedbackError } from '../utils/feedback';
import AppModal from '../components/AppModal';
import BankLogo from '../components/BankLogo';
import UserAvatar from '../components/UserAvatar';
import { lookupUser, ceraTransfer, getRecentCeraRecipients, verifyBankAccount } from '../services/api';
import { registerPinCallback } from './PinEntryScreen';

const RECENT_BANK_KEY = 'cera_recent_bank_accounts';

// ─── Sub-components ───────────────────────────────────────────

function CeraContactCard({ contact, onPress, index }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, delay: index * 60, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 70, friction: 9, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale: pressScale }] }}>
      <TouchableOpacity
        style={styles.contactBtn}
        onPress={() => { feedbackSelect(); onPress(contact); }}
        onPressIn={() => Animated.spring(pressScale, { toValue: 0.87, useNativeDriver: true, tension: 280 }).start()}
        onPressOut={() => Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, tension: 280 }).start()}
        activeOpacity={1}
      >
        <UserAvatar name={contact.name} size={52} radius={16} />
        <Text style={[styles.contactName, { color: colors.text }]} numberOfLines={1}>{contact.name?.split(' ')[0]}</Text>
        <Text style={[styles.contactSub, { color: colors.textMuted }]}>CERA</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function BankContactCard({ contact, onPress, index }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, delay: index * 60, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 70, friction: 9, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale: pressScale }] }}>
      <TouchableOpacity
        style={styles.contactBtn}
        onPress={() => { feedbackSelect(); onPress(contact); }}
        onPressIn={() => Animated.spring(pressScale, { toValue: 0.87, useNativeDriver: true, tension: 280 }).start()}
        onPressOut={() => Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, tension: 280 }).start()}
        activeOpacity={1}
      >
        <BankLogo bankName={contact.bank} size={52} />
        <Text style={[styles.contactName, { color: colors.text }]} numberOfLines={1}>
          {contact.name ? contact.name.split(' ')[0] : contact.bank?.split(' ')[0]}
        </Text>
        <Text style={[styles.contactSub, { color: colors.textMuted }]} numberOfLines={1}>{contact.bank}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function EmptyState({ icon, title, subtitle }) {
  const { colors } = useTheme();
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconWrap, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '20' }]}>
        <Ionicons name={icon} size={24} color={colors.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function SendScreen({ navigation }) {
  const { colors } = useTheme();
  const { user, refreshUser } = useAuth();
  const S = useMemo(() => makeStyles(colors), [colors]);

  const [step, setStep] = useState('choose'); // 'choose' | 'cera_form' | 'bank_form' | 'amount'
  const [activeTab, setActiveTab] = useState('cera');

  // Bank state
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [verifyingBank, setVerifyingBank] = useState(false);
  const [bankVerifyError, setBankVerifyError] = useState('');
  const [amount, setAmount] = useState('');
  const [bankModal, setBankModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);

  // CERA state
  const [ceraQuery, setCeraQuery] = useState('');
  const [ceraRecipient, setCeraRecipient] = useState(null);
  const [ceraLookupLoading, setCeraLookupLoading] = useState(false);
  const [ceraLookupError, setCeraLookupError] = useState('');
  const [ceraAmount, setCeraAmount] = useState('');
  const [ceraRecentRecipients, setCeraRecentRecipients] = useState([]);
  const [recentBankAccounts, setRecentBankAccounts] = useState([]);
  const [successData, setSuccessData] = useState(null); // { amount, name, ceraId, tx }

  // Animated values
  const card1Opacity = useRef(new Animated.Value(0)).current;
  const card1Y      = useRef(new Animated.Value(40)).current;
  const card2Opacity = useRef(new Animated.Value(0)).current;
  const card2Y      = useRef(new Animated.Value(40)).current;
  const formFade    = useRef(new Animated.Value(0)).current;
  const formSlide   = useRef(new Animated.Value(28)).current;
  const amountFade  = useRef(new Animated.Value(0)).current;
  const amountSlide = useRef(new Animated.Value(30)).current;
  const recipientScale   = useRef(new Animated.Value(0.94)).current;
  const recipientOpacity = useRef(new Animated.Value(0)).current;
  const bankVerifyTimeout = useRef(null);
  // Success screen anims
  const successFade  = useRef(new Animated.Value(0)).current;
  const successSlide = useRef(new Animated.Value(40)).current;
  const checkScale   = useRef(new Animated.Value(0)).current;
  // CERA hero loop anims
  const orb1 = useRef(new Animated.Value(1)).current;
  const orb2 = useRef(new Animated.Value(1)).current;
  const orb3 = useRef(new Animated.Value(1)).current;
  const iconFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem('cera_recent_recipients').then(s => {
      if (s) { try { setCeraRecentRecipients(JSON.parse(s)); } catch {} }
    });
    getRecentCeraRecipients().then(res => {
      const list = res.data.recipients || [];
      if (list.length > 0) {
        setCeraRecentRecipients(list);
        AsyncStorage.setItem('cera_recent_recipients', JSON.stringify(list));
      }
    }).catch(() => {});
    AsyncStorage.getItem(RECENT_BANK_KEY).then(s => {
      if (s) { try { setRecentBankAccounts(JSON.parse(s)); } catch {} }
    });
  }, []);

  useEffect(() => {
    if (step === 'choose') {
      card1Opacity.setValue(0); card1Y.setValue(40);
      card2Opacity.setValue(0); card2Y.setValue(40);
      Animated.parallel([
        Animated.timing(card1Opacity, { toValue: 1, duration: 380, delay: 80, useNativeDriver: true }),
        Animated.spring(card1Y, { toValue: 0, tension: 60, friction: 9, delay: 80, useNativeDriver: true }),
        Animated.timing(card2Opacity, { toValue: 1, duration: 380, delay: 180, useNativeDriver: true }),
        Animated.spring(card2Y, { toValue: 0, tension: 60, friction: 9, delay: 180, useNativeDriver: true }),
      ]).start();
    }

    if (step === 'cera_form' || step === 'bank_form') {
      formFade.setValue(0); formSlide.setValue(28);
      Animated.parallel([
        Animated.timing(formFade, { toValue: 1, duration: 360, delay: 60, useNativeDriver: true }),
        Animated.spring(formSlide, { toValue: 0, tension: 65, friction: 9, delay: 60, useNativeDriver: true }),
      ]).start();
    }

    if (step === 'cera_form') {
      orb1.setValue(1); orb2.setValue(1); orb3.setValue(1); iconFloat.setValue(0);
      Animated.loop(Animated.sequence([
        Animated.timing(orb1, { toValue: 1.35, duration: 2400, useNativeDriver: true }),
        Animated.timing(orb1, { toValue: 0.75, duration: 2400, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(orb2, { toValue: 1.25, duration: 2800, delay: 400, useNativeDriver: true }),
        Animated.timing(orb2, { toValue: 0.8, duration: 2800, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(orb3, { toValue: 1.4, duration: 2000, delay: 800, useNativeDriver: true }),
        Animated.timing(orb3, { toValue: 0.7, duration: 2000, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(iconFloat, { toValue: -9, duration: 1000, useNativeDriver: true }),
        Animated.timing(iconFloat, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])).start();
    }

    if (step === 'amount') {
      amountFade.setValue(0); amountSlide.setValue(30);
      Animated.parallel([
        Animated.timing(amountFade, { toValue: 1, duration: 340, useNativeDriver: true }),
        Animated.spring(amountSlide, { toValue: 0, tension: 65, friction: 9, useNativeDriver: true }),
      ]).start();
    }

    if (step === 'success') {
      successFade.setValue(0); successSlide.setValue(40); checkScale.setValue(0);
      Animated.parallel([
        Animated.timing(successFade, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.spring(successSlide, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
      ]).start(() =>
        Animated.spring(checkScale, { toValue: 1, tension: 75, friction: 5, useNativeDriver: true }).start()
      );
    }
  }, [step]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 'success') {
        feedbackLight(); setStep('choose'); setSuccessData(null); return true;
      }
      if (step === 'cera_form' || step === 'bank_form') {
        feedbackLight(); setStep('choose'); return true;
      }
      if (step === 'amount') {
        feedbackLight(); setAmount(''); setCeraAmount('');
        setStep(activeTab === 'cera' ? 'cera_form' : 'bank_form');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [step, activeTab]);

  function runBankVerify(accNum, bankName) {
    if (bankVerifyTimeout.current) clearTimeout(bankVerifyTimeout.current);
    setAccountName(''); setBankVerifyError('');
    if (accNum.length !== 10 || !bankName) return;
    setVerifyingBank(true);
    bankVerifyTimeout.current = setTimeout(async () => {
      try {
        const res = await verifyBankAccount(accNum, bankName);
        feedbackSuccess();
        setAccountName(res.data.accountName);
      } catch {
        setBankVerifyError('Could not verify account number');
      } finally { setVerifyingBank(false); }
    }, 800);
  }

  const handleAccountNumber = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    setAccountNumber(cleaned);
    runBankVerify(cleaned, bank);
  };

  const selectBankContact = (contact) => {
    feedbackSelect();
    setBank(contact.bank);
    setAccountNumber(contact.accountNumber);
    setTimeout(() => setAccountName(contact.name), 300);
  };

  const selectCeraContact = (contact) => {
    feedbackSelect();
    setCeraQuery(contact.ceraId);
    setCeraRecipient(contact);
    setCeraLookupError('');
    animateRecipientIn();
  };

  function animateRecipientIn() {
    recipientScale.setValue(0.94); recipientOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(recipientOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(recipientScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
    ]).start();
  }

  async function handleCeraLookup() {
    if (!ceraQuery.trim()) return;
    feedbackSelect();
    setCeraLookupError(''); setCeraRecipient(null); setCeraLookupLoading(true);
    try {
      const res = await lookupUser(ceraQuery.trim());
      setCeraRecipient(res.data.user);
      animateRecipientIn();
    } catch (err) {
      feedbackError();
      setCeraLookupError(err?.response?.data?.error || 'User not found');
    } finally { setCeraLookupLoading(false); }
  }

  function handleAmountKey(key) {
    const setter = activeTab === 'bank' ? setAmount : setCeraAmount;
    setter(prev => {
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

  function handleBankProceed() {
    feedbackSelect();
    const entry = { bank, accountNumber, name: accountName };
    setRecentBankAccounts(prev => {
      const next = [entry, ...prev.filter(r => r.accountNumber !== accountNumber)].slice(0, 8);
      AsyncStorage.setItem(RECENT_BANK_KEY, JSON.stringify(next));
      return next;
    });
    setStep('amount');
  }

  function handleAmountBack() {
    feedbackLight();
    setAmount(''); setCeraAmount('');
    setStep(activeTab === 'cera' ? 'cera_form' : 'bank_form');
  }

  function handleMax() {
    feedbackSelect();
    const maxVal = Number.isInteger(balance) ? String(balance) : balance.toFixed(2).replace(/\.?0+$/, '');
    if (activeTab === 'bank') setAmount(maxVal || '0');
    else setCeraAmount(maxVal || '0');
  }

  function handleCeraSend() {
    if (!canCeraSend) return;
    feedbackSelect();
    const snap = { name: ceraRecipient.name, ceraId: ceraRecipient.ceraId };
    const snapAmount = ceraAmount;
    registerPinCallback('sendScreenCeraTransfer', async (pin, { onError, goBack }) => {
      try {
        const res = await ceraTransfer({ recipientQuery: snap.ceraId, amount: parseFloat(snapAmount), pin });
        feedbackSuccess(); feedbackCash();
        refreshUser({ balance: res.data.newBalance });
        goBack();
        setCeraRecentRecipients(prev => {
          const updated = [snap, ...prev.filter(r => r.ceraId !== snap.ceraId)].slice(0, 5);
          AsyncStorage.setItem('cera_recent_recipients', JSON.stringify(updated));
          return updated;
        });
        const receiptTx = {
          type: 'cera_transfer_out',
          amount: parseFloat(snapAmount),
          txId: (res.data.txId || '') + '-OUT',
          createdAt: new Date().toISOString(),
          status: 'completed',
          narration: `Transfer to ${snap.name}`,
          to: { name: snap.name, ceraId: snap.ceraId },
        };
        setCeraRecipient(null); setCeraQuery(''); setCeraAmount('');
        setSuccessData({ amount: parseFloat(snapAmount), name: snap.name, ceraId: snap.ceraId, tx: receiptTx });
        setStep('success');
      } catch (err) { onError(err?.response?.data?.error || 'Transfer failed'); }
    });
    navigation.navigate('PinEntry', {
      title: 'Confirm Transfer',
      subtitle: `Sending ₦${parseFloat(ceraAmount || 0).toLocaleString('en-NG')} to ${ceraRecipient?.name}`,
      callbackKey: 'sendScreenCeraTransfer',
    });
  }

  const balance = user?.balance ?? 0;
  const activeAmount = parseFloat(activeTab === 'bank' ? amount : ceraAmount) || 0;
  const fee = 0;
  const balanceAfter = Math.max(0, balance - activeAmount - fee);
  const isOverBalance = activeAmount > 0 && activeAmount > balance;
  const canBankProceed = !!(bank && accountNumber.length === 10 && accountName && !verifyingBank);
  const canBankSend = !!(amount && parseFloat(amount) >= 1 && !isOverBalance);
  const canCeraSend = !!(ceraAmount && parseFloat(ceraAmount) >= 50 && !isOverBalance);

  return (
    <SafeAreaView style={S.container} edges={['top']}>

      {/* ══════════ SUCCESS SCREEN ══════════ */}
      {step === 'success' && successData && (
        <Animated.View style={{ flex: 1, opacity: successFade, transform: [{ translateY: successSlide }] }}>
          <View style={S.header}>
            <View style={{ width: 40 }} />
            <Text style={S.title}>Transfer Sent</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>

            {/* Animated checkmark */}
            <Animated.View style={{ transform: [{ scale: checkScale }], marginBottom: 28 }}>
              <LinearGradient colors={['#022C22', '#065F46']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 110, height: 110, borderRadius: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(52,211,153,0.4)', shadowColor: '#10B981', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 14 }}>
                <View style={{ position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(52,211,153,0.08)', top: -20, right: -20 }} />
                <Ionicons name="checkmark-circle" size={52} color="#34D399" />
              </LinearGradient>
            </Animated.View>

            <Text style={{ color: colors.text, fontSize: 26, fontFamily: FONTS.extrabold, textAlign: 'center', marginBottom: 8 }}>
              Transfer Successful!
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center', marginBottom: 32 }}>
              Your money is on its way
            </Text>

            {/* Details card */}
            <View style={{ width: '100%', backgroundColor: colors.card, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 28, gap: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.textMuted, fontSize: 13, fontFamily: FONTS.regular }}>Amount sent</Text>
                <Text style={{ color: '#10B981', fontSize: 18, fontFamily: FONTS.extrabold }}>
                  ₦{successData.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.textMuted, fontSize: 13, fontFamily: FONTS.regular }}>Sent to</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: colors.text, fontSize: 14, fontFamily: FONTS.bold }}>{successData.name}</Text>
                  {!!successData.ceraId && (
                    <Text style={{ color: colors.textMuted, fontSize: 11, fontFamily: FONTS.regular, marginTop: 2 }}>@{successData.ceraId}</Text>
                  )}
                </View>
              </View>
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.textMuted, fontSize: 13, fontFamily: FONTS.regular }}>Fee</Text>
                <Text style={{ color: '#10B981', fontSize: 13, fontFamily: FONTS.semibold }}>₦0.00 · Free</Text>
              </View>
            </View>

          </View>

          {/* Buttons */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 32, gap: 12 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Receipt', { tx: successData.tx })}
              activeOpacity={0.85}
              style={{ borderRadius: 16, overflow: 'hidden' }}
            >
              <LinearGradient colors={['#7C3AED', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <Ionicons name="receipt-outline" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 15, fontFamily: FONTS.bold }}>View Receipt</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setStep('choose'); setSuccessData(null); }}
              activeOpacity={0.8}
              style={{ height: 56, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: colors.text, fontSize: 15, fontFamily: FONTS.bold }}>Done</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* ══════════ CHOOSE SCREEN ══════════ */}
      {step === 'choose' && (
        <>
          <View style={S.header}>
            <TouchableOpacity style={S.backBtn} onPress={() => { feedbackLight(); navigation.goBack(); }}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={S.title}>Send Money</Text>
            <View style={{ width: 40 }} />
          </View>

          <Text style={S.choosePrompt}>How would you like to send?</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={S.optionsRow}>
            {/* CERA Tag card */}
            <Animated.View style={{ opacity: card1Opacity, transform: [{ translateY: card1Y }] }}>
              <TouchableOpacity onPress={() => { feedbackSelect(); setActiveTab('cera'); setStep('cera_form'); }} activeOpacity={0.88}>
                <LinearGradient colors={['#5B21B6', '#7C3AED', '#9333EA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={S.optionCard}>
                  <View style={[S.optionOrb, { width: 140, height: 140, top: -45, right: -35 }]} />
                  <View style={[S.optionOrb, { width: 65, height: 65, bottom: -15, left: -10 }]} />

                  <View style={S.optionRow}>
                    <View style={S.optionIconBox}>
                      <Ionicons name="at" size={26} color="#fff" />
                    </View>

                    <View style={S.optionMid}>
                      <View style={S.optionTitleRow}>
                        <Text style={S.optionTitle}>CERA Tag</Text>
                        <View style={S.freePill}>
                          <Text style={S.freePillText}>FREE</Text>
                        </View>
                      </View>
                      <Text style={S.optionDesc}>Send to any CERA user instantly — zero fees</Text>
                      <View style={S.optionChips}>
                        <View style={S.optionChip}>
                          <Ionicons name="checkmark-circle" size={10} color="rgba(255,255,255,0.85)" />
                          <Text style={S.optionChipText}>Instant</Text>
                        </View>
                        <View style={S.optionChip}>
                          <Ionicons name="checkmark-circle" size={10} color="rgba(255,255,255,0.85)" />
                          <Text style={S.optionChipText}>No fees</Text>
                        </View>
                      </View>
                    </View>

                    <View style={S.optionChevron}>
                      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Bank Transfer card */}
            <Animated.View style={{ opacity: card2Opacity, transform: [{ translateY: card2Y }] }}>
              <TouchableOpacity onPress={() => { feedbackSelect(); setActiveTab('bank'); setStep('bank_form'); }} activeOpacity={0.88}>
                <View style={[S.optionCard, { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border }]}>
                  <View style={[S.optionOrb, { width: 110, height: 110, top: -30, right: -25, backgroundColor: colors.primary + '12' }]} />

                  <View style={S.optionRow}>
                    <View style={[S.optionIconBox, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '30' }]}>
                      <Ionicons name="business" size={26} color={colors.primary} />
                    </View>

                    <View style={S.optionMid}>
                      <View style={[S.optionTitleRow, { marginBottom: 3 }]}>
                        <Text style={[S.optionTitle, { color: colors.text }]}>Bank Transfer</Text>
                      </View>
                      <Text style={[S.optionDesc, { color: colors.textSecondary }]}>Send to any Nigerian bank account nationwide</Text>
                      <View style={S.optionChips}>
                        <View style={[S.optionChip, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '22' }]}>
                          <Ionicons name="shield-checkmark" size={10} color={colors.primary} />
                          <Text style={[S.optionChipText, { color: colors.primary }]}>Secure</Text>
                        </View>
                        <View style={[S.optionChip, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '22' }]}>
                          <Ionicons name="globe-outline" size={10} color={colors.primary} />
                          <Text style={[S.optionChipText, { color: colors.primary }]}>All banks</Text>
                        </View>
                      </View>
                    </View>

                    <View style={[S.optionChevron, { backgroundColor: colors.primary + '14' }]}>
                      <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={S.secureNote}>
            <Ionicons name="lock-closed-outline" size={12} color={colors.textMuted} />
            <Text style={[S.secureNoteText, { color: colors.textMuted }]}>All transactions are encrypted and secured</Text>
          </View>
          </ScrollView>
        </>
      )}

      {/* ══════════ CERA FORM ══════════ */}
      {step === 'cera_form' && (
        <>
          {/* Animated hero header */}
          <LinearGradient colors={['#2D1264', '#5B21B6', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={S.ceraHero}>
            <Animated.View style={[S.ceraOrb, { width: 150, height: 150, top: -50, right: -40, transform: [{ scale: orb1 }] }]} />
            <Animated.View style={[S.ceraOrb, { width: 90, height: 90, bottom: -20, left: -20, transform: [{ scale: orb2 }] }]} />
            <Animated.View style={[S.ceraOrb, { width: 70, height: 70, top: 10, left: 60, transform: [{ scale: orb3 }] }]} />

            <View style={S.ceraHeroTop}>
              <TouchableOpacity style={S.heroBack} onPress={() => { feedbackLight(); setStep('choose'); }}>
                <Ionicons name="arrow-back" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={S.ceraHeroCenter}>
              <Animated.View style={[S.ceraIconRing, { transform: [{ translateY: iconFloat }] }]}>
                <Ionicons name="at" size={34} color="#fff" />
              </Animated.View>
              <Text style={S.ceraHeroTitle}>CERA Tag</Text>
              <Text style={S.ceraHeroSub}>Instant transfers · Zero fees</Text>
              <View style={S.ceraHeroSecure}>
                <Ionicons name="shield-checkmark" size={11} color="#34D399" />
                <Text style={S.ceraHeroSecureText}>Bank-grade secure</Text>
              </View>
            </View>
          </LinearGradient>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={S.formScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Animated.View style={{ opacity: formFade, transform: [{ translateY: formSlide }] }}>

              {/* Search card */}
              <View style={S.formCard}>
                <Text style={S.formCardLabel}>Send to CERA Tag or email</Text>
                <View style={S.lookupRow}>
                  <TextInput
                    style={[S.input, { flex: 1 }]}
                    placeholder="e.g. john or john@email.com"
                    placeholderTextColor={colors.textMuted}
                    value={ceraQuery}
                    onChangeText={t => { setCeraQuery(t); setCeraRecipient(null); setCeraLookupError(''); }}
                    autoCapitalize="none"
                    returnKeyType="search"
                    onSubmitEditing={handleCeraLookup}
                  />
                  <TouchableOpacity
                    style={[S.lookupBtn, { backgroundColor: colors.primary, opacity: (!ceraQuery.trim() || ceraLookupLoading) ? 0.5 : 1 }]}
                    onPress={handleCeraLookup}
                    activeOpacity={0.8}
                    disabled={ceraLookupLoading || !ceraQuery.trim()}
                  >
                    {ceraLookupLoading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Ionicons name="search" size={18} color="#fff" />
                    }
                  </TouchableOpacity>
                </View>

                {!!ceraLookupError && (
                  <View style={S.errorRow}>
                    <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                    <Text style={[S.errorText, { color: colors.error }]}>{ceraLookupError}</Text>
                  </View>
                )}

                {ceraRecipient && (
                  <Animated.View style={[S.recipientCard, { transform: [{ scale: recipientScale }], opacity: recipientOpacity }]}>
                    <UserAvatar name={ceraRecipient.name} size={46} radius={15} />
                    <View style={{ flex: 1 }}>
                      <Text style={S.recipientName}>{ceraRecipient.name}</Text>
                      <Text style={S.recipientTag}>@{ceraRecipient.ceraId}</Text>
                    </View>
                    <View style={[S.foundBadge, { backgroundColor: colors.success + '18', borderColor: colors.success + '35' }]}>
                      <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                      <Text style={[S.foundBadgeText, { color: colors.success }]}>Found</Text>
                    </View>
                  </Animated.View>
                )}
              </View>

              {/* Recent sends — always visible */}
              <View style={S.recentSection}>
                <View style={S.recentHeaderRow}>
                  <Text style={[S.recentLabel, { color: colors.textSecondary }]}>Recent Sends</Text>
                </View>
                {ceraRecentRecipients.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 4, paddingRight: 4 }}>
                    {ceraRecentRecipients.map((c, i) => (
                      <CeraContactCard key={c.ceraId || i} contact={c} onPress={selectCeraContact} index={i} />
                    ))}
                  </ScrollView>
                ) : (
                  <EmptyState
                    icon="people-outline"
                    title="No recent sends yet"
                    subtitle="People you send to will appear here for quick access"
                  />
                )}
              </View>

            </Animated.View>
          </ScrollView>

          {!!ceraRecipient && (
            <View style={S.proceedFooter}>
              <TouchableOpacity style={S.proceedBtn} onPress={() => { feedbackSelect(); setStep('amount'); }} activeOpacity={0.85}>
                <LinearGradient colors={['#7C3AED', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.proceedBtnInner}>
                  <Text style={S.proceedBtnText}>Proceed to Amount</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* ══════════ BANK FORM ══════════ */}
      {step === 'bank_form' && (
        <>
          <View style={S.header}>
            <TouchableOpacity style={S.backBtn} onPress={() => { feedbackLight(); setStep('choose'); }}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={S.title}>Bank Transfer</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={S.formScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Animated.View style={{ opacity: formFade, transform: [{ translateY: formSlide }] }}>

              {/* Transfer details */}
              <View style={S.formCard}>
                <Text style={S.formCardLabel}>Transfer Details</Text>

                <View style={S.field}>
                  <Text style={S.fieldLabel}>Bank</Text>
                  <TouchableOpacity
                    style={[S.bankSelector, bank && { borderColor: colors.primary + '60' }]}
                    onPress={() => { feedbackSelect(); setBankModal(true); }}
                    activeOpacity={0.7}
                  >
                    {bank ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <BankLogo bankName={bank} size={32} />
                        <Text style={S.bankText}>{bank}</Text>
                      </View>
                    ) : (
                      <Text style={[S.bankText, { color: colors.textMuted }]}>Select bank</Text>
                    )}
                    <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={[S.field, { marginBottom: 0 }]}>
                  <Text style={S.fieldLabel}>Account Number</Text>
                  <TextInput
                    style={S.input}
                    placeholder="Enter 10-digit account number"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    value={accountNumber}
                    onChangeText={handleAccountNumber}
                    maxLength={10}
                  />
                  {accountNumber.length === 10 && (
                    <View style={S.nameHint}>
                      {accountName ? (
                        <><Ionicons name="checkmark-circle" size={15} color={colors.success} /><Text style={[S.nameText, { color: colors.success }]}>{accountName}</Text></>
                      ) : verifyingBank ? (
                        <><Ionicons name="time-outline" size={15} color={colors.textMuted} /><Text style={[S.nameText, { color: colors.textMuted }]}>Verifying...</Text></>
                      ) : bankVerifyError ? (
                        <><Ionicons name="alert-circle-outline" size={15} color={colors.error} /><Text style={[S.nameText, { color: colors.error }]}>{bankVerifyError}</Text></>
                      ) : null}
                    </View>
                  )}
                </View>
              </View>

              {/* Recent accounts — below details */}
              <View style={S.recentSection}>
                <Text style={[S.recentLabel, { color: colors.textSecondary }]}>Recent Accounts</Text>
                {recentBankAccounts.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 4, paddingRight: 4 }}>
                    {recentBankAccounts.map((c, i) => (
                      <BankContactCard key={c.accountNumber || i} contact={c} onPress={selectBankContact} index={i} />
                    ))}
                  </ScrollView>
                ) : (
                  <EmptyState
                    icon="card-outline"
                    title="No saved accounts yet"
                    subtitle="Bank accounts you transfer to will be saved here automatically"
                  />
                )}
              </View>

            </Animated.View>
          </ScrollView>

          {canBankProceed && (
            <View style={S.proceedFooter}>
              <TouchableOpacity style={S.proceedBtn} onPress={handleBankProceed} activeOpacity={0.85}>
                <LinearGradient colors={['#7C3AED', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.proceedBtnInner}>
                  <Text style={S.proceedBtnText}>Proceed to Amount</Text>
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
            <View style={S.avatarWrap}>
              {activeTab === 'bank' ? (
                <View style={S.bankAvatarBox}>
                  <BankLogo bankName={bank} size={60} />
                </View>
              ) : (
                <UserAvatar name={ceraRecipient?.name} size={84} radius={26} />
              )}
            </View>
            <Text style={S.sendingToLabel}>Sending to</Text>
            <Text style={S.recipientBigName}>{activeTab === 'bank' ? accountName : ceraRecipient?.name}</Text>
            <Text style={S.recipientBigSub}>{activeTab === 'bank' ? bank : (ceraRecipient?.ceraId ? `@${ceraRecipient.ceraId}` : '')}</Text>

            <View style={S.balanceMaxRow}>
              <View style={S.balanceChip}>
                <Ionicons name="wallet-outline" size={13} color={colors.primary} />
                <Text style={[S.balanceChipText, { color: colors.primary }]}>₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</Text>
              </View>
              <TouchableOpacity style={S.maxBtn} onPress={handleMax} activeOpacity={0.7}>
                <Text style={[S.maxBtnText, { color: colors.primary }]}>MAX</Text>
              </TouchableOpacity>
            </View>

            <View style={S.amountDisplay}>
              <Text style={[S.amountText, activeAmount > 0 && { color: isOverBalance ? '#EF4444' : colors.text }]}>
                <Text style={[S.nairaSymbol, activeAmount > 0 && { color: isOverBalance ? '#EF4444' : colors.textMuted }]}>₦</Text>
                {(activeTab === 'bank' ? amount : ceraAmount) || '0'}
              </Text>
              {isOverBalance && <Text style={[S.hint, { color: '#EF4444' }]}>Exceeds your balance</Text>}
              {!isOverBalance && activeTab === 'cera' && activeAmount > 0 && activeAmount < 50 && (
                <Text style={[S.hint, { color: colors.warning }]}>Minimum ₦50</Text>
              )}
            </View>

            {activeAmount > 0 && (
              <View style={S.infoRow}>
                <View style={S.infoChip}>
                  <Text style={S.infoLabel}>Fee</Text>
                  <Text style={[S.infoVal, { color: colors.text }]}>₦{fee.toLocaleString('en-NG')}</Text>
                </View>
                <View style={[S.infoChip, { marginLeft: 8 }]}>
                  <Text style={S.infoLabel}>After</Text>
                  <Text style={[S.infoVal, { color: colors.text }]}>₦{balanceAfter.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</Text>
                </View>
              </View>
            )}
          </Animated.View>

          <View style={S.keypadSection}>
            {(activeTab === 'bank' ? canBankSend : canCeraSend) && (
              <TouchableOpacity
                style={S.sendBtn}
                onPress={activeTab === 'bank' ? () => { feedbackCash(); setConfirmModal(true); } : handleCeraSend}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#7C3AED', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.sendBtnInner}>
                  {activeTab === 'cera'
                    ? <><Ionicons name="lock-closed-outline" size={16} color="#fff" /><Text style={S.sendBtnText}>Send with PIN</Text></>
                    : <Text style={S.sendBtnText}>Send Money</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            )}
            <NumericKeypad mode="amount" onKey={handleAmountKey} />
          </View>
        </>
      )}

      {/* Bank picker modal */}
      <Modal visible={bankModal} animationType="slide" transparent onRequestClose={() => setBankModal(false)}>
        <TouchableOpacity style={S.modalOverlay} activeOpacity={1} onPress={() => setBankModal(false)}>
          <View style={S.modalSheet}>
            <View style={S.modalHandle} />
            <Text style={S.modalTitle}>Select Bank</Text>
            <FlatList
              data={NIGERIAN_BANKS}
              keyExtractor={item => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[S.bankOption, bank === item && { backgroundColor: colors.primary + '12' }]}
                  onPress={() => { feedbackSelect(); setBank(item); setBankModal(false); runBankVerify(accountNumber, item); }}
                  activeOpacity={0.7}
                >
                  <BankLogo bankName={item} size={38} />
                  <Text style={[S.bankOptionText, bank === item && { color: colors.primary }]}>{item}</Text>
                  {bank === item && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <AppModal
        visible={confirmModal}
        type="comingsoon"
        title="Transfer Coming Soon"
        message={`Sending ₦${parseFloat(amount || 0).toLocaleString()} to ${accountName} at ${bank} will be live very soon.`}
        primaryLabel="Got it"
        onClose={() => setConfirmModal(false)}
        onPrimary={() => setConfirmModal(false)}
      />
    </SafeAreaView>
  );
}

// ─── Static styles ────────────────────────────────────────────
const styles = StyleSheet.create({
  contactBtn: { alignItems: 'center', gap: 5, width: 68 },
  contactName: { fontSize: 11, fontFamily: FONTS.semibold, textAlign: 'center' },
  contactSub: { fontSize: 10, fontFamily: FONTS.medium, textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 16 },
  emptyIconWrap: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emptyTitle: { fontSize: 14, fontFamily: FONTS.semibold, marginBottom: 4 },
  emptySubtitle: { fontSize: 12, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 17 },
});

function makeStyles(C) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
    title: { color: C.text, fontSize: 18, fontFamily: FONTS.bold },

    // Choose screen
    choosePrompt: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.medium, textAlign: 'center', marginBottom: 18 },
    optionsRow: { gap: 14, paddingHorizontal: 20, marginBottom: 8 },
    optionCard: { borderRadius: 22, paddingVertical: 20, paddingHorizontal: 18, overflow: 'hidden' },
    optionOrb: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
    optionRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    optionIconBox: {
      width: 54, height: 54, borderRadius: 16, flexShrink: 0,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
    },
    optionMid: { flex: 1 },
    optionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    optionTitle: { color: '#fff', fontSize: 16, fontFamily: FONTS.extrabold },
    optionDesc: { color: 'rgba(255,255,255,0.68)', fontSize: 12, fontFamily: FONTS.regular, lineHeight: 18, marginBottom: 10 },
    optionChips: { flexDirection: 'row', gap: 6 },
    optionChip: {
      flexDirection: 'row', alignItems: 'center', gap: 3,
      backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 6,
      paddingHorizontal: 7, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    optionChipText: { fontSize: 10, fontFamily: FONTS.semibold, color: 'rgba(255,255,255,0.85)' },
    optionChevron: {
      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
      backgroundColor: 'rgba(255,255,255,0.13)',
      alignItems: 'center', justifyContent: 'center',
    },
    freePill: {
      backgroundColor: 'rgba(245,158,11,0.22)', borderRadius: 7,
      paddingHorizontal: 7, paddingVertical: 3,
      borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)',
    },
    freePillText: { fontSize: 9, fontFamily: FONTS.extrabold, color: '#F59E0B', letterSpacing: 0.5 },
    secureNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingBottom: 20, paddingTop: 14 },
    secureNoteText: { fontSize: 11, fontFamily: FONTS.regular },

    // CERA hero
    ceraHero: { paddingBottom: 24, overflow: 'hidden' },
    ceraOrb: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)' },
    ceraHeroTop: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
    heroBack: {
      width: 38, height: 38, borderRadius: 11,
      backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
    },
    ceraHeroCenter: { alignItems: 'center', paddingBottom: 4 },
    ceraIconRing: {
      width: 74, height: 74, borderRadius: 24,
      backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
      alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    ceraHeroTitle: { color: '#fff', fontSize: 22, fontFamily: FONTS.extrabold, marginBottom: 4 },
    ceraHeroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: FONTS.regular, marginBottom: 10 },
    ceraHeroSecure: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: 'rgba(52,211,153,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
      borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)',
    },
    ceraHeroSecureText: { color: '#34D399', fontSize: 11, fontFamily: FONTS.semibold },

    // Shared form
    formScroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
    formCard: {
      backgroundColor: C.card, borderRadius: 20, padding: 16,
      borderWidth: 1, borderColor: C.border, marginBottom: 16,
    },
    formCardLabel: { color: C.text, fontSize: 14, fontFamily: FONTS.bold, marginBottom: 14 },
    field: { marginBottom: 16 },
    fieldLabel: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.semibold, marginBottom: 8 },
    input: {
      backgroundColor: C.inputBg, borderRadius: 13, borderWidth: 1, borderColor: C.border,
      paddingHorizontal: 14, paddingVertical: 13, color: C.text, fontSize: 15, fontFamily: FONTS.medium,
    },
    lookupRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    lookupBtn: { width: 48, height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
    errorText: { fontSize: 12, fontFamily: FONTS.medium },
    recipientCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14,
      backgroundColor: C.primary + '0C', borderRadius: 14, padding: 12,
      borderWidth: 1, borderColor: C.primary + '28',
    },
    recipientName: { color: C.text, fontSize: 14, fontFamily: FONTS.bold },
    recipientTag: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },
    foundBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
    foundBadgeText: { fontSize: 11, fontFamily: FONTS.bold },

    // Recent section
    recentSection: { marginBottom: 16 },
    recentHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    recentLabel: { fontSize: 12, fontFamily: FONTS.bold, letterSpacing: 0.2 },

    // Bank form
    bankSelector: {
      backgroundColor: C.inputBg, borderRadius: 13, borderWidth: 1, borderColor: C.border,
      paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row',
      alignItems: 'center', justifyContent: 'space-between', minHeight: 52,
    },
    bankText: { color: C.text, fontSize: 15, fontFamily: FONTS.medium },
    nameHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingHorizontal: 4 },
    nameText: { fontSize: 13, fontFamily: FONTS.semibold },

    // Proceed footer
    proceedFooter: { paddingHorizontal: 20, paddingBottom: 28, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
    proceedBtn: { borderRadius: 14, overflow: 'hidden' },
    proceedBtnInner: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    proceedBtnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },

    // Amount step
    amountBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
    avatarWrap: { marginBottom: 14 },
    bankAvatarBox: {
      width: 84, height: 84, borderRadius: 26,
      backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
      alignItems: 'center', justifyContent: 'center',
    },
    sendingToLabel: { color: C.textMuted, fontSize: 12, fontFamily: FONTS.medium, marginBottom: 4 },
    recipientBigName: { color: C.text, fontSize: 22, fontFamily: FONTS.extrabold, textAlign: 'center', marginBottom: 4 },
    recipientBigSub: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.regular, marginBottom: 18 },
    balanceMaxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    balanceChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: C.primary + '12', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
      borderWidth: 1, borderColor: C.primary + '25',
    },
    balanceChipText: { fontSize: 12, fontFamily: FONTS.semibold },
    maxBtn: { backgroundColor: C.primary + '18', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: C.primary + '30' },
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
    keypadSection: { borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg, paddingTop: 10 },
    sendBtn: { borderRadius: 14, overflow: 'hidden', marginHorizontal: 20, marginBottom: 8 },
    sendBtnInner: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    sendBtnText: { color: '#fff', fontSize: 15, fontFamily: FONTS.bold },

    // Bank modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '75%', borderTopWidth: 1, borderColor: C.border },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 16 },
    modalTitle: { color: C.text, fontSize: 17, fontFamily: FONTS.bold, marginBottom: 14 },
    bankOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: C.border },
    bankOptionText: { flex: 1, color: C.text, fontSize: 15, fontFamily: FONTS.medium },
  });
}
