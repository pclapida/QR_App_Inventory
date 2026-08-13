import React, { useState, useEffect, useMemo } from 'react';
import api, { Requisition } from '../services/api';
import {
  ClipboardList,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  DollarSign,
  Package,
  Layers,
  Edit,
  Trash2,
  Search,
  Filter,
  FileText,
  Calendar,
  User,
  Building,
  Tag,
  Hash,
  AlertCircle,
  Check,
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  'Laptops & Portátiles',
  'Monitores & Pantallas',
  'PCs / MiniPCs & Servidores',
  'Tablets & Dispositivos Móviles',
  'Lectores / Zebras & Escáneres',
  'Impresoras & Consumibles',
  'Redes, AP & Conectividad',
  'Refacciones & Componentes',
  'Herramientas & Accesorios',
  'Equipos & Dispositivos Generales'
];

export const PurchaseOrders: React.FC = () => {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Form State (New Requisition)
  const [requisitionFor, setRequisitionFor] = useState<string>('');
  const [reqNumber, setReqNumber] = useState<string>('');
  const [itemName, setItemName] = useState<string>('');
  const [category, setCategory] = useState<string>('Laptops & Portátiles');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [supplier, setSupplier] = useState<string>('');
  const [poNumber, setPoNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Edit Modal State
  const [editingReq, setEditingReq] = useState<Requisition | null>(null);
  const [editRequisitionFor, setEditRequisitionFor] = useState<string>('');
  const [editReqNumber, setEditReqNumber] = useState<string>('');
  const [editItemName, setEditItemName] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editUnitPrice, setEditUnitPrice] = useState<string>('');
  const [editSupplier, setEditSupplier] = useState<string>('');
  const [editPoNumber, setEditPoNumber] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('PENDING');
  const [editReceivedDate, setEditReceivedDate] = useState<string>('');
  const [editReceivedBy, setEditReceivedBy] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Receive Quick Modal State
  const [receiveTarget, setReceiveTarget] = useState<Requisition | null>(null);
  const [receiveDate, setReceiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [receiveBy, setReceiveBy] = useState<string>('');
  const [receivePoNumber, setReceivePoNumber] = useState<string>('');
  const [receiving, setReceiving] = useState<boolean>(false);

  const fetchRequisitions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/purchase-orders');
      setRequisitions(res.data.orders || []);
    } catch (err) {
      console.error('Error al cargar requisiciones:', err);
      setError('Error al consultar el historial de requisiciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisitions();
  }, []);

  // Real-time calculated total price for new form
  const calculatedTotal = useMemo(() => {
    const qty = quantity || 0;
    const price = parseFloat(unitPrice) || 0;
    return qty * price;
  }, [quantity, unitPrice]);

  // Real-time calculated total price for edit form
  const editCalculatedTotal = useMemo(() => {
    const qty = editQuantity || 0;
    const price = parseFloat(editUnitPrice) || 0;
    return qty * price;
  }, [editQuantity, editUnitPrice]);

  // Handle Form Submission (Create Requisition)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.post('/purchase-orders', {
        requisitionFor,
        reqNumber,
        itemName,
        category,
        quantity,
        unitPrice: unitPrice ? parseFloat(unitPrice) : 0,
        supplier,
        poNumber,
        notes
      });

      setSuccessMsg(`¡Requisición ${res.data.order.reqNumber || res.data.order.id} registrada exitosamente!`);
      // Reset form
      setRequisitionFor('');
      setReqNumber('');
      setItemName('');
      setCategory('Laptops & Portátiles');
      setQuantity(1);
      setUnitPrice('');
      setSupplier('');
      setPoNumber('');
      setNotes('');
      fetchRequisitions();
    } catch (err: any) {
      console.error('Error al crear requisición:', err);
      alert(err.response?.data?.error || 'Error al guardar la requisición');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (req: Requisition) => {
    setEditingReq(req);
    setEditRequisitionFor(req.requisitionFor || '');
    setEditReqNumber(req.reqNumber || '');
    setEditItemName(req.itemName || '');
    setEditCategory(req.category || 'Laptops & Portátiles');
    setEditQuantity(req.quantity || 1);
    setEditUnitPrice(req.unitPrice !== undefined && req.unitPrice !== null ? req.unitPrice.toString() : '');
    setEditSupplier(req.supplier || '');
    setEditPoNumber(req.poNumber || '');
    setEditStatus(req.status || 'PENDING');
    setEditReceivedDate(req.receivedDate ? new Date(req.receivedDate).toISOString().split('T')[0] : '');
    setEditReceivedBy(req.receivedBy || '');
    setEditNotes(req.notes || '');
  };

  // Save Full Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReq) return;
    setSavingEdit(true);

    try {
      await api.put(`/purchase-orders/${editingReq.id}`, {
        requisitionFor: editRequisitionFor,
        reqNumber: editReqNumber,
        itemName: editItemName,
        category: editCategory,
        quantity: editQuantity,
        unitPrice: editUnitPrice ? parseFloat(editUnitPrice) : 0,
        supplier: editSupplier,
        poNumber: editPoNumber,
        status: editStatus,
        receivedDate: editReceivedDate || null,
        receivedBy: editReceivedBy,
        notes: editNotes
      });

      setSuccessMsg(`¡Requisición ${editReqNumber || editingReq.id} actualizada correctamente!`);
      setEditingReq(null);
      fetchRequisitions();
    } catch (err: any) {
      console.error('Error al editar requisición:', err);
      alert(err.response?.data?.error || 'Error al actualizar la requisición');
    } finally {
      setSavingEdit(false);
    }
  };

  // Open Quick Receive Modal
  const handleOpenReceive = (req: Requisition) => {
    setReceiveTarget(req);
    setReceiveDate(new Date().toISOString().split('T')[0]);
    setReceiveBy('');
    setReceivePoNumber(req.poNumber || '');
  };

  // Confirm Quick Receive
  const handleConfirmReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveTarget) return;
    setReceiving(true);

    try {
      // If PO number was assigned or updated during reception
      if (receivePoNumber && receivePoNumber !== receiveTarget.poNumber) {
        await api.put(`/purchase-orders/${receiveTarget.id}`, {
          poNumber: receivePoNumber
        });
      }

      await api.put(`/purchase-orders/${receiveTarget.id}/status`, {
        status: 'RECEIVED',
        receivedDate: receiveDate,
        receivedBy: receiveBy
      });

      setSuccessMsg(`¡Requisición ${receiveTarget.reqNumber || receiveTarget.id} marcada como RECIBIDA! El stock de "${receiveTarget.itemName}" (+${receiveTarget.quantity}) ha sido ingresado al inventario.`);
      setReceiveTarget(null);
      fetchRequisitions();
    } catch (err: any) {
      console.error('Error al recibir requisición:', err);
      alert(err.response?.data?.error || 'Error al registrar la recepción de la requisición');
    } finally {
      setReceiving(false);
    }
  };

  // Delete Requisition
  const handleDelete = async (id: string, folio: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar la requisición ${folio}? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await api.delete(`/purchase-orders/${id}`);
      setSuccessMsg(`Requisición ${folio} eliminada correctamente.`);
      fetchRequisitions();
    } catch (err) {
      console.error('Error al eliminar requisición:', err);
      alert('Error al eliminar la requisición.');
    }
  };

  // Filtered requisitions list
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((r) => {
      const matchSearch =
        searchTerm === '' ||
        (r.reqNumber && r.reqNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.poNumber && r.poNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.itemName && r.itemName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.supplier && r.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.requisitionFor && r.requisitionFor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.category && r.category.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus =
        statusFilter === 'ALL' || r.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [requisitions, searchTerm, statusFilter]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = requisitions.length;
    const pending = requisitions.filter((r) => r.status === 'PENDING').length;
    const approved = requisitions.filter((r) => r.status === 'APPROVED').length;
    const ordered = requisitions.filter((r) => r.status === 'ORDERED' || (r.poNumber && r.status !== 'RECEIVED' && r.status !== 'CANCELLED')).length;
    const received = requisitions.filter((r) => r.status === 'RECEIVED').length;
    const totalSpent = requisitions
      .filter((r) => r.status === 'RECEIVED' || r.status === 'ORDERED' || r.status === 'APPROVED')
      .reduce((acc, r) => acc + (r.totalPrice || 0), 0);

    return { total, pending, approved, ordered, received, totalSpent };
  }, [requisitions]);

  return (
    <div>
      {/* Header Banner */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ClipboardList size={30} style={{ color: 'var(--coficab-blue-bright)' }} />
            Gestión de Requisiciones
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.2rem' }}>
            Control de requerimientos de compra, folios de requisición, asignación de Órdenes de Compra (OC) e ingreso automático de stock al recibir.
          </p>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="liquid-glass-card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL REQUISICIONES</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#60a5fa', marginTop: '0.2rem' }}>{stats.total}</div>
        </div>

        <div className="liquid-glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '2px solid #f59e0b' }}>
          <div style={{ fontSize: '0.78rem', color: '#fde047', fontWeight: 700, textTransform: 'uppercase' }}>PENDIENTES DE OC</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b', marginTop: '0.2rem' }}>{stats.pending}</div>
        </div>

        <div className="liquid-glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '2px solid #3b82f6' }}>
          <div style={{ fontSize: '0.78rem', color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase' }}>CON ORDEN DE COMPRA</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#3b82f6', marginTop: '0.2rem' }}>{stats.ordered}</div>
        </div>

        <div className="liquid-glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '2px solid #10b981' }}>
          <div style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>RECIBIDAS EN INVENTARIO</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981', marginTop: '0.2rem' }}>{stats.received}</div>
        </div>

        <div className="liquid-glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '2px solid var(--coficab-copper)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--coficab-copper)', fontWeight: 700, textTransform: 'uppercase' }}>MONTO ESTIMADO TOTAL</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', marginTop: '0.2rem' }}>
            ${stats.totalSpent.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {successMsg && (
        <div style={{
          padding: '1rem 1.25rem',
          background: 'rgba(16, 185, 129, 0.14)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: 'var(--radius-md)',
          color: '#34d399',
          fontSize: '0.95rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={22} style={{ flexShrink: 0 }} /> {successMsg}
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEW REQUISITION FORM (Ordered with all specified user requirements)     */}
      {/* ========================================================================= */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <PlusCircle size={22} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Nueva Requisición de Compra
          </h3>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Row 1: Requisición para el Producto + Número de Requisición */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.2rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Building size={15} /> 1. Requisición para el Producto / Destino / Área *
              </label>
              <input
                type="text"
                className="form-input"
                value={requisitionFor}
                onChange={(e) => setRequisitionFor(e.target.value)}
                placeholder="ej. Laptop para nuevo ingreso de Calidad / Refacciones Extrusora 3"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Hash size={15} /> 2. Número de Requisición (Folio Interno)
              </label>
              <input
                type="text"
                className="form-input"
                value={reqNumber}
                onChange={(e) => setReqNumber(e.target.value)}
                placeholder="ej. REQ-2026-0042 (Dejar en blanco para autogenerar)"
              />
            </div>
          </div>

          {/* Row 2: Artículo + Tipo/Categoría + Cantidad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.2rem' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Package size={15} /> 3. Artículo / Producto Solicitado *
              </label>
              <input
                type="text"
                className="form-input"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="ej. Laptop Dell Latitude 5540 i7 16GB / Impresora Zebra ZT231"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Tag size={15} /> 4. Tipo / Categoría *
              </label>
              <select
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">5. Cantidad a Solicitar *</label>
              <input
                type="number"
                className="form-input"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value || '1', 10)))}
                min="1"
                required
              />
            </div>
          </div>

          {/* Row 3: Precio Unitario + Precio Total Calculado + Proveedor + Número de OC */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.2rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <DollarSign size={15} /> 6. Precio Unitario Estimado ($)
              </label>
              <input
                type="number"
                className="form-input"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="ej. 850.00"
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">7. Precio Total Estimado ($)</label>
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--bg-card-hover)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '1.1rem',
                fontWeight: 800,
                color: 'var(--coficab-copper)',
                display: 'flex',
                alignItems: 'center'
              }}>
                ${calculatedTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Truck size={15} /> 8. Proveedor Propuesto / Asignado *
              </label>
              <input
                type="text"
                className="form-input"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="ej. Dell México, Zebra Tech, Syscom, etc."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <FileText size={15} /> 9. Número de Orden de Compra (OC / PO)
              </label>
              <input
                type="text"
                className="form-input"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="ej. OC-84920 (Opcional si aún no se genera)"
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                * Puede asignarse o editarse más adelante cuando Compras emita la OC.
              </span>
            </div>
          </div>

          {/* Row 4: Notas / Justificación */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Notas Adicionales / Justificación Técnica</label>
            <input
              type="text"
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ej. Reemplazo por obsolescencia, cotización aprobada #4892..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              <ClipboardList size={18} />
              {submitting ? 'Registrando Requisición...' : 'Registrar Requisición'}
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* REQUISITIONS TABLE & FILTERS                                              */}
      {/* ========================================================================= */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={22} style={{ color: 'var(--primary)' }} />
            Historial de Requisiciones ({filteredRequisitions.length})
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar requisición, OC, artículo..."
                style={{ paddingLeft: '2.4rem', fontSize: '0.88rem' }}
              />
            </div>

            {/* Status Filter */}
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '180px', fontSize: '0.88rem' }}
            >
              <option value="ALL">Todos los Estados</option>
              <option value="PENDING">Pendientes</option>
              <option value="APPROVED">Aprobadas</option>
              <option value="ORDERED">Ordenadas (Con OC)</option>
              <option value="RECEIVED">Recibidas (+Stock)</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando catálogo de requisiciones...</div>
        ) : filteredRequisitions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No se encontraron requisiciones registradas con los filtros seleccionados.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Requisición (Folio)</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Destino / Requisición Para</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Artículo & Tipo</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Cant.</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Precio Unit.</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Total</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Proveedor</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Orden de Compra (OC)</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Estado</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequisitions.map((req) => {
                  const hasPo = Boolean(req.poNumber && req.poNumber.trim());
                  const isReceived = req.status === 'RECEIVED';

                  return (
                    <tr key={req.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}>
                      {/* Folio Requisición */}
                      <td style={{ padding: '0.9rem 1rem', fontWeight: 800, color: 'var(--coficab-blue-bright)', fontFamily: 'monospace' }}>
                        {req.reqNumber || req.id.slice(0, 8).toUpperCase()}
                      </td>

                      {/* Destino */}
                      <td style={{ padding: '0.9rem 1rem', color: 'var(--text-main)', maxWidth: '200px' }}>
                        <div style={{ fontWeight: 600 }}>{req.requisitionFor || '—'}</div>
                        {req.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.notes}</div>}
                      </td>

                      {/* Artículo & Tipo */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{req.itemName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.category || 'Dispositivo'}</div>
                      </td>

                      {/* Cantidad */}
                      <td style={{ padding: '0.9rem 1rem', fontWeight: 800, color: '#10b981' }}>
                        {req.quantity}
                      </td>

                      {/* Precio Unitario */}
                      <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)' }}>
                        ${(req.unitPrice || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Total */}
                      <td style={{ padding: '0.9rem 1rem', fontWeight: 800, color: 'var(--coficab-copper)' }}>
                        ${(req.totalPrice || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Proveedor */}
                      <td style={{ padding: '0.9rem 1rem', color: 'var(--text-main)', fontWeight: 600 }}>
                        {req.supplier}
                      </td>

                      {/* Número de Orden de Compra (OC) */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        {hasPo ? (
                          <span style={{
                            background: 'rgba(37, 99, 235, 0.14)',
                            color: '#3b82f6',
                            border: '1px solid rgba(37, 99, 235, 0.3)',
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-sm)',
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            fontSize: '0.82rem'
                          }}>
                            {req.poNumber}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                            Sin OC asignada
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span className={`badge ${
                          isReceived ? 'badge-inbound' :
                          req.status === 'APPROVED' ? 'badge-inbound' :
                          req.status === 'ORDERED' ? 'badge-inbound' :
                          req.status === 'CANCELLED' ? 'badge-outbound' : 'badge-warning'
                        }`}>
                          {isReceived ? 'RECIBIDO (+Stock)' :
                           req.status === 'APPROVED' ? 'APROBADA' :
                           req.status === 'ORDERED' ? 'ORDENADA (OC)' :
                           req.status === 'CANCELLED' ? 'CANCELADA' : 'PENDIENTE'}
                        </span>
                        {isReceived && req.receivedDate && (
                          <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '0.2rem' }}>
                            {new Date(req.receivedDate).toLocaleDateString('es-MX')}
                            {req.receivedBy && ` por ${req.receivedBy}`}
                          </div>
                        )}
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                          {!isReceived && req.status !== 'CANCELLED' && (
                            <button
                              className="btn btn-success"
                              onClick={() => handleOpenReceive(req)}
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                              title="Registrar fecha y confirmar recepción en inventario"
                            >
                              <Truck size={14} /> Recibir
                            </button>
                          )}

                          <button
                            className="btn btn-secondary"
                            onClick={() => handleOpenEdit(req)}
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                            title="Editar Requisición / Asignar OC / Cambiar fecha"
                          >
                            <Edit size={14} />
                          </button>

                          <button
                            className="btn btn-danger"
                            onClick={() => handleDelete(req.id, req.reqNumber || req.id)}
                            style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem' }}
                            title="Eliminar Requisición"
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* ========================================================================= */}
      {/* EDIT REQUISITION MODAL                                                    */}
      {/* ========================================================================= */}
      {editingReq && (
        <div className="modal-overlay" onClick={() => setEditingReq(null)}>
          <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit size={20} style={{ color: 'var(--primary)' }} />
                Editar Requisición: <span style={{ color: 'var(--coficab-blue-bright)', fontFamily: 'monospace' }}>{editReqNumber || editingReq.id.slice(0, 8)}</span>
              </h3>
              <button className="btn btn-secondary" onClick={() => setEditingReq(null)} style={{ padding: '0.35rem' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">1. Requisición Para / Destino</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editRequisitionFor}
                    onChange={(e) => setEditRequisitionFor(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">2. Número de Requisición (Folio)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editReqNumber}
                    onChange={(e) => setEditReqNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">3. Artículo / Producto</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editItemName}
                    onChange={(e) => setEditItemName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">4. Tipo / Categoría</label>
                  <select
                    className="form-input"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    required
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">5. Cantidad</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(Math.max(1, parseInt(e.target.value || '1', 10)))}
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">6. Precio Unitario ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editUnitPrice}
                    onChange={(e) => setEditUnitPrice(e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">7. Precio Total ($)</label>
                  <div style={{
                    padding: '0.75rem',
                    background: 'var(--bg-card-hover)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 800,
                    color: 'var(--coficab-copper)'
                  }}>
                    ${editCalculatedTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">8. Proveedor</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editSupplier}
                    onChange={(e) => setEditSupplier(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--coficab-blue-bright)', fontWeight: 800 }}>
                    9. Número de Orden de Compra (OC / PO)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editPoNumber}
                    onChange={(e) => setEditPoNumber(e.target.value)}
                    placeholder="ej. OC-84920"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Estado de la Requisición</label>
                  <select
                    className="form-input"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <option value="PENDING">PENDIENTE</option>
                    <option value="APPROVED">APROBADA</option>
                    <option value="ORDERED">ORDENADA (Con OC)</option>
                    <option value="RECEIVED">RECIBIDA (+Stock)</option>
                    <option value="CANCELLED">CANCELADA</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha de Recepción</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editReceivedDate}
                    onChange={(e) => setEditReceivedDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Recibido Por (Persona)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editReceivedBy}
                    onChange={(e) => setEditReceivedBy(e.target.value)}
                    placeholder="ej. Juan Pérez"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Notas / Justificación</label>
                <input
                  type="text"
                  className="form-input"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingReq(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                  <Check size={18} />
                  {savingEdit ? 'Guardando Cambios...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK RECEIVE MODAL                                                       */}
      {/* ========================================================================= */}
      {receiveTarget && (
        <div className="modal-overlay" onClick={() => setReceiveTarget(null)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={22} style={{ color: '#10b981' }} />
                Registrar Recepción de Pedido
              </h3>
              <button className="btn btn-secondary" onClick={() => setReceiveTarget(null)} style={{ padding: '0.35rem' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1.05rem' }}>{receiveTarget.itemName}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Folio: <strong style={{ color: 'var(--coficab-blue-bright)' }}>{receiveTarget.reqNumber || receiveTarget.id}</strong> | Cantidad: <strong style={{ color: '#10b981' }}>+{receiveTarget.quantity} unidades</strong>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Proveedor: <strong>{receiveTarget.supplier}</strong>
              </div>
            </div>

            <form onSubmit={handleConfirmReceive}>
              <div className="form-group">
                <label className="form-label">Número de Orden de Compra (OC / PO Oficial)</label>
                <input
                  type="text"
                  className="form-input"
                  value={receivePoNumber}
                  onChange={(e) => setReceivePoNumber(e.target.value)}
                  placeholder="ej. OC-84920"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha de Recepción Real *</label>
                <input
                  type="date"
                  className="form-input"
                  value={receiveDate}
                  onChange={(e) => setReceiveDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Nombre de Quién Recibe / Almacenista</label>
                <input
                  type="text"
                  className="form-input"
                  value={receiveBy}
                  onChange={(e) => setReceiveBy(e.target.value)}
                  placeholder="ej. Juan Pérez (Dejar en blanco para usuario actual)"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setReceiveTarget(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success" disabled={receiving}>
                  <Truck size={18} />
                  {receiving ? 'Registrando...' : 'Confirmar Recepción (+Stock)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

