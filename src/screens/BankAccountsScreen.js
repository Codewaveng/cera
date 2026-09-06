import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { feedbackLight, feedbackSelect } from '../utils/feedback';
import BankLogo from '../components/BankLogo';

export default function BankAccountsScreen({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const S = useMemo(() => makeStyles(colors), [colors]);

  const ap = user?.autoProcessing || {};
  const hasBank = !!ap.bankName;

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => { feedbackLight(); navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={S.title}>Bank Accounts</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>

        {hasBank ? (
          <View style={[S.bankCard, { borderColor: colors.primary + '50' }]}>
            <BankLogo bankName={ap.bankName} size={48} />
            <View style={{ flex: 1 }}>
              <View style={S.bankTop}>
                <Text style={S.bankName}>{ap.bankName}</Text>
                <View style={S.defaultChip}>
                  <Text style={S.defaultChipText}>Default</Text>
                </View>
              </View>
              <Text style={S.accNum}>{'*'.repeat(6) + (ap.accountNumber || '').slice(-4)}</Text>
              <Text style={S.accHolder}>{ap.accountName}</Text>
            </View>
            <TouchableOpacity
              style={S.editBtn}
              onPress={() => { feedbackSelect(); navigation.navigate('AutoProcessingSetup'); }}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={S.emptyBox}>
            <Ionicons name="card-outline" size={40} color={colors.textMuted} />
            <Text style={S.emptyTitle}>No Bank Account Linked</Text>
            <Text style={S.emptySub}>Link a bank account to enable auto-processing of crypto payments to your Naira wallet.</Text>
          </View>
        )}

        <TouchableOpacity
          style={S.addBtn}
          activeOpacity={0.7}
          onPress={() => { feedbackSelect(); navigation.navigate('AutoProcessingSetup'); }}
        >
          <View style={[S.addIcon, { backgroundColor: colors.primary + '18' }]}>
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.addTitle}>{hasBank ? 'Change Bank Account' : 'Add Bank Account'}</Text>
            <Text style={S.addSub}>Link a Nigerian bank account for payouts</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={S.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={S.infoText}>
            Your bank details are encrypted and secured. We never store your full account credentials.
          </Text>
        </View>

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

    bankCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1.5, borderColor: C.border },
    bankTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
    bankName: { color: C.text, fontSize: 14, fontFamily: FONTS.bold },
    defaultChip: { backgroundColor: C.primary + '18', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
    defaultChipText: { color: C.primary, fontSize: 10, fontFamily: FONTS.bold },
    accNum: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.medium, letterSpacing: 1, marginBottom: 2 },
    accHolder: { color: C.textMuted, fontSize: 11, fontFamily: FONTS.regular },
    editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primary + '15', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.primary + '30' },

    emptyBox: { alignItems: 'center', padding: 32, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, marginBottom: 14, gap: 10 },
    emptyTitle: { color: C.text, fontSize: 15, fontFamily: FONTS.bold, textAlign: 'center' },
    emptySub: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 19 },

    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 18, padding: 16, borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed', marginBottom: 16 },
    addIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    addTitle: { color: C.text, fontSize: 14, fontFamily: FONTS.semibold },
    addSub: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },

    infoBox: { flexDirection: 'row', gap: 10, backgroundColor: C.primary + '10', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.primary + '25', alignItems: 'flex-start' },
    infoText: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.regular, flex: 1, lineHeight: 18 },
  });
}
