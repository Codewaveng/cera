const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  guestId:       { type: String, required: true, unique: true },
  coin:          { type: String, required: true },
  chain:         { type: String, required: true },
  network:       { type: String, required: true },
  expectedAmount: { type: Number, default: null },
  receivedAmount: { type: Number, default: null },
  depositAddress: { type: String, required: true },
  poolWalletId:  { type: mongoose.Schema.Types.ObjectId, ref: 'PoolWallet' },
  bankCode:      { type: String, required: true },
  bankName:      { type: String, required: true },
  accountNumber: { type: String, required: true },
  accountName:   { type: String, required: true },
  nairaAmount:   { type: Number, default: null },
  rateUsed:      { type: Number, default: null },
  txHash:        { type: String, default: null },
  payoutRef:     { type: String, default: null },
  status: {
    type: String,
    enum: ['waiting', 'detected', 'processing', 'completed', 'failed', 'expired'],
    default: 'waiting',
  },
  expiresAt:     { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('GuestTransaction', guestSchema);
