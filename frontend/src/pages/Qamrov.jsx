import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap, CircleMarker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import toast from 'react-hot-toast'
import api from '../api'

/* ── Leaflet ikon fix (Vite build) ──────────────────────────────────────── */
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

/* ── GeoJSON manbasi — lokal fayl (nginx orqali) ────────────────────────── */
const GEO_URL = '/uz-viloyatlar.geojson'

/* ── GeoJSON shapeName → DB nomi moslashtirish ──────────────────────────── */
// geoBoundaries shapeNamelari: "Andijan Region", "Bukhara Region", "Tashkent", ...
const SHAPE_MAP = {
  'andijan region':              'andijon',
  'bukhara region':              'buxoro',
  'fergana region':              "farg'ona",
  'jizzakh region':              'jizzax',
  'namangan region':             'namangan',
  'navoiy region':               'navoiy',
  'qashqadaryo region':          'qashqadaryo',
  'kashkadarya region':          'qashqadaryo',
  'republic of karakalpakstan':  "qoraqalpog'iston",
  'samarqand region':            'samarqand',
  'tashkent region':             'toshkent viloyati',
  'tashkent':                    'toshkent shahri',
  'sirdaryo region':             'sirdaryo',
  'surxondaryo region':          'surxondaryo',
  'xorazm region':               'xorazm',
}
/* DB nomini normallashtirish: "Buxoro viloayti" → "buxoro" */
function normDB(s = '') {
  return s.toLowerCase()
    .replace(/\s*(viloyati?|viloayti?|shahri?|shahari?|respublikasi?)\s*/g, '')
    .replace(/\s+/g, ' ').trim()
}
/* GeoJSON shapeName → kalit so'z */
function normGeo(shapeName = '') {
  const key = shapeName.toLowerCase().trim()
  const mapped = SHAPE_MAP[key]
  if (mapped) return mapped
  // Fallback: "Region" ni olib tashlab birinchi so'z
  return key.replace(/\bregion\b|\brepublic\b|\bof\b/g, '').trim().split(/\s+/)[0]
}

/* ── Foizga qarab rang ───────────────────────────────────────────────────── */
function clr(pct) {
  if (pct >= 80) return { bar: 'bg-green-500',  text: 'text-green-700',  light: 'bg-green-50',  border: 'border-green-300',  hex: '#22c55e', fillOpacity: 0.75 }
  if (pct >= 50) return { bar: 'bg-yellow-400', text: 'text-yellow-700', light: 'bg-yellow-50', border: 'border-yellow-300', hex: '#facc15', fillOpacity: 0.75 }
  if (pct >= 20) return { bar: 'bg-orange-400', text: 'text-orange-700', light: 'bg-orange-50', border: 'border-orange-300', hex: '#fb923c', fillOpacity: 0.75 }
  return           { bar: 'bg-red-500',    text: 'text-red-600',    light: 'bg-red-50',    border: 'border-red-300',    hex: '#ef4444', fillOpacity: 0.75 }
}

