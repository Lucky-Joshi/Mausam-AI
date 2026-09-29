import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { useAppState } from '../../state/AppState'
import { dashboard } from '../../data'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { SimulationPanel } from '../simulation/SimulationPanel'
import { Icon } from '../ui/Icon'

const PANEL_ROUTES = ['/', '/dashboard', '/weather', '/alerts', '/analytics', '/maps']
const TAB_IDS = ['dashboard', 'weather', 'alerts', 'analytics']

export const AppShell = () => {
  const { preferences, setPanelOpen } = useAppState()
  const location = useLocation()
  const navigate = useNavigate()
  const showPanel = PANEL_ROUTES.includes(location.pathname)
  const [menuOpen, setMenuOpen] = useState(false)

  // Close the mobile drawer whenever the route changes.
  const [trackedPath, setTrackedPath] = useState(location.pathname)
  if (trackedPath !== location.pathname) {
    setTrackedPath(location.pathname)
    setMenuOpen(false)
  }

  // Lock background scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <div className="shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-hidden />}

      <div className="main">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <div className={`content${showPanel && preferences.panelOpen ? ' content--with-panel' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <nav className="tabbar" aria-label="Mobile navigation">
        {dashboard.navigation
          .filter((item) => TAB_IDS.includes(item.id))
          .map((item) => {
            const active = location.pathname === item.path || (item.id === 'dashboard' && location.pathname === '/')
            return (
              <button
                key={item.id}
                className={`tabbar__item${active ? ' is-active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <Icon name={item.icon} size={19} />
                <span>{item.label}</span>
              </button>
            )
          })}
        <button className="tabbar__item" onClick={() => setMenuOpen(true)}>
          <Icon name="layers" size={19} />
          <span>More</span>
        </button>
      </nav>

      <AnimatePresence>
        {showPanel && preferences.panelOpen && (
          <SimulationPanel key="sim-panel" onClose={() => setPanelOpen(false)} />
        )}
      </AnimatePresence>

      {!showPanel || !preferences.panelOpen ? (
        <motion.button
          className="btn btn-primary panel-toggle"
          onClick={() => setPanelOpen(true)}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
        >
          <Icon name="sliders-horizontal" size={16} />
          Open simulation
        </motion.button>
      ) : null}
    </div>
  )
}
