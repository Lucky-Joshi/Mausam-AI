/**
 * Mausam AI — domain model.
 *
 * Every shape below mirrors a file inside `src/data`. The UI layer never
 * invents values: components receive fully resolved view-models produced by
 * `src/lib/engine`, which is driven exclusively by the JSON data files.
 *
 * Swapping the JSON imports for HTTP responses later therefore requires no
 * change to any component or to this file.
 */

/* ------------------------------------------------------------------ *
 * Primitives
 * ------------------------------------------------------------------ */

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent'

export type IconName = string

export type MetricKey =
  | 'temperature'
  | 'feelsLike'
  | 'humidity'
  | 'aqi'
  | 'uv'
  | 'wind'
  | 'visibility'
  | 'rainProbability'

export type PersonaId = 'runner' | 'farmer' | 'traveler' | 'parent' | 'health'

export type ControlKey =
  | 'persona'
  | 'condition'
  | 'timeOfDay'
  | 'location'
  | 'temperature'
  | 'humidity'
  | 'aqi'
  | 'rainProbability'
  | 'uv'
  | 'wind'

export type ConditionMatcher = {
  lt?: number
  lte?: number
  gt?: number
  gte?: number
  eq?: number
  between?: [number, number]
}

export type MatchableKey = MetricKey | 'precipitation' | 'cloudCover' | 'severity'

export type RuleSet = {
  [metric in MatchableKey]?: ConditionMatcher
} & {
  condition?: string | string[]
  timeOfDay?: string | string[]
}

export type NumberRange = { min: number; max: number; step: number }

/* ------------------------------------------------------------------ *
 * personas.json
 * ------------------------------------------------------------------ */

export type Persona = {
  id: PersonaId
  label: string
  shortLabel: string
  icon: IconName
  accent: string
  initials: string
  tagline: string
  description: string
  focus: string[]
  idealWindow: string
  defaultCondition: string
  defaultTimeOfDay: string
  member: {
    name: string
    role: string
    goal: string
    joined: string
  }
}

/* ------------------------------------------------------------------ *
 * locations.json
 * ------------------------------------------------------------------ */

export type Location = {
  id: string
  label: string
  region: string
  country: string
  flag: string
  timezone: string
  coordinates: string
  tempOffset: number
  humidityOffset: number
  aqiOffset: number
  uvOffset: number
  windOffset: number
  sunrise: string
  sunset: string
  destination?: {
    label: string
    region: string
    condition: string
    tempOffset: number
    note: string
  }
}

/* ------------------------------------------------------------------ *
 * weather.json
 * ------------------------------------------------------------------ */

export type WeatherCondition = {
  id: string
  label: string
  shortLabel: string
  icon: IconName
  severity: number
  gradient: [string, string]
  temperature: number
  humidity: number
  aqi: number
  uv: number
  wind: number
  visibility: number
  rainProbability: number
  precipitation: number
  cloudCover: number
  summary: string
}

export type TimeOfDaySlot = {
  id: string
  label: string
  icon: IconName
  temperatureOffset: number
  humidityOffset: number
  aqiOffset: number
  uvOffset: number
  windFactor: number
  note: string
}

export type SeriesShape = {
  shape: number[]
  spread?: number
  spreadByCondition?: Record<string, number>
  byCondition?: Record<string, number[]>
}

export type WeatherData = {
  chart: {
    points: number
    hourStep: number
    startHour: Record<string, number>
  }
  sunrise: string
  sunset: string
  conditions: WeatherCondition[]
  timeOfDay: TimeOfDaySlot[]
  series: Record<string, SeriesShape>
  forecastPattern: {
    days: number
    conditionShift: number[]
    temperatureDelta: number[]
    rainDelta: number[]
    aqiDelta: number[]
    uvDelta: number[]
  }
}

/* ------------------------------------------------------------------ *
 * simulation.json
 * ------------------------------------------------------------------ */

export type Band = {
  id: string
  label: string
  color: string
  max: number
  scaleMax: number
  advice: string
}

export type RiskLevel = {
  id: string
  label: string
  color: string
  min: number
  description: string
  advice: string
}

export type RiskFactor = {
  id: string
  label: string
  metric: MetricKey
  low: number
  high: number
  weight: number
  invert?: boolean
}

export type Scenario = {
  id: string
  label: string
  icon: IconName
  description: string
  state: SimulationInput
}

