/**
 * Data access layer.
 *
 * The single place where JSON enters the app. Swapping these imports for
 * `fetch()` calls against a real service is the only change required to move
 * the prototype onto a backend — no component or engine logic changes.
 */

import alertsJson from './alerts.json'
import chartsJson from './charts.json'
import dashboardJson from './dashboard.json'
import landingJson from './landing.json'
import locationsJson from './locations.json'
import personasJson from './personas.json'
import recommendationsJson from './recommendations.json'
import simulationJson from './simulation.json'
import weatherJson from './weather.json'
import widgetsJson from './widgets.json'

import type {
  AlertRecord,
  ChartData,
  DashboardMeta,
  LandingData,
  Location,
  Persona,
  Recommendation,
  SettingGroup,
  SimulationMeta,
  WeatherData,
  WidgetData,
} from '../types'

export const personas = personasJson as Persona[]
export const locations = locationsJson as Location[]
export const weather = weatherJson as WeatherData
export const simulation = simulationJson as SimulationMeta
export const widgets = widgetsJson as WidgetData
export const recommendations = recommendationsJson as Recommendation[]
export const alerts = alertsJson as AlertRecord[]
export const charts = chartsJson as ChartData
export const dashboard = dashboardJson as DashboardMeta
export const landing = landingJson as LandingData
export const settings = dashboardJson.settings as SettingGroup[]

export const conditions = weather.conditions
export const timeOfDaySlots = weather.timeOfDay
export const sections = dashboard.sections
export const navigation = dashboard.navigation

export const getPersona = (id: string) => personas.find((p) => p.id === id) ?? personas[0]
export const getLocation = (id: string) => locations.find((l) => l.id === id) ?? locations[0]
export const getCondition = (id: string) =>
  conditions.find((c) => c.id === id) ?? conditions[0]
export const getTimeOfDay = (id: string) =>
  timeOfDaySlots.find((t) => t.id === id) ?? timeOfDaySlots[0]
export const getSection = (id: string) => sections.find((s) => s.id === id) ?? sections[0]
