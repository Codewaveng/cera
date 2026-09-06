import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { CRYPTOS } from '../constants/data';
import { useTheme } from '../context/ThemeContext';

const USD_NGN = 1594;

function CoinLogo({ coin, size = 36 }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: coin.color + '25', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: coin.color, fontSize: size * 0.38, fontFamily: FONTS.bold }}>{coin.symbol[0]}</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri: coin.logoUrl }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      onError={() => setFailed(true)}
    />
  );
}

export default function CalculatorScreen() {
  const { colors } = useTheme();
  const [amount, setAmount] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(2);
  const S = useMemo(() => makeStyles(colors), [colors]);

  const coin = CRYPTOS[selectedIndex];
  const ngnResult = amount ? (parseFloat(amount) * coin.priceNGN) : 0;

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <View style={S.header}>
        <Text style={S.title}>Rates</Text>
        <View style={S.liveTag}>
          <View style={S.liveDot} />
          <Text style={S.liveText}>LIVE</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled">

        <View style={S.calcCard}>
          <Text style={S.calcTitle}>Crypto to Naira</Text>

          <View style={S.coinPicker}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {CRYPTOS.map((c, i) => (
                <TouchableOpacity
                  key={c.id}
                  style={[S.coinChip, selectedIndex === i && { borderColor: c.color, backgroundColor: c.color + '18' }]}
                  onPress={() => setSelectedIndex(i)}
                  activeOpacity={0.7}
                >
                  <CoinLogo coin={c} size={22} />
                  <Text style={[S.chipText, selectedIndex === i && { color: c.color }]}>{c.symbol}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={S.rateDisplay}>
            <Text style={S.rateDisplayLabel}>1 {coin.symbol} =</Text>
            <Text style={[S.rateDisplayValue, { color: coin.color }]}>
              ₦{coin.priceNGN.toLocaleString()}
            </Text>
          </View>

          <View style={S.inputBlock}>
            <View style={S.inputSection}>
              <Text style={S.inputLabel}>You have ({coin.symbol})</Text>
              <View style={S.inputRow}>
                <CoinLogo coin={coin} size={28} />
                <TextInput
                  style={S.calcInput}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
                <Text style={S.inputSuffix}>{coin.symbol}</Text>
              </View>
            </View>

            <View style={S.arrowSep}>
              <View style={S.arrowLine} />
              <View style={S.arrowCircle}>
                <Ionicons name="arrow-down" size={16} color={colors.primary} />
              </View>
              <View style={S.arrowLine} />
            </View>

            <View style={S.inputSection}>
              <Text style={S.inputLabel}>You get (NGN)</Text>
              <View style={[S.inputRow, { backgroundColor: '#F0FFF8' }]}>
                <Text style={S.ngnSymbol}>₦</Text>
                <Text style={[S.resultText, ngnResult === 0 && { color: colors.textMuted }]}>
                  {ngnResult > 0
                    ? ngnResult.toLocaleString('en-NG', { maximumFractionDigits: 2 })
                    : '0.00'}
                </Text>
              </View>
            </View>
          </View>

          {amount && ngnResult > 0 && (
            <View style={S.breakdown}>
              <View style={S.breakdownRow}>
                <Text style={S.breakdownLabel}>Rate</Text>
                <Text style={S.breakdownVal}>1 {coin.symbol} = ₦{coin.priceNGN.toLocaleString()}</Text>
              </View>
              <View style={S.breakdownRow}>
                <Text style={S.breakdownLabel}>USD equivalent</Text>
                <Text style={S.breakdownVal}>≈ ${(ngnResult / USD_NGN).toLocaleString('en', { maximumFractionDigits: 2 })}</Text>
              </View>
            </View>
          )}

          <View style={S.usdRow}>
            <Ionicons name="information-circle-outline" size={13} color={colors.textMuted} />
            <Text style={S.usdText}>$1 USD = ₦{USD_NGN.toLocaleString()}</Text>
          </View>
        </View>

        <Text style={S.ratesTitle}>Market Prices</Text>

        {CRYPTOS.map((c) => {
          const isPos = c.change24h >= 0;
          const usd = (c.priceNGN / USD_NGN).toFixed(c.id === 'usdt' ? 4 : 2);
          return (
            <TouchableOpacity
              key={c.id}
              style={S.rateCard}
              onPress={() => setSelectedIndex(CRYPTOS.indexOf(c))}
              activeOpacity={0.7}
            >
              <View style={S.rateLeft}>
                <CoinLogo coin={c} size={42} />
                <View>
                  <Text style={S.rateSymbol}>{c.symbol}</Text>
                  <Text style={S.rateName}>{c.name}</Text>
                </View>
              </View>
              <View style={S.rateRight}>
                <Text style={S.rateNgn}>₦{c.priceNGN.toLocaleString()}</Text>
                <Text style={S.rateUsd}>${parseFloat(usd).toLocaleString()}</Text>
                <View style={[S.changeBadge, { backgroundColor: isPos ? colors.success + '18' : colors.error + '18' }]}>
                  <Ionicons name={isPos ? 'trending-up' : 'trending-down'} size={11} color={isPos ? colors.success : colors.error} />
                  <Text style={[S.changeText, { color: isPos ? colors.success : colors.error }]}>
                    {isPos ? '+' : ''}{c.change24h.toFixed(2)}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <Text style={S.disclaimer}>
          Rates are indicative. Actual conversion rates may vary slightly.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 14,
    },
    title: { color: C.text, fontSize: 24, fontFamily: FONTS.extrabold },
    liveTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: C.success + '18',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
    },
    liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.success },
    liveText: { color: C.success, fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 0.5 },

    scroll: { paddingHorizontal: 20, paddingBottom: 100 },

    calcCard: {
      backgroundColor: C.card,
      borderRadius: 22,
      padding: 18,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: C.border,
    },
    calcTitle: { color: C.text, fontSize: 15, fontFamily: FONTS.bold, marginBottom: 14 },

    coinPicker: { marginBottom: 16 },
    coinChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: C.border,
      backgroundColor: C.surface,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    chipText: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.semibold },

    rateDisplay: {
      alignItems: 'center',
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: '#FAFAFA',
      marginBottom: 16,
      borderWidth: 1,
      borderColor: C.border,
    },
    rateDisplayLabel: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.medium, marginBottom: 4 },
    rateDisplayValue: { fontSize: 28, fontFamily: FONTS.extrabold },

    inputBlock: { gap: 0, marginBottom: 14 },

    inputSection: { marginBottom: 0 },
    inputLabel: {
      color: C.textSecondary,
      fontSize: 11,
      fontFamily: FONTS.semibold,
      letterSpacing: 0.4,
      marginBottom: 8,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: C.inputBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    calcInput: {
      flex: 1,
      color: C.text,
      fontSize: 22,
      fontFamily: FONTS.bold,
      padding: 0,
    },
    inputSuffix: {
      color: C.textMuted,
      fontSize: 14,
      fontFamily: FONTS.semibold,
    },
    ngnSymbol: {
      color: C.success,
      fontSize: 22,
      fontFamily: FONTS.bold,
    },
    resultText: {
      flex: 1,
      color: C.success,
      fontSize: 22,
      fontFamily: FONTS.bold,
    },

    arrowSep: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 10,
    },
    arrowLine: { flex: 1, height: 1, backgroundColor: C.border },
    arrowCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: C.primary + '18',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 10,
      borderWidth: 1,
      borderColor: C.primary + '30',
    },

    breakdown: {
      backgroundColor: '#FAFAFA',
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      gap: 6,
    },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
    breakdownLabel: { color: C.textMuted, fontSize: 12, fontFamily: FONTS.regular },
    breakdownVal: { color: C.text, fontSize: 12, fontFamily: FONTS.semibold },

    usdRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    usdText: { color: C.textMuted, fontSize: 12, fontFamily: FONTS.regular },

    ratesTitle: { color: C.text, fontSize: 16, fontFamily: FONTS.bold, marginBottom: 14 },

    rateCard: {
      backgroundColor: C.card,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: C.border,
    },
    rateLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    rateSymbol: { color: C.text, fontSize: 14, fontFamily: FONTS.bold },
    rateName: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },
    rateRight: { alignItems: 'flex-end', gap: 3 },
    rateNgn: { color: C.text, fontSize: 14, fontFamily: FONTS.bold },
    rateUsd: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.regular },
    changeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 7,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    changeText: { fontSize: 11, fontFamily: FONTS.semibold },

    disclaimer: {
      color: C.textMuted,
      fontSize: 11,
      fontFamily: FONTS.regular,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 16,
    },
  });
}
