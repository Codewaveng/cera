import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Data ───────────────────────────────────────────────────────────────────

const COINS = [
  { symbol: 'BTC',  name: 'Bitcoin',   icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/btc.svg' },
  { symbol: 'ETH',  name: 'Ethereum',  icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/eth.svg' },
  { symbol: 'BNB',  name: 'BNB',       icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/bnb.svg' },
  { symbol: 'SOL',  name: 'Solana',    icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/sol.svg' },
  { symbol: 'TRX',  name: 'TRON',      icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/trx.svg' },
  { symbol: 'USDT', name: 'Tether',    icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/usdt.svg' },
  { symbol: 'USDC', name: 'USD Coin',  icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/usdc.svg' },
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

const STATUS_ORDER = ['waiting', 'detected', 'processing', 'completed']
const SWAP_STATUS_ORDER = ['waiting_for_deposit', 'confirming', 'exchanging', 'sending', 'finished']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNaira(amount) {
  if (!amount || isNaN(amount)) return '₦0'
  return '₦' + Number(amount).toLocaleString('en-NG', { maximumFractionDigits: 2 })
}

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function IconCopy() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function IconArrowDown() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <polyline points="19 12 12 19 5 12"/>
    </svg>
  )
}

function IconRefresh() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
    </svg>
  )
}

// ─── CopyButton ──────────────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={copy}
      style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 8, padding: '6px 10px', color: copied ? '#10B981' : '#7C3AED', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, transition: 'all 0.2s' }}
    >
      {copied ? <IconCheck /> : <IconCopy />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// ─── CoinSelect ──────────────────────────────────────────────────────────────

function CoinSelect({ value, onChange, coins }) {
  return (
    <div style={{ position: 'relative', minWidth: 130 }}>
      <select
        className="input-field"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ paddingLeft: '2.5rem', appearance: 'none', cursor: 'pointer' }}
      >
        {coins.map(c => (
          <option key={c.symbol} value={c.symbol}>{c.symbol} — {c.name}</option>
        ))}
      </select>
      <img
        src={coins.find(c => c.symbol === value)?.icon}
        alt=""
        style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, pointerEvents: 'none' }}
      />
    </div>
  )
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    waiting:            { label: 'Waiting',     bg: 'rgba(251,191,36,0.15)',  color: '#FBBf24' },
    detected:           { label: 'Detected',    bg: 'rgba(59,130,246,0.15)', color: '#3B82F6' },
    processing:         { label: 'Processing',  bg: 'rgba(139,92,246,0.15)', color: '#8B5CF6' },
    completed:          { label: 'Completed',   bg: 'rgba(16,185,129,0.15)', color: '#10B981' },
    waiting_for_deposit:{ label: 'Awaiting',    bg: 'rgba(251,191,36,0.15)', color: '#FBBf24' },
    confirming:         { label: 'Confirming',  bg: 'rgba(59,130,246,0.15)', color: '#3B82F6' },
    exchanging:         { label: 'Exchanging',  bg: 'rgba(139,92,246,0.15)', color: '#8B5CF6' },
    sending:            { label: 'Sending',     bg: 'rgba(16,185,129,0.1)',  color: '#10B981' },
    finished:           { label: 'Finished',    bg: 'rgba(16,185,129,0.15)', color: '#10B981' },
    failed:             { label: 'Failed',      bg: 'rgba(239,68,68,0.15)',  color: '#EF4444' },
    expired:            { label: 'Expired',     bg: 'rgba(107,114,128,0.2)', color: '#6B7280' },
  }
  const s = map[status] || { label: status, bg: 'rgba(255,255,255,0.05)', color: '#6B7280' }
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600, letterSpacing: 0.3, display: 'inline-block' }}>
      {s.label}
    </span>
  )
}

// ─── StepIndicator ───────────────────────────────────────────────────────────

