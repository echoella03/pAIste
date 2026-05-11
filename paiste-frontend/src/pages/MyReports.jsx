import { useState, useEffect } from 'react'
import API from '../api'

const statusConfig = {
  pending:   { label: 'Pending',   bg: '#fef9c3', text: '#854d0e', icon: '⏳' },
  validated: { label: 'Validated', bg: '#dcfce7', text: '#166534', icon: '✅' },
  rejected:  { label: 'Rejected',  bg: '#fee2e2', text: '#991b1b', icon: '❌' },
}

export default function MyReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    API.get('/reports/me').then(res => setReports(res.data))
      .catch(() => setError('Failed to load reports'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <p className="font-manjari text-gray-500">Loading reports...</p>
    </div>
  )

  return (
  <div className="min-h-screen flex flex-col bg-white">
    <div className="max-w-[1400px] mx-auto py-24 px-8 w-full" style={{ minHeight: '100vh' }}>
      <h1 className="font-londrina text-4xl text-green-900 mb-6">
        MY REPORTS
      </h1>

      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded mb-6 font-manjari">{error}</div>}

      {reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="font-londrina text-2xl tracking-wider text-gray-400">NO REPORTS YET</p>
          <p className="font-manjari text-gray-400 text-sm mt-2">Submit a report when you spot an invasive species</p>
          <a href="/identify" className="inline-block mt-4 font-londrina tracking-widest text-sm text-white px-6 py-2 rounded-lg" style={{ backgroundColor: '#0D3A24' }}>
            IDENTIFY NOW
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
          {reports.map(report => {
            const status = statusConfig[report.status] || statusConfig.pending
            const fullImageUrl = `https://ubepwtvycbbskgtyotzw.supabase.co/storage/v1/object/public/pAIste%20images/${encodeURI(report.image_path)}`;

            return (
              <div key={report.id} className="bg-white rounded-2xl overflow-hidden flex flex-col h-full shadow-xl hover:shadow-md transition-all duration-300"
                   style={{ backgroundColor: '#fcfef5', borderColor: '#0D3A24' }}>
                
                <div className="p-5 flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-manjari font-bold text-xl tracking-wide leading-tight" style={{ color: '#0D3A24' }}>
                        Report #{report.id}
                      </p>
                      <p className="font-manjari text-[12px] text-gray-400 mt-1">
                        {new Date(report.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="font-manjari font-bold text-[12px] px-3 py-1.5 rounded-full tracking-wider border shadow-sm"
                      style={{ backgroundColor: status.bg, color: status.text, borderColor: status.border }}>
                      {status.icon} {status.label.toUpperCase()}
                    </span>
                  </div>

                  {/* Clickable Image */}
                  {report.image_path && (
                    <div 
                      className="mb-5 overflow-hidden rounded-xl border border-gray-100 shadow-inner cursor-pointer group relative"
                      onClick={() => setSelectedImage(fullImageUrl)}
                    >
                      <img 
                        src={fullImageUrl}
                        alt={`Report ${report.id}`} 
                        className="w-full h-60 object-cover hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/400x250?text=Image+Not+Found'; }}
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white bg-black/60 px-4 py-2 rounded-full text-xs font-manjari backdrop-blur-sm">
                          🔍 Click to Enlarge
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Info Section */}
                  <div className="flex-grow space-y-4">
                    <div className="space-y-1">
                      {report.location_name && (
                        <div className="flex items-center gap-2">
                          <span className="text-base">📍</span>
                          <p className="font-manjari text-m text-gray-700 font-medium leading-tight">{report.location_name}</p>
                        </div>
                      )}
                      {report.gps_lat && report.gps_lng && (
                        <div className="flex items-center gap-2 ml-1">
                          <span className="text-m opacity-50">🌐</span>
                          <p className="font-manjari text-[12px] text-gray-400 tracking-wider">
                            {report.gps_lat.toFixed(5)}, {report.gps_lng.toFixed(5)}
                          </p>
                        </div>
                      )}
                    </div>

                    {report.detections?.length > 0 && (
                      <div className="pt-2">
                        <p className="font-manjari text-[12px] text-gray-400 mb-2 uppercase tracking-widest font-bold">Detected Species</p>
                        <div className="flex flex-wrap gap-2">
                          {report.detections.map((d, i) => (
                            <span key={i} className="font-manjari text-m px-3 py-1 rounded-full border border-green-100 shadow-sm"
                                  style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>
                              {d.species_name} ({(d.confidence_score * 100).toFixed(0)}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Section */}
                  <div className="mt-6 pt-4 border-t border-gray-50 space-y-3">
                    {report.admin_remarks && (
                      <div className="bg-gray-50 rounded-xl p-3 border-l-4 border-green-600 shadow-sm">
                        <p className="font-manjari text-[12px] text-gray-500 font-bold uppercase tracking-tighter">Admin Feedback</p>
                        <p className="font-manjari text-m text-gray-700 mt-1 leading-relaxed italic">"{report.admin_remarks}"</p>
                      </div>
                    )}
                    {report.notes && (
                      <div className="flex gap-2 items-start opacity-70 px-1">
                        <span className="text-xs mt-0.5">📝</span>
                        <p className="font-manjari text-xs text-gray-500 italic leading-snug">{report.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>

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
)}
