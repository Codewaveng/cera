import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

const BRAND = '#7C3AED';

function parseCryptoNarration(tx) {
  if (tx.crypto && tx.cryptoAmount != null) {
    return { symbol: tx.crypto.toUpperCase(), amount: tx.cryptoAmount };
  }
  const match = (tx.narration || '').match(/^([\d.]+)\s+([A-Z]{2,10})\s+received/i);
  if (match) return { symbol: match[2].toUpperCase(), amount: parseFloat(match[1]) };
  return { symbol: null, amount: null };
}

const TYPE_CONFIG = {
  cera_transfer_in: {
    icon: 'arrow-bottom-left-thick',
    sign: '+', incoming: true,
    getTitle: (tx) => tx.from?.name || 'CERA User',
    getType:  () => 'CERA Received',
  },
  cera_transfer_out: {
    icon: 'arrow-top-right-thick',
    sign: '-', incoming: false,
    getTitle: (tx) => tx.to?.name || 'CERA User',
    getType:  () => 'CERA Transfer',
  },
  crypto_receive: {
    icon: 'arrow-collapse-down',
    sign: '+', incoming: true,
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
    icon: 'bank-transfer',
    sign: '-', incoming: false,
    getTitle: (tx) => tx.bankName || tx.narration || 'Bank',
    getType:  () => 'Bank Transfer',
  },
  utility: {
    sign: '-', incoming: false,
    getIcon: (tx) => {
      const n = (tx.narration || '').toLowerCase();
      if (n.includes('airtime'))                           return 'cellphone';
      if (n.includes('data'))                              return 'wifi';
      if (n.includes('tv') || n.includes('cable'))         return 'television-play';
      if (n.includes('electricity') || n.includes('power')) return 'lightning-bolt';
      return 'receipt';
    },
    getTitle: (tx) => tx.narration || 'Utility',
    getType: (tx) => {
      const n = (tx.narration || '').toLowerCase();
      if (n.includes('airtime'))                           return 'Airtime';
      if (n.includes('data'))                              return 'Mobile Data';
      if (n.includes('tv') || n.includes('cable'))         return 'Cable TV';
      if (n.includes('electricity') || n.includes('power')) return 'Electricity';
      return 'Bill Payment';
    },
  },
  funding: {
    sign: '+', incoming: true,
    getIcon: (tx) => {
      const n = (tx.narration || '').toLowerCase();
      if (n.includes('referral')) return 'gift';
      return 'wallet-plus';
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
  const d   = new Date(iso);
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
  const icon   = type.getIcon ? type.getIcon(tx) : type.icon;
  const amountFormatted = `${type.sign}₦${(tx.amount ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  const amountColor = type.incoming ? colors.success : colors.text;

  return (
    <TouchableOpacity style={S.row} onPress={onPress} activeOpacity={0.65}>
      <View style={S.iconCircle}>
        <MaterialCommunityIcons name={icon} size={20} color={BRAND} />
      </View>

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
      borderRadius: 14,
      backgroundColor: BRAND + '12',
      alignItems: 'center',
      justifyContent: 'center',
    },
    middle:    { flex: 1, marginLeft: 13 },
    title:     { color: C.text, fontSize: 14, fontFamily: FONTS.semibold },
    typeLabel: { color: C.textMuted, fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },
    right:     { alignItems: 'flex-end', gap: 3 },
    amount:    { fontSize: 14, fontFamily: FONTS.bold },
    date:      { color: C.textMuted, fontSize: 11, fontFamily: FONTS.regular },
  });
}
