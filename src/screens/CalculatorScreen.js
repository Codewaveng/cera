import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { CRYPTOS } from '../constants/data';
import { useTheme } from '../context/ThemeContext';
import { feedbackLight } from '../utils/feedback';

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
  const [amount, setAmount]           = useState('');
  const [selectedIndex, setSelectedIndex] = useState(2);
  const S = useMemo(() => makeStyles(colors), [colors]);

  const coin      = CRYPTOS[selectedIndex];
  const ngnResult = amount ? parseFloat(amount) * coin.priceNGN : 0;

  function selectCoin(i) {
    feedbackLight();
    setSelectedIndex(i);
    setAmount('');
  }

  return (
    <SafeAreaView style={S.root} edges={['top']}>
      <View style={S.header}>
        <Text style={S.title}>Rates</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={S.scroll}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Converter ───────────────────────────────── */}
        <Text style={S.sectionLabel}>CONVERT</Text>

        {/* Coin chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={S.chipRow}
          contentContainerStyle={{ paddingRight: 4, gap: 8 }}
        >
          {CRYPTOS.map((c, i) => (
            <TouchableOpacity
              key={c.id}
              style={[S.chip, selectedIndex === i && { borderColor: c.color, backgroundColor: c.color + '15' }]}
              onPress={() => selectCoin(i)}
              activeOpacity={0.7}
            >
              <CoinLogo coin={c} size={20} />
              <Text style={[S.chipText, selectedIndex === i && { color: c.color }]}>{c.symbol}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Inline rate */}
        <View style={S.rateRow}>
          <Text style={S.rateLabel}>1 {coin.symbol} =</Text>
          <Text style={[S.rateValue, { color: coin.color }]}>
            ₦{coin.priceNGN.toLocaleString()}
          </Text>
        </View>

        {/* Input */}
        <View style={S.inputBlock}>
          <View style={S.inputRow}>
            <CoinLogo coin={coin} size={26} />
            <TextInput
              style={S.input}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
            <Text style={S.inputSuffix}>{coin.symbol}</Text>
          </View>

          <View style={S.arrowRow}>
            <View style={S.arrowLine} />
            <View style={[S.arrowCircle, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Ionicons name="arrow-down" size={14} color={colors.textMuted} />
            </View>
            <View style={S.arrowLine} />
          </View>

          <View style={[S.inputRow, S.resultRow]}>
            <Text style={[S.ngnSymbol, { color: colors.success }]}>₦</Text>
            <Text style={[S.resultText, { color: ngnResult > 0 ? colors.success : colors.textMuted }]}>
              {ngnResult > 0
                ? ngnResult.toLocaleString('en-NG', { maximumFractionDigits: 2 })
                : '0.00'}
            </Text>
            <Text style={S.inputSuffix}>NGN</Text>
          </View>
        </View>

        {/* Breakdown */}
        {amount && ngnResult > 0 && (
          <View style={S.breakdown}>
            <View style={S.breakdownRow}>
              <Text style={S.breakdownLabel}>USD equivalent</Text>
              <Text style={S.breakdownVal}>
                ≈ ${(ngnResult / USD_NGN).toLocaleString('en', { maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={S.breakdownRow}>
              <Text style={S.breakdownLabel}>USD/NGN reference</Text>
              <Text style={S.breakdownVal}>${'1'} = ₦{USD_NGN.toLocaleString()}</Text>
            </View>
          </View>
        )}

        {/* ── Market prices ────────────────────────────── */}
        <Text style={[S.sectionLabel, { marginTop: 28 }]}>MARKET PRICES</Text>

        {CRYPTOS.map((c, i) => {
          const isPos = c.change24h >= 0;
          const usd   = (c.priceNGN / USD_NGN).toFixed(c.id === 'usdt' || c.id === 'usdc' ? 4 : 2);
          const isSelected = selectedIndex === i;
          return (
            <TouchableOpacity
              key={c.id}
              style={[S.rateRow2, isSelected && { backgroundColor: c.color + '08' }]}
              onPress={() => selectCoin(i)}
              activeOpacity={0.6}
            >
              <CoinLogo coin={c} size={42} />
              <View style={S.rateMiddle}>
                <Text style={S.rateSymbol}>{c.symbol}</Text>
                <Text style={S.rateName}>{c.name}</Text>
              </View>
              <View style={S.rateRight}>
                <Text style={S.rateNgn}>₦{c.priceNGN.toLocaleString()}</Text>
                <View style={S.rateSubRow}>
                  <Text style={S.rateUsd}>${parseFloat(usd).toLocaleString()}</Text>
                  <Text style={[S.rateChange, { color: isPos ? colors.success : colors.error }]}>
                    {isPos ? '+' : ''}{c.change24h.toFixed(2)}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <Text style={S.disclaimer}>
          Rates are indicative. Actual rates may vary slightly at conversion time.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: C.bg },
    scroll: { paddingHorizontal: 20, paddingBottom: 100 },

    header: {
      paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    },
    title: { color: C.text, fontSize: 26, fontFamily: FONTS.extrabold },

    sectionLabel: {
      color: C.textMuted, fontSize: 10, fontFamily: FONTS.bold,
      letterSpacing: 1.3, marginBottom: 14,
    },

    // Coin chips
    chipRow:  { marginBottom: 16 },
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      borderRadius: 50, borderWidth: 1.5, borderColor: C.border,
      backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 7,
    },
    chipText: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.semibold },

    // Inline rate display
    rateRow: {
      flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 16,
    },
    rateLabel: { color: C.textSecondary, fontSize: 14, fontFamily: FONTS.medium },
    rateValue: { fontSize: 26, fontFamily: FONTS.extrabold },

    // Input block
    inputBlock: { gap: 0, marginBottom: 6 },
    inputRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: C.card, borderRadius: 16,
      borderWidth: 1, borderColor: C.border,
      paddingHorizontal: 16, paddingVertical: 15,
    },
    resultRow: { backgroundColor: C.success + '08', borderColor: C.success + '30' },
    input: {
      flex: 1, color: C.text, fontSize: 22, fontFamily: FONTS.bold, padding: 0,
    },
    inputSuffix: { color: C.textMuted, fontSize: 14, fontFamily: FONTS.semibold },
    ngnSymbol:   { fontSize: 22, fontFamily: FONTS.bold },
    resultText:  { flex: 1, fontSize: 22, fontFamily: FONTS.bold },

    arrowRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
    arrowLine: { flex: 1, height: 1, backgroundColor: C.border },
    arrowCircle: {
      width: 28, height: 28, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, marginHorizontal: 10,
    },

    // Breakdown
    breakdown: {
      marginTop: 12, marginBottom: 4, gap: 6,
    },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    breakdownLabel: { color: C.textMuted, fontSize: 12, fontFamily: FONTS.regular },
    breakdownVal:   { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.semibold },

    // Market price rows — no card borders, clean separator style
    rateRow2: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: C.border,
      borderRadius: 4,
    },
    rateMiddle: { flex: 1 },
    rateSymbol: { color: C.text, fontSize: 14, fontFamily: FONTS.bold },
    rateName:   { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },
    rateRight:  { alignItems: 'flex-end', gap: 3 },
    rateNgn:    { color: C.text, fontSize: 14, fontFamily: FONTS.bold },
    rateSubRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    rateUsd:    { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.regular },
    rateChange: { fontSize: 12, fontFamily: FONTS.semibold },

    disclaimer: {
      color: C.textMuted, fontSize: 11, fontFamily: FONTS.regular,
      textAlign: 'center', marginTop: 20, lineHeight: 16,
    },
  });
}
