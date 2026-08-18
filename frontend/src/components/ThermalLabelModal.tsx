import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, Tag, CheckSquare, Layers } from 'lucide-react';
import { Item } from '../services/api';
import { printQRLabels } from '../utils/printLabels';

interface ThermalLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
}

export const ThermalLabelModal: React.FC<ThermalLabelModalProps> = ({
  isOpen,
  onClose,
  items
}) => {
  const [labelSize, setLabelSize] = useState<'50x25' | '50x30' | '75x50'>('50x25');

  if (!isOpen || items.length === 0) return null;

  const handlePrint = () => {
    printQRLabels(items);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.75rem',
          marginBottom: '1.25rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Tag size={20} style={{ color: 'var(--coficab-copper)' }} />
              Impresión de Etiquetas Térmicas (Zebra / Dymo)
            </h3>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {items.length} etiqueta{items.length !== 1 ? 's' : ''} lista{items.length !== 1 ? 's' : ''} para imprimir en rollo adhesivo
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Size Selection */}
        <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
          <label className="form-label" style={{ marginBottom: '0.4rem', fontSize: '0.78rem' }}>Formato de Rollo Térmico:</label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: labelSize === '50x25' ? 'var(--coficab-copper)' : 'var(--text-main)' }}>
              <input type="radio" name="labelSize" checked={labelSize === '50x25'} onChange={() => setLabelSize('50x25')} />
              🏷️ 50 × 25 mm (2" × 1" Estándar Zebra)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: labelSize === '50x30' ? 'var(--coficab-copper)' : 'var(--text-main)' }}>
              <input type="radio" name="labelSize" checked={labelSize === '50x30'} onChange={() => setLabelSize('50x30')} />
              🏷️ 50 × 30 mm
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: labelSize === '75x50' ? 'var(--coficab-copper)' : 'var(--text-main)' }}>
              <input type="radio" name="labelSize" checked={labelSize === '75x50'} onChange={() => setLabelSize('75x50')} />
              🏷️ 75 × 50 mm (3" × 2" Grande)
            </label>
          </div>
        </div>

        {/* Live Preview of the first 2 labels */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label" style={{ marginBottom: '0.5rem', fontSize: '0.78rem' }}>Vista Previa en Escala:</label>
          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {items.slice(0, 3).map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  width: '240px',
                  height: '120px',
                  background: '#ffffff',
                  color: '#000000',
                  borderRadius: '4px',
                  border: '2px dashed #9ca3af',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  flexShrink: 0
                }}
              >
                <div style={{ width: '85px', height: '85px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <QRCodeSVG value={item.qrCodePayload} size={80} level="M" />
                </div>
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '7pt', fontWeight: 900, color: '#002b90', letterSpacing: '0.5px' }}>COFICAB</div>
                  <div style={{ fontSize: '8.5pt', fontWeight: 900, color: '#000000', margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.sku}
                  </div>
                  <div style={{ fontSize: '6.5pt', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                    {item.name}
                  </div>
                  {item.model && (
                    <div style={{ fontSize: '5.5pt', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Mod: {item.model}
                    </div>
                  )}
                  <div style={{ fontSize: '5.5pt', color: '#666', marginTop: '2px' }}>
                    {item.plant} {item.area ? `| ${item.area}` : ''}
                  </div>
                </div>
              </div>
            ))}
            {items.length > 3 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                +{items.length - 3} etiquetas más...
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Recomendación: Configurar márgenes en "Ninguno" en el diálogo de impresión.
          </span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            <button
              className="btn btn-primary"
              onClick={handlePrint}
              style={{ background: 'linear-gradient(135deg, #c98a4b 0%, #b07238 100%)', fontWeight: 800, gap: '0.4rem' }}
            >
              <Printer size={17} />
              Mandar a Imprimir ({items.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
