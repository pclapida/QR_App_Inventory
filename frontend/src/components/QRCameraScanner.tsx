import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, CameraOff, Upload, AlertCircle, Image as ImageIcon, ShieldCheck } from 'lucide-react';

interface QRCameraScannerProps {
  onScan: (code: string) => void;
  loading?: boolean;
}

export const QRCameraScanner: React.FC<QRCameraScannerProps> = ({ onScan, loading }) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [fileScanError, setFileScanError] = useState<string | null>(null);
  const [processingFile, setProcessingFile] = useState<boolean>(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const startScanner = async () => {
    setCameraError(null);
    setFileScanError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader-element', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false
        });
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 260, height: 260 }
        },
        (decodedText) => {
          if (decodedText) {
            onScan(decodedText);
            window.dispatchEvent(new Event('qr-scanned'));
            stopScanner();
          }
        },
        () => {
          // Ignore frame decode errors
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error('Error al iniciar cámara:', err);
      setCameraError(
        'No se pudo abrir la cámara. Si estás en iPhone, acepta el aviso de certificado de seguridad HTTPS en Safari/Chrome al abrir la página.'
      );
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Error al detener cámara:', err);
      }
    }
  };

  // Helper to downscale large iPhone photo to optimal size (max 800px) for 100% reliable QR decoding
  const processAndResizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        const maxDim = 900;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
        }

        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], 'qr_resized.jpg', { type: 'image/jpeg' });
            resolve(resizedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.95);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };

      img.src = url;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;

    setFileScanError(null);
    setProcessingFile(true);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader-element', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false
        });
      }

      // Preprocess image for iPhone photos
      const optimizedFile = await processAndResizeImage(originalFile);

      try {
        const decodedText = await scannerRef.current.scanFile(optimizedFile, true);
        if (decodedText) {
          onScan(decodedText);
          window.dispatchEvent(new Event('qr-scanned'));
        }
      } catch (scanErr) {
        // Fallback try original file if downscaling failed
        const decodedText = await scannerRef.current.scanFile(originalFile, true);
        if (decodedText) {
          onScan(decodedText);
          window.dispatchEvent(new Event('qr-scanned'));
        }
      }
    } catch (err: any) {
      console.error('Error al procesar foto de QR:', err);
      setFileScanError(
        'No se pudo detectar el código QR en la foto. Asegúrese de enfocar bien la etiqueta QR, que haya buena iluminación y vuelva a tomar la foto de más cerca.'
      );
    } finally {
      setProcessingFile(false);
      // Reset file input so user can choose the same or new file again
      if (e.target) e.target.value = '';
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <Camera size={24} style={{ color: 'var(--emerald)' }} />
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Escáner por Cámara Móvil (iPhone / Android)
        </h3>
      </div>

      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
        <ShieldCheck size={16} style={{ color: 'var(--emerald)' }} /> Conexión Segura HTTPS Activa para Cámara Móvil
      </div>

      {cameraError && (
        <div style={{
          padding: '0.85rem 1rem',
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius-sm)',
          color: '#d97706',
          fontSize: '0.85rem',
          marginBottom: '1.25rem',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            <AlertCircle size={18} /> Nota de Permisos de Cámara:
          </div>
          <div>{cameraError}</div>
        </div>
      )}

      {fileScanError && (
        <div style={{
          padding: '0.85rem 1rem',
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: 'var(--radius-md)',
          color: '#f43f5e',
          fontSize: '0.85rem',
          marginBottom: '1.25rem',
          textAlign: 'left'
        }}>
          <strong> Error al leer la foto:</strong> {fileScanError}
        </div>
      )}

      {/* Video Viewport Container */}
      <div
        id="qr-reader-element"
        style={{
          width: '100%',
          maxWidth: '350px',
          margin: '0 auto 1rem auto',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          minHeight: isScanning ? '280px' : '0px',
          background: '#070a12',
          border: isScanning ? '2px solid #10b981' : '1px solid var(--border-color)'
        }}
      />

      {/* Control Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
        
        {!isScanning ? (
          <button
            className="btn btn-success btn-lg"
            onClick={startScanner}
            disabled={loading || processingFile}
            style={{ width: '100%', maxWidth: '340px' }}
          >
            <Camera size={20} />
            Transmitir Cámara en Vivo (HTTPS)
          </button>
        ) : (
          <button
            className="btn btn-secondary btn-lg"
            onClick={stopScanner}
            style={{ width: '100%', maxWidth: '340px' }}
          >
            <CameraOff size={20} />
            Detener Cámara
          </button>
        )}

        {/* Hidden File Input for iOS photo capture */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        <button
          className="btn btn-secondary btn-lg"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading || processingFile}
          style={{ width: '100%', maxWidth: '340px', borderColor: 'var(--border-copper)' }}
        >
          <ImageIcon size={20} style={{ color: 'var(--coficab-copper)' }} />
          {processingFile ? 'Procesando Foto...' : 'Tomar Foto / Seleccionar Foto del QR'}
        </button>

      </div>
    </div>
  );
};
