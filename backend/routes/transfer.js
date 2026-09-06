const router = require('express').Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');
const { sendPush } = require('../utils/notifications');
const { generateTxId } = require('../utils/helpers');

router.use(authMiddleware);

// POST /api/transfer
// Body: { recipientQuery, amount (NGN), narration, pin }
router.post('/', async (req, res) => {
  try {
    const { recipientQuery, amount, narration, pin } = req.body;

    // Validate inputs
    if (!recipientQuery || !amount || !pin) {
      return res.status(400).json({ error: 'recipientQuery, amount, and pin are required' });
    }
    const amountNGN = parseFloat(amount);
    if (isNaN(amountNGN) || amountNGN < 50) {
      return res.status(400).json({ error: 'Minimum transfer amount is ₦50' });
    }
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'Invalid PIN' });
    }

    // Verify PIN
    const sender = await User.findById(req.user._id);
    if (!sender.pinSet) return res.status(400).json({ error: 'Please set your PIN before transferring' });
    const pinValid = await sender.matchPin(pin);
    if (!pinValid) return res.status(401).json({ error: 'Incorrect PIN' });

    // Find recipient
    const isEmail = recipientQuery.includes('@');
    const recipient = await User.findOne(
      isEmail
        ? { email: recipientQuery.toLowerCase().trim() }
        : { ceraId: recipientQuery.toUpperCase().trim() }
    );
    if (!recipient) return res.status(404).json({ error: 'CERA user not found' });
    if (recipient._id.toString() === sender._id.toString()) {
      return res.status(400).json({ error: "You can't transfer to yourself" });
    }

    const amountKobo = Math.round(amountNGN * 100);

    // Check balance
    if (sender.balanceKobo < amountKobo) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Execute transfer atomically
    sender.balanceKobo -= amountKobo;
    recipient.balanceKobo += amountKobo;

    const txId = generateTxId();

    const [outTx, inTx] = await Promise.all([
      Transaction.create({
        txId: txId + '-OUT',
        type: 'cera_transfer_out',
        fromUser: sender._id,
        toUser: recipient._id,
        amountKobo,
        narration: narration || `Transfer to ${recipient.name}`,
        status: 'completed',
      }),
      Transaction.create({
        txId: txId + '-IN',
        type: 'cera_transfer_in',
        fromUser: sender._id,
        toUser: recipient._id,
        amountKobo,
        narration: narration || `Transfer from ${sender.name}`,
        status: 'completed',
      }),
      sender.save(),
      recipient.save(),
    ]);

    // Push notification to recipient
    sendPush(
      recipient.fcmToken,
      '💰 Money Received',
      `${sender.name} sent you ₦${amountNGN.toLocaleString('en-NG')}`,
      { type: 'cera_transfer', txId }
    );

    res.json({
      message: 'Transfer successful',
      txId,
      amount: amountNGN,
      recipient: { name: recipient.name, ceraId: recipient.ceraId },
      newBalance: sender.balanceKobo / 100,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
