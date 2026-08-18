import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CoficabLogo } from '../components/CoficabLogo';
import { Lock, User, AlertCircle, ArrowRight, Sun, Moon } from 'lucide-react';

export const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('coficab_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('coficab_theme', theme);
  }, [theme]);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/inventory');
    }
    if (searchParams.get('expired') === '1') {
      setError('Su sesión ha expirado o se cerró por inactividad. Por favor ingrese nuevamente.');
    }
  }, [isAuthenticated, navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(identifier, password);
      navigate('/inventory');
    } catch (err: any) {
      console.error('Error al iniciar sesión:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('No se pudo conectar con el servidor. Verifique su conexión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      position: 'relative'
    }}>
      {/* Theme Toggle Button on Top Right of Login Page */}
      <button
        className="btn btn-secondary"
        onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          fontSize: '0.85rem'
        }}
      >
        {theme === 'light' ? (
          <>
            <Moon size={16} style={{ color: '#002B90' }} />
            Modo Azul
          </>
        ) : (
          <>
            <Sun size={16} style={{ color: '#f59e0b' }} />
            Modo Blanco
          </>
        )}
      </button>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem 2rem', borderColor: 'var(--border-copper)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <CoficabLogo height={56} showTagline={true} themeMode={theme} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            Sistema de Gestión de Inventario QR
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Control y Trazabilidad de Almacén
          </p>
        </div>

        {error && (
          <div style={{
            padding: '0.85rem 1rem',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: '#f43f5e',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Usuario o Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="ej. usuario@inventory.com"
                required
                style={{ paddingLeft: '2.5rem' }}
                autoComplete="username"
              />
              <User size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ paddingLeft: '2.5rem' }}
                autoComplete="current-password"
              />
              <Lock size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Autenticando...' : (
              <>
                Iniciar Sesión
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
