import { conditions, dashboard, timeOfDaySlots } from '../data'
import { useAppState } from '../state/AppState'
import { daylightHours, formatTemperature, formatTemperatureWithUnit, formatWind } from '../lib/format'
import { WeatherOverviewCard } from '../components/dashboard/WeatherOverviewCard'
import { ChartCard } from '../components/dashboard/ChartCard'
import { ForecastStrip } from '../components/dashboard/ForecastStrip'
import { RecommendationPanel } from '../components/dashboard/RecommendationPanel'
import { Icon } from '../components/ui/Icon'

export const WeatherPage = () => {
  const { model, preferences, setCondition, setTimeOfDay } = useAppState()
  const { weather } = model
  const nav = dashboard.navigation.find((n) => n.id === 'weather')
  const units = preferences.units

  const dayDetails = [
    { id: 'feels', icon: 'thermometer', label: 'Feels like', value: formatTemperature(weather.feelsLike, { units }) },
    { id: 'precip', icon: 'cloud-rain', label: 'Precipitation', value: `${weather.precipitation} mm` },
    { id: 'cloud', icon: 'cloudy', label: 'Cloud cover', value: `${weather.cloudCover}%` },
    { id: 'wind', icon: 'wind', label: 'Wind', value: formatWind(weather.wind, { units }) },
    { id: 'sunrise', icon: 'sunrise', label: 'Sunrise', value: weather.location.sunrise },
    { id: 'sunset', icon: 'sunset', label: 'Sunset', value: weather.location.sunset },
    {
      id: 'daylight',
      icon: 'clock',
      label: 'Daylight left',
      value: daylightHours(weather.location.sunrise, weather.location.sunset),
    },
    {
      id: 'feel',
      icon: 'activity',
      label: 'Temperature read',
      value: formatTemperatureWithUnit(weather.temperature, { units }),
    },
  ]

  return (
    <div className="page">
      <header className="page-title">
        <div>
          <h1>{nav?.label ?? 'Weather'}</h1>
          <p className="muted">{nav?.description}</p>
        </div>
        <span className="badge">
          {weather.condition.label} · {weather.timeOfDay.label} · {weather.location.label}
        </span>
      </header>

      <div className="stack">
        <section className="card pad-lg stack ctx-card" style={{ gap: 'var(--gap-4)' }}>
          <div className="section-head">
            <div className="section-head__title">
              <span className="section-head__icon">
                <Icon name="cloud-sun" size={18} />
              </span>
              <div className="section-head__text">
                <h2>Change the conditions</h2>
                <p>Same controls as the simulation panel — the whole dashboard, forecast and alerts re-resolve instantly</p>
              </div>
            </div>
          </div>

          <div className="ctx-row">
            <span className="ctx-row__label">Condition</span>
            <div className="ctx-row__chips">
              {conditions.map((item) => (
                <button
                  key={item.id}
                  className={`chip ctx-chip${weather.condition.id === item.id ? ' is-active' : ''}`}
                  onClick={() => setCondition(item.id)}
                >
                  <Icon name={item.icon} size={13} />
                  {item.shortLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="ctx-row">
            <span className="ctx-row__label">Time of day</span>
            <div className="ctx-row__chips">
              {timeOfDaySlots.map((item) => (
                <button
                  key={item.id}
                  className={`chip ctx-chip${weather.timeOfDay.id === item.id ? ' is-active' : ''}`}
                  onClick={() => setTimeOfDay(item.id)}
                >
                  <Icon name={item.icon} size={13} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <WeatherOverviewCard />

        <section className="stack">
          <div className="section-head">
            <div className="section-head__title">
              <span className="section-head__icon">
                <Icon name="sun-medium" size={18} />
              </span>
              <div className="section-head__text">
                <h2>Day details</h2>
                <p>
                  {weather.location.region} · {weather.location.coordinates} · {weather.location.timezone}
                </p>
              </div>
            </div>
          </div>

          <div className="day-grid">
            {dayDetails.map((item) => (
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

        <ForecastStrip />
        <ChartCard />
        <RecommendationPanel />
      </div>
    </div>
  )
}
