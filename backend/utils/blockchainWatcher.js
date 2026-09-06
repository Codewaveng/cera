// Real-time blockchain watchers using free public WebSocket RPC endpoints.
// EVM chains: USDT/USDC Transfer logs → instant; native ETH/BNB/MATIC via newHeads → per-block.
// Solana: logsSubscribe + balance-diff (no getTransaction) → 1-3s.
// TRON: dedicated 20-second poller (no free public WS available).
// BTC: handled by BlockCypher webhook (routes/webhook.js).

const WebSocket = require('ws');
const User = require('../models/User');
const { processIncomingCrypto } = require('./processPayment');

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

const USDT_SOL  = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
const USDC_SOL  = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const TRON_USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const TRON_USDC = 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8';

const EVM_CHAINS = [
  {
    name: 'Ethereum', network: 'ETH_MAINNET', nativeSymbol: 'ETH',
    wsUrl: 'wss://ethereum.publicnode.com',
    tokens: {
      '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: 'USDT', decimals: 6 },
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: 'USDC', decimals: 6 },
    },
  },
  {
    name: 'BNB Smart Chain', network: 'BNB_MAINNET', nativeSymbol: 'BNB',
    wsUrl: 'wss://bsc.publicnode.com',
    tokens: {
      '0x55d398326f99059ff775485246999027b3197955': { symbol: 'USDT', decimals: 18 },
      '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': { symbol: 'USDC', decimals: 18 },
    },
  },
  {
    name: 'Polygon', network: 'MATIC_MAINNET', nativeSymbol: 'MATIC',
    wsUrl: 'wss://polygon-bor.publicnode.com',
    tokens: {
      '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': { symbol: 'USDT', decimals: 6 },
      '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': { symbol: 'USDC', decimals: 6 },
    },
  },
];

let evmAddresses = new Set();

async function loadEVMAddresses() {
  const users = await User.find({ 'cryptoAddresses.evm': { $ne: null } }, 'cryptoAddresses.evm').lean();
  evmAddresses = new Set(users.map(u => u.cryptoAddresses.evm.toLowerCase()));
}

function addEVMAddress(addr) {
  if (addr) evmAddresses.add(addr.toLowerCase());
}

// ── EVM WebSocket watcher ──────────────────────────────────────────────────
// eth_subscribe("logs")     → instant USDT/USDC detection
// eth_subscribe("newHeads") → per-block native ETH/BNB/MATIC detection
function watchEVMChain(chain) {
  function connect() {
    const ws = new WebSocket(chain.wsUrl);
    let counter = 0;
    const nextId = () => ++counter;
    let logsReqId, headsReqId;
    let logsSubId = null, headsSubId = null;
    const blockRequests = new Map();

    ws.on('open', () => {
      console.log(`[${chain.name}] WS connected`);
      logsReqId  = nextId();
      headsReqId = nextId();
      ws.send(JSON.stringify({
        jsonrpc: '2.0', id: logsReqId,
        method: 'eth_subscribe',
        params: ['logs', { address: Object.keys(chain.tokens), topics: [TRANSFER_TOPIC] }],
      }));
      ws.send(JSON.stringify({
        jsonrpc: '2.0', id: headsReqId,
        method: 'eth_subscribe',
        params: ['newHeads'],
      }));
    });

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.result !== undefined && msg.id !== undefined && !msg.method) {
          if (msg.id === logsReqId)  { logsSubId  = msg.result; return; }
          if (msg.id === headsReqId) { headsSubId = msg.result; return; }
          if (blockRequests.has(msg.id)) {
            blockRequests.delete(msg.id);
            await processNativeBlock(msg.result, chain);
            return;
          }
        }

        if (msg.method !== 'eth_subscription') return;
        const { subscription, result } = msg.params || {};

        if (subscription === headsSubId && result?.hash) {
          const reqId = nextId();
          blockRequests.set(reqId, true);
          ws.send(JSON.stringify({
            jsonrpc: '2.0', id: reqId,
            method: 'eth_getBlockByHash',
            params: [result.hash, true],
          }));
          return;
        }

        if (subscription === logsSubId) {
          await processEVMLog(result, chain);
        }
      } catch (e) {
        console.error(`[${chain.name}] handler error:`, e.message);
      }
    });

    ws.on('close', () => {
      console.log(`[${chain.name}] WS closed — reconnecting in 5s`);
      setTimeout(connect, 5000);
    });

    ws.on('error', err => console.error(`[${chain.name}] WS error:`, err.message));
  }

  connect();
}

