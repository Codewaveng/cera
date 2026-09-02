const router = require('express').Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const GuestTransaction = require('../models/GuestTransaction');
const PoolWallet = require('../models/PoolWallet');
const { getRateForCoin } = require('../utils/coingecko');
const { createUserWallet } = require('../utils/turnkey');

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'cera-admin-2024';

function auth(req, res, next) {
  const secret = req.headers['x-admin-secret'] || req.query.secret;
  if (secret !== ADMIN_SECRET) return res.status(403).json({ error: 'Forbidden' });
  next();
}

router.use(auth);

// ── Dashboard stats ────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers, totalTxns, guestTxns,
      pendingGuests, volumeResult, poolStats,
    ] = await Promise.all([
      User.countDocuments(),
      Transaction.countDocuments(),
      GuestTransaction.countDocuments(),
      GuestTransaction.countDocuments({ status: { $in: ['waiting', 'detected', 'processing'] } }),
      Transaction.aggregate([{ $group: { _id: null, total: { $sum: '$amountKobo' } } }]),
      PoolWallet.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);
    const totalVolumeKobo = volumeResult[0]?.total || 0;
    const poolAvailable = poolStats.find(p => p._id === 'available')?.count || 0;
    const poolLocked = poolStats.find(p => p._id === 'locked')?.count || 0;
    res.json({
      totalUsers, totalTxns, guestTxns, pendingGuests,
      totalVolumeNGN: totalVolumeKobo / 100,
      pool: { available: poolAvailable, locked: poolLocked, total: poolAvailable + poolLocked },
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Users ──────────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = search
      ? { $or: [
          { name: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') },
          { ceraId: new RegExp(search, 'i') },
          { ceraTag: new RegExp(search, 'i') },
        ]}
      : {};
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -pin')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(query),
    ]);
    res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -pin').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const txns = await Transaction.find({ $or: [{ fromUser: user._id }, { toUser: user._id }] })
      .sort({ createdAt: -1 }).limit(20).lean();
    res.json({ user, transactions: txns });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, phone, balanceKobo, kycStatus, ceraTag, fcmToken } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email.toLowerCase().trim();
    if (phone !== undefined) update.phone = phone;
    if (balanceKobo !== undefined) update.balanceKobo = Number(balanceKobo);
    if (kycStatus !== undefined) update.kycStatus = kycStatus;
    if (ceraTag !== undefined) update.ceraTag = ceraTag;
    if (fcmToken !== undefined) update.fcmToken = fcmToken;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password -pin');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/users/:id/reset-pin', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { pin: null, pinSet: false });
    res.json({ message: 'PIN reset' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/users/:id/credit', async (req, res) => {
  try {
    const { amountNGN, note } = req.body;
    const amountKobo = Math.round(Number(amountNGN) * 100);
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $inc: { balanceKobo: amountKobo } },
      { new: true }
    ).select('-password -pin');
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (amountKobo !== 0) {
      await Transaction.create({
        txId: 'ADM-' + Date.now(),
        type: amountKobo > 0 ? 'admin_credit' : 'admin_debit',
        toUser: user._id,
        amountKobo: Math.abs(amountKobo),
        narration: note || `Admin adjustment: ₦${amountNGN}`,
        status: 'completed',
      });
    }
    res.json({ newBalanceNGN: user.balanceKobo / 100 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/users/:id/generate-wallet', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { walletId, evm, sol, btc, tron } = await createUserWallet(user._id.toString());
    user.turnkeyWalletId = walletId;
    user.cryptoAddresses = { evm, sol, btc, tron };
    await user.save();
    res.json({ evm, sol, btc, tron });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Transactions ───────────────────────────────────────────────────────────
router.get('/transactions', async (req, res) => {
  try {
    const { type, status, search, page = 1, limit = 50 } = req.query;
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) query.txHash = new RegExp(search, 'i');
    const [txns, total] = await Promise.all([
      Transaction.find(query)
        .populate('fromUser', 'name ceraId email')
        .populate('toUser', 'name ceraId email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      Transaction.countDocuments(query),
    ]);
    res.json({ transactions: txns, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/transactions/:id', async (req, res) => {
  try {
    const { status, narration, amountKobo } = req.body;
    const update = {};
    if (status) update.status = status;
    if (narration) update.narration = narration;
    if (amountKobo !== undefined) update.amountKobo = Number(amountKobo);
    const tx = await Transaction.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!tx) return res.status(404).json({ error: 'Not found' });
    res.json(tx);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/transactions/:id', async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/transactions', async (req, res) => {
  try {
    const tx = await Transaction.create({
      txId: 'MAN-' + Date.now(),
      ...req.body,
    });
    res.status(201).json(tx);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Guest Transactions ─────────────────────────────────────────────────────
router.get('/guest', async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const query = status ? { status } : {};
    const [guests, total] = await Promise.all([
      GuestTransaction.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).lean(),
      GuestTransaction.countDocuments(query),
    ]);
    res.json({ guests, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/guest/:id', async (req, res) => {
  try {
    const tx = await GuestTransaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tx) return res.status(404).json({ error: 'Not found' });
    res.json(tx);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/guest/:id', async (req, res) => {
  try {
    const tx = await GuestTransaction.findById(req.params.id);
    if (tx?.poolWalletId) {
      await PoolWallet.findByIdAndUpdate(tx.poolWalletId, { status: 'available', lockedBy: null, lockedAt: null });
    }
    await GuestTransaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Wallet Pool ────────────────────────────────────────────────────────────
router.get('/pool', async (req, res) => {
  try {
    const pool = await PoolWallet.find().sort({ createdAt: -1 }).lean();
    res.json(pool);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/pool', async (req, res) => {
  try {
    const { turnkeyWalletId, evm, sol, btc, tron, label } = req.body;
    if (!turnkeyWalletId) return res.status(400).json({ error: 'turnkeyWalletId required' });
    const wallet = await PoolWallet.create({
      turnkeyWalletId, label,
      addresses: { evm, sol, btc, tron },
    });
    res.status(201).json(wallet);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/pool/:id', async (req, res) => {
  try {
    const wallet = await PoolWallet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!wallet) return res.status(404).json({ error: 'Not found' });
    res.json(wallet);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/pool/:id', async (req, res) => {
  try {
    await PoolWallet.findByIdAndDelete(req.params.id);
    res.json({ message: 'Removed from pool' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Rates ──────────────────────────────────────────────────────────────────
router.get('/rates', async (req, res) => {
  try {
    const coins = ['BTC', 'ETH', 'BNB', 'SOL', 'USDT', 'USDC', 'TRX', 'MATIC'];
    const rates = {};
    for (const coin of coins) {
      rates[coin] = getRateForCoin(coin);
    }
    res.json(rates);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── System / Resets ────────────────────────────────────────────────────────
router.post('/reset-tags', async (req, res) => {
  try {
    const result = await User.updateMany({}, { $set: { ceraTag: null } });
    res.json({ message: `Reset ${result.modifiedCount} tags` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/full-reset', async (req, res) => {
  try {
    const [users, txns, guests] = await Promise.all([
      User.deleteMany({}),
      Transaction.deleteMany({}),
      GuestTransaction.deleteMany({}),
    ]);
    res.json({
      message: `Deleted ${users.deletedCount} users, ${txns.deletedCount} transactions, ${guests.deletedCount} guest txns`,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
