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

function uhiToRGB(uhi, selected) {
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

  // Fly to selected block
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
        getFillColor: f => uhiToRGB(
          f.properties.uhi_intensity,
          f.properties.block_id === selectedBlock
        ),
        getElevation: f => {
          const base = Math.max(8, (f.properties.uhi_intensity || 0) * 14)
          return f.properties.block_id === selectedBlock ? base * 1.6 : base
        },
        getLineColor: f =>
          f.properties.block_id === selectedBlock
            ? [147, 197, 253, 255]
            : [255, 255, 255, 15],
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
        transitions: {
          getFillColor: 300,
          getElevation: 300,
        },
      }),
    ]
  }, [results, selectedBlock])

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
          return {
            html: `
              <div style="
                background: rgba(6,8,16,0.96);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 10px;
                padding: 12px 14px;
                font-family: Inter, sans-serif;
                min-width: 200px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.6);
              ">
                <div style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:#93c5fd;margin-bottom:10px;letter-spacing:0.03em">
                  ${p.block_id}
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
                  <div>
                    <div style="font-size:9px;color:#475569;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;margin-bottom:2px">UHI</div>
                    <div style="font-size:16px;font-weight:800;color:#f59e0b">+${(p.uhi_intensity||0).toFixed(1)}°C</div>
                  </div>
                  <div>
                    <div style="font-size:9px;color:#475569;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;margin-bottom:2px">Wind</div>
                    <div style="font-size:16px;font-weight:800;color:#06b6d4">${(p.wind_speed_ms||0).toFixed(1)} m/s</div>
                  </div>
                </div>
                <div style="font-size:9px;color:#334155;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:5px">Directives</div>
                <div style="display:flex;flex-wrap:wrap;gap:4px">
                  ${(p.directives||[]).map(d => `
                    <span style="font-size:9px;padding:2px 6px;border-radius:4px;background:rgba(255,255,255,0.06);color:#94a3b8;font-weight:600;border:1px solid rgba(255,255,255,0.08)">
                      ${d.code}
                    </span>
                  `).join('')}
                </div>
                <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06);font-size:10px;color:#334155">
                  Click to select block
                </div>
              </div>
            `,
            style: { background: 'none', border: 'none', padding: 0 },
          }
        }}
      >
        <Map mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" />
      </DeckGL>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 24, right: 24,
        background: 'rgba(6,8,16,0.92)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: '14px 16px',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        minWidth: 170,
      }}>
        <div style={{
          fontSize: 9, color: '#334155', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10,
        }}>UHI Intensity Scale</div>
        {[
          { label: 'Critical  >4°C', color: '#ef4444' },
          { label: 'High  2.5–4°C', color: '#f59e0b' },
          { label: 'Moderate  1–2.5°C', color: '#eab308' },
          { label: 'Low  <1°C', color: '#3b82f6' },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
            <div style={{
              width: 28, height: 8, borderRadius: 3,
              background: `linear-gradient(90deg, ${color}60, ${color})`,
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 11, color: '#64748b' }}>{label}</span>
          </div>
        ))}
        <div style={{
          marginTop: 10, paddingTop: 8,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: 10, color: '#1e293b',
        }}>
          Height = UHI magnitude<br/>Click block to inspect
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
          <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 600, marginBottom: 4 }}>
            Select a city and run analysis
          </div>
          <div style={{ fontSize: 12, color: '#0f172a' }}>
            Blocks appear as 3D heat zones
          </div>
        </div>
      )}
    </div>
  )
}
