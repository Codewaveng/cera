import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/colors';
import TransactionItem from '../components/TransactionItem';
import { useTheme } from '../context/ThemeContext';
import { getTransactions } from '../services/api';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { feedbackSelect, feedbackLight } from '../utils/feedback';

const TIME_FILTERS = ['Week', 'Month', 'Year'];

const TYPE_FILTERS = [
  { key: 'all',               label: 'All' },
  { key: 'crypto_receive',    label: 'Crypto' },
  { key: 'cera_transfer_in',  label: 'Received' },
  { key: 'cera_transfer_out', label: 'Sent' },
  { key: 'utility',           label: 'Utilities' },
  { key: 'bank_payout',       label: 'Bank Out' },
  { key: 'funding',           label: 'Deposits' },
];

const SPEND_CATEGORIES = [
  { key: 'bank_payout',       label: 'Bank Transfer',   icon: 'business-outline',      color: '#6366F1' },
  { key: 'cera_transfer_out', label: 'CERA Transfer',   icon: 'arrow-up-circle-outline', color: '#7C3AED' },
  { key: 'utility_airtime',   label: 'Airtime',          icon: 'phone-portrait-outline', color: '#EF4444' },
  { key: 'utility_data',      label: 'Data',             icon: 'wifi-outline',           color: '#06B6D4' },
  { key: 'utility_tv',        label: 'Cable TV',         icon: 'tv-outline',             color: '#8B5CF6' },
  { key: 'utility_power',     label: 'Electricity',      icon: 'flash-outline',          color: '#F59E0B' },
];

const INCOME_CATEGORIES = [
  { key: 'cera_transfer_in', label: 'CERA Received', icon: 'arrow-down-circle-outline', color: '#10B981' },
  { key: 'crypto_receive',   label: 'Crypto',         icon: 'cube-outline',             color: '#F59E0B' },
  { key: 'funding',          label: 'Deposits',        icon: 'wallet-outline',           color: '#10B981' },
];

function getUtilitySubkey(tx) {
  const n = (tx.narration || '').toLowerCase();
  if (n.includes('airtime')) return 'utility_airtime';
  if (n.includes('data')) return 'utility_data';
  if (n.includes('tv') || n.includes('cable')) return 'utility_tv';
  if (n.includes('electricity') || n.includes('power')) return 'utility_power';
  return 'utility_other';
}

function computeFlow(txns, timeFilter) {
  const now = new Date();
  let cutoff = new Date();
  if (timeFilter === 'Week') cutoff.setDate(now.getDate() - 7);
  else if (timeFilter === 'Month') cutoff.setMonth(now.getMonth() - 1);
  else cutoff.setFullYear(now.getFullYear() - 1);

  const filtered = txns.filter((t) => new Date(t.createdAt) >= cutoff && t.status === 'completed');

  const spend = {};
  const income = {};

  filtered.forEach((t) => {
    const key = t.type === 'utility' ? getUtilitySubkey(t) : t.type;
    const amt = t.amount || 0;
    const incomingTypes = ['cera_transfer_in', 'crypto_receive', 'funding'];
    if (incomingTypes.includes(t.type)) {
      income[key] = (income[key] || 0) + amt;
    } else {
      spend[key] = (spend[key] || 0) + amt;
    }
  });

  const totalSpend  = Object.values(spend).reduce((a, b) => a + b, 0);
  const totalIncome = Object.values(income).reduce((a, b) => a + b, 0);

  return { spend, income, totalSpend, totalIncome };
}

