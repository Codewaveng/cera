import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Data ────────────────────────────────────────────────────────────────────

const COINS = [
  { symbol:'BTC',  name:'Bitcoin',  icon:'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/btc.svg' },
  { symbol:'ETH',  name:'Ethereum', icon:'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/eth.svg' },
  { symbol:'BNB',  name:'BNB',      icon:'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/bnb.svg' },
  { symbol:'SOL',  name:'Solana',   icon:'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/sol.svg' },
  { symbol:'TRX',  name:'TRON',     icon:'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/trx.svg' },
  { symbol:'USDT', name:'USDT',     icon:'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/usdt.svg' },
  { symbol:'USDC', name:'USDC',     icon:'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/usdc.svg' },
]

const SWAP_COINS = [
  ...COINS,
  { symbol:'MATIC', name:'Polygon',  icon:'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/matic.svg' },
  { symbol:'LTC',   name:'Litecoin', icon:'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/ltc.svg' },
  { symbol:'XRP',   name:'XRP',      icon:'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/xrp.svg' },
  { symbol:'DOGE',  name:'Dogecoin', icon:'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/doge.svg' },
]

const BANKS = [
  { name:'Access Bank',   code:'044' },
  { name:'GTBank',        code:'058' },
  { name:'Zenith Bank',   code:'057' },
  { name:'First Bank',    code:'011' },
  { name:'UBA',           code:'033' },
  { name:'Stanbic IBTC',  code:'221' },
  { name:'Fidelity Bank', code:'070' },
  { name:'FCMB',          code:'214' },
  { name:'Sterling Bank', code:'232' },
  { name:'Polaris Bank',  code:'076' },
  { name:'Ecobank',       code:'050' },
  { name:'Union Bank',    code:'032' },
  { name:'Kuda Bank',     code:'090267' },
  { name:'OPay',          code:'100004' },
  { name:'PalmPay',       code:'999991' },
  { name:'Moniepoint',    code:'50515' },
]

const STABLECOIN_CHAINS = {
  USDT: ['ETH','BNB','Polygon','TRON','Solana'],
  USDC: ['ETH','BNB','Polygon','Solana'],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtNaira = n => n && !isNaN(n) ? '₦' + Number(n).toLocaleString('en-NG', { maximumFractionDigits:2 }) : '₦0'
const fmtTimer = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } })
    }, { threshold:0.12 })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IcCopy    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
const IcCheck   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcSwap    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16l-4-4 4-4"/><path d="M3 12h18"/><path d="M17 8l4 4-4 4"/></svg>
const IcSpin    = () => <div style={{width:17,height:17,border:'2.5px solid rgba(255,255,255,0.3)',borderTop:'2.5px solid #fff',borderRadius:'50%'}} className="animate-spin-slow"/>
const IcZap     = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
const IcChart   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
const IcShield  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const IcPhone   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
const IcMenu    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
const IcX       = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcApple   = () => <svg width="20" height="20" viewBox="0 0 814 1000" fill="white"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-43.4-150.3-112.7C172.5 672.4 124.5 548.1 124.5 430c0-194.3 125.4-297.5 248.1-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99zM554.1 158.6c27.6-34.4 47.7-82.4 47.7-130.4 0-6.5-.6-13-1.9-18.2-45.1 1.9-98.3 30.3-131 68.7-27.7 33.1-50.8 81.1-50.8 130.4 0 7.1 1.3 14.3 1.9 16.5 2.6.4 6.5.6 10.4.6 40.8 0 91.6-27.1 123.7-67.6z"/></svg>
const IcGPlay   = () => <svg width="20" height="20" viewBox="0 0 512 512" fill="none"><path d="M48 28l228 228L48 484c-16-12-16-32-16-228S32 40 48 28z" fill="#EA4335"/><path d="M364 204l64 36-80 48-96-96z" fill="#FBBC04"/><path d="M48 28c8-6 20-8 32-2l232 134-80 80z" fill="#4285F4"/><path d="M48 484c8 6 20 8 32 2l232-134-80-80z" fill="#34A853"/></svg>

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })}
      style={{ background:'rgba(79,70,229,0.07)', border:'1px solid rgba(79,70,229,0.15)', borderRadius:8, padding:'5px 11px',
        color: copied ? '#10B981' : '#4F46E5', cursor:'pointer', display:'flex', alignItems:'center', gap:5,
        fontSize:12, fontWeight:600, fontFamily:'Plus Jakarta Sans', transition:'all 0.2s', flexShrink:0 }}>
      {copied ? <IcCheck /> : <IcCopy />}{copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// ─── CoinSelect ───────────────────────────────────────────────────────────────

function CoinSelect({ value, onChange, coins, style }) {
  const coin = coins.find(c => c.symbol === value)
  return (
    <div style={{ position:'relative', ...style }}>
      <select className="input-field" value={value} onChange={e => onChange(e.target.value)}
        style={{ paddingLeft:'2.5rem', appearance:'none', cursor:'pointer', fontWeight:600, fontSize:14 }}>
        {coins.map(c => <option key={c.symbol} value={c.symbol}>{c.symbol} — {c.name}</option>)}
      </select>
      {coin && <img src={coin.icon} alt="" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:18, height:18, pointerEvents:'none' }} />}
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
    sending:            { c:'#10B981', l:'Sending' },
    finished:           { c:'#10B981', l:'Complete' },
    failed:             { c:'#EF4444', l:'Failed' },
    expired:            { c:'#94A3B8', l:'Expired' },
  }
  const { c, l } = MAP[status] || { c:'#94A3B8', l: status }
  const pulse = ['waiting','waiting_for_deposit','confirming','exchanging','processing','detected'].includes(status)
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
      <div style={{ width:9, height:9, borderRadius:'50%', background:c, boxShadow:`0 0 0 3px ${c}25`, flexShrink:0 }} className={pulse ? 'animate-pulse-dot' : ''} />
      <span style={{ fontSize:14, fontWeight:700, color:c }}>{l}</span>
    </div>
  )
}

