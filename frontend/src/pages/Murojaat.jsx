import { useState, useEffect, useMemo } from 'react'
import api from '../api'
import toast from 'react-hot-toast'

const today = new Date().toISOString().slice(0, 10)

const JINSI_OPTIONS  = [['erkak','Erkak'],['ayol','Ayol']]
const HOLAT_OPTIONS  = [
  ['yangi','Yangi'],['takroriy','Takroriy murojaat'],
  ['aybi','Fuqaroning o\'z aybi'],['togri','To\'g\'ridan to\'g\'ri ariza']
]
const TARMOQ_OPTIONS = [
  ['telegram','Telegram'],['instagram','Instagram'],['facebook','Facebook'],
  ['tiktok','TikTok'],['bigolive','Bigo Live'],['boshqa','Boshqa']
]

const EMPTY = {
  sana: today, tuman: '', mahalla: '', fish: '', jinsi: '', telefon: '',
  fabula: '', zarar: '', usul: '', holat: 'yangi', ijtimoiy_tarmoq: '',
  kasb: '', kasb_izoh: '', kasb_muassasa: '', kasb_kurs: ''
}

// ── Usul kaskad tanlash ───────────────────────────────────────────────────────
function UsulSelector({ usullar, value, onChange }) {
  const [sel1, setSel1] = useState('')
  const [sel2, setSel2] = useState('')

  const level1 = useMemo(() => usullar.filter(u => !u.ota_id), [usullar])
  const level2 = useMemo(() => sel1 ? usullar.filter(u => u.ota_id === Number(sel1)) : [], [sel1, usullar])

  const finalId = useMemo(() => {
    if (sel2) return Number(sel2)
    if (sel1 && level2.length === 0) return Number(sel1)
    return ''
  }, [sel1, sel2, level2])

  useEffect(() => { onChange(finalId) }, [finalId])

  // edit holati
  useEffect(() => {
    if (!value || !usullar.length) return
    const usul = usullar.find(u => u.id === Number(value))
    if (!usul) return
    if (!usul.ota_id) { setSel1(String(usul.id)); setSel2('') }
    else { setSel1(String(usul.ota_id)); setSel2(String(usul.id)) }
  }, [value, usullar])

  const pick1 = v => { setSel1(v); setSel2(''); onChange('') }

  return (
    <div className="space-y-2">
      <div>
        <label className="form-label">Sodir etish usuli</label>
        <select value={sel1} onChange={e => pick1(e.target.value)} className="input-field">
          <option value="">— tanlang —</option>
          {level1.map(u => <option key={u.id} value={u.id}>{u.nomi}</option>)}
        </select>
      </div>
      {level2.length > 0 && (
        <div>
          <label className="form-label">Aniqroq usul</label>
          <select value={sel2} onChange={e => setSel2(e.target.value)} className="input-field">
            <option value="">— tanlang —</option>
            {level2.map(u => (
              <option key={u.id} value={u.id}>{u.nomi}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

// ── Kasb kaskad tanlash ───────────────────────────────────────────────────────
function KasbSelector({ kasblar, value, onChange, izoh, onIzoh, muassasa, onMuassasa, kurs, onKurs }) {
  const [sel1, setSel1] = useState('')
  const [sel2, setSel2] = useState('')
  const [sel3, setSel3] = useState('')

  // Ierarxiya quramiz
  const childrenOf = (parentId) => kasblar.filter(k => k.ota_id === parentId)
  const level1 = useMemo(() => kasblar.filter(k => !k.ota_id), [kasblar])
  const level2 = useMemo(() => sel1 ? childrenOf(Number(sel1)) : [], [sel1, kasblar])
  const level3 = useMemo(() => sel2 ? childrenOf(Number(sel2)) : [], [sel2, kasblar])

  // Final kasb: eng oxirgi tanlangan barg
  const finalId = useMemo(() => {
    if (sel3) return Number(sel3)
    if (sel2 && level3.length === 0) return Number(sel2)
    if (sel1 && level2.length === 0) return Number(sel1)
    return ''
  }, [sel1, sel2, sel3, level2, level3])

  const finalKasb = useMemo(() => kasblar.find(k => k.id === finalId) || null, [finalId, kasblar])

  useEffect(() => { onChange(finalId) }, [finalId])

  // Boshlang'ich qiymat (edit holatida)
  useEffect(() => {
    if (!value || !kasblar.length) return
    const kasb = kasblar.find(k => k.id === Number(value))
    if (!kasb) return
    if (!kasb.ota_id) { setSel1(String(kasb.id)); setSel2(''); setSel3(''); return }
    const parent = kasblar.find(k => k.id === kasb.ota_id)
    if (!parent) return
    if (!parent.ota_id) { setSel1(String(parent.id)); setSel2(String(kasb.id)); setSel3(''); return }
    const grandparent = kasblar.find(k => k.id === parent.ota_id)
    if (grandparent) { setSel1(String(grandparent.id)); setSel2(String(parent.id)); setSel3(String(kasb.id)) }
  }, [value, kasblar])

  const pick1 = v => { setSel1(v); setSel2(''); setSel3(''); onChange('') }
  const pick2 = v => { setSel2(v); setSel3(''); onChange('') }

  const daraja2color = (d) =>
    d === 1 ? 'bg-blue-50 font-semibold text-blue-900'
    : d === 2 ? 'bg-green-50 font-medium text-green-900'
    : 'text-gray-800'

  return (
    <div className="space-y-3">
      {/* Level 1 */}
      <div>
        <label className="form-label">Kasbi — toifasi</label>
        <select value={sel1} onChange={e => pick1(e.target.value)} className="input-field">
          <option value="">— tanlang —</option>
          {level1.map(k => (
            <option key={k.id} value={k.id}>{k.nomi}</option>
          ))}
        </select>
      </div>

      {/* Level 2 */}
      {level2.length > 0 && (
        <div>
          <label className="form-label">Kasbi — turi</label>
          <select value={sel2} onChange={e => pick2(e.target.value)} className="input-field">
            <option value="">— tanlang —</option>
            {level2.map(k => (
              <option key={k.id} value={k.id}>{k.nomi}</option>
            ))}
          </select>
        </div>
      )}

      {/* Level 3 */}
      {level3.length > 0 && (
        <div>
          <label className="form-label">Kasbi — lavozim</label>
          <select value={sel3} onChange={e => setSel3(e.target.value)} className="input-field">
            <option value="">— tanlang —</option>
            {level3.map(k => (
              <option key={k.id} value={k.id}>{k.nomi}</option>
            ))}
          </select>
        </div>
      )}

      {/* Tanlangan kasb ko'rsatish */}
      {finalKasb && (
        <div className={`px-3 py-2 rounded-lg text-sm ${daraja2color(finalKasb.daraja)}`}>
          ✓ {finalKasb.nomi}
        </div>
      )}

      {/* Izoh — har doim kasb tanlangach chiqadi */}
      {finalId && (
        <div>
          <label className="form-label">Kasb bo'yicha izoh</label>
          <textarea value={izoh} onChange={e => onIzoh(e.target.value)} rows={2}
            className="input-field resize-none" placeholder="Qo'shimcha ma'lumot..."/>
        </div>
      )}

      {/* Talabalar uchun qo'shimcha */}
      {finalKasb?.is_talaba && (
        <div className="grid grid-cols-2 gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div>
            <label className="form-label text-yellow-800">O'quv muassasasi</label>
            <input type="text" value={muassasa} onChange={e => onMuassasa(e.target.value)}
              className="input-field" placeholder="Institut, litsey nomi..."/>
          </div>
          <div>
            <label className="form-label text-yellow-800">Kurs</label>
            <select value={kurs} onChange={e => onKurs(e.target.value)} className="input-field">
              <option value="">— kurs —</option>
              {[1,2,3,4,5,6].map(k => <option key={k} value={k}>{k}-kurs</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Ko'rish modali ────────────────────────────────────────────────────────────
function KorishModal({ m, kasblar, usullar, onClose }) {
  if (!m) return null
  const kasbNomi = id => kasblar.find(k => k.id === Number(id))?.nomi || '—'
  const usulNomi = id => usullar.find(u => u.id === Number(id))?.nomi || '—'
  const HOLAT_MAP = { yangi:'Yangi', takroriy:'Takroriy murojaat', aybi:"Fuqaroning o'z aybi", togri:"To'g'ridan to'g'ri ariza" }
  const TARMOQ_MAP = { telegram:'Telegram', instagram:'Instagram', facebook:'Facebook', tiktok:'TikTok', bigolive:'Bigo Live', boshqa:'Boshqa' }

  const Row = ({ label, value, highlight }) => value ? (
    <div className="flex gap-2 py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-500 text-sm w-40 shrink-0">{label}</span>
      <span className={`text-sm font-medium ${highlight || 'text-gray-900'}`}>{value}</span>
    </div>
  ) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">🚨 Murojaat tafsiloti</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>
        <div className="px-6 py-4 space-y-1">
          {/* Shaxsiy ma'lumotlar */}
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Shaxsiy ma'lumotlar</p>
          <Row label="Sana" value={m.sana}/>
          <Row label="F.I.SH" value={m.fish} highlight="text-indigo-700 font-bold"/>
          <Row label="Jinsi" value={m.jinsi === 'erkak' ? '♂ Erkak' : m.jinsi === 'ayol' ? '♀ Ayol' : null}/>
          <Row label="Yoshi" value={m.yosh != null ? `${m.yosh} yosh` : null}/>
          <Row label="Telefon" value={m.telefon} highlight="text-emerald-700"/>
          <Row label="Kasbi" value={kasbNomi(m.kasb)}/>
          {m.kasb_izoh     && <Row label="Kasb izohi" value={m.kasb_izoh}/>}
          {m.kasb_muassasa && <Row label="O'quv muassasasi" value={m.kasb_muassasa}/>}
          {m.kasb_kurs     && <Row label="Kurs" value={`${m.kasb_kurs}-kurs`}/>}

          {/* Joylashuv */}
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mt-4 mb-2 pt-2 border-t border-gray-200">Joylashuv</p>
          <Row label="Tuman" value={m.tuman_nomi}/>
          <Row label="Mahalla" value={m.mahalla_nomi}/>

          {/* Jinoyat tafsiloti */}
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mt-4 mb-2 pt-2 border-t border-gray-200">Jinoyat tafsiloti</p>
          <Row label="Sodir etish usuli" value={usulNomi(m.usul) !== '—' ? usulNomi(m.usul) : m.usul_nomi}/>
          <Row label="Ijtimoiy tarmoq" value={TARMOQ_MAP[m.ijtimoiy_tarmoq]}/>
          <Row label="Ko'rilgan zarar" value={m.zarar ? `${Number(m.zarar).toLocaleString()} so'm` : null} highlight="text-red-600 font-bold"/>
          <Row label="Holat" value={HOLAT_MAP[m.holat]}/>

          {/* Fabula */}
          {m.fabula && (
            <div className="mt-4 pt-2 border-t border-gray-200">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Fabula</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">{m.fabula}</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button onClick={onClose}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
            Yopish
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Asosiy sahifa ─────────────────────────────────────────────────────────────
export default function Murojaat() {
  const role = localStorage.getItem('role')
  const [tumanlar,    setTumanlar]    = useState([])
  const [mahallalar,  setMahallalar]  = useState([])
  const [usullar,     setUsullar]     = useState([])
  const [kasblar,     setKasblar]     = useState([])
  const [murojaatlar, setMurojaatlar] = useState([])

  const [form,      setForm]      = useState(EMPTY)
  const [editId,    setEditId]    = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [filter,    setFilter]    = useState({ start: '', end: '', tuman_id: '' })
  const [korishObj, setKorishObj] = useState(null)

  useEffect(() => {
    api.get('/tumanlar/').then(r => setTumanlar(r.data.results || r.data))
    api.get('/murojaat/usullar/').then(r => setUsullar(r.data))
    api.get('/murojaat/kasblar/').then(r => setKasblar(r.data))
    loadList()
  }, [])

  useEffect(() => {
    if (form.tuman) {
      api.get(`/mahallalar/?tuman_id=${form.tuman}`).then(r => setMahallalar(r.data.results || r.data))
    } else {
      setMahallalar([])
    }
  }, [form.tuman])

  const loadList = async (f = filter) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (f.start)    params.append('start', f.start)
      if (f.end)      params.append('end', f.end)
      if (f.tuman_id) params.append('tuman_id', f.tuman_id)
      const { data } = await api.get(`/murojaat/?${params}`)
      setMurojaatlar(data)
    } catch { toast.error('Yuklab bo\'lmadi') }
    finally { setLoading(false) }
  }

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const save = async () => {
    if (!form.sana || !form.tuman) return toast.error('Sana va tuman majburiy')
    try {
      if (editId) {
        await api.put(`/murojaat/${editId}/`, form)
        toast.success('Yangilandi')
      } else {
        await api.post('/murojaat/', form)
        toast.success('Saqlandi')
      }
      setForm(EMPTY); setEditId(null)
      loadList()
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Xatolik')
    }
  }

  const startEdit = m => {
    setEditId(m.id)
    setForm({
      sana: m.sana, tuman: m.tuman, mahalla: m.mahalla || '',
      fish: m.fish, jinsi: m.jinsi, telefon: m.telefon,
      fabula: m.fabula, zarar: m.zarar || '', usul: m.usul || '',
      holat: m.holat, ijtimoiy_tarmoq: m.ijtimoiy_tarmoq,
      kasb: m.kasb || '', kasb_izoh: m.kasb_izoh || '',
      kasb_muassasa: m.kasb_muassasa || '', kasb_kurs: m.kasb_kurs || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const del = async id => {
    if (!confirm('O\'chirilsinmi?')) return
    await api.delete(`/murojaat/${id}/`)
    toast.success('O\'chirildi')
    loadList()
  }

  // Kasb nomini topish (jadval uchun)
  const kasbNomi = id => {
    const k = kasblar.find(k => k.id === Number(id))
    return k?.nomi || '—'
  }

  return (
    <div>
      <KorishModal m={korishObj} kasblar={kasblar} usullar={usullar} onClose={() => setKorishObj(null)}/>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Kiberjinoyat murojaatlari</h1>

      {/* ── Forma (faqat viloyat admini uchun) ── */}
      {role !== 'respublika' && <div className="card mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          {editId ? '✏️ Murojaatni tahrirlash' : '➕ Yangi murojaat qo\'shish'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Sana *</label>
            <input type="date" value={form.sana} max={today} onChange={set('sana')} className="input-field"/>
          </div>
          <div>
            <label className="form-label">Tuman *</label>
            <select value={form.tuman} onChange={set('tuman')} className="input-field">
              <option value="">— tanlang —</option>
              {tumanlar.map(t => <option key={t.id} value={t.id}>{t.tuman_nomi}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Mahalla</label>
            <select value={form.mahalla} onChange={set('mahalla')} className="input-field">
              <option value="">— tanlang —</option>
              {mahallalar.map(m => <option key={m.id} value={m.id}>{m.mahalla_nomi}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">F.I.SH</label>
            <input type="text" value={form.fish} onChange={set('fish')} className="input-field" placeholder="Familiya Ism Sharif"/>
          </div>
          <div>
            <label className="form-label">Jinsi</label>
            <select value={form.jinsi} onChange={set('jinsi')} className="input-field">
              <option value="">— tanlang —</option>
              {JINSI_OPTIONS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Yoshi</label>
            <input type="number" min="1" max="120" value={form.yosh} onChange={set('yosh')}
              className="input-field" placeholder="Masalan: 35"/>
          </div>
          <div>
            <label className="form-label">Telefon</label>
            <input type="text" value={form.telefon} onChange={set('telefon')} className="input-field" placeholder="+998..."/>
          </div>
          <div>
            <label className="form-label">Holat</label>
            <select value={form.holat} onChange={set('holat')} className="input-field">
              {HOLAT_OPTIONS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Ijtimoiy tarmoq</label>
            <select value={form.ijtimoiy_tarmoq} onChange={set('ijtimoiy_tarmoq')} className="input-field">
              <option value="">— tanlang —</option>
              {TARMOQ_OPTIONS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <UsulSelector
              usullar={usullar}
              value={form.usul}
              onChange={v => setForm(p => ({ ...p, usul: v }))}
            />
          </div>
          <div>
            <label className="form-label">Zarar (so'm)</label>
            <input type="number" value={form.zarar} onChange={set('zarar')} className="input-field" placeholder="0"/>
          </div>
        </div>

        {/* Kasb kaskad selector */}
        <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <KasbSelector
            kasblar={kasblar}
            value={form.kasb}
            onChange={v => setForm(p => ({ ...p, kasb: v }))}
            izoh={form.kasb_izoh}
            onIzoh={v => setForm(p => ({ ...p, kasb_izoh: v }))}
            muassasa={form.kasb_muassasa}
            onMuassasa={v => setForm(p => ({ ...p, kasb_muassasa: v }))}
            kurs={form.kasb_kurs}
            onKurs={v => setForm(p => ({ ...p, kasb_kurs: v }))}
          />
        </div>

        {/* Fabula */}
        <div className="mt-4">
          <label className="form-label">Fabula (qisqacha mazmun)</label>
          <textarea value={form.fabula} onChange={set('fabula')} rows={3}
            className="input-field resize-none" placeholder="Voqeaning qisqacha bayoni..."/>
        </div>

        <div className="mt-4 flex gap-3">
          <button onClick={save} className="btn-primary">
            {editId ? '💾 Saqlash' : '➕ Qo\'shish'}
          </button>
          {editId && (
            <button onClick={() => { setForm(EMPTY); setEditId(null) }}
              className="px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              Bekor qilish
            </button>
          )}
        </div>
      </div>}

      {/* ── Filter ── */}
      <div className="card mb-4 flex items-end gap-4 flex-wrap">
        <div>
          <label className="form-label">Boshlanish</label>
          <input type="date" value={filter.start}
            onChange={e => setFilter(p => ({ ...p, start: e.target.value }))} className="input-field w-40"/>
        </div>
        <div>
          <label className="form-label">Oxiri</label>
          <input type="date" value={filter.end}
            onChange={e => setFilter(p => ({ ...p, end: e.target.value }))} className="input-field w-40"/>
        </div>
        <div>
          <label className="form-label">Tuman</label>
          <select value={filter.tuman_id}
            onChange={e => setFilter(p => ({ ...p, tuman_id: e.target.value }))} className="input-field w-48">
            <option value="">Barchasi</option>
            {tumanlar.map(t => <option key={t.id} value={t.id}>{t.tuman_nomi}</option>)}
          </select>
        </div>
        <button onClick={() => loadList(filter)} className="btn-primary">🔍 Qidirish</button>
        <button onClick={() => { const f = { start:'', end:'', tuman_id:'' }; setFilter(f); loadList(f) }}
          className="px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
          ✕ Tozalash
        </button>
      </div>

      {/* ── Jadval ── */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Yuklanmoqda...</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="table-header text-left">#</th>
                  <th className="table-header text-left">Sana</th>
                  <th className="table-header text-left">Tuman</th>
                  <th className="table-header text-left">F.I.SH</th>
                  <th className="table-header text-center">Jinsi</th>
                  <th className="table-header text-center">Yoshi</th>
                  <th className="table-header text-left">Kasbi</th>
                  <th className="table-header text-left">Izoh / Muassasa</th>
                  <th className="table-header text-left">Usuli</th>
                  <th className="table-header text-right">Zarar</th>
                  <th className="table-header text-center">Holat</th>
                  <th className="table-header text-center">Amal</th>
                </tr>
              </thead>
              <tbody>
                {murojaatlar.length === 0 ? (
                  <tr><td colSpan={12} className="py-10 text-center text-gray-400">Ma'lumot yo'q</td></tr>
                ) : murojaatlar.map((m, i) => (
                  <tr key={m.id} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="table-cell text-gray-400">{i + 1}</td>
                    <td className="table-cell">{m.sana}</td>
                    <td className="table-cell">{m.tuman_nomi}</td>
                    <td className="table-cell font-medium">{m.fish || '—'}</td>
                    <td className="table-cell text-center">{m.jinsi === 'erkak' ? '♂' : m.jinsi === 'ayol' ? '♀' : '—'}</td>
                    <td className="table-cell text-center">{m.yosh != null ? `${m.yosh}` : '—'}</td>
                    <td className="table-cell max-w-[140px]">
                      <div className="truncate" title={m.kasb_nomi}>{m.kasb_nomi || '—'}</div>
                      {m.kasb_kurs && (
                        <div className="text-indigo-600 text-xs">{m.kasb_kurs}-kurs</div>
                      )}
                    </td>
                    <td className="table-cell max-w-[120px]">
                      {m.kasb_muassasa && <div className="truncate text-gray-700" title={m.kasb_muassasa}>{m.kasb_muassasa}</div>}
                      {m.kasb_izoh && <div className="truncate text-gray-400 italic" title={m.kasb_izoh}>{m.kasb_izoh}</div>}
                    </td>
                    <td className="table-cell max-w-[120px] truncate" title={m.usul_nomi}>{m.usul_nomi || '—'}</td>
                    <td className="table-cell text-right">{m.zarar ? Number(m.zarar).toLocaleString() : '—'}</td>
                    <td className="table-cell text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.holat === 'yangi'    ? 'bg-blue-100 text-blue-700'
                      : m.holat === 'takroriy' ? 'bg-yellow-100 text-yellow-700'
                      : m.holat === 'aybi'     ? 'bg-gray-100 text-gray-600'
                      : 'bg-green-100 text-green-700'}`}>
                        {m.holat === 'yangi' ? 'Yangi'
                        : m.holat === 'takroriy' ? 'Takroriy'
                        : m.holat === 'aybi' ? 'O\'z aybi'
                        : 'To\'g\'ridan'}
                      </span>
                    </td>
                    <td className="table-cell text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => setKorishObj(m)}
                          className="text-blue-500 hover:text-blue-700 px-1.5 py-0.5 rounded hover:bg-blue-50" title="Ko'rish">👁</button>
                        {role !== 'respublika' && <>
                          <button onClick={() => startEdit(m)}
                            className="text-indigo-600 hover:text-indigo-800 px-1.5 py-0.5 rounded hover:bg-indigo-50">✏️</button>
                          <button onClick={() => del(m.id)}
                            className="text-red-500 hover:text-red-700 px-1.5 py-0.5 rounded hover:bg-red-50">🗑</button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t border-gray-200">
            Jami: {murojaatlar.length} ta murojaat
          </div>
        </div>
      )}
    </div>
  )
}
