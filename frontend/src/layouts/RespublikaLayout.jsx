import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  GlobeAltIcon, ChartBarIcon, UsersIcon,
  MapPinIcon, ArrowRightOnRectangleIcon, DocumentChartBarIcon,
  ClipboardDocumentListIcon, BuildingOfficeIcon, HomeModernIcon, MapIcon,
  ShieldExclamationIcon, InboxArrowDownIcon, ClipboardDocumentCheckIcon,
  BuildingStorefrontIcon, ChevronDownIcon, BookOpenIcon,
  MegaphoneIcon as TargibotIcon, DocumentChartBarIcon as HisobotIcon
} from '@heroicons/react/24/outline'

// Standalone (guruhlanmagan) punkt
const TOP_ITEMS = [
  { to: '/respublika', icon: ChartBarIcon, label: 'Bosh sahifa', end: true },
]

// Guruhlangan bo'limlar
const GROUPS = [
  {
    key: 'targibotlar',
    label: "Targ'ibotlar",
    icon: TargibotIcon,
    items: [
      { to: '/respublika/yangi-targibotlar', icon: InboxArrowDownIcon,         label: "Yangi targ'ibotlar" },
      { to: '/respublika/kunlik-ishlar',      icon: ClipboardDocumentCheckIcon, label: "Kunlik qilingan ishlar" },
    ],
  },
  {
    key: 'hisobotlar',
    label: 'Hisobotlar',
    icon: HisobotIcon,
    items: [
      { to: '/respublika/hisobot',          icon: DocumentChartBarIcon, label: 'Hisobot' },
      { to: '/respublika/murojaat-hisobot', icon: DocumentChartBarIcon, label: 'Murojaat hisoboti' },
      { to: '/respublika/qamrov',           icon: MapIcon,              label: "Qamrov ko'rinishi" },
    ],
  },
  {
    key: 'murojaat',
    label: 'Murojaatlar',
    icon: ShieldExclamationIcon,
    items: [
      { to: '/respublika/murojaat', icon: ShieldExclamationIcon, label: 'Murojaatlar' },
    ],
  },
  {
    key: 'malumotnoma',
    label: "Ma'lumotnomalar",
    icon: BookOpenIcon,
    items: [
      { to: '/respublika/tumanlar',            icon: BuildingOfficeIcon,      label: 'Tumanlar' },
      { to: '/respublika/viloyatlar',          icon: MapPinIcon,              label: 'Viloyatlar' },
      { to: '/respublika/hamkor-tashkilotlar', icon: BuildingStorefrontIcon,  label: 'Hamkor tashkilotlar' },
    ],
  },
  {
    key: 'boshqaruv',
    label: 'Boshqaruv',
    icon: ClipboardDocumentListIcon,
    items: [
      { to: '/respublika/foydalanuvchilar', icon: UsersIcon,                  label: 'Foydalanuvchilar' },
      { to: '/respublika/audit-log',        icon: ClipboardDocumentListIcon,  label: 'Audit log' },
    ],
  },
]

const STORAGE_KEY = 'sidebar_open_groups_respublika'

function loadOpenGroups(pathname) {
  let stored = {}
  try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch { stored = {} }
  // Joriy sahifa qaysi guruhga tegishli bo'lsa, o'sha guruh avtomatik ochiladi
  const activeGroup = GROUPS.find(g => g.items.some(i => i.to === pathname))
  if (activeGroup && !(activeGroup.key in stored)) stored[activeGroup.key] = true
  return stored
}

export default function RespublikaLayout() {
  const nav = useNavigate()
  const loc = useLocation()

  const [openGroups, setOpenGroups] = useState(() => loadOpenGroups(loc.pathname))

  const toggleGroup = (key) => {
    setOpenGroups(prev => {
      const next = { ...prev, [key]: !prev[key] }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

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
          {TOP_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`}>
              <Icon className="w-5 h-5 flex-shrink-0"/>
              <span>{label}</span>
            </NavLink>
          ))}

          {GROUPS.map(({ key, label, icon: GroupIcon, items }) => {
            const isOpen       = !!openGroups[key]
            const hasActiveNow = items.some(i => i.to === loc.pathname)
            return (
              <div key={key} className="pt-1">
                <button
                  onClick={() => toggleGroup(key)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold
                    transition-all duration-150 cursor-pointer
                    ${hasActiveNow ? 'text-white' : 'text-indigo-300 hover:text-white hover:bg-indigo-700/60'}`}
                >
                  <GroupIcon className="w-5 h-5 flex-shrink-0"/>
                  <span className="flex-1 text-left">{label}</span>
                  <ChevronDownIcon
                    className={`w-4 h-4 flex-shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="mt-0.5 ml-3 pl-3 border-l border-indigo-800 space-y-0.5">
                    {items.map(({ to, icon: Icon, label }) => (
                      <NavLink key={to} to={to} className={({ isActive }) =>
                        `sidebar-link ${isActive ? 'active' : ''}`}>
                        <Icon className="w-4 h-4 flex-shrink-0"/>
                        <span>{label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
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
