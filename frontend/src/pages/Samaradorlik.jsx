import { useEffect, useState } from 'react'
import api from '../api'
import DateFilter from '../components/DateFilter'

const today      = new Date().toISOString().slice(0,10)
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)

export default function Samaradorlik() {
  const [data, setData]   = useState(null)
  const [start, setStart] = useState(monthStart)
  const [end, setEnd]     = useState(today)
  const role = localStorage.getItem('role')

  const load = (s=start, e=end) =>
    api.get(`/samaradorlik/?start=${s}&end=${e}`).then(r => setData(r.data))

  useEffect(() => { load() }, [])

  const rows = data?.rows || []
  const totalTargibot  = rows.reduce((s,r) => s + r.targibot_soni, 0)
  const totalQatnash   = rows.reduce((s,r) => s + r.qatnashchilar, 0)
  const totalMurojaat  = rows.reduce((s,r) => s + r.murojaat_soni, 0)

  const darajaColor = (nisbat) => {
    if (nisbat === null) return 'text-gray-400'
    if (nisbat >= 0.5)  return 'text-red-600 font-bold'
    if (nisbat >= 0.1)  return 'text-yellow-600 font-semibold'
    return 'text-emerald-600'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Samaradorlik hisoboti</h1>
        <p className="text-sm text-gray-500">
          {role === 'respublika' ? 'Viloyatlar kesimida' : 'Mahallalar kesimida'}
        </p>
      </div>

      <DateFilter start={start} end={end} onStart={setStart} onEnd={setEnd}
        onSearch={() => load()} onReset={() => { setStart(monthStart); setEnd(today); load(monthStart, today) }}/>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card border-l-4 border-blue-500">
          <div className="text-3xl">📢</div>
          <div>
            <p className="text-2xl font-bold">{totalTargibot.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Jami targ'ibotlar</p>
          </div>
        </div>
        <div className="stat-card border-l-4 border-emerald-500">
          <div className="text-3xl">👥</div>
          <div>
            <p className="text-2xl font-bold">{totalQatnash.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Jami qatnashchilar</p>
          </div>
        </div>
        <div className="stat-card border-l-4 border-red-500">
          <div className="text-3xl">🚨</div>
          <div>
            <p className="text-2xl font-bold">{totalMurojaat.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Jami murojaatlar</p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="px-4 py-3 bg-gray-50 border-b text-xs text-gray-500">
          💡 <b>Nisbat</b> = murojaat / targ'ibot. Qanchalik past bo'lsa, shuncha yaxshi.
        </div>
        <table className="w-full">
          <thead><tr>
            {['#',
              role === 'respublika' ? 'Viloyat' : 'Tuman',
              role !== 'respublika' ? 'Mahalla' : '',
              "Targ'ibot soni", 'Qatnashchilar', 'Murojaat soni', 'Nisbat'
            ].filter(Boolean).map(h => (
              <th key={h} className="table-header text-left">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="table-cell text-gray-400">{i+1}</td>
                <td className="table-cell font-medium">{r.nomi || r.tuman_nomi}</td>
                {role !== 'respublika' && <td className="table-cell text-sm">{r.tuman_nomi && r.nomi ? r.nomi : ''}</td>}
                <td className="table-cell">
                  <span className="badge-blue">{r.targibot_soni}</span>
                </td>
                <td className="table-cell">{r.qatnashchilar.toLocaleString()}</td>
                <td className="table-cell">
                  {r.murojaat_soni > 0
                    ? <span className="badge-red">{r.murojaat_soni}</span>
                    : <span className="text-gray-400">0</span>}
                </td>
                <td className={`table-cell ${darajaColor(r.nisbat)}`}>
                  {r.nisbat === null ? '—' : r.nisbat.toFixed(3)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Ma'lumot topilmadi</td></tr>
            )}
            {rows.length > 0 && (
              <tr className="bg-gray-100 font-semibold">
                <td className="table-cell" colSpan={role === 'respublika' ? 2 : 3}>Jami</td>
                <td className="table-cell"><span className="badge-blue">{totalTargibot}</span></td>
                <td className="table-cell">{totalQatnash.toLocaleString()}</td>
                <td className="table-cell">{totalMurojaat}</td>
                <td className="table-cell text-gray-500">
                  {totalTargibot > 0 ? (totalMurojaat / totalTargibot).toFixed(3) : '—'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
