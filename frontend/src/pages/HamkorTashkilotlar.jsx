import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'

const T_EMPTY = { nomi: '', turi: '', tuman: null, mahalla: null, viloyat: null, is_active: true }
const X_EMPTY = { fio: '', lavozim: '', tel: '', tg_id: '', is_active: true }

const today = new Date().toISOString().slice(0, 10)
const monthStart = today.slice(0, 8) + '01'

export default function HamkorTashkilotlar() {
  const role      = localStorage.getItem('role')
  const viloyatId = localStorage.getItem('viloyat_id')

  const [activeTab, setActiveTab] = useState('royxat')

  const [viloyatlar, setViloyatlar] = useState([])
  const [tumanlar, setTumanlar]     = useState([])
  const [list, setList]             = useState([])
  const [search, setSearch]         = useState('')
  const [selViloyat, setSelViloyat] = useState('')

  // Tashkilot modal
  const [tModal, setTModal] = useState(false)
  const [tForm, setTForm]   = useState(T_EMPTY)
  const [tEditId, setTEditId] = useState(null)
  const [tSaving, setTSaving] = useState(false)
  const [tDelId, setTDelId]   = useState(null)

  // Xodimlar modal
  const [mahallalar, setMahallalar] = useState([])

  const [xModal, setXModal]       = useState(false)
  const [selTashkilot, setSelTashkilot] = useState(null)
  const [xodimlar, setXodimlar]   = useState([])
  const [xForm, setXForm]         = useState(X_EMPTY)
  const [xEditId, setXEditId]     = useState(null)
  const [xSaving, setXSaving]     = useState(false)
  const [xDelId, setXDelId]       = useState(null)

  const loadAll = () => Promise.all([
    api.get('/hamkor-tashkilotlar/').then(r => setList(r.data)),
    api.get('/tumanlar/').then(r => setTumanlar(r.data)),
    api.get('/mahallalar/').then(r => setMahallalar(r.data)),
    role === 'respublika'
      ? api.get('/viloyatlar/').then(r => setViloyatlar(r.data))
      : Promise.resolve(),
  ])

  useEffect(() => { loadAll() }, [])

  // ── Tashkilot CRUD ──────────────────────────────────────────────────────────
  const openTAdd = () => { setTForm(T_EMPTY); setTEditId(null); setTModal(true) }
  const openTEdit = t => {
    setTForm({ nomi: t.nomi, turi: t.turi || '',
               tuman: t.tuman || null, mahalla: t.mahalla || null,
               viloyat: t.viloyat, is_active: t.is_active })
    setTEditId(t.id)
    setTModal(true)
  }
  const closeTModal = () => { setTModal(false); setTForm(T_EMPTY); setTEditId(null) }

  const saveT = async e => {
    e.preventDefault()
    setTSaving(true)
    const payload = { ...tForm }
    if (role === 'viloyat') payload.viloyat = parseInt(viloyatId)
    try {
      if (tEditId) {
        await api.put(`/hamkor-tashkilotlar/${tEditId}/`, payload)
        toast.success('Yangilandi!')
      } else {
        await api.post('/hamkor-tashkilotlar/', payload)
        toast.success("Qo'shildi!")
      }
      closeTModal(); loadAll()
    } catch (err) {
      toast.error('Xato: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message))
    } finally { setTSaving(false) }
  }

  const delT = async id => {
    try {
      await api.delete(`/hamkor-tashkilotlar/${id}/`)
      toast.success("O'chirildi!")
      setTDelId(null); loadAll()
    } catch {
      toast.error("O'chirib bo'lmadi!")
    }
  }

  // ── Xodimlar CRUD ───────────────────────────────────────────────────────────
  const openXModal = t => {
    setSelTashkilot(t)
    api.get(`/hamkor-xodimlar/?tashkilot=${t.id}`).then(r => setXodimlar(r.data))
    setXForm(X_EMPTY); setXEditId(null)
    setXModal(true)
  }
  const closeXModal = () => { setXModal(false); setSelTashkilot(null); setXodimlar([]); setXForm(X_EMPTY); setXEditId(null) }

  const saveX = async e => {
    e.preventDefault()
    setXSaving(true)
    const payload = { ...xForm, tashkilot: selTashkilot.id,
                      tg_id: xForm.tg_id === '' ? 0 : Number(xForm.tg_id) }
    try {
      if (xEditId) {
        await api.put(`/hamkor-xodimlar/${xEditId}/`, payload)
        toast.success('Yangilandi!')
      } else {
        await api.post('/hamkor-xodimlar/', payload)
        toast.success("Qo'shildi!")
      }
      setXForm(X_EMPTY); setXEditId(null)
      api.get(`/hamkor-xodimlar/?tashkilot=${selTashkilot.id}`).then(r => setXodimlar(r.data))
      loadAll()
    } catch (err) {
      toast.error('Xato: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message))
    } finally { setXSaving(false) }
  }

  const delX = async id => {
    try {
      await api.delete(`/hamkor-xodimlar/${id}/`)
      toast.success("O'chirildi!")
      setXDelId(null)
      api.get(`/hamkor-xodimlar/?tashkilot=${selTashkilot.id}`).then(r => setXodimlar(r.data))
      loadAll()
    } catch { toast.error("O'chirib bo'lmadi!") }
  }

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = list.filter(t => {
    const q = search.toLowerCase()
    const matchQ = !q || t.nomi.toLowerCase().includes(q) || (t.turi || '').toLowerCase().includes(q)
    const matchV = !selViloyat || String(t.viloyat) === selViloyat
    return matchQ && matchV
  })

  // ── Hisobot tab ─────────────────────────────────────────────────────────────
  function HisobotTab() {
    const [hStart, setHStart]     = useState(monthStart)
    const [hEnd, setHEnd]         = useState(today)
    const [selV, setSelV]         = useState('')
    const [hRows, setHRows]       = useState([])
    const [totals, setTotals]     = useState(null)
    const [loading, setLoading]   = useState(false)

    const load = () => {
      setLoading(true)
      const params = new URLSearchParams({ start: hStart, end: hEnd })
      if (role === 'respublika' && selV) params.append('viloyat', selV)
      api.get(`/hamkor-hisobot/?${params}`).then(r => {
        setHRows(r.data.rows)
        setTotals(r.data.totals)
      }).finally(() => setLoading(false))
    }

    useEffect(() => { load() }, [])

    return (
      <div>
        {/* Filter */}
        <div className="flex gap-3 mb-4 flex-wrap items-end">
          <div>
            <label className="text-xs text-gray-500">Boshlanish</label>
            <input type="date" value={hStart} onChange={e => setHStart(e.target.value)}
              className="block border rounded-lg px-3 py-2 text-sm"/>
          </div>
          <div>
            <label className="text-xs text-gray-500">Tugash</label>
            <input type="date" value={hEnd} onChange={e => setHEnd(e.target.value)}
              className="block border rounded-lg px-3 py-2 text-sm"/>
          </div>
          {role === 'respublika' && (
            <div>
              <label className="text-xs text-gray-500">Viloyat</label>
              <select value={selV} onChange={e => setSelV(e.target.value)}
                className="block border rounded-lg px-3 py-2 text-sm">
                <option value="">Barchasi</option>
                {viloyatlar.map(v => <option key={v.id} value={v.id}>{v.nomi}</option>)}
              </select>
            </div>
          )}
          <button onClick={load}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm">
            Ko'rish
          </button>
        </div>

        {/* Umumiy kartochkalar */}
        {totals && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Tashkilotlar', val: totals.tashkilot_soni, color: 'indigo' },
              { label: 'Xodimlar',     val: totals.xodim_soni,     color: 'blue'   },
              { label: "Targ'ibotlar", val: totals.targibot_soni,  color: 'green'  },
              { label: 'Qamrov',       val: totals.qatnashchilar,  color: 'orange' },
            ].map(c => (
              <div key={c.label} className={`bg-white rounded-xl shadow p-4 border-l-4 border-${c.color}-500`}>
                <div className="text-2xl font-bold text-gray-800">{c.val.toLocaleString()}</div>
                <div className="text-sm text-gray-500 mt-1">{c.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Jadval */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-indigo-700 text-white">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                {role === 'respublika' && <th className="px-4 py-3 text-left">Viloyat</th>}
                <th className="px-4 py-3 text-left">Tashkilot</th>
                <th className="px-4 py-3 text-left">Turi</th>
                <th className="px-4 py-3 text-center">Xodimlar</th>
                <th className="px-4 py-3 text-center">Targ'ibotlar</th>
                <th className="px-4 py-3 text-center">Qamrov</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Yuklanmoqda...</td></tr>
              )}
              {!loading && hRows.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Ma'lumot yo'q</td></tr>
              )}
              {hRows.map((r, i) => (
                <tr key={r.tashkilot_id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  {role === 'respublika' && <td className="px-4 py-3">{r.viloyat_nomi}</td>}
                  <td className="px-4 py-3 font-medium">{r.tashkilot_nomi}</td>
                  <td className="px-4 py-3 text-gray-500">{r.tashkilot_turi || '—'}</td>
                  <td className="px-4 py-3 text-center">{r.xodim_soni}</td>
                  <td className="px-4 py-3 text-center font-semibold text-indigo-700">{r.targibot_soni}</td>
                  <td className="px-4 py-3 text-center font-semibold text-green-700">{Number(r.qatnashchilar).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Hamkor tashkilotlar</h1>
        {activeTab === 'royxat' && (
          <button onClick={openTAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Tashkilot qo'shish
          </button>
        )}
      </div>

      {/* Tab menyusi */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {[
          { key: 'royxat',  label: "📋 Ro'yxat" },
          { key: 'hisobot', label: '📊 Hisobot' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.key
                ? 'bg-white text-indigo-700 shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'hisobot' && <HisobotTab />}
      {activeTab === 'royxat' && (<div>

      {/* Filterlar */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Nomi bo'yicha qidirish..."
          className="border rounded-lg px-3 py-2 text-sm w-64"/>
        {role === 'respublika' && (
          <select value={selViloyat} onChange={e => setSelViloyat(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Barcha viloyatlar</option>
            {viloyatlar.map(v => <option key={v.id} value={String(v.id)}>{v.nomi}</option>)}
          </select>
        )}
      </div>

      {/* Jadval */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-indigo-700 text-white">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Tashkilot nomi</th>
              <th className="px-4 py-3 text-left">Turi</th>
              <th className="px-4 py-3 text-left">Manzil</th>
              {role === 'respublika' && <th className="px-4 py-3 text-left">Viloyat</th>}
              <th className="px-4 py-3 text-center">Xodimlar</th>
              <th className="px-4 py-3 text-left">Holat</th>
              <th className="px-4 py-3 text-center">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">Ma'lumot yo'q</td></tr>
            )}
            {filtered.map((t, i) => (
              <tr key={t.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{t.nomi}</td>
                <td className="px-4 py-3 text-gray-600">{t.turi || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{t.manzil || '—'}</td>
                {role === 'respublika' && <td className="px-4 py-3 text-gray-600">{t.viloyat_nomi || '—'}</td>}
                <td className="px-4 py-3 text-center">
                  <button onClick={() => openXModal(t)}
                    className="text-indigo-600 hover:underline font-medium">
                    {t.xodim_soni ?? 0} kishi
                  </button>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {t.is_active ? 'Faol' : 'Nofaol'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center flex gap-2 justify-center">
                  <button onClick={() => openTEdit(t)}
                    className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-200 rounded">
                    Tahrir
                  </button>
                  {tDelId === t.id ? (
                    <span className="flex gap-1">
                      <button onClick={() => delT(t.id)} className="text-xs text-red-600 font-medium">Ha</button>
                      <button onClick={() => setTDelId(null)} className="text-xs text-gray-500">Yo'q</button>
                    </span>
                  ) : (
                    <button onClick={() => setTDelId(t.id)}
                      className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-200 rounded">
                      O'chir
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tashkilot modal */}
      {tModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">
              {tEditId ? 'Tashkilotni tahrirlash' : 'Yangi tashkilot'}
            </h2>
            <form onSubmit={saveT} className="space-y-3">
              {role === 'respublika' && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Viloyat</label>
                  <select value={tForm.viloyat ?? ''} onChange={e => setTForm(f => ({ ...f, viloyat: e.target.value ? parseInt(e.target.value) : null }))}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" required>
                    <option value="">Tanlang</option>
                    {viloyatlar.map(v => <option key={v.id} value={v.id}>{v.nomi}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700">Tashkilot nomi</label>
                <input value={tForm.nomi} onChange={e => setTForm(f => ({ ...f, nomi: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" required/>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Turi</label>
                <input value={tForm.turi} onChange={e => setTForm(f => ({ ...f, turi: e.target.value }))}
                  placeholder="Davlat, notijorat, xususiy..."
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"/>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tuman / Shahar</label>
                <select value={tForm.tuman ?? ''} onChange={e => setTForm(f => ({
                    ...f,
                    tuman: e.target.value ? parseInt(e.target.value) : null,
                    mahalla: null
                  }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">— Tanlang —</option>
                  {tumanlar.map(t => (
                    <option key={t.id} value={t.id}>{t.tuman_nomi}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Mahalla</label>
                <select value={tForm.mahalla ?? ''} onChange={e => setTForm(f => ({ ...f, mahalla: e.target.value ? parseInt(e.target.value) : null }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  disabled={!tForm.tuman}>
                  <option value="">— {tForm.tuman ? 'Tanlang' : 'Avval tuman tanlang'} —</option>
                  {mahallalar.filter(m => m.tuman === tForm.tuman).map(m => (
                    <option key={m.id} value={m.id}>{m.mahalla_nomi}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="tIsActive" checked={tForm.is_active}
                  onChange={e => setTForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4"/>
                <label htmlFor="tIsActive" className="text-sm text-gray-700">Faol</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={tSaving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {tSaving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
                <button type="button" onClick={closeTModal}
                  className="flex-1 border rounded-lg py-2 text-sm">
                  Bekor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Xodimlar modal */}
      {xModal && selTashkilot && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{selTashkilot.nomi} — xodimlar</h2>
              <button onClick={closeXModal} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            {/* Xodim form */}
            <form onSubmit={saveX} className="bg-gray-50 rounded-lg p-4 mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">FIO</label>
                <input value={xForm.fio} onChange={e => setXForm(f => ({ ...f, fio: e.target.value }))}
                  className="mt-1 w-full border rounded px-2 py-1.5 text-sm" required/>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Lavozim</label>
                <input value={xForm.lavozim} onChange={e => setXForm(f => ({ ...f, lavozim: e.target.value }))}
                  className="mt-1 w-full border rounded px-2 py-1.5 text-sm"/>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Telefon</label>
                <input value={xForm.tel} onChange={e => setXForm(f => ({ ...f, tel: e.target.value }))}
                  placeholder="+998901234567"
                  className="mt-1 w-full border rounded px-2 py-1.5 text-sm"/>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Telegram ID</label>
                <input type="number" value={xForm.tg_id} onChange={e => setXForm(f => ({ ...f, tg_id: e.target.value }))}
                  className="mt-1 w-full border rounded px-2 py-1.5 text-sm"/>
              </div>
              <div className="col-span-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={xForm.is_active}
                    onChange={e => setXForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="w-4 h-4"/>
                  Faol
                </label>
                <div className="flex gap-2">
                  {xEditId && (
                    <button type="button" onClick={() => { setXForm(X_EMPTY); setXEditId(null) }}
                      className="text-sm border rounded px-3 py-1.5">Bekor</button>
                  )}
                  <button type="submit" disabled={xSaving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-1.5 rounded disabled:opacity-50">
                    {xSaving ? '...' : xEditId ? 'Yangilash' : "Qo'shish"}
                  </button>
                </div>
              </div>
            </form>

            {/* Xodimlar ro'yxati */}
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">FIO</th>
                  <th className="px-3 py-2 text-left">Lavozim</th>
                  <th className="px-3 py-2 text-left">Telefon</th>
                  <th className="px-3 py-2 text-left">Holat</th>
                  <th className="px-3 py-2 text-center">Amal</th>
                </tr>
              </thead>
              <tbody>
                {xodimlar.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-6 text-gray-400">Xodim yo'q</td></tr>
                )}
                {xodimlar.map(x => (
                  <tr key={x.id} className="border-t">
                    <td className="px-3 py-2 font-medium">{x.fio}</td>
                    <td className="px-3 py-2 text-gray-600">{x.lavozim || '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{x.tel || '—'}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        x.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>{x.is_active ? 'Faol' : 'Nofaol'}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {xDelId === x.id ? (
                        <span className="flex gap-1 justify-center">
                          <button onClick={() => delX(x.id)} className="text-xs text-red-600 font-medium">Ha</button>
                          <button onClick={() => setXDelId(null)} className="text-xs text-gray-500">Yo'q</button>
                        </span>
                      ) : (
                        <span className="flex gap-1 justify-center">
                          <button onClick={() => { setXForm({ fio: x.fio, lavozim: x.lavozim || '', tel: x.tel || '', tg_id: x.tg_id || '', is_active: x.is_active }); setXEditId(x.id) }}
                            className="text-blue-600 text-xs px-2 py-0.5 border border-blue-200 rounded">
                            Tahrir
                          </button>
                          <button onClick={() => setXDelId(x.id)}
                            className="text-red-600 text-xs px-2 py-0.5 border border-red-200 rounded">
                            O'chir
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>)}
    </div>
  )
}
