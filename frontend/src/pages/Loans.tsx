import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Search,
  Filter,
  ArrowRightLeft,
  Calendar,
  User,
  MapPin,
  Laptop,
  Check,
  X,
  Trash2,
  FileText
} from 'lucide-react';
import { DeviceLoan, loansApi, Item, itemsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Loans: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [loans, setLoans] = useState<DeviceLoan[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'OVERDUE' | 'RETURNED'>('ACTIVE');

  // New Loan Modal
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [borrowerName, setBorrowerName] = useState<string>('');
  const [borrowerArea, setBorrowerArea] = useState<string>('');
  const [borrowerBadge, setBorrowerBadge] = useState<string>('');
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // Default to tomorrow
    d.setHours(17, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [loanNotes, setLoanNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Return Modal
  const [returnLoanTarget, setReturnLoanTarget] = useState<DeviceLoan | null>(null);
  const [returnNotes, setReturnNotes] = useState<string>('');
  const [returning, setReturning] = useState<boolean>(false);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await loansApi.getAll();
      setLoans(data);
    } catch (err: any) {
      console.error('Error fetching loans:', err);
      setError(err.response?.data?.error || 'Error al cargar los préstamos de equipos');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableItems = async () => {
    try {
      const data = await itemsApi.getAll();
      // Prioritize IT Internal items or all active items with stock > 0
      setItems(data.filter((i: Item) => i.status !== 'DECOMMISSIONED'));
    } catch (err) {
      console.error('Error fetching items for loan:', err);
    }
  };

  useEffect(() => {
    fetchLoans();
    fetchAvailableItems();
  }, []);

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const matchesSearch =
        loan.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (loan.borrowerArea && loan.borrowerArea.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (loan.item && loan.item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (loan.item && loan.item.sku.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'ACTIVE') return loan.status === 'ACTIVE' && !loan.isOverdue;
      if (statusFilter === 'OVERDUE') return loan.status === 'OVERDUE' || loan.isOverdue;
      if (statusFilter === 'RETURNED') return loan.status === 'RETURNED';

      return true;
    });
  }, [loans, searchTerm, statusFilter]);

  // Metrics
  const activeLoansCount = useMemo(() => loans.filter(l => l.status === 'ACTIVE' && !l.isOverdue).length, [loans]);
  const overdueLoansCount = useMemo(() => loans.filter(l => l.status === 'OVERDUE' || l.isOverdue).length, [loans]);
  const returnedLoansCount = useMemo(() => loans.filter(l => l.status === 'RETURNED').length, [loans]);

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !borrowerName.trim() || !expectedReturnDate) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    try {
      setSubmitting(true);
      await loansApi.create({
        itemId: selectedItemId,
        borrowerName: borrowerName.trim(),
        borrowerArea: borrowerArea.trim() || undefined,
        borrowerBadge: borrowerBadge.trim() || undefined,
        expectedReturn: expectedReturnDate,
        loanNotes: loanNotes.trim() || undefined
      });

      setShowNewModal(false);
      setSelectedItemId('');
      setBorrowerName('');
      setBorrowerArea('');
      setBorrowerBadge('');
      setLoanNotes('');
      setSuccessMsg('Préstamo registrado exitosamente en el sistema.');
      await fetchLoans();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Error creating loan:', err);
      alert(err.response?.data?.error || 'Error al registrar el préstamo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReturn = async () => {
    if (!returnLoanTarget) return;

    try {
      setReturning(true);
      await loansApi.returnLoan(returnLoanTarget.id, returnNotes.trim() || undefined);
      setReturnLoanTarget(null);
      setReturnNotes('');
      setSuccessMsg('Devolución de equipo registrada correctamente. El equipo ha sido reincorporado a IT.');
      await fetchLoans();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Error returning loan:', err);
      alert(err.response?.data?.error || 'Error al registrar la devolución');
    } finally {
      setReturning(false);
    }
  };

  const handleDeleteLoan = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este registro histórico de préstamo?')) return;

    try {
      await loansApi.delete(id);
      setSuccessMsg('Registro de préstamo eliminado.');
      await fetchLoans();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Error deleting loan:', err);
      alert(err.response?.data?.error || 'Error al eliminar el registro');
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ArrowRightLeft size={28} style={{ color: 'var(--coficab-copper)' }} />
            Control de Préstamos Temporales de IT
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Registro rápido de Check-In / Check-Out para laptops de préstamo, adaptadores, proyectores y herramientas de Sistemas.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowNewModal(true)}
          style={{ background: 'linear-gradient(135deg, #c98a4b 0%, #b07238 100%)', fontWeight: 800, padding: '0.65rem 1.25rem' }}
        >
          <PlusCircle size={18} />
          Registrar Nuevo Préstamo
        </button>
      </div>

      {/* Alert message */}
      {successMsg && (
        <div style={{
          padding: '0.9rem 1.2rem',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: 'var(--radius-md)',
          color: '#10b981',
          fontWeight: 600,
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            {successMsg}
          </div>
          <button onClick={() => setSuccessMsg(null)} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div
          className="glass-panel glass-panel-interactive"
          style={{
            padding: '1.15rem',
            cursor: 'pointer',
            borderColor: statusFilter === 'ACTIVE' ? 'var(--primary)' : undefined,
            background: statusFilter === 'ACTIVE' ? 'rgba(0, 43, 144, 0.12)' : undefined
          }}
          onClick={() => setStatusFilter('ACTIVE')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>Préstamos Activos</span>
            <Clock size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            {activeLoansCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, marginTop: '0.2rem' }}>
            🟢 En tiempo de uso
          </div>
        </div>

        <div
          className="glass-panel glass-panel-interactive"
          style={{
            padding: '1.15rem',
            cursor: 'pointer',
            borderColor: statusFilter === 'OVERDUE' ? '#ef4444' : overdueLoansCount > 0 ? 'rgba(239, 68, 68, 0.4)' : undefined,
            background: statusFilter === 'OVERDUE' ? 'rgba(239, 68, 68, 0.15)' : undefined
          }}
          onClick={() => setStatusFilter('OVERDUE')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>Atrasados / Vencidos</span>
            <AlertTriangle size={20} style={{ color: '#ef4444' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ef4444', marginTop: '0.25rem' }}>
            {overdueLoansCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600, marginTop: '0.2rem' }}>
            🔴 Requiere seguimiento / retorno
          </div>
        </div>

        <div
          className="glass-panel glass-panel-interactive"
          style={{
            padding: '1.15rem',
            cursor: 'pointer',
            borderColor: statusFilter === 'RETURNED' ? '#10b981' : undefined,
            background: statusFilter === 'RETURNED' ? 'rgba(16, 185, 129, 0.12)' : undefined
          }}
          onClick={() => setStatusFilter('RETURNED')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>Devueltos a IT</span>
            <CheckCircle2 size={20} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981', marginTop: '0.25rem' }}>
            {returnedLoansCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>
            ⚪ Reingresados al taller
          </div>
        </div>

        <div
          className="glass-panel glass-panel-interactive"
          style={{
            padding: '1.15rem',
            cursor: 'pointer',
            borderColor: statusFilter === 'ALL' ? 'var(--coficab-copper)' : undefined
          }}
          onClick={() => setStatusFilter('ALL')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>Historial Total</span>
            <Laptop size={20} style={{ color: 'var(--coficab-copper)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--coficab-copper)', marginTop: '0.25rem' }}>
            {loans.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>
            📋 Registros totales
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className={`btn ${statusFilter === 'ACTIVE' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('ACTIVE')}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
          >
            🟢 Activos ({activeLoansCount})
          </button>
          <button
            className={`btn ${statusFilter === 'OVERDUE' ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('OVERDUE')}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
          >
            🔴 Vencidos ({overdueLoansCount})
          </button>
          <button
            className={`btn ${statusFilter === 'RETURNED' ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('RETURNED')}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
          >
            ⚪ Devueltos ({returnedLoansCount})
          </button>
          <button
            className={`btn ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('ALL')}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
          >
            Todos ({loans.length})
          </button>
        </div>

        <div style={{ position: 'relative', minWidth: '260px', flex: '1', maxWidth: '380px' }}>
          <Search size={17} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por colaborador, área, SKU..."
            style={{ paddingLeft: '2.4rem' }}
          />
        </div>
      </div>

      {/* Loans Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Cargando registros de préstamos...
          </div>
        ) : error ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>
            {error}
          </div>
        ) : filteredLoans.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <ArrowRightLeft size={44} style={{ color: 'var(--text-dim)', marginBottom: '0.75rem' }} />
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>No hay préstamos para mostrar con el filtro actual.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Equipo Prestado</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Solicitante & Área</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Fecha Préstamo</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Retorno Estimado</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Estado</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Técnico IT</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map((loan) => {
                  const isReturned = loan.status === 'RETURNED';
                  const isOverdue = loan.status === 'OVERDUE' || loan.isOverdue;
                  const returnDate = new Date(loan.expectedReturn);
                  const loanDate = new Date(loan.loanDate);

                  return (
                    <tr key={loan.id} style={{ borderBottom: '1px solid var(--border-color)', background: isOverdue ? 'rgba(239, 68, 68, 0.04)' : undefined }}>
                      {/* Equipo */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{loan.item?.name || 'Equipo no disponible'}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--coficab-copper)', fontFamily: 'monospace' }}>
                          SKU: {loan.item?.sku || '-'} {loan.item?.model ? `| ${loan.item.model}` : ''}
                        </div>
                      </td>

                      {/* Solicitante */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <User size={14} style={{ color: 'var(--primary)' }} />
                          {loan.borrowerName}
                        </div>
                        {loan.borrowerArea && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                            <MapPin size={12} />
                            {loan.borrowerArea} {loan.borrowerBadge ? `(Gafete: ${loan.borrowerBadge})` : ''}
                          </div>
                        )}
                      </td>

                      {/* Fecha de Préstamo */}
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        <div>{loanDate.toLocaleDateString()}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {loanDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Fecha de Retorno Estimada */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: isOverdue ? '#ef4444' : isReturned ? 'var(--text-muted)' : 'var(--text-main)', fontSize: '0.85rem' }}>
                          {returnDate.toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: isOverdue ? '#ef4444' : 'var(--text-dim)' }}>
                          {returnDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Estado */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {isReturned ? (
                          <span className="badge badge-inbound" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981' }}>
                            <CheckCircle2 size={12} /> Devuelto
                          </span>
                        ) : isOverdue ? (
                          <span className="badge badge-outbound" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444', fontWeight: 800 }}>
                            <AlertTriangle size={12} /> Vencido
                          </span>
                        ) : (
                          <span className="badge" style={{ background: 'rgba(37, 99, 235, 0.18)', color: 'var(--coficab-blue-bright)', border: '1px solid var(--coficab-blue-bright)' }}>
                            <Clock size={12} /> En Préstamo
                          </span>
                        )}
                      </td>

                      {/* Técnico Responsable */}
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <div>Entregó: <strong style={{ color: 'var(--text-main)' }}>{loan.loanedBy}</strong></div>
                        {loan.receivedBy && (
                          <div style={{ fontSize: '0.75rem', color: '#10b981' }}>
                            Recibió: {loan.receivedBy}
                          </div>
                        )}
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          {!isReturned && (
                            <button
                              className="btn btn-success"
                              onClick={() => setReturnLoanTarget(loan)}
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.3rem' }}
                              title="Registrar devolución a IT"
                            >
                              <Check size={14} /> Devolver
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleDeleteLoan(loan.id)}
                              style={{ padding: '0.35rem 0.55rem', color: '#f87171' }}
                              title="Eliminar registro"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nuevo Préstamo */}
      {showNewModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <ArrowRightLeft size={20} style={{ color: 'var(--coficab-copper)' }} />
                Registrar Préstamo Temporal de IT
              </h3>
              <button onClick={() => setShowNewModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Seleccionar Equipo a Prestar *</label>
                <select
                  className="form-input"
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  required
                >
                  <option value="">-- Seleccionar Equipo --</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.sku}) - {i.plant} {i.isITInternal ? '[IT Interno]' : ''} (Disp: {i.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nombre del Colaborador / Solicitante *</label>
                <input
                  type="text"
                  className="form-input"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  placeholder="ej. Ing. Carlos Mendoza"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Área / Departamento</label>
                  <input
                    type="text"
                    className="form-input"
                    value={borrowerArea}
                    onChange={(e) => setBorrowerArea(e.target.value)}
                    placeholder="ej. Calidad / Extrusión"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">No. Gafete / Ficha</label>
                  <input
                    type="text"
                    className="form-input"
                    value={borrowerBadge}
                    onChange={(e) => setBorrowerBadge(e.target.value)}
                    placeholder="ej. 84920"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 800 }}>
                  Fecha y Hora Estimada de Devolución *
                </label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  required
                  style={{ borderColor: 'var(--primary)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Motivo o Notas del Préstamo (Opcional)</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={loanNotes}
                  onChange={(e) => setLoanNotes(e.target.value)}
                  placeholder="ej. Para presentación en sala de juntas Planta 2, incluye cargador."
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewModal(false)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ background: 'linear-gradient(135deg, #c98a4b 0%, #b07238 100%)', fontWeight: 800 }}
                >
                  {submitting ? 'Registrando...' : 'Confirmar Préstamo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Devolución de Préstamo */}
      {returnLoanTarget && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <CheckCircle2 size={20} style={{ color: '#10b981' }} />
                Registrar Devolución de Equipo
              </h3>
              <button onClick={() => setReturnLoanTarget(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Equipo:</div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>{returnLoanTarget.item?.name} ({returnLoanTarget.item?.sku})</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Solicitante:</div>
              <div style={{ fontWeight: 700, color: 'var(--coficab-copper)' }}>{returnLoanTarget.borrowerName} ({returnLoanTarget.borrowerArea || 'Planta'})</div>
            </div>

            <div className="form-group">
              <label className="form-label">Observaciones de Recepción / Estado del Equipo</label>
              <textarea
                className="form-input"
                rows={3}
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="ej. Equipo devuelto en óptimas condiciones con todos sus accesorios."
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setReturnLoanTarget(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-success"
                disabled={returning}
                onClick={handleConfirmReturn}
                style={{ fontWeight: 800 }}
              >
                {returning ? 'Registrando...' : 'Confirmar Devolución'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
