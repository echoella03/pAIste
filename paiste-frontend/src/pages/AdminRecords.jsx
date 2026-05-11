import { useState, useEffect } from 'react'
import API from '../api'

const threatColor = { critical: '#CA0000', high: '#D97524', moderate: '#d4a017', low: '#36AD42' }
const threatBg = { critical: '#fee2e2', high: '#ffedd5', moderate: '#fef9c3', low: '#dcfce7' }

export default function AdminRecords() {
  const [tab, setTab] = useState('reports')
  const [reports, setReports] = useState([])
  const [mcts, setMcts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState(null)

const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
const [searchTerm, setSearchTerm] = useState('');

const requestSort = (key) => {
  let direction = 'asc';
  if (sortConfig.key === key && sortConfig.direction === 'asc') {
    direction = 'desc';
  }
  setSortConfig({ key, direction });
};


const getSortedData = (data) => {
  const sortableItems = [...data];
  
  sortableItems.sort((a, b) => {
    let aValue, bValue;

    if (sortConfig.key === 'species_name') {
      const getSpecies = (item) => {
        if (item.detections?.[0]?.species_name) return item.detections[0].species_name;
        if (item.species_name) return item.species_name;
        
        // Cross-reference lookup for MCTS table
        const ref = reports.find(r => r.id === item.report_id);
        return ref?.detections?.[0]?.species_name || '';
      };

      aValue = getSpecies(a).toLowerCase();
      bValue = getSpecies(b).toLowerCase();
    } 
    else if (sortConfig.key === 'threat_level') {
      aValue = a.threat_level || '';
      bValue = b.threat_level || '';
    }
    else {
      aValue = a[sortConfig.key];
      bValue = b[sortConfig.key];
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sortableItems;
};

const filteredReports = getSortedData(reports).filter(r => {
  const species = (r.detections?.[0]?.species_name || '').toLowerCase();
  const location = (r.location_name || '').toLowerCase();
  const search = searchTerm.toLowerCase();
  
  return species.includes(search) || location.includes(search);
});

  useEffect(() => {
    Promise.all([
      API.get('/admin/reports?status=validated'),
      API.get('/dashboard/mcts'),
    ]).then(([rRes, mRes]) => {
      setReports(rRes.data)
      setMcts(mRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const tabs = ['reports', 'threat scores', 'gallery view']

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'white' }}>
      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2 rounded-full font-londrina tracking-widest text-sm transition border"
            style={tab === t
              ? { backgroundColor: '#0D3A24', color: 'white', borderColor: '#0D3A24' }
              : { backgroundColor: 'white', color: '#0D3A24', borderColor: '#0D3A24' }
            }
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="font-manjari text-gray-500 text-center py-12">Loading records...</p>
      ) : (
        <>
          {/* Reports Table */}
          {tab === 'reports' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs border-b" style={{ backgroundColor: '#D9E2D8' }}>
                    {[
                      { label: 'ID', key: 'id' },
                      { label: 'Species', key: 'species_name' },
                      { label: 'Location', key: 'location_name' },
                      { label: 'Latitude', key: 'gps_lat' },
                      { label: 'Longitude', key: 'gps_lng' },
                      { label: 'Confidence', key: 'confidence_score'},
                      { label: 'Date', key: 'submitted_at' }
                    ].map((col) => (
                      <th 
                        key={col.key}
                        onClick={() => requestSort(col.key)}
                        className="px-4 py-3 font-londrina tracking-wider cursor-pointer hover:bg-opacity-80 select-none"
                      >
                        {col.label} {sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                      </th>
                    ))}
                    <th className="px-4 py-3 font-londrina tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedData(reports).map(r => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-manjari text-gray-600">#{r.id}</td>
                      <td className="px-4 py-3 font-manjari font-bold text-gray-800">
                        {r.detections?.[0]?.species_name || '—'}
                      </td>
                      <td className="px-4 py-3 font-manjari text-gray-600">{r.location_name || '—'}</td>
                      <td className="px-4 py-3 font-manjari text-gray-600">{r.gps_lat || '—'}</td>
                      <td className="px-4 py-3 font-manjari text-gray-600">{r.gps_lng || '—'}</td>
                      <td className="px-4 py-3 font-manjari text-gray-600">
                        {r.detections?.[0] ? `${(r.detections[0].confidence_score * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td className="px-4 py-3 font-manjari text-gray-500 text-xs">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-londrina text-xs px-2 py-0.5 rounded-full tracking-wider"
                          style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                          VALIDATED
                        </span>
                      </td>
                    </tr>
                  ))}
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center font-manjari text-gray-400">
                        No validated reports yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Threat Scores */}
          {tab === 'threat scores' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs border-b" style={{ backgroundColor: '#D9E2D8' }}>
                    {[
                      { label: 'Report', key: 'report_id' },
                      { label: 'Species Name', key: 'species_name' },
                      { label: 'Total Score', key: 'total_score' },
                      { label: 'Species Impact(S1)', key: 'ecological_impact' },
                      { label: 'Spread Rate (Sd)', key: 'spread_rate' },
                      { label: 'Density (Sd)', key: 'detection_frequency'},
                      { label: 'Threat Level', key: 'threat_level' }
                    ].map((col) => (
                      <th 
                        key={col.key}
                        onClick={() => requestSort(col.key)}
                        className="px-4 py-3 font-londrina tracking-wider cursor-pointer hover:bg-opacity-80 select-none"
                      >
                        {col.label} {sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getSortedData(mcts).map((m, i) => {
                    const relatedReport = reports.find(r => r.id === m.report_id);
                    const nameFromReport = relatedReport?.detections?.[0]?.species_name;
                    return(
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">   {/*{reports.map(r =>*/}
                        <td className="px-4 py-3 font-manjari text-gray-600">#{m.report_id}</td>
                        <td className="px-4 py-3 font-manjari text-gray-600">{m.species_name || nameFromReport}</td>
                        <td className="px-4 py-3 font-manjari font-bold" style={{ color: '#0D3A24' }}>
                          {m.total_score.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 font-manjari text-gray-600">{m.ecological_impact.toFixed(2)}</td>
                        <td className="px-4 py-3 font-manjari text-gray-600">{m.spread_rate.toFixed(2)}</td>
                        <td className="px-4 py-3 font-manjari text-gray-600">{m.detection_frequency.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className="font-londrina text-xs px-2 py-0.5 rounded-full tracking-wider"
                            style={{
                              backgroundColor: threatBg[m.threat_level],
                              color: threatColor[m.threat_level]
                            }}>
                            {m.threat_level.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                  )})}
                  {mcts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center font-manjari text-gray-400">
                        No threat scores yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Gallery View */}
          {tab === 'gallery view' && (
          <div className="space-y-6">
            {/* 1. Search Bar UI */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 max-w-md shadow-sm">
              <span className="text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search species or location..."
                className="w-full focus:outline-none font-manjari text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              )}
            </div>

            {/* 2. Gallery Content */}
            <div>
              {/* Check filteredReports length instead of reports length */}
              {filteredReports.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                  <p className="font-londrina text-2xl tracking-wider text-gray-400">
                    {searchTerm ? 'NO MATCHING RESULTS FOUND' : 'NO VALIDATED PHOTOS YET'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* Use filteredReports here */}
                  {filteredReports.map(r => (
                    <div
                      key={r.id}
                      onClick={() => setSelectedPhoto(r)}
                      className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition hover:-translate-y-0.5"
                    >
                      <div className="h-40 bg-gray-100 overflow-hidden">
                        <img
                          src={`https://ubepwtvycbbskgtyotzw.supabase.co/storage/v1/object/public/pAIste%20images/${encodeURI(r.image_path)}`}
                          alt="detection"
                          className="w-full h-full object-cover"
                          onError={e => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-4xl">🌿</div>';
                          }}
                        />
                      </div>
                      <div className="p-3">
                        <p className="font-manjari font-bold text-xs text-gray-800 truncate">
                          {r.detections?.[0]?.species_name || 'Unknown'}
                        </p>
                        <p className="font-manjari text-xs text-gray-400 truncate">{r.location_name || '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        </>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="h-64 overflow-hidden bg-gray-100">
              <img
                src={`https://ubepwtvycbbskgtyotzw.supabase.co/storage/v1/object/public/pAIste%20images/${encodeURI(selectedPhoto.image_path)}`}
                alt="detection"
                className="w-full h-full object-cover"
                onError={e => e.target.src = ''}
              />
            </div>
            <div className="p-6 space-y-2">
              <p className="font-londrina text-xl tracking-wide" style={{ color: '#0D3A24' }}>
                Report #{selectedPhoto.id}
              </p>
              <p className="font-manjari text-sm text-gray-700">
                <strong>Species:</strong> {selectedPhoto.detections?.[0]?.species_name || '—'}
              </p>
              <p className="font-manjari text-sm text-gray-700">
                <strong>Location:</strong> {selectedPhoto.location_name || '—'}
              </p>
              <p className="font-manjari text-sm text-gray-700">
                <strong>Confidence:</strong> {selectedPhoto.detections?.[0]
                  ? `${(selectedPhoto.detections[0].confidence_score * 100).toFixed(1)}%`
                  : '—'}
              </p>
              <p className="font-manjari text-sm text-gray-700">
                <strong>Date:</strong> {new Date(selectedPhoto.submitted_at).toLocaleString()}
              </p>
              {selectedPhoto.notes && (
                <p className="font-manjari text-sm text-gray-700">
                  <strong>Notes:</strong> {selectedPhoto.notes}
                </p>
              )}
              <button
                onClick={() => setSelectedPhoto(null)}
                className="mt-4 w-full py-2 rounded-lg font-londrina tracking-widest text-white text-sm"
                style={{ backgroundColor: '#0D3A24' }}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