export type ControlConfig = {
  key: ControlKey
  label: string
  icon: IconName
  hint: string
  group: 'context' | 'atmosphere'
  range?: NumberRange
  unit?: string
  source: 'personas' | 'conditions' | 'timeOfDay' | 'locations'
  decimals?: number
}

export type SimulationMeta = {
  riskLevels: RiskLevel[]
  riskFactors: RiskFactor[]
  bands: Record<string, Band[]>
  ranges: Partial<Record<ControlKey, NumberRange>>
  units: Partial<Record<ControlKey, string>>
  scenarios: Scenario[]
  controls: ControlConfig[]
  labels: {
    title: string
    description: string
    context: string
    atmosphere: string
    reset: string
    randomize: string
    live: string
    scenarios: string
    derived: string
    derivedHint: string
  }
}

/* ------------------------------------------------------------------ *
 * dashboard.json
 * ------------------------------------------------------------------ */

export type NavItem = {
  id: string
  label: string
  icon: IconName
  path: string
  badge?: string
  placeholder?: boolean
  description: string
}

export type DashboardSection = {
  id: string
  title: string
  subtitle: string
  icon: IconName
}

export type DashboardMeta = {
  appName: string
  appShort: string
  tagline: string
  version: string
  edition: string
  navigation: NavItem[]
  sections: DashboardSection[]
  defaultState: SimulationInput
  insight: {
    eyebrow: string
    title: string
    priorityLabel: string
    confidenceLabel: string
    reasonLabel: string
    disclaimer: string
  }
  search: {
    placeholder: string
    hint: string
    quickPicksLabel: string
  }
  notifications: {
    title: string
    empty: string
  }
  profile: {
    name: string
    role: string
    initials: string
    location: string
    plan: string
  }
  settings: SettingGroup[]
}

/* ------------------------------------------------------------------ *
 * widgets.json
 * ------------------------------------------------------------------ */

export type ComputeFactor = {
  metric: MetricKey
  weight: number
  low?: number
  high?: number
  optimum?: number
  tolerance?: number
}

export type ComputeState = {
  id: string
  when: RuleSet
  value: string
  label: string
  detail: string
  tone: Tone
  confidence: number
  weight?: number
}

export type WidgetCompute =
  | {
      kind: 'score'
      base: number
      factors: ComputeFactor[]
    }
  | {
      kind: 'band'
      metric: MetricKey
      bandKey: string
    }
  | {
      kind: 'state'
      states: ComputeState[]
      fallback: ComputeState
    }
  | {
      kind: 'astro'
      field: 'sunrise' | 'sunset' | 'daylight'
    }
  | {
      kind: 'list'
      items: { id: string; text: string; when: RuleSet }[]
      max?: number
    }

export type WhyFactor = {
  text: string
  when?: RuleSet
  weight?: number
}

export type WidgetDefinition = {
  id: string
  personas: PersonaId[]
  label: string
  icon: IconName
  type: 'gauge' | 'band' | 'stat' | 'advisory' | 'list'
  unit: string
  size: 'normal' | 'wide' | 'tall'
  accent: string
  source: string
  compute: WidgetCompute
  why: {
    headline: string
    confidence: number
    factors: WhyFactor[]
  }
}

export type WidgetData = {
  widgets: WidgetDefinition[]
}

/** Fully resolved widget, ready to render. */
export type WidgetModel = {
  id: string
  label: string
  icon: IconName
  type: WidgetDefinition['type']
  unit: string
  size: WidgetDefinition['size']
  accent: string
  color: string
  source: string
  value: number | null
  displayValue: string
  label: string
  detail: string
  tone: Tone
  confidence: number
  progress: number
  items: { id: string; text: string }[]
  why: { headline: string; confidence: number; bullets: string[]; source: string }
}

/* ------------------------------------------------------------------ *
 * recommendations.json
 * ------------------------------------------------------------------ */

export type Recommendation = {
  id: string
  personas: PersonaId[]
  title: string
  description: string
  icon: IconName
  priority: 'critical' | 'high' | 'medium' | 'low'
  priorityLabel: string
  confidence: number
  tone: Tone
  window: string
  action: string
  featured?: boolean
  when: RuleSet
  why: string[]
}

/* ------------------------------------------------------------------ *
 * alerts.json
 * ------------------------------------------------------------------ */

