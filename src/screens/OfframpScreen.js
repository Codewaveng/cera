import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../constants/colors';
import { CRYPTOS, FEE_PERCENT } from '../constants/data';
import CryptoCard from '../components/CryptoCard';
import GradientButton from '../components/GradientButton';

function StepDot({ step, current }) {
  const isActive = step <= current;
  return (
    <View style={styles.stepWrap}>
      <LinearGradient
        colors={isActive ? GRADIENTS.primary : [COLORS.border, COLORS.border]}
        style={styles.stepDot}
      >
        <Text style={[styles.stepNum, { color: isActive ? COLORS.white : COLORS.textMuted }]}>
          {step}
        </Text>
      </LinearGradient>
      {step < 2 && (
        <View style={[styles.stepLine, { backgroundColor: step < current ? COLORS.primary : COLORS.border }]} />
      )}
    </View>
  );
}

export default function OfframpScreen({ navigation, route }) {
  const preselect = route?.params?.preselect;
  const [step, setStep] = useState(1);
  const [selectedCrypto, setSelectedCrypto] = useState(
    preselect ? CRYPTOS.find((c) => c.id === preselect) : null
  );
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [inputMode, setInputMode] = useState('crypto');

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const ngnAmount = selectedCrypto
    ? parseFloat(cryptoAmount || 0) * selectedCrypto.priceNGN
    : 0;
  const fee = ngnAmount * FEE_PERCENT;
  const receive = ngnAmount - fee;

  const goToStep = (nextStep) => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
      ]),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleSelectCrypto = (crypto) => {
    setSelectedCrypto(crypto);
  };

  const handleContinue = () => {
    if (step === 1 && selectedCrypto) goToStep(2);
    else if (step === 2 && parseFloat(cryptoAmount) > 0)
      navigation.navigate('BankDetails', { crypto: selectedCrypto, cryptoAmount: parseFloat(cryptoAmount), ngnAmount: receive, fee });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => step > 1 ? goToStep(step - 1) : navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sell Crypto</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Step Indicator */}
      <View style={styles.steps}>
        {[1, 2].map((s) => <StepDot key={s} step={s} current={step} />)}
      </View>
      <Text style={styles.stepLabel}>{step === 1 ? 'Select asset' : 'Enter amount'}</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {step === 1 && (
            <View>
              <Text style={styles.sectionTitle}>Which crypto are you selling?</Text>
              <View style={styles.cryptoGrid}>
                {CRYPTOS.map((crypto) => (
                  <CryptoCard
                    key={crypto.id}
                    crypto={crypto}
                    compact
                    selected={selectedCrypto?.id === crypto.id}
                    onPress={() => handleSelectCrypto(crypto)}
                  />
                ))}
              </View>

              {selectedCrypto && (
                <View style={styles.selectedInfo}>
                  <LinearGradient colors={selectedCrypto.gradient} style={styles.selectedIcon}>
                    <Text style={styles.selectedIconText}>{selectedCrypto.symbol[0]}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedName}>{selectedCrypto.name} selected</Text>
                    <Text style={styles.selectedRate}>
                      1 {selectedCrypto.symbol} = ₦{selectedCrypto.priceNGN.toLocaleString()}
                    </Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                </View>
              )}
            </View>
          )}

          {step === 2 && selectedCrypto && (
            <View>
              <Text style={styles.sectionTitle}>How much are you selling?</Text>

              {/* Toggle */}
              <View style={styles.modeToggle}>
                {['crypto', 'ngn'].map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.modeBtn, inputMode === mode && styles.modeBtnActive]}
                    onPress={() => setInputMode(mode)}
                  >
                    <Text style={[styles.modeBtnText, inputMode === mode && styles.modeBtnTextActive]}>
                      {mode === 'crypto' ? selectedCrypto.symbol : 'NGN'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Amount Input */}
              <LinearGradient colors={['#F5F3FF', '#EDE9FE']} style={styles.amountCard}>
                <View style={styles.amountRow}>
                  <LinearGradient colors={selectedCrypto.gradient} style={styles.amountIcon}>
                    <Text style={styles.amountIconText}>{selectedCrypto.symbol[0]}</Text>
                  </LinearGradient>
                  <TextInput
                    style={styles.amountInput}
                    value={cryptoAmount}
                    onChangeText={setCryptoAmount}
                    placeholder="0.00"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.amountSymbol}>{selectedCrypto.symbol}</Text>
                </View>

                <View style={styles.amountDivider} />

                <View style={styles.ngnRow}>
                  <Text style={styles.ngnLabel}>≈ NGN</Text>
                  <Text style={styles.ngnValue}>
                    ₦{ngnAmount > 0 ? ngnAmount.toLocaleString('en-NG', { maximumFractionDigits: 2 }) : '0.00'}
                  </Text>
                </View>
              </LinearGradient>

              {/* Quick amounts */}
              <View style={styles.quickRow}>
                {['10', '50', '100', '500'].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={styles.quickBtn}
                    onPress={() => setCryptoAmount(v)}
                  >
                    <Text style={styles.quickText}>{v} {selectedCrypto.symbol}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Fee Breakdown */}
              {ngnAmount > 0 && (
                <View style={styles.feeCard}>
                  <Text style={styles.feeTitle}>Breakdown</Text>
                  {[
                    { label: 'Amount', value: `₦${ngnAmount.toLocaleString('en-NG', { maximumFractionDigits: 2 })}` },
                    { label: `Fee (${(FEE_PERCENT * 100).toFixed(1)}%)`, value: `-₦${fee.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`, color: COLORS.error },
                    { label: 'You receive', value: `₦${receive.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`, color: COLORS.success, bold: true },
                  ].map((row) => (
                    <View key={row.label} style={styles.feeRow}>
                      <Text style={styles.feeLabel}>{row.label}</Text>
                      <Text style={[styles.feeValue, row.color && { color: row.color }, row.bold && { fontWeight: '700' }]}>
                        {row.value}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title={step === 1 ? 'Continue' : 'Enter Bank Details →'}
          onPress={handleContinue}
          disabled={step === 1 ? !selectedCrypto : !cryptoAmount || parseFloat(cryptoAmount) <= 0}
        />
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
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 80,
    marginTop: 8,
  },
  stepWrap: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: { fontSize: 13, fontWeight: '700' },
  stepLine: { width: 60, height: 2, marginHorizontal: 4 },
  stepLabel: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 8,
    fontWeight: '500',
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  sectionTitle: { color: '#0F172A', fontSize: 20, fontWeight: '700', marginBottom: 20, marginTop: 8 },
  cryptoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.success + '40',
  },
  selectedIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  selectedIconText: { fontSize: 20, color: COLORS.white, fontWeight: '700' },
  selectedName: { color: '#0F172A', fontSize: 14, fontWeight: '600' },
  selectedRate: { color: '#475569', fontSize: 12, marginTop: 2 },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  modeBtn: { flex: 1, height: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  modeBtnActive: { backgroundColor: COLORS.primary },
  modeBtnText: { color: '#475569', fontSize: 14, fontWeight: '600' },
  modeBtnTextActive: { color: COLORS.white },
  amountCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  amountIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  amountIconText: { fontSize: 20, color: COLORS.white, fontWeight: '700' },
  amountInput: { flex: 1, color: '#0F172A', fontSize: 28, fontWeight: '700' },
  amountSymbol: { color: '#475569', fontSize: 16, fontWeight: '600' },
  amountDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  ngnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ngnLabel: { color: '#475569', fontSize: 14 },
  ngnValue: { color: COLORS.secondary, fontSize: 18, fontWeight: '700' },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  quickText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  feeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  feeTitle: { color: '#0F172A', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  feeLabel: { color: '#475569', fontSize: 13 },
  feeValue: { color: '#0F172A', fontSize: 13 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 32, backgroundColor: '#FFFFFF' + 'EE' },
});
