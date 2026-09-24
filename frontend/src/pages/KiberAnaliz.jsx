import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../api'
import { localDateStr } from '../utils/date'

/* ════════════════════════════════════════════════════════════════════════════
   KIBER-TAHLIL — real vaqtda targ'ibot/murojaat monitoring ekrani
   Mustaqil, to'liq ekranli sahifa — Layout/menyusiz. Boshqa sahifalarga
   ta'sir qilmaydi, faqat mavjud (read-only) API'lardan foydalanadi.
═══════════════════════════════════════════════════════════════════════════ */

const GEO_URL = '/uz-viloyatlar.geojson'

const SHAPE_MAP = {
  'andijan region':              'andijon',
  'bukhara region':              'buxoro',
  'fergana region':              "farg'ona",
  'jizzakh region':              'jizzax',
  'namangan region':             'namangan',
  'navoiy region':               'navoiy',
  'qashqadaryo region':          'qashqadaryo',
  'kashkadarya region':          'qashqadaryo',
  'republic of karakalpakstan':  "qoraqalpog'iston",
  'samarqand region':            'samarqand',
  'tashkent region':             'toshkent viloyati',
  'tashkent':                    'toshkent shahri',
  'sirdaryo region':             'sirdaryo',
  'surxondaryo region':          'surxondaryo',
  'xorazm region':               'xorazm',
}
function normDB(s = '') {
  return s.toLowerCase()
    .replace(/\s*(viloyati?|viloayti?|shahri?|shahari?|respublikasi?)\s*/g, '')
    .replace(/\s+/g, ' ').trim()
}
function normGeo(shapeName = '') {
  const key = shapeName.toLowerCase().trim()
  const mapped = SHAPE_MAP[key]
  if (mapped) return mapped
  return key.replace(/\bregion\b|\brepublic\b|\bof\b/g, '').trim().split(/\s+/)[0]
}

const NEON = { cyan: '#22e6ff', green: '#39ff8a', magenta: '#ff3ec8', amber: '#ffb020', dim: '#123049' }

/* ── Soat ─────────────────────────────────────────────────────────────────── */
function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

