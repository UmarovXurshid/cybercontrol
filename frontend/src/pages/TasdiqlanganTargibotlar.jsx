import { useEffect, useState, useRef } from 'react'
import api from '../api'
import toast from 'react-hot-toast'

// Default: oxirgi 30 kun (joriy oy boshi emas — ma'lumotlar avvalgi oyda bo'lishi mumkin)
const today      = new Date().toISOString().slice(0, 10)
const monthStart = new Date(Date.now() - 30*24*60*60*1000).toISOString().slice(0, 10)

export default function TasdiqlanganTargibotlar() {
  const [list, setList]         = useState([])
  const [loading, setLoading]   = useState(false)

  // Filterlar
  const [start, setStart]       = useState(monthStart)
  const [end, setEnd]           = useState(today)
  const [tumanlar, setTumanlar] = useState([])
  const [mahallalar, setMahallalar] = useState([])
  const [tumanId, setTumanId]   = useState('')
  const [mahallaId, setMahallaId] = useState('')
  const [search, setSearch]     = useState('')

  // Rasm ko'rish
  const [zoomImg, setZoomImg]   = useState(null)

  const allMahallalar = useRef([])   // barcha mahallalar (bir marta yuklanadi)

  // Dastlabki yuklanish
  useEffect(() => {
    api.get('/tumanlar/').then(r => setTumanlar(r.data))
    api.get('/mahallalar/').then(r => {
      allMahallalar.current = r.data
      setMahallalar(r.data)
    })
    load()
  }, [])

  // Tuman o'zgarganda mahallalar filterlanadi
  useEffect(() => {
    if (tumanId) {
      setMahallalar(allMahallalar.current.filter(m => String(m.tuman) === String(tumanId)))
    } else {
      setMahallalar(allMahallalar.current)
    }
    setMahallaId('')   // mahalla tanlovini tozalash
  }, [tumanId])

  const buildUrl = (s = start, e = end, t = tumanId, m = mahallaId, q = search) => {
    let url = `/tasdiqlangan/?start=${s}&end=${e}`
    if (t) url += `&tuman=${t}`
    if (m) url += `&mahalla=${m}`
    if (q) url += `&q=${encodeURIComponent(q)}`
    return url
  }

  const load = (s = start, e = end, t = tumanId, m = mahallaId, q = search) => {
    setLoading(true)
    api.get(buildUrl(s, e, t, m, q))
      .then(r => setList(r.data))
      .catch(() => toast.error('Yuklashda xato'))
      .finally(() => setLoading(false))
  }

  const applyFilter = () => load()

  const resetFilter = () => {
    setStart(monthStart)
    setEnd(today)
    setTumanId('')
    setMahallaId('')
    setSearch('')
    load(monthStart, today, '', '', '')
  }

  const wordHisobot = () => {
    window.open(`/api/word-hisobot/?start=${start}&end=${end}`, '_blank')
  }

  const rasmlarniOchir = async () => {
    if (!window.confirm(`${start} — ${end} oralig'idagi rasmlar o'chiriladi!`)) return
    try {
      await api.delete(`/tasdiqlangan/rasmlar/?start=${start}&end=${end}`)
      toast.success("Rasmlar o'chirildi")
      load()
    } catch { toast.error('Xato!') }
  }

  // Statistika
  const jami_qatnashchi = list.reduce((s, h) => s + (h.qatnashchilar_soni || 0), 0)
  const offline_soni    = list.filter(h => h.targibot_turi === 1).length
  const online_soni     = list.filter(h => h.targibot_turi === 2).length

  return (
    <div>
      {/* Sarlavha */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Tasdiqlangan targ'ibotlar
          <span className="ml-2 text-base font-normal text-gray-400">({list.length})</span>
        </h1>
        <div className="flex gap-2">
          <button onClick={wordHisobot} className="btn-primary">📄 Word hisobot</button>
          {start !== today &&
            <button onClick={rasmlarniOchir} className="btn-danger text-sm">🗑 Rasmlarni o'chirish</button>
          }
        </div>
      </div>

      {/* ── Filter panel ───────────────────────────────────────────────────── */}
      <div className="card mb-6 space-y-4">
        {/* 1-qator: sana */}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Dan (sana)</label>
            <input type="date" className="input-field w-44"
              value={start} onChange={e => setStart(e.target.value)}/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Gacha (sana)</label>
            <input type="date" className="input-field w-44"
              value={end} onChange={e => setEnd(e.target.value)}/>
          </div>

          {/* Tezkor sana tugmalari */}
          <div className="flex gap-1 flex-wrap">
            {[
              { label: 'Bugun',     fn: () => { setStart(today); setEnd(today) } },
              { label: 'Bu hafta',  fn: () => {
                const d = new Date()
                const mon = new Date(d); mon.setDate(d.getDate() - d.getDay() + 1)
                setStart(mon.toISOString().slice(0,10)); setEnd(today)
              }},
              { label: 'Bu oy',     fn: () => { setStart(monthStart); setEnd(today) } },
              { label: 'O\'tgan oy', fn: () => {
                const d = new Date()
                const first = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().slice(0,10)
                const last  = new Date(d.getFullYear(), d.getMonth(), 0).toISOString().slice(0,10)
                setStart(first); setEnd(last)
              }},
            ].map(b => (
              <button key={b.label} onClick={b.fn}
                className="text-xs px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors">
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2-qator: tuman / mahalla / qidiruv */}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tuman</label>
            <select className="input-field w-52"
              value={tumanId} onChange={e => setTumanId(e.target.value)}>
              <option value="">— Barcha tumanlar —</option>
              {tumanlar.map(t => (
                <option key={t.id} value={t.id}>{t.tuman_nomi}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Mahalla</label>
            <select className="input-field w-52"
              value={mahallaId} onChange={e => setMahallaId(e.target.value)}>
              <option value="">— Barcha mahallalar —</option>
              {mahallalar.map(m => (
                <option key={m.id} value={m.id}>{m.mahalla_nomi}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Mahalla qidiruv</label>
            <input className="input-field w-48" placeholder="🔍 Mahalla nomi..."
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyFilter()}/>
          </div>

          <div className="flex gap-2">
            <button onClick={applyFilter} className="btn-primary">
              🔍 Qidirish
            </button>
            <button onClick={resetFilter} className="btn-secondary">
              ✕ Tozalash
            </button>
          </div>
        </div>
      </div>

      {/* ── Yig'ma statistika ──────────────────────────────────────────────── */}
      {list.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Jami targ\'ibotlar', val: list.length,       color: 'text-indigo-600' },
            { label: 'Jami qatnashchi',    val: jami_qatnashchi,   color: 'text-emerald-600' },
            { label: 'Offline',            val: offline_soni,      color: 'text-blue-600' },
            { label: 'Online',             val: online_soni,       color: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="card py-3 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.val.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Jadval ─────────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden p-0">
        {loading && (
          <div className="text-center py-8 text-gray-400">⏳ Yuklanmoqda...</div>
        )}
        {!loading && (
          <table className="w-full">
            <thead>
              <tr>
                {['#','Mahalla / Tuman','Inspektor','Turi','Qatnashchi','Joy','Rasmlar','Sana'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((h, i) => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="table-cell text-gray-400">{i + 1}</td>
                  <td className="table-cell">
                    <span className="font-semibold">{h.mahalla_nomi}</span>
                    <br/>
                    <span className="text-xs text-gray-400">{h.tuman_nomi}</span>
                  </td>
                  <td className="table-cell text-sm">
                    {h.inspektor_fio}
                    <br/>
                    <span className="text-xs text-gray-400">{h.inspektor_tel}</span>
                  </td>
                  <td className="table-cell">
                    <span className={h.targibot_turi === 1 ? 'badge-blue' : 'badge-green'}>
                      {h.targibot_turi === 1 ? 'Offline' : 'Online'}
                    </span>
                  </td>
                  <td className="table-cell font-semibold text-center">
                    {h.qatnashchilar_soni}
                  </td>
                  <td className="table-cell text-xs text-gray-600">{h.joy_nomi}</td>
                  <td className="table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {h.rasmlar?.map(r => (
                        <img
                          key={r.id}
                          src={`/media/images/${r.rasm_url}`}
                          className="h-10 w-10 object-cover rounded cursor-zoom-in hover:opacity-80 transition-opacity bg-gray-100"
                          onClick={() => setZoomImg(`/media/images/${r.rasm_url}`)}
                          onError={e => {
                            e.target.onerror = null
                            e.target.src = '/media/placeholder.jpg'
                          }}
                        />
                      ))}
                      {(!h.rasmlar || h.rasmlar.length === 0) && (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="table-cell text-xs text-gray-400 whitespace-nowrap">
                    {h.qushilgan_vaqt?.slice(0, 16).replace('T', ' ')}
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-2">📭</div>
                    <div>Tanlangan sana oralig'ida ma'lumot topilmadi</div>
                    <div className="text-xs mt-1 text-gray-300">Sana yoki filter o'zgartirib ko'ring</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Rasm zoom modal ─────────────────────────────────────────────────── */}
      {zoomImg && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 cursor-zoom-out"
          onClick={() => setZoomImg(null)}
        >
          <img
            src={zoomImg}
            className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl object-contain bg-gray-200"
            onError={e => { e.target.onerror = null; e.target.alt = 'Rasm mavjud emas'; e.target.className = 'p-8 text-gray-400' }}
          />
        </div>
      )}
    </div>
  )
}
