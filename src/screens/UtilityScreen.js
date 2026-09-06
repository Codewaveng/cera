import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { feedbackMedium, feedbackSelect } from '../utils/feedback';
import AppModal from '../components/AppModal';

const CONFIG = {
  Airtime: {
    icon: 'phone-portrait-outline',
    color: '#EF4444',
    label: 'Airtime',
    subtitle: 'Recharge any Nigerian number',
    fields: [{ id: 'phone', label: 'Phone Number', placeholder: '080XXXXXXXX', keyboard: 'phone-pad' }],
    networks: ['MTN', 'Airtel', 'Glo', '9mobile'],
    amounts: ['100', '200', '500', '1000', '2000', '5000'],
  },
  Data: {
    icon: 'wifi-outline',
    color: '#06B6D4',
    label: 'Data',
    subtitle: 'Buy internet data bundles',
    fields: [{ id: 'phone', label: 'Phone Number', placeholder: '080XXXXXXXX', keyboard: 'phone-pad' }],
    networks: ['MTN', 'Airtel', 'Glo', '9mobile'],
    plans: ['500MB — ₦200', '1GB — ₦350', '2GB — ₦700', '5GB — ₦1,500', '10GB — ₦3,000'],
  },
  TV: {
    icon: 'tv-outline',
    color: '#8B5CF6',
    label: 'TV Subscription',
    subtitle: 'Pay for cable TV packages',
    fields: [{ id: 'card', label: 'Smart Card / IUC Number', placeholder: 'Enter card number', keyboard: 'number-pad' }],
    providers: ['DSTV', 'GOtv', 'Startimes', 'ShowMax'],
    plans: ['DStv Padi — ₦2,500', 'DStv Yanga — ₦3,500', 'DStv Confam — ₦6,200', 'DStv Compact — ₦15,700', 'DStv Premium — ₦37,000'],
  },
  Electricity: {
    icon: 'flash-outline',
    color: '#F59E0B',
    label: 'Electricity',
    subtitle: 'Buy electricity units',
    fields: [{ id: 'meter', label: 'Meter Number', placeholder: 'Enter meter number', keyboard: 'number-pad' }],
    providers: ['EKEDC', 'IKEDC', 'AEDC', 'EEDC', 'KAEDC', 'PHEDC'],
    amounts: ['1000', '2000', '5000', '10000', '20000'],
  },
};

