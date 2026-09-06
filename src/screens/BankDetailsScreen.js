import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { NIGERIAN_BANKS } from '../constants/data';
import CustomInput from '../components/CustomInput';
import GradientButton from '../components/GradientButton';

export default function BankDetailsScreen({ navigation, route }) {
  const { crypto, cryptoAmount, ngnAmount, fee } = route.params;
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (accountNumber.length === 10 && bank) {
      setVerifying(true);
      setAccountName('');
      const timer = setTimeout(() => {
        setAccountName('ABDUL FATAAH ABDULLAHI');
        setVerifying(false);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setAccountName('');
    }
  }, [accountNumber, bank]);

  const canContinue = bank && accountNumber.length === 10 && accountName;

  const handleContinue = () => {
    navigation.navigate('Confirm', {
      crypto,
      cryptoAmount,
      ngnAmount,
      fee,
      bank,
      accountNumber,
      accountName,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bank Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.title}>Where should we send your Naira?</Text>
          <Text style={styles.subtitle}>Enter your Nigerian bank account details below</Text>

          {/* Transaction Summary */}
          <LinearGradient colors={['#F5F3FF', '#EDE9FE']} style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Selling</Text>
              <Text style={styles.summaryValue}>
                {cryptoAmount} {crypto.symbol}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>You receive</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                ₦{ngnAmount.toLocaleString('en-NG', { maximumFractionDigits: 2 })}
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.form}>
            {/* Bank Selector */}
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Bank</Text>
              <TouchableOpacity
                style={[styles.bankSelector, bank && styles.bankSelectorFilled]}
                onPress={() => setBankModalVisible(true)}
              >
                <Text style={bank ? styles.bankText : styles.bankPlaceholder}>
                  {bank || 'Select your bank'}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={18}
                  color={bank ? COLORS.text : COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>

            <CustomInput
              label="Account Number"
              value={accountNumber}
              onChangeText={(v) => setAccountNumber(v.replace(/\D/g, '').slice(0, 10))}
              placeholder="Enter 10-digit account number"
              keyboardType="number-pad"
            />

            {/* Account Name */}
            {verifying && (
              <View style={styles.verifyingWrap}>
                <Text style={styles.verifyingText}>Verifying account...</Text>
              </View>
            )}
            {accountName && !verifying && (
              <View style={styles.accountNameWrap}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <View>
                  <Text style={styles.accountNameLabel}>Account Name</Text>
                  <Text style={styles.accountName}>{accountName}</Text>
                </View>
              </View>
            )}

            <View style={styles.saveRow}>
              <View style={[styles.saveToggle, { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary }]}>
                <Ionicons name="bookmark-outline" size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.saveText}>Save bank for future use</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title="Continue to Confirm"
          onPress={handleContinue}
          disabled={!canContinue}
        />
      </View>

      {/* Bank Modal */}
      <Modal visible={bankModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Bank</Text>
            <FlatList
              data={NIGERIAN_BANKS}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.bankItem, item === bank && styles.bankItemActive]}
                  onPress={() => {
                    setBank(item);
                    setBankModalVisible(false);
                  }}
                >
                  <View style={[styles.bankInitial, { backgroundColor: item === bank ? COLORS.primary : COLORS.card }]}>
                    <Text style={styles.bankInitialText}>{item[0]}</Text>
                  </View>
                  <Text style={[styles.bankItemText, item === bank && { color: COLORS.primary }]}>
                    {item}
                  </Text>
                  {item === bank && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  title: { color: '#0F172A', fontSize: 22, fontWeight: '800', marginBottom: 8, marginTop: 8 },
  subtitle: { color: '#475569', fontSize: 14, marginBottom: 20 },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: '#475569', fontSize: 13 },
  summaryValue: { color: '#0F172A', fontSize: 14, fontWeight: '700' },
  form: { gap: 4 },
  inputWrap: { marginBottom: 16 },
  label: { color: '#475569', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  bankSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    paddingHorizontal: 16,
    height: 56,
  },
  bankSelectorFilled: { borderColor: COLORS.primary },
  bankText: { color: '#0F172A', fontSize: 15, fontWeight: '500' },
  bankPlaceholder: { color: '#94A3B8', fontSize: 15 },
  verifyingWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: -8,
    marginBottom: 16,
  },
  verifyingText: { color: '#475569', fontSize: 13 },
  accountNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '15',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginTop: -8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  accountNameLabel: { color: '#475569', fontSize: 11 },
  accountName: { color: '#0F172A', fontSize: 14, fontWeight: '700' },
  saveRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  saveToggle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  saveText: { color: '#475569', fontSize: 13 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 32, backgroundColor: '#FFFFFF' + 'EE' },
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: { color: '#0F172A', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bankItemActive: { backgroundColor: COLORS.primary + '10', borderRadius: 10, paddingHorizontal: 8, marginHorizontal: -8 },
  bankInitial: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankInitialText: { color: '#0F172A', fontSize: 14, fontWeight: '700' },
  bankItemText: { flex: 1, color: '#0F172A', fontSize: 15 },
});
