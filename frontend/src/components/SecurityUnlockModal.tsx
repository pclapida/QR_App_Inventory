import React, { useState } from 'react';
import api from '../services/api';
import {
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  AlertCircle,
  KeyRound
} from 'lucide-react';

interface SecurityUnlockModalProps {
  title?: string;
  subtitle?: string;
  onSuccess: (password?: string) => void;
  onClose: () => void;
}

export const SecurityUnlockModal: React.FC<SecurityUnlockModalProps> = ({
  title = 'Autorización de Seguridad Requerida',
  subtitle = 'Ingrese su contraseña de administrador o clave maestra para acceder a credenciales protegidas (BitLocker / Passwords).',
  onSuccess,
  onClose
}) => {
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Por favor ingrese la contraseña de autorización');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/verify-master', { password: password.trim() });
      if (res.data.success) {
        onSuccess(password.trim());
      } else {
        setError('Contraseña no válida. Acceso denegado.');
      }
    } catch (err: any) {
      console.error('Error al verificar credenciales:', err);
      setError(err.response?.data?.error || 'Contraseña incorrecta o sesión no autorizada.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '460px',
          width: '90vw',
          background: 'linear-gradient(145deg, #111d33 0%, #0c1527 100%)',
          border: '1px solid rgba(201, 138, 75, 0.4)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.7), 0 0 30px rgba(201, 138, 75, 0.2)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(201, 138, 75, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--coficab-copper)'
            }}>
              <KeyRound size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                {title}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--coficab-copper)', fontWeight: 700 }}>
                AUDITORÍA DE ACCESO PROTEGIDO
              </span>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.45, marginBottom: '1.25rem' }}>
          {subtitle}
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '6px',
            padding: '0.65rem 0.85rem',
            color: '#f87171',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.4rem' }}>
              Contraseña de Confirmación
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña o clave maestra..."
                autoFocus
                className="input"
                style={{
                  width: '100%',
                  paddingRight: '2.5rem',
                  fontFamily: showPassword ? 'inherit' : 'monospace',
                  letterSpacing: showPassword ? 'normal' : '0.15em'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #c98a4b 0%, #b07238 100%)',
                borderColor: 'var(--coficab-copper)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 700
              }}
            >
              {loading ? (
                'Verificando...'
              ) : (
                <>
                  <Lock size={16} /> Desbloquear Acceso
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
