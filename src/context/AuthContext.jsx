import React, { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService.js'

const AuthContext = createContext(undefined)

const STORAGE_KEY = 'crm_user'
const REMEMBER_KEY = 'crm_remember'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  })
  const [loading, setLoading] = useState(false)

  // لاگین: در صورت موفقیت، اطلاعات کاربر ذخیره می‌شود
  const login = async ({ email, password, remember }) => {
    setLoading(true)
    try {
      const result = await authService.login(email, password)
      setUser(result)
      if (remember) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
        localStorage.setItem(REMEMBER_KEY, '1')
      } else {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result))
      }
      return result
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(REMEMBER_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
  }

  const hasRole = (roles) => {
    if (!user) return false
    if (!roles || roles.length === 0) return true
    return roles.includes(user.role)
  }

  // بررسی دسترسی به صفحه خاص
  const canAccess = (pageKey) => {
    if (!user) return false
    const access = {
      admin: ['dashboard', 'customers', 'properties', 'contracts', 'tasks', 'visits', 'pipeline', 'calendar', 'reports', 'settings'],
      advisor: ['dashboard', 'customers', 'properties', 'contracts', 'tasks', 'visits', 'pipeline', 'calendar', 'reports'],
      assistant: ['dashboard', 'customers', 'properties', 'contracts', 'tasks', 'visits', 'pipeline', 'calendar'],
    }
    return (access[user.role] || []).includes(pageKey)
  }

  // آیا کاربر اجازه نوشتن (افزودن/ویرایش/حذف) دارد؟ دستیار فقط خواندن
  const canWrite = () => {
    if (!user) return false
    return user.role !== 'assistant'
  }

  useEffect(() => {
    if (user) {
      const store = localStorage.getItem(REMEMBER_KEY) ? localStorage : sessionStorage
      store.setItem(STORAGE_KEY, JSON.stringify(user))
    }
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        hasRole,
        canAccess,
        canWrite,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth باید داخل AuthProvider استفاده شود')
  return ctx
}
