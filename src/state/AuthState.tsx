import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { ensureDemoUser, getSession, logIn as storeLogin, logOut as storeLogout, signUp as storeSignUp } from '../lib/auth'
import type { AuthResult, StoredUser } from '../lib/auth'

type Credentials = { name?: string; email: string; password: string }

type AuthValue = {
  user: StoredUser | null
  login: (input: Credentials) => AuthResult
  signup: (input: Credentials) => AuthResult
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<StoredUser | null>(() => {
    ensureDemoUser()
    return getSession()
  })

  const login = useCallback((input: Credentials) => {
    const result = storeLogin(input)
    if (result.ok) setUser(result.user)
    return result
  }, [])

  const signup = useCallback((input: Credentials) => {
    const result = storeSignUp(input as { name: string; email: string; password: string })
    if (result.ok) setUser(result.user)
    return result
  }, [])

  const logout = useCallback(() => {
    storeLogout()
    setUser(null)
  }, [])

  const value = useMemo<AuthValue>(() => ({ user, login, signup, logout }), [user, login, signup, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
