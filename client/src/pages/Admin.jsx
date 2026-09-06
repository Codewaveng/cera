import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNaira(kobo) {
  if (kobo == null || isNaN(kobo)) return '₦0'
  return '₦' + (Number(kobo) / 100).toLocaleString('en-NG', { maximumFractionDigits: 2 })
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getAdminSecret() {
  return localStorage.getItem('cera_admin_secret') || ''
}

function adminHeaders() {
  return { 'Content-Type': 'application/json', 'x-admin-secret': getAdminSecret() }
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(path, { ...opts, headers: { ...adminHeaders(), ...(opts.headers || {}) } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
  return data
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function IconDashboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  )
}
function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  )
}
function IconTxns() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/>
      <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
    </svg>
  )
}
function IconGuest() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}
function IconWallet() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
    </svg>
  )
}
function IconRates() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  )
}
function IconSystem() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.07 4.93A10 10 0 1121 12h-1M9 12h6"/>
    </svg>
  )
}
function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}
function IconEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}
function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
    </svg>
  )
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    waiting:    { bg: 'rgba(251,191,36,0.15)',  color: '#FBBF24' },
    detected:   { bg: 'rgba(59,130,246,0.15)',  color: '#3B82F6' },
    processing: { bg: 'rgba(139,92,246,0.15)',  color: '#8B5CF6' },
    completed:  { bg: 'rgba(16,185,129,0.15)',  color: '#10B981' },
    failed:     { bg: 'rgba(239,68,68,0.15)',   color: '#EF4444' },
    expired:    { bg: 'rgba(107,114,128,0.15)', color: '#6B7280' },
    pending:    { bg: 'rgba(251,191,36,0.15)',  color: '#FBBF24' },
    active:     { bg: 'rgba(16,185,129,0.15)',  color: '#10B981' },
    locked:     { bg: 'rgba(239,68,68,0.12)',   color: '#F87171' },
    verified:   { bg: 'rgba(16,185,129,0.15)',  color: '#10B981' },
    unverified: { bg: 'rgba(107,114,128,0.15)', color: '#6B7280' },
    rejected:   { bg: 'rgba(239,68,68,0.15)',   color: '#EF4444' },
    waiting_for_deposit: { bg: 'rgba(251,191,36,0.15)', color: '#FBBF24' },
    confirming: { bg: 'rgba(59,130,246,0.15)',  color: '#3B82F6' },
    exchanging: { bg: 'rgba(139,92,246,0.15)',  color: '#8B5CF6' },
    sending:    { bg: 'rgba(16,185,129,0.1)',   color: '#10B981' },
    finished:   { bg: 'rgba(16,185,129,0.15)',  color: '#10B981' },
  }
  const s = map[status] || { bg: 'rgba(255,255,255,0.06)', color: '#9CA3AF' }
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      {status?.replace(/_/g, ' ') || '—'}
    </span>
  )
}

// ─── Modal ───────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, width = 520 }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div style={{ background: '#0D0F17', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, width: '100%', maxWidth: width, maxHeight: '85vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin: 0, fontFamily: 'Space Grotesk', fontSize: 17 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
            <IconClose />
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  )
}

// ─── FormField ───────────────────────────────────────────────────────────────

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', color: '#6B7280', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

// ─── StatCard ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 22px', flex: 1, minWidth: 160 }}>
      <p style={{ color: '#6B7280', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 8px' }}>{label}</p>
      <p style={{ margin: 0, fontFamily: 'Space Grotesk', fontSize: 26, fontWeight: 700, color: color || '#F9FAFB', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ margin: '6px 0 0', color: '#4B5563', fontSize: 12 }}>{sub}</p>}
    </div>
  )
}

// ─── Pagination ──────────────────────────────────────────────────────────────

function Pagination({ page, total, limit, onPage }) {
  const pages = Math.ceil(total / limit)
  if (pages <= 1) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
      <button
        onClick={() => onPage(page - 1)} disabled={page <= 1}
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 14px', color: page <= 1 ? '#4B5563' : '#F9FAFB', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: 13 }}
      >
        Prev
      </button>
      <span style={{ color: '#6B7280', fontSize: 13 }}>Page {page} of {pages}</span>
      <button
        onClick={() => onPage(page + 1)} disabled={page >= pages}
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 14px', color: page >= pages ? '#4B5563' : '#F9FAFB', cursor: page >= pages ? 'not-allowed' : 'pointer', fontSize: 13 }}
      >
        Next
      </button>
    </div>
  )
}

// ─── Table ───────────────────────────────────────────────────────────────────

