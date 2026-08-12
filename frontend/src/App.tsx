import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InactivityTimer } from './components/InactivityTimer';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Inventory } from './pages/Inventory';
import { Scanner } from './pages/Scanner';
import { AddItem } from './pages/AddItem';
import { Maintenance } from './pages/Maintenance';
import { PurchaseOrders } from './pages/PurchaseOrders';
import { TVDashboard } from './pages/TVDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { PrintResponsiva } from './pages/PrintResponsiva';
import { ResponsivasHistory } from './pages/ResponsivasHistory';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({ children, requireAdmin }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#818cf8',
        fontSize: '1.1rem'
      }}>
        Cargando aplicación...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== 'ADMIN') {
    return <Navigate to="/inventory" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <>
      <Navbar />
      <main className="app-container">
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

          <Route path="*" element={<Navigate to="/inventory" replace />} />
        </Routes>
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
