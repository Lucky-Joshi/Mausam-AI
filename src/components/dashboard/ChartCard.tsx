import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { charts } from '../../data'
import { useAppState } from '../../state/AppState'
import { sliceSeries } from '../../lib/engine'
import { Icon } from '../ui/Icon'

export const ChartCard = () => {
  const { model } = useAppState()
  const [metricId, setMetricId] = useState(charts.metrics[0]?.id ?? 'temperature')
  const [rangeId, setRangeId] = useState(charts.ranges[2]?.id ?? '24h')

  const metric = charts.metrics.find((m) => m.id === metricId) ?? charts.metrics[0]!
  const range = charts.ranges.find((r) => r.id === rangeId) ?? charts.ranges[0]!
  const band = model.bands[metric.bandKey]

  const data = useMemo(
    () =>
      sliceSeries(model.series, range.points).map((point) => ({
        label: point.label,
        value: (point as unknown as Record<string, number>)[metric.id],
        feelsLike: point.feelsLike,
      })),
    [model.series, range.points, metric.id],
  )

  const tooltipStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 12,
    fontSize: 12,
    color: 'var(--text)',
  }

  return (
    <section className="stack">
      <div className="card pad-lg chart-card">
        <div className="chart-card__head">
          <div className="chart-card__title">
            <span className="widget-card__icon" style={{ background: `${metric.color}1f`, color: metric.color }}>
              <Icon name={metric.icon} size={16} />
            </span>
            <div>
              <h3>{metric.label}</h3>
              <p>{metric.description}</p>
            </div>
          </div>
          <div className="segmented" role="tablist" aria-label="Chart range">
            {charts.ranges.map((item) => (
              <button
                key={item.id}
                className={item.id === rangeId ? 'is-active' : ''}
                onClick={() => setRangeId(item.id)}
                role="tab"
                aria-selected={item.id === rangeId}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {charts.metrics.map((item) => (
            <button
              key={item.id}
              className="chip"
              onClick={() => setMetricId(item.id)}
              style={
                item.id === metricId
                  ? { background: `${item.color}1f`, color: item.color, borderColor: item.color }
                  : undefined
              }
            >
              <Icon name={item.icon} size={13} />
              {item.shortLabel}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${metric.id}-${rangeId}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ height: 280 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              {metric.type === 'bar' ? (
                <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 6" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={54} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}${metric.unit}`, metric.shortLabel]} />
                  <Bar dataKey="value" fill={metric.color} radius={[6, 6, 0, 0]} maxBarSize={34} />
                </BarChart>
              ) : metric.type === 'line' ? (
                <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 6" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={54} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}${metric.unit}`, metric.shortLabel]} />
                  <Line type="monotone" dataKey="value" stroke={metric.color} strokeWidth={2.5} dot={{ r: 3, fill: metric.color, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              ) : (
                <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`grad-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={metric.color} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={metric.color} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 6" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={54} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}${metric.unit}`, metric.shortLabel]} />
                  <Area type="monotone" dataKey="value" stroke={metric.color} strokeWidth={2.5} fill={`url(#grad-${metric.id})`} />
                  {metric.id === 'temperature' && (
                    <Line type="monotone" dataKey="feelsLike" stroke="var(--text-3)" strokeWidth={1.6} strokeDasharray="5 5" dot={false} />
                  )}
                </AreaChart>
              )}
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>

        <div className="chart-legend">
          <span className="chart-legend__item">
            <i className="chart-legend__swatch" style={{ background: metric.color }} />
            {metric.shortLabel}
          </span>
          {metric.id === 'temperature' && (
            <span className="chart-legend__item">
              <i className="chart-legend__swatch" style={{ background: 'var(--text-3)' }} />
              Feels like
            </span>
          )}
          {band && (
            <span className="chart-legend__item">
              <i className="chart-legend__swatch" style={{ background: band.color }} />
              {band.label} — {band.advice}
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