export default function UtilityScreen({ navigation, route }) {
  const { colors } = useTheme();
  const type = route?.params?.type || 'Airtime';
  const cfg = CONFIG[type] || CONFIG.Airtime;
  const S = useMemo(() => makeStyles(colors), [colors]);

  const [fields, setFields] = useState({});
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [amount, setAmount] = useState('');
  const [modal, setModal] = useState(false);

  const updateField = (id, val) => setFields((prev) => ({ ...prev, [id]: val }));
  const allFilled = cfg.fields.every((f) => fields[f.id]);
  const hasNetwork = !cfg.networks && !cfg.providers ? true : !!selectedNetwork;
  const hasPlan = !(cfg.plans || cfg.amounts) ? true : !!(selectedPlan || amount);
  const canPay = allFilled && hasNetwork && hasPlan;

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={S.title}>{cfg.label}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled">

        <View style={S.banner}>
          <View style={[S.bannerIcon, { backgroundColor: cfg.color + '20' }]}>
            <Ionicons name={cfg.icon} size={26} color={cfg.color} />
          </View>
          <View>
            <Text style={S.bannerTitle}>{cfg.label}</Text>
            <Text style={S.bannerSub}>{cfg.subtitle}</Text>
          </View>
        </View>

        {(cfg.networks || cfg.providers) && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>{cfg.networks ? 'NETWORK' : 'PROVIDER'}</Text>
            <View style={S.chipGrid}>
              {(cfg.networks || cfg.providers).map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[S.chip, selectedNetwork === n && { borderColor: cfg.color, backgroundColor: cfg.color + '18' }]}
                  onPress={() => { feedbackSelect(); setSelectedNetwork(n); }}
                  activeOpacity={0.7}
                >
                  <Text style={[S.chipText, selectedNetwork === n && { color: cfg.color }]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {cfg.fields.map((f) => (
          <View key={f.id} style={S.section}>
            <Text style={S.sectionLabel}>{f.label.toUpperCase()}</Text>
            <TextInput
              style={S.input}
              placeholder={f.placeholder}
              placeholderTextColor={colors.textMuted}
              keyboardType={f.keyboard}
              value={fields[f.id] || ''}
              onChangeText={(v) => updateField(f.id, v)}
            />
          </View>
        ))}

        {cfg.plans && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>SELECT PLAN</Text>
            <View style={S.planGrid}>
              {cfg.plans.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[S.planCard, selectedPlan === p && { borderColor: cfg.color, backgroundColor: cfg.color + '14' }]}
                  onPress={() => setSelectedPlan(p)}
                  activeOpacity={0.7}
                >
                  {selectedPlan === p && (
                    <View style={[S.planCheck, { backgroundColor: cfg.color }]}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                  <Text style={[S.planText, selectedPlan === p && { color: cfg.color }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {cfg.amounts && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>AMOUNT (₦)</Text>
            <View style={S.amountGrid}>
              {cfg.amounts.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[S.amtChip, selectedPlan === a && { borderColor: cfg.color, backgroundColor: cfg.color + '18' }]}
                  onPress={() => { setSelectedPlan(a); setAmount(a); }}
                  activeOpacity={0.7}
                >
                  <Text style={[S.amtText, selectedPlan === a && { color: cfg.color }]}>
                    ₦{parseInt(a).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[S.input, { marginTop: 12 }]}
              placeholder="Or enter custom amount"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={amount}
              onChangeText={(v) => { setAmount(v); setSelectedPlan(''); }}
            />
          </View>
        )}

        <TouchableOpacity
          activeOpacity={canPay ? 0.8 : 1}
          style={[S.payBtn, !canPay && { opacity: 0.4 }]}
          disabled={!canPay}
          onPress={() => { feedbackMedium(); setModal(true); }}
        >
          <LinearGradient
            colors={[cfg.color, cfg.color + 'CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={S.payBtnInner}
          >
            <Text style={S.payBtnText}>Pay Now</Text>
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>

      <AppModal
        visible={modal}
        type="comingsoon"
        title="Coming Soon!"
        message={`${cfg.label} payments are almost ready. We'll notify you the moment it goes live.`}
        primaryLabel="Can't wait!"
        onClose={() => setModal(false)}
        onPrimary={() => setModal(false)}
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
    scroll: { paddingHorizontal: 20, paddingBottom: 60 },

    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: C.card,
      borderRadius: 18,
      padding: 16,
      marginBottom: 22,
      borderWidth: 1,
      borderColor: C.border,
    },
    bannerIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    bannerTitle: { color: C.text, fontSize: 16, fontFamily: FONTS.bold },
    bannerSub: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.regular, marginTop: 3 },

    section: { marginBottom: 20 },
    sectionLabel: { color: C.textMuted, fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1, marginBottom: 10 },

    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: C.border,
      backgroundColor: C.card,
      paddingHorizontal: 18,
      paddingVertical: 10,
    },
    chipText: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.semibold },

    input: {
      backgroundColor: C.inputBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: 14,
      paddingVertical: 13,
      color: C.text,
      fontSize: 15,
      fontFamily: FONTS.medium,
    },

    planGrid: { gap: 8 },
    planCard: {
      borderRadius: 13,
      borderWidth: 1.5,
      borderColor: C.border,
      backgroundColor: C.card,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    planCheck: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    planText: { color: C.text, fontSize: 14, fontFamily: FONTS.medium },

    amountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    amtChip: {
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: C.border,
      backgroundColor: C.card,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    amtText: { color: C.text, fontSize: 13, fontFamily: FONTS.semibold },

    payBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
    payBtnInner: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    payBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: FONTS.bold },
  });
}
