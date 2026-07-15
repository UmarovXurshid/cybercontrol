import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'

const emptyForm = { nomi: '' }

export default function Viloyatlar() {
  const [list, setList]       = useState([])
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState(emptyForm)
  const [editId, setEditId]   = useState(null)
  const [loading, setLoading] = useState(false)

  const load = () => api.get('/viloyatlar/').then(r => setList(r.data))
  useEffect(() => { load() }, [])

  const openAdd  = ()    => { setForm(emptyForm); setEditId(null); setModal(true) }
  const openEdit = item  => { setForm({ nomi: item.nomi }); setEditId(item.id); setModal(true) }
  const close    = ()    => setModal(false)

  const save = async e => {
    e.preventDefault()
    if (!form.nomi.trim()) return toast.error("Nomi bo'sh bo'lmasin")
    setLoading(true)
    try {
      if (editId) {
        await api.put(`/viloyatlar/${editId}/`, form)
        toast.success('Yangilandi!')
      } else {
        await api.post('/viloyatlar/', form)
        toast.success("Viloyat qo'shildi!")
      }
      close()
      load()
    } catch { toast.error('Xato!') }
    finally { setLoading(false) }
  }

  const del = async id => {
    if (!confirm("Viloyatni o'chirasizmi?")) return
    await api.delete(`/viloyatlar/${id}/`)
    toast.success("O'chirildi")
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Viloyatlar
          <span className="ml-2 text-base font-normal text-gray-400">({list.length})</span>
        </h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4"/> Viloyat qo'shish
        </button>
      </div>

      {list.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">🗺️</p>
          <p className="text-lg font-medium">Hech qanday viloyat yo'q</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-xs">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Nomi</th>
                <th className="px-4 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.map((v, i) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{v.nomi}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(v)}
                      className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition">
                      <PencilIcon className="w-4 h-4"/>
                    </button>
                    <button onClick={() => del(v.id)}
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
              {editId ? 'Viloyatni tahrirlash' : "Yangi viloyat qo'shish"}
            </h2>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Viloyat nomi</label>
                <input className="input-field" placeholder="Toshkent viloyati"
                  value={form.nomi} onChange={e => setForm({ ...form, nomi: e.target.value })} required/>
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
