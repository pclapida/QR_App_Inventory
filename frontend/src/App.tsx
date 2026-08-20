import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InactivityTimer } from './components/InactivityTimer';
import { Navbar } from './components/Navbar';
import { RefreshCw } from 'lucide-react';

const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Inventory = lazy(() => import('./pages/Inventory').then(m => ({ default: m.Inventory })));
const Scanner = lazy(() => import('./pages/Scanner').then(m => ({ default: m.Scanner })));
const AddItem = lazy(() => import('./pages/AddItem').then(m => ({ default: m.AddItem })));
const Maintenance = lazy(() => import('./pages/Maintenance').then(m => ({ default: m.Maintenance })));
const PurchaseOrders = lazy(() => import('./pages/PurchaseOrders').then(m => ({ default: m.PurchaseOrders })));
const TVDashboard = lazy(() => import('./pages/TVDashboard').then(m => ({ default: m.TVDashboard })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const PrintResponsiva = lazy(() => import('./pages/PrintResponsiva').then(m => ({ default: m.PrintResponsiva })));
const ResponsivasHistory = lazy(() => import('./pages/ResponsivasHistory').then(m => ({ default: m.ResponsivasHistory })));
const Loans = lazy(() => import('./pages/Loans').then(m => ({ default: m.Loans })));
const CrossPlantSearch = lazy(() => import('./pages/CrossPlantSearch').then(m => ({ default: m.CrossPlantSearch })));

const PageLoader: React.FC = () => (
  <div style={{
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    color: 'var(--coficab-copper, #c98a4b)',
    fontSize: '1rem',
    fontWeight: 600
  }}>
    <RefreshCw size={32} className="spinning" style={{ animation: 'spin 1s linear infinite' }} />
    <span>Cargando módulo...</span>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({ children, requireAdmin }) => {
  const { isAuthenticated, loading, user, canManageUsers } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Support both old 'ADMIN' and new 'ADMIN_PLANTA'/'SUPERADMIN' roles
  if (requireAdmin && !canManageUsers && user?.role !== 'ADMIN') {
    return <Navigate to="/inventory" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const isTV = location.pathname.startsWith('/tv-dashboard');

  return (
    <>
      {!isTV && <Navbar />}
      <main className={isTV ? "app-container-tv" : "app-container"}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <Inventory mode="PLANT" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory-it"
            element={
              <ProtectedRoute>
                <Inventory mode="IT" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/scanner"
            element={
              <ProtectedRoute>
                <Scanner />
              </ProtectedRoute>
            }
          />

          <Route
            path="/add-item"
            element={
              <ProtectedRoute>
                <AddItem />
              </ProtectedRoute>
            }
          />

          <Route
            path="/maintenance"
            element={
              <ProtectedRoute>
                <Maintenance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/purchase-orders"
            element={
              <ProtectedRoute>
                <PurchaseOrders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/print-responsiva"
            element={
              <ProtectedRoute>
                <PrintResponsiva />
              </ProtectedRoute>
            }
          />

          <Route
            path="/responsivas-history"
            element={
              <ProtectedRoute>
                <ResponsivasHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/loans"
            element={
              <ProtectedRoute>
                <Loans />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tv-dashboard"
            element={
              <ProtectedRoute>
                <TVDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventario-global"
            element={
              <ProtectedRoute>
                <CrossPlantSearch />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/inventory" replace />} />
        </Routes>
        </Suspense>
      </main>
    </>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <InactivityTimer />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
