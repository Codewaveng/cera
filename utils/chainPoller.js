const crypto = require('crypto');
const User = require('../models/User');
const { processIncomingCrypto } = require('./processPayment');

const TRONGRID_KEY = process.env.TRONGRID_API_KEY || '';

// Etherscan API V2 — one key covers all 60+ EVM chains
const ETHERSCAN_V2 = 'https://api.etherscan.io/v2/api';

const EVM_CHAINS = [
  {
    name: 'Ethereum', network: 'ETH_MAINNET', chainId: 1,
    nativeSymbol: 'ETH',
    tokens: {
      '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: 'USDT', decimals: 6 },
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: 'USDC', decimals: 6 },
    },
  },
  {
    name: 'BNB Smart Chain', network: 'BNB_MAINNET', chainId: 56,
    nativeSymbol: 'BNB',
    tokens: {
      '0x55d398326f99059ff775485246999027b3197955': { symbol: 'USDT', decimals: 18 },
      '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': { symbol: 'USDC', decimals: 18 },
    },
  },
  {
    name: 'Polygon', network: 'MATIC_MAINNET', chainId: 137,
    nativeSymbol: 'MATIC',
    tokens: {
      '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': { symbol: 'USDT', decimals: 6 },
      '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': { symbol: 'USDC', decimals: 6 },
    },
  },
];

const SOL_RPC     = 'https://api.mainnet-beta.solana.com';
const USDT_SOL    = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
const USDC_SOL    = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const TRON_USDT   = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const TRON_USDC   = 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── EVM (ETH / BNB / Polygon) — Etherscan API V2, one key for all chains ──
function ethV2Url(chainId, params) {
  const key = process.env.ETHERSCAN_API_KEY || '';
  const qs  = new URLSearchParams({ chainid: chainId, apikey: key, ...params }).toString();
  return `${ETHERSCAN_V2}?${qs}`;
}

async function checkEVMChain(address, chain, since) {
  const results = [];
  const sinceTs = Math.floor(since / 1000);
  const addr    = address.toLowerCase();

  // ERC-20 token transfers (USDT / USDC)
  try {
    const r = await fetch(ethV2Url(chain.chainId, { module: 'account', action: 'tokentx', address, sort: 'desc' }));
    const d = await r.json();
    if (d.status === '1') {
      for (const tx of (d.result || [])) {
        if (parseInt(tx.timeStamp) <= sinceTs) break;
        if (tx.to?.toLowerCase() !== addr) continue;
        const token = chain.tokens[tx.contractAddress?.toLowerCase()];
        if (!token) continue;
        const decimals = token.decimals ?? parseInt(tx.tokenDecimal || '18');
        const amount   = parseFloat(tx.value) / Math.pow(10, decimals);
        if (amount > 0) results.push({ txHash: tx.hash, symbol: token.symbol, cryptoAmount: amount, chain: chain.name, network: chain.network });
      }
    }
  } catch (e) { console.error(`[${chain.name}] token err:`, e.message); }

  await sleep(350);

  // Native coin transfers (ETH / BNB / MATIC)
  try {
    const r = await fetch(ethV2Url(chain.chainId, { module: 'account', action: 'txlist', address, sort: 'desc' }));
    const d = await r.json();
    if (d.status === '1') {
      for (const tx of (d.result || [])) {
        if (parseInt(tx.timeStamp) <= sinceTs) break;
        if (tx.to?.toLowerCase() !== addr) continue;
        if (tx.isError === '1') continue;
        const amount = parseFloat(tx.value) / 1e18;
        if (amount > 0) results.push({ txHash: tx.hash, symbol: chain.nativeSymbol, cryptoAmount: amount, chain: chain.name, network: chain.network });
      }
    }
  } catch (e) { console.error(`[${chain.name}] native err:`, e.message); }

  return results;
}

