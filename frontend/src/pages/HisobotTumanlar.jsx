import { useEffect, useState } from 'react'
import api from '../api'
import DateFilter from '../components/DateFilter'

const today = new Date().toISOString().slice(0,10)
const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000).toISOString().slice(0,10)

function excelDownload(url, filename) {
  const token = localStorage.getItem('token')
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.blob())
    .then(blob => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
    })
}

export default function HisobotTumanlar() {
  const [list, setList]   = useState([])
  const [start, setStart] = useState(thirtyDaysAgo)
  const [end, setEnd]     = useState(thirtyDaysAgo)

  const load = (s=start, e=end) =>
    api.get(`/hisobot-tumanlar/?start=${s}&end=${e}`).then(r=>setList(r.data))

  useEffect(()=>{ load() },[])

  const totalOffline  = list.reduce((s,r)=>s+Number(r.offline_targibot_soni||0), 0)
  const totalOnline   = list.reduce((s,r)=>s+Number(r.online_targibot_soni||0), 0)
  const totalFuqaro   = list.reduce((s,r)=>s+Number(r.jami_fuqarolar||0), 0)
  const totalMahalla  = list.reduce((s,r)=>s+Number(r.mahalla_soni||0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hisobot (tumanlar bo'yicha)</h1>
        {list.length > 0 && (
          <button onClick={() => excelDownload(`/api/hisobot-tumanlar/?start=${start}&end=${end}&excel=1`,
            `hisobot_tumanlar_${start}_${end}.xlsx`)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            📥 Excel yuklab olish
          </button>
        )}
      </div>

      <DateFilter start={start} end={end} onStart={setStart} onEnd={setEnd}
        onSearch={()=>load()} onReset={()=>{setStart(today);setEnd(today);load(today,today)}}/>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label:'Tumanlar', value:list.length, icon:'🏙', color:'border-indigo-500' },
          { label:'Faol mahallalar', value:totalMahalla, icon:'🏘', color:'border-yellow-500' },
          { label:'Offline targ.', value:totalOffline, icon:'📢', color:'border-blue-500' },
          { label:'Online targ.', value:totalOnline, icon:'🌐', color:'border-emerald-500' },
        ].map(c=>(
          <div key={c.label} className={`stat-card border-l-4 ${c.color}`}>
            <div className="text-2xl">{c.icon}</div>
            <div>
              <p className="text-xl font-bold text-gray-900">{c.value}</p>
              <p className="text-xs text-gray-500">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead><tr>
            {['#','Tuman','Mahallalar','Offline targ.','Offline fuk.','Online targ.','Online fuk.','Jami'].map(h=>(
              <th key={h} className="table-header text-left">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {list.map((r,i)=>(
              <tr key={i} className="hover:bg-gray-50">
                <td className="table-cell text-gray-400">{i+1}</td>
                <td className="table-cell font-semibold">{r.tuman_nomi}</td>
                <td className="table-cell">
                  <span className="badge-yellow">{r.mahalla_soni||0} ta</span>
                </td>
                <td className="table-cell">
                  <span className="badge-blue">{r.offline_targibot_soni||0}</span>
                </td>
                <td className="table-cell text-sm">{r.offline_qatnashchilar||0}</td>
                <td className="table-cell">
                  <span className="badge-green">{r.online_targibot_soni||0}</span>
                </td>
                <td className="table-cell text-sm">{r.online_qatnashchilar||0}</td>
                <td className="table-cell font-bold text-gray-900">{r.jami_fuqarolar||0}</td>
              </tr>
            ))}
            {list.length===0 && <tr><td colSpan={8} className="text-center py-10 text-gray-400">Ma'lumot topilmadi</td></tr>}
            {list.length>0 && (
              <tr className="bg-gray-100 font-semibold">
                <td className="table-cell" colSpan={2}>Jami ({list.length} tuman)</td>
                <td className="table-cell"><span className="badge-yellow">{totalMahalla} ta</span></td>
                <td className="table-cell"><span className="badge-blue">{totalOffline}</span></td>
                <td className="table-cell">{list.reduce((s,r)=>s+Number(r.offline_qatnashchilar||0),0)}</td>
                <td className="table-cell"><span className="badge-green">{totalOnline}</span></td>
                <td className="table-cell">{list.reduce((s,r)=>s+Number(r.online_qatnashchilar||0),0)}</td>
                <td className="table-cell font-bold">{totalFuqaro}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
