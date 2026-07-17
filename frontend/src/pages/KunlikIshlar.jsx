import { useEffect, useState, useRef } from 'react'
import api from '../api'
import toast from 'react-hot-toast'

const today = new Date().toISOString().slice(0, 10)
const role  = () => localStorage.getItem('role')

/* ── Isbот yuk­lash tugmasi ──────────────────────────────────────────────────── */
function ProofUpload({ label, urlVal, rasmVal, onUrl, onRasm, disabled }) {
  const ref = useRef()
  const [uploading, setUploading] = useState(false)
  const upload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('rasm', file)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kunlik-ishlar/rasm/', {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd
      })
      const data = await res.json()
      onRasm(data.url)
      toast.success('Rasm yuklandi')
    } catch { toast.error('Yuklashda xato') }
    finally { setUploading(false) }
  }
  return (
    <div className="mt-1 space-y-1">
      <div className="text-xs text-gray-500 font-medium">{label}</div>
      <div className="flex flex-wrap gap-2 items-center">
        <input type="url" placeholder="🔗 URL havola..."
          value={urlVal} onChange={e => onUrl(e.target.value)}
          disabled={disabled}
          className="border border-gray-300 rounded px-2 py-1 text-xs w-60 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100" />
        <span className="text-xs text-gray-400">yoki</span>
        <button type="button" disabled={disabled || uploading}
          onClick={() => ref.current.click()}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 disabled:opacity-50">
          {uploading ? '⏳' : '📷'} Rasm yuklash
        </button>
        {rasmVal && (
          <a href={`/media/images/${rasmVal}`} target="_blank" rel="noreferrer"
            className="text-xs text-blue-600 underline">📎 Ko'rish</a>
        )}
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={upload} />
      </div>
    </div>
  )
}

function Num({ label, field, val, onChange, disabled, highlight }) {
  return (
    <div className={`flex items-center justify-between py-1.5 px-3 rounded ${highlight ? 'bg-blue-50' : ''}`}>
      <span className="text-sm text-gray-700">{label}</span>
      <input type="number" min={0} value={val}
        onChange={e => onChange(field, Number(e.target.value))}
        disabled={disabled}
        className="w-24 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 disabled:text-gray-500" />
    </div>
  )
}

function BotRow({ label, val }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-3 bg-green-50 rounded">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-sm font-bold text-green-800">{val}</span>
        <span className="text-xs bg-green-200 text-green-700 px-1 rounded">🤖 bot</span>
      </div>
    </div>
  )
}

function Section({ title, color = 'blue', children }) {
  const colors = {
    blue: 'bg-blue-700', green: 'bg-green-700', indigo: 'bg-indigo-700',
    orange: 'bg-orange-600', purple: 'bg-purple-700', gray: 'bg-gray-700',
  }
  return (
    <div className="mb-6">
      <div className={`${colors[color]} text-white text-sm font-semibold px-4 py-2 rounded-t-lg`}>
        {title}
      </div>
      <div className="border border-gray-200 rounded-b-lg bg-white divide-y divide-gray-100">
        {children}
      </div>
    </div>
  )
}

const STATUS_CFG = {
  1: { label: 'Tayyorlanmoqda', cls: 'bg-gray-100 text-gray-600' },
  2: { label: 'Yuborildi',      cls: 'bg-yellow-100 text-yellow-700' },
  3: { label: 'Tasdiqlandi',    cls: 'bg-green-100 text-green-700' },
  4: { label: 'Rad etildi',     cls: 'bg-red-100 text-red-700' },
}
function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG[1]
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.cls}`}>{c.label}</span>
}

/* ══════════════════════════════════════════════════════════════════════════════
   RESPUBLIKA: Barcha viloyatlar jadvali
═══════════════════════════════════════════════════════════════════════════════ */
function ExcelExport({ sana }) {
  const [start, setStart]       = useState(sana)
  const [end, setEnd]           = useState(sana)
  const [loading, setLoading]   = useState(false)

  const download = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/kunlik-ishlar/excel/?start=${start}&end=${end}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Xato')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `kunlik_ishlar_${start}_${end}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Yuklab bo\'lmadi') }
    finally { setLoading(false) }
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
      <div className="font-semibold text-green-800 mb-3 text-sm">📊 Excel eksport</div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Boshlanish sanasi</label>
          <input type="date" value={start} onChange={e => setStart(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tugash sanasi</label>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none" />
        </div>
        <button onClick={download} disabled={loading}
          className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
          {loading ? '⏳ Yuklanmoqda...' : '⬇️ Excel yuklab olish'}
        </button>
      </div>
    </div>
  )
}

