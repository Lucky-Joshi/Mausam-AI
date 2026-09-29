import { motion } from 'framer-motion'

import { conditions, locations, personas, simulation, timeOfDaySlots } from '../../data'
import { useAppState } from '../../state/AppState'
import { Icon } from '../ui/Icon'
import { panelVariants, listVariants, itemVariants } from '../../lib/motion'
import { formatTemperature, formatVisibility, kmhToMph } from '../../lib/format'
import type { ControlConfig, PersonaId, TunableMetric } from '../../types'

const CONTEXT_CONTROLS = simulation.controls.filter((control) => control.group === 'context')
const ATMOSPHERE_CONTROLS = simulation.controls.filter((control) => control.group === 'atmosphere')

const optionsFor = (source: ControlConfig['source']) => {
  switch (source) {
    case 'personas':
      return personas.map((item) => ({ value: item.id, label: item.label }))
    case 'conditions':
      return conditions.map((item) => ({ value: item.id, label: item.label }))
    case 'timeOfDay':
      return timeOfDaySlots.map((item) => ({ value: item.id, label: item.label }))
    case 'locations':
      return locations.map((item) => ({ value: item.id, label: `${item.label} · ${item.region}` }))
  }
}

export const SimulationPanel = ({ onClose }: { onClose: () => void }) => {
  const {
    sim,
    model,
    baseline,
    setMetric,
    setCondition,
    setPersona,
    setTimeOfDay,
    setLocation,
    applyScenario,
    reset,
    randomize,
    preferences,
  } = useAppState()

  const { weather } = model
  const imperial = preferences.units === 'imperial'

  /** Sliders keep their JSON metric scale; temperature and wind are mirrored
   *  into the selected unit system so what you drag is what you read. */
  const toDisplay = (key: TunableMetric, value: number) => {
    if (!imperial) return value
    if (key === 'temperature') return Math.round(value * 1.8 + 32)
    if (key === 'wind') return Math.round(kmhToMph(value))
    return value
  }
  const fromDisplay = (key: TunableMetric, value: number) => {
    if (!imperial) return value
    if (key === 'temperature') return Math.round((value - 32) / 1.8)
    if (key === 'wind') return Math.round(value / 0.621371)
    return value
  }

  const selectControl = (control: ControlConfig) => {
    const options = optionsFor(control.source)
    const value = String(sim[control.key])
    const onChange = (next: string) => {
      switch (control.key) {
        case 'persona':
          setPersona(next as PersonaId)
          break
        case 'condition':
          setCondition(next)
          break
        case 'timeOfDay':
          setTimeOfDay(next)
          break
        case 'location':
          setLocation(next)
          break
        default:
          break
      }
    }
    return (
      <div className="field" key={control.key}>
        <label className="field-label" htmlFor={`ctrl-${control.key}`}>
          <span className="row" style={{ gap: 7 }}>
            <Icon name={control.icon} size={14} />
            {control.label}
          </span>
        </label>
        <div className="select">
          <select id={`ctrl-${control.key}`} value={value} onChange={(event) => onChange(event.target.value)}>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="select__chevron">
            <Icon name="chevron-down" size={15} />
          </span>
        </div>
        <p className="field-hint">{control.hint}</p>
      </div>
    )
  }

  const sliderControl = (control: ControlConfig) => {
    const key = control.key as TunableMetric
    const range = simulation.ranges[key]
    const unit =
      imperial && key === 'temperature'
        ? '°F'
        : imperial && key === 'wind'
          ? ' mph'
          : (simulation.units[key] ?? control.unit ?? '')
    const min = toDisplay(key, range?.min ?? 0)
    const max = toDisplay(key, range?.max ?? 100)
    const value = toDisplay(key, sim[key])
    const fillPct = ((value - min) / Math.max(1, max - min)) * 100
    const baselineValue = toDisplay(key, baseline[key])

    return (
      <div className="field" key={control.key}>
        <label className="field-label" htmlFor={`ctrl-${control.key}`}>
          <span className="row" style={{ gap: 7 }}>
            <Icon name={control.icon} size={14} />
            {control.label}
          </span>
          <span className="field-value">
            {value}
            {unit}
          </span>
        </label>
        <input
          id={`ctrl-${control.key}`}
          className="range"
          type="range"
          min={min}
          max={max}
          step={range?.step ?? 1}
          value={value}
          style={{ ['--fill' as string]: `${fillPct}%` }}
          onChange={(event) => setMetric(key, fromDisplay(key, Number(event.target.value)))}
        />
        <p className="field-hint">
          {control.hint} · baseline {baselineValue}
          {unit}
        </p>
      </div>
    )
  }

  return (
    <motion.aside
      className="sim-panel"
      variants={panelVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      aria-label={simulation.labels.title}
    >
      <div className="sim-panel__head">
        <div className="sim-panel__title">
          <Icon name="sliders-horizontal" size={17} />
          <h2>{simulation.labels.title}</h2>
          <span className="live-pulse">
            <span className="dot" style={{ background: 'var(--success)' }} />
            {simulation.labels.live}
          </span>
          <button className="icon-btn" onClick={onClose} aria-label="Close simulation panel" style={{ width: 32, height: 32 }}>
            <Icon name="x" size={15} />
          </button>
        </div>
        <p className="sim-panel__desc">{simulation.labels.description}</p>
      </div>

      <div className="sim-panel__body">
        <div className="sim-group">
          <span className="sim-group__label">{simulation.labels.scenarios}</span>
          <div className="sim-scenarios">
            {simulation.scenarios.map((scenario) => (
              <button
                key={scenario.id}
                className="scenario-chip"
                onClick={() => applyScenario(scenario.id)}
                title={scenario.description}
              >
                <Icon name={scenario.icon} size={13} />
                {scenario.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sim-group">
          <span className="sim-group__label">{simulation.labels.context}</span>
          {CONTEXT_CONTROLS.map(selectControl)}
        </div>

        <div className="sim-group">
          <span className="sim-group__label">{simulation.labels.atmosphere}</span>
          {ATMOSPHERE_CONTROLS.map(sliderControl)}
        </div>

        <motion.div className="sim-derived" variants={listVariants} initial="hidden" animate="show" key={weather.condition.id + weather.timeOfDay.id}>
          <span className="sim-derived__label">
            <Icon name="cpu" size={13} />
            {simulation.labels.derived}
          </span>
          <p className="field-hint">{simulation.labels.derivedHint}</p>
          <motion.div className="sim-derived__grid" variants={itemVariants}>
            <div className="sim-derived__item">
              <span>Feels like</span>
              <strong>{formatTemperature(weather.feelsLike, { units: preferences.units })}</strong>
            </div>
            <div className="sim-derived__item">
              <span>Visibility</span>
              <strong>{formatVisibility(weather.visibility, { units: preferences.units })}</strong>
            </div>
            <div className="sim-derived__item">
              <span>Cloud cover</span>
              <strong>{weather.cloudCover}%</strong>
            </div>
            <div className="sim-derived__item">
              <span>Accumulation</span>
              <strong>{weather.precipitation} mm</strong>
            </div>
            <div className="sim-derived__item">
              <span>Sunrise</span>
              <strong>{weather.location.sunrise}</strong>
            </div>
            <div className="sim-derived__item">
              <span>Sunset</span>
              <strong>{weather.location.sunset}</strong>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="sim-panel__foot">
        <button className="btn btn-ghost btn-sm btn-block" onClick={reset}>
          <Icon name="rotate-cw" size={14} />
          {simulation.labels.reset}
        </button>
        <button className="btn btn-soft btn-sm btn-block" onClick={randomize}>
          <Icon name="shuffle" size={14} />
          {simulation.labels.randomize}
        </button>
      </div>
    </motion.aside>
  )
}
