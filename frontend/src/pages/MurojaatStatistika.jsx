import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import toast from 'react-hot-toast'
import api from '../api'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList,
} from 'recharts'
import { localDateStr, daysAgoStr } from '../utils/date'

const today         = localDateStr()
const thirtyDaysAgo = daysAgoStr(30)

const GEO_URL = '/uz-viloyatlar.geojson'

/* ── GeoJSON shapeName → DB nomi moslashtirish (Qamrov.jsx bilan bir xil) ── */
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
function normDB(s = '') {
  return s.toLowerCase()
    .replace(/\s*(viloyati?|viloayti?|shahri?|shahari?|respublikasi?)\s*/g, '')
    .replace(/\s+/g, ' ').trim()
}
function normGeo(shapeName = '') {
  const key = shapeName.toLowerCase().trim()
  const mapped = SHAPE_MAP[key]
  if (mapped) return mapped
  return key.replace(/\bregion\b|\brepublic\b|\bof\b/g, '').trim().split(/\s+/)[0]
}

/* ── Nisbiy songa qarab rang (ko'p murojaat = qizil, kam = yashil) ───────── */
function clr(ratio) {
  if (ratio >= 0.75) return { hex: '#dc2626', light: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-600'    }
  if (ratio >= 0.5)  return { hex: '#f97316', light: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-600' }
  if (ratio >= 0.25) return { hex: '#facc15', light: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700' }
  if (ratio > 0)     return { hex: '#22c55e', light: 'bg-green-50',  border: 'border-green-300',  text: 'text-green-600'  }
  return                     { hex: '#94a3b8', light: 'bg-gray-50',   border: 'border-gray-300',   text: 'text-gray-500'   }
}

const COLORS = ['#4f46e5', '#0ea5e9', '#f97316', '#22c55e', '#e11d48', '#a855f7', '#eab308', '#14b8a6']

export { COLORS }

export function FitBounds({ geoJson }) {
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

export function XaritaBlok({ viloyatlar }) {
  const [geoJson, setGeoJson] = useState(null)
  const [geoErr, setGeoErr]   = useState(false)
  const [geoLoad, setGeoLoad] = useState(true)
  const [popup, setPopup]     = useState(null)

  const vMap = {}
  viloyatlar.forEach(v => { vMap[normDB(v.nomi)] = v })
  const maxSoni = Math.max(1, ...viloyatlar.map(v => v.soni))

  useEffect(() => {
    setGeoLoad(true)
    fetch(GEO_URL)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setGeoJson)
      .catch(() => setGeoErr(true))
      .finally(() => setGeoLoad(false))
  }, [])

  const style = useCallback((feature) => {
    const uzName = normGeo(feature?.properties?.shapeName || '')
    const v = vMap[uzName]
    const c = clr(v ? v.soni / maxSoni : 0)
    return { fillColor: c.hex, fillOpacity: v ? 0.55 : 0.15, color: c.hex, weight: 2 }
  }, [viloyatlar, geoJson])

  const onEachFeature = useCallback((feature, layer) => {
    const gName  = feature?.properties?.shapeName || ''
    const uzName = normGeo(gName)
    const v = vMap[uzName]
    layer.on({
      mouseover(e) { e.target.setStyle({ weight: 3, color: '#1e293b' }) },
      mouseout(e) {
        const uz = normGeo(e.target.feature?.properties?.shapeName || '')
        const vv = vMap[uz]
        e.target.setStyle({ weight: 2, color: clr(vv ? vv.soni / maxSoni : 0).hex })
      },
      click() { setPopup(v ? { ...v, geoName: gName } : { geoName: gName, nomi: gName, soni: 0, zarar_jami: 0, tumanlar: [] }) },
    })
  }, [viloyatlar, geoJson])

  if (geoLoad) return <div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3 animate-pulse">🗺️</div>Xarita yuklanmoqda...</div>
  if (geoErr)  return <div className="card text-center py-16 text-gray-400"><div className="text-4xl mb-3">⚠️</div>Xarita yuklanmadi</div>

  return (
    <div className="flex gap-4 flex-wrap lg:flex-nowrap">
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 480 }}>
          <MapContainer center={[41.2, 63.5]} zoom={6} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap &copy; CARTO'
              subdomains="abcd" maxZoom={20}
            />
            {geoJson && (
              <GeoJSON key={JSON.stringify(viloyatlar.map(v => v.soni))} data={geoJson} style={style} onEachFeature={onEachFeature}/>
            )}
            {geoJson && <FitBounds geoJson={geoJson}/>}
          </MapContainer>
        </div>
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-600">
          {[['#dc2626','Juda ko\'p'],['#f97316','Ko\'p'],['#facc15','O\'rtacha'],['#22c55e','Kam'],['#94a3b8','Ma\'lumot yo\'q']].map(([col,lbl]) => (
            <span key={col} className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-sm inline-block border border-gray-300" style={{ background: col }}/>{lbl}
            </span>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-80 shrink-0">
        {popup ? (
          <div className="card border-2 border-indigo-200 h-full max-h-[520px] overflow-y-auto">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900">{popup.nomi}</h3>
                <p className="text-xs text-gray-400">{popup.tumanlar?.length || 0} tuman</p>
              </div>
              <button onClick={() => setPopup(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
            </div>
            <div className={`rounded-xl px-4 py-3 mb-4 ${clr(popup.soni / maxSoni).light} border ${clr(popup.soni / maxSoni).border}`}>
              <div className={`text-3xl font-black tabular-nums ${clr(popup.soni / maxSoni).text}`}>{popup.soni}</div>
              <div className="text-xs text-gray-500 mt-0.5">murojaat</div>
              {popup.zarar_jami > 0 && (
                <div className="text-xs text-gray-600 mt-1 font-medium">Jami zarar: {popup.zarar_jami.toLocaleString()} so'm</div>
              )}
            </div>
            <div className="space-y-1.5">
              {[...(popup.tumanlar || [])].sort((a, b) => b.soni - a.soni).map(t => {
                const tc = clr(maxSoni ? t.soni / maxSoni : 0)
                return (
                  <div key={t.id} className={`rounded-lg px-3 py-2 border ${tc.light} ${tc.border} flex items-center justify-between gap-2`}>
                    <span className="text-xs font-semibold text-gray-700 truncate flex-1">{t.nomi}</span>
                    <span className={`text-xs font-bold tabular-nums ${tc.text}`}>{t.soni} ta</span>
                  </div>
                )
              })}
              {(!popup.tumanlar || popup.tumanlar.length === 0) && (
                <div className="text-xs text-gray-400 text-center py-4">Bu viloyatda murojaat topilmadi</div>
              )}
            </div>
          </div>
        ) : (
          <div className="card h-full flex flex-col items-center justify-center text-gray-400 border-dashed min-h-[300px]">
            <div className="text-4xl mb-2">👆</div>
            <div className="text-sm text-center">Viloyatni bosing — tumanlar kesimida batafsil ma'lumot ko'rasiz</div>
          </div>
        )}
      </div>
    </div>
  )
}

export function ChartCard({ title, children }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      {children}
    </div>
  )
}

/* Konteyner kengligini kuzatib boradi — diagramma shunga moslashadi.
   Callback-ref ishlatiladi, chunki bu div boshida (loading holatida)
   hali DOM'da bolmaydi — oddiy useRef+useEffect(deps:[]) uni hech qachon
   topa olmas edi (effekt faqat bir marta, mount paytida ishga tushadi). */
function useContainerWidth() {
  const [width, setWidth] = useState(0)
  const [node, setNode] = useState(null)
  const ref = useCallback(el => setNode(el), [])
  useEffect(() => {
    if (!node) return
    const ro = new ResizeObserver(entries => {
      if (entries[0]) setWidth(entries[0].contentRect.width)
    })
    ro.observe(node)
    setWidth(node.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [node])
  return [ref, width]
}

export function MurojaatStatBlok({ data, loading }) {
  const [hududBoxRef, hududBoxWidth] = useContainerWidth()
  const usulPie   = useMemo(() => {
    const sorted = [...(data?.usul_stat || [])].sort((a, b) => b.soni - a.soni)
    const TOP_N = 6
    const top = sorted.slice(0, TOP_N).map(u => ({ name: u.nomi, value: u.soni }))
    const rest = sorted.slice(TOP_N).reduce((s, u) => s + u.soni, 0)
    if (rest > 0) top.push({ name: 'Boshqalar', value: rest })
    return top
  }, [data])
  const kasbPie   = useMemo(() => {
    const sorted = [...(data?.kasb_stat || [])].sort((a, b) => b.soni - a.soni)
    const TOP_N = 6
    const top = sorted.slice(0, TOP_N).map(k => ({ name: k.nomi, value: k.soni }))
    const rest = sorted.slice(TOP_N).reduce((s, k) => s + k.soni, 0)
    if (rest > 0) top.push({ name: 'Boshqalar', value: rest })
    return top
  }, [data])
  const jinsiPie  = useMemo(() => (data?.jinsi_stat || []).map(j => ({ name: j.jinsi, value: j.soni })), [data])
  const yoshBar   = useMemo(() => (data?.yosh_stat  || []).map(y => ({ name: y.guruh, soni: y.soni })),  [data])
  const hududDaraja = data?.hudud_daraja || 'viloyat'
  const hududBar = useMemo(
    () => [...(data?.hudud_stat || [])]
      .sort((a, b) => b.soni - a.soni)
      .map(v => ({ name: (v.nomi || "Noma'lum").replace(/ viloyati$/i, '').replace(/ shahri$/i, ''), soni: v.soni, zarar: v.zarar_jami })),
    [data]
  )
  const hududTitle = {
    viloyat: "🏛️ Viloyatlar kesimida (murojaatlar soni)",
    tuman:   "🏛️ Tumanlar kesimida (murojaatlar soni)",
    mahalla: "🏛️ Mahallalar kesimida (murojaatlar soni)",
  }[hududDaraja]

  if (loading) {
    return (
      <div className="card text-center py-16 text-gray-400">
        <div className="text-4xl mb-3 animate-pulse">⏳</div>
        <div className="text-lg">Yuklanmoqda...</div>
      </div>
    )
  }
  if (!data || data.jami === 0) {
    return (
      <div className="card text-center py-16 text-gray-400">
        <div className="text-5xl mb-3">📭</div>
        <div className="text-lg font-medium">Ma'lumot topilmadi</div>
        <div className="text-sm mt-1">Boshqa filtr / sana oralig'ini tanlang</div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-4 text-sm">
        <div className="text-right">
          <div className="text-xl font-black text-indigo-600 tabular-nums">{data.jami}</div>
          <div className="text-xs text-gray-500">jami murojaat</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-black text-red-600 tabular-nums">{data.jami_zarar.toLocaleString()}</div>
          <div className="text-xs text-gray-500">jami zarar (so'm)</div>
        </div>
      </div>

      {/* Shahar/tuman kesimida xarita */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-4">🗺️ Viloyat va tuman kesimida</h2>
        <XaritaBlok viloyatlar={data.viloyatlar}/>
      </div>

      {/* Hudud kesimida — vertikal ustunli diagramma, yozuvlar toliq tik (90°)
          joylashadi (qiya bolganda sigmagani uchun). Band soni kop bolsa
          gorizontal aylantirib korish mumkin. Filtrga qarab viloyat tanlansa
          tuman, tuman tanlansa mahalla kesimida chuqurlashadi */}
      <ChartCard title={hududTitle}>
        <div ref={hududBoxRef} style={{ overflowX: 'auto' }}>
          <BarChart width={Math.max(hududBoxWidth || 700, hududBar.length * 34)} height={420}
            data={hududBar} margin={{ top: 20, right: 20, left: -10, bottom: 140 }}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-90} textAnchor="end" height={140}/>
            <YAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }}/>
            <Tooltip formatter={(value, name) => name === 'zarar' ? [`${value.toLocaleString()} so'm`, 'Jami zarar'] : [value, 'Murojaatlar soni']}/>
            <Bar dataKey="soni" fill="#4f46e5" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="soni" position="top" style={{ fontSize: 11, fill: '#374151' }}/>
            </Bar>
          </BarChart>
        </div>
      </ChartCard>

      {/* Usul / Kasbi / Jinsi / Yosh kesimida */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="🎭 Sodir etish usuli kesimida">
          <ResponsiveContainer width="100%" height={360}>
            <PieChart>
              <Pie data={usulPie} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={80} labelLine={false}>
                {usulPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]}/>
              <Legend
                wrapperStyle={{ fontSize: 10, lineHeight: '16px' }}
                layout="vertical"
                verticalAlign="bottom"
                align="center"
                formatter={(value, entry) => {
                  const total = usulPie.reduce((s, u) => s + u.value, 0)
                  const pct = total ? ((entry.payload.value / total) * 100).toFixed(0) : 0
                  const short = value.length > 28 ? value.slice(0, 28) + '…' : value
                  return `${short} — ${entry.payload.value} ta (${pct}%)`
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="💼 Kasbi kesimida">
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={kasbPie} layout="vertical" margin={{ top: 5, right: 35, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }}/>
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }}
                tickFormatter={v => v.length > 22 ? v.slice(0, 22) + '…' : v}/>
              <Tooltip formatter={(value) => [value, 'soni']}/>
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {kasbPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: '#374151' }}/>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="👥 Jinsi kesimida">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={jinsiPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                label={({ name, value, percent }) => `${name} ${value} ta (${(percent * 100).toFixed(0)}%)`}>
                {jinsiPie.map((_, i) => <Cell key={i} fill={i === 0 ? '#4f46e5' : '#e11d48'}/>)}
              </Pie>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="🎂 Yoshi kesimida">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={yoshBar} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50}/>
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false}/>
              <Tooltip/>
              <Bar dataKey="soni" fill="#0ea5e9" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="soni" position="top" style={{ fontSize: 11, fill: '#374151' }}/>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

export default function MurojaatStatistika() {
  const [start, setStart] = useState(thirtyDaysAgo)
  const [end, setEnd]     = useState(today)
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/murojaat/statistika/?start=${start}&end=${end}`)
      setData(data)
    } catch {
      toast.error('Ma\'lumot yuklanmadi')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">📊 Murojaatlar statistikasi</h1>

      <div className="card mb-5 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Boshlanish</label>
          <input type="date" value={start} onChange={e => setStart(e.target.value)} className="input-field w-40"/>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tugash</label>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="input-field w-40"/>
        </div>
        <button onClick={load} disabled={loading} className="btn-primary">{loading ? '⏳' : '🔍'} Ko'rsatish</button>
      </div>

      <MurojaatStatBlok data={data} loading={loading}/>
    </div>
  )
}
