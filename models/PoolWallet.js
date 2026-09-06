const mongoose = require('mongoose');

const poolWalletSchema = new mongoose.Schema({
  turnkeyWalletId: { type: String, required: true },
  addresses: {
    evm:  { type: String, default: null },
    sol:  { type: String, default: null },
    btc:  { type: String, default: null },
    tron: { type: String, default: null },
  },
  status:    { type: String, enum: ['available', 'locked'], default: 'available' },
  lockedBy:  { type: String, default: null },  // guestId
  lockedAt:  { type: Date, default: null },
  label:     { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('PoolWallet', poolWalletSchema);
