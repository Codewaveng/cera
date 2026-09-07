import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  Image, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { feedbackMedium, feedbackSelect } from '../utils/feedback';
import { buyAirtime, buyData, buyTV, buyElectricity, getDataPlans } from '../services/api';

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

// Real Nigerian standard data plans — codes must match your ClubKonnect dashboard plan IDs
const DATA_PLANS = {
  MTN: {
    hot: [
      { code: 'mtn-2.5gb-1d',   name: '2.5GB',  price: 750,   duration: '1 Day',    tag: 'Popular' },
      { code: 'mtn-1gb-7d',     name: '1GB',    price: 500,   duration: '7 Days',   tag: 'Best Value' },
      { code: 'mtn-6gb-30d',    name: '6GB',    price: 2000,  duration: '30 Days',  tag: 'Hot' },
      { code: 'mtn-3gb-30d',    name: '3GB',    price: 1500,  duration: '30 Days' },
      { code: 'mtn-1gb-night',  name: '1GB',    price: 50,    duration: 'Night Only', tag: 'Night' },
    ],
    daily: [
      { code: 'mtn-200mb-1d',   name: '200MB',  price: 200,   duration: '1 Day' },
      { code: 'mtn-1gb-1d',     name: '1GB',    price: 300,   duration: '1 Day' },
      { code: 'mtn-2.5gb-1d',   name: '2.5GB',  price: 750,   duration: '1 Day',    tag: 'Popular' },
      { code: 'mtn-5gb-1d',     name: '5GB',    price: 1500,  duration: '1 Day' },
      { code: 'mtn-10gb-1d',    name: '10GB',   price: 3000,  duration: '1 Day' },
    ],
    weekly: [
      { code: 'mtn-300mb-7d',   name: '300MB',  price: 200,   duration: '7 Days' },
      { code: 'mtn-1gb-7d',     name: '1GB',    price: 500,   duration: '7 Days',   tag: 'Best Value' },
      { code: 'mtn-2gb-7d',     name: '2GB',    price: 700,   duration: '7 Days' },
      { code: 'mtn-3.5gb-7d',   name: '3.5GB',  price: 1000,  duration: '7 Days' },
      { code: 'mtn-6.5gb-7d',   name: '6.5GB',  price: 2000,  duration: '7 Days' },
    ],
    monthly: [
      { code: 'mtn-1.5gb-30d',  name: '1.5GB',  price: 1000,  duration: '30 Days' },
      { code: 'mtn-3gb-30d',    name: '3GB',    price: 1500,  duration: '30 Days' },
      { code: 'mtn-6gb-30d',    name: '6GB',    price: 2000,  duration: '30 Days',  tag: 'Hot' },
      { code: 'mtn-15gb-30d',   name: '15GB',   price: 4000,  duration: '30 Days' },
      { code: 'mtn-40gb-30d',   name: '40GB',   price: 6000,  duration: '30 Days' },
      { code: 'mtn-75gb-30d',   name: '75GB',   price: 10000, duration: '30 Days' },
    ],
    night: [
      { code: 'mtn-500mb-night',name: '500MB',  price: 25,    duration: 'Midnight – 5am' },
      { code: 'mtn-1gb-night',  name: '1GB',    price: 50,    duration: 'Midnight – 5am', tag: 'Popular' },
      { code: 'mtn-2gb-night',  name: '2GB',    price: 100,   duration: 'Midnight – 5am' },
      { code: 'mtn-5gb-night',  name: '5GB',    price: 200,   duration: 'Midnight – 5am' },
    ],
  },

  Airtel: {
    hot: [
      { code: 'airtl-2gb-1d',   name: '2GB',    price: 500,   duration: '1 Day',    tag: 'Popular' },
      { code: 'airtl-1.5gb-7d', name: '1.5GB',  price: 500,   duration: '7 Days',   tag: 'Best Value' },
      { code: 'airtl-5gb-30d',  name: '5GB',    price: 2000,  duration: '30 Days',  tag: 'Hot' },
      { code: 'airtl-3gb-7d',   name: '3GB',    price: 1000,  duration: '7 Days' },
    ],
    daily: [
      { code: 'airtl-500mb-1d', name: '500MB',  price: 200,   duration: '1 Day' },
      { code: 'airtl-1gb-1d',   name: '1GB',    price: 300,   duration: '1 Day' },
      { code: 'airtl-2gb-1d',   name: '2GB',    price: 500,   duration: '1 Day',    tag: 'Popular' },
      { code: 'airtl-5gb-1d',   name: '5GB',    price: 1500,  duration: '1 Day' },
    ],
    weekly: [
      { code: 'airtl-1.5gb-7d', name: '1.5GB',  price: 500,   duration: '7 Days',   tag: 'Best Value' },
      { code: 'airtl-3gb-7d',   name: '3GB',    price: 1000,  duration: '7 Days' },
      { code: 'airtl-6gb-7d',   name: '6GB',    price: 1500,  duration: '7 Days' },
      { code: 'airtl-12gb-7d',  name: '12GB',   price: 3000,  duration: '7 Days' },
    ],
    monthly: [
      { code: 'airtl-2gb-30d',  name: '2GB',    price: 1000,  duration: '30 Days' },
      { code: 'airtl-5gb-30d',  name: '5GB',    price: 2000,  duration: '30 Days',  tag: 'Hot' },
      { code: 'airtl-10gb-30d', name: '10GB',   price: 3000,  duration: '30 Days' },
      { code: 'airtl-20gb-30d', name: '20GB',   price: 5000,  duration: '30 Days' },
      { code: 'airtl-40gb-30d', name: '40GB',   price: 8000,  duration: '30 Days' },
    ],
  },

  Glo: {
    hot: [
      { code: 'glo-1.35gb-14d', name: '1.35GB', price: 500,   duration: '14 Days',  tag: 'Popular' },
      { code: 'glo-2.9gb-30d',  name: '2.9GB',  price: 1000,  duration: '30 Days',  tag: 'Best Value' },
      { code: 'glo-7.7gb-30d',  name: '7.7GB',  price: 2000,  duration: '30 Days',  tag: 'Hot' },
      { code: 'glo-1.5gb-night',name: '1.5GB',  price: 200,   duration: 'Night Only',tag: 'Night' },
    ],
    daily: [
      { code: 'glo-200mb-1d',   name: '200MB',  price: 200,   duration: '1 Day' },
      { code: 'glo-1gb-1d',     name: '1GB',    price: 500,   duration: '1 Day' },
      { code: 'glo-2gb-1d',     name: '2GB',    price: 1000,  duration: '1 Day' },
    ],
    weekly: [
      { code: 'glo-1.35gb-14d', name: '1.35GB', price: 500,   duration: '14 Days',  tag: 'Popular' },
      { code: 'glo-3.35gb-14d', name: '3.35GB', price: 1000,  duration: '14 Days' },
      { code: 'glo-7.5gb-14d',  name: '7.5GB',  price: 2000,  duration: '14 Days' },
      { code: 'glo-15gb-14d',   name: '15GB',   price: 4000,  duration: '14 Days' },
    ],
    monthly: [
      { code: 'glo-2.9gb-30d',  name: '2.9GB',  price: 1000,  duration: '30 Days',  tag: 'Best Value' },
      { code: 'glo-7.7gb-30d',  name: '7.7GB',  price: 2000,  duration: '30 Days',  tag: 'Hot' },
      { code: 'glo-12gb-30d',   name: '12GB',   price: 3000,  duration: '30 Days' },
      { code: 'glo-18gb-30d',   name: '18GB',   price: 4000,  duration: '30 Days' },
      { code: 'glo-30gb-30d',   name: '30GB',   price: 6000,  duration: '30 Days' },
      { code: 'glo-50gb-30d',   name: '50GB',   price: 10000, duration: '30 Days' },
    ],
    night: [
      { code: 'glo-1.5gb-night',name: '1.5GB',  price: 200,   duration: 'Midnight – 5am', tag: 'Popular' },
      { code: 'glo-3gb-night',  name: '3GB',    price: 500,   duration: 'Midnight – 5am' },
    ],
  },

  '9mobile': {
    hot: [
      { code: '9mob-150mb-1d',  name: '150MB',  price: 200,   duration: '1 Day' },
      { code: '9mob-1gb-7d',    name: '1GB',    price: 500,   duration: '7 Days',   tag: 'Best Value' },
      { code: '9mob-2.5gb-30d', name: '2.5GB',  price: 2000,  duration: '30 Days',  tag: 'Hot' },
    ],
    daily: [
      { code: '9mob-150mb-1d',  name: '150MB',  price: 200,   duration: '1 Day' },
      { code: '9mob-1gb-1d',    name: '1GB',    price: 500,   duration: '1 Day' },
    ],
    weekly: [
      { code: '9mob-1gb-7d',    name: '1GB',    price: 500,   duration: '7 Days',   tag: 'Best Value' },
      { code: '9mob-1.5gb-7d',  name: '1.5GB',  price: 1000,  duration: '7 Days' },
      { code: '9mob-3gb-7d',    name: '3GB',    price: 1500,  duration: '7 Days' },
    ],
    monthly: [
      { code: '9mob-1gb-30d',   name: '1GB',    price: 1000,  duration: '30 Days' },
      { code: '9mob-2.5gb-30d', name: '2.5GB',  price: 2000,  duration: '30 Days',  tag: 'Hot' },
      { code: '9mob-5gb-30d',   name: '5GB',    price: 3000,  duration: '30 Days' },
      { code: '9mob-11.5gb-30d',name: '11.5GB', price: 5000,  duration: '30 Days' },
      { code: '9mob-22gb-30d',  name: '22GB',   price: 8000,  duration: '30 Days' },
    ],
  },
};

