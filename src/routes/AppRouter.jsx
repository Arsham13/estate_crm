import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout.jsx'
import PrivateRoute from './PrivateRoute.jsx'
import RoleRoute from './RoleRoute.jsx'

import Login from '../pages/Login.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import Customers from '../pages/Customers.jsx'
import Properties from '../pages/Properties.jsx'
import Contracts from '../pages/Contracts.jsx'
import Tasks from '../pages/Tasks.jsx'
import Visits from '../pages/Visits.jsx'
import Pipeline from '../pages/Pipeline.jsx'
import CalendarPage from '../pages/Calendar.jsx'
import Reports from '../pages/Reports.jsx'
import Settings from '../pages/Settings.jsx'
import NotFound from '../pages/NotFound.jsx'
import ErrorPage from '../pages/ErrorPage.jsx'

export function AppRouter() {
  return (
    <Routes>
      {/* مسیر عمومی */}
      <Route path="/login" element={<Login />} />

      {/* مسیرهای محافظت‌شده */}
      <Route
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/contracts" element={<Contracts />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/visits" element={<Visits />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/calendar" element={<CalendarPage />} />

        {/* فقط ادمین و مشاور */}
        <Route
          path="/reports"
          element={
            <RoleRoute roles={['admin', 'advisor']}>
              <Reports />
            </RoleRoute>
          }
        />

        {/* فقط ادمین */}
        <Route
          path="/settings"
          element={
            <RoleRoute roles={['admin']}>
              <Settings />
            </RoleRoute>
          }
        />
      </Route>

      {/* خطاها */}
      <Route path="/not-found" element={<NotFound />} />
      <Route path="/error" element={<ErrorPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
