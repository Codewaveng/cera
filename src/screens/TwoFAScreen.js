import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { feedbackLight, feedbackSuccess } from '../utils/feedback';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppModal from '../components/AppModal';

export default function TwoFAScreen({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const S = useMemo(() => makeStyles(colors), [colors]);
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  async function handleEnable() {
    setLoading(true);
    try {
      await AsyncStorage.setItem('cera_2fa_enabled', 'true');
      feedbackSuccess();
      setSuccessModal(true);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => { feedbackLight(); navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={S.title}>Two-Factor Auth</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>
        <LinearGradient colors={['#0C4A6E', '#0369A1', '#0284C7']} style={S.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={S.heroIcon}>
            <Ionicons name="shield-checkmark" size={42} color="#7DD3FC" />
          </View>
          <Text style={S.heroTitle}>Extra Layer of Security</Text>
          <Text style={S.heroDesc}>A one-time code will be sent to your email each time you log in from a new device.</Text>
        </LinearGradient>

        <View style={S.card}>
          {[
            'OTP sent to your registered email',
            'Required only on new device logins',
            'Codes expire in 10 minutes',
          ].map((item, i) => (
            <View key={i} style={S.infoRow}>
              <View style={S.dot} />
              <Text style={S.infoText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={S.emailBox}>
          <Text style={S.emailLabel}>OTP will be sent to</Text>
          <Text style={S.emailValue}>{user?.email || 'your registered email'}</Text>
        </View>

        <TouchableOpacity style={S.btn} onPress={handleEnable} activeOpacity={0.85} disabled={loading}>
          <LinearGradient colors={['#0284C7', '#0369A1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.btnInner}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
                <Text style={S.btnText}>Enable 2FA</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <AppModal
        visible={successModal}
        type="success"
        title="2FA Enabled"
        message={`A one-time code will be sent to ${user?.email || 'your email'} each time you log in from a new device.`}
        primaryLabel="Done"
        onClose={() => { setSuccessModal(false); navigation.goBack(); }}
        onPrimary={() => { setSuccessModal(false); navigation.goBack(); }}
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
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    hero: { borderRadius: 22, padding: 26, marginBottom: 20, alignItems: 'center' },
    heroIcon: { width: 76, height: 76, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    heroTitle: { color: '#fff', fontSize: 20, fontFamily: FONTS.bold, marginBottom: 8, textAlign: 'center' },
    heroDesc: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 20 },
    card: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 16, gap: 14 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0284C7' },
    infoText: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.regular },
    emailBox: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 20 },
    emailLabel: { color: C.textMuted, fontSize: 11, fontFamily: FONTS.medium, marginBottom: 4 },
    emailValue: { color: C.text, fontSize: 15, fontFamily: FONTS.bold },
    btn: { borderRadius: 14, overflow: 'hidden' },
    btnInner: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    btnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },
  });
}
