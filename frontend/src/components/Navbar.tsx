import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CoficabLogo } from './CoficabLogo';
import { Package, PlusCircle, Scan, LogOut, User as UserIcon, Tv, Sun, Moon, Wrench, ShoppingCart, Laptop, Shield } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'ADMIN';

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('coficab_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('coficab_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  if (!isAuthenticated) return null;

  return (
    <header className="glass-panel app-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
      {/* COFICAB Logo on the Top Left Corner */}
      <div style={{ cursor: 'pointer' }} onClick={() => navigate('/inventory')} title="COFICAB Inventory Home">
        <CoficabLogo height={44} showTagline={true} themeMode={theme} />
      </div>

      <nav className="nav-links">
        <NavLink
          to="/inventory"
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Package size={18} />
          Inventario Plantas
        </NavLink>

        <NavLink
          to="/inventory-it"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          style={{ color: 'var(--coficab-copper)' }}
        >
          <Laptop size={18} />
          Inventario Interno IT
        </NavLink>

        <NavLink
          to="/scanner"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Scan size={18} />
          Escanear QR
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/add-item"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <PlusCircle size={18} />
            Nuevo Artículo
          </NavLink>
        )}

        <NavLink
          to="/maintenance"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Wrench size={18} />
          Mantenimiento
        </NavLink>

        <NavLink
          to="/purchase-orders"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <ShoppingCart size={18} />
          Órdenes de Compra
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ color: '#c084fc' }}
          >
            <Shield size={18} />
            Panel Admin IT
          </NavLink>
        )}

        <NavLink
          to="/tv-dashboard"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          style={{ color: '#f43f5e' }}
        >
          <Tv size={18} />
          Modo TV Kiosk
        </NavLink>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Theme Switcher Button */}
        <button
          className="btn btn-secondary"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Cambiar a Modo Azul Oscuro' : 'Cambiar a Modo Blanco'}
          style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem', gap: '0.4rem' }}
        >
          {theme === 'light' ? (
            <>
              <Moon size={16} style={{ color: '#6366f1' }} />
              Modo Azul
            </>
          ) : (
            <>
              <Sun size={16} style={{ color: '#f59e0b' }} />
              Modo Blanco
            </>
          )}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: isAdmin ? 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' : 'linear-gradient(135deg, #002B90 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            {isAdmin ? <Shield size={15} /> : <UserIcon size={15} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.88rem' }}>{user?.name || user?.username}</span>
            <span style={{ fontSize: '0.68rem', color: isAdmin ? '#c084fc' : '#60a5fa', fontWeight: 800 }}>
              {isAdmin ? 'ADMIN DE IT' : 'USUARIO DE CONSULTA'}
            </span>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={() => { logout(); navigate('/login'); }} style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}>
          <LogOut size={16} />
          Salir
        </button>
      </div>
    </header>
  );
};
