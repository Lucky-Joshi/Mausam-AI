import { NavLink } from 'react-router-dom'

import { dashboard, getSection } from '../../data'
import { useAppState } from '../../state/AppState'
import { Icon } from '../ui/Icon'
import { listVariants, itemVariants } from '../../lib/motion'
import { motion } from 'framer-motion'

type SidebarProps = {
  open?: boolean
  onClose?: () => void
}

export const Sidebar = ({ open = false, onClose }: SidebarProps) => {
  const { model } = useAppState()
  const sections = dashboard.sections
  const overview = getSection('overview')

  return (
    <aside className={`sidebar${open ? ' is-open' : ''}`}>
      <div className="sidebar__brand">
        <div className="brand-mark">
          <Icon name="cloud-sun" size={21} strokeWidth={2.1} />
        </div>
        <div className="brand-text">
          <strong>{dashboard.appName}</strong>
          <span>{dashboard.tagline}</span>
        </div>
      </div>

      <div className="sidebar__group-label">Modules</div>
      <motion.nav
        className="nav-list"
        variants={listVariants}
        initial="hidden"
        animate="show"
        aria-label="Primary"
      >
        {dashboard.navigation.map((item) => (
          <motion.div key={item.id} variants={itemVariants}>
            <NavLink
              to={item.path}
              className={({ isActive }) => `nav-item${isActive ? ' is-active' : ''}`}
              title={item.description}
              onClick={onClose}
            >
              <Icon name={item.icon} size={18} />
              <span className="nav-item__label">{item.label}</span>
              {item.badge ? <span className="nav-item__badge">{item.badge}</span> : null}
            </NavLink>
          </motion.div>
        ))}
      </motion.nav>

      <div className="sidebar__group-label">Live context</div>
      <div className="nav-list">
        <div className="nav-item" aria-hidden>
          <Icon name={overview.icon} size={18} />
          <span className="nav-item__label">{model.weather.persona.label}</span>
          <span className="nav-item__badge">{sections.length}</span>
        </div>
      </div>

      <div className="sidebar__footer">
        <div className="sidebar__status">
          <span className="status-dot" />
          <div>
            <strong>Weather engine online</strong>
            <span>Synced · {dashboard.version}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
