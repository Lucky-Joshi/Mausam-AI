import { motion } from 'framer-motion'

import { dashboard, getSection } from '../../data'
import { useAppState } from '../../state/AppState'
import { Icon } from '../ui/Icon'
import { itemVariants, listVariants } from '../../lib/motion'

export const AIInsightCard = () => {
  const { model } = useAppState()
  const { insight } = model
  const section = getSection('insight')

  return (
    <motion.section className="card pad-lg insight" variants={itemVariants} initial="hidden" animate="show" layout>
      <div className="insight__head">
        <span className="eyebrow">
          <Icon name="sparkles" size={14} />
          {dashboard.insight.eyebrow}
        </span>
        <span className="badge accent insight__badge">{section.title}</span>
      </div>

      <motion.h3
        className="insight__title"
        key={insight.recommendation.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {insight.headline}
      </motion.h3>

      <p className="insight__body">{insight.reason}</p>

      <motion.div className="insight__metrics" variants={listVariants} initial="hidden" animate="show">
        <motion.div className="insight__metric" variants={itemVariants}>
          <span>{dashboard.insight.priorityLabel}</span>
          <strong className="small">{insight.priority}</strong>
        </motion.div>
        <motion.div className="insight__metric" variants={itemVariants}>
          <span>{dashboard.insight.confidenceLabel}</span>
          <strong>{insight.confidence}%</strong>
        </motion.div>
        <motion.div className="insight__metric" variants={itemVariants}>
          <span>Window</span>
          <strong className="small">{insight.recommendation.window}</strong>
        </motion.div>
      </motion.div>

      <div className="confidence-bar">
        <div className="confidence-bar__meta">
          <span>{dashboard.insight.confidenceLabel}</span>
          <span>{insight.confidence}%</span>
        </div>
        <div className="meter">
          <motion.div
            className="meter__fill"
            initial={{ width: 0 }}
            animate={{ width: `${insight.confidence}%` }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            style={{ background: 'linear-gradient(90deg, var(--primary), var(--violet))' }}
          />
        </div>
      </div>

      <div className="insight__foot">
        <span className="badge info">
          <Icon name="list-checks" size={12} />
          {insight.recommendation.action}
        </span>
        <span className="badge">
          <Icon name="database" size={12} />
          {insight.recommendation.id}
        </span>
        <span className="tiny muted">{dashboard.insight.disclaimer}</span>
      </div>
    </motion.section>
  )
}
