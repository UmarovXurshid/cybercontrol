import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, ComposedChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const today      = new Date().toISOString().slice(0, 10)
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
const CUR_YEAR    = new Date().getFullYear()
const OY_QISQA    = ['','Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek']
const COLORS      = ['#3c8dbc','#4caf50','#ff9800','#e53935','#8e24aa','#00897b','#f06292','#546e7a']
const kisqa       = (nomi) => (nomi || '').replace(' viloyati', '').replace(' viloayti', '')

const DARAJA_BADGE = {
  yuqori: 'bg-red-100 text-red-700',
  "o'rta": 'bg-amber-100 text-amber-700',
  past:   'bg-emerald-100 text-emerald-700',
}

export default function RespublikaDashboard() {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [diskData, setDiskData] = useState(null)
  const [compressing, setCompressing] = useState(false)
  const [compressResult, setCompressResult] = useState(null)

  // ── Umumiy infografika uchun ma'lumotlar ─────────────────────────────────
  const [samaradorlik, setSamaradorlik] = useState([])
  const [hisobotViloyatlar, setHisobotViloyatlar] = useState([])
  const [qamrovData, setQamrovData]     = useState([])
  const [dinamika, setDinamika]         = useState([])
  const [xavfli, setXavfli]             = useState([])

  const loadDashboard = () => {
    api.get('/dashboard/')
      .then(r => setDiskData(r.data.disk || null))
      .catch(() => {})
  }

  useEffect(() => {
    api.get('/respublika-dashboard/')
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
    loadDashboard()

    api.get(`/samaradorlik/?start=${monthStart}&end=${today}`)
      .then(r => setSamaradorlik(r.data.rows || [])).catch(() => {})
    api.get(`/hisobot-viloyatlar/?start=${monthStart}&end=${today}`)
      .then(r => setHisobotViloyatlar(r.data || [])).catch(() => {})
    api.get('/qamrov/')
      .then(r => setQamrovData(r.data || [])).catch(() => {})
    api.get(`/oylik-dinamika/?yil=${CUR_YEAR}`)
      .then(r => setDinamika(r.data.rows || [])).catch(() => {})
    api.get(`/xavfli-mahallalar/?start=${monthStart}&end=${today}`)
      .then(r => setXavfli(r.data.rows || [])).catch(() => {})
  }, [])

  const compressImages = async () => {
    if (!window.confirm('Barcha rasmlar siqiladi (hajmi kamayadi). Davom etasizmi?')) return
    setCompressing(true)
    setCompressResult(null)
    try {
      const r = await api.post('/compress-images/', { quality: 70, max_size: 900 })
      setCompressResult(r.data)
      toast.success(`✅ ${r.data.processed} ta rasm siqildi, ${r.data.saved_mb} MB bo'shadi!`)
      loadDashboard()
    } catch (err) {
      toast.error('Xato: ' + (err.response?.data?.error || err.message))
    } finally {
      setCompressing(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-400">⏳ Yuklanmoqda...</div>
  if (!data)   return <div className="text-center py-20 text-gray-400">Ma'lumot topilmadi</div>

  const statCards = [
    { label: 'Yangi (tasdiqlanmagan)', value: data.jami_yangi        ?? 0, color: 'text-amber-600',  bg: 'bg-amber-50' },
    { label: 'Tasdiqlangan',           value: data.jami_tasdiqlangan ?? 0, color: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'Rad etilgan',            value: data.jami_rad_etilgan  ?? 0, color: 'text-red-600',    bg: 'bg-red-50' },
    { label: 'Viloyatlar soni',        value: (data.viloyatlar || []).length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ]

  const LIMIT_GB  = 3
  const usedGb    = diskData?.hajm_gb || 0
  const usedPct   = Math.min(Math.round((usedGb / LIMIT_GB) * 100), 100)
  const barColor  = usedPct > 85 ? 'bg-red-500' : usedPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'

  // ── Chart uchun tayyorlangan ma'lumotlar ─────────────────────────────────
  const targibotMurojaatChart = samaradorlik.map(r => ({
    name: kisqa(r.nomi),
    "Targ'ibot": r.targibot_soni,
    Murojaat: r.murojaat_soni,
  }))

  const totalOffline = hisobotViloyatlar.reduce((s, r) => s + Number(r.offline_targibot_soni || 0), 0)
  const totalOnline  = hisobotViloyatlar.reduce((s, r) => s + Number(r.online_targibot_soni  || 0), 0)
  const offlineOnlinePie = [
    { name: 'Offline', value: totalOffline },
    { name: 'Online',  value: totalOnline },
  ].filter(d => d.value > 0)

  const qamrovChart = [...qamrovData]
    .sort((a, b) => b.foiz - a.foiz)
    .map(v => ({ name: kisqa(v.nomi), foiz: v.foiz }))
  const umumiyQamrov = qamrovData.length
    ? Math.round(qamrovData.reduce((s, v) => s + v.qamrangan, 0) * 100 /
        Math.max(qamrovData.reduce((s, v) => s + v.jami, 0), 1))
    : 0

  const dinamikaChart = dinamika.map(d => ({
    name: OY_QISQA[d.oy],
    "Targ'ibot": d.targibot_soni,
    Murojaat: d.murojaat_soni,
  }))

  const xavfliTop = xavfli.slice(0, 8)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Respublika dashboard</h1>

      {/* Umumiy statistika */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(s => (
          <div key={s.label} className={`card ${s.bg}`}>
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* ── Disk holati ──────────────────────────────────────────────────────── */}
      {diskData && (
        <div className="card mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-700">💾 Disk holati (rasmlar)</h2>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  usedPct > 85 ? 'bg-red-100 text-red-600' :
                  usedPct > 60 ? 'bg-amber-100 text-amber-600' :
                  'bg-emerald-100 text-emerald-600'
                }`}>{usedPct}% ishlatilgan</span>
              </div>

              <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${usedPct}%` }}/>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center">
                {[
                  { label: 'Ishlatilgan', val: `${diskData.hajm_mb} MB`, color: 'text-gray-800' },
                  { label: 'Limit',       val: `${LIMIT_GB} GB`,        color: 'text-gray-400' },
                  { label: 'Bo\'sh',      val: `${Math.max(0, (LIMIT_GB * 1024) - diskData.hajm_mb).toFixed(0)} MB`, color: 'text-emerald-600' },
                  { label: 'Rasmlar',     val: (diskData.rasm_soni ?? 0).toLocaleString(), color: 'text-indigo-600' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-lg p-2">
                    <div className={`text-base font-bold ${s.color}`}>{s.val}</div>
                    <div className="text-xs text-gray-400">{s.label}</div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 mt-2">
                O'rtacha rasm: {diskData.ortacha_kb} KB
              </p>
            </div>

            <div className="flex flex-col items-end gap-3">
              <button
                onClick={compressImages}
                disabled={compressing}
                className="btn-primary disabled:opacity-60 whitespace-nowrap"
              >
                {compressing ? '⏳ Siqilmoqda...' : '🗜 Rasmlarni siqish'}
              </button>
              <p className="text-xs text-gray-400 max-w-44 text-right">
                Barcha rasmlar 900px / 70% sifatga optimallashtiriladi
              </p>

              {compressResult && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-right">
                  <div className="font-semibold text-emerald-700">
                    ✅ {compressResult.saved_mb} MB bo'shatildi
                  </div>
                  <div className="text-emerald-600">
                    {compressResult.processed} ta ishlandi
                    {compressResult.skipped > 0 && ` · ${compressResult.skipped} topilmadi`}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Infografika: umumiy ko'rinish ────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

        {/* Viloyatlar bo'yicha targ'ibot vs murojaat */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">📊 Viloyatlar bo'yicha targ'ibot va murojaat</h2>
          <p className="text-xs text-gray-400 mb-3">Joriy oy ({monthStart} – {today})</p>
          {targibotMurojaatChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={targibotMurojaatChart} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={60}/>
                <YAxis tick={{ fontSize: 11 }}/>
                <Tooltip/>
                <Legend/>
                <Bar dataKey="Targ'ibot" fill="#3c8dbc" radius={[4,4,0,0]}/>
                <Bar dataKey="Murojaat"  fill="#e53935" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-gray-400 py-16 text-sm">Ma'lumot yo'q</p>}
        </div>

        {/* Offline vs Online */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">📢 Targ'ibot turi: Offline / Online</h2>
          <p className="text-xs text-gray-400 mb-3">Joriy oy bo'yicha, barcha viloyatlar</p>
          {offlineOnlinePie.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={offlineOnlinePie} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={95} label={({ name, value }) => `${name}: ${value}`}>
                  {offlineOnlinePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                </Pie>
                <Tooltip/>
                <Legend/>
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-gray-400 py-16 text-sm">Ma'lumot yo'q</p>}
        </div>

        {/* Qamrov */}
        <div className="card">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-gray-700">🗺 Qamrov darajasi — viloyatlar bo'yicha</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              Umumiy: {umumiyQamrov}%
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-3">Oxirgi 30 kun, tasdiqlangan hisobotlar bo'yicha</p>
          {qamrovChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={qamrovChart} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%"/>
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90}/>
                <Tooltip formatter={(v) => `${v}%`}/>
                <Bar dataKey="foiz" radius={[0,4,4,0]}>
                  {qamrovChart.map((d, i) => (
                    <Cell key={i} fill={d.foiz >= 70 ? '#4caf50' : d.foiz >= 40 ? '#ff9800' : '#e53935'}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-gray-400 py-16 text-sm">Ma'lumot yo'q</p>}
        </div>

        {/* Oylik dinamika */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">📅 Oylik dinamika ({CUR_YEAR})</h2>
          <p className="text-xs text-gray-400 mb-3">Targ'ibot va murojaatlar soni oylar kesimida</p>
          {dinamikaChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={dinamikaChart} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="name" tick={{ fontSize: 11 }}/>
                <YAxis tick={{ fontSize: 11 }}/>
                <Tooltip/>
                <Legend/>
                <Bar dataKey="Targ'ibot" fill="#3c8dbc" radius={[4,4,0,0]}/>
                <Line type="monotone" dataKey="Murojaat" stroke="#e53935" strokeWidth={2}/>
              </ComposedChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-gray-400 py-16 text-sm">Ma'lumot yo'q</p>}
        </div>
      </div>

      {/* Xavfli hududlar reytingi */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">🚨 Xavfli hududlar reytingi</h2>
        <p className="text-xs text-gray-400 mb-3">Murojaat ko'p, targ'ibot kam bo'lgan viloyatlar (joriy oy)</p>
        {xavfliTop.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Viloyat</th>
                  <th className="px-4 py-3 text-right">Targ'ibot</th>
                  <th className="px-4 py-3 text-right">Murojaat</th>
                  <th className="px-4 py-3 text-right">Daraja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {xavfliTop.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.nomi}</td>
                    <td className="px-4 py-3 text-right">{r.targibot_soni}</td>
                    <td className="px-4 py-3 text-right text-red-600 font-semibold">{r.murojaat_soni}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${DARAJA_BADGE[r.daraja] || 'bg-gray-100 text-gray-600'}`}>
                        {r.daraja}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-center text-gray-400 py-6 text-sm">Xavfli hudud topilmadi 🎉</p>}
      </div>

      {/* Viloyatlar jadvali */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Viloyatlar bo'yicha</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-xs">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Viloyat</th>
                <th className="px-4 py-3 text-left">Admin</th>
                <th className="px-4 py-3 text-right">Mahallalar</th>
                <th className="px-4 py-3 text-right">Yangi</th>
                <th className="px-4 py-3 text-right">Tasdiqlangan</th>
                <th className="px-4 py-3 text-right">Bugun</th>
                <th className="px-4 py-3 text-right">Rad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.viloyatlar.map((v, i) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{v.nomi}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {v.admin_username
                      ? <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{v.admin_username}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{v.mahalla_soni}</td>
                  <td className="px-4 py-3 text-right">
                    {v.yangi > 0
                      ? <span className="text-amber-600 font-semibold">{v.yangi}</span>
                      : <span className="text-gray-300">0</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600 font-semibold">{v.tasdiqlangan}</td>
                  <td className="px-4 py-3 text-right text-indigo-600 font-semibold">{v.bugun_tasdiqlangan}</td>
                  <td className="px-4 py-3 text-right text-red-500">{v.rad_etilgan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
