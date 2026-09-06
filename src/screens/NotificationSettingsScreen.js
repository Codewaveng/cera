import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { feedbackLight } from '../utils/feedback';

const NOTIF_SECTIONS = [
  {
    title: 'Transactions',
    items: [
      { id: 'txSuccess', icon: 'checkmark-circle-outline', color: '#10B981', label: 'Transaction Successful', desc: 'When your crypto is converted', defaultOn: true },
      { id: 'txFailed', icon: 'close-circle-outline', color: '#EF4444', label: 'Transaction Failed', desc: 'When a conversion fails', defaultOn: true },
      { id: 'txPending', icon: 'time-outline', color: '#6366F1', label: 'Transaction Pending', desc: 'While processing a conversion', defaultOn: true },
    ],
  },
  {
    title: 'Market & Rates',
    items: [
      { id: 'rateAlert', icon: 'trending-up-outline', color: '#F59E0B', label: 'Rate Alerts', desc: 'When rates move significantly', defaultOn: false },
      { id: 'priceDrop', icon: 'trending-down-outline', color: '#EF4444', label: 'Price Drop Alerts', desc: 'When crypto prices drop 5%+', defaultOn: false },
    ],
  },
  {
    title: 'Account & Security',
    items: [
      { id: 'login', icon: 'log-in-outline', color: '#627EEA', label: 'New Login', desc: 'Unfamiliar device login alert', defaultOn: true },
      { id: 'security', icon: 'shield-outline', color: '#7C3AED', label: 'Security Alerts', desc: 'Password and PIN changes', defaultOn: true },
    ],
  },
  {
    title: 'Promotions',
    items: [
      { id: 'offers', icon: 'gift-outline', color: '#EC4899', label: 'Offers & Promotions', desc: 'Special deals and bonuses', defaultOn: false },
      { id: 'news', icon: 'newspaper-outline', color: '#06B6D4', label: 'News & Updates', desc: 'CERA feature updates', defaultOn: false },
    ],
  },
];

const STORAGE_KEY = 'cera_notif_settings';

export default function NotificationSettingsScreen({ navigation }) {
  const { colors } = useTheme();
  const S = useMemo(() => makeStyles(colors), [colors]);
  const [settings, setSettings] = useState(() => {
    const init = {};
    NOTIF_SECTIONS.forEach((s) => s.items.forEach((i) => { init[i.id] = i.defaultOn; }));
    return init;
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) setSettings(JSON.parse(val));
    }).catch(() => {});
  }, []);

  const toggle = (id) => {
    setSettings((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => { feedbackLight(); navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={S.title}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>
        {NOTIF_SECTIONS.map((section) => (
          <View key={section.title} style={S.section}>
            <Text style={S.sectionLabel}>{section.title.toUpperCase()}</Text>
            <View style={S.sectionCard}>
              {section.items.map((item, idx) => (
                <View
                  key={item.id}
                  style={[S.row, idx < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                >
                  <View style={[S.rowIcon, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.rowLabel}>{item.label}</Text>
                    <Text style={S.rowDesc}>{item.desc}</Text>
                  </View>
                  <Switch
                    value={settings[item.id]}
                    onValueChange={() => toggle(item.id)}
                    trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor={colors.switchTrackOff}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
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
    section: { marginBottom: 20 },
    sectionLabel: { color: C.textMuted, fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 1, marginBottom: 10 },
    sectionCard: { backgroundColor: C.card, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
    row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { color: C.text, fontSize: 14, fontFamily: FONTS.medium },
    rowDesc: { color: C.textSecondary, fontSize: 11, fontFamily: FONTS.regular, marginTop: 2 },
  });
}
