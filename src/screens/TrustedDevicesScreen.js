import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { feedbackLight } from '../utils/feedback';
import { getTrustedDevices } from '../services/api';

export default function TrustedDevicesScreen({ navigation }) {
  const { colors } = useTheme();
  const S = useMemo(() => makeStyles(colors), [colors]);

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrustedDevices()
      .then(res => setDevices(res.data.devices || []))
      .catch(() => setDevices([]))
      .finally(() => setLoading(false));
  }, []);

  function deviceIcon(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('tablet') || t.includes('ipad')) return 'tablet-portrait-outline';
    return 'phone-portrait-outline';
  }

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => { feedbackLight(); navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={S.title}>Trusted Devices</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
        ) : devices.length === 0 ? (
          <View style={S.empty}>
            <Ionicons name="phone-portrait-outline" size={52} color={colors.textMuted} />
            <Text style={S.emptyTitle}>No Devices Found</Text>
            <Text style={S.emptyDesc}>Logged-in devices will appear here.</Text>
          </View>
        ) : (
          <View style={S.card}>
            {devices.map((d, idx) => (
              <View key={d._id || idx} style={[S.row, idx < devices.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={[S.iconBox, { backgroundColor: colors.primary + '18' }]}>
                  <Ionicons name={deviceIcon(d.deviceType)} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.deviceName}>{d.deviceName || d.deviceType || 'Unknown Device'}</Text>
                  <Text style={S.deviceSub}>
                    {d.location || 'Unknown location'} · Last active {d.lastActive ? new Date(d.lastActive).toLocaleDateString('en-NG') : 'recently'}
                  </Text>
                </View>
                {d.isCurrent && (
                  <View style={[S.badge, { backgroundColor: colors.success + '18', borderColor: colors.success + '35' }]}>
                    <Text style={[S.badgeText, { color: colors.success }]}>This device</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
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
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    card: { backgroundColor: C.card, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
    row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    deviceName: { color: C.text, fontSize: 14, fontFamily: FONTS.semibold },
    deviceSub: { color: C.textSecondary, fontSize: 11, fontFamily: FONTS.regular, marginTop: 2 },
    badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
    badgeText: { fontSize: 11, fontFamily: FONTS.semibold },
    empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
    emptyTitle: { color: C.text, fontSize: 16, fontFamily: FONTS.bold },
    emptyDesc: { color: C.textMuted, fontSize: 13, fontFamily: FONTS.regular, textAlign: 'center' },
  });
}
