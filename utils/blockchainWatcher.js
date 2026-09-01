// Real-time blockchain watchers using free public WebSocket RPC endpoints.
// EVM chains: subscribe to USDT/USDC Transfer log events → instant detection.
// Solana: subscribe to transaction logs that mention each user address → instant detection.
// BTC: handled by BlockCypher webhook (see routes/webhook.js).
// Polling (chainPoller.js) runs every 5 min as a safety net for anything missed during reconnects.

const WebSocket = require('ws');
const User = require('../models/User');
const { processIncomingCrypto } = require('./processPayment');

// ERC-20 Transfer(address,address,uint256) event signature
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

const USDT_SOL = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
const USDC_SOL = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// Free public WebSocket RPC endpoints — no API key required
const EVM_CHAINS = [
  {
    name: 'Ethereum', network: 'ETH_MAINNET',
    wsUrl: 'wss://ethereum.publicnode.com',
    tokens: {
      '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: 'USDT', decimals: 6 },
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: 'USDC', decimals: 6 },
    },
  },
  {
    name: 'BNB Smart Chain', network: 'BNB_MAINNET',
    wsUrl: 'wss://bsc.publicnode.com',
    tokens: {
      '0x55d398326f99059ff775485246999027b3197955': { symbol: 'USDT', decimals: 18 },
      '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': { symbol: 'USDC', decimals: 18 },
    },
  },
  {
    name: 'Polygon', network: 'MATIC_MAINNET',
    wsUrl: 'wss://polygon-bor.publicnode.com',
    tokens: {
      '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': { symbol: 'USDT', decimals: 6 },
      '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': { symbol: 'USDC', decimals: 6 },
    },
  },
];

// Live set of all EVM user addresses (lowercase) — checked on every incoming log
let evmAddresses = new Set();

async function loadEVMAddresses() {
  const users = await User.find({ 'cryptoAddresses.evm': { $ne: null } }, 'cryptoAddresses.evm').lean();
  evmAddresses = new Set(users.map(u => u.cryptoAddresses.evm.toLowerCase()));
}

// Call this immediately after a new user's wallet is saved
function addEVMAddress(addr) {
  if (addr) evmAddresses.add(addr.toLowerCase());
}

// ── EVM WebSocket watcher ──────────────────────────────────────────────────
// Subscribes once to all USDT/USDC Transfer events across the whole chain,
// then filters by destination address in memory — very efficient.
function watchEVMChain(chain) {
  function connect() {
    const ws = new WebSocket(chain.wsUrl);

    ws.on('open', () => {
      console.log(`[${chain.name}] WS connected`);
      ws.send(JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method: 'eth_subscribe',
        params: ['logs', {
          address: Object.keys(chain.tokens),
          topics: [TRANSFER_TOPIC],
        }],
      }));
    });

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.method !== 'eth_subscription') return;

        const log = msg.params?.result;
        if (!log?.topics?.[2]) return;

        // topics[1] = padded from address, topics[2] = padded to address
        const toAddr = '0x' + log.topics[2].slice(26).toLowerCase();
        if (!evmAddresses.has(toAddr)) return;

        const token = chain.tokens[log.address?.toLowerCase()];
        if (!token) return;

        // Decode uint256 value from data field
        const amount = Number(BigInt(log.data || '0x0')) / Math.pow(10, token.decimals);
        if (amount <= 0) return;

        const user = await User.findOne({ 'cryptoAddresses.evm': new RegExp(`^${toAddr}$`, 'i') });
        if (!user) return;

        await processIncomingCrypto({
          userId: user._id,
          cryptoAmount: amount,
          symbol: token.symbol,
          chain: chain.name,
          network: chain.network,
          txHash: log.transactionHash,
        });
        console.log(`⚡ [${chain.name}] ${amount} ${token.symbol} → ${toAddr}`);
      } catch (e) {
        console.error(`[${chain.name}] handler error:`, e.message);
      }
    });

    ws.on('close', () => {
      console.log(`[${chain.name}] WS closed — reconnecting in 5s`);
      setTimeout(connect, 5000);
    });

    ws.on('error', err => {
      console.error(`[${chain.name}] WS error:`, err.message);
    });
  }

  connect();
}

// ── Solana WebSocket watcher ───────────────────────────────────────────────
// Uses logsSubscribe with {mentions:[address]} — fires on any tx that touches
// the user's wallet, covering both native SOL and SPL token (USDT/USDC) receipts.
const SOL_WS_URL = 'wss://api.mainnet-beta.solana.com';
let _solWs = null;
let _solReqId = 1;
const _solPending = new Map(); // reqId → walletAddress
const _solSubs    = new Map(); // subId  → walletAddress

