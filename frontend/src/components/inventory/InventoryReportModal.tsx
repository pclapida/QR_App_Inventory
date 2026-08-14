import React from 'react';
import { Item } from '../../services/api';
import { CoficabLogo } from '../CoficabLogo';
import {
  Printer,
  X,
  FileText,
  Calendar,
  Building,
  Tag,
  Package,
  Layers,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

interface InventoryReportModalProps {
  items: Item[];
  totalCount: number;
  filters: {
    category?: string;
    plant?: string;
    searchQuery?: string;
    isITInternal?: boolean;
    status?: string;
  };
  onClose: () => void;
}

export const InventoryReportModal: React.FC<InventoryReportModalProps> = ({
  items,
  totalCount,
  filters,
  onClose
}) => {
  const currentDate = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const totalStock = items.reduce((acc, it) => acc + (it.stock || 0), 0);
  const totalAssigned = items.filter((it) => Boolean(it.assignedTo && it.assignedTo.trim())).length;
  const totalDecommissioned = items.filter((it) => it.status === 'DECOMMISSIONED').length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-content printable-report-modal"
        style={{
          maxWidth: '1080px',
          width: '95vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card)',
          padding: '1.5rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FileText size={22} style={{ color: 'var(--coficab-blue-bright)' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Vista Previa de Reporte Oficial de Inventario
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Formato corporativo optimizado para exportar a PDF o imprimir en hoja membretada
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}
            >
              <Printer size={18} /> Imprimir / Guardar como PDF
            </button>
            <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.45rem' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Report Sheet Content */}
        <div
          id="printable-inventory-area"
          style={{
            flex: 1,
            overflowY: 'auto',
            background: '#ffffff',
            color: '#0f172a',
            padding: '2rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}
        >
          {/* Official Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <CoficabLogo height={46} showTagline={true} themeMode="light" />
              <div>
                <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  REPORTE EJECUTIVO DE CONTROL DE INVENTARIO Y ACTIVOS
                </h1>
                <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600, marginTop: '0.15rem' }}>
                  COFICAB Planta {filters.plant || 'Todas las Plantas'} | Departamento de Tecnologías de Información
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#475569' }}>
              <div><strong>Fecha de Emisión:</strong> {currentDate}</div>
              <div><strong>Total Registros:</strong> {items.length} activos listados</div>
            </div>
          </div>

          {/* Filter & Scope Banner */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.82rem',
            color: '#334155'
          }}>
            <div>
              <strong>Alcance del Reporte:</strong> {filters.isITInternal ? 'Inventario Interno IT' : 'Inventario General Plantas'}
              {filters.category && <span> | Categoría: <strong>{filters.category}</strong></span>}
              {filters.plant && <span> | Planta: <strong>{filters.plant}</strong></span>}
              {filters.status && <span> | Estado: <strong>{filters.status === 'DECOMMISSIONED' ? 'DADOS DE BAJA (SCRAP)' : filters.status}</strong></span>}
              {filters.searchQuery && <span> | Búsqueda: <em>"{filters.searchQuery}"</em></span>}
            </div>

            <div style={{ fontWeight: 700, color: '#1e40af' }}>
              CONFIDENCIAL - USO INTERNO COFICAB
            </div>
          </div>

          {/* Executive Metrics Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.65rem 0.85rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.7rem', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>Total Artículos</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1e3a8a', marginTop: '0.1rem' }}>{items.length}</div>
            </div>

            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.65rem 0.85rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.7rem', color: '#065f46', fontWeight: 700, textTransform: 'uppercase' }}>Unidades en Stock</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#047857', marginTop: '0.1rem' }}>{totalStock} unids</div>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '0.65rem 0.85rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.7rem', color: '#92400e', fontWeight: 700, textTransform: 'uppercase' }}>Asignados a Personal</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#b45309', marginTop: '0.1rem' }}>{totalAssigned}</div>
            </div>

            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.65rem 0.85rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.7rem', color: '#991b1b', fontWeight: 700, textTransform: 'uppercase' }}>Dados de Baja / Scrap</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#dc2626', marginTop: '0.1rem' }}>{totalDecommissioned}</div>
            </div>
          </div>

          {/* High-density printable table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', color: '#0f172a' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem 0.65rem', border: '1px solid #0f172a' }}>SKU / Folio</th>
                <th style={{ padding: '0.5rem 0.65rem', border: '1px solid #0f172a' }}>Nombre del Activo</th>
                <th style={{ padding: '0.5rem 0.65rem', border: '1px solid #0f172a' }}>Modelo / Serie</th>
                <th style={{ padding: '0.5rem 0.65rem', border: '1px solid #0f172a' }}>Categoría</th>
                <th style={{ padding: '0.5rem 0.65rem', border: '1px solid #0f172a' }}>Ubicación / Área</th>
                <th style={{ padding: '0.5rem 0.65rem', border: '1px solid #0f172a' }}>Custodia / Asignado</th>
                <th style={{ padding: '0.5rem 0.65rem', border: '1px solid #0f172a', textAlign: 'center' }}>Stock</th>
                <th style={{ padding: '0.5rem 0.65rem', border: '1px solid #0f172a', textAlign: 'center' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const isDecomm = item.status === 'DECOMMISSIONED';
                return (
                  <tr key={item.id} style={{ background: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '0.45rem 0.65rem', border: '1px solid #cbd5e1', fontWeight: 800, fontFamily: 'monospace', color: '#1e40af' }}>
                      {item.sku}
                    </td>
                    <td style={{ padding: '0.45rem 0.65rem', border: '1px solid #cbd5e1', fontWeight: 700 }}>
                      {item.name}
                    </td>
                    <td style={{ padding: '0.45rem 0.65rem', border: '1px solid #cbd5e1', color: '#475569' }}>
                      {item.model || '—'} {item.serialNumber ? `(S/N: ${item.serialNumber})` : ''}
                    </td>
                    <td style={{ padding: '0.45rem 0.65rem', border: '1px solid #cbd5e1', color: '#334155' }}>
                      {item.category || 'General'}
                    </td>
                    <td style={{ padding: '0.45rem 0.65rem', border: '1px solid #cbd5e1', color: '#334155' }}>
                      {item.plant || 'Planta 2'} {item.area ? `(${item.area})` : ''}
                    </td>
                    <td style={{ padding: '0.45rem 0.65rem', border: '1px solid #cbd5e1', color: item.assignedTo ? '#0f172a' : '#94a3b8', fontWeight: item.assignedTo ? 600 : 400 }}>
                      {item.assignedTo || 'Sin asignar'}
                    </td>
                    <td style={{ padding: '0.45rem 0.65rem', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 800, color: item.stock === 0 ? '#dc2626' : '#047857' }}>
                      {item.stock}
                    </td>
                    <td style={{ padding: '0.45rem 0.65rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                      {isDecomm ? (
                        <span style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.72rem' }}>
                          BAJA ({item.decommissionReason || 'Scrap'})
                        </span>
                      ) : (
                        <span style={{ color: '#047857', fontWeight: 700, fontSize: '0.72rem' }}>
                          ACTIVO
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Signature & Validation Footer */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '2rem',
            marginTop: '3.5rem',
            paddingTop: '1rem',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: '#334155'
          }}>
            <div>
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '0.5rem', fontWeight: 700 }}>
                Elaborado por (Responsable IT)
              </div>
              <div style={{ color: '#64748b' }}>Firma y Nombre</div>
            </div>

            <div>
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '0.5rem', fontWeight: 700 }}>
                Revisado por (Control Patrimonial)
              </div>
              <div style={{ color: '#64748b' }}>Firma y Nombre</div>
            </div>

            <div>
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '0.5rem', fontWeight: 700 }}>
                Autorizado por (Gerencia Planta)
              </div>
              <div style={{ color: '#64748b' }}>Firma y Sello</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
