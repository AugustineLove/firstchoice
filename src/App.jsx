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
import VendorOnboarding from './pages/public/VendorOnboarding'
import ResetPassword from './pages/ResetPassword'

// ── New: customer web app ──────────────────────────────────────
import { CartProvider } from './context/CartContext'
import { SocketProvider } from './context/SocketContext'
import VendorPage from './pages/customer/VendorPage'
import CartPage from './pages/customer/CartPage'
import CheckoutPage from './pages/customer/CheckoutPage'
import OrdersPage from './pages/customer/OrdersPage'
import OrderTrackingPage from './pages/customer/OrderTrackingPage'
import DeliveriesPage from './pages/customer/DeliveriesPage'
import ProfilePage from './pages/customer/Profile/ProfilePage'
import NotificationsPage from './pages/customer/NotificationsPage'
import CustomerHome from './pages/customer/CustomerHome'
import CustomerShell from './components/CustomerShell'
import NotificationToast from './components/NotificationToast'
import InstallPrompt from './components/InstallPrompt'
import { useNotifications } from './providers/useNotifications'
import ProfileEditPage from './pages/customer/Profile/ProfileEditingPage'

export default function App() {
  const { toast, dismissToast, openToast } = useNotifications();

  return (
    <>
    <ThemeProvider>
      <AuthProvider>
        {/* Cart/Socket only matter for the customer experience, but wrapping
            the whole tree is harmless — CartContext is a no-op until items
            are added, and SocketContext no-ops until `user` is set. */}
        <CartProvider>
          <SocketProvider>
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

              {/* Customer — wrapped in CustomerShell for the bottom nav bar.
                  NOTE: /vendor/:id below is nested under the customer's own
                  browse flow, so it's separate from /vendor/dashboard above
                  even though they share the "/vendor" prefix. */}
              <Route element={
                <ProtectedRoute roles={['CUSTOMER']}>
                  <CustomerShell />
                </ProtectedRoute>
              }>
                <Route path="/home"          element={<CustomerHome />} />
                <Route path="/orders"        element={<OrdersPage />} />
                <Route path="/deliveries"    element={<DeliveriesPage />} />
                <Route path="/profile"       element={<ProfilePage />} />
                <Route path="/profile/edit"       element={<ProfileEditPage />} />
              </Route>

              {/* Customer — pushed on top, no bottom nav (mirrors mobile's
                  context.push() screens vs. the ShellRoute tabs) */}
              <Route path="/vendor/:id" element={
                <ProtectedRoute roles={['CUSTOMER']}><VendorPage /></ProtectedRoute>
              } />
              <Route path="/cart" element={
                <ProtectedRoute roles={['CUSTOMER']}><CartPage /></ProtectedRoute>
              } />
              <Route path="/checkout" element={
                <ProtectedRoute roles={['CUSTOMER']}><CheckoutPage /></ProtectedRoute>
              } />
              <Route path="/orders/:id" element={
                <ProtectedRoute roles={['CUSTOMER']}><OrderTrackingPage /></ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute roles={['CUSTOMER']}><NotificationsPage /></ProtectedRoute>
              } />
            </Routes>
    <NotificationToast toast={toast} onOpen={openToast} onDismiss={dismissToast} />
      <InstallPrompt />
          </SocketProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </>
  )
}