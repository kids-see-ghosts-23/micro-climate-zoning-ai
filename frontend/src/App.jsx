import React, { useState, useCallback } from 'react'
import MapView from './components/MapView'
import AnalysisPanel from './components/AnalysisPanel'
import ResultsPanel from './components/ResultsPanel'
import { analyzeArea, pollJob, getResults } from './api'

export default function App() {
  const [bbox, setBbox] = useState(null)
  const [jobId, setJobId] = useState(null)
  const [jobStatus, setJobStatus] = useState(null)
  const [results, setResults] = useState(null)
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = useCallback(async (bboxInput, cityName) => {
    setLoading(true)
    setError(null)
    setResults(null)
    setJobId(null)

    try {
      const { job_id } = await analyzeArea(bboxInput, cityName)
      setJobId(job_id)
      setJobStatus('pending')

      // Poll until complete
      const interval = setInterval(async () => {
        try {
          const job = await pollJob(job_id)
          setJobStatus(job.status)
          if (job.status === 'completed') {
            clearInterval(interval)
            const data = await getResults(job_id)
            setResults(data)
            setLoading(false)
          } else if (job.status === 'failed') {
            clearInterval(interval)
            setError(job.error_message || 'Analysis failed')
            setLoading(false)
          }
        } catch (e) {
          clearInterval(interval)
          setError(e.message)
          setLoading(false)
        }
      }, 2000)

    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f0f0f' }}>
      {/* Left panel */}
      <div style={{ width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #222' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #222' }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
            Micro-Climate Zoning AI
          </h1>
          <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            Block-by-block zoning codes via PINN simulation
          </p>
        </div>

        <AnalysisPanel
          onSubmit={handleSubmit}
          loading={loading}
          jobStatus={jobStatus}
          error={error}
        />

        {results && (
          <ResultsPanel
            results={results}
            selectedBlock={selectedBlock}
            onSelectBlock={setSelectedBlock}
          />
        )}
      </div>

      {/* Map */}
      <div style={{ flex: 1 }}>
        <MapView
          results={results}
          bbox={bbox}
          onBboxChange={setBbox}
          selectedBlock={selectedBlock}
          onSelectBlock={setSelectedBlock}
        />
      </div>
    </div>
  )
}
