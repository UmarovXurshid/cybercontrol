import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

function generateCaptcha() {
  const a = Math.floor(Math.random() * 10) + 1
  const b = Math.floor(Math.random() * 10) + 1
  return { question: `${a} + ${b} = ?`, answer: String(a + b) }
}

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [captcha, setCaptcha] = useState(generateCaptcha)
  const [captchaInput, setCaptchaInput] = useState('')
  const nav = useNavigate()

  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha())
    setCaptchaInput('')
  }, [])

  const submit = async e => {
    e.preventDefault()
    if (captchaInput.trim() !== captcha.answer) {
      toast.error("Captcha noto'g'ri, qayta urinib ko'ring")
      refreshCaptcha()
      return
    }
    setLoading(true)
    try {
      const { data } = await axios.post('/api/token/', form)
      localStorage.setItem('token', data.access)

      // JWT payload'dan role va viloyat_id olish
      const payload = JSON.parse(atob(data.access.split('.')[1]))
      localStorage.setItem('role', payload.role || '')
      localStorage.setItem('viloyat_id', payload.viloyat_id != null ? String(payload.viloyat_id) : '')

      if (payload.role === 'respublika') {
        nav('/respublika')
      } else {
        nav('/')
      }
    } catch {
      toast.error("Login yoki parol noto'g'ri")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4f46e5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Kirish</h2>
            <p className="text-gray-500 text-sm mt-1">Boshqaruv tizimiga xush kelibsiz</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Login</label>
              <input className="input-field" placeholder="admin"
                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parol</label>
              <input type="password" className="input-field" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Captcha: <span className="font-bold text-indigo-600">{captcha.question}</span>
              </label>
              <div className="flex gap-2">
                <input
                  className="input-field flex-1"
                  placeholder="Javobni kiriting"
                  value={captchaInput}
                  onChange={e => setCaptchaInput(e.target.value)}
                  required
                />
                <button type="button" onClick={refreshCaptcha}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 transition-colors text-lg"
                  title="Yangilash">↻</button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold
                         transition-colors duration-150 disabled:opacity-50 mt-2">
              {loading ? 'Kirilmoqda...' : 'Kirish'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
