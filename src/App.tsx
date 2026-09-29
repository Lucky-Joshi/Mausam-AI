import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Navigate, Route, Routes } from 'react-router-dom'

import { useAppState } from './state/AppState'
import { AuthProvider, useAuth } from './state/AuthState'
import { AppShell } from './components/layout/AppShell'
import { Splash } from './components/ui/Splash'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { WeatherPage } from './pages/WeatherPage'
import { MapsPage } from './pages/MapsPage'
import { AlertsPage } from './pages/AlertsPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'

/** Sends signed-in users to the login screen and everyone else to the app. */
const LoginRoute = () => {
  const { user } = useAuth()
  return user ? <Navigate to="/" replace /> : <AuthPage />
}

/** Every sidebar module sits behind this guard. */
const ProtectedShell = () => {
  const { user } = useAuth()
  return user ? <AppShell /> : <Navigate to="/login" replace />
}

const ThemedRoutes = () => {
  const { preferences } = useAppState()
  const [splash, setSplash] = useState(true)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('theme-dark', preferences.theme === 'dark')
    root.classList.toggle('theme-light', preferences.theme === 'light')
  }, [preferences.theme])

  useEffect(() => {
    const timer = window.setTimeout(() => setSplash(false), 1500)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <>
      <AnimatePresence>{splash && <Splash key="splash" />}</AnimatePresence>

      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route element={<ProtectedShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route path="/maps" element={<MapsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<DashboardPage />} />
        </Route>
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ThemedRoutes />
    </AuthProvider>
  )
}
