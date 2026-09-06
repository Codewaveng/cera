import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../constants/colors';
import GradientButton from '../components/GradientButton';

const RATE_LOCK_SECONDS = 60;

export default function ConfirmScreen({ navigation, route }) {
  const { crypto, cryptoAmount, ngnAmount, fee, bank, accountNumber, accountName } = route.params;
  const [timeLeft, setTimeLeft] = useState(RATE_LOCK_SECONDS);
  const [loading, setLoading] = useState(false);

  const progressAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.timing(progressAnim, {
      toValue: 0,
      duration: RATE_LOCK_SECONDS * 1000,
      useNativeDriver: false,
    }).start();

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const timerColor = progressAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [COLORS.error, COLORS.warning, COLORS.success],
  });

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.replace('Success', {
        crypto,
        cryptoAmount,
        ngnAmount,
        bank,
        accountNumber,
        accountName,
      });
    }, 2000);
  };

  const summaryRows = [
    { label: 'Asset', value: `${cryptoAmount} ${crypto.symbol}` },
    { label: 'Rate', value: `1 ${crypto.symbol} = ₦${crypto.priceNGN.toLocaleString()}` },
    { label: 'Gross Amount', value: `₦${(ngnAmount + fee).toLocaleString('en-NG', { maximumFractionDigits: 2 })}` },
    { label: `Fee (1.5%)`, value: `-₦${fee.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`, color: COLORS.error },
    { label: 'You receive', value: `₦${ngnAmount.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`, color: COLORS.success, bold: true },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Transaction</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Rate Lock Timer */}
          <View style={styles.timerCard}>
            <View style={styles.timerContent}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.timerLabel}>Rate locked for</Text>
              <Animated.Text style={[styles.timerValue, { color: timerColor }]}>
                {timeLeft}s
              </Animated.Text>
            </View>
            <View style={styles.timerBarBg}>
              <Animated.View
                style={[
                  styles.timerBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: timerColor,
                  },
                ]}
              />
            </View>
            {timeLeft === 0 && (
              <Text style={styles.expiredText}>Rate expired. Please go back and retry.</Text>
            )}
          </View>

          {/* Crypto Summary */}
          <View style={styles.cryptoSummary}>
            <LinearGradient colors={crypto.gradient} style={styles.cryptoIconLg}>
              <Text style={styles.cryptoIconLgText}>{crypto.symbol[0]}</Text>
            </LinearGradient>
            <View>
              <Text style={styles.cryptoAmountLg}>
                {cryptoAmount} {crypto.symbol}
              </Text>
              <Text style={styles.cryptoName}>{crypto.name}</Text>
            </View>
            <Ionicons name="arrow-forward" size={22} color={COLORS.textMuted} style={{ marginHorizontal: 12 }} />
            <View>
              <Text style={[styles.cryptoAmountLg, { color: COLORS.success }]}>
                ₦{ngnAmount.toLocaleString('en-NG', { maximumFractionDigits: 2 })}
              </Text>
              <Text style={styles.cryptoName}>Nigerian Naira</Text>
            </View>
          </View>

          {/* Transaction Details */}
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Transaction Details</Text>
            {summaryRows.map((row) => (
              <View key={row.label} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{row.label}</Text>
                <Text style={[styles.detailValue, row.color && { color: row.color }, row.bold && { fontWeight: '700', fontSize: 15 }]}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Bank Details */}
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Payment Destination</Text>
            {[
              { label: 'Bank', value: bank },
              { label: 'Account Number', value: accountNumber },
              { label: 'Account Name', value: accountName },
            ].map((row) => (
              <View key={row.label} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{row.label}</Text>
                <Text style={styles.detailValue}>{row.value}</Text>
              </View>
            ))}
          </View>

          {/* Security Notice */}
          <View style={styles.notice}>
            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
            <Text style={styles.noticeText}>
              Your transaction is protected by 256-bit encryption. Funds are sent within 10 minutes.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title={loading ? 'Processing...' : 'Confirm & Sell Crypto'}
          onPress={handleConfirm}
          disabled={loading || timeLeft === 0}
        />
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  headerTitle: { color: '#0F172A', fontSize: 17, fontWeight: '700' },
  scroll: { paddingHorizontal: 20, paddingBottom: 140 },
  timerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  timerContent: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  timerLabel: { color: '#475569', fontSize: 13, flex: 1 },
  timerValue: { fontSize: 18, fontWeight: '800' },
  timerBarBg: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden' },
  timerBarFill: { height: '100%', borderRadius: 2 },
  expiredText: { color: COLORS.error, fontSize: 12, marginTop: 8, fontWeight: '500' },
  cryptoSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  cryptoIconLg: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cryptoIconLgText: { fontSize: 22, color: COLORS.white, fontWeight: '700' },
  cryptoAmountLg: { color: '#0F172A', fontSize: 16, fontWeight: '800' },
  cryptoName: { color: '#475569', fontSize: 12, marginTop: 2 },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  detailTitle: { color: '#0F172A', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { color: '#475569', fontSize: 13 },
  detailValue: { color: '#0F172A', fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  notice: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    marginBottom: 8,
  },
  noticeText: { color: '#475569', fontSize: 12, flex: 1, lineHeight: 18 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF' + 'EE',
    gap: 8,
  },
  cancelBtn: { height: 44, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#475569', fontSize: 15, fontWeight: '600' },
});
