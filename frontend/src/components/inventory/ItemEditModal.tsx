import React, { useState, useEffect } from 'react';
import { Item } from '../../services/api';
import { X, Check, ShieldCheck, AlertTriangle, PlusCircle, Trash2, Lock, Unlock } from 'lucide-react';

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
  const [loading, setLoading] = useState<boolean>(false);
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);

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
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                required={item.isITInternal}
                style={item.isITInternal && !formData.model ? { borderColor: 'rgba(239,68,68,0.5)' } : undefined}
              />
            </div>

            {/* 3. Número de Serie */}
            <div className="form-group">
              <label className="form-label">
                3. Número de Serie {item.isITInternal ? <span style={{ color: '#ef4444', fontWeight: 800 }}>* (Obligatorio IT)</span> : ''}
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                required={item.isITInternal}
                style={item.isITInternal && !formData.serialNumber ? { borderColor: 'rgba(239,68,68,0.5)' } : undefined}
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
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
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

            {/* Categoría */}
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select
                className="form-input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Equipos & Dispositivos">Equipos & Dispositivos</option>
                <option value="Hardware & Lectores">Hardware & Lectores</option>
                <option value="Consumibles">Consumibles</option>
                <option value="Maquinaria">Maquinaria</option>
                <option value="Herramientas">Herramientas</option>
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
                      onClick={() => {
                        const pass = prompt('Ingrese contraseña maestra para ver/editar seguridad:');
                        if (pass === 'master123') setEditSecurityUnlocked(true);
                        else if (pass) alert('Contraseña incorrecta');
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                    >
                      <Unlock size={14} /> Desbloquear
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>Desbloqueado</span>
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
                    <label className="form-label">Contraseña de Dispositivo</label>
                    <input
                      type={editSecurityUnlocked ? 'text' : 'password'}
                      className="form-input"
                      value={formData.devicePassword}
                      onChange={(e) => setFormData({ ...formData, devicePassword: e.target.value })}
                      placeholder={editSecurityUnlocked ? 'Ej. Admin.2026' : '••••••••••••'}
                      disabled={!editSecurityUnlocked}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Custom Fields Section */}
            <div style={{ gridColumn: '1 / -1', background: 'var(--bg-input)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <label className="form-label" style={{ color: 'var(--coficab-copper)', fontWeight: 800, fontSize: '0.95rem', marginBottom: 0 }}>
                    Campos y Atributos Personalizados Dinámicos
                  </label>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                    Agregue o elimine libremente nuevos campos (ej. Clave Bitlocker, N° Factura, Proveedor, Voltaje, Licencia, MAC Address, etc.).
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCustomFields([...customFields, { key: '', value: '' }])}
                  style={{ fontSize: '0.82rem', borderColor: 'var(--coficab-copper)', color: 'var(--coficab-copper)', fontWeight: 700 }}
                >
                  <PlusCircle size={16} />
                  Añadir Nuevo Campo
                </button>
              </div>

              {customFields.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {customFields.map((field, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Nombre del Campo (ej. Clave Bitlocker / Proveedor)"
                        value={field.key}
                        onChange={(e) => {
                          const updated = [...customFields];
                          updated[idx].key = e.target.value;
                          setCustomFields(updated);
                        }}
                        style={{ flex: 1, minWidth: '180px', fontWeight: 700 }}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Valor (ej. 81135362 / Dell México)"
                        value={field.value}
                        onChange={(e) => {
                          const updated = [...customFields];
                          updated[idx].value = e.target.value;
                          setCustomFields(updated);
                        }}
                        style={{ flex: 1, minWidth: '180px' }}
                      />
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => setCustomFields(customFields.filter((_, i) => i !== idx))}
                        style={{ padding: '0.55rem', borderRadius: 'var(--radius-sm)' }}
                        title="Eliminar este campo"
                      >
                        <Trash2 size={16} />
                      </button>
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
      </div>
    </div>
  );
};
