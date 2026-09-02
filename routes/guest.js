const router = require('express').Router();
const { nanoid } = require('nanoid');
const PoolWallet = require('../models/PoolWallet');
const GuestTransaction = require('../models/GuestTransaction');
const { getRateForCoin } = require('../utils/coingecko');

const SUPPORTED = {
  BTC:  { chain: 'Bitcoin',        network: 'BTC_MAINNET',  addressKey: 'btc' },
  ETH:  { chain: 'Ethereum',       network: 'ETH_MAINNET',  addressKey: 'evm' },
  BNB:  { chain: 'BNB Smart Chain',network: 'BNB_MAINNET',  addressKey: 'evm' },
  SOL:  { chain: 'Solana',         network: 'SOL_MAINNET',  addressKey: 'sol' },
  TRX:  { chain: 'TRON',           network: 'TRX_MAINNET',  addressKey: 'tron' },
  USDT: { chain: null, network: null, addressKey: null }, // chain selected by user
  USDC: { chain: null, network: null, addressKey: null },
};

const TOKEN_CHAINS = {
  'ETH':     { chain: 'Ethereum',        network: 'ETH_MAINNET',  addressKey: 'evm' },
  'BNB':     { chain: 'BNB Smart Chain', network: 'BNB_MAINNET',  addressKey: 'evm' },
  'Polygon': { chain: 'Polygon',         network: 'MATIC_MAINNET', addressKey: 'evm' },
  'TRON':    { chain: 'TRON',            network: 'TRX_MAINNET',  addressKey: 'tron' },
  'Solana':  { chain: 'Solana',          network: 'SOL_MAINNET',  addressKey: 'sol' },
};

// Release expired locks every minute
setInterval(async () => {
  try {
    const expired = await GuestTransaction.find({ status: 'waiting', expiresAt: { $lt: new Date() } });
    for (const tx of expired) {
      await GuestTransaction.findByIdAndUpdate(tx._id, { status: 'expired' });
      if (tx.poolWalletId) {
        await PoolWallet.findByIdAndUpdate(tx.poolWalletId, { status: 'available', lockedBy: null, lockedAt: null });
      }
    }
  } catch (e) { /* silent */ }
}, 60_000);

// POST /api/guest/create
router.post('/create', async (req, res) => {
  try {
    const { coin, chain, amount, bankCode, bankName, accountNumber, accountName } = req.body;
    if (!coin || !accountNumber || !bankCode || !accountName || !bankName) {
      return res.status(400).json({ error: 'coin, bankCode, bankName, accountNumber, accountName required' });
    }

    let chainInfo;
    if (coin === 'USDT' || coin === 'USDC') {
      if (!chain) return res.status(400).json({ error: 'chain required for USDT/USDC' });
      chainInfo = TOKEN_CHAINS[chain];
      if (!chainInfo) return res.status(400).json({ error: 'Invalid chain' });
    } else {
      chainInfo = SUPPORTED[coin];
      if (!chainInfo) return res.status(400).json({ error: 'Unsupported coin' });
    }

    const rate = getRateForCoin(coin);
    if (!rate?.priceNGN) return res.status(400).json({ error: 'Rate unavailable, try again' });

    // Find available pool wallet
    const pool = await PoolWallet.findOne({ status: 'available' });
    if (!pool) return res.status(503).json({ error: 'All slots busy, try again in a few minutes' });

    const depositAddress = pool.addresses[chainInfo.addressKey];
    if (!depositAddress) return res.status(503).json({ error: 'No address available for this coin' });

    const guestId = nanoid(12);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    // Lock the pool wallet
    await PoolWallet.findByIdAndUpdate(pool._id, {
      status: 'locked', lockedBy: guestId, lockedAt: new Date(),
    });

    const nairaAmount = amount ? amount * rate.priceNGN : null;

    const tx = await GuestTransaction.create({
      guestId,
      coin, chain: chainInfo.chain, network: chainInfo.network,
      expectedAmount: amount || null,
      depositAddress,
      poolWalletId: pool._id,
      bankCode, bankName, accountNumber, accountName,
      nairaAmount, rateUsed: rate.priceNGN,
      expiresAt,
    });

    res.json({
      guestId,
      depositAddress,
      coin,
      chain: chainInfo.chain,
      expectedAmount: amount || null,
      estimatedNaira: nairaAmount,
      rate: rate.priceNGN,
      expiresAt,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/guest/:id
router.get('/:id', async (req, res) => {
  try {
    const tx = await GuestTransaction.findOne({ guestId: req.params.id });
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    res.json({
      guestId: tx.guestId,
      status: tx.status,
      coin: tx.coin,
      chain: tx.chain,
      depositAddress: tx.depositAddress,
      expectedAmount: tx.expectedAmount,
      receivedAmount: tx.receivedAmount,
      estimatedNaira: tx.nairaAmount,
      accountName: tx.accountName,
      bankName: tx.bankName,
      expiresAt: tx.expiresAt,
      createdAt: tx.createdAt,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/guest/:id/cancel
router.post('/:id/cancel', async (req, res) => {
  try {
    const tx = await GuestTransaction.findOne({ guestId: req.params.id });
    if (!tx) return res.status(404).json({ error: 'Not found' });
    if (tx.status !== 'waiting') return res.status(400).json({ error: 'Cannot cancel' });
    await GuestTransaction.findByIdAndUpdate(tx._id, { status: 'expired' });
    if (tx.poolWalletId) {
      await PoolWallet.findByIdAndUpdate(tx.poolWalletId, { status: 'available', lockedBy: null, lockedAt: null });
    }
    res.json({ message: 'Cancelled' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
