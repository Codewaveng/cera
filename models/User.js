const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  ceraId: {
    type: String,
    unique: true,
    required: true,
  },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  password: { type: String, required: true },

  pin: { type: String, default: null },
  pinSet: { type: Boolean, default: false },

  // NGN balance in kobo (store as integer to avoid float issues)
  // e.g. ₦1,000 = 100000 kobo
  balanceKobo: { type: Number, default: 0 },

  avatar: { type: String, default: null },

  isEmailVerified: { type: Boolean, default: false },

  kycStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified'],
    default: 'unverified',
  },
  kycData: {
    nin: { type: String, default: null },
    bvn: { type: String, default: null },
    submittedAt: { type: Date, default: null },
  },

  ceraTag: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    default: null,
  },

  fcmToken: { type: String, default: null },

  autoProcessing: {
    enabled: { type: Boolean, default: false },
    bankName: { type: String, default: null },
    bankCode: { type: String, default: null },
    accountNumber: { type: String, default: null },
    accountName: { type: String, default: null },
  },

  // Timestamp of last on-chain poll (used by chainPoller to fetch only new txs)
  lastTxCheck: { type: Date, default: null },

  // Real on-chain wallet addresses (created via Turnkey on signup)
  turnkeyWalletId: { type: String, default: null },
  cryptoAddresses: {
    evm:  { type: String, default: null }, // ETH + Polygon + BNB (same key)
    tron: { type: String, default: null }, // TRON — derived from EVM key
    sol:  { type: String, default: null }, // Solana
    btc:  { type: String, default: null }, // Bitcoin
    ton:  { type: String, default: null }, // TON (future)
    sui:  { type: String, default: null }, // Sui (future)
    stx:  { type: String, default: null }, // Stacks (future)
  },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  if (this.isModified('pin') && this.pin) {
    this.pin = await bcrypt.hash(this.pin, 10);
    this.pinSet = true;
  }
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.matchPin = function (plain) {
  if (!this.pin) return Promise.resolve(false);
  return bcrypt.compare(plain, this.pin);
};

// Never expose sensitive fields
userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    ceraId: this.ceraId,
    ceraTag: this.ceraTag || null,
    name: this.name,
    email: this.email,
    phone: this.phone,
    balance: this.balanceKobo / 100,
    avatar: this.avatar,
    pinSet: this.pinSet,
    kycStatus: this.kycStatus,
    autoProcessing: this.autoProcessing,
    cryptoAddresses: this.cryptoAddresses,
    walletsReady: !!(this.cryptoAddresses?.evm),
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
