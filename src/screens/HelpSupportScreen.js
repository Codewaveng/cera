import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { submitSupportTicket } from '../services/api';
import { feedbackSuccess, feedbackError } from '../utils/feedback';
import AppModal from '../components/AppModal';

const FAQS = [
  { q: 'How long does a conversion take?', a: 'Most conversions complete within 5–10 minutes. Bank transfers may take slightly longer depending on your bank.' },
  { q: 'What are the fees?', a: 'CERA charges a 1.5% fee on all conversions. This covers processing and transfer costs. There are no hidden charges.' },
  { q: 'Which cryptocurrencies are supported?', a: 'Currently BTC, ETH, USDT, BNB, and SOL. We are adding more assets soon.' },
  { q: 'What is the minimum conversion amount?', a: 'Minimums vary by asset: USDT $1, BTC 0.0001, ETH 0.001, BNB 0.01, SOL 0.1.' },
  { q: 'How do I add my bank account?', a: 'Go to Profile → Bank Accounts → Add Bank Account. Enter your account number and select your bank.' },
  { q: 'How does Auto-Processing work?', a: 'When enabled, any crypto received is automatically converted to Naira and sent to your linked bank account — no manual steps needed.' },
];

const CONTACT = [
  { icon: 'chatbubble-ellipses-outline', color: '#7C3AED', label: 'Live Chat', desc: 'Create a support ticket below', action: 'ticket' },
  { icon: 'mail-outline',               color: '#10B981', label: 'Email Support', desc: 'support@cera.ng · 24h response', action: 'email' },
  { icon: 'logo-whatsapp',             color: '#25D366', label: 'WhatsApp', desc: '+234 800 000 0000', action: 'whatsapp' },
];

export default function HelpSupportScreen({ navigation }) {
  const { colors } = useTheme();
  const S = useMemo(() => makeStyles(colors), [colors]);
  const [expanded, setExpanded]   = useState(null);
  const [ticketModal, setTicketModal] = useState(false);
  const [subject, setSubject]     = useState('');
  const [message, setMessage]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [successModal, setSuccessModal] = useState(false);

  function handleContact(action) {
    if (action === 'ticket') { setTicketModal(true); return; }
    if (action === 'email')   { Linking.openURL('mailto:support@cera.ng'); return; }
    if (action === 'whatsapp') { Linking.openURL('https://wa.me/2348000000000'); return; }
  }

  async function handleSubmit() {
    if (!subject.trim() || !message.trim()) { setError('Please fill in subject and message'); return; }
    setError('');
    setSubmitting(true);
    try {
      await submitSupportTicket({ subject: subject.trim(), message: message.trim() });
      feedbackSuccess();
      setTicketModal(false);
      setSubject('');
      setMessage('');
      setSuccessModal(true);
    } catch (err) {
      feedbackError();
      setError(err?.response?.data?.error || 'Failed to submit. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

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

        <Text style={S.sectionLabel}>CONTACT US</Text>
        <View style={S.contactCard}>
          {CONTACT.map((c, idx) => (
            <TouchableOpacity
              key={c.label}
              style={[S.contactRow, idx < CONTACT.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              activeOpacity={0.7}
              onPress={() => handleContact(c.action)}
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
              <Ionicons name={expanded === idx ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
            </View>
            {expanded === idx && <Text style={S.faqA}>{faq.a}</Text>}
          </TouchableOpacity>
        ))}

      </ScrollView>

      {/* Support ticket modal */}
      <Modal visible={ticketModal} transparent animationType="slide" onRequestClose={() => setTicketModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableOpacity style={S.overlay} activeOpacity={1} onPress={() => setTicketModal(false)}>
            <View style={[S.sheet, { backgroundColor: colors.card }]}>
              <View style={S.sheetHandle} />
              <Text style={[S.sheetTitle, { color: colors.text }]}>Create Support Ticket</Text>
              <Text style={[S.sheetSub, { color: colors.textSecondary }]}>We typically respond within 24 hours.</Text>

              <Text style={[S.inputLabel, { color: colors.textSecondary }]}>Subject</Text>
              <TextInput
                style={[S.sheetInput, { backgroundColor: colors.inputBg || colors.bg, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. Transaction not credited"
                placeholderTextColor={colors.textMuted}
                value={subject}
                onChangeText={t => { setSubject(t); setError(''); }}
                maxLength={100}
              />

              <Text style={[S.inputLabel, { color: colors.textSecondary }]}>Message</Text>
              <TextInput
                style={[S.sheetInput, S.sheetTextarea, { backgroundColor: colors.inputBg || colors.bg, borderColor: colors.border, color: colors.text }]}
                placeholder="Describe your issue in detail…"
                placeholderTextColor={colors.textMuted}
                value={message}
                onChangeText={t => { setMessage(t); setError(''); }}
                multiline
                numberOfLines={4}
                maxLength={1000}
                textAlignVertical="top"
              />

              {!!error && (
                <View style={S.errorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                  <Text style={[S.errorText, { color: colors.error }]}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[S.submitBtn, { backgroundColor: '#7C3AED', opacity: submitting ? 0.6 : 1 }]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={S.submitBtnText}>Submit Ticket</Text>
                }
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      <AppModal
        visible={successModal}
        type="success"
        title="Ticket Submitted!"
        message="We've received your message and will respond within 24 hours. Check your email for updates."
        primaryLabel="Done"
        onClose={() => setSuccessModal(false)}
        onPrimary={() => setSuccessModal(false)}
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
    scroll: { paddingHorizontal: 20, paddingBottom: 60 },

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

    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    sheetHandle: { width: 40, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    sheetTitle: { fontSize: 18, fontFamily: FONTS.bold, marginBottom: 4 },
    sheetSub: { fontSize: 13, fontFamily: FONTS.regular, marginBottom: 18 },
    inputLabel: { fontSize: 12, fontFamily: FONTS.semibold, marginBottom: 6 },
    sheetInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, fontFamily: FONTS.medium, marginBottom: 14 },
    sheetTextarea: { height: 100, paddingTop: 12 },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    errorText: { fontSize: 12, fontFamily: FONTS.medium },
    submitBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
    submitBtnText: { color: '#fff', fontSize: 15, fontFamily: FONTS.bold },
  });
}
