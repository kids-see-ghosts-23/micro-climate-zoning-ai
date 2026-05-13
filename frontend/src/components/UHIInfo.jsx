import React, { useState } from 'react'
import { uhiToRGB } from './MapView'

function rgbToCss(rgb) { return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})` }

const CAUSES = [
  {
    icon: '🏗',
    title: 'Dark Surfaces',
    desc: 'Asphalt and concrete absorb up to 95% of solar radiation and re-emit it as heat. Rural land reflects far more.',
  },
  {
    icon: '🌿',
    title: 'Reduced Vegetation',
    desc: 'Plants cool through evapotranspiration — releasing water vapor that carries heat away. Cities replace this with pavement.',
  },
  {
    icon: '🏙',
    title: 'Urban Geometry',
    desc: 'Tall buildings create "concrete canyons" that trap outgoing longwave radiation and block cooling wind flow.',
  },
  {
    icon: '⚙️',
    title: 'Waste Heat',
    desc: 'Air conditioning, vehicles, and industrial processes directly discharge heat into the urban atmosphere.',
  },
]

const DIRECTIVES = [
  { code: 'HEIGHT-MAX', color: '#f59e0b', title: 'Height Restriction', desc: 'Limits building height to preserve street-level wind corridors. Taller buildings block airflow and trap heat at ground level.' },
  { code: 'GREEN-ROOF', color: '#4ade80', title: 'Green Roof Mandate', desc: 'Requires vegetated roof coverage. Plants absorb solar radiation and cool through evapotranspiration instead of re-emitting heat.' },
  { code: 'ALBEDO-MIN', color: '#a78bfa', title: 'Minimum Albedo', desc: 'New paving and roofing must meet a reflectivity threshold. High-albedo surfaces bounce sunlight back rather than absorbing it.' },
  { code: 'TREE-CANOPY', color: '#34d399', title: 'Tree Canopy', desc: 'Mandates street tree coverage. Shade reduces surface temperature; evapotranspiration provides continuous passive cooling.' },
  { code: 'VERTICAL-GARDEN', color: '#86efac', title: 'Vertical Garden', desc: 'Plant facades on south/west-facing walls to reduce direct solar absorption on the hottest building faces.' },
  { code: 'SETBACK', color: '#60a5fa', title: 'Upper Floor Setback', desc: 'Requires upper floors to step back from the street edge, improving airflow and reducing the canyon effect at street level.' },
]

export default function UHIInfo() {
  const [activeSection, setActiveSection] = useState('overview')

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'causes', label: 'Causes' },
    { id: 'directives', label: 'Directives' },
    { id: 'pinn', label: 'How AI Works' },
  ]

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
      {/* Section nav */}
      <div style={{
        display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 4px', flexShrink: 0, position: 'sticky', top: 0,
        background: 'linear-gradient(180deg, #080c18 0%, #060810 100%)',
        zIndex: 10,
      }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
            flex: 1, padding: '10px 2px', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            background: 'none', border: 'none', cursor: 'pointer',
            color: activeSection === s.id ? '#3b82f6' : '#334155',
            borderBottom: `2px solid ${activeSection === s.id ? '#3b82f6' : 'transparent'}`,
            transition: 'all 0.2s',
          }}>{s.label}</button>
        ))}
      </div>

      <div style={{ padding: '16px 16px' }}>

        {/* Overview */}
        {activeSection === 'overview' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{
              padding: '14px', borderRadius: 10, marginBottom: 14,
              background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(249,115,22,0.06))',
              border: '1px solid rgba(239,68,68,0.2)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5', marginBottom: 6 }}>
                What is the Urban Heat Island Effect?
              </div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.65 }}>
                Urban areas are significantly warmer than surrounding rural areas due to human activities and built infrastructure.
                This temperature difference creates an invisible "island" of heat over the city.
              </div>
            </div>

            {/* Temperature comparison */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
                Typical Temperature Differential
              </div>
              {[
                { label: 'Daytime urban vs rural', delta: '1–3°C', uhi: 2, note: 'Surface absorbs solar radiation all day' },
                { label: 'Nighttime urban vs rural', delta: '5–7°C', uhi: 5, note: 'Surfaces re-emit stored heat after dark' },
                { label: 'Heatwave conditions', delta: 'up to 10°C', uhi: 5, note: 'Can be life-threatening for vulnerable people' },
              ].map(({ label, delta, uhi, note }) => {
                const color = rgbToCss(uhiToRGB(uhi))
                return (
                  <div key={label} style={{
                    padding: '10px 12px', borderRadius: 8, marginBottom: 6,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace" }}>{delta}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#334155' }}>{note}</div>
                  </div>
                )
              })}
            </div>

            {/* Impact areas */}
            <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
              Key Impacts
            </div>
            {[
              { icon: '🏥', label: 'Health', color: '#ef4444', desc: 'Heat-related deaths, respiratory issues from elevated ozone' },
              { icon: '⚡', label: 'Energy', color: '#f59e0b', desc: 'Up to 10% higher cooling demand in summer months' },
              { icon: '🌧', label: 'Environment', color: '#06b6d4', desc: 'Altered rainfall patterns, thermal runoff into waterways' },
              { icon: '⚖️', label: 'Equity', color: '#a78bfa', desc: 'Low-income areas hit hardest due to less green space' },
            ].map(({ icon, label, color, desc }) => (
              <div key={label} style={{
                display: 'flex', gap: 10, padding: '8px 10px',
                borderRadius: 8, marginBottom: 5,
                background: `${color}08`, border: `1px solid ${color}18`,
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Causes */}
        {activeSection === 'causes' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
              Primary Drivers
            </div>
            {CAUSES.map(({ icon, title, desc }) => (
              <div key={title} style={{
                padding: '12px', borderRadius: 10, marginBottom: 8,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{title}</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}

            {/* Albedo comparison */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
                Surface Albedo Comparison
              </div>
              {[
                { surface: 'Fresh snow', albedo: 0.85, color: '#e2e8f0' },
                { surface: 'Green vegetation', albedo: 0.25, color: '#4ade80' },
                { surface: 'Concrete (light)', albedo: 0.30, color: '#94a3b8' },
                { surface: 'Dry asphalt', albedo: 0.10, color: '#475569' },
                { surface: 'Gravel roof', albedo: 0.12, color: '#64748b' },
              ].map(({ surface, albedo, color }) => (
                <div key={surface} style={{ marginBottom: 7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{surface}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{albedo}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: color, width: `${albedo * 100}%`, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 10, color: '#1e293b', marginTop: 6 }}>
                Higher albedo = more sunlight reflected = less heat absorbed
              </div>
            </div>
          </div>
        )}

        {/* Directives */}
        {activeSection === 'directives' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
              Zoning Directive Reference
            </div>
            {DIRECTIVES.map(({ code, color, title, desc }) => (
              <div key={code} style={{
                padding: '12px', borderRadius: 10, marginBottom: 8,
                background: `${color}06`, border: `1px solid ${color}22`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 9, padding: '2px 7px', borderRadius: 4,
                    background: `${color}18`, border: `1px solid ${color}35`,
                    color, fontWeight: 800, letterSpacing: '0.05em',
                  }}>{code}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{title}</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}

            {/* Trigger thresholds */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
                Trigger Thresholds
              </div>
              <div style={{
                padding: '12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                fontSize: 11, lineHeight: 1.8, color: '#64748b',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {[
                  ['Wind < 1.5 m/s', '→ HEIGHT-MAX'],
                  ['UHI > 2.5°C', '→ GREEN-ROOF-40'],
                  ['UHI > 4.0°C', '→ GREEN-ROOF-60'],
                  ['UHI > 2.5°C', '→ ALBEDO-MIN-0.45'],
                  ['Wind < 2.5 + UHI > 2.5°C', '→ TREE-CANOPY'],
                  ['Area > 7000m² + Floors > 6', '→ VERTICAL-GARDEN'],
                ].map(([cond, action]) => (
                  <div key={cond} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: '#334155', minWidth: 160 }}>{cond}</span>
                    <span style={{ color: '#3b82f6' }}>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* How AI Works */}
        {activeSection === 'pinn' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{
              padding: '14px', borderRadius: 10, marginBottom: 14,
              background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(6,182,212,0.06))',
              border: '1px solid rgba(59,130,246,0.2)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#93c5fd', marginBottom: 6 }}>
                Physics-Informed Neural Networks
              </div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.65 }}>
                PINNs are neural networks that have physical laws encoded directly into their loss function —
                so the model isn't just learning from data, it's also constrained to obey the laws of physics.
              </div>
            </div>

            {/* Pipeline steps */}
            {[
              {
                step: '01', color: '#3b82f6',
                title: 'Data Ingestion',
                desc: 'OpenStreetMap building footprints (OSMnx) + Landsat 8 satellite thermal imagery via Google Earth Engine. Provides real 3D urban geometry and surface temperature baseline.',
              },
              {
                step: '02', color: '#8b5cf6',
                title: 'CFD Training Data',
                desc: 'OpenFOAM Computational Fluid Dynamics software generates ground-truth wind + heat simulations. Slow (days per city), but accurate enough to train the AI.',
              },
              {
                step: '03', color: '#06b6d4',
                title: 'PINN Training',
                desc: 'Neural network trained on CFD outputs with Navier-Stokes + heat diffusion equations in the loss function. Forces physically plausible predictions even outside training data.',
              },
              {
                step: '04', color: '#10b981',
                title: 'Inference',
                desc: 'Trained model predicts wind speed and surface temperature for any block in milliseconds — replacing days of CFD simulation.',
              },
              {
                step: '05', color: '#f59e0b',
                title: 'Zoning Output',
                desc: 'Predictions feed a rule engine that generates structured legislative directives — not just a heat map, but actual enforceable zoning codes with written justifications.',
              },
            ].map(({ step, color, title, desc }, i, arr) => (
              <div key={step} style={{ display: 'flex', gap: 10, marginBottom: i < arr.length - 1 ? 0 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: `${color}18`, border: `1px solid ${color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace",
                  }}>{step}</div>
                  {i < arr.length - 1 && (
                    <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.05)', margin: '3px 0' }} />
                  )}
                </div>
                <div style={{ paddingBottom: i < arr.length - 1 ? 12 : 0, paddingTop: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}

            {/* Equations */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
                Governing Equations in Loss Function
              </div>
              {[
                { name: 'Continuity', eq: '∇·u = 0', desc: 'Incompressible flow — mass conservation' },
                { name: 'Navier-Stokes', eq: 'ρ(u·∇)u = −∇p + μ∇²u', desc: 'Momentum conservation for wind flow' },
                { name: 'Heat Diffusion', eq: 'ρcₚ(u·∇T) = k∇²T', desc: 'Advection-diffusion for temperature' },
              ].map(({ name, eq, desc }) => (
                <div key={name} style={{
                  padding: '9px 12px', marginBottom: 6, borderRadius: 7,
                  background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>{name}</span>
                    <span style={{ fontSize: 12, color: '#93c5fd', fontFamily: "'JetBrains Mono', monospace" }}>{eq}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#334155' }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
