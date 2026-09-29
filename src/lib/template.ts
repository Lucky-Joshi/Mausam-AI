/**
 * Token substitution for JSON-authored copy.
 *
 * Every `{{token}}` in a JSON string is replaced with a live value so the
 * authored text stays generic while the screen always shows real numbers.
 */

import type {
  BandModel,
  Location,
  Persona,
  ResolvedWeather,
  TimeOfDaySlot,
  WeatherCondition,
} from '../types'
import { formatValue, parseClock, round } from './format'

export type TemplateContext = {
  weather: ResolvedWeather
  bands: Record<string, BandModel>
  persona: Persona
  location: Location
  condition: WeatherCondition
  timeOfDay: TimeOfDaySlot
}

const sunTime = (clock: string, minutes: number) => {
  const base = parseClock(clock) + minutes
  const safe = ((base % 1440) + 1440) % 1440
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}

export const createTokens = (ctx: TemplateContext): Record<string, string> => {
  const { weather, bands, persona, location, condition, timeOfDay } = ctx
  const aqiBand = bands.aqi
  const destination = location.destination
  const sunrise = sunTime(location.sunrise, Math.round(timeOfDay.temperatureOffset * -4))
  const sunset = sunTime(location.sunset, Math.round(timeOfDay.temperatureOffset * -3))

  return {
    persona: persona.label,
    personaFocus: persona.focus.join(' · '),
    idealWindow: persona.idealWindow,
    location: location.label,
    region: location.region,
    timezone: location.timezone,
    sunrise,
    sunset,
    dayLabel: 'today',
    destination: destination ? destination.label : location.label,
    destinationNote: destination ? destination.note : 'No linked destination for this city',
    conditionLabel: condition.label,
    timeOfDayLabel: timeOfDay.label,
    timeOfDayNote: timeOfDay.note,
    temperature: formatValue(weather.temperature, 0),
    feelsLike: formatValue(weather.feelsLike, 0),
    humidity: formatValue(weather.humidity, 0),
    aqi: formatValue(weather.aqi, 0),
    uv: formatValue(weather.uv, 0),
    wind: formatValue(weather.wind, 0),
    visibility: formatValue(weather.visibility, 1),
    rainProbability: formatValue(weather.rainProbability, 0),
    precipitation: formatValue(weather.precipitation, 1),
    cloudCover: formatValue(weather.cloudCover, 0),
    delayWindow: sunTime('08:00', 120),
    sessionCap: weather.temperature >= 34 ? '25' : '40',
    aqiLabel: aqiBand?.label ?? 'Unknown',
    aqiAdvice: aqiBand?.advice ?? 'No advisory available.',
    humidityLabel: bands.humidity?.label ?? 'Unknown',
    uvLabel: bands.uv?.label ?? 'Unknown',
    windLabel: bands.wind?.label ?? 'Unknown',
    visibilityLabel: bands.visibility?.label ?? 'Unknown',
    rainLabel: bands.rainProbability?.label ?? 'Unknown',
    temperatureLabel: bands.temperature?.label ?? 'Unknown',
    score: formatValue(weather.severity * 100, 0),
  }
}

const TOKEN = /\{\{\s*([a-zA-Z]+)\s*\}\}/g

export const fill = (template: string, tokens: Record<string, string>) =>
  template.replace(TOKEN, (_match, key: string) => tokens[key] ?? `{{${key}}}`)

export const fillAll = (templates: string[], tokens: Record<string, string>) =>
  templates.map((t) => fill(t, tokens))

export const roundTo = (value: number, decimals: number) => round(value, decimals)
