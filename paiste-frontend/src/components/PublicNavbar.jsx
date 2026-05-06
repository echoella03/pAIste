import { useNavigate } from 'react-router-dom'

export default function PublicNavbar() {
  const navigate = useNavigate()
  
  return (
    <nav className="h-16 px-8 flex items-center justify-between shadow-md w-full bg-[#0D3A24] fixed top-0 z-50">
      <div className="flex items-center gap-3">
        <img src="/pAIste-logo.png" alt="pAIste" className="h-10 w-10 object-contain" />
        <span className="font-londrina text-white text-lg tracking-widest hidden lg:block">
          INVASIVE ALIEN SPECIES DETECTION SYSTEM
        </span>
      </div>
      
      <div className="flex items-center gap-6">
        {[
          { label: 'HOME',     path: '/' },
          { label: 'ABOUT',    path: '/about' },
          { label: 'LOGIN',    path: '/login' },
          { label: 'REGISTER', path: '/register' },
        ].map(item => (
          <button 
            key={item.label} 
            onClick={() => navigate(item.path)}
            className="font-londrina tracking-wider text-m text-white hover:text-green-300 transition"
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  )
}