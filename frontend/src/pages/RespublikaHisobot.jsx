import { useEffect, useState } from 'react'
import api from '../api'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const CUR_YEAR   = new Date().getFullYear()
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)

const today = new Date().toISOString().slice(0, 10)
const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000).toISOString().slice(0, 10)

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

/* ── Sana filteri ─────────────────────────────────────────────────────────── */
function DateBar({ start, end, onStart, onEnd, onSearch, onReset }) {
  return (
    <div className="card flex flex-wrap items-end gap-3 mb-6">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Dan</label>
        <input type="date" className="input-field py-1.5 text-sm" value={start}
          onChange={e => onStart(e.target.value)} max={end}/>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Gacha</label>
        <input type="date" className="input-field py-1.5 text-sm" value={end}
          onChange={e => onEnd(e.target.value)} min={start}/>
      </div>
      <button onClick={onSearch}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
        🔍 Qidirish
      </button>
      <button onClick={onReset}
        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
        ↺ Bugun
      </button>
    </div>
  )
}

/* ── Jami qator ───────────────────────────────────────────────────────────── */
function TotalRow({ cols, list }) {
  return (
    <tr className="bg-gray-100 font-semibold text-sm">
      <td className="table-cell" colSpan={cols.skip}>Jami ({list.length})</td>
      {cols.sums.map((key, i) => (
        <td key={i} className="table-cell text-right">
          {list.reduce((s, r) => s + Number(r[key] || 0), 0).toLocaleString()}
        </td>
      ))}
    </tr>
  )
}

