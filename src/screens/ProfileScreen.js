import React, { useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated,
  ToastAndroid, Platform, Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const MENU_ITEMS = [
  { section: 'Account', items: [
    { label: 'Verify Identity (KYC)', icon: 'shield-checkmark-outline', color: '#7C3AED', badge: 'Pending', screen: 'KYC' },
    { label: 'Bank Accounts', icon: 'card-outline', color: '#10B981', screen: 'BankAccounts' },
    { label: 'Auto Processing', icon: 'flash-outline', color: '#F59E0B', screen: 'AutoProcessingSettings' },
    { label: 'Cards', icon: 'card-outline', color: '#627EEA', screen: 'Cards' },
    { label: 'Notification Settings', icon: 'notifications-outline', color: '#06B6D4', screen: 'NotificationSettings' },
  ]},
  { section: 'App', items: [
    { label: 'Security & Privacy', icon: 'lock-closed-outline', color: '#627EEA', screen: 'Security' },
    { label: 'Refer & Earn', icon: 'gift-outline', color: '#EF4444', badge: '₦500', screen: 'ReferEarn' },
    { label: 'Help & Support', icon: 'headset-outline', color: '#8B5CF6', screen: 'HelpSupport' },
    { label: 'About CERA', icon: 'information-circle-outline', color: '#64748B', screen: 'About' },
  ]},
];

export default function ProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const S = useMemo(() => makeStyles(colors), [colors]);

  const displayName = user?.name || 'User';
  const ceraTag     = user?.ceraTag ? `@${user.ceraTag}` : null;
  const isVerified  = user?.kycStatus === 'verified';

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(22)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 58, friction: 9, useNativeDriver: true }),
    ]).start();
  }, []);

  async function copyTag() {
    if (!ceraTag) return;
    await Clipboard.setStringAsync(ceraTag);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Tag copied!', ToastAndroid.SHORT);
    } else {
      Alert.alert('Copied', 'CERA tag copied to clipboard');
    }
  }

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Hero Card ── */}
          <LinearGradient
            colors={['#1E0A4A', '#3B1080', '#6D28D9']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={S.heroCard}
          >
            {/* Decorative orbs */}
            <View style={[S.heroDeco, { width: 220, height: 220, top: -80, right: -70 }]} />
            <View style={[S.heroDeco, { width: 130, height: 130, bottom: -60, left: -40 }]} />
            <View style={[S.heroDeco, { width: 80, height: 80, top: 30, left: 40, opacity: 0.05 }]} />

            {/* Top row: title + settings */}
            <View style={S.heroTopRow}>
              <Text style={S.heroHeading}>Profile</Text>
              <TouchableOpacity style={S.heroSettingsBtn} activeOpacity={0.75} onPress={() => navigation.navigate('Security')}>
                <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.85)" />
              </TouchableOpacity>
            </View>

            {/* Avatar */}
            <View style={S.avatarContainer}>
              <View style={S.avatarRing}>
                <LinearGradient colors={['#A78BFA', '#7C3AED', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={S.fixedAvatar}>
                  <Ionicons name="person" size={44} color="rgba(255,255,255,0.92)" />
                </LinearGradient>
              </View>
            </View>

            {/* Name */}
            <Text style={S.heroName}>{displayName}</Text>

            {/* Verified badge */}
            <View style={[S.tierBadge, { backgroundColor: isVerified ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.18)', borderColor: isVerified ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.35)' }]}>
              <Ionicons
                name={isVerified ? 'shield-checkmark' : 'shield-outline'}
                size={12}
                color={isVerified ? '#34D399' : '#FBBF24'}
              />
              <Text style={[S.tierBadgeText, { color: isVerified ? '#34D399' : '#FBBF24' }]}>
                {isVerified ? 'Verified' : 'Unverified'}
              </Text>
            </View>

            {/* CERA tag */}
            {ceraTag ? (
              <TouchableOpacity style={S.tagBadge} activeOpacity={0.75} onPress={copyTag}>
                <Ionicons name="at" size={12} color="rgba(255,255,255,0.7)" />
                <Text style={S.tagBadgeText}>{ceraTag.replace('@', '')}</Text>
                <Ionicons name="copy-outline" size={11} color="rgba(255,255,255,0.45)" style={{ marginLeft: 3 }} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[S.tagBadge, { backgroundColor: 'rgba(255,255,255,0.18)' }]} onPress={() => navigation.navigate('CeraTag')}>
                <Ionicons name="at" size={12} color="rgba(255,255,255,0.9)" />
                <Text style={[S.tagBadgeText, { color: '#fff' }]}>Claim your CERA tag</Text>
                <Ionicons name="arrow-forward" size={11} color="rgba(255,255,255,0.6)" style={{ marginLeft: 3 }} />
              </TouchableOpacity>
            )}
          </LinearGradient>

          {/* ── KYC banner ── */}
          {!isVerified && (
            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('KYC')} style={S.kycCard}>
              <LinearGradient colors={['#EDE9FE', '#F5F3FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.kycInner}>
                <View style={S.kycIconWrap}>
                  <Ionicons name="shield-outline" size={22} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.kycTitle}>Complete KYC Verification</Text>
                  <Text style={S.kycSub}>Verify your identity to unlock all features</Text>
                </View>
                <View style={S.kycArrow}>
                  <Ionicons name="arrow-forward" size={16} color="#7C3AED" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* ── Menu Sections ── */}
          {MENU_ITEMS.map((section) => (
            <View key={section.section} style={S.menuSection}>
              <Text style={[S.sectionLabel, { color: colors.textMuted }]}>{section.section.toUpperCase()}</Text>
              <View style={S.menuCard}>
                {section.items.map((item, i) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[S.menuItem, i < section.items.length - 1 && S.menuItemBorder]}
                    activeOpacity={0.7}
                    onPress={() => item.screen && navigation.navigate(item.screen)}
                  >
                    <View style={[S.menuIcon, { backgroundColor: item.color + '1E' }]}>
                      <Ionicons name={item.icon} size={19} color={item.color} />
                    </View>
                    <Text style={[S.menuLabel, { color: colors.text }]}>{item.label}</Text>
                    <View style={S.menuRight}>
                      {item.badge && (
                        <View style={[S.badge, { backgroundColor: item.color + '1E' }]}>
                          <Text style={[S.badgeText, { color: item.color }]}>{item.badge}</Text>
                        </View>
                      )}
                      <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* ── Logout ── */}
          <TouchableOpacity
            style={[S.logoutBtn, { backgroundColor: colors.error + '12', borderColor: colors.error + '28' }]}
            onPress={async () => { await logout(); navigation.replace('Login'); }}
            activeOpacity={0.75}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[S.logoutText, { color: colors.error }]}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={[S.version, { color: colors.textMuted }]}>CERA v1.2.0 · Made in Nigeria 🇳🇬</Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    scroll: { paddingBottom: 100 },

    // Hero
    heroCard: { borderRadius: 28, marginHorizontal: 16, marginTop: 8, marginBottom: 16, overflow: 'hidden', paddingBottom: 28 },
    heroDeco: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)' },
    heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, marginBottom: 20 },
    heroHeading: { color: '#fff', fontSize: 20, fontFamily: FONTS.extrabold },
    heroSettingsBtn: {
      width: 40, height: 40, borderRadius: 13,
      backgroundColor: 'rgba(255,255,255,0.13)',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },

    avatarContainer: { alignItems: 'center', marginBottom: 14 },
    avatarRing: {
      borderRadius: 34,
      borderWidth: 3,
      borderColor: 'rgba(255,255,255,0.3)',
      padding: 4,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    fixedAvatar: { width: 86, height: 86, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },

    heroName: { color: '#fff', fontSize: 22, fontFamily: FONTS.extrabold, textAlign: 'center', paddingHorizontal: 20, marginBottom: 10 },
    tierBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'center',
      borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
      borderWidth: 1, marginBottom: 10,
    },
    tierBadgeText: { fontSize: 12, fontFamily: FONTS.semibold },
    tagBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 6,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    },
    tagBadgeText: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontFamily: FONTS.semibold, letterSpacing: 0.5 },

    // KYC card
    kycCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#7C3AED40' },
    kycInner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    kycIconWrap: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#7C3AED20', alignItems: 'center', justifyContent: 'center' },
    kycTitle: { color: '#4C1D95', fontSize: 14, fontFamily: FONTS.bold },
    kycSub: { color: '#6D28D9', fontSize: 12, fontFamily: FONTS.regular, marginTop: 2, opacity: 0.75 },
    kycArrow: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#7C3AED18', alignItems: 'center', justifyContent: 'center' },

    // Menu
    menuSection: { marginHorizontal: 16, marginBottom: 16 },
    sectionLabel: { fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 1.2, marginBottom: 8, paddingHorizontal: 4 },
    menuCard: { backgroundColor: C.card, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 13 },
    menuItemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
    menuIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    menuLabel: { flex: 1, fontSize: 14, fontFamily: FONTS.medium },
    menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    badge: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontSize: 11, fontFamily: FONTS.bold },

    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16, borderWidth: 1 },
    logoutText: { fontSize: 15, fontFamily: FONTS.bold },
    version: { fontSize: 12, fontFamily: FONTS.regular, textAlign: 'center', marginBottom: 8 },
  });
}
