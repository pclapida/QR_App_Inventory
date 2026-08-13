import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { Item } from '../services/api';
import { QRModal } from '../components/QRModal';
import { PlusCircle, AlertCircle, ArrowLeft, AlertTriangle, ShieldCheck, Package, Trash2 } from 'lucide-react';

export const AddItem: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/inventory');
    }
  }, [user, navigate]);

  // Prefill name if redirected from failed scan
  const initialName = searchParams.get('name') || '';

  // Registration Fields
  const [name, setName] = useState<string>(initialName);
  const [category, setCategory] = useState<string>('Equipos & Dispositivos');
  const [plant, setPlant] = useState<string>('Planta 2');
  const [model, setModel] = useState<string>('');
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [stock, setStock] = useState<number>(1);
  const [minStock, setMinStock] = useState<number>(1);
  const [area, setArea] = useState<string>('');
  const [ipAddress, setIpAddress] = useState<string>('');
  const [hasWarranty, setHasWarranty] = useState<boolean>(false);
  const [warrantyExpiration, setWarrantyExpiration] = useState<string>('');
  const [faults, setFaults] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [sku, setSku] = useState<string>('');
  const [unit, setUnit] = useState<string>('unidad');
  const [assignedTo, setAssignedTo] = useState<string>('');

  const [isITInternal, setIsITInternal] = useState<boolean>(() => searchParams.get('isIT') === '1');
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);

  const [bitlockerKey, setBitlockerKey] = useState<string>('');
  const [devicePassword, setDevicePassword] = useState<string>('');
  const [securityUnlocked, setSecurityUnlocked] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [createdItem, setCreatedItem] = useState<Item | null>(null);

  const isSimpleCategory = category === 'Consumibles' || category === 'Herramientas';

  const handleAddCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleCustomFieldChange = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...customFields];
    updated[index][field] = val;
    setCustomFields(updated);
  };

  const generateAutoSKU = () => {
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const prefix = isITInternal ? 'IT' : (name ? name.substring(0, 3).toUpperCase() : 'COF');
    setSku(`${prefix}-${randomPart}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let finalSku = sku.trim();
      if (!finalSku) {
        const randomPart = Math.floor(10000 + Math.random() * 90000);
        const prefix = isITInternal ? 'IT' : (category === 'Consumibles' ? 'CNS' : category === 'Herramientas' ? 'HRR' : 'COF');
        finalSku = `${prefix}-${randomPart}`;
      }

      const customAttributesObj: Record<string, string> = {};
      customFields.forEach((f) => {
        if (f.key.trim()) {
          customAttributesObj[f.key.trim()] = f.value.trim();
        }
      });

      const res = await api.post('/items', {
        name,
        model,
        serialNumber,
        stock,
        minStock,
        area,
        ipAddress,
        hasWarranty,
        warrantyExpiration,
        faults,
        notes,
        sku: finalSku,
        category,
        plant,
        isITInternal,
        customAttributes: Object.keys(customAttributesObj).length > 0 ? customAttributesObj : null,
        bitlockerKey: bitlockerKey.trim() || null,
        devicePassword: devicePassword.trim() || null,
        unit,
        assignedTo: assignedTo.trim() || null,
        location: isITInternal ? 'Taller Interno IT' : (area || plant)
      });

      setCreatedItem(res.data.item);
    } catch (err: any) {
      console.error('Error al registrar artículo:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('No se pudo guardar el nuevo registro. Verifique que los campos obligatorios estén completos.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Registro de Nuevo Artículo / Equipo
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isSimpleCategory ? 'Registro simplificado para Consumibles y Herramientas (Solo requiere Nombre y Cantidad).' : 'Registro detallado para Equipos, Lectores, Activos Fijos y Dispositivos con Garantía.'}
          </p>
        </div>

        <button className="btn btn-secondary" onClick={() => navigate('/inventory')}>
          <ArrowLeft size={18} />
          Volver al Inventario
        </button>
      </div>

      {error && (
        <div style={{
          padding: '0.85rem 1rem',
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: 'var(--radius-sm)',
          color: '#f43f5e',
          fontSize: '0.9rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem' }}>

        {/* Inventario de Destino: Operativo de Plantas vs Interno IT */}
        <div style={{ marginBottom: '1.75rem', background: 'var(--bg-input)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <label className="form-label" style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Package size={18} style={{ color: 'var(--coficab-copper)' }} />
            ¿A qué Inventario pertenece este Registro?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div
              onClick={() => setIsITInternal(false)}
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: !isITInternal ? 'rgba(37, 99, 235, 0.18)' : 'var(--bg-card)',
                border: !isITInternal ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontWeight: 800, color: !isITInternal ? '#60a5fa' : 'var(--text-main)', fontSize: '1rem' }}>
                Inventario Operativo de Plantas
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Equipos en servicio asignados a usuarios, líneas y áreas operativas de Planta 1, 2, 3 u UPCAST.
              </div>
            </div>

            <div
              onClick={() => setIsITInternal(true)}
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: isITInternal ? 'rgba(201, 138, 75, 0.18)' : 'var(--bg-card)',
                border: isITInternal ? '2px solid var(--coficab-copper)' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontWeight: 800, color: isITInternal ? 'var(--coficab-copper)' : 'var(--text-main)', fontSize: '1rem' }}>
                Inventario Interno de IT
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Stock del taller de Sistemas, refacciones, repuestos, cables, herramientas y accesorios IT.
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Categoría Selector */}
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--coficab-copper)', fontWeight: 800 }}>Seleccionar Categoría del Registro</label>
            <select
              className="form-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ fontSize: '1.05rem', fontWeight: 700, borderColor: 'var(--border-copper)' }}
            >
              <option value="Equipos & Dispositivos">Equipos & Dispositivos (Activo Fijo)</option>
              <option value="Hardware & Lectores">Hardware & Lectores (Activo Fijo)</option>
              <option value="Activo Fijo">Activo Fijo</option>
              <option value="Consumibles">Consumibles (Simplificado)</option>
              <option value="Herramientas">Herramientas (Simplificado)</option>
              <option value="Maquinaria">Maquinaria</option>
            </select>
          </div>

          {/* Planta Selector (Planta 1, Planta 2, Planta 3, Planta UPCAST) */}
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 800 }}>Ubicación / Planta COFICAB</label>
            <select
              className="form-input"
              value={plant}
              onChange={(e) => setPlant(e.target.value)}
              style={{ fontSize: '1.05rem', fontWeight: 700, borderColor: 'var(--primary)' }}
            >
              <option value="Planta 1">Planta 1</option>
              <option value="Planta 2">Planta 2 (Planta Principal)</option>
              <option value="Planta 3">Planta 3</option>
              <option value="Planta UPCAST">Planta UPCAST</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

          {/* 1. Nombre - MANDATORY FOR ALL */}
          <div className="form-group">
            <label className="form-label">1. Nombre del Producto / Equipo *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isSimpleCategory ? "ej. Cinta Aislante Térmica" : "ej. Lector QR Honeywell Xenon"}
              required
            />
          </div>

          {/* 2. Stock (Cantidad) - MANDATORY FOR ALL */}
          <div className="form-group">
            <label className="form-label">2. Cantidad Inicial (Stock) *</label>
            <input
              type="number"
              className="form-input"
              value={stock}
              onChange={(e) => setStock(parseInt(e.target.value || '0', 10))}
              min="0"
              required
            />
          </div>

          {/* Show full technical fields ONLY for Activo Fijo / Hardware / Dispositivos */}
          {!isSimpleCategory && (
            <>
              <div className="form-group">
                <label className="form-label">
                  Modelo {isITInternal ? <span style={{ color: '#ef4444', fontWeight: 800 }}>* (Obligatorio para IT)</span> : '(Opcional)'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="ej. ZD421-300D / DELL E2724HS"
                  required={isITInternal}
                  style={isITInternal && !model ? { borderColor: 'rgba(239,68,68,0.5)' } : undefined}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Número de Serie {isITInternal ? <span style={{ color: '#ef4444', fontWeight: 800 }}>* (Obligatorio para IT)</span> : '(Opcional)'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="ej. CN-04XFCW-TV200-441"
                  required={isITInternal}
                  style={isITInternal && !serialNumber ? { borderColor: 'rgba(239,68,68,0.5)' } : undefined}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Área / Departamento</label>
                <input
                  type="text"
                  className="form-input"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="ej. Almacén 2 - Extrusión"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dirección IP</label>
                <input
                  type="text"
                  className="form-input"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="ej. 192.168.10.45"
                />
              </div>

              {/* Warranty Section for Hardware/Assets */}
              <div className="form-group" style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <label className="form-label" style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
                  <ShieldCheck size={18} /> ¿Cuenta con Garantía Vigente?
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                    <input
                      type="radio"
                      name="hasWarranty"
                      checked={hasWarranty}
                      onChange={() => setHasWarranty(true)}
                    />
                    Sí (Con Garantía)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <input
                      type="radio"
                      name="hasWarranty"
                      checked={!hasWarranty}
                      onChange={() => {
                        setHasWarranty(false);
                        setWarrantyExpiration('');
                      }}
                    />
                    No / Vencida
                  </label>
                </div>

                {hasWarranty && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Fecha de Vencimiento de la Garantía</label>
                    <input
                      type="text"
                      className="form-input"
                      value={warrantyExpiration}
                      onChange={(e) => setWarrantyExpiration(e.target.value)}
                      placeholder="ej. 29/06/2026 o 18/12/2026"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* SKU / Código Interno */}
          <div className="form-group">
            <label className="form-label">SKU / Código QR {isSimpleCategory ? '(Opcional - Se autogenera si se omite)' : ''}</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="ej. COFDG-MON-080"
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={generateAutoSKU}
                style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}
              >
                Auto SKU
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Stock Mínimo (Alerta)</label>
            <input
              type="number"
              className="form-input"
              value={minStock}
              onChange={(e) => setMinStock(parseInt(e.target.value || '0', 10))}
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Unidad de Medida</label>
            <input
              type="text"
              className="form-input"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="ej. unidad, caja, rollo, paquete"
            />
          </div>

          {/* Fallas */}
          {!isSimpleCategory && (
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <AlertTriangle size={15} /> Fallas / Defectos Reportados (Si aplica)
              </label>
              <textarea
                className="form-input"
                rows={2}
                value={faults}
                onChange={(e) => setFaults(e.target.value)}
                placeholder="Describa si el equipo tiene alguna falla..."
              />
            </div>
          )}

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">8. Responsable / Asignado a</label>
            <input
              type="text"
              className="form-input"
              placeholder="Nombre de la persona (ej. Juan Perez)"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            />
          </div>

          {/* Observaciones */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">9. Observaciones / Notas Adicionales</label>
            <textarea
              className="form-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas generales del producto..."
            />
          </div>

          {/* Security Fields (Bitlocker, Password) for PCs and Laptops */}
          {(!isSimpleCategory && (category === 'Laptops' || category === 'Computadoras de Escritorio' || category === 'Equipos & Dispositivos')) && (
            <div style={{ gridColumn: '1 / -1', background: 'var(--bg-input)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <label className="form-label" style={{ margin: 0, fontWeight: 800, color: 'var(--coficab-copper)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="material-icons" style={{ fontSize: '18px' }}>lock</span> Datos de Seguridad (Solo Administrador)
                </label>
                {!securityUnlocked ? (
                  <button type="button" onClick={() => {
                    const pass = prompt('Ingrese contraseña maestra para editar seguridad:');
                    if (pass === 'master123') setSecurityUnlocked(true);
                    else if (pass) alert('Contraseña incorrecta');
                  }} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>
                    Desbloquear
                  </button>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>Desbloqueado</span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', opacity: securityUnlocked ? 1 : 0.5, pointerEvents: securityUnlocked ? 'auto' : 'none' }}>
                <div className="form-group">
                  <label className="form-label">Clave de BitLocker</label>
                  <input
                    type={securityUnlocked ? 'text' : 'password'}
                    className="form-input"
                    value={bitlockerKey}
                    onChange={(e) => setBitlockerKey(e.target.value)}
                    placeholder={securityUnlocked ? "Ej. 123456-789012..." : "••••••••••••"}
                    disabled={!securityUnlocked}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contraseña de Dispositivo</label>
                  <input
                    type={securityUnlocked ? 'text' : 'password'}
                    className="form-input"
                    value={devicePassword}
                    onChange={(e) => setDevicePassword(e.target.value)}
                    placeholder={securityUnlocked ? "Ej. Admin.2026" : "••••••••••••"}
                    disabled={!securityUnlocked}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Custom Fields Section */}
          <div style={{ gridColumn: '1 / -1', background: 'var(--bg-input)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
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
                onClick={handleAddCustomField}
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
                      onChange={(e) => handleCustomFieldChange(idx, 'key', e.target.value)}
                      style={{ flex: 1, minWidth: '200px', fontWeight: 700 }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Valor (ej. 81135362 / Dell México)"
                      value={field.value}
                      onChange={(e) => handleCustomFieldChange(idx, 'value', e.target.value)}
                      style={{ flex: 1, minWidth: '200px' }}
                    />
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleRemoveCustomField(idx)}
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

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/inventory')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            <PlusCircle size={20} />
            {loading ? 'Registrando...' : 'Registrar y Generar Código QR'}
          </button>
        </div>
      </form>

      {/* QR Generation Modal */}
      {createdItem && (
        <QRModal
          item={createdItem}
          onClose={() => {
            setCreatedItem(null);
            navigate('/inventory');
          }}
        />
      )}
    </div>
  );
};
