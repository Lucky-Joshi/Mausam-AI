/**
 * Mausam AI reasoning engine.
 *
 * Pure, synchronous and deterministic. Every number on screen is produced
 * here from `src/data/*.json` plus the current simulation state — there is no
 * hardcoded content in any React component.
 */

import {
  conditions,
  getCondition,
  getLocation,
  getPersona,
  getSection,
  getTimeOfDay,
  recommendations as recommendationData,
  alerts as alertData,
  simulation as simulationData,
  weather as weatherData,
  widgets as widgetData,
} from '../data'
import type {
  AlertModel,
  BandModel,
  DashboardModel,
  ForecastModel,
  Recommendation,
  ResolvedWeather,
  SeriesPoint,
  SeriesShape,
  SimulationDeltas,
  SimulationInput,
  SimulationState,
  Tone,
  WidgetDefinition,
  WidgetModel,
} from '../types'
import { TONE_COLOR, clamp, clamp01, formatClock, parseClock, round, seededRandom, toneFromColor } from './format'
import { buildMatcherBag, buildRisk, computeScore, feelingTemperature, matchFirst, matchesRule, resolveBand } from './rules'
import { createTokens, fill, fillAll } from './template'

const METRIC_KEYS = [
  'temperature',
  'humidity',
  'aqi',
  'rainProbability',
  'uv',
  'wind',
] as const

type MetricKeyOf = (typeof METRIC_KEYS)[number]

/* ------------------------------------------------------------------ *
 * Weather resolution
 * ------------------------------------------------------------------ */

export const resolveBaseline = (input: SimulationInput): ResolvedWeather => {
  const condition = getCondition(input.condition)
  const timeOfDay = getTimeOfDay(input.timeOfDay)
  const location = getLocation(input.location)
  const persona = getPersona(input.persona)

  const temperature = round(condition.temperature + timeOfDay.temperatureOffset + location.tempOffset)
  const humidity = clamp(
    Math.round(condition.humidity + timeOfDay.humidityOffset + location.humidityOffset),
    5,
    100,
  )
  const aqi = Math.max(5, Math.round(condition.aqi + timeOfDay.aqiOffset + location.aqiOffset))
  const uv = Math.max(0, round(condition.uv + timeOfDay.uvOffset + location.uvOffset))
  const wind = Math.max(0, round(condition.wind * timeOfDay.windFactor + location.windOffset))
  const visibility = Math.max(0.2, condition.visibility - Math.max(0, humidity - 70) * 0.06)
  const rainProbability = clamp(Math.round(condition.rainProbability), 0, 100)

  const resolved: ResolvedWeather = {
    temperature,
    humidity,
    aqi,
    uv,
    wind,
    visibility: round(visibility, 1),
    rainProbability,
    precipitation: condition.precipitation,
    cloudCover: condition.cloudCover,
    feelsLike: 0,
    condition,
    timeOfDay,
    location,
    persona,
    severity: condition.severity,
  }
  resolved.feelsLike = round(feelingTemperature(resolved.temperature, resolved.humidity, resolved.wind))
  return resolved
}

export const applyDeltas = (baseline: ResolvedWeather, deltas: SimulationDeltas): ResolvedWeather => {
  const next: ResolvedWeather = {
    ...baseline,
    temperature: round(clamp(baseline.temperature + (deltas.temperature ?? 0), -25, 60)),
    humidity: round(clamp(baseline.humidity + (deltas.humidity ?? 0), 5, 100)),
    aqi: Math.round(clamp(baseline.aqi + (deltas.aqi ?? 0), 5, 500)),
    uv: round(clamp(baseline.uv + (deltas.uv ?? 0), 0, 14)),
    wind: round(clamp(baseline.wind + (deltas.wind ?? 0), 0, 90)),
    rainProbability: round(clamp(baseline.rainProbability + (deltas.rainProbability ?? 0), 0, 100)),
  }
  next.feelsLike = round(feelingTemperature(next.temperature, next.humidity, next.wind))
  return next
}

