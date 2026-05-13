import React from 'react'

const DIRECTIVE_COLOR = {
  COMPLIANT: '#10b981',
  'HEIGHT-MAX': '#f59e0b',
  'GREEN-ROOF': '#22c55e',
  'ALBEDO-MIN': '#a78bfa',
  'TREE-CANOPY': '#34d399',
  'SETBACK': '#60a5fa',
  'VERTICAL-GARDEN': '#86efac',
}

function getDirectiveColor(code) {
  for (const [key, color] of Object.entries(DIRECTIVE_COLOR)) {
    if (code.startsWith(key)) return color
  }
  return '#888'
}

export default function ResultsPanel({ results, selectedBlock, onSelectBlock }) {
  if (!results) return null

  const { summary, blocks } = results
  const sorted = [...blocks].sort((a, b) => (b.uhi_intensity || 0) - (a.uhi_intensity || 0))

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#888' }}>Analysis Complete</div>
        <div style={{ fontSize: 13, color: '#fff', marginTop: 4 }}>
          {summary?.blocks_analyzed} blocks &bull; {summary?.directives_generated} directives
        </div>
      </div>

      {sorted.map((block) => (
        <div
          key={block.block_id}
          onClick={() => onSelectBlock(block.block_id === selectedBlock ? null : block.block_id)}
          style={{
            padding: '10px 12px',
            marginBottom: 6,
            background: selectedBlock === block.block_id ? '#1e2a3a' : '#141414',
            border: `1px solid ${selectedBlock === block.block_id ? '#3b82f6' : '#222'}`,
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{block.block_id}</span>
            <span style={{ fontSize: 11, color: block.uhi_intensity > 2.5 ? '#ef4444' : '#888' }}>
              UHI +{(block.uhi_intensity || 0).toFixed(1)}°C
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            {(block.directives || []).map((d, i) => (
              <span
                key={i}
                style={{
                  fontSize: 10,
                  padding: '2px 6px',
                  borderRadius: 3,
                  background: getDirectiveColor(d.code) + '22',
                  color: getDirectiveColor(d.code),
                  border: `1px solid ${getDirectiveColor(d.code)}44`,
                }}
              >
                {d.code}
              </span>
            ))}
          </div>
          {selectedBlock === block.block_id && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#aaa', lineHeight: 1.6 }}>
              <div>Temp: {block.predicted_temp_c?.toFixed(1)}°C (baseline {block.baseline_temp_c?.toFixed(1)}°C)</div>
              <div>Wind: {block.wind_speed_ms?.toFixed(1)} m/s</div>
              {(block.directives || []).map((d, i) => (
                <div key={i} style={{ marginTop: 6, padding: '6px 8px', background: '#1a1a1a', borderRadius: 4 }}>
                  <span style={{ color: getDirectiveColor(d.code), fontWeight: 600 }}>{d.code}: </span>
                  {d.reason}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
