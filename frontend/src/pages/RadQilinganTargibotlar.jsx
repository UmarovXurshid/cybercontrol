import { useEffect, useState } from 'react'
import api from '../api'
import DateFilter from '../components/DateFilter'

const today = new Date().toISOString().slice(0,10)
const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000).toISOString().slice(0,10)

export default function RadQilinganTargibotlar() {
  const [list, setList]   = useState([])
  const [start, setStart] = useState(thirtyDaysAgo)
  const [end, setEnd]     = useState(today)

  const load = (s=start, e=end) =>
    api.get(`/rad-etilgan/?start=${s}&end=${e}`).then(r=>setList(r.data))

  useEffect(()=>{ load() },[])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Rad etilgan targ'ibotlar
        <span className="ml-2 text-base font-normal text-gray-400">({list.length})</span>
      </h1>

      <DateFilter start={start} end={end} onStart={setStart} onEnd={setEnd}
        onSearch={()=>load()} onReset={()=>{setStart(today);setEnd(today);load(today,today)}}/>

      {list.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🚫</p>
          <p>Rad etilgan targ'ibotlar yo'q</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((h,i) => (
            <div key={h.id} className="card border-l-4 border-red-400">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-gray-400 text-sm font-medium">#{i+1}</span>
                    <span className="font-semibold text-gray-900">{h.mahalla_nomi}</span>
                    <span className="text-gray-400 text-sm">{h.tuman_nomi}</span>
                    <span className={`ml-auto ${h.targibot_turi===1 ? 'badge-blue' : 'badge-green'}`}>
                      {h.targibot_turi===1 ? '📢 Offline' : '🌐 Online'}
                    </span>
                    <span className="badge-red">❌ Rad etilgan</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    👤 {h.inspektor_fio} &nbsp;|&nbsp; 📞 {h.inspektor_tel}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    👥 <strong>{h.qatnashchilar_soni}</strong> qatnashchi
                    {h.joy_nomi && <> &nbsp;|&nbsp; 📍 {h.joy_nomi}</>}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">🕐 {h.qushilgan_vaqt?.slice(0,10)}</p>
                </div>
              </div>
              {h.rasmlar?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {h.rasmlar.map(r => (
                    <img key={r.id} src={`/media/images/${r.rasm_url}`}
                      className="h-20 w-20 object-cover rounded-lg border border-red-200 hover:scale-150 transition-transform cursor-zoom-in opacity-75 bg-gray-100"
                      alt="rasm"
                      onError={e => {
                        e.target.onerror = null
                        e.target.src = '/media/placeholder.jpg'
                      }}/>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
