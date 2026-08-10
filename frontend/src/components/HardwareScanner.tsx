import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Scan, CheckCircle, AlertCircle } from 'lucide-react';

interface HardwareScannerProps {
  onScan: (code: string) => void;
  loading?: boolean;
}

export const HardwareScanner: React.FC<HardwareScannerProps> = ({ onScan, loading }) => {
  const [scanInput, setScanInput] = useState<string>('');
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Maintain persistent autoFocus (RNF-04)
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    focusInput();
    const interval = setInterval(focusInput, 2000);

    const handleWindowClick = () => {
      setTimeout(focusInput, 100);
    };

    window.addEventListener('click', handleWindowClick);

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', handleWindowClick);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Hardware scanners send 'Enter' key at the end of scan string (RF-04)
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = scanInput.trim();
      if (code) {
        setLastScanned(code);
        onScan(code);
        setScanInput('');
        // Dispatch custom event for inactivity timer reset
        window.dispatchEvent(new Event('qr-scanned'));
      }
    }
  };

  return (
    <div className="glass-panel scanner-focus-box" style={{ padding: '2rem 1.5rem', marginBottom: '1.5rem' }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(79, 70, 229, 0.4) 100%)',
        color: '#818cf8',
        marginBottom: '1rem'
      }}>
        <Scan size={32} />
      </div>

      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem', color: '#f3f4f6' }}>
        Modo Lector QR Físico (Pistola USB / Bluetooth)
      </h3>

      <p style={{ color: '#9ca3af', fontSize: '0.88rem', maxWidth: '480px', margin: '0 auto 1.25rem auto' }}>
        El enfoque del cursor se mantendrá activo en todo momento. Apunte con la pistola lectora y escanee la etiqueta QR. El envío es automático al presionar <strong>Enter</strong>.
      </p>

      <div style={{ maxWidth: '420px', margin: '0 auto', position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={scanInput}
          onChange={(e) => setScanInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={loading ? 'Procesando lectura...' : 'Esperando lectura de pistola QR...'}
          disabled={loading}
          className="form-input"
          style={{
            fontSize: '1.1rem',
            textAlign: 'center',
            letterSpacing: '0.05em',
            fontWeight: 600,
            borderColor: 'var(--primary)',
            background: 'rgba(15, 23, 42, 0.9)',
            padding: '0.85rem 1rem'
          }}
        />

        <div style={{
          marginTop: '0.75rem',
          fontSize: '0.8rem',
          color: '#6366f1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
          Auto-Focus Activo de Lectura
        </div>
      </div>

      {lastScanned && (
        <div style={{
          marginTop: '1.25rem',
          padding: '0.6rem 1rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-sm)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#34d399',
          fontSize: '0.85rem'
        }}>
          <CheckCircle size={16} />
          Último código capturado: <strong>{lastScanned}</strong>
        </div>
      )}
    </div>
  );
};
