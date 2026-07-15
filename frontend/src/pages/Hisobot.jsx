import { useEffect, useState } from 'react'
import api from '../api'
import DateFilter from '../components/DateFilter'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const today      = new Date().toISOString().slice(0,10)
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)
const CUR_YEAR   = new Date().getFullYear()

function excelDownload(url, filename) {
  const token = localStorage.getItem('token')
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.blob()).then(blob => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
    })
}

const TABS = [
  { key: 'mahalla',      label: '📋 Mahallalar' },
  { key: 'samaradorlik', label: '📊 Samaradorlik' },
  { key: 'xavfli',      label: '⚠️ Xavfli hududlar' },
  { key: 'oylik',       label: '📅 Oylik dinamika' },
  { key: 'haftalik',    label: '📆 Haftalik holat' },
]

// ── Tab: Mahallalar ──────────────────────────────────────────────────────────
function TabMahalla() {
  const [list, setList]   = useState([])
  const [start, setStart] = useState(monthStart)
  const [end, setEnd]     = useState(today)

  const load = (s=start, e=end) =>
    api.get(`/hisobot/?start=${s}&end=${e}`).then(r => setList(r.data))
  useEffect(() => { load() }, [])

  const totalOffline  = list.reduce((s,r) => s+Number(r.offline_targibot_soni||0), 0)
  const totalOnline   = list.reduce((s,r) => s+Number(r.online_targibot_soni||0), 0)
  const totalFuqaro   = list.reduce((s,r) => s+Number(r.jami_fuqarolar||0), 0)
  const totalMurojaat = list.reduce((s,r) => s+Number(r.murojaat_soni||0), 0)

  return (
    <div>
      <div className="flex justify-end mb-4">
        {list.length > 0 && (
          <button onClick={() => excelDownload(`/api/hisobot/?start=${start}&end=${end}&excel=1`,
            `hisobot_mahallalar_${start}_${end}.xlsx`)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            📥 Excel yuklab olish
          </button>
        )}
      </div>
      <DateFilter start={start} end={end} onStart={setStart} onEnd={setEnd}
        onSearch={() => load()} onReset={() => { setStart(monthStart); setEnd(today); load(monthStart, today) }}/>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="stat-card border-l-4 border-blue-500"><div className="text-2xl">📢</div><div>
          <p className="text-xl font-bold">{totalOffline}</p><p className="text-xs text-gray-500">Offline targ'ibotlar</p></div></div>
        <div className="stat-card border-l-4 border-emerald-500"><div className="text-2xl">🌐</div><div>
          <p className="text-xl font-bold">{totalOnline}</p><p className="text-xs text-gray-500">Online targ'ibotlar</p></div></div>
        <div className="stat-card border-l-4 border-yellow-500"><div className="text-2xl">👥</div><div>
          <p className="text-xl font-bold">{totalFuqaro.toLocaleString()}</p><p className="text-xs text-gray-500">Qatnashchilar</p></div></div>
        <div className="stat-card border-l-4 border-red-500"><div className="text-2xl">🚨</div><div>
          <p className="text-xl font-bold">{totalMurojaat}</p><p className="text-xs text-gray-500">Murojaatlar</p></div></div>
      </div>
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead><tr>
            {['#','Tuman','Mahalla','Offline targ.','Offline fuk.','Online targ.','Online fuk.','Jami','Murojaat'].map(h => (
              <th key={h} className="table-header text-left">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {list.map((r,i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="table-cell text-gray-400">{i+1}</td>
                <td className="table-cell text-xs text-gray-500">{r.tuman_nomi}</td>
                <td className="table-cell font-medium">{r.mahalla_nomi}</td>
                <td className="table-cell"><span className="badge-blue">{r.offline_targibot_soni||0}</span></td>
                <td className="table-cell text-sm">{r.offline_qatnashchilar||0}</td>
                <td className="table-cell"><span className="badge-green">{r.online_targibot_soni||0}</span></td>
                <td className="table-cell text-sm">{r.online_qatnashchilar||0}</td>
                <td className="table-cell font-semibold">{r.jami_fuqarolar||0}</td>
                <td className="table-cell">
                  {r.murojaat_soni > 0
                    ? <span className="badge-red">{r.murojaat_soni}</span>
                    : <span className="text-gray-400">0</span>}
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={9} className="text-center py-10 text-gray-400">Ma'lumot topilmadi</td></tr>}
            {list.length > 0 && (
              <tr className="bg-gray-100 font-semibold">
                <td className="table-cell" colSpan={3}>Jami</td>
                <td className="table-cell"><span className="badge-blue">{totalOffline}</span></td>
                <td className="table-cell">{list.reduce((s,r)=>s+Number(r.offline_qatnashchilar||0),0)}</td>
                <td className="table-cell"><span className="badge-green">{totalOnline}</span></td>
                <td className="table-cell">{list.reduce((s,r)=>s+Number(r.online_qatnashchilar||0),0)}</td>
                <td className="table-cell">{totalFuqaro}</td>
                <td className="table-cell">{totalMurojaat}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Tab: Samaradorlik ────────────────────────────────────────────────────────
function TabSamaradorlik() {
  const [data, setData]   = useState(null)
  const [start, setStart] = useState(monthStart)
  const [end, setEnd]     = useState(today)
  const role = localStorage.getItem('role')

  const load = (s=start, e=end) =>
    api.get(`/samaradorlik/?start=${s}&end=${e}`).then(r => setData(r.data))
  useEffect(() => { load() }, [])

  const rows = data?.rows || []
  const totalT = rows.reduce((s,r) => s+r.targibot_soni, 0)
  const totalQ = rows.reduce((s,r) => s+r.qatnashchilar, 0)
  const totalM = rows.reduce((s,r) => s+r.murojaat_soni, 0)

  const dc = (n) => n === null ? 'text-gray-400' : n >= 0.5 ? 'text-red-600 font-bold' : n >= 0.1 ? 'text-yellow-600' : 'text-emerald-600'

  return (
    <div>
      <DateFilter start={start} end={end} onStart={setStart} onEnd={setEnd}
        onSearch={() => load()} onReset={() => { setStart(monthStart); setEnd(today); load(monthStart, today) }}/>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card border-l-4 border-blue-500"><div className="text-2xl">📢</div><div>
          <p className="text-xl font-bold">{totalT.toLocaleString()}</p><p className="text-xs text-gray-500">Jami targ'ibotlar</p></div></div>
        <div className="stat-card border-l-4 border-emerald-500"><div className="text-2xl">👥</div><div>
          <p className="text-xl font-bold">{totalQ.toLocaleString()}</p><p className="text-xs text-gray-500">Qatnashchilar</p></div></div>
        <div className="stat-card border-l-4 border-red-500"><div className="text-2xl">🚨</div><div>
          <p className="text-xl font-bold">{totalM}</p><p className="text-xs text-gray-500">Murojaatlar</p></div></div>
      </div>
      <div className="card overflow-hidden p-0">
        <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-500">
          💡 <b>Nisbat</b> = murojaat / targ'ibot. Qanchalik past — shuncha yaxshi.
        </div>
        <table className="w-full">
          <thead><tr>
            {['#', role === 'respublika' ? 'Viloyat' : 'Tuman', role !== 'respublika' ? 'Mahalla' : null,
              "Targ'ibot", 'Qatnashchilar', 'Murojaat', 'Nisbat'].filter(Boolean).map(h => (
              <th key={h} className="table-header text-left">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map((r,i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="table-cell text-gray-400">{i+1}</td>
                <td className="table-cell font-medium">{role === 'respublika' ? r.nomi : r.tuman_nomi}</td>
                {role !== 'respublika' && <td className="table-cell text-sm">{r.nomi}</td>}
                <td className="table-cell"><span className="badge-blue">{r.targibot_soni}</span></td>
                <td className="table-cell">{r.qatnashchilar.toLocaleString()}</td>
                <td className="table-cell">
                  {r.murojaat_soni > 0 ? <span className="badge-red">{r.murojaat_soni}</span> : <span className="text-gray-400">0</span>}
                </td>
                <td className={`table-cell ${dc(r.nisbat)}`}>{r.nisbat === null ? '—' : r.nisbat.toFixed(3)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-400">Ma'lumot topilmadi</td></tr>}
            {rows.length > 0 && (
              <tr className="bg-gray-100 font-semibold">
                <td className="table-cell" colSpan={role === 'respublika' ? 2 : 3}>Jami</td>
                <td className="table-cell"><span className="badge-blue">{totalT}</span></td>
                <td className="table-cell">{totalQ.toLocaleString()}</td>
                <td className="table-cell">{totalM}</td>
                <td className="table-cell text-gray-500">{totalT > 0 ? (totalM/totalT).toFixed(3) : '—'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Tab: Xavfli hududlar ─────────────────────────────────────────────────────
function TabXavfli() {
  const [data, setData]   = useState(null)
  const [start, setStart] = useState(monthStart)
  const [end, setEnd]     = useState(today)
  const role = localStorage.getItem('role')

  const load = (s=start, e=end) =>
    api.get(`/xavfli-mahallalar/?start=${s}&end=${e}`).then(r => setData(r.data))
  useEffect(() => { load() }, [])

  const rows = data?.rows || []
  const yuqori = rows.filter(r => r.daraja === 'yuqori').length
  const orta   = rows.filter(r => r.daraja === "o'rta").length

  const DS = { yuqori:'bg-red-100 text-red-700 font-bold', "o'rta":'bg-yellow-100 text-yellow-700', past:'bg-emerald-100 text-emerald-700' }
  const DL = { yuqori:'🔴 Yuqori', "o'rta":"🟡 O'rta", past:'🟢 Past' }

  return (
    <div>
      <DateFilter start={start} end={end} onStart={setStart} onEnd={setEnd}
        onSearch={() => load()} onReset={() => { setStart(monthStart); setEnd(today); load(monthStart, today) }}/>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card border-l-4 border-red-500"><div className="text-2xl">🔴</div><div>
          <p className="text-xl font-bold text-red-600">{yuqori}</p><p className="text-xs text-gray-500">Yuqori xavfli</p></div></div>
        <div className="stat-card border-l-4 border-yellow-500"><div className="text-2xl">🟡</div><div>
          <p className="text-xl font-bold text-yellow-600">{orta}</p><p className="text-xs text-gray-500">O'rta xavfli</p></div></div>
        <div className="stat-card border-l-4 border-emerald-500"><div className="text-2xl">✅</div><div>
          <p className="text-xl font-bold text-emerald-600">{rows.length - yuqori - orta}</p><p className="text-xs text-gray-500">Nazorat ostida</p></div></div>
      </div>
      <div className="card overflow-hidden p-0">
        <div className="px-4 py-2 bg-red-50 border-b text-xs text-red-700">
          ⚠️ <b>Yuqori xavf</b>: murojaat bor, targ'ibot yo'q. <b>O'rta xavf</b>: targ'ibot soni murojaatdan 5 barobar kamroq.
        </div>
        <table className="w-full">
          <thead><tr>
            {['#', role === 'respublika' ? 'Viloyat' : 'Tuman', role !== 'respublika' ? 'Mahalla' : null,
              "Targ'ibot", 'Murojaat', 'Xavf darajasi'].filter(Boolean).map(h => (
              <th key={h} className="table-header text-left">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map((r,i) => (
              <tr key={i} className={`hover:bg-gray-50 ${r.daraja === 'yuqori' ? 'bg-red-50/40' : ''}`}>
                <td className="table-cell text-gray-400">{i+1}</td>
                <td className="table-cell font-medium">{role === 'respublika' ? r.nomi : r.tuman_nomi}</td>
                {role !== 'respublika' && <td className="table-cell">{r.nomi}</td>}
                <td className="table-cell">
                  {r.targibot_soni > 0 ? <span className="badge-blue">{r.targibot_soni}</span> : <span className="text-red-400 font-bold">0</span>}
                </td>
                <td className="table-cell"><span className="badge-red">{r.murojaat_soni}</span></td>
                <td className="table-cell">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${DS[r.daraja]||''}`}>{DL[r.daraja]||r.daraja}</span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">✅ Murojaat yo'q yoki barcha hududlar nazorat ostida</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Tab: Oylik dinamika ──────────────────────────────────────────────────────
function TabOylik() {
  const [data, setData]       = useState([])
  const [yil, setYil]         = useState(String(CUR_YEAR))
  const [viloyatlar, setVils] = useState([])
  const [vid, setVid]         = useState('')
  const role = localStorage.getItem('role')

  const load = (y=yil, v=vid) =>
    api.get(`/oylik-dinamika/?yil=${y}${v ? `&viloyat=${v}` : ''}`).then(r => setData(r.data.rows||[]))

  useEffect(() => {
    load()
    if (role === 'respublika') api.get('/viloyatlar/').then(r => setVils(r.data))
  }, [])

  const years = Array.from({length:4}, (_,i) => CUR_YEAR - i)
  const OY_NOMI = ['','Yan','Feb','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek']

  return (
    <div>
      <div className="card mb-4 flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Yil</label>
          <select value={yil} onChange={e => { setYil(e.target.value); load(e.target.value, vid) }} className="input-field py-2 pr-8">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {role === 'respublika' && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Viloyat</label>
            <select value={vid} onChange={e => { setVid(e.target.value); load(yil, e.target.value) }} className="input-field py-2 pr-8">
              <option value=''>Barcha viloyatlar</option>
              {viloyatlar.map(v => <option key={v.id} value={v.id}>{v.viloyat_nomi}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card border-l-4 border-blue-500"><div className="text-2xl">📢</div><div>
          <p className="text-xl font-bold">{data.reduce((s,r)=>s+r.targibot_soni,0).toLocaleString()}</p><p className="text-xs text-gray-500">Jami targ'ibotlar</p></div></div>
        <div className="stat-card border-l-4 border-emerald-500"><div className="text-2xl">👥</div><div>
          <p className="text-xl font-bold">{data.reduce((s,r)=>s+r.qatnashchilar,0).toLocaleString()}</p><p className="text-xs text-gray-500">Qatnashchilar</p></div></div>
        <div className="stat-card border-l-4 border-red-500"><div className="text-2xl">🚨</div><div>
          <p className="text-xl font-bold">{data.reduce((s,r)=>s+r.murojaat_soni,0)}</p><p className="text-xs text-gray-500">Murojaatlar</p></div></div>
      </div>
      <div className="card mb-4">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{top:5,right:20,left:0,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
            <XAxis dataKey="oy" tickFormatter={v => OY_NOMI[v]} tick={{fontSize:12}}/>
            <YAxis yAxisId="left" tick={{fontSize:12}}/>
            <YAxis yAxisId="right" orientation="right" tick={{fontSize:12}}/>
            <Tooltip labelFormatter={v => `${OY_NOMI[v]} ${yil}`}/>
            <Legend/>
            <Bar yAxisId="left" dataKey="targibot_soni" name="Targ'ibotlar" fill="#6366f1" radius={[4,4,0,0]}/>
            <Bar yAxisId="left" dataKey="qatnashchilar" name="Qatnashchilar" fill="#34d399" radius={[4,4,0,0]}/>
            <Line yAxisId="right" type="monotone" dataKey="murojaat_soni" name="Murojaatlar" stroke="#ef4444" strokeWidth={2} dot={{r:4}}/>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead><tr>
            {['Oy',"Targ'ibotlar",'Qatnashchilar','Murojaatlar'].map(h=>(
              <th key={h} className="table-header text-left">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {data.map((r,i)=>(
              <tr key={i} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{r.oy_nomi}</td>
                <td className="table-cell"><span className="badge-blue">{r.targibot_soni}</span></td>
                <td className="table-cell">{r.qatnashchilar.toLocaleString()}</td>
                <td className="table-cell">
                  {r.murojaat_soni>0?<span className="badge-red">{r.murojaat_soni}</span>:<span className="text-gray-400">0</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Tab: Haftalik holat ──────────────────────────────────────────────────────
function TabHaftalik() {
  const [data, setData]       = useState([])
  const [viloyatlar, setVils] = useState([])
  const [vid, setVid]         = useState('')
  const role = localStorage.getItem('role')

  const load = (v=vid) =>
    api.get(`/haftalik-holat/?${v ? `viloyat=${v}` : ''}`).then(r => setData(r.data.rows||[]))

  useEffect(() => {
    load()
    if (role === 'respublika') api.get('/viloyatlar/').then(r => setVils(r.data))
  }, [])

  const fmt = (d) => {
    if (!d) return ''
    const dt = new Date(d)
    return `${dt.getDate().toString().padStart(2,'0')}.${(dt.getMonth()+1).toString().padStart(2,'0')}`
  }

  return (
    <div>
      {role === 'respublika' && (
        <div className="card mb-4 flex gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Viloyat</label>
            <select value={vid} onChange={e => { setVid(e.target.value); load(e.target.value) }} className="input-field py-2 pr-8">
              <option value=''>Barcha viloyatlar</option>
              {viloyatlar.map(v => <option key={v.id} value={v.id}>{v.viloyat_nomi}</option>)}
            </select>
          </div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card border-l-4 border-blue-500"><div className="text-2xl">📢</div><div>
          <p className="text-xl font-bold">{data.reduce((s,r)=>s+r.targibot_soni,0).toLocaleString()}</p><p className="text-xs text-gray-500">12 haftada targ'ibotlar</p></div></div>
        <div className="stat-card border-l-4 border-emerald-500"><div className="text-2xl">👥</div><div>
          <p className="text-xl font-bold">{data.reduce((s,r)=>s+r.qatnashchilar,0).toLocaleString()}</p><p className="text-xs text-gray-500">Qatnashchilar</p></div></div>
        <div className="stat-card border-l-4 border-red-500"><div className="text-2xl">🚨</div><div>
          <p className="text-xl font-bold">{data.reduce((s,r)=>s+r.murojaat_soni,0)}</p><p className="text-xs text-gray-500">Murojaatlar</p></div></div>
      </div>
      <div className="card mb-4">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data.map(r=>({...r, label:fmt(r.hafta_boshlash)}))} margin={{top:5,right:20,left:0,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
            <XAxis dataKey="label" tick={{fontSize:11}}/>
            <YAxis yAxisId="left" tick={{fontSize:12}}/>
            <YAxis yAxisId="right" orientation="right" tick={{fontSize:12}}/>
            <Tooltip labelFormatter={(_,p) => p?.[0]?.payload?.hafta_boshlash||''} formatter={(v,n)=>[v.toLocaleString(),n]}/>
            <Legend/>
            <Bar yAxisId="left" dataKey="targibot_soni" name="Targ'ibotlar" fill="#6366f1" radius={[4,4,0,0]}/>
            <Bar yAxisId="left" dataKey="qatnashchilar" name="Qatnashchilar" fill="#34d399" radius={[4,4,0,0]}/>
            <Line yAxisId="right" type="monotone" dataKey="murojaat_soni" name="Murojaatlar" stroke="#ef4444" strokeWidth={2} dot={{r:4}}/>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead><tr>
            {['Hafta boshi',"Targ'ibotlar",'Qatnashchilar','Murojaatlar'].map(h=>(
              <th key={h} className="table-header text-left">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {data.map((r,i)=>(
              <tr key={i} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{r.hafta_boshlash}</td>
                <td className="table-cell"><span className="badge-blue">{r.targibot_soni}</span></td>
                <td className="table-cell">{r.qatnashchilar.toLocaleString()}</td>
                <td className="table-cell">
                  {r.murojaat_soni>0?<span className="badge-red">{r.murojaat_soni}</span>:<span className="text-gray-400">0</span>}
                </td>
              </tr>
            ))}
            {data.length===0&&<tr><td colSpan={4} className="text-center py-10 text-gray-400">Ma'lumot topilmadi</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Asosiy komponent ─────────────────────────────────────────────────────────
export default function Hisobot() {
  const [tab, setTab] = useState('mahalla')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Hisobot</h1>
        {/* Tab menyu */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'mahalla'      && <TabMahalla/>}
      {tab === 'samaradorlik' && <TabSamaradorlik/>}
      {tab === 'xavfli'       && <TabXavfli/>}
      {tab === 'oylik'        && <TabOylik/>}
      {tab === 'haftalik'     && <TabHaftalik/>}
    </div>
  )
}
