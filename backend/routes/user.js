const router = require('express').Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');

// All routes require auth
router.use(authMiddleware);

// GET /api/user/me
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/user/profile
router.put('/profile', async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    await user.save();
    res.json({ user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/user/fcm-token
router.put('/fcm-token', async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return res.status(400).json({ error: 'fcmToken required' });
    await User.findByIdAndUpdate(req.user._id, { fcmToken });
    res.json({ message: 'FCM token updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/user/auto-processing
router.put('/auto-processing', async (req, res) => {
  try {
    const { enabled, bankName, accountNumber, accountName, bankCode } = req.body;
    const user = await User.findById(req.user._id);
    user.autoProcessing = { enabled: !!enabled, bankName, accountNumber, accountName, bankCode };
    await user.save();
    res.json({ autoProcessing: user.autoProcessing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/user/kyc  (submit KYC info — mocked, no API call for now)
router.put('/kyc', async (req, res) => {
  try {
    const { nin, bvn } = req.body;
    if (!nin && !bvn) return res.status(400).json({ error: 'NIN or BVN required' });
    const user = await User.findById(req.user._id);
    user.kycStatus = 'pending';
    user.kycData = { nin: nin || null, bvn: bvn || null, submittedAt: new Date() };
    await user.save();
    // TODO: call Dojah API here to verify NIN/BVN
    res.json({ kycStatus: 'pending', message: 'KYC submitted. Under review.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/lookup?q=email_or_ceraid_or_@tag  (find another CERA user for transfers)
router.get('/lookup', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 3) return res.status(400).json({ error: 'Query too short' });

    const query = q.trim();
    // Email: contains @ and a dot after the @
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query);
    // @tag: starts with @
    const isTag = !isEmail && query.startsWith('@');
    const tagValue = isTag ? query.slice(1).toLowerCase() : query.toLowerCase();

    let found;
    if (isEmail) {
      found = await User.findOne({ email: query.toLowerCase() }).select('ceraId ceraTag name email avatar');
    } else if (isTag) {
      found = await User.findOne({ ceraTag: tagValue }).select('ceraId ceraTag name email avatar');
    } else {
      // Try ceraId first, then ceraTag
      found = await User.findOne({
        $or: [{ ceraId: query.toUpperCase() }, { ceraTag: tagValue }],
      }).select('ceraId ceraTag name email avatar');
    }

    if (!found) return res.status(404).json({ error: 'No CERA user found' });
    if (found._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "You can't transfer to yourself" });
    }

    res.json({ user: { ceraId: found.ceraId, ceraTag: found.ceraTag || null, name: found.name, email: found.email, avatar: found.avatar } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/check-tag?tag=xxx
router.get('/check-tag', async (req, res) => {
  try {
    const { tag } = req.query;
    if (!tag || tag.length < 3) return res.status(400).json({ error: 'Tag must be at least 3 characters' });
    const clean = tag.toLowerCase().replace(/[^a-z0-9_.]/g, '');
    if (clean !== tag.toLowerCase()) return res.status(400).json({ error: 'Invalid tag characters' });
    const existing = await User.findOne({ ceraTag: clean });
    res.json({ available: !existing, tag: clean });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/user/claim-tag
router.post('/claim-tag', async (req, res) => {
  try {
    const { tag } = req.body;
    if (!tag || tag.length < 3) return res.status(400).json({ error: 'Tag must be at least 3 characters' });
    const clean = tag.toLowerCase().replace(/[^a-z0-9_.]/g, '');
    if (clean.length < 3) return res.status(400).json({ error: 'Invalid tag' });

    const user = await User.findById(req.user._id);
    if (user.ceraTag) return res.status(400).json({ error: 'You already have a CERA tag' });

    const existing = await User.findOne({ ceraTag: clean });
    if (existing) return res.status(400).json({ error: 'Tag already taken. Choose another.' });

    user.ceraTag = clean;
    await user.save();
    res.json({ ceraTag: clean, message: `@${clean} is yours!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/transactions
router.get('/transactions', async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 50;
    const { type, search, from_date, to_date } = req.query;

    const uid = req.user._id;

    // Build base visibility filter
    const visibilityOr = [
      { type: 'cera_transfer_out', fromUser: uid },
      { type: 'cera_transfer_in',  toUser:   uid },
      { type: { $nin: ['cera_transfer_out', 'cera_transfer_in'] }, $or: [{ fromUser: uid }, { toUser: uid }] },
    ];

    const baseFilter = { $or: visibilityOr };

    // Optional type filter
    if (type && type !== 'all') baseFilter.type = type;

    // Optional narration search
    if (search) baseFilter.narration = { $regex: search, $options: 'i' };

    // Optional date range
    if (from_date || to_date) {
      baseFilter.createdAt = {};
      if (from_date) baseFilter.createdAt.$gte = new Date(from_date);
      if (to_date)   baseFilter.createdAt.$lte = new Date(to_date);
    }

    const txns = await Transaction.find(baseFilter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('fromUser', 'name ceraId')
      .populate('toUser', 'name ceraId');

    const formatted = txns.map((tx) => ({
      txId: tx.txId,
      type: tx.type,
      amount: tx.amountKobo / 100,
      fee: tx.feeKobo / 100,
      narration: tx.narration,
      status: tx.status,
      crypto: tx.crypto || null,
      cryptoAmount: tx.cryptoAmount ?? null,
      rate: tx.rate ?? null,
      from: tx.fromUser ? { name: tx.fromUser.name, ceraId: tx.fromUser.ceraId } : null,
      to: tx.toUser ? { name: tx.toUser.name, ceraId: tx.toUser.ceraId } : null,
      createdAt: tx.createdAt,
    }));

    res.json({ transactions: formatted, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/trusted-devices
router.get('/trusted-devices', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('loginHistory');
    const entries = (user.loginHistory || []).filter(e => e.status === 'success');

    const seen = new Map();
    for (const e of entries) {
      const key = e.userAgent || 'unknown';
      if (!seen.has(key)) {
        seen.set(key, {
          deviceName: parseDeviceName(e.userAgent),
          deviceType: parseDeviceType(e.userAgent),
          lastActive: e.createdAt,
          isCurrent: false,
        });
      }
    }

    res.json({ devices: Array.from(seen.values()) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/login-activity
router.get('/login-activity', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('loginHistory');
    const sessions = (user.loginHistory || []).slice(0, 20).map(e => ({
      status:     e.status,
      ip:         e.ip || 'Unknown',
      location:   'Nigeria',
      deviceType: parseDeviceType(e.userAgent),
      createdAt:  e.createdAt,
    }));
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Verify bank account (Paystack) ───────────────────────────────────────────
router.get('/verify-account', async (req, res) => {
  try {
    const { accountNumber, bankCode } = req.query;
    if (!accountNumber || !bankCode) return res.status(400).json({ error: 'accountNumber and bankCode required' });
    const r = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` },
    });
    const data = await r.json();
    if (!data.status) return res.status(400).json({ error: data.message || 'Could not verify account' });
    res.json({ accountName: data.data.account_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Beneficiaries ─────────────────────────────────────────────────────────────
router.get('/beneficiaries', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('beneficiaries');
    res.json({ beneficiaries: user.beneficiaries || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/beneficiaries', async (req, res) => {
  try {
    const { name, phone, network, type, label } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone required' });
    const user = await User.findById(req.user._id);
    user.beneficiaries.push({ name: name || '', phone, network: network || '', type: type || 'airtime', label: label || name || phone });
    await user.save();
    res.json({ beneficiaries: user.beneficiaries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/beneficiaries/:id', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.beneficiaries = user.beneficiaries.filter(b => b._id.toString() !== req.params.id);
    await user.save();
    res.json({ beneficiaries: user.beneficiaries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Rate Alerts ───────────────────────────────────────────────────────────────
router.get('/rate-alerts', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('rateAlerts');
    res.json({ rateAlerts: user.rateAlerts || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/rate-alerts', async (req, res) => {
  try {
    const { coin, targetRate, direction } = req.body;
    if (!coin || !targetRate || !direction) return res.status(400).json({ error: 'coin, targetRate, direction required' });
    const user = await User.findById(req.user._id);
    user.rateAlerts.push({ coin, targetRate: parseFloat(targetRate), direction, active: true });
    await user.save();
    res.json({ rateAlerts: user.rateAlerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/rate-alerts/:id', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.rateAlerts = user.rateAlerts.filter(a => a._id.toString() !== req.params.id);
    await user.save();
    res.json({ rateAlerts: user.rateAlerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Support Tickets ───────────────────────────────────────────────────────────
router.post('/support', async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ error: 'subject and message required' });
    const user = await User.findById(req.user._id);
    user.supportTickets.push({ subject: subject.trim(), message: message.trim() });
    await user.save();
    res.json({ message: 'Ticket submitted. We will respond within 24 hours.', ticketId: user.supportTickets[user.supportTickets.length - 1]._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/support', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('supportTickets');
    res.json({ tickets: (user.supportTickets || []).reverse() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: total spent today in kobo
async function getDailySpend(userId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const result = await Transaction.aggregate([
    { $match: { fromUser: userId, status: 'completed', type: { $in: ['utility', 'bank_payout', 'cera_transfer_out'] }, createdAt: { $gte: start } } },
    { $group: { _id: null, total: { $sum: '$amountKobo' } } },
  ]);
  return result[0]?.total || 0;
}
module.exports.getDailySpend = getDailySpend;

function parseDeviceName(ua = '') {
  if (/iPhone/i.test(ua))  return 'iPhone';
  if (/iPad/i.test(ua))    return 'iPad';
  if (/Android/i.test(ua)) return 'Android Device';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Mac/i.test(ua))     return 'Mac';
  return 'Unknown Device';
}

function parseDeviceType(ua = '') {
  if (/iPhone|iPad|Android/i.test(ua))  return 'Mobile';
  if (/Windows|Mac|Linux/i.test(ua))    return 'Desktop';
  return 'Unknown';
}

module.exports = router;
