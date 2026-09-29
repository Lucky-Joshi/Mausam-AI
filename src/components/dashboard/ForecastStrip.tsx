import { motion } from 'framer-motion'

import { getSection } from '../../data'
import { useAppState } from '../../state/AppState'
import { formatTemperature } from '../../lib/format'
import { Icon } from '../ui/Icon'
import { SectionHead } from '../ui/SectionHead'
import { containerVariants, itemVariants } from '../../lib/motion'

export const ForecastStrip = () => {
  const { model, preferences } = useAppState()
  const section = getSection('forecast')
  const units = preferences.units

  return (
    <section className="stack">
      <SectionHead
        title={section?.title ?? '7-Day Forecast'}
        subtitle={section?.subtitle ?? ''}
        icon={section?.icon ?? 'calendar-days'}
        action={<span className="badge">{model.weather.location.label}</span>}
      />
      <motion.div
        className="forecast-strip"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        key={`${model.weather.condition.id}-${model.weather.location.id}`}
      >
        {model.forecast.map((day) => (
          <motion.article
            className={`forecast-card${day.id === 'day-0' ? ' is-today' : ''}`}
            key={day.id}
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div>
              <div className="forecast-card__day">{day.day}</div>
              <div className="forecast-card__date">{day.date}</div>
            </div>
            <div
              className="forecast-card__icon"
              style={{ background: `linear-gradient(150deg, ${day.gradient[0]}, ${day.gradient[1]})` }}
            >
              <Icon name={day.icon} size={22} strokeWidth={1.6} />
            </div>
            <div className="forecast-card__temp">
              {formatTemperature(day.high, { units })}{' '}
              <span>{formatTemperature(day.low, { units })}</span>
            </div>
            <div className="forecast-card__meta">
              <div className="forecast-card__meta-row">
                <span>
                  <Icon name="cloud-rain" size={11} /> Rain
                </span>
                <strong>{day.rain}%</strong>
              </div>
              <div className="forecast-card__meta-row">
                <span>
                  <Icon name="sun-medium" size={11} /> UV
                </span>
                <strong>{day.uv}</strong>
              </div>
              <div className="forecast-card__meta-row">
                <span>
                  <Icon name="wind" size={11} /> AQI
                </span>
                <strong>{day.aqi}</strong>
              </div>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </section>
  )
}
