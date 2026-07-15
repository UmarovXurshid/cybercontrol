import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'

export default function RespublikaDashboard() {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [diskData, setDiskData] = useState(null)
  const [compressing, setCompressing] = useState(false)
  const [compressResult, setCompressResult] = useState(null)

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
  }, [])

  const compressImages = async () => {
    if (!window.confirm('Barcha rasmlar siqiladi (hajmi kamayadi). Davom etasizmi?')) return
    setCompressing(true)
    setCompressResult(null)
    try {
      const r = await api.post('/compress-images/', { quality: 70, max_size: 900 })
      setCompressResult(r.data)
      toast.success(`✅ ${r.data.processed} ta rasm siqildi, ${r.data.saved_mb} MB bo'shadi!`)
      loadDashboard()   // disk ko'rsatkichni yangilash
    } catch (err) {
      toast.error('Xato: ' + (err.response?.data?.error || err.message))
    } finally {
      setCompressing(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-400">⏳ Yuklanmoqda...</div>
  if (!data)   return <div className="text-center py-20 text-gray-400">Ma'lumot topilmadi</div>

  const statCards = [
    { label: 'Yangi (tasdiqlanmagan)', value: data.jami_yangi,        color: 'text-amber-600',  bg: 'bg-amber-50' },
    { label: 'Tasdiqlangan',           value: data.jami_tasdiqlangan, color: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'Rad etilgan',            value: data.jami_rad_etilgan,  color: 'text-red-600',    bg: 'bg-red-50' },
    { label: 'Viloyatlar soni',        value: data.viloyatlar.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ]

  // Disk to'lganlik foizi (3GB limit)
  const LIMIT_GB  = 3
  const usedGb    = diskData?.hajm_gb || 0
  const usedPct   = Math.min(Math.round((usedGb / LIMIT_GB) * 100), 100)
  const barColor  = usedPct > 85 ? 'bg-red-500' : usedPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'

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

              {/* Progress bar */}
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${usedPct}%` }}/>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center">
                {[
                  { label: 'Ishlatilgan', val: `${diskData.hajm_mb} MB`, color: 'text-gray-800' },
                  { label: 'Limit',       val: `${LIMIT_GB} GB`,        color: 'text-gray-400' },
                  { label: 'Bo\'sh',      val: `${Math.max(0, (LIMIT_GB * 1024) - diskData.hajm_mb).toFixed(0)} MB`, color: 'text-emerald-600' },
                  { label: 'Rasmlar',     val: diskData.rasm_soni.toLocaleString(), color: 'text-indigo-600' },
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

            {/* Siqish tugmasi */}
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
