import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import TransactionItem from '../components/TransactionItem';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getTransactions, getMe } from '../services/api';
import { feedbackLight, feedbackMedium, feedbackSelect } from '../utils/feedback';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const COIN_LOGOS = {
  SOL:  'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  BTC:  'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH:  'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  BNB:  'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  USDC: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
  TRX:  'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
};

const QUICK_ACTIONS = [
  { label: 'Airtime',     icon: 'cellphone',       color: '#EF4444', bg: '#FEF2F2', type: 'Airtime' },
  { label: 'Data',        icon: 'wifi',            color: '#06B6D4', bg: '#ECFEFF', type: 'Data' },
  { label: 'TV',          icon: 'television-play', color: '#8B5CF6', bg: '#F5F3FF', type: 'TV' },
  { label: 'Electricity', icon: 'lightning-bolt',  color: '#F59E0B', bg: '#FFFBEB', type: 'Electricity' },
];

// ─── Animated transaction row ──────────────────────────────────────────────────
function AnimatedTxRow({ tx, index, onPress }) {
  const fade  = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 320, delay: index * 55, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, tension: 90, friction: 9, delay: index * 55, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slideY }] }}>
      <TransactionItem tx={tx} onPress={onPress} />
    </Animated.View>
  );
}

// ─── Quick action button ───────────────────────────────────────────────────────
function ActionBtn({ label, icon, color, bg, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ alignItems: 'center', flex: 1, transform: [{ scale }] }}>
      <TouchableOpacity
        style={styles.actionBtn}
        activeOpacity={1}
        onPress={() => { feedbackMedium(); onPress?.(); }}
        onPressIn={() => {
          feedbackSelect();
          Animated.spring(scale, { toValue: 0.82, useNativeDriver: true, tension: 260, friction: 6 }).start();
        }}
        onPressOut={() =>
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 260, friction: 6 }).start()
        }
      >
        <View style={[styles.actionCircle, { backgroundColor: bg }]}>
          <MaterialCommunityIcons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── In-App Toast ─────────────────────────────────────────────────────────────