function RespublikaListView({ sana, onSelect }) {
  const [listData, setListData] = useState([])
  const [loading, setLoading]   = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/kunlik-ishlar/list/?sana=${sana}`)
      setListData(res.data)
    } catch { toast.error("Ma'lumot yuklanmadi") }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [sana])

  const tasdiqla = async (id) => {
    await api.post('/kunlik-ishlar/tasdiqlash/', { tasdiq_ids: [id], rad_ids: [] })
    toast.success('Tasdiqlandi!')
    load()
  }
  const rad = async (id) => {
    const sabab = prompt('Rad etish sababi:')
    if (sabab === null) return
    await api.post('/kunlik-ishlar/tasdiqlash/', { tasdiq_ids: [], rad_ids: [id], rad_sababi: sabab })
    toast.success('Rad etildi!')
    load()
  }

  if (loading) return <div className="text-center py-10 text-gray-400">⏳ Yuklanmoqda...</div>

  const yuborilgan = listData.filter(r => r.status === 2)
  const boshqa     = listData.filter(r => r.status !== 2)

  return (
    <div>
      {/* Yuborilgan — tasdiq kutayotgan */}
      {yuborilgan.length > 0 && (
        <div className="mb-6">
          <div className="bg-yellow-600 text-white text-sm font-semibold px-4 py-2 rounded-t-lg">
            📥 Tasdiq kutayotgan viloyatlar ({yuborilgan.length})
          </div>
          <div className="border border-yellow-200 rounded-b-lg bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-yellow-50 text-yellow-800">
                <tr>
                  <th className="px-4 py-2 text-left">Viloyat</th>
                  <th className="px-4 py-2 text-center">Uchrashuvlar</th>
                  <th className="px-4 py-2 text-center">Qatnashchilar</th>
                  <th className="px-4 py-2 text-center">OAV</th>
                  <th className="px-4 py-2 text-center">Probatsiya</th>
                  <th className="px-4 py-2 text-center">Holat</th>
                  <th className="px-4 py-2 text-center">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {yuborilgan.map(r => (
                  <tr key={r.id} className="border-t border-yellow-100 hover:bg-yellow-50">
                    <td className="px-4 py-2 font-medium text-blue-700 cursor-pointer hover:underline"
                      onClick={() => onSelect(r.viloyat)}>
                      {r.viloyat_nomi}
                    </td>
                    <td className="px-4 py-2 text-center">{r.bot?.jami || 0}</td>
                    <td className="px-4 py-2 text-center">{(r.bot?.fuk_jami || 0).toLocaleString()}</td>
                    <td className="px-4 py-2 text-center">
                      {(r.oav_tv_soni||0)+(r.oav_radio_soni||0)+(r.oav_gazeta_jurnal_soni||0)+(r.oav_internet_soni||0)+(r.oav_video_soni||0)}
                    </td>
                    <td className="px-4 py-2 text-center">{r.bot?.kat13 || 0}</td>
                    <td className="px-4 py-2 text-center"><StatusBadge status={r.status}/></td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => tasdiqla(r.id)}
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded">
                          ✅ Tasdiqla
                        </button>
                        <button onClick={() => rad(r.id)}
                          className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded">
                          ❌ Rad
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Barcha viloyatlar */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-indigo-700 text-white">
            <tr>
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Viloyat</th>
              <th className="px-4 py-2 text-center">Uchrashuvlar</th>
              <th className="px-4 py-2 text-center">Qatnashchilar</th>
              <th className="px-4 py-2 text-center">OAV</th>
              <th className="px-4 py-2 text-center">Probatsiya</th>
              <th className="px-4 py-2 text-center">Holat</th>
              <th className="px-4 py-2 text-center">Batafsil</th>
            </tr>
          </thead>
          <tbody>
            {listData.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Hech qanday ma'lumot yo'q</td></tr>
            )}
            {listData.map((r, i) => (
              <tr key={r.id || r.viloyat} className={`border-t ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                <td className="px-4 py-2 font-medium">{r.viloyat_nomi}</td>
                <td className="px-4 py-2 text-center">{r.bot?.jami || 0}</td>
                <td className="px-4 py-2 text-center">{(r.bot?.fuk_jami || 0).toLocaleString()}</td>
                <td className="px-4 py-2 text-center">
                  {(r.oav_tv_soni||0)+(r.oav_radio_soni||0)+(r.oav_gazeta_jurnal_soni||0)+(r.oav_internet_soni||0)+(r.oav_video_soni||0)}
                </td>
                <td className="px-4 py-2 text-center">{r.bot?.kat13 || 0}</td>
                <td className="px-4 py-2 text-center"><StatusBadge status={r.status}/></td>
                <td className="px-4 py-2 text-center">
                  <button onClick={() => onSelect(r.viloyat)}
                    className="text-xs text-indigo-600 hover:underline">Ko'rish →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   INFRATUZILMA PANELI — viloyat targ'ibot joylar umumiy soni
═══════════════════════════════════════════════════════════════════════════════ */
const INFRA_FIELDS = [
  { field: 'qizil_mfy',        label: "Qizil MFYlar soni" },
  { field: 'oliy_talim',       label: "Oliy ta'lim muassasalari" },
  { field: 'akademik_litsey',  label: "Akademik litseylar" },
  { field: 'orta_talim',       label: "O'rta ta'lim muassasalari (maktab)" },
  { field: 'maktabgacha',      label: "Maktabgacha ta'lim muassasalari" },
  { field: 'kasalxona',        label: "Kasalxona va poliklinikalar" },
  { field: 'bozor',            label: "Bozorlar va yirik savdo majmualari" },
  { field: 'xmko',             label: "XMKOlar" },
  { field: 'telegram',         label: "Telegram kanallar" },
  { field: 'istirohat',        label: "Istirohat bog'lari" },
  { field: 'jamoat_transport', label: "Jamoat transporti" },
  { field: 'masjid',           label: "Masjidar" },
]

const INFRA_EMPTY = Object.fromEntries(INFRA_FIELDS.map(f => [f.field, 0]))

function InfratuzilmaPanel({ viloyatId }) {
  const [data, setData]       = useState(INFRA_EMPTY)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(INFRA_EMPTY)
  const [loading, setLoading] = useState(false)
  const [open, setOpen]       = useState(false)

  useEffect(() => {
    const params = viloyatId ? `?viloyat=${viloyatId}` : ''
    api.get(`/infratuzilma/${params}`).then(r => {
      setData(r.data)
      setDraft(r.data)
    }).catch(() => {})
  }, [viloyatId])

  const save = async () => {
    setLoading(true)
    try {
      const payload = { ...draft }
      if (viloyatId) payload.viloyat = viloyatId
      const r = await api.put(`/infratuzilma/`, payload)
      setData(r.data)
      setDraft(r.data)
      setEditing(false)
      toast.success("Infratuzilma saqlandi!")
    } catch { toast.error("Xato!") }
    finally { setLoading(false) }
  }

  const setF = (field, val) => setDraft(d => ({ ...d, [field]: val }))

  return (
    <div className="mb-6 border border-teal-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-teal-700 text-white text-sm font-semibold">
        <span>🏛️ Targ'ibot joylarining umumiy soni (infratuzilma)</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="bg-white">
          <div className="divide-y divide-gray-100">
            {INFRA_FIELDS.map(({ field, label }) => (
              <div key={field} className="flex items-center justify-between py-1.5 px-3">
                <span className="text-sm text-gray-700">{label}</span>
                {editing
                  ? <input type="number" min={0} value={draft[field] || 0}
                      onChange={e => setF(field, Number(e.target.value))}
                      className="w-24 border border-teal-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-teal-400" />
                  : <span className="text-sm font-bold text-teal-800 w-24 text-right pr-2">{data[field] || 0}</span>
                }
              </div>
            ))}
          </div>
          <div className="px-4 py-3 bg-teal-50 flex justify-end gap-2">
            {editing
              ? <>
                  <button onClick={() => { setEditing(false); setDraft(data) }}
                    className="px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50">
                    Bekor qilish
                  </button>
                  <button onClick={save} disabled={loading}
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-sm font-medium disabled:opacity-60">
                    {loading ? '⏳' : '💾'} Saqlash
                  </button>
                </>
              : <button onClick={() => setEditing(true)}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-sm font-medium">
                  ✏️ Tahrirlash
                </button>
            }
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   ASOSIY KOMPONENT
═══════════════════════════════════════════════════════════════════════════════ */
export default function KunlikIshlar() {
  const [sana, setSana]             = useState(today)
  const [viloyatlar, setViloyatlar] = useState([])
  const [selViloyat, setSelViloyat] = useState('')
  const [record, setRecord]         = useState(null)
  const [bot, setBot]               = useState({})
  const [katNomlar, setKatNomlar]   = useState({})
  const [form, setForm]             = useState({})
  const [loading, setLoading]       = useState(false)
  const [loaded, setLoaded]         = useState(false)
  // respublika uchun: null = jadval ko'rinish, string = detail
  const [detailViloyat, setDetailViloyat] = useState(null)

  const myRole      = role()
  const isViloyat    = myRole === 'viloyat'
  const isRespublika = myRole === 'respublika'
  const isLocked     = record?.status === 3

  useEffect(() => {
    if (isRespublika) api.get('/viloyatlar/').then(r => setViloyatlar(r.data))
  }, [])

  const load = async (vId) => {
    const vid = vId !== undefined ? vId : (isViloyat ? '' : selViloyat)
    if (isRespublika && !vid) return
    setLoading(true)
    try {
      const params = `?sana=${sana}${vid ? `&viloyat=${vid}` : ''}`
      const res = await api.get(`/kunlik-ishlar/${params}`)
      setRecord(res.data.record)
      setBot(res.data.bot)
      setKatNomlar(res.data.kat_nomlar || {})
      setForm({ ...res.data.record })
      setLoaded(true)
    } catch { toast.error("Ma'lumot yuklashda xato") }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (isViloyat) load()
  }, [sana])

  // Respublika jadvaldan viloyat tanlansa detail ochilsin
  const openDetail = (vId) => {
    const vid = String(vId)
    setSelViloyat(vid)
    setDetailViloyat(vid)
    setLoaded(false)
    load(vid)
  }

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const saqlash = async (yuborish = false) => {
    setLoading(true)
    try {
      const payload = { ...form, sana, yuborish }
      if (isRespublika) payload.viloyat = selViloyat
      const res = await api.post('/kunlik-ishlar/saqlash/', payload)
      setRecord(res.data)
      setForm({ ...res.data })
      toast.success(yuborish ? 'Yuborildi!' : 'Saqlandi!')
    } catch(e) {
      toast.error(e?.response?.data?.error || 'Xato!')
    }
    finally { setLoading(false) }
  }

  const tasdiqlash = async (ids, rad_ids, sabab = '') => {
    await api.post('/kunlik-ishlar/tasdiqlash/', { tasdiq_ids: ids, rad_ids, rad_sababi: sabab })
    toast.success('Bajarildi!')
    load()
  }

  const jami_uchrashuv = [1,2,3,4,5,6,7,8,9,10,11,12]
    .reduce((s, k) => s + (bot[`kat${k}`] || 0), 0)

  const canEdit = loaded && !isLocked && (isViloyat || (isRespublika && !!selViloyat))

  const viloyatNomi = viloyatlar.find(v => String(v.id) === String(selViloyat))?.nomi || ''

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kunlik qilingan ishlar</h1>
          {isRespublika && detailViloyat && viloyatNomi && (
            <p className="text-sm text-gray-500 mt-0.5">📍 {viloyatNomi}</p>
          )}
        </div>
        {record && <StatusBadge status={record.status} />}
      </div>

      {/* ── Filter ── */}
      <div className="card flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Sana</label>
          <input type="date" value={sana} onChange={e => { setSana(e.target.value); setDetailViloyat(null); setLoaded(false) }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>

        {isRespublika && (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Viloyat (detail ko'rish)</label>
              <select value={selViloyat} onChange={e => { setSelViloyat(e.target.value); setDetailViloyat(e.target.value || null); setLoaded(false) }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
                <option value="">— Barcha viloyatlar —</option>
                {viloyatlar.map(v => <option key={v.id} value={v.id}>{v.nomi}</option>)}
              </select>
            </div>
            {selViloyat && (
              <button onClick={() => load(selViloyat)} disabled={loading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
                {loading ? '⏳' : '🔍'} Ko'rish
              </button>
            )}
            {detailViloyat && (
              <button onClick={() => { setDetailViloyat(null); setSelViloyat(''); setLoaded(false) }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                ← Ro'yxatga qaytish
              </button>
            )}
          </>
        )}

        {isViloyat && (
          <button onClick={() => load()} disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
            {loading ? '⏳' : '🔍'} Ko'rish
          </button>
        )}

        {record?.status === 4 && record.rad_sababi && (
          <div className="w-full mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            ❌ <b>Rad sababi:</b> {record.rad_sababi}
          </div>
        )}
      </div>

      {/* ── Infratuzilma paneli (viloyat adminlarga va respublika detail ko'rinishda) ── */}
      {(isViloyat || (isRespublika && detailViloyat)) && (
        <InfratuzilmaPanel viloyatId={isRespublika ? selViloyat : undefined} />
      )}

      {/* ── RESPUBLIKA: Excel export + Jadval ko'rinish ── */}
      {isRespublika && !detailViloyat && (
        <>
          <ExcelExport sana={sana} />
          <RespublikaListView sana={sana} onSelect={openDetail} />
        </>
      )}

      {/* ── DETAIL KO'RINISH (viloyat va respublika) ── */}
      {(isViloyat || (isRespublika && detailViloyat)) && (
        <>
          {!loaded && (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-3">📋</div>
              <p>{isViloyat ? 'Ko\'rish tugmasini bosing' : 'Viloyatni tanlang yoki jadvaldan bosing'}</p>
            </div>
          )}

          {loaded && (
            <>
            {/* ══════ 1-BO'LIM: UCHRASHUVLAR ══════ */}
            <Section title="1. O'tkazilgan uchrashuvlar soni (bot ma'lumotlari)" color="blue">
              {[1,2,3,4,5,6,7,8,9].map(k => (
                <BotRow key={k}
                  label={katNomlar[`kat${k}`] || `Kategoriya ${k}`}
                  val={bot[`kat${k}`] || 0} />
              ))}
              <div className="border-t border-dashed border-blue-200 mt-1">
                <Num label="IIO boshlig'i TV murojaati (qo'lda)" field="iio_tv_murojaati"
                  val={form.iio_tv_murojaati || 0} onChange={set} disabled={!canEdit} highlight />
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-blue-100 font-bold">
                <span className="text-sm text-blue-900">JAMI uchrashuvlar</span>
                <div className="flex items-center gap-1">
                  <span className="text-lg text-blue-900">{jami_uchrashuv}</span>
                  <span className="text-xs bg-green-200 text-green-700 px-1 rounded">🤖 bot</span>
                </div>
              </div>
              {canEdit && (
                <div className="px-3 pb-3 pt-2">
                  <ProofUpload label="Isbот (umumiy — rasm yoki URL)"
                    urlVal={form.uchrashuv_proof_url || ''} rasmVal={form.uchrashuv_proof_rasm || ''}
                    onUrl={v => set('uchrashuv_proof_url', v)} onRasm={v => set('uchrashuv_proof_rasm', v)}
                    disabled={!canEdit} />
                </div>
              )}
            </Section>

            {/* ══════ 2-BO'LIM: QATNASHCHILAR ══════ */}
            <Section title="2. Qatnashchilar soni (bot ma'lumotlari)" color="green">
              <BotRow label="Jami qatnashchilar"          val={(bot.fuk_jami || 0).toLocaleString()} />
              <BotRow label="Offline — 18 yoshgacha"      val={(bot.off18g   || 0).toLocaleString()} />
              <BotRow label="Offline — 18 yoshdan katta"  val={(bot.off18k   || 0).toLocaleString()} />
              <BotRow label="Online — 18 yoshgacha"       val={(bot.onl18g   || 0).toLocaleString()} />
              <BotRow label="Online — 18 yoshdan katta"   val={(bot.onl18k   || 0).toLocaleString()} />
            </Section>

            {/* ══════ 3-BO'LIM: OAV ══════ */}
            <Section title="3. OAV chiqishlari soni" color="indigo">
              {[
                { label: 'Televidenie',              soni: 'oav_tv_soni',            url: 'oav_tv_url' },
                { label: 'Radio',                    soni: 'oav_radio_soni',         url: 'oav_radio_url' },
                { label: 'Gazeta va jurnal',         soni: 'oav_gazeta_jurnal_soni', url: 'oav_gazeta_jurnal_url' },
                { label: 'Internet (ijt. tarmoqlar)',soni: 'oav_internet_soni',      url: 'oav_internet_url' },
              ].map(({ label, soni, url }) => (
                <div key={soni} className="px-3 py-2">
                  <Num label={label} field={soni} val={form[soni] || 0} onChange={set} disabled={!canEdit} />
                  {canEdit
                    ? <div className="pl-3"><input type="url" placeholder="🔗 URL havola..."
                        value={form[url] || ''} onChange={e => set(url, e.target.value)}
                        className="mt-1 border border-gray-300 rounded px-2 py-1 text-xs w-72 focus:outline-none focus:ring-1 focus:ring-indigo-400" /></div>
                    : form[url] && <div className="pl-3 text-xs"><a href={form[url]} target="_blank" rel="noreferrer" className="text-blue-600 underline">{form[url]}</a></div>
                  }
                </div>
              ))}
              <div className="px-3 py-2">
                <Num label="Video va kontent chiqarilganligi (jami)" field="oav_video_soni" val={form.oav_video_soni || 0} onChange={set} disabled={!canEdit} />
                <div className="pl-3 grid grid-cols-3 gap-2 mt-1">
                  {[['10K', 'oav_video_10k'], ['100K', 'oav_video_100k'], ['1M', 'oav_video_1m']].map(([l, f]) => (
                    <div key={f}>
                      <div className="text-xs text-gray-500 mb-0.5">Ko'rishlar: {l}</div>
                      <input type="number" min={0} value={form[f] || 0}
                        onChange={e => set(f, Number(e.target.value))}
                        disabled={!canEdit}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none disabled:bg-gray-100" />
                    </div>
                  ))}
                </div>
                {canEdit && <div className="pl-3 mt-1">
                  <input type="url" placeholder="🔗 URL havola..." value={form.oav_video_url || ''}
                    onChange={e => set('oav_video_url', e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-xs w-72 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                </div>}
              </div>
            </Section>

            {/* ══════ 4-BO'LIM: MATERIALLAR ══════ */}
            <Section title="4. Tarqatilgan materiallar" color="orange">
              <Num label="Ijtimoiy tarmoqlarda aylanish soni"   field="mat_ijtimoiy_tarmoq"  val={form.mat_ijtimoiy_tarmoq  || 0} onChange={set} disabled={!canEdit} />
              <Num label="O'z tashabbusi bilan chiqarilgan"     field="mat_oz_tashabbusi"    val={form.mat_oz_tashabbusi    || 0} onChange={set} disabled={!canEdit} />
              <Num label="Flayer va buklet"                     field="mat_flayer_buklet"    val={form.mat_flayer_buklet    || 0} onChange={set} disabled={!canEdit} />
              <Num label="LED ekranlarda qo'yilgan roliklar"    field="mat_led_ekran"        val={form.mat_led_ekran        || 0} onChange={set} disabled={!canEdit} />
              <Num label="Boshqa materiallar"                   field="mat_boshqa"           val={form.mat_boshqa           || 0} onChange={set} disabled={!canEdit} />
              {canEdit && (
                <div className="px-3 pb-3 pt-1">
                  <ProofUpload label="Isbот (materiallar)"
                    urlVal={form.mat_proof_url || ''} rasmVal={form.mat_proof_rasm || ''}
                    onUrl={v => set('mat_proof_url', v)} onRasm={v => set('mat_proof_rasm', v)}
                    disabled={!canEdit} />
                </div>
              )}
            </Section>

            {/* ══════ 5-BO'LIM: PROBATSIYA ══════ */}
            <Section title="5. Probatsiya ro'yxatidagi shaxslar bilan suhbatlar" color="purple">
              <BotRow
                label={katNomlar['kat13'] || "Probatsiya ro'yxatidagi shaxslar"}
                val={bot.kat13 || 0} />
              <div className="px-3 py-2 text-xs text-gray-400">
                🤖 Bu ma'lumot bot orqali to'ldiriladi. O'zgartirish mumkin emas.
              </div>
            </Section>

            {/* ══════ 6-BO'LIM: QO'SHIMCHA ══════ */}
            <Section title="6. Qo'shimcha ko'rsatkichlar" color="gray">
              <Num label="IIO soha xizmatlari jalb etilgan"    field="iio_xizmat_soni"       val={form.iio_xizmat_soni       || 0} onChange={set} disabled={!canEdit} />
              <Num label="Hamkor tashkilotlar (volontyorlar)"  field="hamkor_tashkilot_soni" val={form.hamkor_tashkilot_soni || 0} onChange={set} disabled={!canEdit} />
              <Num label="Sayber jinoyatlarga oid"             field="sayber_soni"           val={form.sayber_soni           || 0} onChange={set} disabled={!canEdit} />
            </Section>

            {/* ══════ TUGMALAR ══════ */}
            {isViloyat && !isLocked && (
              <div className="flex gap-3 justify-end mt-4 mb-8">
                <button onClick={() => saqlash(false)} disabled={loading}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
                  💾 Saqlash (draft)
                </button>
                <button onClick={() => saqlash(true)} disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
                  📤 Yuborish (respublikaga)
                </button>
              </div>
            )}

            {isRespublika && record?.status === 2 && (
              <div className="flex gap-3 justify-end mt-4 mb-8">
                <button onClick={() => {
                  const sabab = prompt('Rad etish sababi:')
                  if (sabab !== null) tasdiqlash([], [record.id], sabab)
                }} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">
                  ❌ Rad etish
                </button>
                <button onClick={() => tasdiqlash([record.id], [])}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
                  ✅ Tasdiqlash
                </button>
              </div>
            )}

            {isLocked && (
              <div className="text-center py-4 text-green-600 font-medium text-sm mb-8">
                ✅ Bu kun hisoboti tasdiqlangan. O'zgartirish mumkin emas.
              </div>
            )}
            </>
          )}
        </>
      )}
    </div>
  )
}
