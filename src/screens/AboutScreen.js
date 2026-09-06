import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

const LINKS = [
  { icon: 'document-text-outline', color: '#7C3AED', label: 'Privacy Policy' },
  { icon: 'shield-outline', color: '#10B981', label: 'Terms of Service' },
  { icon: 'code-slash-outline', color: '#627EEA', label: 'Open Source Licenses' },
  { icon: 'star-outline', color: '#F59E0B', label: 'Rate CERA on App Store' },
];

const SOCIAL = [
  { icon: 'logo-twitter', color: '#1DA1F2', label: 'Twitter / X' },
  { icon: 'logo-instagram', color: '#E1306C', label: 'Instagram' },
  { icon: 'logo-linkedin', color: '#0A66C2', label: 'LinkedIn' },
];

export default function AboutScreen({ navigation }) {
  const { colors } = useTheme();
  const S = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={S.title}>About CERA</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>

        <View style={S.logoSection}>
          <LinearGradient colors={['#4C1D95', '#7C3AED']} style={S.logoBox}>
            <Text style={S.logoC}>C</Text>
            <Text style={S.logoERA}>ERA</Text>
          </LinearGradient>
          <Text style={S.appName}>CERA</Text>
          <Text style={S.appVersion}>Version 1.0.0</Text>
          <View style={S.buildChip}>
            <Ionicons name="construct-outline" size={12} color={colors.textMuted} />
            <Text style={S.buildText}>Build 2025.08.001</Text>
          </View>
        </View>

        <View style={S.missionCard}>
          <Ionicons name="rocket-outline" size={20} color={colors.primary} />
          <View>
            <Text style={S.missionTitle}>Our Mission</Text>
            <Text style={S.missionText}>
              CERA makes it effortless for Nigerians to convert crypto to Naira, fast and securely. We bridge the gap between digital assets and everyday money.
            </Text>
          </View>
        </View>

        <Text style={S.sectionLabel}>APP INFO</Text>
        <View style={S.card}>
          {[
            { label: 'App Version', value: '1.0.0' },
            { label: 'Platform', value: 'iOS & Android' },
            { label: 'Supported Assets', value: 'BTC, ETH, USDT, BNB, SOL' },
            { label: 'Headquarters', value: 'Lagos, Nigeria' },
          ].map((row, idx, arr) => (
            <View key={row.label} style={[S.infoRow, idx < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <Text style={S.infoLabel}>{row.label}</Text>
              <Text style={S.infoValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <Text style={S.sectionLabel}>LEGAL</Text>
        <View style={S.card}>
          {LINKS.map((l, idx) => (
            <TouchableOpacity key={l.label} style={[S.linkRow, idx < LINKS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]} activeOpacity={0.7}>
              <View style={[S.linkIcon, { backgroundColor: l.color + '18' }]}>
                <Ionicons name={l.icon} size={18} color={l.color} />
              </View>
              <Text style={S.linkLabel}>{l.label}</Text>
              <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={S.sectionLabel}>FOLLOW US</Text>
        <View style={S.card}>
          {SOCIAL.map((s, idx) => (
            <TouchableOpacity key={s.label} style={[S.linkRow, idx < SOCIAL.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]} activeOpacity={0.7}>
              <View style={[S.linkIcon, { backgroundColor: s.color + '18' }]}>
                <Ionicons name={s.icon} size={18} color={s.color} />
              </View>
              <Text style={S.linkLabel}>{s.label}</Text>
              <Ionicons name="open-outline" size={15} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={S.footer}>Made with care in Nigeria</Text>

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

    logoSection: { alignItems: 'center', paddingVertical: 24, gap: 8 },
    logoBox: { width: 80, height: 80, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    logoC: { color: '#fff', fontSize: 28, fontFamily: FONTS.extrabold },
    logoERA: { color: 'rgba(255,255,255,0.75)', fontSize: 20, fontFamily: FONTS.bold },
    appName: { color: C.text, fontSize: 22, fontFamily: FONTS.extrabold },
    appVersion: { color: C.textSecondary, fontSize: 14, fontFamily: FONTS.regular },
    buildChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.card, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.border },
    buildText: { color: C.textMuted, fontSize: 11, fontFamily: FONTS.regular },

    missionCard: { flexDirection: 'row', gap: 12, backgroundColor: C.primary + '10', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: C.primary + '25', alignItems: 'flex-start' },
    missionTitle: { color: C.primary, fontSize: 13, fontFamily: FONTS.bold, marginBottom: 4 },
    missionText: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.regular, lineHeight: 20 },

    sectionLabel: { color: C.textMuted, fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 1, marginBottom: 10, marginTop: 4 },
    card: { backgroundColor: C.card, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginBottom: 20 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
    infoLabel: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.regular },
    infoValue: { color: C.text, fontSize: 13, fontFamily: FONTS.semibold },
    linkRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    linkIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    linkLabel: { color: C.text, fontSize: 14, fontFamily: FONTS.medium, flex: 1 },

    footer: { color: C.textMuted, fontSize: 12, fontFamily: FONTS.regular, textAlign: 'center', marginTop: 8 },
  });
}
