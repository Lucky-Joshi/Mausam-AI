import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

import { getSection } from '../../data'
import { useAppState } from '../../state/AppState'
import { severityColor } from '../../lib/engine'
import { Icon } from '../ui/Icon'
import { SectionHead } from '../ui/SectionHead'
import { containerVariants, itemVariants } from '../../lib/motion'
import type { AlertModel } from '../../types'

const AlertCard = ({ alert }: { alert: AlertModel }) => {
  const color = severityColor(alert.severity)
  const [open, setOpen] = useState(alert.severity === 'extreme' || alert.severity === 'high')

  return (
    <motion.article
      className="card pad-lg alert-card"
      variants={itemVariants}
      layout
      whileHover={{ y: -3 }}
      style={{ ['--alert-color' as string]: color }}
    >
      <header className="alert-card__head">
        <span className="alert-card__icon" style={{ background: `${color}1f`, color }}>
          <Icon name={alert.icon} size={18} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 className="alert-card__title">{alert.title}</h3>
          <div className="rec-card__tags">
            <span className="badge" style={{ color, background: `${color}1f` }}>
              {alert.severityLabel}
            </span>
            <span className="tiny muted">{alert.category}</span>
          </div>
        </div>
        <button className="icon-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Toggle actions">
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} />
        </button>
      </header>

      <p className="alert-card__desc">{alert.description}</p>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="alert-card__actions"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {alert.actions.map((action) => (
              <span className="alert-card__action" key={action}>
                {action}
              </span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="alert-card__foot">
        <span>
          <Icon name="clock" size={12} /> {alert.issuedOffset}
        </span>
        <span>{alert.source}</span>
      </footer>
    </motion.article>
  )
}

export const AlertsPanel = ({ limit, severities }: { limit?: number; severities?: AlertModel['severity'][] }) => {
  const { model } = useAppState()
  const section = getSection('alerts')
  const filtered = severities?.length ? model.alerts.filter((alert) => severities.includes(alert.severity)) : model.alerts
  const alerts = limit ? filtered.slice(0, limit) : filtered
  const active = filtered.length > 0

  return (
    <section className="stack">
      <SectionHead
        title={section?.title ?? 'Alerts'}
        subtitle={section?.subtitle ?? ''}
        icon={section?.icon ?? 'bell-ring'}
        action={
          <span className="badge" style={{ color: active ? 'var(--danger)' : 'var(--success)' }}>
            <Icon name={active ? 'bell-ring' : 'circle-check'} size={12} />
            {active ? `${filtered.length} active` : 'All clear'}
          </span>
        }
      />
      <motion.div
        className="alert-grid"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        key={`${model.weather.condition.id}-${model.weather.persona.id}`}
      >
        {alerts.length === 0 ? (
          <div className="empty-state">
            <Icon name="shield-check" size={22} />
            <strong>No alerts</strong>
            <p>
              {severities?.length
                ? 'No alert at this severity matches the current simulation state.'
                : 'No alert rule matches the current simulation state.'}
            </p>
          </div>
        ) : (
          alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
        )}
      </motion.div>
    </section>
  )
}
