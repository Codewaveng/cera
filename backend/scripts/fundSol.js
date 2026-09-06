require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { generateTxId } = require('../utils/helpers');

const EMAIL = 'abdulfatahabdol123@gmail.com';
const SOL_AMOUNT = 50;

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Fetch live SOL/NGN rate
  console.log('📈 Fetching live SOL rate...');
  const { data } = await axios.get(
    'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=ngn,usd',
    { timeout: 10000 }
  );
  const priceNGN = data.solana.ngn;
  const priceUSD = data.solana.usd;
  const amountNGN = Math.round(SOL_AMOUNT * priceNGN);
  const amountKobo = amountNGN * 100;

  console.log(`💱 SOL = ₦${priceNGN.toLocaleString()} ($${priceUSD})`);
  console.log(`💰 50 SOL = ₦${amountNGN.toLocaleString()}`);

  const user = await User.findOne({ email: EMAIL.toLowerCase() });
  if (!user) { console.error('❌ User not found:', EMAIL); process.exit(1); }

  const before = user.balanceKobo / 100;
  user.balanceKobo += amountKobo;
  await user.save();
  const after = user.balanceKobo / 100;

  await Transaction.create({
    txId: generateTxId() + '-SOL',
    type: 'crypto_receive',
    toUser: user._id,
    amountKobo,
    narration: `${SOL_AMOUNT} SOL received and converted`,
    crypto: 'SOL',
    cryptoAmount: SOL_AMOUNT,
    rate: priceNGN,
    status: 'completed',
  });

  console.log(`\n👤 User   : ${user.name} (${user.ceraId})`);
  console.log(`💰 Before : ₦${before.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);
  console.log(`💰 After  : ₦${after.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);
  console.log(`✅ Credited ₦${amountNGN.toLocaleString()} (50 SOL @ ₦${priceNGN.toLocaleString()})\n`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
