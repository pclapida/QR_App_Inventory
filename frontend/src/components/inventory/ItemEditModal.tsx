import React, { useState, useEffect } from 'react';
import { Item } from '../../services/api';
import { SecurityUnlockModal } from '../SecurityUnlockModal';
import { useAuth } from '../../context/AuthContext';
import { X, Check, ShieldCheck, AlertTriangle, PlusCircle, Trash2, Lock, Unlock, LockKeyhole } from 'lucide-react';

export interface ItemEditFormData {
  name: string;
  model: string;
  serialNumber: string;
  stock: number;
  minStock: number;
  area: string;
  ipAddress: string;
  hasWarranty: boolean;
  warrantyExpiration: string;
  faults: string;
  notes: string;
  sku: string;
  category: string;
  plant: string;
  isITInternal: boolean;
  assignedTo: string;
  unit: string;
  location: string;
  bitlockerKey: string;
  devicePassword: string;
  description: string;
}

interface ItemEditModalProps {
  item: Item;
  onClose: () => void;
  onSave: (itemId: string, formData: ItemEditFormData, customFields: { key: string; value: string }[]) => Promise<void>;
}

export const ItemEditModal: React.FC<ItemEditModalProps> = ({ item, onClose, onSave }) => {
  const [editSecurityUnlocked, setEditSecurityUnlocked] = useState<boolean>(false);
  const [showUnlockModal, setShowUnlockModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);

  const { isSuperAdmin, currentPlant } = useAuth();
  
  // If the item doesn't originally belong to this plant (and hasn't been re-purchased),
  // and the user is NOT a SuperAdmin, lock core fields (model, serial, sku, PO).
  const isTransferred = item.originPlant && item.plant !== item.originPlant;
  const isLocked = !isSuperAdmin && isTransferred && currentPlant !== item.originPlant;

  const [formData, setFormData] = useState<ItemEditFormData>({
    name: item.name || '',
    model: item.model || '',
    serialNumber: item.serialNumber || '',
    stock: item.stock ?? 1,
    minStock: item.minStock ?? 5,
    area: item.area || '',
    ipAddress: item.ipAddress || '',
    hasWarranty: item.hasWarranty ?? false,
    warrantyExpiration: item.warrantyExpiration || '',
    faults: item.faults || '',
    notes: item.notes || '',
    sku: item.sku || '',
    category: item.category || 'Equipos & Dispositivos',
    plant: item.plant || 'Planta 2',
    isITInternal: item.isITInternal ?? false,
    assignedTo: item.assignedTo || '',
    unit: item.unit || 'unidad',
    location: item.location || '',
    bitlockerKey: item.bitlockerKey || '',
    devicePassword: item.devicePassword || '',
    description: item.description || ''
  });

  useEffect(() => {
    if (item.customAttributes) {
      try {
        const parsed = typeof item.customAttributes === 'string'
          ? JSON.parse(item.customAttributes)
          : item.customAttributes;
        const entries = Object.entries(parsed).map(([key, value]) => ({
          key,
          value: String(value)
        }));
        setCustomFields(entries);
      } catch {
        setCustomFields([]);
      }
    } else {
      setCustomFields([]);
    }
  }, [item]);

  const handleAddCustomField = () => {
    setCustomFields(prev => [...prev, { key: '', value: '' }]);
  };

  const handleCustomFieldChange = (index: number, field: 'key' | 'value', val: string) => {
    setCustomFields(prev => {
      const updated = [...prev];
      updated[index][field] = val;
      return updated;
    });
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(item.id, formData, customFields);
      onClose();
    } catch (err) {
      console.error('Error saving item:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '650px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Editar Equipo / Artículo: {item.sku}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Modifique cualquiera de las opciones y atributos guardados.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {isLocked && (
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', borderLeft: '4px solid #f59e0b', padding: '1rem', borderRadius: '4px', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontWeight: 800, marginBottom: '0.25rem' }}>
              <LockKeyhole size={18} /> Acceso Restringido (Transferencia Multi-Planta)
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)' }}>
              Este equipo pertenece originalmente a <strong>{item.originPlant}</strong> y fue transferido a tu planta. Ciertos datos duros (Modelo, Serie, SKU y Órdenes de Compra) están bloqueados para proteger el registro original. Solo puedes editar datos operativos.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem' }}>

            {/* 1. Nombre */}
            <div className="form-group">
              <label className="form-label">1. Nombre del Equipo / Artículo *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* 2. Modelo */}
            <div className="form-group">
              <label className="form-label">
                2. Modelo {item.isITInternal ? <span style={{ color: '#ef4444', fontWeight: 800 }}>* (Obligatorio IT)</span> : ''}
                {isLocked && <LockKeyhole size={12} style={{ marginLeft: '0.25rem', color: '#f59e0b' }} />}
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                required={item.isITInternal}
                disabled={Boolean(isLocked)}
                style={{ 
                  ...(item.isITInternal && !formData.model ? { borderColor: 'rgba(239,68,68,0.5)' } : {}),
                  ...(isLocked ? { background: 'var(--bg-card)', cursor: 'not-allowed', opacity: 0.7 } : {})
                }}
              />
            </div>

            {/* 3. Número de Serie */}
            <div className="form-group">
              <label className="form-label">
                3. Número de Serie {item.isITInternal ? <span style={{ color: '#ef4444', fontWeight: 800 }}>* (Obligatorio IT)</span> : ''}
                {isLocked && <LockKeyhole size={12} style={{ marginLeft: '0.25rem', color: '#f59e0b' }} />}
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                required={item.isITInternal}
                disabled={Boolean(isLocked)}
                style={{ 
                  ...(item.isITInternal && !formData.serialNumber ? { borderColor: 'rgba(239,68,68,0.5)' } : {}),
                  ...(isLocked ? { background: 'var(--bg-card)', cursor: 'not-allowed', opacity: 0.7 } : {})
                }}
              />
            </div>

            {/* 4. Stock */}
            <div className="form-group">
              <label className="form-label">4. Stock (Cantidad)</label>
              <input
                type="number"
                className="form-input"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value || '0', 10) })}
                min="0"
                required
              />
            </div>

            {/* 5. Área */}
            <div className="form-group">
              <label className="form-label">5. Área / Ubicación</label>
              <input
                type="text"
                className="form-input"
                value={formData.area}
                onChange={(e) => {
                  const val = e.target.value;
                  const isIT = ['it', 'sistemas', 'taller it', 'taller interno it'].includes(val.toLowerCase().trim());
                  setFormData({
                    ...formData,
                    area: val,
                    isITInternal: isIT ? true : formData.isITInternal
                  });
                }}
                placeholder="ej. Mantenimiento, Calidad, IT..."
              />
            </div>

            {/* 6. Dirección IP */}
            <div className="form-group">
              <label className="form-label">6. Dirección IP</label>
              <input
                type="text"
                className="form-input"
                value={formData.ipAddress}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
              />
            </div>

            {/* Tipo de Inventario (Plantas vs IT Interno) */}
            <div className="form-group" style={{ gridColumn: '1 / -1', background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <label className="form-label" style={{ fontWeight: 800, color: formData.isITInternal ? 'var(--coficab-copper)' : 'var(--coficab-blue-bright)', marginBottom: '0.4rem' }}>
                Destino / Tipo de Inventario
              </label>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600, color: !formData.isITInternal ? 'var(--coficab-blue-bright)' : 'var(--text-muted)' }}>
                  <input
                    type="radio"
                    name="editIsITInternal"
                    checked={!formData.isITInternal}
                    onChange={() => setFormData({ ...formData, isITInternal: false })}
                  />
                  🏢 Inventario Operativo de Plantas (Equipos en Uso Activo)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600, color: formData.isITInternal ? 'var(--coficab-copper)' : 'var(--text-muted)' }}>
                  <input
                    type="radio"
                    name="editIsITInternal"
                    checked={formData.isITInternal}
                    onChange={() => setFormData({ ...formData, isITInternal: true })}
                  />
                  🛠️ Inventario Interno de IT (Stock Almacén / Refacciones)
                </label>
              </div>
            </div>

            {/* Garantía */}
            <div className="form-group" style={{ gridColumn: '1 / -1', background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <label className="form-label" style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
                <ShieldCheck size={18} /> ¿Cuenta con Garantía Vigente?
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                  <input
                    type="radio"
                    name="editHasWarranty"
                    checked={formData.hasWarranty}
                    onChange={() => setFormData({ ...formData, hasWarranty: true })}
                  />
                  Sí (Con Garantía)
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <input
                    type="radio"
                    name="editHasWarranty"
                    checked={!formData.hasWarranty}
                    onChange={() => setFormData({ ...formData, hasWarranty: false, warrantyExpiration: '' })}
                  />
                  No / Vencida
                </label>
              </div>

              {formData.hasWarranty && (
                <div style={{ marginTop: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Fecha de Vencimiento de la Garantía</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.warrantyExpiration}
                    onChange={(e) => setFormData({ ...formData, warrantyExpiration: e.target.value })}
                    placeholder="ej. 29/06/2026 o 18/12/2026"
                  />
                </div>
              )}
            </div>

            {/* 7. SKU / Código Interno */}
            <div className="form-group">
              <label className="form-label">7. SKU / Código Interno</label>
              <input
                type="text"
                className="form-input"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                required
              />
            </div>

            {/* 7. Asignado a */}
            <div className="form-group">
              <label className="form-label">7. Persona / Colaborador Asignado</label>
              <input
                type="text"
                className="form-input"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                placeholder="Nombre del colaborador..."
              />
            </div>

            {/* Categoría */}
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--coficab-copper)', fontWeight: 800 }}>Categoría</label>
              <select
                className="form-input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Paneles">Paneles</option>
                <option value="Equipos & Dispositivos">Equipos & Dispositivos</option>
                <option value="Hardware & Lectores">Hardware & Lectores</option>
                <option value="Laptops & Cómputo">Laptops & Cómputo</option>
                <option value="Monitores & Pantallas">Monitores & Pantallas</option>
                <option value="Tablets">Tablets</option>
                <option value="Impresoras Zebra">Impresoras Zebra</option>
                <option value="Consumibles">Consumibles</option>
                <option value="Maquinaria">Maquinaria</option>
                <option value="Herramientas">Herramientas</option>
                <option value="Refacciones IT">Refacciones IT</option>
              </select>
            </div>

            {/* Planta COFICAB */}
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 800 }}>Planta COFICAB</label>
              <select
                className="form-input"
                value={formData.plant}
                onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                style={{ fontWeight: 700, borderColor: 'var(--primary)' }}
              >
                <option value="Planta 1">Planta 1</option>
                <option value="Planta 2">Planta 2 (Principal)</option>
                <option value="Planta 3">Planta 3</option>
                <option value="Planta UPCAST">Planta UPCAST</option>
              </select>
            </div>

            {/* Stock Mínimo */}
            <div className="form-group">
              <label className="form-label">Stock Mínimo (Alerta)</label>
              <input
                type="number"
                className="form-input"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value || '0', 10) })}
                min="0"
                required
              />
            </div>

            {/* Unidad de Medida */}
            <div className="form-group">
              <label className="form-label">Unidad de Medida</label>
              <input
                type="text"
                className="form-input"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                required
              />
            </div>

            {/* 8. Fallas */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <AlertTriangle size={15} /> 8. Fallas / Defectos Reportados
              </label>
              <textarea
                className="form-input"
                rows={2}
                value={formData.faults}
                onChange={(e) => setFormData({ ...formData, faults: e.target.value })}
                placeholder="Describa fallas o problemas si aplica..."
              />
            </div>

            {/* Asignado a */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Responsable / Asignado a</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nombre de la persona (ej. Juan Perez)"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              />
            </div>

            {/* 9. Observaciones */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">9. Observaciones / Notas Adicionales</label>
              <textarea
                className="form-input"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observaciones de mantenimiento o notas generales..."
              />
            </div>

            {/* Security Fields (Bitlocker, Password) for PCs and Laptops */}
            {(formData.category === 'Laptops' || formData.category === 'Computadoras de Escritorio' || formData.category === 'Equipos & Dispositivos') && (
              <div style={{ gridColumn: '1 / -1', background: 'var(--bg-input)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 800, color: 'var(--coficab-copper)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Lock size={18} /> Datos de Seguridad (Solo Administrador)
                  </label>
                  {!editSecurityUnlocked ? (
                    <button
                      type="button"
                      onClick={() => setShowUnlockModal(true)}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem', borderColor: 'var(--coficab-copper)', color: 'var(--coficab-copper)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
                    >
                      <Unlock size={14} /> Desbloquear
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>🔓 Desbloqueado para edición</span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', opacity: editSecurityUnlocked ? 1 : 0.5, pointerEvents: editSecurityUnlocked ? 'auto' : 'none' }}>
                  <div className="form-group">
                    <label className="form-label">Clave de BitLocker</label>
                    <input
                      type={editSecurityUnlocked ? 'text' : 'password'}
                      className="form-input"
                      value={formData.bitlockerKey}
                      onChange={(e) => setFormData({ ...formData, bitlockerKey: e.target.value })}
                      placeholder={editSecurityUnlocked ? 'Ej. 123456-789012...' : '••••••••••••'}
                      disabled={!editSecurityUnlocked}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contraseña del Dispositivo / BIOS</label>
                    <input
                      type={editSecurityUnlocked ? 'text' : 'password'}
                      className="form-input"
                      value={formData.devicePassword}
                      onChange={(e) => setFormData({ ...formData, devicePassword: e.target.value })}
                      placeholder={editSecurityUnlocked ? 'Contraseña local o de arranque' : '••••••••••••'}
                      disabled={!editSecurityUnlocked}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Custom Fields Section */}
            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>
                  10. Atributos y Especificaciones Personalizadas
                  {isLocked && <LockKeyhole size={14} style={{ marginLeft: '0.5rem', color: '#f59e0b', verticalAlign: 'middle' }} />}
                </label>
                {!isLocked && (
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    className="btn btn-secondary"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                  >
                    <PlusCircle size={14} /> Añadir Nuevo Campo
                  </button>
                )}
              </div>

              {customFields.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {customFields.map((field, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Nombre de la propiedad (ej. RAM, SSD, Tarjeta de Video)"
                        className="form-input"
                        value={field.key}
                        onChange={(e) => handleCustomFieldChange(idx, 'key', e.target.value)}
                        style={{ flex: 1, ...(isLocked ? { background: 'var(--bg-card)', cursor: 'not-allowed', opacity: 0.7 } : {}) }}
                        disabled={Boolean(isLocked)}
                      />
                      <input
                        type="text"
                        placeholder="Valor / Detalle (ej. 32 GB DDR5, 1TB NVMe)"
                        className="form-input"
                        value={field.value}
                        onChange={(e) => handleCustomFieldChange(idx, 'value', e.target.value)}
                        style={{ flex: 2, ...(isLocked ? { background: 'var(--bg-card)', cursor: 'not-allowed', opacity: 0.7 } : {}) }}
                        disabled={Boolean(isLocked)}
                      />
                      {!isLocked && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomField(idx)}
                          className="btn btn-danger"
                          style={{ padding: '0.45rem', minWidth: 'auto' }}
                          title="Eliminar campo"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontStyle: 'italic', background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                  No ha añadido ningún campo personalizado adicional. Presione "Añadir Nuevo Campo" para agregar un nuevo dato a este registro.
                </div>
              )}
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              <Check size={18} />
              {loading ? 'Guardando...' : 'Guardar Todos los Cambios'}
            </button>
          </div>
        </form>

        {/* Security Unlock Modal */}
        {showUnlockModal && (
          <SecurityUnlockModal
            title="Autorización para Edición de Seguridad"
            subtitle={`Ingrese su contraseña de administrador para desbloquear la edición de claves BitLocker y contraseña de acceso.`}
            onSuccess={() => {
              setShowUnlockModal(false);
              setEditSecurityUnlocked(true);
            }}
            onClose={() => setShowUnlockModal(false)}
          />
        )}
      </div>
    </div>
  );
};
