import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

import { getSection } from '../../data'
import { useAppState } from '../../state/AppState'
import { Icon } from '../ui/Icon'
import { SectionHead } from '../ui/SectionHead'
import { containerVariants, itemVariants } from '../../lib/motion'
import type { Recommendation } from '../../types'

const PRIORITY_TONE: Record<Recommendation['priority'], string> = {
  critical: 'var(--danger)',
  high: 'var(--warning)',
  medium: 'var(--info)',
  low: 'var(--text-3)',
}

const RecommendationCard = ({ rec, index }: { rec: Recommendation; index: number }) => {
  const [open, setOpen] = useState(index === 0)
  const color = PRIORITY_TONE[rec.priority]

  return (
    <motion.article className="card pad-lg rec-card" variants={itemVariants} layout whileHover={{ y: -3 }}>
      <header className="rec-card__head">
        <span className="rec-card__icon" style={{ background: `${color}1f`, color }}>
          <Icon name={rec.icon} size={18} />
        </span>
        <div style={{ minWidth: 0 }}>
          <h3 className="rec-card__title">{rec.title}</h3>
          <div className="rec-card__tags">
            <span className="badge" style={{ color, background: `${color}1f` }}>
              {rec.priorityLabel}
            </span>
            <span className="tiny muted">
              <Icon name="scan-eye" size={11} /> {rec.confidence}%
            </span>
          </div>
        </div>
      </header>

      <p className="rec-card__desc">{rec.description}</p>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="rec-card__why"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {rec.why.map((line) => (
              <p className="why-bullet" key={line}>
                {line}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="rec-card__foot">
        <span className="rec-card__window">
          <Icon name="clock" size={13} />
          {rec.window}
        </span>
        <button className="widget-card__why-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={13} />
          {open ? 'Hide' : 'Why'}
        </button>
      </footer>
    </motion.article>
  )
}

export const RecommendationPanel = () => {
  const { model } = useAppState()
  const section = getSection('recommendations')

  return (
    <section className="stack">
      <SectionHead
        title={section?.title ?? 'Recommendations'}
        subtitle={section?.subtitle ?? ''}
        icon={section?.icon ?? 'list-checks'}
        action={<span className="badge">{model.recommendations.length} active</span>}
      />
      <motion.div
        className="rec-grid"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        key={`${model.weather.persona.id}-${model.weather.condition.id}`}
      >
        {model.recommendations.length === 0 ? (
          <div className="empty-state">
            <Icon name="circle-check" size={22} />
            <strong>All clear</strong>
            <p>No recommendation rule is currently triggered for {model.weather.persona.label}.</p>
          </div>
        ) : (
          model.recommendations.map((rec, index) => (
            <RecommendationCard key={rec.id} rec={rec} index={index} />
          ))
        )}
      </motion.div>
    </section>
  )
}
