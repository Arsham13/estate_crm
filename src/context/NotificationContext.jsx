import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { notificationService } from '../services/notificationService.js'
import { useAuth } from './AuthContext.jsx'

const NotificationContext = createContext(undefined)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }
    setLoading(true)
    try {
      const data = await notificationService.getByUser(user.id)
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.isRead).length)
    } catch (err) {
      console.error('خطا در دریافت اعلان‌ها:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchNotifications()
    if (user) {
      // بروزرسانی هر ۶۰ ثانیه
      const interval = setInterval(fetchNotifications, 60000)
      return () => clearInterval(interval)
    }
  }, [fetchNotifications, user])

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch (err) {
      console.error('خطا در علامت‌گذاری اعلان:', err)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return
    try {
      // یکی‌یکی mark as read کن چون json-server به‌صورت دسته‌ای پشتیبانی نمی‌کند
      await Promise.all(
        notifications.filter((n) => !n.isRead).map((n) => notificationService.markAsRead(n.id))
      )
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('خطا در علامت‌گذاری همه اعلان‌ها:', err)
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications باید داخل NotificationProvider استفاده شود')
  return ctx
}
