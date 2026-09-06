import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import * as Clipboard from 'expo-clipboard';
import { feedbackLight, feedbackSelect, feedbackSuccess } from '../utils/feedback';

const HOW_IT_WORKS = [
  { step: 1, icon: 'share-outline', title: 'Share your code', desc: 'Send your referral code to friends' },
  { step: 2, icon: 'person-add-outline', title: 'Friend signs up', desc: 'They enter your code at registration' },
  { step: 3, icon: 'gift-outline', title: 'Both earn ₦500', desc: 'Credited instantly on their signup' },
  { step: 4, icon: 'trending-up-outline', title: 'Earn more cashback', desc: '0.5% back on every crypto conversion' },
];

export default function ReferEarnScreen({ navigation }) {
  const { colors } = useTheme();
  const S = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const referCode = user?.ceraId || 'CERA-????';

  const handleCopy = async () => {
    feedbackSuccess();
    await Clipboard.setStringAsync(referCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    feedbackSelect();
    try {
      await Share.share({
        message: `Join CERA — Nigeria's easiest crypto-to-Naira app! Use my code ${referCode} when you sign up and we both earn ₦500. Download: https://getcera.app`,
        title: 'Join CERA with my referral code',
      });
    } catch {}
  };

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => { feedbackLight(); navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={S.title}>Refer & Earn</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>

        <LinearGradient colors={['#EF4444', '#DC2626']} style={S.heroBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={S.heroDecoA} />
          <View style={S.heroDecoB} />
          <View style={S.heroIconWrap}>
            <Ionicons name="gift-outline" size={32} color="#fff" />
          </View>
          <Text style={S.heroTitle}>Earn ₦500 Per Referral</Text>
          <Text style={S.heroSub}>You and your friend both earn when they complete their first conversion</Text>
        </LinearGradient>

        <View style={S.statsRow}>
          {[
            { label: 'Total Referrals', value: String(user?.referralCount ?? 0) },
            { label: 'Referral Bonus', value: user?.referralEarnings ? `₦${user.referralEarnings.toLocaleString('en-NG')}` : '₦0' },
          ].map((s, i) => (
            <View key={s.label} style={[S.statCard, i < 1 && { marginRight: 10 }]}>
              <Text style={S.statValue}>{s.value}</Text>
              <Text style={S.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={S.codeCard}>
          <Text style={S.codeLabel}>Your Referral Code</Text>
          <Text style={S.codeValue}>{referCode}</Text>
          <View style={S.codeActions}>
            <TouchableOpacity style={[S.codeBtn, copied && { borderColor: colors.success }]} onPress={handleCopy} activeOpacity={0.7}>
              <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={16} color={copied ? colors.success : colors.primary} />
              <Text style={[S.codeBtnText, copied && { color: colors.success }]}>{copied ? 'Copied!' : 'Copy Code'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.codeBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]} activeOpacity={0.7} onPress={handleShare}>
              <Ionicons name="share-outline" size={16} color="#fff" />
              <Text style={[S.codeBtnText, { color: '#fff' }]}>Share Link</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={S.sectionLabel}>HOW IT WORKS</Text>
        {HOW_IT_WORKS.map((h, idx) => (
          <View key={h.step} style={S.howCard}>
            <View style={[S.howStep, { backgroundColor: '#EF4444' + '18' }]}>
              <Text style={S.howStepNum}>{h.step}</Text>
            </View>
            <View style={[S.howIcon, { backgroundColor: '#EF4444' + '18' }]}>
              <Ionicons name={h.icon} size={20} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.howTitle}>{h.title}</Text>
              <Text style={S.howDesc}>{h.desc}</Text>
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

    heroBanner: { borderRadius: 20, padding: 22, marginBottom: 20, overflow: 'hidden', alignItems: 'center', gap: 8 },
    heroDecoA: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.07)' },
    heroDecoB: { position: 'absolute', bottom: -40, left: -20, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.05)' },
    heroIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    heroTitle: { color: '#fff', fontSize: 20, fontFamily: FONTS.extrabold, textAlign: 'center' },
    heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 18 },

    statsRow: { flexDirection: 'row', marginBottom: 20 },
    statCard: { flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border },
    statValue: { color: C.text, fontSize: 16, fontFamily: FONTS.bold, marginBottom: 4 },
    statLabel: { color: C.textSecondary, fontSize: 11, fontFamily: FONTS.regular },

    codeCard: { backgroundColor: C.card, borderRadius: 18, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
    codeLabel: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.medium, marginBottom: 8 },
    codeValue: { color: C.primary, fontSize: 28, fontFamily: FONTS.extrabold, letterSpacing: 3, marginBottom: 16 },
    codeActions: { flexDirection: 'row', gap: 10, width: '100%' },
    codeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, borderWidth: 1.5, borderColor: C.primary + '60', paddingVertical: 10 },
    codeBtnText: { color: C.primary, fontSize: 13, fontFamily: FONTS.semibold },

    sectionLabel: { color: C.textMuted, fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 1, marginBottom: 12 },
    howCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
    howStep: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    howStepNum: { color: '#EF4444', fontSize: 13, fontFamily: FONTS.bold },
    howIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    howTitle: { color: C.text, fontSize: 14, fontFamily: FONTS.semibold },
    howDesc: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },
  });
}
