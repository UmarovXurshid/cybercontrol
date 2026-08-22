import { useState, useEffect, useMemo, useRef } from 'react'
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
  sana: today, tuman: '', mahalla: '', fish: '', jinsi: '', yosh: '', telefon: '',
  fabula: '', zarar: '', usul: '', holat: 'yangi', ijtimoiy_tarmoq: '',
  kasb: '', kasb_izoh: '', kasb_muassasa: '', kasb_kurs: ''
}

// ── Qidiruvli tanlash (nom bo'yicha filtr) ────────────────────────────────────
function SearchSelect({ options, value, onChange, placeholder = '— tanlang —', disabled = false }) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef(null)

  const selected = options.find(o => String(o.id) === String(value))

  useEffect(() => {
    const onClickOutside = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); setQuery('') }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  return (
    <div className="relative" ref={wrapRef}>
      <input
        type="text"
        disabled={disabled}
        className="input-field"
        placeholder={placeholder}
        value={open ? query : (selected?.label || '')}
        onFocus={() => setOpen(true)}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          <div
            className="px-3 py-2 text-sm text-gray-400 cursor-pointer hover:bg-gray-50"
            onMouseDown={() => { onChange(''); setOpen(false); setQuery('') }}
          >
            {placeholder}
          </div>
          {filtered.map(o => (
            <div key={o.id}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50"
              onMouseDown={() => { onChange(String(o.id)); setOpen(false); setQuery('') }}
            >
              {o.label}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-400">Topilmadi</div>
          )}
        </div>
      )}
    </div>
  )
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
        <label className="form-label">Sodir etish usuli *</label>
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
        <label className="form-label">Kasbi — toifasi *</label>
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

