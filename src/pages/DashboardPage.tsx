import { dashboard } from '../data'
import { useAppState } from '../state/AppState'
import { WeatherOverviewCard } from '../components/dashboard/WeatherOverviewCard'
import { AIInsightCard } from '../components/dashboard/AIInsightCard'
import { RiskMeter } from '../components/dashboard/RiskMeter'
import { WidgetGrid } from '../components/dashboard/WidgetGrid'
import { ChartCard } from '../components/dashboard/ChartCard'
import { RecommendationPanel } from '../components/dashboard/RecommendationPanel'
import { AlertsPanel } from '../components/dashboard/AlertsPanel'
import { ForecastStrip } from '../components/dashboard/ForecastStrip'
import { ExplainabilityPanel } from '../components/dashboard/ExplainabilityPanel'

export const DashboardPage = () => {
  const { model } = useAppState()
  const section = dashboard.sections.find((s) => s.id === 'overview')

  return (
    <div className="page">
      <header className="page-title">
        <div>
          <h1>{dashboard.appName} Dashboard</h1>
          <p className="muted">
            {section?.subtitle} · updated {model.generatedAt}
          </p>
        </div>
        <span className="badge">
          {model.weather.persona.label} · {model.weather.location.label}
        </span>
      </header>

      <div className="dashboard-grid">
        <div className="span-2">
          <WeatherOverviewCard />
        </div>
        <AIInsightCard />
        <RiskMeter />
        <div className="span-2">
          <WidgetGrid />
        </div>
        <div className="span-2">
          <ChartCard />
        </div>
        <div className="span-2">
          <RecommendationPanel />
        </div>
        <div className="span-2">
          <AlertsPanel />
        </div>
        <div className="span-2">
          <ForecastStrip />
        </div>
        <div className="span-2">
          <ExplainabilityPanel />
        </div>
      </div>
    </div>
  )
}