function _subscribeAddr(addr) {
  if (!_solWs || _solWs.readyState !== WebSocket.OPEN) return;
  const id = _solReqId++;
  _solPending.set(id, addr);
  _solWs.send(JSON.stringify({
    jsonrpc: '2.0', id,
    method: 'logsSubscribe',
    params: [{ mentions: [addr] }, { commitment: 'confirmed' }],
  }));
}

// Expose so auth.js can subscribe new wallets the moment they're created
function subscribeSOLAddress(addr) {
  _subscribeAddr(addr);
}

function watchSolana() {
  async function connect() {
    _solWs = new WebSocket(SOL_WS_URL);

    _solWs.on('open', async () => {
      console.log('[Solana] WS connected');
      _solSubs.clear();
      _solPending.clear();
      const users = await User.find({ 'cryptoAddresses.sol': { $ne: null } }, 'cryptoAddresses.sol').lean();
      for (const u of users) _subscribeAddr(u.cryptoAddresses.sol);
    });

    _solWs.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        // Subscription confirmation
        if (msg.result !== undefined && _solPending.has(msg.id)) {
          _solSubs.set(msg.result, _solPending.get(msg.id));
          _solPending.delete(msg.id);
          return;
        }

        if (msg.method !== 'logsNotification') return;
        const value = msg.params?.result?.value;
        if (!value || value.err) return; // skip failed txns

        const txSig  = value.signature;
        const subId  = msg.params.subscription;
        const addr   = _solSubs.get(subId);
        if (!addr || !txSig) return;

        // Fetch full transaction to get exact amounts
        const txRes = await fetch('https://api.mainnet-beta.solana.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 1,
            method: 'getTransaction',
            params: [txSig, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
          }),
        });
        const { result: tx } = await txRes.json();
        if (!tx) return;

        const user = await User.findOne({ 'cryptoAddresses.sol': addr });
        if (!user) return;

        // Native SOL: check account balance diff
        const keys = tx.transaction?.message?.accountKeys || [];
        const idx  = keys.findIndex(k => (k.pubkey || k) === addr);
        if (idx !== -1) {
          const diff = (tx.meta?.postBalances?.[idx] || 0) - (tx.meta?.preBalances?.[idx] || 0);
          if (diff > 5000) { // > 0.000005 SOL (ignore fee/rent noise)
            await processIncomingCrypto({
              userId: user._id, cryptoAmount: diff / 1e9,
              symbol: 'SOL', chain: 'Solana', network: 'SOL_MAINNET', txHash: txSig,
            });
            console.log(`⚡ [Solana] ${diff / 1e9} SOL → ${addr}`);
          }
        }

        // SPL tokens (USDT / USDC): check token balance diff
        for (const [mint, symbol] of [[USDT_SOL, 'USDT'], [USDC_SOL, 'USDC']]) {
          const pre  = tx.meta?.preTokenBalances?.find(b => b.mint === mint && b.owner === addr);
          const post = tx.meta?.postTokenBalances?.find(b => b.mint === mint && b.owner === addr);
          const diff = (post?.uiTokenAmount?.uiAmount || 0) - (pre?.uiTokenAmount?.uiAmount || 0);
          if (diff > 0.000001) {
            await processIncomingCrypto({
              userId: user._id, cryptoAmount: diff,
              symbol, chain: 'Solana', network: 'SOL_MAINNET', txHash: txSig,
            });
            console.log(`⚡ [Solana] ${diff} ${symbol} → ${addr}`);
          }
        }
      } catch (e) {
        console.error('[Solana] handler error:', e.message);
      }
    });

    _solWs.on('close', () => {
      console.log('[Solana] WS closed — reconnecting in 5s');
      setTimeout(connect, 5000);
    });

    _solWs.on('error', err => {
      console.error('[Solana] WS error:', err.message);
    });
  }

  connect();
}

// ── Keepalive — prevents Render free tier from spinning down ───────────────
function startKeepalive() {
  const url = (process.env.SERVER_URL || 'https://cera-hdj9.onrender.com') + '/health';
  setInterval(() => fetch(url).catch(() => {}), 10 * 60 * 1000); // every 10 min
  console.log('[Keepalive] Pinging self every 10 minutes to stay awake');
}

// ── Entry point ────────────────────────────────────────────────────────────
async function startWatchers() {
  await loadEVMAddresses();
  EVM_CHAINS.forEach(watchEVMChain);
  watchSolana();
  startKeepalive();
  console.log('[Watcher] All real-time watchers started ⚡');
}

module.exports = { startWatchers, addEVMAddress, subscribeSOLAddress };