// ── Excel import bloki ───────────────────────────────────────────────────────
function MurojaatImport({ onDone }) {
  const [loading, setLoading] = useState(false)
  const [natija,  setNatija]  = useState(null)

  const shablonYuklab = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/murojaat/shablon/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Xato')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = 'murojaat_shablon.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Yuklab bo\'lmadi') }
  }

  const faylTanlandi = async e => {
    const fayl = e.target.files?.[0]
    e.target.value = ''
    if (!fayl) return
    setLoading(true)
    setNatija(null)
    try {
      const fd = new FormData()
      fd.append('fayl', fayl)
      const { data } = await api.post('/murojaat/import/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setNatija(data)
      if (data.created > 0) toast.success(`${data.created} ta murojaat import qilindi`)
      if (data.errors?.length) toast.error(`${data.errors.length} ta qatorda xato bor`)
      onDone?.()
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Import qilib bo\'lmadi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card mb-6 bg-indigo-50 border border-indigo-200">
      <h2 className="text-base font-semibold text-indigo-900 mb-3">📥 Eski murojaatlarni import qilish</h2>
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={shablonYuklab} className="px-4 py-2 border border-indigo-300 rounded-xl text-sm text-indigo-700 bg-white hover:bg-indigo-100">
          📄 Shablonni yuklab olish
        </button>
        <label className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 cursor-pointer">
          {loading ? '⏳ Yuklanmoqda...' : '📤 To\'ldirilgan faylni import qilish'}
          <input type="file" accept=".xlsx" onChange={faylTanlandi} disabled={loading} className="hidden" />
        </label>
      </div>
      {natija && (
        <div className="mt-3 text-sm">
          <p className="text-green-700">✅ {natija.created} ta murojaat qo'shildi.</p>
          {natija.errors?.length > 0 && (
            <div className="mt-2 text-red-600">
              <p className="font-medium">❌ {natija.errors.length} ta qatorda xato:</p>
              <ul className="list-disc list-inside mt-1 max-h-40 overflow-y-auto">
                {natija.errors.map((er, i) => (
                  <li key={i}>{er.qator}-qator: {er.sabab}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Asosiy sahifa ─────────────────────────────────────────────────────────────
export default function Murojaat() {
  const role = localStorage.getItem('role')
  const [viloyatlar,  setViloyatlar]  = useState([])
  const [tumanlar,    setTumanlar]    = useState([])
  const [mahallalar,  setMahallalar]  = useState([])
  const [usullar,     setUsullar]     = useState([])
  const [kasblar,     setKasblar]     = useState([])
  const [murojaatlar, setMurojaatlar] = useState([])

  const [form,      setForm]      = useState(EMPTY)
  const [formVersion, setFormVersion] = useState(0)
  const [editId,    setEditId]    = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [filter,    setFilter]    = useState({ start: '', end: '', viloyat_id: '', tuman_id: '' })
  const [korishObj, setKorishObj] = useState(null)
  const [fishMatch, setFishMatch] = useState({ topildi: false, natijalar: [] })
  const [page,      setPage]      = useState(1)
  const [jamiSoni,  setJamiSoni]  = useState(0)
  const PAGE_SIZE = 500

  useEffect(() => {
    if (role === 'respublika') api.get('/viloyatlar/').then(r => setViloyatlar(r.data.results || r.data))
    api.get('/tumanlar/').then(r => setTumanlar(r.data.results || r.data))
    api.get('/murojaat/usullar/').then(r => setUsullar(r.data))
    api.get('/murojaat/kasblar/').then(r => setKasblar(r.data))
    loadList()
  }, [])

  const filterTumanlar = filter.viloyat_id
    ? tumanlar.filter(t => String(t.viloyat) === String(filter.viloyat_id))
    : tumanlar

  useEffect(() => {
    if (form.tuman) {
      api.get(`/mahallalar/?tuman_id=${form.tuman}`).then(r => setMahallalar(r.data.results || r.data))
    } else {
      setMahallalar([])
    }
  }, [form.tuman])

  const loadList = async (f = filter, p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (f.start)      params.append('start', f.start)
      if (f.end)        params.append('end', f.end)
      if (f.viloyat_id) params.append('viloyat_id', f.viloyat_id)
      if (f.tuman_id)   params.append('tuman_id', f.tuman_id)
      params.append('page', p)
      params.append('page_size', PAGE_SIZE)
      const { data } = await api.get(`/murojaat/?${params}`)
      setMurojaatlar(data.results || [])
      setJamiSoni(data.count ?? (data.results ? data.results.length : 0))
      setPage(p)
    } catch { toast.error('Yuklab bo\'lmadi') }
    finally { setLoading(false) }
  }

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const checkFish = async (value) => {
    const v = (value || '').trim()
    if (v.length < 5) { setFishMatch({ topildi: false, natijalar: [] }); return }
    try {
      const params = new URLSearchParams({ fish: v })
      if (editId) params.append('exclude_id', editId)
      const { data } = await api.get(`/murojaat/fish-tekshir/?${params}`)
      setFishMatch(data)
      // Avval kiritilgan bo'lsa — avtomatik "Takroriy" deb belgilaymiz va o'sha murojaatchining
      // boshqa barcha ma'lumotlarini (sanadan tashqari) avtomatik to'ldiramiz. Xodim buni pastda
      // o'zgartira oladi (masalan fuqaro yana boshqa firibgarlik usuliga aldangan bo'lishi mumkin —
      // bu haqiqatan yangi murojaat).
      if (data.topildi) {
        const eng = data.natijalar[0]
        setForm(p => ({
          ...p,
          holat: p.holat === 'yangi' ? 'takroriy' : p.holat,
          jinsi: eng.jinsi || p.jinsi,
          yosh: eng.yosh || p.yosh,
          telefon: eng.telefon || p.telefon,
          zarar: eng.zarar ?? p.zarar,
          ijtimoiy_tarmoq: eng.ijtimoiy_tarmoq || p.ijtimoiy_tarmoq,
          tuman: eng.tuman || p.tuman,
          mahalla: eng.mahalla || p.mahalla,
          usul: eng.usul || p.usul,
          kasb: eng.kasb || p.kasb,
          kasb_izoh: eng.kasb_izoh || p.kasb_izoh,
          kasb_muassasa: eng.kasb_muassasa || p.kasb_muassasa,
          kasb_kurs: eng.kasb_kurs || p.kasb_kurs,
        }))
      }
    } catch { /* jim - tekshiruv ishlamasa ham forma ishlashda davom etadi */ }
  }

  const save = async () => {
    // "Kasb bo'yicha izoh" dan tashqari barcha maydonlar majburiy
    const majburiy = [
      ['sana', 'Sana'], ['tuman', 'Tuman'], ['mahalla', 'Mahalla'],
      ['fish', 'F.I.SH'], ['jinsi', 'Jinsi'], ['yosh', 'Yoshi'],
      ['telefon', 'Telefon'], ['ijtimoiy_tarmoq', 'Ijtimoiy tarmoq'],
      ['usul', 'Sodir etish usuli'], ['zarar', 'Zarar'], ['kasb', 'Kasbi'],
      ['fabula', 'Fabula'],
    ]
    for (const [k, label] of majburiy) {
      if (form[k] === '' || form[k] === null || form[k] === undefined) {
        return toast.error(`"${label}" maydoni to'ldirilishi shart`)
      }
    }
    try {
      if (editId) {
        await api.put(`/murojaat/${editId}/`, form)
        toast.success('Yangilandi')
      } else {
        await api.post('/murojaat/', form)
        toast.success('Saqlandi')
      }
      setForm(EMPTY); setEditId(null); setFormVersion(v => v + 1); setFishMatch({ topildi: false, natijalar: [] })
      loadList(filter, page)
    } catch (e) {
      const data = e?.response?.data
      const birinchiXato = data && typeof data === 'object'
        ? Object.values(data).flat().find(Boolean)
        : null
      toast.error(birinchiXato || data?.detail || 'Xatolik')
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
    setFishMatch({ topildi: false, natijalar: [] })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const del = async id => {
    if (!confirm('O\'chirilsinmi?')) return
    await api.delete(`/murojaat/${id}/`)
    toast.success('O\'chirildi')
    loadList(filter, page)
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

      {role === 'respublika' && <MurojaatImport onDone={loadList} />}

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
            <SearchSelect
              options={tumanlar.map(t => ({ id: t.id, label: t.tuman_nomi }))}
              value={form.tuman}
              onChange={id => setForm(p => ({ ...p, tuman: id }))}
            />
          </div>
          <div>
            <label className="form-label">Mahalla *</label>
            <SearchSelect
              options={mahallalar.map(m => ({ id: m.id, label: m.mahalla_nomi }))}
              value={form.mahalla}
              onChange={id => setForm(p => ({ ...p, mahalla: id }))}
              disabled={!form.tuman}
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="form-label">F.I.SH *</label>
            <input type="text" value={form.fish} onChange={set('fish')} onBlur={e => checkFish(e.target.value)}
              className="input-field" placeholder="Familiya Ism Sharif"/>
            {fishMatch.topildi && (
              <div className="mt-2 p-3 text-xs bg-amber-50 border border-amber-300 rounded-lg text-amber-800">
                <div className="font-semibold mb-1">
                  ⚠ Ushbu F.I.SH ga o'xshash {fishMatch.natijalar.length} ta oldingi murojaat topildi (aynan bir xil
                  yozilishi shart emas) — "Holat" avtomatik "Takroriy murojaat" qilib belgilandi va o'sha
                  murojaatchining oldingi ma'lumotlari (sanadan tashqari) avtomatik to'ldirildi. Agar bu fuqaro
                  haqiqatda YANGI (masalan boshqa firibgarlik usuliga aldangan) bo'lsa yoki bu boshqa odam bo'lsa,
                  ma'lumotlarni tahrirlab, pastdagi "Holat" maydonidan "Yangi"ni qayta tanlang.
                </div>
                <div className="mb-2 p-2 bg-white/60 border border-amber-200 rounded">
                  <span className="font-semibold">Oldin kiritilgan:</span> "{fishMatch.natijalar[0].fish}"
                  {' '}→{' '}
                  <span className="font-semibold">Hozir kiritilgan:</span> "{form.fish}"
                </div>
                <ul className="space-y-1 list-disc list-inside">
                  {fishMatch.natijalar.map(n => (
                    <li key={n.id}>
                      {n.sana} — {n.tuman_nomi}{n.mahalla_nomi ? ', ' + n.mahalla_nomi : ''}
                      {n.usul_nomi ? ' — ' + n.usul_nomi : ''}
                      {n.fabula ? `: "${n.fabula}"` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div>
            <label className="form-label">Jinsi *</label>
            <select value={form.jinsi} onChange={set('jinsi')} className="input-field">
              <option value="">— tanlang —</option>
              {JINSI_OPTIONS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Yoshi *</label>
            <input type="number" min="1" max="120" value={form.yosh} onChange={set('yosh')}
              className="input-field" placeholder="Masalan: 35"/>
          </div>
          <div>
            <label className="form-label">Telefon *</label>
            <input type="text" value={form.telefon} onChange={set('telefon')} className="input-field" placeholder="+998..."/>
          </div>
          <div>
            <label className="form-label">Holat</label>
            <select value={form.holat} onChange={set('holat')} className="input-field">
              {HOLAT_OPTIONS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Ijtimoiy tarmoq *</label>
            <select value={form.ijtimoiy_tarmoq} onChange={set('ijtimoiy_tarmoq')} className="input-field">
              <option value="">— tanlang —</option>
              {TARMOQ_OPTIONS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <UsulSelector
              key={formVersion}
              usullar={usullar}
              value={form.usul}
              onChange={v => setForm(p => ({ ...p, usul: v }))}
            />
          </div>
          <div>
            <label className="form-label">Zarar (so'm) *</label>
            <input type="number" value={form.zarar} onChange={set('zarar')} className="input-field" placeholder="0"/>
          </div>
        </div>

        {/* Kasb kaskad selector */}
        <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <KasbSelector
            key={formVersion}
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
          <label className="form-label">Fabula (qisqacha mazmun) *</label>
          <textarea value={form.fabula} onChange={set('fabula')} rows={3}
            className="input-field resize-none" placeholder="Voqeaning qisqacha bayoni..."/>
        </div>

        <div className="mt-4 flex gap-3">
          <button onClick={save} className="btn-primary">
            {editId ? '💾 Saqlash' : '➕ Qo\'shish'}
          </button>
          {editId && (
            <button onClick={() => { setForm(EMPTY); setEditId(null); setFormVersion(v => v + 1); setFishMatch({ topildi: false, natijalar: [] }) }}
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
        {role === 'respublika' && (
          <div>
            <label className="form-label">Viloyat</label>
            <select value={filter.viloyat_id}
              onChange={e => setFilter(p => ({ ...p, viloyat_id: e.target.value, tuman_id: '' }))} className="input-field w-48">
              <option value="">Barchasi</option>
              {viloyatlar.map(v => <option key={v.id} value={v.id}>{v.nomi}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="form-label">Tuman</label>
          <select value={filter.tuman_id}
            onChange={e => setFilter(p => ({ ...p, tuman_id: e.target.value }))} className="input-field w-48">
            <option value="">Barchasi</option>
            {filterTumanlar.map(t => <option key={t.id} value={t.id}>{t.tuman_nomi}</option>)}
          </select>
        </div>
        <button onClick={() => loadList(filter, 1)} className="btn-primary">🔍 Qidirish</button>
        <button onClick={() => { const f = { start:'', end:'', viloyat_id:'', tuman_id:'' }; setFilter(f); loadList(f, 1) }}
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
                  {role === 'respublika' && <th className="table-header text-left">Viloyat</th>}
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
                  <tr><td colSpan={role === 'respublika' ? 13 : 12} className="py-10 text-center text-gray-400">Ma'lumot yo'q</td></tr>
                ) : murojaatlar.map((m, i) => (
                  <tr key={m.id} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="table-cell text-gray-400">{i + 1}</td>
                    <td className="table-cell">{m.sana}</td>
                    {role === 'respublika' && <td className="table-cell">{m.viloyat_nomi}</td>}
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
          <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t border-gray-200 flex items-center justify-between flex-wrap gap-2">
            <span>Jami: {jamiSoni} ta murojaat{jamiSoni > PAGE_SIZE ? ` (${page}-sahifa, ${murojaatlar.length} ta ko'rsatilmoqda)` : ''}</span>
            {jamiSoni > PAGE_SIZE && (
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => loadList(filter, page - 1)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Oldingi
                </button>
                <span>{page} / {Math.ceil(jamiSoni / PAGE_SIZE)}</span>
                <button
                  disabled={page >= Math.ceil(jamiSoni / PAGE_SIZE)}
                  onClick={() => loadList(filter, page + 1)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Keyingi →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
