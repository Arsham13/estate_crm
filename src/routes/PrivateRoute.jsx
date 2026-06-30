import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * PrivateRoute — فقط کاربران لاگین‌شده دسترسی دارند
 * در غیر این صورت به /login هدایت می‌شوند.
 */
export default function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
