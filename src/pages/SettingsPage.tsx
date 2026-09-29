import { dashboard } from '../data'
import { useAppState } from '../state/AppState'
import { Icon } from '../components/ui/Icon'
import type { SettingGroup } from '../types'

const SettingsPage = () => {
  const { preferences, setUnits, setTheme, setExplainability, setPanelOpen, reset } = useAppState()

  const isOptionActive = (group: SettingGroup, optionId: string) => {
    if (group.id === 'units') return preferences.units === optionId
    if (group.id === 'appearance') return preferences.theme === optionId
    if (group.id === 'explainability') return preferences.explainability === optionId
    if (group.id === 'simulation') return preferences.panelOpen === (optionId === 'sticky')
    return false
  }

  const pick = (group: SettingGroup, optionId: string) => {
    if (group.id === 'units') setUnits(optionId === 'imperial' ? 'imperial' : 'metric')
    else if (group.id === 'appearance') setTheme(optionId === 'dark' ? 'dark' : 'light')
    else if (group.id === 'explainability') setExplainability(optionId === 'summary' ? 'summary' : 'full')
    else if (group.id === 'simulation') setPanelOpen(optionId === 'sticky')
  }

  return (
    <div className="page">
      <header className="page-title">
        <div>
          <h1>{dashboard.navigation.find((n) => n.id === 'settings')?.label ?? 'Settings'}</h1>
          <p className="muted">{dashboard.navigation.find((n) => n.id === 'settings')?.description}</p>
        </div>
        <span className="badge">{dashboard.version}</span>
      </header>

      <div className="stack">
        {dashboard.settings.map((group) => (
          <section className="stack" key={group.id}>
            <div className="section-head">
              <div className="section-head__title">
                <span className="section-head__icon">
                  <Icon name={group.icon} size={18} />
                </span>
                <div className="section-head__text">
                  <h2>{group.title}</h2>
                  <p>{group.description}</p>
                </div>
              </div>
            </div>

            <div className="grid-2" style={{ display: 'grid', gap: 'var(--gap-4)' }}>
              {group.options.map((option) => {
                const active = isOptionActive(group, option.id)
                return (
                  <button
                    key={option.id}
                    className="card pad-lg rec-card"
                    onClick={() => pick(group, option.id)}
                    aria-pressed={active}
                    style={{
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderColor: active ? 'var(--primary)' : undefined,
                      boxShadow: active ? '0 0 0 1px var(--primary)' : undefined,
                    }}
                  >
                    <header className="rec-card__head">
                      <span
                        className="rec-card__icon"
                        style={{
                          background: active ? 'var(--primary-soft)' : 'var(--glass-subtle)',
                          color: active ? 'var(--primary)' : 'var(--text-2)',
                        }}
                      >
                        <Icon name={option.icon} size={18} />
                      </span>
                      <div>
                        <h3 className="rec-card__title">{option.label}</h3>
                        <span className="tiny muted">{option.description}</span>
                      </div>
                      {active && (
                        <span className="badge" style={{ marginLeft: 'auto', color: 'var(--primary)' }}>
                          <Icon name="check" size={12} />
                          Active
                        </span>
                      )}
                    </header>
                  </button>
                )
              })}
            </div>
          </section>
        ))}

        <section className="stack">
          <div className="section-head">
            <div className="section-head__title">
              <span className="section-head__icon">
                <Icon name="refresh-cw" size={18} />
              </span>
              <div className="section-head__text">
                <h2>Reset</h2>
                <p>Restore every option to its default value in one click</p>
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ display: 'grid', gap: 'var(--gap-4)' }}>
            <button
              className="card pad-lg rec-card"
              style={{ textAlign: 'left', cursor: 'pointer' }}
              onClick={() => reset()}
            >
              <header className="rec-card__head">
                <span className="rec-card__icon" style={{ background: 'rgba(37, 99, 235, 0.12)', color: 'var(--primary)' }}>
                  <Icon name="sliders-horizontal" size={18} />
                </span>
                <div>
                  <h3 className="rec-card__title">Reset simulation</h3>
                  <span className="tiny muted">Persona, condition, time, location and every slider</span>
                </div>
              </header>
              <p className="rec-card__desc">
                Returns the simulation to its starting state — Bengaluru, morning, runner, partly cloudy.
              </p>
            </button>

            <button
              className="card pad-lg rec-card"
              style={{ textAlign: 'left', cursor: 'pointer' }}
              onClick={() => {
                setUnits('metric')
                setTheme('light')
                setExplainability('full')
                setPanelOpen(true)
              }}
            >
              <header className="rec-card__head">
                <span className="rec-card__icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success, #10b981)' }}>
                  <Icon name="shuffle" size={18} />
                </span>
                <div>
                  <h3 className="rec-card__title">Restore default settings</h3>
                  <span className="tiny muted">Metric units · light theme · full explanations · panel open</span>
                </div>
              </header>
              <p className="rec-card__desc">
                Theme, units, explainability depth and panel state are all returned to the shipped defaults.
              </p>
            </button>
          </div>
        </section>

        <div className="card pad-lg empty-state">
          <Icon name="database" size={22} />
          <strong>Preferences are stored locally</strong>
          <p>
            Theme, units, explainability depth and panel state are saved automatically — along with your account —
            privately on this device.
          </p>
        </div>
      </div>
    </div>
  )
}

export { SettingsPage }
