import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { feedbackLight } from '../utils/feedback';
import { getLoginActivity } from '../services/api';

export default function LoginActivityScreen({ navigation }) {
  const { colors } = useTheme();
  const S = useMemo(() => makeStyles(colors), [colors]);

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLoginActivity()
      .then(res => setSessions(res.data.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
  }

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => { feedbackLight(); navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={S.title}>Login Activity</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
        ) : sessions.length === 0 ? (
          <View style={S.empty}>
            <Ionicons name="time-outline" size={52} color={colors.textMuted} />
            <Text style={S.emptyTitle}>No Activity Yet</Text>
            <Text style={S.emptyDesc}>Your login history will appear here.</Text>
          </View>
        ) : (
          <View style={S.card}>
            {sessions.map((s, idx) => {
              const failed = s.status === 'failed';
              const iconColor = failed ? colors.error : colors.success;
              return (
                <View key={s._id || idx} style={[S.row, idx < sessions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                  <View style={[S.iconBox, { backgroundColor: iconColor + '18' }]}>
                    <Ionicons name={failed ? 'close-circle-outline' : 'checkmark-circle-outline'} size={20} color={iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.sessionLabel}>{failed ? 'Failed Login' : 'Successful Login'}</Text>
                    <Text style={S.sessionSub}>{s.location || 'Unknown location'} · {formatDate(s.createdAt)}</Text>
                    {!!s.deviceType && <Text style={S.sessionDevice}>{s.deviceType}</Text>}
                  </View>
                </View>
              );
            })}
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
    sessionLabel: { color: C.text, fontSize: 14, fontFamily: FONTS.semibold },
    sessionSub: { color: C.textSecondary, fontSize: 11, fontFamily: FONTS.regular, marginTop: 2 },
    sessionDevice: { color: C.textMuted, fontSize: 11, fontFamily: FONTS.regular, marginTop: 1 },
    empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
    emptyTitle: { color: C.text, fontSize: 16, fontFamily: FONTS.bold },
    emptyDesc: { color: C.textMuted, fontSize: 13, fontFamily: FONTS.regular, textAlign: 'center' },
  });
}
