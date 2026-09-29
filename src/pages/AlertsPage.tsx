import { useState } from 'react'

import { alerts as alertRecords, dashboard } from '../data'
import { useAppState } from '../state/AppState'
import { severityColor } from '../lib/engine'
import { AlertsPanel } from '../components/dashboard/AlertsPanel'
import { Icon } from '../components/ui/Icon'
import type { AlertModel, ConditionMatcher, RuleSet } from '../types'

type Filter = 'all' | AlertModel['severity']

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All severities' },
  { id: 'extreme', label: 'Extreme' },
  { id: 'high', label: 'High' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'info', label: 'Info' },
]

const describeMatcher = (matcher: ConditionMatcher | undefined) => {
  if (!matcher) return ''
  if (matcher.gte !== undefined) return `≥ ${matcher.gte}`
  if (matcher.lte !== undefined) return `≤ ${matcher.lte}`
  if (matcher.gt !== undefined) return `> ${matcher.gt}`
  if (matcher.lt !== undefined) return `< ${matcher.lt}`
  if (matcher.eq !== undefined) return `= ${matcher.eq}`
  if (matcher.between) return `${matcher.between[0]}–${matcher.between[1]}`
  return ''
}

/** Turns a declarative rule into a readable line: "condition = heavy-rain | thunderstorm · rainProbability ≥ 80". */
const describeRule = (rule: RuleSet) => {
  const parts: string[] = []
  if (rule.condition) parts.push(`condition = ${[rule.condition].flat().join(' | ')}`)
  if (rule.timeOfDay) parts.push(`time = ${[rule.timeOfDay].flat().join(' | ')}`)

  for (const [key, matcher] of Object.entries(rule)) {
    if (key === 'condition' || key === 'timeOfDay') continue
    const readable = describeMatcher(matcher as ConditionMatcher | undefined)
    if (readable) parts.push(`${key} ${readable}`)
  }

  return parts.join('  ·  ')
}

export const AlertsPage = () => {
  const { model } = useAppState()
  const nav = dashboard.navigation.find((n) => n.id === 'alerts')
  const [filter, setFilter] = useState<Filter>('all')

  const countFor = (id: Filter) =>
    id === 'all' ? model.alerts.length : model.alerts.filter((alert) => alert.severity === id).length

  return (
    <div className="page">
      <header className="page-title">
        <div>
          <h1>{nav?.label ?? 'Alerts'}</h1>
          <p className="muted">{nav?.description}</p>
        </div>
        <span className="badge">{model.alerts.length} active alerts</span>
      </header>

      <div className="stack">
        <div className="filter-bar">
          {FILTERS.map((item) => {
            const count = countFor(item.id)
            const tone = item.id === 'all' ? 'var(--primary)' : severityColor(item.id as AlertModel['severity'])
            return (
              <button
                key={item.id}
                className={`chip filter-chip${filter === item.id ? ' is-active' : ''}`}
                onClick={() => setFilter(item.id)}
                style={filter === item.id ? { color: tone, borderColor: tone, background: `${tone}14` } : undefined}
              >
                {item.id !== 'all' && <span className="filter-chip__dot" style={{ background: tone }} />}
                {item.label}
                <span className="filter-chip__count">{count}</span>
              </button>
            )
          })}
        </div>

        <AlertsPanel severities={filter === 'all' ? undefined : [filter]} />

        <section className="stack">
          <div className="section-head">
            <div className="section-head__title">
              <span className="section-head__icon">
                <Icon name="list-checks" size={18} />
              </span>
              <div className="section-head__text">
                <h2>Trigger rules</h2>
                <p>Every rule in the alert engine — whether it fired or not</p>
              </div>
            </div>
          </div>

          <div className="card pad-lg rule-list">
            {alertRecords.map((record) => {
              const color = severityColor(record.severity)
              const fired = model.alerts.some((alert) => alert.id === record.id)
              return (
                <div className="rule-row" key={record.id} style={{ ['--rule-color' as string]: color }}>
                  <span className="rule-row__icon" style={{ background: `${color}1f`, color }}>
                    <Icon name={record.icon} size={16} />
                  </span>
                  <div className="rule-row__body">
                    <strong>{record.title}</strong>
                    <code className="rule-row__rule">{describeRule(record.when)}</code>
                  </div>
                  <span className="badge" style={{ color, background: `${color}1f` }}>
                    {record.severityLabel}
                  </span>
                  <span className={`badge ${fired ? 'badge--live' : ''}`} style={fired ? { color, background: `${color}1f` } : undefined}>
                    <Icon name={fired ? 'zap' : 'clock'} size={11} />
                    {fired ? 'Firing' : 'Idle'}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
