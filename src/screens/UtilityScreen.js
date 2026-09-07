import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  Image, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { feedbackMedium, feedbackSelect } from '../utils/feedback';
import { buyAirtime, buyData, buyTV, buyElectricity, getDataPlans, verifyPin } from '../services/api';
import { registerPinCallback } from './PinEntryScreen';

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

// Fallback plans using real ClubKonnect PRODUCT_CODEs from APIDatabundlePlansV2
const DATA_PLANS = {
  MTN: {
    hot: [
      { code: '14', name: '1GB',    price: 485,  duration: '1 day',   tag: 'Awoof' },
      { code: '15', name: '2.5GB',  price: 728,  duration: '1 day',   tag: 'Popular' },
      { code: '19', name: '1GB',    price: 776,  duration: '7 days',  tag: 'Direct' },
      { code: '41', name: '3.5GB',  price: 1455, duration: '7 days',  tag: 'Direct' },
      { code: '22', name: '2GB',    price: 1455, duration: '30 days', tag: 'Direct' },
      { code: '26', name: '7GB',    price: 3395, duration: '30 days', tag: 'Hot' },
    ],
    daily: [
      { code: '38', name: '110MB',  price: 97,   duration: '1 day',   tag: 'Awoof' },
      { code: '39', name: '230MB',  price: 194,  duration: '1 day',   tag: 'Awoof' },
      { code: '14', name: '1GB',    price: 485,  duration: '1 day',   tag: 'Awoof' },
      { code: '15', name: '2.5GB',  price: 728,  duration: '1 day',   tag: 'Popular' },
      { code: '17', name: '3.2GB',  price: 970,  duration: '2 days',  tag: 'Awoof' },
    ],
    weekly: [
      { code: '18', name: '500MB',  price: 485,  duration: '7 days',  tag: 'Direct' },
      { code: '19', name: '1GB',    price: 776,  duration: '7 days',  tag: 'Direct' },
      { code: '41', name: '3.5GB',  price: 1455, duration: '7 days',  tag: 'Direct' },
      { code: '20', name: '6GB',    price: 2425, duration: '7 days',  tag: 'Direct' },
      { code: '21', name: '11GB',   price: 3395, duration: '7 days',  tag: 'Direct' },
    ],
    monthly: [
      { code: '22', name: '2GB',    price: 1455, duration: '30 days', tag: 'Direct' },
      { code: '24', name: '3.5GB',  price: 2425, duration: '30 days', tag: 'Direct' },
      { code: '26', name: '7GB',    price: 3395, duration: '30 days', tag: 'Hot' },
      { code: '27', name: '10GB',   price: 4365, duration: '30 days', tag: 'Direct' },
      { code: '28', name: '12.5GB', price: 5335, duration: '30 days', tag: 'Direct' },
      { code: '30', name: '20GB',   price: 7275, duration: '30 days', tag: 'Direct' },
    ],
  },
  Airtel: {
    hot: [
      { code: '14', name: '1GB',    price: 485,  duration: '1 day',   tag: 'Awoof' },
      { code: '16', name: '2GB',    price: 727,  duration: '2 days',  tag: 'Popular' },
      { code: '20', name: '1GB',    price: 776,  duration: '7 days',  tag: 'Direct' },
      { code: '22', name: '3.5GB',  price: 1455, duration: '7 days',  tag: 'Direct' },
      { code: '27', name: '3GB',    price: 1940, duration: '30 days', tag: 'Direct' },
    ],
    daily: [
      { code: '14', name: '1GB',    price: 485,  duration: '1 day',   tag: 'Awoof' },
      { code: '15', name: '1.5GB',  price: 582,  duration: '2 days',  tag: 'Awoof' },
      { code: '16', name: '2GB',    price: 727,  duration: '2 days',  tag: 'Popular' },
      { code: '17', name: '3GB',    price: 970,  duration: '2 days',  tag: 'Awoof' },
      { code: '18', name: '5GB',    price: 1455, duration: '2 days',  tag: 'Awoof' },
    ],
    weekly: [
      { code: '19', name: '500MB',  price: 485,  duration: '7 days',  tag: 'Direct' },
      { code: '20', name: '1GB',    price: 776,  duration: '7 days',  tag: 'Direct' },
      { code: '21', name: '1.5GB',  price: 970,  duration: '7 days',  tag: 'Direct' },
      { code: '22', name: '3.5GB',  price: 1455, duration: '7 days',  tag: 'Direct' },
      { code: '23', name: '6GB',    price: 2425, duration: '7 days',  tag: 'Direct' },
      { code: '24', name: '10GB',   price: 2910, duration: '7 days',  tag: 'Direct' },
    ],
    monthly: [
      { code: '26', name: '2GB',    price: 1455, duration: '30 days', tag: 'Direct' },
      { code: '27', name: '3GB',    price: 1940, duration: '30 days', tag: 'Direct' },
      { code: '28', name: '4GB',    price: 2425, duration: '30 days', tag: 'Direct' },
      { code: '29', name: '8GB',    price: 2910, duration: '30 days', tag: 'Direct' },
      { code: '30', name: '10GB',   price: 3880, duration: '30 days', tag: 'Direct' },
      { code: '32', name: '18GB',   price: 5820, duration: '30 days', tag: 'Direct' },
    ],
  },
  Glo: {
    hot: [
      { code: '14', name: '125MB',  price: 97,   duration: '1 day',   tag: 'Awoof' },
      { code: '28', name: '2GB',    price: 485,  duration: '1 day',   tag: 'Awoof' },
      { code: '11', name: '1GB',    price: 409,  duration: '7 days',  tag: 'SME' },
      { code: '16', name: '1.5GB',  price: 485,  duration: '14 days', tag: 'Direct' },
      { code: '17', name: '2.6GB',  price: 970,  duration: '30 days', tag: 'Direct' },
    ],
    daily: [
      { code: '14', name: '125MB',  price: 97,   duration: '1 day',   tag: 'Awoof' },
      { code: '15', name: '260MB',  price: 194,  duration: '2 days',  tag: 'Awoof' },
      { code: '28', name: '2GB',    price: 485,  duration: '1 day',   tag: 'Awoof' },
    ],
    weekly: [
      { code: '2',  name: '500MB',  price: 230,  duration: '7 days',  tag: 'SME' },
      { code: '11', name: '1GB',    price: 409,  duration: '7 days',  tag: 'SME' },
      { code: '16', name: '1.5GB',  price: 485,  duration: '14 days', tag: 'Direct' },
      { code: '29', name: '6GB',    price: 1455, duration: '7 days',  tag: 'Direct' },
    ],
    monthly: [
      { code: '3',  name: '1GB',    price: 461,  duration: '30 days', tag: 'SME' },
      { code: '4',  name: '2GB',    price: 922,  duration: '30 days', tag: 'SME' },
      { code: '17', name: '2.6GB',  price: 970,  duration: '30 days', tag: 'Direct' },
      { code: '18', name: '5GB',    price: 1455, duration: '30 days', tag: 'Direct' },
      { code: '19', name: '6.15GB', price: 1940, duration: '30 days', tag: 'Direct' },
      { code: '21', name: '10GB',   price: 2910, duration: '30 days', tag: 'Direct' },
    ],
    night: [
      { code: '37', name: '1GB',    price: 409,  duration: 'Night 14 days', tag: 'SME' },
      { code: '38', name: '3GB',    price: 1228, duration: 'Night 14 days', tag: 'SME' },
      { code: '39', name: '5GB',    price: 2046, duration: 'Night 14 days', tag: 'SME' },
      { code: '40', name: '10GB',   price: 4093, duration: 'Night 14 days', tag: 'SME' },
    ],
  },
  '9mobile': {
    hot: [
      { code: '14', name: '100MB',  price: 93,   duration: '1 day',   tag: 'Awoof' },
      { code: '17', name: '450MB',  price: 326,  duration: '1 day',   tag: 'Awoof' },
      { code: '5',  name: '1GB',    price: 492,  duration: '30 days', tag: 'SME' },
      { code: '19', name: '1.75GB', price: 1395, duration: '7 days',  tag: 'Direct' },
      { code: '23', name: '2.44GB', price: 1860, duration: '30 days', tag: 'Direct' },
    ],
    daily: [
      { code: '14', name: '100MB',  price: 93,   duration: '1 day',   tag: 'Awoof' },
      { code: '15', name: '180MB',  price: 140,  duration: '1 day',   tag: 'Awoof' },
      { code: '17', name: '450MB',  price: 326,  duration: '1 day',   tag: 'Awoof' },
      { code: '18', name: '650MB',  price: 465,  duration: '3 days',  tag: 'Awoof' },
    ],
    weekly: [
      { code: '19', name: '1.75GB', price: 1395, duration: '7 days',  tag: 'Direct' },
      { code: '20', name: '650MB',  price: 558,  duration: '14 days', tag: 'Direct' },
    ],
    monthly: [
      { code: '5',  name: '1GB',    price: 492,  duration: '30 days', tag: 'SME' },
      { code: '6',  name: '2GB',    price: 984,  duration: '30 days', tag: 'SME' },
      { code: '21', name: '1.1GB',  price: 930,  duration: '30 days', tag: 'Direct' },
      { code: '23', name: '2.44GB', price: 1860, duration: '30 days', tag: 'Direct' },
      { code: '25', name: '3.91GB', price: 2790, duration: '30 days', tag: 'Direct' },
      { code: '27', name: '6.5GB',  price: 4650, duration: '30 days', tag: 'Direct' },
    ],
  },
};

