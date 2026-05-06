import { useState, useEffect } from 'react'
import API from '../api'

const threatColor = { critical: '#CA0000', high: '#D97524', moderate: '#d4a017', low: '#36AD42' }
const threatBg = { critical: '#fee2e2', high: '#ffedd5', moderate: '#fef9c3', low: '#dcfce7' }

const AI_DETECTABLE = [
  'Acacia mangium','Asian house rat','Australian redclaw crayfish',
  'Banded bull frog','Buyo-buyo','Cane toad','Chinese edible frog',
  'Crown of thorns','Fall armyworm','Giant african land snail',
  'Golden apple snail','Greenhouse frog','House mouse','Ipil-ipil',
  'Nile tilapia','Walking catfish','Water hyacinth'
]

const emptyForm = {
  name: '', scientific_name: '', description: '',
  threat_level: 'moderate', origin: '', ecological_impact: '',
  image_url: '', is_invasive: true,
}

export default function AdminSpecies() {
  const [species, setSpecies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => { fetchSpecies() }, [])

  const fetchSpecies = async () => {
    try {
      const res = await API.get('/species/')
      setSpecies(res.data)
    } catch { setError('Failed to load species') }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      if (editingId) {
        await API.patch(`/species/${editingId}`, form)
        setSuccess('Species updated!')
      } else {
        await API.post('/species/', form)
        setSuccess('Species added!')
      }
      setShowForm(false); setEditingId(null); setForm(emptyForm)
      fetchSpecies()
    } catch (err) { setError(err.response?.data?.detail || 'Failed to save') }
  }

  const handleEdit = (s) => {
    setForm({ name: s.name, scientific_name: s.scientific_name || '', description: s.description || '',
      threat_level: s.threat_level, origin: s.origin || '', ecological_impact: s.ecological_impact || '',
      image_url: s.image_url || '', is_invasive: s.is_invasive })
    setEditingId(s.id); setShowForm(true); setError(''); setSuccess('')
  }

  const handleDelete = async (id) => {
    try {
      await API.delete(`/species/${id}`)
      setSuccess('Species deleted!'); setDeleteConfirm(null); fetchSpecies()
    } catch { setError('Failed to delete') }
  }

  const filtered = species.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.scientific_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'white' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-nerko text-2xl" style={{ color: '#0D3A24' }}>🌿 Manage Species</h1>
          <p className="font-manjari text-sm text-gray-500">Manage the IAS species catalog. Note: Adding new species here does not train the AI model.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); setError(''); setSuccess('') }}
          className="font-londrina tracking-widest text-sm text-white px-5 py-2 rounded-lg transition"
          style={{ backgroundColor: '#0D3A24' }}
        >
          + Add New Species
        </button>
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm font-manjari text-yellow-700">
        ⚠️ <strong>Note:</strong> Adding new species to this list does NOT enable AI detection. The AI can only identify the 17 species it was trained on. New species are for documentation only.
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded mb-3 font-manjari">{error}</div>}
      {success && <div className="bg-green-50 text-green-600 text-sm px-4 py-2 rounded mb-3 font-manjari">{success}</div>}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="font-londrina text-lg tracking-wider mb-4" style={{ color: '#0D3A24' }}>
            {editingId ? 'EDIT SPECIES' : 'ADD NEW SPECIES'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Common Name *', key: 'name', required: true, placeholder: 'e.g. Golden apple snail' },
              { label: 'Scientific Name', key: 'scientific_name', placeholder: 'e.g. Pomacea canaliculata' },
              { label: 'Origin', key: 'origin', placeholder: 'e.g. South America' },
              { label: 'Image URL', key: 'image_url', placeholder: 'https://...' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-manjari font-bold text-gray-700 mb-1">{f.label}</label>
                <input
                  required={f.required}
                  value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-manjari focus:outline-none focus:ring-2 focus:ring-green-700"
                />
              </div>
            ))}

            <div>
              <label className="block text-xs font-manjari font-bold text-gray-700 mb-1">Threat Level *</label>
              <select
                value={form.threat_level}
                onChange={e => setForm({ ...form, threat_level: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-manjari focus:outline-none focus:ring-2 focus:ring-green-700"
              >
                {['low', 'moderate', 'high', 'critical'].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-manjari font-bold text-gray-700 mb-1">Description</label>
              <textarea rows={2} value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-manjari focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-manjari font-bold text-gray-700 mb-1">Ecological Impact</label>
              <textarea rows={2} value={form.ecological_impact}
                onChange={e => setForm({ ...form, ecological_impact: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-manjari focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>

            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="font-londrina tracking-widest text-white px-6 py-2 rounded-lg text-sm"
                style={{ backgroundColor: '#0D3A24' }}>
                {editingId ? 'UPDATE' : 'ADD SPECIES'}
              </button>
              <button type="button"
                onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm) }}
                className="font-londrina tracking-widest px-6 py-2 rounded-lg text-sm border"
                style={{ color: '#0D3A24', borderColor: '#0D3A24' }}>
                CANCEL
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search species..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-manjari focus:outline-none focus:ring-2 focus:ring-green-700 mb-4 bg-white"
      />

      {/* Table */}
      {loading ? (
        <p className="font-manjari text-gray-500 text-center py-12">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs border-b" style={{ backgroundColor: '#D9E2D8' }}>
                {['Image', 'Species', 'Threat', 'Origin', 'AI Detectable', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 font-londrina tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                      {s.image_url ? (
                        <img src={s.image_url} alt={s.name} className="w-full h-full object-cover"
                          onError={e => { e.target.style.display = 'none' }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">🌿</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-manjari font-bold text-gray-800">{s.name}</p>
                    <p className="font-manjari text-xs text-gray-400 italic">{s.scientific_name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-londrina text-xs px-2 py-0.5 rounded-full tracking-wider"
                      style={{ backgroundColor: threatBg[s.threat_level], color: threatColor[s.threat_level] }}>
                      {s.threat_level}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-manjari text-gray-500 text-xs">{s.origin || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`font-londrina text-xs px-2 py-0.5 rounded-full tracking-wider ${
                      AI_DETECTABLE.includes(s.name)
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {AI_DETECTABLE.includes(s.name) ? '✅ Yes' : '❌ No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => handleEdit(s)}
                        className="font-londrina text-xs tracking-wider hover:underline"
                        style={{ color: '#1C6E0B' }}>
                        Edit
                      </button>
                      <button onClick={() => setDeleteConfirm(s.id)}
                        className="font-londrina text-xs tracking-wider hover:underline"
                        style={{ color: '#CA0000' }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-londrina text-lg tracking-wider mb-2" style={{ color: '#0D3A24' }}>DELETE SPECIES?</h3>
            <p className="font-manjari text-gray-500 text-sm mb-4">This will remove the species from the catalog. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2 rounded-lg font-londrina tracking-widest text-sm text-white"
                style={{ backgroundColor: '#CA0000' }}>
                DELETE
              </button>
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-lg font-londrina tracking-widest text-sm border"
                style={{ color: '#0D3A24', borderColor: '#0D3A24' }}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}