/* ── Tab 1: Viloyatlar ────────────────────────────────────────────────────── */
function ViloyatlarTab({ start, end, viloyatlar, selViloyat, onSelViloyat }) {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(false)

  const load = (s, e) => {
    setLoading(true)
    api.get(`/hisobot-viloyatlar/?start=${s}&end=${e}`)
      .then(r => setList(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(start, end), [start, end])

  const display = selViloyat
    ? list.filter(r => String(r.id) === String(selViloyat))
    : list

  const totalOffline = display.reduce((s, r) => s + Number(r.offline_targibot_soni || 0), 0)
  const totalOnline  = display.reduce((s, r) => s + Number(r.online_targibot_soni || 0), 0)
  const totalFuqaro  = display.reduce((s, r) => s + Number(r.jami_fuqarolar || 0), 0)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Viloyat:</label>
          <select className="input-field py-1.5 text-sm"
            value={selViloyat} onChange={e => onSelViloyat(e.target.value)}>
            <option value="">— Barcha viloyatlar —</option>
            {viloyatlar.map(v => <option key={v.id} value={v.id}>{v.nomi}</option>)}
          </select>
          {selViloyat && (
            <button onClick={() => onSelViloyat('')}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors">✕ Tozalash</button>
          )}
        </div>
        <button onClick={() => excelDownload(
          `/api/hisobot-viloyatlar/?start=${start}&end=${end}&excel=1`,
          `hisobot_viloyatlar_${start}_${end}.xlsx`)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          📥 Excel yuklab olish
        </button>
      </div>

      {/* Umumiy kartalar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: selViloyat ? 'Viloyat' : 'Viloyatlar', value: display.length, icon: '🗺️', color: 'border-indigo-500' },
          { label: 'Offline targ\'ibotlar', value: totalOffline, icon: '📢', color: 'border-blue-500' },
          { label: 'Online targ\'ibotlar',  value: totalOnline,  icon: '🌐', color: 'border-emerald-500' },
          { label: 'Jami qatnashchilar',    value: totalFuqaro,  icon: '👥', color: 'border-yellow-500' },
        ].map(c => (
          <div key={c.label} className={`stat-card border-l-4 ${c.color}`}>
            <div className="text-2xl">{c.icon}</div>
            <div>
              <p className="text-xl font-bold text-gray-900">{c.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        {loading
          ? <div className="py-16 text-center text-gray-400">⏳ Yuklanmoqda...</div>
          : (
          <table className="w-full">
            <thead>
              <tr>
                {['#','Viloyat','Tumanlar','Mahallalar','Offline targ.','Offline fuk.','Online targ.','Online fuk.','Jami'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {display.map((r, i) => (
                <tr key={r.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onSelViloyat(String(r.id))}>
                  <td className="table-cell text-gray-400">{i + 1}</td>
                  <td className="table-cell font-semibold text-indigo-700">{r.nomi}</td>
                  <td className="table-cell text-center"><span className="badge-yellow">{r.tuman_soni || 0} ta</span></td>
                  <td className="table-cell text-center"><span className="badge-yellow">{r.mahalla_soni || 0} ta</span></td>
                  <td className="table-cell text-right"><span className="badge-blue">{r.offline_targibot_soni || 0}</span></td>
                  <td className="table-cell text-right text-sm">{(r.offline_qatnashchilar || 0).toLocaleString()}</td>
                  <td className="table-cell text-right"><span className="badge-green">{r.online_targibot_soni || 0}</span></td>
                  <td className="table-cell text-right text-sm">{(r.online_qatnashchilar || 0).toLocaleString()}</td>
                  <td className="table-cell text-right font-bold text-gray-900">{(r.jami_fuqarolar || 0).toLocaleString()}</td>
                </tr>
              ))}
              {display.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">Ma'lumot topilmadi</td></tr>
              )}
              {display.length > 0 && (
                <tr className="bg-gray-100 font-semibold text-sm">
                  <td className="table-cell" colSpan={4}>Jami ({display.length} viloyat)</td>
                  <td className="table-cell text-right"><span className="badge-blue">{totalOffline}</span></td>
                  <td className="table-cell text-right">{display.reduce((s,r)=>s+Number(r.offline_qatnashchilar||0),0).toLocaleString()}</td>
                  <td className="table-cell text-right"><span className="badge-green">{totalOnline}</span></td>
                  <td className="table-cell text-right">{display.reduce((s,r)=>s+Number(r.online_qatnashchilar||0),0).toLocaleString()}</td>
                  <td className="table-cell text-right font-bold">{totalFuqaro.toLocaleString()}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

/* ── Tab 2: Tumanlar ──────────────────────────────────────────────────────── */
function TumanlarTab({ start, end, viloyatlar, selViloyat, onSelViloyat }) {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(false)
  const [viloyat, setViloyat] = useState(selViloyat || '')

  useEffect(() => { setViloyat(selViloyat || '') }, [selViloyat])

  const load = (s, e, v) => {
    setLoading(true)
    const vp = v ? `&viloyat=${v}` : ''
    api.get(`/hisobot-tumanlar/?start=${s}&end=${e}${vp}`)
      .then(r => setList(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(start, end, viloyat), [start, end, viloyat])

  const totalOffline = list.reduce((s,r)=>s+Number(r.offline_targibot_soni||0),0)
  const totalOnline  = list.reduce((s,r)=>s+Number(r.online_targibot_soni||0),0)
  const totalFuqaro  = list.reduce((s,r)=>s+Number(r.jami_fuqarolar||0),0)

  return (
    <>
      {/* Viloyat selector + Excel */}
      <div className="card mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-gray-700 shrink-0">Viloyat:</label>
        <select className="input-field py-1.5 text-sm max-w-xs"
          value={viloyat} onChange={e => { setViloyat(e.target.value); onSelViloyat && onSelViloyat(e.target.value) }}>
          <option value="">— Barcha viloyatlar —</option>
          {viloyatlar.map(v => <option key={v.id} value={v.id}>{v.nomi}</option>)}
        </select>
        {viloyat && (
          <button onClick={() => { setViloyat(''); onSelViloyat && onSelViloyat('') }}
            className="text-xs text-gray-400 hover:text-red-500">✕ Tozalash</button>
        )}
        <button onClick={() => excelDownload(
          `/api/hisobot-tumanlar/?start=${start}&end=${end}${viloyat ? `&viloyat=${viloyat}` : ''}&excel=1`,
          `hisobot_tumanlar_${start}_${end}.xlsx`)}
          className="ml-auto flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          📥 Excel yuklab olish
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label:'Tumanlar', value:list.length, icon:'🏙', color:'border-indigo-500' },
          { label:'Offline targ.', value:totalOffline, icon:'📢', color:'border-blue-500' },
          { label:'Online targ.', value:totalOnline, icon:'🌐', color:'border-emerald-500' },
          { label:'Jami qatnashchilar', value:totalFuqaro, icon:'👥', color:'border-yellow-500' },
        ].map(c=>(
          <div key={c.label} className={`stat-card border-l-4 ${c.color}`}>
            <div className="text-2xl">{c.icon}</div>
            <div>
              <p className="text-xl font-bold text-gray-900">{c.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        {loading
          ? <div className="py-16 text-center text-gray-400">⏳ Yuklanmoqda...</div>
          : (
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
                  <td className="table-cell text-center"><span className="badge-yellow">{r.mahalla_soni||0} ta</span></td>
                  <td className="table-cell text-right"><span className="badge-blue">{r.offline_targibot_soni||0}</span></td>
                  <td className="table-cell text-right text-sm">{(r.offline_qatnashchilar||0).toLocaleString()}</td>
                  <td className="table-cell text-right"><span className="badge-green">{r.online_targibot_soni||0}</span></td>
                  <td className="table-cell text-right text-sm">{(r.online_qatnashchilar||0).toLocaleString()}</td>
                  <td className="table-cell text-right font-bold">{(r.jami_fuqarolar||0).toLocaleString()}</td>
                </tr>
              ))}
              {list.length===0 && <tr><td colSpan={8} className="text-center py-12 text-gray-400">Ma'lumot topilmadi</td></tr>}
              {list.length>0 && (
                <tr className="bg-gray-100 font-semibold text-sm">
                  <td className="table-cell" colSpan={2}>Jami ({list.length} tuman)</td>
                  <td className="table-cell text-center"><span className="badge-yellow">{list.reduce((s,r)=>s+Number(r.mahalla_soni||0),0)} ta</span></td>
                  <td className="table-cell text-right"><span className="badge-blue">{totalOffline}</span></td>
                  <td className="table-cell text-right">{list.reduce((s,r)=>s+Number(r.offline_qatnashchilar||0),0).toLocaleString()}</td>
                  <td className="table-cell text-right"><span className="badge-green">{totalOnline}</span></td>
                  <td className="table-cell text-right">{list.reduce((s,r)=>s+Number(r.online_qatnashchilar||0),0).toLocaleString()}</td>
                  <td className="table-cell text-right font-bold">{totalFuqaro.toLocaleString()}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

/* ── Tab 3: Mahallalar ────────────────────────────────────────────────────── */
function MahallalarTab({ start, end, viloyatlar, selViloyat, onSelViloyat }) {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(false)
  const [viloyat, setViloyat] = useState(selViloyat || '')
  const [search, setSearch]   = useState('')

  useEffect(() => { setViloyat(selViloyat || '') }, [selViloyat])

  const load = (s, e, v) => {
    setLoading(true)
    const vp = v ? `&viloyat=${v}` : ''
    api.get(`/hisobot/?start=${s}&end=${e}${vp}`)
      .then(r => setList(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(start, end, viloyat), [start, end, viloyat])

  const filtered = search
    ? list.filter(r =>
        r.mahalla_nomi?.toLowerCase().includes(search.toLowerCase()) ||
        r.tuman_nomi?.toLowerCase().includes(search.toLowerCase()))
    : list

  const totalOffline = filtered.reduce((s,r)=>s+Number(r.offline_targibot_soni||0),0)
  const totalOnline  = filtered.reduce((s,r)=>s+Number(r.online_targibot_soni||0),0)
  const totalFuqaro  = filtered.reduce((s,r)=>s+Number(r.jami_fuqarolar||0),0)

  return (
    <>
      {/* Filtrlar */}
      <div className="card mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 shrink-0">Viloyat:</label>
          <select className="input-field py-1.5 text-sm"
            value={viloyat} onChange={e => { setViloyat(e.target.value); onSelViloyat && onSelViloyat(e.target.value) }}>
            <option value="">— Barcha —</option>
            {viloyatlar.map(v => <option key={v.id} value={v.id}>{v.nomi}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-gray-700 shrink-0">Qidirish:</label>
          <input className="input-field py-1.5 text-sm flex-1" placeholder="Mahalla yoki tuman..."
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <span className="text-xs text-gray-400">{filtered.length} ta mahalla</span>
        <button onClick={() => excelDownload(
          `/api/hisobot/?start=${start}&end=${end}${viloyat ? `&viloyat=${viloyat}` : ''}&excel=1`,
          `hisobot_mahallalar_${start}_${end}.xlsx`)}
          className="ml-auto flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          📥 Excel yuklab olish
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label:'Offline targ\'ibotlar', value:totalOffline, icon:'📢', color:'border-blue-500' },
          { label:'Online targ\'ibotlar',  value:totalOnline,  icon:'🌐', color:'border-emerald-500' },
          { label:'Jami qatnashchilar',    value:totalFuqaro,  icon:'👥', color:'border-yellow-500' },
        ].map(c=>(
          <div key={c.label} className={`stat-card border-l-4 ${c.color}`}>
            <div className="text-2xl">{c.icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{c.value.toLocaleString()}</p>
              <p className="text-sm text-gray-500">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        {loading
          ? <div className="py-16 text-center text-gray-400">⏳ Yuklanmoqda...</div>
          : (
          <table className="w-full">
            <thead><tr>
              {['#','Tuman','Mahalla','Offline targ.','Offline fuk.','Online targ.','Online fuk.','Jami'].map(h=>(
                <th key={h} className="table-header text-left">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((r,i)=>(
                <tr key={i} className="hover:bg-gray-50">
                  <td className="table-cell text-gray-400">{i+1}</td>
                  <td className="table-cell text-xs text-gray-500">{r.tuman_nomi}</td>
                  <td className="table-cell font-medium">{r.mahalla_nomi}</td>
                  <td className="table-cell text-right"><span className="badge-blue">{r.offline_targibot_soni||0}</span></td>
                  <td className="table-cell text-right text-sm">{(r.offline_qatnashchilar||0).toLocaleString()}</td>
                  <td className="table-cell text-right"><span className="badge-green">{r.online_targibot_soni||0}</span></td>
                  <td className="table-cell text-right text-sm">{(r.online_qatnashchilar||0).toLocaleString()}</td>
                  <td className="table-cell text-right font-semibold">{(r.jami_fuqarolar||0).toLocaleString()}</td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={8} className="text-center py-12 text-gray-400">Ma'lumot topilmadi</td></tr>}
              {filtered.length>0 && (
                <tr className="bg-gray-100 font-semibold text-sm">
                  <td className="table-cell" colSpan={3}>Jami ({filtered.length} mahalla)</td>
                  <td className="table-cell text-right"><span className="badge-blue">{totalOffline}</span></td>
                  <td className="table-cell text-right">{filtered.reduce((s,r)=>s+Number(r.offline_qatnashchilar||0),0).toLocaleString()}</td>
                  <td className="table-cell text-right"><span className="badge-green">{totalOnline}</span></td>
                  <td className="table-cell text-right">{filtered.reduce((s,r)=>s+Number(r.online_qatnashchilar||0),0).toLocaleString()}</td>
                  <td className="table-cell text-right font-bold">{totalFuqaro.toLocaleString()}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

/* ── Tab: Samaradorlik ───────────────────────────────────────────────────── */
function SamaradorlikTab({ viloyatlar }) {
  const [rows, setRows]   = useState([])
  const [start, setStart] = useState(monthStart)
  const [end, setEnd]     = useState(new Date().toISOString().slice(0,10))
  const [vid, setVid]     = useState('')

  const load = (s=start, e=end, v=vid) =>
    api.get(`/samaradorlik/?start=${s}&end=${e}${v?`&viloyat=${v}`:''}`).then(r => setRows(r.data.rows||[]))
  useEffect(() => { load() }, [])

  const dc = (n) => n===null?'text-gray-400':n>=0.5?'text-red-600 font-bold':n>=0.1?'text-yellow-600':'text-emerald-600'
  const tT = rows.reduce((s,r)=>s+r.targibot_soni,0)
  const tM = rows.reduce((s,r)=>s+r.murojaat_soni,0)

  return (
    <div>
      <div className="card mb-4 flex gap-4 items-end flex-wrap">
        <div><label className="block text-xs text-gray-500 mb-1">Dan</label>
          <input type="date" className="input-field py-1.5 text-sm" value={start} onChange={e=>{setStart(e.target.value);load(e.target.value,end,vid)}}/></div>
        <div><label className="block text-xs text-gray-500 mb-1">Gacha</label>
          <input type="date" className="input-field py-1.5 text-sm" value={end} onChange={e=>{setEnd(e.target.value);load(start,e.target.value,vid)}}/></div>
        <div><label className="block text-xs text-gray-500 mb-1">Viloyat</label>
          <select className="input-field py-1.5 text-sm" value={vid} onChange={e=>{setVid(e.target.value);load(start,end,e.target.value)}}>
            <option value=''>Barcha viloyatlar</option>
            {viloyatlar.map(v=><option key={v.id} value={v.id}>{v.nomi}</option>)}
          </select></div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="stat-card border-l-4 border-blue-500"><div className="text-2xl">📢</div><div><p className="text-xl font-bold">{tT.toLocaleString()}</p><p className="text-xs text-gray-500">Jami targ'ibotlar</p></div></div>
        <div className="stat-card border-l-4 border-emerald-500"><div className="text-2xl">👥</div><div><p className="text-xl font-bold">{rows.reduce((s,r)=>s+r.qatnashchilar,0).toLocaleString()}</p><p className="text-xs text-gray-500">Qatnashchilar</p></div></div>
        <div className="stat-card border-l-4 border-red-500"><div className="text-2xl">🚨</div><div><p className="text-xl font-bold">{tM}</p><p className="text-xs text-gray-500">Murojaatlar</p></div></div>
      </div>
      <div className="card overflow-hidden p-0">
        <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-500">💡 <b>Nisbat</b> = murojaat / targ'ibot. Qanchalik past — shuncha yaxshi.</div>
        <table className="w-full"><thead><tr>
          {['#','Viloyat',"Targ'ibot",'Qatnashchilar','Murojaat','Nisbat'].map(h=><th key={h} className="table-header text-left">{h}</th>)}
        </tr></thead><tbody>
          {rows.map((r,i)=>(
            <tr key={i} className="hover:bg-gray-50">
              <td className="table-cell text-gray-400">{i+1}</td>
              <td className="table-cell font-medium">{r.nomi}</td>
              <td className="table-cell"><span className="badge-blue">{r.targibot_soni}</span></td>
              <td className="table-cell">{r.qatnashchilar.toLocaleString()}</td>
              <td className="table-cell">{r.murojaat_soni>0?<span className="badge-red">{r.murojaat_soni}</span>:<span className="text-gray-400">0</span>}</td>
              <td className={`table-cell ${dc(r.nisbat)}`}>{r.nisbat===null?'—':r.nisbat.toFixed(3)}</td>
            </tr>
          ))}
          {rows.length===0&&<tr><td colSpan={6} className="text-center py-10 text-gray-400">Ma'lumot topilmadi</td></tr>}
          {rows.length>0&&<tr className="bg-gray-100 font-semibold">
            <td className="table-cell" colSpan={2}>Jami</td>
            <td className="table-cell"><span className="badge-blue">{tT}</span></td>
            <td className="table-cell">{rows.reduce((s,r)=>s+r.qatnashchilar,0).toLocaleString()}</td>
            <td className="table-cell">{tM}</td>
            <td className="table-cell text-gray-500">{tT>0?(tM/tT).toFixed(3):'—'}</td>
          </tr>}
        </tbody></table>
      </div>
    </div>
  )
}

/* ── Tab: Xavfli hududlar ────────────────────────────────────────────────── */
function XavfliTab({ viloyatlar }) {
  const [rows, setRows]   = useState([])
  const [start, setStart] = useState(monthStart)
  const [end, setEnd]     = useState(new Date().toISOString().slice(0,10))
  const [vid, setVid]     = useState('')

  const load = (s=start, e=end, v=vid) =>
    api.get(`/xavfli-mahallalar/?start=${s}&end=${e}${v?`&viloyat=${v}`:''}`).then(r => setRows(r.data.rows||[]))
  useEffect(() => { load() }, [])

  const DS = { yuqori:'bg-red-100 text-red-700 font-bold', "o'rta":'bg-yellow-100 text-yellow-700', past:'bg-emerald-100 text-emerald-700' }
  const DL = { yuqori:'🔴 Yuqori', "o'rta":"🟡 O'rta", past:'🟢 Past' }
  const yuqori = rows.filter(r=>r.daraja==='yuqori').length
  const orta   = rows.filter(r=>r.daraja==="o'rta").length

  return (
    <div>
      <div className="card mb-4 flex gap-4 items-end flex-wrap">
        <div><label className="block text-xs text-gray-500 mb-1">Dan</label>
          <input type="date" className="input-field py-1.5 text-sm" value={start} onChange={e=>{setStart(e.target.value);load(e.target.value,end,vid)}}/></div>
        <div><label className="block text-xs text-gray-500 mb-1">Gacha</label>
          <input type="date" className="input-field py-1.5 text-sm" value={end} onChange={e=>{setEnd(e.target.value);load(start,e.target.value,vid)}}/></div>
        <div><label className="block text-xs text-gray-500 mb-1">Viloyat</label>
          <select className="input-field py-1.5 text-sm" value={vid} onChange={e=>{setVid(e.target.value);load(start,end,e.target.value)}}>
            <option value=''>Barcha viloyatlar</option>
            {viloyatlar.map(v=><option key={v.id} value={v.id}>{v.nomi}</option>)}
          </select></div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="stat-card border-l-4 border-red-500"><div className="text-2xl">🔴</div><div><p className="text-xl font-bold text-red-600">{yuqori}</p><p className="text-xs text-gray-500">Yuqori xavfli</p></div></div>
        <div className="stat-card border-l-4 border-yellow-500"><div className="text-2xl">🟡</div><div><p className="text-xl font-bold text-yellow-600">{orta}</p><p className="text-xs text-gray-500">O'rta xavfli</p></div></div>
        <div className="stat-card border-l-4 border-emerald-500"><div className="text-2xl">✅</div><div><p className="text-xl font-bold text-emerald-600">{rows.length-yuqori-orta}</p><p className="text-xs text-gray-500">Nazorat ostida</p></div></div>
      </div>
      <div className="card overflow-hidden p-0">
        <div className="px-4 py-2 bg-red-50 border-b text-xs text-red-700">⚠️ <b>Yuqori xavf</b>: murojaat bor, targ'ibot yo'q. <b>O'rta xavf</b>: targ'ibot soni murojaatdan 5 barobar kamroq.</div>
        <table className="w-full"><thead><tr>
          {['#','Viloyat',"Targ'ibot",'Murojaat','Xavf darajasi'].map(h=><th key={h} className="table-header text-left">{h}</th>)}
        </tr></thead><tbody>
          {rows.map((r,i)=>(
            <tr key={i} className={`hover:bg-gray-50 ${r.daraja==='yuqori'?'bg-red-50/40':''}`}>
              <td className="table-cell text-gray-400">{i+1}</td>
              <td className="table-cell font-medium">{r.nomi}</td>
              <td className="table-cell">{r.targibot_soni>0?<span className="badge-blue">{r.targibot_soni}</span>:<span className="text-red-400 font-bold">0</span>}</td>
              <td className="table-cell"><span className="badge-red">{r.murojaat_soni}</span></td>
              <td className="table-cell"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${DS[r.daraja]||''}`}>{DL[r.daraja]||r.daraja}</span></td>
            </tr>
          ))}
          {rows.length===0&&<tr><td colSpan={5} className="text-center py-10 text-gray-400">✅ Murojaat yo'q yoki barcha hududlar nazorat ostida</td></tr>}
        </tbody></table>
      </div>
    </div>
  )
}

/* ── Tab: Oylik dinamika ─────────────────────────────────────────────────── */
function OylikTab({ viloyatlar }) {
  const [data, setData] = useState([])
  const [yil, setYil]   = useState(String(CUR_YEAR))
  const [vid, setVid]   = useState('')
  const OY = ['','Yan','Feb','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek']
  const years = Array.from({length:4},(_,i)=>CUR_YEAR-i)

  const load = (y=yil, v=vid) =>
    api.get(`/oylik-dinamika/?yil=${y}${v?`&viloyat=${v}`:''}`).then(r=>setData(r.data.rows||[]))
  useEffect(()=>{load()},[])

  return (
    <div>
      <div className="card mb-4 flex gap-4 items-end flex-wrap">
        <div><label className="block text-xs text-gray-500 mb-1">Yil</label>
          <select className="input-field py-1.5 text-sm" value={yil} onChange={e=>{setYil(e.target.value);load(e.target.value,vid)}}>
            {years.map(y=><option key={y} value={y}>{y}</option>)}
          </select></div>
        <div><label className="block text-xs text-gray-500 mb-1">Viloyat</label>
          <select className="input-field py-1.5 text-sm" value={vid} onChange={e=>{setVid(e.target.value);load(yil,e.target.value)}}>
            <option value=''>Barcha viloyatlar</option>
            {viloyatlar.map(v=><option key={v.id} value={v.id}>{v.nomi}</option>)}
          </select></div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="stat-card border-l-4 border-blue-500"><div className="text-2xl">📢</div><div><p className="text-xl font-bold">{data.reduce((s,r)=>s+r.targibot_soni,0).toLocaleString()}</p><p className="text-xs text-gray-500">Jami targ'ibotlar</p></div></div>
        <div className="stat-card border-l-4 border-emerald-500"><div className="text-2xl">👥</div><div><p className="text-xl font-bold">{data.reduce((s,r)=>s+r.qatnashchilar,0).toLocaleString()}</p><p className="text-xs text-gray-500">Qatnashchilar</p></div></div>
        <div className="stat-card border-l-4 border-red-500"><div className="text-2xl">🚨</div><div><p className="text-xl font-bold">{data.reduce((s,r)=>s+r.murojaat_soni,0)}</p><p className="text-xs text-gray-500">Murojaatlar</p></div></div>
      </div>
      <div className="card mb-4">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data} margin={{top:5,right:20,left:0,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
            <XAxis dataKey="oy" tickFormatter={v=>OY[v]} tick={{fontSize:12}}/>
            <YAxis yAxisId="left" tick={{fontSize:12}}/><YAxis yAxisId="right" orientation="right" tick={{fontSize:12}}/>
            <Tooltip labelFormatter={v=>`${OY[v]} ${yil}`}/><Legend/>
            <Bar yAxisId="left" dataKey="targibot_soni" name="Targ'ibotlar" fill="#6366f1" radius={[4,4,0,0]}/>
            <Bar yAxisId="left" dataKey="qatnashchilar" name="Qatnashchilar" fill="#34d399" radius={[4,4,0,0]}/>
            <Line yAxisId="right" type="monotone" dataKey="murojaat_soni" name="Murojaatlar" stroke="#ef4444" strokeWidth={2} dot={{r:4}}/>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="card overflow-hidden p-0"><table className="w-full">
        <thead><tr>{['Oy',"Targ'ibotlar",'Qatnashchilar','Murojaatlar'].map(h=><th key={h} className="table-header text-left">{h}</th>)}</tr></thead>
        <tbody>{data.map((r,i)=>(
          <tr key={i} className="hover:bg-gray-50">
            <td className="table-cell font-medium">{r.oy_nomi}</td>
            <td className="table-cell"><span className="badge-blue">{r.targibot_soni}</span></td>
            <td className="table-cell">{r.qatnashchilar.toLocaleString()}</td>
            <td className="table-cell">{r.murojaat_soni>0?<span className="badge-red">{r.murojaat_soni}</span>:<span className="text-gray-400">0</span>}</td>
          </tr>
        ))}</tbody>
      </table></div>
    </div>
  )
}

/* ── Tab: Haftalik holat ─────────────────────────────────────────────────── */
function HaftalikTab({ viloyatlar }) {
  const [data, setData] = useState([])
  const [vid, setVid]   = useState('')
  const fmt = (d) => { if(!d) return ''; const dt=new Date(d); return `${dt.getDate().toString().padStart(2,'0')}.${(dt.getMonth()+1).toString().padStart(2,'0')}` }

  const load = (v=vid) =>
    api.get(`/haftalik-holat/?${v?`viloyat=${v}`:''}`).then(r=>setData(r.data.rows||[]))
  useEffect(()=>{load()},[])

  return (
    <div>
      <div className="card mb-4 flex gap-4 items-end">
        <div><label className="block text-xs text-gray-500 mb-1">Viloyat</label>
          <select className="input-field py-1.5 text-sm" value={vid} onChange={e=>{setVid(e.target.value);load(e.target.value)}}>
            <option value=''>Barcha viloyatlar</option>
            {viloyatlar.map(v=><option key={v.id} value={v.id}>{v.nomi}</option>)}
          </select></div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="stat-card border-l-4 border-blue-500"><div className="text-2xl">📢</div><div><p className="text-xl font-bold">{data.reduce((s,r)=>s+r.targibot_soni,0).toLocaleString()}</p><p className="text-xs text-gray-500">12 haftada targ'ibotlar</p></div></div>
        <div className="stat-card border-l-4 border-emerald-500"><div className="text-2xl">👥</div><div><p className="text-xl font-bold">{data.reduce((s,r)=>s+r.qatnashchilar,0).toLocaleString()}</p><p className="text-xs text-gray-500">Qatnashchilar</p></div></div>
        <div className="stat-card border-l-4 border-red-500"><div className="text-2xl">🚨</div><div><p className="text-xl font-bold">{data.reduce((s,r)=>s+r.murojaat_soni,0)}</p><p className="text-xs text-gray-500">Murojaatlar</p></div></div>
      </div>
      <div className="card mb-4">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data.map(r=>({...r,label:fmt(r.hafta_boshlash)}))} margin={{top:5,right:20,left:0,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
            <XAxis dataKey="label" tick={{fontSize:11}}/><YAxis yAxisId="left" tick={{fontSize:12}}/><YAxis yAxisId="right" orientation="right" tick={{fontSize:12}}/>
            <Tooltip labelFormatter={(_,p)=>p?.[0]?.payload?.hafta_boshlash||''} formatter={(v,n)=>[v.toLocaleString(),n]}/><Legend/>
            <Bar yAxisId="left" dataKey="targibot_soni" name="Targ'ibotlar" fill="#6366f1" radius={[4,4,0,0]}/>
            <Bar yAxisId="left" dataKey="qatnashchilar" name="Qatnashchilar" fill="#34d399" radius={[4,4,0,0]}/>
            <Line yAxisId="right" type="monotone" dataKey="murojaat_soni" name="Murojaatlar" stroke="#ef4444" strokeWidth={2} dot={{r:4}}/>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="card overflow-hidden p-0"><table className="w-full">
        <thead><tr>{['Hafta boshi',"Targ'ibotlar",'Qatnashchilar','Murojaatlar'].map(h=><th key={h} className="table-header text-left">{h}</th>)}</tr></thead>
        <tbody>
          {data.map((r,i)=>(
            <tr key={i} className="hover:bg-gray-50">
              <td className="table-cell font-medium">{r.hafta_boshlash}</td>
              <td className="table-cell"><span className="badge-blue">{r.targibot_soni}</span></td>
              <td className="table-cell">{r.qatnashchilar.toLocaleString()}</td>
              <td className="table-cell">{r.murojaat_soni>0?<span className="badge-red">{r.murojaat_soni}</span>:<span className="text-gray-400">0</span>}</td>
            </tr>
          ))}
          {data.length===0&&<tr><td colSpan={4} className="text-center py-10 text-gray-400">Ma'lumot topilmadi</td></tr>}
        </tbody>
      </table></div>
    </div>
  )
}

/* ── Asosiy komponent ─────────────────────────────────────────────────────── */
const TABS = [
  { id: 'viloyatlar',    label: '🗺️ Viloyatlar bo\'yicha' },
  { id: 'tumanlar',      label: '🏙 Tumanlar bo\'yicha' },
  { id: 'mahallalar',    label: '🏘 Mahallalar bo\'yicha' },
  { id: 'samaradorlik',  label: '📊 Samaradorlik' },
  { id: 'xavfli',        label: '⚠️ Xavfli hududlar' },
  { id: 'oylik',         label: '📅 Oylik dinamika' },
  { id: 'haftalik',      label: '📆 Haftalik holat' },
]

export default function RespublikaHisobot() {
  const [tab, setTab]           = useState('viloyatlar')
  const [start, setStart]       = useState(thirtyDaysAgo)
  const [end, setEnd]           = useState(today)
  const [applied, setApplied]   = useState({ start: today, end: today })
  const [viloyatlar, setViloyatlar] = useState([])
  const [selViloyat, setSelViloyat] = useState('')

  useEffect(() => {
    api.get('/viloyatlar/').then(r => setViloyatlar(r.data))
  }, [])

  const handleSearch = () => setApplied({ start, end })
  const handleReset  = () => { setStart(today); setEnd(today); setApplied({ start: today, end: today }) }

  // Viloyat tanlanganda tumanlar tabiga o'tish
  const handleSelViloyat = (v) => {
    setSelViloyat(v)
    if (v) setTab('tumanlar')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Hisobot (respublika kesimi)
      </h1>

      {/* Sana filter — faqat viloyatlar/tumanlar/mahallalar tablari uchun */}
      {['viloyatlar','tumanlar','mahallalar'].includes(tab) && (
        <DateBar start={start} end={end}
          onStart={setStart} onEnd={setEnd}
          onSearch={handleSearch} onReset={handleReset}/>
      )}

      {/* Tablar */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              tab === t.id
                ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab kontent */}
      {tab === 'viloyatlar' && (
        <ViloyatlarTab start={applied.start} end={applied.end}
          viloyatlar={viloyatlar} selViloyat={selViloyat} onSelViloyat={handleSelViloyat}/>
      )}
      {tab === 'tumanlar' && (
        <TumanlarTab start={applied.start} end={applied.end}
          viloyatlar={viloyatlar} selViloyat={selViloyat} onSelViloyat={setSelViloyat}/>
      )}
      {tab === 'mahallalar' && (
        <MahallalarTab start={applied.start} end={applied.end}
          viloyatlar={viloyatlar} selViloyat={selViloyat} onSelViloyat={setSelViloyat}/>
      )}
      {tab === 'samaradorlik' && <SamaradorlikTab viloyatlar={viloyatlar}/>}
      {tab === 'xavfli'       && <XavfliTab viloyatlar={viloyatlar}/>}
      {tab === 'oylik'        && <OylikTab viloyatlar={viloyatlar}/>}
      {tab === 'haftalik'     && <HaftalikTab viloyatlar={viloyatlar}/>}
    </div>
  )
}
