const BASE = import.meta.env.VITE_API_URL || ''

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || res.statusText)
  }
  return res.json()
}

export const analyzeArea = (bbox, cityName, analysisDate) =>
  request('POST', '/api/v1/analyze', {
    bbox,
    city_name: cityName,
    analysis_date: analysisDate || null,
  })

export const pollJob = (jobId) =>
  request('GET', `/api/v1/jobs/${jobId}`)

export const getResults = (jobId) =>
  request('GET', `/api/v1/results/${jobId}`)

export const getBlock = (blockId) =>
  request('GET', `/api/v1/blocks/${blockId}`)
