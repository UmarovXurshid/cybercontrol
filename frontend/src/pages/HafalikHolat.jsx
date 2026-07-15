import { useEffect, useState } from 'react'
import api from '../api'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

export default function HaftalikHolat() {
  const [data, setData]     = useState([])
  const [viloyatlar, setViloyatlar] = useState([])
  const [vid, setVid]       = useState('')
  const role = localStorage.getItem('role')

  const load = (v=vid) => {
    const params = v ? `viloyat=${v}` : ''
    api.get(`/haftalik-holat/?${params}`).then(r => setData(r.data.rows || []))
  }

  useEffect(() => {
    load()
    if (role === 'respublika') {
      api.get('/viloyatlar/').then(r => setViloyatlar(r.data))
    }
  }, [])

  const totalTargibot = data.reduce((s, r) => s + r.targibot_soni, 0)
  const totalMurojaat = data.reduce((s, r) => s + r.murojaat_soni, 0)

  const formatLabel = (hafta_boshlash) => {
    if (!hafta_boshlash) return ''
    const d = new Date(hafta_boshlash)
    return `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}`
  }

  const chartData = data.map(r => ({
    ...r,
    label: formatLabel(r.hafta_boshlash)
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Haftalik holat</h1>
        <p className="text-sm text-gray-500">Oxirgi 12 hafta</p>
      </div>

      {role === 'respublika' && (
        <div className="card mb-6 flex gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Viloyat</label>
            <select value={vid} onChange={e => { setVid(e.target.value); load(e.target.value) }}
              className="input-field py-2 pr-8">
              <option value=''>Barcha viloyatlar</option>
              {viloyatlar.map(v => <option key={v.id} value={v.id}>{v.viloyat_nomi}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card border-l-4 border-blue-500">
          <div className="text-3xl">📢</div>
          <div>
            <p className="text-2xl font-bold">{totalTargibot.toLocaleString()}</p>
            <p className="text-sm text-gray-500">12 haftada targ'ibotlar</p>
          </div>
        </div>
        <div className="stat-card border-l-4 border-emerald-500">
          <div className="text-3xl">👥</div>
          <div>
            <p className="text-2xl font-bold">{data.reduce((s,r)=>s+r.qatnashchilar,0).toLocaleString()}</p>
            <p className="text-sm text-gray-500">Jami qatnashchilar</p>
          </div>
        </div>
        <div className="stat-card border-l-4 border-red-500">
          <div className="text-3xl">🚨</div>
          <div>
            <p className="text-2xl font-bold">{totalMurojaat.toLocaleString()}</p>
            <p className="text-sm text-gray-500">12 haftada murojaatlar</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card mb-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Haftalik targ'ibot va murojaat dinamikasi</h2>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
            <XAxis dataKey="label" tick={{ fontSize: 11 }}/>
            <YAxis yAxisId="left" tick={{ fontSize: 12 }}/>
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }}/>
            <Tooltip
              labelFormatter={(_, payload) => payload?.[0]?.payload?.hafta_boshlash || ''}
              formatter={(val, name) => [val.toLocaleString(), name]}
            />
            <Legend/>
            <Bar yAxisId="left" dataKey="targibot_soni" name="Targ'ibotlar" fill="#6366f1" radius={[4,4,0,0]}/>
            <Bar yAxisId="left" dataKey="qatnashchilar" name="Qatnashchilar" fill="#34d399" radius={[4,4,0,0]}/>
            <Line yAxisId="right" type="monotone" dataKey="murojaat_soni" name="Murojaatlar"
              stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }}/>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead><tr>
            {['Hafta boshi', "Targ'ibotlar", 'Qatnashchilar', 'Murojaatlar'].map(h => (
              <th key={h} className="table-header text-left">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{r.hafta_boshlash}</td>
                <td className="table-cell"><span className="badge-blue">{r.targibot_soni}</span></td>
                <td className="table-cell">{r.qatnashchilar.toLocaleString()}</td>
                <td className="table-cell">
                  {r.murojaat_soni > 0
                    ? <span className="badge-red">{r.murojaat_soni}</span>
                    : <span className="text-gray-400">0</span>}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={4} className="text-center py-10 text-gray-400">Ma'lumot topilmadi</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
