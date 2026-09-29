import { dashboard, personas } from '../data'
import { useAppState } from '../state/AppState'
import { useAuth } from '../state/AuthState'
import { initials } from '../lib/format'
import { Icon } from '../components/ui/Icon'
import { WidgetGrid } from '../components/dashboard/WidgetGrid'

export const ProfilePage = () => {
  const { model, setPersona } = useAppState()
  const { user, logout } = useAuth()
  const { weather } = model
  const active = personas.find((p) => p.id === weather.persona.id)
  const displayName = user?.name ?? dashboard.profile.name

  return (
    <div className="page">
      <header className="page-title">
        <div>
          <h1>{dashboard.navigation.find((n) => n.id === 'profile')?.label ?? 'Profile'}</h1>
          <p className="muted">{dashboard.navigation.find((n) => n.id === 'profile')?.description}</p>
        </div>
        <span className="badge">{dashboard.profile.plan}</span>
      </header>

      <div className="stack">
        <div className="card pad-lg row" style={{ gap: 'var(--gap-5)', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="avatar" style={{ width: 64, height: 64, fontSize: '1.4rem' }}>
            {initials(displayName)}
          </span>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h2>{displayName}</h2>
            <p className="muted small">{user?.email ?? dashboard.profile.role}</p>
            <div className="rec-card__tags" style={{ marginTop: 8 }}>
              <span className="badge">
                <Icon name="map-pin" size={12} />
                {dashboard.profile.location}
              </span>
              <span className="badge" style={{ color: weather.persona.accent, background: `${weather.persona.accent}1f` }}>
                <Icon name={weather.persona.icon} size={12} />
                {weather.persona.label} persona
              </span>
            </div>
          </div>
          <div className="kv" style={{ minWidth: 240 }}>
            <div>
              <dt>Goal</dt>
              <dd>{active?.member.goal}</dd>
            </div>
            <div>
              <dt>Account</dt>
              <dd>{user ? `Joined ${user.joined}` : dashboard.profile.plan}</dd>
            </div>
            <div>
              <dt>Ideal window</dt>
              <dd>{active?.idealWindow}</dd>
            </div>
          </div>
          <button className="btn btn-soft btn-sm" onClick={logout}>
            <Icon name="log-out" size={15} />
            Sign out
          </button>
        </div>

        <section className="stack">
          <div className="section-head">
            <div className="section-head__title">
              <span className="section-head__icon">
                <Icon name="users" size={18} />
              </span>
              <div className="section-head__text">
                <h2>Switch persona</h2>
                <p>Widgets, recommendations and alerts rebuild for the selected profile</p>
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ display: 'grid', gap: 'var(--gap-4)' }}>
            {personas.map((persona) => (
              <button
                key={persona.id}
                className={`card pad-lg rec-card`}
                onClick={() => setPersona(persona.id)}
                style={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderColor: persona.id === weather.persona.id ? persona.accent : undefined,
                  boxShadow: persona.id === weather.persona.id ? `0 0 0 1px ${persona.accent}` : undefined,
                }}
              >
                <header className="rec-card__head">
                  <span className="rec-card__icon" style={{ background: `${persona.accent}1f`, color: persona.accent }}>
                    <Icon name={persona.icon} size={18} />
                  </span>
                  <div>
                    <h3 className="rec-card__title">{persona.label}</h3>
                    <span className="tiny muted">{persona.tagline}</span>
                  </div>
                </header>
                <p className="rec-card__desc">{persona.description}</p>
                <div className="rec-card__tags">
                  {persona.focus.map((tag) => (
                    <span className="badge" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="stack">
          <div className="section-head">
            <div className="section-head__title">
              <span className="section-head__icon">
                <Icon name="layout-grid" size={18} />
              </span>
              <div className="section-head__text">
                <h2>Your dashboard right now</h2>
                <p>
                  {model.widgets.length} widgets are active for the {weather.persona.label} persona — switch the persona
                  above and watch this set rebuild
                </p>
              </div>
            </div>
          </div>
          <WidgetGrid />
        </section>
      </div>
    </div>
  )
}
