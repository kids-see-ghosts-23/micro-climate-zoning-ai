/**
 * Geocode a city name to a bounding box using OpenStreetMap Nominatim.
 * Returns { min_lon, min_lat, max_lon, max_lat, display_name } or null.
 */
export async function geocodeCity(cityName) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1&featuretype=city`

  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'MicroClimateZoningAI/1.0' }
  })

  if (!res.ok) throw new Error('Geocoding failed')

  const data = await res.json()
  if (!data.length) throw new Error(`City "${cityName}" not found`)

  const place = data[0]
  const [min_lat, max_lat, min_lon, max_lon] = place.boundingbox.map(Number)

  // Nominatim returns the full city bbox which can be huge
  // Clamp it to a ~2km analysis window centered on the city centroid
  const centerLat = parseFloat(place.lat)
  const centerLon = parseFloat(place.lon)
  const delta = 0.018  // ~2km

  return {
    min_lon: parseFloat((centerLon - delta).toFixed(5)),
    min_lat: parseFloat((centerLat - delta).toFixed(5)),
    max_lon: parseFloat((centerLon + delta).toFixed(5)),
    max_lat: parseFloat((centerLat + delta).toFixed(5)),
    display_name: place.display_name,
    center: [centerLat, centerLon],
  }
}
