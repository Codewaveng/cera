import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, ActivityIndicator, Animated, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getMe } from '../services/api';
import { feedbackSuccess, feedbackLight } from '../utils/feedback';

const COINS = [
  {
    id: 'btc', symbol: 'BTC', name: 'Bitcoin', color: '#F7931A',
    logo: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    addressKey: 'btc', networkLabel: 'Bitcoin Network',
  },
  {
    id: 'eth', symbol: 'ETH', name: 'Ethereum', color: '#627EEA',
    logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    addressKey: 'evm', networkLabel: 'Ethereum (ERC-20)',
  },
  {
    id: 'bnb', symbol: 'BNB', name: 'BNB Chain', color: '#F3BA2F',
    logo: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
    addressKey: 'evm', networkLabel: 'BNB Smart Chain (BEP-20)',
  },
  {
    id: 'usdt', symbol: 'USDT', name: 'Tether USDT', color: '#26A17B',
    logo: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
    multiChain: true,
    chains: [
      { id: 'eth',     label: 'Ethereum', tag: 'ERC-20',  color: '#627EEA', addressKey: 'evm',  logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
      { id: 'bnb',     label: 'BNB Chain', tag: 'BEP-20', color: '#F3BA2F', addressKey: 'evm',  logo: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
      { id: 'polygon', label: 'Polygon',  tag: 'Polygon', color: '#8247E5', addressKey: 'evm',  logo: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png' },
      { id: 'tron',    label: 'TRON',     tag: 'TRC-20',  color: '#EF4444', addressKey: 'tron', logo: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png' },
      { id: 'sol',     label: 'Solana',   tag: 'SPL',     color: '#9945FF', addressKey: 'sol',  logo: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
    ],
  },
  {
    id: 'usdc', symbol: 'USDC', name: 'USD Coin', color: '#2775CA',
    logo: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
    multiChain: true,
    chains: [
      { id: 'eth',     label: 'Ethereum', tag: 'ERC-20',  color: '#627EEA', addressKey: 'evm', logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
      { id: 'bnb',     label: 'BNB Chain', tag: 'BEP-20', color: '#F3BA2F', addressKey: 'evm', logo: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
      { id: 'polygon', label: 'Polygon',  tag: 'Polygon', color: '#8247E5', addressKey: 'evm', logo: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png' },
      { id: 'sol',     label: 'Solana',   tag: 'SPL',     color: '#9945FF', addressKey: 'sol', logo: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
    ],
  },
  {
    id: 'sol', symbol: 'SOL', name: 'Solana', color: '#9945FF',
    logo: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
    addressKey: 'sol', networkLabel: 'Solana Network',
  },
  {
    id: 'trx', symbol: 'TRX', name: 'TRON', color: '#EF4444',
    logo: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png',
    addressKey: 'tron', networkLabel: 'TRON Network (TRC-20)',
  },
];

// QR box dimensions — must match styles below
const QR_SIZE   = 200;
const QR_PAD    = 20;
const LOGO_SIZE = 44;

function CoinLogo({ uri, color, symbol, size = 28 }) {
  const [failed, setFailed] = useState(false);
  if (failed || !uri) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color + '25', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color, fontSize: size * 0.38, fontFamily: FONTS.bold }}>{symbol[0]}</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      onError={() => setFailed(true)}
    />
  );
}

// Truncates a long address: first 10 … last 8
function fmtAddress(addr) {
  if (!addr || addr.length < 24) return addr || '';
  return `${addr.slice(0, 10)}  ···  ${addr.slice(-8)}`;
}

export default function ReceiveScreen({ navigation }) {
  const { colors } = useTheme();
  const { user, refreshUser } = useAuth();
  const S = useMemo(() => makeStyles(colors), [colors]);

  const [coinIdx,  setCoinIdx]  = useState(0);
  const [chainIdx, setChainIdx] = useState(0);
  const [copied,   setCopied]   = useState(false);

  const qrScale   = useRef(new Animated.Value(0.88)).current;
  const qrOpacity = useRef(new Animated.Value(0)).current;

  const walletsReady = !!user?.cryptoAddresses?.evm;

  useEffect(() => {
    if (walletsReady) return;
    const interval = setInterval(async () => {
      try {
        const res = await getMe();
        if (res.data?.user?.cryptoAddresses?.evm) {
          refreshUser(res.data.user);
          clearInterval(interval);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [walletsReady]);

  // Animate QR in when coin or chain changes
  useEffect(() => {
    qrScale.setValue(0.88);
    qrOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(qrScale,   { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
      Animated.timing(qrOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [coinIdx, chainIdx]);

  const coin         = COINS[coinIdx];
  const activeChain  = coin.multiChain ? coin.chains[chainIdx] : null;
  const addressKey   = activeChain ? activeChain.addressKey : coin.addressKey;
  const address      = user?.cryptoAddresses?.[addressKey] || null;
  const accentColor  = activeChain ? activeChain.color : coin.color;
  const networkLabel = activeChain
    ? `${coin.symbol}  •  ${activeChain.label}  •  ${activeChain.tag}`
    : `${coin.symbol}  •  ${coin.networkLabel}`;

  function handleSelectCoin(i) {
    feedbackLight();
    setCoinIdx(i);
    setChainIdx(0);
    setCopied(false);
  }

  async function handleCopy() {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    feedbackSuccess();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleShare() {
    if (!address) return;
    feedbackLight();
    try {
      await Share.share({
        message: `My ${coin.symbol}${activeChain ? ` (${activeChain.tag})` : ''} address on CERA:\n\n${address}`,
        title: `Receive ${coin.symbol}`,
      });
    } catch {}
  }

  return (
    <SafeAreaView style={S.root} edges={['top']}>

      {/* ── Header ── */}
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => { feedbackLight(); navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Receive Crypto</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={S.scroll}
        bounces={false}
        overScrollMode="never"
      >

        {/* ── Coin selector ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={S.chipRow}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 2, gap: 8 }}
        >
          {COINS.map((c, i) => (
            <TouchableOpacity
              key={c.id}
              style={[S.chip, coinIdx === i && { borderColor: c.color, backgroundColor: c.color + '15' }]}
              onPress={() => handleSelectCoin(i)}
              activeOpacity={0.7}
            >
              <CoinLogo uri={c.logo} color={c.color} symbol={c.symbol} size={22} />
              <Text style={[S.chipLabel, coinIdx === i && { color: c.color }]}>{c.symbol}</Text>
              {coinIdx === i && <View style={[S.chipDot, { backgroundColor: c.color }]} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Network / chain selector for USDT / USDC ── */}
        {coin.multiChain && (
          <View style={S.chainSection}>
            <Text style={S.chainSectionLabel}>SELECT NETWORK</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
            >
              {coin.chains.map((ch, i) => {
                const active = chainIdx === i;
                return (
                  <TouchableOpacity
                    key={ch.id}
                    style={[
                      S.chainPill,
                      active
                        ? { backgroundColor: ch.color, borderColor: ch.color }
                        : { borderColor: colors.border, backgroundColor: colors.card },
                    ]}
                    onPress={() => { feedbackLight(); setChainIdx(i); setCopied(false); }}
                    activeOpacity={0.75}
                  >
                    <CoinLogo uri={ch.logo} color={active ? '#fff' : ch.color} symbol={ch.label} size={16} />
                    <View>
                      <Text style={[S.chainPillLabel, active && { color: '#fff' }]}>{ch.label}</Text>
                      <Text style={[S.chainPillTag, active ? { color: 'rgba(255,255,255,0.7)' } : { color: colors.textMuted }]}>{ch.tag}</Text>
                    </View>
                    {active && <Ionicons name="checkmark-circle" size={14} color="rgba(255,255,255,0.9)" style={{ marginLeft: 2 }} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={S.body}>

          {/* ── Wallet pending ── */}
          {!walletsReady && (
            <View style={S.pendingCard}>
              <View style={[S.pendingIconWrap, { backgroundColor: colors.primary + '15' }]}>
                <ActivityIndicator color={colors.primary} size="small" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.pendingTitle}>Setting up your wallets</Text>
                <Text style={S.pendingDesc}>Takes a few seconds on first sign-up. This page refreshes automatically.</Text>
              </View>
            </View>
          )}

          {walletsReady && (
            <>
              {/* ── QR code ── */}
              {address ? (
                <Animated.View style={[S.qrSection, { opacity: qrOpacity, transform: [{ scale: qrScale }] }]}>
                  {/* Scanner corner brackets */}
                  <View style={S.scanFrame}>
                    <View style={[S.corner, S.cTL, { borderColor: accentColor }]} />
                    <View style={[S.corner, S.cTR, { borderColor: accentColor }]} />
                    <View style={[S.corner, S.cBL, { borderColor: accentColor }]} />
                    <View style={[S.corner, S.cBR, { borderColor: accentColor }]} />

                    <View style={S.qrCard}>
                      <QRCode
                        value={address}
                        size={QR_SIZE}
                        color="#060611"
                        backgroundColor="#FFFFFF"
                        quietZone={8}
                        ecLevel="M"
                      />
                      {/* Coin logo centered on QR */}
                      <View style={S.qrLogoWrap}>
                        <CoinLogo uri={coin.logo} color={coin.color} symbol={coin.symbol} size={LOGO_SIZE} />
                      </View>
                    </View>
                  </View>

                  <Text style={S.scanHint}>
                    Scan to send{' '}
                    <Text style={[S.scanHintBold, { color: accentColor }]}>
                      {coin.symbol}{activeChain ? ` (${activeChain.tag})` : ''}
                    </Text>
                  </Text>
                </Animated.View>
              ) : (
                <View style={S.noAddrBox}>
                  <View style={[S.noAddrIconWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="wallet-outline" size={28} color={colors.textMuted} />
                  </View>
                  <Text style={S.noAddrTitle}>Address Unavailable</Text>
                  <Text style={S.noAddrDesc}>This network isn't set up for your wallet yet</Text>
                </View>
              )}

              {/* ── Address card ── */}
              {address && (
                <View style={S.addressCard}>
                  <View style={S.addressCardHeader}>
                    <Text style={S.addressCardLabel}>WALLET ADDRESS</Text>
                    <View style={[S.networkBadge, { backgroundColor: accentColor + '18', borderColor: accentColor + '40' }]}>
                      <Text style={[S.networkBadgeText, { color: accentColor }]}>
                        {activeChain ? activeChain.tag : coin.symbol}
                      </Text>
                    </View>
                  </View>

                  <Text style={S.addressText} selectable>{address}</Text>

                  <View style={S.actionRow}>
                    <TouchableOpacity
                      style={[
                        S.actionBtn,
                        { borderColor: copied ? colors.success : accentColor + '55', backgroundColor: copied ? colors.success + '12' : accentColor + '0D' },
                      ]}
                      onPress={handleCopy}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name={copied ? 'checkmark-circle' : 'copy-outline'}
                        size={17}
                        color={copied ? colors.success : accentColor}
                      />
                      <Text style={[S.actionBtnText, { color: copied ? colors.success : accentColor }]}>
                        {copied ? 'Copied!' : 'Copy Address'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[S.actionBtn, S.actionBtnFilled, { backgroundColor: accentColor }]}
                      onPress={handleShare}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="share-outline" size={17} color="#fff" />
                      <Text style={[S.actionBtnText, { color: '#fff' }]}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ── Warning ── */}
              {address && (
                <View style={[S.warningBox, { backgroundColor: colors.warning + '0E', borderColor: colors.warning + '35' }]}>
                  <View style={[S.warningIconWrap, { backgroundColor: colors.warning + '20' }]}>
                    <Ionicons name="warning-outline" size={15} color={colors.warning} />
                  </View>
                  <Text style={S.warningText}>
                    Only send{' '}
                    <Text style={{ fontFamily: FONTS.bold, color: colors.warning }}>{coin.symbol}</Text>
                    {activeChain
                      ? ` on the ${activeChain.label} (${activeChain.tag}) network`
                      : ` via the ${coin.networkLabel}`}
                    {' '}to this address. Sending the wrong asset or network results in permanent loss.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: C.bg },
    scroll: { paddingBottom: 60 },

    // Header
    header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
    backBtn:     { width: 40, height: 40, borderRadius: 13, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
    headerTitle: { color: C.text, fontSize: 17, fontFamily: FONTS.bold },

    // Coin chip tabs
    chipRow:  { marginBottom: 10 },
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 7,
      borderRadius: 50, borderWidth: 1.5, borderColor: C.border,
      backgroundColor: C.card, paddingHorizontal: 13, paddingVertical: 8,
    },
    chipLabel: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.semibold },
    chipDot:   { width: 6, height: 6, borderRadius: 3 },

    // Chain pills
    chainSection:      { marginBottom: 18 },
    chainSectionLabel: { color: C.textMuted, fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1.3, marginBottom: 10, paddingHorizontal: 20 },
    chainPill: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      borderRadius: 14, borderWidth: 1.5,
      paddingHorizontal: 12, paddingVertical: 9,
    },
    chainPillLabel: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.semibold },
    chainPillTag:   { fontSize: 10, fontFamily: FONTS.medium, marginTop: 1 },

    body: { paddingHorizontal: 20 },

    // Pending state
    pendingCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: C.card, borderRadius: 18, padding: 18,
      borderWidth: 1, borderColor: C.border, marginBottom: 20,
    },
    pendingIconWrap: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    pendingTitle:    { color: C.text, fontSize: 14, fontFamily: FONTS.semibold, marginBottom: 3 },
    pendingDesc:     { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.regular, lineHeight: 17 },

    // QR section
    qrSection: { alignItems: 'center', marginBottom: 28 },

    // Scanner frame with corner brackets
    scanFrame: {
      position: 'relative',
      padding: 14,
    },
    corner: {
      position: 'absolute',
      width: 24, height: 24,
      borderWidth: 3, borderRadius: 5,
    },
    cTL: { top: 0, left: 0,  borderRightWidth: 0, borderBottomWidth: 0 },
    cTR: { top: 0, right: 0, borderLeftWidth: 0,  borderBottomWidth: 0 },
    cBL: { bottom: 0, left: 0,  borderRightWidth: 0, borderTopWidth: 0 },
    cBR: { bottom: 0, right: 0, borderLeftWidth: 0,  borderTopWidth: 0 },

    // White QR card
    qrCard: {
      padding: QR_PAD,
      backgroundColor: '#FFFFFF',
      borderRadius: 22,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12, shadowRadius: 20,
      elevation: 10,
      position: 'relative',
    },

    // Coin logo overlaid in center of QR
    qrLogoWrap: {
      position: 'absolute',
      width: LOGO_SIZE + 8,
      height: LOGO_SIZE + 8,
      borderRadius: (LOGO_SIZE + 8) / 2,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      top:  QR_PAD + (QR_SIZE / 2) - (LOGO_SIZE + 8) / 2,
      left: QR_PAD + (QR_SIZE / 2) - (LOGO_SIZE + 8) / 2,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12, shadowRadius: 6,
    },

    scanHint:     { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.medium, marginTop: 18, textAlign: 'center' },
    scanHintBold: { fontFamily: FONTS.bold },

    // No address state
    noAddrBox:     { alignItems: 'center', paddingVertical: 40, gap: 12 },
    noAddrIconWrap:{ width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    noAddrTitle:   { color: C.text, fontSize: 16, fontFamily: FONTS.semibold },
    noAddrDesc:    { color: C.textMuted, fontSize: 13, fontFamily: FONTS.regular, textAlign: 'center' },

    // Address card
    addressCard: {
      backgroundColor: C.card, borderRadius: 20, padding: 18,
      borderWidth: 1, borderColor: C.border, marginBottom: 14,
    },
    addressCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    addressCardLabel:  { color: C.textMuted, fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1.2 },
    networkBadge: {
      borderRadius: 20, borderWidth: 1,
      paddingHorizontal: 9, paddingVertical: 3,
    },
    networkBadgeText: { fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 0.5 },

    addressText: {
      color: C.text, fontSize: 13, fontFamily: FONTS.medium,
      letterSpacing: 0.4, lineHeight: 21, marginBottom: 18,
    },

    actionRow: { flexDirection: 'row', gap: 10 },
    actionBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 7, borderRadius: 13, borderWidth: 1.5,
      paddingVertical: 13,
    },
    actionBtnFilled: { borderWidth: 0 },
    actionBtnText: { fontSize: 14, fontFamily: FONTS.semibold },

    // Warning
    warningBox: {
      flexDirection: 'row', gap: 12, borderRadius: 16,
      padding: 14, borderWidth: 1, alignItems: 'flex-start',
      marginBottom: 20,
    },
    warningIconWrap: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    warningText:     { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.regular, flex: 1, lineHeight: 19 },
  });
}
