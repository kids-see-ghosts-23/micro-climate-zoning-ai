import React, { useState } from 'react'
import { geocodeCity } from '../geocode'

const PRESETS = [
  { name: 'New York', bbox: [-74.01, 40.705, -73.97, 40.725] },
  { name: 'London', bbox: [-0.13, 51.50, -0.07, 51.52] },
  { name: 'Tokyo', bbox: [139.74, 35.67, 139.80, 35.70] },
  { name: 'Mumbai', bbox: [72.82, 18.92, 72.88, 18.96] },
  { name: 'Dubai', bbox: [55.27, 25.19, 55.33, 25.23] },
  { name: 'Singapore', bbox: [103.82, 1.28, 103.87, 1.31] },
]

const DC = {
  COMPLIANT: '#10b981', 'HEIGHT-MAX': '#f59e0b', 'GREEN-ROOF': '#4ade80',
  'ALBEDO-MIN': '#a78bfa', 'TREE-CANOPY': '#34d399', 'SETBACK': '#60a5fa',
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

const today = new Date().toISOString().split('T')[0]
const minDate = '2013-04-01' // Landsat 8 launch date

export default function Sidebar({ onSubmit, loading, jobStatus, error, results, selectedBlock, onSelectBlock }) {
  const [tab, setTab] = useState('config')
  const [cityInput, setCityInput] = useState('')
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customBbox, setCustomBbox] = useState({ min_lon: '', min_lat: '', max_lon: '', max_lat: '' })
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState(null)
  const [resolvedCity, setResolvedCity] = useState(null)
  const [analysisDate, setAnalysisDate] = useState(today)
  const [isHistorical, setIsHistorical] = useState(false)

  const sorted = results?.blocks
    ? [...results.blocks].sort((a, b) => (b.uhi_intensity || 0) - (a.uhi_intensity || 0))
    : []
  const selectedBlockData = results?.blocks?.find(b => b.block_id === selectedBlock)

  const handlePreset = (preset) => {
    setSelectedPreset(preset.name)
    setCityInput(preset.name)
    setResolvedCity({ name: preset.name, bbox: {
      min_lon: preset.bbox[0], min_lat: preset.bbox[1],
      max_lon: preset.bbox[2], max_lat: preset.bbox[3],
    }})
    setGeocodeError(null)
    setCustomBbox({ min_lon: preset.bbox[0], min_lat: preset.bbox[1], max_lon: preset.bbox[2], max_lat: preset.bbox[3] })
  }

  const handleCityInput = (e) => {
    setCityInput(e.target.value)
    setSelectedPreset(null)
    setResolvedCity(null)
    setGeocodeError(null)
  }

  const handleRun = async () => {
    setGeocodeError(null)
    let bbox
    let name = cityInput.trim() || selectedPreset || 'New York'

    if (resolvedCity) {
      bbox = resolvedCity.bbox
    } else if (showAdvanced && customBbox.min_lon) {
      bbox = {
        min_lon: parseFloat(customBbox.min_lon), min_lat: parseFloat(customBbox.min_lat),
        max_lon: parseFloat(customBbox.max_lon), max_lat: parseFloat(customBbox.max_lat),
      }
    } else if (cityInput.trim()) {
      setGeocoding(true)
      try {
        const geo = await geocodeCity(cityInput.trim())
        bbox = geo
        name = cityInput.trim()
        setResolvedCity({ name, bbox })
        setCustomBbox(geo)
      } catch (e) {
        setGeocodeError(e.message)
        setGeocoding(false)
        return
      }
      setGeocoding(false)
    } else {
      bbox = { min_lon: -74.01, min_lat: 40.705, max_lon: -73.97, max_lat: 40.725 }
      name = 'New York'
    }

    setTab('results')
    onSubmit(bbox, name, analysisDate)
  }

  const dateLabel = () => {
    if (analysisDate === today) return 'Today (latest)'
    const d = new Date(analysisDate)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const yearsSince = () => {
    if (analysisDate === today) return null
    const diff = new Date() - new Date(analysisDate)
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365))
    const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30))
    if (years > 0) return `${years}y ${months}m ago`
    return `${months} months ago`
  }

  return (
    <aside style={{
      width: 320, flexShrink: 0,
      background: 'linear-gradient(180deg, #080c18 0%, #060810 100%)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        {[
          { id: 'config', label: 'Configure' },
          { id: 'results', label: `Results${sorted.length ? ` (${sorted.length})` : ''}` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '14px 0', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            background: 'none', border: 'none', cursor: 'pointer',
            color: tab === t.id ? '#3b82f6' : '#334155',
            borderBottom: `2px solid ${tab === t.id ? '#3b82f6' : 'transparent'}`,
            transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'config' && (
        <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'auto' }}>

          {/* City */}
          <div>
            <label style={L}>City Name</label>
            <div style={{ position: 'relative', marginTop: 8 }}>
              <input
                value={cityInput}
                onChange={handleCityInput}
                onKeyDown={e => e.key === 'Enter' && handleRun()}
                placeholder="Type any city..."
                style={{ ...I, paddingRight: resolvedCity ? 36 : 12 }}
              />
              {resolvedCity && (
                <div style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: '#10b981',
                }}>✓</div>
              )}
            </div>
            {resolvedCity && <div style={{ fontSize: 10, color: '#10b981', marginTop: 5 }}>Located: {resolvedCity.name}</div>}
            {geocodeError && <div style={{ fontSize: 10, color: '#f87171', marginTop: 5 }}>{geocodeError}</div>}
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
                }}>{p.name}</button>
              ))}
            </div>
          </div>

          {/* Time Travel */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={L}>Analysis Date</label>
              {analysisDate !== today && (
                <span style={{
                  fontSize: 9, padding: '2px 7px', borderRadius: 10,
                  background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                  color: '#a78bfa', fontWeight: 700, letterSpacing: '0.06em',
                }}>HISTORICAL</span>
              )}
            </div>

            <input
              type="date"
              value={analysisDate}
              min={minDate}
              max={today}
              onChange={e => setAnalysisDate(e.target.value)}
              style={{
                ...I,
                colorScheme: 'dark',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
              }}
            />

            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: analysisDate !== today ? '#a78bfa' : '#475569' }}>
                {dateLabel()}
              </span>
              {yearsSince() && (
                <span style={{ fontSize: 10, color: '#334155' }}>{yearsSince()}</span>
              )}
            </div>

            {/* Quick date presets */}
            <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Today', value: today },
                { label: '2020', value: '2020-07-15' },
                { label: '2017', value: '2017-07-15' },
                { label: '2015', value: '2015-07-15' },
                { label: '2013', value: '2013-07-15' },
              ].map(({ label, value }) => (
                <button key={label} onClick={() => setAnalysisDate(value)} style={{
                  padding: '4px 9px', fontSize: 10, fontWeight: 600,
                  borderRadius: 5, cursor: 'pointer', transition: 'all 0.15s',
                  background: analysisDate === value
                    ? 'rgba(139,92,246,0.2)'
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${analysisDate === value ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  color: analysisDate === value ? '#c4b5fd' : '#475569',
                }}>{label}</button>
              ))}
            </div>

            {analysisDate !== today && (
              <div style={{
                marginTop: 8, padding: '8px 10px', borderRadius: 7,
                background: 'rgba(139,92,246,0.06)',
                border: '1px solid rgba(139,92,246,0.15)',
                fontSize: 11, color: '#7c3aed', lineHeight: 1.5,
              }}>
                Using 30-day window ending {analysisDate} for satellite data.
                Seasonal thermal variation applied.
              </div>
            )}
          </div>

          {/* Advanced bbox */}
          <div>
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#334155', fontSize: 11, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              <span style={{ display: 'inline-block', transform: showAdvanced ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span>
              Custom Bounding Box
            </button>
            {showAdvanced && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                {[
                  { key: 'min_lon', label: 'West' }, { key: 'min_lat', label: 'South' },
                  { key: 'max_lon', label: 'East' }, { key: 'max_lat', label: 'North' },
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

          {/* Run */}
          <button onClick={handleRun} disabled={loading || geocoding} style={{
            padding: '13px', borderRadius: 10, border: 'none',
            background: (loading || geocoding) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
            color: (loading || geocoding) ? '#334155' : '#fff',
            fontSize: 13, fontWeight: 700,
            cursor: (loading || geocoding) ? 'not-allowed' : 'pointer',
            boxShadow: (loading || geocoding) ? 'none' : '0 4px 20px rgba(37,99,235,0.35)',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {(loading || geocoding) ? (
              <>
                <div style={{
                  width: 14, height: 14, border: '2px solid #334155',
                  borderTopColor: '#3b82f6', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                {geocoding ? 'Locating city...' : 'Analyzing...'}
              </>
            ) : analysisDate !== today ? `Analyze ${new Date(analysisDate).getFullYear()}` : 'Run Analysis'}
          </button>

          {error && (
            <div style={{
              padding: '10px 12px', borderRadius: 8,
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
              fontSize: 12, color: '#fca5a5',
            }}>{error}</div>
          )}
        </div>
      )}

      {/* Results tab */}
      {tab === 'results' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
          {/* Date badge on results */}
          {results?.summary?.analysis_date && (
            <div style={{
              marginBottom: 10, padding: '8px 12px', borderRadius: 8,
              background: results.summary.analysis_date !== today
                ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${results.summary.analysis_date !== today ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)'}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 11, color: results.summary.analysis_date !== today ? '#a78bfa' : '#475569' }}>
                {results.summary.analysis_date !== today ? 'Historical: ' : 'Date: '}
                {new Date(results.summary.analysis_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
              {results.summary.mean_temp_c && (
                <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>
                  ~{results.summary.mean_temp_c.toFixed(1)}°C baseline
                </span>
              )}
            </div>
          )}

          {!sorted.length && (
            <div style={{ padding: '48px 0', textAlign: 'center', color: '#1e293b', fontSize: 13 }}>
              {loading ? <div style={{ color: '#3b82f680' }}>Running analysis...</div> : 'No results yet.'}
            </div>
          )}

          {selectedBlockData && (
            <div style={{
              marginBottom: 12, borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(8,145,178,0.06))',
              border: '1px solid rgba(59,130,246,0.25)',
              overflow: 'hidden', animation: 'fadeIn 0.25s ease',
            }}>
              <div style={{
                padding: '10px 12px', borderBottom: '1px solid rgba(59,130,246,0.15)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#93c5fd', fontFamily: "'JetBrains Mono', monospace" }}>
                  {selectedBlockData.block_id}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UHIBadge value={selectedBlockData.uhi_intensity} />
                  <button onClick={() => onSelectBlock(null)} style={{
                    background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 16,
                  }}>×</button>
                </div>
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                  {[
                    { label: 'Predicted Temp', value: `${selectedBlockData.predicted_temp_c?.toFixed(1)}°C`, color: '#f59e0b' },
                    { label: 'Baseline', value: `${selectedBlockData.baseline_temp_c?.toFixed(1)}°C`, color: '#94a3b8' },
                    { label: 'UHI Delta', value: `+${selectedBlockData.uhi_intensity?.toFixed(1)}°C`, color: '#ef4444' },
                    { label: 'Wind', value: `${selectedBlockData.wind_speed_ms?.toFixed(1)} m/s`, color: '#06b6d4' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ padding: '8px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: 9, color: '#475569', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: '#334155', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Directives</div>
                {selectedBlockData.directives?.map((d, i) => (
                  <div key={i} style={{ padding: '8px 10px', marginBottom: 5, borderRadius: 7, background: `${dc(d.code)}08`, border: `1px solid ${dc(d.code)}25` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: dc(d.code), marginBottom: 4 }}>{d.code}</div>
                    <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.55 }}>{d.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sorted.map(block => {
            const isSelected = block.block_id === selectedBlock
            const uhi = block.uhi_intensity || 0
            return (
              <div key={block.block_id}
                onClick={() => onSelectBlock(isSelected ? null : block.block_id)}
                style={{
                  padding: '10px 11px', marginBottom: 5,
                  background: isSelected ? 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(8,145,178,0.08))' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isSelected ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: isSelected ? '0 0 16px rgba(59,130,246,0.1)' : 'none',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? '#93c5fd' : '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                    {block.block_id}
                  </span>
                  <UHIBadge value={uhi} />
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {block.directives?.slice(0, 4).map((d, i) => (
                    <span key={i} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: `${dc(d.code)}12`, color: dc(d.code), border: `1px solid ${dc(d.code)}25`, fontWeight: 700, letterSpacing: '0.04em' }}>{d.code}</span>
                  ))}
                  {(block.directives?.length || 0) > 4 && (
                    <span style={{ fontSize: 9, color: '#334155', padding: '2px 4px' }}>+{block.directives.length - 4}</span>
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
  display: 'block', width: '100%', padding: '9px 12px',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, color: '#e2e8f0', fontSize: 13, outline: 'none', transition: 'all 0.15s',
}
