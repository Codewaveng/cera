require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { generateTxId } = require('../utils/helpers');

const EMAIL  = 'abdulfatahabdol2004@gmail.com';
const AMOUNT_NGN = 10000;
const AMOUNT_KOBO = AMOUNT_NGN * 100;

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const user = await User.findOne({ email: EMAIL.toLowerCase() });
  if (!user) { console.error('❌ User not found:', EMAIL); process.exit(1); }

  const before = user.balanceKobo / 100;
  user.balanceKobo += AMOUNT_KOBO;
  await user.save();
  const after = user.balanceKobo / 100;

  await Transaction.create({
    txId: generateTxId(),
    type: 'crypto_receive',
    toUser: user._id,
    amountKobo: AMOUNT_KOBO,
    narration: 'Demo crypto deposit (USDT)',
    crypto: 'USDT',
    cryptoAmount: 6.27,
    status: 'completed',
  });

  console.log(`\n👤 User   : ${user.name} (${user.ceraId})`);
  console.log(`💰 Before : ₦${before.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);
  console.log(`💰 After  : ₦${after.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);
  console.log(`✅ Credited ₦${AMOUNT_NGN.toLocaleString()} successfully\n`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => { console.error('❌', err.message); process.exit(1); });
