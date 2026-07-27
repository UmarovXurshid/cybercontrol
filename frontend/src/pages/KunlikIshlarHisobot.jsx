import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import DateFilter from '../components/DateFilter'

const today = new Date().toISOString().slice(0, 10)

function Row({ label, val }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-3 bg-green-50 rounded">
      <span className="text-sm text-gray-700">{label}</span>
      <span className="text-sm font-bold text-green-800">{val}</span>
    </div>
  )
}

function Section({ title, color = 'blue', children }) {
  const colors = {
    blue: 'bg-blue-700', green: 'bg-green-700', indigo: 'bg-indigo-700',
    orange: 'bg-orange-600', purple: 'bg-purple-700', gray: 'bg-gray-700',
  }
  return (
    <div className="mb-6">
      <div className={`${colors[color]} text-white text-sm font-semibold px-4 py-2 rounded-t-lg`}>
        {title}
      </div>
      <div className="border border-gray-200 rounded-b-lg bg-white divide-y divide-gray-100">
        {children}
      </div>
    </div>
  )
}

export default function KunlikIshlarHisobot() {
  const [start, setStart] = useState(today)
  const [end, setEnd]     = useState(today)
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async (s = start, e = end) => {
    setLoading(true)
    try {
      const res = await api.get(`/kunlik-ishlar/oraliq/?start=${s}&end=${e}`)
      setData(res.data)
    } catch { toast.error("Ma'lumot yuklanmadi") }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const bot = data?.bot || {}
  const katNomlar = data?.kat_nomlar || {}
  const jamiUchrashuv = [1,2,3,4,5,6,7,8,9,10].reduce((s, k) => s + (bot[`kat${k}`] || 0), 0)

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Kunlik ishlar hisoboti</h1>

      <DateFilter start={start} end={end} onStart={setStart} onEnd={setEnd}
        onSearch={() => load()} onReset={() => { setStart(today); setEnd(today); load(today, today) }} />

      {loading && <div className="text-center py-16 text-gray-400">⏳ Yuklanmoqda...</div>}

      {!loading && data && (
        <>
          <div className="card flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-gray-500">Viloyat</p>
              <p className="font-semibold text-gray-900">{data.viloyat_nomi}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Davr</p>
              <p className="font-semibold text-gray-900">{data.start} — {data.end}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Kunlar soni (yuborilgan)</p>
              <p className="font-semibold text-gray-900">{data.kun_soni}</p>
            </div>
          </div>

          {/* 1. Uchrashuvlar — usul (joy turi) kesimi */}
          <Section title="1. O'tkazilgan uchrashuvlar soni — joy turi (usul) kesimi" color="blue">
            {[1,2,3,4,5,6,7,8,9,10].map(k => (
              <Row key={k} label={katNomlar[`kat${k}`] || `Kategoriya ${k}`} val={bot[`kat${k}`] || 0} />
            ))}
            <Row label="IIO boshlig'i TV murojaati" val={data.iio_tv_murojaati || 0} />
            <div className="flex items-center justify-between py-2 px-3 bg-blue-100 font-bold">
              <span className="text-sm text-blue-900">JAMI uchrashuvlar</span>
              <span className="text-lg text-blue-900">{jamiUchrashuv}</span>
            </div>
          </Section>

          {/* 2. Qatnashchilar — yosh kesimi */}
          <Section title="2. Qatnashchilar soni — yosh kesimi" color="green">
            <Row label="Jami qatnashchilar"          val={(bot.fuk_jami || 0).toLocaleString()} />
            <Row label="Offline — 18 yoshgacha"      val={(bot.off18g   || 0).toLocaleString()} />
            <Row label="Offline — 18 yoshdan katta"  val={(bot.off18k   || 0).toLocaleString()} />
            <Row label="Online — 18 yoshgacha"       val={(bot.onl18g   || 0).toLocaleString()} />
            <Row label="Online — 18 yoshdan katta"   val={(bot.onl18k   || 0).toLocaleString()} />
          </Section>

          {/* 3. OAV */}
          <Section title="3. OAV chiqishlari soni" color="indigo">
            <Row label="Televidenie"               val={data.oav_tv_soni || 0} />
            <Row label="Radio"                     val={data.oav_radio_soni || 0} />
            <Row label="Gazeta va jurnal"           val={data.oav_gazeta_jurnal_soni || 0} />
            <Row label="Internet (ijt. tarmoqlar)"  val={data.oav_internet_soni || 0} />
            <Row label="Video va kontent (jami)"    val={data.oav_video_soni || 0} />
          </Section>

          {/* 4. Materiallar */}
          <Section title="4. Tarqatilgan materiallar" color="orange">
            <Row label="Ijtimoiy tarmoqlarda aylanish soni" val={data.mat_ijtimoiy_tarmoq || 0} />
            <Row label="O'z tashabbusi bilan chiqarilgan"   val={data.mat_oz_tashabbusi || 0} />
            <Row label="Flayer va buklet"                   val={data.mat_flayer_buklet || 0} />
            <Row label="LED ekranlarda qo'yilgan roliklar"  val={data.mat_led_ekran || 0} />
            <Row label="Boshqa materiallar"                 val={data.mat_boshqa || 0} />
          </Section>

          {/* 5. Probatsiya */}
          <Section title="5. Probatsiya ro'yxatidagi shaxslar bilan suhbatlar" color="purple">
            <Row label={katNomlar['kat11'] || "Probatsiya ro'yxatidagi shaxslar"} val={bot.kat11 || 0} />
          </Section>

          {/* 6. Qo'shimcha */}
          <Section title="6. Qo'shimcha ko'rsatkichlar" color="gray">
            <Row label="IIO soha xizmatlari jalb etilgan"   val={data.iio_xizmat_soni || 0} />
            <Row label="Hamkor tashkilotlar (volontyorlar)" val={data.hamkor_tashkilot_soni || 0} />
            <Row label="Sayber jinoyatlarga oid"            val={data.sayber_soni || 0} />
          </Section>
        </>
      )}
    </div>
  )
}
