import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CoficabLogo } from './CoficabLogo';
import { NotificationCenter } from './NotificationCenter';
import {
  Package,
  PlusCircle,
  Scan,
  LogOut,
  User as UserIcon,
  Tv,
  Sun,
  Moon,
  Wrench,
  ClipboardList,
  Laptop,
  Shield,
  FileText,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  ArrowRightLeft,
  Clock,
  Layers,
  Trash2,
  Truck,
  AlertTriangle
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === 'ADMIN';

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('coficab_theme') as 'light' | 'dark') || 'light';
  });

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [opsDropdownOpen, setOpsDropdownOpen] = useState<boolean>(false);
  const opsDropdownRef = useRef<HTMLDivElement>(null);

  const isOpsActive = ['/maintenance', '/purchase-orders', '/responsivas-history', '/add-item'].includes(location.pathname);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('coficab_theme', theme);
  }, [theme]);

  // Close dropdown & mobile drawer automatically when navigating to another route
  useEffect(() => {
    setMobileDrawerOpen(false);
    setOpsDropdownOpen(false);
  }, [location.pathname]);

  // Close operations dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (opsDropdownRef.current && !opsDropdownRef.current.contains(e.target as Node)) {
        setOpsDropdownOpen(false);
      }
    };
    if (opsDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [opsDropdownOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileDrawerOpen]);

  // Handle ESC key to close drawer & dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileDrawerOpen(false);
        setOpsDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <header className="glass-panel app-header" style={{ borderBottom: '1px solid var(--border-color)', padding: '0.65rem 1.25rem' }}>
        {/* Left Side: Mobile Hamburger & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Abrir menú de navegación"
            title="Abrir menú"
          >
            <Menu size={22} />
          </button>

          {/* COFICAB Logo */}
          <div
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onClick={() => navigate('/inventory')}
            title="COFICAB Inventory Home"
          >
            <CoficabLogo height={40} showTagline={true} themeMode={theme} />
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="nav-links desktop-nav-links" style={{ gap: '0.6rem' }}>
          <NavLink
            to="/inventory"
            className={() => `nav-item ${location.pathname === '/inventory' || location.pathname === '/inventory-it' || location.pathname === '/loans' ? 'active' : ''}`}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.88rem' }}
          >
            <Package size={17} />
            Inventario
          </NavLink>

          <NavLink
            to="/scanner"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.88rem' }}
          >
            <Scan size={17} />
            Escanear
          </NavLink>

          {/* Operations Dropdown Menu */}
          <div ref={opsDropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className={`nav-item ${isOpsActive ? 'active' : ''}`}
              onClick={() => setOpsDropdownOpen(!opsDropdownOpen)}
              style={{
                background: opsDropdownOpen ? 'var(--bg-card-hover)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.45rem 0.75rem',
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Layers size={17} style={{ color: isOpsActive ? 'var(--primary)' : 'var(--text-muted)' }} />
              <span>Operaciones</span>
              <ChevronDown size={14} style={{ transform: opsDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
            </button>

            {opsDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                minWidth: '230px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-highlight)',
                boxShadow: '0 12px 28px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(16px)',
                zIndex: 1000,
                padding: '0.4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
                animation: 'fadeIn 0.15s ease'
              }}>
                <NavLink
                  to="/maintenance"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setOpsDropdownOpen(false)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}
                >
                  <Wrench size={16} style={{ color: '#f59e0b' }} />
                  Mantenimiento Preventivo
                </NavLink>

                <NavLink
                  to="/purchase-orders"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setOpsDropdownOpen(false)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}
                >
                  <ClipboardList size={16} style={{ color: 'var(--coficab-blue-bright)' }} />
                  Requisiciones / Compras
                </NavLink>

                <NavLink
                  to="/responsivas-history"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setOpsDropdownOpen(false)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}
                >
                  <FileText size={16} style={{ color: 'var(--coficab-copper)' }} />
                  Historial de Responsivas
                </NavLink>

                {isAdmin && (
                  <NavLink
                    to="/add-item"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => setOpsDropdownOpen(false)}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', borderTop: '1px solid var(--border-color)', marginTop: '0.2rem', paddingTop: '0.5rem' }}
                  >
                    <PlusCircle size={16} style={{ color: 'var(--primary)' }} />
                    Registrar Nuevo Activo
                  </NavLink>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Desktop User & Theme Controls */}
        <div className="desktop-user-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Notification Center Bell */}
          <NotificationCenter />

          {/* Admin Panel Quick Link */}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              style={{ color: '#c084fc', padding: '0.45rem 0.75rem', fontSize: '0.86rem' }}
              title="Panel de Administración IT"
            >
              <Shield size={17} />
              Panel
            </NavLink>
          )}

          {/* TV Kiosk Mode */}
          <NavLink
            to="/tv-dashboard"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ color: '#f43f5e', padding: '0.45rem 0.65rem' }}
            title="Modo Pantalla TV Kiosk"
          >
            <Tv size={18} />
          </NavLink>

          {/* Theme Switcher Icon-only Button */}
          <button
            className="btn btn-secondary"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Cambiar a Modo Azul Oscuro' : 'Cambiar a Modo Blanco'}
            style={{ padding: '0.45rem 0.65rem' }}
            aria-label="Cambiar tema"
          >
            {theme === 'light' ? (
              <Moon size={17} style={{ color: '#6366f1' }} />
            ) : (
              <Sun size={17} style={{ color: '#f59e0b' }} />
            )}
          </button>

          {/* User Avatar Circle */}
          <div
            title={`Usuario: ${user?.name || user?.username} (${isAdmin ? 'ADMIN DE IT' : 'CONSULTA'})`}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: isAdmin ? 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' : 'linear-gradient(135deg, #002B90 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'default',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
              fontWeight: 800,
              fontSize: '0.85rem'
            }}
          >
            {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => { logout(); navigate('/login'); }}
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem', gap: '0.35rem' }}
            title="Cerrar Sesión"
          >
            <LogOut size={15} />
            Salir
          </button>
        </div>

        {/* Mobile Header Right Fast Actions */}
        <div className="mobile-header-actions" style={{ display: 'none', alignItems: 'center', gap: '0.4rem' }}>
          <NotificationCenter />

          <button
            className="btn btn-secondary"
            onClick={() => navigate('/scanner')}
            title="Escanear Código QR"
            style={{ padding: '0.45rem 0.6rem' }}
          >
            <Scan size={17} />
          </button>

          <button
            className="btn btn-secondary"
            onClick={toggleTheme}
            title="Cambiar Tema"
            style={{ padding: '0.45rem 0.6rem' }}
          >
            {theme === 'light' ? <Moon size={17} style={{ color: '#6366f1' }} /> : <Sun size={17} style={{ color: '#f59e0b' }} />}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MOBILE SLIDE-OUT LEFT DRAWER / SIDEBAR MENU                              */}
      {/* ========================================================================= */}
      {mobileDrawerOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className="mobile-drawer-backdrop"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <aside className="mobile-drawer" aria-label="Menú principal de navegación">
            {/* Header with Logo and Close button */}
            <div className="drawer-header">
              <div onClick={() => { navigate('/inventory'); setMobileDrawerOpen(false); }} style={{ cursor: 'pointer' }}>
                <CoficabLogo height={38} showTagline={true} themeMode={theme} />
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setMobileDrawerOpen(false)}
                style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}
                aria-label="Cerrar menú"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body with Categorized Navigation */}
            <div className="drawer-body">
              {/* User Profile Card */}
              <div className="drawer-user-card">
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: isAdmin ? 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' : 'linear-gradient(135deg, #002B90 0%, #1d4ed8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0
                }}>
                  {isAdmin ? <Shield size={20} /> : <UserIcon size={20} />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.92rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {user?.name || user?.username}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: isAdmin ? '#c084fc' : '#60a5fa', fontWeight: 800 }}>
                    {isAdmin ? 'ADMINISTRADOR DE IT' : 'USUARIO DE CONSULTA'}
                  </span>
                </div>
              </div>

              {/* Group 1: Módulos de Inventario */}
              <div>
                <div className="drawer-section-title">Inventario & Escaneo</div>
                <div className="drawer-nav-group">
                  <NavLink
                    to="/inventory"
                    className={() => `drawer-nav-item ${location.pathname === '/inventory' ? 'active' : ''}`}
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    <Package size={19} style={{ color: 'var(--primary)' }} />
                    <span>Inventario de Equipos</span>
                  </NavLink>

                  <NavLink
                    to="/scanner"
                    className={({ isActive }) => `drawer-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    <Scan size={19} style={{ color: '#10b981' }} />
                    <span>Escanear Código QR</span>
                  </NavLink>

                  {isAdmin && (
                    <NavLink
                      to="/add-item"
                      className={({ isActive }) => `drawer-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileDrawerOpen(false)}
                    >
                      <PlusCircle size={19} style={{ color: 'var(--coficab-copper)' }} />
                      <span>+ Registrar Activo en IT</span>
                    </NavLink>
                  )}
                </div>
              </div>

              {/* Group 2: Operaciones & Procesos */}
              <div>
                <div className="drawer-section-title">Operaciones & Custodia</div>
                <div className="drawer-nav-group">
                  <NavLink
                    to="/maintenance"
                    className={({ isActive }) => `drawer-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    <Wrench size={19} style={{ color: '#f59e0b' }} />
                    <span>Mantenimiento Preventivo</span>
                  </NavLink>

                  <NavLink
                    to="/purchase-orders"
                    className={({ isActive }) => `drawer-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    <ClipboardList size={19} style={{ color: 'var(--coficab-blue-bright)' }} />
                    <span>Gestión de Requisiciones</span>
                  </NavLink>

                  <NavLink
                    to="/responsivas-history"
                    className={({ isActive }) => `drawer-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    <FileText size={19} style={{ color: 'var(--coficab-copper)' }} />
                    <span>Historial de Responsivas</span>
                  </NavLink>

                  <NavLink
                    to="/loans"
                    className={({ isActive }) => `drawer-nav-item ${isActive ? 'active-copper' : ''}`}
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    <ArrowRightLeft size={19} style={{ color: 'var(--coficab-copper)' }} />
                    <span>Préstamos Temporales IT</span>
                  </NavLink>
                </div>
              </div>

              {/* Group 3: Sistema & Monitoreo */}
              <div>
                <div className="drawer-section-title">Sistema & Pantallas</div>
                <div className="drawer-nav-group">
                  {isAdmin && (
                    <NavLink
                      to="/admin"
                      className={({ isActive }) => `drawer-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileDrawerOpen(false)}
                    >
                      <Shield size={19} style={{ color: '#c084fc' }} />
                      <span>Panel</span>
                    </NavLink>
                  )}

                  <NavLink
                    to="/tv-dashboard"
                    className={({ isActive }) => `drawer-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    <Tv size={19} style={{ color: '#f43f5e' }} />
                    <span>Modo TV Kiosk</span>
                  </NavLink>
                </div>
              </div>
            </div>

            {/* Drawer Footer with Theme Toggle and Logout */}
            <div className="drawer-footer">
              {/* Theme Toggle Button in Drawer */}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={toggleTheme}
                style={{ width: '100%', justifyContent: 'space-between', padding: '0.65rem 1rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem' }}>
                  {theme === 'light' ? <Moon size={18} style={{ color: '#6366f1' }} /> : <Sun size={18} style={{ color: '#f59e0b' }} />}
                  <span>{theme === 'light' ? 'Modo Azul Oscuro' : 'Modo Blanco'}</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {theme === 'light' ? 'Activar' : 'Activar'}
                </span>
              </button>

              {/* Logout Button in Drawer */}
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  logout();
                  navigate('/login');
                }}
                style={{ width: '100%', gap: '0.6rem', padding: '0.65rem 1rem' }}
              >
                <LogOut size={18} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
};