/** Reads the six user-tunable metrics out of a resolved weather object. */
export const metricValues = (weather: ResolvedWeather): Record<MetricKeyOf, number> => ({
  temperature: weather.temperature,
  humidity: weather.humidity,
  aqi: weather.aqi,
  rainProbability: weather.rainProbability,
  uv: weather.uv,
  wind: weather.wind,
})

export const deltasFromInput = (weather: ResolvedWeather, input: SimulationInput): SimulationDeltas => {
  const values = metricValues(weather)
  const deltas: SimulationDeltas = {}
  for (const key of METRIC_KEYS) {
    deltas[key] = input[key] - values[key]
  }
  return deltas
}

export const inputFromState = (state: SimulationState): SimulationInput => ({
  persona: state.persona,
  condition: state.condition,
  timeOfDay: state.timeOfDay,
  location: state.location,
  temperature: state.temperature,
  humidity: state.humidity,
  aqi: state.aqi,
  rainProbability: state.rainProbability,
  uv: state.uv,
  wind: state.wind,
})

/* ------------------------------------------------------------------ *
 * Bands
 * ------------------------------------------------------------------ */

const BAND_KEYS = ['aqi', 'uv', 'humidity', 'wind', 'visibility', 'rainProbability', 'temperature'] as const

export const buildBands = (weather: ResolvedWeather): Record<string, BandModel> => {
  const bands: Record<string, BandModel> = {}
  for (const key of BAND_KEYS) {
    bands[key] = resolveBand(key, weather[key as keyof typeof weather] as number)
  }
  return bands
}

/* ------------------------------------------------------------------ *
 * Series (charts)
 * ------------------------------------------------------------------ */

export const buildSeries = (weather: ResolvedWeather, count?: number): SeriesPoint[] => {
  const chart = weatherData.chart
  const points = count ?? chart.points
  const shape = weatherData.series
  const startHour = chart.startHour[weather.timeOfDay.id] ?? 6
  const out: SeriesPoint[] = []

  for (let i = 0; i < points; i += 1) {
    out.push({
      label: formatClock(startHour * 60 + i * chart.hourStep),
      temperature: round(
        weather.temperature + (seriesFactor(shape.temperature, weather.condition.id, i) - 1) * spreadFor(shape.temperature, weather.condition.id),
        1,
      ),
      feelsLike: round(
        weather.temperature +
          (seriesFactor(shape.temperature, weather.condition.id, i) - 1) * spreadFor(shape.temperature, weather.condition.id) +
          (weather.feelsLike - weather.temperature),
        1,
      ),
      aqi: Math.round(clamp(weather.aqi * seriesFactor(shape.aqi, weather.condition.id, i), 5, 500)),
      humidity: Math.round(clamp(weather.humidity * seriesFactor(shape.humidity, weather.condition.id, i), 5, 100)),
      rainProbability: Math.round(
        clamp(weather.rainProbability * seriesFactor(shape.rainProbability, weather.condition.id, i), 0, 100),
      ),
      uv: Math.round(clamp(weather.uv * seriesFactor(shape.uv, weather.condition.id, i), 0, 14)),
      wind: Math.round(clamp(weather.wind * seriesFactor(shape.wind, weather.condition.id, i), 0, 90)),
    })
  }
  return out
}

const seriesFor = (metric: SeriesShape | undefined, conditionId: string) => {
  if (!metric) return [1]
  return metric.byCondition?.[conditionId] ?? metric.shape
}

const spreadFor = (metric: SeriesShape | undefined, conditionId: string) => {
  if (!metric) return 0
  return metric.spreadByCondition?.[conditionId] ?? metric.spread ?? 0
}

const seriesFactor = (metric: SeriesShape | undefined, conditionId: string, index: number) => {
  const shape = seriesFor(metric, conditionId)
  const value = shape[index % shape.length] ?? 1
  const jitter = (seededRandom(index * 7.3 + shape.length) - 0.5) * 0.06
  return value * (1 + jitter)
}

export const sliceSeries = (series: SeriesPoint[], points: number) => series.slice(Math.max(0, series.length - points))

