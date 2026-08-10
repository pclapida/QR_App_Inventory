import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  ShoppingCart,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  DollarSign,
  Package,
  Layers
} from 'lucide-react';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  itemName: string;
  category?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  status: 'PENDING' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
}

export const PurchaseOrders: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [supplier, setSupplier] = useState<string>('');
  const [itemName, setItemName] = useState<string>('');
  const [category, setCategory] = useState<string>('Equipos & Dispositivos');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/purchase-orders');
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error('Error al cargar órdenes de compra:', err);
      setError('Error al consultar órdenes de compra.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.post('/purchase-orders', {
        supplier,
        itemName,
        category,
        quantity,
        unitPrice: unitPrice ? parseFloat(unitPrice) : 0,
        notes
      });

      setSuccessMsg(`¡Orden de Compra ${res.data.order.poNumber} generada exitosamente!`);
      setSupplier('');
      setItemName('');
      setQuantity(1);
      setUnitPrice('');
      setNotes('');
      fetchOrders();
    } catch (err: any) {
      console.error('Error al crear orden de compra:', err);
      alert(err.response?.data?.error || 'Error al guardar la orden de compra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/purchase-orders/${id}/status`, { status: newStatus });
      if (newStatus === 'RECEIVED') {
        setSuccessMsg('¡Orden de compra marcada como RECIBIDA! El stock ha sido añadido automáticamente al Inventario.');
      }
      fetchOrders();
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      alert('Error al actualizar estado de la orden de compra.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShoppingCart size={28} style={{ color: 'var(--coficab-blue-bright)' }} />
          Gestión de Órdenes de Compra (Requisiciones)
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Solicitudes de compra de nuevos equipos, refacciones y consumibles con ingreso automático al inventario al recibir el pedido.
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

      {/* New Order Form */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlusCircle size={20} style={{ color: 'var(--primary)' }} />
          Nueva Orden de Compra / Requisición
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>

            <div className="form-group">
              <label className="form-label">1. Nombre del Proveedor *</label>
              <input
                type="text"
                className="form-input"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="ej. Zebra Technologies, Honeywell, Samsung"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">2. Artículo / Producto Solicitado *</label>
              <input
                type="text"
                className="form-input"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="ej. Impresora Zebra ZT231"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Equipos & Dispositivos">Equipos & Dispositivos</option>
                <option value="Hardware & Lectores">Hardware & Lectores</option>
                <option value="Consumibles">Consumibles</option>
                <option value="Herramientas">Herramientas</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Cantidad a Pedir *</label>
              <input
                type="number"
                className="form-input"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value || '1', 10)))}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Precio Unitario Estimado ($ USD)</label>
              <input
                type="number"
                className="form-input"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="ej. 450.00"
                step="0.01"
              />
            </div>

          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Notas / Justificación de Compra</label>
            <input
              type="text"
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ej. Reemplazo por falla técnica en almacén de extrusión"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              <ShoppingCart size={18} />
              {submitting ? 'Generando...' : 'Generar Orden de Compra'}
            </button>
          </div>
        </form>
      </div>

      {/* Orders Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
          Historial de Órdenes de Compra
        </h3>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando órdenes de compra...</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay órdenes de compra registradas aún.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>N° Orden</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Proveedor</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Artículo Solicitado</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Cantidad</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Total Estimado</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Estado</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((po) => (
                  <tr key={po.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--coficab-blue-bright)', fontFamily: 'monospace' }}>
                      {po.poNumber}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>{po.supplier}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-main)' }}>{po.itemName}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#10b981' }}>{po.quantity} unids</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--coficab-copper)', fontWeight: 700 }}>
                      ${(po.totalPrice || 0).toLocaleString()} USD
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${
                        po.status === 'RECEIVED' ? 'badge-inbound' :
                        po.status === 'APPROVED' ? 'badge-inbound' :
                        po.status === 'CANCELLED' ? 'badge-outbound' : 'badge-warning'
                      }`}>
                        {po.status === 'RECEIVED' ? 'RECIBIDO (+Stock)' :
                         po.status === 'APPROVED' ? 'APROBADO' :
                         po.status === 'CANCELLED' ? 'CANCELADO' : 'PENDIENTE'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          {po.status === 'PENDING' && (
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleUpdateStatus(po.id, 'APPROVED')}
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.78rem' }}
                            >
                              Aprobar
                            </button>
                          )}
                          <button
                            className="btn btn-success"
                            onClick={() => handleUpdateStatus(po.id, 'RECEIVED')}
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.78rem' }}
                          >
                            <Truck size={13} />
                            Marcar Recibido
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