// ─── DepositCard ──────────────────────────────────────────────────────────────

function QRCode({ value, size = 160 }) {
  if (!value) return null
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&margin=10&color=0F172A&bgcolor=ffffff`
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <div style={{ background:'#fff', border:'1.5px solid #E2E8F0', borderRadius:12, padding:10, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
        <img src={url} alt="QR Code" width={size} height={size} style={{ display:'block', borderRadius:4 }} />
      </div>
      <p style={{ fontSize:11, color:'#94A3B8', fontWeight:600 }}>Scan to get address</p>
    </div>
  )
}

function DepositCard({ address, coin, amount, timer, status, onDone, type, swapId, estimate, toCoin }) {
  const done = status === 'completed' || status === 'finished'
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <StatusDot status={status} />

      {!done && (
        <>
          {/* Amount pill */}
          <div style={{ background:'linear-gradient(135deg,#EEF2FF,#F5F3FF)', border:'1.5px solid #C7D2FE', borderRadius:12, padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <p style={{ fontSize:11, color:'#94A3B8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>Send exactly</p>
              <p style={{ fontSize:22, fontWeight:800, color:'#0F172A', lineHeight:1 }}>
                {amount ? `${amount} ` : ''}<span style={{ color:'#4F46E5' }}>{coin}</span>
              </p>
            </div>
            {estimate && toCoin && (
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:11, color:'#94A3B8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>You receive</p>
                <p style={{ fontSize:18, fontWeight:800, color:'#10B981' }}>≈ {estimate} {toCoin}</p>
              </div>
            )}
          </div>

          {/* QR + address row */}
          <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
            <QRCode value={address} size={130} />
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:11, color:'#94A3B8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
                {type === 'swap' ? 'ChangeNow deposit address' : 'Your deposit address'}
              </p>
              <div style={{ background:'#F8FAFC', border:'1.5px solid #E2E8F0', borderRadius:10, padding:'10px 12px', marginBottom:10 }}>
                <span style={{ fontFamily:'monospace', fontSize:11, color:'#475569', wordBreak:'break-all', lineHeight:1.6, display:'block' }}>{address}</span>
              </div>
              <CopyButton text={address} />

              {swapId && (
                <div style={{ marginTop:10 }}>
                  <p style={{ fontSize:11, color:'#94A3B8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Swap ID</p>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontFamily:'monospace', fontSize:11, color:'#64748B' }}>{swapId}</span>
                    <CopyButton text={swapId} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Warning */}
          <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10, padding:'10px 14px', display:'flex', gap:8, alignItems:'flex-start' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:1 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <p style={{ fontSize:12, color:'#92400E', lineHeight:1.5 }}>
              Send <strong>only {coin}</strong> to this address. Sending the wrong coin will result in permanent loss.
            </p>
          </div>

          {/* Timer */}
          {timer > 0 && (
            <div style={{ textAlign:'center', background: timer < 300 ? '#FEF2F2' : '#F8FAFC', borderRadius:10, padding:'10px 0', border:`1px solid ${timer < 300 ? '#FECACA' : '#E2E8F0'}` }}>
              <span style={{ fontSize:13, color:'#64748B' }}>Expires in </span>
              <span style={{ fontWeight:800, color: timer < 300 ? '#EF4444' : '#4F46E5', fontSize:15 }}>{fmtTimer(timer)}</span>
            </div>
          )}
        </>
      )}

      {done && (
        <div style={{ textAlign:'center', padding:'12px 0' }}>
          <div style={{ width:60, height:60, borderRadius:'50%', background:'#D1FAE5', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h3 style={{ fontWeight:800, fontSize:22, color:'#10B981' }}>{type === 'swap' ? 'Swap Complete' : 'Naira Sent'}</h3>
          <p style={{ color:'#64748B', marginTop:8, fontSize:14, lineHeight:1.6 }}>
            {type === 'swap' ? 'Your crypto has been swapped and sent.' : 'Check your bank — the money is on its way.'}
          </p>
          <div style={{ marginTop:18, padding:'14px 16px', background:'#EEF2FF', borderRadius:12, border:'1px solid #C7D2FE' }}>
            <p style={{ fontSize:13, color:'#4F46E5', fontWeight:700 }}>Get faster conversions on the app</p>
            <p style={{ fontSize:13, color:'#64748B', marginTop:3 }}>Saved bank details, auto-processing and higher limits.</p>
          </div>
          <button onClick={onDone} style={{ marginTop:14, background:'none', border:'none', color:'#4F46E5', fontWeight:700, cursor:'pointer', fontSize:14 }}>Convert again</button>
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
    fetch('/api/rates').then(r => r.json()).then(d => setRate(d[coin]?.priceNGN || null)).catch(() => {})
  }, [coin])

  useEffect(() => {
    if (step !== 'pending') return
    const t = setInterval(() => setTimer(s => s > 0 ? s - 1 : 0), 1000)
    return () => clearInterval(t)
  }, [step])

  const startPoll = useCallback(id => {
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
    if (!amount || Number(amount) <= 0) return setError('Enter a valid amount')
    if (accNum.length < 10) return setError('Enter a valid 10-digit account number')
    if (!accName.trim()) return setError('Enter account name')
    setLoading(true)
    try {
      const bankObj = BANKS.find(b => b.code === bank)
      const r = await fetch('/api/guest/create', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          coin, chain:(coin==='USDT'||coin==='USDC') ? chain : undefined,
          amount:Number(amount), bankCode:bank, bankName:bankObj?.name||bank,
          accountNumber:accNum, accountName:accName,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed')
      setDeposit(d); setStep('pending'); startPoll(d.guestId)
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const isStable = coin === 'USDT' || coin === 'USDC'
  const nairaVal = amount && rate ? Number(amount) * rate : null

  if (step !== 'form') return (
    <DepositCard address={deposit?.depositAddress} coin={coin+(isStable?` (${chain})`:'')}
      amount={deposit?.expectedAmount} timer={timer} status={status} type="offramp"
      onDone={() => { setStep('form'); setStatus('waiting'); setTimer(1800); setDeposit(null); setAmount('') }} />
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div>
        <label style={labelStyle}>You Send</label>
        <div style={{ display:'flex', gap:8 }}>
          <input className="input-field" type="number" placeholder="0.00" value={amount}
            onChange={e => setAmount(e.target.value)} style={{ flex:1, fontWeight:700, fontSize:17 }} />
          <CoinSelect value={coin} onChange={v => { setCoin(v); if (STABLECOIN_CHAINS[v]) setChain(STABLECOIN_CHAINS[v][0]) }} coins={COINS} style={{ width:148 }} />
        </div>
        {isStable && (
          <select className="input-field" value={chain} onChange={e => setChain(e.target.value)} style={{ marginTop:8, appearance:'none', fontSize:13 }}>
            {STABLECOIN_CHAINS[coin].map(c => <option key={c} value={c}>{coin} on {c}</option>)}
          </select>
        )}
        {nairaVal && (
          <div style={{ marginTop:7, display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#10B981', flexShrink:0 }} />
            <span style={{ fontSize:13, color:'#10B981', fontWeight:700 }}>≈ {fmtNaira(nairaVal)}</span>
            <span style={{ fontSize:12, color:'#94A3B8' }}>· Rate: {fmtNaira(rate)}/{coin}</span>
          </div>
        )}
      </div>

      <div style={{ borderTop:'1px solid #F1F5F9', paddingTop:14 }}>
        <label style={labelStyle}>Receive Naira To</label>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <select className="input-field" value={bank} onChange={e => setBank(e.target.value)} style={{ appearance:'none', fontSize:13 }}>
            {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
          </select>
          <input className="input-field" placeholder="Account number (10 digits)" value={accNum}
            onChange={e => setAccNum(e.target.value.replace(/\D/g,'').slice(0,10))} maxLength={10} style={{ fontSize:13 }} />
          <input className="input-field" placeholder="Account name" value={accName}
            onChange={e => setAccName(e.target.value)} style={{ fontSize:13 }} />
        </div>
      </div>

      {error && <p style={{ color:'#EF4444', fontSize:13, fontWeight:600, background:'#FEF2F2', padding:'9px 13px', borderRadius:9, border:'1px solid #FECACA' }}>{error}</p>}

      <button className="btn-primary" onClick={onSubmit} disabled={loading}>
        {loading ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><IcSpin/> Getting address...</span> : 'Convert to Naira'}
      </button>
      <p style={{ fontSize:12, color:'#94A3B8', textAlign:'center' }}>Live CoinGecko rates · No account needed</p>
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
  const debRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    fetch(`/api/changenow/min?from=${fromCoin.toLowerCase()}&to=${toCoin.toLowerCase()}`)
      .then(r => r.json()).then(d => setMinAmount(d.minAmount)).catch(() => {})
  }, [fromCoin, toCoin])

  useEffect(() => {
    clearTimeout(debRef.current)
    if (!amount || Number(amount) <= 0) { setEstimate(null); return }
    setEstimating(true)
    debRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/changenow/estimate?from=${fromCoin.toLowerCase()}&to=${toCoin.toLowerCase()}&amount=${amount}`)
        const d = await r.json()
        setEstimate(d.estimatedAmount || d.toAmount || null)
      } catch {}
      finally { setEstimating(false) }
    }, 600)
  }, [amount, fromCoin, toCoin])

  const startPoll = useCallback(id => {
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
    if (!amount || Number(amount) <= 0) return setError('Enter an amount')
    if (!destAddr.trim()) return setError(`Enter your ${toCoin} destination address`)
    if (minAmount && Number(amount) < minAmount) return setError(`Minimum is ${minAmount} ${fromCoin}`)
    setLoading(true)
    try {
      const body = { from:fromCoin.toLowerCase(), to:toCoin.toLowerCase(), amount:Number(amount), address:destAddr.trim() }
      if (refundAddr.trim()) body.refundAddress = refundAddr.trim()
      const r = await fetch('/api/changenow/create', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(body) })
      const d = await r.json()
      if (!r.ok || d.error) throw new Error(d.error || d.message || 'Swap failed')
      setSwapData(d); setStep('pending'); startPoll(d.id)
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const flip = () => { const f=fromCoin; setFromCoin(toCoin); setToCoin(f); setEstimate(null); setAmount('') }

  if (step === 'pending') return (
    <DepositCard address={swapData?.payinAddress} coin={fromCoin} amount={swapData?.payinAmount||amount}
      timer={0} status={swapStatus} type="swap" swapId={swapData?.id}
      estimate={estimate} toCoin={toCoin}
      onDone={() => { setStep('form'); setSwapStatus('waiting_for_deposit'); setSwapData(null); setAmount(''); setDestAddr('') }} />
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
      <div>
        <label style={labelStyle}>You Send</label>
        <div style={{ display:'flex', gap:8 }}>
          <input className="input-field" type="number" placeholder="0.00" value={amount}
            onChange={e => setAmount(e.target.value)} style={{ flex:1, fontWeight:700, fontSize:17 }} />
          <CoinSelect value={fromCoin} onChange={v => { setFromCoin(v); setEstimate(null) }} coins={SWAP_COINS} style={{ width:148 }} />
        </div>
        {minAmount && <p style={{ fontSize:12, color:'#94A3B8', marginTop:5 }}>Min: {minAmount} {fromCoin}</p>}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ flex:1, height:1, background:'#F1F5F9' }} />
        <button onClick={flip} style={{ width:34, height:34, borderRadius:'50%', border:'1.5px solid #E2E8F0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#4F46E5', transition:'all 0.25s', flexShrink:0 }}
          onMouseEnter={e => { e.currentTarget.style.transform='rotate(180deg)'; e.currentTarget.style.borderColor='#4F46E5' }}
          onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.borderColor='#E2E8F0' }}>
          <IcSwap />
        </button>
        <div style={{ flex:1, height:1, background:'#F1F5F9' }} />
      </div>

      <div>
        <label style={labelStyle}>You Receive</label>
        <div style={{ display:'flex', gap:8 }}>
          <div className="input-field" style={{ flex:1, fontWeight:700, fontSize:17, color:estimate?'#0F172A':'#94A3B8', background:'#F8FAFC', display:'flex', alignItems:'center' }}>
            {estimating ? <span style={{ fontSize:13, color:'#94A3B8', fontWeight:500 }}>Calculating...</span> : estimate ? `≈ ${estimate}` : '—'}
          </div>
          <CoinSelect value={toCoin} onChange={v => { setToCoin(v); setEstimate(null) }} coins={SWAP_COINS.filter(c => c.symbol!==fromCoin)} style={{ width:148 }} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Your {toCoin} Address</label>
        <input className="input-field" placeholder={`Paste your ${toCoin} wallet address`} value={destAddr}
          onChange={e => setDestAddr(e.target.value)} style={{ fontFamily:'monospace', fontSize:12 }} />
      </div>

      <button onClick={() => setShowRefund(v=>!v)}
        style={{ background:'none', border:'none', color:'#94A3B8', fontSize:12, fontWeight:600, cursor:'pointer', textAlign:'left', padding:0 }}>
        {showRefund ? '- Hide' : '+ Add'} refund address (optional)
      </button>

      {showRefund && (
        <div>
          <label style={labelStyle}>Your {fromCoin} Refund Address</label>
          <input className="input-field" placeholder={`Your ${fromCoin} address for refunds`} value={refundAddr}
            onChange={e => setRefundAddr(e.target.value)} style={{ fontFamily:'monospace', fontSize:12 }} />
        </div>
      )}

      {error && <p style={{ color:'#EF4444', fontSize:13, fontWeight:600, background:'#FEF2F2', padding:'9px 13px', borderRadius:9, border:'1px solid #FECACA' }}>{error}</p>}

      <button className="btn-primary" onClick={onSwap} disabled={loading}>
        {loading ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><IcSpin/> Creating swap...</span> : `Swap ${fromCoin} → ${toCoin}`}
      </button>
      <p style={{ fontSize:12, color:'#94A3B8', textAlign:'center' }}>Powered by ChangeNow · Non-custodial</p>
    </div>
  )
}

