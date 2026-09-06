import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { feedbackLight } from '../utils/feedback';
import { getTransactions } from '../services/api';

const LAST_CHECK_KEY = 'cera_last_notif_check';

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMin = Math.floor((now - date) / 60000);
  const diffHr  = Math.floor((now - date) / 3600000);
  const diffDay = Math.floor((now - date) / 86400000);
  if (diffMin < 1)  return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr  < 24) return `${diffHr} hr${diffHr > 1 ? 's' : ''} ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7)  return `${diffDay} days ago`;
  return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function txToNotif(tx) {
  const amount = (tx.amountKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  switch (tx.type) {
    case 'cera_transfer_in':
      return { icon: 'arrow-down-circle', color: '#10B981', title: 'Money Received', body: tx.narration || `₦${amount} received from a CERA user` };
    case 'cera_transfer_out':
      return { icon: 'paper-plane', color: '#627EEA', title: 'Transfer Sent', body: tx.narration || `₦${amount} sent via CERA Tag` };
    case 'crypto_receive':
      return {
        icon: 'trending-up', color: '#7C3AED', title: 'Crypto Received',
        body: tx.cryptoAmount
          ? `${tx.cryptoAmount} ${tx.crypto || 'crypto'} received · ₦${amount} credited`
          : `₦${amount} credited to your wallet`,
      };
    case 'bank_payout':
      return { icon: 'card-outline', color: '#06B6D4', title: 'Bank Payout', body: tx.narration || `₦${amount} paid out to your bank` };
    case 'utility':
      return { icon: 'flash', color: '#F59E0B', title: 'Bill Payment', body: tx.narration || `₦${amount} paid` };
    case 'funding':
      return { icon: 'add-circle', color: '#10B981', title: 'Account Funded', body: tx.narration || `₦${amount} credited` };
    default:
      return { icon: 'ellipse-outline', color: '#64748B', title: 'Transaction', body: tx.narration || `₦${amount}` };
  }
}

function NotifItem({ tx, isUnread, index }) {
  const { colors } = useTheme();
  const S = useMemo(() => makeStyles(colors), [colors]);
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-20)).current;
  const [read, setRead] = useState(!isUnread);
  const notif = txToNotif(tx);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 350, delay: index * 55, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, tension: 70, friction: 9, delay: index * 55, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }}>
      <TouchableOpacity
        style={[S.item, !read && S.itemUnread]}
        activeOpacity={0.7}
        onPress={() => { feedbackLight(); setRead(true); }}
      >
        <View style={[S.iconWrap, { backgroundColor: notif.color + '18' }]}>
          <Ionicons name={notif.icon} size={20} color={notif.color} />
        </View>
        <View style={S.content}>
          <View style={S.topRow}>
            <Text style={S.itemTitle} numberOfLines={1}>{notif.title}</Text>
            {!read && <View style={S.unreadDot} />}
          </View>
          <Text style={S.body} numberOfLines={2}>{notif.body}</Text>
          <Text style={S.time}>{timeAgo(tx.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function NotificationsScreen({ navigation }) {
  const { colors } = useTheme();
  const S = useMemo(() => makeStyles(colors), [colors]);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const stored = await AsyncStorage.getItem(LAST_CHECK_KEY);
        const checkTime = stored ? new Date(stored) : null;
        setLastCheck(checkTime);

        const res = await getTransactions(1);
        setTransactions(res.data.transactions || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
        // Mark all as read
        AsyncStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
      }
    }
    load();
  }, []);

  const todayTxns   = transactions.filter(tx => isToday(tx.createdAt));
  const earlierTxns = transactions.filter(tx => !isToday(tx.createdAt));

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => { feedbackLight(); navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={S.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : transactions.length === 0 ? (
        <View style={S.emptyWrap}>
          <View style={[S.emptyIcon, { backgroundColor: colors.primary + '12' }]}>
            <Ionicons name="notifications-off-outline" size={32} color={colors.textMuted} />
          </View>
          <Text style={S.emptyTitle}>No notifications yet</Text>
          <Text style={S.emptySub}>Your transaction activity will appear here</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>
          {todayTxns.length > 0 && (
            <>
              <Text style={S.sectionLabel}>TODAY</Text>
              {todayTxns.map((tx, i) => (
                <NotifItem
                  key={tx.txId || tx._id}
                  tx={tx}
                  isUnread={lastCheck ? new Date(tx.createdAt) > lastCheck : true}
                  index={i}
                />
              ))}
            </>
          )}
          {earlierTxns.length > 0 && (
            <>
              <Text style={[S.sectionLabel, todayTxns.length > 0 && { marginTop: 20 }]}>EARLIER</Text>
              {earlierTxns.map((tx, i) => (
                <NotifItem
                  key={tx.txId || tx._id}
                  tx={tx}
                  isUnread={lastCheck ? new Date(tx.createdAt) > lastCheck : false}
                  index={i + todayTxns.length}
                />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 12,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: C.border,
    },
    headerTitle: { color: C.text, fontSize: 18, fontFamily: FONTS.bold },
    scroll: { paddingHorizontal: 20, paddingBottom: 60 },

    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    emptyIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    emptyTitle: { color: C.text, fontSize: 16, fontFamily: FONTS.bold, marginBottom: 6 },
    emptySub: { color: C.textMuted, fontSize: 13, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 20 },

    sectionLabel: {
      color: C.textMuted, fontSize: 10, fontFamily: FONTS.bold,
      letterSpacing: 1.2, marginBottom: 10,
    },
    item: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 12,
      backgroundColor: C.card, borderRadius: 16, padding: 14,
      marginBottom: 8, borderWidth: 1, borderColor: C.border,
    },
    itemUnread: { borderColor: C.primary + '40', backgroundColor: C.primary + '08' },
    iconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    content: { flex: 1 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    itemTitle: { color: C.text, fontSize: 14, fontFamily: FONTS.semibold, flex: 1, marginRight: 8 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary, flexShrink: 0 },
    body: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.regular, lineHeight: 18, marginBottom: 6 },
    time: { color: C.textMuted, fontSize: 11, fontFamily: FONTS.medium },
  });
}