const TAB_ORDER  = ['hot', 'daily', 'weekly', 'monthly', 'night'];
const TAB_LABELS = { hot: 'Hot', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', night: 'Night' };
const TAB_ICONS  = { hot: 'fire', daily: 'weather-sunny', weekly: 'calendar-week', monthly: 'calendar-month', night: 'weather-night' };

// Categorise a ClubKonnect plan by its validity string
function tabForDuration(duration) {
  const d = (duration || '').toLowerCase();
  if (d.includes('night') || d.includes('mid') || d.includes('12am') || d.includes('5am')) return 'night';
  if (d.match(/\b1\s*day\b/)  || d.includes('24h') || d.includes('1day'))  return 'daily';
  if (d.match(/\b(7|14)\s*day/) || d.includes('week'))                       return 'weekly';
  return 'monthly';
}

// Build tab-keyed plan map from a flat CK plan array
function buildDynamicTabs(plans) {
  const cats = { daily: [], weekly: [], monthly: [], night: [], hot: [] };
  for (const p of plans) {
    const cat = tabForDuration(p.duration);
    cats[cat].push(p);
  }
  // Hot = best value plan from each category (cheapest per GB proxy: lowest price per plan chosen)
  const hot = [];
  for (const tab of ['daily', 'weekly', 'monthly', 'night']) {
    const sorted = [...(cats[tab] || [])].sort((a, b) => a.price - b.price);
    if (sorted[0]) hot.push({ ...sorted[0], tag: tab === 'daily' ? 'Daily Pick' : tab === 'weekly' ? 'Weekly Pick' : tab === 'night' ? 'Night' : 'Monthly Pick' });
    if (sorted[1]) hot.push(sorted[1]);
  }
  cats.hot = hot.slice(0, 6);
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
        <Image source={{ uri: meta.logo }} style={{ width: size * 0.7, height: size * 0.7 }}
          resizeMode="contain" onError={() => setErr(true)} />
      </View>
    );
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size * 0.27,
      backgroundColor: selected ? meta.color : meta.color + '20',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: selected ? meta.textColor : meta.color, fontSize: abbrev.length > 3 ? 9 : 11, fontFamily: FONTS.extrabold, letterSpacing: 0.5 }}>
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
  const [planTab,      setPlanTab]      = useState('hot');
  const [amountChip,   setAmountChip]   = useState('');
  const [customAmt,    setCustomAmt]    = useState('');
  const [meterType,    setMeterType]    = useState('Prepaid');
  const [loading,      setLoading]      = useState(false);
  const [confirm,      setConfirm]      = useState(false);
  const [result,       setResult]       = useState(null);
  // Dynamic plans fetched from ClubKonnect (null = not yet fetched, {} = fetched)
  const [ckPlans,      setCkPlans]      = useState(null);
  const [fetchingPlans,setFetchingPlans]= useState(false);
  const fetchedFor = useRef('');

  // Fetch real plan codes from ClubKonnect when network is selected in Data mode
  useEffect(() => {
    if (!isData || !selectedNet || fetchedFor.current === selectedNet) return;
    fetchedFor.current = selectedNet;
    setFetchingPlans(true);
    setCkPlans(null);
    getDataPlans(selectedNet)
      .then(res => {
        const plans = res.data;
        if (Array.isArray(plans) && plans.length > 0) {
          setCkPlans(buildDynamicTabs(plans));
        } else {
          setCkPlans({}); // empty means CK gave no plans — fall back to hardcoded
        }
      })
      .catch(() => setCkPlans({}))
      .finally(() => setFetchingPlans(false));
  }, [isData, selectedNet]);

  // Use live CK plans if available, otherwise fall back to hardcoded
  const planSource = useMemo(() => {
    if (!isData || !selectedNet) return DATA_PLANS[selectedNet] || {};
    if (ckPlans && Object.keys(ckPlans).some(k => ckPlans[k]?.length > 0)) return ckPlans;
    return DATA_PLANS[selectedNet] || {};
  }, [isData, selectedNet, ckPlans]);

  // Available category tabs for the selected network
  const availableTabs = useMemo(() => {
    if (!isData || !selectedNet) return [];
    return TAB_ORDER.filter(t => planSource[t] && planSource[t].length > 0);
  }, [isData, selectedNet, planSource]);

  // Plans for current tab
  const activePlans = useMemo(() => {
    if (isData)  return planSource[planTab] || [];
    if (isTV)    return TV_PLANS[selectedNet] || [];
    return [];
  }, [isData, isTV, selectedNet, planTab, planSource]);

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
    setPlanTab('hot');
    if (isData) { setCkPlans(null); fetchedFor.current = ''; }
  }

  function selectTab(t) {
    feedbackSelect();
    setPlanTab(t);
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
    if (isTV)   rows.push({ label: 'Smart Card', value: smartCard });
    if (isElec) rows.push({ label: 'Meter No.', value: meterNumber }, { label: 'Type', value: meterType });
    rows.push({ label: 'Phone', value: phoneNumber });
    if (selectedPlan) rows.push({ label: isTV ? 'Package' : 'Plan', value: `${selectedPlan.name} (${selectedPlan.duration})` });
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
          planCode: selectedPlan.code, planName: `${selectedPlan.name} ${selectedPlan.duration}`,
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
      setResult({ success: true, message: res.data.message, token: res.data.token });
    } catch (err) {
      const msg = err?.response?.data?.error || 'Payment failed. Please try again.';
      setResult({ success: false, message: msg });
    } finally {
      setLoading(false);
    }
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
                <TouchableOpacity key={n}
                  style={[S.networkCard, isElec && S.discoCard, sel && { borderColor: meta.color, backgroundColor: meta.color + '0A' }]}
                  onPress={() => selectNetwork(n)} activeOpacity={0.7}
                >
                  <NetworkLogo name={n} size={isElec ? 34 : 40} selected={sel} />
                  <Text style={[S.networkName, sel && { color: meta.color, fontFamily: FONTS.bold }]} numberOfLines={1}>{n}</Text>
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

        {/* Smart Card (TV) */}
        {isTV && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>SMART CARD / IUC NUMBER</Text>
            <View style={S.inputWrap}>
              <TextInput style={S.input} placeholder="Enter your smart card number"
                placeholderTextColor={colors.textMuted} keyboardType="number-pad"
                value={smartCard} onChangeText={setSmartCard} maxLength={12} />
            </View>
          </View>
        )}

        {/* Meter number (Electricity) */}
        {isElec && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>METER NUMBER</Text>
            <View style={S.inputWrap}>
              <TextInput style={S.input} placeholder="Enter your meter number"
                placeholderTextColor={colors.textMuted} keyboardType="number-pad"
                value={meterNumber} onChangeText={setMeterNumber} maxLength={13} />
            </View>
          </View>
        )}

        {/* Phone number */}
        <View style={S.section}>
          <Text style={S.sectionLabel}>{isTV ? 'PHONE NUMBER (NOTIFICATION)' : 'PHONE NUMBER'}</Text>
          <View style={S.inputWrap}>
            <TextInput style={S.input} placeholder="080XXXXXXXX"
              placeholderTextColor={colors.textMuted} keyboardType="phone-pad"
              value={phoneNumber} onChangeText={setPhoneNumber} maxLength={14} />
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

        {/* Data: fetching spinner */}
        {isData && selectedNet && fetchingPlans && (
          <View style={{ alignItems: 'center', paddingVertical: 30, gap: 10 }}>
            <ActivityIndicator color={cfg.color} />
            <Text style={{ color: colors.textMuted, fontSize: 13, fontFamily: FONTS.regular }}>
              Loading {selectedNet} plans…
            </Text>
          </View>
        )}

        {/* Data plan tabs + list */}
        {isData && selectedNet && !fetchingPlans && (
          <View style={S.section}>
            {/* Category tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.tabScroll} contentContainerStyle={S.tabRow}>
              {availableTabs.map(t => {
                const active = planTab === t;
                return (
                  <TouchableOpacity key={t}
                    style={[S.tab, active && { backgroundColor: cfg.color }]}
                    onPress={() => selectTab(t)} activeOpacity={0.75}
                  >
                    <MaterialCommunityIcons
                      name={TAB_ICONS[t]}
                      size={13}
                      color={active ? '#fff' : colors.textMuted}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[S.tabTxt, active && { color: '#fff', fontFamily: FONTS.bold }]}>
                      {TAB_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Night plan banner */}
            {planTab === 'night' && (
              <View style={[S.nightBanner, { backgroundColor: '#1E1B4B' }]}>
                <MaterialCommunityIcons name="weather-night" size={16} color="#A78BFA" />
                <Text style={S.nightBannerTxt}>Valid midnight – 5am only. Data resets daily.</Text>
              </View>
            )}

            {/* Plan list */}
            <Text style={[S.sectionLabel, { marginTop: 14 }]}>
              {selectedNet.toUpperCase()} {TAB_LABELS[planTab].toUpperCase()} PLANS
            </Text>
            <View style={S.planList}>
              {activePlans.map(p => {
                const sel = selectedCode === p.code;
                return (
                  <TouchableOpacity key={p.code}
                    style={[S.planRow, sel && { borderColor: cfg.color, backgroundColor: cfg.color + '08' }]}
                    onPress={() => { feedbackSelect(); setSelectedCode(p.code); }} activeOpacity={0.7}
                  >
                    <View style={S.planLeft}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[S.planName, sel && { color: cfg.color }]}>{p.name}</Text>
                        {p.tag ? (
                          <View style={[S.planTag, { backgroundColor: sel ? cfg.color : cfg.color + '20' }]}>
                            <Text style={[S.planTagTxt, { color: sel ? '#fff' : cfg.color }]}>{p.tag}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={S.planDuration}>{p.duration}</Text>
                    </View>
                    <View style={S.planRight}>
                      <Text style={[S.planPrice, sel && { color: cfg.color }]}>
                        ₦{p.price.toLocaleString('en-NG')}
                      </Text>
                      <View style={[S.planRadio, sel
                        ? { backgroundColor: cfg.color, borderColor: cfg.color }
                        : { borderColor: colors.border }]}>
                        {sel && <View style={S.planDot} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* TV plan list */}
        {isTV && selectedNet && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>{selectedNet.toUpperCase()} PACKAGES</Text>
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
            ) : null}
          </View>
        )}

        {/* Data prompt (no network selected yet) */}
        {isData && !selectedNet && !fetchingPlans && (
          <View style={[S.section, { alignItems: 'center', paddingVertical: 20 }]}>
            <MaterialCommunityIcons name="wifi-off" size={36} color={colors.textMuted} />
            <Text style={[S.emptyPlans, { color: colors.textMuted, marginTop: 10 }]}>Select a network to see plans</Text>
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
                  <TouchableOpacity key={a}
                    style={[S.chip, sel && { borderColor: cfg.color, backgroundColor: cfg.color + '12' }]}
                    onPress={() => { feedbackSelect(); setAmountChip(a); setCustomAmt(''); }} activeOpacity={0.7}
                  >
                    <Text style={[S.chipTxt, sel && { color: cfg.color, fontFamily: FONTS.bold }]}>
                      ₦{parseInt(a).toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={[S.inputWrap, { marginTop: 12 }]}>
              <TextInput style={S.input} placeholder="Or enter a custom amount"
                placeholderTextColor={colors.textMuted} keyboardType="number-pad"
                value={customAmt} onChangeText={v => { setCustomAmt(v); setAmountChip(''); }} />
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
            <TouchableOpacity style={[S.confirmBtn, { backgroundColor: cfg.color }]} onPress={handlePay} activeOpacity={0.82}>
              <Text style={S.confirmBtnTxt}>Confirm & Pay</Text>
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
                <TouchableOpacity style={[S.resultBtn, { backgroundColor: cfg.color }]}
                  onPress={() => { setResult(null); navigation.goBack(); }} activeOpacity={0.82}>
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
                <TouchableOpacity style={[S.resultBtn, { backgroundColor: cfg.color }]}
                  onPress={() => setResult(null)} activeOpacity={0.82}>
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    backBtn:{ width: 38, height: 38, borderRadius: 12, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
    headerTitle: { color: C.text, fontSize: 17, fontFamily: FONTS.bold },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },

    hero: { flexDirection: 'row', alignItems: 'center', gap: 14, borderLeftWidth: 3, paddingLeft: 14, marginBottom: 26, marginTop: 4 },
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

    // Plan tabs
    tabScroll: { marginBottom: 0 },
    tabRow:    { flexDirection: 'row', gap: 8, paddingRight: 4 },
    tab: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
      backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    },
    tabTxt: { color: C.textMuted, fontSize: 13, fontFamily: FONTS.semibold },

    // Night banner
    nightBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 10, marginTop: 10 },
    nightBannerTxt: { color: '#A78BFA', fontSize: 12, fontFamily: FONTS.regular, flex: 1 },

    planList:     { gap: 8 },
    planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card, paddingHorizontal: 14, paddingVertical: 13 },
    planLeft:     { flex: 1 },
    planName:     { color: C.text, fontSize: 14, fontFamily: FONTS.semibold },
    planDuration: { color: C.textMuted, fontSize: 11, fontFamily: FONTS.regular, marginTop: 2 },
    planTag:      { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    planTagTxt:   { fontSize: 9, fontFamily: FONTS.bold, letterSpacing: 0.3 },
    planRight:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
    planPrice:    { color: C.text, fontSize: 14, fontFamily: FONTS.bold },
    planRadio:    { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    planDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
    emptyPlans:   { fontSize: 13, fontFamily: FONTS.regular, textAlign: 'center' },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip:    { borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card, paddingHorizontal: 16, paddingVertical: 11 },
    chipTxt: { color: C.text, fontSize: 13, fontFamily: FONTS.semibold },

    payBtn:    { height: 56, borderRadius: 16, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    payBtnTxt: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },

    loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#00000066', alignItems: 'center', justifyContent: 'center' },
    loadingCard:    { borderRadius: 18, padding: 28, alignItems: 'center', gap: 14, minWidth: 160 },
    loadingTxt:     { fontSize: 14, fontFamily: FONTS.medium },

    overlay:      { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
    sheet:        { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
    sheetHandle:  { width: 40, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    sheetTitle:   { fontSize: 18, fontFamily: FONTS.bold, marginBottom: 20 },
    confirmRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1 },
    confirmLabel: { fontSize: 13, fontFamily: FONTS.regular },
    confirmValue: { fontSize: 13, fontFamily: FONTS.semibold, maxWidth: '60%', textAlign: 'right' },
    confirmBtn:   { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
    confirmBtnTxt:{ color: '#fff', fontSize: 16, fontFamily: FONTS.bold },
    cancelBtn:    { alignItems: 'center', paddingVertical: 14 },
    cancelTxt:    { fontSize: 14, fontFamily: FONTS.medium },

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
