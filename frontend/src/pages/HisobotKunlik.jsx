import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import DateFilter from '../components/DateFilter'

const today = new Date().toISOString().slice(0,10)
const KUNLAR = ['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba']

/* ─── Xavfsiz va Sog'lom Yurt jadval ──────────────────────────────────────── */

// 1-jadval: Uchrashuvlar + Qatnashchilar
const J1 = [
  {
    label: "O'tkazilgan uchrashuvlar soni", th: 'bg-blue-800', span: 10,
    cols: [
      { key: 'j',           label: 'JAMI' },
      { key: 'mfy',         label: 'MFY' },
      { key: 'oliy',        label: "Oliy ta'lim" },
      { key: 'litsey',      label: 'Litsey' },
      { key: 'orta',        label: "Maktab" },
      { key: 'maktabgacha', label: 'Maktabgacha' },
      { key: 'kasalxona',   label: 'Kasalxona' },
      { key: 'bozor',       label: 'Bozor' },
      { key: 'hmqo',        label: 'HMQO' },
      { key: 'boshqa',      label: 'Boshqa' },
    ]
  },
  {
    label: "Qatnashchilar soni", th: 'bg-green-800', span: 5,
    cols: [
      { key: 'fuk',    label: 'Jami' },
      { key: 'off18g', label: 'Offline 18 yoshgacha' },
      { key: 'off18k', label: 'Offline 18 yoshdan katta' },
      { key: 'onl18g', label: 'Online 18 yoshgacha' },
      { key: 'onl18k', label: 'Online 18 yoshdan katta' },
    ]
  },
]

// 2-jadval: OAV + Materiallar + Suhbatlar
const J2 = [
  {
    label: "OAV chiqishlari soni", th: 'bg-indigo-800', span: 6,
    cols: [
      { key: 'oav',      label: 'Jami' },
      { key: 'tv',       label: 'TV' },
      { key: 'radio',    label: 'Radio' },
      { key: 'gazeta',   label: 'Gazeta' },
      { key: 'jurnal',   label: 'Jurnal' },
      { key: 'internet', label: 'Internet' },
    ]
  },
  {
    label: "Tarqatilgan materiallar", th: 'bg-orange-700', span: 5,
    cols: [
      { key: 'video',      label: 'Video kontent' },
      { key: 'banner',     label: 'Banner' },
      { key: 'flayer',     label: 'Flayer' },
      { key: 'buklet',     label: 'Buklet' },
      { key: 'mat_boshqa', label: 'Boshqa' },
    ]
  },
  {
    label: "Suhbatlar", th: 'bg-purple-800', span: 1,
    cols: [
      { key: 'suhbat', label: 'Soni' },
    ]
  },
]

const ALL_GROUPS = [...J1, ...J2]
const ALL_COLS   = ALL_GROUPS.flatMap(g => g.cols)

function cell(r, key, suffix = '_bir_kun') {
  const v = r[key + suffix] || 0
  return v
}
function sum(rows, key, suffix = '_bir_kun') {
  return rows.reduce((s, r) => s + (r[key + suffix] || 0), 0)
}

