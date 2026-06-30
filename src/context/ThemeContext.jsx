import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(undefined)

const STORAGE_KEY = 'crm_theme'

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    return localStorage.getItem(STORAGE_KEY) || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const setThemeExplicit = (next) => {
    if (next === 'light' || next === 'dark') setTheme(next)
  }

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, setTheme: setThemeExplicit, isDark: theme === 'dark' }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme باید داخل ThemeProvider استفاده شود')
  return ctx
}