// ── Solana (SPL USDT / USDC) ───────────────────────────────────────────────
async function solRpc(method, params) {
  const r = await fetch(SOL_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const d = await r.json();
  return d.result;
}

async function checkSolana(ownerAddress, since) {
  const results = [];
  const sinceTs = Math.floor(since / 1000);

  for (const [mint, symbol] of [[USDT_SOL, 'USDT'], [USDC_SOL, 'USDC']]) {
    try {
      // Resolve associated token account for this owner + mint
      const taResult = await solRpc('getTokenAccountsByOwner', [
        ownerAddress,
        { mint },
        { encoding: 'base64' },
      ]);
      const tokenAccount = taResult?.value?.[0]?.pubkey;
      if (!tokenAccount) continue;

      // Get recent confirmed signatures for that token account
      const sigs = await solRpc('getSignaturesForAddress', [tokenAccount, { limit: 15 }]);

      for (const sig of (sigs || [])) {
        if (sig.err) continue;
        if ((sig.blockTime || 0) <= sinceTs) break;

        const tx = await solRpc('getTransaction', [
          sig.signature,
          { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 },
        ]);
        if (!tx) continue;

        // Find balance change for our token account in this tx
        const pre  = tx.meta?.preTokenBalances?.find(b => b.mint === mint && b.owner === ownerAddress);
        const post = tx.meta?.postTokenBalances?.find(b => b.mint === mint && b.owner === ownerAddress);
        const diff = (post?.uiTokenAmount?.uiAmount || 0) - (pre?.uiTokenAmount?.uiAmount || 0);

        if (diff > 0.000001) {
          results.push({ txHash: sig.signature, symbol, cryptoAmount: diff, chain: 'Solana', network: 'SOL_MAINNET' });
        }
        await sleep(120);
      }
    } catch (e) { console.error(`[Solana ${symbol}] err:`, e.message); }
    await sleep(400);
  }
  return results;
}

// ── TRON (TRC-20 USDT / USDC) ──────────────────────────────────────────────
// TRON uses the same secp256k1 key as EVM — derive address from EVM address.
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function toBase58Check(buf) {
  const h1 = crypto.createHash('sha256').update(buf).digest();
  const h2 = crypto.createHash('sha256').update(h1).digest();
  const full = Buffer.concat([buf, h2.slice(0, 4)]);
  const digits = [0];
  for (const byte of full) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) { digits.push(carry % 58); carry = Math.floor(carry / 58); }
  }
  let out = '';
  for (let i = 0; i < full.length && full[i] === 0; i++) out += '1';
  for (let i = digits.length - 1; i >= 0; i--) out += BASE58[digits[i]];
  return out;
}

function evmToTron(evmAddr) {
  const hex = evmAddr.replace(/^0x/, '').toLowerCase().padStart(40, '0');
  return toBase58Check(Buffer.from('41' + hex, 'hex'));
}

async function checkTron(evmAddress, since) {
  const results  = [];
  const tronAddr = evmToTron(evmAddress);
  const minTs    = since;
  const headers  = TRONGRID_KEY ? { 'TRON-PRO-API-KEY': TRONGRID_KEY } : {};

  for (const [contract, symbol] of [[TRON_USDT, 'USDT'], [TRON_USDC, 'USDC']]) {
    try {
      const r = await fetch(
        `https://api.trongrid.io/v1/accounts/${tronAddr}/transactions/trc20?limit=20&contract_address=${contract}`,
        { headers }
      );
      const d = await r.json();
      for (const tx of (d.data || [])) {
        if ((tx.block_timestamp || 0) < minTs) break;
        if (tx.to !== tronAddr) continue;
        const decimals = tx.token_info?.decimals ?? 6;
        const amount   = parseFloat(tx.value) / Math.pow(10, decimals);
        if (amount > 0) results.push({ txHash: tx.transaction_id, symbol, cryptoAmount: amount, chain: 'TRON', network: 'TRX_MAINNET' });
      }
    } catch (e) { console.error(`[TRON ${symbol}] err:`, e.message); }
    await sleep(300);
  }
  return results;
}

// ── Main poll loop ─────────────────────────────────────────────────────────
async function pollAllUsers() {
  try {
    const users = await User.find({ 'cryptoAddresses.evm': { $ne: null } }).lean();
    if (!users.length) return;

    const now = Date.now();
    console.log(`[Poller] Checking ${users.length} user(s)...`);

    for (const user of users) {
      const since = user.lastTxCheck
        ? new Date(user.lastTxCheck).getTime()
        : now - 24 * 60 * 60 * 1000; // default: look back 24h on first run

      const { evm, sol } = user.cryptoAddresses || {};
      const allTxs = [];

      if (evm) {
        for (const chain of EVM_CHAINS) {
          const txs = await checkEVMChain(evm, chain, since);
          allTxs.push(...txs);
          await sleep(400);
        }
        // TRON uses the same EVM key
        const tronTxs = await checkTron(evm, since);
        allTxs.push(...tronTxs);
      }

      if (sol) {
        const solTxs = await checkSolana(sol, since);
        allTxs.push(...solTxs);
      }

      for (const tx of allTxs) {
        await processIncomingCrypto({ userId: user._id, ...tx });
      }

      await User.findByIdAndUpdate(user._id, { lastTxCheck: new Date(now) });
      await sleep(600); // throttle between users
    }

    console.log(`[Poller] Done at ${new Date().toISOString()}`);
  } catch (err) {
    console.error('[Poller] fatal:', err.message);
  }
}

module.exports = { pollAllUsers, evmToTron };