export type AlertRecord = {
  id: string
  title: string
  description: string
  icon: IconName
  severity: 'extreme' | 'high' | 'moderate' | 'info'
  severityLabel: string
  source: string
  issuedOffset: string
  category: string
  personas?: PersonaId[]
  actions: string[]
  when: RuleSet
}

/* ------------------------------------------------------------------ *
 * charts.json
 * ------------------------------------------------------------------ */

export type ChartMetric = {
  id: string
  label: string
  shortLabel: string
  icon: IconName
  color: string
  unit: string
  type: 'area' | 'bar' | 'line'
  description: string
  bandKey: string
}

export type ChartData = {
  ranges: { id: string; label: string; points: number }[]
  metrics: ChartMetric[]
}

/* ------------------------------------------------------------------ *
 * landing.json
 * ------------------------------------------------------------------ */

export type LandingFeature = {
  id: string
  title: string
  description: string
  icon: IconName
}

export type LandingData = {
  meta: { title: string; description: string; edition: string }
  hero: {
    eyebrow: string
    title: string
    accent: string
    subtitle: string
    primaryCta: string
    secondaryCta: string
    badges: { id: string; label: string; icon: IconName }[]
    livePanel: { title: string; hint: string }
  }
  problem: {
    eyebrow: string
    title: string
    description: string
    points: { id: string; title: string; description: string; icon: IconName }[]
  }
  solution: {
    eyebrow: string
    title: string
    description: string
    bullets: { id: string; text: string; icon: IconName }[]
    pillars: { id: string; label: string; value: string; description: string; icon: IconName }[]
  }
  features: { eyebrow: string; title: string; description: string; items: LandingFeature[] }
  flow: {
    eyebrow: string
    title: string
    steps: { id: string; title: string; description: string; icon: IconName }[]
  }
  stats: { id: string; value: string; label: string; description: string; icon: IconName }[]
  cta: {
    title: string
    description: string
    button: string
    note: string
  }
  footer: {
    note: string
    columns: { id: string; title: string; links: string[] }[]
  }
}

/* ------------------------------------------------------------------ *
 * Settings / profile (dashboard.json + landing.json backed)
 * ------------------------------------------------------------------ */

export type SettingGroup = {
  id: string
  title: string
  description: string
  icon: IconName
  options: { id: string; label: string; description: string; icon: IconName }[]
}

/* ------------------------------------------------------------------ *
 * Engine output
 * ------------------------------------------------------------------ */

export type ResolvedWeather = Record<MetricKey, number> & {
  precipitation: number
  cloudCover: number
  condition: WeatherCondition
  timeOfDay: TimeOfDaySlot
  location: Location
  persona: Persona
  severity: number
}

export type SimulationInput = {
  persona: PersonaId
  condition: string
  timeOfDay: string
  location: string
  temperature: number
  humidity: number
  aqi: number
  rainProbability: number
  uv: number
  wind: number
}

export type SimulationDeltas = Partial<Record<MetricKey, number>>

export type SimulationState = SimulationInput & { deltas: SimulationDeltas }

export type RiskModel = {
  index: number
  level: RiskLevel
  next: RiskLevel | null
  factors: { id: string; label: string; severity: number; weight: number; contribution: number }[]
  headline: string
}

export type BandModel = {
  id: string
  label: string
  color: string
  advice: string
  scaleMax: number
}

export type InsightModel = {
  recommendation: Recommendation
  headline: string
  reason: string
  priority: string
  confidence: number
}

export type AlertModel = AlertRecord & { active: true }

export type ForecastModel = {
  id: string
  day: string
  date: string
  icon: IconName
  conditionLabel: string
  gradient: [string, string]
  high: number
  low: number
  rain: number
  uv: number
  aqi: number
  severity: number
}

export type SeriesPoint = {
  label: string
  temperature: number
  feelsLike: number
  aqi: number
  humidity: number
  rainProbability: number
  uv: number
  wind: number
}

export type DashboardModel = {
  weather: ResolvedWeather
  bands: Record<string, BandModel>
  risk: RiskModel
  insight: InsightModel
  widgets: WidgetModel[]
  recommendations: Recommendation[]
  alerts: AlertModel[]
  forecast: ForecastModel[]
  series: SeriesPoint[]
  explanation: {
    section: DashboardSection
    entries: {
      id: string
      title: string
      icon: IconName
      confidence: number
      bullets: string[]
      source: string
    }[]
  }
  generatedAt: string
}

export type UnitSystem = 'metric' | 'imperial'
export type ThemeName = 'light' | 'dark'
