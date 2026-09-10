const axios = require('axios');
const User  = require('../models/User');
const { sendPush } = require('./pushNotification');

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
      checkRateAlerts(fresh).catch(() => {});
    }
  } catch (err) {
    console.warn('⚠️  CoinGecko fetch failed:', err.message);
  }
}

async function checkRateAlerts(rates) {
  const users = await User.find({ 'rateAlerts.active': true }).select('fcmToken rateAlerts');
  for (const user of users) {
    let changed = false;
    for (const alert of user.rateAlerts) {
      if (!alert.active) continue;
      const rate = rates[alert.coin]?.priceNGN;
      if (!rate) continue;
      const triggered =
        (alert.direction === 'above' && rate >= alert.targetRate) ||
        (alert.direction === 'below' && rate <= alert.targetRate);
      if (triggered) {
        sendPush(
          user.fcmToken,
          `Rate Alert: ${alert.coin}`,
          `${alert.coin} is now ₦${rate.toLocaleString('en-NG')} — ${alert.direction === 'above' ? 'above' : 'below'} your target of ₦${alert.targetRate.toLocaleString('en-NG')}`,
          { type: 'rate_alert', coin: alert.coin }
        );
        alert.active = false;
        changed = true;
      }
    }
    if (changed) await user.save();
  }
}

function getRates() {
  return { rates: ratesCache, lastUpdated };
}

function getRateForCoin(symbol) {
  return ratesCache[symbol] ?? null;
}

module.exports = { refreshRates, getRates, getRateForCoin };
