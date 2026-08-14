import React, { useState } from 'react';
import api, { Item } from '../../services/api';
import {
  Trash2,
  AlertTriangle,
  X,
  CheckCircle2,
  Building,
  Hash,
  Package,
  Calendar,
  User,
  FileText
} from 'lucide-react';

interface DecommissionModalProps {
  item: Item;
  onClose: () => void;
  onSuccess: (updatedItem: Item, message: string) => void;
}

const DECOMMISSION_REASONS = [
  'Daño irreparable / Falla crítica de hardware',
  'Obsolescencia tecnológica / Fin de ciclo de vida',
  'Pérdida o Robo reportado',
  'Desecho electrónico / Scrap / Basura técnica',
  'Donación a institución o reciclaje',
  'Baja patrimonial contable'
];

const DISPOSAL_METHODS = [
  'Contenedor E-Waste Planta 2 (Desecho Electrónico)',
  'Almacén de Scrap y Residuos Industriales',
  'Destrucción física y borrado seguro de datos',
  'Reciclaje autorizado por proveedor',
  'Resguardo en almacén de piezas'
];

export const DecommissionModal: React.FC<DecommissionModalProps> = ({ item, onClose, onSuccess }) => {
  const [reason, setReason] = useState<string>(DECOMMISSION_REASONS[0]);
  const [disposalMethod, setDisposalMethod] = useState<string>(DISPOSAL_METHODS[0]);
  const [responsiblePerson, setResponsiblePerson] = useState<string>('');
  const [decommissionActNumber, setDecommissionActNumber] = useState<string>(() => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `BAJA-${year}-${rand}`;
  });
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await api.post(`/items/${item.id}/decommission`, {
        reason,
        disposalMethod,
        responsiblePerson,
        decommissionActNumber,
        notes
      });

      onSuccess(res.data.item, res.data.message || `Equipo ${item.name} dado de baja exitosamente.`);
    } catch (err: any) {
      console.error('Error al dar de baja:', err);
      setError(err.response?.data?.error || 'Error al procesar la baja del equipo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '620px', border: '1px solid rgba(239, 68, 68, 0.4)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444'
            }}>
              <Trash2 size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Baja de Activo / Desecho (Scrap)
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Retiro formal del inventario activo para disposición final o basura técnica
              </p>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Item Summary Card */}
        <div style={{
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>{item.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                SKU: <strong style={{ color: 'var(--coficab-blue-bright)', fontFamily: 'monospace' }}>{item.sku}</strong>
                {item.serialNumber && ` | Serie: ${item.serialNumber}`}
              </div>
            </div>
            <span className="badge badge-outbound" style={{ background: '#ef4444', color: '#ffffff', fontWeight: 800 }}>
              STOCK ACTUAL: {item.stock}
            </span>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'flex', gap: '1rem' }}>
            <span>Ubicación: <strong>{item.location || item.plant || 'Planta 2'}</strong></span>
            {item.assignedTo && <span>Custodia: <strong>{item.assignedTo}</strong></span>}
          </div>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            borderRadius: 'var(--radius-sm)',
            color: '#f87171',
            fontSize: '0.88rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <FileText size={14} /> Folio / Acta de Baja *
              </label>
              <input
                type="text"
                className="form-input"
                value={decommissionActNumber}
                onChange={(e) => setDecommissionActNumber(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={14} /> Responsable que Autoriza
              </label>
              <input
                type="text"
                className="form-input"
                value={responsiblePerson}
                onChange={(e) => setResponsiblePerson(e.target.value)}
                placeholder="ej. Ing. Soporte IT / Admin"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <AlertTriangle size={14} style={{ color: '#ef4444' }} /> Motivo Principal de la Baja *
            </label>
            <select
              className="form-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              {DECOMMISSION_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Building size={14} /> Método de Disposición Final / Destino *
            </label>
            <select
              className="form-input"
              value={disposalMethod}
              onChange={(e) => setDisposalMethod(e.target.value)}
              required
            >
              {DISPOSAL_METHODS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Notas Adicionales / Dictamen Técnico</label>
            <textarea
              className="form-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles sobre el daño, componentes recuperados o dictamen técnico de obsolescencia..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Trash2 size={16} />
              {submitting ? 'Procesando Baja...' : 'Confirmar Baja de Activo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