function StepIndicator({ steps, current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
      {steps.map((step, i) => {
        const idx = steps.indexOf(current)
        const done = i < idx
        const active = step === current
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: done ? '#10B981' : active ? 'linear-gradient(135deg,#7C3AED,#3B82F6)' : 'rgba(255,255,255,0.07)',
                border: active ? 'none' : done ? 'none' : '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: done || active ? '#fff' : '#6B7280',
                transition: 'all 0.3s',
              }}>
                {done ? <IconCheck /> : i + 1}
              </div>
              <span style={{ fontSize: 10, color: active ? '#F9FAFB' : '#4B5563', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                {step.replace(/_/g, ' ')}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ height: 1, flex: 1, background: i < steps.indexOf(current) ? '#10B981' : 'rgba(255,255,255,0.07)', transition: 'background 0.3s', marginBottom: 18 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── OfframpWidget ───────────────────────────────────────────────────────────

function OfframpWidget() {
  const [phase, setPhase] = useState('form') // 'form' | 'pending' | 'done'
  const [amount, setAmount] = useState('')
  const [coin, setCoin] = useState('USDT')
  const [chain, setChain] = useState('TRON')
  const [bank, setBank] = useState(BANKS[0].code)
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [nairaValue, setNairaValue] = useState(null)
  const [rateLoading, setRateLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [txn, setTxn] = useState(null)
  const [timer, setTimer] = useState(30 * 60)
  const rateTimer = useRef(null)

  const isStable = coin === 'USDT' || coin === 'USDC'
  const chains = STABLECOIN_CHAINS[coin] || []

  // When coin changes, reset chain
  useEffect(() => {
    if (isStable) {
      setChain(STABLECOIN_CHAINS[coin][0])
    }
  }, [coin])

  // Fetch rate
  const fetchRate = useCallback(async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setNairaValue(null)
      return
    }
    setRateLoading(true)
    try {
      const res = await fetch('/api/rates')
      if (!res.ok) throw new Error('Rate fetch failed')
      const data = await res.json()
      const key = coin.toLowerCase()
      const rate = data[key] || data[coin]
      if (rate) {
        setNairaValue(Number(amount) * Number(rate))
      } else {
        setNairaValue(null)
      }
    } catch {
      setNairaValue(null)
    } finally {
      setRateLoading(false)
    }
  }, [amount, coin])

  useEffect(() => {
    clearTimeout(rateTimer.current)
    rateTimer.current = setTimeout(fetchRate, 600)
    return () => clearTimeout(rateTimer.current)
  }, [fetchRate])

  // Poll txn status in pending phase
  useEffect(() => {
    if (phase !== 'pending' || !txn?._id) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/guest/${txn._id}`)
        if (!res.ok) return
        const data = await res.json()
        setTxn(prev => ({ ...prev, ...data }))
        if (data.status === 'completed') {
          setPhase('done')
          clearInterval(interval)
        }
      } catch {}
    }, 4000)
    return () => clearInterval(interval)
  }, [phase, txn?._id])

  // Timer countdown
  useEffect(() => {
    if (phase !== 'pending') return
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(interval); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  const handleSubmit = async () => {
    setError('')
    if (!amount || Number(amount) <= 0) return setError('Enter a valid amount')
    if (!accountNumber || accountNumber.length < 10) return setError('Enter a valid 10-digit account number')
    if (!accountName.trim()) return setError('Enter account name')
    setSubmitting(true)
    try {
      const selectedBank = BANKS.find(b => b.code === bank)
      const body = {
        coin,
        chain: isStable ? chain : undefined,
        amount: Number(amount),
        bankCode: bank,
        bankName: selectedBank?.name,
        accountNumber,
        accountName,
      }
      const res = await fetch('/api/guest/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Submission failed')
      setTxn(data)
      setTimer(30 * 60)
      setPhase('pending')
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (phase === 'done') {
    return (
      <div style={{ padding: '32px 28px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#10B981' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 22, fontFamily: 'Space Grotesk' }}>Naira Sent</h3>
        <p style={{ color: '#6B7280', margin: '0 0 24px', fontSize: 15 }}>
          {formatNaira(txn?.amountNGN)} has been sent to your bank account.
        </p>
        <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 24, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#6B7280', fontSize: 13 }}>Bank</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{txn?.bankName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6B7280', fontSize: 13 }}>Account</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{txn?.accountNumber}</span>
          </div>
        </div>
        <button className="btn-primary" onClick={() => { setPhase('form'); setTxn(null); setAmount(''); setNairaValue(null) }}>
          New Conversion
        </button>
      </div>
    )
  }

  if (phase === 'pending') {
    const statusIdx = STATUS_ORDER.indexOf(txn?.status || 'waiting')
    return (
      <div style={{ padding: '28px 24px' }}>
        <StepIndicator steps={STATUS_ORDER} current={txn?.status || 'waiting'} />

        <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 14, padding: '20px', marginBottom: 20, textAlign: 'center' }}>
          <p style={{ color: '#6B7280', fontSize: 12, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 1 }}>Send Exactly</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <img src={COINS.find(c => c.symbol === coin)?.icon} alt="" style={{ width: 28, height: 28 }} />
            <span style={{ fontSize: 32, fontWeight: 700, fontFamily: 'Space Grotesk' }}>
              {txn?.expectedAmount || amount} <span style={{ color: '#7C3AED' }}>{coin}</span>
            </span>
          </div>
          {isStable && (
            <p style={{ color: '#6B7280', fontSize: 13, marginTop: 6 }}>on {txn?.chain || chain} network</p>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <p style={{ color: '#6B7280', fontSize: 12, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 1 }}>Deposit Address</p>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#F9FAFB', wordBreak: 'break-all', lineHeight: 1.5 }}>
              {txn?.depositAddress || 'Loading address...'}
            </span>
            {txn?.depositAddress && <CopyButton text={txn.depositAddress} />}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <p style={{ color: '#6B7280', fontSize: 12, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 1 }}>Status</p>
            <StatusBadge status={txn?.status || 'waiting'} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#6B7280', fontSize: 12, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 1 }}>Expires In</p>
            <span style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: timer < 300 ? '#EF4444' : '#F9FAFB' }}>
              {formatTimer(timer)}
            </span>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#6B7280', fontSize: 13 }}>Receiving Bank</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{txn?.bankName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#6B7280', fontSize: 13 }}>Account Number</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{txn?.accountNumber}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6B7280', fontSize: 13 }}>Account Name</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{txn?.accountName}</span>
          </div>
        </div>

        <p style={{ color: '#4B5563', fontSize: 12, textAlign: 'center', margin: 0 }}>
          Do not close this tab. Checking every 4 seconds for your transfer.
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      <p style={{ color: '#6B7280', fontSize: 12, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>You Send</p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
        <input
          type="number"
          className="input-field"
          placeholder="0.00"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          style={{ flex: 1, fontSize: 20, fontWeight: 600 }}
          min="0"
        />
        <CoinSelect value={coin} onChange={setCoin} coins={COINS} />
      </div>

      {isStable && (
        <div style={{ marginBottom: 10 }}>
          <select className="input-field" value={chain} onChange={e => setChain(e.target.value)}>
            {chains.map(c => <option key={c} value={c}>{c} network</option>)}
          </select>
        </div>
      )}

      <div style={{ minHeight: 28, marginBottom: 16 }}>
        {rateLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: 14 }}>
            <IconRefresh /> <span>Fetching rate...</span>
          </div>
        ) : nairaValue ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Space Grotesk', color: '#F9FAFB' }}>
              {formatNaira(nairaValue)}
            </span>
            <span style={{ color: '#6B7280', fontSize: 13 }}>estimated</span>
          </div>
        ) : amount ? (
          <span style={{ color: '#4B5563', fontSize: 13 }}>Could not fetch rate</span>
        ) : null}
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 0 20px' }} />

      <p style={{ color: '#6B7280', fontSize: 12, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Your Bank</p>

      <div style={{ marginBottom: 10 }}>
        <select className="input-field" value={bank} onChange={e => setBank(e.target.value)}>
          {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 10 }}>
        <input
          type="text"
          className="input-field"
          placeholder="Account Number (10 digits)"
          value={accountNumber}
          onChange={e => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
          inputMode="numeric"
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          className="input-field"
          placeholder="Account Name"
          value={accountName}
          onChange={e => setAccountName(e.target.value)}
        />
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: '#EF4444', fontSize: 14 }}>
          {error}
        </div>
      )}

      <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Processing...' : 'Convert Now'}
      </button>

      <p style={{ textAlign: 'center', color: '#4B5563', fontSize: 12, marginTop: 12 }}>
        Live rates · Powered by CoinGecko
      </p>
    </div>
  )
}

// ─── SwapWidget ──────────────────────────────────────────────────────────────

function SwapWidget() {
  const [fromCoin, setFromCoin] = useState('BTC')
  const [toCoin, setToCoin] = useState('ETH')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [destAddress, setDestAddress] = useState('')
  const [estimating, setEstimating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [swapTxn, setSwapTxn] = useState(null)
  const [phase, setPhase] = useState('form') // 'form' | 'pending'
  const debounceRef = useRef(null)

  const fetchEstimate = useCallback(async (val, from, to) => {
    if (!val || isNaN(val) || Number(val) <= 0) { setToAmount(''); return }
    setEstimating(true)
    try {
      const res = await fetch(`/api/changenow/estimate?from=${from}&to=${to}&amount=${val}`)
      const data = await res.json()
      if (res.ok) setToAmount(data.estimatedAmount || data.toAmount || '')
      else setToAmount('')
    } catch {
      setToAmount('')
    } finally {
      setEstimating(false)
    }
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchEstimate(fromAmount, fromCoin, toCoin), 500)
    return () => clearTimeout(debounceRef.current)
  }, [fromAmount, fromCoin, toCoin, fetchEstimate])

  // Poll swap status
  useEffect(() => {
    if (phase !== 'pending' || !swapTxn?.id) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/changenow/status/${swapTxn.id}`)
        if (!res.ok) return
        const data = await res.json()
        setSwapTxn(prev => ({ ...prev, ...data }))
        if (data.status === 'finished' || data.status === 'failed') clearInterval(interval)
      } catch {}
    }, 5000)
    return () => clearInterval(interval)
  }, [phase, swapTxn?.id])

  const handleSwap = async () => {
    setError('')
    if (!fromAmount || Number(fromAmount) <= 0) return setError('Enter an amount')
    if (!destAddress.trim()) return setError('Enter destination wallet address')
    if (fromCoin === toCoin) return setError('Select different coins')
    setSubmitting(true)
    try {
      const res = await fetch('/api/changenow/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: fromCoin, to: toCoin, amount: Number(fromAmount), address: destAddress }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Swap failed')
      setSwapTxn(data)
      setPhase('pending')
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (phase === 'pending') {
    return (
      <div style={{ padding: '28px 24px' }}>
        <StepIndicator steps={SWAP_STATUS_ORDER} current={swapTxn?.status || 'waiting_for_deposit'} />

        <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 14, padding: '20px', marginBottom: 20, textAlign: 'center' }}>
          <p style={{ color: '#6B7280', fontSize: 12, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 1 }}>Send Exactly</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <img src={COINS.find(c => c.symbol === fromCoin)?.icon} alt="" style={{ width: 24, height: 24 }} />
            <span style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Space Grotesk' }}>
              {swapTxn?.amountExpectedFrom || fromAmount} <span style={{ color: '#7C3AED' }}>{fromCoin}</span>
            </span>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <p style={{ color: '#6B7280', fontSize: 12, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 1 }}>Deposit Address</p>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all', lineHeight: 1.5 }}>
              {swapTxn?.payinAddress || swapTxn?.depositAddress || 'Loading...'}
            </span>
            {(swapTxn?.payinAddress || swapTxn?.depositAddress) && (
              <CopyButton text={swapTxn.payinAddress || swapTxn.depositAddress} />
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <p style={{ color: '#6B7280', fontSize: 12, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 1 }}>Status</p>
            <StatusBadge status={swapTxn?.status || 'waiting_for_deposit'} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#6B7280', fontSize: 12, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 1 }}>You Receive</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <img src={COINS.find(c => c.symbol === toCoin)?.icon} alt="" style={{ width: 18, height: 18 }} />
              <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk' }}>
                {swapTxn?.amountExpectedTo || toAmount} {toCoin}
              </span>
            </div>
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={() => { setPhase('form'); setSwapTxn(null); setFromAmount(''); setToAmount('') }}
          style={{ background: 'rgba(255,255,255,0.06)', marginTop: 4 }}
        >
          New Swap
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 8 }}>
        <p style={{ color: '#6B7280', fontSize: 12, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>From</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="number"
            className="input-field"
            placeholder="0.00"
            value={fromAmount}
            onChange={e => setFromAmount(e.target.value)}
            style={{ flex: 1, fontSize: 20, fontWeight: 600 }}
            min="0"
          />
          <CoinSelect value={fromCoin} onChange={setFromCoin} coins={COINS} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '14px 0', color: '#6B7280' }}>
        <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ margin: '0 14px', background: 'rgba(255,255,255,0.06)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconArrowDown />
        </div>
        <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.06)' }} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ color: '#6B7280', fontSize: 12, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>To</p>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center' }}>
            {estimating ? (
              <span style={{ color: '#4B5563', fontSize: 16 }}>Estimating...</span>
            ) : (
              <span style={{ fontSize: 20, fontWeight: 600, color: toAmount ? '#F9FAFB' : '#4B5563' }}>
                {toAmount || '0.00'}
              </span>
            )}
          </div>
          <CoinSelect value={toCoin} onChange={setToCoin} coins={COINS} />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <p style={{ color: '#6B7280', fontSize: 12, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Destination Address</p>
        <input
          type="text"
          className="input-field"
          placeholder={`Your ${toCoin} wallet address`}
          value={destAddress}
          onChange={e => setDestAddress(e.target.value)}
        />
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: '#EF4444', fontSize: 14 }}>
          {error}
        </div>
      )}

      <button className="btn-primary" onClick={handleSwap} disabled={submitting}>
        {submitting ? 'Processing...' : 'Swap Now'}
      </button>
    </div>
  )
}

