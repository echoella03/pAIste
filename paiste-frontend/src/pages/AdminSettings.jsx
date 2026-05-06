import { useState, useEffect } from 'react'
import API from '../api'
import { useAuth } from '../context/AuthContext'

export default function AdminSettings() {
  const { user: currentUser } = useAuth()
  const [tab, setTab] = useState('admins')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' })
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  
  // CRUD states
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', email: '' })
  const [deleteId, setDeleteId] = useState(null) // Tracks user targeted for deletion

  useEffect(() => { fetchUsers() }, [])

  // Reset states when changing tabs
  useEffect(() => {
    setEditingId(null)
    setDeleteId(null)
    setError('')
    setSuccess('')
  }, [tab])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await API.get('/admin/users')
      setUsers(res.data)
    } catch { setError('Failed to load users') }
    finally { setLoading(false) }
  }

  // --- CRUD: CREATE ---
  const handleAddAdmin = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      await API.post('/auth/register', { ...adminForm, role: 'admin' })
      setSuccess('Admin account created successfully!')
      setAdminForm({ name: '', email: '', password: '' })
      fetchUsers()
    } catch (err) { setError(err.response?.data?.detail || 'Failed to create admin') }
  }

  // --- CRUD: UPDATE ---
  const handleUpdateUser = async (id) => {
    setError(''); setSuccess('')
    try {
      await API.patch(`/admin/users/${id}`, editForm)
      setSuccess('User updated successfully')
      setEditingId(null)
      fetchUsers()
    } catch { setError('Update failed') }
  }

  // --- CRUD: DELETE (The Pop-up logic) ---
  const confirmDelete = async () => {
    if (!deleteId) return
    setError(''); setSuccess('')
    try {
      await API.delete(`/admin/users/${deleteId}`)
      setSuccess('User deleted successfully')
      setDeleteId(null)
      fetchUsers()
    } catch { 
      setError('Delete failed')
      setDeleteId(null)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (pwForm.new_password !== pwForm.confirm_password) return setError('New passwords do not match')
    try {
      await API.patch('/admin/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password
      })
      setSuccess('Password updated successfully!')
      setPwForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) { setError(err.response?.data?.detail || 'Failed to update password') }
  }

  const admins = users.filter(u => u.role === 'admin')
  const regularUsers = users.filter(u => u.role === 'user')

  return (
    <div className="min-h-screen mx-auto p-6 bg-white font-manjari relative">
      <h1 className="font-londrina text-2xl tracking-widest mb-6 text-[#0D3A24]">⚙️ SETTINGS</h1>

      {/* TABS */}
      <div className="flex gap-3 mb-6">
        {['admins', 'users', 'password'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full font-londrina tracking-widest text-sm transition border ${tab === t ? 'bg-[#0D3A24] text-white border-[#0D3A24]' : 'bg-white text-[#0D3A24] border-[#0D3A24]'}`}>
            {t === 'admins' ? 'MANAGE ADMINS' : t === 'users' ? 'VIEW USERS' : 'CHANGE PASSWORD'}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded mb-4 font-bold">{error}</div>}
      {success && <div className="bg-green-50 text-green-600 text-sm px-4 py-2 rounded mb-4 font-bold">{success}</div>}

      {/* MANAGE ADMINS TAB */}
      {tab === 'admins' && (
        <div className="space-y-6">
          <div className="border-2 rounded-xl p-6 border-[#0D3A24] bg-[#D9E2D8]/30">
            <h2 className="font-londrina tracking-widest text-sm mb-4 text-[#0D3A24]">ADD NEW ADMIN</h2>
            <form onSubmit={handleAddAdmin} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input required value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#0D3A24]" placeholder="Name" />
              <input required type="email" value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#0D3A24]" placeholder="Email" />
              <input required type="password" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#0D3A24]" placeholder="Password" />
              <button type="submit" className="sm:col-span-3 bg-[#0D3A24] text-white font-londrina tracking-widest py-2 rounded-lg hover:bg-opacity-90 transition">+ ADD ADMIN</button>
            </form>
          </div>

          <div className="border-2 rounded-xl overflow-hidden border-[#0D3A24]">
            <div className="px-4 py-3 bg-[#D9E2D8]/50 font-londrina tracking-widest text-sm text-[#0D3A24]">EXISTING ADMINS ({admins.length})</div>
            <table className="w-full text-sm">
              <thead className="bg-[#D9E2D8]/20 border-b border-[#0D3A24]/20 font-londrina text-[#0D3A24]">
                <tr className="text-left">
                  <th className="px-4 py-3 tracking-wider">Name</th>
                  <th className="px-4 py-3 tracking-wider">Email</th>
                  <th className="px-4 py-3 tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {admins.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 font-bold text-[#0D3A24]">
                      {editingId === a.id ? <input className="border rounded px-2 py-1 w-full font-normal" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /> : a.name}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {editingId === a.id ? <input className="border rounded px-2 py-1 w-full" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} /> : a.email}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {editingId === a.id ? (
                        <div className="flex justify-end gap-3 font-bold text-xs uppercase">
                          <button onClick={() => handleUpdateUser(a.id)} className="text-[#2E7D32] hover:underline">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-gray-400 hover:underline">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-4 font-bold text-sm">
                          <button onClick={() => { setEditingId(a.id); setEditForm({name: a.name, email: a.email}) }} className="text-[#2E7D32] hover:underline">Edit</button>
                          <button onClick={() => setDeleteId(a.id)} className="text-[#C62828] hover:underline">Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW USERS TAB */}
      {tab === 'users' && (
        <div className="border-2 rounded-xl overflow-hidden border-[#0D3A24]">
          <div className="px-4 py-3 bg-[#D9E2D8]/50 font-londrina tracking-widest text-sm text-[#0D3A24]">REGISTERED USERS ({regularUsers.length})</div>
          {loading ? <p className="text-center py-8 italic text-gray-400">Loading users...</p> : (
            <table className="w-full text-sm">
              <thead className="bg-[#D9E2D8]/20 border-b border-[#0D3A24]/20 font-londrina text-[#0D3A24]">
                <tr className="text-left uppercase text-xs tracking-widest">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {regularUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      {editingId === u.id ? <input className="border rounded px-2 w-full font-normal" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /> : <span className="font-bold text-[#0D3A24]">{u.name}</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {editingId === u.id ? <input className="border rounded px-2 w-full" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} /> : u.email}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingId === u.id ? (
                        <div className="flex justify-end gap-3 font-bold text-xs uppercase">
                          <button onClick={() => handleUpdateUser(u.id)} className="text-[#2E7D32] hover:underline">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-gray-400 hover:underline">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-4 font-bold text-sm">
                          <button onClick={() => { setEditingId(u.id); setEditForm({name: u.name, email: u.email}) }} className="text-[#2E7D32] hover:underline">Edit</button>
                          <button onClick={() => setDeleteId(u.id)} className="text-[#C62828] hover:underline">Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CHANGE PASSWORD TAB */}
      {tab === 'password' && (
        <div className="border-2 rounded-xl p-8 max-w-md bg-[#D9E2D8]/30 border-[#0D3A24]">
          <h2 className="font-londrina tracking-widest text-lg mb-1 text-[#0D3A24]">CHANGE PASSWORD</h2>
          <p className="font-manjari text-xs text-gray-500 mb-6 italic">Update your administrative credentials.</p>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-[#0D3A24] uppercase mb-1">Current Password</label>
              <input required type="password" value={pwForm.current_password} onChange={e => setPwForm({...pwForm, current_password: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#0D3A24]" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#0D3A24] uppercase mb-1">New Password</label>
              <input required type="password" value={pwForm.new_password} onChange={e => setPwForm({...pwForm, new_password: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#0D3A24]" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#0D3A24] uppercase mb-1">Confirm New Password</label>
              <input required type="password" value={pwForm.confirm_password} onChange={e => setPwForm({...pwForm, confirm_password: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#0D3A24]" placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full font-londrina tracking-widest text-sm text-white py-3 rounded-lg bg-[#0D3A24] hover:bg-opacity-90 mt-4 transition-all">UPDATE PASSWORD</button>
          </form>
        </div>
      )}

      {/* CUSTOM DELETE POP-UP BOX */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 scale-in-center transition-all">
            <div className="bg-[#FFEBEE] p-6 text-center">
              <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                <span className="text-[#C62828] text-2xl">⚠️</span>
              </div>
              <h3 className="font-londrina text-[#C62828] text-xl tracking-widest uppercase">Confirm Delete</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600 text-sm font-manjari mb-6">Are you sure? This account and all its data will be permanently removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2 border-2 border-gray-100 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition-colors">CANCEL</button>
                <button onClick={confirmDelete} className="flex-1 py-2 bg-[#C62828] text-white rounded-xl font-bold hover:bg-opacity-90 shadow-md shadow-red-200">DELETE</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}