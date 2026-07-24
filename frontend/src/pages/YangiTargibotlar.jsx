import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'

const OAV_NOMLAR = { 3: '📺 TV', 4: '📻 Radio', 5: '📰 Gazeta', 6: '📓 Jurnal', 7: '🌐 Internet' }

/* ── Lightbox ─────────────────────────────────────────────────────────────── */
function Lightbox({ src, onClose }) {
  useEffect(() => {
    const esc = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white text-3xl leading-none hover:text-gray-300">✕</button>
      <img src={src} onClick={e => e.stopPropagation()}
        className="max-h-[90vh] max-w-[92vw] rounded-xl shadow-2xl object-contain" alt="rasm" />
    </div>
  )
}

/* ── Hisobot kartasi (offline/online) ────────────────────────────────────── */
function HisobotKarta({ h, isRad, onToggleRad, sabab, onSabab, onLightbox }) {
  return (
    <div className={`card transition-all duration-200 ${isRad ? 'opacity-50 border-l-4 border-red-400 bg-red-50' : 'border-l-4 border-indigo-400'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <span className="font-bold text-gray-900">{h.mahalla_nomi}</span>
            <span className="text-gray-400 text-sm">{h.tuman_nomi}</span>
            <span className={h.targibot_turi === 1 ? 'badge-blue' : 'badge-green'}>
              {h.targibot_turi === 1 ? '📢 Offline' : '🌐 Online'}
            </span>
            {h.dublikat_id && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                ⚠️ #{h.dublikat_id}-hisobot bilan bir xil (joy+kun)
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 text-sm text-gray-600">
            <span>👤 {h.inspektor_fio}</span>
            <span>📞 {h.inspektor_tel}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 text-sm text-gray-600 mt-0.5">
            <span>👥 <strong>{h.qatnashchilar_soni}</strong> qatnashchi</span>
            {h.joy_nomi && <span>📍 {h.joy_nomi}</span>}
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none shrink-0 mt-1">
          <div onClick={() => onToggleRad(h.id)}
            className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${isRad ? 'bg-red-500' : 'bg-gray-200'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${isRad ? 'translate-x-5' : 'translate-x-0'}`}/>
          </div>
          <span className={`text-sm font-medium ${isRad ? 'text-red-500' : 'text-gray-400'}`}>
            {isRad ? 'Rad' : 'Rad etish'}
          </span>
        </label>
      </div>
      {isRad && (
        <div className="mt-3 pt-3 border-t border-red-200">
          <label className="block text-xs font-medium text-red-600 mb-1">📝 Rad etish sababi</label>
          <textarea rows={2} value={sabab || ''} onChange={e => onSabab(h.id, e.target.value)}
            placeholder="Sabab yozing..." className="w-full text-sm border border-red-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
        </div>
      )}
      {h.rasmlar?.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-400 mb-2">📷 {h.rasmlar.length} ta rasm</p>
          <div className="flex flex-wrap gap-2">
            {h.rasmlar.map((r, idx) => (
              <button key={r.id} onClick={() => onLightbox(`/media/images/${r.rasm_url}`)}
                className="relative group overflow-hidden rounded-xl border-2 border-gray-200 hover:border-indigo-400 transition-all shadow-sm">
                <img src={`/media/images/${r.rasm_url}`} alt={`rasm ${idx+1}`}
                  className="h-28 w-28 object-cover group-hover:scale-105 transition-transform bg-gray-100"
                  onError={e => { e.target.onerror=null; e.target.src='/media/placeholder.jpg' }} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="text-white text-2xl opacity-0 group-hover:opacity-100">🔍</span>
                </div>
                <span className="absolute bottom-1 right-1 bg-black/50 text-white text-xs rounded px-1">{idx+1}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── OAV kartasi ─────────────────────────────────────────────────────────── */
function OavKarta({ h, isRad, onToggleRad, sabab, onSabab, onLightbox }) {
  const nomLabel = OAV_NOMLAR[h.targibot_turi] || 'OAV'
  return (
    <div className={`card transition-all duration-200 ${isRad ? 'opacity-50 border-l-4 border-red-400 bg-red-50' : 'border-l-4 border-purple-500'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <span className="font-bold text-gray-900">{h.mahalla_nomi}</span>
            <span className="text-gray-400 text-sm">{h.tuman_nomi}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              {nomLabel}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 text-sm text-gray-600">
            <span>👤 {h.inspektor_fio}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 text-sm text-gray-600 mt-0.5">
            <span>🔢 <strong>{h.qatnashchilar_soni}</strong> marta</span>
            {h.proof_url && (
              <span>
                🔗 <a href={h.proof_url.startsWith('http') ? h.proof_url : '#'}
                  target="_blank" rel="noreferrer"
                  className="text-indigo-600 underline break-all">{h.proof_url}</a>
              </span>
            )}
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none shrink-0 mt-1">
          <div onClick={() => onToggleRad(h.id)}
            className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${isRad ? 'bg-red-500' : 'bg-gray-200'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${isRad ? 'translate-x-5' : 'translate-x-0'}`}/>
          </div>
          <span className={`text-sm font-medium ${isRad ? 'text-red-500' : 'text-gray-400'}`}>
            {isRad ? 'Rad' : 'Rad etish'}
          </span>
        </label>
      </div>
      {isRad && (
        <div className="mt-3 pt-3 border-t border-red-200">
          <label className="block text-xs font-medium text-red-600 mb-1">📝 Rad etish sababi</label>
          <textarea rows={2} value={sabab || ''} onChange={e => onSabab(h.id, e.target.value)}
            placeholder="Sabab yozing..." className="w-full text-sm border border-red-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
        </div>
      )}
      {/* OAV isboti rasmi */}
      {h.rasmlar?.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-400 mb-2">📸 Isboti ({h.rasmlar.length} ta)</p>
          <div className="flex flex-wrap gap-2">
            {h.rasmlar.map((r, idx) => (
              <button key={r.id} onClick={() => onLightbox(`/media/images/${r.rasm_url}`)}
                className="relative group overflow-hidden rounded-xl border-2 border-gray-200 hover:border-purple-400 transition-all shadow-sm">
                <img src={`/media/images/${r.rasm_url}`} alt={`isboti ${idx+1}`}
                  className="h-28 w-28 object-cover group-hover:scale-105 transition-transform bg-gray-100"
                  onError={e => { e.target.onerror=null; e.target.src='/media/placeholder.jpg' }} />
                <span className="absolute bottom-1 right-1 bg-black/50 text-white text-xs rounded px-1">{idx+1}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Asosiy komponent ─────────────────────────────────────────────────────── */
export default function YangiTargibotlar() {
  const [hisobotlar, setHisobotlar] = useState([])
  const [oavlar, setOavlar]         = useState([])
  const [radIds, setRadIds]         = useState([])
  const [radSabablar, setRadSabablar] = useState({})
  const [loading, setLoading]       = useState(false)
  const [lightbox, setLightbox]     = useState(null)
  const [tab, setTab]               = useState('hisobot')
  const [selViloyat, setSelViloyat] = useState('')

  const load = () => api.get('/yangi/').then(r => {
    if (Array.isArray(r.data)) {
      setHisobotlar(r.data); setOavlar([])
    } else {
      setHisobotlar(r.data.hisobotlar || [])
      setOavlar(r.data.oav || [])
    }
  })
  useEffect(() => { load() }, [])

  const toggleRad = id => setRadIds(p => {
    const isNow = !p.includes(id)
    if (!isNow) setRadSabablar(s => { const n={...s}; delete n[id]; return n })
    return isNow ? [...p, id] : p.filter(x => x !== id)
  })
  const setSabab = (id, val) => setRadSabablar(s => ({ ...s, [id]: val }))

  const saqlash = async (ids) => {
    const tasdiqlangan = ids.filter(id => !radIds.includes(id))
    const rad          = ids.filter(id => radIds.includes(id))
    setLoading(true)
    try {
      await api.post('/tasdiqlash/', {
        tasdiqlangan_ids: tasdiqlangan,
        rad_ids: rad,
        rad_sabablar: radSabablar,
      })
      toast.success('Saqlandi!')
      setRadIds([]); setRadSabablar({})
      load()
    } catch { toast.error('Xato!') }
    finally { setLoading(false) }
  }

  // Viloyatlar ro'yxati (hisobotlardan olinadi)
  const viloyatlar = [...new Map(
    [...hisobotlar, ...oavlar]
      .filter(h => h.viloyat_id)
      .map(h => [h.viloyat_id, { id: h.viloyat_id, nomi: h.viloyat_nomi }])
  ).values()].sort((a, b) => (a.nomi || '').localeCompare(b.nomi || ''))

  const filterByViloyat = list =>
    selViloyat ? list.filter(h => String(h.viloyat_id) === String(selViloyat)) : list

  const filteredHisobotlar = filterByViloyat(hisobotlar)
  const filteredOavlar     = filterByViloyat(oavlar)
  const activeList         = tab === 'hisobot' ? filteredHisobotlar : filteredOavlar

  return (
    <div>
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Yangi targ'ibotlar</h1>
        {activeList.length > 0 && (
          <button onClick={() => saqlash(activeList.map(h => h.id))} disabled={loading} className="btn-success">
            {loading ? '⏳' : '✅'} Saqlash
          </button>
        )}
      </div>

      {/* Viloyat filtri */}
      {viloyatlar.length > 1 && (
        <div className="flex items-center gap-2 mb-4">
          <label className="text-sm font-medium text-gray-600">Viloyat:</label>
          <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={selViloyat} onChange={e => setSelViloyat(e.target.value)}>
            <option value="">— Barcha viloyatlar —</option>
            {viloyatlar.map(v => <option key={v.id} value={v.id}>{v.nomi}</option>)}
          </select>
          {selViloyat && (
            <button onClick={() => setSelViloyat('')}
              className="text-xs text-gray-400 hover:text-red-500">✕ Tozalash</button>
          )}
          <span className="text-xs text-gray-400 ml-1">
            {activeList.length} ta ko'rsatilmoqda
          </span>
        </div>
      )}

      {/* Tablar */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        <button onClick={() => setTab('hisobot')}
          className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors
            ${tab==='hisobot' ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          📋 Offline/Online
          {filteredHisobotlar.length > 0 && <span className="ml-1.5 bg-indigo-100 text-indigo-700 text-xs px-1.5 py-0.5 rounded-full">{filteredHisobotlar.length}</span>}
        </button>
        <button onClick={() => setTab('oav')}
          className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors
            ${tab==='oav' ? 'border-purple-600 text-purple-700 bg-purple-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          📺 OAV
          {filteredOavlar.length > 0 && <span className="ml-1.5 bg-purple-100 text-purple-700 text-xs px-1.5 py-0.5 rounded-full">{filteredOavlar.length}</span>}
        </button>
      </div>

      {activeList.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">📭</p>
          <p className="text-lg font-medium">
            {tab === 'hisobot' ? "Yangi targ'ibotlar yo'q" : "Yangi OAV hisobotlari yo'q"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tab === 'hisobot'
            ? filteredHisobotlar.map(h => (
                <HisobotKarta key={h.id} h={h}
                  isRad={radIds.includes(h.id)} onToggleRad={toggleRad}
                  sabab={radSabablar[h.id]} onSabab={setSabab}
                  onLightbox={setLightbox} />
              ))
            : filteredOavlar.map(h => (
                <OavKarta key={h.id} h={h}
                  isRad={radIds.includes(h.id)} onToggleRad={toggleRad}
                  sabab={radSabablar[h.id]} onSabab={setSabab}
                  onLightbox={setLightbox} />
              ))
          }
        </div>
      )}

      {activeList.length > 3 && (
        <div className="mt-6 flex justify-end">
          <button onClick={() => saqlash(activeList.map(h => h.id))} disabled={loading} className="btn-success px-8">
            {loading ? '⏳ Saqlanmoqda...' : '✅ Hammasini saqlash'}
          </button>
        </div>
      )}
    </div>
  )
}
