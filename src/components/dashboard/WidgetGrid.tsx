import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

import { getSection } from '../../data'
import { useAppState } from '../../state/AppState'
import { Icon } from '../ui/Icon'
import { SectionHead } from '../ui/SectionHead'
import { containerVariants, itemVariants } from '../../lib/motion'
import type { WidgetModel } from '../../types'

const WidgetCard = ({ widget }: { widget: WidgetModel }) => {
  const { preferences } = useAppState()
  const [open, setOpen] = useState(false)
  const showWhy = open || preferences.explainability === 'full'

  return (
    <motion.article
      className={`card widget-card${widget.size === 'wide' ? ' wide' : ''}`}
      variants={itemVariants}
      layout
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
    >
      <header className="widget-card__head">
        <span className="widget-card__icon" style={{ background: `${widget.accent}1f`, color: widget.accent }}>
          <Icon name={widget.icon} size={16} />
        </span>
        <span className="widget-card__label">{widget.label}</span>
        <span className="widget-card__source">
          <Icon name="scan-eye" size={12} /> {widget.confidence}%
        </span>
      </header>

      <div className="widget-card__value">
        <strong>{widget.displayValue}</strong>
        <span style={{ color: widget.color }}>{widget.stateLabel}</span>
      </div>

      <p className="widget-card__detail">{widget.detail}</p>

      {widget.items.length > 0 && (
        <ul className="widget-card__items">
          {widget.items.map((item) => (
            <li className="widget-card__item" key={item.id}>
              {item.text}
            </li>
          ))}
        </ul>
      )}

      <div className="meter meter--sm">
        <motion.div
          className="meter__fill"
          initial={{ width: 0 }}
          animate={{ width: `${Math.round(widget.progress * 100)}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: widget.color }}
        />
      </div>

      <AnimatePresence initial={false}>
        {showWhy && widget.why.bullets.length > 0 && (
          <motion.div
            className="widget-card__why"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="why-bullet">{widget.why.headline}</p>
            <ul className="widget-card__why-bullets">
              {widget.why.bullets.map((bullet) => (
                <li className="why-bullet" key={bullet}>
                  {bullet}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="widget-card__head" style={{ marginTop: 'auto' }}>
        <span className="widget-card__source">{widget.source}</span>
        <button className="widget-card__why-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <Icon name={preferences.explainability === 'full' ? 'chevron-up' : 'chevron-down'} size={13} />
          {showWhy ? 'Hide' : 'Why'}
        </button>
      </footer>
    </motion.article>
  )
}

export const WidgetGrid = () => {
  const { model } = useAppState()
  const section = getSection('widgets')

  return (
    <section className="stack">
      <SectionHead
        title={section?.title ?? 'Dynamic Widgets'}
        subtitle={section?.subtitle ?? ''}
        icon={section?.icon ?? 'layout-grid'}
        action={
          <span className="badge">
            <Icon name="user-round" size={12} />
            {model.weather.persona.label} set
          </span>
        }
      />
      <motion.div
        className="widget-grid"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        key={model.weather.persona.id}
      >
        {model.widgets.map((widget) => (
          <WidgetCard key={widget.id} widget={widget} />
        ))}
      </motion.div>
    </section>
  )
}
