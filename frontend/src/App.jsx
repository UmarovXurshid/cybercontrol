import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './layouts/Layout'
import RespublikaLayout from './layouts/RespublikaLayout'

// Viloyat admin sahifalari
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import YangiTargibotlar from './pages/YangiTargibotlar'
import TasdiqlanganTargibotlar from './pages/TasdiqlanganTargibotlar'
import RadQilinganTargibotlar from './pages/RadQilinganTargibotlar'
import Hisobot from './pages/Hisobot'
import HisobotKunlik from './pages/HisobotKunlik'
import HisobotTumanlar from './pages/HisobotTumanlar'
import XabarYuborish from './pages/XabarYuborish'
import Mahallalar from './pages/Mahallalar'
import Tumanlar from './pages/Tumanlar'
import KunlikMalumotnoma from './pages/KunlikMalumotnoma'
import KunlikIshlar from './pages/KunlikIshlar'
import Qamrov from './pages/Qamrov'
import HamkorTashkilotlar from './pages/HamkorTashkilotlar'

import AuditLog from './pages/AuditLog'
import Samaradorlik from './pages/Samaradorlik'
import XavfliMahallalar from './pages/XavfliMahallalar'
import OylikDinamika from './pages/OylikDinamika'
import HaftalikHolat from './pages/HafalikHolat'

import Murojaat from './pages/Murojaat'
import RespublikaMurojaatHisobot from './pages/RespublikaMurojaatHisobot'

// Respublika admin sahifalari
import RespublikaDashboard from './pages/RespublikaDashboard'
import RespublikaHisobot from './pages/RespublikaHisobot'
import Viloyatlar from './pages/Viloyatlar'
import Foydalanuvchilar from './pages/Foydalanuvchilar'

/* ── Route guardlar ─────────────────────────────────────────────────────── */
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  const role  = localStorage.getItem('role')
  if (!token) return <Navigate to="/login" replace/>
  // Respublika admin viloyat paneliga kira olmasin
  if (role === 'respublika') return <Navigate to="/respublika" replace/>
  return children
}

const RespublikaRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  const role  = localStorage.getItem('role')
  if (!token) return <Navigate to="/login" replace/>
  if (role !== 'respublika') return <Navigate to="/" replace/>
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }}/>
      <Routes>
        <Route path="/login" element={<Login/>}/>

        {/* ── Viloyat admin paneli ────────────────────────────────────── */}
        <Route path="/" element={<PrivateRoute><Layout/></PrivateRoute>}>
          <Route index                                        element={<Dashboard/>}/>
          <Route path="yangi-targibotlar"                    element={<YangiTargibotlar/>}/>
          <Route path="tasdiqlangan-targibotlar"             element={<TasdiqlanganTargibotlar/>}/>
          <Route path="rad-qilingan-targibotlar"             element={<RadQilinganTargibotlar/>}/>
          <Route path="kunlik-ishlar"                        element={<KunlikIshlar/>}/>
          <Route path="hisobot"                              element={<Hisobot/>}/>
          <Route path="hisobot-kunlik"                       element={<HisobotKunlik/>}/>
          <Route path="hisobot-tumanlar"                       element={<HisobotTumanlar/>}/>
          <Route path="samaradorlik"                           element={<Samaradorlik/>}/>
          <Route path="xavfli-hududlar"                        element={<XavfliMahallalar/>}/>
          <Route path="oylik-dinamika"                         element={<OylikDinamika/>}/>
          <Route path="haftalik-holat"                         element={<HaftalikHolat/>}/>
          <Route path="murojaat"                              element={<Murojaat/>}/>
          <Route path="xabar-yuborish"                       element={<XabarYuborish/>}/>
          <Route path="tumanlar"                             element={<Tumanlar/>}/>
          <Route path="mahallalar"                           element={<Mahallalar/>}/>
          <Route path="kunlik-malumotnoma"                   element={<KunlikMalumotnoma/>}/>
          <Route path="qamrov"                               element={<Qamrov/>}/>
          <Route path="hamkor-tashkilotlar"                  element={<HamkorTashkilotlar/>}/>
          <Route path="audit-log"                            element={<AuditLog/>}/>
        </Route>

        {/* ── Respublika admin paneli ─────────────────────────────────── */}
        <Route path="/respublika" element={<RespublikaRoute><RespublikaLayout/></RespublikaRoute>}>
          <Route index                       element={<RespublikaDashboard/>}/>
          <Route path="yangi-targibotlar"    element={<YangiTargibotlar/>}/>
          <Route path="kunlik-ishlar"        element={<KunlikIshlar/>}/>
          <Route path="hisobot"              element={<RespublikaHisobot/>}/>
          <Route path="murojaat"          element={<Murojaat/>}/>
          <Route path="murojaat-hisobot"  element={<RespublikaMurojaatHisobot/>}/>
          <Route path="samaradorlik"      element={<Samaradorlik/>}/>
          <Route path="xavfli-hududlar"  element={<XavfliMahallalar/>}/>
          <Route path="oylik-dinamika"   element={<OylikDinamika/>}/>
          <Route path="haftalik-holat"   element={<HaftalikHolat/>}/>
          <Route path="qamrov"           element={<Qamrov/>}/>
          <Route path="audit-log"        element={<AuditLog/>}/>
          <Route path="tumanlar"         element={<Tumanlar/>}/>
          <Route path="viloyatlar"       element={<Viloyatlar/>}/>
          <Route path="foydalanuvchilar"    element={<Foydalanuvchilar/>}/>
          <Route path="hamkor-tashkilotlar" element={<HamkorTashkilotlar/>}/>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace/>}/>
      </Routes>
    </BrowserRouter>
  )
}