async function processEVMLog(log, chain) {
  if (!log?.topics?.[2]) return;
  const toAddr = '0x' + log.topics[2].slice(26).toLowerCase();
  if (!evmAddresses.has(toAddr)) return;
  const token = chain.tokens[log.address?.toLowerCase()];
  if (!token) return;
  const amount = Number(BigInt(log.data || '0x0')) / Math.pow(10, token.decimals);
  if (amount <= 0) return;
  const user = await User.findOne({ 'cryptoAddresses.evm': new RegExp(`^${toAddr}$`, 'i') });
  if (!user) return;
  await processIncomingCrypto({
    userId: user._id, cryptoAmount: amount,
    symbol: token.symbol, chain: chain.name, network: chain.network,
    txHash: log.transactionHash,
  });
  console.log(`⚡ [${chain.name}] ${amount} ${token.symbol} → ${toAddr}`);
}

async function processNativeBlock(block, chain) {
  if (!block?.transactions?.length) return;
  for (const tx of block.transactions) {
    if (!tx.to) continue;
    const toAddr = tx.to.toLowerCase();
    if (!evmAddresses.has(toAddr)) continue;
    const amount = parseInt(tx.value || '0x0', 16) / 1e18;
    if (amount <= 0) continue;
    const user = await User.findOne({ 'cryptoAddresses.evm': new RegExp(`^${toAddr}$`, 'i') });
    if (!user) continue;
    await processIncomingCrypto({
      userId: user._id, cryptoAmount: amount,
      symbol: chain.nativeSymbol, chain: chain.name, network: chain.network,
      txHash: tx.hash,
    });
    console.log(`⚡ [${chain.name}] ${amount} ${chain.nativeSymbol} → ${toAddr}`);
  }
}

// ── Solana WebSocket watcher ───────────────────────────────────────────────
// Uses balance-diff instead of getTransaction — getBalance and
// getTokenAccountsByOwner are indexed instantly after confirmation,
// so we never wait on slow RPC nodes.

const SOL_WS_URLS = [
  'wss://api.mainnet-beta.solana.com',
  'wss://solana.publicnode.com',
];

const SOL_HTTP_RPCS = [
  'https://api.mainnet-beta.solana.com',
  'https://rpc.ankr.com/solana',
  'https://solana.publicnode.com',
];

const _processedSolTxs = new Set();
const _solConnections  = new Map();
const _solBalanceCache = new Map(); // addr → { sol: lamports, usdt: uiAmount, usdc: uiAmount }

