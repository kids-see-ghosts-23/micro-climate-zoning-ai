import React, { useState } from 'react'

const STATUS_COLOR = {
  pending: '#f59e0b',
  running: '#3b82f6',
  completed: '#10b981',
  failed: '#ef4444',
}

export default function AnalysisPanel({ onSubmit, loading, jobStatus, error }) {
  const [form, setForm] = useState({
    city_name: 'New York',
    min_lon: -74.01,
    min_lat: 40.705,
    max_lon: -73.97,
    max_lat: 40.725,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(
      {
        min_lon: parseFloat(form.min_lon),
        min_lat: parseFloat(form.min_lat),
        max_lon: parseFloat(form.max_lon),
        max_lat: parseFloat(form.max_lat),
      },
      form.city_name
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '20px 24px', borderBottom: '1px solid #222' }}>
      <label style={labelStyle}>City Name</label>
      <input
        name="city_name"
        value={form.city_name}
        onChange={handleChange}
        style={inputStyle}
        placeholder="e.g. New York"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
        {['min_lon', 'min_lat', 'max_lon', 'max_lat'].map((k) => (
          <div key={k}>
            <label style={labelStyle}>{k.replace('_', ' ').toUpperCase()}</label>
            <input
              name={k}
              value={form[k]}
              onChange={handleChange}
              style={inputStyle}
              type="number"
              step="0.001"
            />
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: 16,
          width: '100%',
          padding: '10px 0',
          background: loading ? '#333' : '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
        }}
      >
        {loading ? `Running... (${jobStatus || 'queuing'})` : 'Run Analysis'}
      </button>

      {jobStatus && (
        <div style={{ marginTop: 8, fontSize: 12, color: STATUS_COLOR[jobStatus] || '#666' }}>
          Job status: {jobStatus}
        </div>
      )}

      {error && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#ef4444' }}>
          Error: {error}
        </div>
      )}
    </form>
  )
}

const labelStyle = { fontSize: 11, color: '#888', letterSpacing: '0.05em', textTransform: 'uppercase' }
const inputStyle = {
  display: 'block',
  width: '100%',
  marginTop: 4,
  padding: '7px 10px',
  background: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: 5,
  color: '#fff',
  fontSize: 13,
  outline: 'none',
}
