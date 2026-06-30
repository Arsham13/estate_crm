import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { NavLink } from 'react-router-dom'
import * as Icons from 'lucide-react'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { NAV_ITEMS } from '../../utils/constants.js'

const ICON_MAP = {
  LayoutDashboard: Icons.LayoutDashboard,
  Users: Icons.Users,
  Building2: Icons.Building2,
  FileText: Icons.FileText,
  CheckSquare: Icons.CheckSquare,
  CalendarCheck: Icons.CalendarCheck,
  TrendingUp: Icons.TrendingUp,
  Calendar: Icons.Calendar,
  BarChart3: Icons.BarChart3,
  Settings: Icons.Settings,
}

/**
 * MainLayout — چیدمان اصلی برنامه
 * - Sidebar در دسکتاپ، Drawer در موبایل
 * - Header بالا
 * - Bottom navigation در موبایل
 * - footer چسبان به پایین
 */
export default function MainLayout() {
  const { canAccess } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('crm_sidebar_collapsed') === 'true'
  })

  // persist وضعیت جمع‌شدن سایدبار در localStorage
  useEffect(() => {
    localStorage.setItem('crm_sidebar_collapsed', String(collapsed))
  }, [collapsed])

  const marginRight = collapsed ? 'lg:mr-20' : 'lg:mr-64'
  const visibleItems = NAV_ITEMS.filter((item) => canAccess(item.key))

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className={`flex-1 flex flex-col transition-[margin] duration-300 ${marginRight}`}>
        <Header onMenuClick={() => setMobileOpen(true)} sidebarCollapsed={collapsed} />

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>

        {/* Sticky footer */}
        <footer className="mt-auto border-t border-border bg-surface py-4 px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-content-muted">
            <p>© {new Date().getFullYear().toLocaleString('fa-IR', { useGrouping: false })} املاک CRM — تمام حقوق محفوظ است.</p>
            <p>ساخته‌شده با React + Vite + Tailwind</p>
          </div>
        </footer>
      </div>

      {/* Bottom navigation موبایل */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-border flex items-center justify-around px-1 py-1.5">
        {visibleItems.slice(0, 5).map((item) => {
          const Icon = ICON_MAP[item.icon] || Icons.Circle
          return (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) =>
                `press-effect flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg cursor-pointer transition-colors flex-1 ${
                  isActive ? 'text-gold-600' : 'text-content-muted'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] leading-tight">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* فضای خالی پایین برای جبران bottom nav */}
      <div className="lg:hidden h-16" />
    </div>
  )
}