/* ------------------------------------------------------------------ *
 * Forecast
 * ------------------------------------------------------------------ */

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export const buildForecast = (weather: ResolvedWeather, now = new Date()): ForecastModel[] => {
  const pattern = weatherData.forecastPattern
  const baseIndex = Math.max(0, conditions.findIndex((c) => c.id === weather.condition.id))
  const out: ForecastModel[] = []

  for (let day = 0; day < pattern.days; day += 1) {
    const shift = pattern.conditionShift[day % pattern.conditionShift.length] ?? 0
    const nextIndex = clamp(baseIndex + shift, 0, conditions.length - 1)
    const condition = conditions[nextIndex]
    const date = new Date(now.getTime() + day * 86400000)
    const temperatureDelta = pattern.temperatureDelta[day % pattern.temperatureDelta.length] ?? 0
    const rainDelta = pattern.rainDelta[day % pattern.rainDelta.length] ?? 0
    const aqiDelta = pattern.aqiDelta[day % pattern.aqiDelta.length] ?? 0
    const uvDelta = pattern.uvDelta[day % pattern.uvDelta.length] ?? 0

    out.push({
      id: `day-${day}`,
      day: day === 0 ? 'Today' : DAY_NAMES[date.getDay()] ?? '—',
      date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      icon: condition.icon,
      conditionLabel: condition.shortLabel,
      gradient: condition.gradient,
      high: round(weather.temperature + temperatureDelta + 3 + pattern.temperatureDelta[(day + 1) % pattern.temperatureDelta.length]! * 0.4),
      low: round(weather.temperature + temperatureDelta - 4),
      rain: clamp(Math.round(condition.rainProbability + rainDelta), 0, 100),
      uv: clamp(Math.round(weather.uv + uvDelta + condition.uv - weather.condition.uv), 0, 14),
      aqi: clamp(Math.round(weather.aqi + aqiDelta * 0.6 + (condition.aqi - weather.condition.aqi) * 0.5), 5, 500),
      severity: condition.severity,
    })
  }
  return out
}

/* ------------------------------------------------------------------ *
 * Widgets
 * ------------------------------------------------------------------ */

type ComputedWidget = {
  value: number | null
  displayValue: string
  label: string
  detail: string
  tone: Tone
  color: string
  progress: number
  items: { id: string; text: string }[]
  confidence?: number
}

const computeWidget = (
  definition: WidgetDefinition,
  weather: ResolvedWeather,
  bands: Record<string, BandModel>,
  tokens: Record<string, string>,
): ComputedWidget => {
  const spec = definition.compute

  if (spec.kind === 'band') {
    const value = weather[spec.metric]
    const band = bands[spec.bandKey] ?? resolveBand(spec.bandKey, value)
    return {
      value,
      displayValue: `${value}${definition.unit}`.trim(),
      label: band.label,
      detail: band.advice,
      tone: toneFromColor(band.color),
      color: band.color,
      progress: clamp01(value / band.scaleMax),
      items: [] as { id: string; text: string }[],
    }
  }

  if (spec.kind === 'score') {
    const score = computeScore(spec.base, spec.factors, weather)
    const band = resolveBand('score', score)
    return {
      value: score,
      displayValue: `${score}${definition.unit}`,
      label: band.label,
      detail: band.advice,
      tone: toneFromColor(band.color),
      color: band.color,
      progress: clamp01(score / band.scaleMax),
      items: [] as { id: string; text: string }[],
    }
  }

  if (spec.kind === 'state') {
    const bag = buildMatcherBag(weather)
    const state = matchFirst(spec.states, bag, spec.fallback)
    return {
      value: null,
      displayValue: fill(state.value, tokens),
      label: fill(state.label, tokens),
      detail: fill(state.detail, tokens),
      tone: state.tone,
      color: TONE_COLOR[state.tone],
      progress: clamp01(state.confidence / 100),
      items: [] as { id: string; text: string }[],
      confidence: state.confidence,
    }
  }

  if (spec.kind === 'astro') {
    const location = weather.location
    const sunrise = formatClock(parseClock(location.sunrise) - Math.round(weather.timeOfDay.temperatureOffset * 4))
    const sunset = formatClock(parseClock(location.sunset) - Math.round(weather.timeOfDay.temperatureOffset * 3))
    const minutes = Math.max(0, parseClock(sunset) - parseClock(sunrise))
    const display =
      spec.field === 'sunrise' ? sunrise : spec.field === 'sunset' ? sunset : `${Math.floor(minutes / 60)}h ${minutes % 60}m`
    return {
      value: null,
      displayValue: display,
      label: spec.field === 'sunrise' ? 'First light' : spec.field === 'sunset' ? 'Day closes' : 'Daylight',
      detail:
        spec.field === 'daylight'
          ? `Usable daylight for ${weather.persona.label.toLowerCase()} activity in ${weather.location.label}.`
          : `${weather.location.timezone} · ${weather.location.coordinates}`,
      tone: spec.field === 'sunset' ? 'info' : 'warning',
      color: TONE_COLOR[spec.field === 'sunset' ? 'info' : 'warning'],
      progress: clamp01(minutes / 900),
      items: [] as { id: string; text: string }[],
    }
  }

  const bag = buildMatcherBag(weather)
  const items = spec.items
    .filter((item) => matchesRule(item.when, bag))
    .slice(0, spec.max ?? spec.items.length)
    .map((item) => ({ id: item.id, text: fill(item.text, tokens) }))
  return {
    value: null,
    displayValue: `${items.length}`,
    label: items.length === 1 ? '1 item to pack' : `${items.length} items to pack`,
    detail:
      items.length === 0
        ? 'Standard travel kit is enough for these conditions.'
        : 'Generated from the active weather triggers for this trip.',
    tone: 'info',
    color: TONE_COLOR.info,
    progress: clamp01(items.length / Math.max(1, spec.max ?? spec.items.length)),
    items,
  }
}

