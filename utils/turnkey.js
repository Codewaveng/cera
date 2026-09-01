const { Turnkey } = require('@turnkey/sdk-server');

const turnkey = new Turnkey({
  apiBaseUrl: 'https://api.turnkey.com',
  apiPublicKey:  process.env.TURNKEY_API_PUBLIC_KEY,
  apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY,
  defaultOrganizationId: process.env.TURNKEY_ORGANIZATION_ID,
});

// One wallet per user, 3 accounts covering all 9 chains:
//   EVM  → ETH + Polygon + BNB + Sei  (same address)
//   SOL  → Solana
//   BTC  → Bitcoin (SegWit bech32)
const WALLET_ACCOUNTS = [
  {
    curve:         'CURVE_SECP256K1',
    pathFormat:    'PATH_FORMAT_BIP32',
    path:          "m/44'/60'/0'/0/0",
    addressFormat: 'ADDRESS_FORMAT_ETHEREUM',
  },
  {
    curve:         'CURVE_ED25519',
    pathFormat:    'PATH_FORMAT_BIP32',
    path:          "m/44'/501'/0'/0'",
    addressFormat: 'ADDRESS_FORMAT_SOLANA',
  },
  {
    curve:         'CURVE_SECP256K1',
    pathFormat:    'PATH_FORMAT_BIP32',
    path:          "m/44'/0'/0'/0/0",
    addressFormat: 'ADDRESS_FORMAT_BITCOIN_MAINNET_P2WPKH',
  },
];

// Creates a Turnkey wallet for a new user.
// Returns: { walletId, evm, sol, btc }
async function createUserWallet(userId) {
  const client = turnkey.apiClient();

  const result = await client.createWallet({
    walletName: `cera-user-${userId}`,
    accounts:   WALLET_ACCOUNTS,
    organizationId: process.env.TURNKEY_ORGANIZATION_ID,
  });

  const [evmAddress, solAddress, btcAddress] = result.addresses;

  return {
    walletId: result.walletId,
    evm: evmAddress,   // covers ETH, Polygon, BNB, Sei
    sol: solAddress,
    btc: btcAddress,
  };
}

module.exports = { createUserWallet };
