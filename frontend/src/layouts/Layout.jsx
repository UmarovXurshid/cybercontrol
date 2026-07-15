import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  ChartBarIcon, BellIcon, CheckCircleIcon, XCircleIcon,
  DocumentChartBarIcon, CalendarDaysIcon, BuildingOfficeIcon,
  MegaphoneIcon, HomeModernIcon, ArchiveBoxIcon, ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon, MapPinIcon, MapIcon, ShieldExclamationIcon,
  ClipboardDocumentCheckIcon, BuildingStorefrontIcon
} from '@heroicons/react/24/outline'

const menu = [
  { to: '/',                         icon: ChartBarIcon,                label: "Bosh sahifa" },
  { to: '/yangi-targibotlar',        icon: BellIcon,                    label: "Yangi targ'ibotlar" },
  { to: '/tasdiqlangan-targibotlar', icon: CheckCircleIcon,             label: "Tasdiqlangan" },
  { to: '/rad-qilingan-targibotlar', icon: XCircleIcon,                 label: "Rad etilgan" },
  { to: '/kunlik-ishlar',            icon: ClipboardDocumentCheckIcon,  label: "Kunlik qilingan ishlar" },
  { to: '/hisobot',                  icon: DocumentChartBarIcon,        label: "Hisobot" },
  { to: '/hisobot-kunlik',           icon: CalendarDaysIcon,            label: "Hisobot kunlik" },
  { to: '/hisobot-tumanlar',         icon: BuildingOfficeIcon,          label: "Hisobot tumanlar" },
  { to: '/murojaat',                  icon: ShieldExclamationIcon,       label: "Murojaatlar" },
  { to: '/qamrov',                   icon: MapIcon,                     label: "Qamrov ko'rinishi" },
  { to: '/xabar-yuborish',           icon: MegaphoneIcon,               label: "Xabar yuborish" },
  { to: '/tumanlar',                 icon: MapPinIcon,                  label: "Tumanlar" },
  { to: '/mahallalar',               icon: HomeModernIcon,              label: "Mahallalar" },
  { to: '/kunlik-malumotnoma',       icon: ArchiveBoxIcon,              label: "Kunlik ma'lumotnoma" },
  { to: '/hamkor-tashkilotlar',       icon: BuildingStorefrontIcon,      label: "Hamkor tashkilotlar" },
  { to: '/audit-log',                icon: ClipboardDocumentListIcon,   label: "Audit log" },
]

export default function Layout() {
  const nav  = useNavigate()
  const role = localStorage.getItem('role')
  const viloyatNomi = localStorage.getItem('viloyat_nomi') || ''

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('viloyat_id')
    localStorage.removeItem('viloyat_nomi')
    nav('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-[#1e1b4b] flex flex-col">
        <div className="px-6 py-5 border-b border-indigo-800">
          <h1 className="text-white font-bold text-lg tracking-tight">Boshqaruv tizimi</h1>
          {viloyatNomi
            ? <p className="text-indigo-300 text-xs mt-0.5">📍 {viloyatNomi}</p>
            : <p className="text-indigo-300 text-xs mt-0.5">Viloyat paneli</p>
          }
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {menu.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`}>
              <Icon className="w-5 h-5 flex-shrink-0"/>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-indigo-800">
          <button onClick={logout}
            className="sidebar-link w-full text-red-300 hover:text-red-200 hover:bg-red-900/30">
            <ArrowRightOnRectangleIcon className="w-5 h-5"/>
            <span>Chiqish</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <Outlet/>
        </div>
      </main>
    </div>
  )
}
