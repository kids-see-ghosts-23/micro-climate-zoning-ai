import React, { useMemo, useState } from 'react'
import DeckGL from '@deck.gl/react'
import { GeoJsonLayer, ScatterplotLayer } from '@deck.gl/layers'
import Map from 'react-map-gl/maplibre'

const INITIAL_VIEW = {
  longitude: -74.006,
  latitude: 40.7128,
  zoom: 13,
  pitch: 50,
  bearing: -15,
}

function uhiToRGB(uhi) {
  const t = Math.min(Math.max((uhi || 0) / 5, 0), 1)
  if (t < 0.5) {
    const s = t * 2
    return [Math.round(59 + 196 * s), Math.round(130 + 24 * s - 130 * s), Math.round(246 - 246 * s), 200]
  } else {
    const s = (t - 0.5) * 2
    return [Math.round(255), Math.round(154 - 154 * s), Math.round(0), 200]
  }
}

export default function MapView({ results, selectedBlock, onSelectBlock }) {
  const [viewState, setViewState] = useState(INITIAL_VIEW)

  // Auto-fly to city when results come in
  React.useEffect(() => {
    if (results?.blocks?.length) {
      const lats = results.blocks.map(b => b.centroid[0])
      const lons = results.blocks.map(b => b.centroid[1])
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2
      const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2
      setViewState(v => ({ ...v, longitude: centerLon, latitude: centerLat, zoom: 14, transitionDuration: 1000 }))
    }
  }, [results])

  const layers = useMemo(() => {
    if (!results?.blocks?.length) return []

    return [
      new GeoJsonLayer({
        id: 'blocks-fill',
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
        getFillColor: f => uhiToRGB(f.properties.uhi_intensity),
        getElevation: f => Math.max(10, (f.properties.uhi_intensity || 0) * 12),
        getLineColor: f =>
          f.properties.block_id === selectedBlock
            ? [99, 179, 237, 255]
            : [30, 41, 59, 80],
        getLineWidth: f => f.properties.block_id === selectedBlock ? 2 : 0.5,
        lineWidthUnits: 'pixels',
        pickable: true,
        autoHighlight: true,
        highlightColor: [99, 179, 237, 60],
        onClick: info => onSelectBlock?.(
          info.object?.properties?.block_id === selectedBlock ? null : info.object?.properties?.block_id
        ),
        updateTriggers: {
          getLineColor: [selectedBlock],
          getLineWidth: [selectedBlock],
        },
        transitions: { getFillColor: 400, getElevation: 400 },
      }),
    ]
  }, [results, selectedBlock])

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        controller
        layers={layers}
        getTooltip={({ object }) => {
          if (!object?.properties) return null
          const p = object.properties
          const uhi = (p.uhi_intensity || 0).toFixed(1)
          const wind = (p.wind_speed_ms || 0).toFixed(1)
          const codes = (p.directives || []).map(d => d.code).join(', ')
          return {
            html: `
              <div style="
                background: rgba(8,12,20,0.95);
                border: 1px solid #1e293b;
                border-radius: 8px;
                padding: 10px 14px;
                font-family: 'Inter','Segoe UI',sans-serif;
                font-size: 12px;
                color: #e2e8f0;
                min-width: 180px;
                backdrop-filter: blur(8px);
              ">
                <div style="font-weight:700;color:#93c5fd;margin-bottom:8px;font-size:11px;letter-spacing:0.05em">${p.block_id}</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
                  <div><div style="font-size:10px;color:#475569">UHI</div><div style="font-weight:700;color:#f59e0b">+${uhi}°C</div></div>
                  <div><div style="font-size:10px;color:#475569">Wind</div><div style="font-weight:700;color:#06b6d4">${wind} m/s</div></div>
                </div>
                <div style="font-size:10px;color:#475569;margin-bottom:4px">DIRECTIVES</div>
                <div style="font-size:10px;color:#64748b">${codes}</div>
              </div>
            `,
            style: { background: 'none', border: 'none', padding: 0 },
          }
        }}
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        />
      </DeckGL>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 24, right: 24,
        background: 'rgba(8,12,20,0.9)',
        border: '1px solid #1e293b',
        borderRadius: 8, padding: '12px 16px',
        backdropFilter: 'blur(8px)',
        minWidth: 160,
      }}>
        <div style={{ fontSize: 10, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10, fontWeight: 600 }}>
          UHI Intensity
        </div>
        {[
          { label: 'Critical (>4°C)', color: '#ef4444' },
          { label: 'High (2.5–4°C)', color: '#f59e0b' },
          { label: 'Moderate (1–2.5°C)', color: '#eab308' },
          { label: 'Low (<1°C)', color: '#3b82f6' },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
          </div>
        ))}

        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #1e293b', fontSize: 10, color: '#334155' }}>
          Height = UHI magnitude
        </div>
      </div>

      {/* Empty state */}
      {!results && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center', pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
          </div>
          <div style={{ fontSize: 14, color: '#334155', fontWeight: 600 }}>Configure a city and run analysis</div>
          <div style={{ fontSize: 12, color: '#1e293b', marginTop: 4 }}>Blocks will appear as 3D heat zones</div>
        </div>
      )}
    </div>
  )
}