// Race all HTTP RPCs — first non-null response wins
async function raceSolRpc(method, params) {
  const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
  const fetches = SOL_HTTP_RPCS.map(rpc =>
    fetch(rpc, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
      .then(r => r.json())
      .then(j => {
        if (j.result === null || j.result === undefined) throw new Error('null');
        return j.result;
      })
  );
  try { return await Promise.any(fetches); }
  catch { return null; }
}

// Fetch all three balances in parallel — much faster than getTransaction
async function fetchSolBalances(addr) {
  const [solR, usdtR, usdcR] = await Promise.allSettled([
    raceSolRpc('getBalance', [addr, { commitment: 'confirmed' }]),
    raceSolRpc('getTokenAccountsByOwner', [addr, { mint: USDT_SOL }, { encoding: 'jsonParsed', commitment: 'confirmed' }]),
    raceSolRpc('getTokenAccountsByOwner', [addr, { mint: USDC_SOL }, { encoding: 'jsonParsed', commitment: 'confirmed' }]),
  ]);
  return {
    sol:  solR.status  === 'fulfilled' ? (solR.value?.value  ?? null) : null,
    usdt: usdtR.status === 'fulfilled' ? (usdtR.value?.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? null) : null,
    usdc: usdcR.status === 'fulfilled' ? (usdcR.value?.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? null) : null,
  };
}

async function initSolBalanceCache() {
  const users = await User.find({ 'cryptoAddresses.sol': { $ne: null } }, 'cryptoAddresses.sol').lean();
  await Promise.allSettled(users.map(async u => {
    const bal = await fetchSolBalances(u.cryptoAddresses.sol);
    _solBalanceCache.set(u.cryptoAddresses.sol, bal);
  }));
  console.log(`[Solana] Balance cache seeded for ${users.length} address(es)`);
}

async function handleSolTx(txSig, addr) {
  if (_processedSolTxs.has(txSig)) return;
  _processedSolTxs.add(txSig);
  setTimeout(() => _processedSolTxs.delete(txSig), 120_000);

  const prev = _solBalanceCache.get(addr);
  if (!prev) {
    // Edge case: cache miss — seed and let the 5-min poller catch this tx
    console.warn(`[Solana] Cache miss for ${addr} — seeding for future txs`);
    fetchSolBalances(addr).then(bal => { if (bal) _solBalanceCache.set(addr, bal); }).catch(() => {});
    return;
  }

  // 1.5s delay — lets the confirmed tx propagate to HTTP RPC nodes
  await new Promise(r => setTimeout(r, 1500));

  const curr = await fetchSolBalances(addr);
  if (!curr) return;
  _solBalanceCache.set(addr, curr); // update cache with new balances

  const user = await User.findOne({ 'cryptoAddresses.sol': addr });
  if (!user) return;

  // Native SOL
  if (curr.sol !== null && prev.sol !== null) {
    const diff = curr.sol - prev.sol;
    if (diff > 5000) {
      await processIncomingCrypto({
        userId: user._id, cryptoAmount: diff / 1e9,
        symbol: 'SOL', chain: 'Solana', network: 'SOL_MAINNET', txHash: txSig,
      });
      console.log(`⚡ [Solana] ${diff / 1e9} SOL → ${addr}`);
    }
  }

  // USDT on Solana
  if (curr.usdt !== null && prev.usdt !== null) {
    const diff = curr.usdt - prev.usdt;
    if (diff > 0.000001) {
      await processIncomingCrypto({
        userId: user._id, cryptoAmount: diff,
        symbol: 'USDT', chain: 'Solana', network: 'SOL_MAINNET', txHash: txSig,
      });
      console.log(`⚡ [Solana] ${diff} USDT → ${addr}`);
    }
  }

  // USDC on Solana
  if (curr.usdc !== null && prev.usdc !== null) {
    const diff = curr.usdc - prev.usdc;
    if (diff > 0.000001) {
      await processIncomingCrypto({
        userId: user._id, cryptoAmount: diff,
        symbol: 'USDC', chain: 'Solana', network: 'SOL_MAINNET', txHash: txSig,
      });
      console.log(`⚡ [Solana] ${diff} USDC → ${addr}`);
    }
  }
}

function _subscribeAddrOnConn(conn, addr) {
  if (!conn.ws || conn.ws.readyState !== WebSocket.OPEN) return;
  const id = conn.reqId++;
  conn.pending.set(id, addr);
  conn.ws.send(JSON.stringify({
    jsonrpc: '2.0', id,
    method: 'logsSubscribe',
    params: [{ mentions: [addr] }, { commitment: 'confirmed' }],
  }));
}

async function subscribeSOLAddress(addr) {
  for (const conn of _solConnections.values()) _subscribeAddrOnConn(conn, addr);
  // Seed balance cache for this brand-new address
  fetchSolBalances(addr).then(bal => { if (bal) _solBalanceCache.set(addr, bal); }).catch(() => {});
}

function watchSolanaEndpoint(wsUrl) {
  const conn = { ws: null, pending: new Map(), subs: new Map(), reqId: 1 };
  _solConnections.set(wsUrl, conn);

  function connect() {
    conn.ws = new WebSocket(wsUrl);
    conn.pending.clear();
    conn.subs.clear();

    // Keepalive ping every 25s — prevents server from closing idle connections
    let pingTimer = null;

    conn.ws.on('open', async () => {
      console.log(`[Solana] WS connected: ${wsUrl}`);
      const users = await User.find({ 'cryptoAddresses.sol': { $ne: null } }, 'cryptoAddresses.sol').lean();
      for (const u of users) _subscribeAddrOnConn(conn, u.cryptoAddresses.sol);

      pingTimer = setInterval(() => {
        if (conn.ws?.readyState === WebSocket.OPEN) {
          conn.ws.send(JSON.stringify({ jsonrpc: '2.0', id: 0, method: 'getSlot', params: [] }));
        }
      }, 25_000);
    });

    conn.ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        // Subscription confirmations
        if (msg.result !== undefined && conn.pending.has(msg.id)) {
          conn.subs.set(msg.result, conn.pending.get(msg.id));
          conn.pending.delete(msg.id);
          return;
        }

        if (msg.method !== 'logsNotification') return;
        const value = msg.params?.result?.value;
        if (!value || value.err) return;

        const txSig = value.signature;
        const addr  = conn.subs.get(msg.params.subscription);
        if (!addr || !txSig) return;

        handleSolTx(txSig, addr).catch(e => console.error('[Solana] handler error:', e.message));
      } catch (e) {
        console.error(`[Solana:${wsUrl}] parse error:`, e.message);
      }
    });

    conn.ws.on('close', () => {
      clearInterval(pingTimer);
      console.log(`[Solana] WS closed (${wsUrl}) — reconnecting in 5s`);
      setTimeout(connect, 5000);
    });

    conn.ws.on('error', err => console.error(`[Solana:${wsUrl}] WS error:`, err.message));
  }

  connect();
}

