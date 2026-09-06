// Registers new Bitcoin addresses with BlockCypher for real-time webhook notifications.
// ETH / BNB / Polygon / TRON / Solana are monitored via the chainPoller cron job (free public APIs).

const BLOCKCYPHER_TOKEN = process.env.BLOCKCYPHER_TOKEN;
const SERVER_URL        = process.env.SERVER_URL || 'https://cera-hdj9.onrender.com';

async function registerBTCAddress(address) {
  if (!BLOCKCYPHER_TOKEN || !address) return;
  try {
    await fetch(`https://api.blockcypher.com/v1/btc/main/hooks?token=${BLOCKCYPHER_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event:   'confirmed-tx',
        address: address,
        url:     `${SERVER_URL}/api/webhook/btc`,
      }),
    });
    console.log('BTC address registered with BlockCypher:', address);
  } catch (err) {
    console.error('BlockCypher register failed:', err.message);
  }
}

module.exports = { registerBTCAddress };
