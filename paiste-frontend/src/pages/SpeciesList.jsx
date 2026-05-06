import { useState, useEffect } from 'react'
import API from '../api'

const threatConfig = {
  critical: { color: 'bg-red-100 text-red-700 border-red-200', badge: 'bg-red-500' },
  high:     { color: 'bg-orange-100 text-orange-700 border-orange-200', badge: 'bg-orange-500' },
  moderate:   { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', badge: 'bg-yellow-500' },
  low:      { color: 'bg-green-100 text-green-700 border-green-200', badge: 'bg-green-500' },
}

export default function SpeciesList() {
  const [species, setSpecies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterThreat, setFilterThreat] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    API.get('/species/').then(res => {
      setSpecies(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = species.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.scientific_name?.toLowerCase().includes(search.toLowerCase())
    const matchThreat = filterThreat === 'all' || s.threat_level === filterThreat
    return matchSearch && matchThreat
  })

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <p className="text-gray-500">Loading species...</p>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'white' }}>
      <div className="max-w-8xl mx-auto p-20">
        <h1 className="text-2xl font-bold text-green-900 mb-1">Invasive Alien Species List in the Davao Region</h1>
        
        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search species..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="flex gap-2">
            {['all', 'critical', 'high', 'moderate', 'low'].map(t => (
              <button
                key={t}
                onClick={() => setFilterThreat(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  filterThreat === t
                    ? 'bg-green-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <p className="text-sm text-gray-500 mb-4">
          Showing <span className="font-semibold text-green-700">{filtered.length}</span> species
        </p>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <div
              key={s.id}
              onClick={() => setSelected(s)}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden"
            >
              {/* Image */}
              <div className="h-40 bg-gray-100 overflow-hidden">
                {s.image_url ? (
                  <img
                    src={s.image_url}
                    alt={s.name}
                    className="w-full h-full object-cover"
                    onError={e => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div
                  className="w-full h-full items-center justify-center text-4xl"
                  style={{ display: s.image_url ? 'none' : 'flex' }}
                >
                  🌿
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-gray-800 text-sm">{s.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 whitespace-nowrap ${threatConfig[s.threat_level]?.color || 'bg-gray-100 text-gray-600'}`}>
                    {s.threat_level}
                  </span>
                </div>
                <p className="text-xs text-gray-400 italic mb-2">{s.scientific_name}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{s.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {selected && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelected(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-lg w-full max-h-screen overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Image */}
              <div className="h-56 bg-gray-100 overflow-hidden rounded-t-2xl">
                {selected.image_url ? (
                  <img
                    src={selected.image_url}
                    alt={selected.name}
                    className="w-full h-full object-cover"
                    onError={e => e.target.src = ''}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">🌿</div>
                )}
              </div>

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{selected.name}</h2>
                    <p className="text-sm text-gray-400 italic">{selected.scientific_name}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${threatConfig[selected.threat_level]?.color}`}>
                    {selected.threat_level} threat
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-3 text-sm">
                  {selected.description && (
                    <div>
                      <p className="font-semibold text-gray-700">Description</p>
                      <p className="text-gray-600">{selected.description}</p>
                    </div>
                  )}
                  {selected.origin && (
                    <div>
                      <p className="font-semibold text-gray-700">Origin</p>
                      <p className="text-gray-600">{selected.origin}</p>
                    </div>
                  )}
                  {selected.ecological_impact && (
                    <div>
                      <p className="font-semibold text-gray-700">Ecological Impact</p>
                      <p className="text-gray-600">{selected.ecological_impact}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelected(null)}
                  className="mt-6 w-full bg-green-700 text-white py-2 rounded-lg text-sm hover:bg-green-800 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}