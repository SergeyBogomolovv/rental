import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './layouts/AppLayout'
import {
  AdminOverviewPage,
  AdminPropertiesPage,
  AdminRequestsPage,
  AdminUsersPage,
} from './pages/AdminPages'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import { CabinetPage } from './pages/CabinetPage'
import { CatalogPage } from './pages/CatalogPage'
import { PropertyDetailPage } from './pages/PropertyDetailPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<CatalogPage />} />
        <Route path="properties/:id" element={<PropertyDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="cabinet"
          element={
            <ProtectedRoute>
              <CabinetPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminOverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/properties"
          element={
            <ProtectedRoute adminOnly>
              <AdminPropertiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/requests"
          element={
            <ProtectedRoute adminOnly>
              <AdminRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute adminOnly>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