/* ── Progress bar ────────────────────────────────────────────────────────── */
function ProgressBar({ pct, jami, qamrangan, size = 'sm' }) {
  const c = clr(pct)
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className={`flex-1 bg-gray-200 rounded-full overflow-hidden min-w-[60px] ${size === 'lg' ? 'h-4' : 'h-2.5'}`}>
        <div className={`h-full rounded-full transition-all duration-500 ${c.bar}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm font-bold whitespace-nowrap tabular-nums ${c.text}`}>{pct}%</span>
      <span className="text-xs text-gray-400 whitespace-nowrap tabular-nums">{qamrangan}/{jami}</span>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   🗺️  XARITA KO'RINISHI
═════════════════════════════════════════════════════════════════════════════ */
function FitBounds({ geoJson }) {
  const map = useMap()
  useEffect(() => {
    if (!geoJson) return
    try {
      const layer = L.geoJSON(geoJson)
      map.fitBounds(layer.getBounds(), { padding: [20, 20] })
    } catch (_) {}
  }, [geoJson, map])
  return null
}

function XaritaView({ data, start, end }) {
  const [geoJson, setGeoJson]   = useState(null)
  const [geoErr, setGeoErr]     = useState(false)
  const [geoLoad, setGeoLoad]   = useState(true)
  const [popup, setPopup]       = useState(null)
  const [nuqtalar, setNuqtalar] = useState([])     // GPS pinlar

  /* DB nomi → coverage: "buxoro" → {foiz, jami, ...} */
  const coverageMap = {}
  data.forEach(v => { coverageMap[normDB(v.nomi)] = v })

  useEffect(() => {
    setGeoLoad(true)
    fetch(GEO_URL)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setGeoJson)
      .catch(() => setGeoErr(true))
      .finally(() => setGeoLoad(false))
  }, [])

  // GPS nuqtalar
  useEffect(() => {
    api.get(`/qamrov/nuqtalar/?start=${start}&end=${end}`)
      .then(r => setNuqtalar(r.data))
      .catch(() => {})
  }, [start, end])

  const style = useCallback((feature) => {
    const gName  = feature?.properties?.shapeName || ''
    const uzName = normGeo(gName)
    const v      = coverageMap[uzName]
    const c      = clr(v ? v.foiz : -1)
    return {
      fillColor:   v ? c.hex : '#94a3b8',
      fillOpacity: v ? 0.45 : 0.15,
      color:       v ? c.hex : '#64748b',
      weight:      2,
    }
  }, [data, geoJson])

  const onEachFeature = useCallback((feature, layer) => {
    const gName  = feature?.properties?.shapeName || ''
    const uzName = normGeo(gName)
    const v      = coverageMap[uzName]

    layer.on({
      mouseover(e) {
        const f = e.target.feature
        const uz = normGeo(f?.properties?.shapeName || '')
        const vv = coverageMap[uz]
        e.target.setStyle({ weight: 3, color: '#1e293b', fillOpacity: vv ? 0.65 : 0.25 })
      },
      mouseout(e) {
        const f = e.target.feature
        const uz = normGeo(f?.properties?.shapeName || '')
        const vv = coverageMap[uz]
        e.target.setStyle({ weight: 2, color: vv ? clr(vv.foiz).hex : '#64748b', fillOpacity: vv ? 0.45 : 0.15 })
      },
      click() {
        setPopup(v ? { ...v, geoName: gName } : { geoName: gName, nomi: gName, foiz: 0, jami: 0, qamrangan: 0, qolgan: 0, tumanlar: [] })
      },
    })
  }, [data, geoJson])

  if (geoLoad) return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <div className="text-4xl mb-3 animate-pulse">🗺️</div>
      <div>Xarita yuklanmoqda...</div>
    </div>
  )

  if (geoErr) return (
    <div className="card text-center py-16 text-gray-400">
      <div className="text-4xl mb-3">⚠️</div>
      <div className="font-medium">Xarita yuklanmadi</div>
      <div className="text-sm mt-1">Internet ulanishini tekshiring yoki "Daraxt ko'rinish"dan foydalaning</div>
    </div>
  )

  return (
    <div className="flex gap-4">
      {/* Xarita */}
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 520 }}>
          <MapContainer
            center={[41.2, 63.5]}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
              subdomains="abcd"
              maxZoom={20}
            />
            {geoJson && (
              <GeoJSON
                key={JSON.stringify(data.map(v => v.foiz))}
                data={geoJson}
                style={style}
                onEachFeature={onEachFeature}
              />
            )}
            {geoJson && <FitBounds geoJson={geoJson} />}

            {/* GPS pinlar */}
            {nuqtalar.map(n => (
              <CircleMarker
                key={n.id}
                center={[n.lat, n.lng]}
                radius={7}
                pathOptions={{
                  fillColor: n.targibot_turi === 1 ? '#4f46e5' : '#0ea5e9',
                  fillOpacity: 0.85,
                  color: '#fff',
                  weight: 1.5,
                }}
              >
                <Popup>
                  <div className="text-sm min-w-[160px]">
                    <div className="font-bold text-gray-800 mb-1">{n.mahalla_nomi}</div>
                    <div className="text-gray-500 text-xs mb-1">{n.tuman_nomi}</div>
                    <div className="flex gap-2 text-xs">
                      <span className={n.targibot_turi === 1 ? 'text-indigo-600 font-medium' : 'text-sky-600 font-medium'}>
                        {n.targibot_turi === 1 ? '📢 Offline' : '🌐 Online'}
                      </span>
                      <span className="text-gray-500">👥 {n.qatnashchilar} kishi</span>
                    </div>
                    <div className="text-gray-400 text-xs mt-0.5">📅 {n.sana}</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Rang izoh */}
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-600">
          {[['#22c55e','≥80% qamrov'],['#facc15','50–79%'],['#fb923c','20–49%'],['#ef4444','<20%'],['#d1d5db','Maʼlumot yoʼq']].map(([col, lbl]) => (
            <span key={col} className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-sm inline-block border border-gray-300" style={{ background: col }}/>
              {lbl}
            </span>
          ))}
          <span className="flex items-center gap-1.5 ml-2 pl-2 border-l border-gray-300">
            <span className="w-3 h-3 rounded-full inline-block bg-indigo-600"/>📢 Offline nuqta
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block bg-sky-500"/>🌐 Online nuqta
          </span>
          {nuqtalar.length > 0 && (
            <span className="text-indigo-600 font-medium ml-1">({nuqtalar.length} ta GPS nuqta)</span>
          )}
        </div>
      </div>

      {/* Tanlangan viloyat panel */}
      <div className="w-72 shrink-0">
        {popup ? (
          <div className="card border-2 border-indigo-200 h-full max-h-[540px] overflow-y-auto">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900">{popup.nomi}</h3>
                <p className="text-xs text-gray-400">{popup.jami} mahalla</p>
              </div>
              <button onClick={() => setPopup(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
            </div>

            {/* Umumiy progress */}
            <div className={`rounded-xl px-4 py-3 mb-4 ${clr(popup.foiz).light} border ${clr(popup.foiz).border}`}>
              <div className={`text-3xl font-black tabular-nums ${clr(popup.foiz).text}`}>{popup.foiz}%</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {popup.qamrangan} qamrangan · {popup.qolgan} qolmoqda
              </div>
              <div className="mt-2">
                <ProgressBar pct={popup.foiz} jami={popup.jami} qamrangan={popup.qamrangan} />
              </div>
            </div>

            {/* Tumanlar */}
            <div className="space-y-2">
              {popup.tumanlar?.map(t => {
                const tc = clr(t.foiz)
                return (
                  <div key={t.id} className={`rounded-lg px-3 py-2 border ${tc.light} ${tc.border}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700 truncate flex-1">{t.nomi}</span>
                      <span className={`text-xs font-bold tabular-nums ml-2 ${tc.text}`}>{t.foiz}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${tc.bar}`} style={{ width: `${t.foiz}%` }} />
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {t.qamrangan}/{t.jami} · {t.qolgan > 0 ? <span className="text-red-500">{t.qolgan} ta qoldi</span> : <span className="text-green-600">✓ to'liq</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="card h-full flex flex-col items-center justify-center text-gray-400 border-dashed">
            <div className="text-4xl mb-2">👆</div>
            <div className="text-sm text-center">Viloyatni bosing — batafsil ma'lumot ko'rasiz</div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   🌳  DARAXT KO'RINISHI
═════════════════════════════════════════════════════════════════════════════ */
function MahallaChip({ m }) {
  return (
    <div className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-sm border ${
      m.qamrangan ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'
    }`}>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-base leading-none">{m.qamrangan ? '✅' : '❌'}</span>
        <span className="truncate font-medium">{m.nomi}</span>
      </div>
      {m.qamrangan && (
        <span className="text-xs font-semibold text-green-600 whitespace-nowrap shrink-0">{m.targibot_soni} ta</span>
      )}
    </div>
  )
}

function TumanRow({ t, isOpen, onToggle }) {
  const c = clr(t.foiz)
  return (
    <div className={`border rounded-xl overflow-hidden ${c.border}`}>
      <button onClick={onToggle}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:brightness-95 transition-all ${c.light}`}>
        <span className={`text-xs transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>▶</span>
        <span className="font-semibold text-gray-800 text-sm flex-1 text-left">{t.nomi}</span>
        <ProgressBar pct={t.foiz} jami={t.jami} qamrangan={t.qamrangan} />
        {t.qolgan > 0 && <span className="text-xs text-red-500 font-medium whitespace-nowrap ml-1">−{t.qolgan}</span>}
      </button>
      {isOpen && (
        <div className="px-4 py-3 bg-white border-t border-gray-100">
          <div className="flex gap-3 mb-3 text-xs">
            <span className="text-green-600 font-semibold">✅ {t.qamrangan} ta qamrangan</span>
            {t.qolgan > 0 && <span className="text-red-500 font-semibold">❌ {t.qolgan} ta qolgan</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-1.5">
            {[...t.mahallalar].sort((a, b) => a.qamrangan - b.qamrangan).map(m => <MahallaChip key={m.id} m={m} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function ViloyatCard({ v, isOpen, onToggle, openTumans, onToggleTuman }) {
  const c = clr(v.foiz)
  return (
    <div className={`border-2 rounded-2xl overflow-hidden shadow-sm ${c.border}`}>
      <button onClick={onToggle}
        className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:brightness-95 transition-all ${c.light}`}>
        <span className={`text-lg transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>▶</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-2">
            <span className="font-bold text-gray-900 text-base">{v.nomi}</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {v.tumanlar.length} tuman · {v.jami} mahalla
            </span>
          </div>
          <ProgressBar pct={v.foiz} jami={v.jami} qamrangan={v.qamrangan} size="lg" />
        </div>
        <div className="shrink-0 text-right ml-2">
          {v.qolgan > 0
            ? <><div className="text-lg font-black text-red-500">{v.qolgan}</div><div className="text-xs text-gray-400">qolmoqda</div></>
            : <div className="text-2xl">🎉</div>
          }
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-2 bg-white/80 space-y-2">
          {v.tumanlar.map(t => (
            <TumanRow key={t.id} t={t} isOpen={!!openTumans[t.id]} onToggle={() => onToggleTuman(t.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function DaraxtView({ data }) {
  const [openV, setOpenV] = useState({})
  const [openT, setOpenT] = useState({})
  const toggleV = id => setOpenV(p => ({ ...p, [id]: !p[id] }))
  const toggleT = id => setOpenT(p => ({ ...p, [id]: !p[id] }))

  return (
    <div className="space-y-3">
      {[...data].sort((a, b) => a.foiz - b.foiz).map(v => (
        <ViloyatCard key={v.id} v={v}
          isOpen={!!openV[v.id]} onToggle={() => toggleV(v.id)}
          openTumans={openT}    onToggleTuman={toggleT} />
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   📊  UMUMIY STATISTIKA
═════════════════════════════════════════════════════════════════════════════ */
function UmumiyStats({ data }) {
  if (!data.length) return null
  const totalJami = data.reduce((s, v) => s + v.jami, 0)
  const totalQam  = data.reduce((s, v) => s + v.qamrangan, 0)
  const totalQol  = totalJami - totalQam
  const totalPct  = totalJami ? Math.round(totalQam * 100 / totalJami) : 0
  const c = clr(totalPct)

  return (
    <div className={`card mb-5 border-2 ${c.border} ${c.light}`}>
      <div className="flex items-center gap-6 flex-wrap">
        <div className="text-center shrink-0">
          <div className={`text-5xl font-black tabular-nums ${c.text}`}>{totalPct}%</div>
          <div className="text-xs text-gray-500 mt-0.5">umumiy qamrov</div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="text-sm text-gray-700 mb-2">
            <span className="font-bold text-green-600">{totalQam} ta mahalla</span> qamrangan
            {totalQol > 0 && <span className="text-red-500 ml-2 font-medium">· {totalQol} ta qolmoqda</span>}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2 ${c.bar}`}
              style={{ width: `${Math.max(totalPct, 3)}%` }}>
              {totalPct >= 15 && <span className="text-white text-xs font-bold">{totalPct}%</span>}
            </div>
          </div>
        </div>
        {/* Mini viloyatlar rating */}
        <div className="flex flex-col gap-1.5 shrink-0">
          {data.map(v => {
            const vc = clr(v.foiz)
            return (
              <div key={v.id} className="flex items-center gap-2 text-xs">
                <span className="w-24 text-right text-gray-500 truncate text-[11px]">
                  {v.nomi.replace(/ viloyati$/,'').replace(/ shahri$/,'')}
                </span>
                <div className="w-20 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full ${vc.bar}`} style={{ width: `${v.foiz}%` }} />
                </div>
                <span className={`font-semibold w-8 tabular-nums ${vc.text}`}>{v.foiz}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   🏠  ASOSIY SAHIFA
═════════════════════════════════════════════════════════════════════════════ */
export default function Qamrov() {
  const today      = new Date().toISOString().slice(0, 10)
  // Default: oxirgi 30 kun (joriy oy boshi emas)
  const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000).toISOString().slice(0, 10)

  const [tab, setTab]     = useState('xarita')
  const [start, setStart] = useState(thirtyDaysAgo)
  const [end, setEnd]     = useState(today)
  const [data, setData]   = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get(`/qamrov/?start=${start}&end=${end}`)
      setData(r.data)
      if (r.data.length === 0) toast('Ma\'lumot topilmadi — sana oralig\'ini kengaytiring', { icon: '📭' })
    } catch (e) {
      toast.error('Ma\'lumot yuklanmadi: ' + (e?.response?.data?.detail || e.message || 'xato'))
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  return (
    <div>
      {/* Sarlavha */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">
          🗺️ Qamrov ko'rinishi
        </h1>
      </div>

      {/* Filter */}
      <div className="card mb-5 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Boshlanish</label>
          <input type="date" value={start} onChange={e => setStart(e.target.value)} className="input-field w-40" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tugash</label>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="input-field w-40" />
        </div>
        <button onClick={load} disabled={loading} className="btn-primary">
          {loading ? '⏳' : '🔍'} Ko'rsatish
        </button>
        <div className="ml-auto flex flex-wrap gap-3 text-xs text-gray-500 items-center">
          {[['#22c55e','≥80%'],['#facc15','50–79%'],['#fb923c','20–49%'],['#ef4444','<20%']].map(([col, lbl]) => (
            <span key={col} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: col }} />
              {lbl}
            </span>
          ))}
        </div>
      </div>

      {/* Umumiy statistika */}
      {!loading && <UmumiyStats data={data} />}

      {/* Tablar */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'xarita',  label: '🗺️ Xarita' },
          { key: 'daraxt',  label: '🌳 Daraxt ko\'rinish' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              tab === t.key ? 'bg-white shadow text-indigo-700 font-semibold' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Kontent */}
      {loading ? (
        <div className="card text-center py-16 text-gray-400">
          <div className="text-4xl mb-3 animate-pulse">⏳</div>
          <div className="text-lg">Yuklanmoqda...</div>
        </div>
      ) : data.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🗺️</div>
          <div className="text-lg font-medium">Ma'lumot topilmadi</div>
          <div className="text-sm mt-1">Boshqa sana oralig'ini tanlang</div>
        </div>
      ) : tab === 'xarita' ? (
        <XaritaView data={data} start={start} end={end} />
      ) : (
        <DaraxtView data={data} />
      )}
    </div>
  )
}
