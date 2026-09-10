const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const auth     = require('../middleware/auth');
const User     = require('../models/User');
const Transaction = require('../models/Transaction');
const { sendPush } = require('../utils/pushNotification');

async function checkDailyLimit(user, amtKobo) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const result = await Transaction.aggregate([
    { $match: { fromUser: user._id, status: 'completed', type: { $in: ['utility', 'bank_payout', 'cera_transfer_out'] }, createdAt: { $gte: start } } },
    { $group: { _id: null, total: { $sum: '$amountKobo' } } },
  ]);
  const spentToday = result[0]?.total || 0;
  const limit = user.dailyLimitKobo || 20000000;
  if (spentToday + amtKobo > limit) {
    const remaining = Math.max(0, limit - spentToday) / 100;
    throw new Error(`Daily limit reached. You can spend up to ₦${remaining.toLocaleString('en-NG')} more today.`);
  }
}

const CK_BASE   = 'https://www.nellobytesystems.com';
const CK_USER   = process.env.CLUBKONNECT_USER_ID;
const CK_KEY    = process.env.CLUBKONNECT_API_KEY;
const CB_URL    = `${process.env.SERVER_URL || 'https://cera-hdj9.onrender.com'}/api/utility/callback`;

const NETWORK_CODES   = { MTN: '01', Glo: '02', '9mobile': '03', Airtel: '04' };
const CK_NET_KEYS     = { MTN: 'MTN', Glo: 'Glo', '9mobile': 'm_9mobile', Airtel: 'Airtel' };
const DISCO_CODES     = {
  EKEDC: '01', IKEDC: '02', AEDC: '03', KAEDC: '04',
  PHEDC: '05', EEDC:  '06', JEDC: '07', BEDC:  '08', YEDC: '09',
};

function parseCkDuration(name) {
  if (/night/i.test(name))   return 'Night';
  if (/weekend/i.test(name)) return 'Weekend';
  const m = name.match(/-\s*(\d+\s*(?:day|days|month|months|week|weeks))/i);
  if (m) return m[1].trim();
  if (/weekly/i.test(name))  return '7 days';
  if (/monthly/i.test(name)) return '30 days';
  return '';
}

function parseCkShortName(name) {
  const m = name.match(/^([\d.]+\s*(?:MB|GB|TB))/i);
  return m ? m[1] : name.split(' - ')[0];
}

function parseCkTag(name) {
  if (/\(SME\)/i.test(name))         return 'SME';
  if (/Awoof/i.test(name))           return 'Awoof';
  if (/Direct\s*Data/i.test(name))   return 'Direct';
  return null;
}

