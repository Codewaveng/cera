const router = require('express').Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'cera-admin-2024';

// POST /api/admin/reset-tags?secret=xxx
// Clears ceraTag for ALL users so everyone can reclaim fresh tags
router.post('/reset-tags', async (req, res) => {
  const { secret } = req.query;
  if (secret !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const result = await User.updateMany({}, { $set: { ceraTag: null } });
    res.json({ message: `Reset complete. ${result.modifiedCount} users cleared.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/full-reset?secret=xxx
// Deletes ALL users and transactions — fresh slate for testing
router.post('/full-reset', async (req, res) => {
  if (req.query.secret !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const [users, txns] = await Promise.all([
      User.deleteMany({}),
      Transaction.deleteMany({}),
    ]);
    res.json({ message: `Deleted ${users.deletedCount} users and ${txns.deletedCount} transactions.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
