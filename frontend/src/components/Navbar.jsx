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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px #3b82f640',
          flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.025em', lineHeight: 1 }}>
            Micro-Climate Zoning AI
          </div>
          <div style={{ fontSize: 10, color: '#475569', letterSpacing: '0.08em', marginTop: 2, textTransform: 'uppercase' }}>
            Physics-Informed Urban Heat Analysis
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
