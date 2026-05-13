import React, { useMemo, useState, useEffect } from 'react'
import DeckGL from '@deck.gl/react'
import { GeoJsonLayer } from '@deck.gl/layers'
import Map from 'react-map-gl/maplibre'

const DEFAULT_VIEW = {
  longitude: -74.006,
  latitude: 40.7128,
  zoom: 13,
  pitch: 50,
  bearing: -10,
}

// Single source of truth for UHI color — used by both map and legend
export function uhiToRGB(uhi, selected) {
  if (selected) return [99, 179, 237, 230]
  const t = Math.min(Math.max((uhi || 0) / 5, 0), 1)
  if (t < 0.33) {
    const s = t / 0.33
    return [Math.round(59 + (96 - 59) * s), Math.round(130 + (189 - 130) * s), Math.round(246 - 246 * s + 246 * s * 0.3), 200]
  } else if (t < 0.66) {
    const s = (t - 0.33) / 0.33
    return [Math.round(234 + (249 - 234) * s), Math.round(179 + (115 - 179) * s), Math.round(8 + (22 - 8) * s), 210]
  } else {
    const s = (t - 0.66) / 0.34
    return [Math.round(249 + (239 - 249) * s), Math.round(115 * (1 - s)), Math.round(22 * (1 - s)), 220]
  }
}

// Convert RGB array to CSS color string
function rgbToCss(rgb) {
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
}

// Legend stops derived from the exact same function
const LEGEND_STOPS = [
  { uhi: 0,   label: '0°C',   desc: 'No heat island' },
  { uhi: 1,   label: '+1°C',  desc: 'Low' },
  { uhi: 2.5, label: '+2.5°C',desc: 'Moderate' },
  { uhi: 4,   label: '+4°C',  desc: 'High' },
  { uhi: 5,   label: '+5°C',  desc: 'Critical' },
]

