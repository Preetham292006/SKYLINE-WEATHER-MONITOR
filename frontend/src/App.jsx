import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppDataProvider } from './context/AppDataContext.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import './styles/dashboard.css'

const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))
const StationsPage = lazy(() => import('./pages/StationsPage.jsx'))
const MonitoringPage = lazy(() => import('./pages/MonitoringPage.jsx'))
const ShardsPage = lazy(() => import('./pages/ShardsPage.jsx'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.jsx'))
const GeographicalAnalyticsPage = lazy(() => import('./pages/GeographicalAnalyticsPage.jsx'))
const AlertsPage = lazy(() => import('./pages/AlertsPage.jsx'))
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'))

function App() {
  return (
    <BrowserRouter>
      <AppDataProvider>
        <Suspense fallback={<div className="page-loading"><span />Loading workspace…</div>}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="stations" element={<StationsPage />} />
              <Route path="monitoring" element={<MonitoringPage />} />
              <Route path="shards" element={<ShardsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="geographical-analytics" element={<GeographicalAnalyticsPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </AppDataProvider>
    </BrowserRouter>
  )
}

export default App