function XavfsizYurtTab() {
  const [sana, setSana]       = useState(today)
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded]   = useState(false)
  const [mode, setMode]       = useState('bk')   // 'bk' = bir kunda, 'oy' = oy boshidan

  const load = async (s = sana) => {
    setLoading(true)
    try {
      const res = await api.get(`/xavfsiz-yurt/?format=json&sana=${s}`)
      setRows(res.data.rows || [])
      setLoaded(true)
    } catch { toast.error("Ma'lumot yuklashda xato!") }
    finally { setLoading(false) }
  }

  const downloadExcel = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/xavfsiz-yurt/?sana=${sana}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url
      a.download = `xavfsiz_soghlom_yurt_${sana}.xlsx`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Excel yuklab olishda xato!') }
    finally { setLoading(false) }
  }

  const sfx = mode === 'bk' ? '_bir_kun' : '_oy'

  const thBase = 'px-2 py-1 text-white text-center text-xs font-semibold border border-white/20'
  const tdBase = 'px-2 py-1 text-center text-xs border-r border-gray-100'

  return (
    <div>
      {/* ── Filter qatori ── */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Sana</label>
          <input type="date" value={sana} onChange={e => setSana(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
        </div>
        <button onClick={() => load(sana)} disabled={loading}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors">
          {loading ? '⏳' : '🔍'} Ko'rish
        </button>
        <button onClick={downloadExcel} disabled={loading}
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors">
          ⬇️ Excel yuklab olish
        </button>
        <button onClick={async () => {
          setLoading(true)
          try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/xavfsiz-yurt-template/?sana=${sana}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) throw new Error()
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url
            a.download = `xavfsiz_yurt_rasmiy_${sana}.xlsx`; a.click()
            URL.revokeObjectURL(url)
          } catch { toast.error('Yuklab olishda xato!') }
          finally { setLoading(false) }
        }} disabled={loading}
          className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors">
          📋 Rasmiy jadval (template)
        </button>

        {loaded && (
          <div className="flex rounded-lg overflow-hidden border border-gray-300 ml-2">
            <button onClick={() => setMode('bk')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${mode==='bk' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              Bir kunda
            </button>
            <button onClick={() => setMode('oy')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-gray-300 ${mode==='oy' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              Oy boshidan
            </button>
          </div>
        )}
      </div>

      {/* ── Jadval ── */}
      {!loaded && !loading && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📊</div>
          <p className="text-base">Sana tanlang va <strong>Ko'rish</strong> tugmasini bosing</p>
        </div>
      )}
      {loading && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3 animate-spin">⏳</div>
          <p>Yuklanmoqda...</p>
        </div>
      )}

      {loaded && !loading && (
        <>
          {/* ── 1-JADVAL ── */}
          <div className="mb-1">
            <div className="text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1 rounded-t-lg w-fit">
              1-jadval: Uchrashuvlar va qatnashchilar
            </div>
          </div>
          <div className="overflow-auto rounded-lg rounded-tl-none border border-gray-200 shadow-sm mb-6">
            <table className="text-xs whitespace-nowrap border-collapse w-full">
              <thead>
                <tr>
                  <th rowSpan={2} className="px-3 py-2 bg-gray-900 text-white text-center sticky left-0 z-10 min-w-[30px] border border-gray-700">
                    №
                  </th>
                  <th rowSpan={2} className="px-3 py-2 bg-gray-900 text-white text-left sticky left-0 z-10 min-w-[130px] border border-gray-700">
                    Viloyat
                  </th>
                  {J1.map(g => (
                    <th key={g.label} colSpan={g.span}
                      className={`${thBase} ${g.th}`}>
                      {g.label}
                    </th>
                  ))}
                </tr>
                <tr>
                  {J1.flatMap(g => g.cols.map(c => (
                    <th key={c.key} className="px-2 py-1 bg-gray-100 text-gray-700 text-center text-xs font-medium border border-gray-200 max-w-[60px] leading-tight">
                      {c.label}
                    </th>
                  )))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 hover:bg-blue-50'}>
                    <td className="px-2 py-1.5 text-center text-gray-400 border-r border-gray-200 sticky left-0 bg-inherit">{i+1}</td>
                    <td className="px-3 py-1.5 font-semibold text-gray-800 sticky left-0 bg-inherit border-r-2 border-gray-300 max-w-[130px] truncate">
                      {r.viloyat}
                    </td>
                    {J1.flatMap(g => g.cols.map(c => {
                      const v = cell(r, c.key, sfx)
                      return (
                        <td key={c.key} className={tdBase}>
                          {v > 0 ? <b className="text-blue-900">{v.toLocaleString()}</b> : <span className="text-gray-200">—</span>}
                        </td>
                      )
                    }))}
                  </tr>
                ))}
                <tr className="bg-gray-900 text-white font-bold">
                  <td className="px-2 py-2 text-center sticky left-0 bg-gray-900 border-r border-gray-700" colSpan={2}>JAMI</td>
                  {J1.flatMap(g => g.cols.map(c => {
                    const v = sum(rows, c.key, sfx)
                    return (
                      <td key={c.key} className="px-2 py-2 text-center text-yellow-300 border-r border-gray-700">
                        {v > 0 ? v.toLocaleString() : '—'}
                      </td>
                    )
                  }))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── 2-JADVAL ── */}
          <div className="mb-1">
            <div className="text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-t-lg w-fit">
              2-jadval: OAV, materiallar va suhbatlar
            </div>
          </div>
          <div className="overflow-auto rounded-lg rounded-tl-none border border-gray-200 shadow-sm mb-4">
            <table className="text-xs whitespace-nowrap border-collapse w-full">
              <thead>
                <tr>
                  <th rowSpan={2} className="px-3 py-2 bg-gray-900 text-white text-center sticky left-0 z-10 min-w-[30px] border border-gray-700">
                    №
                  </th>
                  <th rowSpan={2} className="px-3 py-2 bg-gray-900 text-white text-left sticky left-0 z-10 min-w-[130px] border border-gray-700">
                    Viloyat
                  </th>
                  {J2.map(g => (
                    <th key={g.label} colSpan={g.span}
                      className={`${thBase} ${g.th}`}>
                      {g.label}
                    </th>
                  ))}
                </tr>
                <tr>
                  {J2.flatMap(g => g.cols.map(c => (
                    <th key={c.key} className="px-2 py-1 bg-gray-100 text-gray-700 text-center text-xs font-medium border border-gray-200 max-w-[70px] leading-tight">
                      {c.label}
                    </th>
                  )))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white hover:bg-indigo-50' : 'bg-gray-50 hover:bg-indigo-50'}>
                    <td className="px-2 py-1.5 text-center text-gray-400 border-r border-gray-200 sticky left-0 bg-inherit">{i+1}</td>
                    <td className="px-3 py-1.5 font-semibold text-gray-800 sticky left-0 bg-inherit border-r-2 border-gray-300 max-w-[130px] truncate">
                      {r.viloyat}
                    </td>
                    {J2.flatMap(g => g.cols.map(c => {
                      const v = cell(r, c.key, sfx)
                      return (
                        <td key={c.key} className={tdBase}>
                          {v > 0 ? <b className="text-indigo-900">{v.toLocaleString()}</b> : <span className="text-gray-200">—</span>}
                        </td>
                      )
                    }))}
                  </tr>
                ))}
                <tr className="bg-gray-900 text-white font-bold">
                  <td className="px-2 py-2 text-center sticky left-0 bg-gray-900 border-r border-gray-700" colSpan={2}>JAMI</td>
                  {J2.flatMap(g => g.cols.map(c => {
                    const v = sum(rows, c.key, sfx)
                    return (
                      <td key={c.key} className="px-2 py-2 text-center text-yellow-300 border-r border-gray-700">
                        {v > 0 ? v.toLocaleString() : '—'}
                      </td>
                    )
                  }))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-xs text-gray-400 mt-2">
            Ko'rsatilmoqda: <b className="text-blue-700">{mode === 'bk' ? sana + ' (bir kunda)' : sana.slice(0,7) + '-01 dan ' + sana + ' gacha (oy boshidan)'}</b>
            {' · '}Oy boshidan to'liq Excel orqali yuklab olinadi.
          </div>
        </>
      )}
    </div>
  )
}

