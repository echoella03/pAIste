import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function UserNavbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()


  const isActive = (path) => location.pathname === path

  // 2. Define which links are "Protected" (only for logged-in users)
  const allLinks = [
    { to: '/identify', label: 'SUBMIT REPORT', private: false },
    { to: '/my-reports', label: 'MY REPORTS', private: true },
    { to: '/map', label: 'MAP', private: false },
    { to: '/species', label: 'SPECIES LIST', private: false },
    { to: '/login', label: 'LOGOUT', private: true },
  ]

  // 3. Filter the links based on whether a user exists
  const visibleLinks = allLinks.filter(link => {
    if (link.private && !user) return false; // Hide private links if no user
    return true;
  })

  return (
    <nav className="fixed top-0 left-0 w-full h-16 bg-[#0D3A24] px-8 flex items-center justify-between z-50 shadow-md">
      {/* Logo & Greeting */}
      <div className="flex items-center gap-3">
        <img src="/pAIste-logo.png" alt="pAIste" className="h-10 w-10 object-contain" />
        <span className="font-londrina text-white text-lg tracking-widest hidden md:block">
          Hi, {user?.name?.toUpperCase().substring(0, 20)}
        </span>
      </div>

      <div className="flex items-center gap-6">
        {visibleLinks.map(link => {
          const isLogout = link.label === 'LOGOUT';
          
          return (
            <Link 
              key={link.to} 
              to={link.to}
              onClick={isLogout ? () => { logout(); navigate('/login', { replace: true }); } : undefined}
              className={`font-londrina text-green tracking-wider transition ${
                isLogout 
                  ? 'text-white text-m border border-green-100 px-3 py-1 rounded hover:bg-green-100 hover:text-green-900' 
                  : `text-m ${isActive(link.to) ? 'text-green-300 border-b-2 border-green-300 pb-0.5' : 'text-white hover:text-green-300'}`
              }`}
            >
              {link.label}
            </Link>
          )
        })}
        
        {/* 5. Optional: Show a "LOGIN" button if no user is present */}
        {!user && location.pathname !== '/login' && (
          <Link to="/login" className="font-londrina text-white hover:text-green-300 text-m tracking-wider">
            LOGIN
          </Link>
        )}
      </div>
    </nav>
  )
}