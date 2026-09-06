import React, { useMemo, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

const COIN_META = {
  BTC:  { icon: 'bitcoin',      color: '#F59E0B', bg: '#FEF3C7' },
  ETH:  { icon: 'ethereum',     color: '#627EEA', bg: '#EEF2FF' },
  SOL:  { icon: null,           color: '#9945FF', bg: '#F3EEFF' },
  BNB:  { icon: null,           color: '#F3BA2F', bg: '#FFFBEB' },
  USDT: { icon: 'currency-usd', color: '#26A17B', bg: '#ECFDF5' },
  USDC: { icon: 'currency-usd', color: '#2775CA', bg: '#EFF6FF' },
  TRX:  { icon: null,           color: '#EF4444', bg: '#FEF2F2' },
  MATIC:{ icon: null,           color: '#8247E5', bg: '#F5F0FF' },
  POL:  { icon: null,           color: '#8247E5', bg: '#F5F0FF' },
};

function getCoinMeta(symbol) {
  return COIN_META[symbol?.toUpperCase()] || { icon: null, color: '#F59E0B', bg: '#FEF3C7' };
}

// Parses "50 SOL received and converted" → { symbol: 'SOL', amount: 50 }
function parseCryptoNarration(tx) {
  if (tx.crypto && tx.cryptoAmount != null) {
    return { symbol: tx.crypto.toUpperCase(), amount: tx.cryptoAmount };
  }
  const match = (tx.narration || '').match(/^([\d.]+)\s+([A-Z]{2,10})\s+received/i);
  if (match) return { symbol: match[2].toUpperCase(), amount: parseFloat(match[1]) };
  return { symbol: null, amount: null };
}

// Hardcoded CoinGecko image URLs for the most common coins (reliable, stable)
const COIN_LOGO_URLS = {
  BTC:  'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH:  'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  SOL:  'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  BNB:  'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  USDC: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
  TRX:  'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
  MATIC:'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
  POL:  'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
  XRP:  'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  ADA:  'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  TON:  'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png',
};

function CoinIcon({ symbol, size = 46 }) {
  const [imgError, setImgError] = useState(false);
  const meta = getCoinMeta(symbol);
  const logoUrl = symbol ? COIN_LOGO_URLS[symbol.toUpperCase()] : null;

  if (logoUrl && !imgError) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: meta.bg }}>
        <Image
          source={{ uri: logoUrl }}
          style={{ width: size, height: size }}
          onError={() => setImgError(true)}
        />
      </View>
    );
  }

  // Fallback: MCI icon (BTC/ETH) or styled ticker text
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: meta.bg, alignItems: 'center', justifyContent: 'center' }}>
      {meta.icon ? (
        <MaterialCommunityIcons name={meta.icon} size={size * 0.46} color={meta.color} />
      ) : (
        <Text style={{ color: meta.color, fontSize: size * 0.27, fontFamily: FONTS.extrabold, letterSpacing: -0.5 }}>
          {(symbol || '?').toUpperCase().slice(0, 3)}
        </Text>
      )}
    </View>
  );
}

