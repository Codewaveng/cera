const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  txId: { type: String, unique: true, required: true },

  type: {
    type: String,
    enum: ['cera_transfer_in', 'cera_transfer_out', 'crypto_receive', 'bank_payout', 'utility', 'funding'],
    required: true,
  },

  // For CERA-to-CERA transfers
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  toUser:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  amountKobo: { type: Number, required: true },
  feeKobo:    { type: Number, default: 0 },

  // For crypto transactions
  crypto:       { type: String, default: null },
  cryptoAmount: { type: Number, default: null },
  rate:         { type: Number, default: null },

  narration:  { type: String, default: '' },
  reference:  { type: String, default: null },

  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed',
  },

  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
