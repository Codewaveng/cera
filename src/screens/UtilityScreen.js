import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  Image, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { feedbackMedium, feedbackSelect } from '../utils/feedback';
import { buyAirtime, buyData, buyTV, buyElectricity } from '../services/api';

const BRAND = '#7C3AED';
const _fav  = d => `https://www.google.com/s2/favicons?domain=${d}&sz=128`;

const NETWORK_META = {
  MTN:       { color: '#FFCC00', textColor: '#1A1A1A', logo: _fav('mtn.com') },
  Airtel:    { color: '#E8001C', textColor: '#fff',    logo: _fav('airtel.com.ng') },
  Glo:       { color: '#009A44', textColor: '#fff',    logo: _fav('gloworld.com') },
  '9mobile': { color: '#007B5E', textColor: '#fff',    logo: _fav('9mobile.com.ng') },
  DSTV:      { color: '#0057A8', textColor: '#fff',    logo: _fav('dstv.com') },
  GOtv:      { color: '#009EE3', textColor: '#fff',    logo: _fav('gotvafrica.com') },
  Startimes: { color: '#E03A00', textColor: '#fff',    logo: _fav('startimes.com.ng') },
  ShowMax:   { color: '#1A1A1A', textColor: '#fff',    logo: _fav('showmax.com') },
  EKEDC:     { color: '#003399', textColor: '#fff',    logo: _fav('ekedc.com') },
  IKEDC:     { color: '#006633', textColor: '#fff',    logo: _fav('ikedc.com') },
  AEDC:      { color: '#CC0000', textColor: '#fff',    logo: _fav('aedc-power.com') },
  PHEDC:     { color: '#008080', textColor: '#fff',    logo: _fav('phed.com.ng') },
  EEDC:      { color: '#FF6600', textColor: '#fff',    logo: _fav('enugudisco.com') },
  KAEDC:     { color: '#4B0082', textColor: '#fff',    logo: _fav('kaedco.com.ng') },
  JEDC:      { color: '#8B4513', textColor: '#fff',    logo: _fav('jedplc.com') },
  BEDC:      { color: '#006400', textColor: '#fff',    logo: _fav('bedcpower.com') },
  YEDC:      { color: '#800000', textColor: '#fff',    logo: _fav('yedc.com.ng') },
};

// ClubKonnect data plan codes — verify exact codes in CK dashboard after IP whitelist
const DATA_PLANS = {
  MTN: [
    { code: 'mtn-sme-100mb', name: '100MB',  price: 75,   duration: '1 Day' },
    { code: 'mtn-sme-500mb', name: '500MB',  price: 165,  duration: '1 Day' },
    { code: 'mtn-sme-1gb',   name: '1GB',    price: 330,  duration: '30 Days' },
    { code: 'mtn-sme-2gb',   name: '2GB',    price: 660,  duration: '30 Days' },
    { code: 'mtn-sme-3gb',   name: '3GB',    price: 990,  duration: '30 Days' },
    { code: 'mtn-sme-5gb',   name: '5GB',    price: 1650, duration: '30 Days' },
    { code: 'mtn-sme-10gb',  name: '10GB',   price: 3300, duration: '30 Days' },
    { code: 'mtn-sme-20gb',  name: '20GB',   price: 6600, duration: '30 Days' },
  ],
  Airtel: [
    { code: 'airtl-100mb',  name: '100MB',  price: 100,  duration: '1 Day' },
    { code: 'airtl-500mb',  name: '500MB',  price: 300,  duration: '14 Days' },
    { code: 'airtl-1gb',    name: '1GB',    price: 500,  duration: '30 Days' },
    { code: 'airtl-2gb',    name: '2GB',    price: 1000, duration: '30 Days' },
    { code: 'airtl-5gb',    name: '5GB',    price: 2000, duration: '30 Days' },
    { code: 'airtl-10gb',   name: '10GB',   price: 3500, duration: '30 Days' },
  ],
  Glo: [
    { code: 'glo-100mb',  name: '100MB',  price: 100,  duration: '1 Day' },
    { code: 'glo-500mb',  name: '500MB',  price: 250,  duration: '14 Days' },
    { code: 'glo-1gb',    name: '1GB',    price: 500,  duration: '30 Days' },
    { code: 'glo-2gb',    name: '2GB',    price: 1000, duration: '30 Days' },
    { code: 'glo-5gb',    name: '5GB',    price: 2500, duration: '30 Days' },
    { code: 'glo-10gb',   name: '10GB',   price: 5000, duration: '30 Days' },
  ],
  '9mobile': [
    { code: '9mob-100mb',  name: '100MB',  price: 100,  duration: '1 Day' },
    { code: '9mob-500mb',  name: '500MB',  price: 250,  duration: '30 Days' },
    { code: '9mob-1gb',    name: '1GB',    price: 500,  duration: '30 Days' },
    { code: '9mob-2gb',    name: '2GB',    price: 1000, duration: '30 Days' },
    { code: '9mob-5gb',    name: '5GB',    price: 3500, duration: '30 Days' },
  ],
};

