const router = require('express').Router();
const User   = require('../models/User');
const { processIncomingCrypto } = require('../utils/processPayment');

// ─────────────────────────────────────────────
//  POST /api/webhook/btc
//  Handles Bitcoin confirmations via BlockCypher
// ─────────────────────────────────────────────
router.post('/btc', async (req, res) => {
  res.status(200).json({ received: true });

  try {
    const { hash, outputs } = req.body || {};
    if (!hash || !outputs) return;

    for (const output of outputs) {
      for (const addr of (output.addresses || [])) {
        const user = await User.findOne({ 'cryptoAddresses.btc': addr });
        if (!user) continue;

        const btcAmount = output.value / 1e8; // satoshis → BTC
        if (btcAmount <= 0) continue;

        await processIncomingCrypto({
          userId:       user._id,
          cryptoAmount: btcAmount,
          symbol:       'BTC',
          chain:        'Bitcoin',
          network:      'BTC_MAINNET',
          txHash:       hash,
        });
      }
    }
  } catch (err) {
    console.error('BTC webhook error:', err.message);
  }
});

module.exports = router;
