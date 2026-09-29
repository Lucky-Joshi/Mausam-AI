import { useMemo, useState } from 'react'

import { dashboard, locations, simulation } from '../data'
import { useAppState } from '../state/AppState'
import { applyDeltas, resolveBaseline } from '../lib/engine'
import { clamp01, formatTemperatureWithUnit, formatWind } from '../lib/format'
import type { NumberRange, TunableMetric, UnitSystem } from '../types'
import { Icon } from '../components/ui/Icon'

/** Schematic framing box — pins are projected from the JSON coordinate strings. */
const FRAME = { latMin: 6.5, latMax: 37, lngMin: 68, lngMax: 97.5 }

const project = (coordinates: string) => {
  const match = coordinates.match(/([\d.]+)°\s*([NS]).*?([\d.]+)°\s*([EW])/)
  if (!match) return { x: 50, y: 50 }
  const lat = Number(match[1]) * (match[2] === 'S' ? -1 : 1)
  const lng = Number(match[3]) * (match[4] === 'W' ? -1 : 1)
  const x = ((lng - FRAME.lngMin) / (FRAME.lngMax - FRAME.lngMin)) * 100
  const y = 100 - ((lat - FRAME.latMin) / (FRAME.latMax - FRAME.latMin)) * 100
  return { x: 8 + clamp01(x / 100) * 84, y: 8 + clamp01(y / 100) * 82 }
}

/** Higher reads as "hotter" on the pin ramp — matching how the slider ranges escalate. */
const heatColor = (t: number) => `hsl(${Math.round(148 - 144 * clamp01(t))} 76% 48%)`

const formatMetric = (key: string, value: number, units: UnitSystem) => {
  switch (key) {
    case 'temperature':
      return formatTemperatureWithUnit(value, { units })
    case 'wind':
      return formatWind(value, { units })
    case 'aqi':
      return `${Math.round(value)} AQI`
    case 'uv':
      return `UV ${Math.round(value)}`
    default:
      return `${Math.round(value)}%`
  }
}

/** Defensive only — simulation.json always ships the full range set. */
const FALLBACK_RANGE: NumberRange = { min: 0, max: 100, step: 1 }