/* ── Sonni animatsiyali oshirib ko'rsatish ───────────────────────────────── */
function CountUp({ value }) {
  const [disp, setDisp] = useState(0)
  const ref = useRef(0)
  useEffect(() => {
    const from = ref.current
    const to = value || 0
    const dur = 600
    const t0 = performance.now()
    let raf
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur)
      setDisp(Math.round(from + (to - from) * p))
      if (p < 1) raf = requestAnimationFrame(step)
      else ref.current = to
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <>{disp.toLocaleString()}</>
}

/* ── Xarita — FitBounds ───────────────────────────────────────────────────── */
function FitBounds({ geoJson }) {
  const map = useMap()
  useEffect(() => {
    if (!geoJson) return
    try {
      const layer = L.geoJSON(geoJson)
      map.fitBounds(layer.getBounds(), { padding: [10, 10] })
    } catch (_) {}
  }, [geoJson, map])
  return null
}

/* ── Oqim kartasi (kichik, rasm bilan, ro'yxatga qo'shiladi) ─────────────── */
function FeedCard({ item }) {
  const online = item.targibot_turi === 2
  return (
    <div className="feed-card">
      {item.rasm ? (
        <img className="feed-thumb" src={`/media/images/${item.rasm}`} alt="" />
      ) : (
        <div className={`feed-thumb feed-thumb-icon ${online ? 'blue' : 'green'}`}>{online ? '🌐' : '📢'}</div>
      )}
      <div className="feed-txt">
        <div className="feed-viloyat">{item.viloyat_nomi}</div>
        <div className="feed-tuman">{item.tuman_nomi} · {item.mahalla_nomi}</div>
        <div className="feed-meta">{item.vaqt} · 👥{item.qatnashchilar || 0}</div>
      </div>
    </div>
  )
}

/* ── Xaritadan chetga uchib o'tuvchi vaqtinchalik karta ───────────────────── */
function LaunchCard({ item, side }) {
  return (
    <div className={`launch-card launch-${side}`}>
      <FeedCard item={item}/>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   ASOSIY SAHIFA
═══════════════════════════════════════════════════════════════════════════ */
export default function KiberAnaliz() {
  const now = useClock()
  const today = localDateStr()

  const [qamrov, setQamrov]     = useState([])
  const [stat, setStat]         = useState(null)
  const [geoJson, setGeoJson]   = useState(null)
  const [hover, setHover]       = useState(null)
  const [feedL, setFeedL]       = useState([])
  const [feedR, setFeedR]       = useState([])
  const [launching, setLaunching] = useState([])

  const FEED_MAX = 7
  const poolRef   = useRef([])
  const idxRef    = useRef(0)

  const role = localStorage.getItem('role')
  const backTo = role === 'respublika' ? '/respublika' : role === 'tuman' ? '/tuman' : '/'

  /* GeoJSON — bir marta */
  useEffect(() => {
    fetch(GEO_URL).then(r => r.json()).then(setGeoJson).catch(() => {})
  }, [])

  /* Asosiy ma'lumotlar — yuklash + davriy yangilash (real vaqt hissi) */
  const loadAll = useCallback(async () => {
    try {
      const [qRes, sRes, fRes] = await Promise.all([
        api.get(`/qamrov/?start=${today}&end=${today}`),
        api.get(`/murojaat/statistika/?start=${today}&end=${today}`),
        api.get(`/kiber-oqim/?start=${today}&end=${today}`),
      ])
      setQamrov(qRes.data || [])
      setStat(sRes.data || null)
      if ((fRes.data || []).length) poolRef.current = fRes.data
    } catch (_) {}
  }, [today])

  useEffect(() => {
    loadAll()
    const t = setInterval(loadAll, 45000)
    return () => clearInterval(t)
  }, [loadAll])

  /* Karta xaritadan "chiqib" chetga uchib boradi, so'ng doimiy ro'yxatga qo'shiladi
     (yangisi tepada, eskisi pastga suriladi) */
  useEffect(() => {
    const spawn = () => {
      const pool = poolRef.current
      if (!pool.length) return
      const idx = idxRef.current % pool.length
      idxRef.current += 1
      const base = pool[idx]
      const uid = `${base.id}-${idxRef.current}`
      const side = idxRef.current % 2 === 0 ? 'left' : 'right'
      setLaunching(l => [...l, { ...base, uid, side }])
      setTimeout(() => {
        setLaunching(l => l.filter(x => x.uid !== uid))
        const setSide = side === 'left' ? setFeedL : setFeedR
        setSide(list => [{ ...base, uid }, ...list].slice(0, FEED_MAX))
      }, 950)
    }
    const t = setInterval(spawn, 3200)
    const t0 = setTimeout(spawn, 1200)
    return () => { clearInterval(t); clearTimeout(t0) }
  }, [])

  const coverageMap = useMemo(() => {
    const m = {}
    qamrov.forEach(v => { m[normDB(v.nomi)] = v })
    return m
  }, [qamrov])

  const style = useCallback((feature) => {
    const uzName = normGeo(feature?.properties?.shapeName || '')
    const v = coverageMap[uzName]
    const active = v && v.qamrangan > 0
    return {
      fillColor:   active ? NEON.cyan : NEON.dim,
      fillOpacity: active ? 0.35 : 0.12,
      color:       active ? NEON.cyan : '#2a4a63',
      weight:      active ? 1.6 : 1,
    }
  }, [coverageMap])

  const onEachFeature = useCallback((feature, layer) => {
    layer.on({
      mouseover(e) {
        const uz = normGeo(e.target.feature?.properties?.shapeName || '')
        const v = coverageMap[uz]
        e.target.setStyle({ weight: 3.5, color: NEON.green, fillOpacity: 0.55 })
        e.target.bringToFront()
        const el = e.target.getElement ? e.target.getElement() : e.target._path
        if (el) el.style.filter = `drop-shadow(0 0 14px ${NEON.green})`
        setHover(v ? v : { nomi: feature?.properties?.shapeName, jami: 0, qamrangan: 0, foiz: 0 })
      },
      mouseout(e) {
        const uz = normGeo(e.target.feature?.properties?.shapeName || '')
        const v = coverageMap[uz]
        const active = v && v.qamrangan > 0
        e.target.setStyle({ weight: active ? 1.6 : 1, color: active ? NEON.cyan : '#2a4a63', fillOpacity: active ? 0.35 : 0.12 })
        const el = e.target.getElement ? e.target.getElement() : e.target._path
        if (el) el.style.filter = ''
        setHover(null)
      },
    })
  }, [coverageMap])

  const jamiTargibot = qamrov.reduce((s, v) => s + (v.qamrangan || 0), 0)
  const jamiMurojaat  = stat?.jami || 0

  return (
    <div className="kiber-root">
      <style>{CSS}</style>

      <a href={backTo} className="kiber-back">← Boshqaruv paneli</a>

      <div className="kiber-scanline" />
      <div className="kiber-grid" />

      <header className="kiber-header">
        <div className="kiber-title">
          <span className="kiber-title-main">KIBERXAVFSIZLIK&nbsp;TAHLIL&nbsp;MARKAZI</span>
          <span className="kiber-title-sub">Respublika bo'yicha real vaqt monitoringi</span>
        </div>
        <div className="kiber-clock">
          {now.toLocaleTimeString('uz-UZ')}
          <div className="kiber-date">{now.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
        </div>
      </header>

      <div className="kiber-kpis">
        <div className="kiber-kpi">
          <div className="kiber-kpi-val cyan"><CountUp value={jamiTargibot}/></div>
          <div className="kiber-kpi-lbl">Bugungi targ'ibot</div>
        </div>
        <div className="kiber-kpi">
          <div className="kiber-kpi-val magenta"><CountUp value={jamiMurojaat}/></div>
          <div className="kiber-kpi-lbl">Bugungi murojaat</div>
        </div>
        <div className="kiber-kpi">
          <div className="kiber-kpi-val green">{qamrov.length}</div>
          <div className="kiber-kpi-lbl">Faol hudud</div>
        </div>
      </div>

      {/* Chap panel — eng ko'p jabrlangan kasblar */}
      <aside className="kiber-panel kiber-panel-left">
        <div className="kiber-panel-title">⚠ Eng ko'p jabrlangan kasb toifalari</div>
        {(stat?.kasb_stat || []).slice(0, 6).map((k, i) => {
          const max = stat.kasb_stat[0]?.soni || 1
          return (
            <div key={k.nomi} className="kiber-bar-row">
              <div className="kiber-bar-lbl">{k.nomi}</div>
              <div className="kiber-bar-track">
                <div className="kiber-bar-fill magenta" style={{ width: `${(k.soni / max) * 100}%`, animationDelay: `${i * 0.1}s` }} />
              </div>
              <div className="kiber-bar-val">{k.soni}</div>
            </div>
          )
        })}
        {!stat && <div className="kiber-loading">Yuklanmoqda…</div>}
      </aside>

      {/* O'ng panel — eng ko'p uchraydigan usul */}
      <aside className="kiber-panel kiber-panel-right">
        <div className="kiber-panel-title">☠ Eng ko'p qo'llanilgan firibgarlik usuli</div>
        {(stat?.usul_stat || []).slice(0, 6).map((u, i) => {
          const max = stat.usul_stat[0]?.soni || 1
          return (
            <div key={u.nomi} className="kiber-bar-row">
              <div className="kiber-bar-lbl">{u.nomi}</div>
              <div className="kiber-bar-track">
                <div className="kiber-bar-fill amber" style={{ width: `${(u.soni / max) * 100}%`, animationDelay: `${i * 0.1}s` }} />
              </div>
              <div className="kiber-bar-val">{u.soni}</div>
            </div>
          )
        })}
        {!stat && <div className="kiber-loading">Yuklanmoqda…</div>}
      </aside>

      {/* Markaz — 3D holografik xarita */}
      <div className="kiber-map-wrap">
        <div className="kiber-map-tilt">
          <div className="kiber-map-inner">
            <MapContainer
              center={[41.6, 64.0]}
              zoom={6}
              style={{ height: '100%', width: '100%', background: 'transparent' }}
              zoomControl={false}
              attributionControl={false}
              scrollWheelZoom={true}
              dragging={true}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                maxZoom={19}
              />
              {geoJson && (
                <GeoJSON key="kiber-geo" data={geoJson} style={style} onEachFeature={onEachFeature} />
              )}
              {geoJson && <FitBounds geoJson={geoJson} />}
            </MapContainer>
          </div>
        </div>

        {hover && (
          <div className="kiber-hover-card">
            <div className="kiber-hover-nomi">{hover.nomi}</div>
            <div className="kiber-hover-row"><span>Qamrangan mahalla</span><b>{hover.qamrangan ?? 0}/{hover.jami ?? 0}</b></div>
            <div className="kiber-hover-row"><span>Qamrov darajasi</span><b>{hover.foiz ?? 0}%</b></div>
          </div>
        )}
      </div>

      {/* Xaritadan chiqib chetga uchib o'tayotgan kartalar */}
      {launching.map(f => <LaunchCard key={f.uid} item={f} side={f.side}/>)}

      {/* Jonli oqim — targ'ibot bo'lgan joydan chiqib, kichik ro'yxatga to'planadi */}
      <div className="kiber-feed kiber-feed-left">
        {feedL.map(f => <FeedCard key={f.uid} item={f}/>)}
      </div>
      <div className="kiber-feed kiber-feed-right">
        {feedR.map(f => <FeedCard key={f.uid} item={f}/>)}
      </div>

      <footer className="kiber-footer">
        Manba: CyberControl — Respublika markazlashtirilgan tizimi · Har 45 soniyada yangilanadi
      </footer>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   USLUB (faqat shu sahifaga tegishli, global CSS ga ta'sir qilmaydi)
═══════════════════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Share+Tech+Mono&display=swap');

.kiber-root {
  position: fixed; inset: 0; z-index: 9999;
  background: radial-gradient(ellipse at 50% 20%, #071b2c 0%, #010509 70%);
  overflow: hidden;
  font-family: 'Share Tech Mono', monospace;
  color: #cdeaff;
}
.kiber-grid {
  position: absolute; inset: 0; pointer-events: none; opacity: 0.25;
  background-image:
    linear-gradient(rgba(34,230,255,0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(34,230,255,0.12) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: radial-gradient(ellipse at 50% 40%, black 0%, transparent 75%);
}
.kiber-scanline {
  position: absolute; left: 0; right: 0; height: 2px; pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(57,255,138,0.55), transparent);
  animation: kiber-scan 5s linear infinite;
  z-index: 2;
}
@keyframes kiber-scan { 0% { top: -2%; } 100% { top: 102%; } }

.kiber-back {
  position: absolute; top: 18px; left: 18px; z-index: 20;
  color: #7fd8ff; text-decoration: none; font-size: 12px; letter-spacing: 0.05em;
  border: 1px solid rgba(34,230,255,0.4); padding: 6px 12px; border-radius: 6px;
  background: rgba(2,20,32,0.6); backdrop-filter: blur(4px);
  transition: all .15s;
}
.kiber-back:hover { background: rgba(34,230,255,0.15); border-color: #22e6ff; }

.kiber-header {
  position: relative; z-index: 5; display: flex; justify-content: space-between; align-items: flex-start;
  padding: 22px 32px 0 32px;
}
.kiber-title-main {
  font-family: 'Orbitron', sans-serif; font-weight: 900; font-size: 22px; letter-spacing: 0.12em;
  background: linear-gradient(90deg, #22e6ff, #39ff8a);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  display: block; text-shadow: 0 0 24px rgba(34,230,255,0.35);
}
.kiber-title-sub { display: block; font-size: 11px; color: #6fa8c9; letter-spacing: 0.08em; margin-top: 4px; }
.kiber-clock { text-align: right; font-family: 'Orbitron', sans-serif; font-size: 24px; color: #39ff8a; text-shadow: 0 0 12px rgba(57,255,138,0.5); }
.kiber-date { font-size: 11px; color: #6fa8c9; font-family: 'Share Tech Mono', monospace; margin-top: 2px; }

.kiber-kpis {
  position: relative; z-index: 5; display: flex; gap: 28px; justify-content: center;
  margin-top: 10px;
}
.kiber-kpi { text-align: center; }
.kiber-kpi-val { font-family: 'Orbitron', sans-serif; font-size: 30px; font-weight: 700; }
.kiber-kpi-val.cyan { color: #22e6ff; text-shadow: 0 0 16px rgba(34,230,255,0.55); }
.kiber-kpi-val.magenta { color: #ff3ec8; text-shadow: 0 0 16px rgba(255,62,200,0.55); }
.kiber-kpi-val.green { color: #39ff8a; text-shadow: 0 0 16px rgba(57,255,138,0.55); }
.kiber-kpi-lbl { font-size: 10.5px; color: #6fa8c9; letter-spacing: 0.06em; margin-top: 2px; }

.kiber-panel {
  position: absolute; top: 150px; bottom: 60px; width: 300px; z-index: 6;
  background: linear-gradient(180deg, rgba(4,22,36,0.75), rgba(4,22,36,0.35));
  border: 1px solid rgba(34,230,255,0.22); border-radius: 10px; padding: 14px 16px;
  backdrop-filter: blur(3px); overflow: hidden;
}
.kiber-panel-left { left: 22px; }
.kiber-panel-right { right: 22px; }
.kiber-panel-title { font-size: 11.5px; color: #7fd8ff; letter-spacing: 0.04em; margin-bottom: 14px; line-height: 1.4; }
.kiber-bar-row { margin-bottom: 12px; }
.kiber-bar-lbl { font-size: 10.5px; color: #cdeaff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px; }
.kiber-bar-track { height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
.kiber-bar-fill { height: 100%; border-radius: 3px; animation: kiber-fill 1s ease-out both; }
.kiber-bar-fill.magenta { background: linear-gradient(90deg, #ff3ec8, #ff8fd8); box-shadow: 0 0 8px rgba(255,62,200,0.6); }
.kiber-bar-fill.amber   { background: linear-gradient(90deg, #ffb020, #ffe08a); box-shadow: 0 0 8px rgba(255,176,32,0.6); }
@keyframes kiber-fill { from { width: 0 !important; } }
.kiber-bar-val { font-size: 10px; color: #6fa8c9; margin-top: 2px; text-align: right; }
.kiber-loading { font-size: 11px; color: #6fa8c9; }

.kiber-map-wrap {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  padding-top: 60px;
}
.kiber-map-tilt { perspective: 1600px; width: min(920px, calc(100vw - 1150px)); height: min(700px, 78vh); }
.kiber-map-inner {
  width: 100%; height: 100%; border-radius: 20px; overflow: hidden;
  transform: rotateX(16deg) scale(0.97);
  transform-style: preserve-3d;
  box-shadow: 0 50px 110px rgba(0,0,0,0.7), 0 0 90px rgba(34,230,255,0.18), inset 0 0 0 1px rgba(34,230,255,0.35);
  transition: transform .4s ease, box-shadow .4s ease;
  position: relative;
}
.kiber-map-inner::after {
  content: ''; position: absolute; inset: 0; pointer-events: none; border-radius: 20px;
  background: linear-gradient(160deg, rgba(34,230,255,0.10), transparent 30%, transparent 70%, rgba(57,255,138,0.10));
  animation: kiber-sheen 6s ease-in-out infinite;
}
@keyframes kiber-sheen { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
.kiber-map-tilt:hover .kiber-map-inner { transform: rotateX(7deg) scale(1); box-shadow: 0 55px 120px rgba(0,0,0,0.75), 0 0 120px rgba(34,230,255,0.28), inset 0 0 0 1px rgba(34,230,255,0.5); }

.kiber-hover-card {
  position: absolute; top: 68px; left: 50%; transform: translateX(-50%); z-index: 8;
  background: rgba(4,22,36,0.9); border: 1px solid #39ff8a; border-radius: 10px;
  padding: 10px 18px; text-align: center; box-shadow: 0 0 24px rgba(57,255,138,0.35);
}
.kiber-hover-nomi { font-family: 'Orbitron', sans-serif; font-size: 13px; color: #39ff8a; margin-bottom: 4px; }
.kiber-hover-row { font-size: 11px; color: #cdeaff; display: flex; gap: 10px; justify-content: space-between; }
.kiber-hover-row b { color: #22e6ff; }

.kiber-feed {
  position: absolute; top: 150px; bottom: 60px; width: 208px; z-index: 6;
  display: flex; flex-direction: column; gap: 7px; overflow: hidden; pointer-events: none;
}
.kiber-feed-left  { left: 336px; }
.kiber-feed-right { right: 336px; }
.feed-card {
  display: flex; gap: 8px; align-items: center; padding: 6px; border-radius: 8px;
  background: rgba(4,22,36,0.85); border: 1px solid rgba(34,230,255,0.3);
  box-shadow: 0 6px 16px rgba(0,0,0,0.4);
  animation: feed-in .45s cubic-bezier(.2,.8,.3,1) both;
}
@keyframes feed-in { from { opacity: 0; transform: translateY(-14px) scale(0.92); } to { opacity: 1; transform: none; } }
.feed-thumb { width: 36px; height: 36px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
.feed-thumb-icon { display: flex; align-items: center; justify-content: center; font-size: 16px; }
.feed-thumb-icon.green { background: radial-gradient(circle, rgba(57,255,138,0.3), rgba(57,255,138,0.05)); }
.feed-thumb-icon.blue  { background: radial-gradient(circle, rgba(34,230,255,0.3), rgba(34,230,255,0.05)); }
.feed-txt { min-width: 0; }
.feed-viloyat { font-size: 9.5px; color: #39ff8a; font-weight: bold; letter-spacing: 0.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.feed-tuman { font-size: 9px; color: #9fc9e0; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.feed-meta { font-size: 8.5px; color: #6fa8c9; margin-top: 1px; }

.launch-card {
  position: absolute; z-index: 15; pointer-events: none; width: 208px;
  left: 50%; top: 52%; transform: translate(-50%, -50%) scale(1.6);
  opacity: 0;
}
.launch-card .feed-card { animation: none; box-shadow: 0 0 30px rgba(34,230,255,0.5), 0 12px 30px rgba(0,0,0,0.5); }
.launch-left  { animation: launch-left .95s cubic-bezier(.22,.7,.25,1) forwards; }
.launch-right { animation: launch-right .95s cubic-bezier(.22,.7,.25,1) forwards; }
@keyframes launch-left {
  0%   { left: 50%; top: 52%; transform: translate(-50%,-50%) scale(1.6); opacity: 0; }
  18%  { opacity: 1; transform: translate(-50%,-50%) scale(1.6); }
  100% { left: 336px; top: 150px; transform: translate(0,0) scale(1); opacity: 1; }
}
@keyframes launch-right {
  0%   { left: 50%; top: 52%; transform: translate(-50%,-50%) scale(1.6); opacity: 0; }
  18%  { opacity: 1; transform: translate(-50%,-50%) scale(1.6); }
  100% { left: calc(100% - 544px); top: 150px; transform: translate(0,0) scale(1); opacity: 1; }
}

.kiber-footer {
  position: absolute; bottom: 14px; left: 0; right: 0; text-align: center;
  font-size: 10px; color: #3f6d87; letter-spacing: 0.05em; z-index: 5;
}

@media (max-width: 1300px) {
  .kiber-feed { display: none; }
}
@media (max-width: 900px) {
  .kiber-panel { display: none; }
  .kiber-map-tilt { width: 90vw; height: 50vh; }
}
`
