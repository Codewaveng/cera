import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { feedbackLight, feedbackSelect, feedbackSuccess, feedbackError } from '../utils/feedback';
import { verifyPin, changePin } from '../services/api';
import { registerPinCallback } from './PinEntryScreen';
import AppModal from '../components/AppModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

export default function SecurityScreen({ navigation }) {
  const { colors } = useTheme();
  const { token } = useAuth();
  const S = useMemo(() => makeStyles(colors), [colors]);

  const [biometrics, setBiometrics] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [txPin, setTxPin] = useState(true);
  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });

  useFocusEffect(useCallback(() => {
    AsyncStorage.multiGet(['cera_biometrics_enabled', 'cera_2fa_enabled', 'cera_tx_pin_enabled']).then(pairs => {
      setBiometrics(pairs[0][1] === 'true');
      setTwoFA(pairs[1][1] === 'true');
      setTxPin(pairs[2][1] !== 'false');
    });
  }, []));

  async function handleBiometricToggle(val) {
    if (val) {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        if (!hasHardware) {
          setErrorModal({ visible: true, title: 'Not Supported', message: 'Your device does not have biometric hardware (fingerprint or Face ID).' });
          return;
        }
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!isEnrolled) {
          setErrorModal({ visible: true, title: 'Not Set Up', message: 'No biometrics enrolled on this device. Please set up fingerprint or Face ID in your device settings first.' });
          return;
        }
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Enable biometric login for CERA',
          disableDeviceFallback: false,
          cancelLabel: 'Cancel',
        });
        if (result.success) {
          feedbackSuccess();
          await AsyncStorage.setItem('cera_biometrics_enabled', 'true');
          if (token) await AsyncStorage.setItem('cera_bio_token', token);
          setBiometrics(true);
        }
      } catch {
        feedbackError();
      }
    } else {
      await AsyncStorage.removeItem('cera_biometrics_enabled');
      setBiometrics(false);
    }
  }

  function handleTwoFAToggle(val) {
    if (val) {
      navigation.navigate('TwoFA');
    } else {
      AsyncStorage.removeItem('cera_2fa_enabled');
      setTwoFA(false);
    }
  }

  async function handleTxPinToggle(val) {
    await AsyncStorage.setItem('cera_tx_pin_enabled', val ? 'true' : 'false');
    setTxPin(val);
  }

  function handleChangePIN() {
    feedbackSelect();
    let verifiedOldPin = '';
    registerPinCallback('sec_verify', async (pin, { onError, goBack }) => {
      try {
        await verifyPin(pin);
        verifiedOldPin = pin;
        goBack();
        registerPinCallback('sec_new', async (newPin, { goBack: back2 }) => {
          back2();
          registerPinCallback('sec_confirm', async (confirmPin, { onError: onErr3, goBack: back3 }) => {
            if (newPin !== confirmPin) { onErr3("PINs don't match. Try again."); return; }
            try {
              await changePin(verifiedOldPin, newPin);
              feedbackSuccess();
              back3();
              setSuccessModal(true);
            } catch (err) {
              onErr3(err?.response?.data?.error || 'Failed to change PIN');
            }
          });
          navigation.navigate('PinEntry', { title: 'Confirm New PIN', subtitle: 'Re-enter your new 4-digit PIN', callbackKey: 'sec_confirm' });
        });
        navigation.navigate('PinEntry', { title: 'Enter New PIN', subtitle: 'Choose a new 4-digit PIN', callbackKey: 'sec_new' });
      } catch (err) {
        onError(err?.response?.data?.error || 'Incorrect PIN');
      }
    });
    navigation.navigate('PinEntry', { title: 'Enter Current PIN', subtitle: 'Verify your identity first', callbackKey: 'sec_verify' });
  }

  const ACTIONS = [
    {
      icon: 'key-outline', color: '#7C3AED', label: 'Change PIN',
      desc: 'Update your 4-digit transaction PIN',
      onPress: handleChangePIN,
    },
    {
      icon: 'lock-closed-outline', color: '#627EEA', label: 'Change Password',
      desc: 'Update your account login password',
      onPress: () => { feedbackSelect(); navigation.navigate('ChangePassword'); },
    },
    {
      icon: 'phone-portrait-outline', color: '#10B981', label: 'Trusted Devices',
      desc: 'Manage your logged-in devices',
      onPress: () => { feedbackSelect(); navigation.navigate('TrustedDevices'); },
    },
    {
      icon: 'time-outline', color: '#F59E0B', label: 'Login Activity',
      desc: 'View recent login sessions',
      onPress: () => { feedbackSelect(); navigation.navigate('LoginActivity'); },
    },
  ];

  const TOGGLES = [
    {
      id: 'bio', icon: 'finger-print-outline', color: '#EC4899',
      label: 'Biometric Login', desc: 'Fingerprint or Face ID',
      val: biometrics, onToggle: handleBiometricToggle,
    },
    {
      id: '2fa', icon: 'shield-checkmark-outline', color: '#06B6D4',
      label: 'Two-Factor Auth', desc: 'Extra security on login',
      val: twoFA, onToggle: handleTwoFAToggle,
    },
    {
      id: 'pin', icon: 'keypad-outline', color: '#F59E0B',
      label: 'Transaction PIN', desc: 'Require PIN for transfers',
      val: txPin, onToggle: handleTxPinToggle,
    },
  ];

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => { feedbackLight(); navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={S.title}>Security & Privacy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>
        <Text style={S.sectionLabel}>SECURITY SETTINGS</Text>
        <View style={S.card}>
          {TOGGLES.map((t, idx) => (
            <View key={t.id} style={[S.row, idx < TOGGLES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={[S.rowIcon, { backgroundColor: t.color + '18' }]}>
                <Ionicons name={t.icon} size={20} color={t.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.rowLabel}>{t.label}</Text>
                <Text style={S.rowDesc}>{t.desc}</Text>
              </View>
              <Switch
                value={t.val}
                onValueChange={t.onToggle}
                trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.switchTrackOff}
              />
            </View>
          ))}
        </View>

        <Text style={S.sectionLabel}>ACCOUNT SECURITY</Text>
        <View style={S.card}>
          {ACTIONS.map((a, idx) => (
            <TouchableOpacity
              key={a.label}
              style={[S.row, idx < ACTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              activeOpacity={0.7}
              onPress={a.onPress}
            >
              <View style={[S.rowIcon, { backgroundColor: a.color + '18' }]}>
                <Ionicons name={a.icon} size={20} color={a.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.rowLabel}>{a.label}</Text>
                <Text style={S.rowDesc}>{a.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={S.dangerZone}>
          <Text style={S.dangerTitle}>Danger Zone</Text>
          <TouchableOpacity
            style={S.dangerBtn}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Delete Account', 'To delete your account, please email us at support@cera.app', [{ text: 'OK' }])}
          >
            <Ionicons name="person-remove-outline" size={18} color={colors.error} />
            <Text style={S.dangerBtnText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AppModal
        visible={successModal}
        type="success"
        title="PIN Changed"
        message="Your transaction PIN has been updated successfully."
        primaryLabel="Done"
        onClose={() => setSuccessModal(false)}
        onPrimary={() => setSuccessModal(false)}
      />

      <AppModal
        visible={errorModal.visible}
        type="error"
        title={errorModal.title}
        message={errorModal.message}
        primaryLabel="OK"
        onClose={() => setErrorModal(m => ({ ...m, visible: false }))}
        onPrimary={() => setErrorModal(m => ({ ...m, visible: false }))}
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
    sectionLabel: { color: C.textMuted, fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 1, marginBottom: 10, marginTop: 4 },
    card: { backgroundColor: C.card, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginBottom: 20 },
    row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { color: C.text, fontSize: 14, fontFamily: FONTS.medium },
    rowDesc: { color: C.textSecondary, fontSize: 11, fontFamily: FONTS.regular, marginTop: 2 },
    dangerZone: { backgroundColor: C.error + '10', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.error + '25' },
    dangerTitle: { color: C.error, fontSize: 13, fontFamily: FONTS.bold, marginBottom: 12 },
    dangerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dangerBtnText: { color: C.error, fontSize: 14, fontFamily: FONTS.semibold },
  });
}
