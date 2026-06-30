import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Forbidden from '../pages/Forbidden.jsx'

/**
 * RoleRoute — فقط نقش‌های مشخص‌شده دسترسی دارند
 * در غیر این صورت صفحه 403 نمایش داده می‌شود.
 */
export default function RoleRoute({ roles = [], children }) {
  const { hasRole } = useAuth()
  const location = useLocation()

  if (!hasRole(roles)) {
    return <Forbidden />
  }

  return children
}
