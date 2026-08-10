import React, { useState, useEffect } from 'react';
import api, { Item } from '../services/api';
import {
  Wrench,
  Calendar,
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  Search,
  Cpu,
  Laptop,
  Tablet,
  Printer,
  HardDrive,
  RefreshCw,
  UserCheck
} from 'lucide-react';

interface MaintenanceRecord {
  id: string;
  itemId: string;
  deviceType: string;
  performedBy: string;
  performedAt: string;
  nextDueDate: string;
  checklist: string;
  notes?: string;
  item: {
    id: string;
    name: string;
    sku: string;
    model?: string;
    serialNumber?: string;
    area?: string;
    category?: string;
  };
}

// Checklists matrix from COFICAB Excel
const MAINTENANCE_MATRIX: { [key: string]: { frequency: string; days: number; tasks: string[] } } = {
  Laptop: {
    frequency: 'Cada mes (30 días)',
    days: 30,
    tasks: ['Update Windows', 'Drivers', 'Check disk', 'Limpieza', 'Hardware físico', 'Antivirus']
  },
  Tablet: {
    frequency: 'Cada 15 días',
    days: 15,
    tasks: ['Update Play store', 'Drivers', 'Check disk', 'Limpieza', 'Hardware físico']
  },
  PC: {
    frequency: 'Cada mes (30 días)',
    days: 30,
    tasks: ['Update Windows', 'Drivers', 'Check disk', 'Limpieza', 'Hardware físico', 'Antivirus']
  },
  Zebra: {
    frequency: 'Semanalmente (7 días)',
    days: 7,
    tasks: ['Limpieza', 'Rodillos', 'Cabezal', 'Hardware físico']
  },
  Impresoras: {
    frequency: 'Semanalmente (7 días)',
    days: 7,
    tasks: ['Limpieza', 'Rodillos', 'Bandeja de hojas', 'Toner', 'Hardware físico']
  }
};

