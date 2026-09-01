const {
  Turnkey,
  DEFAULT_ETHEREUM_ACCOUNTS,
  DEFAULT_SOLANA_ACCOUNTS,
  DEFAULT_BITCOIN_MAINNET_P2WPKH_ACCOUNTS,
  DEFAULT_TRON_ACCOUNTS,
} = require('@turnkey/sdk-server');

// One HD wallet per user → 4 accounts (EVM, SOL, BTC, TRON)
const WALLET_ACCOUNTS = [
  ...DEFAULT_ETHEREUM_ACCOUNTS,              // ETH + Polygon + BNB (same EVM address)
  ...DEFAULT_SOLANA_ACCOUNTS,               // Solana
  ...DEFAULT_BITCOIN_MAINNET_P2WPKH_ACCOUNTS, // Bitcoin native SegWit
  ...DEFAULT_TRON_ACCOUNTS,                 // TRON (native address, no derivation needed)
];

// Creates a Turnkey wallet for a new user — returns all 4 addresses
async function createUserWallet(userId) {
  const turnkey = new Turnkey({
    apiBaseUrl:             'https://api.turnkey.com',
    apiPublicKey:           process.env.TURNKEY_API_PUBLIC_KEY,
    apiPrivateKey:          process.env.TURNKEY_API_PRIVATE_KEY,
    defaultOrganizationId:  process.env.TURNKEY_ORGANIZATION_ID,
  });

  const client = turnkey.apiClient();
  const result = await client.createWallet({
    walletName:     `cera-user-${userId}`,
    accounts:       WALLET_ACCOUNTS,
    organizationId: process.env.TURNKEY_ORGANIZATION_ID,
  });

  // addresses array matches WALLET_ACCOUNTS order: [evm, sol, btc, tron]
  const [evm, sol, btc, tron] = result.addresses;

  return { walletId: result.walletId, evm, sol, btc, tron };
}

module.exports = { createUserWallet };
