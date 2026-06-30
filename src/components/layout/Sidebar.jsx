import React, { useState, useEffect } from 'react'
import * as Icons from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { NAV_ITEMS, ROLE_LABELS } from '../../utils/constants.js'
import { getInitials } from '../../utils/formatters.js'

// نقشه آیکون‌ها
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
 * Sidebar قابل جمع‌شونده (collapsible)
 * - در حالت expanded: آیکون + متن
 * - در حالت collapsed: فقط آیکون (با tooltip)
 * - state توسط parent (MainLayout) مدیریت می‌شود و در localStorage ذخیره می‌شود
 * - در موبایل به صورت Drawer باز می‌شود
 */
export default function Sidebar({ mobileOpen, setMobileOpen, collapsed, setCollapsed }) {
  const { user, canAccess, logout } = useAuth()
  const location = useLocation()

  // بستن موبایل در هنگام تغییر مسیر
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, setMobileOpen])

  const visibleItems = NAV_ITEMS.filter((item) => canAccess(item.key))

  const widthClass = collapsed ? 'lg:w-20' : 'lg:w-64'
  const expanded = !collapsed

  return (
    <>
      {/* Overlay در موبایل */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 flex flex-col bg-surface border-l border-border transition-all duration-300 w-72 ${widthClass} ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* لوگو + دکمه جمع‌کردن */}
        <div className={`flex items-center h-16 border-b border-border ${expanded ? 'justify-between px-4' : 'justify-center px-2'}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="shrink-0 w-9 h-9 rounded-xl bg-gold-600 flex items-center justify-center text-white font-bold">
              ام
            </div>
            {expanded && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-content leading-tight">املاک CRM</h1>
                <p className="text-[11px] text-content-muted">مدیریت هوشمند املاک</p>
              </div>
            )}
          </div>
          {/* دکمه toggle — فقط دسکتاپ */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="press-effect hidden absolute -left-[18px] lg:flex p-1.5 rounded-lg text-content-muted  border border-content-muted/20 bg-surface-muted hover:text-content hover:border-content-muted/50 cursor-pointer transition"
            aria-label={expanded ? 'جمع کردن سایدبار' : 'باز کردن سایدبار'}
            title={expanded ? 'جمع کردن سایدبار' : 'باز کردن سایدبار'}
          >
            {expanded ? <Icons.PanelRightClose className="w-5 h-5" /> : <Icons.PanelRightOpen className="w-5 h-5" />}
          </button>
          {/* دکمه بستن در موبایل */}
          <button
            onClick={() => setMobileOpen(false)}
            className="press-effect lg:hidden p-1.5 rounded-lg text-content-muted hover:text-content hover:bg-surface-muted cursor-pointer transition-colors"
            aria-label="بستن منو"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* آیتم‌های ناوبری */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {visibleItems.map((item) => {
            const Icon = ICON_MAP[item.icon] || Icons.Circle
            return (
              <NavLink
                key={item.key}
                to={item.path}
                className={({ isActive }) =>
                  `press-effect flex items-center rounded-xl transition-colors cursor-pointer ${
                    expanded ? 'gap-3 px-3 py-2.5' : 'justify-center px-2 py-2.5'
                  } ${
                    isActive
                      ? 'bg-gold-600 text-white shadow-sm'
                      : 'text-content hover:bg-surface-muted'
                  }`
                }
                title={!expanded ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {expanded && <span className="text-sm font-medium truncate">{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* پروفایل کاربر پایین سایدبار */}
        <div className="border-t border-border p-2">
          <div className={`flex items-center ${expanded ? 'gap-3 p-2' : 'flex-col gap-1 p-1'}`}>
            <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center text-white font-semibold text-sm">
              {getInitials(user?.name)}
            </div>
            {expanded && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-content truncate">{user?.name}</p>
                <p className="text-[11px] text-content-muted">{ROLE_LABELS[user?.role] || user?.role}</p>
              </div>
            )}
            {expanded && (
              <button
                onClick={logout}
                className="press-effect p-2 rounded-lg text-content-muted hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors"
                aria-label="خروج"
                title="خروج از حساب"
              >
                <Icons.LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
          {!expanded && (
            <button
              onClick={logout}
              className="press-effect w-full mt-1 flex justify-center p-2 rounded-lg text-content-muted hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors"
              aria-label="خروج"
              title="خروج از حساب"
            >
              <Icons.LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
