import React from 'react'

export default function StatsBar({ results }) {
  if (!results?.blocks?.length) return null

  const blocks = results.blocks
  const avgUHI = (blocks.reduce((s, b) => s + (b.uhi_intensity || 0), 0) / blocks.length).toFixed(1)
  const maxUHI = Math.max(...blocks.map(b => b.uhi_intensity || 0)).toFixed(1)
  const avgWind = (blocks.reduce((s, b) => s + (b.wind_speed_ms || 0), 0) / blocks.length).toFixed(1)
  const interventions = blocks.filter(b => !b.directives?.every(d => d.code === 'COMPLIANT')).length

  const stats = [
    { label: 'Blocks', value: blocks.length, unit: '', color: '#3b82f6', icon: '▦' },
    { label: 'Avg UHI', value: `+${avgUHI}`, unit: '°C', color: '#f59e0b', icon: '🌡' },
    { label: 'Peak UHI', value: `+${maxUHI}`, unit: '°C', color: '#ef4444', icon: '▲' },
    { label: 'Avg Wind', value: avgWind, unit: ' m/s', color: '#06b6d4', icon: '~' },
    { label: 'Interventions', value: interventions, unit: '', color: '#a78bfa', icon: '!' },
    { label: 'Directives', value: results.summary?.directives_generated || 0, unit: '', color: '#10b981', icon: '✓' },
  ]

  return (
    <div style={{
      display: 'flex',
      background: 'rgba(6,8,16,0.9)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      flexShrink: 0,
      backdropFilter: 'blur(12px)',
      animation: 'fadeIn 0.4s ease',
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          flex: 1,
          padding: '12px 16px',
          borderRight: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, ${s.color}00, ${s.color}60, ${s.color}00)`,
          }} />
          <div style={{ fontSize: 10, color: '#475569', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>
            {s.label}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: '-0.04em', lineHeight: 1 }}>
            {s.value}
            <span style={{ fontSize: 12, fontWeight: 500, color: `${s.color}99`, marginLeft: 1 }}>{s.unit}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
