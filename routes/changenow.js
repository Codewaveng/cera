const router = require('express').Router();

const API_KEY  = process.env.CHANGENOW_API_KEY || '';
const BASE_URL = 'https://api.changenow.io/v1';

async function cn(path, opts = {}) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${BASE_URL}${path}${sep}api_key=${API_KEY}`, opts);
  return res.json();
}

// GET /api/changenow/currencies
router.get('/currencies', async (req, res) => {
  try {
    const data = await cn('/currencies?active=true&fixedRate=false');
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/changenow/estimate?from=btc&to=eth&amount=1
router.get('/estimate', async (req, res) => {
  try {
    const { from, to, amount } = req.query;
    if (!from || !to || !amount) return res.status(400).json({ error: 'from, to, amount required' });
    const data = await cn(`/exchange-amount/${amount}/${from}_${to}`);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/changenow/min?from=btc&to=eth
router.get('/min', async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await cn(`/min-amount/${from}_${to}`);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/changenow/create
// Body: { from, to, amount, address, refundAddress? }
router.post('/create', async (req, res) => {
  try {
    const { from, to, amount, address, refundAddress } = req.body;
    if (!from || !to || !amount || !address) {
      return res.status(400).json({ error: 'from, to, amount, address required' });
    }
    const payload = { from, to, amount, address };
    if (refundAddress) payload.refundAddress = refundAddress;
    const data = await cn(`/transactions/${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/changenow/status/:id
router.get('/status/:id', async (req, res) => {
  try {
    const data = await cn(`/transactions/${req.params.id}`);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
