const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');
const { generateCeraId, generateTxId } = require('../utils/helpers');
const { createUserWallet } = require('../utils/turnkey');
const { registerBTCAddress } = require('../utils/monitor');
const { addEVMAddress, subscribeSOLAddress } = require('../utils/blockchainWatcher');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, referralCode } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    // Validate referral code before creating user
    let referrer = null;
    if (referralCode && referralCode.trim()) {
      referrer = await User.findOne({ ceraId: referralCode.trim().toUpperCase() });
    }

    const ceraId = generateCeraId();

    // Create user first so we have their _id for the wallet name
    const user = await User.create({
      name, email, phone, password, ceraId,
      referredBy: referrer ? referrer._id : null,
    });

    // Create Turnkey wallets synchronously — user receives wallet addresses immediately
    try {
      const { walletId, evm, sol, btc, tron } = await createUserWallet(user._id.toString());
      user.turnkeyWalletId = walletId;
      user.cryptoAddresses = { evm, sol, btc, tron };
      await user.save();

      // Register addresses for real-time monitoring
      await registerBTCAddress(btc);
      addEVMAddress(evm);
      subscribeSOLAddress(sol);

      console.log(`✅ Wallets created for ${user.ceraId}: EVM=${evm} SOL=${sol} BTC=${btc} TRON=${tron}`);
    } catch (walletErr) {
      console.error('❌ Turnkey wallet creation failed:', walletErr.message);
      // User is registered but without wallets — the receive screen auto-retry will handle it
    }

    // Credit referral bonus — ₦500 to both new user and referrer
    if (referrer) {
      const BONUS = 50000; // ₦500 in kobo
      const now = new Date();

      // Credit new user
      user.balanceKobo = (user.balanceKobo || 0) + BONUS;
      await user.save();
      await Transaction.create({
        txId: generateTxId(),
        type: 'funding',
        toUser: user._id,
        amountKobo: BONUS,
        feeKobo: 0,
        narration: `Referral bonus — signed up with ${referrer.ceraId}`,
        status: 'completed',
      });

      // Credit referrer
      referrer.balanceKobo = (referrer.balanceKobo || 0) + BONUS;
      referrer.referralCount = (referrer.referralCount || 0) + 1;
      referrer.referralEarningsKobo = (referrer.referralEarningsKobo || 0) + BONUS;
      await referrer.save();
      await Transaction.create({
        txId: generateTxId(),
        type: 'funding',
        toUser: referrer._id,
        amountKobo: BONUS,
        feeKobo: 0,
        narration: `Referral bonus — ${user.name} joined with your code`,
        status: 'completed',
      });

      console.log(`🎁 Referral bonus: ₦500 each to ${user.ceraId} and ${referrer.ceraId}`);
    }

    res.status(201).json({
      token: signToken(user._id),
      user: user.toPublic(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({ token: signToken(user._id), user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/set-pin  (authenticated — first time setup)
router.post('/set-pin', authMiddleware, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
    }

    const user = await User.findById(req.user._id);
    user.pin = pin;
    await user.save();

    res.json({ message: 'PIN set successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/change-pin  (authenticated — requires current PIN)
router.post('/change-pin', authMiddleware, async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    if (!currentPin || !newPin || !/^\d{4}$/.test(newPin)) {
      return res.status(400).json({ error: 'Invalid PIN format' });
    }

    const user = await User.findById(req.user._id);
    if (!(await user.matchPin(currentPin))) {
      return res.status(401).json({ error: 'Current PIN is incorrect' });
    }

    user.pin = newPin;
    await user.save();
    res.json({ message: 'PIN changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/verify-pin  (authenticated — returns true/false for UI gating)
router.post('/verify-pin', authMiddleware, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ error: 'PIN required' });

    const user = await User.findById(req.user._id);
    const valid = await user.matchPin(pin);
    if (!valid) return res.status(401).json({ error: 'Incorrect PIN' });

    res.json({ valid: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
