import { useEffect, useState } from 'react'
import api from '../api'
import DateFilter from '../components/DateFilter'

const today      = new Date().toISOString().slice(0,10)
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)

const DARAJA_STYLE = {
  yuqori: 'bg-red-100 text-red-700 font-bold',
  "o'rta": 'bg-yellow-100 text-yellow-700 font-semibold',
  past:   'bg-emerald-100 text-emerald-700',
}
const DARAJA_LABEL = {
  yuqori: '🔴 Yuqori',
  "o'rta": '🟡 O\'rta',
  past:   '🟢 Past',
}

export default function XavfliMahallalar() {
  const [data, setData]   = useState(null)
  const [start, setStart] = useState(monthStart)
  const [end, setEnd]     = useState(today)
  const role = localStorage.getItem('role')

  const load = (s=start, e=end) =>
    api.get(`/xavfli-mahallalar/?start=${s}&end=${e}`).then(r => setData(r.data))

  useEffect(() => { load() }, [])

  const rows = data?.rows || []
  const yuqori = rows.filter(r => r.daraja === 'yuqori').length
  const orta   = rows.filter(r => r.daraja === "o'rta").length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Xavfli hududlar</h1>
        <p className="text-sm text-gray-500">
          Murojaat ko'p, targ'ibot kam bo'lgan {role === 'respublika' ? 'viloyatlar' : 'mahallalar'}
        </p>
      </div>

      <DateFilter start={start} end={end} onStart={setStart} onEnd={setEnd}
        onSearch={() => load()} onReset={() => { setStart(monthStart); setEnd(today); load(monthStart, today) }}/>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card border-l-4 border-red-500">
          <div className="text-3xl">🔴</div>
          <div>
            <p className="text-2xl font-bold text-red-600">{yuqori}</p>
            <p className="text-sm text-gray-500">Yuqori xavfli</p>
          </div>
        </div>
        <div className="stat-card border-l-4 border-yellow-500">
          <div className="text-3xl">🟡</div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">{orta}</p>
            <p className="text-sm text-gray-500">O'rta xavfli</p>
          </div>
        </div>
        <div className="stat-card border-l-4 border-emerald-500">
          <div className="text-3xl">✅</div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">{rows.length - yuqori - orta}</p>
            <p className="text-sm text-gray-500">Nazorat ostida</p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="px-4 py-3 bg-red-50 border-b text-xs text-red-700">
          ⚠️ <b>Yuqori xavf</b>: murojaat bor, targ'ibot yo'q. &nbsp;
          <b>O'rta xavf</b>: targ'ibot soni murojaatdan 5 barobar kamroq.
        </div>
        <table className="w-full">
          <thead><tr>
            {['#',
              role === 'respublika' ? 'Viloyat' : 'Tuman',
              role !== 'respublika' ? 'Mahalla' : null,
              "Targ'ibot", 'Murojaat', 'Xavf darajasi'
            ].filter(Boolean).map(h => (
              <th key={h} className="table-header text-left">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={`hover:bg-gray-50 ${r.daraja === 'yuqori' ? 'bg-red-50/40' : ''}`}>
                <td className="table-cell text-gray-400">{i+1}</td>
                <td className="table-cell font-medium">
                  {role === 'respublika' ? r.nomi : r.tuman_nomi}
                </td>
                {role !== 'respublika' && <td className="table-cell">{r.nomi}</td>}
                <td className="table-cell">
                  {r.targibot_soni > 0
                    ? <span className="badge-blue">{r.targibot_soni}</span>
                    : <span className="text-red-400 font-bold">0</span>}
                </td>
                <td className="table-cell">
                  <span className="badge-red">{r.murojaat_soni}</span>
                </td>
                <td className="table-cell">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${DARAJA_STYLE[r.daraja] || ''}`}>
                    {DARAJA_LABEL[r.daraja] || r.daraja}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">
                ✅ Murojaat yo'q yoki barcha hududlar nazorat ostida
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
