import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import API from '../api'

export default function AdminNavbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await API.get('/admin/reports?status=pending')
        setPendingCount(res.data.length)
      } catch {}
    }
    fetchPending()
    const interval = setInterval(fetchPending, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }
  const isActive = (path) => location.pathname.startsWith(path)

  const links = [
    { to: '/admin/dashboard', label: 'DASHBOARD', badge: 0 },
    { to: '/admin/reports',   label: 'REPORTS',   badge: pendingCount },
    { to: '/admin/records',   label: 'RECORDS',   badge: 0 },
    { to: '/admin/species',   label: 'SPECIES',   badge: 0 },
    { to: '/admin/settings',  label: 'SETTINGS',  badge: 0 },
  ]

  return (
    <nav className="navbar-dark px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img src="/pAIste-logo.png" alt="pAIste" className="h-10 w-10 object-contain" />
        <span className="font-londrina text-white text-m tracking-widest hidden md:block">
          Hi, {user?.name?.toUpperCase().substring(0, 20)}
        </span>
      </div>
      <div className="flex items-center gap-5">
        {links.map(link => (
          <Link key={link.to} to={link.to} className="relative">
            <span className={`font-londrina tracking-wider text-m transition ${
              isActive(link.to) ? 'text-green-300 border-b-2 border-green-300 pb-0.5' : 'text-white hover:text-green-300'
            }`}>
              {link.label}
            </span>
            {link.badge > 0 && (
              <span className="absolute -top-2 -right-3 font-londrina text-white flex items-center justify-center rounded-full"
                style={{ backgroundColor: '#CA0000', fontSize: '9px', minWidth: '16px', height: '16px', padding: '0 3px' }}>
                {link.badge > 99 ? '99+' : link.badge}
              </span>
            )}
          </Link>
        ))}
        <button onClick={handleLogout}
          className="font-londrina tracking-wider text-m text-white border border-white px-3 py-1 rounded hover:bg-white hover:text-green-900 transition">
          LOGOUT
        </button>
      </div>
    </nav>
  )
}