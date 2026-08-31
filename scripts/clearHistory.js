require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected');

  // Keep only the ₦10,000 demo funding transaction
  const keep = await Transaction.findOne({ type: 'crypto_receive', amountKobo: 1000000 });
  if (!keep) { console.log('⚠️  Funding transaction not found — deleting everything'); }
  else { console.log(`✅ Keeping: ${keep.txId}`); }

  const result = await Transaction.deleteMany(keep ? { _id: { $ne: keep._id } } : {});
  console.log(`🗑️  Deleted ${result.deletedCount} transaction(s)`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
