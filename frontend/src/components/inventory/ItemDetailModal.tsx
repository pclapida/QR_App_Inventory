import React, { useState } from 'react';
import api, { Item } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SecurityUnlockModal } from '../SecurityUnlockModal';
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
  Edit,
  Clock,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';

interface ItemDetailModalProps {
  item: Item;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: (item: Item) => void;
  onOpenTimeline?: (item: Item) => void;
  onOpenDecommission?: (item: Item) => void;
  onReactivate?: (item: Item) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isAdmin,
  onClose,
  onEdit,
  onOpenTimeline,
  onOpenDecommission,
  onReactivate
}) => {
  const [detailSecurityUnlocked, setDetailSecurityUnlocked] = useState<boolean>(false);
  const [showUnlockModal, setShowUnlockModal] = useState<boolean>(false);
  const [unlockedKeys, setUnlockedKeys] = useState<{ bitlockerKey?: string | null; devicePassword?: string | null } | null>(null);
  const isDecommissioned = item.status === 'DECOMMISSIONED';
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPERADMIN';
  const isMyPlant = isSuperAdmin || item.plant === user?.plant;

  const handleUnlockSuccess = async () => {
    setShowUnlockModal(false);
    setDetailSecurityUnlocked(true);
    try {
      const res = await api.get(`/items/${item.id}/security-keys`);
      setUnlockedKeys(res.data);
    } catch (err) {
      console.error('Error al cargar claves de seguridad:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
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
              {isDecommissioned && (
                <span className="badge badge-outbound" style={{ background: '#ef4444', color: '#ffffff', fontWeight: 800, fontSize: '0.75rem' }}>
                  DADO DE BAJA / SCRAP
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
            <X size={22} />
          </button>
        </div>

        {/* Decommissioned Alert Box (if applicable) */}
        {isDecommissioned && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.08) 100%)',
            border: '1.5px solid #ef4444',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#f87171', fontSize: '1rem', marginBottom: '0.35rem' }}>
              <Trash2 size={18} /> ACTIVO DADO DE BAJA / DISPOSICIÓN FINAL
            </div>
            <div style={{ fontSize: '0.85rem', color: '#e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div><strong>Folio Acta:</strong> <span style={{ fontFamily: 'monospace', color: '#fca5a5' }}>{item.decommissionActNumber || 'N/A'}</span></div>
              <div><strong>Fecha de Baja:</strong> {item.decommissionDate ? new Date(item.decommissionDate).toLocaleDateString('es-MX') : 'N/A'}</div>
              <div><strong>Motivo:</strong> {item.decommissionReason || 'Scrap'}</div>
              <div><strong>Destino / Disposición:</strong> {item.disposalMethod || 'E-Waste'}</div>
              {item.decommissionedBy && <div><strong>Autorizado por:</strong> {item.decommissionedBy}</div>}
            </div>
            {item.decommissionNotes && (
              <div style={{ fontSize: '0.82rem', color: '#fca5a5', marginTop: '0.5rem', fontStyle: 'italic', borderTop: '1px solid rgba(239, 68, 68, 0.3)', paddingTop: '0.4rem' }}>
                Dictamen: {item.decommissionNotes}
              </div>
            )}
          </div>
        )}

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
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem', borderColor: 'var(--coficab-copper)', color: 'var(--coficab-copper)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                onClick={() => setShowUnlockModal(true)}
              >
                <Unlock size={14} /> Desbloquear Claves
              </button>
            ) : (
              <button
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                onClick={() => {
                  setDetailSecurityUnlocked(false);
                  setUnlockedKeys(null);
                }}
              >
                <Lock size={14} /> Bloquear
              </button>
            )}
          </div>
          {detailSecurityUnlocked && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Clave BitLocker</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: (unlockedKeys?.bitlockerKey || item.bitlockerKey) ? '#10b981' : 'var(--text-muted)', background: 'var(--bg-input)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', wordBreak: 'break-all', fontStyle: (unlockedKeys?.bitlockerKey || item.bitlockerKey) ? 'normal' : 'italic' }}>
                  {unlockedKeys?.bitlockerKey || item.bitlockerKey || 'No configurado'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Contraseña Dispositivo</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: (unlockedKeys?.devicePassword || item.devicePassword) ? '#10b981' : 'var(--text-muted)', background: 'var(--bg-input)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', wordBreak: 'break-all', fontStyle: (unlockedKeys?.devicePassword || item.devicePassword) ? 'normal' : 'italic' }}>
                  {unlockedKeys?.devicePassword || item.devicePassword || 'No configurado'}
                </div>
              </div>
            </div>
          )}
          {!detailSecurityUnlocked && (
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Clave BitLocker y contraseña del dispositivo protegidas. Presione "Desbloquear Claves" para autenticarse y visualizarlas.
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {onOpenTimeline && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  onClose();
                  onOpenTimeline(item);
                }}
                title="Ver Línea del Tiempo del Ciclo de Vida"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
              >
                <Clock size={15} style={{ color: 'var(--coficab-blue-bright)' }} /> Línea del Tiempo
              </button>
            )}

            {isAdmin && !isDecommissioned && onOpenDecommission && isMyPlant && (
              <button
                className="btn btn-danger"
                onClick={() => {
                  onClose();
                  onOpenDecommission(item);
                }}
                title="Dar de baja / Mandar a Scrap"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
              >
                <Trash2 size={15} /> Dar de Baja
              </button>
            )}

            {isAdmin && isDecommissioned && onReactivate && isMyPlant && (
              <button
                className="btn btn-success"
                onClick={() => {
                  onClose();
                  onReactivate(item);
                }}
                title="Reactivar activo al inventario"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
              >
                <CheckCircle2 size={15} /> Reactivar Activo
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {isAdmin && isMyPlant && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  onClose();
                  onEdit(item);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Edit size={15} /> Editar
              </button>
            )}
            <button className="btn btn-primary" onClick={onClose}>Cerrar</button>
          </div>
        </div>

        {/* Security Unlock Modal */}
        {showUnlockModal && (
          <SecurityUnlockModal
            title="Desbloqueo de Claves de Seguridad"
            subtitle={`Ingrese su contraseña para consultar la clave BitLocker y contraseña de acceso del equipo "${item.name}".`}
            onSuccess={handleUnlockSuccess}
            onClose={() => setShowUnlockModal(false)}
          />
        )}
      </div>
    </div>
  );
};
