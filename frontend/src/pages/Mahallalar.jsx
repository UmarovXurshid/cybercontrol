import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'

const EMPTY = {
  mahalla_nomi: '', tuman: null, tg_id: '',
  inspektor_fio: '', inspektor_tel: '',
  navbatchilik_kuni1: '', navbatchilik_kuni2: '',
  is_tuman: false, is_viloyat: false
}
const INSP_EMPTY = { fio: '', tel: '', is_active: true }

const KUNLAR = [
  { v: 1, l: 'Dushanba' }, { v: 2, l: 'Seshanba' },
  { v: 3, l: 'Chorshanba' }, { v: 4, l: 'Payshanba' },
  { v: 5, l: 'Juma' }, { v: 6, l: 'Shanba' }, { v: 0, l: 'Yakshanba' }
]

export default function Mahallalar() {
  const [list, setList]         = useState([])
  const [tumanlar, setTumanlar] = useState([])
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState(EMPTY)
  const [editId, setEditId]     = useState(null)
  const [saving, setSaving]     = useState(false)
  const [delId, setDelId]       = useState(null)

  // Inspektorlar modal
  const [inspModal, setInspModal]     = useState(false)
  const [inspMahalla, setInspMahalla] = useState(null)   // tanlangan mahalla obj
  const [inspList, setInspList]       = useState([])
  const [inspForm, setInspForm]       = useState(INSP_EMPTY)
  const [inspEditId, setInspEditId]   = useState(null)
  const [inspSaving, setInspSaving]   = useState(false)
  const [inspDelId, setInspDelId]     = useState(null)

  const loadAll = () => Promise.all([
    api.get('/mahallalar/').then(r => setList(r.data)),
    api.get('/tumanlar/').then(r => setTumanlar(r.data)),
  ])

  useEffect(() => { loadAll() }, [])

  // ─── Mahalla CRUD ─────────────────────────────────────────────────────────
  const openAdd  = () => { setForm(EMPTY); setEditId(null); setModal(true) }
  const openEdit = m  => {
    setForm({
      mahalla_nomi:       m.mahalla_nomi || '',
      tuman:              m.tuman || null,
      tg_id:              m.tg_id || '',
      inspektor_fio:      m.inspektor_fio || '',
      inspektor_tel:      m.inspektor_tel || '',
      navbatchilik_kuni1: m.navbatchilik_kuni1 ?? '',
      navbatchilik_kuni2: m.navbatchilik_kuni2 ?? '',
      is_tuman:           m.is_tuman   || false,
      is_viloyat:         m.is_viloyat || false,
    })
    setEditId(m.id)
    setModal(true)
  }
  const closeModal = () => { setModal(false); setForm(EMPTY); setEditId(null) }

  const save = async e => {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, tg_id: form.tg_id === '' || form.tg_id == null ? 0 : form.tg_id }
    try {
      if (editId) {
        await api.put(`/mahallalar/${editId}/`, payload)
        toast.success('Yangilandi!')
      } else {
        await api.post('/mahallalar/', payload)
        toast.success("Qo'shildi!")
      }
      closeModal()
      loadAll()
    } catch (err) {
      toast.error('Xato: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message))
    } finally { setSaving(false) }
  }

  const del = async id => {
    if (!window.confirm("Mahallani o'chirasizmi?")) return
    setDelId(id)
    try {
      await api.delete(`/mahallalar/${id}/`)
      toast.success("O'chirildi")
      loadAll()
    } catch { toast.error('Xato!') }
    finally { setDelId(null) }
  }

  const filtered = list.filter(m =>
    m.mahalla_nomi?.toLowerCase().includes(search.toLowerCase()) ||
    m.tuman_nomi?.toLowerCase().includes(search.toLowerCase()) ||
    m.inspektor_fio?.toLowerCase().includes(search.toLowerCase())
  )

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // ─── Inspektor CRUD ───────────────────────────────────────────────────────
  const openInspModal = async mahalla => {
    setInspMahalla(mahalla)
    setInspForm(INSP_EMPTY)
    setInspEditId(null)
    setInspModal(true)
    try {
      const r = await api.get(`/inspektorlar/?mahalla=${mahalla.id}`)
      setInspList(r.data)
    } catch { setInspList([]) }
  }

  const closeInspModal = () => {
    setInspModal(false)
    setInspMahalla(null)
    setInspList([])
    setInspForm(INSP_EMPTY)
    setInspEditId(null)
  }

  const openInspEdit = ins => {
    setInspForm({ fio: ins.fio, tel: ins.tel, is_active: ins.is_active })
    setInspEditId(ins.id)
  }

  const saveInsp = async e => {
    e.preventDefault()
    setInspSaving(true)
    try {
      const payload = { ...inspForm, mahalla: inspMahalla.id }
      if (inspEditId) {
        await api.put(`/inspektorlar/${inspEditId}/`, payload)
        toast.success('Yangilandi!')
      } else {
        await api.post('/inspektorlar/', payload)
        toast.success("Qo'shildi!")
      }
      setInspForm(INSP_EMPTY)
      setInspEditId(null)
      const r = await api.get(`/inspektorlar/?mahalla=${inspMahalla.id}`)
      setInspList(r.data)
    } catch (err) {
      toast.error('Xato: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message))
    } finally { setInspSaving(false) }
  }

  const delInsp = async id => {
    if (!window.confirm("Inspektorni o'chirasizmi?")) return
    setInspDelId(id)
    try {
      await api.delete(`/inspektorlar/${id}/`)
      toast.success("O'chirildi")
      const r = await api.get(`/inspektorlar/?mahalla=${inspMahalla.id}`)
      setInspList(r.data)
    } catch { toast.error('Xato!') }
    finally { setInspDelId(null) }
  }

  const fi = (k, v) => setInspForm(p => ({ ...p, [k]: v }))

  return (
    <div>
      {/* Sarlavha */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Mahallalar
          <span className="ml-2 text-base font-normal text-gray-400">({list.length})</span>
        </h1>
        <button onClick={openAdd} className="btn-success">➕ Mahalla qo'shish</button>
      </div>

      {/* Qidiruv */}
      <div className="card mb-6">
        <input
          className="input-field"
          placeholder="🔍 Mahalla, tuman yoki inspektor bo'yicha qidirish..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Jadval */}
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr>
              {['#', 'Mahalla', 'Tuman', 'Inspektor', 'Tel', 'Tg ID', 'Kun 1', 'Kun 2', 'Turi', 'Amallar'].map(h => (
                <th key={h} className="table-header text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="table-cell text-gray-400">{i + 1}</td>
                <td className="table-cell font-semibold">{m.mahalla_nomi}</td>
                <td className="table-cell text-sm text-gray-500">{m.tuman_nomi}</td>
                <td className="table-cell text-sm">{m.inspektor_fio}</td>
                <td className="table-cell text-xs text-gray-500">{m.inspektor_tel}</td>
                <td className="table-cell text-xs font-mono text-gray-400">{m.tg_id || '—'}</td>
                <td className="table-cell">
                  {m.navbatchilik_kuni1 != null
                    ? <span className="badge-blue">{KUNLAR.find(k => k.v === m.navbatchilik_kuni1)?.l}</span>
                    : '—'}
                </td>
                <td className="table-cell">
                  {m.navbatchilik_kuni2 != null
                    ? <span className="badge-green">{KUNLAR.find(k => k.v === m.navbatchilik_kuni2)?.l}</span>
                    : '—'}
                </td>
                <td className="table-cell">
                  {m.is_tuman
                    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">🏛 Tuman/Viloyat</span>
                    : <span className="text-gray-300 text-xs">MFY</span>}
                </td>
                <td className="table-cell">
                  <div className="flex gap-1 flex-wrap">
                    <button
                      onClick={() => openEdit(m)}
                      className="text-xs px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors"
                    >✏️ Tahrir</button>
                    <button
                      onClick={() => openInspModal(m)}
                      className="text-xs px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                    >👥 Inspektorlar</button>
                    <button
                      onClick={() => del(m.id)}
                      disabled={delId === m.id}
                      className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                    >🗑</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-10 text-gray-400">Ma'lumot topilmadi</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mahalla tahrirlash modal ─────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">
                {editId ? 'Mahallani tahrirlash' : 'Yangi mahalla'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >&times;</button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mahalla nomi *</label>
                <input
                  className="input-field"
                  value={form.mahalla_nomi}
                  onChange={e => f('mahalla_nomi', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tuman *</label>
                <select
                  className="input-field"
                  value={form.tuman || ''}
                  onChange={e => f('tuman', Number(e.target.value) || null)}
                  required
                >
                  <option value="">— Tanlang —</option>
                  {tumanlar.map(t => (
                    <option key={t.id} value={t.id}>{t.tuman_nomi}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inspektor F.I.O</label>
                  <input
                    className="input-field"
                    value={form.inspektor_fio || ''}
                    onChange={e => f('inspektor_fio', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input
                    className="input-field"
                    placeholder="+998901234567"
                    value={form.inspektor_tel || ''}
                    onChange={e => f('inspektor_tel', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telegram ID</label>
                <input
                  className="input-field font-mono"
                  placeholder="123456789"
                  value={form.tg_id || ''}
                  onChange={e => f('tg_id', e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">Bot orqali avtomatik to'ldiriladi</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Navbatchilik kuni 1</label>
                  <select
                    className="input-field"
                    value={form.navbatchilik_kuni1 ?? ''}
                    onChange={e => f('navbatchilik_kuni1', e.target.value === '' ? null : Number(e.target.value))}
                  >
                    <option value="">— Yo'q —</option>
                    {KUNLAR.map(k => <option key={k.v} value={k.v}>{k.l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Navbatchilik kuni 2</label>
                  <select
                    className="input-field"
                    value={form.navbatchilik_kuni2 ?? ''}
                    onChange={e => f('navbatchilik_kuni2', e.target.value === '' ? null : Number(e.target.value))}
                  >
                    <option value="">— Yo'q —</option>
                    {KUNLAR.map(k => <option key={k.v} value={k.v}>{k.l}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="w-4 h-4 accent-orange-500"
                    checked={form.is_tuman || false}
                    onChange={e => f('is_tuman', e.target.checked)} />
                  <span className="text-sm text-gray-700">
                    Tuman/shahar hisoboti
                    <span className="ml-1 text-xs text-gray-400">(mahalla soniga kirmaydi, OAVni viloyat tasdiqlaydi)</span>
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="w-4 h-4 accent-purple-500"
                    checked={form.is_viloyat || false}
                    onChange={e => f('is_viloyat', e.target.checked)} />
                  <span className="text-sm text-gray-700">
                    Viloyat darajasi
                    <span className="ml-1 text-xs text-gray-400">(OAVni respublika tasdiqlaydi)</span>
                  </span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
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

      {/* ── Inspektorlar modal ───────────────────────────────────────────────── */}
      {inspModal && inspMahalla && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold">👥 Inspektorlar</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {inspMahalla.mahalla_nomi} — {inspMahalla.tuman_nomi}
                </p>
              </div>
              <button
                onClick={closeInspModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >&times;</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Inspektorlar ro'yxati */}
              {inspList.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="table-header text-left">F.I.O</th>
                        <th className="table-header text-left">Telefon</th>
                        <th className="table-header text-left">Telegram ID</th>
                        <th className="table-header text-left">Holat</th>
                        <th className="table-header text-left">Amal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspList.map(ins => (
                        <tr key={ins.id} className="hover:bg-gray-50 border-t">
                          <td className="table-cell font-medium">{ins.fio}</td>
                          <td className="table-cell text-gray-500">{ins.tel}</td>
                          <td className="table-cell font-mono text-xs text-gray-400">
                            {ins.tg_id > 0 ? ins.tg_id : '—'}
                          </td>
                          <td className="table-cell">
                            {ins.is_active
                              ? <span className="badge-green">Faol</span>
                              : <span className="badge-red">Nofaol</span>}
                          </td>
                          <td className="table-cell">
                            <div className="flex gap-1">
                              <button
                                onClick={() => openInspEdit(ins)}
                                className="text-xs px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg"
                              >✏️</button>
                              <button
                                onClick={() => delInsp(ins.id)}
                                disabled={inspDelId === ins.id}
                                className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg disabled:opacity-50"
                              >🗑</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-xl text-gray-400">
                  Hozircha inspektor qo'shilmagan
                </div>
              )}

              {/* Qo'shish / tahrirlash formasi */}
              <div className="border-t pt-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {inspEditId ? '✏️ Inspektorni tahrirlash' : "➕ Yangi inspektor qo'shish"}
                </h3>
                <form onSubmit={saveInsp} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">F.I.O *</label>
                      <input
                        className="input-field text-sm"
                        placeholder="Familiya Ism Otasism"
                        value={inspForm.fio}
                        onChange={e => fi('fio', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Telefon *</label>
                      <input
                        className="input-field text-sm"
                        placeholder="998901234567"
                        value={inspForm.tel}
                        onChange={e => fi('tel', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-indigo-600"
                        checked={inspForm.is_active}
                        onChange={e => fi('is_active', e.target.checked)}
                      />
                      <span className="text-sm text-gray-700">Faol</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    {inspEditId && (
                      <button
                        type="button"
                        onClick={() => { setInspEditId(null); setInspForm(INSP_EMPTY) }}
                        className="btn-secondary text-sm py-2"
                      >✕ Bekor</button>
                    )}
                    <button
                      type="submit"
                      disabled={inspSaving}
                      className="btn-success text-sm py-2 flex-1"
                    >
                      {inspSaving
                        ? '⏳ Saqlanmoqda...'
                        : inspEditId ? '💾 Saqlash' : "➕ Qo'shish"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