const TYPE_CONFIG = {
  cera_transfer_in: {
    icon: 'arrow-bottom-left-thick',
    color: '#10B981',
    sign: '+',
    incoming: true,
    getTitle: (tx) => tx.from?.name || 'CERA User',
    getType:  () => 'CERA Received',
  },
  cera_transfer_out: {
    icon: 'arrow-top-right-thick',
    color: '#7C3AED',
    sign: '-',
    incoming: false,
    getTitle: (tx) => tx.to?.name || 'CERA User',
    getType:  () => 'CERA Transfer',
  },
  crypto_receive: {
    icon: null,
    color: null,
    sign: '+',
    incoming: true,
    getTitle: (tx) => {
      const { symbol, amount } = parseCryptoNarration(tx);
      return amount != null && symbol ? `${amount} ${symbol}` : (symbol || 'Crypto');
    },
    getType: (tx) => {
      const { symbol } = parseCryptoNarration(tx);
      return symbol ? `${symbol} Received` : 'Crypto Received';
    },
  },
  bank_payout: {
    icon: 'bank-transfer-out',
    color: '#6366F1',
    sign: '-',
    incoming: false,
    getTitle: (tx) => tx.bankName || tx.narration || 'Bank',
    getType:  () => 'Bank Transfer',
  },
  utility: {
    icon: 'lightning-bolt',
    color: '#F59E0B',
    sign: '-',
    incoming: false,
    getTitle: (tx) => tx.narration || 'Utility',
    getType: (tx) => {
      const n = (tx.narration || '').toLowerCase();
      if (n.includes('airtime'))                  return 'Airtime';
      if (n.includes('data'))                     return 'Mobile Data';
      if (n.includes('tv') || n.includes('cable'))return 'Cable TV';
      if (n.includes('electricity') || n.includes('power')) return 'Electricity';
      return 'Bill Payment';
    },
  },
  funding: {
    sign: '+',
    incoming: true,
    getIcon: (tx) => {
      const n = (tx.narration || '').toLowerCase();
      if (n.includes('referral')) return 'gift';
      return 'wallet-plus';
    },
    getColor: (tx) => {
      const n = (tx.narration || '').toLowerCase();
      if (n.includes('referral')) return '#EF4444';
      return '#10B981';
    },
    getTitle: (tx) => {
      const n = (tx.narration || '').toLowerCase();
      if (n.includes('referral')) return 'Referral Bonus';
      return 'Wallet Funded';
    },
    getType: (tx) => {
      const n = (tx.narration || '').toLowerCase();
      if (n.includes('referral')) return 'Referral Bonus';
      return 'Deposit';
    },
  },
};

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  if (now - d < 86400000) {
    return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

export default function TransactionItem({ tx, onPress }) {
  const { colors } = useTheme();
  const S = useMemo(() => makeStyles(colors), [colors]);

  const type   = TYPE_CONFIG[tx.type] || TYPE_CONFIG.cera_transfer_in;
  const isCrypto = tx.type === 'crypto_receive';
  const cryptoInfo = isCrypto ? parseCryptoNarration(tx) : null;
  const amountFormatted = `${type.sign}₦${(tx.amount ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  const amountColor = type.incoming ? '#10B981' : '#0F172A';

  const typeIcon  = type.getIcon  ? type.getIcon(tx)  : type.icon;
  const typeColor = type.getColor ? type.getColor(tx) : type.color;

  return (
    <TouchableOpacity style={S.row} onPress={onPress} activeOpacity={0.65}>
      {isCrypto ? (
        <CoinIcon symbol={cryptoInfo?.symbol} size={46} />
      ) : (
        <View style={[S.iconCircle, { backgroundColor: typeColor + '15' }]}>
          <MaterialCommunityIcons name={typeIcon} size={20} color={typeColor} />
        </View>
      )}

      <View style={S.middle}>
        <Text style={S.title} numberOfLines={1}>{type.getTitle(tx)}</Text>
        <Text style={S.typeLabel}>{type.getType(tx)}</Text>
      </View>

      <View style={S.right}>
        <Text style={[S.amount, { color: amountColor }]}>{amountFormatted}</Text>
        <Text style={S.date}>{formatDate(tx.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      backgroundColor: C.bg,
    },
    iconCircle: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
    },
    middle: { flex: 1, marginLeft: 13 },
    title: { color: C.text, fontSize: 14, fontFamily: FONTS.semibold },
    typeLabel: { color: C.textMuted, fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },
    right: { alignItems: 'flex-end', gap: 3 },
    amount: { fontSize: 14, fontFamily: FONTS.bold },
    date: { color: C.textMuted, fontSize: 11, fontFamily: FONTS.regular },
  });
}
