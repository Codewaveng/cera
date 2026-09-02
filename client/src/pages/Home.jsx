import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Constants ───────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    }, { threshold: 0.15 })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconCopy  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
const IconCheck = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IconArrow = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16l-4-4 4-4M17 8l4 4-4 4M14 4l-4 16"/></svg>
const IconApple = () => (
  <svg width="24" height="24" viewBox="0 0 814 1000" fill="white">
    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-43.4-150.3-112.7C172.5 672.4 124.5 548.1 124.5 430c0-194.3 125.4-297.5 248.1-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99zM554.1 158.6c27.6-34.4 47.7-82.4 47.7-130.4 0-6.5-.6-13-1.9-18.2-45.1 1.9-98.3 30.3-131 68.7-27.7 33.1-50.8 81.1-50.8 130.4 0 7.1 1.3 14.3 1.9 16.5 2.6.4 6.5.6 10.4.6 40.8 0 91.6-27.1 123.7-67.6z"/>
  </svg>
)
const IconPlay = () => (
  <svg width="22" height="22" viewBox="0 0 512 512" fill="white">
    <path d="M99.617 8.057a50.191 50.191 0 00-38.815-6.713l230.932 230.933 74.846-74.846L99.617 8.057zM32.139 20.116c-6.441 8.563-10.148 19.077-10.148 30.199v411.358c0 11.123 3.708 21.636 10.148 30.199l235.877-235.877L32.139 20.116zM464.261 212.087l-67.066-38.731-81.002 81.002 81.002 81.002 67.765-39.186c19.167-11.077 19.167-74.086-.699-84.087zM236.placement 461.674L5.708 691.674c11.031 3.657 22.954 3.53 34.383-.323L415.16 482.72l-178.84-20.746z"/>
  </svg>
)
const IconSpinner = () => <div style={{width:20,height:20,border:'2.5px solid rgba(255,255,255,0.3)',borderTop:'2.5px solid #fff',borderRadius:'50%'}} className="animate-spin-slow"/>

// ─── CopyButton ──────────────────────────────────────────────────────────────

function CopyButton({ text, dark }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }
  return (
    <button onClick={copy} style={{
      background: dark ? 'rgba(255,255,255,0.15)' : 'rgba(79,70,229,0.1)',
      border: dark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(79,70,229,0.2)',
      borderRadius: 8, padding: '6px 12px',
      color: copied ? '#10B981' : dark ? '#fff' : '#4F46E5',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans', transition: 'all 0.2s'
    }}>
      {copied ? <IconCheck /> : <IconCopy />} {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

// ─── CoinSelect ──────────────────────────────────────────────────────────────

function CoinSelect({ value, onChange, coins, style }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      <select className="input-field" value={value} onChange={e => onChange(e.target.value)}
        style={{ paddingLeft: '2.6rem', paddingRight: '1.5rem', appearance: 'none', cursor: 'pointer', fontWeight: 600 }}>
        {coins.map(c => <option key={c.symbol} value={c.symbol}>{c.symbol} — {c.name}</option>)}
      </select>
      <img src={coins.find(c => c.symbol === value)?.icon} alt="" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:20, height:20, pointerEvents:'none' }} />
    </div>
  )
}

// ─── StatusDot ───────────────────────────────────────────────────────────────

function StatusDot({ status }) {
  const colors = { waiting:'#F59E0B', detected:'#3B82F6', processing:'#8B5CF6', completed:'#10B981', waiting_for_deposit:'#F59E0B', confirming:'#3B82F6', exchanging:'#8B5CF6', sending:'#10B981', finished:'#10B981', failed:'#EF4444', expired:'#6B7280' }
  const labels = { waiting:'Waiting for payment', detected:'Payment detected', processing:'Processing payout', completed:'Naira sent', waiting_for_deposit:'Waiting for deposit', confirming:'Confirming', exchanging:'Exchanging', sending:'Sending to you', finished:'Complete', failed:'Failed', expired:'Expired' }
  const c = colors[status] || '#6B7280'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ width:10, height:10, borderRadius:'50%', background:c, boxShadow:`0 0 0 3px ${c}30` }} className={['waiting','waiting_for_deposit','confirming','exchanging','processing','sending','detected'].includes(status) ? 'animate-pulse-dot' : ''} />
      <span style={{ fontSize:14, fontWeight:600, color:c }}>{labels[status] || status}</span>
    </div>
  )
}

