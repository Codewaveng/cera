import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getMe } from '../services/api';
import { feedbackSuccess } from '../utils/feedback';
import AppModal from '../components/AppModal';

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
    id: 'bnb', symbol: 'BNB', name: 'BNB', color: '#F3BA2F',
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

function CoinLogo({ uri, color, symbol, size = 28 }) {
  const [failed, setFailed] = useState(false);
  if (failed || !uri) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color + '25', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color, fontSize: size * 0.38, fontFamily: FONTS.bold }}>{symbol[0]}</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} onError={() => setFailed(true)} />;
}

export default function ReceiveScreen({ navigation }) {
  const { colors } = useTheme();
  const { user, refreshUser } = useAuth();
  const S = useMemo(() => makeStyles(colors), [colors]);

  const [coinIdx, setCoinIdx]   = useState(0);
  const [chainIdx, setChainIdx] = useState(0);
  const [copied, setCopied]     = useState(false);
  const [copyModal, setCopyModal] = useState(false);

  const walletsReady = !!user?.cryptoAddresses?.evm;

  // Poll every 3 seconds until Turnkey wallet creation completes
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

  const coin         = COINS[coinIdx];
  const activeChain  = coin.multiChain ? coin.chains[chainIdx] : null;
  const addressKey   = activeChain ? activeChain.addressKey : coin.addressKey;
  const address      = user?.cryptoAddresses?.[addressKey] || null;
  const accentColor  = activeChain ? activeChain.color : coin.color;
  const networkLabel = activeChain
    ? `${coin.symbol} • ${activeChain.label} (${activeChain.tag})`
    : coin.networkLabel;

  function handleSelectCoin(i) {
    setCoinIdx(i);
    setChainIdx(0);
    setCopied(false);
  }

  async function handleCopy() {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    feedbackSuccess();
    setCopied(true);
    setCopyModal(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={S.title}>Receive Crypto</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>

        {/* ── Coin selector ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.coinRow} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {COINS.map((c, i) => (
            <TouchableOpacity
              key={c.id}
              style={[S.coinTab, coinIdx === i && { borderColor: c.color, backgroundColor: c.color + '18' }]}
              onPress={() => handleSelectCoin(i)}
              activeOpacity={0.7}
            >
              <CoinLogo uri={c.logo} color={c.color} symbol={c.symbol} size={24} />
              <Text style={[S.coinTabLabel, coinIdx === i && { color: c.color }]}>{c.symbol}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Chain selector (USDT / USDC) ── */}
        {coin.multiChain && (
          <View style={S.chainSection}>
            <Text style={S.chainSectionLabel}>SELECT NETWORK</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
              {coin.chains.map((ch, i) => (
                <TouchableOpacity
                  key={ch.id}
                  style={[S.chainTab, chainIdx === i && { borderColor: ch.color, backgroundColor: ch.color + '15' }]}
                  onPress={() => { setChainIdx(i); setCopied(false); }}
                  activeOpacity={0.7}
                >
                  <CoinLogo uri={ch.logo} color={ch.color} symbol={ch.label} size={20} />
                  <View>
                    <Text style={[S.chainLabel, chainIdx === i && { color: ch.color }]}>{ch.label}</Text>
                    <Text style={[S.chainTag, chainIdx === i && { color: ch.color + 'AA' }]}>{ch.tag}</Text>
                  </View>
                  {chainIdx === i && <Ionicons name="checkmark-circle" size={15} color={ch.color} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={S.body}>

          {/* Wallet being created by Turnkey — auto-refreshes every 3s */}
          {!walletsReady && (
            <View style={S.pendingBox}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={S.pendingText}>Setting up your wallet… this takes a few seconds after first sign up.</Text>
            </View>
          )}

          {walletsReady && (
            <>
              {/* Network banner */}
              <View style={[S.networkBanner, { borderColor: accentColor + '40', backgroundColor: accentColor + '0D' }]}>
                <CoinLogo uri={coin.logo} color={coin.color} symbol={coin.symbol} size={34} />
                <View style={{ flex: 1 }}>
                  <Text style={S.networkName}>{coin.name}</Text>
                  <Text style={S.networkSub}>{networkLabel}</Text>
                </View>
                <View style={[S.activeDot, { backgroundColor: accentColor }]} />
              </View>

              {/* QR Code */}
              {address ? (
                <View style={S.qrWrap}>
                  <View style={S.qrBox}>
                    <QRCode value={address} size={190} color="#080A1A" backgroundColor="#FFFFFF" />
                    <View style={[S.qrBadge, { backgroundColor: accentColor }]}>
                      <Text style={S.qrBadgeText}>{activeChain ? activeChain.tag : coin.symbol}</Text>
                    </View>
                  </View>
                  <Text style={S.qrHint}>
                    Scan to send {coin.symbol}{activeChain ? ` via ${activeChain.tag}` : ''}
                  </Text>
                </View>
              ) : (
                <View style={S.noAddrBox}>
                  <Ionicons name="wallet-outline" size={32} color={colors.textMuted} />
                  <Text style={S.noAddrText}>Address unavailable for this network</Text>
                </View>
              )}

              {/* Address card */}
              <View style={S.addressCard}>
                <Text style={S.addressLabel}>WALLET ADDRESS</Text>
                <Text style={S.addressText} selectable>{address || '—'}</Text>
                <TouchableOpacity
                  style={[S.copyBtn, { borderColor: accentColor + '60', backgroundColor: accentColor + '0E' },
                    copied && { borderColor: colors.success, backgroundColor: colors.success + '10' }]}
                  onPress={handleCopy}
                  activeOpacity={0.7}
                  disabled={!address}
                >
                  <Ionicons
                    name={copied ? 'checkmark-circle' : 'copy-outline'}
                    size={18}
                    color={copied ? colors.success : accentColor}
                  />
                  <Text style={[S.copyBtnText, { color: accentColor }, copied && { color: colors.success }]}>
                    {copied ? 'Copied!' : 'Copy Address'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Warning */}
              <View style={S.warningBox}>
                <Ionicons name="warning-outline" size={16} color={colors.warning} />
                <Text style={S.warningText}>
                  Only send{' '}
                  <Text style={{ fontFamily: FONTS.bold, color: colors.warning }}>{coin.symbol}</Text>
                  {activeChain
                    ? ` on the ${activeChain.label} network (${activeChain.tag})`
                    : ` on the ${coin.networkLabel}`}
                  {' '}to this address. Sending the wrong asset or wrong network results in permanent loss.
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <AppModal
        visible={copyModal}
        type="success"
        title="Address Copied!"
        message={`${coin.symbol}${activeChain ? ` (${activeChain.tag})` : ''} address copied to clipboard.`}
        primaryLabel="Done"
        onClose={() => setCopyModal(false)}
        onPrimary={() => setCopyModal(false)}
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
    scroll: { paddingBottom: 60 },

    coinRow: { marginBottom: 8 },
    coinTab: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card, paddingHorizontal: 13, paddingVertical: 8, marginRight: 10 },
    coinTabLabel: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.semibold },

    chainSection: { marginBottom: 16 },
    chainSectionLabel: { color: C.textMuted, fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1.2, marginBottom: 10, paddingHorizontal: 20 },
    chainTab: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 9 },
    chainLabel: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.semibold },
    chainTag: { color: C.textMuted, fontSize: 10, fontFamily: FONTS.medium, marginTop: 1 },

    body: { paddingHorizontal: 20 },
    pendingBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
    pendingText: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.medium, flex: 1 },

    networkBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14, marginBottom: 20, borderWidth: 1 },
    networkName: { color: C.text, fontSize: 15, fontFamily: FONTS.bold },
    networkSub: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },
    activeDot: { width: 8, height: 8, borderRadius: 4 },

    qrWrap: { alignItems: 'center', marginBottom: 24 },
    qrBox: { padding: 16, backgroundColor: '#FFFFFF', borderRadius: 20, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
    qrBadge: { position: 'absolute', bottom: -12, alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    qrBadgeText: { color: '#FFFFFF', fontSize: 11, fontFamily: FONTS.bold },
    qrHint: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.medium, marginTop: 22 },

    noAddrBox: { alignItems: 'center', paddingVertical: 32, gap: 10 },
    noAddrText: { color: C.textMuted, fontSize: 14, fontFamily: FONTS.medium },

    addressCard: { backgroundColor: C.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 14 },
    addressLabel: { color: C.textMuted, fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1, marginBottom: 8 },
    addressText: { color: C.text, fontSize: 13, fontFamily: FONTS.medium, lineHeight: 20, marginBottom: 14 },
    copyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1.5, paddingVertical: 11 },
    copyBtnText: { fontSize: 14, fontFamily: FONTS.semibold },

    warningBox: { flexDirection: 'row', gap: 10, backgroundColor: C.warning + '12', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.warning + '30', alignItems: 'flex-start' },
    warningText: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.regular, flex: 1, lineHeight: 18 },
  });
}
