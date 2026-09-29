/**
 * Presentation helpers: number, unit and colour formatting.
 * No weather knowledge lives here — only display concerns.
 */

import type { ThemeName, Tone, UnitSystem } from '../types'

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const clamp01 = (value: number) => clamp(value, 0, 1)

export const round = (value: number, decimals = 0) => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export const celsiusToFahrenheit = (c: number) => c * 1.8 + 32
export const kmhToMph = (k: number) => k * 0.621371
export const kmToMiles = (k: number) => k * 0.621371

export type FormatOptions = { units?: UnitSystem; decimals?: number }

export const TONE_COLOR: Record<Tone, string> = {
  neutral: '#64748b',
  info: '#0ea5a4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  accent: '#2563eb',
}

export const formatTemperature = (celsius: number, options: FormatOptions = {}) => {
  const { units = 'metric', decimals = 0 } = options
  const value = units === 'imperial' ? celsiusToFahrenheit(celsius) : celsius
  return `${round(value, decimals)}°`
}

export const formatTemperatureWithUnit = (celsius: number, options: FormatOptions = {}) => {
  const { units = 'metric', decimals = 0 } = options
  const value = units === 'imperial' ? celsiusToFahrenheit(celsius) : celsius
  return `${round(value, decimals)}°${units === 'imperial' ? 'F' : 'C'}`
}

export const formatWind = (kmh: number, options: FormatOptions = {}) => {
  const { units = 'metric', decimals = 0 } = options
  return units === 'imperial' ? `${round(kmhToMph(kmh), decimals)} mph` : `${round(kmh, decimals)} km/h`
}

export const formatVisibility = (km: number, options: FormatOptions = {}) => {
  const { units = 'metric', decimals = 1 } = options
  return units === 'imperial'
    ? `${round(kmToMiles(km), decimals)} mi`
    : `${round(km, decimals)} km`
}

export const formatValue = (value: number, decimals = 0, suffix = '') =>
  `${round(value, decimals).toLocaleString('en-IN')}${suffix}`

/** Parses "06:14" into minutes since midnight. */
export const parseClock = (clock: string) => {
  const [hours = '0', minutes = '0'] = clock.split(':')
  return Number(hours) * 60 + Number(minutes)
}

export const formatClock = (minutes: number) => {
  const safe = ((minutes % 1440) + 1440) % 1440
  const hours = Math.floor(safe / 60)
  const rest = safe % 60
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

export const daylightHours = (sunrise: string, sunset: string) => {
  const minutes = parseClock(sunset) - parseClock(sunrise)
  const hours = Math.floor(Math.max(0, minutes) / 60)
  const rest = Math.max(0, minutes) % 60
  return `${hours}h ${String(rest).padStart(2, '0')}m`
}

/** Maps a hex colour to a semantic tone so JSON never has to know about UI vocabularies. */
export const toneFromColor = (color: string): Tone => {
  const hex = color.replace('#', '')
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  if (delta < 18) {
    return max > 200 ? 'success' : max > 90 ? 'info' : 'info'
  }
  let hue = 0
  if (max === r) hue = ((g - b) / delta) % 6
  else if (max === g) hue = (b - r) / delta + 2
  else hue = (r - g) / delta + 4
  hue = Math.round(hue * 60)
  if (hue < 0) hue += 360
  if (hue >= 20 && hue < 45) return 'warning'
  if (hue >= 45 && hue < 70) return 'success'
  if (hue >= 70 && hue < 200) return 'success'
  if (hue >= 200 && hue < 260) return 'info'
  if (hue >= 260 && hue < 330) return 'info'
  return 'danger'
}

/** Deterministic pseudo-random in [0,1) — used for stable visual variety, never for weather. */
export const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export const themeClass = (theme: ThemeName) => (theme === 'dark' ? 'theme-dark' : 'theme-light')
