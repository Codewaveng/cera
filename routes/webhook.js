const router  = require('express').Router();
const crypto  = require('crypto');
const User    = require('../models/User');
const { processIncomingCrypto, TOKEN_MAP } = require('../utils/processPayment');

// ─────────────────────────────────────────────
//  POST /api/webhook/alchemy
//  Handles EVM (ETH + Polygon + BNB) and Solana
// ─────────────────────────────────────────────
router.post('/alchemy', async (req, res) => {
  // Verify Alchemy signature
  const signingKey = process.env.ALCHEMY_SIGNING_KEY;
  if (signingKey) {
    const sig  = req.headers['x-alchemy-signature'];
    const body = JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', signingKey).update(body).digest('hex');
    if (sig !== hmac) return res.status(401).json({ error: 'Invalid signature' });
  }

  // Acknowledge immediately — Alchemy retries if we don't respond fast
  res.status(200).json({ received: true });

  try {
    const { type, event } = req.body || {};
    if (!event) return;

    // ── EVM: Address Activity ──
    if (type === 'ADDRESS_ACTIVITY') {
      const network  = event.network || '';
      const activity = event.activity || [];

      for (const item of activity) {
        const toAddr = item.toAddress?.toLowerCase();
        if (!toAddr) continue;

        // Find user by EVM address
        const user = await User.findOne({
          'cryptoAddresses.evm': new RegExp(`^${toAddr}$`, 'i'),
        });
        if (!user) continue;

        let symbol, cryptoAmount;

        if (item.category === 'token') {
          // ERC-20 token transfer
          const contract = item.rawContract?.address?.toLowerCase();
          symbol = TOKEN_MAP[contract];
          if (!symbol) continue; // unsupported token
          // value from Alchemy is already in human units for ERC-20
          cryptoAmount = parseFloat(item.value || 0);

        } else if (item.category === 'external' || item.category === 'internal') {
          // Native coin (ETH, MATIC, BNB)
          const chainSymbols = {
            ETH_MAINNET:    'ETH',
            MATIC_MAINNET:  'BNB', // Polygon MATIC → treat via its own rate if added
            ARB_MAINNET:    'ETH',
            BASE_MAINNET:   'ETH',
          };
          symbol = chainSymbols[network] || item.asset;
          cryptoAmount = parseFloat(item.value || 0);
        } else {
          continue;
        }

        if (!cryptoAmount || cryptoAmount <= 0) continue;

        const chain = networkToChain(network);
        await processIncomingCrypto({
          userId:       user._id,
          cryptoAmount,
          symbol,
          chain,
          network,
          txHash:       item.hash,
        });
      }
    }

    // ── Solana: Account Activity ──
    if (type === 'ACCOUNT_ACTIVITY') {
      const events = event.data || [];
      for (const solEvent of events) {
        const toAddr = solEvent.toUserAccount || solEvent.account;
        if (!toAddr) continue;

        const user = await User.findOne({
          'cryptoAddresses.sol': toAddr,
        });
        if (!user) continue;

        let symbol       = 'SOL';
        let cryptoAmount = 0;

        if (solEvent.tokenTransfers?.length) {
          // SPL token transfer
          const tt  = solEvent.tokenTransfers[0];
          const mint = tt.mint;
          symbol       = TOKEN_MAP[mint] || 'SOL';
          cryptoAmount = parseFloat(tt.tokenAmount || 0);
        } else {
          // Native SOL
          cryptoAmount = (solEvent.nativeTransfers || [])
            .filter(t => t.toUserAccount === toAddr)
            .reduce((sum, t) => sum + (t.amount / 1e9), 0);
        }

        if (!cryptoAmount || cryptoAmount <= 0) continue;

        await processIncomingCrypto({
          userId:       user._id,
          cryptoAmount,
          symbol,
          chain:        'Solana',
          network:      'SOLANA_MAINNET',
          txHash:       solEvent.signature,
        });
      }
    }

  } catch (err) {
    console.error('Alchemy webhook error:', err.message);
  }
});

// ─────────────────────────────────────────────
//  POST /api/webhook/btc
//  Handles Bitcoin via BlockCypher
// ─────────────────────────────────────────────
router.post('/btc', async (req, res) => {
  res.status(200).json({ received: true });

  try {
    const { hash, outputs, addresses: txAddresses } = req.body || {};
    if (!hash || !outputs) return;

    // Find which output(s) belong to CERA users
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
    console.error('BlockCypher webhook error:', err.message);
  }
});

function networkToChain(network) {
  const map = {
    ETH_MAINNET:   'Ethereum',
    MATIC_MAINNET: 'Polygon',
    ARB_MAINNET:   'Arbitrum',
    BASE_MAINNET:  'Base',
    OPT_MAINNET:   'Optimism',
  };
  return map[network] || network;
}

module.exports = router;
