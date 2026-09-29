import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

import { useAppState } from '../../state/AppState'
import { Icon } from '../ui/Icon'
import { SectionHead } from '../ui/SectionHead'
import { containerVariants, itemVariants } from '../../lib/motion'

type Entry = {
  id: string
  title: string
  icon: string
  confidence: number
  bullets: string[]
  source: string
}

const ExplainEntry = ({ entry }: { entry: Entry }) => {
  const [open, setOpen] = useState(false)

  return (
    <motion.article className="explain-entry" variants={itemVariants} layout>
      <header className="explain-entry__head">
        <span className="widget-card__icon" style={{ background: 'var(--glass-subtle)' }}>
          <Icon name={entry.icon} size={15} />
        </span>
        <strong>{entry.title}</strong>
        <span className="explain-entry__confidence">
          {entry.confidence}%
          <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Toggle factors">
            <Icon name={open ? 'chevron-up' : 'chevron-down'} size={14} />
          </button>
        </span>
      </header>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {entry.bullets.map((bullet) => (
                <p className="why-bullet" key={bullet}>
                  {bullet}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <span className="explain-entry__source">
        <Icon name="database" size={12} />
        {entry.source}
      </span>
    </motion.article>
  )
}

export const ExplainabilityPanel = () => {
  const { model, preferences, setExplainability } = useAppState()
  const { explanation } = model
  const [limit, setLimit] = useState(5)
  const full = preferences.explainability === 'full'

  return (
    <section className="stack">
      <SectionHead
        title="Why this dashboard looks like this"
        subtitle="Every generated card traces back to a rule, a threshold and a JSON source"
        icon="scan-eye"
        action={
          <div className="segmented" role="tablist" aria-label="Explainability depth">
            <button className={full ? 'is-active' : ''} onClick={() => setExplainability('full')} role="tab" aria-selected={full}>
              Full reasoning
            </button>
            <button className={!full ? 'is-active' : ''} onClick={() => setExplainability('summary')} role="tab" aria-selected={!full}>
              Summary only
            </button>
          </div>
        }
      />

      <div className="card pad-lg explain-card">
        <p className="tiny muted">
          <strong>{explanation.entries.length} cards generated</strong> from <code>src/data/*.json</code> for{' '}
          <strong>{model.weather.persona.label}</strong> in <strong>{model.weather.location.label}</strong> · resolved at{' '}
          {model.generatedAt} · no backend, no API keys.
        </p>

        <motion.div
          className="explain-list"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          key={`${model.weather.persona.id}-${model.weather.condition.id}`}
        >
          {explanation.entries.slice(0, limit).map((entry) => (
            <ExplainEntry key={entry.id} entry={entry} />
          ))}
        </motion.div>

        {limit < explanation.entries.length && (
          <button className="btn btn-ghost btn-sm" onClick={() => setLimit((v) => v + 5)}>
            <Icon name="plus" size={14} />
            Show {Math.min(5, explanation.entries.length - limit)} more
          </button>
        )}
      </div>
    </section>
  )
}
