import React from 'react';
import { Requisition } from '../../services/api';
import { CoficabLogo } from '../CoficabLogo';
import {
  Printer,
  X,
  FileText,
  Building,
  CheckCircle2,
  Clock,
  DollarSign,
  Truck,
  Hash,
  Calendar
} from 'lucide-react';

interface RequisitionReportModalProps {
  requisitions: Requisition[];
  selectedSingle?: Requisition | null;
  onClose: () => void;
}

export const RequisitionReportModal: React.FC<RequisitionReportModalProps> = ({
  requisitions,
  selectedSingle,
  onClose
}) => {
  const isSingle = Boolean(selectedSingle);
  const itemsToRender = selectedSingle ? [selectedSingle] : requisitions;

  const totalValue = itemsToRender.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
  const totalUnits = itemsToRender.reduce((sum, r) => sum + (r.quantity || 0), 0);

  const currentDate = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-content printable-report-modal"
        style={{
          maxWidth: '1000px',
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
                {isSingle ? `Orden de Requisición ${selectedSingle?.reqNumber || ''}` : 'Reporte Ejecutivo de Gestión de Requisiciones'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Formato corporativo oficial para impresión y envío a departamento de Compras / Finanzas
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}
            >
              <Printer size={18} /> Imprimir / Exportar a PDF
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
          {/* Official Corporate Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <CoficabLogo height={46} showTagline={true} themeMode="light" />
              <div>
                <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  {isSingle ? 'FORMATO OFICIAL DE REQUISICIÓN DE COMPRA' : 'REPORTE CONSOLIDADO DE REQUISICIONES DE IT'}
                </h1>
                <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600, marginTop: '0.15rem' }}>
                  COFICAB Planta 2 | Departamento de Tecnologías de Información
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#475569' }}>
              <div><strong>Emisión:</strong> {currentDate}</div>
              {isSingle && selectedSingle?.reqNumber && (
                <div style={{ color: '#1e40af', fontWeight: 900, fontSize: '0.9rem', marginTop: '0.2rem' }}>
                  FOLIO: {selectedSingle.reqNumber}
                </div>
              )}
            </div>
          </div>

          {/* Single Requisition Detailed Box */}
          {isSingle && selectedSingle && (
            <div style={{
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: '8px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              fontSize: '0.85rem'
            }}>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Folio de Requisición</div>
                <div style={{ fontWeight: 900, color: '#1e40af', fontSize: '1.05rem', fontFamily: 'monospace' }}>
                  {selectedSingle.reqNumber || 'N/A'}
                </div>
              </div>

              <div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Requisición para</div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>
                  {selectedSingle.requisitionFor || 'Uso General IT'}
                </div>
              </div>

              <div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Orden de Compra (OC)</div>
                <div style={{ fontWeight: 800, color: selectedSingle.poNumber ? '#047857' : '#94a3b8' }}>
                  {selectedSingle.poNumber || 'Pendiente de Asignación'}
                </div>
              </div>

              <div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Proveedor</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedSingle.supplier}</div>
              </div>

              <div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Estado Actual</div>
                <div style={{ fontWeight: 800, color: selectedSingle.status === 'RECEIVED' ? '#047857' : selectedSingle.status === 'ORDERED' ? '#1e40af' : '#d97706' }}>
                  {selectedSingle.status === 'RECEIVED' ? 'RECIBIDO EN PLANTA' : selectedSingle.status === 'ORDERED' ? 'ORDENADO' : 'PENDIENTE'}
                </div>
              </div>

              <div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Fecha de Creación</div>
                <div style={{ color: '#334155' }}>
                  {new Date(selectedSingle.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              {selectedSingle.receivedDate && (
                <div style={{ gridColumn: '1 / -1', background: '#ecfdf5', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                  <strong>Datos de Recepción:</strong> Recibido el {new Date(selectedSingle.receivedDate).toLocaleDateString('es-MX')} por <strong>{selectedSingle.receivedBy || 'Personal de IT'}</strong>.
                </div>
              )}

              {selectedSingle.notes && (
                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: '0.6rem', color: '#475569', fontStyle: 'italic' }}>
                  <strong>Justificación / Notas:</strong> {selectedSingle.notes}
                </div>
              )}
            </div>
          )}

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', color: '#0f172a', marginBottom: '1.5rem' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                <th style={{ padding: '0.6rem 0.75rem', border: '1px solid #0f172a' }}>Folio Req.</th>
                <th style={{ padding: '0.6rem 0.75rem', border: '1px solid #0f172a' }}>Artículo / Descripción</th>
                <th style={{ padding: '0.6rem 0.75rem', border: '1px solid #0f172a' }}>Categoría</th>
                <th style={{ padding: '0.6rem 0.75rem', border: '1px solid #0f172a', textAlign: 'center' }}>Cant.</th>
                <th style={{ padding: '0.6rem 0.75rem', border: '1px solid #0f172a', textAlign: 'right' }}>Precio Unit.</th>
                <th style={{ padding: '0.6rem 0.75rem', border: '1px solid #0f172a', textAlign: 'right' }}>Precio Total</th>
                <th style={{ padding: '0.6rem 0.75rem', border: '1px solid #0f172a' }}>Proveedor</th>
                <th style={{ padding: '0.6rem 0.75rem', border: '1px solid #0f172a', textAlign: 'center' }}>No. OC</th>
                <th style={{ padding: '0.6rem 0.75rem', border: '1px solid #0f172a', textAlign: 'center' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {itemsToRender.map((req, idx) => (
                <tr key={req.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', fontWeight: 800, fontFamily: 'monospace', color: '#1e40af' }}>
                    {req.reqNumber || '—'}
                  </td>
                  <td style={{ padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', fontWeight: 700 }}>
                    {req.itemName}
                  </td>
                  <td style={{ padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', color: '#475569' }}>
                    {req.category || 'General'}
                  </td>
                  <td style={{ padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 800 }}>
                    {req.quantity}
                  </td>
                  <td style={{ padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', textAlign: 'right' }}>
                    ${(req.unitPrice || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 800, color: '#047857' }}>
                    ${(req.totalPrice || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', color: '#334155' }}>
                    {req.supplier}
                  </td>
                  <td style={{ padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', textAlign: 'center', fontFamily: 'monospace', color: req.poNumber ? '#1e40af' : '#94a3b8' }}>
                    {req.poNumber || '—'}
                  </td>
                  <td style={{ padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                    {req.status === 'RECEIVED' ? 'RECIBIDO' : req.status === 'ORDERED' ? 'ORDENADO' : 'PENDIENTE'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f1f5f9', fontWeight: 800 }}>
                <td colSpan={3} style={{ padding: '0.65rem 0.75rem', border: '1px solid #cbd5e1', textAlign: 'right' }}>
                  TOTALES CONSOLIDADOS:
                </td>
                <td style={{ padding: '0.65rem 0.75rem', border: '1px solid #cbd5e1', textAlign: 'center', color: '#1e40af' }}>
                  {totalUnits} unids
                </td>
                <td style={{ padding: '0.65rem 0.75rem', border: '1px solid #cbd5e1' }}></td>
                <td style={{ padding: '0.65rem 0.75rem', border: '1px solid #cbd5e1', textAlign: 'right', fontSize: '1rem', color: '#047857' }}>
                  ${totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                </td>
                <td colSpan={3} style={{ padding: '0.65rem 0.75rem', border: '1px solid #cbd5e1' }}></td>
              </tr>
            </tfoot>
          </table>

          {/* Corporate Signatures */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '2.5rem',
            marginTop: '3.5rem',
            paddingTop: '1rem',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: '#334155'
          }}>
            <div>
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '0.5rem', fontWeight: 700 }}>
                Solicitante (IT COFICAB)
              </div>
              <div style={{ color: '#64748b' }}>Firma y Nombre</div>
            </div>

            <div>
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '0.5rem', fontWeight: 700 }}>
                Aprobación (Compras / Finanzas)
              </div>
              <div style={{ color: '#64748b' }}>Firma y Sello</div>
            </div>

            <div>
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '0.5rem', fontWeight: 700 }}>
                Recepción en Planta
              </div>
              <div style={{ color: '#64748b' }}>Firma y Fecha</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