const buildWhy = (
  definition: WidgetDefinition,
  weather: ResolvedWeather,
  tokens: Record<string, string>,
  computed: { confidence?: number; progress: number },
) => {
  const bag = buildMatcherBag(weather)
  const bullets = fillAll(
    definition.why.factors.filter((factor) => matchesRule(factor.when, bag)).map((f) => f.text),
    tokens,
  )
  const base = computed.confidence ?? definition.why.confidence
  const variance = Math.round((1 - computed.progress) * 6)
  return {
    headline: fill(definition.why.headline, tokens),
    confidence: clamp(base - variance, 40, 99),
    bullets,
    source: definition.source,
  }
}

export const buildWidgets = (
  weather: ResolvedWeather,
  bands: Record<string, BandModel>,
  tokens: Record<string, string>,
): WidgetModel[] => {
  const definitions = widgetData.widgets.filter((w) => w.personas.includes(weather.persona.id))
  return definitions.map((definition) => {
    const computed = computeWidget(definition, weather, bands, tokens)
    return {
      id: definition.id,
      label: definition.label,
      icon: definition.icon,
      type: definition.type,
      unit: definition.unit,
      size: definition.size,
      accent: definition.accent,
      color: computed.color,
      source: definition.source,
      value: computed.value,
      displayValue: computed.displayValue,
      stateLabel: computed.label,
      detail: computed.detail,
      tone: computed.tone,
      confidence: clamp((computed.confidence ?? definition.why.confidence), 40, 99),
      progress: computed.progress,
      items: computed.items,
      why: buildWhy(definition, weather, tokens, computed),
    }
  })
}

/* ------------------------------------------------------------------ *
 * Recommendations, alerts, insight
 * ------------------------------------------------------------------ */

const PRIORITY_WEIGHT: Record<Recommendation['priority'], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

export const buildRecommendations = (
  weather: ResolvedWeather,
  tokens: Record<string, string>,
): Recommendation[] => {
  const bag = buildMatcherBag(weather)
  return recommendationData
    .filter((rec) => rec.personas.includes(weather.persona.id))
    .filter((rec) => matchesRule(rec.when, bag))
    .map((rec) => ({
      ...rec,
      title: fill(rec.title, tokens),
      description: fill(rec.description, tokens),
      window: fill(rec.window, tokens),
      action: fill(rec.action, tokens),
      why: fillAll(rec.why, tokens),
    }))
    .sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] || b.confidence - a.confidence)
}

const SEVERITY_WEIGHT: Record<AlertModel['severity'], number> = {
  extreme: 4,
  high: 3,
  moderate: 2,
  info: 1,
}

