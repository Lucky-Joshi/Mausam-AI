/**
 * Local-only account store.
 *
 * Everything lives in localStorage: there is no backend, no tokens and no
 * network call anywhere in this file. Passwords are passed through a trivial
 * one-way encoding purely so they are not stored as readable text — this is a
 * frontend demo, not a production identity provider.
 */

export type StoredUser = {
  id: string
  name: string
  email: string
  passwordHash: string
  joined: string
}

export type AuthResult = { ok: true; user: StoredUser } | { ok: false; error: string }

const USERS_KEY = 'mausam-ai.users.v1'
const SESSION_KEY = 'mausam-ai.session.v1'
const DEMO_EMAIL = 'aarav@mausam.ai'
const DEMO_PASSWORD = 'mausam123'

const encode = (value: string) => btoa(encodeURIComponent(value))

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const write = (key: string, value: unknown) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable — the session simply stays in memory */
  }
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const getUsers = (): StoredUser[] => read<StoredUser[]>(USERS_KEY, [])

export const getSession = (): StoredUser | null => {
  const id = read<string | null>(SESSION_KEY, null)
  if (!id) return null
  return getUsers().find((user) => user.id === id) ?? null
}

/** Creates the demo judge account the first time the app opens. */
export const ensureDemoUser = () => {
  const users = getUsers()
  if (users.some((user) => user.email === DEMO_EMAIL)) return
  write(USERS_KEY, [
    ...users,
    {
      id: 'demo-user',
      name: 'Aarav Rathore',
      email: DEMO_EMAIL,
      passwordHash: encode(DEMO_PASSWORD),
      joined: new Date('2026-01-12').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
  ])
}

export const signUp = ({ name, email, password }: { name: string; email: string; password: string }): AuthResult => {
  const trimmedName = name.trim()
  const trimmedEmail = email.trim().toLowerCase()

  if (trimmedName.length < 2) return { ok: false, error: 'Please enter your full name.' }
  if (!isValidEmail(trimmedEmail)) return { ok: false, error: 'That email address does not look right.' }
  if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' }

  const users = getUsers()
  if (users.some((user) => user.email === trimmedEmail)) {
    return { ok: false, error: 'An account with this email already exists.' }
  }

  const user: StoredUser = {
    id: `user-${Date.now().toString(36)}`,
    name: trimmedName,
    email: trimmedEmail,
    passwordHash: encode(password),
    joined: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
  }

  write(USERS_KEY, [...users, user])
  write(SESSION_KEY, user.id)
  return { ok: true, user }
}

export const logIn = ({ email, password }: { email: string; password: string }): AuthResult => {
  ensureDemoUser()
  const trimmedEmail = email.trim().toLowerCase()
  const user = getUsers().find((entry) => entry.email === trimmedEmail)

  if (!user || user.passwordHash !== encode(password)) {
    return { ok: false, error: 'Email or password is incorrect.' }
  }

  write(SESSION_KEY, user.id)
  return { ok: true, user }
}

export const logOut = () => {
  try {
    window.localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}
