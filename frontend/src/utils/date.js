// Mahalliy (brauzer) vaqt zonasi bo'yicha "YYYY-MM-DD" formatidagi sana qaytaradi.
// Diqqat: Date.toISOString() UTC bo'yicha ishlaydi — O'zbekiston UTC+5 bo'lgani uchun
// mahalliy soat 00:00–04:59 oralig'ida toISOString() hali "kechagi" sanani qaytarardi.
// Shu sababli "bugungi kun" har doim shu funksiya orqali hisoblanishi kerak.
export function localDateStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function daysAgoStr(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return localDateStr(d)
}

export function monthStartStr() {
  const d = new Date()
  return localDateStr(new Date(d.getFullYear(), d.getMonth(), 1))
}