const TV_PLANS = {
  DSTV: [
    { code: 'dstv-padi',         name: 'DStv Padi',     price: 2500,  duration: '1 Month' },
    { code: 'dstv-yanga',        name: 'DStv Yanga',    price: 3500,  duration: '1 Month' },
    { code: 'dstv-confam',       name: 'DStv Confam',   price: 6200,  duration: '1 Month' },
    { code: 'dstv-compact',      name: 'DStv Compact',  price: 15700, duration: '1 Month' },
    { code: 'dstv-compact-plus', name: 'DStv Compact+', price: 25000, duration: '1 Month' },
    { code: 'dstv-premium',      name: 'DStv Premium',  price: 37000, duration: '1 Month' },
  ],
  GOtv: [
    { code: 'gotv-smallie',   name: 'GOtv Smallie', price: 1200, duration: '1 Month' },
    { code: 'gotv-jinja',     name: 'GOtv Jinja',   price: 1900, duration: '1 Month' },
    { code: 'gotv-jolli',     name: 'GOtv Jolli',   price: 3300, duration: '1 Month' },
    { code: 'gotv-max',       name: 'GOtv Max',     price: 4850, duration: '1 Month' },
    { code: 'gotv-supa',      name: 'GOtv Supa',    price: 6200, duration: '1 Month' },
    { code: 'gotv-supa-plus', name: 'GOtv Supa+',   price: 9600, duration: '1 Month' },
  ],
  Startimes: [
    { code: 'startimes-nova',    name: 'Nova',    price: 1700, duration: '1 Month' },
    { code: 'startimes-basic',   name: 'Basic',   price: 2200, duration: '1 Month' },
    { code: 'startimes-smart',   name: 'Smart',   price: 2800, duration: '1 Month' },
    { code: 'startimes-classic', name: 'Classic', price: 4200, duration: '1 Month' },
    { code: 'startimes-super',   name: 'Super',   price: 6200, duration: '1 Month' },
  ],
  ShowMax: [
    { code: 'showmax-mobile',    name: 'Mobile',        price: 2900,  duration: '1 Month' },
    { code: 'showmax-standard',  name: 'Standard',      price: 4200,  duration: '1 Month' },
    { code: 'showmax-mobile-yr', name: 'Mobile Annual', price: 23900, duration: '12 Months' },
  ],
};

const ELEC_DISCOS   = ['EKEDC', 'IKEDC', 'AEDC', 'PHEDC', 'EEDC', 'KAEDC', 'JEDC', 'BEDC', 'YEDC'];
const AIRTIME_CHIPS = ['100', '200', '500', '1000', '2000', '5000'];
const ELEC_CHIPS    = ['500', '1000', '2000', '5000', '10000', '20000'];

const SERVICE_CFG = {
  Airtime:     { icon: 'cellphone',       color: '#EF4444', label: 'Airtime',     subtitle: 'Recharge any Nigerian number instantly' },
  Data:        { icon: 'wifi',            color: '#06B6D4', label: 'Mobile Data', subtitle: 'Buy data bundles for any network' },
  TV:          { icon: 'television-play', color: '#8B5CF6', label: 'Cable TV',    subtitle: 'Renew your TV subscription with ease' },
  Electricity: { icon: 'lightning-bolt',  color: '#F59E0B', label: 'Electricity', subtitle: 'Buy prepaid units for your meter' },
};

