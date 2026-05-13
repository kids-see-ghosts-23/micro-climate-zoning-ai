import React, { useState, useCallback } from 'react'
import MapView from './components/MapView'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import StatsBar from './components/StatsBar'
import { analyzeArea, pollJob, getResults } from './api'
import './global.css'

export default function App() {
  const [jobId, setJobId] = useState(null)
  const [jobStatus, setJobStatus] = useState(null)
  const [results, setResults] = useState(null)
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [cityName, setCityName] = useState('')

  const handleSubmit = useCallback(async (bboxInput, city, analysisDate) => {
    setLoading(true)
    setError(null)
    setResults(null)
    setSelectedBlock(null)
    setCityName(city)

    try {
      const { job_id } = await analyzeArea(bboxInput, city, analysisDate)
      setJobId(job_id)
      setJobStatus('pending')

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
    <div className="app-shell">
      <Navbar cityName={cityName} results={results} loading={loading} jobStatus={jobStatus} />
      <div className="main-layout">
        <Sidebar
          onSubmit={handleSubmit}
          loading={loading}
          jobStatus={jobStatus}
          error={error}
          results={results}
          selectedBlock={selectedBlock}
          onSelectBlock={setSelectedBlock}
        />
        <div className="map-area">
          {results && <StatsBar results={results} />}
          <MapView
            results={results}
            selectedBlock={selectedBlock}
            onSelectBlock={setSelectedBlock}
          />
        </div>
      </div>
    </div>
  )
}
