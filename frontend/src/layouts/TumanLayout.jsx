import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  ChartBarIcon, BellIcon, CheckCircleIcon, XCircleIcon,
  DocumentChartBarIcon, CalendarDaysIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon, MapIcon, ShieldExclamationIcon,
  ClipboardDocumentCheckIcon, ChevronDownIcon,
  MegaphoneIcon as TargibotIcon, DocumentChartBarIcon as HisobotIcon,
  BookOpenIcon, HomeModernIcon, ArchiveBoxIcon
} from '@heroicons/react/24/outline'

// Standalone (guruhlanmagan) punktlar
const TOP_ITEMS = [
  { to: '/tuman', icon: ChartBarIcon, label: 'Bosh sahifa' },
]

// Guruhlangan bo'limlar — viloyat panelidagi bilan bir xil, faqat bitta tuman
// doirasida ma'nosi yo'q bo'lgan bo'limlar (tumanlar ro'yxati, boshqa tumanlar
// kesimidagi yig'ma hisobot) chiqarib tashlangan
const GROUPS = [
  {
    key: 'targibotlar',
    label: "Targ'ibotlar",
    icon: TargibotIcon,
    items: [
      { to: '/tuman/yangi-targibotlar',        icon: BellIcon,                    label: "Yangi targ'ibotlar" },
      { to: '/tuman/tasdiqlangan-targibotlar', icon: CheckCircleIcon,             label: "Tasdiqlangan" },
      { to: '/tuman/rad-qilingan-targibotlar', icon: XCircleIcon,                 label: "Rad etilgan" },
      { to: '/tuman/kunlik-ishlar',            icon: ClipboardDocumentCheckIcon,  label: "Kunlik qilingan ishlar" },
    ],
  },
  {
    key: 'hisobotlar',
    label: 'Hisobotlar',
    icon: HisobotIcon,
    items: [
      { to: '/tuman/hisobot',               icon: DocumentChartBarIcon,       label: "Hisobot" },
      { to: '/tuman/hisobot-kunlik',        icon: CalendarDaysIcon,           label: "Hisobot kunlik" },
      { to: '/tuman/hisobot-kunlik-ishlar', icon: ClipboardDocumentCheckIcon, label: "Kunlik ishlar hisoboti" },
      { to: '/tuman/murojaat-hisobot',      icon: ShieldExclamationIcon,      label: "Murojaat hisoboti" },
      { to: '/tuman/qamrov',                icon: MapIcon,                    label: "Qamrov ko'rinishi" },
    ],
  },
  {
    key: 'murojaat',
    label: 'Murojaatlar',
    icon: ShieldExclamationIcon,
    items: [
      { to: '/tuman/murojaat',            icon: ShieldExclamationIcon, label: "Murojaatlar" },
      { to: '/tuman/murojaat-statistika', icon: MapIcon,                label: "Murojaat statistikasi" },
    ],
  },
  {
    key: 'malumotnoma',
    label: "Ma'lumotnomalar",
    icon: BookOpenIcon,
    items: [
      { to: '/tuman/mahallalar',         icon: HomeModernIcon, label: "Mahallalar" },
      { to: '/tuman/kunlik-malumotnoma', icon: ArchiveBoxIcon, label: "Kunlik ma'lumotnoma" },
    ],
  },
]

const STORAGE_KEY = 'sidebar_open_groups_tuman'

function loadOpenGroups(pathname) {
  let stored = {}
  try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch { stored = {} }
  const activeGroup = GROUPS.find(g => g.items.some(i => i.to === pathname))
  if (activeGroup && !(activeGroup.key in stored)) stored[activeGroup.key] = true
  return stored
}

export default function TumanLayout() {
  const nav  = useNavigate()
  const loc  = useLocation()
  const tumanNomi = localStorage.getItem('tuman_nomi') || ''

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
    localStorage.removeItem('viloyat_nomi')
    localStorage.removeItem('tuman_id')
    localStorage.removeItem('tuman_nomi')
    nav('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-[#1e1b4b] flex flex-col">
        <div className="px-6 py-5 border-b border-indigo-800">
          <h1 className="text-white font-bold text-lg tracking-tight">Boshqaruv tizimi</h1>
          {tumanNomi
            ? <p className="text-indigo-300 text-xs mt-0.5">📍 {tumanNomi}</p>
            : <p className="text-indigo-300 text-xs mt-0.5">Tuman paneli</p>
          }
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {TOP_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end className={({ isActive }) =>
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
