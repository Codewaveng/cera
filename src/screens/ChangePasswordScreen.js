import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { feedbackLight, feedbackSuccess, feedbackError } from '../utils/feedback';
import { changePassword } from '../services/api';
import AppModal from '../components/AppModal';

export default function ChangePasswordScreen({ navigation }) {
  const { colors } = useTheme();
  const S = useMemo(() => makeStyles(colors), [colors]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successModal, setSuccessModal] = useState(false);

  const canSubmit = currentPassword.length >= 6 && newPassword.length >= 6 && confirmPassword.length >= 6;

  async function handleChange() {
    if (!canSubmit) return;
    if (newPassword !== confirmPassword) { setError("New passwords don't match"); return; }
    if (newPassword.length < 8) { setError('New password must be at least 8 characters'); return; }
    setError('');
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      feedbackSuccess();
      setSuccessModal(true);
    } catch (err) {
      feedbackError();
      setError(err?.response?.data?.error || 'Failed to change password');
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
        <Text style={S.title}>Change Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled">
        <View style={S.card}>
          <View style={S.field}>
            <Text style={S.fieldLabel}>Current Password</Text>
            <View style={S.inputRow}>
              <TextInput
                style={S.input}
                placeholder="Enter current password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showCurrent}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowCurrent(v => !v)} style={S.eyeBtn}>
                <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={S.field}>
            <Text style={S.fieldLabel}>New Password</Text>
            <View style={S.inputRow}>
              <TextInput
                style={S.input}
                placeholder="Min. 8 characters"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNew(v => !v)} style={S.eyeBtn}>
                <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[S.field, { marginBottom: 0 }]}>
            <Text style={S.fieldLabel}>Confirm New Password</Text>
            <View style={S.inputRow}>
              <TextInput
                style={S.input}
                placeholder="Re-enter new password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={S.eyeBtn}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {!!error && (
          <View style={S.errorRow}>
            <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
            <Text style={[S.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[S.btn, !canSubmit && { opacity: 0.45 }]}
          onPress={handleChange}
          activeOpacity={canSubmit ? 0.8 : 1}
          disabled={!canSubmit || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={S.btnText}>Change Password</Text>
          }
        </TouchableOpacity>
      </ScrollView>

      <AppModal
        visible={successModal}
        type="success"
        title="Password Changed"
        message="Your password has been updated successfully."
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
    card: { backgroundColor: C.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: C.border, marginBottom: 14 },
    field: { marginBottom: 16 },
    fieldLabel: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.semibold, marginBottom: 8 },
    inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingRight: 12 },
    input: { flex: 1, paddingHorizontal: 14, paddingVertical: 13, color: C.text, fontSize: 15, fontFamily: FONTS.medium },
    eyeBtn: { padding: 4 },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
    errorText: { fontSize: 13, fontFamily: FONTS.medium },
    btn: { backgroundColor: '#7C3AED', borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
    btnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },
  });
}
