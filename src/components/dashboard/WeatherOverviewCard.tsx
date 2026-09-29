import { motion } from 'framer-motion'

import { getSection } from '../../data'
import { useAppState } from '../../state/AppState'
import { Icon } from '../ui/Icon'
import { itemVariants, containerVariants } from '../../lib/motion'
import { formatTemperature, formatVisibility, formatWind } from '../../lib/format'
import type { UnitSystem } from '../../types'

const buildStats = (model: ReturnType<typeof useAppState>['model'], units: UnitSystem) => {
  const { weather, bands } = model
  return [
    { id: 'feels', icon: 'thermometer', label: 'Feels like', value: formatTemperature(weather.feelsLike, { units }), meta: 'Apparent temp' },
    { id: 'humidity', icon: 'droplets', label: 'Humidity', value: `${weather.humidity}%`, meta: bands.humidity?.label },
    { id: 'wind', icon: 'wind', label: 'Wind', value: formatWind(weather.wind, { units }), meta: bands.wind?.label },
    { id: 'aqi', icon: 'cloudy', label: 'AQI', value: String(weather.aqi), meta: bands.aqi?.label },
    { id: 'uv', icon: 'sun-medium', label: 'UV Index', value: String(weather.uv), meta: bands.uv?.label },
    { id: 'vis', icon: 'eye', label: 'Visibility', value: formatVisibility(weather.visibility, { units }), meta: bands.visibility?.label },
    { id: 'rain', icon: 'cloud-rain', label: 'Rain chance', value: `${weather.rainProbability}%`, meta: bands.rainProbability?.label },
    { id: 'cloud', icon: 'cloud', label: 'Cloud cover', value: `${weather.cloudCover}%`, meta: `${weather.precipitation} mm expected` },
  ]
}

export const WeatherOverviewCard = () => {
  const { model, preferences } = useAppState()
  const { weather, risk } = model
  const section = getSection('overview')
  const stats = buildStats(model, preferences.units)

  return (
    <motion.section
      className="weather-hero"
      initial={{ opacity: 0, y: 26, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      style={
        {
          '--accent-from': weather.condition.gradient[0],
          '--accent-to': weather.condition.gradient[1],
        } as React.CSSProperties
      }
    >
      <div className="weather-hero__top">
        <div className="weather-hero__place">
          <Icon name="map-pin" size={17} />
          <div>
            <h2>
              {weather.location.label}, {weather.location.country}
            </h2>
            <p>
              {section.subtitle} · {weather.location.coordinates}
            </p>
          </div>
        </div>
        <div className="weather-hero__chips">
          <span className="hero-chip">
            <Icon name={weather.persona.icon} size={14} />
            {weather.persona.label}
          </span>
          <span className="hero-chip">
            <Icon name={weather.timeOfDay.icon} size={14} />
            {weather.timeOfDay.label}
          </span>
          <span className="hero-chip">
            <Icon name="shield-alert" size={14} />
            Risk {risk.level.label}
          </span>
        </div>
      </div>

      <div className="weather-hero__main">
        <div className="weather-hero__temp">
          {formatTemperature(weather.temperature, { units: preferences.units })}
        </div>
        <div className="weather-hero__cond">
          <strong>{weather.condition.label}</strong>
          <span>{weather.condition.summary}</span>
        </div>
        <div className="weather-hero__icon">
          <Icon name={weather.condition.icon} size={92} strokeWidth={1.35} />
        </div>
      </div>

      <motion.div className="weather-stats" variants={containerVariants} initial="hidden" animate="show" key={weather.condition.id + weather.location.id + weather.timeOfDay.id}>
        {stats.map((stat) => (
          <motion.div className="weather-stat" key={stat.id} variants={itemVariants}>
            <span className="weather-stat__label">
              <Icon name={stat.icon} size={13} />
              {stat.label}
            </span>
            <span className="weather-stat__value">{stat.value}</span>
            <span className="weather-stat__meta">{stat.meta}</span>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  )
}