function NetworkLogo({ name, size = 44, selected }) {
  const [err, setErr] = useState(false);
  const meta   = NETWORK_META[name] || { color: '#888', textColor: '#fff', logo: null };
  const abbrev = name.length <= 4 ? name : name.slice(0, 2).toUpperCase();

  if (meta.logo && !err) {
    return (
      <View style={{
        width: size, height: size, borderRadius: size * 0.27,
        backgroundColor: '#F8F8F8',
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? meta.color : '#E5E7EB',
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        <Image
          source={{ uri: meta.logo }}
          style={{ width: size * 0.7, height: size * 0.7 }}
          resizeMode="contain"
          onError={() => setErr(true)}
        />
      </View>
    );
  }

  return (
    <View style={{
      width: size, height: size, borderRadius: size * 0.27,
      backgroundColor: selected ? meta.color : meta.color + '20',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{
        color: selected ? meta.textColor : meta.color,
        fontSize: abbrev.length > 3 ? 9 : 11,
        fontFamily: FONTS.extrabold, letterSpacing: 0.5,
      }}>
        {abbrev}
      </Text>
    </View>
  );
}

export default function UtilityScreen({ navigation, route }) {
  const { colors } = useTheme();
  const type = route?.params?.type || 'Airtime';
  const cfg  = SERVICE_CFG[type] || SERVICE_CFG.Airtime;
  const S    = useMemo(() => makeStyles(colors), [colors]);

  const isAirtime = type === 'Airtime';
  const isData    = type === 'Data';
  const isTV      = type === 'TV';
  const isElec    = type === 'Electricity';

  const [phoneNumber,  setPhoneNumber]  = useState('');
  const [smartCard,    setSmartCard]    = useState('');
  const [meterNumber,  setMeterNumber]  = useState('');
  const [selectedNet,  setSelectedNet]  = useState('');
  const [selectedCode, setSelectedCode] = useState('');
  const [amountChip,   setAmountChip]   = useState('');
  const [customAmt,    setCustomAmt]    = useState('');
  const [meterType,    setMeterType]    = useState('Prepaid');
  const [loading,      setLoading]      = useState(false);
  const [confirm,      setConfirm]      = useState(false);
  const [result,       setResult]       = useState(null);

  const activePlans = useMemo(() => {
    if (isData) return DATA_PLANS[selectedNet] || [];
    if (isTV)   return TV_PLANS[selectedNet]   || [];
    return [];
  }, [isData, isTV, selectedNet]);

  const selectedPlan = activePlans.find(p => p.code === selectedCode) || null;

  const payAmount = useMemo(() => {
    if (isData || isTV) return selectedPlan ? selectedPlan.price : 0;
    return parseFloat(amountChip || customAmt || '0');
  }, [isData, isTV, selectedPlan, amountChip, customAmt]);

  const canPay = useMemo(() => {
    if (!selectedNet) return false;
    const phone = phoneNumber.trim();
    if (isAirtime) return phone.length >= 10 && payAmount >= 50;
    if (isData)    return phone.length >= 10 && !!selectedCode;
    if (isTV)      return smartCard.trim().length >= 6 && phone.length >= 10 && !!selectedCode;
    if (isElec)    return meterNumber.trim().length >= 5 && phone.length >= 10 && payAmount >= 500;
    return false;
  }, [selectedNet, phoneNumber, smartCard, meterNumber, selectedCode, payAmount, isAirtime, isData, isTV, isElec]);

  function selectNetwork(n) {
    feedbackSelect();
    setSelectedNet(n);
    setSelectedCode('');
  }

  const networkList = isData || isAirtime
    ? ['MTN', 'Airtel', 'Glo', '9mobile']
    : isTV
      ? ['DSTV', 'GOtv', 'Startimes', 'ShowMax']
      : ELEC_DISCOS;

  const amountChips = isAirtime ? AIRTIME_CHIPS : ELEC_CHIPS;
  const payLabel    = payAmount > 0 ? `Pay ₦${payAmount.toLocaleString('en-NG')}` : 'Pay Now';

  const confirmRows = useMemo(() => {
    const rows = [];
    if (selectedNet) rows.push({ label: isData || isAirtime ? 'Network' : isTV ? 'Provider' : 'DISCO', value: selectedNet });
    if (isTV)      rows.push({ label: 'Smart Card', value: smartCard });
    if (isElec)    rows.push({ label: 'Meter No.', value: meterNumber }, { label: 'Type', value: meterType });
    rows.push({ label: 'Phone', value: phoneNumber });
    if (selectedPlan) rows.push({ label: isTV ? 'Package' : 'Plan', value: selectedPlan.name });
    rows.push({ label: 'Amount', value: `₦${payAmount.toLocaleString('en-NG')}` });
    return rows;
  }, [selectedNet, phoneNumber, smartCard, meterNumber, meterType, selectedPlan, payAmount, isAirtime, isData, isTV, isElec]);

  async function handlePay() {
    if (!canPay || loading) return;
    setConfirm(false);
    setLoading(true);
    try {
      let res;
      if (isAirtime) {
        res = await buyAirtime({ network: selectedNet, phone: phoneNumber, amount: payAmount.toString() });
      } else if (isData) {
        res = await buyData({
          network: selectedNet, phone: phoneNumber,
          planCode: selectedPlan.code, planName: selectedPlan.name,
          amount: selectedPlan.price.toString(),
        });
      } else if (isTV) {
        res = await buyTV({
          provider: selectedNet, packageCode: selectedPlan.code,
          packageName: selectedPlan.name, smartCard, phone: phoneNumber,
          amount: selectedPlan.price.toString(),
        });
      } else if (isElec) {
        res = await buyElectricity({
          disco: selectedNet, meterNo: meterNumber,
          meterType, phone: phoneNumber, amount: payAmount.toString(),
        });
      }
      setResult({ success: true, message: res.data.message, token: res.data.token, orderId: res.data.orderId });
    } catch (err) {
      const msg = err?.response?.data?.error || 'Payment failed. Please try again.';
      setResult({ success: false, message: msg });
    } finally {
      setLoading(false);
    }
  }

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
          <View style={[S.heroIcon, { backgroundColor: cfg.color + '18' }]}>
            <MaterialCommunityIcons name={cfg.icon} size={24} color={cfg.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.heroLabel}>{cfg.label}</Text>
            <Text style={S.heroSub}>{cfg.subtitle}</Text>
          </View>
        </View>

        {/* Network / Provider / DISCO selector */}
        <View style={S.section}>
          <Text style={S.sectionLabel}>
            {isData || isAirtime ? 'SELECT NETWORK' : isTV ? 'SELECT PROVIDER' : 'SELECT ELECTRICITY COMPANY'}
          </Text>
          <View style={[S.networkGrid, isElec && S.discoGrid]}>
            {networkList.map(n => {
              const sel  = selectedNet === n;
              const meta = NETWORK_META[n] || { color: '#888' };
              return (
                <TouchableOpacity
                  key={n}
                  style={[
                    S.networkCard,
                    isElec && S.discoCard,
                    sel && { borderColor: meta.color, backgroundColor: meta.color + '0A' },
                  ]}
                  onPress={() => selectNetwork(n)}
                  activeOpacity={0.7}
                >
                  <NetworkLogo name={n} size={isElec ? 34 : 40} selected={sel} />
                  <Text style={[S.networkName, sel && { color: meta.color, fontFamily: FONTS.bold }]} numberOfLines={1}>
                    {n}
                  </Text>
                  {sel && (
                    <View style={[S.netCheck, { backgroundColor: meta.color }]}>
                      <Ionicons name="checkmark" size={9} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Smart Card (TV only — shown before phone) */}
        {isTV && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>SMART CARD / IUC NUMBER</Text>
            <View style={S.inputWrap}>
              <TextInput
                style={S.input}
                placeholder="Enter your smart card number"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                value={smartCard}
                onChangeText={setSmartCard}
                maxLength={12}
              />
            </View>
          </View>
        )}

        {/* Meter number (Electricity only — shown before phone) */}
        {isElec && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>METER NUMBER</Text>
            <View style={S.inputWrap}>
              <TextInput
                style={S.input}
                placeholder="Enter your meter number"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                value={meterNumber}
                onChangeText={setMeterNumber}
                maxLength={13}
              />
            </View>
          </View>
        )}

        {/* Phone number (all services) */}
        <View style={S.section}>
          <Text style={S.sectionLabel}>
            {isTV ? 'PHONE NUMBER (FOR NOTIFICATION)' : 'PHONE NUMBER'}
          </Text>
          <View style={S.inputWrap}>
            <TextInput
              style={S.input}
              placeholder="080XXXXXXXX"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={14}
            />
          </View>
        </View>

        {/* Meter type toggle (Electricity) */}
        {isElec && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>METER TYPE</Text>
            <View style={S.meterTypeRow}>
              {['Prepaid', 'Postpaid'].map(mt => (
                <TouchableOpacity
                  key={mt}
                  style={[
                    S.meterTypeBtn,
                    meterType === mt && { backgroundColor: cfg.color, borderColor: cfg.color },
                  ]}
                  onPress={() => { feedbackSelect(); setMeterType(mt); }}
                  activeOpacity={0.75}
                >
                  <Text style={[S.meterTypeTxt, meterType === mt && { color: '#fff', fontFamily: FONTS.bold }]}>
                    {mt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Plan list (Data / TV) */}
        {(isData || isTV) && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>
              {selectedNet
                ? `${selectedNet.toUpperCase()} PLANS`
                : isData ? 'SELECT NETWORK FIRST' : 'SELECT PROVIDER FIRST'}
            </Text>
            {activePlans.length > 0 ? (
              <View style={S.planList}>
                {activePlans.map(p => {
                  const sel = selectedCode === p.code;
                  return (
                    <TouchableOpacity
                      key={p.code}
                      style={[S.planRow, sel && { borderColor: cfg.color, backgroundColor: cfg.color + '08' }]}
                      onPress={() => { feedbackSelect(); setSelectedCode(p.code); }}
                      activeOpacity={0.7}
                    >
                      <View style={S.planLeft}>
                        <Text style={[S.planName, sel && { color: cfg.color }]}>{p.name}</Text>
                        <Text style={S.planDuration}>{p.duration}</Text>
                      </View>
                      <View style={S.planRight}>
                        <Text style={[S.planPrice, sel && { color: cfg.color }]}>
                          ₦{p.price.toLocaleString('en-NG')}
                        </Text>
                        <View style={[
                          S.planRadio,
                          sel
                            ? { backgroundColor: cfg.color, borderColor: cfg.color }
                            : { borderColor: colors.border },
                        ]}>
                          {sel && <View style={S.planDot} />}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : selectedNet ? (
              <Text style={[S.emptyPlans, { color: colors.textMuted }]}>No plans available</Text>
            ) : null}
          </View>
        )}

        {/* Amount chips (Airtime / Electricity) */}
        {(isAirtime || isElec) && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>AMOUNT (₦)</Text>
            <View style={S.chipRow}>
              {amountChips.map(a => {
                const sel = amountChip === a;
                return (
                  <TouchableOpacity
                    key={a}
                    style={[S.chip, sel && { borderColor: cfg.color, backgroundColor: cfg.color + '12' }]}
                    onPress={() => { feedbackSelect(); setAmountChip(a); setCustomAmt(''); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[S.chipTxt, sel && { color: cfg.color, fontFamily: FONTS.bold }]}>
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
                value={customAmt}
                onChangeText={v => { setCustomAmt(v); setAmountChip(''); }}
              />
            </View>
          </View>
        )}

        {/* Pay button */}
        <TouchableOpacity
          style={[S.payBtn, { backgroundColor: canPay ? cfg.color : colors.border }]}
          activeOpacity={canPay ? 0.82 : 1}
          disabled={!canPay || loading}
          onPress={() => { feedbackMedium(); setConfirm(true); }}
        >
          <Text style={S.payBtnTxt}>{payLabel}</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Loading overlay */}
      {loading && (
        <View style={S.loadingOverlay}>
          <View style={[S.loadingCard, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="large" color={cfg.color} />
            <Text style={[S.loadingTxt, { color: colors.text }]}>Processing payment…</Text>
          </View>
        </View>
      )}

      {/* Confirmation bottom sheet */}
      <Modal visible={confirm} transparent animationType="slide" onRequestClose={() => setConfirm(false)}>
        <TouchableOpacity style={S.overlay} activeOpacity={1} onPress={() => setConfirm(false)}>
          <View style={[S.sheet, { backgroundColor: colors.card }]}>
            <View style={S.sheetHandle} />
            <Text style={[S.sheetTitle, { color: colors.text }]}>Confirm Payment</Text>

            {confirmRows.map(({ label, value }) => (
              <View key={label} style={[S.confirmRow, { borderBottomColor: colors.border }]}>
                <Text style={[S.confirmLabel, { color: colors.textMuted }]}>{label}</Text>
                <Text style={[S.confirmValue, { color: colors.text }]}>{value}</Text>
              </View>
            ))}

            <TouchableOpacity
              style={[S.confirmBtn, { backgroundColor: cfg.color }]}
              onPress={handlePay}
              activeOpacity={0.82}
            >
              <Text style={S.confirmBtnTxt}>Confirm &amp; Pay</Text>
            </TouchableOpacity>

            <TouchableOpacity style={S.cancelBtn} onPress={() => setConfirm(false)} activeOpacity={0.7}>
              <Text style={[S.cancelTxt, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Result modal */}
      <Modal visible={!!result} transparent animationType="fade" onRequestClose={() => setResult(null)}>
        <View style={S.resultOverlay}>
          <View style={[S.resultCard, { backgroundColor: colors.card }]}>
            {result?.success ? (
              <>
                <View style={[S.resultIcon, { backgroundColor: '#22C55E20' }]}>
                  <MaterialCommunityIcons name="check-circle" size={52} color="#22C55E" />
                </View>
                <Text style={[S.resultTitle, { color: colors.text }]}>Payment Successful!</Text>
                <Text style={[S.resultMsg, { color: colors.textSecondary }]}>{result.message}</Text>
                {result.token ? (
                  <View style={[S.tokenBox, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                    <Text style={[S.tokenLabel, { color: colors.textMuted }]}>Electricity Token</Text>
                    <Text style={[S.tokenValue, { color: cfg.color }]}>{result.token}</Text>
                  </View>
                ) : null}
                <TouchableOpacity
                  style={[S.resultBtn, { backgroundColor: cfg.color }]}
                  onPress={() => { setResult(null); navigation.goBack(); }}
                  activeOpacity={0.82}
                >
                  <Text style={S.resultBtnTxt}>Done</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={[S.resultIcon, { backgroundColor: '#EF444420' }]}>
                  <MaterialCommunityIcons name="close-circle" size={52} color="#EF4444" />
                </View>
                <Text style={[S.resultTitle, { color: colors.text }]}>Payment Failed</Text>
                <Text style={[S.resultMsg, { color: colors.textSecondary }]}>{result?.message}</Text>
                <TouchableOpacity
                  style={[S.resultBtn, { backgroundColor: cfg.color }]}
                  onPress={() => setResult(null)}
                  activeOpacity={0.82}
                >
                  <Text style={S.resultBtnTxt}>Try Again</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

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
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },

    hero: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderLeftWidth: 3, paddingLeft: 14, marginBottom: 26, marginTop: 4,
    },
    heroIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    heroLabel: { color: C.text, fontSize: 16, fontFamily: FONTS.bold },
    heroSub:   { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.regular, marginTop: 2, lineHeight: 18 },

    section:      { marginBottom: 22 },
    sectionLabel: { color: C.textMuted, fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1.2, marginBottom: 12 },

    networkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    discoGrid:   { gap: 8 },
    networkCard: {
      width: '47%', flexDirection: 'row', alignItems: 'center', gap: 10,
      borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
      backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 12,
      position: 'relative',
    },
    discoCard:   { width: '47%', paddingVertical: 9 },
    networkName: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.semibold, flex: 1 },
    netCheck: {
      position: 'absolute', top: 6, right: 6,
      width: 16, height: 16, borderRadius: 8,
      alignItems: 'center', justifyContent: 'center',
    },

    inputWrap: {
      borderRadius: 14, borderWidth: 1, borderColor: C.border,
      backgroundColor: C.card, overflow: 'hidden',
    },
    input: {
      paddingHorizontal: 14, paddingVertical: 14,
      color: C.text, fontSize: 15, fontFamily: FONTS.medium,
    },

    meterTypeRow: { flexDirection: 'row', gap: 10 },
    meterTypeBtn: {
      flex: 1, paddingVertical: 13, borderRadius: 12,
      borderWidth: 1.5, borderColor: C.border,
      backgroundColor: C.card, alignItems: 'center',
    },
    meterTypeTxt: { color: C.text, fontSize: 14, fontFamily: FONTS.semibold },

    planList:     { gap: 8 },
    planRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
      backgroundColor: C.card, paddingHorizontal: 14, paddingVertical: 13,
    },
    planLeft:     { flex: 1 },
    planName:     { color: C.text, fontSize: 14, fontFamily: FONTS.semibold },
    planDuration: { color: C.textMuted, fontSize: 11, fontFamily: FONTS.regular, marginTop: 2 },
    planRight:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
    planPrice:    { color: C.text, fontSize: 14, fontFamily: FONTS.bold },
    planRadio:    { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    planDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
    emptyPlans:   { fontSize: 13, fontFamily: FONTS.regular, textAlign: 'center', paddingVertical: 20 },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      borderRadius: 12, borderWidth: 1.5, borderColor: C.border,
      backgroundColor: C.card, paddingHorizontal: 16, paddingVertical: 11,
    },
    chipTxt: { color: C.text, fontSize: 13, fontFamily: FONTS.semibold },

    payBtn: {
      height: 56, borderRadius: 16, marginTop: 8,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    payBtnTxt: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },

    loadingOverlay: {
      ...require('react-native').StyleSheet.absoluteFillObject,
      backgroundColor: '#00000066',
      alignItems: 'center', justifyContent: 'center',
    },
    loadingCard: {
      borderRadius: 18, padding: 28, alignItems: 'center', gap: 14,
      minWidth: 160,
    },
    loadingTxt: { fontSize: 14, fontFamily: FONTS.medium },

    // Bottom sheet
    overlay:    { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
    sheet:      { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
    sheetHandle:{ width: 40, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    sheetTitle: { fontSize: 18, fontFamily: FONTS.bold, marginBottom: 20 },
    confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1 },
    confirmLabel:{ fontSize: 13, fontFamily: FONTS.regular },
    confirmValue:{ fontSize: 13, fontFamily: FONTS.semibold },
    confirmBtn: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
    confirmBtnTxt:{ color: '#fff', fontSize: 16, fontFamily: FONTS.bold },
    cancelBtn:  { alignItems: 'center', paddingVertical: 14 },
    cancelTxt:  { fontSize: 14, fontFamily: FONTS.medium },

    // Result modal
    resultOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'center', alignItems: 'center', padding: 24 },
    resultCard:    { width: '100%', borderRadius: 24, padding: 28, alignItems: 'center' },
    resultIcon:    { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    resultTitle:   { fontSize: 20, fontFamily: FONTS.bold, marginBottom: 8 },
    resultMsg:     { fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
    tokenBox:      { width: '100%', borderRadius: 12, borderWidth: 1, padding: 14, alignItems: 'center', marginBottom: 20 },
    tokenLabel:    { fontSize: 11, fontFamily: FONTS.regular, marginBottom: 4 },
    tokenValue:    { fontSize: 18, fontFamily: FONTS.bold, letterSpacing: 2 },
    resultBtn:     { width: '100%', height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    resultBtnTxt:  { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },
  });
}
