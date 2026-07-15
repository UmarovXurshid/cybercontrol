import { useEffect, useState } from 'react'
import api from '../api'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const CUR_YEAR = new Date().getFullYear()

export default function OylikDinamika() {
  const [data, setData]     = useState([])
  const [yil, setYil]       = useState(String(CUR_YEAR))
  const [viloyatlar, setViloyatlar] = useState([])
  const [vid, setVid]       = useState('')
  const role = localStorage.getItem('role')

  const load = (y=yil, v=vid) => {
    const params = `yil=${y}${v ? `&viloyat=${v}` : ''}`
    api.get(`/oylik-dinamika/?${params}`).then(r => setData(r.data.rows || []))
  }

  useEffect(() => {
    load()
    if (role === 'respublika') {
      api.get('/viloyatlar/').then(r => setViloyatlar(r.data))
    }
  }, [])

  const totalTargibot = data.reduce((s, r) => s + r.targibot_soni, 0)
  const totalQatnash  = data.reduce((s, r) => s + r.qatnashchilar, 0)
  const totalMurojaat = data.reduce((s, r) => s + r.murojaat_soni, 0)

  const years = []
  for (let y = CUR_YEAR; y >= CUR_YEAR - 3; y--) years.push(y)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Oylik dinamika</h1>
        <p className="text-sm text-gray-500">{yil}-yil bo'yicha</p>
      </div>

      {/* Filtrlar */}
      <div className="card mb-6 flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Yil</label>
          <select value={yil} onChange={e => { setYil(e.target.value); load(e.target.value, vid) }}
            className="input-field py-2 pr-8">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {role === 'respublika' && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Viloyat</label>
            <select value={vid} onChange={e => { setVid(e.target.value); load(yil, e.target.value) }}
              className="input-field py-2 pr-8">
              <option value=''>Barcha viloyatlar</option>
              {viloyatlar.map(v => <option key={v.id} value={v.id}>{v.viloyat_nomi}</option>)}
            </select>
          </div>
        )}
      </div>

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

      {/* Chart */}
      <div className="card mb-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Targ'ibot vs Murojaat (oylar bo'yicha)</h2>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
            <XAxis dataKey="oy_nomi" tick={{ fontSize: 12 }}/>
            <YAxis yAxisId="left" tick={{ fontSize: 12 }}/>
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }}/>
            <Tooltip/>
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
            {['Oy', "Targ'ibot", 'Qatnashchilar', 'Murojaat'].map(h => (
              <th key={h} className="table-header text-left">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={i} className={`hover:bg-gray-50 ${r.murojaat_soni > 0 && r.targibot_soni === 0 ? 'bg-red-50/40' : ''}`}>
                <td className="table-cell font-medium">{r.oy_nomi}</td>
                <td className="table-cell"><span className="badge-blue">{r.targibot_soni}</span></td>
                <td className="table-cell">{r.qatnashchilar.toLocaleString()}</td>
                <td className="table-cell">
                  {r.murojaat_soni > 0
                    ? <span className="badge-red">{r.murojaat_soni}</span>
                    : <span className="text-gray-400">0</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
