import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { dashboard, locations, navigation, personas } from '../../data'
import { useAppState } from '../../state/AppState'
import { useAuth } from '../../state/AuthState'
import { severityColor } from '../../lib/engine'
import { initials } from '../../lib/format'
import { Icon } from '../ui/Icon'
import { itemVariants, listVariants } from '../../lib/motion'

type Result = {
  id: string
  label: string
  meta: string
  icon: string
  run: () => void
}

export const Topbar = ({ onMenu }: { onMenu?: () => void }) => {
  const navigate = useNavigate()
  const { model, preferences, toggleTheme, setLocation, setPersona } = useAppState()
  const { user, logout } = useAuth()
  const { weather } = model
  const [query, setQuery] = useState('')
  const [openSearch, setOpenSearch] = useState(false)
  const [openNotif, setOpenNotif] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setOpenSearch(false)
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setOpenNotif(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [])

  const results = useMemo<Result[]>(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return []
    const items: Result[] = []

    for (const item of navigation) {
      if (item.label.toLowerCase().includes(needle) || item.description.toLowerCase().includes(needle)) {
        items.push({
          id: `nav-${item.id}`,
          label: item.label,
          meta: 'Module',
          icon: item.icon,
          run: () => navigate(item.path),
        })
      }
    }
    for (const location of locations) {
      if (location.label.toLowerCase().includes(needle) || location.region.toLowerCase().includes(needle)) {
        items.push({
          id: `loc-${location.id}`,
          label: location.label,
          meta: 'Location',
          icon: 'map-pin',
          run: () => {
            setLocation(location.id)
            navigate('/dashboard')
          },
        })
      }
    }
    for (const persona of personas) {
      if (persona.label.toLowerCase().includes(needle) || persona.tagline.toLowerCase().includes(needle)) {
        items.push({
          id: `persona-${persona.id}`,
          label: persona.label,
          meta: 'Persona',
          icon: persona.icon,
          run: () => {
            setPersona(persona.id)
            navigate('/dashboard')
          },
        })
      }
    }
    return items.slice(0, 7)
  }, [query, navigate, setLocation, setPersona])

  const notifications = model.alerts.slice(0, 5)

  const pick = (result: Result) => {
    result.run()
    setQuery('')
    setOpenSearch(false)
  }

  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" onClick={onMenu} aria-label="Open navigation">
        <Icon name="list" size={18} />
      </button>

      <div className="topbar__city">
        <span className="topbar__city-icon">
          <Icon name="map-pin" size={17} />
        </span>
        <div className="topbar__city-text">
          <strong>{weather.location.label}</strong>
          <span>
            {weather.timeOfDay.label} · {weather.persona.shortLabel} persona
          </span>
        </div>
      </div>

      <div className="search" ref={searchRef}>
        <span className="search__icon">
          <Icon name="search" size={16} />
        </span>
        <input
          className="search__input"
          value={query}
          placeholder={dashboard.search.placeholder}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpenSearch(true)
          }}
          onFocus={() => setOpenSearch(true)}
          aria-label="Search"
        />
        <AnimatePresence>
          {openSearch && query.trim() !== '' && (
            <motion.div
              className="search__results"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.22 }}
            >
              {results.length === 0 ? (
                <div className="search__result" style={{ color: 'var(--text-3)' }}>
                  No match for “{query}”
                </div>
              ) : (
                results.map((result) => (
                  <button key={result.id} className="search__result" onClick={() => pick(result)}>
                    <Icon name={result.icon} size={16} />
                    {result.label}
                    <span className="search__result-meta">{result.meta}</span>
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="topbar__spacer" />

      <div className="topbar__actions">
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => setOpenNotif((v) => !v)}
            aria-label="Notifications"
            aria-expanded={openNotif}
          >
            <Icon name="bell" size={18} />
            {notifications.length > 0 && <span className="notification-dot" />}
          </button>
          <AnimatePresence>
            {openNotif && (
              <motion.div
                className="popover"
                initial={{ opacity: 0, y: -10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ duration: 0.22 }}
              >
                <div className="popover__head">
                  <strong style={{ fontSize: 'var(--fs-sm)' }}>{dashboard.notifications.title}</strong>
                  <span className="badge accent">{model.alerts.length}</span>
                </div>
                <div className="popover__body">
                  {notifications.length === 0 ? (
                    <div className="popover__empty">{dashboard.notifications.empty}</div>
                  ) : (
                    <motion.ul variants={listVariants} initial="hidden" animate="show">
                      <AnimatePresence initial={false}>
                        {notifications.map((alert) => (
                          <motion.li key={alert.id} variants={itemVariants} exit={{ opacity: 0, height: 0 }}>
                            <div className="pop-item">
                              <span
                                className="pop-item__icon"
                                style={{ background: `${severityColor(alert.severity)}1f` }}
                              >
                                <Icon name={alert.icon} size={16} color={severityColor(alert.severity)} />
                              </span>
                              <div>
                                <strong>{alert.title}</strong>
                                <p>{alert.description}</p>
                              </div>
                            </div>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </motion.ul>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          className="icon-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          aria-pressed={preferences.theme === 'dark'}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={preferences.theme}
              initial={{ opacity: 0, rotate: -70, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 70, scale: 0.6 }}
              transition={{ duration: 0.28 }}
              style={{ display: 'grid', placeItems: 'center' }}
            >
              <Icon name={preferences.theme === 'dark' ? 'moon' : 'sun'} size={18} />
            </motion.span>
          </AnimatePresence>
        </button>

        <div className="topbar__user">
          <span className="avatar">{initials(user?.name ?? dashboard.profile.name)}</span>
          <div className="topbar__user-text">
            <strong>{user?.name ?? dashboard.profile.name}</strong>
            <span>{user?.email ?? weather.persona.label}</span>
          </div>
          <button className="icon-btn" onClick={logout} aria-label="Sign out" title="Sign out">
            <Icon name="log-out" size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