const TAB_ORDER  = ['hot', 'daily', 'weekly', 'monthly', 'night'];
const TAB_LABELS = { hot: 'Hot', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', night: 'Night' };
const TAB_ICONS  = { hot: 'fire', daily: 'weather-sunny', weekly: 'calendar-week', monthly: 'calendar-month', night: 'weather-night' };

function tabForDuration(d) {
  const s = (d || '').toLowerCase();
  if (s.includes('night'))                                                   return 'night';
  if (s.includes('weekend'))                                                 return 'weekly';
  if (s.match(/\b[1-3]\s*day/) || s.includes('daily') || s.includes('24h')) return 'daily';
  if (s.match(/\b(7|14)\s*day/) || s.includes('week'))                      return 'weekly';
  return 'monthly';
}

function buildDynamicTabs(plans) {
  const cats = { daily: [], weekly: [], monthly: [], night: [] };
  for (const p of plans) {
    const bucket = tabForDuration(p.duration);
    cats[bucket].push(p);
  }
  const hot = [];
  for (const t of ['daily', 'weekly', 'monthly', 'night']) {
    const sorted = [...(cats[t] || [])].sort((a, b) => a.price - b.price);
    const pick   = sorted.find(p => p.tag === 'Awoof' || p.tag === 'Direct') || sorted[0];
    if (pick) hot.push({ ...pick, hotTag: t === 'night' ? 'Night' : t === 'daily' ? 'Daily' : t === 'weekly' ? 'Weekly' : 'Monthly' });
    const second = sorted.find(p => p !== pick && p.price > (pick?.price || 0));
    if (second) hot.push(second);
  }
  cats.hot = hot.slice(0, 8);
  return cats;
}

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
  const meta = NETWORK_META[name] || { color: '#888', textColor: '#fff', logo: null };
  const abbrev = name.length <= 4 ? name : name.slice(0, 2).toUpperCase();
  if (meta.logo && !err) {
    return (
      <View style={{ width: size, height: size, borderRadius: size * 0.27, backgroundColor: '#F8F8F8', borderWidth: selected ? 2 : 1, borderColor: selected ? meta.color : '#E5E7EB', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <Image source={{ uri: meta.logo }} style={{ width: size * 0.7, height: size * 0.7 }} resizeMode="contain" onError={() => setErr(true)} />
      </View>
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.27, backgroundColor: selected ? meta.color : meta.color + '20', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: selected ? meta.textColor : meta.color, fontSize: abbrev.length > 3 ? 9 : 11, fontFamily: FONTS.extrabold, letterSpacing: 0.5 }}>{abbrev}</Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function UtilityScreen({ navigation, route }) {
  const { colors } = useTheme();
  const type = route?.params?.type || 'Airtime';
  const cfg  = SERVICE_CFG[type] || SERVICE_CFG.Airtime;
  const S    = useMemo(() => makeStyles(colors), [colors]);

  const isAirtime = type === 'Airtime';
  const isData    = type === 'Data';
  const isTV      = type === 'TV';
  const isElec    = type === 'Electricity';

  // Form state
  const [phoneNumber,  setPhoneNumber]  = useState('');
  const [smartCard,    setSmartCard]    = useState('');
  const [meterNumber,  setMeterNumber]  = useState('');
  const [selectedNet,  setSelectedNet]  = useState('');
  const [selectedCode, setSelectedCode] = useState('');
  const [planTab,      setPlanTab]      = useState('hot');
  const [amountChip,   setAmountChip]   = useState('');
  const [customAmt,    setCustomAmt]    = useState('');
  const [meterType,    setMeterType]    = useState('Prepaid');

  // CK dynamic plans — null=loading, false=failed/fallback, object=success
  const [ckPlans,   setCkPlans]   = useState(null);
  const [ckLoading, setCkLoading] = useState(false);
  const fetchedFor = useRef('');

  // UI state
  const [confirm, setConfirm] = useState(false);

  // Fetch real CK plans when network is selected in Data mode.
  // While loading: show skeleton (never switch plans mid-selection).
  // On failure: fall back to hardcoded DATA_PLANS.
  useEffect(() => {
    if (!isData || !selectedNet || fetchedFor.current === selectedNet) return;
    fetchedFor.current = selectedNet;
    setCkPlans(null);
    setCkLoading(true);
    getDataPlans(selectedNet)
      .then(res => {
        const plans = Array.isArray(res.data) && res.data.length > 0 ? res.data : null;
        setCkPlans(plans ? buildDynamicTabs(plans) : false);
      })
      .catch(() => setCkPlans(false))
      .finally(() => setCkLoading(false));
  }, [isData, selectedNet]);

  // While loading: null (skeleton). On success: CK. On fail: fallback.
  const planSource = useMemo(() => {
    if (!isData || !selectedNet) return {};
    if (ckLoading || ckPlans === null) return null;
    if (ckPlans && Object.keys(ckPlans).some(k => (ckPlans[k]?.length ?? 0) > 0)) return ckPlans;
    return DATA_PLANS[selectedNet] || {};
  }, [isData, selectedNet, ckPlans, ckLoading]);

  const availableTabs = useMemo(() =>
    planSource ? TAB_ORDER.filter(t => planSource[t]?.length > 0) : [],
    [planSource],
  );

  const activePlans = useMemo(() => {
    if (isData) return planSource ? (planSource[planTab] || []) : [];
    if (isTV)   return TV_PLANS[selectedNet] || [];
    return [];
  }, [isData, isTV, selectedNet, planTab, planSource]);

  const selectedPlan = activePlans.find(p => p.code === selectedCode) || null;

  const payAmount = useMemo(() => {
    if (isData || isTV) return selectedPlan?.price ?? 0;
    return parseFloat(amountChip || customAmt || '0');
  }, [isData, isTV, selectedPlan, amountChip, customAmt]);

  const canPay = useMemo(() => {
    if (!selectedNet) return false;
    const ph = phoneNumber.trim();
    if (isAirtime) return ph.length >= 10 && payAmount >= 50;
    if (isData)    return ph.length >= 10 && !!selectedCode;
    if (isTV)      return smartCard.trim().length >= 6 && ph.length >= 10 && !!selectedCode;
    if (isElec)    return meterNumber.trim().length >= 5 && ph.length >= 10 && payAmount >= 500;
    return false;
  }, [selectedNet, phoneNumber, smartCard, meterNumber, selectedCode, payAmount, isAirtime, isData, isTV, isElec]);

  function selectNetwork(n) {
    feedbackSelect();
    setSelectedNet(n);
    setSelectedCode('');
    setPlanTab('hot');
    if (isData) { setCkPlans(null); setCkLoading(false); fetchedFor.current = ''; }
  }

  function selectTab(t) { feedbackSelect(); setPlanTab(t); setSelectedCode(''); }

  const networkList = isData || isAirtime ? ['MTN', 'Airtel', 'Glo', '9mobile']
    : isTV ? ['DSTV', 'GOtv', 'Startimes', 'ShowMax']
    : ELEC_DISCOS;

  const confirmRows = useMemo(() => {
    const rows = [];
    if (selectedNet) rows.push({ label: isAirtime || isData ? 'Network' : isTV ? 'Provider' : 'DISCO', value: selectedNet });
    if (isTV)   rows.push({ label: 'Smart Card', value: smartCard });
    if (isElec) rows.push({ label: 'Meter No.', value: meterNumber }, { label: 'Type', value: meterType });
    rows.push({ label: 'Phone', value: phoneNumber });
    if (selectedPlan) rows.push({ label: isTV ? 'Package' : 'Plan', value: `${selectedPlan.name} · ${selectedPlan.duration}` });
    rows.push({ label: 'Amount', value: `₦${payAmount.toLocaleString('en-NG')}` });
    return rows;
  }, [selectedNet, phoneNumber, smartCard, meterNumber, meterType, selectedPlan, payAmount, isAirtime, isData, isTV, isElec]);

  function handleConfirmAndPay() {
    setConfirm(false);

    // Capture current state into closure before navigating away
    const snap = {
      isAirtime, isData, isTV, isElec,
      selectedNet, phoneNumber, smartCard, meterNumber, meterType,
      payAmount, selectedPlan, type,
    };

    registerPinCallback('utility', async (pin, { onError, goBack }) => {
      try {
        await verifyPin(pin);
      } catch {
        onError('Wrong PIN. Try again.');
        return;
      }
      try {
        let res;
        if (snap.isAirtime) {
          res = await buyAirtime({ network: snap.selectedNet, phone: snap.phoneNumber, amount: snap.payAmount.toString() });
        } else if (snap.isData) {
          res = await buyData({ network: snap.selectedNet, phone: snap.phoneNumber, planCode: snap.selectedPlan.code, planName: `${snap.selectedPlan.name} ${snap.selectedPlan.duration}`, amount: snap.selectedPlan.price.toString() });
        } else if (snap.isTV) {
          res = await buyTV({ provider: snap.selectedNet, packageCode: snap.selectedPlan.code, packageName: snap.selectedPlan.name, smartCard: snap.smartCard, phone: snap.phoneNumber, amount: snap.selectedPlan.price.toString() });
        } else if (snap.isElec) {
          res = await buyElectricity({ disco: snap.selectedNet, meterNo: snap.meterNumber, meterType: snap.meterType, phone: snap.phoneNumber, amount: snap.payAmount.toString() });
        }
        const d = res.data;
        const receiptTx = {
          txId:        d.orderId || `UTIL-${Date.now()}`,
          type:        'utility',
          status:      'completed',
          amount:      snap.payAmount,
          createdAt:   new Date().toISOString(),
          narration:   d.message || '',
          utilityType: snap.type,
          network:     snap.selectedNet,
          phone:       snap.phoneNumber,
          plan:        snap.selectedPlan ? `${snap.selectedPlan.name} · ${snap.selectedPlan.duration}` : null,
          smartCard:   snap.isTV ? snap.smartCard : null,
          meterNo:     snap.isElec ? snap.meterNumber : null,
          meterType:   snap.isElec ? snap.meterType : null,
          token:       d.token || null,
          orderId:     d.orderId || null,
        };
        goBack();
        navigation.navigate('Receipt', { tx: receiptTx });
      } catch (err) {
        onError(err?.response?.data?.error || 'Payment failed. Please try again.');
      }
    });

    navigation.navigate('PinEntry', {
      title: 'Confirm Payment',
      subtitle: `Pay ₦${payAmount.toLocaleString('en-NG')} · ${selectedNet}`,
      callbackKey: 'utility',
    });
  }

  return (
    <SafeAreaView style={S.root} edges={['top']}>

      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>{cfg.label}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled">

        {/* Hero */}
        <View style={[S.hero, { borderLeftColor: cfg.color }]}>
          <View style={[S.heroIcon, { backgroundColor: cfg.color + '18' }]}>
            <MaterialCommunityIcons name={cfg.icon} size={24} color={cfg.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.heroLabel}>{cfg.label}</Text>
            <Text style={S.heroSub}>{cfg.subtitle}</Text>
          </View>
        </View>

        {/* Network / Provider / DISCO */}
        <View style={S.section}>
          <Text style={S.sectionLabel}>{isData || isAirtime ? 'SELECT NETWORK' : isTV ? 'SELECT PROVIDER' : 'SELECT ELECTRICITY COMPANY'}</Text>
          <View style={[S.networkGrid, isElec && S.discoGrid]}>
            {networkList.map(n => {
              const sel  = selectedNet === n;
              const meta = NETWORK_META[n] || { color: '#888' };
              return (
                <TouchableOpacity key={n}
                  style={[S.networkCard, isElec && S.discoCard, sel && { borderColor: meta.color, backgroundColor: meta.color + '0A' }]}
                  onPress={() => selectNetwork(n)} activeOpacity={0.7}
                >
                  <NetworkLogo name={n} size={isElec ? 34 : 40} selected={sel} />
                  <Text style={[S.networkName, sel && { color: meta.color, fontFamily: FONTS.bold }]} numberOfLines={1}>{n}</Text>
                  {sel && <View style={[S.netCheck, { backgroundColor: meta.color }]}><Ionicons name="checkmark" size={9} color="#fff" /></View>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Smart Card (TV) */}
        {isTV && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>SMART CARD / IUC NUMBER</Text>
            <View style={S.inputWrap}>
              <TextInput style={S.input} placeholder="Enter your smart card number" placeholderTextColor={colors.textMuted} keyboardType="number-pad" value={smartCard} onChangeText={setSmartCard} maxLength={12} />
            </View>
          </View>
        )}

        {/* Meter number (Electricity) */}
        {isElec && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>METER NUMBER</Text>
            <View style={S.inputWrap}>
              <TextInput style={S.input} placeholder="Enter your meter number" placeholderTextColor={colors.textMuted} keyboardType="number-pad" value={meterNumber} onChangeText={setMeterNumber} maxLength={13} />
            </View>
          </View>
        )}

        {/* Phone number */}
        <View style={S.section}>
          <Text style={S.sectionLabel}>{isTV ? 'PHONE NUMBER (NOTIFICATION)' : 'PHONE NUMBER'}</Text>
          <View style={S.inputWrap}>
            <TextInput style={S.input} placeholder="080XXXXXXXX" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} maxLength={14} />
          </View>
        </View>

        {/* Meter type (Electricity) */}
        {isElec && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>METER TYPE</Text>
            <View style={S.meterTypeRow}>
              {['Prepaid', 'Postpaid'].map(mt => (
                <TouchableOpacity key={mt}
                  style={[S.meterTypeBtn, meterType === mt && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                  onPress={() => { feedbackSelect(); setMeterType(mt); }} activeOpacity={0.75}
                >
                  <Text style={[S.meterTypeTxt, meterType === mt && { color: '#fff', fontFamily: FONTS.bold }]}>{mt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Data plan section */}
        {isData && (
          <View style={S.section}>
            {!selectedNet ? (
              <View style={S.emptyNetPrompt}>
                <MaterialCommunityIcons name="wifi-off" size={32} color={colors.textMuted} />
                <Text style={[S.emptyNetTxt, { color: colors.textMuted }]}>Select a network above to see plans</Text>
              </View>
            ) : planSource === null ? (
              /* Loading skeleton — prevents plans from switching mid-selection */
              <View style={S.emptyNetPrompt}>
                <MaterialCommunityIcons name="wifi" size={32} color={cfg.color} />
                <Text style={[S.emptyNetTxt, { color: colors.textMuted }]}>Loading {selectedNet} plans…</Text>
              </View>
            ) : (
              <>
                {/* Category tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.tabRow} style={{ marginBottom: 4 }}>
                  {availableTabs.map(t => {
                    const active = planTab === t;
                    return (
                      <TouchableOpacity key={t} style={[S.tab, active && { backgroundColor: cfg.color, borderColor: cfg.color }]} onPress={() => selectTab(t)} activeOpacity={0.75}>
                        <MaterialCommunityIcons name={TAB_ICONS[t]} size={13} color={active ? '#fff' : colors.textMuted} style={{ marginRight: 4 }} />
                        <Text style={[S.tabTxt, active && { color: '#fff', fontFamily: FONTS.bold }]}>{TAB_LABELS[t]}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Night banner */}
                {planTab === 'night' && (
                  <View style={[S.nightBanner, { backgroundColor: '#1E1B4B' }]}>
                    <MaterialCommunityIcons name="weather-night" size={15} color="#A78BFA" />
                    <Text style={S.nightTxt}>Valid midnight – 5am only. Data resets each day.</Text>
                  </View>
                )}

                <Text style={[S.sectionLabel, { marginTop: 14 }]}>{selectedNet} {(TAB_LABELS[planTab] || '').toUpperCase()} PLANS</Text>

                {activePlans.length > 0 ? (
                  <View style={S.planList}>
                    {activePlans.map(p => {
                      const sel = selectedCode === p.code;
                      return (
                        <TouchableOpacity key={p.code}
                          style={[S.planRow, sel && { borderColor: cfg.color, backgroundColor: cfg.color + '08' }]}
                          onPress={() => { feedbackSelect(); setSelectedCode(p.code); }} activeOpacity={0.7}
                        >
                          <View style={S.planLeft}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <Text style={[S.planName, sel && { color: cfg.color }]}>{p.name}</Text>
                              {(p.hotTag || p.tag) ? <View style={[S.planTag, { backgroundColor: sel ? cfg.color : cfg.color + '20' }]}><Text style={[S.planTagTxt, { color: sel ? '#fff' : cfg.color }]}>{p.hotTag || p.tag}</Text></View> : null}
                            </View>
                            <Text style={S.planDuration} numberOfLines={1}>{p.duration}{p.tag && !p.hotTag ? ` · ${p.tag}` : ''}</Text>
                          </View>
                          <View style={S.planRight}>
                            <Text style={[S.planPrice, sel && { color: cfg.color }]}>₦{p.price.toLocaleString('en-NG')}</Text>
                            <View style={[S.planRadio, sel ? { backgroundColor: cfg.color, borderColor: cfg.color } : { borderColor: colors.border }]}>
                              {sel && <View style={S.planDot} />}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={[S.emptyNetTxt, { color: colors.textMuted, marginTop: 12 }]}>No plans available for this tab</Text>
                )}
              </>
            )}
          </View>
        )}

        {/* TV plan list */}
        {isTV && selectedNet && activePlans.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>{selectedNet} PACKAGES</Text>
            <View style={S.planList}>
              {activePlans.map(p => {
                const sel = selectedCode === p.code;
                return (
                  <TouchableOpacity key={p.code}
                    style={[S.planRow, sel && { borderColor: cfg.color, backgroundColor: cfg.color + '08' }]}
                    onPress={() => { feedbackSelect(); setSelectedCode(p.code); }} activeOpacity={0.7}
                  >
                    <View style={S.planLeft}>
                      <Text style={[S.planName, sel && { color: cfg.color }]}>{p.name}</Text>
                      <Text style={S.planDuration}>{p.duration}</Text>
                    </View>
                    <View style={S.planRight}>
                      <Text style={[S.planPrice, sel && { color: cfg.color }]}>₦{p.price.toLocaleString('en-NG')}</Text>
                      <View style={[S.planRadio, sel ? { backgroundColor: cfg.color, borderColor: cfg.color } : { borderColor: colors.border }]}>
                        {sel && <View style={S.planDot} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Amount chips (Airtime / Electricity) */}
        {(isAirtime || isElec) && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>AMOUNT (₦)</Text>
            <View style={S.chipRow}>
              {(isAirtime ? AIRTIME_CHIPS : ELEC_CHIPS).map(a => {
                const sel = amountChip === a;
                return (
                  <TouchableOpacity key={a}
                    style={[S.chip, sel && { borderColor: cfg.color, backgroundColor: cfg.color + '12' }]}
                    onPress={() => { feedbackSelect(); setAmountChip(a); setCustomAmt(''); }} activeOpacity={0.7}
                  >
                    <Text style={[S.chipTxt, sel && { color: cfg.color, fontFamily: FONTS.bold }]}>₦{parseInt(a).toLocaleString()}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={[S.inputWrap, { marginTop: 12 }]}>
              <TextInput style={S.input} placeholder="Or enter a custom amount" placeholderTextColor={colors.textMuted} keyboardType="number-pad" value={customAmt} onChangeText={v => { setCustomAmt(v); setAmountChip(''); }} />
            </View>
          </View>
        )}

        {/* Pay button */}
        <TouchableOpacity
          style={[S.payBtn, { backgroundColor: canPay ? cfg.color : colors.border }]}
          activeOpacity={canPay ? 0.82 : 1}
          disabled={!canPay}
          onPress={() => { feedbackMedium(); setConfirm(true); }}
        >
          <Text style={S.payBtnTxt}>{payAmount > 0 ? `Pay ₦${payAmount.toLocaleString('en-NG')}` : 'Pay Now'}</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Confirm bottom sheet */}
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
            <TouchableOpacity style={[S.confirmBtn, { backgroundColor: cfg.color }]}
              onPress={handleConfirmAndPay} activeOpacity={0.82}>
              <Text style={S.confirmBtnTxt}>Confirm & Pay</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.cancelBtn} onPress={() => setConfirm(false)} activeOpacity={0.7}>
              <Text style={[S.cancelTxt, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    root:        { flex: 1, backgroundColor: C.bg },
    header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    backBtn:     { width: 38, height: 38, borderRadius: 12, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
    headerTitle: { color: C.text, fontSize: 17, fontFamily: FONTS.bold },
    scroll:      { paddingHorizontal: 20, paddingBottom: 40 },

    hero:      { flexDirection: 'row', alignItems: 'center', gap: 14, borderLeftWidth: 3, paddingLeft: 14, marginBottom: 26, marginTop: 4 },
    heroIcon:  { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    heroLabel: { color: C.text, fontSize: 16, fontFamily: FONTS.bold },
    heroSub:   { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.regular, marginTop: 2, lineHeight: 18 },

    section:      { marginBottom: 22 },
    sectionLabel: { color: C.textMuted, fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1.2, marginBottom: 12 },

    networkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    discoGrid:   { gap: 8 },
    networkCard: { width: '47%', flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 12, position: 'relative' },
    discoCard:   { width: '47%', paddingVertical: 9 },
    networkName: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.semibold, flex: 1 },
    netCheck:    { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

    inputWrap: { borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, overflow: 'hidden' },
    input:     { paddingHorizontal: 14, paddingVertical: 14, color: C.text, fontSize: 15, fontFamily: FONTS.medium },

    meterTypeRow: { flexDirection: 'row', gap: 10 },
    meterTypeBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card, alignItems: 'center' },
    meterTypeTxt: { color: C.text, fontSize: 14, fontFamily: FONTS.semibold },

    emptyNetPrompt: { alignItems: 'center', paddingVertical: 24, gap: 10 },
    emptyNetTxt:    { fontSize: 13, fontFamily: FONTS.regular, textAlign: 'center' },

    tabRow:     { flexDirection: 'row', gap: 8, paddingRight: 4, paddingBottom: 2 },
    tab:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
    tabTxt:     { color: C.textMuted, fontSize: 13, fontFamily: FONTS.semibold },

    nightBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 10, marginTop: 10 },
    nightTxt:    { color: '#A78BFA', fontSize: 12, fontFamily: FONTS.regular, flex: 1 },

    planList:     { gap: 8 },
    planRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card, paddingHorizontal: 14, paddingVertical: 13 },
    planLeft:     { flex: 1 },
    planName:     { color: C.text, fontSize: 14, fontFamily: FONTS.semibold },
    planDuration: { color: C.textMuted, fontSize: 11, fontFamily: FONTS.regular, marginTop: 2 },
    planTag:      { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    planTagTxt:   { fontSize: 9, fontFamily: FONTS.bold, letterSpacing: 0.3 },
    planRight:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
    planPrice:    { color: C.text, fontSize: 14, fontFamily: FONTS.bold },
    planRadio:    { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    planDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip:    { borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card, paddingHorizontal: 16, paddingVertical: 11 },
    chipTxt: { color: C.text, fontSize: 13, fontFamily: FONTS.semibold },

    payBtn:    { height: 56, borderRadius: 16, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    payBtnTxt: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },

    overlay:       { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
    sheet:         { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
    sheetHandle:   { width: 40, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    sheetTitle:    { fontSize: 18, fontFamily: FONTS.bold, marginBottom: 20 },
    confirmRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1 },
    confirmLabel:  { fontSize: 13, fontFamily: FONTS.regular },
    confirmValue:  { fontSize: 13, fontFamily: FONTS.semibold, maxWidth: '60%', textAlign: 'right' },
    confirmBtn:    { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
    confirmBtnTxt: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },
    cancelBtn:     { alignItems: 'center', paddingVertical: 14 },
    cancelTxt:     { fontSize: 14, fontFamily: FONTS.medium },

  });
}