// ─── ConversionWidget (tabs) ─────────────────────────────────────────────────

function ConversionWidget() {
  const [tab, setTab] = useState('offramp')

  return (
    <div className="card" style={{ maxWidth: 480, width: '100%', margin: '0 auto' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 24px' }}>
        {[
          { key: 'offramp', label: 'Offramp to Naira' },
          { key: 'swap',    label: 'Crypto Swap' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '16px 0',
              marginRight: 24,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'Inter',
              color: tab === t.key ? '#F9FAFB' : '#6B7280',
              borderBottom: tab === t.key ? '2px solid #7C3AED' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'offramp' ? <OfframpWidget /> : <SwapWidget />}
    </div>
  )
}

// ─── Navbar ──────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '0 5%',
      height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      background: scrolled ? 'rgba(9,9,15,0.85)' : 'transparent',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      transition: 'all 0.3s',
    }}>
      <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22 }} className="gradient-text">
        CERA
      </span>
      <button style={{
        background: 'none',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 10,
        padding: '8px 20px',
        color: '#F9FAFB',
        fontWeight: 600,
        fontSize: 14,
        cursor: 'pointer',
        fontFamily: 'Inter',
        transition: 'all 0.2s',
      }}
        onMouseEnter={e => { e.target.style.borderColor = 'rgba(124,58,237,0.6)'; e.target.style.color = '#A78BFA' }}
        onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.color = '#F9FAFB' }}
      >
        Download App
      </button>
    </nav>
  )
}

