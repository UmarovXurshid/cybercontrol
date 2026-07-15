import { useEffect, useState } from 'react'
import api from '../api'

const today = new Date().toISOString().slice(0, 10)
const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000).toISOString().slice(0, 10)

const AMAL_LABELS = {
  tasdiqlash:         { label: 'Tasdiqlash',        color: 'bg-green-100 text-green-700' },
  rad_etish:          { label: 'Rad etish',          color: 'bg-red-100 text-red-700' },
  mahalla_yaratish:   { label: 'Mahalla yaratish',   color: 'bg-blue-100 text-blue-700' },
  mahalla_tahrirlash: { label: 'Mahalla tahrirlash', color: 'bg-blue-50 text-blue-600' },
  mahalla_ochirish:   { label: "Mahalla o'chirish",  color: 'bg-orange-100 text-orange-700' },
  xabar_yuborish:     { label: 'Xabar yuborish',     color: 'bg-purple-100 text-purple-700' },
  excel_yuklab_olish: { label: 'Excel yuklab olish', color: 'bg-indigo-100 text-indigo-700' },
}

function AmalBadge({ amal }) {
  const info = AMAL_LABELS[amal] || { label: amal, color: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${info.color}`}>
      {info.label}
    </span>
  )
}

export default function AuditLog() {
  const [list, setList]     = useState([])
  const [start, setStart]   = useState(thirtyDaysAgo)
  const [end, setEnd]       = useState(today)
  const [amal, setAmal]     = useState('')
  const [loading, setLoading] = useState(false)

  const load = (s = start, e = end, a = amal) => {
    setLoading(true)
    api.get(`/audit-log/?start=${s}&end=${e}${a ? `&amal=${a}` : ''}`)
      .then(r => setList(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleReset = () => {
    setStart(today); setEnd(today); setAmal('')
    load(today, today, '')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Audit log</h1>

      {/* Filter */}
      <div className="card flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Dan</label>
          <input type="date" className="input-field py-1.5 text-sm" value={start}
            onChange={e => setStart(e.target.value)} max={end}/>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Gacha</label>
          <input type="date" className="input-field py-1.5 text-sm" value={end}
            onChange={e => setEnd(e.target.value)} min={start}/>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Amal turi</label>
          <select className="input-field py-1.5 text-sm" value={amal}
            onChange={e => setAmal(e.target.value)}>
            <option value="">Barchasi</option>
            {Object.entries(AMAL_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <button onClick={() => load()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          🔍 Qidirish
        </button>
        <button onClick={handleReset}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          ↺ Bugun
        </button>
        <span className="text-xs text-gray-400 ml-auto self-end">{list.length} ta yozuv</span>
      </div>

      {/* Jadval */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="py-16 text-center text-gray-400">⏳ Yuklanmoqda...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="table-header text-left w-40">Vaqt</th>
                <th className="table-header text-left w-32">Foydalanuvchi</th>
                <th className="table-header text-left w-24">Rol</th>
                <th className="table-header text-left w-40">Amal</th>
                <th className="table-header text-left">Tavsif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.map(l => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell font-mono text-xs text-gray-500 whitespace-nowrap">
                    {l.vaqt}
                  </td>
                  <td className="table-cell">
                    <div className="font-medium text-gray-900">{l.user}</div>
                    {l.fish && l.fish !== '—' && (
                      <div className="text-xs text-gray-400">{l.fish}</div>
                    )}
                  </td>
                  <td className="table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      l.role === 'respublika' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {l.role === 'respublika' ? 'Respublika' : l.role === 'viloyat' ? 'Viloyat' : l.role}
                    </span>
                  </td>
                  <td className="table-cell">
                    <AmalBadge amal={l.amal}/>
                  </td>
                  <td className="table-cell text-gray-600 text-xs">{l.tavsif}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-400">
                    <p className="text-4xl mb-2">📋</p>
                    <p>Bu sana uchun log yozuvlari topilmadi</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
