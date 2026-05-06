import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import API from '../api'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const threatColor = { critical: '#CA0000', high: '#D97524', moderate: '#d4a017', low: '#36AD42' }

const createThreatIcon = (level) => L.divIcon({
  className: '',
  html: `<div style="background:${threatColor[level] || '#36AD42'};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
  iconSize: [12, 12], iconAnchor: [6, 6],
})

export default function MapView() {
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    API.get('/map/detections').then(res => setPoints(res.data))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? points : points.filter(p => p.threat_level === filter)

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'white' }}>
      <div className="max-w-5xl mx-auto py-20 px-20 w-full" style={{ minHeight: '100vh' }}>
        <h1 className="font-londrina text-2xl tracking-widest mb-4" style={{ color: '#0D3A24' }}>
          INVASIVE SPECIES MAP VIEW
        </h1>

        {/* Filter + Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex gap-2 flex-wrap">
            {['all', 'critical', 'high', 'moderate', 'low'].map(level => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className="px-4 py-1 rounded-full font-manjari font-bold tracking-wider text-xs transition border"
                style={filter === level
                  ? { backgroundColor: '#0D3A24', color: 'white', borderColor: '#0D3A24' }
                  : { backgroundColor: 'white', color: '#0D3A24', borderColor: '#0D3A24' }
                }
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex gap-3 flex-wrap">
            {Object.entries(threatColor).map(([level, color]) => (
              <div key={level} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="font-manjari font-bold text-xs tracking-wider capitalize"  style={{ color: '#0D3A24' }}>{level}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="font-manjari text-sm text-gray-500 mb-3">
          Showing <span className="font-bold" style={{ color: '#0D3A24' }}>{filtered.length}</span> detections
        </p>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center" style={{ height: '400px' }}>
            <p className="font-manjari text-gray-400">Loading map...</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '500px' }}>
            <MapContainer center={[7.1907, 125.4553]} zoom={8} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap" />
              {filtered.map(point => (
                <Marker
                  key={point.report_id}
                  position={[point.gps_lat, point.gps_lng]}
                  icon={createThreatIcon(point.threat_level || 'low')}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold" style={{ color: '#0D3A24' }}>{point.species_name}</p>
                      {point.location_name && <p className="text-gray-600">📍 {point.location_name}</p>}
                      <p className="text-gray-400 text-xs">{point.gps_lat.toFixed(5)}, {point.gps_lng.toFixed(5)}</p>
                      {point.threat_level && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: threatColor[point.threat_level] }}>
                          {point.threat_level} threat
                        </span>
                      )}
                      <p className="text-gray-400 text-xs mt-1">
                        {new Date(point.detected_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  )
}