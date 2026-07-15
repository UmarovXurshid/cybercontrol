import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { PencilIcon, TrashIcon, PlusIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

const emptyForm = { username: '', fish: '', role: 'viloyat', viloyat: '', parol: '', is_active: true }

export default function Foydalanuvchilar() {
  const [list, setList]       = useState([])
  const [viloyatlar, setViloyatlar] = useState([])
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState(emptyForm)
  const [editId, setEditId]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const load = () => {
    api.get('/foydalanuvchilar/').then(r => setList(r.data))
    api.get('/viloyatlar/').then(r => setViloyatlar(r.data))
  }
  useEffect(() => { load() }, [])

  const openAdd  = ()    => { setForm(emptyForm); setEditId(null); setShowPass(false); setModal(true) }
  const openEdit = item  => {
    setForm({
      username: item.username,
      fish:     item.fish || '',
      role:     item.role,
      viloyat:  item.viloyat || '',
      parol:    '',
      is_active: item.is_active,
    })
    setEditId(item.id)
    setShowPass(false)
    setModal(true)
  }
  const close = () => setModal(false)

  const save = async e => {
    e.preventDefault()
    if (!form.username.trim()) return toast.error("Login bo'sh bo'lmasin")
    if (!editId && !form.parol.trim()) return toast.error("Yangi foydalanuvchi uchun parol kerak")
    setLoading(true)
    try {
      const payload = { ...form }
      if (!payload.viloyat) delete payload.viloyat
      if (!payload.parol)   delete payload.parol
      if (editId) {
        await api.put(`/foydalanuvchilar/${editId}/`, payload)
        toast.success('Yangilandi!')
      } else {
        await api.post('/foydalanuvchilar/', payload)
        toast.success("Foydalanuvchi qo'shildi!")
      }
      close()
      load()
    } catch (err) {
      const msg = err.response?.data?.username?.[0] || 'Xato!'
      toast.error(msg)
    }
    finally { setLoading(false) }
  }

  const del = async id => {
    if (!confirm("Foydalanuvchini o'chirasizmi?")) return
    await api.delete(`/foydalanuvchilar/${id}/`)
    toast.success("O'chirildi")
    load()
  }

  const roleBadge = role => role === 'respublika'
    ? <span className="badge-blue">Respublika</span>
    : <span className="badge-green">Viloyat</span>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Foydalanuvchilar
          <span className="ml-2 text-base font-normal text-gray-400">({list.length})</span>
        </h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4"/> Qo'shish
        </button>
      </div>

      {list.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">👤</p>
          <p className="text-lg font-medium">Foydalanuvchilar yo'q</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-xs">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Login</th>
                <th className="px-4 py-3 text-left">FIO</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Viloyat</th>
                <th className="px-4 py-3 text-left">Holat</th>
                <th className="px-4 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.map((u, i) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-mono font-medium text-gray-900">{u.username}</td>
                  <td className="px-4 py-3 text-gray-600">{u.fish || '—'}</td>
                  <td className="px-4 py-3">{roleBadge(u.role)}</td>
                  <td className="px-4 py-3 text-gray-500">{u.viloyat_nomi || '—'}</td>
                  <td className="px-4 py-3">
                    {u.is_active
                      ? <span className="text-green-600 text-xs font-medium">Faol</span>
                      : <span className="text-red-500 text-xs font-medium">Bloklangan</span>}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(u)}
                      className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition">
                      <PencilIcon className="w-4 h-4"/>
                    </button>
                    <button onClick={() => del(u.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition">
                      <TrashIcon className="w-4 h-4"/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">
              {editId ? 'Foydalanuvchini tahrirlash' : "Yangi foydalanuvchi"}
            </h2>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Login *</label>
                <input className="input-field" placeholder="viloyat_admin"
                  value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">FIO</label>
                <input className="input-field" placeholder="Ism Familiya"
                  value={form.fish} onChange={e => setForm({ ...form, fish: e.target.value })}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parol {editId && '(bo\'sh qoldirsa o\'zgarmaydi)'}</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} className="input-field pr-10"
                    placeholder="••••••••" value={form.parol}
                    onChange={e => setForm({ ...form, parol: e.target.value })}
                    required={!editId}/>
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeSlashIcon className="w-4 h-4"/> : <EyeIcon className="w-4 h-4"/>}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select className="input-field" value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="viloyat">Viloyat admin</option>
                  <option value="respublika">Respublika admin</option>
                </select>
              </div>
              {form.role === 'viloyat' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Viloyat</label>
                  <select className="input-field" value={form.viloyat}
                    onChange={e => setForm({ ...form, viloyat: e.target.value })}>
                    <option value="">— Tanlang —</option>
                    {viloyatlar.map(v => (
                      <option key={v.id} value={v.id}>{v.nomi}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600"/>
                <label htmlFor="is_active" className="text-sm text-gray-700">Faol</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={close}
                  className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  Bekor qilish
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-sm font-medium transition disabled:opacity-50">
                  {loading ? '⏳' : editId ? 'Saqlash' : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