function InAppToast({ amount, coin, onHide }) {
  const slideY    = useRef(new Animated.Value(180)).current;
  const scale     = useRef(new Animated.Value(0.86)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const progress  = useRef(new Animated.Value(1)).current;
  const [imgErr, setImgErr] = useState(false);
  const logoUrl = coin ? COIN_LOGOS[coin.toUpperCase()] : null;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, tension: 58, friction: 9, useNativeDriver: true }),
      Animated.spring(scale,  { toValue: 1, tension: 58, friction: 8, useNativeDriver: true }),
    ]).start(() =>
      Animated.spring(iconScale, { toValue: 1, tension: 90, friction: 5, useNativeDriver: true }).start()
    );
    Animated.timing(progress, { toValue: 0, duration: 4400, useNativeDriver: false }).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideY, { toValue: 180, duration: 340, useNativeDriver: true }),
        Animated.timing(scale,  { toValue: 0.86, duration: 340, useNativeDriver: true }),
      ]).start(onHide);
    }, 4400);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute', bottom: 98, left: 14, right: 14, zIndex: 999,
      transform: [{ translateY: slideY }, { scale }],
    }}>
      <TouchableOpacity onPress={onHide} activeOpacity={0.9}>
        <LinearGradient
          colors={['#022C22', '#064E3B', '#065F46']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 22, overflow: 'hidden',
            borderWidth: 1, borderColor: '#34D39947',
            shadowColor: '#34D399', shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5, shadowRadius: 22, elevation: 16,
          }}
        >
          <View style={{ position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: '#34D39912', top: -50, right: -40 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 }}>
            <Animated.View style={{
              width: 58, height: 58, borderRadius: 19,
              backgroundColor: '#34D39926', borderWidth: 1.5, borderColor: '#34D3994D',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transform: [{ scale: iconScale }],
              overflow: 'hidden',
            }}>
              {logoUrl && !imgErr ? (
                <Image
                  source={{ uri: logoUrl }}
                  style={{ width: 36, height: 36, borderRadius: 18 }}
                  onError={() => setImgErr(true)}
                />
              ) : (
                <MaterialCommunityIcons name="cash-multiple" size={28} color="#34D399" />
              )}
            </Animated.View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#34D399', fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1.6, marginBottom: 4 }}>
                {coin ? `${coin} RECEIVED` : 'MONEY RECEIVED'}
              </Text>
              <Text style={{ color: '#fff', fontSize: 22, fontFamily: FONTS.extrabold, letterSpacing: -0.5, lineHeight: 26 }}>
                {amount}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.42)', fontSize: 11, fontFamily: FONTS.regular, marginTop: 4 }}>
                Credited to your CERA wallet · tap to dismiss
              </Text>
            </View>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#34D39924', borderWidth: 1, borderColor: '#34D39947', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ionicons name="checkmark" size={20} color="#34D399" />
            </View>
          </View>
          <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.07)' }}>
            <Animated.View style={{
              height: '100%', backgroundColor: '#34D399',
              width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            }} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const { user, refreshUser } = useAuth();

  const [recentTxns, setRecentTxns]         = useState([]);
  const [txLoading, setTxLoading]           = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [toast, setToast]                   = useState(null);
  const [hasUnread, setHasUnread]           = useState(false);
  const [txKey, setTxKey]                   = useState(0); // forces re-animate on refresh

  const dotPulse    = useRef(new Animated.Value(1)).current;
  const heroSlide   = useRef(new Animated.Value(-20)).current;
  const heroFade    = useRef(new Animated.Value(0)).current;
  const balanceFade = useRef(new Animated.Value(1)).current;
  const sheetSlide  = useRef(new Animated.Value(60)).current;
  const sheetFade   = useRef(new Animated.Value(0)).current;
  const prevBalance = useRef(null);
  const lastTxId    = useRef(null);

  useEffect(() => {
    // Hero entrance
    Animated.parallel([
      Animated.timing(heroFade,  { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(heroSlide, { toValue: 0, tension: 55, friction: 8, useNativeDriver: true }),
    ]).start();

    // Sheet entrance with delay
    Animated.parallel([
      Animated.timing(sheetFade,  { toValue: 1, duration: 380, delay: 180, useNativeDriver: true }),
      Animated.spring(sheetSlide, { toValue: 0, tension: 50, friction: 9, delay: 180, useNativeDriver: true }),
    ]).start();

    // Pulse unread dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, { toValue: 1.6, duration: 800, useNativeDriver: true }),
        Animated.timing(dotPulse, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const toggleBalance = useCallback(() => {
    feedbackLight();
    Animated.sequence([
      Animated.timing(balanceFade, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(balanceFade, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => setBalanceVisible((v) => !v));
  }, []);

  useFocusEffect(useCallback(() => {
    refreshData();
    const interval = setInterval(() => refreshData(false, true), 30000);
    return () => clearInterval(interval);
  }, []));

  async function refreshData(isPull = false, silent = false) {
    if (isPull) setRefreshing(true);
    else if (!silent && recentTxns.length === 0) setTxLoading(true);
    try {
      const [meRes, txRes] = await Promise.all([getMe(), getTransactions(1)]);
      const newUser    = meRes.data.user;
      const newBalance = parseFloat(newUser?.balance) || 0;

      if (prevBalance.current !== null) {
        const diff = newBalance - prevBalance.current;
        if (diff > 0 && !isNaN(diff)) {
          const latestTx = (txRes.data.transactions || [])[0];
          const coin     = latestTx?.type === 'crypto_receive' ? (latestTx.crypto || null) : null;
          setToast({
            amount: `+₦${diff.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
            coin,
          });
        }
      }
      prevBalance.current = newBalance;
      refreshUser(newUser);

      const txns    = txRes.data.transactions || [];
      const topId   = txns[0]?.txId ?? null;
      const hasNew  = topId !== lastTxId.current;

      // Only update the list + re-animate on pull-to-refresh, initial load, or when new data arrives
      if (!silent || hasNew) {
        setRecentTxns(txns.slice(0, 5));
      }
      if (hasNew) {
        setTxKey((k) => k + 1);
        lastTxId.current = topId;
      }

      const lastCheck = await AsyncStorage.getItem('cera_last_notif_check');
      if (txns.length > 0) {
        setHasUnread(!lastCheck || new Date(txns[0].createdAt) > new Date(lastCheck));
      }
    } catch { /* silent */ }
    finally {
      setTxLoading(false);
      setRefreshing(false);
    }
  }

  const balance = user?.balance ?? 0;
  const firstName = (user?.name || 'there').split(' ')[0];
  const ceraTag   = user?.ceraTag ? `@${user.ceraTag}` : user?.ceraId ?? '';

  const balanceStr = balanceVisible
    ? `₦${balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
    : '₦ •••••••';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Full-bleed purple hero ─────────────────────────────────── */}
      <LinearGradient
        colors={['#2D0B7A', '#4C1D95', '#6D28D9', '#7C3AED']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.hero}
      >
        {/* Decorative rings */}
        <View style={styles.ring1} />
        <View style={styles.ring2} />
        <View style={styles.ring3} />

        <SafeAreaView edges={['top']} style={{ width: '100%' }}>
          <Animated.View style={{ opacity: heroFade, transform: [{ translateY: heroSlide }] }}>

            {/* Header row */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Good morning,</Text>
                <Text style={styles.heroName}>{firstName}</Text>
              </View>
              <TouchableOpacity
                style={styles.notifBtn}
                activeOpacity={0.75}
                onPress={() => {
                  feedbackLight();
                  setHasUnread(false);
                  navigation.getParent()?.navigate('Notifications');
                }}
              >
                <Feather name="bell" size={20} color="rgba(255,255,255,0.9)" />
                {hasUnread && (
                  <Animated.View style={[styles.notifDot, { transform: [{ scale: dotPulse }] }]} />
                )}
              </TouchableOpacity>
            </View>

            {/* CERA tag pill */}
            {!!ceraTag && (
              <View style={styles.tagPill}>
                <Text style={styles.tagPillText}>{ceraTag}</Text>
              </View>
            )}

            {/* Balance */}
            <View style={styles.balanceBlock}>
              <View style={styles.balanceLabelRow}>
                <Text style={styles.balanceLabel}>Total Balance</Text>
                <TouchableOpacity onPress={toggleBalance} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Feather name={balanceVisible ? 'eye' : 'eye-off'} size={15} color="rgba(255,255,255,0.55)" />
                </TouchableOpacity>
              </View>
              <Animated.Text style={[styles.balanceValue, { opacity: balanceFade }]}>
                {balanceStr}
              </Animated.Text>
              <Text style={styles.balanceSub}>Nigerian Naira</Text>
            </View>

            {/* Deposit / Transfer */}
            <View style={styles.heroActions}>
              <TouchableOpacity
                style={styles.heroBtn}
                activeOpacity={0.8}
                onPress={() => { feedbackLight(); navigation.navigate('Receive'); }}
              >
                <View style={styles.heroBtnIcon}>
                  <Feather name="arrow-down-left" size={18} color="#7C3AED" />
                </View>
                <Text style={styles.heroBtnText}>Deposit</Text>
              </TouchableOpacity>

              <View style={styles.heroDivider} />

              <TouchableOpacity
                style={styles.heroBtn}
                activeOpacity={0.8}
                onPress={() => { feedbackLight(); navigation.navigate('Send'); }}
              >
                <View style={styles.heroBtnIcon}>
                  <Feather name="arrow-up-right" size={18} color="#7C3AED" />
                </View>
                <Text style={styles.heroBtnText}>Transfer</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </SafeAreaView>
      </LinearGradient>

      {/* ── Quick actions strip (bridges hero → sheet) ─────────────── */}
      <Animated.View style={[styles.actionsStrip, { opacity: sheetFade, transform: [{ translateY: sheetSlide }] }]}>
        {QUICK_ACTIONS.map((a) => (
          <ActionBtn
            key={a.label}
            label={a.label}
            icon={a.icon}
            color={a.color}
            bg={a.bg}
            onPress={() => navigation.navigate('Utility', { type: a.type })}
          />
        ))}
      </Animated.View>

      {/* ── Transactions sheet ─────────────────────────────────────── */}
      <Animated.View style={[styles.sheet, { opacity: sheetFade, transform: [{ translateY: sheetSlide }] }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => refreshData(true)}
              tintColor="#7C3AED"
              colors={['#7C3AED']}
            />
          }
        >
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <TouchableOpacity onPress={() => { feedbackLight(); navigation.navigate('History'); }}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>

          {txLoading && recentTxns.length === 0 ? (
            <View style={styles.txLoader}>
              <ActivityIndicator color="#7C3AED" size="small" />
            </View>
          ) : recentTxns.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Ionicons name="receipt-outline" size={26} color="#A78BFA" />
              </View>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySubtitle}>Your activity will appear here</Text>
            </View>
          ) : (
            recentTxns.map((tx, i) => (
              <AnimatedTxRow
                key={`${txKey}-${tx.txId}`}
                tx={tx}
                index={i}
                onPress={() => navigation.navigate('Receipt', { tx })}
              />
            ))
          )}
        </ScrollView>
      </Animated.View>

      {/* Toast */}
      {toast && <InAppToast amount={toast.amount} onHide={() => setToast(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F7FF' },

  // ── Hero ──
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  ring1: {
    position: 'absolute', top: -80, right: -80,
    width: 260, height: 260, borderRadius: 130,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  ring2: {
    position: 'absolute', top: -120, right: -120,
    width: 360, height: 360, borderRadius: 180,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  ring3: {
    position: 'absolute', bottom: -60, left: -60,
    width: 200, height: 200, borderRadius: 100,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 14,
  },
  greeting: { color: 'rgba(255,255,255,0.58)', fontSize: 13, fontFamily: FONTS.regular },
  heroName:  { color: '#FFFFFF', fontSize: 20, fontFamily: FONTS.bold, marginTop: 2 },

  notifBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute', top: 9, right: 9,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#FCD34D', borderWidth: 1.5, borderColor: '#4C1D95',
  },

  tagPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    marginBottom: 20,
  },
  tagPillText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: FONTS.medium },

  balanceBlock: { marginBottom: 28 },
  balanceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  balanceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: FONTS.medium, letterSpacing: 0.4 },
  balanceValue: { color: '#FFFFFF', fontSize: 42, fontFamily: FONTS.extrabold, letterSpacing: -1, lineHeight: 50 },
  balanceSub:   { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: FONTS.regular, marginTop: 4 },

  heroActions: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  heroBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingVertical: 14 },
  heroBtnIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBtnText: { color: '#FFFFFF', fontSize: 15, fontFamily: FONTS.bold },
  heroDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 10 },

  // ── Quick actions ──
  actionsStrip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F0FF',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  actionBtn: { alignItems: 'center', gap: 7 },
  actionCircle: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontSize: 11, fontFamily: FONTS.semibold, color: '#374151' },

  // ── Sheet ──
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sheetScroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },

  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: { color: '#0F172A', fontSize: 17, fontFamily: FONTS.bold },
  seeAll: { color: '#7C3AED', fontSize: 13, fontFamily: FONTS.semibold },

  txLoader: { alignItems: 'center', paddingVertical: 40 },

  emptyWrap: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#F5F3FF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle:    { color: '#1E293B', fontSize: 15, fontFamily: FONTS.semibold },
  emptySubtitle: { color: '#94A3B8', fontSize: 13, fontFamily: FONTS.regular },
});
