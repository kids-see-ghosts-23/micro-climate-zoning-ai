import React, { useState, useRef } from 'react'

const PRESETS = [
  { name: 'New York', bbox: [-74.01, 40.705, -73.97, 40.725] },
  { name: 'London', bbox: [-0.13, 51.50, -0.07, 51.52] },
  { name: 'Tokyo', bbox: [139.74, 35.67, 139.80, 35.70] },
  { name: 'Mumbai', bbox: [72.82, 18.92, 72.88, 18.96] },
  { name: 'Dubai', bbox: [55.27, 25.19, 55.33, 25.23] },
  { name: 'Singapore', bbox: [103.82, 1.28, 103.87, 1.31] },
]

const DC = {
  COMPLIANT: '#10b981',
  'HEIGHT-MAX': '#f59e0b',
  'GREEN-ROOF': '#4ade80',
  'ALBEDO-MIN': '#a78bfa',
  'TREE-CANOPY': '#34d399',
  'SETBACK': '#60a5fa',
  'VERTICAL-GARDEN': '#86efac',
}

function dc(code) {
  for (const [k, v] of Object.entries(DC)) if (code.startsWith(k)) return v
  return '#94a3b8'
}

function UHIBadge({ value }) {
  const v = value || 0
  const color = v > 4 ? '#ef4444' : v > 2.5 ? '#f59e0b' : v > 1 ? '#eab308' : '#10b981'
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, color,
      background: `${color}15`, padding: '2px 8px',
      borderRadius: 20, border: `1px solid ${color}30`,
    }}>+{v.toFixed(1)}°C</span>
  )
}

