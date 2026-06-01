import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/public/HomePage'
import TeamPage from './pages/public/TeamPage'
import { ThemeProvider } from './context/ThemeContext'
import LoginPage from './pages/public/LoginPage'
import { AuthProvider } from './context/AuthContext'
import RegisterPage from './pages/public/RegisterPage'
import ProtectedRoute from './components/ProtectedRoute'
import RiderDashboard from './pages/public/RiderDashboard'
import VendorDashboard from './pages/public/VendorDashboard'
import RiderOnboarding from './pages/public/RiderOnboarding'
import AdminDashboard from './pages/public/AdminDashboard'
import CustomerHome from './pages/public/CustomerHome'
import VendorOnboarding from './pages/public/VendorOnboarding'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/"              element={<HomePage />} />
          <Route path="/team"          element={<TeamPage />} />
          <Route path="/login"         element={<LoginPage />} />
          <Route path="/register"      element={<RegisterPage />} />
          <Route path="/register/:type" element={<RegisterPage />} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Vendor */}
          <Route path="/vendor/onboarding" element={
            <ProtectedRoute roles={['VENDOR', 'CUSTOMER']}>
              <VendorOnboarding />
            </ProtectedRoute>
          } />
          <Route path="/vendor/dashboard" element={
            <ProtectedRoute roles={['VENDOR', 'ADMIN']}>
              <VendorDashboard />
            </ProtectedRoute>
          } />

          {/* Rider */}
          <Route path="/rider/onboarding" element={
            <ProtectedRoute roles={['RIDER', 'CUSTOMER']}>
              <RiderOnboarding />
            </ProtectedRoute>
          } />
          <Route path="/rider/dashboard" element={
            <ProtectedRoute roles={['RIDER', 'ADMIN']}>
              <RiderDashboard />
            </ProtectedRoute>
          } />

          {/* Customer */}
          <Route path="/home" element={
            <ProtectedRoute roles={['CUSTOMER']}>
              <CustomerHome />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}