function genTxId() {
  return `UTIL${Date.now()}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function genRequestId() {
  return `CERA-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function ckGet(path) {
  const r = await fetch(`${CK_BASE}/${path}`);
  return r.json();
}

// ── Fetch real data plan list from ClubKonnect ────────────────────────────────
router.get('/data-plans', auth, async (req, res) => {
  try {
    const { network } = req.query;
    const netCode = NETWORK_CODES[network];
    if (!netCode) return res.status(400).json({ error: 'Invalid network' });

    const ck     = await ckGet(`APIDatabundlePlansV2.asp?UserID=${CK_USER}&APIKey=${CK_KEY}&MobileNetwork=${netCode}`);
    const netKey = CK_NET_KEYS[network];
    const netArr = ck?.MOBILE_NETWORK?.[netKey];
    const raw    = Array.isArray(netArr) && netArr[0]?.PRODUCT ? netArr[0].PRODUCT : [];

    console.log('[DataPlans]', network, `${raw.length} plans`);

    const plans = raw.map(p => {
      const fullName = String(p.PRODUCT_NAME ?? '');
      return {
        code:     String(p.PRODUCT_CODE ?? ''),
        name:     parseCkShortName(fullName),
        price:    Math.round(parseFloat(p.PRODUCT_AMOUNT ?? 0)),
        duration: parseCkDuration(fullName),
        tag:      parseCkTag(fullName),
        fullName,
      };
    }).filter(p => p.code && p.name && p.price > 0);

    res.json(plans);
  } catch (err) {
    console.error('[Utility/DataPlans]', err.message);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// ── Buy Airtime ──────────────────────────────────────────────────────────────
router.post('/airtime', auth, async (req, res) => {
  try {
    const { network, phone, amount } = req.body;
    const amt = parseFloat(amount);
    if (!network || !phone || !amt) return res.status(400).json({ error: 'Missing fields' });

    const netCode = NETWORK_CODES[network];
    if (!netCode) return res.status(400).json({ error: 'Invalid network' });
    if (amt < 50 || amt > 200000) return res.status(400).json({ error: 'Amount must be ₦50–₦200,000' });

    const user = await User.findById(req.user.id);
    const amtKobo = Math.round(amt * 100);
    if (user.balanceKobo < amtKobo) return res.status(400).json({ error: 'Insufficient balance' });
    try { await checkDailyLimit(user, amtKobo); } catch (e) { return res.status(400).json({ error: e.message }); }

    const requestId = genRequestId();
    const ck = await ckGet(`APIAirtimeV1.asp?UserID=${CK_USER}&APIKey=${CK_KEY}&MobileNetwork=${netCode}&Amount=${amt}&MobileNumber=${phone}&RequestID=${requestId}&CallBackURL=${CB_URL}`);

    if (!['100', '200'].includes(String(ck.statuscode)) && ck.status !== 'ORDER_RECEIVED' && ck.status !== 'ORDER_COMPLETED') {
      return res.status(400).json({ error: ck.status || 'Purchase failed. Please try again.' });
    }

    user.balanceKobo -= amtKobo;
    await user.save();

    await Transaction.create({
      txId:      genTxId(),
      type:      'utility',
      fromUser:  user._id,
      amountKobo: amtKobo,
      narration: `${network} Airtime - ${phone}`,
      reference: ck.orderid || requestId,
      status:    'completed',
      metadata:  { orderId: ck.orderid, requestId, network, phone },
    });

    sendPush(user.fcmToken, 'Airtime Sent!', `₦${amt.toLocaleString()} ${network} airtime sent to ${phone}`, { type: 'utility' });
    res.json({ success: true, orderId: ck.orderid, message: `₦${amt.toLocaleString()} airtime sent to ${phone}` });
  } catch (err) {
    console.error('[Utility/Airtime]', err.message);
    res.status(500).json({ error: 'Service unavailable. Try again shortly.' });
  }
});

// ── Buy Data ─────────────────────────────────────────────────────────────────
router.post('/data', auth, async (req, res) => {
  try {
    const { network, phone, planCode, planName, amount } = req.body;
    const amt = parseFloat(amount);
    if (!network || !phone || !planCode || !amt) return res.status(400).json({ error: 'Missing fields' });

    const netCode = NETWORK_CODES[network];
    if (!netCode) return res.status(400).json({ error: 'Invalid network' });

    const user = await User.findById(req.user.id);
    const amtKobo = Math.round(amt * 100);
    if (user.balanceKobo < amtKobo) return res.status(400).json({ error: 'Insufficient balance' });
    try { await checkDailyLimit(user, amtKobo); } catch (e) { return res.status(400).json({ error: e.message }); }

    const requestId = genRequestId();
    const ck = await ckGet(`APIDatabundleV1.asp?UserID=${CK_USER}&APIKey=${CK_KEY}&MobileNetwork=${netCode}&DataPlan=${planCode}&MobileNumber=${phone}&RequestID=${requestId}&CallBackURL=${CB_URL}`);

    if (!['100', '200'].includes(String(ck.statuscode)) && ck.status !== 'ORDER_RECEIVED' && ck.status !== 'ORDER_COMPLETED') {
      return res.status(400).json({ error: ck.status || 'Purchase failed. Please try again.' });
    }

    user.balanceKobo -= amtKobo;
    await user.save();

    await Transaction.create({
      txId:      genTxId(),
      type:      'utility',
      fromUser:  user._id,
      amountKobo: amtKobo,
      narration: `${network} ${planName} Data - ${phone}`,
      reference: ck.orderid || requestId,
      status:    'completed',
      metadata:  { orderId: ck.orderid, requestId, network, phone, planCode, planName },
    });

    sendPush(user.fcmToken, 'Data Purchased!', `${planName} data sent to ${phone}`, { type: 'utility' });
    res.json({ success: true, orderId: ck.orderid, message: `${planName} data sent to ${phone}` });
  } catch (err) {
    console.error('[Utility/Data]', err.message);
    res.status(500).json({ error: 'Service unavailable. Try again shortly.' });
  }
});

// ── Cable TV ──────────────────────────────────────────────────────────────────
router.post('/tv', auth, async (req, res) => {
  try {
    const { provider, packageCode, packageName, smartCard, phone, amount } = req.body;
    const amt = parseFloat(amount);
    if (!provider || !packageCode || !smartCard || !phone || !amt) return res.status(400).json({ error: 'Missing fields' });

    const user = await User.findById(req.user.id);
    const amtKobo = Math.round(amt * 100);
    if (user.balanceKobo < amtKobo) return res.status(400).json({ error: 'Insufficient balance' });
    try { await checkDailyLimit(user, amtKobo); } catch (e) { return res.status(400).json({ error: e.message }); }

    const requestId = genRequestId();
    const ck = await ckGet(`APICableTVV1.asp?UserID=${CK_USER}&APIKey=${CK_KEY}&CableTV=${provider.toLowerCase()}&Package=${packageCode}&SmartCardNo=${smartCard}&PhoneNo=${phone}&RequestID=${requestId}&CallBackURL=${CB_URL}`);

    if (!['100', '200'].includes(String(ck.statuscode)) && ck.status !== 'ORDER_RECEIVED' && ck.status !== 'ORDER_COMPLETED') {
      return res.status(400).json({ error: ck.status || 'Subscription failed. Please try again.' });
    }

    user.balanceKobo -= amtKobo;
    await user.save();

    await Transaction.create({
      txId:      genTxId(),
      type:      'utility',
      fromUser:  user._id,
      amountKobo: amtKobo,
      narration: `${provider} ${packageName} TV Subscription - ${smartCard}`,
      reference: ck.orderid || requestId,
      status:    'completed',
      metadata:  { orderId: ck.orderid, requestId, provider, smartCard, packageCode, packageName },
    });

    sendPush(user.fcmToken, 'TV Subscription Done!', `${packageName} activated for ${smartCard}`, { type: 'utility' });
    res.json({ success: true, orderId: ck.orderid, message: `${packageName} subscription activated for ${smartCard}` });
  } catch (err) {
    console.error('[Utility/TV]', err.message);
    res.status(500).json({ error: 'Service unavailable. Try again shortly.' });
  }
});

// ── Electricity ───────────────────────────────────────────────────────────────
router.post('/electricity', auth, async (req, res) => {
  try {
    const { disco, meterNo, meterType, phone, amount } = req.body;
    const amt = parseFloat(amount);
    if (!disco || !meterNo || !phone || !amt) return res.status(400).json({ error: 'Missing fields' });

    const discoCode = DISCO_CODES[disco];
    if (!discoCode) return res.status(400).json({ error: 'Invalid electricity company' });
    if (amt < 500) return res.status(400).json({ error: 'Minimum purchase is ₦500' });

    const user = await User.findById(req.user.id);
    const amtKobo = Math.round(amt * 100);
    if (user.balanceKobo < amtKobo) return res.status(400).json({ error: 'Insufficient balance' });
    try { await checkDailyLimit(user, amtKobo); } catch (e) { return res.status(400).json({ error: e.message }); }

    const requestId  = genRequestId();
    const meterCode  = meterType === 'Postpaid' ? '02' : '01';
    const ck = await ckGet(`APIElectricityV1.asp?UserID=${CK_USER}&APIKey=${CK_KEY}&ElectricCompany=${discoCode}&MeterType=${meterCode}&MeterNo=${meterNo}&Amount=${amt}&PhoneNo=${phone}&RequestID=${requestId}&CallBackURL=${CB_URL}`);

    if (!['100', '200'].includes(String(ck.statuscode)) && ck.status !== 'ORDER_RECEIVED' && ck.status !== 'ORDER_COMPLETED') {
      return res.status(400).json({ error: ck.status || 'Payment failed. Please try again.' });
    }

    user.balanceKobo -= amtKobo;
    await user.save();

    await Transaction.create({
      txId:      genTxId(),
      type:      'utility',
      fromUser:  user._id,
      amountKobo: amtKobo,
      narration: `${disco} Electricity Units - Meter ${meterNo}`,
      reference: ck.orderid || requestId,
      status:    'completed',
      metadata:  { orderId: ck.orderid, requestId, disco, meterNo, meterType, token: ck.metertoken },
    });

    sendPush(user.fcmToken, 'Electricity Purchased!', `₦${amt.toLocaleString()} units for Meter ${meterNo}${ck.metertoken ? ` — Token: ${ck.metertoken}` : ''}`, { type: 'utility' });
    res.json({
      success: true,
      orderId: ck.orderid,
      token:   ck.metertoken || null,
      message: `₦${amt.toLocaleString()} electricity units purchased for Meter ${meterNo}${ck.metertoken ? `. Token: ${ck.metertoken}` : ''}`,
    });
  } catch (err) {
    console.error('[Utility/Electricity]', err.message);
    res.status(500).json({ error: 'Service unavailable. Try again shortly.' });
  }
});

// ── Callback from ClubKonnect ─────────────────────────────────────────────────
router.post('/callback', async (req, res) => {
  console.log('[CK Callback]', JSON.stringify(req.body));
  res.json({ received: true });
});

module.exports = router;
