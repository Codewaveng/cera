const User        = require('../models/User');
const Transaction = require('../models/Transaction');
const { getRateForCoin } = require('./coingecko');
const { sendPush }       = require('./pushNotification');

// ERC-20 / SPL token contract → symbol mapping
const TOKEN_MAP = {
  // Ethereum mainnet
  '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT',
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC',
  // Polygon mainnet
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 'USDT',
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': 'USDC',
  // BNB Smart Chain
  '0x55d398326f99059ff775485246999027b3197955': 'USDT',
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': 'USDC',
  // Solana SPL (mint addresses)
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
};

// Core: convert crypto → Naira then credit balance or auto-process to bank
async function processIncomingCrypto({ userId, cryptoAmount, symbol, chain, txHash, network }) {
  // Prevent duplicate processing
  const existing = await Transaction.findOne({ txHash });
  if (existing) return;

  const rate = getRateForCoin(symbol);
  if (!rate || !rate.priceNGN) {
    console.error(`No rate found for ${symbol}`);
    return;
  }

  const nairaAmount = cryptoAmount * rate.priceNGN;
  const nairaKobo   = Math.round(nairaAmount * 100);

  const user = await User.findById(userId);
  if (!user) return;

  const auto = user.autoProcessing;

  if (auto?.enabled && auto?.accountNumber && auto?.bankCode) {
    // ── AUTO-PROCESSING: fire bank transfer immediately ──
    const payout = await triggerBankPayout({
      accountNumber: auto.accountNumber,
      bankCode:      auto.bankCode,
      accountName:   auto.accountName,
      amountKobo:    nairaKobo,
      narration:     `CERA Auto: ${cryptoAmount} ${symbol} on ${chain}`,
    });

    await Transaction.create({
      txId:          generateTxId(),
      txHash,
      type:          'bank_payout',
      fromUser:      user._id,
      toUser:        user._id,
      amountKobo:    nairaKobo,
      feeKobo:       0,
      narration:     `Auto-processed ${cryptoAmount} ${symbol} → ₦${nairaAmount.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`,
      coin:          symbol,
      chain,
      network,
      cryptoAmount,
      rateUsed:      rate.priceNGN,
      bankName:      auto.bankName,
      accountNumber: auto.accountNumber,
      status:        payout.success ? 'completed' : 'pending',
    });

    console.log(`⚡ Auto-processed ${cryptoAmount} ${symbol} for user ${user.ceraTag || user.ceraId}`);
    sendPush(user.fcmToken,
      'Payout Sent!',
      `₦${nairaAmount.toLocaleString('en-NG', { maximumFractionDigits: 2 })} is on its way to your bank`,
      { type: 'payout', amountNGN: nairaAmount }
    );

  } else {
    // ── MANUAL: credit Naira balance ──

    // 0.5% cashback, min ₦50 (5000 kobo), max ₦5,000 (500000 kobo)
    const rawCashback = Math.round(nairaKobo * 0.005);
    const cashbackKobo = rawCashback >= 5000 ? Math.min(rawCashback, 500000) : 0;

    user.balanceKobo = (user.balanceKobo || 0) + nairaKobo + cashbackKobo;
    if (cashbackKobo > 0) {
      user.cashbackEarningsKobo = (user.cashbackEarningsKobo || 0) + cashbackKobo;
    }
    await user.save();

    // Main crypto receive transaction — shows coin logo + amount in app
    await Transaction.create({
      txId:        generateTxId(),
      txHash,
      type:        'crypto_receive',
      toUser:      user._id,
      amountKobo:  nairaKobo,
      feeKobo:     0,
      narration:   `${cryptoAmount} ${symbol} received and converted`,
      crypto:      symbol,
      cryptoAmount,
      rate:        rate.priceNGN,
      status:      'completed',
    });

    // Separate cashback transaction — clearly labeled
    if (cashbackKobo > 0) {
      const cashbackNaira = cashbackKobo / 100;
      await Transaction.create({
        txId:       generateTxId(),
        type:       'funding',
        toUser:     user._id,
        amountKobo: cashbackKobo,
        feeKobo:    0,
        narration:  `0.5% cashback on ${cryptoAmount} ${symbol} conversion`,
        status:     'completed',
      });
      console.log(`💸 Cashback ₦${cashbackNaira.toFixed(2)} credited to ${user.ceraTag || user.ceraId}`);
    }

    console.log(`💰 Credited ₦${nairaAmount.toFixed(2)} to user ${user.ceraTag || user.ceraId}`);
    sendPush(user.fcmToken,
      'Money Received!',
      `You received ${cryptoAmount} ${symbol} → ₦${nairaAmount.toLocaleString('en-NG', { maximumFractionDigits: 2 })} added to your wallet`,
      { type: 'receive', coin: symbol, cryptoAmount, amountNGN: nairaAmount }
    );
  }
}

async function triggerBankPayout({ accountNumber, bankCode, accountName, amountKobo, narration }) {
  try {
    const recipientRes = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type:           'nuban',
        name:           accountName,
        account_number: accountNumber,
        bank_code:      bankCode,
        currency:       'NGN',
      }),
    });
    const { data: recipient } = await recipientRes.json();
    if (!recipient?.recipient_code) throw new Error('Recipient creation failed');

    const transferRes = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source:    'balance',
        amount:    amountKobo,
        recipient: recipient.recipient_code,
        reason:    narration,
      }),
    });
    const transfer = await transferRes.json();
    return { success: transfer.status === true };
  } catch (err) {
    console.error('Paystack transfer failed:', err.message);
    return { success: false };
  }
}

function generateTxId() {
  return 'TXN-' + Math.random().toString(36).slice(2, 12).toUpperCase();
}

module.exports = { processIncomingCrypto, TOKEN_MAP };
