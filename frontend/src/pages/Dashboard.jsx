import { useEffect, useState } from 'react'
import api from '../api'
import {
  BarChart, Bar, ComposedChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const today      = new Date().toISOString().slice(0, 10)
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
const CUR_YEAR    = new Date().getFullYear()
const OY_QISQA    = ['','Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek']
const COLORS      = ['#3c8dbc','#4caf50','#ff9800','#e53935','#8e24aa','#00897b','#f06292','#546e7a']

const DARAJA_BADGE = {
  yuqori: 'bg-red-100 text-red-700',
  "o'rta": 'bg-amber-100 text-amber-700',
  past:   'bg-emerald-100 text-emerald-700',
}

const StatCard = ({ label, value, color, icon }) => (
  <div className={`stat-card border-l-4 ${color}`}>
    <div className="text-3xl">{icon}</div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value ?? '...'}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
)

export default function Dashboard() {
  const [data, setData] = useState(null)

  const [samaradorlik, setSamaradorlik] = useState([])
  const [hisobotTumanlar, setHisobotTumanlar] = useState([])
  const [qamrovData, setQamrovData]     = useState(null)
  const [dinamika, setDinamika]         = useState([])
  const [xavfli, setXavfli]             = useState([])

  useEffect(() => {
    api.get('/dashboard/').then(r => setData(r.data))

    api.get(`/samaradorlik/?start=${monthStart}&end=${today}`)
      .then(r => setSamaradorlik(r.data.rows || [])).catch(() => {})
    api.get(`/hisobot-tumanlar/?start=${monthStart}&end=${today}`)
      .then(r => setHisobotTumanlar(r.data || [])).catch(() => {})
    api.get('/qamrov/')
      .then(r => setQamrovData((r.data || [])[0] || null)).catch(() => {})
    api.get(`/oylik-dinamika/?yil=${CUR_YEAR}`)
      .then(r => setDinamika(r.data.rows || [])).catch(() => {})
    api.get(`/xavfli-mahallalar/?start=${monthStart}&end=${today}`)
      .then(r => setXavfli(r.data.rows || [])).catch(() => {})
  }, [])

  // ── Mahalla darajasidagi samaradorlik ma'lumotlarini tuman bo'yicha yig'ish ──
  const tumanChart = (() => {
    const map = {}
    for (const r of samaradorlik) {
      const key = r.tuman_nomi || '—'
      if (!map[key]) map[key] = { name: key, "Targ'ibot": 0, Murojaat: 0 }
      map[key]["Targ'ibot"] += Number(r.targibot_soni || 0)
      map[key]["Murojaat"]  += Number(r.murojaat_soni  || 0)
    }
    return Object.values(map)
  })()

  const totalOffline = hisobotTumanlar.reduce((s, r) => s + Number(r.offline_targibot_soni || 0), 0)
  const totalOnline  = hisobotTumanlar.reduce((s, r) => s + Number(r.online_targibot_soni  || 0), 0)
  const offlineOnlinePie = [
    { name: 'Offline', value: totalOffline },
    { name: 'Online',  value: totalOnline },
  ].filter(d => d.value > 0)

  const qamrovChart = qamrovData
    ? [...(qamrovData.tumanlar || [])].sort((a, b) => b.foiz - a.foiz).map(t => ({ name: t.nomi, foiz: t.foiz }))
    : []

  const dinamikaChart = dinamika.map(d => ({
    name: OY_QISQA[d.oy],
    "Targ'ibot": d.targibot_soni,
    Murojaat: d.murojaat_soni,
  }))

  const xavfliTop = xavfli.slice(0, 8)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Bosh sahifa</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Yangi targ'ibotlar"      value={data?.yangi}        color="border-blue-500"    icon="📋"/>
        <StatCard label="Tasdiqlangan"             value={data?.tasdiqlangan} color="border-emerald-500" icon="✅"/>
        <StatCard label="Rad etilgan"              value={data?.rad_etilgan}  color="border-red-500"     icon="❌"/>
        <div className="stat-card border-l-4 border-yellow-500">
          <div className="text-3xl">🏛</div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{data?.bugun?.mfy_soni ?? '...'}</p>
            <p className="text-sm text-gray-500">Bugun targ'ibot qilgan MFY</p>
            <p className="text-xs text-gray-400 mt-0.5">{data?.bugun?.fuqarolar_soni ?? 0} fuqaro</p>
          </div>
        </div>
      </div>

      {/* ── Infografika: umumiy ko'rinish ────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

        {/* Tumanlar bo'yicha targ'ibot vs murojaat */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">📊 Tumanlar bo'yicha targ'ibot va murojaat</h2>
          <p className="text-xs text-gray-400 mb-3">Joriy oy ({monthStart} – {today})</p>
          {tumanChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={tumanChart} margin={{ left: -10 }}>
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
          <p className="text-xs text-gray-400 mb-3">Joriy oy bo'yicha, viloyat kesimida</p>
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
            <h2 className="text-sm font-semibold text-gray-700">🗺 Qamrov darajasi — tumanlar bo'yicha</h2>
            {qamrovData && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                Umumiy: {qamrovData.foiz}%
              </span>
            )}
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

      {/* Xavfli mahallalar reytingi */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">🚨 Xavfli mahallalar reytingi</h2>
        <p className="text-xs text-gray-400 mb-3">Murojaat ko'p, targ'ibot kam bo'lgan mahallalar (joriy oy)</p>
        {xavfliTop.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Mahalla</th>
                  <th className="px-4 py-3 text-left">Tuman</th>
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
                    <td className="px-4 py-3 text-gray-500">{r.tuman_nomi}</td>
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
        ) : <p className="text-center text-gray-400 py-6 text-sm">Xavfli mahalla topilmadi 🎉</p>}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Tizim haqida</h2>
        <p className="text-gray-500 text-sm">
          Ushbu tizim mahalla inspektorlaridan Telegram bot orqali targ'ibot hisobotlarini yig'adi
          va admin panel orqali boshqaradi.
        </p>
      </div>
    </div>
  )
}
