import React, { useState } from 'react';
import { Item } from '../../services/api';
import {
  Package,
  X,
  Cpu,
  Hash,
  MapPin,
  Tag,
  User,
  Monitor,
  Layers,
  Shield,
  Lock,
  Unlock,
  Edit
} from 'lucide-react';

interface ItemDetailModalProps {
  item: Item;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: (item: Item) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, isAdmin, onClose, onEdit }) => {
  const [detailSecurityUnlocked, setDetailSecurityUnlocked] = useState<boolean>(false);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <Package size={22} color="var(--primary)" />
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{item.name}</h2>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--coficab-blue-bright)', background: 'rgba(37,99,235,0.1)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                SKU: {item.sku}
              </span>
              {item.category && <span className="badge" style={{ fontSize: '0.75rem' }}>{item.category}</span>}
              {item.isITInternal
                ? <span className="badge" style={{ background: 'rgba(201,138,75,0.25)', color: 'var(--coficab-copper)', border: '1px solid var(--coficab-copper)', fontSize: '0.75rem' }}>Interno IT</span>
                : <span className="badge" style={{ background: 'rgba(37,99,235,0.2)', color: '#60a5fa', border: '1px solid #3b82f6', fontSize: '0.75rem' }}>{item.plant || 'Planta 2'}</span>
              }
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
            <X size={22} />
          </button>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Model */}
          {item.model && (
            <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Cpu size={12} /> Modelo
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.model}</div>
            </div>
          )}
          {/* Serial */}
          {item.serialNumber && (
            <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Hash size={12} /> No. Serie
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace' }}>{item.serialNumber}</div>
            </div>
          )}
          {/* Plant / Location */}
          <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <MapPin size={12} /> Ubicación
            </div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.location || item.plant || '-'}</div>
          </div>
          {/* Area */}
          {item.area && (
            <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Tag size={12} /> Área
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.area}</div>
            </div>
          )}
          {/* Assigned To */}
          {item.assignedTo && (
            <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <User size={12} /> Asignado a
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.assignedTo}</div>
            </div>
          )}
          {/* IP */}
          {item.ipAddress && (
            <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Monitor size={12} /> IP
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace' }}>{item.ipAddress}</div>
            </div>
          )}
          {/* Stock */}
          <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Layers size={12} /> Stock
            </div>
            <div style={{ fontWeight: 700, color: item.stock <= item.minStock ? '#f59e0b' : '#10b981', fontSize: '1.1rem' }}>
              {item.stock} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>{item.unit}</span>
            </div>
          </div>
          {/* Warranty */}
          <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Shield size={12} /> Garantía
            </div>
            <div style={{ fontWeight: 700, color: item.hasWarranty ? '#10b981' : 'var(--text-muted)' }}>
              {item.hasWarranty ? `Vigente${item.warrantyExpiration ? ` — ${item.warrantyExpiration}` : ''}` : 'Sin garantía'}
            </div>
          </div>
        </div>

        {/* Notes / Faults / Description */}
        {(item.notes || item.faults || item.description) && (
          <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {item.description && (
              <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Descripción</div>
                <div style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.5 }}>{item.description}</div>
              </div>
            )}
            {item.notes && (
              <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Notas</div>
                <div style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.5 }}>{item.notes}</div>
              </div>
            )}
            {item.faults && (
              <div style={{ background: 'rgba(239,68,68,0.08)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <div style={{ fontSize: '0.72rem', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Fallas / Defectos</div>
                <div style={{ color: '#f87171', fontSize: '0.9rem', lineHeight: 1.5 }}>{item.faults}</div>
              </div>
            )}
          </div>
        )}

        {/* Custom Attributes */}
        {item.customAttributes && (() => {
          try {
            const parsed = typeof item.customAttributes === 'string' ? JSON.parse(item.customAttributes) : item.customAttributes;
            const entries = Object.entries(parsed as Record<string, string>);
            if (entries.length === 0) return null;
            return (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Atributos adicionales</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem' }}>
                  {entries.map(([k, v]) => (
                    <div key={k} style={{ background: 'var(--bg-input)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--coficab-copper)', fontWeight: 700, marginBottom: '0.15rem' }}>{k}</div>
                      <div style={{ color: 'var(--text-main)', fontSize: '0.875rem', fontFamily: 'monospace' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          } catch { return null; }
        })()}

        {/* Security Section */}
        <div style={{ background: detailSecurityUnlocked ? 'rgba(16,185,129,0.06)' : 'rgba(201,138,75,0.08)', padding: '1rem', borderRadius: 'var(--radius-md)', border: detailSecurityUnlocked ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(201,138,75,0.4)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: detailSecurityUnlocked ? '1rem' : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: detailSecurityUnlocked ? '#10b981' : 'var(--coficab-copper)', fontSize: '0.9rem' }}>
              {detailSecurityUnlocked ? <Unlock size={16} /> : <Lock size={16} />}
              Datos de Seguridad
            </div>
            {!detailSecurityUnlocked ? (
              <button
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => {
                  const pass = prompt('Ingrese contraseña maestra para ver seguridad:');
                  if (pass === 'master123') setDetailSecurityUnlocked(true);
                  else if (pass) alert('Contraseña incorrecta');
                }}
              >
                🔓 Desbloquear
              </button>
            ) : (
              <button
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => setDetailSecurityUnlocked(false)}
              >
                🔒 Bloquear
              </button>
            )}
          </div>
          {detailSecurityUnlocked && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Clave BitLocker</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: item.bitlockerKey ? '#10b981' : 'var(--text-muted)', background: 'var(--bg-input)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', wordBreak: 'break-all', fontStyle: item.bitlockerKey ? 'normal' : 'italic' }}>
                  {item.bitlockerKey || 'No configurado'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Contraseña Dispositivo</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: item.devicePassword ? '#10b981' : 'var(--text-muted)', background: 'var(--bg-input)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', wordBreak: 'break-all', fontStyle: item.devicePassword ? 'normal' : 'italic' }}>
                  {item.devicePassword || 'No configurado'}
                </div>
              </div>
            </div>
          )}
          {!detailSecurityUnlocked && (
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Clave BitLocker y contraseña del dispositivo protegidas. Presiona "Desbloquear" para verlas.
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          {isAdmin && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                onClose();
                onEdit(item);
              }}
            >
              <Edit size={15} /> Editar
            </button>
          )}
          <button className="btn btn-primary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};
