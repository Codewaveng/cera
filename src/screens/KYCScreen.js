import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { submitKYC } from '../services/api';
import { feedbackLight, feedbackSelect, feedbackSuccess, feedbackError } from '../utils/feedback';
import AppModal from '../components/AppModal';

const STEP_DEFS = [
  { title: 'Personal Info', desc: 'Full name, date of birth, address', icon: 'person-outline' },
  { title: 'Identity Document', desc: 'NIN, BVN or International Passport', icon: 'id-card-outline' },
  { title: 'Selfie Verification', desc: 'Take a live photo for face match', icon: 'camera-outline' },
  { title: 'Review & Approval', desc: 'We verify your documents (1–2 days)', icon: 'shield-outline' },
];

function getSteps(kycStatus) {
  if (kycStatus === 'verified') {
    return STEP_DEFS.map((s) => ({ ...s, status: 'done' }));
  }
  if (kycStatus === 'pending') {
    return STEP_DEFS.map((s, i) => ({ ...s, status: i < 2 ? 'done' : i === 2 ? 'pending' : 'locked' }));
  }
  // not_started / null
  return STEP_DEFS.map((s, i) => ({ ...s, status: i === 0 ? 'done' : i === 1 ? 'pending' : 'locked' }));
}

export default function KYCScreen({ navigation }) {
  const { colors } = useTheme();
  const S = useMemo(() => makeStyles(colors), [colors]);
  const { user, refreshUser } = useAuth();

  const kycStatus = user?.kycStatus || 'not_started';
  const steps = getSteps(kycStatus);
  const completedSteps = steps.filter((s) => s.status === 'done').length;
  const isVerified = kycStatus === 'verified';

  const [kycModal, setKycModal] = useState(false);
  const [nin, setNin] = useState('');
  const [bvn, setBvn] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successModal, setSuccessModal] = useState(false);

  async function handleSubmit() {
    if (!nin.trim() && !bvn.trim()) { setError('Enter your NIN or BVN'); return; }
    feedbackSelect();
    setError('');
    setSubmitting(true);
    try {
      await submitKYC({ nin: nin.trim() || undefined, bvn: bvn.trim() || undefined });
      feedbackSuccess();
      refreshUser({ kycStatus: 'pending' });
      setKycModal(false);
      setSuccessModal(true);
      setNin('');
      setBvn('');
    } catch (err) {
      feedbackError();
      setError(err?.response?.data?.error || 'Submission failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => { feedbackLight(); navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={S.title}>Identity Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>

        <LinearGradient
          colors={isVerified ? ['#065F46', '#10B981'] : kycStatus === 'pending' ? ['#1e3a5f', '#2563EB'] : ['#4C1D95', '#7C3AED']}
          style={S.heroBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={S.heroDecoA} />
          <View style={S.heroDecoB} />
          <View style={S.heroIcon}>
            <Ionicons
              name={isVerified ? 'shield-checkmark' : kycStatus === 'pending' ? 'time-outline' : 'shield-outline'}
              size={32}
              color="#fff"
            />
          </View>
          <Text style={S.heroTitle}>
            {isVerified ? 'Verified' : kycStatus === 'pending' ? 'Under Review' : 'Unverified'}
          </Text>
          <Text style={S.heroSub}>
            {isVerified
              ? 'Your identity is fully verified'
              : kycStatus === 'pending'
              ? 'Your documents are being reviewed (1–2 days)'
              : `${completedSteps} of ${steps.length} steps completed`}
          </Text>
        </LinearGradient>

        <View style={S.statusRow}>
          <View style={[S.statusChip, {
            backgroundColor: isVerified ? colors.success + '15' : kycStatus === 'pending' ? '#2563EB15' : colors.warning + '15',
            borderColor: isVerified ? colors.success + '35' : kycStatus === 'pending' ? '#2563EB35' : colors.warning + '35',
          }]}>
            <View style={[S.statusDot, { backgroundColor: isVerified ? colors.success : kycStatus === 'pending' ? '#2563EB' : colors.warning }]} />
            <Text style={[S.statusChipText, { color: isVerified ? colors.success : kycStatus === 'pending' ? '#2563EB' : colors.warning }]}>
              {isVerified ? 'Verified Account' : kycStatus === 'pending' ? 'Review in Progress' : 'Unverified Account'}
            </Text>
          </View>
        </View>

        <Text style={S.sectionLabel}>VERIFICATION STEPS</Text>

        {steps.map((s, i) => (
          <View key={i} style={[S.stepCard, s.status === 'pending' && { borderColor: colors.primary + '60' }]}>
            <View style={[S.stepIconWrap, {
              backgroundColor: s.status === 'done' ? colors.success + '18' : s.status === 'pending' ? colors.primary + '18' : colors.border + '50',
            }]}>
              <Ionicons
                name={s.status === 'done' ? 'checkmark-circle' : s.icon}
                size={22}
                color={s.status === 'done' ? colors.success : s.status === 'pending' ? colors.primary : colors.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[S.stepTitle, s.status === 'locked' && { color: colors.textMuted }]}>{s.title}</Text>
              <Text style={S.stepDesc}>{s.desc}</Text>
            </View>
            {s.status === 'done' && <Ionicons name="checkmark-circle" size={18} color={colors.success} />}
            {s.status === 'pending' && (
              <View style={S.pendingChip}>
                <Text style={S.pendingChipText}>Continue</Text>
              </View>
            )}
            {s.status === 'locked' && <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />}
          </View>
        ))}

        {!isVerified && kycStatus !== 'pending' && (
          <TouchableOpacity activeOpacity={0.85} style={S.ctaBtn} onPress={() => { feedbackSelect(); setKycModal(true); }}>
            <LinearGradient colors={['#7C3AED', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.ctaBtnInner}>
              <Ionicons name="id-card-outline" size={18} color="#fff" />
              <Text style={S.ctaBtnText}>Submit NIN / BVN</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* NIN/BVN input modal */}
      <Modal visible={kycModal} transparent animationType="slide" onRequestClose={() => setKycModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableOpacity style={S.overlay} activeOpacity={1} onPress={() => setKycModal(false)}>
            <View style={[S.sheet, { backgroundColor: colors.surface }]}>
              <View style={S.sheetHandle} />
              <Text style={[S.sheetTitle, { color: colors.text }]}>Identity Document</Text>
              <Text style={[S.sheetSub, { color: colors.textSecondary }]}>
                Enter your NIN (11 digits) or BVN (11 digits) to verify your identity.
              </Text>

              <Text style={[S.inputLabel, { color: colors.textSecondary }]}>NIN</Text>
              <TextInput
                style={[S.sheetInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter your NIN"
                placeholderTextColor={colors.textMuted}
                value={nin}
                onChangeText={(t) => { setNin(t.replace(/\D/g, '').slice(0, 11)); setError(''); }}
                keyboardType="number-pad"
                maxLength={11}
              />

              <Text style={[S.inputLabel, { color: colors.textSecondary }]}>BVN</Text>
              <TextInput
                style={[S.sheetInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter your BVN"
                placeholderTextColor={colors.textMuted}
                value={bvn}
                onChangeText={(t) => { setBvn(t.replace(/\D/g, '').slice(0, 11)); setError(''); }}
                keyboardType="number-pad"
                maxLength={11}
              />

              {!!error && (
                <View style={S.errorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                  <Text style={[S.errorText, { color: colors.error }]}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[S.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#7C3AED', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.submitBtnInner}>
                  {submitting
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <><Ionicons name="shield-checkmark-outline" size={16} color="#fff" /><Text style={S.submitBtnText}>Submit for Verification</Text></>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      <AppModal
        visible={successModal}
        type="success"
        title="Submitted!"
        message="Your identity documents are under review. This usually takes 1–2 business days."
        primaryLabel="Got it"
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

    heroBanner: { borderRadius: 20, padding: 22, marginBottom: 14, overflow: 'hidden', alignItems: 'center', gap: 6 },
    heroDecoA: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.07)' },
    heroDecoB: { position: 'absolute', bottom: -40, left: -20, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.05)' },
    heroIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    heroTitle: { color: '#fff', fontSize: 22, fontFamily: FONTS.extrabold },
    heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: FONTS.regular, textAlign: 'center' },

    statusRow: { alignItems: 'flex-start', marginBottom: 22 },
    statusChip: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusChipText: { fontSize: 12, fontFamily: FONTS.semibold },

    sectionLabel: { color: C.textMuted, fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 1, marginBottom: 10 },

    stepCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
    stepIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    stepTitle: { color: C.text, fontSize: 14, fontFamily: FONTS.semibold },
    stepDesc: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },
    pendingChip: { backgroundColor: C.primary + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.primary + '40' },
    pendingChipText: { color: C.primary, fontSize: 12, fontFamily: FONTS.semibold },

    ctaBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 20 },
    ctaBtnInner: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    ctaBtnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },

    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 20 },
    sheetTitle: { fontSize: 18, fontFamily: FONTS.bold, marginBottom: 6 },
    sheetSub: { fontSize: 13, fontFamily: FONTS.regular, lineHeight: 19, marginBottom: 20 },
    inputLabel: { fontSize: 12, fontFamily: FONTS.semibold, marginBottom: 6 },
    sheetInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: FONTS.medium, marginBottom: 14 },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    errorText: { fontSize: 12, fontFamily: FONTS.medium },
    submitBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 6 },
    submitBtnInner: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    submitBtnText: { color: '#fff', fontSize: 15, fontFamily: FONTS.bold },
  });
}