function FlowBar({ amount, total, color }) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <View style={{ height: 6, backgroundColor: color + '20', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
      <View style={{ width: `${Math.min(pct, 100)}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
    </View>
  );
}

export default function HistoryScreen({ navigation: navProp }) {
  const { colors } = useTheme();
  const navCtx = useNavigation();
  const navigation = navProp || navCtx;
  const [activeTab, setActiveTab]     = useState(0);
  const [timeFilter, setTimeFilter]   = useState('Month');
  const [txns, setTxns]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [search, setSearch]           = useState('');
  const [typeFilter, setTypeFilter]   = useState('all');
  const tabAnim = useRef(new Animated.Value(0)).current;
  const S = useMemo(() => makeStyles(colors), [colors]);

  const filteredTxns = useMemo(() => {
    return txns.filter(t => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (t.narration || '').toLowerCase().includes(q) ||
               (t.type || '').toLowerCase().includes(q) ||
               (t.txId || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [txns, search, typeFilter]);

  useFocusEffect(useCallback(() => {
    fetchTxns();
  }, []));

  async function fetchTxns(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await getTransactions(1);
      setTxns(res.data.transactions || []);
    } catch {
      setTxns([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const switchTab = (i) => {
    feedbackSelect();
    setActiveTab(i);
    Animated.spring(tabAnim, { toValue: i, tension: 80, friction: 10, useNativeDriver: false }).start();
  };

  const indicatorLeft = tabAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '50%'] });

  const { spend, income, totalSpend, totalIncome } = useMemo(
    () => computeFlow(txns, timeFilter),
    [txns, timeFilter]
  );

  const fmt = (n) => `₦${(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => { feedbackLight(); navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={S.title}>Transactions</Text>
      </View>

      <View style={S.tabRow}>
        <Animated.View style={[S.tabIndicator, { left: indicatorLeft }]} />
        {['All', 'Flow'].map((tab, i) => (
          <TouchableOpacity key={tab} style={S.tabBtn} onPress={() => switchTab(i)} activeOpacity={0.8}>
            <Text style={[S.tabText, activeTab === i && S.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={S.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : activeTab === 0 ? (
        <>
          {/* Search bar */}
          <View style={[S.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={17} color={colors.textMuted} />
            <TextInput
              style={[S.searchInput, { color: colors.text }]}
              placeholder="Search transactions…"
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {!!search && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Type filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.typeRow}>
            {TYPE_FILTERS.map(f => {
              const active = typeFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[S.typeChip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => { feedbackSelect(); setTypeFilter(f.key); }}
                  activeOpacity={0.75}
                >
                  <Text style={[S.typeChipTxt, active && { color: '#fff' }]}>{f.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

        <FlatList
          data={filteredTxns}
          keyExtractor={(item) => item.txId}
          renderItem={({ item }) => (
            <TransactionItem
              tx={item}
              onPress={() => navigation.navigate('Receipt', { tx: item })}
            />
          )}
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchTxns(true)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ItemSeparatorComponent={() => <View style={S.separator} />}
          ListEmptyComponent={
            <View style={S.empty}>
              <View style={[S.emptyIconWrap, { backgroundColor: colors.cardAlt }]}>
                <Ionicons name="document-text-outline" size={36} color={colors.textMuted} />
              </View>
              <Text style={S.emptyTitle}>{search || typeFilter !== 'all' ? 'No results' : 'No transactions yet'}</Text>
              <Text style={S.emptySubtitle}>{search || typeFilter !== 'all' ? 'Try a different search or filter' : 'Your transactions will appear here'}</Text>
            </View>
          }
        />
        </>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={S.flowScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchTxns(true)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          <View style={S.timeFilterRow}>
            {TIME_FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[S.timeBtn, timeFilter === f && S.timeBtnActive]}
                onPress={() => { feedbackSelect(); setTimeFilter(f); }}
              >
                <Text style={[S.timeBtnText, timeFilter === f && S.timeBtnTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={S.summaryRow}>
            <View style={[S.summaryCard, { backgroundColor: '#F0FFF8' }]}>
              <Ionicons name="arrow-down-circle-outline" size={20} color="#10B981" />
              <Text style={S.summaryAmt}>{fmt(totalIncome)}</Text>
              <Text style={S.summaryLabel}>Money In</Text>
            </View>
            <View style={[S.summaryCard, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="arrow-up-circle-outline" size={20} color="#7C3AED" />
              <Text style={S.summaryAmt}>{fmt(totalSpend)}</Text>
              <Text style={S.summaryLabel}>Money Out</Text>
            </View>
          </View>

          <Text style={S.sectionHead}>SPENDING</Text>
          <View style={S.flowCard}>
            {SPEND_CATEGORIES.map((cat) => {
              const amt = spend[cat.key] || 0;
              return (
                <View key={cat.key} style={S.flowRow}>
                  <View style={[S.flowIcon, { backgroundColor: cat.color + '15' }]}>
                    <Ionicons name={cat.icon} size={18} color={cat.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={S.flowLabel}>{cat.label}</Text>
                      <Text style={[S.flowAmt, { color: amt > 0 ? colors.text : colors.textMuted }]}>
                        {amt > 0 ? fmt(amt) : '—'}
                      </Text>
                    </View>
                    <FlowBar amount={amt} total={totalSpend} color={cat.color} />
                  </View>
                </View>
              );
            })}
          </View>

          <Text style={S.sectionHead}>INCOME</Text>
          <View style={S.flowCard}>
            {INCOME_CATEGORIES.map((cat) => {
              const amt = income[cat.key] || 0;
              return (
                <View key={cat.key} style={S.flowRow}>
                  <View style={[S.flowIcon, { backgroundColor: cat.color + '15' }]}>
                    <Ionicons name={cat.icon} size={18} color={cat.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={S.flowLabel}>{cat.label}</Text>
                      <Text style={[S.flowAmt, { color: amt > 0 ? '#10B981' : colors.textMuted }]}>
                        {amt > 0 ? fmt(amt) : '—'}
                      </Text>
                    </View>
                    <FlowBar amount={amt} total={totalIncome} color={cat.color} />
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
    backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.cardAlt, alignItems: 'center', justifyContent: 'center' },
    title: { color: C.text, fontSize: 22, fontFamily: FONTS.extrabold },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    tabRow: {
      flexDirection: 'row',
      marginHorizontal: 20,
      marginBottom: 16,
      backgroundColor: C.cardAlt,
      borderRadius: 14,
      padding: 4,
      position: 'relative',
    },
    tabIndicator: {
      position: 'absolute',
      top: 4, bottom: 4,
      width: '50%',
      backgroundColor: C.white,
      borderRadius: 11,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, zIndex: 1 },
    tabText: { color: C.textMuted, fontSize: 13, fontFamily: FONTS.semibold },
    tabTextActive: { color: C.text, fontFamily: FONTS.bold },

    list: { paddingHorizontal: 20, paddingBottom: 100 },
    separator: { height: 1, backgroundColor: C.borderLight, marginLeft: 59 },

    flowScroll: { paddingHorizontal: 20, paddingBottom: 100 },

    timeFilterRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
    timeBtn: {
      paddingHorizontal: 18, paddingVertical: 8,
      borderRadius: 20, backgroundColor: C.cardAlt,
    },
    timeBtnActive: { backgroundColor: C.primary },
    timeBtnText: { color: C.textMuted, fontSize: 13, fontFamily: FONTS.semibold },
    timeBtnTextActive: { color: '#fff' },

    summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    summaryCard: {
      flex: 1, borderRadius: 18, padding: 16, alignItems: 'center', gap: 6,
    },
    summaryAmt: { color: C.text, fontSize: 17, fontFamily: FONTS.extrabold },
    summaryLabel: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.regular },

    sectionHead: {
      color: C.textMuted, fontSize: 10, fontFamily: FONTS.bold,
      letterSpacing: 1.2, marginBottom: 10,
    },
    flowCard: {
      backgroundColor: C.card, borderRadius: 20, padding: 16,
      borderWidth: 1, borderColor: C.border, marginBottom: 20, gap: 14,
    },
    flowRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    flowIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    flowLabel: { color: C.text, fontSize: 13, fontFamily: FONTS.medium },
    flowAmt: { fontSize: 13, fontFamily: FONTS.bold },
    flowEmpty: { color: C.textMuted, fontSize: 13, fontFamily: FONTS.regular, textAlign: 'center', paddingVertical: 8 },

    searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
    searchInput: { flex: 1, fontSize: 14, fontFamily: FONTS.regular },
    typeRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 10 },
    typeChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card },
    typeChipTxt: { color: C.textMuted, fontSize: 12, fontFamily: FONTS.semibold },

    empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyIconWrap: {
      width: 72, height: 72, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    },
    emptyTitle: { color: C.text, fontSize: 16, fontFamily: FONTS.bold },
    emptySubtitle: {
      color: C.textSecondary, fontSize: 13, fontFamily: FONTS.regular,
      textAlign: 'center', paddingHorizontal: 24,
    },
  });
}
