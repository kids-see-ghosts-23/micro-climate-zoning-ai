import React from 'react'

export default function Navbar({ cityName, results, loading }) {
  return (
    <nav style={{
      height: 52,
      background: 'rgba(8,12,20,0.95)',
      borderBottom: '1px solid #1e293b',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      flexShrink: 0,
      backdropFilter: 'blur(12px)',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: '#fff',
        }}>M</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
            Micro-Climate Zoning AI
          </div>
          <div style={{ fontSize: 10, color: '#475569', letterSpacing: '0.05em', marginTop: -1 }}>
            PINN-POWERED URBAN HEAT ANALYSIS
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Status pill */}
      {loading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#1e3a5f', borderRadius: 20, padding: '4px 12px',
          border: '1px solid #2563eb44',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%', background: '#3b82f6',
            animation: 'pulse 1.5s infinite',
          }} />
          <span style={{ fontSize: 11, color: '#93c5fd', fontWeight: 500 }}>Analyzing {cityName}...</span>
        </div>
      )}

      {results && !loading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#052e16', borderRadius: 20, padding: '4px 12px',
          border: '1px solid #16a34a44',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ fontSize: 11, color: '#86efac', fontWeight: 500 }}>Analysis complete — {cityName}</span>
        </div>
      )}

      {/* Badges */}
      <div style={{ display: 'flex', gap: 8 }}>
        {['PINN', 'OSMnx', 'FastAPI'].map(tag => (
          <span key={tag} style={{
            fontSize: 10, padding: '3px 8px', borderRadius: 4,
            background: '#0f172a', border: '1px solid #1e293b',
            color: '#64748b', fontWeight: 600, letterSpacing: '0.05em',
          }}>{tag}</span>
        ))}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </nav>
  )
}
