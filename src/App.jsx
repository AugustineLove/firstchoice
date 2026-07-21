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
import ResetPassword from './pages/ResetPassword'
import VendorPage from './pages/public/VendorPage'
import CartPage from './pages/public/CartPage'
import CheckoutPage from './pages/public/CheckoutPage'
import OrdersPage from './pages/public/OrdersPage'
import DeliveriesPage from './pages/public/DeliveriesPage'
import { CartProvider } from './context/CartContext'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
        <Routes>
          {/* Public */}
          <Route path="/"              element={<HomePage />} />
          <Route path="/team"          element={<TeamPage />} />
          <Route path="/login"         element={<LoginPage />} />
          <Route path="/register"      element={<RegisterPage />} />
          <Route path="/register/:type" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/home" element={<ProtectedRoute roles={['CUSTOMER']}><CustomerHome/></ProtectedRoute>} />
          <Route path="/vendor/:id" element={<ProtectedRoute roles={['CUSTOMER']}><VendorPage/></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute roles={['CUSTOMER']}><CartPage/></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute roles={['CUSTOMER']}><CheckoutPage/></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute roles={['CUSTOMER']}><OrdersPage/></ProtectedRoute>} />
          <Route path="/deliveries" element={<ProtectedRoute roles={['CUSTOMER']}><DeliveriesPage/></ProtectedRoute>} />

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
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}