/** Severity → colour resolved from simulation.json so the UI never hardcodes hues. */
export const severityColor = (severity: AlertModel['severity']) =>
  simulationData.severityColors[severity] ?? simulationData.severityColors.info

export const buildAlerts = (weather: ResolvedWeather, tokens: Record<string, string>): AlertModel[] => {
  const bag = buildMatcherBag(weather)
  return alertData
    .filter((alert) => !alert.personas || alert.personas.includes(weather.persona.id))
    .filter((alert) => matchesRule(alert.when, bag))
    .map((alert) => ({
      ...alert,
      active: true as const,
      title: fill(alert.title, tokens),
      description: fill(alert.description, tokens),
      actions: fillAll(alert.actions, tokens),
    }))
    .sort((a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity])
}

export const buildInsight = (weather: ResolvedWeather, recommendations: Recommendation[]) => {
  const fallback: Recommendation = {
    id: 'insight-fallback',
    personas: [weather.persona.id],
    title: 'No critical action required right now',
    description:
      'Conditions are inside every threshold for your persona. Keep the day open and re-check before the next decision window.',
    icon: 'sparkles',
    priority: 'low',
    priorityLabel: 'Monitor',
    confidence: 82,
    tone: 'info',
    window: weather.timeOfDay.label,
    action: 'No action required',
    when: {},
    why: [
      `AQI ${weather.aqi} is inside the acceptable band`,
      `Rain probability ${weather.rainProbability}% is low`,
      `${weather.persona.label} thresholds are all satisfied`,
    ],
  }
  const top = recommendations[0] ?? fallback
  return {
    recommendation: top,
    headline: top.title,
    reason: top.description,
    priority: top.priorityLabel,
    confidence: top.confidence,
  }
}

/* ------------------------------------------------------------------ *
 * Explainability
 * ------------------------------------------------------------------ */

export const buildExplanation = (
  weather: ResolvedWeather,
  widgets: WidgetModel[],
  recommendations: Recommendation[],
  alerts: AlertModel[],
) => {
  const entries = [
    ...widgets.map((widget) => ({
      id: widget.id,
      title: widget.label,
      icon: widget.icon,
      confidence: widget.why.confidence,
      bullets: widget.why.bullets,
      source: widget.source,
    })),
    ...recommendations.slice(0, 3).map((rec) => ({
      id: rec.id,
      title: rec.title,
      icon: rec.icon,
      confidence: rec.confidence,
      bullets: rec.why,
      source: 'Mausam recommendation ruleset',
    })),
    ...alerts.slice(0, 2).map((alert) => ({
      id: alert.id,
      title: alert.title,
      icon: alert.icon,
      confidence: 97,
      bullets: [
        `Trigger condition met under ${weather.condition.label.toLowerCase()}`,
        ...alert.actions,
      ],
      source: alert.source,
    })),
  ]

  return {
    section: getSection('widgets'),
    entries: entries.map((entry) => ({
      ...entry,
      bullets: entry.bullets.length > 0 ? entry.bullets : ['No additional factors triggered for this card.'],
    })),
  }
}

/* ------------------------------------------------------------------ *
 * Public entry point
 * ------------------------------------------------------------------ */

export const buildDashboardModel = (state: SimulationState): DashboardModel => {
  const input = inputFromState(state)
  const baseline = resolveBaseline(input)
  const weather = applyDeltas(baseline, state.deltas)
  const bands = buildBands(weather)
  const tokens = createTokens({
    weather,
    bands,
    persona: weather.persona,
    location: weather.location,
    condition: weather.condition,
    timeOfDay: weather.timeOfDay,
  })

  const widgets = buildWidgets(weather, bands, tokens)
  const recommendations = buildRecommendations(weather, tokens)
  const alerts = buildAlerts(weather, tokens)
  const risk = buildRisk(weather)

  return {
    weather,
    bands,
    risk: { ...risk, headline: risk.level.description },
    insight: buildInsight(weather, recommendations),
    widgets,
    recommendations,
    alerts,
    forecast: buildForecast(weather),
    series: buildSeries(weather),
    explanation: buildExplanation(weather, widgets, recommendations, alerts),
    generatedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  }
}
