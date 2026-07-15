import { useEffect, useState } from 'react'
import api from '../api'

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
  useEffect(() => { api.get('/dashboard/').then(r=>setData(r.data)) }, [])

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
