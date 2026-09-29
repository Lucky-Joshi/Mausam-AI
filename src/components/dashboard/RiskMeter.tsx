import { motion } from 'framer-motion'

import { getSection, simulation } from '../../data'
import { useAppState } from '../../state/AppState'
import { Icon } from '../ui/Icon'
import { SectionHead } from '../ui/SectionHead'
import { itemVariants, listVariants } from '../../lib/motion'

const ARC_LENGTH = Math.PI * 90

const Gauge = ({ value, color }: { value: number; color: string }) => (
  <svg viewBox="0 0 200 118" role="img" aria-label={`Risk index ${value} of 100`} style={{ width: '100%', position: 'absolute', bottom: 0, left: 0 }}>
    <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="var(--line)" strokeWidth="13" strokeLinecap="round" />
    {simulation.riskLevels.map((level) => {
      const start = level.min / 100
      const next = simulation.riskLevels.find((l) => l.min > level.min)
      const end = next ? next.min / 100 : 1
      return (
        <path
          key={level.id}
          d="M 10 100 A 90 90 0 0 1 190 100"
          fill="none"
          stroke={level.color}
          strokeOpacity={0.24}
          strokeWidth="13"
          strokeDasharray={`${ARC_LENGTH * (end - start)} ${ARC_LENGTH}`}
          strokeDashoffset={-ARC_LENGTH * start}
        />
      )
    })}
    <motion.path
      d="M 10 100 A 90 90 0 0 1 190 100"
      fill="none"
      stroke={color}
      strokeWidth="13"
      strokeLinecap="round"
      strokeDasharray={ARC_LENGTH}
      initial={{ strokeDashoffset: ARC_LENGTH }}
      animate={{ strokeDashoffset: ARC_LENGTH * (1 - Math.min(100, value) / 100) }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
    />
  </svg>
)

export const RiskMeter = () => {
  const { model } = useAppState()
  const { risk } = model
  const section = getSection('risk')

  return (
    <section className="stack">
      <SectionHead
        title={section?.title ?? 'Risk Meter'}
        subtitle={section?.subtitle ?? ''}
        icon={section?.icon ?? 'gauge'}
        action={
          <span className="badge" style={{ color: risk.level.color, background: `${risk.level.color}1f` }}>
            <Icon name="shield-check" size={12} />
            {risk.level.label}
          </span>
        }
      />

      <div className="card pad-lg risk-card">
        <div className="risk-gauge">
          <Gauge value={risk.index} color={risk.level.color} />
          <div className="risk-gauge__center">
            <span className="risk-gauge__index" style={{ color: risk.level.color }}>
              {risk.index}
            </span>
            <span className="risk-gauge__caption">Risk index</span>
            <span className="risk-gauge__level" style={{ color: risk.level.color }}>
              {risk.level.label}
            </span>
          </div>
        </div>

        <div className="risk-body">
          <p className="small muted">{risk.headline}</p>

          <motion.div className="risk-factors" variants={listVariants} initial="hidden" animate="show">
            {risk.factors.map((factor) => (
              <motion.div className="risk-factor" key={factor.id} variants={itemVariants}>
                <span className="risk-factor__label">{factor.label}</span>
                <div className="meter">
                  <motion.div
                    className="meter__fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(factor.severity * 100)}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    style={{ background: risk.level.color }}
                  />
                </div>
                <span className="risk-factor__value">{Math.round(factor.contribution * 100)} pts</span>
              </motion.div>
            ))}
          </motion.div>

          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {simulation.riskLevels.map((level) => (
              <span
                key={level.id}
                className="chip"
                style={{
                  color: level.color,
                  opacity: level.id === risk.level.id ? 1 : 0.55,
                  borderColor: level.color,
                }}
                title={level.advice}
              >
                <i className="dot" style={{ background: level.color }} />
                {level.label} {level.min}+
              </span>
            ))}
          </div>

          {risk.next && (
            <p className="tiny muted">
              <Icon name="arrow-up" size={11} /> Next threshold: <strong>{risk.next.label}</strong> at index{' '}
              {risk.next.min}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