export const MapsPage = () => {
  const { sim, model, preferences, setLocation } = useAppState()
  const nav = dashboard.navigation.find((n) => n.id === 'maps')
  const layers = simulation.controls.filter((control) => control.group === 'atmosphere')
  const [layerKey, setLayerKey] = useState(layers[0]?.key ?? 'aqi')
  const [selectedOverride, setSelectedOverride] = useState<string | null>(null)
  const [trackedLocation, setTrackedLocation] = useState(sim.location)

  // Follow the active location when it changes elsewhere (Topbar, simulation panel).
  if (trackedLocation !== sim.location) {
    setTrackedLocation(sim.location)
    setSelectedOverride(null)
  }

  const selected = selectedOverride ?? sim.location
  const selectCity = (id: string) => setSelectedOverride(id)

  const layer = layers.find((control) => control.key === layerKey) ?? layers[0]
  const range = simulation.ranges[layerKey as TunableMetric] ?? FALLBACK_RANGE

  const rows = useMemo(
    () =>
      locations.map((location) => {
        const resolved = applyDeltas(resolveBaseline({ ...sim, location: location.id }), sim.deltas)
        const value = Number(resolved[layerKey as keyof typeof resolved] ?? 0)
        return { location, resolved, value, ...project(location.coordinates) }
      }),
    [sim, layerKey],
  )

  const ranked = [...rows].sort((a, b) => b.value - a.value)
  const current = rows.find((row) => row.location.id === selected) ?? rows[0]
  const span = Math.max(1, range.max - range.min)
  const layerTone = heatColor((current.value - range.min) / span)

  return (
    <div className="page">
      <header className="page-title">
        <div>
          <h1>{nav?.label ?? 'Maps'}</h1>
          <p className="muted">{nav?.description}</p>
        </div>
        <span className="badge">
          <Icon name="map" size={12} />
          {locations.length} cities · schematic
        </span>
      </header>

      <div className="map-layout">
        <section className="card pad-lg map-card">
          <div className="map-toolbar">
            <div className="map-layers">
              {layers.map((control) => (
                <button
                  key={control.key}
                  className={`chip map-layer${control.key === layerKey ? ' is-active' : ''}`}
                  onClick={() => setLayerKey(control.key)}
                  title={control.hint}
                >
                  <Icon name={control.icon} size={13} />
                  {control.label}
                </button>
              ))}
            </div>
            <span className="tiny muted">{simulation.labels.live}</span>
          </div>

          <div className="map-canvas">
            <span className="map-blob map-blob--1" />
            <span className="map-blob map-blob--2" />
            <span className="map-blob map-blob--3" />

            {rows.map((row) => {
              const t = (row.value - range.min) / span
              const isActive = row.location.id === sim.location
              const isSelected = row.location.id === selected
              return (
                <button
                  key={row.location.id}
                  className={`map-marker${isActive ? ' is-active' : ''}${isSelected ? ' is-selected' : ''}`}
                  style={{ left: `${row.x}%`, top: `${row.y}%`, ['--pin' as string]: heatColor(t) }}
                  onClick={() => selectCity(row.location.id)}
                  aria-label={`${row.location.label} — ${formatMetric(layerKey, row.value, preferences.units)}`}
                >
                  <span className="map-marker__dot" />
                  <span className="map-marker__label">{row.location.label}</span>
                </button>
              )
            })}

            <div className="map-legend">
              <span className="tiny muted">
                {layer?.label} · {simulation.units[layerKey as keyof typeof simulation.units]}
              </span>
              <span className="map-legend__scale" style={{ background: `linear-gradient(90deg, ${heatColor(0)}, ${heatColor(0.5)}, ${heatColor(1)})` }} />
              <span className="tiny muted">
                {range.min} → {range.max}
              </span>
            </div>
          </div>

          <p className="tiny muted map-note">
            <Icon name="map-pin" size={12} /> Pins are projected from <code>coordinates</code> in{' '}
            <code>src/data/locations.json</code> — no external map tiles are loaded.
          </p>
        </section>

        <aside className="stack map-side">
          <section className="card pad-lg stack" style={{ gap: 'var(--gap-4)' }}>
            <header className="map-city__head">
              <div>
                <h2>{current.location.label}</h2>
                <p className="muted tiny">
                  {current.location.region} · {current.location.timezone}
                </p>
              </div>
              <span className="badge" style={{ color: layerTone, background: `${layerTone}1f` }}>
                {formatMetric(layerKey, current.value, preferences.units)}
              </span>
            </header>

            <dl className="map-metrics">
              <div>
                <dt>Condition</dt>
                <dd>
                  <Icon name={model.weather.condition.icon} size={14} />
                  {model.weather.condition.label}
                </dd>
              </div>
              <div>
                <dt>Coordinates</dt>
                <dd>{current.location.coordinates}</dd>
              </div>
              <div>
                <dt>Sunrise</dt>
                <dd>{current.location.sunrise}</dd>
              </div>
              <div>
                <dt>Sunset</dt>
                <dd>{current.location.sunset}</dd>
              </div>
            </dl>

            <div className="map-range">
              <div className="map-range__label tiny muted">
                <span>{layer?.label} across the network</span>
                <span>
                  {formatMetric(layerKey, current.value, preferences.units)} ·{' '}
                  {Math.round(((current.value - range.min) / span) * 100)}%
                </span>
              </div>
              <div className="map-range__track">
                <span
                  className="map-range__fill"
                  style={{ width: `${clamp01((current.value - range.min) / span) * 100}%`, background: layerTone }}
                />
              </div>
            </div>

            <button
              className={`btn ${selected === sim.location ? 'btn-soft' : 'btn-primary'} btn-block`}
              disabled={selected === sim.location}
              onClick={() => setLocation(selected)}
            >
              <Icon name={selected === sim.location ? 'check' : 'map-pin'} size={15} />
              {selected === sim.location ? 'Active location' : `Set ${current.location.label} as my location`}
            </button>
          </section>

          <section className="card pad-lg stack" style={{ gap: 'var(--gap-3)' }}>
            <div className="section-head">
              <div className="section-head__title">
                <span className="section-head__icon">
                  <Icon name="list-checks" size={16} />
                </span>
                <div className="section-head__text">
                  <h2>Ranked by {layer?.label}</h2>
                  <p>Highest reading first — select a row to focus it on the map</p>
                </div>
              </div>
            </div>

            {ranked.map((row) => {
              const t = clamp01((row.value - range.min) / span)
              const tone = heatColor(t)
              const isActive = row.location.id === sim.location
              return (
                <button
                  key={row.location.id}
                  className={`map-rank${row.location.id === selected ? ' is-selected' : ''}`}
                  onClick={() => selectCity(row.location.id)}
                >
                  <span className="map-rank__name">
                    <strong>{row.location.label}</strong>
                    <span className="tiny muted">{isActive ? 'Your location' : row.location.region}</span>
                  </span>
                  <span className="map-rank__bar">
                    <span style={{ width: `${Math.max(6, t * 100)}%`, background: tone }} />
                  </span>
                  <span className="map-rank__value" style={{ color: tone }}>
                    {formatMetric(layerKey, row.value, preferences.units)}
                  </span>
                </button>
              )
            })}
          </section>
        </aside>
      </div>
    </div>
  )
}