export default function Sidebar({ onSubmit, loading, jobStatus, error, results, selectedBlock, onSelectBlock }) {
  const [tab, setTab] = useState('config')
  const [cityInput, setCityInput] = useState('')
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [customBbox, setCustomBbox] = useState({ min_lon: '', min_lat: '', max_lon: '', max_lat: '' })
  const [showAdvanced, setShowAdvanced] = useState(false)

  const sorted = results?.blocks
    ? [...results.blocks].sort((a, b) => (b.uhi_intensity || 0) - (a.uhi_intensity || 0))
    : []

  const selectedBlockData = results?.blocks?.find(b => b.block_id === selectedBlock)

  const handlePreset = (preset) => {
    setSelectedPreset(preset.name)
    setCityInput(preset.name)
    setCustomBbox({
      min_lon: preset.bbox[0],
      min_lat: preset.bbox[1],
      max_lon: preset.bbox[2],
      max_lat: preset.bbox[3],
    })
  }

  const handleRun = () => {
    let bbox
    const preset = PRESETS.find(p => p.name === selectedPreset)

    if (showAdvanced && customBbox.min_lon) {
      bbox = {
        min_lon: parseFloat(customBbox.min_lon),
        min_lat: parseFloat(customBbox.min_lat),
        max_lon: parseFloat(customBbox.max_lon),
        max_lat: parseFloat(customBbox.max_lat),
      }
    } else if (preset) {
      bbox = {
        min_lon: preset.bbox[0], min_lat: preset.bbox[1],
        max_lon: preset.bbox[2], max_lat: preset.bbox[3],
      }
    } else {
      // Default to New York if nothing selected
      bbox = { min_lon: -74.01, min_lat: 40.705, max_lon: -73.97, max_lat: 40.725 }
    }

    setTab('results')
    onSubmit(bbox, cityInput || selectedPreset || 'New York')
  }

  return (
    <aside style={{
      width: 320,
      flexShrink: 0,
      background: 'linear-gradient(180deg, #080c18 0%, #060810 100%)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        {[
          { id: 'config', label: 'Configure' },
          { id: 'results', label: `Results${sorted.length ? ` (${sorted.length})` : ''}` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '14px 0',
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            background: 'none', border: 'none', cursor: 'pointer',
            color: tab === t.id ? '#3b82f6' : '#334155',
            borderBottom: `2px solid ${tab === t.id ? '#3b82f6' : 'transparent'}`,
            transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Config tab */}
      {tab === 'config' && (
        <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'auto' }}>

          {/* City input */}
          <div>
            <label style={L}>City Name</label>
            <input
              value={cityInput}
              onChange={e => { setCityInput(e.target.value); setSelectedPreset(null) }}
              placeholder="Enter city name..."
              style={{ ...I, marginTop: 8 }}
            />
          </div>

          {/* Presets */}
          <div>
            <label style={L}>Quick Select</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 8 }}>
              {PRESETS.map(p => (
                <button key={p.name} type="button" onClick={() => handlePreset(p)} style={{
                  padding: '8px 4px', fontSize: 11, fontWeight: 600,
                  borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s',
                  background: selectedPreset === p.name
                    ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(6,182,212,0.15))'
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedPreset === p.name ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.07)'}`,
                  color: selectedPreset === p.name ? '#93c5fd' : '#64748b',
                  boxShadow: selectedPreset === p.name ? '0 0 12px rgba(59,130,246,0.15)' : 'none',
                }}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced bbox toggle */}
          <div>
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#475569', fontSize: 11, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              <span style={{
                display: 'inline-block',
                transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}>▶</span>
              Custom Bounding Box
            </button>

            {showAdvanced && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                {[
                  { key: 'min_lon', label: 'West' },
                  { key: 'min_lat', label: 'South' },
                  { key: 'max_lon', label: 'East' },
                  { key: 'max_lat', label: 'North' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <div style={{ fontSize: 10, color: '#475569', marginBottom: 4, fontWeight: 600 }}>{label}</div>
                    <input
                      value={customBbox[key]}
                      onChange={e => setCustomBbox(b => ({ ...b, [key]: e.target.value }))}
                      type="number" step="0.001"
                      style={{ ...I, fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}
                      placeholder="0.000"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Run button */}
          <button
            onClick={handleRun}
            disabled={loading}
            style={{
              padding: '13px', borderRadius: 10, border: 'none',
              background: loading
                ? 'rgba(255,255,255,0.05)'
                : 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
              color: loading ? '#334155' : '#fff',
              fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '-0.01em',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(37,99,235,0.35)',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 14, height: 14, border: '2px solid #334155',
                  borderTopColor: '#3b82f6', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                Analyzing...
              </>
            ) : 'Run Analysis'}
          </button>

          {/* Status */}
          {jobStatus && !loading && (
            <div style={{
              padding: '10px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              fontSize: 12, color: '#64748b',
            }}>
              Status: <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{jobStatus}</span>
            </div>
          )}

          {error && (
            <div style={{
              padding: '10px 12px', borderRadius: 8,
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
              fontSize: 12, color: '#fca5a5',
            }}>{error}</div>
          )}
        </div>
      )}

      {/* Results tab */}
      {tab === 'results' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
          {!sorted.length && (
            <div style={{ padding: '48px 0', textAlign: 'center', color: '#1e293b', fontSize: 13 }}>
              {loading
                ? <div style={{ color: '#3b82f680' }}>Running analysis...</div>
                : 'No results yet.'}
            </div>
          )}

          {/* Selected block detail panel */}
          {selectedBlockData && (
            <div style={{
              marginBottom: 12, borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(8,145,178,0.06))',
              border: '1px solid rgba(59,130,246,0.25)',
              overflow: 'hidden',
              animation: 'fadeIn 0.25s ease',
            }}>
              <div style={{
                padding: '10px 12px',
                borderBottom: '1px solid rgba(59,130,246,0.15)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#93c5fd', fontFamily: "'JetBrains Mono', monospace" }}>
                  {selectedBlockData.block_id}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UHIBadge value={selectedBlockData.uhi_intensity} />
                  <button onClick={() => onSelectBlock(null)} style={{
                    background: 'none', border: 'none', color: '#475569',
                    cursor: 'pointer', fontSize: 16, lineHeight: 1,
                    width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 4,
                  }}>×</button>
                </div>
              </div>

              <div style={{ padding: '10px 12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                  {[
                    { label: 'Predicted Temp', value: `${selectedBlockData.predicted_temp_c?.toFixed(1)}°C`, color: '#f59e0b' },
                    { label: 'Baseline Temp', value: `${selectedBlockData.baseline_temp_c?.toFixed(1)}°C`, color: '#94a3b8' },
                    { label: 'UHI Delta', value: `+${selectedBlockData.uhi_intensity?.toFixed(1)}°C`, color: '#ef4444' },
                    { label: 'Wind Speed', value: `${selectedBlockData.wind_speed_ms?.toFixed(1)} m/s`, color: '#06b6d4' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{
                      padding: '8px 10px', borderRadius: 7,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div style={{ fontSize: 9, color: '#475569', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color }}>{value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 10, color: '#334155', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Zoning Directives
                </div>
                {selectedBlockData.directives?.map((d, i) => (
                  <div key={i} style={{
                    padding: '8px 10px', marginBottom: 5, borderRadius: 7,
                    background: `${dc(d.code)}08`,
                    border: `1px solid ${dc(d.code)}25`,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: dc(d.code), marginBottom: 4, letterSpacing: '0.03em' }}>
                      {d.code}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.55 }}>{d.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Block list */}
          {sorted.map(block => {
            const isSelected = block.block_id === selectedBlock
            const uhi = block.uhi_intensity || 0
            const color = uhi > 4 ? '#ef4444' : uhi > 2.5 ? '#f59e0b' : uhi > 1 ? '#eab308' : '#10b981'

            return (
              <div
                key={block.block_id}
                onClick={() => onSelectBlock(isSelected ? null : block.block_id)}
                style={{
                  padding: '10px 11px', marginBottom: 5,
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(8,145,178,0.08))'
                    : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isSelected ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: 8, cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: isSelected ? '0 0 16px rgba(59,130,246,0.1)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: isSelected ? '#93c5fd' : '#64748b',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {block.block_id}
                  </span>
                  <UHIBadge value={uhi} />
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {block.directives?.slice(0, 4).map((d, i) => (
                    <span key={i} style={{
                      fontSize: 9, padding: '2px 6px', borderRadius: 4,
                      background: `${dc(d.code)}12`,
                      color: dc(d.code),
                      border: `1px solid ${dc(d.code)}25`,
                      fontWeight: 700, letterSpacing: '0.04em',
                    }}>{d.code}</span>
                  ))}
                  {(block.directives?.length || 0) > 4 && (
                    <span style={{ fontSize: 9, color: '#334155', padding: '2px 4px' }}>
                      +{block.directives.length - 4}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </aside>
  )
}

const L = { fontSize: 11, color: '#475569', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }
const I = {
  display: 'block', width: '100%',
  padding: '9px 12px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, color: '#e2e8f0', fontSize: 13, outline: 'none',
  transition: 'all 0.15s',
}
