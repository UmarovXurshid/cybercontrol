import { useState, useEffect, useMemo } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts'

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString().slice(0, 10)

const COLORS = ['#1e3a5f','#2e6da4','#3c8dbc','#4caf50','#ff9800','#e53935',
                '#8e24aa','#00897b','#f06292','#fdd835','#546e7a','#26a69a',
                '#ab47bc','#42a5f5']

const DARAJA_STYLE = {
  0: { bg: 'bg-gray-200', text: 'font-bold text-gray-900', indent: '' },
  1: { bg: 'bg-green-700', text: 'font-semibold text-white', indent: 'pl-4' },
  2: { bg: 'bg-white',     text: 'text-gray-800', indent: 'pl-8' },
  3: { bg: 'bg-gray-50',   text: 'text-gray-600 italic', indent: 'pl-12' },
}

export default function RespublikaMurojaatHisobot() {
  const [start,  setStart]  = useState(firstOfMonth)
  const [end,    setEnd]    = useState(today)
  const [data,   setData]   = useState(null)
  const [loading,setLoading]= useState(false)
  const [tab,    setTab]    = useState('table') // table | chart

  const load = async (s = start, e = end) => {
    setLoading(true)
    try {
      const { data: d } = await api.get(`/murojaat/hisobot/?start=${s}&end=${e}`)
      setData(d)
    } catch { toast.error('Yuklab bo\'lmadi') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const exportExcel = async () => {
    const token = localStorage.getItem('token')
    const url = `/api/murojaat/hisobot/excel/?start=${start}&end=${end}`
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) { toast.error('Excel yuklab olinmadi'); return }
      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `murojaat_hisobot_${start}_${end}.xlsx`
      link.click()
    } catch { toast.error('Xatolik yuz berdi') }
  }

  // Chart uchun ma'lumot — asosiy kategoriyalar jami
  const chartData = useMemo(() => {
    if (!data) return []
    const ijtimoiy = data.rows.filter(r =>
      !r.section && r.tartib && r.daraja === 1 &&
      !isNaN(Number(r.tartib)) && Number(r.tartib) <= 9
    )
    return ijtimoiy.map(r => ({
      name: r.nomi.length > 20 ? r.nomi.slice(0, 20) + '…' : r.nomi,
      fullName: r.nomi,
      jami: r.jami?.total || 0
    })).filter(d => d.jami > 0)
  }, [data])

  const viloyatChartData = useMemo(() => {
    if (!data) return []
    const jamiRow = data.rows.find(r => r.tartib === 'ЖАМИ' && !r.section)
    if (!jamiRow) return []
    return data.viloyatlar.map(v => ({
      name: v.nomi.replace(' viloyati', '').replace(' viloayti', ''),
      jami: jamiRow.jami?.[v.id] || 0
    })).filter(d => d.jami > 0)
  }, [data])

  const usulChartData = useMemo(() => {
    if (!data) return []
    let inUsul = false
    return data.rows
      .filter(r => {
        if (r.section === 'СОДИР ЭТИШ УСУЛИГА КЎРА') { inUsul = true; return false }
        if (r.section) { inUsul = false; return false }
        return inUsul && r.daraja === 1 && r.tartib !== 'ЖАМИ'
      })
      .map(r => ({ name: r.nomi.slice(0, 25) + (r.nomi.length > 25 ? '…' : ''), jami: r.jami?.total || 0 }))
      .filter(d => d.jami > 0)
      .slice(0, 10)
  }, [data])

  const viloyatlar = data?.viloyatlar || []

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Murojaatlar hisoboti</h1>

      {/* ── Filter ── */}
      <div className="card mb-4 flex items-end gap-4 flex-wrap">
        <div>
          <label className="form-label">Boshlanish</label>
          <input type="date" value={start} onChange={e => setStart(e.target.value)} className="input-field w-40"/>
        </div>
        <div>
          <label className="form-label">Oxiri</label>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="input-field w-40"/>
        </div>
        <button onClick={() => load(start, end)} className="btn-primary">🔍 Ko'rsatish</button>
        <button onClick={exportExcel}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium flex items-center gap-2">
          📥 Excel yuklab olish
        </button>
      </div>

      {loading && <div className="text-center py-20 text-gray-400">Yuklanmoqda...</div>}

      {data && !loading && (
        <>
          {/* ── Statistika kartochkalari ── */}
          {(() => {
            const jamiRow = data.rows.find(r => r.tartib === 'ЖАМИ' && !r.section)
            const total   = jamiRow?.jami?.total || 0
            const bugun   = jamiRow?.bugun?.total || 0
            const erkakRow = data.rows.find(r => r.nomi === 'ЭРКАК')
            const ayolRow  = data.rows.find(r => r.nomi === 'АЁЛ')
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Jami murojaatlar', val: total, color: 'bg-indigo-600' },
                  { label: 'Bugungi kun', val: bugun, color: 'bg-blue-500' },
                  { label: 'Erkak', val: erkakRow?.jami?.total || 0, color: 'bg-teal-600' },
                  { label: 'Ayol', val: ayolRow?.jami?.total || 0, color: 'bg-pink-500' },
                ].map(({ label, val, color }) => (
                  <div key={label} className={`${color} text-white rounded-2xl p-5`}>
                    <div className="text-3xl font-bold">{val}</div>
                    <div className="text-sm mt-1 opacity-90">{label}</div>
                  </div>
                ))}
              </div>
            )
          })()}

          {/* ── Tab ── */}
          <div className="flex gap-2 mb-4">
            {[['table','📋 Jadval'],['chart','📊 Grafiklar']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  tab === key ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* ── JADVAL ── */}
          {tab === 'table' && (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr style={{ background: '#1F4E79' }}>
                      <th className="sticky left-0 z-10 px-2 py-3 text-white text-center font-semibold border border-blue-900 w-10"
                          style={{ background: '#1F4E79' }}>№</th>
                      <th className="sticky left-10 z-10 px-3 py-3 text-white text-left font-semibold border border-blue-900 min-w-[300px]"
                          style={{ background: '#1F4E79' }}>Кўрсаткичлар</th>
                      <th className="px-2 py-3 text-white text-center font-semibold border border-blue-900 w-14">ЖАМИ</th>
                      {viloyatlar.map(v => (
                        <th key={v.id}
                          className="px-2 py-3 text-white text-center font-semibold border border-blue-900 min-w-[90px]">
                          {v.nomi.replace(' viloyati','').replace(' viloayti','')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, i) => {
                      // SECTION sarlavhasi
                      if (row.section) return (
                        <tr key={i}>
                          <td colSpan={3 + viloyatlar.length}
                            className="px-3 py-2 text-center font-bold text-white text-xs border"
                            style={{ background: '#1F4E79', fontSize: '11px' }}>
                            {row.section}
                          </td>
                        </tr>
                      )

                      const d  = row.daraja || 0
                      const bg = d === 0 ? '#D9D9D9' : d === 1 ? '#375623' : d === 2 ? '#DEEAF1' : '#F9F9F9'
                      const fg = d === 1 ? '#fff' : '#000'
                      const fw = d <= 1 ? '600' : '400'
                      const bBg = d === 0 ? '#EBEBEB' : d === 1 ? '#E2EFDA' : d === 2 ? '#EAF4FB' : '#F2F2F2'

                      return (
                        <>
                          {/* Asosiy qator — Жами */}
                          <tr key={`${i}m`} style={{ background: bg }}>
                            <td className="sticky left-0 z-10 px-1 py-1.5 text-center border border-gray-300"
                                style={{ background: bg, color: fg, fontWeight: fw, minWidth: '40px' }}>
                              {row.tartib}
                            </td>
                            <td className="sticky left-10 z-10 px-2 py-1.5 border border-gray-300"
                                style={{ background: bg, color: fg, fontWeight: fw }}>
                              {row.nomi}
                            </td>
                            <td className="px-2 py-1.5 text-center border border-gray-300"
                                style={{ background: bg, color: fg, fontWeight: fw }}>
                              {row.jami?.total || ''}
                            </td>
                            {viloyatlar.map(v => (
                              <td key={v.id} className="px-2 py-1.5 text-center border border-gray-300"
                                  style={{ color: fg }}>
                                {row.jami?.[v.id] || ''}
                              </td>
                            ))}
                          </tr>
                        </>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── GRAFIKLAR ── */}
          {tab === 'chart' && (
            <div className="space-y-6">
              {/* Viloyatlar bo'yicha */}
              {viloyatChartData.length > 0 && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Viloyatlar bo'yicha jami murojaatlar</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={viloyatChartData} margin={{ top: 5, right: 20, bottom: 60, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end"/>
                      <YAxis tick={{ fontSize: 10 }}/>
                      <Tooltip/>
                      <Bar dataKey="jami" name="Jami" fill="#1e3a5f" radius={[3,3,0,0]}>
                        {viloyatChartData.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]}/>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Kasblar bo'yicha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {chartData.length > 0 && (
                  <div className="card">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Ijtimoiy holat bo'yicha</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={chartData} dataKey="jami" nameKey="fullName"
                          cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) =>
                            `${(percent * 100).toFixed(0)}%`}>
                          {chartData.map((_, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]}/>
                          ))}
                        </Pie>
                        <Tooltip formatter={(val, name) => [val, name]}/>
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Usullar bo'yicha */}
                {usulChartData.length > 0 && (
                  <div className="card">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Sodir etish usullari (TOP 10)</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={usulChartData} layout="vertical"
                        margin={{ top: 5, right: 20, bottom: 5, left: 150 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false}/>
                        <XAxis type="number" tick={{ fontSize: 9 }}/>
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={145}/>
                        <Tooltip/>
                        <Bar dataKey="jami" name="Jami" fill="#2e6da4" radius={[0,3,3,0]}>
                          {usulChartData.map((_, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]}/>
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Yosh va jinsi */}
              {(() => {
                const erkakRow = data.rows.find(r => r.nomi === 'ЭРКАК')
                const ayolRow  = data.rows.find(r => r.nomi === 'АЁЛ')
                const yoshLabels = ['18 yoshgacha','18-30','31-40','41-50','51-60','61+']
                let inE = false, inA = false
                const erkakYosh = [], ayolYosh = []
                data.rows.forEach(r => {
                  if (r.nomi === 'ЭРКАК') { inE = true; inA = false; return }
                  if (r.nomi === 'АЁЛ')   { inA = true; inE = false; return }
                  if (r.section) { inE = false; inA = false; return }
                  if (inE && r.daraja === 2) erkakYosh.push(r.jami?.total || 0)
                  if (inA && r.daraja === 2) ayolYosh.push(r.jami?.total || 0)
                })
                const yoshData = yoshLabels.map((name, i) => ({
                  name, Erkak: erkakYosh[i] || 0, Ayol: ayolYosh[i] || 0
                }))
                return (
                  <div className="card">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Yosh va jinsi bo'yicha</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={yoshData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }}/>
                        <YAxis tick={{ fontSize: 10 }}/>
                        <Tooltip/>
                        <Legend/>
                        <Bar dataKey="Erkak" fill="#1e3a5f" radius={[3,3,0,0]}/>
                        <Bar dataKey="Ayol"  fill="#e91e8c" radius={[3,3,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )
              })()}
            </div>
          )}
        </>
      )}
    </div>
  )
}