// ─── Shared label style ───────────────────────────────────────────────────────

const labelStyle = { fontSize:11, color:'#94A3B8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:7 }

// ─── ConversionWidget ─────────────────────────────────────────────────────────

function ConversionWidget() {
  const [tab, setTab] = useState('offramp')
  return (
    <div className="widget-card" style={{ padding:26 }}>
      <div className="tab-bar" style={{ marginBottom:20 }}>
        <button className={`tab-btn ${tab==='offramp'?'active':''}`} onClick={() => setTab('offramp')}>Offramp to Naira</button>
        <button className={`tab-btn ${tab==='swap'?'active':''}`} onClick={() => setTab('swap')}>Crypto Swap</button>
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
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const links = [{ l:'How It Works', h:'#how-it-works' },{ l:'Features', h:'#features' },{ l:'Download', h:'#download' }]

  return (
    <>
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        background: scrolled ? 'rgba(255,255,255,0.94)' : 'transparent',
        backdropFilter: scrolled ? 'blur(18px)' : 'none',
        borderBottom: scrolled ? '1px solid #F1F5F9' : 'none',
        transition:'all 0.3s ease',
      }}>
        <div style={{ maxWidth:1140, margin:'0 auto', padding:'0 24px', height:66, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <a href="/" style={{ display:'flex', alignItems:'center', gap:9, textDecoration:'none' }}>
            <img src="/logo.png" alt="CERA" style={{ height:38, width:'auto', objectFit:'contain' }} />
          </a>

          <div className="nav-links">
            {links.map(({ l, h }) => (
              <a key={l} href={h} style={{ textDecoration:'none', color:'#475569', fontWeight:500, fontSize:15, transition:'color 0.2s' }}
                onMouseEnter={e => e.target.style.color='#4F46E5'} onMouseLeave={e => e.target.style.color='#475569'}>{l}</a>
            ))}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <a href="#download" style={{ textDecoration:'none' }}>
              <button style={{ background:'#4F46E5', color:'#fff', fontWeight:700, fontSize:14, padding:'9px 20px', borderRadius:10, border:'none', cursor:'pointer', transition:'all 0.2s', fontFamily:'Plus Jakarta Sans' }}
                onMouseEnter={e => { e.currentTarget.style.background='#4338CA'; e.currentTarget.style.transform='translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.background='#4F46E5'; e.currentTarget.style.transform='' }}>
                Get the App
              </button>
            </a>
            <button className="hamburger-btn" onClick={() => setOpen(v=>!v)}
              style={{ display:'none', background:'none', border:'none', cursor:'pointer', color:'#475569', padding:4 }}>
              {open ? <IcX /> : <IcMenu />}
            </button>
          </div>
        </div>
      </nav>

      {open && (
        <div style={{ position:'fixed', top:66, left:0, right:0, zIndex:99, background:'rgba(255,255,255,0.97)', backdropFilter:'blur(18px)', borderBottom:'1px solid #F1F5F9', padding:'12px 24px 20px' }}>
          {links.map(({ l, h }) => (
            <a key={l} href={h} onClick={() => setOpen(false)}
              style={{ display:'block', textDecoration:'none', color:'#0F172A', fontWeight:600, fontSize:16, padding:'11px 0', borderBottom:'1px solid #F8FAFC' }}>{l}</a>
          ))}
        </div>
      )}
    </>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section style={{ minHeight:'100vh', paddingTop:66, background:'#fff', display:'flex', alignItems:'center', position:'relative', overflow:'hidden' }}>
      {/* Subtle bg tint */}
      <div style={{ position:'absolute', top:0, right:0, width:'55%', height:'100%', background:'linear-gradient(135deg, rgba(79,70,229,0.04) 0%, rgba(124,58,237,0.03) 100%)', borderRadius:'0 0 0 120px', pointerEvents:'none' }} />

      <div style={{ maxWidth:1140, margin:'0 auto', padding:'60px 24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center', width:'100%', position:'relative', zIndex:1 }} className="hero-grid">
        {/* Left */}
        <div style={{ animation:'fadeInLeft 0.65s ease forwards' }}>
          {/* Headline */}
          <h1 style={{ fontWeight:800, fontSize:'clamp(44px,5.8vw,76px)', lineHeight:1.05, color:'#0F172A', letterSpacing:'-0.03em', marginBottom:20 }}>
            Convert Crypto<br />
            to Naira{' '}
            <span className="mark" style={{ color:'#4F46E5' }}>Instantly.</span>
          </h1>

          <p style={{ fontSize:'clamp(15px,1.7vw,18px)', color:'#64748B', lineHeight:1.8, marginBottom:36, maxWidth:440, fontWeight:400 }}>
            Send any crypto and receive Naira in your Nigerian bank account within seconds. No account needed, no forms.
          </p>

          {/* CTAs */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <a href="#widget" style={{ textDecoration:'none' }}>
              <button style={{ background:'#4F46E5', color:'#fff', fontWeight:700, fontSize:'0.97rem', padding:'14px 30px', borderRadius:12, border:'none', cursor:'pointer', boxShadow:'0 4px 20px rgba(79,70,229,0.32)', transition:'all 0.22s', fontFamily:'Plus Jakarta Sans', whiteSpace:'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.background='#4338CA'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(79,70,229,0.42)' }}
                onMouseLeave={e => { e.currentTarget.style.background='#4F46E5'; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 20px rgba(79,70,229,0.32)' }}>
                Convert Now
              </button>
            </a>
            <a href="#download" style={{ textDecoration:'none' }}>
              <button className="btn-outline">Download App</button>
            </a>
          </div>
        </div>

        {/* Right — phone */}
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', animation:'fadeInRight 0.65s ease 0.15s both' }}>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', inset:'-32px', background:'radial-gradient(ellipse, rgba(79,70,229,0.12) 0%, transparent 70%)', borderRadius:'50%', zIndex:0 }} />
            <img src="/phone.png" alt="CERA App" className="animate-float"
              style={{ width:'100%', maxWidth:290, position:'relative', zIndex:1, display:'block' }} />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────

function Features() {
  const items = [
    { Icon:IcZap,   color:'#F97316', bg:'#FFF7ED', title:'Detected in Seconds',   desc:'Real-time WebSocket watchers catch your payment the moment it confirms on-chain. No 5-minute waits.' },
    { Icon:IcChart, color:'#10B981', bg:'#F0FDF4', title:'Live Market Rates',     desc:'Rates pulled from CoinGecko every 2 minutes so you always get the real price — never a stale, padded rate.' },
    { Icon:IcShield,color:'#4F46E5', bg:'#EEF2FF', title:'Zero Signup Needed',   desc:'Use the web converter with just your bank details. No account, no password, no KYC for quick conversions.' },
    { Icon:IcPhone, color:'#7C3AED', bg:'#F5F3FF', title:'Powerful Mobile App',  desc:'Save bank details, track history, set up auto-processing and unlock higher limits on the app.' },
    { Icon:IcZap,   color:'#0EA5E9', bg:'#F0F9FF', title:'8 Coins, 12+ Chains', desc:'BTC, ETH, SOL, BNB, TRX, USDT (5 chains), USDC (4 chains) and more. We cover every major asset.' },
    { Icon:IcChart, color:'#F43F5E', bg:'#FFF1F2', title:'Crypto Swap Too',      desc:'Swap any crypto for another via ChangeNow — no wallet creation, no signup, best rate guaranteed.' },
  ]
  return (
    <section id="features" style={{ padding:'96px 24px', background:'#FAFBFF' }}>
      <div style={{ maxWidth:1140, margin:'0 auto' }}>
        <div style={{ marginBottom:56 }} className="reveal">
          <span className="section-label">Why CERA</span>
          <h2 style={{ fontWeight:800, fontSize:'clamp(28px,4vw,46px)', color:'#0F172A', marginTop:10, letterSpacing:'-0.02em' }}>
            Everything you need to{' '}
            <span className="mark mark-purple">convert fast.</span>
          </h2>
          <p style={{ color:'#64748B', marginTop:12, fontSize:16, maxWidth:500, lineHeight:1.7 }}>
            Built specifically for Nigerian crypto holders who want speed, simplicity, and real rates.
          </p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16 }}>
          {items.map((f, i) => (
            <div key={f.title} className={`feat-card reveal delay-${(i%4)+1}`}>
              <div style={{ width:46, height:46, borderRadius:12, background:f.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18, color:f.color }}>
                <f.Icon />
              </div>
              <h3 style={{ fontWeight:700, fontSize:17, color:'#0F172A', marginBottom:8 }}>{f.title}</h3>
              <p style={{ color:'#64748B', fontSize:14, lineHeight:1.75 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Widget Section ───────────────────────────────────────────────────────────

function WidgetSection() {
  return (
    <section id="widget" style={{ padding:'96px 24px', background:'#fff', borderTop:'1px solid #F1F5F9' }}>
      <div style={{ maxWidth:1140, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:72, alignItems:'center' }} className="hero-grid">
        <div className="reveal">
          <span className="section-label">Quick Convert</span>
          <h2 style={{ fontWeight:800, fontSize:'clamp(28px,3.8vw,44px)', color:'#0F172A', marginTop:10, letterSpacing:'-0.02em', lineHeight:1.15 }}>
            Try it now.{' '}<span className="mark">No signup.</span>
          </h2>
          <p style={{ color:'#64748B', marginTop:14, fontSize:15, lineHeight:1.8, maxWidth:400 }}>
            Offramp any crypto to Naira or swap coin-to-coin in seconds. Just enter the amount and your bank — that is it.
          </p>

          {/* Lightning callout */}
          <div style={{ marginTop:28, display:'flex', flexDirection:'column', gap:12 }}>
            {[
              { Icon:IcZap,    c:'#F97316', bg:'#FFF7ED', t:'Under 3 seconds', d:'Payment detection via live blockchain watchers' },
              { Icon:IcShield, c:'#4F46E5', bg:'#EEF2FF', t:'Non-custodial',   d:'We never hold your funds — direct to your bank' },
              { Icon:IcChart,  c:'#10B981', bg:'#F0FDF4', t:'Real-time rates', d:'CoinGecko price updated every 2 minutes' },
            ].map(({ Icon, c, bg, t, d }) => (
              <div key={t} style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:c }}>
                  <Icon />
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:'#0F172A' }}>{t}</div>
                  <div style={{ fontSize:13, color:'#94A3B8', marginTop:2 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="reveal delay-2">
          <ConversionWidget />
        </div>
      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { n:'1', title:'Enter your details', desc:'Choose your coin, enter the amount, and provide your Nigerian bank account details. All major banks and mobile wallets supported.' },
    { n:'2', title:'Send the crypto',    desc:'Send the exact amount to the deposit address shown. BTC, ETH, SOL, BNB, TRX, USDT, USDC — we cover all the big ones.' },
    { n:'3', title:'Naira lands fast',   desc:'Our watchers detect your payment within seconds and immediately trigger a Naira transfer to your bank account.' },
  ]
  return (
    <section id="how-it-works" style={{ padding:'96px 24px', background:'#FAFBFF', borderTop:'1px solid #F1F5F9' }}>
      <div style={{ maxWidth:1140, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }} className="reveal">
          <span className="section-label">How It Works</span>
          <h2 style={{ fontWeight:800, fontSize:'clamp(28px,4vw,46px)', color:'#0F172A', marginTop:10, letterSpacing:'-0.02em' }}>Three steps to Naira</h2>
          <p style={{ color:'#64748B', marginTop:10, fontSize:16 }}>No account, no verification — just send and receive.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20 }}>
          {steps.map((s, i) => (
            <div key={s.n} className={`step-card reveal delay-${i+1}`}>
              <div style={{ width:44, height:44, borderRadius:12, background:'#4F46E5', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
                <span style={{ fontWeight:800, fontSize:18, color:'#fff' }}>{s.n}</span>
              </div>
              <h3 style={{ fontWeight:700, fontSize:18, color:'#0F172A', marginBottom:10 }}>{s.title}</h3>
              <p style={{ color:'#64748B', fontSize:14, lineHeight:1.75 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Coin Ticker ──────────────────────────────────────────────────────────────

function CoinTicker() {
  const all = [...COINS, { symbol:'MATIC', name:'Polygon', icon:'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/matic.svg' }]
  const double = [...all, ...all]
  return (
    <section style={{ padding:'64px 0', background:'#fff', borderTop:'1px solid #F1F5F9', overflow:'hidden' }}>
      <div style={{ textAlign:'center', marginBottom:36, padding:'0 24px' }} className="reveal">
        <span className="section-label">Supported Assets</span>
        <h2 style={{ fontWeight:800, fontSize:'clamp(24px,3.5vw,38px)', color:'#0F172A', marginTop:10, letterSpacing:'-0.02em' }}>8 coins. 12+ chains.</h2>
      </div>
      <div className="ticker-wrap">
        <div className="ticker-inner animate-marquee">
          {double.map((c, i) => (
            <div key={i} style={{ display:'inline-flex', alignItems:'center', gap:8, margin:'0 10px', background:'#fff', border:'1.5px solid #E2E8F0', borderRadius:999, padding:'8px 18px' }}>
              <img src={c.icon} alt={c.symbol} style={{ width:22, height:22 }} />
              <span style={{ fontWeight:700, color:'#0F172A', fontSize:14 }}>{c.symbol}</span>
              <span style={{ color:'#94A3B8', fontSize:12 }}>{c.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Ads / Social Proof ──────────────────────────────────────────────────────

function AdsSection() {
  return (
    <section style={{ padding:'80px 24px', background:'#FAFBFF', borderTop:'1px solid #F1F5F9' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div className="reveal" style={{ position:'relative', borderRadius:24, overflow:'hidden', boxShadow:'0 24px 70px rgba(79,70,229,0.13)' }}>
          <img
            src="/ads.png"
            alt="People using CERA"
            style={{ width:'100%', height:'auto', display:'block' }}
          />
          {/* Floating badge — Naira in seconds */}
          <div style={{ position:'absolute', bottom:24, left:24, background:'rgba(255,255,255,0.97)', backdropFilter:'blur(16px)', borderRadius:16, padding:'14px 18px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 8px 32px rgba(0,0,0,0.14)' }}>
            <div style={{ width:40, height:40, borderRadius:12, background:'#D1FAE5', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#10B981' }}>
              <IcZap />
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:15, color:'#0F172A', lineHeight:1 }}>Naira in seconds</div>
              <div style={{ fontSize:12, color:'#64748B', marginTop:4 }}>Instant bank transfer · No delays</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Download ─────────────────────────────────────────────────────────────────

function Download() {
  return (
    <section id="download" style={{ padding:'96px 24px', background:'#fff', borderTop:'1px solid #F1F5F9' }}>
      <div style={{ maxWidth:1000, margin:'0 auto' }}>
        <div className="reveal" style={{ background:'#4F46E5', borderRadius:24, padding:'56px 52px', display:'grid', gridTemplateColumns:'1fr auto', gap:48, alignItems:'center', position:'relative', overflow:'hidden' }} id="download-inner">
          <div style={{ position:'absolute', top:-60, right:240, width:250, height:250, background:'rgba(255,255,255,0.06)', borderRadius:'50%', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-40, left:-20, width:180, height:180, background:'rgba(249,115,22,0.12)', borderRadius:'50%', pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <span style={{ fontSize:'0.75rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.55)' }}>Mobile App</span>
            <h2 style={{ fontWeight:800, fontSize:'clamp(28px,3.8vw,46px)', color:'#fff', lineHeight:1.1, marginTop:12, marginBottom:16, letterSpacing:'-0.02em' }}>
              The full CERA<br/>experience
            </h2>
            <p style={{ color:'rgba(255,255,255,0.72)', lineHeight:1.75, marginBottom:32, fontSize:15, maxWidth:420 }}>
              Saved bank details, transaction history, auto-processing and higher daily limits. Convert on autopilot.
            </p>
            <div style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'center' }}>
              <a href="#" style={{ display:'inline-block', textDecoration:'none', transition:'transform 0.2s,opacity 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.opacity='0.92' }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.opacity='1' }}>
                <img
                  src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83"
                  alt="Download on the App Store"
                  style={{ height:50, display:'block', borderRadius:8 }}
                />
              </a>
              <a href="#" style={{ display:'inline-block', textDecoration:'none', transition:'transform 0.2s,opacity 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.opacity='0.92' }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.opacity='1' }}>
                <img
                  src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                  alt="Get it on Google Play"
                  style={{ height:72, display:'block', marginTop:-10, marginBottom:-10 }}
                />
              </a>
            </div>
          </div>
          <div className="download-phone" style={{ position:'relative', zIndex:1 }}>
            <img src="/phone.png" alt="CERA App" style={{ width:210, display:'block' }} />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ background:'#0F172A', padding:'52px 24px 36px' }}>
      <div style={{ maxWidth:1140, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:32, marginBottom:40 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <div style={{ width:30, height:30, borderRadius:8, background:'#4F46E5', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <span style={{ fontWeight:800, fontSize:18, color:'#fff', letterSpacing:'-0.02em' }}>CERA</span>
            </div>
            <p style={{ color:'rgba(255,255,255,0.35)', fontSize:13, maxWidth:240, lineHeight:1.7 }}>
              Convert crypto to Naira instantly. Built for Nigerians.
            </p>
          </div>
          <div style={{ display:'flex', gap:40, flexWrap:'wrap' }}>
            <div>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12 }}>Company</p>
              {['Privacy Policy','Terms of Use','Support'].map(l => (
                <a key={l} href="#" style={{ display:'block', color:'rgba(255,255,255,0.4)', fontSize:14, textDecoration:'none', marginBottom:8, transition:'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color='rgba(255,255,255,0.85)'} onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.4)'}>{l}</a>
              ))}
            </div>
            <div>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12 }}>Contact</p>
              <a href="mailto:support@ceraapp.co" style={{ color:'rgba(255,255,255,0.4)', fontSize:14, textDecoration:'none' }}>support@ceraapp.co</a>
              <p style={{ color:'rgba(255,255,255,0.3)', fontSize:13, marginTop:8 }}>Lagos, Nigeria</p>
            </div>
          </div>
        </div>
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:24 }}>
          <p style={{ color:'rgba(255,255,255,0.25)', fontSize:13 }}>© 2025 CERA · All rights reserved</p>
        </div>
      </div>
    </footer>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function Home() {
  useReveal()
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <WidgetSection />
      <HowItWorks />
      <AdsSection />
      <CoinTicker />
      <Download />
      <Footer />
    </>
  )
}
