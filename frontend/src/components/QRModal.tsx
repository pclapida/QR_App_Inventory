import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, X, CheckCircle, Package } from 'lucide-react';
import { Item } from '../services/api';
import { printQRLabels } from '../utils/printLabels';

interface QRModalProps {
  item: Item;
  onClose: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({ item, onClose }) => {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!qrRef.current) return;
    const svgElement = qrRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 10, 10, 280, 280);
      }
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${item.sku}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    printQRLabels([item]);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px', textAlign: 'center' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer'
          }}
        >
          <X size={24} />
        </button>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#10b981',
          background: 'rgba(16, 185, 129, 0.12)',
          padding: '0.4rem 0.85rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.85rem',
          fontWeight: 700,
          marginBottom: '1rem'
        }}>
          <CheckCircle size={16} />
          ¡Artículo Registrado Exitosamente!
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem', color: '#ffffff' }}>
          {item.name}
        </h3>
        <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          SKU: <strong style={{ color: '#818cf8' }}>{item.sku}</strong> | UUID: <small style={{ fontFamily: 'monospace' }}>{item.id.substring(0, 8)}...</small>
        </p>

        {/* QR Display Card */}
        <div
          id="printable-qr-container"
          ref={qrRef}
          style={{
            background: '#ffffff',
            padding: '1.5rem',
            borderRadius: 'var(--radius-md)',
            display: 'inline-block',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            marginBottom: '1.5rem'
          }}
        >
          <QRCodeSVG
            value={item.qrCodePayload}
            size={220}
            level="H"
            includeMargin={true}
          />
          <div style={{ marginTop: '0.75rem', color: '#1e293b', fontWeight: 800, fontSize: '1rem', fontFamily: 'monospace' }}>
            {item.sku}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
            {item.name}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={handleDownload} style={{ flex: 1 }}>
            <Download size={18} />
            Descargar PNG
          </button>
          <button className="btn btn-secondary" onClick={handlePrint} style={{ flex: 1 }}>
            <Printer size={18} />
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};
