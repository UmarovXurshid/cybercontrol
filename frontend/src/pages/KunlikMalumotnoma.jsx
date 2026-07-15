import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import DateFilter from '../components/DateFilter'

const today = new Date().toISOString().slice(0,10)

export default function KunlikMalumotnoma() {
  const [arxivlar, setArxivlar] = useState([])
  const [start, setStart]       = useState(today)
  const [end, setEnd]           = useState(today)
  const [creating, setCreating] = useState(false)

  const loadArxiv = () => api.get('/arxiv/').then(r=>setArxivlar(r.data))
  useEffect(()=>{ loadArxiv() },[])

  const wordHisobot = () =>
    window.open(`/api/word-hisobot/?start=${start}&end=${end}`, '_blank')

  const arxivYaratish = async () => {
    setCreating(true)
    try {
      await api.post('/arxiv/yaratish/', { start, end })
      toast.success('Arxiv fayl yaratildi!')
      loadArxiv()
    } catch { toast.error('Xato!') }
    finally { setCreating(false) }
  }

  const arxivOchir = async (id, nom) => {
    if (!window.confirm(`"${nom}" faylini o'chirasizmi?`)) return
    try {
      await api.delete(`/arxiv/${id}/`)
      toast.success('O\'chirildi')
      loadArxiv()
    } catch { toast.error('Xato!') }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Kunlik ma'lumotnoma</h1>

      {/* Hisobot generator */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">📄 Hisobot yaratish</h2>
        <DateFilter start={start} end={end} onStart={setStart} onEnd={setEnd}
          onSearch={()=>{}} onReset={()=>{setStart(today);setEnd(today)}}>
          <button onClick={wordHisobot} className="btn-primary">
            📄 Word hisobot
          </button>
          <button onClick={arxivYaratish} disabled={creating} className="btn-secondary">
            {creating ? '⏳' : '📦'} Arxivga saqlash
          </button>
        </DateFilter>
      </div>

      {/* Arxiv list */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">
          📁 Arxiv fayllar
          <span className="ml-2 text-sm font-normal text-gray-400">({arxivlar.length})</span>
        </h2>

        {arxivlar.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">📂</p>
            <p>Arxiv fayllar yo'q</p>
          </div>
        ) : (
          <div className="space-y-2">
            {arxivlar.map(f=>(
              <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{f.nomi}</p>
                    <p className="text-xs text-gray-400">{f.yaratilgan_vaqt?.slice(0,16)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={`/api/arxiv/${f.id}/yuklab-olish/`} target="_blank" rel="noreferrer"
                    className="text-xs px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors">
                    ⬇️ Yuklab olish
                  </a>
                  <button onClick={()=>arxivOchir(f.id, f.nomi)}
                    className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors">
                    🗑 O'chirish
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
