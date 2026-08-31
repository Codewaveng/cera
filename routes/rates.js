const router = require('express').Router();
const { getRates } = require('../utils/coingecko');

// GET /api/rates  — no auth required (public)
router.get('/', (req, res) => {
  const { rates, lastUpdated } = getRates();
  if (Object.keys(rates).length === 0) {
    return res.status(503).json({ error: 'Rates not yet loaded, try again shortly' });
  }
  res.json({ rates, lastUpdated });
});

module.exports = router;
