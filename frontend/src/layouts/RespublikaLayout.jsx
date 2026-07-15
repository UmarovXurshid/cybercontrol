import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  GlobeAltIcon, ChartBarIcon, UsersIcon,
  MapPinIcon, ArrowRightOnRectangleIcon, DocumentChartBarIcon,
  ClipboardDocumentListIcon, BuildingOfficeIcon, HomeModernIcon, MapIcon,
  ShieldExclamationIcon, InboxArrowDownIcon, ClipboardDocumentCheckIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'

const menu = [
  { to: '/respublika',                        icon: ChartBarIcon,                  label: 'Bosh sahifa',          end: true },
  { to: '/respublika/yangi-targibotlar',      icon: InboxArrowDownIcon,            label: "Yangi targ'ibotlar" },
  { to: '/respublika/kunlik-ishlar',          icon: ClipboardDocumentCheckIcon,    label: "Kunlik qilingan ishlar" },
  { to: '/respublika/hisobot',                icon: DocumentChartBarIcon,      label: 'Hisobot' },
  { to: '/respublika/murojaat',               icon: ShieldExclamationIcon,     label: 'Murojaatlar' },
  { to: '/respublika/murojaat-hisobot',       icon: DocumentChartBarIcon,      label: 'Murojaat hisoboti' },
  { to: '/respublika/qamrov',                 icon: MapIcon,                   label: "Qamrov ko'rinishi" },
  { to: '/respublika/audit-log',              icon: ClipboardDocumentListIcon, label: 'Audit log' },
  { to: '/respublika/tumanlar',               icon: BuildingOfficeIcon,        label: 'Tumanlar' },
  { to: '/respublika/viloyatlar',             icon: MapPinIcon,                label: 'Viloyatlar' },
  { to: '/respublika/foydalanuvchilar',       icon: UsersIcon,                 label: 'Foydalanuvchilar' },
  { to: '/respublika/hamkor-tashkilotlar',   icon: BuildingStorefrontIcon,    label: 'Hamkor tashkilotlar' },
]

export default function RespublikaLayout() {
  const nav = useNavigate()

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('viloyat_id')
    nav('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-[#1e1b4b] flex flex-col">
        <div className="px-6 py-5 border-b border-indigo-800">
          <div className="flex items-center gap-2 mb-1">
            <GlobeAltIcon className="w-5 h-5 text-indigo-300"/>
            <h1 className="text-white font-bold text-lg tracking-tight">Respublika</h1>
          </div>
          <p className="text-indigo-300 text-xs">Bosh nazorat paneli</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {menu.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) =>
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