// ─── DepositCard ─────────────────────────────────────────────────────────────

function DepositCard({ address, coin, amount, timer, status, onDone, type }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ textAlign:'center' }}>
        <StatusDot status={status} />
      </div>

      {status !== 'completed' && status !== 'finished' && (
        <>
          <div style={{ background:'#F5F3FF', borderRadius:16, padding:20 }}>
            <p style={{ fontSize:12, color:'#6B7280', marginBottom:6, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Send exactly</p>
            <p style={{ fontSize:26, fontWeight:700, color:'#111827', fontFamily:'DM Sans' }}>
              {amount ? `${amount} ` : ''}<span style={{ color:'#4F46E5' }}>{coin}</span>
            </p>
          </div>

          <div>
            <p style={{ fontSize:12, color:'#6B7280', marginBottom:8, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>
              {type === 'swap' ? 'ChangeNow deposit address' : 'Deposit address'}
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:10, background:'#F9FAFB', border:'1.5px solid #E5E7EB', borderRadius:12, padding:'10px 14px' }}>
              <span style={{ fontFamily:'monospace', fontSize:13, color:'#111827', wordBreak:'break-all', flex:1 }}>{address}</span>
              <CopyButton text={address} />
            </div>
          </div>

          {timer > 0 && (
            <div style={{ textAlign:'center', color:'#6B7280', fontSize:14 }}>
              Expires in <span style={{ fontWeight:700, color: timer < 300 ? '#EF4444' : '#111827' }}>{formatTimer(timer)}</span>
            </div>
          )}
        </>
      )}

      {(status === 'completed' || status === 'finished') && (
        <div style={{ textAlign:'center', padding:'20px 0' }}>
          <div style={{ width:60, height:60, borderRadius:'50%', background:'rgba(16,185,129,0.12)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h3 style={{ fontFamily:'Bebas Neue', fontSize:28, color:'#10B981', letterSpacing:'0.03em' }}>
            {type === 'swap' ? 'Swap Complete' : 'Naira Sent'}
          </h3>
          <p style={{ color:'#6B7280', marginTop:8, fontSize:14 }}>
            {type === 'swap' ? 'Your crypto has been exchanged and sent.' : 'Check your bank account — the money is on its way.'}
          </p>
          <div style={{ marginTop:20, padding:'16px', background:'#F5F3FF', borderRadius:12 }}>
            <p style={{ fontSize:13, color:'#4F46E5', fontWeight:600 }}>Want instant conversions + history?</p>
            <p style={{ fontSize:13, color:'#6B7280', marginTop:4 }}>Download the CERA app for auto-processing and saved bank details.</p>
          </div>
          <button onClick={onDone} style={{ marginTop:16, background:'none', border:'none', color:'#4F46E5', fontWeight:600, cursor:'pointer', fontSize:14 }}>Convert again</button>
        </div>
      )}
    </div>
  )
}

// ─── OfframpWidget ────────────────────────────────────────────────────────────

function OfframpWidget() {
  const [coin, setCoin]         = useState('USDT')
  const [chain, setChain]       = useState('ETH')
  const [amount, setAmount]     = useState('')
  const [bank, setBank]         = useState(BANKS[0].code)
  const [accNum, setAccNum]     = useState('')
  const [accName, setAccName]   = useState('')
  const [rate, setRate]         = useState(null)
  const [step, setStep]         = useState('form') // form | pending | done
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [guestId, setGuestId]   = useState(null)
  const [deposit, setDeposit]   = useState(null)
  const [status, setStatus]     = useState('waiting')
  const [timer, setTimer]       = useState(1800)
  const pollRef = useRef(null)

  // Fetch live rate
  useEffect(() => {
    fetch('/api/rates').then(r => r.json()).then(data => {
      const r = data[coin] || data[coin + 'usdt'] || null
      setRate(r?.priceNGN || null)
    }).catch(() => {})
  }, [coin])

  // Countdown timer
  useEffect(() => {
    if (step !== 'pending') return
    const t = setInterval(() => setTimer(s => s > 0 ? s - 1 : 0), 1000)
    return () => clearInterval(t)
  }, [step])

  // Poll status
  const startPoll = useCallback((id) => {
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/guest/${id}`)
        const d = await r.json()
        setStatus(d.status)
        if (d.status === 'completed' || d.status === 'failed' || d.status === 'expired') {
          clearInterval(pollRef.current)
          if (d.status === 'completed') setStep('done')
        }
      } catch {}
    }, 4000)
  }, [])

  useEffect(() => () => clearInterval(pollRef.current), [])

  const onSubmit = async () => {
    setError('')
    if (!amount || isNaN(amount) || Number(amount) <= 0) { setError('Enter a valid amount'); return }
    if (!accNum || accNum.length < 10) { setError('Enter a valid 10-digit account number'); return }
    if (!accName.trim()) { setError('Enter your account name'); return }
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
      setGuestId(d.guestId)
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
        onDone={() => { setStep('form'); setStatus('waiting'); setTimer(1800); setDeposit(null); setAmount(''); setGuestId(null) }}
      />
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Coin + amount */}
      <div>
        <label style={{ fontSize:12, color:'#6B7280', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:8 }}>You Send</label>
        <div style={{ display:'flex', gap:10 }}>
          <input className="input-field" type="number" placeholder="0.00" value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ flex:1, fontWeight:700, fontSize:18 }} />
          <CoinSelect value={coin} onChange={v => { setCoin(v); if (STABLECOIN_CHAINS[v]) setChain(STABLECOIN_CHAINS[v][0]) }} coins={COINS} style={{ width:160 }} />
        </div>
        {isStable && (
          <select className="input-field" value={chain} onChange={e => setChain(e.target.value)} style={{ marginTop:8, appearance:'none' }}>
            {STABLECOIN_CHAINS[coin].map(c => <option key={c} value={c}>{coin} on {c}</option>)}
          </select>
        )}
        {nairaVal && (
          <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#10B981' }} />
            <span style={{ fontSize:14, color:'#10B981', fontWeight:700 }}>≈ {formatNaira(nairaVal)}</span>
            <span style={{ fontSize:12, color:'#9CA3AF' }}>· live rate {formatNaira(rate)}/{coin}</span>
          </div>
        )}
      </div>

      {/* Bank */}
      <div style={{ borderTop:'1px solid #F3F4F6', paddingTop:16 }}>
        <label style={{ fontSize:12, color:'#6B7280', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:8 }}>Your Bank</label>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <select className="input-field" value={bank} onChange={e => setBank(e.target.value)} style={{ appearance:'none' }}>
            {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
          </select>
          <input className="input-field" placeholder="Account number (10 digits)" value={accNum}
            onChange={e => setAccNum(e.target.value.replace(/\D/g,'').slice(0,10))} maxLength={10} />
          <input className="input-field" placeholder="Account name" value={accName}
            onChange={e => setAccName(e.target.value)} />
        </div>
      </div>

      {error && <p style={{ color:'#EF4444', fontSize:13, fontWeight:500 }}>{error}</p>}

      <button className="btn-primary" onClick={onSubmit} disabled={loading}>
        {loading ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><IconSpinner /> Getting your address...</span> : 'Convert to Naira →'}
      </button>

      <p style={{ fontSize:12, color:'#9CA3AF', textAlign:'center' }}>
        Powered by live CoinGecko rates · No account needed
      </p>
    </div>
  )
}

// ─── SwapWidget ───────────────────────────────────────────────────────────────

function SwapWidget() {
  const [fromCoin, setFromCoin]   = useState('BTC')
  const [toCoin, setToCoin]       = useState('ETH')
  const [amount, setAmount]       = useState('')
  const [destAddr, setDestAddr]   = useState('')
  const [estimate, setEstimate]   = useState(null)
  const [minAmount, setMinAmount] = useState(null)
  const [estimating, setEstimating] = useState(false)
  const [step, setStep]           = useState('form')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [swapData, setSwapData]   = useState(null)
  const [swapStatus, setSwapStatus] = useState('waiting_for_deposit')
  const debounceRef = useRef(null)
  const pollRef = useRef(null)

  // Fetch min amount
  useEffect(() => {
    if (!fromCoin || !toCoin) return
    fetch(`/api/changenow/min?from=${fromCoin.toLowerCase()}&to=${toCoin.toLowerCase()}`)
      .then(r => r.json()).then(d => setMinAmount(d.minAmount)).catch(() => {})
  }, [fromCoin, toCoin])

  // Debounced estimate
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
        if (d.status === 'finished' || d.status === 'failed' || d.status === 'refunded') {
          clearInterval(pollRef.current)
        }
      } catch {}
    }, 5000)
  }, [])

  useEffect(() => () => clearInterval(pollRef.current), [])

  const onSwap = async () => {
    setError('')
    if (!amount || isNaN(amount) || Number(amount) <= 0) { setError('Enter an amount'); return }
    if (!destAddr.trim()) { setError('Enter destination wallet address'); return }
    if (minAmount && Number(amount) < minAmount) { setError(`Minimum is ${minAmount} ${fromCoin}`); return }
    setLoading(true)
    try {
      const r = await fetch('/api/changenow/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: fromCoin.toLowerCase(), to: toCoin.toLowerCase(), amount: Number(amount), address: destAddr }),
      })
      const d = await r.json()
      if (!r.ok || d.error) throw new Error(d.error || d.message || 'Failed to create swap')
      setSwapData(d)
      setStep('pending')
      startPoll(d.id)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const swap = () => {
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
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* From */}
      <div>
        <label style={{ fontSize:12, color:'#6B7280', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:8 }}>You Send</label>
        <div style={{ display:'flex', gap:10 }}>
          <input className="input-field" type="number" placeholder="0.00" value={amount}
            onChange={e => setAmount(e.target.value)} style={{ flex:1, fontWeight:700, fontSize:18 }} />
          <CoinSelect value={fromCoin} onChange={setFromCoin} coins={SWAP_COINS} style={{ width:160 }} />
        </div>
        {minAmount && <p style={{ fontSize:12, color:'#9CA3AF', marginTop:4 }}>Min: {minAmount} {fromCoin}</p>}
      </div>

      {/* Swap arrow */}
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ flex:1, height:1, background:'#F3F4F6' }} />
        <button onClick={swap} style={{ width:36, height:36, borderRadius:'50%', border:'1.5px solid #E5E7EB', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#4F46E5', transition:'transform 0.3s' }}
          onMouseEnter={e => e.target.style.transform='rotate(180deg)'} onMouseLeave={e => e.target.style.transform='rotate(0deg)'}>
          <IconArrow />
        </button>
        <div style={{ flex:1, height:1, background:'#F3F4F6' }} />
      </div>

      {/* To */}
      <div>
        <label style={{ fontSize:12, color:'#6B7280', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:8 }}>You Receive</label>
        <div style={{ display:'flex', gap:10 }}>
          <div className="input-field" style={{ flex:1, display:'flex', alignItems:'center', background:'#F9FAFB', fontWeight:700, fontSize:18, color: estimate ? '#111827' : '#9CA3AF' }}>
            {estimating ? <span style={{ fontSize:14, color:'#9CA3AF' }}>Calculating...</span> : (estimate ? `≈ ${estimate}` : '—')}
          </div>
          <CoinSelect value={toCoin} onChange={setToCoin} coins={SWAP_COINS.filter(c => c.symbol !== fromCoin)} style={{ width:160 }} />
        </div>
      </div>

      {/* Destination */}
      <div>
        <label style={{ fontSize:12, color:'#6B7280', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:8 }}>Your {toCoin} Wallet Address</label>
        <input className="input-field" placeholder={`Enter your ${toCoin} address`} value={destAddr}
          onChange={e => setDestAddr(e.target.value)} style={{ fontFamily:'monospace', fontSize:13 }} />
      </div>

      {error && <p style={{ color:'#EF4444', fontSize:13, fontWeight:500 }}>{error}</p>}

      <button className="btn-primary" onClick={onSwap} disabled={loading}>
        {loading ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><IconSpinner /> Creating swap...</span> : `Swap ${fromCoin} → ${toCoin}`}
      </button>

      <p style={{ fontSize:12, color:'#9CA3AF', textAlign:'center' }}>
        Powered by ChangeNow · Best rate guaranteed
      </p>
    </div>
  )
}

// ─── ConversionWidget ─────────────────────────────────────────────────────────

function ConversionWidget() {
  const [tab, setTab] = useState('offramp')
  return (
    <div className="widget-card" style={{ padding:28 }}>
      <div className="tab-bar" style={{ marginBottom:24 }}>
        <button className={`tab-btn ${tab === 'offramp' ? 'active' : ''}`} onClick={() => setTab('offramp')}>
          Offramp → Naira
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
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, zIndex:100,
      background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid #F3F4F6' : 'none',
      transition:'all 0.3s',
    }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', height:68, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontFamily:'Bebas Neue', fontSize:28, letterSpacing:'0.08em', background:'linear-gradient(135deg,#4F46E5,#7C3AED)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>CERA</span>
        <div style={{ display:'flex', alignItems:'center', gap:32 }} className="hidden-mobile">
          {['Features','How It Works','Download'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s/g,'-')}`} style={{ textDecoration:'none', color:'#374151', fontWeight:500, fontSize:15, transition:'color 0.2s' }}
              onMouseEnter={e=>e.target.style.color='#4F46E5'} onMouseLeave={e=>e.target.style.color='#374151'}>{l}</a>
          ))}
        </div>
        <a href="#download" style={{ textDecoration:'none' }}>
          <button className="btn-outline" style={{ padding:'9px 20px' }}>Get the App</button>
        </a>
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section id="hero" style={{
      minHeight:'100vh', paddingTop:88,
      background:'radial-gradient(ellipse 65% 55% at 75% 15%, rgba(79,70,229,0.10) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 5% 85%, rgba(249,115,22,0.08) 0%, transparent 55%), #fff',
      display:'flex', alignItems:'center',
    }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'60px 24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center' }} className="hero-grid">
        {/* Left */}
        <div style={{ animation:'fadeInLeft 0.7s ease forwards' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(79,70,229,0.08)', border:'1px solid rgba(79,70,229,0.18)', borderRadius:999, padding:'6px 14px', marginBottom:24 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#10B981' }} className="animate-pulse-dot" />
            <span style={{ fontSize:13, fontWeight:600, color:'#4F46E5' }}>Live rates · Instant detection · No signup</span>
          </div>
          <h1 style={{ fontFamily:'Bebas Neue', fontSize:'clamp(52px,7vw,88px)', lineHeight:1.0, color:'#111827', letterSpacing:'0.02em', marginBottom:20 }}>
            CONVERT CRYPTO<br/>
            TO NAIRA<br/>
            <span className="gradient-text">INSTANTLY.</span>
          </h1>
          <p style={{ fontSize:'clamp(16px,2vw,19px)', color:'#6B7280', lineHeight:1.7, marginBottom:32, maxWidth:480 }}>
            Send any crypto, receive Naira in your Nigerian bank account within seconds. No account needed, no forms, no waiting.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:40 }}>
            <a href="#widget">
              <button style={{ background:'linear-gradient(135deg,#4F46E5,#7C3AED)', color:'#fff', fontFamily:'DM Sans', fontWeight:700, fontSize:'1rem', padding:'14px 28px', borderRadius:14, border:'none', cursor:'pointer', boxShadow:'0 4px 20px rgba(79,70,229,0.35)', transition:'transform 0.2s,box-shadow 0.2s', whiteSpace:'nowrap' }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 28px rgba(79,70,229,0.45)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 4px 20px rgba(79,70,229,0.35)'}}>
                Convert Now →
              </button>
            </a>
            <a href="#download">
              <button className="btn-outline">Download App</button>
            </a>
          </div>
          <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
            {[['15k+','Users'],['₦2.8B+','Converted'],['< 3s','Detection'],['8','Coins']].map(([v,l]) => (
              <div key={l}>
                <div style={{ fontFamily:'Bebas Neue', fontSize:28, color:'#4F46E5', letterSpacing:'0.04em' }}>{v}</div>
                <div style={{ fontSize:13, color:'#6B7280', fontWeight:500 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Right — phone mockup */}
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', animation:'fadeInRight 0.7s ease 0.2s both' }}>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', inset:'-20px', background:'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)', borderRadius:'50%', zIndex:0 }} />
            <img
              src="/phone.jpg"
              alt="CERA App"
              className="animate-float"
              style={{ width:'100%', maxWidth:320, borderRadius:32, boxShadow:'0 32px 80px rgba(79,70,229,0.25)', position:'relative', zIndex:1 }}
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
    <section id="widget" style={{ background:'#F5F3FF', padding:'80px 24px' }}>
      <div style={{ maxWidth:540, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:36 }} className="reveal">
          <p className="section-label" style={{ marginBottom:12 }}>Quick Convert</p>
          <h2 style={{ fontFamily:'Bebas Neue', fontSize:'clamp(36px,5vw,56px)', color:'#111827', letterSpacing:'0.03em' }}>TRY IT NOW — NO SIGNUP</h2>
          <p style={{ color:'#6B7280', marginTop:10, fontSize:16 }}>Offramp crypto to Naira or swap any crypto for another.</p>
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
    { n:'01', title:'ENTER AMOUNT', desc:'Select your coin, enter the amount, and provide your Nigerian bank details. Supports all major banks and mobile wallets.' },
    { n:'02', title:'SEND CRYPTO',  desc:'Send the exact amount to the deposit address shown. Works with BTC, ETH, SOL, USDT, USDC, BNB, TRX and more.' },
    { n:'03', title:'NAIRA LANDS',  desc:'Our system detects your payment in seconds and sends Naira directly to your bank account. No delays.' },
  ]
  return (
    <section id="how-it-works" style={{ padding:'100px 24px', background:'#fff' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:64 }} className="reveal">
          <p className="section-label" style={{ marginBottom:12 }}>How It Works</p>
          <h2 style={{ fontFamily:'Bebas Neue', fontSize:'clamp(36px,5vw,60px)', color:'#111827' }}>THREE STEPS TO NAIRA</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:28 }}>
          {steps.map((s, i) => (
            <div key={s.n} className={`card reveal delay-${i+1}`} style={{ padding:36, position:'relative', overflow:'hidden', transition:'transform 0.3s,box-shadow 0.3s' }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-6px)';e.currentTarget.style.boxShadow='0 12px 40px rgba(79,70,229,0.12)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=''}}>
              <div style={{ fontFamily:'Bebas Neue', fontSize:72, color:'rgba(79,70,229,0.08)', position:'absolute', top:-8, right:16, lineHeight:1 }}>{s.n}</div>
              <div style={{ width:48, height:48, borderRadius:12, background:'linear-gradient(135deg,#4F46E5,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
                <span style={{ fontFamily:'Bebas Neue', fontSize:20, color:'#fff' }}>{s.n}</span>
              </div>
              <h3 style={{ fontFamily:'Bebas Neue', fontSize:24, color:'#111827', marginBottom:12, letterSpacing:'0.04em' }}>{s.title}</h3>
              <p style={{ color:'#6B7280', lineHeight:1.7, fontSize:15 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Supported Coins ──────────────────────────────────────────────────────────

function SupportedCoins() {
  const all = [
    ...COINS,
    { symbol:'MATIC', name:'Polygon', icon:'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/matic.svg' },
  ]
  const tickerCoins = [...all, ...all]
  return (
    <section style={{ padding:'80px 0', background:'#F5F3FF', overflow:'hidden' }}>
      <div style={{ textAlign:'center', marginBottom:48, padding:'0 24px' }} className="reveal">
        <p className="section-label" style={{ marginBottom:12 }}>Supported Coins</p>
        <h2 style={{ fontFamily:'Bebas Neue', fontSize:'clamp(32px,4vw,52px)', color:'#111827' }}>8 COINS. 12+ CHAINS.</h2>
        <p style={{ color:'#6B7280', marginTop:10, fontSize:15 }}>USDT accepted on 5 chains: Ethereum, BNB, Polygon, TRON, Solana</p>
      </div>
      {/* Ticker */}
      <div className="ticker-wrap">
        <div className="ticker-inner animate-marquee">
          {tickerCoins.map((c, i) => (
            <div key={i} style={{ display:'inline-flex', alignItems:'center', gap:10, margin:'0 20px', background:'#fff', border:'1px solid #E5E7EB', borderRadius:50, padding:'10px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
              <img src={c.icon} alt={c.symbol} style={{ width:28, height:28 }} />
              <span style={{ fontWeight:700, color:'#111827', fontSize:15 }}>{c.symbol}</span>
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
    { icon:'⚡', title:'DETECTED IN SECONDS', desc:'Our real-time WebSocket watchers detect incoming payments the moment they hit the blockchain — no 5-minute waits.' },
    { icon:'📈', title:'BEST LIVE RATES', desc:'Rates pulled from CoinGecko every 2 minutes. You always get the current market rate, not a stale one.' },
    { icon:'🔐', title:'ZERO SIGNUP FOR QUICK CONVERT', desc:'Use the web converter with just your bank details. No account, no password, no hassle.' },
    { icon:'📱', title:'MOBILE APP FOR POWER USERS', desc:'Download the CERA app for transaction history, auto-processing, higher limits, and instant conversions on-the-go.' },
  ]
  return (
    <section id="features" style={{ padding:'100px 24px', background:'#0B0520' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:64 }} className="reveal">
          <p style={{ fontSize:'0.8rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#7C3AED', marginBottom:12 }}>Why CERA</p>
          <h2 style={{ fontFamily:'Bebas Neue', fontSize:'clamp(36px,5vw,60px)', color:'#fff' }}>BUILT DIFFERENT.</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:24 }}>
          {feats.map((f, i) => (
            <div key={f.title} className={`reveal delay-${i+1}`} style={{
              background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:20, padding:32, transition:'background 0.3s,transform 0.3s'
            }} onMouseEnter={e=>{e.currentTarget.style.background='rgba(79,70,229,0.15)';e.currentTarget.style.transform='translateY(-4px)'}}
               onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.transform='translateY(0)'}}>
              <div style={{ fontSize:36, marginBottom:16 }}>{f.icon}</div>
              <h3 style={{ fontFamily:'Bebas Neue', fontSize:22, color:'#fff', marginBottom:12, letterSpacing:'0.04em' }}>{f.title}</h3>
              <p style={{ color:'rgba(255,255,255,0.6)', lineHeight:1.7, fontSize:15 }}>{f.desc}</p>
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
    <section id="download" style={{ padding:'100px 24px', background:'#fff' }}>
      <div style={{ maxWidth:1000, margin:'0 auto' }}>
        <div style={{ background:'linear-gradient(135deg,#4F46E5 0%,#7C3AED 50%,#3730A3 100%)', borderRadius:32, padding:'60px 48px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'center' }} className="reveal download-grid">
          {/* Left */}
          <div>
            <p style={{ fontSize:'0.8rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.6)', marginBottom:16 }}>Mobile App</p>
            <h2 style={{ fontFamily:'Bebas Neue', fontSize:'clamp(36px,4vw,58px)', color:'#fff', lineHeight:1.05, marginBottom:20 }}>
              THE FULL<br/>CERA EXPERIENCE
            </h2>
            <p style={{ color:'rgba(255,255,255,0.75)', lineHeight:1.7, marginBottom:32, fontSize:16 }}>
              Saved bank details, transaction history, auto-processing, higher limits. Convert crypto to Naira on autopilot.
            </p>
            <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
              {/* Apple Store */}
              <a href="#" className="store-badge" style={{ textDecoration:'none' }}>
                <svg width="24" height="24" viewBox="0 0 814 1000" fill="white">
                  <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-43.4-150.3-112.7C172.5 672.4 124.5 548.1 124.5 430c0-194.3 125.4-297.5 248.1-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99zM554.1 158.6c27.6-34.4 47.7-82.4 47.7-130.4 0-6.5-.6-13-1.9-18.2-45.1 1.9-98.3 30.3-131 68.7-27.7 33.1-50.8 81.1-50.8 130.4 0 7.1 1.3 14.3 1.9 16.5 2.6.4 6.5.6 10.4.6 40.8 0 91.6-27.1 123.7-67.6z"/>
                </svg>
                <div>
                  <div style={{ fontSize:'0.65rem', opacity:0.7, fontFamily:'DM Sans', lineHeight:1 }}>Download on the</div>
                  <div style={{ fontSize:'1.1rem', fontFamily:'DM Sans', fontWeight:700, lineHeight:1.2 }}>App Store</div>
                </div>
              </a>
              {/* Google Play */}
              <a href="#" className="store-badge" style={{ textDecoration:'none' }}>
                <svg width="24" height="24" viewBox="0 0 512 512" fill="none">
                  <path d="M48 28l228 228L48 484c-16-12-16-32-16-228S32 40 48 28z" fill="#EA4335"/>
                  <path d="M364 204l64 36-80 48-96-96z" fill="#FBBC04"/>
                  <path d="M48 28c8-6 20-8 32-2l232 134-80 80z" fill="#4285F4"/>
                  <path d="M48 484c8 6 20 8 32 2l232-134-80-80z" fill="#34A853"/>
                </svg>
                <div>
                  <div style={{ fontSize:'0.65rem', opacity:0.7, fontFamily:'DM Sans', lineHeight:1 }}>Get it on</div>
                  <div style={{ fontSize:'1.1rem', fontFamily:'DM Sans', fontWeight:700, lineHeight:1.2 }}>Google Play</div>
                </div>
              </a>
            </div>
          </div>
          {/* Right — phone */}
          <div style={{ display:'flex', justifyContent:'center' }}>
            <img src="/phone.jpg" alt="CERA App" style={{ width:'100%', maxWidth:260, borderRadius:28, boxShadow:'0 24px 64px rgba(0,0,0,0.35)', transform:'rotate(2deg)' }} />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ background:'#0B0520', borderTop:'1px solid rgba(255,255,255,0.06)', padding:'48px 24px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:20 }}>
        <span style={{ fontFamily:'Bebas Neue', fontSize:24, letterSpacing:'0.08em', background:'linear-gradient(135deg,#4F46E5,#7C3AED)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>CERA</span>
        <p style={{ color:'rgba(255,255,255,0.35)', fontSize:14, fontFamily:'DM Sans' }}>
          © 2025 CERA · support@ceraapp.co · All rights reserved
        </p>
        <div style={{ display:'flex', gap:24 }}>
          {['Privacy','Terms','Support'].map(l => (
            <a key={l} href="#" style={{ color:'rgba(255,255,255,0.4)', fontSize:14, textDecoration:'none', fontFamily:'DM Sans', transition:'color 0.2s' }}
              onMouseEnter={e=>e.target.style.color='#fff'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.4)'}>{l}</a>
          ))}
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
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-grid > div:last-child { display: none !important; }
          .download-grid { grid-template-columns: 1fr !important; }
          .download-grid > div:last-child { display: none !important; }
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
