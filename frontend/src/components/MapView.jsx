import React, { useMemo } from 'react'
import DeckGL from '@deck.gl/react'
import { GeoJsonLayer } from '@deck.gl/layers'
import Map from 'react-map-gl/maplibre'

const INITIAL_VIEW = {
  longitude: -74.006,
  latitude: 40.7128,
  zoom: 13,
  pitch: 45,
  bearing: 0,
}

function uhiToColor(uhi) {
  // 0 = green, 2.5 = yellow, 5+ = red
  const t = Math.min(Math.max((uhi || 0) / 5, 0), 1)
  const r = Math.round(255 * t)
  const g = Math.round(255 * (1 - t * 0.7))
  const b = 60
  return [r, g, b, 180]
}

export default function MapView({ results, selectedBlock, onSelectBlock }) {
  const layers = useMemo(() => {
    if (!results?.blocks?.length) return []

    return [
      new GeoJsonLayer({
        id: 'blocks',
        data: {
          type: 'FeatureCollection',
          features: results.blocks.map((b) => ({
            type: 'Feature',
            geometry: b.geometry,
            properties: { ...b },
          })),
        },
        filled: true,
        stroked: true,
        extruded: true,
        getFillColor: (f) => uhiToColor(f.properties.uhi_intensity),
        getElevation: (f) => (f.properties.uhi_intensity || 0) * 8,
        getLineColor: (f) =>
          f.properties.block_id === selectedBlock ? [59, 130, 246, 255] : [255, 255, 255, 40],
        getLineWidth: (f) => (f.properties.block_id === selectedBlock ? 3 : 1),
        lineWidthUnits: 'pixels',
        pickable: true,
        onClick: (info) => onSelectBlock?.(info.object?.properties?.block_id),
        updateTriggers: { getLineColor: [selectedBlock], getLineWidth: [selectedBlock] },
      }),
    ]
  }, [results, selectedBlock])

  return (
    <DeckGL
      initialViewState={INITIAL_VIEW}
      controller
      layers={layers}
      getTooltip={({ object }) => {
        if (!object) return null
        const p = object.properties
        return {
          html: `
            <div style="background:#111;padding:8px 12px;border-radius:6px;font-size:12px;color:#fff">
              <strong>${p.block_id}</strong><br/>
              UHI: +${(p.uhi_intensity || 0).toFixed(1)}°C<br/>
              Wind: ${(p.wind_speed_ms || 0).toFixed(1)} m/s<br/>
              Directives: ${(p.directives || []).map((d) => d.code).join(', ')}
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
  )
}
