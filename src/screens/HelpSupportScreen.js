import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

const FAQS = [
  { q: 'How long does a conversion take?', a: 'Most conversions complete within 5–10 minutes. Bank transfers may take slightly longer depending on your bank.' },
  { q: 'What are the fees?', a: 'CERA charges a 1.5% fee on all conversions. This covers processing and transfer costs. There are no hidden charges.' },
  { q: 'Which cryptocurrencies are supported?', a: 'Currently BTC, ETH, USDT, BNB, and SOL. We are adding more assets soon.' },
  { q: 'What is the minimum conversion amount?', a: 'Minimums vary by asset: USDT $1, BTC 0.0001, ETH 0.001, BNB 0.01, SOL 0.1.' },
  { q: 'How do I add my bank account?', a: 'Go to Profile → Bank Accounts → Add Bank Account. Enter your account number and select your bank.' },
];

const CONTACT = [
  { icon: 'chatbubble-ellipses-outline', color: '#7C3AED', label: 'Live Chat', desc: 'Average 2-minute response' },
  { icon: 'mail-outline', color: '#10B981', label: 'Email Support', desc: 'support@cera.ng · 24h response' },
  { icon: 'logo-whatsapp', color: '#25D366', label: 'WhatsApp', desc: '+234 800 000 0000' },
];

export default function HelpSupportScreen({ navigation }) {
  const { colors } = useTheme();
  const S = useMemo(() => makeStyles(colors), [colors]);
  const [expanded, setExpanded] = useState(null);

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={S.title}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>

        <View style={S.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <Text style={S.searchPlaceholder}>Search for help...</Text>
        </View>

        <Text style={S.sectionLabel}>CONTACT US</Text>
        <View style={S.contactCard}>
          {CONTACT.map((c, idx) => (
            <TouchableOpacity
              key={c.label}
              style={[S.contactRow, idx < CONTACT.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              activeOpacity={0.7}
            >
              <View style={[S.contactIcon, { backgroundColor: c.color + '18' }]}>
                <Ionicons name={c.icon} size={20} color={c.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.contactLabel}>{c.label}</Text>
                <Text style={S.contactDesc}>{c.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={S.sectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
        {FAQS.map((faq, idx) => (
          <TouchableOpacity
            key={idx}
            style={[S.faqCard, expanded === idx && { borderColor: colors.primary + '40' }]}
            onPress={() => setExpanded(expanded === idx ? null : idx)}
            activeOpacity={0.7}
          >
            <View style={S.faqRow}>
              <Text style={S.faqQ}>{faq.q}</Text>
              <Ionicons
                name={expanded === idx ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textMuted}
              />
            </View>
            {expanded === idx && <Text style={S.faqA}>{faq.a}</Text>}
          </TouchableOpacity>
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

    searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 24 },
    searchPlaceholder: { color: C.textMuted, fontSize: 14, fontFamily: FONTS.regular },

    sectionLabel: { color: C.textMuted, fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 1, marginBottom: 12, marginTop: 4 },

    contactCard: { backgroundColor: C.card, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginBottom: 24 },
    contactRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    contactIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    contactLabel: { color: C.text, fontSize: 14, fontFamily: FONTS.semibold },
    contactDesc: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },

    faqCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
    faqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    faqQ: { color: C.text, fontSize: 14, fontFamily: FONTS.semibold, flex: 1, marginRight: 12 },
    faqA: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.regular, marginTop: 12, lineHeight: 20 },
  });
}
