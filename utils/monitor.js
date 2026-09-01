// Registers new wallet addresses with monitoring services
// Called right after Turnkey wallet creation on signup

const ALCHEMY_TOKEN          = process.env.ALCHEMY_TOKEN;
const ALCHEMY_EVM_WEBHOOK_ID = process.env.ALCHEMY_EVM_WEBHOOK_ID;
const ALCHEMY_SOL_WEBHOOK_ID = process.env.ALCHEMY_SOL_WEBHOOK_ID;
const BLOCKCYPHER_TOKEN      = process.env.BLOCKCYPHER_TOKEN;
const SERVER_URL             = process.env.SERVER_URL || 'https://cera-hdj9.onrender.com';

async function registerEVMAddress(address) {
  if (!ALCHEMY_TOKEN || !ALCHEMY_EVM_WEBHOOK_ID) return;
  try {
    await fetch('https://dashboard.alchemy.com/api/update-webhook-addresses', {
      method: 'PATCH',
      headers: {
        'X-Alchemy-Token': ALCHEMY_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook_id: ALCHEMY_EVM_WEBHOOK_ID,
        addresses_to_add: [address],
      }),
    });
    console.log('✅ EVM address registered with Alchemy:', address);
  } catch (err) {
    console.error('Alchemy EVM register failed:', err.message);
  }
}

async function registerSolanaAddress(address) {
  if (!ALCHEMY_TOKEN || !ALCHEMY_SOL_WEBHOOK_ID) return;
  try {
    await fetch('https://dashboard.alchemy.com/api/update-webhook-addresses', {
      method: 'PATCH',
      headers: {
        'X-Alchemy-Token': ALCHEMY_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook_id: ALCHEMY_SOL_WEBHOOK_ID,
        addresses_to_add: [address],
      }),
    });
    console.log('✅ Solana address registered with Alchemy:', address);
  } catch (err) {
    console.error('Alchemy Solana register failed:', err.message);
  }
}

async function registerBTCAddress(address) {
  if (!BLOCKCYPHER_TOKEN) return;
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
    console.log('✅ BTC address registered with BlockCypher:', address);
  } catch (err) {
    console.error('BlockCypher register failed:', err.message);
  }
}

module.exports = { registerEVMAddress, registerSolanaAddress, registerBTCAddress };
