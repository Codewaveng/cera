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
    const { enabled, bankName, accountNumber, accountName } = req.body;
    const user = await User.findById(req.user._id);
    user.autoProcessing = { enabled: !!enabled, bankName, accountNumber, accountName };
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

// GET /api/user/lookup?q=email_or_ceraid  (find another CERA user for transfers)
router.get('/lookup', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 3) return res.status(400).json({ error: 'Query too short' });

    const query = q.trim();
    const isEmail = query.includes('@');

    const found = await User.findOne(
      isEmail ? { email: query.toLowerCase() } : { ceraId: query.toUpperCase() }
    ).select('ceraId name email avatar');

    if (!found) return res.status(404).json({ error: 'No CERA user found' });
    if (found._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "You can't transfer to yourself" });
    }

    res.json({ user: { ceraId: found.ceraId, name: found.name, email: found.email, avatar: found.avatar } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/transactions
router.get('/transactions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const uid = req.user._id;
    const txns = await Transaction.find({
      $or: [
        // Outgoing CERA transfers — only visible to the sender
        { type: 'cera_transfer_out', fromUser: uid },
        // Incoming CERA transfers — only visible to the recipient
        { type: 'cera_transfer_in', toUser: uid },
        // All other types (crypto_receive, bank_payout, utility, funding)
        { type: { $nin: ['cera_transfer_out', 'cera_transfer_in'] }, $or: [{ fromUser: uid }, { toUser: uid }] },
      ],
    })
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
      from: tx.fromUser ? { name: tx.fromUser.name, ceraId: tx.fromUser.ceraId } : null,
      to: tx.toUser ? { name: tx.toUser.name, ceraId: tx.toUser.ceraId } : null,
      createdAt: tx.createdAt,
    }));

    res.json({ transactions: formatted, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
