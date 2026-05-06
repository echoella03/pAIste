import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import API from '../api'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      await API.post('/auth/register', form)
      navigate('/login')
    } catch (err) { setError(err.response?.data?.detail || 'Registration failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'white' }}>
      <nav className="navbar-dark px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/pAIste-logo.png" alt="pAIste" className="h-10 w-10 object-contain" />
          <span className="font-londrina text-white text-m tracking-widest hidden md:block">
            INVASIVE ALIEN SPECIES DETECTION SYSTEM
          </span>
        </div>
        <div className="flex items-center gap-5">
          <button onClick={() => navigate('/')}
            className="font-londrina tracking-wider text-m text-white hover:text-green-300 transition">HOME</button>
          <button onClick={() => navigate('/about')}
            className="font-londrina tracking-wider text-m text-white hover:text-green-300 transition">ABOUT</button>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="rounded-2m shadow-lg p-10 w-full max-w-sm" style={{ backgroundColor: '#FFFFF9' }}>
          <div className="flex flex-col items-center mb-6">
            <img src="/pAIste-logo.png" alt="pAIste" className="h-28 w-28 object-contain mb-2" />
          </div>
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4 font-manjari">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {[{ label: 'Name', key: 'name', type: 'text' }, { label: 'Email', key: 'email', type: 'email' }, { label: 'Password', key: 'password', type: 'password' }].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-manjari font-bold text-gray-700 mb-1">{f.label}</label>
                <input type={f.type} required value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-manjari focus:outline-none focus:ring-2 focus:ring-green-700" />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full py-2 rounded-lg font-londrina tracking-widest text-white transition"
              style={{ backgroundColor: '#0D3A24' }}>
              {loading ? 'REGISTERING...' : 'REGISTER'}
            </button>
          </form>
          <p className="text-center text-sm font-manjari text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="font-bold hover:underline" style={{ color: '#0D3A24' }}>Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}