async function watchSolana() {
  await initSolBalanceCache();
  for (const url of SOL_WS_URLS) watchSolanaEndpoint(url);
}

// ── TRON fast poller (every 20 seconds) ────────────────────────────────────
const _processedTronTxs = new Set();

async function pollTRON() {
  try {
    const users = await User.find({ 'cryptoAddresses.tron': { $ne: null } }, 'cryptoAddresses.tron lastTronCheck').lean();
    if (!users.length) return;

    const headers = process.env.TRONGRID_API_KEY
      ? { 'TRON-PRO-API-KEY': process.env.TRONGRID_API_KEY }
      : {};

    for (const user of users) {
      const tronAddr = user.cryptoAddresses.tron;
      const minTs   = user.lastTronCheck ? new Date(user.lastTronCheck).getTime() : Date.now() - 24 * 60 * 60 * 1000;

      // TRC-20 (USDT / USDC)
      for (const [contract, symbol] of [[TRON_USDT, 'USDT'], [TRON_USDC, 'USDC']]) {
        try {
          const r = await fetch(
            `https://api.trongrid.io/v1/accounts/${tronAddr}/transactions/trc20?limit=10&contract_address=${contract}`,
            { headers }
          );
          const d = await r.json();
          for (const tx of (d.data || [])) {
            if ((tx.block_timestamp || 0) < minTs) break;
            if (tx.to !== tronAddr) continue;
            if (_processedTronTxs.has(tx.transaction_id)) continue;
            _processedTronTxs.add(tx.transaction_id);
            setTimeout(() => _processedTronTxs.delete(tx.transaction_id), 300_000);
            const decimals = tx.token_info?.decimals ?? 6;
            const amount   = parseFloat(tx.value) / Math.pow(10, decimals);
            if (amount > 0) {
              await processIncomingCrypto({
                userId: user._id, cryptoAmount: amount,
                symbol, chain: 'TRON', network: 'TRX_MAINNET', txHash: tx.transaction_id,
              });
              console.log(`⚡ [TRON] ${amount} ${symbol} → ${tronAddr}`);
            }
          }
        } catch (e) { /* rate limit — retry next cycle */ }
      }

      // Native TRX
      try {
        const r = await fetch(
          `https://api.trongrid.io/v1/accounts/${tronAddr}/transactions?limit=10&only_to=true`,
          { headers }
        );
        const d = await r.json();
        for (const tx of (d.data || [])) {
          if ((tx.block_timestamp || 0) < minTs) break;
          if (_processedTronTxs.has(tx.txID)) continue;
          const transfer = tx.raw_data?.contract?.[0];
          if (transfer?.type !== 'TransferContract') continue;
          const amount = (transfer.parameter?.value?.amount || 0) / 1e6;
          if (amount <= 0) continue;
          _processedTronTxs.add(tx.txID);
          setTimeout(() => _processedTronTxs.delete(tx.txID), 300_000);
          await processIncomingCrypto({
            userId: user._id, cryptoAmount: amount,
            symbol: 'TRX', chain: 'TRON', network: 'TRX_MAINNET', txHash: tx.txID,
          });
          console.log(`⚡ [TRON] ${amount} TRX → ${tronAddr}`);
        }
      } catch (e) { /* rate limit — retry next cycle */ }

      await User.findByIdAndUpdate(user._id, { lastTronCheck: new Date() });
    }
  } catch (e) {
    console.error('[TRON poller] error:', e.message);
  }
}

function watchTRON() {
  pollTRON();
  setInterval(pollTRON, 20_000);
  console.log('[TRON] Polling every 20 seconds');
}

// ── Keepalive — prevents Render free tier from spinning down ───────────────
function startKeepalive() {
  const url = (process.env.SERVER_URL || 'https://cera-hdj9.onrender.com') + '/health';
  setInterval(() => fetch(url).catch(() => {}), 10 * 60 * 1000);
  console.log('[Keepalive] Pinging self every 10 minutes');
}

// ── Entry point ────────────────────────────────────────────────────────────
async function startWatchers() {
  await loadEVMAddresses();
  EVM_CHAINS.forEach(watchEVMChain);
  await watchSolana();
  watchTRON();
  startKeepalive();
  console.log('[Watcher] All real-time watchers started ⚡');
}

module.exports = { startWatchers, addEVMAddress, subscribeSOLAddress };