export default function HisobotKunlik() {
  const [tab, setTab]         = useState('kunlik')
  const [list, setList]       = useState([])
  const [start, setStart]     = useState(today)
  const [end, setEnd]         = useState(today)
  const [sending, setSending] = useState(false)

  const load = (s=start, e=end) =>
    api.get(`/hisobot-kunlik/?start=${s}&end=${e}`).then(r=>setList(r.data))

  useEffect(()=>{ load() },[])

  const sendWarning = async () => {
    setSending(true)
    try {
      await api.get(`/hisobot-kunlik/?start=${start}&end=${end}&warning=1`)
      toast.success('Ogohlantirish yuborildi!')
      load()
    } catch { toast.error('Xato!') }
    finally { setSending(false) }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Kunlik hisobot
        <span className="ml-2 text-sm font-normal text-gray-400">(Bugun: {KUNLAR[new Date().getDay()]})</span>
      </h1>

      {/* Tablar */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        <button onClick={() => setTab('kunlik')}
          className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors
            ${tab==='kunlik' ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          📋 Kunlik hisobot
        </button>
        <button onClick={() => setTab('xavfsiz')}
          className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors
            ${tab==='xavfsiz' ? 'border-green-600 text-green-700 bg-green-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          📊 Xavfsiz va Sog'lom Yurt
        </button>
      </div>

      {/* ── Tab 1: Kunlik hisobot ── */}
      {tab === 'kunlik' && (
        <>
          <DateFilter start={start} end={end} onStart={setStart} onEnd={setEnd}
            onSearch={()=>load()} onReset={()=>{setStart(today);setEnd(today);load(today,today)}}>
            <button onClick={sendWarning} disabled={sending}
              className="btn-primary bg-orange-500 hover:bg-orange-600">
              {sending ? '⏳' : '⚠️'} Ogohlantirish yuborish
            </button>
          </DateFilter>

          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <thead><tr>
                {['#','Mahalla','Tuman','Inspektor','Offline','Online','Jami fuk.','Holat','Ogohlantirish'].map(h=>(
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {list.map((r,i)=>(
                  <tr key={i} className={`hover:bg-gray-50 ${!r.yuborilgan ? 'bg-red-50' : ''}`}>
                    <td className="table-cell text-gray-400">{i+1}</td>
                    <td className="table-cell font-medium">{r.mahalla_nomi}</td>
                    <td className="table-cell text-xs text-gray-500">{r.tuman_nomi}</td>
                    <td className="table-cell text-xs">{r.inspektor_fio}</td>
                    <td className="table-cell">
                      {r.offline_soni > 0 ? <span className="badge-blue">{r.offline_soni}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="table-cell">
                      {r.online_soni > 0 ? <span className="badge-green">{r.online_soni}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="table-cell font-semibold">
                      {(r.offline_qatnashchi||0) + (r.online_qatnashchi||0)}
                    </td>
                    <td className="table-cell">
                      {r.yuborilgan
                        ? <span className="badge-green">✅ Yuborilgan</span>
                        : <span className="badge-red">❌ Yuborilmagan</span>}
                    </td>
                    <td className="table-cell">
                      {r.ogohlantirish_yuborildi
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">⛔ Ogohlandi</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
                {list.length===0 && (
                  <tr><td colSpan={9} className="text-center py-10 text-gray-400">Ma'lumot topilmadi</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {list.length > 0 && (
            <div className="mt-4 flex gap-4 text-sm text-gray-500">
              <span>✅ Yuborilgan: <strong className="text-emerald-600">{list.filter(r=>r.yuborilgan).length}</strong></span>
              <span>❌ Yuborilmagan: <strong className="text-red-500">{list.filter(r=>!r.yuborilgan).length}</strong></span>
              <span>⛔ Ogohlandi: <strong className="text-orange-600">{list.filter(r=>r.ogohlantirish_yuborildi).length}</strong></span>
            </div>
          )}
        </>
      )}

      {/* ── Tab 2: Xavfsiz va Sog'lom Yurt ── */}
      {tab === 'xavfsiz' && <XavfsizYurtTab />}
    </div>
  )
}
