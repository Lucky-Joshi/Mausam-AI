import { useState } from 'react'
import { motion } from 'framer-motion'
import { Navigate } from 'react-router-dom'

import { dashboard, landing, personas } from '../data'
import { useAuth } from '../state/AuthState'
import { Icon } from '../components/ui/Icon'
import { EASE_OUT } from '../lib/motion'

type Mode = 'signin' | 'signup'

const DEMO = { email: 'demo@mausam.ai', password: 'demo1234' }

const highlights = [
  { id: 'persona', icon: 'users', text: 'Five personas rebuild the dashboard, alerts and widgets live.' },
  { id: 'simulate', icon: 'sliders-horizontal', text: 'Simulation panel drives AQI, temperature, rain and UV in real time.' },
  { id: 'explain', icon: 'scan-eye', text: 'Every generated card shows its reasoning, thresholds and confidence.' },
]

export const AuthPage = () => {
  const { user, login, signup } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState(DEMO.email)
  const [password, setPassword] = useState(DEMO.password)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const result = mode === 'signin' ? login({ email, password }) : signup({ name, email, password })
    setBusy(false)
    if (!result.ok) setError(result.error)
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
    if (next === 'signup') setName('')
  }

  return (
    <div className="auth">
      <motion.aside
        className="auth__brand"
        initial={{ opacity: 0, x: -22 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: EASE_OUT }}
      >
        <div className="auth__brand-inner">
          <div className="sidebar__brand" style={{ marginBottom: 'var(--gap-5)' }}>
            <div className="brand-mark">
              <Icon name="cloud-sun" size={21} strokeWidth={2.1} />
            </div>
            <div className="brand-text">
              <strong>{dashboard.appName}</strong>
              <span>{dashboard.tagline}</span>
            </div>
          </div>

          <h1>{landing.meta.description}</h1>
          <p>{landing.hero.subtitle}</p>

          <ul className="auth__highlights">
            {highlights.map((item) => (
              <li key={item.id}>
                <span className="auth__highlight-icon">
                  <Icon name={item.icon} size={16} />
                </span>
                {item.text}
              </li>
            ))}
          </ul>

          <div className="auth__personas">
            {personas.map((persona) => (
              <span className="chip" key={persona.id}>
                <Icon name={persona.icon} size={13} />
                {persona.label}
              </span>
            ))}
          </div>
        </div>
        <span className="auth__edition">{landing.meta.edition}</span>
      </motion.aside>

      <div className="auth__form-wrap">
        <motion.div
          className="auth__card card pad-lg"
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.08 }}
        >
          <div className="segmented auth__tabs" role="tablist" aria-label="Sign in or create account">
            <button className={mode === 'signin' ? 'is-active' : ''} onClick={() => switchMode('signin')} role="tab" aria-selected={mode === 'signin'}>
              Sign in
            </button>
            <button className={mode === 'signup' ? 'is-active' : ''} onClick={() => switchMode('signup')} role="tab" aria-selected={mode === 'signup'}>
              Create account
            </button>
          </div>

          <h2 className="auth__title">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="muted small">
            {mode === 'signin'
              ? 'Sign in to open the personalised weather dashboard.'
              : 'Your profile is stored in this browser only — nothing is sent anywhere.'}
          </p>

          <form className="auth__form" onSubmit={submit}>
            {mode === 'signup' && (
              <label className="field">
                <span className="field-label">Full name</span>
                <input
                  className="auth__input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ananya Sharma"
                  autoComplete="name"
                />
              </label>
            )}

            <label className="field">
              <span className="field-label">Email</span>
              <input
                className="auth__input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            <label className="field">
              <span className="field-label">Password</span>
              <input
                className="auth__input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </label>

            {error && (
              <p className="auth__error" role="alert">
                <Icon name="circle-alert" size={14} />
                {error}
              </p>
            )}

            <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
              {mode === 'signin' ? 'Sign in' : 'Create account'}
              <Icon name="arrow-right" size={16} />
            </button>
          </form>

          <div className="auth__demo">
            <span className="tiny muted">Demo judge account</span>
            <button className="btn btn-soft btn-sm btn-block" type="button" onClick={() => { setMode('signin'); setEmail(DEMO.email); setPassword(DEMO.password); setError('') }}>
              <Icon name="zap" size={14} />
              Use demo@mausam.ai · demo1234
            </button>
          </div>

          <p className="tiny muted auth__note">
            <Icon name="hard-drive" size={12} /> Stored under <code>mausam-ai.users.v1</code> in localStorage ·{' '}
            {dashboard.version}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
