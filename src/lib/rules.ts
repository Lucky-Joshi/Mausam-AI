/**
 * Rule primitives.
 *
 * Every threshold, weight and label is read from JSON at call time — this
 * module only knows how to evaluate the declarative shapes defined in
 * `src/types/index.ts`. Swapping the data source therefore needs no code edits.
 */

import { simulation } from '../data'
import { clamp, clamp01, toneFromColor } from './format'
import type {
  BandModel,
  ComputeFactor,
  ConditionMatcher,
  MatchableKey,
  ResolvedWeather,
  RuleSet,
  SimulationInput,
} from '../types'

type MatcherBag = Record<MatchableKey, number> & { condition: string; timeOfDay: string }

export const buildMatcherBag = (weather: ResolvedWeather): MatcherBag => ({
  temperature: weather.temperature,
  feelsLike: weather.feelsLike,
  humidity: weather.humidity,
  aqi: weather.aqi,
  uv: weather.uv,
  wind: weather.wind,
  visibility: weather.visibility,
  rainProbability: weather.rainProbability,
  precipitation: weather.precipitation,
  cloudCover: weather.cloudCover,
  severity: weather.severity,
  condition: weather.condition.id,
  timeOfDay: weather.timeOfDay.id,
})

const matchesMatcher = (value: number, matcher: ConditionMatcher) => {
  if (matcher.eq !== undefined && value !== matcher.eq) return false
  if (matcher.lt !== undefined && !(value < matcher.lt)) return false
  if (matcher.lte !== undefined && !(value <= matcher.lte)) return false
  if (matcher.gt !== undefined && !(value > matcher.gt)) return false
  if (matcher.gte !== undefined && !(value >= matcher.gte)) return false
  if (matcher.between) {
    const [low, high] = matcher.between
    if (!(value >= low && value <= high)) return false
  }
  return true
}

const matchesToken = (value: string, expected: string | string[]) => {
  if (Array.isArray(expected)) return expected.includes(value)
  return value === expected
}

export const matchesRule = (rule: RuleSet | undefined, bag: MatcherBag): boolean => {
  if (!rule) return true
  for (const key of Object.keys(rule) as (keyof RuleSet)[]) {
    if (key === 'condition') {
      if (!matchesToken(bag.condition, rule.condition as string | string[])) return false
      continue
    }
    if (key === 'timeOfDay') {
      if (!matchesToken(bag.timeOfDay, rule.timeOfDay as string | string[])) return false
      continue
    }
    const matcher = rule[key] as ConditionMatcher | undefined
    if (!matcher) continue
    if (!matchesMatcher(bag[key as MatchableKey], matcher)) return false
  }
  return true
}

export const matchFirst = <T extends { when: RuleSet; weight?: number }>(
  candidates: T[],
  bag: MatcherBag,
  fallback: T,
): T => {
  const hits = candidates.filter((c) => matchesRule(c.when, bag))
  if (hits.length === 0) return fallback
  return hits.sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))[0] as T
}

/* ------------------------------------------------------------------ *
 * Bands
 * ------------------------------------------------------------------ */

export const getBands = (key: string) => simulation.bands[key] ?? []

export const resolveBand = (key: string, value: number): BandModel => {
  const bands = getBands(key)
  const found = bands.find((band) => value < band.max) ?? bands[bands.length - 1]
  return {
    id: found.id,
    label: found.label,
    color: found.color,
    advice: found.advice,
    scaleMax: found.scaleMax,
  }
}

export const toneForBand = (key: string, value: number) => toneFromColor(resolveBand(key, value).color)

/* ------------------------------------------------------------------ *
 * Scores
 * ------------------------------------------------------------------ */

const factorContribution = (factor: ComputeFactor, weather: ResolvedWeather) => {
  const value = weather[factor.metric]
  if (factor.optimum !== undefined) {
    const tolerance = factor.tolerance ?? 10
    const distance = Math.abs(value - factor.optimum) / tolerance
    return factor.weight * (1 - clamp01(distance))
  }
  const low = factor.low ?? 0
  const high = factor.high ?? 100
  const span = high - low
  if (span === 0) return 0
  return factor.weight * clamp01((value - low) / span)
}

export const computeScore = (base: number, factors: ComputeFactor[], weather: ResolvedWeather) => {
  const total = factors.reduce((sum, factor) => sum + factorContribution(factor, weather), base)
  return clamp(Math.round(total), 0, 100)
}

/* ------------------------------------------------------------------ *
 * Risk
 * ------------------------------------------------------------------ */

export const factorSeverity = (
  _metric: MatchableKey,
  low: number,
  high: number,
  value: number,
  invert = false,
) => {
  const span = high - low
  if (span === 0) return 0
  const raw = (value - low) / span
  return clamp01(invert ? 1 - raw : raw)
}

export const buildRisk = (weather: ResolvedWeather) => {
  const factors = simulation.riskFactors.map((factor) => {
    const severity = factorSeverity(
      factor.metric,
      factor.low,
      factor.high,
      weather[factor.metric],
      factor.invert,
    )
    return {
      id: factor.id,
      label: factor.label,
      severity,
      weight: factor.weight,
      contribution: severity * factor.weight,
    }
  })
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0) || 1
  const index = clamp(Math.round((factors.reduce((sum, f) => sum + f.contribution, 0) / totalWeight) * 100), 0, 100)
  const level =
    [...simulation.riskLevels].reverse().find((l) => index >= l.min) ?? simulation.riskLevels[0]
  const next = simulation.riskLevels.find((l) => l.min > index) ?? null
  return { index, level, next, factors }
}

/* ------------------------------------------------------------------ *
 * Baseline computation
 * ------------------------------------------------------------------ */

export type Baseline = SimulationInput & { baseline: ResolvedWeather }

export const feelingTemperature = (temperature: number, _humidity: number, wind: number) => {
  const e = wind > 4.8 ? 6.075 * Math.exp((17.27 * temperature) / (237.7 + temperature)) : 6.075
  return temperature + 0.33 * e - 0.7 * wind - 4.0
}
