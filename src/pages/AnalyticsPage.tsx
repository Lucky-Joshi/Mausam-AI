import { useMemo } from 'react'

import { dashboard, personas } from '../data'
import { useAppState } from '../state/AppState'
import { buildDashboardModel } from '../lib/engine'
import { ChartCard } from '../components/dashboard/ChartCard'
import { RiskMeter } from '../components/dashboard/RiskMeter'
import { ExplainabilityPanel } from '../components/dashboard/ExplainabilityPanel'
import { Icon } from '../components/ui/Icon'

export const AnalyticsPage = () => {
  const { sim, model, setPersona } = useAppState()
  const nav = dashboard.navigation.find((n) => n.id === 'analytics')

  /** Same simulation, one model per persona — side-by-side risk comparison. */
  const comparison = useMemo(() => {
    return personas
      .map((persona) => {
        const snapshot = buildDashboardModel({ ...sim, persona: persona.id })
        return {
          persona,
          risk: snapshot.risk,
          alerts: snapshot.alerts.length,
          widgets: snapshot.widgets.length,
          recommendations: snapshot.recommendations.length,
        }
      })
      .sort((a, b) => b.risk.index - a.risk.index)
  }, [sim])

  return (
    <div className="page">
      <header className="page-title">
        <div>
          <h1>{nav?.label ?? 'Analytics'}</h1>
          <p className="muted">{nav?.description}</p>
        </div>
        <span className="badge">
          Risk {model.risk.index}/100 · {model.risk.level.label}
        </span>
      </header>

      <div className="stack">
        <ChartCard />
        <RiskMeter />

        <section className="stack">
          <div className="section-head">
            <div className="section-head__title">
              <span className="section-head__icon">
                <Icon name="users" size={18} />
              </span>
              <div className="section-head__text">
                <h2>Persona comparison</h2>
                <p>Your current conditions evaluated for all five personas — tap a row to switch the live dashboard</p>
              </div>
            </div>
          </div>

          <div className="card pad-lg persona-table">
            <div className="persona-row persona-row--head">
              <span>Persona</span>
              <span>Risk index</span>
              <span>Level</span>
              <span>Alerts</span>
              <span>Cards</span>
            </div>

            {comparison.map((row) => {
              const isActive = row.persona.id === sim.persona
              return (
                <button
                  key={row.persona.id}
                  className={`persona-row${isActive ? ' is-active' : ''}`}
                  onClick={() => setPersona(row.persona.id)}
                  style={{ ['--persona' as string]: row.persona.accent }}
                >
                  <span className="persona-row__name">
                    <span className="persona-row__icon">
                      <Icon name={row.persona.icon} size={16} />
                    </span>
                    <span>
                      <strong>{row.persona.label}</strong>
                      <em>{isActive ? 'Active now' : row.persona.shortLabel}</em>
                    </span>
                  </span>

                  <span className="persona-row__bar">
                    <span className="persona-row__track">
                      <span
                        className="persona-row__fill"
                        style={{ width: `${row.risk.index}%`, background: row.risk.level.color }}
                      />
                    </span>
                    <code>{row.risk.index}</code>
                  </span>

                  <span className="badge" style={{ color: row.risk.level.color, background: `${row.risk.level.color}1f` }}>
                    {row.risk.level.label}
                  </span>

                  <span className="persona-row__stat">
                    <Icon name="bell-ring" size={13} />
                    {row.alerts}
                  </span>

                  <span className="persona-row__stat">
                    <Icon name="layout-grid" size={13} />
                    {row.widgets}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="stack">
          <div className="section-head">
            <div className="section-head__title">
              <span className="section-head__icon">
                <Icon name="sparkles" size={18} />
              </span>
              <div className="section-head__text">
                <h2>Live output for {model.weather.persona.label}</h2>
                <p>Live counts for the active persona, updated with every change</p>
              </div>
            </div>
          </div>

          <div className="day-grid">
            {[
              { id: 'recs', icon: 'leaf', label: 'Recommendations', value: String(model.recommendations.length) },
              { id: 'alerts', icon: 'bell-ring', label: 'Firing alerts', value: String(model.alerts.length) },
              { id: 'widgets', icon: 'layout-grid', label: 'Active widgets', value: String(model.widgets.length) },
              { id: 'forecast', icon: 'calendar-days', label: 'Forecast days', value: String(model.forecast.length) },
              { id: 'series', icon: 'chart-line', label: 'Series points', value: String(model.series.length) },
              { id: 'entries', icon: 'scan-eye', label: 'Explanation entries', value: String(model.explanation.entries.length) },
              { id: 'confidence', icon: 'gauge', label: 'Insight confidence', value: `${model.insight.confidence}%` },
              { id: 'severity', icon: 'triangle-alert', label: 'Weather severity', value: `${Math.round(model.weather.severity * 100)}%` },
            ].map((item) => (
              <div className="card pad day-cell" key={item.id}>
                <span className="day-cell__label">
                  <Icon name={item.icon} size={13} />
                  {item.label}
                </span>
                <strong className="day-cell__value">{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <ExplainabilityPanel />
      </div>
    </div>
  )
}
