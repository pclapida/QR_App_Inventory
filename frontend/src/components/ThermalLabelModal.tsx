import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, Tag, CheckSquare, Layers, ShieldCheck } from 'lucide-react';
import { Item } from '../services/api';
import { printQRLabels, LabelSizeOption } from '../utils/printLabels';

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
  const [labelSize, setLabelSize] = useState<LabelSizeOption>('brother-24');

  if (!isOpen || items.length === 0) return null;

  const handlePrint = () => {
    printQRLabels(items, labelSize);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '680px' }}>
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
              Impresión de Etiquetas QR para Rotuladora & Térmica
            </h3>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {items.length} etiqueta{items.length !== 1 ? 's' : ''} seleccionada{items.length !== 1 ? 's' : ''} para rotulación de activos
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Size Selection */}
        <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <label className="form-label" style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700 }}>
              Formato / Medida de Cinta o Rollo:
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--coficab-copper)', fontWeight: 700 }}>
              ★ Brother TZe 24mm (0.94") Recomendado
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            {/* Brother 24mm */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 700,
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: labelSize === 'brother-24' ? 'var(--coficab-copper)' : 'var(--border-color)',
              background: labelSize === 'brother-24' ? 'rgba(201, 138, 75, 0.15)' : 'transparent',
              color: labelSize === 'brother-24' ? 'var(--coficab-copper)' : 'var(--text-main)'
            }}>
              <input type="radio" name="labelSize" checked={labelSize === 'brother-24'} onChange={() => setLabelSize('brother-24')} />
              <span>🏷️ Brother TZe 24mm (0.94" × 2.75")</span>
            </label>

            {/* Zebra 50x25 */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: labelSize === '50x25' ? 'var(--coficab-copper)' : 'var(--border-color)',
              background: labelSize === '50x25' ? 'rgba(201, 138, 75, 0.15)' : 'transparent',
              color: labelSize === '50x25' ? 'var(--coficab-copper)' : 'var(--text-main)'
            }}>
              <input type="radio" name="labelSize" checked={labelSize === '50x25'} onChange={() => setLabelSize('50x25')} />
              <span>🏷️ Zebra 50 × 25 mm (2" × 1")</span>
            </label>

            {/* Zebra 50x30 */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: labelSize === '50x30' ? 'var(--coficab-copper)' : 'var(--border-color)',
              background: labelSize === '50x30' ? 'rgba(201, 138, 75, 0.15)' : 'transparent',
              color: labelSize === '50x30' ? 'var(--coficab-copper)' : 'var(--text-main)'
            }}>
              <input type="radio" name="labelSize" checked={labelSize === '50x30'} onChange={() => setLabelSize('50x30')} />
              <span>🏷️ Zebra 50 × 30 mm</span>
            </label>

            {/* Zebra 75x50 */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: labelSize === '75x50' ? 'var(--coficab-copper)' : 'var(--border-color)',
              background: labelSize === '75x50' ? 'rgba(201, 138, 75, 0.15)' : 'transparent',
              color: labelSize === '75x50' ? 'var(--coficab-copper)' : 'var(--text-main)'
            }}>
              <input type="radio" name="labelSize" checked={labelSize === '75x50'} onChange={() => setLabelSize('75x50')} />
              <span>🏷️ Zebra / Dymo 75 × 50 mm (3" × 2")</span>
            </label>
          </div>
        </div>

        {/* Live Preview of the first 2-3 labels */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label" style={{ marginBottom: '0.5rem', fontSize: '0.78rem' }}>Vista Previa en Proporción Real:</label>
          <div style={{ display: 'flex', gap: '0.85rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {items.slice(0, 3).map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  width: labelSize === 'brother-24' ? '280px' : labelSize === '75x50' ? '260px' : '230px',
                  height: labelSize === 'brother-24' ? '96px' : labelSize === '75x50' ? '150px' : '110px',
                  background: '#ffffff',
                  color: '#000000',
                  borderRadius: '4px',
                  border: '2px dashed #9ca3af',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  flexShrink: 0
                }}
              >
                <div style={{ width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <QRCodeSVG value={item.qrCodePayload || `INV-${item.id}`} size={65} level="M" />
                </div>
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '6.5pt', fontWeight: 900, color: '#002b90', letterSpacing: '0.5px' }}>COFICAB IT</div>
                  <div style={{ fontSize: '8.5pt', fontWeight: 900, color: '#000000', margin: '1px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.sku}
                  </div>
                  <div style={{ fontSize: '6.5pt', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700 }}>
                    {item.name}
                  </div>
                  {item.model && (
                    <div style={{ fontSize: '5.5pt', color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Mod: {item.model}
                    </div>
                  )}
                  <div style={{ fontSize: '5.5pt', color: '#666', marginTop: '1px' }}>
                    {item.plant || 'Planta 2'} {item.area ? `| ${item.area}` : ''}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            💡 En el diálogo de impresión: Seleccionar <strong>Cinta Brother 24mm (0.94")</strong> y márgenes <strong>"Ninguno"</strong>.
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
              Imprimir {items.length} Etiqueta{items.length !== 1 ? 's' : ''} Brother
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