export default function MapView({ results, selectedBlock, onSelectBlock }) {
  const [viewState, setViewState] = useState(DEFAULT_VIEW)

  useEffect(() => {
    if (!results?.blocks?.length) return
    const lats = results.blocks.map(b => b.centroid[0])
    const lons = results.blocks.map(b => b.centroid[1])
    const lat = (Math.min(...lats) + Math.max(...lats)) / 2
    const lon = (Math.min(...lons) + Math.max(...lons)) / 2
    setViewState(v => ({ ...v, longitude: lon, latitude: lat, zoom: 14.5, transitionDuration: 1200 }))
  }, [results])

  useEffect(() => {
    if (!selectedBlock || !results?.blocks) return
    const block = results.blocks.find(b => b.block_id === selectedBlock)
    if (!block) return
    setViewState(v => ({
      ...v,
      longitude: block.centroid[1],
      latitude: block.centroid[0],
      zoom: Math.max(v.zoom, 15),
      transitionDuration: 600,
    }))
  }, [selectedBlock])

  const layers = useMemo(() => {
    if (!results?.blocks?.length) return []
    return [
      new GeoJsonLayer({
        id: 'blocks',
        data: {
          type: 'FeatureCollection',
          features: results.blocks.map(b => ({
            type: 'Feature',
            geometry: b.geometry,
            properties: b,
          })),
        },
        filled: true,
        stroked: true,
        extruded: true,
        wireframe: false,
        getFillColor: f => uhiToRGB(f.properties.uhi_intensity, f.properties.block_id === selectedBlock),
        getElevation: f => {
          const base = Math.max(8, (f.properties.uhi_intensity || 0) * 14)
          return f.properties.block_id === selectedBlock ? base * 1.6 : base
        },
        getLineColor: f =>
          f.properties.block_id === selectedBlock ? [147, 197, 253, 255] : [255, 255, 255, 15],
        getLineWidth: f => f.properties.block_id === selectedBlock ? 2 : 0.5,
        lineWidthUnits: 'pixels',
        pickable: true,
        autoHighlight: true,
        highlightColor: [147, 197, 253, 40],
        onClick: info => {
          const id = info.object?.properties?.block_id
          onSelectBlock?.(id === selectedBlock ? null : id)
        },
        updateTriggers: {
          getFillColor: [selectedBlock],
          getElevation: [selectedBlock],
          getLineColor: [selectedBlock],
          getLineWidth: [selectedBlock],
        },
        transitions: { getFillColor: 300, getElevation: 300 },
      }),
    ]
  }, [results, selectedBlock])

  // Build gradient string from actual uhiToRGB values
  const gradientStops = LEGEND_STOPS.map((s, i) => {
    const pct = (i / (LEGEND_STOPS.length - 1)) * 100
    return `${rgbToCss(uhiToRGB(s.uhi))} ${pct.toFixed(0)}%`
  }).join(', ')

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        controller={{ scrollZoom: true, dragRotate: true }}
        layers={layers}
        getTooltip={({ object }) => {
          if (!object?.properties) return null
          const p = object.properties
          const color = rgbToCss(uhiToRGB(p.uhi_intensity))
          return {
            html: `
              <div style="
                background:rgba(6,8,16,0.96);
                border:1px solid rgba(255,255,255,0.1);
                border-radius:10px;
                padding:12px 14px;
                font-family:Inter,sans-serif;
                min-width:200px;
                box-shadow:0 8px 32px rgba(0,0,0,0.6);
              ">
                <div style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:#93c5fd;margin-bottom:10px">
                  ${p.block_id}
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
                  <div>
                    <div style="font-size:9px;color:#475569;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;margin-bottom:2px">UHI</div>
                    <div style="font-size:16px;font-weight:800;color:${color}">+${(p.uhi_intensity||0).toFixed(1)}°C</div>
                  </div>
                  <div>
                    <div style="font-size:9px;color:#475569;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;margin-bottom:2px">Wind</div>
                    <div style="font-size:16px;font-weight:800;color:#06b6d4">${(p.wind_speed_ms||0).toFixed(1)} m/s</div>
                  </div>
                </div>
                <div style="font-size:9px;color:#334155;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:5px">Directives</div>
                <div style="display:flex;flex-wrap:wrap;gap:4px">
                  ${(p.directives||[]).map(d => `<span style="font-size:9px;padding:2px 6px;border-radius:4px;background:rgba(255,255,255,0.06);color:#94a3b8;font-weight:600;border:1px solid rgba(255,255,255,0.08)">${d.code}</span>`).join('')}
                </div>
              </div>
            `,
            style: { background: 'none', border: 'none', padding: 0 },
          }
        }}
      >
        <Map mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" />
      </DeckGL>

      {/* Legend — uses exact same gradient as the map */}
      <div style={{
        position: 'absolute', bottom: 24, right: 24,
        background: 'rgba(6,8,16,0.92)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: '14px 16px',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        minWidth: 180,
      }}>
        <div style={{ fontSize: 9, color: '#334155', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
          UHI Intensity Scale
        </div>

        {/* Continuous gradient bar */}
        <div style={{
          height: 10, borderRadius: 5,
          background: `linear-gradient(90deg, ${gradientStops})`,
          marginBottom: 6,
          boxShadow: '0 0 8px rgba(0,0,0,0.4)',
        }} />

        {/* Tick labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          {LEGEND_STOPS.map(s => (
            <span key={s.uhi} style={{
              fontSize: 9, color: rgbToCss(uhiToRGB(s.uhi)),
              fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
            }}>{s.label}</span>
          ))}
        </div>

        {/* Named bands */}
        {[
          { uhi: 0.5,  label: 'Low',      range: '< 1°C' },
          { uhi: 1.8,  label: 'Moderate', range: '1 – 2.5°C' },
          { uhi: 3.2,  label: 'High',     range: '2.5 – 4°C' },
          { uhi: 4.8,  label: 'Critical', range: '> 4°C' },
        ].map(({ uhi, label, range }) => {
          const color = rgbToCss(uhiToRGB(uhi))
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <div style={{
                width: 10, height: 10, borderRadius: 3, flexShrink: 0,
                background: color,
                boxShadow: `0 0 4px ${color}88`,
              }} />
              <span style={{ fontSize: 11, color: '#64748b', flex: 1 }}>{label}</span>
              <span style={{ fontSize: 10, color: '#334155', fontFamily: "'JetBrains Mono', monospace" }}>{range}</span>
            </div>
          )
        })}

        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 10, color: '#1e293b' }}>
          Height = UHI magnitude · Click to inspect
        </div>
      </div>

      {/* Empty state */}
      {!results && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center', pointerEvents: 'none',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                stroke="#3b82f6" strokeWidth="1.5" fill="rgba(59,130,246,0.15)"/>
              <circle cx="12" cy="9" r="2.5" fill="#3b82f6" opacity="0.6"/>
            </svg>
          </div>
          <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 600, marginBottom: 4 }}>Select a city and run analysis</div>
          <div style={{ fontSize: 12, color: '#0f172a' }}>Blocks appear as 3D heat zones</div>
        </div>
      )}
    </div>
  )
}