function Table({ cols, rows, emptyMsg = 'No data found.' }) {
  if (!rows?.length) {
    return <div style={{ textAlign: 'center', padding: '40px 0', color: '#4B5563', fontSize: 14 }}>{emptyMsg}</div>
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c.key} style={{ padding: '10px 14px', color: '#4B5563', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap', textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.6 }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row._id || i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
            >
              {cols.map(c => (
                <td key={c.key} style={{ padding: '11px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#D1D5DB', verticalAlign: 'middle', whiteSpace: c.wrap ? 'normal' : 'nowrap', maxWidth: c.maxWidth || 'none', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.render ? c.render(row) : (row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── ActionBtn ───────────────────────────────────────────────────────────────

function ActionBtn({ onClick, children, danger, small }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${danger ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 7,
        padding: small ? '4px 10px' : '5px 12px',
        color: danger ? '#EF4444' : '#D1D5DB',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 500,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {children}
    </button>
  )
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [secret, setSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!secret.trim()) return setError('Enter admin secret')
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/stats', { headers: { 'x-admin-secret': secret } })
      if (res.status === 403 || res.status === 401) throw new Error('Invalid secret')
      if (!res.ok) throw new Error('Server error')
      localStorage.setItem('cera_admin_secret', secret)
      onLogin()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ marginBottom: 28 }}>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 26, background: 'linear-gradient(135deg,#7C3AED,#3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>CERA</span>
          <p style={{ color: '#6B7280', margin: '6px 0 0', fontSize: 14 }}>Admin Panel</p>
        </div>
        <input
          type="password"
          className="input-field"
          placeholder="Enter admin secret"
          value={secret}
          onChange={e => setSecret(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ marginBottom: 12, textAlign: 'center', letterSpacing: 4 }}
          autoFocus
        />
        {error && <p style={{ color: '#EF4444', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}
        <button className="btn-primary" onClick={handleLogin} disabled={loading}>
          {loading ? 'Checking...' : 'Enter'}
        </button>
      </div>
    </div>
  )
}

// ─── Dashboard View ───────────────────────────────────────────────────────────

function DashboardView() {
  const [stats, setStats] = useState(null)
  const [recentTxns, setRecentTxns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [s, t] = await Promise.all([
          apiFetch('/api/admin/stats'),
          apiFetch('/api/admin/transactions?limit=10'),
        ])
        setStats(s)
        setRecentTxns(t.transactions || t.data || t || [])
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingPane />
  if (error) return <ErrorPane msg={error} />

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontFamily: 'Space Grotesk', fontSize: 22 }}>Dashboard</h2>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 32 }}>
        <StatCard label="Total Users"      value={stats?.totalUsers ?? '—'} />
        <StatCard label="Total Volume"     value={stats?.totalVolume ? formatNaira(stats.totalVolume) : '—'} />
        <StatCard label="Total Txns"       value={stats?.totalTxns ?? '—'} />
        <StatCard label="Active Guest Txns" value={stats?.activeGuestTxns ?? '—'} color="#FBBf24" />
        <StatCard label="Pool Available"   value={stats?.pool?.available ?? '—'} color="#10B981" />
      </div>

      <h3 style={{ margin: '0 0 14px', fontFamily: 'Space Grotesk', fontSize: 16, color: '#9CA3AF', fontWeight: 600 }}>Recent Transactions</h3>
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
        <Table
          cols={[
            { key: 'type',      label: 'Type',    render: r => <span style={{ textTransform: 'capitalize', color: '#A78BFA' }}>{r.type || '—'}</span> },
            { key: 'amount',    label: 'Amount',  render: r => formatNaira(r.amountKobo || r.amount) },
            { key: 'from',      label: 'From',    render: r => r.fromUser?.name || r.fromUser?.email || r.from || '—' },
            { key: 'to',        label: 'To',      render: r => r.toUser?.name || r.toUser?.email || r.to || '—' },
            { key: 'status',    label: 'Status',  render: r => <StatusBadge status={r.status} /> },
            { key: 'createdAt', label: 'Date',    render: r => formatDate(r.createdAt) },
          ]}
          rows={recentTxns}
          emptyMsg="No transactions yet."
        />
      </div>
    </div>
  )
}

// ─── Users View ───────────────────────────────────────────────────────────────

function UsersView() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editUser, setEditUser] = useState(null)
  const [creditUser, setCreditUser] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const limit = 20
  const searchTimer = useRef(null)

  const load = useCallback(async (p = page, q = search) => {
    setLoading(true)
    setError('')
    try {
      const d = await apiFetch(`/api/admin/users?page=${p}&limit=${limit}&search=${encodeURIComponent(q)}`)
      setUsers(d.users || d.data || [])
      setTotal(d.total || 0)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { load() }, [])

  const onSearch = e => {
    const v = e.target.value
    setSearch(v)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(1); load(1, v) }, 500)
  }

  const onPage = p => { setPage(p); load(p) }

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleEditSave = async form => {
    setSaving(true)
    try {
      await apiFetch(`/api/admin/users/${editUser._id}`, { method: 'PUT', body: JSON.stringify(form) })
      showToast('User updated')
      setEditUser(null)
      load()
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const handleCredit = async (amount, note) => {
    setSaving(true)
    try {
      await apiFetch(`/api/admin/users/${creditUser._id}/credit`, { method: 'POST', body: JSON.stringify({ amountNGN: Number(amount), note }) })
      showToast('Balance updated')
      setCreditUser(null)
      load()
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const handleResetPin = async user => {
    if (!window.confirm(`Reset PIN for ${user.name || user.email}?`)) return
    try {
      await apiFetch(`/api/admin/users/${user._id}/reset-pin`, { method: 'POST' })
      showToast('PIN reset')
    } catch (e) { alert(e.message) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await apiFetch(`/api/admin/users/${deleteConfirm._id}`, { method: 'DELETE' })
      showToast('User deleted')
      setDeleteConfirm(null)
      load()
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#10B981', color: '#fff', borderRadius: 10, padding: '10px 18px', zIndex: 2000, fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}>
          {toast}
        </div>
      )}
      <h2 style={{ margin: '0 0 20px', fontFamily: 'Space Grotesk', fontSize: 22 }}>Users</h2>
      <input
        className="input-field"
        placeholder="Search by name, email, or CeraID..."
        value={search}
        onChange={onSearch}
        style={{ maxWidth: 340, marginBottom: 16 }}
      />
      {loading ? <LoadingPane /> : error ? <ErrorPane msg={error} /> : (
        <>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
            <Table
              cols={[
                { key: 'name',       label: 'Name',     render: r => r.name || '—' },
                { key: 'email',      label: 'Email',    render: r => <span style={{ color: '#9CA3AF' }}>{r.email}</span> },
                { key: 'ceraTag',    label: 'CeraID',   render: r => r.ceraTag ? <span style={{ color: '#A78BFA' }}>@{r.ceraTag}</span> : '—' },
                { key: 'balance',    label: 'Balance',  render: r => formatNaira(r.balanceKobo) },
                { key: 'kyc',        label: 'KYC',      render: r => <StatusBadge status={r.kycStatus || 'unverified'} /> },
                { key: 'wallets',    label: 'Wallets',  render: r => r.wallets?.length || 0 },
                { key: 'createdAt',  label: 'Joined',   render: r => formatDate(r.createdAt) },
                { key: 'actions',    label: 'Actions',  render: r => (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <ActionBtn onClick={() => setEditUser(r)}><IconEdit /> Edit</ActionBtn>
                      <ActionBtn onClick={() => setCreditUser(r)}>+/- Balance</ActionBtn>
                      <ActionBtn onClick={() => handleResetPin(r)}>Reset PIN</ActionBtn>
                      <ActionBtn onClick={() => setDeleteConfirm(r)} danger><IconTrash /></ActionBtn>
                    </div>
                  )},
              ]}
              rows={users}
              emptyMsg="No users found."
            />
          </div>
          <Pagination page={page} total={total} limit={limit} onPage={onPage} />
        </>
      )}

      {/* Edit Modal */}
      {editUser && (
        <UserEditModal user={editUser} onClose={() => setEditUser(null)} onSave={handleEditSave} saving={saving} />
      )}

      {/* Credit Modal */}
      {creditUser && (
        <CreditModal user={creditUser} onClose={() => setCreditUser(null)} onSave={handleCredit} saving={saving} />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <Modal title="Delete User" onClose={() => setDeleteConfirm(null)} width={400}>
          <p style={{ color: '#D1D5DB', marginTop: 0 }}>
            Delete <strong>{deleteConfirm.name || deleteConfirm.email}</strong>? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <ActionBtn onClick={() => setDeleteConfirm(null)}>Cancel</ActionBtn>
            <ActionBtn onClick={handleDelete} danger disabled={saving}>{saving ? 'Deleting...' : 'Delete'}</ActionBtn>
          </div>
        </Modal>
      )}
    </div>
  )
}

function UserEditModal({ user, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    ceraTag: user.ceraTag || '',
    kycStatus: user.kycStatus || 'unverified',
    balanceKobo: user.balanceKobo || 0,
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <Modal title="Edit User" onClose={onClose}>
      <FormField label="Name"><input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} /></FormField>
      <FormField label="Email"><input className="input-field" value={form.email} onChange={e => set('email', e.target.value)} /></FormField>
      <FormField label="Phone"><input className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} /></FormField>
      <FormField label="CeraTag"><input className="input-field" value={form.ceraTag} onChange={e => set('ceraTag', e.target.value)} placeholder="without @" /></FormField>
      <FormField label="KYC Status">
        <select className="input-field" value={form.kycStatus} onChange={e => set('kycStatus', e.target.value)}>
          {['unverified','pending','verified','rejected'].map(s => <option key={s}>{s}</option>)}
        </select>
      </FormField>
      <FormField label="Balance (Kobo)"><input className="input-field" type="number" value={form.balanceKobo} onChange={e => set('balanceKobo', e.target.value)} /></FormField>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <ActionBtn onClick={onClose}>Cancel</ActionBtn>
        <button className="btn-primary" style={{ width: 'auto', padding: '8px 22px' }} onClick={() => onSave(form)} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </Modal>
  )
}

function CreditModal({ user, onClose, onSave, saving }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  return (
    <Modal title={`Adjust Balance — ${user.name || user.email}`} onClose={onClose} width={400}>
      <p style={{ color: '#6B7280', marginTop: 0, fontSize: 14 }}>Positive = credit, negative = debit. Amount in Naira.</p>
      <FormField label="Amount (NGN)"><input className="input-field" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 1000 = ₦1,000" /></FormField>
      <FormField label="Note"><input className="input-field" value={note} onChange={e => setNote(e.target.value)} placeholder="Reason for adjustment" /></FormField>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <ActionBtn onClick={onClose}>Cancel</ActionBtn>
        <button className="btn-primary" style={{ width: 'auto', padding: '8px 22px' }} onClick={() => onSave(amount, note)} disabled={saving}>
          {saving ? 'Saving...' : 'Apply'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Transactions View ────────────────────────────────────────────────────────

function TransactionsView() {
  const [txns, setTxns] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editTxn, setEditTxn] = useState(null)
  const [saving, setSaving] = useState(false)
  const limit = 20

  const load = useCallback(async (p = 1, t = typeFilter, s = statusFilter) => {
    setLoading(true)
    setError('')
    try {
      const q = new URLSearchParams({ page: p, limit, ...(t && { type: t }), ...(s && { status: s }) })
      const d = await apiFetch(`/api/admin/transactions?${q}`)
      setTxns(d.transactions || d.data || [])
      setTotal(d.total || 0)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [typeFilter, statusFilter])

  useEffect(() => { load() }, [])

  const onFilter = (key, val) => {
    if (key === 'type') setTypeFilter(val)
    if (key === 'status') setStatusFilter(val)
    setPage(1)
    load(1, key === 'type' ? val : typeFilter, key === 'status' ? val : statusFilter)
  }

  const handleStatusEdit = async (txn, status) => {
    setSaving(true)
    try {
      await apiFetch(`/api/admin/transactions/${txn._id}`, { method: 'PUT', body: JSON.stringify({ status }) })
      setEditTxn(null)
      load(page)
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this transaction?')) return
    try {
      await apiFetch(`/api/admin/transactions/${id}`, { method: 'DELETE' })
      load(page)
    } catch (e) { alert(e.message) }
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontFamily: 'Space Grotesk', fontSize: 22 }}>Transactions</h2>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select className="input-field" style={{ width: 160 }} value={typeFilter} onChange={e => onFilter('type', e.target.value)}>
          <option value="">All Types</option>
          {['send','receive','offramp','swap','credit','debit'].map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="input-field" style={{ width: 160 }} value={statusFilter} onChange={e => onFilter('status', e.target.value)}>
          <option value="">All Statuses</option>
          {['pending','completed','failed','processing'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      {loading ? <LoadingPane /> : error ? <ErrorPane msg={error} /> : (
        <>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
            <Table
              cols={[
                { key: '_id',       label: 'TxID',    render: r => <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6B7280' }}>{r._id?.slice(-8)}</span> },
                { key: 'type',      label: 'Type',    render: r => <span style={{ color: '#A78BFA', textTransform: 'capitalize' }}>{r.type}</span> },
                { key: 'amount',    label: 'Amount',  render: r => formatNaira(r.amountKobo || r.amount) },
                { key: 'from',      label: 'From',    render: r => r.fromUser?.name || r.from || '—' },
                { key: 'to',        label: 'To',      render: r => r.toUser?.name || r.to || '—' },
                { key: 'status',    label: 'Status',  render: r => <StatusBadge status={r.status} /> },
                { key: 'createdAt', label: 'Date',    render: r => formatDate(r.createdAt) },
                { key: 'actions',   label: 'Actions', render: r => (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <ActionBtn onClick={() => setEditTxn(r)}><IconEdit /> Status</ActionBtn>
                      <ActionBtn onClick={() => handleDelete(r._id)} danger><IconTrash /></ActionBtn>
                    </div>
                  )},
              ]}
              rows={txns}
              emptyMsg="No transactions."
            />
          </div>
          <Pagination page={page} total={total} limit={limit} onPage={p => { setPage(p); load(p) }} />
        </>
      )}
      {editTxn && (
        <TxnStatusModal txn={editTxn} onClose={() => setEditTxn(null)} onSave={handleStatusEdit} saving={saving} />
      )}
    </div>
  )
}

function TxnStatusModal({ txn, onClose, onSave, saving }) {
  const [status, setStatus] = useState(txn.status || '')
  return (
    <Modal title="Edit Transaction Status" onClose={onClose} width={380}>
      <FormField label="Status">
        <select className="input-field" value={status} onChange={e => setStatus(e.target.value)}>
          {['pending','processing','completed','failed','cancelled'].map(s => <option key={s}>{s}</option>)}
        </select>
      </FormField>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <ActionBtn onClick={onClose}>Cancel</ActionBtn>
        <button className="btn-primary" style={{ width: 'auto', padding: '8px 22px' }} onClick={() => onSave(txn, status)} disabled={saving}>
          {saving ? 'Saving...' : 'Update'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Guest Txns View ──────────────────────────────────────────────────────────

function GuestTxnsView() {
  const [txns, setTxns] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editTxn, setEditTxn] = useState(null)
  const [saving, setSaving] = useState(false)
  const limit = 20

  const load = useCallback(async (p = 1, s = statusFilter) => {
    setLoading(true)
    setError('')
    try {
      const q = new URLSearchParams({ page: p, limit, ...(s && { status: s }) })
      const d = await apiFetch(`/api/admin/guest?${q}`)
      setTxns(d.guests || [])
      setTotal(d.total || 0)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { load() }, [])

  const handleStatusUpdate = async (txn, status) => {
    setSaving(true)
    try {
      await apiFetch(`/api/admin/guest/${txn._id}`, { method: 'PUT', body: JSON.stringify({ status }) })
      setEditTxn(null)
      load(page)
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this guest transaction?')) return
    try {
      await apiFetch(`/api/admin/guest/${id}`, { method: 'DELETE' })
      load(page)
    } catch (e) { alert(e.message) }
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontFamily: 'Space Grotesk', fontSize: 22 }}>Guest Transactions</h2>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <select className="input-field" style={{ width: 180 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); load(1, e.target.value) }}>
          <option value="">All Statuses</option>
          {['waiting','detected','processing','completed','failed','expired'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      {loading ? <LoadingPane /> : error ? <ErrorPane msg={error} /> : (
        <>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
            <Table
              cols={[
                { key: '_id',            label: 'ID',        render: r => <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6B7280' }}>{r._id?.slice(-8)}</span> },
                { key: 'coin',           label: 'Coin',      render: r => <span style={{ color: '#A78BFA', fontWeight: 600 }}>{r.coin}{r.chain ? <span style={{ color: '#6B7280', fontWeight: 400 }}> / {r.chain}</span> : ''}</span> },
                { key: 'expectedAmount', label: 'Expected',  render: r => `${r.expectedAmount} ${r.coin}` },
                { key: 'receivedAmount', label: 'Received',  render: r => r.receivedAmount ? `${r.receivedAmount} ${r.coin}` : '—' },
                { key: 'bankName',       label: 'Bank',      render: r => r.bankName || '—' },
                { key: 'accountNumber',  label: 'Account',   render: r => <span style={{ fontFamily: 'monospace' }}>{r.accountNumber}</span> },
                { key: 'status',         label: 'Status',    render: r => <StatusBadge status={r.status} /> },
                { key: 'expiresAt',      label: 'Expires',   render: r => formatDate(r.expiresAt) },
                { key: 'actions',        label: 'Actions',   render: r => (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <ActionBtn onClick={() => setEditTxn(r)}><IconEdit /> Status</ActionBtn>
                      <ActionBtn onClick={() => handleDelete(r._id)} danger><IconTrash /></ActionBtn>
                    </div>
                  )},
              ]}
              rows={txns}
              emptyMsg="No guest transactions."
            />
          </div>
          <Pagination page={page} total={total} limit={limit} onPage={p => { setPage(p); load(p) }} />
        </>
      )}
      {editTxn && (
        <GuestStatusModal txn={editTxn} onClose={() => setEditTxn(null)} onSave={handleStatusUpdate} saving={saving} />
      )}
    </div>
  )
}

function GuestStatusModal({ txn, onClose, onSave, saving }) {
  const [status, setStatus] = useState(txn.status || 'waiting')
  return (
    <Modal title="Update Guest Txn Status" onClose={onClose} width={380}>
      <p style={{ color: '#6B7280', fontSize: 13, marginTop: 0 }}>
        ID: <span style={{ fontFamily: 'monospace', color: '#A78BFA' }}>{txn._id?.slice(-12)}</span>
      </p>
      <FormField label="Status">
        <select className="input-field" value={status} onChange={e => setStatus(e.target.value)}>
          {['waiting','detected','processing','completed','failed','expired'].map(s => <option key={s}>{s}</option>)}
        </select>
      </FormField>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <ActionBtn onClick={onClose}>Cancel</ActionBtn>
        <button className="btn-primary" style={{ width: 'auto', padding: '8px 22px' }} onClick={() => onSave(txn, status)} disabled={saving}>
          {saving ? 'Saving...' : 'Update'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Wallet Pool View ─────────────────────────────────────────────────────────

function WalletPoolView() {
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editWallet, setEditWallet] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addForm, setAddForm] = useState({ label: '', turnkeyWalletId: '', evm: '', sol: '', btc: '', tron: '' })

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const d = await apiFetch('/api/admin/pool')
      setWallets(Array.isArray(d) ? d : (d.wallets || d.data || []))
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    setSaving(true)
    try {
      await apiFetch('/api/admin/pool', { method: 'POST', body: JSON.stringify(addForm) })
      setShowAdd(false)
      setAddForm({ label: '', turnkeyWalletId: '', evm: '', sol: '', btc: '', tron: '' })
      load()
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const handleEditSave = async form => {
    setSaving(true)
    try {
      await apiFetch(`/api/admin/pool/${editWallet._id}`, { method: 'PUT', body: JSON.stringify(form) })
      setEditWallet(null)
      load()
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const handleRelease = async w => {
    if (!window.confirm(`Release lock on "${w.label}"?`)) return
    try {
      await apiFetch(`/api/admin/pool/${w._id}`, { method: 'PUT', body: JSON.stringify({ status: 'available', lockedBy: null, lockedAt: null }) })
      load()
    } catch (e) { alert(e.message) }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this wallet?')) return
    try {
      await apiFetch(`/api/admin/pool/${id}`, { method: 'DELETE' })
      load()
    } catch (e) { alert(e.message) }
  }

  const setAdd = (k, v) => setAddForm(f => ({ ...f, [k]: v }))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontFamily: 'Space Grotesk', fontSize: 22 }}>Wallet Pool</h2>
        <button className="btn-primary" style={{ width: 'auto', padding: '8px 20px', fontSize: 14 }} onClick={() => setShowAdd(true)}>
          + Add Wallet
        </button>
      </div>

      {showAdd && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontFamily: 'Space Grotesk', fontSize: 16 }}>Add Pool Wallet</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[['label', 'Label'], ['turnkeyWalletId', 'Turnkey Wallet ID'], ['evm', 'EVM Address'], ['sol', 'Solana Address'], ['btc', 'Bitcoin Address'], ['tron', 'TRON Address']].map(([k, l]) => (
              <FormField key={k} label={l}>
                <input className="input-field" value={addForm[k]} onChange={e => setAdd(k, e.target.value)} placeholder={l} />
              </FormField>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <ActionBtn onClick={() => setShowAdd(false)}>Cancel</ActionBtn>
            <button className="btn-primary" style={{ width: 'auto', padding: '8px 22px' }} onClick={handleAdd} disabled={saving}>
              {saving ? 'Adding...' : 'Add Wallet'}
            </button>
          </div>
        </div>
      )}

      {loading ? <LoadingPane /> : error ? <ErrorPane msg={error} /> : (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
          <Table
            cols={[
              { key: 'label',    label: 'Label',    render: r => <span style={{ fontWeight: 600 }}>{r.label}</span> },
              { key: 'evm',      label: 'EVM',      render: r => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.evm ? r.evm.slice(0, 10) + '...' : '—'}</span> },
              { key: 'sol',      label: 'SOL',      render: r => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.sol ? r.sol.slice(0, 10) + '...' : '—'}</span> },
              { key: 'btc',      label: 'BTC',      render: r => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.btc ? r.btc.slice(0, 10) + '...' : '—'}</span> },
              { key: 'tron',     label: 'TRON',     render: r => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.tron ? r.tron.slice(0, 10) + '...' : '—'}</span> },
              { key: 'status',   label: 'Status',   render: r => <StatusBadge status={r.status || (r.lockedBy ? 'locked' : 'active')} /> },
              { key: 'lockedBy', label: 'Locked By', render: r => r.lockedBy ? <span style={{ color: '#9CA3AF', fontSize: 12 }}>{String(r.lockedBy).slice(-8)}</span> : '—' },
              { key: 'actions',  label: 'Actions',  render: r => (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <ActionBtn onClick={() => setEditWallet(r)}><IconEdit /> Edit</ActionBtn>
                    {r.lockedBy && <ActionBtn onClick={() => handleRelease(r)}>Release</ActionBtn>}
                    <ActionBtn onClick={() => handleDelete(r._id)} danger><IconTrash /></ActionBtn>
                  </div>
                )},
            ]}
            rows={wallets}
            emptyMsg="No wallets in pool."
          />
        </div>
      )}

      {editWallet && (
        <WalletEditModal wallet={editWallet} onClose={() => setEditWallet(null)} onSave={handleEditSave} saving={saving} />
      )}
    </div>
  )
}

function WalletEditModal({ wallet, onClose, onSave, saving }) {
  const [form, setForm] = useState({ label: wallet.label || '', evm: wallet.evm || '', sol: wallet.sol || '', btc: wallet.btc || '', tron: wallet.tron || '', turnkeyWalletId: wallet.turnkeyWalletId || '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <Modal title="Edit Wallet" onClose={onClose}>
      {[['label', 'Label'], ['turnkeyWalletId', 'Turnkey Wallet ID'], ['evm', 'EVM Address'], ['sol', 'Solana Address'], ['btc', 'Bitcoin Address'], ['tron', 'TRON Address']].map(([k, l]) => (
        <FormField key={k} label={l}><input className="input-field" value={form[k]} onChange={e => set(k, e.target.value)} /></FormField>
      ))}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <ActionBtn onClick={onClose}>Cancel</ActionBtn>
        <button className="btn-primary" style={{ width: 'auto', padding: '8px 22px' }} onClick={() => onSave(form)} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Rates View ───────────────────────────────────────────────────────────────

function RatesView() {
  const [rates, setRates] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const d = await apiFetch('/api/admin/rates')
      setRates(d.rates || d)
      setLastUpdated(new Date())
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  const coinMeta = {
    btc:  { name: 'Bitcoin',   icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/btc.svg' },
    eth:  { name: 'Ethereum',  icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/eth.svg' },
    bnb:  { name: 'BNB',       icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/bnb.svg' },
    sol:  { name: 'Solana',    icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/sol.svg' },
    trx:  { name: 'TRON',      icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/trx.svg' },
    usdt: { name: 'Tether',    icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/usdt.svg' },
    usdc: { name: 'USD Coin',  icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/usdc.svg' },
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontFamily: 'Space Grotesk', fontSize: 22 }}>Live Rates</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastUpdated && <span style={{ color: '#4B5563', fontSize: 12 }}>Updated {lastUpdated.toLocaleTimeString()}</span>}
          <ActionBtn onClick={load}>Refresh</ActionBtn>
        </div>
      </div>
      {loading && !rates ? <LoadingPane /> : error ? <ErrorPane msg={error} /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {rates && Object.entries(rates).map(([coin, rate]) => {
            const meta = coinMeta[coin.toLowerCase()] || {}
            return (
              <div key={coin} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                {meta.icon && <img src={meta.icon} alt="" style={{ width: 32, height: 32 }} />}
                <div>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{coin.toUpperCase()} / NGN</p>
                  <p style={{ margin: '4px 0 0', fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700 }}>
                    ₦{Number(rate).toLocaleString('en-NG', { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <p style={{ color: '#4B5563', fontSize: 12, marginTop: 20 }}>Auto-refreshes every 30 seconds.</p>
    </div>
  )
}

// ─── System View ──────────────────────────────────────────────────────────────

function SystemView() {
  const [showReset, setShowReset] = useState(false)
  const [showFullReset, setShowFullReset] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleResetTags = async () => {
    if (!window.confirm('Reset all CeraTags? Users will need to claim new tags.')) return
    setLoading(true)
    try {
      await apiFetch('/api/admin/reset-tags', { method: 'POST' })
      setMsg('All tags reset successfully.')
    } catch (e) { setMsg('Error: ' + e.message) }
    finally { setLoading(false) }
  }

  const handleFullReset = async () => {
    if (resetConfirmText !== 'RESET') return
    setLoading(true)
    try {
      await apiFetch('/api/admin/full-reset', { method: 'POST' })
      setMsg('Full reset complete. All data has been wiped.')
      setShowFullReset(false)
      setResetConfirmText('')
    } catch (e) { setMsg('Error: ' + e.message) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontFamily: 'Space Grotesk', fontSize: 22 }}>System</h2>
      {msg && (
        <div style={{ background: msg.startsWith('Error') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${msg.startsWith('Error') ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: msg.startsWith('Error') ? '#EF4444' : '#10B981', fontSize: 14 }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '22px' }}>
          <h3 style={{ margin: '0 0 8px', fontFamily: 'Space Grotesk', fontSize: 16 }}>Current Time</h3>
          <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 14, color: '#9CA3AF' }}>{new Date().toISOString()}</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '22px' }}>
          <h3 style={{ margin: '0 0 8px', fontFamily: 'Space Grotesk', fontSize: 16 }}>App Version</h3>
          <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 14, color: '#9CA3AF' }}>1.0.0</p>
        </div>
      </div>

      <h3 style={{ margin: '0 0 16px', fontFamily: 'Space Grotesk', fontSize: 17, color: '#9CA3AF', fontWeight: 600 }}>Danger Zone</h3>
      <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 14, padding: '24px' }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <h4 style={{ margin: '0 0 6px', fontSize: 15, fontFamily: 'Space Grotesk' }}>Reset All Tags</h4>
            <p style={{ color: '#6B7280', fontSize: 13, margin: '0 0 12px' }}>Clear all user CeraTags. Users will need to claim new tags.</p>
            <ActionBtn onClick={handleResetTags} danger>{loading ? 'Resetting...' : 'Reset All Tags'}</ActionBtn>
          </div>
          <div style={{ borderLeft: '1px solid rgba(239,68,68,0.15)', paddingLeft: 24 }}>
            <h4 style={{ margin: '0 0 6px', fontSize: 15, fontFamily: 'Space Grotesk', color: '#EF4444' }}>Full Reset</h4>
            <p style={{ color: '#6B7280', fontSize: 13, margin: '0 0 12px' }}>Delete ALL users and transactions. Irreversible.</p>
            <ActionBtn onClick={() => setShowFullReset(true)} danger>Full Reset</ActionBtn>
          </div>
        </div>
      </div>

      {showFullReset && (
        <Modal title="Full Reset — Danger" onClose={() => { setShowFullReset(false); setResetConfirmText('') }} width={420}>
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '14px', marginBottom: 20 }}>
            <p style={{ color: '#EF4444', margin: 0, fontSize: 14, fontWeight: 600 }}>
              This will permanently delete ALL users and transactions. This cannot be undone.
            </p>
          </div>
          <FormField label='Type "RESET" to confirm'>
            <input className="input-field" value={resetConfirmText} onChange={e => setResetConfirmText(e.target.value)} placeholder="RESET" />
          </FormField>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <ActionBtn onClick={() => { setShowFullReset(false); setResetConfirmText('') }}>Cancel</ActionBtn>
            <ActionBtn onClick={handleFullReset} danger disabled={resetConfirmText !== 'RESET' || loading}>
              {loading ? 'Resetting...' : 'Confirm Full Reset'}
            </ActionBtn>
          </div>
        </Modal>
      )}

      <div style={{ marginTop: 24 }}>
        <ActionBtn onClick={() => { localStorage.removeItem('cera_admin_secret'); window.location.reload() }} danger>
          Log Out
        </ActionBtn>
      </div>
    </div>
  )
}

// ─── Shared Panes ─────────────────────────────────────────────────────────────

function LoadingPane() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: '#6B7280' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(124,58,237,0.3)', borderTopColor: '#7C3AED', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ margin: 0, fontSize: 14 }}>Loading...</p>
      </div>
    </div>
  )
}

function ErrorPane({ msg }) {
  return (
    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '16px 20px', color: '#EF4444', fontSize: 14 }}>
      {msg}
    </div>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const NAV = [
  { key: 'dashboard',    label: 'Dashboard',    Icon: IconDashboard },
  { key: 'users',        label: 'Users',        Icon: IconUsers },
  { key: 'transactions', label: 'Transactions', Icon: IconTxns },
  { key: 'guest',        label: 'Guest Txns',   Icon: IconGuest },
  { key: 'wallets',      label: 'Wallet Pool',  Icon: IconWallet },
  { key: 'rates',        label: 'Rates',        Icon: IconRates },
  { key: 'system',       label: 'System',       Icon: IconSystem },
]

function Sidebar({ active, onNav, isOpen, isMobile, onClose }) {
  return (
    <>
      {isMobile && isOpen && (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 39, backdropFilter: 'blur(2px)' }} />
      )}
      <div style={{
        width: 240, minHeight: '100vh', background: '#0D0F17',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'fixed', top: 0, bottom: 0, left: 0, overflow: 'auto',
        zIndex: 40,
        transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        transition: 'transform 0.25s ease',
      }}>
        <div style={{ padding: '24px 20px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, background: 'linear-gradient(135deg,#7C3AED,#3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>CERA</span>
          {isMobile && (
            <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
              <IconClose />
            </button>
          )}
        </div>
        <span style={{ display: 'block', color: '#4B5563', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', padding: '0 20px 12px' }}>Admin Panel</span>
        <nav style={{ flex: 1, padding: '8px 12px' }}>
          {NAV.map(({ key, label, Icon }) => {
            const isActive = active === key
            return (
              <button
                key={key}
                onClick={() => onNav(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '10px 12px', marginBottom: 2, borderRadius: 10, border: 'none',
                  background: isActive ? 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(59,130,246,0.15))' : 'transparent',
                  color: isActive ? '#F9FAFB' : '#6B7280', cursor: 'pointer',
                  fontSize: 14, fontWeight: isActive ? 600 : 400, fontFamily: 'Inter',
                  textAlign: 'left', borderLeft: isActive ? '2px solid #7C3AED' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <Icon />
                {label}
              </button>
            )
          })}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: '#374151' }}>
          CERA Admin v1.0
        </div>
      </div>
    </>
  )
}

// ─── Admin Page ───────────────────────────────────────────────────────────────

export default function Admin() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('cera_admin_secret'))
  const [section, setSection] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 900)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 900)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />

  const handleNav = key => { setSection(key); setSidebarOpen(false) }

  const VIEW = {
    dashboard:    <DashboardView />,
    users:        <UsersView />,
    transactions: <TransactionsView />,
    guest:        <GuestTxnsView />,
    wallets:      <WalletPoolView />,
    rates:        <RatesView />,
    system:       <SystemView />,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#09090F' }}>
      <Sidebar active={section} onNav={handleNav} isOpen={sidebarOpen} isMobile={isMobile} onClose={() => setSidebarOpen(false)} />
      <main style={{ flex: 1, marginLeft: isMobile ? 0 : 240, padding: isMobile ? '16px' : '32px 36px', minHeight: '100vh', overflowX: 'hidden' }}>
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 9px', color: '#F9FAFB', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, background: 'linear-gradient(135deg,#7C3AED,#3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>CERA Admin</span>
          </div>
        )}
        {VIEW[section] || <DashboardView />}
      </main>
    </div>
  )
}
