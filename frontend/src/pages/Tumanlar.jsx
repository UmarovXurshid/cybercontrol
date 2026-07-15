import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'

const EMPTY = { tuman_nomi: '', viloyat: '' }

export default function Tumanlar() {
  const role = localStorage.getItem('role')

  const [list, setList]           = useState([])
  const [viloyatlar, setViloyatlar] = useState([])
  const [search, setSearch]       = useState('')
  const [modal, setModal]         = useState(false)
  const [form, setForm]           = useState(EMPTY)
  const [editId, setEditId]       = useState(null)
  const [saving, setSaving]       = useState(false)
  const [delId, setDelId]         = useState(null)

  const load = () => api.get('/tumanlar/').then(r => setList(r.data))

  useEffect(() => {
    load()
    if (role === 'respublika') {
      api.get('/viloyatlar/').then(r => setViloyatlar(r.data))
    }
  }, [])

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setModal(true) }
  const openEdit = t  => {
    setForm({ tuman_nomi: t.tuman_nomi, viloyat: t.viloyat || '' })
    setEditId(t.id)
    setModal(true)
  }
  const close = () => { setModal(false); setForm(EMPTY); setEditId(null) }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { tuman_nomi: form.tuman_nomi }
      if (role === 'respublika' && form.viloyat) {
        payload.viloyat = Number(form.viloyat)
      }
      if (editId) {
        await api.put(`/tumanlar/${editId}/`, payload)
        toast.success('Yangilandi!')
      } else {
        await api.post('/tumanlar/', payload)
        toast.success("Qo'shildi!")
      }
      close()
      load()
    } catch (err) {
      toast.error('Xato: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message))
    } finally {
      setSaving(false)
    }
  }

  const del = async id => {
    if (!window.confirm("Tumanni o'chirasizmi? Tarkibidagi mahallalar ham o'chishi mumkin!")) return
    setDelId(id)
    try {
      await api.delete(`/tumanlar/${id}/`)
      toast.success("O'chirildi")
      load()
    } catch { toast.error("Xato! Tuman bog'liq ma'lumotlar mavjud bo'lishi mumkin.") }
    finally { setDelId(null) }
  }

  const filtered = list.filter(t =>
    t.tuman_nomi?.toLowerCase().includes(search.toLowerCase()) ||
    t.viloyat_nomi?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Sarlavha */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Tumanlar
          <span className="ml-2 text-base font-normal text-gray-400">({list.length})</span>
        </h1>
        <button onClick={openAdd} className="btn-success">➕ Tuman qo'shish</button>
      </div>

      {/* Qidiruv */}
      <div className="card mb-6">
        <input
          className="input-field"
          placeholder="🔍 Tuman yoki viloyat bo'yicha qidirish..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Jadval */}
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr>
              {['#', 'Tuman nomi', 'Viloyat', 'Amallar'].map(h => (
                <th key={h} className="table-header text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="table-cell text-gray-400">{i + 1}</td>
                <td className="table-cell font-semibold">{t.tuman_nomi}</td>
                <td className="table-cell text-sm text-gray-500">{t.viloyat_nomi || '—'}</td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(t)}
                      className="text-xs px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors"
                    >
                      ✏️ Tahrir
                    </button>
                    <button
                      onClick={() => del(t.id)}
                      disabled={delId === t.id}
                      className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                    >
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-10 text-gray-400">Ma'lumot topilmadi</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">
                {editId ? 'Tumanni tahrirlash' : 'Yangi tuman qo\'shish'}
              </h2>
              <button
                onClick={close}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >&times;</button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tuman nomi *</label>
                <input
                  className="input-field"
                  value={form.tuman_nomi}
                  onChange={e => f('tuman_nomi', e.target.value)}
                  placeholder="Masalan: Mirobod tumani"
                  required
                />
              </div>

              {role === 'respublika' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Viloyat *</label>
                  <select
                    className="input-field"
                    value={form.viloyat}
                    onChange={e => f('viloyat', e.target.value)}
                    required
                  >
                    <option value="">— Tanlang —</option>
                    {viloyatlar.map(v => (
                      <option key={v.id} value={v.id}>{v.nomi}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={close} className="btn-secondary flex-1">
                  Bekor qilish
                </button>
                <button type="submit" disabled={saving} className="btn-success flex-1">
                  {saving ? '⏳ Saqlanmoqda...' : '💾 Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