export const Maintenance: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [deviceType, setDeviceType] = useState<string>('Laptop');
  const [performedBy, setPerformedBy] = useState<string>('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchItemsAndLogs = async () => {
    setLoading(true);
    try {
      const [itemsRes, mainRes] = await Promise.all([
        api.get('/items'),
        api.get('/maintenance')
      ]);
      setItems(itemsRes.data.items || []);
      setMaintenances(mainRes.data.maintenances || []);
    } catch (err: any) {
      console.error('Error al cargar mantenimientos:', err);
      setError('Error al consultar el módulo de mantenimientos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemsAndLogs();
  }, []);

  // Auto detect device type when item is selected
  useEffect(() => {
    if (!selectedItemId) return;
    const selectedItem = items.find((i) => i.id === selectedItemId);
    if (!selectedItem) return;

    const lowerName = (selectedItem.name + ' ' + (selectedItem.category || '')).toLowerCase();
    if (lowerName.includes('laptop')) setDeviceType('Laptop');
    else if (lowerName.includes('tablet')) setDeviceType('Tablet');
    else if (lowerName.includes('pc') || lowerName.includes('minipc') || lowerName.includes('computadora')) setDeviceType('PC');
    else if (lowerName.includes('zebra')) setDeviceType('Zebra');
    else if (lowerName.includes('impresora') || lowerName.includes('printer')) setDeviceType('Impresoras');

    const config = MAINTENANCE_MATRIX[deviceType] || MAINTENANCE_MATRIX['Laptop'];
    setSelectedTasks(config.tasks);
  }, [selectedItemId]);

  // Update selected tasks when device type changes
  useEffect(() => {
    const config = MAINTENANCE_MATRIX[deviceType] || MAINTENANCE_MATRIX['Laptop'];
    setSelectedTasks(config.tasks);
  }, [deviceType]);

  const handleTaskToggle = (task: string) => {
    if (selectedTasks.includes(task)) {
      setSelectedTasks(selectedTasks.filter((t) => t !== task));
    } else {
      setSelectedTasks([...selectedTasks, task]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      alert('Por favor seleccione un equipo de la lista.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const config = MAINTENANCE_MATRIX[deviceType] || { days: 30 };

    try {
      await api.post('/maintenance', {
        itemId: selectedItemId,
        deviceType,
        performedBy,
        checklist: selectedTasks,
        notes,
        frequencyDays: config.days
      });

      setSuccessMsg('¡Mantenimiento preventivo registrado exitosamente!');
      setPerformedBy('');
      setNotes('');
      fetchItemsAndLogs();
    } catch (err: any) {
      console.error('Error al registrar mantenimiento:', err);
      alert(err.response?.data?.error || 'Error al guardar mantenimiento');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Wrench size={28} style={{ color: 'var(--coficab-copper)' }} />
          Módulo de Mantenimiento Preventivo COFICAB
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Matriz de mantenimiento por tipo de equipo (Laptops, Tablets, PCs, Impresoras y Lectores Zebra).
        </p>
      </div>

      {successMsg && (
        <div style={{
          padding: '1rem',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)',
          color: '#10b981',
          fontSize: '0.95rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem'
        }}>
          <CheckCircle2 size={22} /> {successMsg}
        </div>
      )}

      {/* Maintenance Form Panel */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlusCircle size={20} style={{ color: 'var(--primary)' }} />
          Registrar Mantenimiento Realizado
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>

            {/* Select Equipment */}
            <div className="form-group">
              <label className="form-label">1. Seleccionar Equipo *</label>
              <select
                className="form-input"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                required
              >
                <option value="">-- Seleccionar Equipo del Inventario --</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.sku}) - {item.area || 'Planta'}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de Dispositivo */}
            <div className="form-group">
              <label className="form-label">2. Tipo de Dispositivo (Matriz de Mantenimiento)</label>
              <select
                className="form-input"
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
              >
                <option value="Laptop">Laptop (Frecuencia: Cada mes)</option>
                <option value="Tablet">Tablet (Frecuencia: Cada 15 días)</option>
                <option value="PC">PC / MiniPC (Frecuencia: Cada mes)</option>
                <option value="Zebra">Zebra (Frecuencia: Semanalmente)</option>
                <option value="Impresoras">Impresoras (Frecuencia: Semanalmente)</option>
              </select>
            </div>

            {/* Técnico / Responsable */}
            <div className="form-group">
              <label className="form-label">3. Técnico / Responsable que realizó mantenimiento *</label>
              <input
                type="text"
                className="form-input"
                value={performedBy}
                onChange={(e) => setPerformedBy(e.target.value)}
                placeholder="ej. Juan Pérez (Sistemas / Mantenimiento)"
                required
              />
            </div>

          </div>

          {/* Touch-Optimized Interactive Checklist */}
          <div style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--coficab-copper)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckSquare size={18} /> Marque o desmarque las tareas realizadas para {deviceType} ({MAINTENANCE_MATRIX[deviceType]?.frequency}):
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {(MAINTENANCE_MATRIX[deviceType]?.tasks || []).map((task) => {
                const isChecked = selectedTasks.includes(task);
                return (
                  <div
                    key={task}
                    onClick={() => handleTaskToggle(task)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isChecked ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                      border: isChecked ? '1px solid #10b981' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      border: isChecked ? '2px solid #10b981' : '2px solid var(--text-dim)',
                      background: isChecked ? '#10b981' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      flexShrink: 0
                    }}>
                      {isChecked ? '✓' : ''}
                    </div>
                    <span style={{
                      fontSize: '0.95rem',
                      fontWeight: isChecked ? 700 : 500,
                      color: isChecked ? '#ffffff' : 'var(--text-muted)'
                    }}>
                      {task}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Observaciones o Piezas Reemplazadas</label>
            <input
              type="text"
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ej. Se reemplazó toner y se limpiaron rodillos principales"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              <Wrench size={18} />
              {submitting ? 'Guardando...' : 'Guardar Mantenimiento'}
            </button>
          </div>
        </form>
      </div>

      {/* History Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={20} style={{ color: 'var(--text-muted)' }} />
          Historial de Mantenimientos Realizados
        </h3>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando mantenimientos...</div>
        ) : maintenances.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay mantenimientos registrados aún.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Equipo</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Dispositivo</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Técnico</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Fecha Mantenimiento</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Próximo Mantenimiento</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Tareas Checklist</th>
                </tr>
              </thead>
              <tbody>
                {maintenances.map((m) => {
                  const nextDate = new Date(m.nextDueDate);
                  const isOverdue = nextDate < new Date();
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{m.item?.name || 'Equipo'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--coficab-blue-bright)', fontFamily: 'monospace' }}>SKU: {m.item?.sku}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{m.deviceType}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--coficab-copper)' }}>{m.performedBy}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{new Date(m.performedAt).toLocaleDateString('es-ES')}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className={`badge ${isOverdue ? 'badge-warning' : 'badge-inbound'}`}>
                          <Calendar size={13} /> {nextDate.toLocaleDateString('es-ES')}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {m.checklist}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
