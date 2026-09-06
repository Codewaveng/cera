require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const txResult = await Transaction.deleteMany({});
  console.log(`🗑️  Deleted ${txResult.deletedCount} transaction(s)`);

  const userResult = await User.updateMany({}, { $set: { balanceKobo: 0 } });
  console.log(`💸 Reset balance to ₦0 for ${userResult.modifiedCount} user(s)`);

  console.log('\n✅ All done — clean slate.\n');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
