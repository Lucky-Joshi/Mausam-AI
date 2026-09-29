import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { conditions, dashboard, locations, personas, simulation, timeOfDaySlots } from '../data'
import { buildDashboardModel, deltasFromInput, resolveBaseline } from '../lib/engine'
import { clamp } from '../lib/format'
import type {
  ControlKey,
  DashboardModel,
  MetricKey,
  TunableMetric,
  PersonaId,
  ResolvedWeather,
  SimulationInput,
  SimulationState,
  ThemeName,
  UnitSystem,
} from '../types'

const METRIC_KEYS: TunableMetric[] = ['temperature', 'humidity', 'aqi', 'rainProbability', 'uv', 'wind']

const initialInput: SimulationInput = dashboard.defaultState

const initialState: SimulationState = { ...initialInput, deltas: {} }

type Preferences = {
  units: UnitSystem
  theme: ThemeName
  explainability: 'full' | 'summary'
  panelOpen: boolean
}

type AppStateValue = {
  sim: SimulationState
  model: DashboardModel
  baseline: ResolvedWeather
  controls: typeof simulation.controls
  preferences: Preferences
  setPersona: (id: PersonaId) => void
  setCondition: (id: string) => void
  setTimeOfDay: (id: string) => void
  setLocation: (id: string) => void
  setMetric: (key: TunableMetric, value: number) => void
  getMetric: (key: MetricKey) => number
  applyScenario: (id: string) => void
  reset: () => void
  randomize: () => void
  setUnits: (units: UnitSystem) => void
  setTheme: (theme: ThemeName) => void
  toggleTheme: () => void
  setExplainability: (mode: Preferences['explainability']) => void
  setPanelOpen: (open: boolean) => void
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void
}

const AppStateContext = createContext<AppStateValue | null>(null)

const STORAGE_KEY = 'mausam-ai.preferences.v1'

