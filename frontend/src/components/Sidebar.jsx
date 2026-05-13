import React, { useState } from 'react'

const DIRECTIVE_COLORS = {
  'COMPLIANT': '#22c55e',
  'HEIGHT-MAX': '#f59e0b',
  'GREEN-ROOF': '#4ade80',
  'ALBEDO-MIN': '#a78bfa',
  'TREE-CANOPY': '#34d399',
  'SETBACK': '#60a5fa',
  'VERTICAL-GARDEN': '#86efac',
}

function directiveColor(code) {
  for (const [k, v] of Object.entries(DIRECTIVE_COLORS)) {
    if (code.startsWith(k)) return v
  }
  return '#94a3b8'
}

function StatusDot({ status }) {
  const colors = { pending: '#f59e0b', running: '#3b82f6', completed: '#22c55e', failed: '#ef4444' }
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: colors[status] || '#475569', marginRight: 6,
      boxShadow: status === 'running' ? `0 0 6px ${colors.running}` : 'none',
    }} />
  )
}

export default function Sidebar({ onSubmit, loading, jobStatus, error, results, selectedBlock, onSelectBlock }) {
  const [form, setForm] = useState({
    city_name: 'New York',
    min_lon: -74.01,
    min_lat: 40.705,
    max_lon: -73.97,
    max_lat: 40.725,
  })
  const [tab, setTab] = useState('input') // 'input' | 'results'

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = e => {
    e.preventDefault()
    setTab('results')
    onSubmit(
      { min_lon: +form.min_lon, min_lat: +form.min_lat, max_lon: +form.max_lon, max_lat: +form.max_lat },
      form.city_name
    )
  }

  const sorted = results?.blocks
    ? [...results.blocks].sort((a, b) => (b.uhi_intensity || 0) - (a.uhi_intensity || 0))
    : []

  const selectedBlockData = results?.blocks?.find(b => b.block_id === selectedBlock)

  return (
    <aside style={{
      width: 340, flexShrink: 0,
      background: '#0a0f1a',
      borderRight: '1px solid #1e293b',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1e293b' }}>
        {['input', 'results'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '12px 0', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            background: 'none', border: 'none', cursor: 'pointer',
            color: tab === t ? '#3b82f6' : '#475569',
            borderBottom: tab === t ? '2px solid #3b82f6' : '2px solid transparent',
            transition: 'all 0.15s',
          }}>
            {t === 'input' ? 'Configure' : `Results${sorted.length ? ` (${sorted.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* Input tab */}
      {tab === 'input' && (
        <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>City Name</label>
            <input name="city_name" value={form.city_name} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Bounding Box</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
              {[
                { key: 'min_lon', label: 'West (min lon)' },
                { key: 'min_lat', label: 'South (min lat)' },
                { key: 'max_lon', label: 'East (max lon)' },
                { key: 'max_lat', label: 'North (max lat)' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <div style={{ fontSize: 10, color: '#475569', marginBottom: 3 }}>{label}</div>
                  <input
                    name={key} value={form[key]} onChange={handleChange}
                    type="number" step="0.001" style={inputStyle}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Preset cities */}
          <div>
            <label style={labelStyle}>Quick Presets</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {[
                { name: 'New York', bbox: [-74.01, 40.705, -73.97, 40.725] },
                { name: 'London', bbox: [-0.13, 51.50, -0.07, 51.52] },
                { name: 'Tokyo', bbox: [139.74, 35.67, 139.80, 35.70] },
                { name: 'Mumbai', bbox: [72.82, 18.92, 72.88, 18.96] },
              ].map(p => (
                <button key={p.name} type="button"
                  onClick={() => setForm(f => ({
                    ...f, city_name: p.name,
                    min_lon: p.bbox[0], min_lat: p.bbox[1],
                    max_lon: p.bbox[2], max_lat: p.bbox[3],
                  }))}
                  style={{
                    padding: '5px 10px', fontSize: 11, borderRadius: 5,
                    background: form.city_name === p.name ? '#1e3a5f' : '#0f172a',
                    border: `1px solid ${form.city_name === p.name ? '#3b82f6' : '#1e293b'}`,
                    color: form.city_name === p.name ? '#93c5fd' : '#64748b',
                    cursor: 'pointer',
                  }}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            padding: '12px', borderRadius: 8, border: 'none',
            background: loading
              ? '#1e293b'
              : 'linear-gradient(135deg, #2563eb, #0891b2)',
            color: loading ? '#475569' : '#fff',
            fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '-0.01em', marginTop: 4,
            boxShadow: loading ? 'none' : '0 4px 12px #2563eb44',
            transition: 'all 0.2s',
          }}>
            {loading ? 'Running Analysis...' : 'Run Analysis'}
          </button>

          {jobStatus && (
            <div style={{
              padding: '10px 12px', borderRadius: 6,
              background: '#0f172a', border: '1px solid #1e293b',
              fontSize: 12, color: '#94a3b8',
            }}>
              <StatusDot status={jobStatus} />
              Job status: <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{jobStatus}</span>
            </div>
          )}

          {error && (
            <div style={{
              padding: '10px 12px', borderRadius: 6,
              background: '#1c0a0a', border: '1px solid #ef444433',
              fontSize: 12, color: '#fca5a5',
            }}>
              {error}
            </div>
          )}
        </form>
      )}

      {/* Results tab */}
      {tab === 'results' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
          {!sorted.length && (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#334155', fontSize: 13 }}>
              {loading ? 'Analysis in progress...' : 'No results yet. Run an analysis first.'}
            </div>
          )}

          {/* Selected block detail */}
          {selectedBlockData && (
            <div style={{
              marginBottom: 16, padding: 14,
              background: '#0f172a', borderRadius: 8,
              border: '1px solid #2563eb55',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#93c5fd' }}>{selectedBlockData.block_id}</span>
                <button onClick={() => onSelectBlock(null)} style={{
                  background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 16,
                }}>×</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[
                  { label: 'Temp', value: `${selectedBlockData.predicted_temp_c?.toFixed(1)}°C` },
                  { label: 'Baseline', value: `${selectedBlockData.baseline_temp_c?.toFixed(1)}°C` },
                  { label: 'UHI Delta', value: `+${selectedBlockData.uhi_intensity?.toFixed(1)}°C` },
                  { label: 'Wind', value: `${selectedBlockData.wind_speed_ms?.toFixed(1)} m/s` },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    padding: '8px 10px', background: '#080c14', borderRadius: 6,
                    border: '1px solid #1e293b',
                  }}>
                    <div style={{ fontSize: 10, color: '#475569', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 6, letterSpacing: '0.05em' }}>DIRECTIVES</div>
              {selectedBlockData.directives?.map((d, i) => (
                <div key={i} style={{
                  padding: '8px 10px', marginBottom: 6,
                  background: '#080c14', borderRadius: 6,
                  border: `1px solid ${directiveColor(d.code)}33`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: directiveColor(d.code), marginBottom: 4 }}>
                    {d.code}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{d.reason}</div>
                </div>
              ))}
            </div>
          )}

          {/* Block list */}
          {sorted.map(block => {
            const isSelected = block.block_id === selectedBlock
            const uhi = block.uhi_intensity || 0
            const uhiColor = uhi > 4 ? '#ef4444' : uhi > 2.5 ? '#f59e0b' : uhi > 1 ? '#eab308' : '#22c55e'

            return (
              <div key={block.block_id}
                onClick={() => onSelectBlock(isSelected ? null : block.block_id)}
                style={{
                  padding: '10px 12px', marginBottom: 6,
                  background: isSelected ? '#0f172a' : '#080c14',
                  border: `1px solid ${isSelected ? '#2563eb' : '#1e293b'}`,
                  borderRadius: 7, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1', fontFamily: 'monospace' }}>
                    {block.block_id}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: uhiColor,
                    background: uhiColor + '18', padding: '2px 7px', borderRadius: 4,
                  }}>
                    +{uhi.toFixed(1)}°C
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {block.directives?.map((d, i) => (
                    <span key={i} style={{
                      fontSize: 9, padding: '2px 5px', borderRadius: 3,
                      background: directiveColor(d.code) + '18',
                      color: directiveColor(d.code),
                      border: `1px solid ${directiveColor(d.code)}33`,
                      fontWeight: 600, letterSpacing: '0.04em',
                    }}>{d.code}</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </aside>
  )
}

const labelStyle = { fontSize: 11, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }
const inputStyle = {
  display: 'block', width: '100%', marginTop: 6,
  padding: '8px 10px',
  background: '#080c14', border: '1px solid #1e293b',
  borderRadius: 6, color: '#e2e8f0', fontSize: 13, outline: 'none',
  transition: 'border-color 0.15s',
}
