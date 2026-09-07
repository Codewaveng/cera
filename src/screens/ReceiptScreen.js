import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { FONTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { feedbackLight, feedbackMedium } from '../utils/feedback';

const TYPE_LABELS = {
  cera_transfer_in:  { label: 'CERA Transfer Received', icon: 'arrow-down-circle', color: '#10B981' },
  cera_transfer_out: { label: 'CERA Transfer Sent',     icon: 'arrow-up-circle',   color: '#7C3AED' },
  crypto_receive:    { label: 'Crypto Received',         icon: 'cube',              color: '#F59E0B' },
  bank_payout:       { label: 'Bank Transfer',           icon: 'business',          color: '#6366F1' },
  utility:           { label: 'Bill Payment',            icon: 'flash',             color: '#F59E0B' },
  funding:           { label: 'Wallet Deposit',          icon: 'wallet',            color: '#10B981' },
};

const STATUS_CONFIG = {
  completed: { label: 'Successful', color: '#10B981', bg: '#F0FFF8', icon: 'checkmark-circle' },
  pending:   { label: 'Pending',    color: '#F59E0B', bg: '#FFFBEB', icon: 'time' },
  failed:    { label: 'Failed',     color: '#EF4444', bg: '#FFF5F5', icon: 'close-circle' },
};

function formatFull(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-NG', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  }) + ' · ' + d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

function DottedLine() {
  return (
    <View style={styles.dottedWrap}>
      <View style={styles.dottedCircleLeft} />
      <View style={styles.dottedLine} />
      <View style={styles.dottedCircleRight} />
    </View>
  );
}

function ReceiptRow({ label, value, valueColor, bold }) {
  return (
    <View style={styles.receiptRow}>
      <Text style={styles.receiptLabel}>{label}</Text>
      <Text style={[styles.receiptValue, valueColor && { color: valueColor }, bold && { fontFamily: FONTS.bold }]}>
        {value}
      </Text>
    </View>
  );
}

function buildPdfHtml({ tx, typeInfo, statusInfo, amtPrefix, amtColor, amountFormatted, party }) {
  const date = formatFull(tx.createdAt);
  const txId = tx.txId || '—';
  const isIncoming = amtColor === '#10B981';
  const heroColor = isIncoming ? '#10B981' : '#fff';
  const feeAmt = tx.fee != null && tx.fee > 0 ? tx.fee.toFixed(2) : null;
  const printDate = new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
  const statusIcon = statusInfo.label === 'Successful' ? '✓' : statusInfo.label === 'Pending' ? '⏱' : '✕';

  const partyBlock = party ? `
    <div class="party-box">
      <div class="party-lbl">${party.label}</div>
      <div class="party-name">${party.name}</div>
      ${party.sub ? `<div class="party-sub">${party.sub}</div>` : ''}
    </div>` : '';

  const feeRow = feeAmt ? `
    <div class="row">
      <span class="row-l">Processing Fee</span>
      <span class="row-r">&#8358;${feeAmt}</span>
    </div>` : '';

  const utilityRows = tx.type === 'utility' ? [
    tx.network  && { label: tx.utilityType === 'Electricity' ? 'DISCO' : 'Network / Provider', value: tx.network },
    tx.phone    && { label: 'Phone',                  value: tx.phone },
    tx.smartCard && { label: 'Smart Card / IUC',      value: tx.smartCard },
    tx.meterNo  && { label: 'Meter No.',              value: tx.meterNo },
    tx.meterType && { label: 'Meter Type',            value: tx.meterType },
    tx.plan     && { label: tx.utilityType === 'TV' ? 'Package' : tx.utilityType === 'Data' ? 'Data Plan' : 'Plan', value: tx.plan },
    tx.token    && { label: 'Electricity Token',      value: tx.token },
    tx.orderId  && { label: 'Order / Session ID',     value: tx.orderId },
  ].filter(Boolean) : [];
  const utilityBlock = utilityRows.map(r => `
    <div class="row">
      <span class="row-l">${r.label}</span>
      <span class="row-r">${r.value}</span>
    </div>`).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
<style>
* { margin:0; padding:0; box-sizing:border-box; }

body {
  font-family: 'Poppins', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background: #13062E;
  width: 100%;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ── PAGE WRAPPER ── */
.page {
  padding: 36px 28px 52px;
}

/* ── CARD ── */
.card {
  background: #ffffff;
  border-radius: 28px;
  overflow: hidden;
  max-width: 500px;
  margin: 0 auto;
  box-shadow: 0 32px 80px rgba(0,0,0,0.45);
}

/* ── HEADER ── */
.hdr {
  background: linear-gradient(150deg, #2E0B6E 0%, #5B21B6 45%, #7C3AED 75%, #9D5BFF 100%);
  padding: 36px 32px 32px;
  position: relative;
  overflow: hidden;
}
.d1 { position:absolute;top:-70px;right:-70px;width:220px;height:220px;border-radius:110px;background:rgba(255,255,255,0.07); }
.d2 { position:absolute;bottom:-50px;left:30px;width:140px;height:140px;border-radius:70px;background:rgba(255,255,255,0.04); }
.d3 { position:absolute;top:30px;right:110px;width:50px;height:50px;border-radius:25px;background:rgba(255,255,255,0.06); }

.hdr-top { overflow:hidden; margin-bottom:28px; }
.brand   { float:left; font-size:20px; font-weight:900; letter-spacing:6px; color:#fff; }
.h-date  { float:right; font-size:11px; font-weight:400; color:rgba(255,255,255,0.4); padding-top:5px; }

.status-row { margin-bottom:20px; }
.s-dot  {
  display:inline-block;
  width:10px; height:10px; border-radius:5px;
  background:${statusInfo.color};
  margin-right:7px;
  vertical-align:middle;
  position:relative; top:-1px;
}
.s-text { font-size:13px; font-weight:600; color:rgba(255,255,255,0.85); letter-spacing:0.3px; }

.amt {
  font-size:64px; font-weight:800;
  letter-spacing:-3px; line-height:1;
  color:${heroColor};
  margin-bottom:14px;
}
.amt-type { font-size:14px; font-weight:400; color:rgba(255,255,255,0.55); margin-bottom:5px; }
.amt-date { font-size:11.5px; color:rgba(255,255,255,0.35); }

/* ── NOTCH (ticket tear) ── */
.notch {
  background: #13062E;
  padding: 0 24px;
  position: relative;
}
.notch-inner {
  border-top: 2px dashed rgba(255,255,255,0.12);
  height: 0;
}

/* ── BODY ── */
.body { padding: 28px 32px 24px; }

/* Party */
.party-box {
  background: linear-gradient(135deg, #F5F0FF, #EDE8FF);
  border-radius: 16px;
  padding: 18px 20px;
  margin-bottom: 26px;
  border-left: 5px solid #7C3AED;
}
.party-lbl  { font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#9333EA; margin-bottom:7px; }
.party-name { font-size:17px; font-weight:700; color:#1E1B2E; }
.party-sub  { font-size:12px; font-weight:400; color:#8B8FA8; margin-top:3px; }

/* Section label */
.sec-lbl {
  font-size:10px; font-weight:700;
  letter-spacing:2.5px; text-transform:uppercase;
  color:#B0B5C8; margin-bottom:14px;
}

/* Rows */
.row { overflow:hidden; padding:13px 0; border-bottom:1px solid #F4F1FC; }
.row:last-child { border-bottom:none; }
.row-l { float:left;  font-size:13px; font-weight:400; color:#8B8FA8; }
.row-r { float:right; font-size:13px; font-weight:600; color:#1E1B2E; text-align:right; max-width:58%; }

/* Reference */
.ref-box {
  background: #1E1B2E;
  border-radius: 16px;
  padding: 20px 22px;
  margin-top: 22px;
}
.ref-lbl {
  font-size:9px; font-weight:700; letter-spacing:3px;
  text-transform:uppercase; color:#A78BFA; margin-bottom:9px;
}
.ref-val {
  font-size:13px; font-weight:500;
  color:#C4B5FD; word-break:break-all; line-height:1.7;
  letter-spacing:0.8px;
}

/* Footer */
.footer {
  background: linear-gradient(90deg, #2E0B6E, #5B21B6);
  padding: 17px 32px;
  overflow: hidden;
}
.ft-l { float:left;  font-size:12px; font-weight:600; color:rgba(255,255,255,0.9); }
.ft-r { float:right; font-size:11px; font-weight:400; color:rgba(255,255,255,0.45); }
</style>
</head>
<body>
<div class="page">
<div class="card">

  <div class="hdr">
    <div class="d1"></div><div class="d2"></div><div class="d3"></div>
    <div class="hdr-top">
      <span class="brand">CERA</span>
      <span class="h-date">${printDate}</span>
    </div>
    <div class="status-row">
      <span class="s-dot"></span>
      <span class="s-text">${statusInfo.label}</span>
    </div>
    <div class="amt">${amtPrefix}&#8358;${amountFormatted}</div>
    <div class="amt-type">${typeInfo.label}</div>
    <div class="amt-date">${date}</div>
  </div>

  <div class="notch"><div class="notch-inner"></div></div>

  <div class="body">
    ${partyBlock}

    <div class="sec-lbl">Transaction Details</div>

    <div class="row">
      <span class="row-l">Amount</span>
      <span class="row-r" style="color:${isIncoming ? '#10B981' : '#1E1B2E'};font-weight:800;font-size:14px">${amtPrefix}&#8358;${amountFormatted}</span>
    </div>
    ${feeRow}
    ${utilityBlock}
    <div class="row">
      <span class="row-l">Status</span>
      <span class="row-r" style="color:${statusInfo.color};font-weight:700">${statusInfo.label}</span>
    </div>
    <div class="row">
      <span class="row-l">Transaction Type</span>
      <span class="row-r">${typeInfo.label}</span>
    </div>
    <div class="row">
      <span class="row-l">Date &amp; Time</span>
      <span class="row-r">${date}</span>
    </div>

    <div class="ref-box">
      <div class="ref-lbl">Transaction Reference</div>
      <div class="ref-val">${txId}</div>
    </div>
  </div>

  <div class="footer">
    <span class="ft-l">&#10003;&nbsp; Verified by CERA</span>
    <span class="ft-r">cera.app &middot; Secure Nigerian Finance</span>
  </div>

</div>
</div>
</body>
</html>`;
}

export default function ReceiptScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { tx } = route.params || {};
  const [sharing, setSharing] = useState(false);

  if (!tx) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorWrap}>
          <Ionicons name="receipt-outline" size={40} color="#94A3B8" />
          <Text style={styles.errorText}>Receipt not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: '#7C3AED', fontFamily: FONTS.semibold, marginTop: 12 }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const typeInfo   = TYPE_LABELS[tx.type]    || TYPE_LABELS.cera_transfer_in;
  const statusInfo = STATUS_CONFIG[tx.status] || STATUS_CONFIG.pending;
  const isIncoming = ['cera_transfer_in', 'crypto_receive', 'funding'].includes(tx.type);
  const amtPrefix  = isIncoming ? '+' : '-';
  const amtColor   = isIncoming ? '#10B981' : '#0F172A';
  const amountFormatted = (tx.amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });

  const getParty = () => {
    if (tx.type === 'cera_transfer_in')  return { label: 'From',      name: tx.from?.name  || 'CERA User', sub: tx.from?.ceraId || '' };
    if (tx.type === 'cera_transfer_out') return { label: 'To',        name: tx.to?.name    || 'CERA User', sub: tx.to?.ceraId   || '' };
    if (tx.type === 'bank_payout')       return { label: 'Bank',      name: tx.bankName    || 'Bank',      sub: tx.accountNumber ? `**** ${tx.accountNumber.slice(-4)}` : '' };
    if (tx.type === 'crypto_receive')    return { label: 'Asset',     name: tx.coin || 'Crypto',           sub: tx.network || '' };
    if (tx.type === 'utility') {
      const recipient = tx.smartCard || tx.meterNo || tx.phone || '—';
      const sub = tx.plan ? `${tx.network} · ${tx.plan}` : (tx.network || '');
      return { label: tx.utilityType || 'Recipient', name: recipient, sub };
    }
    return null;
  };
  const party = getParty();

  const handleShare = async () => {
    feedbackMedium();
    setSharing(true);
    try {
      const html = buildPdfHtml({ tx, typeInfo, statusInfo, amtPrefix, amtColor, amountFormatted, party });
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share CERA Receipt',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Not Available', 'Sharing is not available on this device.');
      }
    } catch {
      Alert.alert('Error', 'Could not generate PDF receipt.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { feedbackLight(); navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receipt</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} disabled={sharing}>
          {sharing
            ? <ActivityIndicator size="small" color="#7C3AED" />
            : <Ionicons name="share-outline" size={22} color="#7C3AED" />
          }
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.heroSection}>
          <View style={[styles.statusChip, { backgroundColor: statusInfo.bg }]}>
            <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
            <Text style={[styles.statusChipText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
          <Text style={[styles.heroAmount, { color: amtColor }]}>
            {amtPrefix}₦{amountFormatted}
          </Text>
          <Text style={styles.heroType}>{typeInfo.label}</Text>
          <Text style={styles.heroDate}>{formatFull(tx.createdAt)}</Text>
        </View>

        <View style={styles.receiptCard}>
          <LinearGradient
            colors={['#7C3AED', '#9D5BFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.receiptTopBar}
          >
            <View style={styles.receiptLogoRow}>
              <Ionicons name={typeInfo.icon} size={18} color="#fff" />
              <Text style={styles.receiptBrandText}>CERA</Text>
            </View>
            <Text style={styles.receiptTopBarLabel}>Official Receipt</Text>
          </LinearGradient>

          <View style={styles.receiptBody}>
            {party && (
              <>
                <View style={styles.partyBlock}>
                  <View style={[styles.partyIcon, { backgroundColor: typeInfo.color + '18' }]}>
                    <Ionicons name={typeInfo.icon} size={20} color={typeInfo.color} />
                  </View>
                  <View>
                    <Text style={styles.partyLabel}>{party.label}</Text>
                    <Text style={styles.partyName}>{party.name}</Text>
                    {!!party.sub && <Text style={styles.partySub}>{party.sub}</Text>}
                  </View>
                </View>
                <DottedLine />
              </>
            )}

            <View style={styles.detailsBlock}>
              <ReceiptRow
                label="Amount"
                value={`${amtPrefix}₦${amountFormatted}`}
                valueColor={amtColor}
                bold
              />
              {tx.fee != null && tx.fee > 0 && (
                <ReceiptRow label="Fee" value={`₦${tx.fee.toFixed(2)}`} />
              )}
              <ReceiptRow label="Status" value={statusInfo.label} valueColor={statusInfo.color} />
              <ReceiptRow label="Type" value={typeInfo.label} />
              {tx.type === 'utility' && !!tx.network && (
                <ReceiptRow label={tx.utilityType === 'Electricity' ? 'DISCO' : 'Network / Provider'} value={tx.network} />
              )}
              {tx.type === 'utility' && !!tx.phone && (
                <ReceiptRow label="Phone" value={tx.phone} />
              )}
              {tx.type === 'utility' && !!tx.smartCard && (
                <ReceiptRow label="Smart Card / IUC" value={tx.smartCard} />
              )}
              {tx.type === 'utility' && !!tx.meterNo && (
                <ReceiptRow label="Meter No." value={tx.meterNo} />
              )}
              {tx.type === 'utility' && !!tx.meterType && (
                <ReceiptRow label="Meter Type" value={tx.meterType} />
              )}
              {tx.type === 'utility' && !!tx.plan && (
                <ReceiptRow label={tx.utilityType === 'TV' ? 'Package' : tx.utilityType === 'Data' ? 'Data Plan' : 'Plan'} value={tx.plan} />
              )}
              {tx.type === 'utility' && !!tx.token && (
                <ReceiptRow label="Electricity Token" value={tx.token} bold valueColor="#F59E0B" />
              )}
              {tx.type === 'utility' && !!tx.orderId && (
                <ReceiptRow label="Order / Session ID" value={tx.orderId} />
              )}
              <ReceiptRow label="Date" value={formatFull(tx.createdAt)} />
            </View>

            <DottedLine />

            <View style={styles.refBlock}>
              <Text style={styles.refLabel}>TRANSACTION REFERENCE</Text>
              <Text style={styles.refValue}>{tx.txId || '—'}</Text>
            </View>
          </View>

          <View style={styles.receiptFooter}>
            <Ionicons name="shield-checkmark" size={13} color="#10B981" />
            <Text style={styles.receiptFooterText}>Verified by CERA</Text>
            <View style={styles.footerDot} />
            <Text style={styles.receiptFooterText}>cera.app</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.8} disabled={sharing}>
            <LinearGradient
              colors={['#7C3AED', '#5B21B6']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.actionBtnInner}
            >
              {sharing
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                    <Ionicons name="share-social-outline" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Share as PDF</Text>
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnOutline}
            onPress={() => { feedbackLight(); navigation.goBack(); }}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back-outline" size={18} color="#7C3AED" />
            <Text style={styles.actionBtnOutlineText}>Go Back</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  scroll: { paddingBottom: 60 },

  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { color: '#64748B', fontSize: 15, fontFamily: FONTS.medium },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#EDE9FE',
  },
  headerTitle: { color: '#0F172A', fontSize: 17, fontFamily: FONTS.bold },
  shareBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center',
  },

  heroSection: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 24 },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16,
  },
  statusChipText: { fontSize: 12, fontFamily: FONTS.bold },
  heroAmount: { fontSize: 44, fontFamily: FONTS.extrabold, letterSpacing: -1, marginBottom: 8 },
  heroType: { color: '#475569', fontSize: 14, fontFamily: FONTS.medium, marginBottom: 6 },
  heroDate: { color: '#94A3B8', fontSize: 12, fontFamily: FONTS.regular },

  receiptCard: {
    marginHorizontal: 20, borderRadius: 24, overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
    marginBottom: 24,
  },
  receiptTopBar: {
    paddingHorizontal: 20, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  receiptLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  receiptBrandText: { color: '#fff', fontSize: 16, fontFamily: FONTS.extrabold, letterSpacing: 1.5 },
  receiptTopBarLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontFamily: FONTS.medium },

  receiptBody: { padding: 20 },

  partyBlock: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 },
  partyIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  partyLabel: { color: '#94A3B8', fontSize: 11, fontFamily: FONTS.semibold, marginBottom: 3, letterSpacing: 0.4 },
  partyName: { color: '#0F172A', fontSize: 15, fontFamily: FONTS.bold },
  partySub: { color: '#94A3B8', fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },

  dottedWrap: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dottedCircleLeft: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#F8F7FF', marginLeft: -30 },
  dottedLine: { flex: 1, height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: '#EDE9FE' },
  dottedCircleRight: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#F8F7FF', marginRight: -30 },

  detailsBlock: { gap: 12, paddingVertical: 4 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  receiptLabel: { color: '#94A3B8', fontSize: 13, fontFamily: FONTS.regular },
  receiptValue: { color: '#0F172A', fontSize: 13, fontFamily: FONTS.semibold, textAlign: 'right', flex: 1, marginLeft: 16 },

  refBlock: { paddingVertical: 4, alignItems: 'center' },
  refLabel: { color: '#94A3B8', fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1, marginBottom: 6 },
  refValue: { color: '#475569', fontSize: 12, fontFamily: FONTS.medium, letterSpacing: 0.5 },

  receiptFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, backgroundColor: '#F8F7FF',
  },
  receiptFooterText: { color: '#94A3B8', fontSize: 11, fontFamily: FONTS.medium },
  footerDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#CBD5E1' },

  actions: { paddingHorizontal: 20, gap: 12 },
  actionBtn: { borderRadius: 18, overflow: 'hidden' },
  actionBtnInner: {
    height: 56, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
  },
  actionBtnText: { color: '#fff', fontSize: 15, fontFamily: FONTS.bold },
  actionBtnOutline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 56, borderRadius: 18, borderWidth: 2, borderColor: '#EDE9FE',
    backgroundColor: '#fff',
  },
  actionBtnOutlineText: { color: '#7C3AED', fontSize: 15, fontFamily: FONTS.bold },
});
