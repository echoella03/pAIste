import { useNavigate } from 'react-router-dom'
import PublicNavbar from '../components/PublicNavbar' // Import your standardized navbar
import UserNavbar from '../components/UserNavbar'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col pt-16" style={{ backgroundColor: '#FFFFFF' }}>
      
      <PublicNavbar />  

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 gap-10">
        <h1
          className="font-londrina text-5xl md:text-6xl font-bold text-center mb-12 tracking-wide"
          style={{ color: '#0D3A24' }}
        >
          FOUND A POTENTIAL INVASIVE SPECIE?
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 max-w-4xl w-full">
          {/* Identify only — goes directly to /identify */}
          <button
            onClick={() => navigate('/identify')}
            className="group flex flex-col items-center gap-4 rounded-2xl p-6 transition-all duration-300 hover:bg-[#518F57]/5 hover:shadow-lg hover:-translate-y-1"
            style={{ backgroundColor: '#FCFDE7' }}
          >
            <img src="frog.png" alt="Identify" className="h-40 w-40 object-contain drop-shadow-md group-hover:drop-shadow-xl transition-all" />
            <p className="font-londrina text-4xl tracking-wider text-[#184b13] group-hover:text-green-700">
              IDENTIFY
            </p>
          </button>

          {/* Submit a Report — requires login */}
          <button
            onClick={() => navigate('/login')}
            className="group flex flex-col items-center gap-4 rounded-2xl p-6 transition-all duration-300 hover:bg-[#518F57]/5 hover:shadow-lg hover:-translate-y-1"
            style={{ backgroundColor: '#FCFDE7' }}
          >
            <img src="treasure-map.png" alt="SUBMIT A REPORT" className="h-40 w-40 object-contain drop-shadow-md group-hover:drop-shadow-xl transition-all" />
            <p className="font-londrina text-4xl tracking-wider text-[#184b13] group-hover:text-green-700">
              SUBMIT A REPORT
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}