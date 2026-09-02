import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Data ────────────────────────────────────────────────────────────────────

const COINS = [
  { symbol: 'BTC',  name: 'Bitcoin',  icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/btc.svg' },
  { symbol: 'ETH',  name: 'Ethereum', icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/eth.svg' },
  { symbol: 'BNB',  name: 'BNB',      icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/bnb.svg' },
  { symbol: 'SOL',  name: 'Solana',   icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/sol.svg' },
  { symbol: 'TRX',  name: 'TRON',     icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/trx.svg' },
  { symbol: 'USDT', name: 'USDT',     icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/usdt.svg' },
  { symbol: 'USDC', name: 'USDC',     icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/usdc.svg' },
]

const SWAP_COINS = [
  ...COINS,
  { symbol: 'MATIC', name: 'Polygon',  icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/matic.svg' },
  { symbol: 'LTC',   name: 'Litecoin', icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/ltc.svg' },
  { symbol: 'XRP',   name: 'XRP',      icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/xrp.svg' },
  { symbol: 'DOGE',  name: 'Dogecoin', icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/doge.svg' },
]

const BANKS = [
  { name: 'Access Bank',   code: '044' },
  { name: 'GTBank',        code: '058' },
  { name: 'Zenith Bank',   code: '057' },
  { name: 'First Bank',    code: '011' },
  { name: 'UBA',           code: '033' },
  { name: 'Stanbic IBTC',  code: '221' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'FCMB',          code: '214' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Polaris Bank',  code: '076' },
  { name: 'Ecobank',       code: '050' },
  { name: 'Union Bank',    code: '032' },
  { name: 'Kuda Bank',     code: '090267' },
  { name: 'OPay',          code: '100004' },
  { name: 'PalmPay',       code: '999991' },
  { name: 'Moniepoint',    code: '50515' },
]

const STABLECOIN_CHAINS = {
  USDT: ['ETH', 'BNB', 'Polygon', 'TRON', 'Solana'],
  USDC: ['ETH', 'BNB', 'Polygon', 'Solana'],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNaira(n) {
  if (!n || isNaN(n)) return '₦0'
  return '₦' + Number(n).toLocaleString('en-NG', { maximumFractionDigits: 2 })
}

function formatTimer(s) {
  return `${Math.floor(s / 60).toString().padStart(2,'0')}:${(s % 60).toString().padStart(2,'0')}`
}

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } })
    }, { threshold: 0.12 })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconArrows = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 16l-4-4 4-4"/><path d="M3 12h18"/><path d="M17 8l4 4-4 4"/>
  </svg>
)
const IconSpinner = () => (
  <div style={{width:18,height:18,border:'2.5px solid rgba(255,255,255,0.3)',borderTop:'2.5px solid #fff',borderRadius:'50%'}} className="animate-spin-slow"/>
)
const IconLightning = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)
const IconTrend = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
  </svg>
)
const IconShield = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const IconPhone = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
)
const IconMenu = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)
const IconClose = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconApple = () => (
  <svg width="22" height="22" viewBox="0 0 814 1000" fill="white">
    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-43.4-150.3-112.7C172.5 672.4 124.5 548.1 124.5 430c0-194.3 125.4-297.5 248.1-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99zM554.1 158.6c27.6-34.4 47.7-82.4 47.7-130.4 0-6.5-.6-13-1.9-18.2-45.1 1.9-98.3 30.3-131 68.7-27.7 33.1-50.8 81.1-50.8 130.4 0 7.1 1.3 14.3 1.9 16.5 2.6.4 6.5.6 10.4.6 40.8 0 91.6-27.1 123.7-67.6z"/>
  </svg>
)
const IconPlayStore = () => (
  <svg width="22" height="22" viewBox="0 0 512 512" fill="none">
    <path d="M48 28l228 228L48 484c-16-12-16-32-16-228S32 40 48 28z" fill="#EA4335"/>
    <path d="M364 204l64 36-80 48-96-96z" fill="#FBBC04"/>
    <path d="M48 28c8-6 20-8 32-2l232 134-80 80z" fill="#4285F4"/>
    <path d="M48 484c8 6 20 8 32 2l232-134-80-80z" fill="#34A853"/>
  </svg>
)
const IconStar = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#FBBF24" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text, dark }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }
  return (
    <button onClick={copy} style={{
      background: dark ? 'rgba(255,255,255,0.15)' : 'rgba(79,70,229,0.08)',
      border: dark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(79,70,229,0.18)',
      borderRadius: 8, padding: '6px 12px',
      color: copied ? '#10B981' : dark ? '#fff' : '#4F46E5',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans', transition: 'all 0.2s',
      flexShrink: 0,
    }}>
      {copied ? <IconCheck /> : <IconCopy />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// ─── CoinSelect ───────────────────────────────────────────────────────────────

function CoinSelect({ value, onChange, coins, style }) {
  const coin = coins.find(c => c.symbol === value)
  return (
    <div style={{ position: 'relative', ...style }}>
      <select className="input-field" value={value} onChange={e => onChange(e.target.value)}
        style={{ paddingLeft: '2.6rem', paddingRight: '1rem', appearance: 'none', cursor: 'pointer', fontWeight: 600 }}>
        {coins.map(c => <option key={c.symbol} value={c.symbol}>{c.symbol} — {c.name}</option>)}
      </select>
      {coin && <img src={coin.icon} alt="" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:20, height:20, pointerEvents:'none' }} />}
    </div>
  )
}

// ─── StatusDot ────────────────────────────────────────────────────────────────

function StatusDot({ status }) {
  const MAP = {
    waiting:            { c:'#F59E0B', l:'Waiting for payment' },
    detected:           { c:'#3B82F6', l:'Payment detected' },
    processing:         { c:'#8B5CF6', l:'Processing payout' },
    completed:          { c:'#10B981', l:'Naira sent' },
    waiting_for_deposit:{ c:'#F59E0B', l:'Waiting for deposit' },
    confirming:         { c:'#3B82F6', l:'Confirming' },
    exchanging:         { c:'#8B5CF6', l:'Exchanging' },
    sending:            { c:'#10B981', l:'Sending to you' },
    finished:           { c:'#10B981', l:'Complete' },
    failed:             { c:'#EF4444', l:'Failed' },
    expired:            { c:'#6B7280', l:'Expired' },
  }
  const { c, l } = MAP[status] || { c:'#6B7280', l: status }
  const pulse = ['waiting','waiting_for_deposit','confirming','exchanging','processing','sending','detected'].includes(status)
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center' }}>
      <div style={{ width:11, height:11, borderRadius:'50%', background:c, boxShadow:`0 0 0 3px ${c}28` }} className={pulse ? 'animate-pulse-dot' : ''} />
      <span style={{ fontSize:15, fontWeight:700, color:c }}>{l}</span>
    </div>
  )
}

// ─── DepositCard ──────────────────────────────────────────────────────────────

function DepositCard({ address, coin, amount, timer, status, onDone, type }) {
  const done = status === 'completed' || status === 'finished'
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ textAlign:'center' }}>
        <StatusDot status={status} />
      </div>

      {!done && (
        <>
          <div style={{ background:'linear-gradient(135deg,rgba(79,70,229,0.06),rgba(124,58,237,0.06))', border:'1px solid rgba(79,70,229,0.12)', borderRadius:16, padding:'18px 20px' }}>
            <p style={{ fontSize:11, color:'#6B7280', marginBottom:6, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>Send exactly</p>
            <p style={{ fontSize:26, fontWeight:800, color:'#111827', fontFamily:'Syne' }}>
              {amount ? `${amount} ` : ''}<span style={{ color:'#4F46E5' }}>{coin}</span>
            </p>
          </div>

          <div>
            <p style={{ fontSize:11, color:'#6B7280', marginBottom:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>
              {type === 'swap' ? 'ChangeNow deposit address' : 'Your deposit address'}
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'#F9FAFB', border:'1.5px solid #E5E7EB', borderRadius:12, padding:'10px 14px' }}>
              <span style={{ fontFamily:'monospace', fontSize:12, color:'#374151', wordBreak:'break-all', flex:1, lineHeight:1.5 }}>{address}</span>
              <CopyButton text={address} />
            </div>
          </div>

          {timer > 0 && (
            <div style={{ textAlign:'center', padding:'10px 0', background: timer < 300 ? 'rgba(239,68,68,0.06)' : 'rgba(79,70,229,0.04)', borderRadius:12 }}>
              <span style={{ fontSize:13, color:'#6B7280', fontWeight:500 }}>Expires in </span>
              <span style={{ fontWeight:800, color: timer < 300 ? '#EF4444' : '#4F46E5', fontSize:16, fontFamily:'Syne' }}>{formatTimer(timer)}</span>
            </div>
          )}
        </>
      )}

      {done && (
        <div style={{ textAlign:'center', padding:'16px 0' }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(16,185,129,0.12)', border:'2px solid rgba(16,185,129,0.25)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h3 style={{ fontFamily:'Syne', fontSize:26, color:'#10B981', fontWeight:800 }}>
            {type === 'swap' ? 'Swap Complete' : 'Naira Sent'}
          </h3>
          <p style={{ color:'#6B7280', marginTop:8, fontSize:14, lineHeight:1.6 }}>
            {type === 'swap' ? 'Your crypto has been exchanged and sent.' : 'Check your bank — the money is on its way.'}
          </p>
          <div style={{ marginTop:20, padding:'16px', background:'#F5F3FF', borderRadius:14, border:'1px solid rgba(79,70,229,0.12)' }}>
            <p style={{ fontSize:13, color:'#4F46E5', fontWeight:700 }}>Want faster conversions?</p>
            <p style={{ fontSize:13, color:'#6B7280', marginTop:4 }}>Download the CERA app for auto-processing, saved bank details and higher limits.</p>
          </div>
          <button onClick={onDone} style={{ marginTop:16, background:'none', border:'none', color:'#4F46E5', fontWeight:700, cursor:'pointer', fontSize:14, fontFamily:'DM Sans' }}>
            Convert again
          </button>
        </div>
      )}
    </div>
  )
}

// ─── OfframpWidget ────────────────────────────────────────────────────────────

function OfframpWidget() {
  const [coin, setCoin]       = useState('USDT')
  const [chain, setChain]     = useState('ETH')
  const [amount, setAmount]   = useState('')
  const [bank, setBank]       = useState(BANKS[0].code)
  const [accNum, setAccNum]   = useState('')
  const [accName, setAccName] = useState('')
  const [rate, setRate]       = useState(null)
  const [step, setStep]       = useState('form')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [deposit, setDeposit] = useState(null)
  const [status, setStatus]   = useState('waiting')
  const [timer, setTimer]     = useState(1800)
  const pollRef = useRef(null)

  useEffect(() => {
    fetch('/api/rates').then(r => r.json()).then(d => {
      setRate(d[coin]?.priceNGN || null)
    }).catch(() => {})
  }, [coin])

  useEffect(() => {
    if (step !== 'pending') return
    const t = setInterval(() => setTimer(s => s > 0 ? s - 1 : 0), 1000)
    return () => clearInterval(t)
  }, [step])

  const startPoll = useCallback((id) => {
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/guest/${id}`)
        const d = await r.json()
        setStatus(d.status)
        if (['completed','failed','expired'].includes(d.status)) {
          clearInterval(pollRef.current)
          if (d.status === 'completed') setStep('done')
        }
      } catch {}
    }, 4000)
  }, [])

  useEffect(() => () => clearInterval(pollRef.current), [])

  const onSubmit = async () => {
    setError('')
    if (!amount || isNaN(amount) || Number(amount) <= 0) return setError('Enter a valid amount')
    if (!accNum || accNum.length < 10) return setError('Enter a valid 10-digit account number')
    if (!accName.trim()) return setError('Enter your account name')
    setLoading(true)
    try {
      const bankObj = BANKS.find(b => b.code === bank)
      const r = await fetch('/api/guest/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coin, chain: (coin === 'USDT' || coin === 'USDC') ? chain : undefined,
          amount: Number(amount),
          bankCode: bank, bankName: bankObj?.name || bank,
          accountNumber: accNum, accountName: accName,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed')
      setDeposit(d)
      setStep('pending')
      startPoll(d.guestId)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const isStable = coin === 'USDT' || coin === 'USDC'
  const nairaVal = amount && rate ? Number(amount) * rate : null

  if (step === 'pending' || step === 'done') {
    return (
      <DepositCard
        address={deposit?.depositAddress}
        coin={coin + (isStable ? ` (${chain})` : '')}
        amount={deposit?.expectedAmount}
        timer={timer}
        status={status}
        type="offramp"
        onDone={() => { setStep('form'); setStatus('waiting'); setTimer(1800); setDeposit(null); setAmount('') }}
      />
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div>
        <label style={{ fontSize:11, color:'#6B7280', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:8 }}>You Send</label>
        <div style={{ display:'flex', gap:8 }}>
          <input className="input-field" type="number" placeholder="0.00" value={amount}
            onChange={e => setAmount(e.target.value)} style={{ flex:1, fontWeight:700, fontSize:18 }} />
          <CoinSelect value={coin} onChange={v => { setCoin(v); if (STABLECOIN_CHAINS[v]) setChain(STABLECOIN_CHAINS[v][0]) }} coins={COINS} style={{ width:155 }} />
        </div>
        {isStable && (
          <select className="input-field" value={chain} onChange={e => setChain(e.target.value)}
            style={{ marginTop:8, appearance:'none', fontSize:14 }}>
            {STABLECOIN_CHAINS[coin].map(c => <option key={c} value={c}>{coin} on {c}</option>)}
          </select>
        )}
        {nairaVal && (
          <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#10B981', flexShrink:0 }} />
            <span style={{ fontSize:14, color:'#10B981', fontWeight:700 }}>≈ {formatNaira(nairaVal)}</span>
            <span style={{ fontSize:12, color:'#9CA3AF' }}>· {formatNaira(rate)}/{coin}</span>
          </div>
        )}
      </div>

      <div style={{ borderTop:'1px solid #F3F4F6', paddingTop:16 }}>
        <label style={{ fontSize:11, color:'#6B7280', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:8 }}>Receive Naira To</label>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <select className="input-field" value={bank} onChange={e => setBank(e.target.value)}
            style={{ appearance:'none', fontSize:14 }}>
            {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
          </select>
          <input className="input-field" placeholder="Account number (10 digits)" value={accNum}
            onChange={e => setAccNum(e.target.value.replace(/\D/g,'').slice(0,10))} maxLength={10} style={{ fontSize:14 }} />
          <input className="input-field" placeholder="Account name" value={accName}
            onChange={e => setAccName(e.target.value)} style={{ fontSize:14 }} />
        </div>
      </div>

      {error && (
        <div style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:10, padding:'10px 14px' }}>
          <p style={{ color:'#EF4444', fontSize:13, fontWeight:600 }}>{error}</p>
        </div>
      )}

      <button className="btn-primary" onClick={onSubmit} disabled={loading}>
        {loading
          ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><IconSpinner /> Getting address...</span>
          : 'Convert to Naira'}
      </button>

      <p style={{ fontSize:12, color:'#9CA3AF', textAlign:'center' }}>
        Live CoinGecko rates · No account needed · Free
      </p>
    </div>
  )
}

// ─── SwapWidget ───────────────────────────────────────────────────────────────

function SwapWidget() {
  const [fromCoin, setFromCoin]     = useState('BTC')
  const [toCoin, setToCoin]         = useState('ETH')
  const [amount, setAmount]         = useState('')
  const [destAddr, setDestAddr]     = useState('')
  const [refundAddr, setRefundAddr] = useState('')
  const [estimate, setEstimate]     = useState(null)
  const [minAmount, setMinAmount]   = useState(null)
  const [estimating, setEstimating] = useState(false)
  const [step, setStep]             = useState('form')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [swapData, setSwapData]     = useState(null)
  const [swapStatus, setSwapStatus] = useState('waiting_for_deposit')
  const [showRefund, setShowRefund] = useState(false)
  const debounceRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    if (!fromCoin || !toCoin) return
    fetch(`/api/changenow/min?from=${fromCoin.toLowerCase()}&to=${toCoin.toLowerCase()}`)
      .then(r => r.json()).then(d => setMinAmount(d.minAmount)).catch(() => {})
  }, [fromCoin, toCoin])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!amount || isNaN(amount) || Number(amount) <= 0) { setEstimate(null); return }
    setEstimating(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/changenow/estimate?from=${fromCoin.toLowerCase()}&to=${toCoin.toLowerCase()}&amount=${amount}`)
        const d = await r.json()
        setEstimate(d.estimatedAmount || d.toAmount || null)
      } catch {}
      finally { setEstimating(false) }
    }, 600)
  }, [amount, fromCoin, toCoin])

  const startPoll = useCallback((id) => {
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/changenow/status/${id}`)
        const d = await r.json()
        setSwapStatus(d.status)
        if (['finished','failed','refunded'].includes(d.status)) clearInterval(pollRef.current)
      } catch {}
    }, 5000)
  }, [])

  useEffect(() => () => clearInterval(pollRef.current), [])

  const onSwap = async () => {
    setError('')
    if (!amount || isNaN(amount) || Number(amount) <= 0) return setError('Enter an amount')
    if (!destAddr.trim()) return setError(`Enter your ${toCoin} destination address`)
    if (minAmount && Number(amount) < minAmount) return setError(`Minimum is ${minAmount} ${fromCoin}`)
    setLoading(true)
    try {
      const body = {
        from: fromCoin.toLowerCase(),
        to: toCoin.toLowerCase(),
        amount: Number(amount),
        address: destAddr.trim(),
      }
      if (refundAddr.trim()) body.refundAddress = refundAddr.trim()
      const r = await fetch('/api/changenow/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (!r.ok || d.error) throw new Error(d.error || d.message || 'Failed to create swap')
      setSwapData(d)
      setStep('pending')
      startPoll(d.id)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const flipCoins = () => {
    const f = fromCoin; setFromCoin(toCoin); setToCoin(f); setEstimate(null); setAmount('')
  }

  if (step === 'pending') {
    return (
      <DepositCard
        address={swapData?.payinAddress}
        coin={fromCoin}
        amount={swapData?.payinAmount || amount}
        timer={0}
        status={swapStatus}
        type="swap"
        onDone={() => { setStep('form'); setSwapStatus('waiting_for_deposit'); setSwapData(null); setAmount(''); setDestAddr('') }}
      />
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div>
        <label style={{ fontSize:11, color:'#6B7280', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:8 }}>You Send</label>
        <div style={{ display:'flex', gap:8 }}>
          <input className="input-field" type="number" placeholder="0.00" value={amount}
            onChange={e => setAmount(e.target.value)} style={{ flex:1, fontWeight:700, fontSize:18 }} />
          <CoinSelect value={fromCoin} onChange={v => { setFromCoin(v); setEstimate(null) }} coins={SWAP_COINS} style={{ width:155 }} />
        </div>
        {minAmount && <p style={{ fontSize:12, color:'#9CA3AF', marginTop:5 }}>Min: {minAmount} {fromCoin}</p>}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ flex:1, height:1, background:'#F3F4F6' }} />
        <button onClick={flipCoins} style={{
          width:36, height:36, borderRadius:'50%', border:'1.5px solid #E5E7EB',
          background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          color:'#4F46E5', transition:'all 0.3s', flexShrink:0,
        }}
          onMouseEnter={e => { e.currentTarget.style.transform='rotate(180deg)'; e.currentTarget.style.borderColor='#4F46E5'; e.currentTarget.style.background='rgba(79,70,229,0.06)' }}
          onMouseLeave={e => { e.currentTarget.style.transform='rotate(0deg)'; e.currentTarget.style.borderColor='#E5E7EB'; e.currentTarget.style.background='#fff' }}>
          <IconArrows />
        </button>
        <div style={{ flex:1, height:1, background:'#F3F4F6' }} />
      </div>

      <div>
        <label style={{ fontSize:11, color:'#6B7280', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:8 }}>You Receive</label>
        <div style={{ display:'flex', gap:8 }}>
          <div className="input-field" style={{ flex:1, display:'flex', alignItems:'center', fontWeight:700, fontSize:18, color: estimate ? '#111827' : '#9CA3AF', background:'#F9FAFB' }}>
            {estimating ? <span style={{ fontSize:14, color:'#9CA3AF', fontWeight:500 }}>Calculating...</span> : estimate ? `≈ ${estimate}` : '—'}
          </div>
          <CoinSelect value={toCoin} onChange={v => { setToCoin(v); setEstimate(null) }} coins={SWAP_COINS.filter(c => c.symbol !== fromCoin)} style={{ width:155 }} />
        </div>
      </div>

      <div>
        <label style={{ fontSize:11, color:'#6B7280', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:8 }}>Your {toCoin} Address</label>
        <input className="input-field" placeholder={`Paste your ${toCoin} wallet address`} value={destAddr}
          onChange={e => setDestAddr(e.target.value)} style={{ fontFamily:'monospace', fontSize:13 }} />
      </div>

      <button
        onClick={() => setShowRefund(v => !v)}
        style={{ background:'none', border:'none', color:'#9CA3AF', fontSize:12, fontWeight:600, cursor:'pointer', textAlign:'left', padding:0, fontFamily:'DM Sans' }}>
        {showRefund ? '- Hide' : '+ Add'} refund address (optional)
      </button>

      {showRefund && (
        <div>
          <label style={{ fontSize:11, color:'#6B7280', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:6 }}>Your {fromCoin} Refund Address</label>
          <input className="input-field" placeholder={`Your ${fromCoin} address (if swap fails)`} value={refundAddr}
            onChange={e => setRefundAddr(e.target.value)} style={{ fontFamily:'monospace', fontSize:13 }} />
          <p style={{ fontSize:11, color:'#9CA3AF', marginTop:5 }}>Where to send {fromCoin} back if the swap can't complete.</p>
        </div>
      )}

      {error && (
        <div style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:10, padding:'10px 14px' }}>
          <p style={{ color:'#EF4444', fontSize:13, fontWeight:600 }}>{error}</p>
        </div>
      )}

      <button className="btn-primary" onClick={onSwap} disabled={loading}>
        {loading
          ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><IconSpinner /> Creating swap...</span>
          : `Swap ${fromCoin} to ${toCoin}`}
      </button>

      <p style={{ fontSize:12, color:'#9CA3AF', textAlign:'center' }}>
        Powered by ChangeNow · Best rate · Non-custodial
      </p>
    </div>
  )
}

// ─── ConversionWidget ─────────────────────────────────────────────────────────

function ConversionWidget() {
  const [tab, setTab] = useState('offramp')
  return (
    <div className="widget-card" style={{ padding:28 }}>
      <div className="tab-bar" style={{ marginBottom:22 }}>
        <button className={`tab-btn ${tab === 'offramp' ? 'active' : ''}`} onClick={() => setTab('offramp')}>
          Offramp to Naira
        </button>
        <button className={`tab-btn ${tab === 'swap' ? 'active' : ''}`} onClick={() => setTab('swap')}>
          Crypto Swap
        </button>
      </div>
      {tab === 'offramp' ? <OfframpWidget /> : <SwapWidget />}
    </div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const links = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Download', href: '#download' },
  ]

  return (
    <>
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none',
        transition:'all 0.35s cubic-bezier(.16,1,.3,1)',
      }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', height:68, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          {/* Logo */}
          <a href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
            <div style={{
              width:36, height:36, borderRadius:10,
              background:'linear-gradient(135deg,#4F46E5,#7C3AED)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 4px 14px rgba(79,70,229,0.4)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <span style={{ fontFamily:'Syne', fontWeight:800, fontSize:22, letterSpacing:'0.04em', color:'#111827' }}>CERA</span>
          </a>

          {/* Desktop links */}
          <div className="nav-links">
            {links.map(({ label, href }) => (
              <a key={label} href={href} style={{ textDecoration:'none', color:'#374151', fontWeight:600, fontSize:15, transition:'color 0.2s' }}
                onMouseEnter={e => e.target.style.color='#4F46E5'} onMouseLeave={e => e.target.style.color='#374151'}>
                {label}
              </a>
            ))}
          </div>

          {/* CTA + hamburger */}
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <a href="#download" style={{ textDecoration:'none' }}>
              <button style={{
                background:'linear-gradient(135deg,#4F46E5,#7C3AED)',
                color:'#fff', fontFamily:'DM Sans', fontWeight:700, fontSize:14,
                padding:'9px 20px', borderRadius:12, border:'none', cursor:'pointer',
                boxShadow:'0 3px 12px rgba(79,70,229,0.35)', transition:'transform 0.2s,box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(79,70,229,0.45)' }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 3px 12px rgba(79,70,229,0.35)' }}>
                Get the App
              </button>
            </a>
            <button onClick={() => setOpen(v => !v)}
              style={{ display:'none', background:'none', border:'none', cursor:'pointer', color:'#374151', padding:4 }}
              className="hamburger-btn">
              {open ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div style={{
          position:'fixed', top:68, left:0, right:0, zIndex:99,
          background:'rgba(255,255,255,0.98)', backdropFilter:'blur(20px)',
          borderBottom:'1px solid #F3F4F6', padding:'16px 24px 24px',
          display:'flex', flexDirection:'column', gap:4,
        }}>
          {links.map(({ label, href }) => (
            <a key={label} href={href} onClick={() => setOpen(false)}
              style={{ textDecoration:'none', color:'#374151', fontWeight:600, fontSize:17, padding:'12px 0', borderBottom:'1px solid #F9FAFB' }}>
              {label}
            </a>
          ))}
        </div>
      )}
    </>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="hero-bg" style={{ minHeight:'100vh', paddingTop:68, display:'flex', alignItems:'center', position:'relative' }}>
      {/* Background orbs */}
      <div className="orb animate-blob" style={{ width:600, height:600, background:'radial-gradient(circle, rgba(79,70,229,0.18) 0%, transparent 70%)', top:-100, right:-100 }} />
      <div className="orb animate-blob" style={{ width:400, height:400, background:'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)', bottom:-50, left:-50, animationDelay:'3s' }} />
      <div className="orb" style={{ width:300, height:300, background:'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)', top:'50%', left:'40%', transform:'translate(-50%,-50%)' }} />

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'60px 24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center', width:'100%', position:'relative', zIndex:1 }} className="hero-grid">
        {/* Left */}
        <div style={{ animation:'fadeInLeft 0.7s cubic-bezier(.16,1,.3,1) forwards' }}>
          {/* Badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(79,70,229,0.08)', border:'1px solid rgba(79,70,229,0.2)', borderRadius:999, padding:'7px 16px', marginBottom:28 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#10B981', flexShrink:0 }} className="animate-pulse-dot" />
            <span style={{ fontSize:13, fontWeight:600, color:'#4F46E5' }}>Live rates · Instant detection · No signup</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily:'Syne', fontWeight:800, fontSize:'clamp(48px,6.5vw,84px)', lineHeight:1.0, color:'#111827', letterSpacing:'-0.01em', marginBottom:22 }}>
            CONVERT<br />
            CRYPTO<br />
            TO NAIRA<br />
            <span className="gradient-text">INSTANTLY.</span>
          </h1>

          <p style={{ fontSize:'clamp(16px,1.8vw,18px)', color:'#6B7280', lineHeight:1.75, marginBottom:36, maxWidth:460 }}>
            Send any crypto, receive Naira in your Nigerian bank account within seconds. No account needed, no forms, no waiting.
          </p>

          {/* CTAs */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:44 }}>
            <a href="#widget" style={{ textDecoration:'none' }}>
              <button style={{
                background:'linear-gradient(135deg,#4F46E5,#7C3AED)',
                color:'#fff', fontFamily:'DM Sans', fontWeight:700, fontSize:'1rem',
                padding:'14px 30px', borderRadius:14, border:'none', cursor:'pointer',
                boxShadow:'0 4px 24px rgba(79,70,229,0.38)', transition:'all 0.25s', whiteSpace:'nowrap',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 32px rgba(79,70,229,0.48)' }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 24px rgba(79,70,229,0.38)' }}>
                Convert Now
              </button>
            </a>
            <a href="#download" style={{ textDecoration:'none' }}>
              <button className="btn-outline">Download App</button>
            </a>
          </div>

          {/* Stats */}
          <div style={{ display:'flex', gap:28, flexWrap:'wrap' }}>
            {[['15k+','Users'],['₦2.8B+','Converted'],['< 3s','Detection'],['8','Coins']].map(([v, l]) => (
              <div key={l} style={{ borderLeft:'3px solid rgba(79,70,229,0.2)', paddingLeft:14 }}>
                <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:26, color:'#4F46E5', lineHeight:1.1 }}>{v}</div>
                <div style={{ fontSize:13, color:'#9CA3AF', fontWeight:500, marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — phone */}
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', animation:'fadeInRight 0.7s cubic-bezier(.16,1,.3,1) 0.15s both' }}>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', inset:'-24px', background:'radial-gradient(ellipse, rgba(79,70,229,0.18) 0%, transparent 70%)', borderRadius:'50%', zIndex:0 }} />
            <img
              src="/phone.jpg"
              alt="CERA App"
              className="animate-float hero-phone"
              style={{ width:'100%', maxWidth:300, borderRadius:32, boxShadow:'0 40px 100px rgba(79,70,229,0.28)', position:'relative', zIndex:1, display:'block' }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Widget Section ───────────────────────────────────────────────────────────

function WidgetSection() {
  return (
    <section id="widget" style={{
      background:'linear-gradient(180deg, #F7F5FF 0%, #EEF2FF 100%)',
      padding:'96px 24px',
      position:'relative',
      overflow:'hidden',
    }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundImage:'radial-gradient(circle, rgba(79,70,229,0.07) 1px, transparent 1px)', backgroundSize:'24px 24px', pointerEvents:'none' }} />
      <div style={{ maxWidth:560, margin:'0 auto', position:'relative', zIndex:1 }}>
        <div style={{ textAlign:'center', marginBottom:40 }} className="reveal">
          <span className="section-label" style={{ marginBottom:14, display:'flex', justifyContent:'center' }}>Quick Convert</span>
          <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:'clamp(32px,5vw,52px)', color:'#111827', lineHeight:1.1 }}>TRY IT NOW<br/>NO SIGNUP</h2>
          <p style={{ color:'#6B7280', marginTop:12, fontSize:16 }}>Offramp crypto to Naira or swap any crypto instantly.</p>
        </div>
        <div className="reveal delay-1">
          <ConversionWidget />
        </div>
      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { n:'01', title:'ENTER DETAILS', desc:'Choose your coin, enter the amount, and provide your Nigerian bank details. All major banks and mobile wallets supported.' },
    { n:'02', title:'SEND CRYPTO',   desc:'Send the exact amount to your unique deposit address. BTC, ETH, SOL, USDT, BNB, TRX, USDC — we cover them all.' },
    { n:'03', title:'NAIRA LANDS',   desc:'Our system detects your payment in seconds and sends Naira straight to your bank account. No calls, no delays.' },
  ]
  return (
    <section id="how-it-works" style={{ padding:'100px 24px', background:'#fff' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:64 }} className="reveal">
          <span className="section-label" style={{ justifyContent:'center', display:'flex', marginBottom:14 }}>How It Works</span>
          <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:'clamp(32px,5vw,58px)', color:'#111827' }}>THREE STEPS TO NAIRA</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
          {steps.map((s, i) => (
            <div key={s.n} className={`card reveal delay-${i+1}`} style={{ padding:36, position:'relative', overflow:'hidden' }}>
              <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:80, color:'rgba(79,70,229,0.06)', position:'absolute', top:-12, right:12, lineHeight:1, letterSpacing:'-0.04em' }}>{s.n}</div>
              <div style={{ width:50, height:50, borderRadius:14, background:'linear-gradient(135deg,#4F46E5,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:22, boxShadow:'0 6px 20px rgba(79,70,229,0.3)' }}>
                <span style={{ fontFamily:'Syne', fontWeight:800, fontSize:18, color:'#fff' }}>{s.n}</span>
              </div>
              <h3 style={{ fontFamily:'Syne', fontWeight:800, fontSize:22, color:'#111827', marginBottom:12, letterSpacing:'-0.01em' }}>{s.title}</h3>
              <p style={{ color:'#6B7280', lineHeight:1.75, fontSize:15 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Supported Coins ──────────────────────────────────────────────────────────

function SupportedCoins() {
  const all = [...COINS, { symbol:'MATIC', name:'Polygon', icon:'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/matic.svg' }]
  const double = [...all, ...all]
  return (
    <section style={{ padding:'80px 0', background:'#fff', overflow:'hidden', borderTop:'1px solid #F3F4F6' }}>
      <div style={{ textAlign:'center', marginBottom:48, padding:'0 24px' }} className="reveal">
        <span className="section-label" style={{ justifyContent:'center', display:'flex', marginBottom:14 }}>Supported Coins</span>
        <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:'clamp(28px,4vw,48px)', color:'#111827' }}>8 COINS. 12+ CHAINS.</h2>
        <p style={{ color:'#6B7280', marginTop:10, fontSize:15 }}>USDT accepted on 5 networks: Ethereum, BNB, Polygon, TRON, Solana</p>
      </div>
      <div className="ticker-wrap">
        <div className="ticker-inner animate-marquee">
          {double.map((c, i) => (
            <div key={i} style={{ display:'inline-flex', alignItems:'center', gap:10, margin:'0 14px', background:'#fff', border:'1.5px solid #EEEBFF', borderRadius:999, padding:'10px 20px', boxShadow:'0 2px 10px rgba(79,70,229,0.08)' }}>
              <img src={c.icon} alt={c.symbol} style={{ width:26, height:26 }} />
              <span style={{ fontWeight:700, color:'#111827', fontSize:14 }}>{c.symbol}</span>
              <span style={{ color:'#9CA3AF', fontSize:13 }}>{c.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────

function Features() {
  const feats = [
    {
      Icon: IconLightning,
      color: '#F97316',
      title: 'DETECTED IN SECONDS',
      desc: 'Real-time WebSocket watchers catch your payment the moment it hits the blockchain. No 5-minute waits, ever.',
    },
    {
      Icon: IconTrend,
      color: '#10B981',
      title: 'LIVE MARKET RATES',
      desc: 'Rates pulled from CoinGecko every 2 minutes. You always get real market price — never a stale, padded rate.',
    },
    {
      Icon: IconShield,
      color: '#4F46E5',
      title: 'ZERO SIGNUP NEEDED',
      desc: 'Use the web converter with only your bank details. No account, no password, no KYC for quick conversions.',
    },
    {
      Icon: IconPhone,
      color: '#7C3AED',
      title: 'MOBILE APP POWER',
      desc: 'Download for transaction history, auto-processing, higher limits and instant conversions on the go.',
    },
  ]
  return (
    <section id="features" className="dark-grid-bg" style={{ padding:'100px 24px', background:'#0B0520', position:'relative', overflow:'hidden' }}>
      {/* Top glow */}
      <div style={{ position:'absolute', top:-100, left:'50%', transform:'translateX(-50%)', width:600, height:300, background:'radial-gradient(ellipse, rgba(79,70,229,0.25) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ maxWidth:1200, margin:'0 auto', position:'relative', zIndex:1 }}>
        <div style={{ textAlign:'center', marginBottom:64 }} className="reveal">
          <span style={{ fontSize:'0.75rem', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'#7C3AED' }}>Why CERA</span>
          <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:'clamp(32px,5vw,58px)', color:'#fff', marginTop:12 }}>BUILT DIFFERENT.</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:20 }}>
          {feats.map((f, i) => (
            <div key={f.title} className={`reveal delay-${i+1}`} style={{
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:20, padding:32,
              transition:'all 0.35s cubic-bezier(.16,1,.3,1)',
              cursor:'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(79,70,229,0.14)'; e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.borderColor='rgba(79,70,229,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)' }}>
              <div style={{ width:52, height:52, borderRadius:14, background:`${f.color}20`, border:`1.5px solid ${f.color}40`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:22, color:f.color }}>
                <f.Icon />
              </div>
              <h3 style={{ fontFamily:'Syne', fontWeight:800, fontSize:20, color:'#fff', marginBottom:12, letterSpacing:'-0.01em' }}>{f.title}</h3>
              <p style={{ color:'rgba(255,255,255,0.55)', lineHeight:1.75, fontSize:15 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Download ─────────────────────────────────────────────────────────────────

function Download() {
  return (
    <section id="download" style={{ padding:'100px 24px', background:'linear-gradient(180deg, #fff 0%, #F7F5FF 100%)' }}>
      <div style={{ maxWidth:1060, margin:'0 auto' }}>
        <div className="reveal" style={{
          background:'linear-gradient(135deg,#3730A3 0%,#4F46E5 40%,#7C3AED 100%)',
          borderRadius:32, padding:'60px 52px',
          display:'grid', gridTemplateColumns:'1fr auto', gap:48, alignItems:'center',
          position:'relative', overflow:'hidden',
        }} id="download-inner">
          {/* Bg orb */}
          <div style={{ position:'absolute', top:-80, right:200, width:300, height:300, background:'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-60, left:-40, width:240, height:240, background:'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />

          {/* Left */}
          <div style={{ position:'relative', zIndex:1 }}>
            <span style={{ fontSize:'0.75rem', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(255,255,255,0.55)', display:'block', marginBottom:16 }}>Mobile App</span>
            <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:'clamp(32px,4vw,54px)', color:'#fff', lineHeight:1.05, marginBottom:18 }}>
              THE FULL<br/>CERA EXPERIENCE
            </h2>
            <p style={{ color:'rgba(255,255,255,0.72)', lineHeight:1.75, marginBottom:36, fontSize:16, maxWidth:440 }}>
              Saved bank details, full transaction history, auto-processing and higher daily limits. Convert crypto to Naira on autopilot.
            </p>

            {/* Rating */}
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:28 }}>
              {[1,2,3,4,5].map(i => <IconStar key={i} />)}
              <span style={{ color:'rgba(255,255,255,0.7)', fontSize:13, fontWeight:600, marginLeft:6 }}>4.9 · 2,400+ ratings</span>
            </div>

            <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
              <a href="#" className="store-badge">
                <IconApple />
                <div>
                  <div style={{ fontSize:'0.65rem', opacity:0.65, fontFamily:'DM Sans', lineHeight:1 }}>Download on the</div>
                  <div style={{ fontSize:'1.05rem', fontFamily:'DM Sans', fontWeight:700, lineHeight:1.25 }}>App Store</div>
                </div>
              </a>
              <a href="#" className="store-badge">
                <IconPlayStore />
                <div>
                  <div style={{ fontSize:'0.65rem', opacity:0.65, fontFamily:'DM Sans', lineHeight:1 }}>Get it on</div>
                  <div style={{ fontSize:'1.05rem', fontFamily:'DM Sans', fontWeight:700, lineHeight:1.25 }}>Google Play</div>
                </div>
              </a>
            </div>
          </div>

          {/* Right — phone */}
          <div style={{ position:'relative', zIndex:1, display:'flex', justifyContent:'center' }} className="download-phone">
            <img src="/phone.jpg" alt="CERA App"
              style={{ width:220, borderRadius:28, boxShadow:'0 32px 80px rgba(0,0,0,0.45)', transform:'rotate(2deg)', display:'block' }} />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ background:'#0B0520', borderTop:'1px solid rgba(255,255,255,0.05)', padding:'52px 24px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:24, marginBottom:32 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#4F46E5,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <span style={{ fontFamily:'Syne', fontWeight:800, fontSize:20, color:'#fff', letterSpacing:'0.03em' }}>CERA</span>
          </div>
          <div style={{ display:'flex', gap:28 }}>
            {['Privacy','Terms','Support'].map(l => (
              <a key={l} href="#" style={{ color:'rgba(255,255,255,0.4)', fontSize:14, textDecoration:'none', fontFamily:'DM Sans', transition:'color 0.2s' }}
                onMouseEnter={e => e.target.style.color='rgba(255,255,255,0.9)'} onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.4)'}>{l}</a>
            ))}
          </div>
        </div>
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:28, display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <p style={{ color:'rgba(255,255,255,0.3)', fontSize:13, fontFamily:'DM Sans' }}>
            © 2025 CERA · All rights reserved
          </p>
          <p style={{ color:'rgba(255,255,255,0.3)', fontSize:13, fontFamily:'DM Sans' }}>
            support@ceraapp.co
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── Home ─────────────────────────────────────────────────────────────────────

export default function Home() {
  useReveal()
  return (
    <>
      <style>{`
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; padding-top: 80px !important; padding-bottom: 60px !important; }
          .hero-phone { max-width: 220px !important; }
          #download-inner { grid-template-columns: 1fr !important; }
          .download-phone { display: none !important; }
        }
        @media (max-width: 600px) {
          .hero-phone { max-width: 180px !important; }
          .hamburger-btn { display: flex !important; }
        }
        @media (min-width: 601px) {
          .hamburger-btn { display: none !important; }
        }
      `}</style>
      <Navbar />
      <Hero />
      <WidgetSection />
      <HowItWorks />
      <SupportedCoins />
      <Features />
      <Download />
      <Footer />
    </>
  )
}
