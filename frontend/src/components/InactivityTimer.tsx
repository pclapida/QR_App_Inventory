import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, AlertTriangle, LogOut, RefreshCw } from 'lucide-react';

const INACTIVITY_LIMIT_MS = 10 * 60 * 1000; // 10 minutes (600,000 ms)
const WARNING_THRESHOLD_MS = 60 * 1000; // Show warning when 60s remain

export const InactivityTimer: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  
  const lastActivityRef = useRef<number>(Date.now());
  const timerCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarning) {
      setShowWarning(false);
    }
  }, [showWarning]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Listen for user interactions (clicks, keyboard, touch, mousemove, scans)
    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'qr-scanned'
    ];

    const handleUserActivity = () => {
      resetTimer();
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Check timer every 1 second
    timerCheckIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;
      const remainingMs = INACTIVITY_LIMIT_MS - elapsed;

      if (remainingMs <= 0) {
        // 10 minutes exceeded: Force logout
        setShowWarning(false);
        if (timerCheckIntervalRef.current) clearInterval(timerCheckIntervalRef.current);
        logout();
      } else if (remainingMs <= WARNING_THRESHOLD_MS) {
        setShowWarning(true);
        setSecondsRemaining(Math.ceil(remainingMs / 1000));
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      if (timerCheckIntervalRef.current) {
        clearInterval(timerCheckIntervalRef.current);
      }
    };
  }, [isAuthenticated, logout, resetTimer]);

  if (!isAuthenticated || !showWarning) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center' }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem auto'
        }}>
          <AlertTriangle size={32} />
        </div>

        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f3f4f6' }}>
          ¡Advertencia de Inactividad!
        </h3>

        <p style={{ color: '#9ca3af', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
          Su sesión se cerrará automáticamente en <strong style={{ color: '#f59e0b', fontSize: '1.1rem' }}>{secondsRemaining} segundos</strong> por falta de interacción.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={resetTimer}
            style={{ flex: 1 }}
          >
            <RefreshCw size={18} />
            Mantener Sesión
          </button>

          <button
            className="btn btn-danger"
            onClick={() => {
              setShowWarning(false);
              logout();
            }}
          >
            <LogOut size={18} />
            Salir
          </button>
        </div>
      </div>
    </div>
  );
};
