import React from 'react'

export default function StatsBar({ results }) {
  if (!results?.blocks?.length) return null

  const blocks = results.blocks
  const avgUHI = (blocks.reduce((s, b) => s + (b.uhi_intensity || 0), 0) / blocks.length).toFixed(1)
  const maxUHI = Math.max(...blocks.map(b => b.uhi_intensity || 0)).toFixed(1)
  const avgWind = (blocks.reduce((s, b) => s + (b.wind_speed_ms || 0), 0) / blocks.length).toFixed(1)
  const interventions = blocks.filter(b => !b.directives?.every(d => d.code === 'COMPLIANT')).length

  const stats = [
    { label: 'Blocks Analyzed', value: blocks.length, color: '#3b82f6', unit: '' },
    { label: 'Avg UHI Intensity', value: `+${avgUHI}`, color: '#f59e0b', unit: '°C' },
    { label: 'Peak UHI', value: `+${maxUHI}`, color: '#ef4444', unit: '°C' },
    { label: 'Avg Wind Speed', value: avgWind, color: '#06b6d4', unit: ' m/s' },
    { label: 'Interventions Required', value: interventions, color: '#a78bfa', unit: '' },
    { label: 'Directives Generated', value: results.summary?.directives_generated || 0, color: '#22c55e', unit: '' },
  ]

  return (
    <div style={{
      display: 'flex', gap: 1,
      background: '#0a0f1a',
      borderBottom: '1px solid #1e293b',
      flexShrink: 0,
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          flex: 1, padding: '10px 16px',
          borderRight: i < stats.length - 1 ? '1px solid #1e293b' : 'none',
        }}>
          <div style={{ fontSize: 10, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>
            {s.label}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.color, letterSpacing: '-0.03em' }}>
            {s.value}<span style={{ fontSize: 12, fontWeight: 500, color: s.color + 'aa' }}>{s.unit}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