// ─── HowItWorks ──────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { n: '01', title: 'Enter Amount & Bank', desc: 'Select your coin and enter your Nigerian bank details. No account or signup required.' },
    { n: '02', title: 'Send Crypto',          desc: 'Send exactly the amount shown to the deposit address. We detect it within seconds.' },
    { n: '03', title: 'Receive Naira',         desc: 'Naira lands in your bank account within seconds of confirmation.' },
  ]
  return (
    <section style={{ padding: '100px 5%', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <p style={{ color: '#7C3AED', fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Simple Process</p>
        <h2 style={{ fontSize: 38, margin: 0, fontFamily: 'Space Grotesk' }}>How it works</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
        {steps.map(s => (
          <div key={s.n} className="card" style={{ padding: '32px 28px' }}>
            <div style={{
              fontSize: 48, fontFamily: 'Space Grotesk', fontWeight: 700,
              background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              marginBottom: 16, lineHeight: 1,
            }}>
              {s.n}
            </div>
            <h3 style={{ margin: '0 0 10px', fontSize: 18, fontFamily: 'Space Grotesk' }}>{s.title}</h3>
            <p style={{ color: '#6B7280', margin: 0, fontSize: 15, lineHeight: 1.6 }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── SupportedCoins ──────────────────────────────────────────────────────────

function SupportedCoins() {
  return (
    <section style={{ padding: '60px 5% 100px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <p style={{ color: '#7C3AED', fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Multi-Chain</p>
        <h2 style={{ fontSize: 38, margin: '0 0 12px', fontFamily: 'Space Grotesk' }}>Supported Assets</h2>
        <p style={{ color: '#6B7280', fontSize: 15, margin: 0 }}>USDT accepted on 5 chains: Ethereum, BNB, Polygon, TRON, Solana</p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
        {COINS.map(c => (
          <div key={c.symbol} className="card" style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 140 }}>
            <img src={c.icon} alt={c.name} style={{ width: 36, height: 36 }} />
            <div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16 }}>{c.symbol}</div>
              <div style={{ color: '#6B7280', fontSize: 13 }}>{c.name}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── WhyCera ─────────────────────────────────────────────────────────────────

function WhyCera() {
  const features = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      title: 'Detection in Seconds',
      desc: 'Our system monitors the blockchain in real-time and detects your deposit within seconds of broadcast.',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
      title: 'Live CoinGecko Rates',
      desc: 'We pull live market rates every minute from CoinGecko to ensure you always get a fair price.',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
      title: 'No Signup Required',
      desc: 'Convert crypto to Naira with just your bank details. No email, no KYC, no waiting for approval.',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
          <line x1="12" y1="18" x2="12.01" y2="18"/>
        </svg>
      ),
      title: 'Mobile App for Power Users',
      desc: 'Download the CERA app for transaction history, auto-processing, higher limits, and portfolio tracking.',
    },
  ]
  return (
    <section style={{ padding: '60px 5% 100px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <p style={{ color: '#7C3AED', fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Why CERA</p>
        <h2 style={{ fontSize: 38, margin: 0, fontFamily: 'Space Grotesk' }}>Built different</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
        {features.map(f => (
          <div key={f.title} className="card" style={{ padding: '28px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: '#A78BFA' }}>
              {f.icon}
            </div>
            <h3 style={{ margin: '0 0 10px', fontSize: 17, fontFamily: 'Space Grotesk' }}>{f.title}</h3>
            <p style={{ color: '#6B7280', margin: 0, fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── DownloadSection ─────────────────────────────────────────────────────────

function DownloadSection() {
  return (
    <section style={{ padding: '0 5% 100px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid transparent',
        borderRadius: 24,
        padding: '60px 48px',
        textAlign: 'center',
        backgroundImage: 'linear-gradient(rgba(9,9,15,1), rgba(9,9,15,1)), linear-gradient(135deg, #7C3AED, #3B82F6)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      }}>
        <p style={{ color: '#7C3AED', fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Mobile App</p>
        <h2 style={{ fontSize: 38, margin: '0 0 16px', fontFamily: 'Space Grotesk' }}>Download CERA App</h2>
        <p style={{ color: '#6B7280', fontSize: 16, maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.7 }}>
          Want auto-processing, transaction history, and higher limits? Get the full CERA experience on mobile.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12,
            padding: '12px 28px',
            color: '#F9FAFB',
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
            fontFamily: 'Inter',
            display: 'flex', alignItems: 'center', gap: 10,
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            App Store
          </button>
          <button style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12,
            padding: '12px 28px',
            color: '#F9FAFB',
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
            fontFamily: 'Inter',
            display: 'flex', alignItems: 'center', gap: 10,
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 20.5v-17c0-.83.94-1.3 1.6-.8l14.15 8.5c.6.36.6 1.24 0 1.6L4.6 21.3c-.66.5-1.6.03-1.6-.8z"/>
            </svg>
            Google Play
          </button>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
      <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18 }} className="gradient-text">CERA</span>
      <div style={{ color: '#4B5563', fontSize: 14, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <span>CERA &copy; 2025</span>
        <a href="mailto:support@ceraapp.co" style={{ color: '#6B7280', textDecoration: 'none' }}>support@ceraapp.co</a>
        <a href="#" style={{ color: '#6B7280', textDecoration: 'none' }}>Privacy</a>
        <a href="#" style={{ color: '#6B7280', textDecoration: 'none' }}>Terms</a>
      </div>
    </footer>
  )
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '120px 5% 80px',
      position: 'relative',
      overflow: 'hidden',
      textAlign: 'center',
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 700,
        height: 700,
        background: 'radial-gradient(ellipse, rgba(124,58,237,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, width: '100%' }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(124,58,237,0.1)',
          border: '1px solid rgba(124,58,237,0.25)',
          borderRadius: 999,
          padding: '6px 18px',
          marginBottom: 32,
          fontSize: 13,
          color: '#A78BFA',
          fontWeight: 500,
          letterSpacing: 0.3,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
          Instant &middot; Secure &middot; No Signup
        </div>

        <h1 style={{
          fontSize: 'clamp(42px, 7vw, 80px)',
          lineHeight: 1.08,
          margin: '0 0 20px',
          fontFamily: 'Space Grotesk',
          fontWeight: 700,
          letterSpacing: -2,
        }}>
          Convert Crypto<br />to Naira.{' '}
          <span className="gradient-text">Instantly.</span>
        </h1>

        <p style={{
          color: '#6B7280',
          fontSize: 'clamp(16px, 2vw, 20px)',
          lineHeight: 1.7,
          maxWidth: 520,
          margin: '0 auto 48px',
        }}>
          No account needed. Send crypto, receive Naira in your bank account within seconds.
        </p>

        <ConversionWidget />

        <p style={{ color: '#4B5563', fontSize: 13, marginTop: 20 }}>
          Live rates · Powered by CoinGecko
        </p>
      </div>
    </section>
  )
}

// ─── Home Page ───────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: '#09090F' }}>
      <Navbar />
      <Hero />
      <HowItWorks />
      <SupportedCoins />
      <WhyCera />
      <DownloadSection />
      <Footer />
    </div>
  )
}
