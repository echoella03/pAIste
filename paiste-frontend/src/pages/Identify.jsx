import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet' 
import API from '../api'
import { useAuth } from '../context/AuthContext'
import UserNavbar from '../components/UserNavbar'
import PublicNavbar from '../components/PublicNavbar'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function MapPicker({ position, setPosition }) {
  useMapEvents({ click(e) { setPosition([e.latlng.lat, e.latlng.lng]) } })
  return position ? <Marker position={position} /> : null
}

export default function Identify() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('upload')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [annotatedImage, setAnnotatedImage] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [locationMode, setLocationMode] = useState('auto')
  const [position, setPosition] = useState(null)
  const [locationName, setLocationName] = useState('')
  const [gpsLoading, setGpsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)
  const streamRef = useRef(null)
  const detectIntervalRef = useRef(null)
  const isDetectingRef = useRef(false)
  const [cameraActive, setCameraActive] = useState(false)

  const defaultCenter = [7.1907, 125.4553]

  useEffect(() => {
    if (mode === 'camera') setTimeout(() => startCamera(), 150)
    else stopCamera()
  }, [mode])

  useEffect(() => { return () => { stopCamera() } }, [])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
      setResults(null); setAnnotatedImage(null); setError('')
      setSubmitted(false); setPosition(null); setSubmitError('')
    }
  }

  const runIdentification = async (file) => {
    if (!file) return
    setLoading(true); setError('')
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await API.post('/identify/', formData)
      setResults(res.data)
      if (res.data.annotated_image) setAnnotatedImage(`data:image/jpeg;base64,${res.data.annotated_image}`)
    } catch { setError('Identification failed. Check if server is running.') }
    finally { setLoading(false) }
  }

  const handleAutoDetect = () => {
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setPosition([pos.coords.latitude, pos.coords.longitude]); setGpsLoading(false) },
      () => { setSubmitError('Could not get GPS. Use Manual Input.'); setGpsLoading(false) }
    )
  }

  const handleSubmitReport = async () => {
    if (!position) return setSubmitError('Please set a location first')
    setSubmitting(true); setSubmitError('')
    try {
      const formData = new FormData()
      formData.append('image', image)
      formData.append('gps_lat', position[0])
      formData.append('gps_lng', position[1])
      formData.append('location_name', locationName)
      formData.append('location_source', locationMode)
      formData.append('notes', '')
      await API.post('/reports/', formData)
      setSubmitted(true)
    } catch { setSubmitError('Failed to submit report. Please try again.') }
    finally { setSubmitting(false) }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current.play()
            setCameraActive(true)
            startLiveDetection()
          } catch (err) { console.error('Video play failed:', err) }
        }
      }
    } catch { setError('Camera access denied.') }
  }

  const stopCamera = () => {
    stopLiveDetection()
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    setCameraActive(false)
    if (overlayRef.current) {
      const ctx = overlayRef.current.getContext('2d')
      ctx?.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height)
    }
  }

  const drawBoundingBoxes = (detections) => {
    const video = videoRef.current;
    const overlay = overlayRef.current;
    
    if (!overlay || !video || video.videoWidth === 0) return;

    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
    const ctx = overlay.getContext('2d');
    
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    if (!detections || detections.length === 0) return;

    detections.forEach(d => {
      if (!d.bbox) return; 
      
      try {
        const [x1, y1, x2, y2] = d.bbox;
        const safeY = y1 < 30 ? y1 + 30 : y1;

        if (d.accepted) {
          ctx.strokeStyle = '#CA0000';
          ctx.lineWidth = 4;
          ctx.setLineDash([]); 
          ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

          const label = `IAS: ${d.species_name} ${(d.confidence_score * 100).toFixed(0)}%`;
          ctx.font = 'bold 24px sans-serif';
          ctx.fillStyle = '#CA0000';
          const textWidth = ctx.measureText(label).width;
          
          ctx.fillRect(x1, safeY - 30, textWidth + 10, 30);
          ctx.fillStyle = 'white';
          ctx.fillText(label, x1 + 5, safeY - 8);
        } else {
          ctx.strokeStyle = '#FFD700'; 
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]); 
          ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

          const label = `Scanning... ${(d.confidence_score * 100).toFixed(0)}%`;
          ctx.font = 'bold 18px sans-serif';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          
          ctx.fillRect(x1, safeY - 24, ctx.measureText(label).width + 10, 24);
          ctx.fillStyle = 'white';
          ctx.fillText(label, x1 + 5, safeY - 6);
        }
      } catch (err) {
        console.error('Error drawing box:', err);
      }
    });
  };

  const runLiveDetection = async () => {
    if (!videoRef.current || isDetectingRef.current || videoRef.current.videoWidth === 0) return;

    isDetectingRef.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob(async (blob) => {
      try {
        const formData = new FormData()
        formData.append('image', new File([blob], 'live.jpg', { type: 'image/jpeg' }))
        const res = await API.post('/identify/', formData)

        if (res.data && res.data.detections) {
          drawBoundingBoxes(res.data.detections);
        }
      } catch (err) {
        console.error("API Call failed:", err);
      } finally {
        isDetectingRef.current = false
      }
    }, 'image/jpeg', 0.6)
  };

  const startLiveDetection = () => {
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current)
    // Runs the scan every 2 seconds
    detectIntervalRef.current = setInterval(runLiveDetection, 2000)
  }

  const stopLiveDetection = () => {
    if (detectIntervalRef.current) { clearInterval(detectIntervalRef.current); detectIntervalRef.current = null }
    isDetectingRef.current = false
  }

  const captureFrame = () => {
    const video = videoRef.current; const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const capturedFile = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
      setPreview(canvas.toDataURL('image/jpeg')); setImage(capturedFile)
      setMode('upload'); stopCamera()
      await runIdentification(capturedFile)
    }, 'image/jpeg', 0.9)
  }

  const hasConfirmedIAS = results?.detections?.some(d => d.accepted)
  const hasAnyDetection = results?.detections?.length > 0

  return (
    <div className="min-h-screen flex flex-col pt-16" style={{ backgroundColor: '#FFFFFF' }}>
      {user ? <UserNavbar /> : <PublicNavbar />}

      <div className="flex-1 max-w-3xl mx-auto p-12 w-full">
        
        <div className="flex mb-4 rounded-lg overflow-hidden h-10" style={{ border: '2px solid #0D3A24' }}>
          <button 
            onClick={() => { 
              setMode('upload'); 
              stopCamera(); 
            }} 
            className="flex-1 font-londrina tracking-widest text-sm transition"
            style={mode === 'upload' ? { backgroundColor: '#0D3A24', color: 'white' } : { backgroundColor: 'white', color: '#0D3A24' }}
          >
            Upload
          </button>
          <button 
            onClick={() => { 
              setMode('camera'); 
              setResults(null);      
              setPreview(null);     
              setAnnotatedImage(null); 
            }} 
            className="flex-1 font-londrina tracking-widest text-sm transition"
            style={mode === 'camera' ? { backgroundColor: '#0D3A24', color: 'white' } : { backgroundColor: 'white', color: '#0D3A24' }}
          >
            Live Camera
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded mb-3 font-manjari">{error}</div>}

        {mode === 'upload' && (
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden" style={{ minHeight: '200px', border: '2px solid #D9E2D8', backgroundColor: '#FCFDE7' }}>
              {annotatedImage ? (
                <img src={annotatedImage} alt="result" className="w-full object-contain max-h-80" />
              ) : preview ? (
                <img src={preview} alt="preview" className="w-full object-contain max-h-80" />
              ) : (
                <label className="flex flex-col items-center justify-center h-48 cursor-pointer gap-2">
                  <span className="text-3xl">🌿</span>
                  <span className="font-manjari text-sm" style={{ color: '#466958' }}>Click to upload image</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
            {preview && (
              <label className="block text-center text-xs font-manjari cursor-pointer underline" style={{ color: '#0D3A24' }}>
                Choose different image
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
            <button onClick={() => runIdentification(image)} disabled={!image || loading}
              className="w-full py-2.5 rounded-lg font-londrina tracking-widest text-sm text-white transition disabled:opacity-50"
              style={{ backgroundColor: '#0D3A24' }}>
              {loading ? 'Analyzing...' : 'Identify Specie'}
            </button>
          </div>
        )}

        {mode === 'camera' && (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden bg-black w-full" style={{ aspectRatio: '16/9' }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover" 
              />
              <canvas 
                ref={overlayRef} 
                className="absolute inset-0 w-full h-full pointer-events-none z-10 object-cover" 
              />

              {cameraActive && (
                <div className="absolute top-2 left-2 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 z-20"
                  style={{ backgroundColor: '#CA0000' }}>
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  LIVE AI
                </div>
              )}
            </div>

            <button onClick={captureFrame} disabled={!cameraActive}
              className="w-full py-2.5 rounded-lg font-londrina tracking-widest text-sm text-white transition disabled:opacity-50"
              style={{ backgroundColor: '#0D3A24' }}>
              Capture and Identify
            </button>
          </div>
        )}

        {results && (
          <div className="mt-6 space-y-4">
            {hasConfirmedIAS ? (
              <>
                <div>
                  <p className="font-londrina tracking-widest text-sm font-bold mb-2" style={{ color: '#0D3A24' }}>
                    DETECTION RESULT: <span style={{ color: '#CA0000' }}>Invasive Specie Identified</span>
                  </p>
                  <div className="space-y-2">
                    {results.detections.filter(d => d.accepted).map((d, i) => (
                      <div key={i} className="rounded-lg p-4 bg-white"
                        style={{ border: '1px solid #fca5a5', borderLeft: '4px solid #CA0000' }}>
                        <p className="font-manjari font-bold text-gray-800">{d.species_name}</p>
                        <p className="font-manjari text-xs text-gray-500">
                          Confidence Level: {(d.confidence_score * 100).toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {!user && (
                  <div className="rounded-lg p-5 bg-white text-center space-y-3" style={{ border: '2px solid #D9E2D8' }}>
                    <p className="font-manjari text-gray-600 text-sm">Want to report this sighting?</p>
                    <button onClick={() => navigate('/login')}
                      className="w-full py-2 rounded-lg font-londrina tracking-widest text-sm text-white transition"
                      style={{ backgroundColor: '#0D3A24' }}>
                      LOGIN TO REPORT →
                    </button>
                    <p className="font-manjari text-xs text-gray-400">
                      Don't have an account?{' '}
                      <span onClick={() => navigate('/register')} className="underline cursor-pointer font-bold" style={{ color: '#0D3A24' }}>
                        Register here
                      </span>
                    </p>
                  </div>
                )}

                {user && !submitted && (
                  <div className="space-y-3">
                    <p className="font-londrina tracking-widest text-sm font-bold" style={{ color: '#0D3A24' }}>
                      LOCATION:{' '}
                      <span className="font-manjari font-normal text-gray-500 text-xs">
                        {position ? `${position[0].toFixed(5)}, ${position[1].toFixed(5)}` : 'Not set'}
                      </span>
                    </p>

                    <div className="flex rounded-lg overflow-hidden" style={{ border: '2px solid #0D3A24' }}>
                      <button onClick={() => { setLocationMode('auto'); handleAutoDetect() }}
                        className="flex-1 py-2 font-londrina tracking-widest text-xs transition"
                        style={locationMode === 'auto' ? { backgroundColor: '#0D3A24', color: 'white' } : { backgroundColor: 'white', color: '#0D3A24' }}>
                        {gpsLoading ? 'Detecting...' : 'Auto-detect'}
                      </button>
                      <button onClick={() => setLocationMode('manual')}
                        className="flex-1 py-2 font-londrina tracking-widest text-xs transition"
                        style={locationMode === 'manual' ? { backgroundColor: '#0D3A24', color: 'white' } : { backgroundColor: 'white', color: '#0D3A24' }}>
                        Manual Input
                      </button>
                    </div>

                    {locationMode === 'manual' && (
                      <div className="rounded-lg overflow-hidden" style={{ height: '200px', border: '2px solid #D9E2D8' }}>
                        <MapContainer center={position || defaultCenter} zoom={10} style={{ height: '100%', width: '100%' }}>
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <MapPicker position={position} setPosition={setPosition} />
                        </MapContainer>
                      </div>
                    )}

                    <input type="text" value={locationName} onChange={e => setLocationName(e.target.value)}
                      placeholder="Location name (optional, e.g. Davao River)"
                      className="w-full rounded-lg px-3 py-2 text-sm font-manjari focus:outline-none"
                      style={{ border: '2px solid #D9E2D8', backgroundColor: '#FCFDE7', color: '#0D3A24' }} />

                    {submitError && <p className="font-manjari text-sm" style={{ color: '#CA0000' }}>{submitError}</p>}

                    <button onClick={handleSubmitReport} disabled={submitting || !position}
                      className="w-full py-2.5 rounded-lg font-londrina tracking-widest text-sm text-white transition disabled:opacity-50"
                      style={{ backgroundColor: '#0D3A24' }}>
                      {submitting ? 'Submitting...' : 'SUBMIT REPORT'}
                    </button>
                  </div>
                )}

                {user && submitted && (
                  <div className="rounded-lg p-5 text-center" style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac' }}>
                    <p className="font-londrina tracking-widest text-lg" style={{ color: '#166534' }}>✅ REPORT SUBMITTED!</p>
                    <p className="font-manjari text-sm mt-1" style={{ color: '#166534' }}>Your report is pending admin review.</p>
                    <button onClick={() => navigate('/my-reports')} className="mt-3 font-londrina tracking-wider text-xs underline" style={{ color: '#0D3A24' }}>
                      VIEW MY REPORTS →
                    </button>
                  </div>
                )}
              </>
            ) : hasAnyDetection ? (
              <div className="rounded-lg p-6 text-center" style={{ backgroundColor: '#fef9c3', border: '1px solid #fde68a' }}>
                <p className="text-3xl mb-2">🔍</p>
                <p className="font-londrina tracking-widest" style={{ color: '#854d0e' }}>SUBJECT DETECTED</p>
                <p className="font-manjari text-sm mt-1" style={{ color: '#92400e' }}>
                  A subject was found, but the AI could not confirm it as an invasive species.
                </p>
                <p className="font-manjari text-xs mt-2" style={{ color: '#b45309' }}>
                  Try a different angle or clearer lighting.
                </p>
                <button onClick={() => { setResults(null); setPreview(null); setMode('camera') }}
                  className="mt-4 font-londrina tracking-wider text-xs underline" style={{ color: '#92400e' }}>
                  RETRY SCAN
                </button>
              </div>
            ) : (
              <div className="rounded-lg p-6 text-center" style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac' }}>
                <p className="font-londrina tracking-widest" style={{ color: '#166534' }}>✅ NO IAS DETECTED</p>
                <p className="font-manjari text-sm mt-1" style={{ color: '#166534' }}>{results.message || 'No invasive species found.'}</p>
              </div>
            )}
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}