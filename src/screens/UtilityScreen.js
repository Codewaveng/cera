import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { feedbackMedium, feedbackSelect } from '../utils/feedback';
import AppModal from '../components/AppModal';

const BRAND = '#7C3AED';

// Brand colors + logo URLs for networks and providers
const NETWORK_META = {
  MTN:      { color: '#FFCC00', textColor: '#1A1A1A', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/MTN_logo.png/200px-MTN_logo.png' },
  Airtel:   { color: '#E8001C', textColor: '#fff',    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Airtel_logo-01.png/200px-Airtel_logo-01.png' },
  Glo:      { color: '#009A44', textColor: '#fff',    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/New_GLO_Logo.png/200px-New_GLO_Logo.png' },
  '9mobile':{ color: '#007B5E', textColor: '#fff',    logo: null },
  DSTV:     { color: '#0057A8', textColor: '#fff',    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/DStv_Logo_2012.png/200px-DStv_Logo_2012.png' },
  GOtv:     { color: '#009EE3', textColor: '#fff',    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/GOtv_logo1.png/200px-GOtv_logo1.png' },
  Startimes:{ color: '#E03A00', textColor: '#fff',    logo: null },
  ShowMax:  { color: '#1A1A1A', textColor: '#fff',    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Showmax_logo.png/200px-Showmax_logo.png' },
  EKEDC:    { color: '#003399', textColor: '#fff',    logo: null },
  IKEDC:    { color: '#006633', textColor: '#fff',    logo: null },
  AEDC:     { color: '#CC0000', textColor: '#fff',    logo: null },
  EEDC:     { color: '#FF6600', textColor: '#fff',    logo: null },
  KAEDC:    { color: '#4B0082', textColor: '#fff',    logo: null },
  PHEDC:    { color: '#008080', textColor: '#fff',    logo: null },
};

const CONFIG = {
  Airtime: {
    icon: 'cellphone',
    color: '#EF4444',
    label: 'Airtime',
    subtitle: 'Recharge any Nigerian number instantly',
    fields: [{ id: 'phone', label: 'Phone Number', placeholder: '080XXXXXXXX', keyboard: 'phone-pad' }],
    networks: ['MTN', 'Airtel', 'Glo', '9mobile'],
    amounts: ['100', '200', '500', '1000', '2000', '5000'],
  },
  Data: {
    icon: 'wifi',
    color: '#06B6D4',
    label: 'Mobile Data',
    subtitle: 'Buy data bundles for any network',
    fields: [{ id: 'phone', label: 'Phone Number', placeholder: '080XXXXXXXX', keyboard: 'phone-pad' }],
    networks: ['MTN', 'Airtel', 'Glo', '9mobile'],
    plans: [
      { id: 'p1', name: '500MB', price: '200', duration: '1 day' },
      { id: 'p2', name: '1GB',   price: '350', duration: '30 days' },
      { id: 'p3', name: '2GB',   price: '700', duration: '30 days' },
      { id: 'p4', name: '5GB',   price: '1,500', duration: '30 days' },
      { id: 'p5', name: '10GB',  price: '3,000', duration: '30 days' },
    ],
  },
  TV: {
    icon: 'television-play',
    color: '#8B5CF6',
    label: 'Cable TV',
    subtitle: 'Renew your TV subscription with ease',
    fields: [{ id: 'card', label: 'Smart Card / IUC Number', placeholder: 'Enter your card number', keyboard: 'number-pad' }],
    providers: ['DSTV', 'GOtv', 'Startimes', 'ShowMax'],
    plans: [
      { id: 't1', name: 'DStv Padi',    price: '2,500',  duration: '1 month' },
      { id: 't2', name: 'DStv Yanga',   price: '3,500',  duration: '1 month' },
      { id: 't3', name: 'DStv Confam',  price: '6,200',  duration: '1 month' },
      { id: 't4', name: 'DStv Compact', price: '15,700', duration: '1 month' },
      { id: 't5', name: 'DStv Premium', price: '37,000', duration: '1 month' },
    ],
  },
  Electricity: {
    icon: 'lightning-bolt',
    color: '#F59E0B',
    label: 'Electricity',
    subtitle: 'Buy prepaid units for your meter',
    fields: [{ id: 'meter', label: 'Meter Number', placeholder: 'Enter your meter number', keyboard: 'number-pad' }],
    providers: ['EKEDC', 'IKEDC', 'AEDC', 'EEDC', 'KAEDC', 'PHEDC'],
    amounts: ['1000', '2000', '5000', '10000', '20000'],
  },
};

function NetworkLogo({ name, size = 44, selected }) {
  const [imgErr, setImgErr] = useState(false);
  const meta = NETWORK_META[name] || { color: '#888', textColor: '#fff', logo: null };
  const abbrev = name.length <= 4 ? name : name.slice(0, 2).toUpperCase();

  if (meta.logo && !imgErr) {
    return (
      <View style={{
        width: size, height: size, borderRadius: 12,
        backgroundColor: '#F8F8F8',
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? meta.color : '#E5E7EB',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <Image
          source={{ uri: meta.logo }}
          style={{ width: size * 0.72, height: size * 0.72 }}
          resizeMode="contain"
          onError={() => setImgErr(true)}
        />
      </View>
    );
  }

  return (
    <View style={{
      width: size, height: size, borderRadius: 12,
      backgroundColor: selected ? meta.color : meta.color + '18',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{
        color: selected ? meta.textColor : meta.color,
        fontSize: abbrev.length > 3 ? 9 : 11,
        fontFamily: FONTS.extrabold,
        letterSpacing: 0.5,
      }}>
        {abbrev}
      </Text>
    </View>
  );
}

export default function UtilityScreen({ navigation, route }) {
  const { colors } = useTheme();
  const type = route?.params?.type || 'Airtime';
  const cfg = CONFIG[type] || CONFIG.Airtime;
  const S = useMemo(() => makeStyles(colors), [colors]);

  const [fields, setFields]               = useState({});
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [selectedPlan, setSelectedPlan]   = useState('');
  const [amount, setAmount]               = useState('');
  const [modal, setModal]                 = useState(false);

  const updateField = (id, val) => setFields((prev) => ({ ...prev, [id]: val }));
  const allFilled   = cfg.fields.every((f) => fields[f.id]?.trim());
  const hasNetwork  = !(cfg.networks || cfg.providers) ? true : !!selectedNetwork;
  const hasPlan     = !(cfg.plans || cfg.amounts) ? true : !!(selectedPlan || amount.trim());
  const canPay      = allFilled && hasNetwork && hasPlan;

  const selectedAmountForButton = cfg.plans
    ? cfg.plans.find((p) => p.id === selectedPlan)?.price || ''
    : selectedPlan || amount;

  return (
    <SafeAreaView style={S.root} edges={['top']}>

      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>{cfg.label}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={S.scroll}
        keyboardShouldPersistTaps="handled"
      >

        {/* Service hero */}
        <View style={[S.hero, { borderLeftColor: cfg.color }]}>
          <View style={[S.heroIcon, { backgroundColor: cfg.color + '15' }]}>
            <MaterialCommunityIcons name={cfg.icon} size={24} color={cfg.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.heroLabel}>{cfg.label}</Text>
            <Text style={S.heroSub}>{cfg.subtitle}</Text>
          </View>
        </View>

        {/* Network / Provider selector */}
        {(cfg.networks || cfg.providers) && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>{cfg.networks ? 'SELECT NETWORK' : 'SELECT PROVIDER'}</Text>
            <View style={S.networkGrid}>
              {(cfg.networks || cfg.providers).map((n) => {
                const isSelected = selectedNetwork === n;
                const meta = NETWORK_META[n] || { color: '#888' };
                return (
                  <TouchableOpacity
                    key={n}
                    style={[
                      S.networkCard,
                      isSelected && { borderColor: meta.color, backgroundColor: meta.color + '08' },
                    ]}
                    onPress={() => { feedbackSelect(); setSelectedNetwork(n); }}
                    activeOpacity={0.7}
                  >
                    <NetworkLogo name={n} size={40} selected={isSelected} />
                    <Text style={[S.networkName, isSelected && { color: meta.color, fontFamily: FONTS.bold }]}>
                      {n}
                    </Text>
                    {isSelected && (
                      <View style={[S.networkCheck, { backgroundColor: meta.color }]}>
                        <Ionicons name="checkmark" size={9} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Phone / Meter / Card input fields */}
        {cfg.fields.map((f) => (
          <View key={f.id} style={S.section}>
            <Text style={S.sectionLabel}>{f.label.toUpperCase()}</Text>
            <View style={S.inputWrap}>
              <TextInput
                style={S.input}
                placeholder={f.placeholder}
                placeholderTextColor={colors.textMuted}
                keyboardType={f.keyboard}
                value={fields[f.id] || ''}
                onChangeText={(v) => updateField(f.id, v)}
              />
            </View>
          </View>
        ))}

        {/* Plan selector (Data / TV) */}
        {cfg.plans && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>SELECT PLAN</Text>
            <View style={S.planList}>
              {cfg.plans.map((p) => {
                const isSelected = selectedPlan === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[S.planRow, isSelected && { borderColor: cfg.color, backgroundColor: cfg.color + '08' }]}
                    onPress={() => { feedbackSelect(); setSelectedPlan(p.id); }}
                    activeOpacity={0.7}
                  >
                    <View style={S.planLeft}>
                      <Text style={[S.planName, isSelected && { color: cfg.color }]}>{p.name}</Text>
                      <Text style={S.planDuration}>{p.duration}</Text>
                    </View>
                    <View style={S.planRight}>
                      <Text style={[S.planPrice, isSelected && { color: cfg.color }]}>₦{p.price}</Text>
                      <View style={[
                        S.planRadio,
                        isSelected
                          ? { backgroundColor: cfg.color, borderColor: cfg.color }
                          : { borderColor: colors.border },
                      ]}>
                        {isSelected && <View style={S.planRadioDot} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Quick amount selector (Airtime / Electricity) */}
        {cfg.amounts && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>AMOUNT (₦)</Text>
            <View style={S.amountGrid}>
              {cfg.amounts.map((a) => {
                const isSelected = selectedPlan === a;
                return (
                  <TouchableOpacity
                    key={a}
                    style={[S.amtChip, isSelected && { borderColor: cfg.color, backgroundColor: cfg.color + '12' }]}
                    onPress={() => { feedbackSelect(); setSelectedPlan(a); setAmount(a); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[S.amtText, isSelected && { color: cfg.color, fontFamily: FONTS.bold }]}>
                      ₦{parseInt(a).toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={[S.inputWrap, { marginTop: 12 }]}>
              <TextInput
                style={S.input}
                placeholder="Or enter a custom amount"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                value={amount}
                onChangeText={(v) => { setAmount(v); setSelectedPlan(''); }}
              />
            </View>
          </View>
        )}

        {/* Pay button */}
        <TouchableOpacity
          style={[S.payBtn, { backgroundColor: canPay ? cfg.color : colors.border }]}
          activeOpacity={canPay ? 0.82 : 1}
          disabled={!canPay}
          onPress={() => { feedbackMedium(); setModal(true); }}
        >
          <Text style={S.payBtnText}>
            {selectedAmountForButton ? `Pay ₦${selectedAmountForButton}` : 'Pay Now'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
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
    root:   { flex: 1, backgroundColor: C.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 12,
    },
    backBtn: {
      width: 38, height: 38, borderRadius: 12,
      backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: C.border,
    },
    headerTitle: { color: C.text, fontSize: 17, fontFamily: FONTS.bold },
    scroll: { paddingHorizontal: 20, paddingBottom: 50 },

    hero: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderLeftWidth: 3, paddingLeft: 14, marginBottom: 26, marginTop: 4,
    },
    heroIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    heroLabel: { color: C.text, fontSize: 16, fontFamily: FONTS.bold },
    heroSub:   { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.regular, marginTop: 2, lineHeight: 18 },

    section:      { marginBottom: 22 },
    sectionLabel: { color: C.textMuted, fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1.2, marginBottom: 12 },

    // Network / provider grid
    networkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    networkCard: {
      width: '47%',
      flexDirection: 'row', alignItems: 'center', gap: 10,
      borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
      backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 12,
      position: 'relative',
    },
    networkName:  { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.semibold },
    networkCheck: {
      position: 'absolute', top: 6, right: 6,
      width: 16, height: 16, borderRadius: 8,
      alignItems: 'center', justifyContent: 'center',
    },

    // Input
    inputWrap: {
      borderRadius: 14, borderWidth: 1, borderColor: C.border,
      backgroundColor: C.card, overflow: 'hidden',
    },
    input: {
      paddingHorizontal: 14, paddingVertical: 14,
      color: C.text, fontSize: 15, fontFamily: FONTS.medium,
    },

    // Plan list (Data / TV)
    planList: { gap: 8 },
    planRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
      backgroundColor: C.card, paddingHorizontal: 14, paddingVertical: 13,
    },
    planLeft:    { flex: 1 },
    planName:    { color: C.text, fontSize: 14, fontFamily: FONTS.semibold },
    planDuration:{ color: C.textMuted, fontSize: 11, fontFamily: FONTS.regular, marginTop: 2 },
    planRight:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
    planPrice:   { color: C.text, fontSize: 14, fontFamily: FONTS.bold },
    planRadio: {
      width: 20, height: 20, borderRadius: 10, borderWidth: 2,
      alignItems: 'center', justifyContent: 'center',
    },
    planRadioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },

    // Amount chips
    amountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    amtChip: {
      borderRadius: 12, borderWidth: 1.5, borderColor: C.border,
      backgroundColor: C.card, paddingHorizontal: 16, paddingVertical: 11,
    },
    amtText: { color: C.text, fontSize: 13, fontFamily: FONTS.semibold },

    // Pay button
    payBtn: {
      height: 56, borderRadius: 16, marginTop: 8,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    payBtnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },
  });
}
