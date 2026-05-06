import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import AdminNavbar from './components/AdminNavbar'
import UserNavbar from './components/UserNavbar'
import PublicNavbar from './components/PublicNavbar'

import Landing from './pages/Landing'
import About from './pages/About'
import Login from './pages/Login'
import Register from './pages/Register'
import Identify from './pages/Identify'
import MyReports from './pages/MyReports'
import SpeciesList from './pages/SpeciesList'
import MapView from './pages/MapView'
import Dashboard from './pages/Dashboard'
import AdminReports from './pages/AdminReports'
import AdminRecords from './pages/AdminRecords'
import AdminSpecies from './pages/AdminSpecies'
import AdminSettings from './pages/AdminSettings'

const NO_NAVBAR = ['/', '/login', '/register', '/about']

function App() {
  const { user } = useAuth()
  const location = useLocation()
  const hideNavbar = NO_NAVBAR.includes(location.pathname)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FCFDE7' }}>
      {!user && !hideNavbar && <PublicNavbar />}
      {user?.role === 'admin' && !hideNavbar && <AdminNavbar />}
      {user && user.role !== 'admin' && !hideNavbar && <UserNavbar />}

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/identify" element={<Identify />} />
        <Route path="/my-reports" element={<PrivateRoute><MyReports /></PrivateRoute>} />
        <Route path="/species" element={<PrivateRoute><SpeciesList /></PrivateRoute>} />
        <Route path="/map" element={<PrivateRoute><MapView /></PrivateRoute>} />
        <Route path="/admin/dashboard" element={<PrivateRoute adminOnly><Dashboard /></PrivateRoute>} />
        <Route path="/admin/reports" element={<PrivateRoute adminOnly><AdminReports /></PrivateRoute>} />
        <Route path="/admin/records" element={<PrivateRoute adminOnly><AdminRecords /></PrivateRoute>} />
        <Route path="/admin/species" element={<PrivateRoute adminOnly><AdminSpecies /></PrivateRoute>} />
        <Route path="/admin/settings" element={<PrivateRoute adminOnly><AdminSettings /></PrivateRoute>} />
        <Route path="*" element={
          user
            ? user.role === 'admin' ? <Navigate to="/admin/dashboard" /> : <Navigate to="/identify" />
            : <Navigate to="/" />
        } />
      </Routes>
    </div>
  )
}

export default App