import { useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'

export default function XabarYuborish() {
  const [matn, setMatn]     = useState('')
  const [loading, setLoading] = useState(false)
  const [natija, setNatija] = useState(null)

  const yuborish = async e => {
    e.preventDefault()
    if (!matn.trim()) return toast.error('Xabar matni bo\'sh!')
    if (!window.confirm(`Barcha mahalla inspektorlariga xabar yuboriladi. Davom etasizmi?`)) return
    setLoading(true)
    setNatija(null)
    try {
      const { data } = await api.post('/xabar-yuborish/', { matn })
      setNatija(data)
      toast.success(`Xabar yuborildi! ${data.yuborildi} ta inspektor`)
      setMatn('')
    } catch { toast.error('Xato yuz berdi!') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Xabar yuborish</h1>

      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">📨</div>
          <div>
            <h2 className="font-semibold text-gray-800">Telegram xabar</h2>
            <p className="text-xs text-gray-500">Barcha mahalla inspektorlariga Telegram orqali xabar yuboriladi</p>
          </div>
        </div>

        <form onSubmit={yuborish} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Xabar matni</label>
            <textarea
              className="input-field resize-none"
              rows={6}
              placeholder="Xabar matnini kiriting..."
              value={matn}
              onChange={e=>setMatn(e.target.value)}
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Markdown formatlash ishlatish mumkin: **qalin**, _kursiv_
            </p>
          </div>

          {/* Preview */}
          {matn.trim() && (
            <div className="bg-gray-50 rounded-xl p-4 border">
              <p className="text-xs text-gray-400 mb-2 font-medium">📱 Ko'rinish:</p>
              <div className="bg-white rounded-lg p-3 shadow-sm text-sm text-gray-800 whitespace-pre-wrap font-mono">
                {matn}
              </div>
            </div>
          )}

          <button type="submit" disabled={loading || !matn.trim()}
            className="btn-primary w-full justify-center py-3">
            {loading ? '⏳ Yuborilmoqda...' : '📤 Yuborish'}
          </button>
        </form>
      </div>

      {/* Result */}
      {natija && (
        <div className="card bg-emerald-50 border border-emerald-200">
          <h3 className="font-semibold text-emerald-800 mb-3">✅ Natija</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">{natija.yuborildi}</p>
              <p className="text-xs text-gray-500">Muvaffaqiyatli</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-500">{natija.xato||0}</p>
              <p className="text-xs text-gray-500">Xato</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
