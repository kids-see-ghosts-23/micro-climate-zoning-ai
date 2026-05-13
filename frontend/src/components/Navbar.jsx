import React from 'react'

export default function Navbar({ cityName, results, loading, jobStatus }) {
  return (
    <nav style={{
      height: 56,
      background: 'linear-gradient(90deg, #060810 0%, #0a0f1e 100%)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 16,
      flexShrink: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Icon */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #1d4ed8 0%, #0891b2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 1px rgba(59,130,246,0.3), 0 0 20px rgba(59,130,246,0.25)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.5"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
          </div>
          {/* Pulse ring */}
          <div style={{
            position: 'absolute', inset: -3, borderRadius: 13,
            border: '1px solid rgba(59,130,246,0.2)',
            animation: 'pulse-dot 3s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Text */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, lineHeight: 1 }}>
            <span style={{
              fontSize: 15, fontWeight: 800,
              background: 'linear-gradient(90deg, #e2e8f0 0%, #93c5fd 60%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.03em',
            }}>
              Micro-Climate Zoning
            </span>
            <span style={{
              fontSize: 11, fontWeight: 800, padding: '1px 6px',
              borderRadius: 5,
              background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(6,182,212,0.2))',
              border: '1px solid rgba(59,130,246,0.35)',
              color: '#7dd3fc',
              letterSpacing: '0.02em',
            }}>AI</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, marginTop: 3,
          }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: '#334155', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
              Physics-Informed Urban Heat Analysis
            </span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Status */}
      {loading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.25)',
          borderRadius: 24, padding: '6px 14px',
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%', background: '#3b82f6',
            animation: 'pulse-dot 1.4s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 12, color: '#93c5fd', fontWeight: 500 }}>
            Analyzing {cityName}...
          </span>
        </div>
      )}

      {results && !loading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 24, padding: '6px 14px',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
          <span style={{ fontSize: 12, color: '#6ee7b7', fontWeight: 500 }}>
            Analysis complete — {cityName}
          </span>
        </div>
      )}

      {/* Tech stack pills */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { label: 'PINN', color: '#3b82f6' },
          { label: 'OSMnx', color: '#8b5cf6' },
          { label: 'FastAPI', color: '#06b6d4' },
        ].map(({ label, color }) => (
          <span key={label} style={{
            fontSize: 10, padding: '4px 9px', borderRadius: 5,
            background: `${color}12`,
            border: `1px solid ${color}25`,
            color: color, fontWeight: 600, letterSpacing: '0.06em',
          }}>{label}</span>
        ))}
      </div>
    </nav>
  )
}