const readPreferences = (): Preferences => {
  if (typeof window === 'undefined') return { units: 'metric', theme: 'light', explainability: 'full', panelOpen: true }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { units: 'metric', theme: 'light', explainability: 'full', panelOpen: true }
    const parsed = JSON.parse(raw) as Partial<Preferences>
    return {
      units: parsed.units === 'imperial' ? 'imperial' : 'metric',
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      explainability: parsed.explainability === 'summary' ? 'summary' : 'full',
      panelOpen: parsed.panelOpen ?? true,
    }
  } catch {
    return { units: 'metric', theme: 'light', explainability: 'full', panelOpen: true }
  }
}

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [sim, setSim] = useState<SimulationState>(initialState)
  const [preferences, setPreferences] = useState<Preferences>(readPreferences)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch {
      /* storage unavailable — preferences stay in memory for the session */
    }
  }, [preferences])

  const baseline = useMemo(() => resolveBaseline(sim), [sim])

  const model = useMemo(() => buildDashboardModel(sim), [sim])

  const updateContext = useCallback((patch: Partial<SimulationInput>, preserveDeltas = false) => {
    setSim((current) => {
      const nextInput = { ...current, ...patch }
      if (preserveDeltas) {
        return {
          ...nextInput,
          temperature: current.temperature,
          humidity: current.humidity,
          aqi: current.aqi,
          rainProbability: current.rainProbability,
          uv: current.uv,
          wind: current.wind,
        }
      }
      const fresh = resolveBaseline(nextInput)
      return { ...nextInput, ...Object.fromEntries(METRIC_KEYS.map((k) => [k, fresh[k]])), deltas: {} }
    })
  }, [])

  const setPersona = useCallback((id: PersonaId) => updateContext({ persona: id }), [updateContext])
  const setCondition = useCallback((id: string) => updateContext({ condition: id }), [updateContext])
  const setLocation = useCallback((id: string) => updateContext({ location: id }), [updateContext])
  const setTimeOfDay = useCallback((id: string) => updateContext({ timeOfDay: id }, true), [updateContext])

  const getMetric = useCallback((key: MetricKey) => model.weather[key], [model])

  const setMetric = useCallback((key: TunableMetric, value: number) => {
    setSim((current) => {
      const base = resolveBaseline(current)
      const next = clamp(value, simulation.ranges[key]?.min ?? 0, simulation.ranges[key]?.max ?? 100)
      return { ...current, [key]: next, deltas: { ...current.deltas, [key]: next - base[key] } }
    })
  }, [])

  const applyScenario = useCallback((id: string) => {
    const scenario = simulation.scenarios.find((s) => s.id === id)
    if (!scenario) return
    setSim(() => {
      const merged: SimulationInput = { ...scenario.state, persona: scenario.state.persona }
      const base = resolveBaseline(merged)
      return { ...merged, deltas: deltasFromInput(base, merged) }
    })
  }, [])

  const reset = useCallback(() => {
    setSim((current) => {
      const base = resolveBaseline(current)
      const cleared: SimulationInput = { ...current }
      for (const key of METRIC_KEYS) cleared[key] = base[key]
      return { ...cleared, deltas: {} }
    })
  }, [])

  const randomize = useCallback(() => {
    setSim(() => {
      const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)] as T
      const next: SimulationInput = {
        persona: pick(personas).id,
        condition: pick(conditions).id,
        timeOfDay: pick(timeOfDaySlots).id,
        location: pick(locations).id,
        temperature: 0,
        humidity: 0,
        aqi: 0,
        rainProbability: 0,
        uv: 0,
        wind: 0,
      }
      const base = resolveBaseline(next)
      const jitter = (spread: number) => Math.round((Math.random() - 0.5) * spread)
      const tuned: SimulationInput = {
        ...next,
        temperature: clamp(base.temperature + jitter(8), -10, 50),
        humidity: clamp(base.humidity + jitter(18), 5, 100),
        aqi: clamp(base.aqi + jitter(90), 0, 400),
        rainProbability: clamp(base.rainProbability + jitter(40), 0, 100),
        uv: clamp(base.uv + jitter(4), 0, 12),
        wind: clamp(base.wind + jitter(14), 0, 60),
      }
      return { ...tuned, deltas: deltasFromInput(base, tuned) }
    })
  }, [])

  const setPreference = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPreferences((current) => ({ ...current, [key]: value }))
  }, [])

  const setUnits = useCallback((units: UnitSystem) => setPreferences((p) => ({ ...p, units })), [])
  const setTheme = useCallback((theme: ThemeName) => setPreferences((p) => ({ ...p, theme })), [])
  const toggleTheme = useCallback(
    () => setPreferences((p) => ({ ...p, theme: p.theme === 'light' ? 'dark' : 'light' })),
    [],
  )
  const setExplainability = useCallback(
    (explainability: Preferences['explainability']) => setPreferences((p) => ({ ...p, explainability })),
    [],
  )
  const setPanelOpen = useCallback((panelOpen: boolean) => setPreferences((p) => ({ ...p, panelOpen })), [])

  const value = useMemo<AppStateValue>(
    () => ({
      sim,
      model,
      baseline,
      controls: simulation.controls,
      preferences,
      setPersona,
      setCondition,
      setTimeOfDay,
      setLocation,
      setMetric,
      getMetric,
      applyScenario,
      reset,
      randomize,
      setUnits,
      setTheme,
      toggleTheme,
      setExplainability,
      setPanelOpen,
      setPreference,
    }),
    [
      sim,
      model,
      baseline,
      preferences,
      setPersona,
      setCondition,
      setTimeOfDay,
      setLocation,
      setMetric,
      getMetric,
      applyScenario,
      reset,
      randomize,
      setUnits,
      setTheme,
      toggleTheme,
      setExplainability,
      setPanelOpen,
      setPreference,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export const useAppState = () => {
  const context = useContext(AppStateContext)
  if (!context) throw new Error('useAppState must be used inside AppStateProvider')
  return context
}

export type { ControlKey }
