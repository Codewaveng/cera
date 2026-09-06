const axios = require('axios');

// In-memory cache — refreshed every 2 minutes by cron
let ratesCache = {};
let lastUpdated = null;

const COIN_IDS = {
  BTC:  'bitcoin',
  ETH:  'ethereum',
  SOL:  'solana',
  BNB:  'binancecoin',
  USDT: 'tether',
  USDC: 'usd-coin',
};

async function refreshRates() {
  try {
    const ids = Object.values(COIN_IDS).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=ngn,usd&include_24hr_change=true`;

    const headers = {};
    if (process.env.COINGECKO_API_KEY) {
      headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
    }

    const { data } = await axios.get(url, { headers, timeout: 8000 });

    const fresh = {};
    for (const [symbol, id] of Object.entries(COIN_IDS)) {
      if (data[id]) {
        fresh[symbol] = {
          priceNGN: data[id].ngn,
          priceUSD: data[id].usd,
          change24h: data[id].ngn_24h_change ?? 0,
        };
      }
    }

    if (Object.keys(fresh).length > 0) {
      ratesCache = fresh;
      lastUpdated = new Date();
      console.log('📈 Rates refreshed:', new Date().toISOString());
    }
  } catch (err) {
    console.warn('⚠️  CoinGecko fetch failed:', err.message);
  }
}

function getRates() {
  return { rates: ratesCache, lastUpdated };
}

function getRateForCoin(symbol) {
  return ratesCache[symbol] ?? null;
}

module.exports = { refreshRates, getRates, getRateForCoin };
