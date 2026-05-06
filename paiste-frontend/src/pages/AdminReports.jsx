import { useState, useEffect } from 'react'
import API from '../api'

const statusColor = {
  pending:   { bg: '#fef9c3', text: '#854d0e', border: '#fde68a' },
  validated: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  rejected:  { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
}

export default function AdminReports() {
  const [reports, setReports] = useState([])
  const [users, setUsers] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [remarks, setRemarks] = useState({})
  const [error, setError] = useState('')
  
  // NEW: State to hold the currently selected full-size image
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => { fetchData() }, [filter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [reportsRes, usersRes] = await Promise.all([
        API.get(`/admin/reports?status=${filter}`),
        API.get('/admin/users'),
      ])
      setReports(reportsRes.data)
      const userMap = {}
      usersRes.data.forEach(u => { userMap[u.id] = u.name })
      setUsers(userMap)
    } catch { setError('Failed to load reports') }
    finally { setLoading(false) }
  }

  const handleValidate = async (id) => {
    try {
      await API.patch(`/admin/reports/${id}/validate`, {
        status: 'validated', admin_remarks: remarks[id] || '',
      })
      fetchData()
    } catch { setError('Failed to validate') }
  }

  const handleReject = async (id) => {
    try {
      await API.patch(`/admin/reports/${id}/reject`, {
        status: 'rejected', admin_remarks: remarks[id] || '',
      })
      fetchData()
    } catch { setError('Failed to reject') }
  }

  return (
    <div className="min-h-screen p-6 bg-white">
      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        {['pending', 'validated', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-6 py-2 rounded-full font-londrina tracking-widest text-sm transition border"
            style={filter === s
              ? { backgroundColor: '#0D3A24', color: 'white', borderColor: '#0D3A24' }
              : { backgroundColor: 'white', color: '#0D3A24', borderColor: '#0D3A24' }
            }>
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded mb-4 font-manjari">{error}</div>}

      {loading ? (
        <p className="font-manjari text-gray-500 text-center py-12">Loading reports...</p>
      ) : reports.length === 0 ? (
        <div className="border-2 rounded-xl p-12 text-center" style={{ borderColor: '#0D3A24' }}>
          <p className="font-londrina text-2xl tracking-wider" style={{ color: '#A4AD7E' }}>
            NO {filter.toUpperCase()} REPORTS
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map(report => {
            // Generate the exact cloud URL for this image
            const fullImageUrl = `https://ubepwtvycbbskgtyotzw.supabase.co/storage/v1/object/public/pAIste%20images/${encodeURI(report.image_path)}`;

            return (
              <div key={report.id} className="rounded-xl overflow-hidden border-2" style={{ borderColor: '#0D3A24' }}>
                
                {/* Clickable Image Section */}
                <div 
                  className="w-full h-48 overflow-hidden cursor-pointer group relative" 
                  style={{ backgroundColor: 'rgba(217,226,216,0.3)' }}
                  onClick={() => setSelectedImage(fullImageUrl)}
                >
                  <img
                    src={fullImageUrl}
                    alt="report"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e => {
                      e.target.style.display = 'none'
                      e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-5xl">🌿</div>'
                    }}
                  />
                  {/* Hover Overlay Text */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white bg-black/60 px-4 py-2 rounded-full text-xs font-manjari backdrop-blur-sm">
                      🔍 Click to Enlarge
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-londrina text-lg tracking-wide" style={{ color: '#0D3A24' }}>
                        Report #{report.id}
                      </p>
                      <p className="font-manjari text-xs text-gray-400">
                        {new Date(report.submitted_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="font-londrina text-xs px-3 py-1 rounded-full tracking-wider"
                      style={{
                        backgroundColor: statusColor[report.status]?.bg,
                        color: statusColor[report.status]?.text,
                        border: `1px solid ${statusColor[report.status]?.border}`,
                      }}>
                      {report.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Submitted by */}
                  <div className="flex items-center gap-1 mb-2">
                    <span className="font-manjari text-xs text-gray-500">Submitted by:</span>
                    <span className="font-manjari text-xs font-bold" style={{ color: '#0D3A24' }}>
                      {users[report.user_id] || `User #${report.user_id}`}
                    </span>
                  </div>

                  {/* Location — both lat/lng and name */}
                  <div className="mb-3 space-y-0.5">
                    {report.location_name && (
                      <p className="font-manjari text-sm text-gray-700">
                        📍 {report.location_name}
                      </p>
                    )}
                    <p className="font-manjari text-xs text-gray-400">
                      🌐 {report.gps_lat?.toFixed(5)}, {report.gps_lng?.toFixed(5)}
                      {report.location_source && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-xs"
                          style={{ backgroundColor: 'rgba(217,226,216,0.5)', color: '#466958' }}>
                          {report.location_source === 'auto' ? '📡 Auto' : '🗺️ Manual'}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Detections */}
                  {report.detections?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {report.detections.map((d, i) => (
                        <span key={i} className="font-manjari text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'rgba(217,226,216,0.5)', color: '#0D3A24' }}>
                          {d.species_name} ({(d.confidence_score * 100).toFixed(0)}%)
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {report.notes && (
                    <p className="font-manjari text-xs text-gray-500 mb-3">📝 {report.notes}</p>
                  )}

                  {/* Admin remarks display */}
                  {report.admin_remarks && (
                    <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: 'rgba(217,226,216,0.3)' }}>
                      <p className="font-manjari text-xs text-gray-500 font-bold">Remarks:</p>
                      <p className="font-manjari text-sm text-gray-700 mt-0.5">{report.admin_remarks}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {report.status === 'pending' && (
                    <div className="border-t border-gray-100 pt-3">
                      <textarea
                        placeholder="Add remarks (optional)..."
                        value={remarks[report.id] || ''}
                        onChange={e => setRemarks({ ...remarks, [report.id]: e.target.value })}
                        rows={2}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-manjari focus:outline-none focus:ring-2 focus:ring-green-700 mb-3"
                      />
                      <div className="flex gap-3">
                        <button onClick={() => handleValidate(report.id)}
                          className="flex-1 py-2 rounded-lg font-londrina tracking-widest text-sm text-white transition"
                          style={{ backgroundColor: '#1C6E0B' }}>
                          Validate
                        </button>
                        <button onClick={() => handleReject(report.id)}
                          className="flex-1 py-2 rounded-lg font-londrina tracking-widest text-sm text-white transition"
                          style={{ backgroundColor: '#CA0000' }}>
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* --- IMAGE MODAL OVERLAY --- */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm transition-all animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white text-4xl transition-colors p-2"
            onClick={() => setSelectedImage(null)}
          >
            &times;
          </button>
          <img 
            src={selectedImage} 
            alt="Enlarged Report" 
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()} // Prevents closing when clicking the image itself
          />
        </div>
      )}
    </div>
  )
}