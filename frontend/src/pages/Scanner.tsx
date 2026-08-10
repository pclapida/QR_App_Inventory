import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { Item, Transaction } from '../services/api';
import { HardwareScanner } from '../components/HardwareScanner';
import { QRCameraScanner } from '../components/QRCameraScanner';
import { QRModal } from '../components/QRModal';
import { ResponsivaModal } from '../components/ResponsivaModal';
import {
  Scan,
  Camera,
  Keyboard,
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  History,
  Layers,
  MapPin,
  Cpu,
  Hash,
  Globe,
  FileText,
  PlusCircle,
  RefreshCw,
  XCircle,
  UserCheck,
  Wrench,
  Trash2,
  Edit,
  X,
  CheckSquare,
  ShieldCheck
} from 'lucide-react';

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

export const Scanner: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [searchParams] = useSearchParams();

  const [scanMode, setScanMode] = useState<'hardware' | 'camera'>('hardware');
  const [scannedItem, setScannedItem] = useState<any | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [transQuantity, setTransQuantity] = useState<number>(1);
  const [transNotes, setTransNotes] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [transLoading, setTransLoading] = useState<boolean>(false);

  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [showResponsivaModal, setShowResponsivaModal] = useState<boolean>(false);

  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [targetPlant, setTargetPlant] = useState<string>('Planta 3');
  const [transferNotesInput, setTransferNotesInput] = useState<string>('');
  const [transferSubmitting, setTransferSubmitting] = useState<boolean>(false);

  const [showMaintenanceModal, setShowMaintenanceModal] = useState<boolean>(false);
  const [maintPerformedBy, setMaintPerformedBy] = useState<string>('');
  const [maintNotes, setMaintNotes] = useState<string>('');
  const [maintAvailableTasks, setMaintAvailableTasks] = useState<string[]>([]);
  const [maintSelectedTasks, setMaintSelectedTasks] = useState<string[]>([]);
  const [maintSubmitting, setMaintSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      handleScanCode(codeParam);
    }
  }, [searchParams]);

  const handleScanCode = async (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setLastScannedCode(cleanCode);
    const startTime = Date.now();

    try {
      const res = await api.get(`/items/scan/${encodeURIComponent(cleanCode)}`);
      const duration = Date.now() - startTime;
      console.log(`Búsqueda de código "${cleanCode}" completada en ${duration}ms (RNF-07: <2000ms)`);
      setScannedItem(res.data.item);
    } catch (err: any) {
      console.error('Error al procesar escaneo:', err);
      setScannedItem(null);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(`El código de escaneo "${cleanCode}" no se encuentra registrado en el sistema COFICAB.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTransferPlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedItem || !targetPlant) return;
    setTransferSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await api.post(`/items/${scannedItem.id}/transfer`, {
        targetPlant,
        notes: transferNotesInput
      });

      setScannedItem(res.data.item);
      setSuccessMessage(`¡Equipo movido exitosamente a ${targetPlant}!`);
      setShowTransferModal(false);
      setTransferNotesInput('');

      // Refresh transaction history
      const historyRes = await api.get(`/items/${scannedItem.id}/transactions`);
      setScannedItem((prev: any) => prev ? { ...prev, transactions: historyRes.data.transactions } : null);
    } catch (err: any) {
      console.error('Error al trasladar planta:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al procesar el traslado de planta.');
      }
    } finally {
      setTransferSubmitting(false);
    }
  };

  const handleTransaction = async (type: 'INBOUND' | 'OUTBOUND') => {
    if (!scannedItem) return;
    setTransLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await api.post(`/items/${scannedItem.id}/transactions`, {
        type,
        quantity: transQuantity,
        notes: transNotes,
        assignedTo: assignedTo
      });

      setScannedItem(res.data.item);
      const recipientText = assignedTo.trim() ? ` (Entregado a: ${assignedTo.trim()})` : '';
      setSuccessMessage(
        `¡${type === 'INBOUND' ? 'Entrada' : 'Salida'} de ${transQuantity} ${res.data.item.unit}(s) registrada exitosamente!${recipientText}`
      );
      setTransQuantity(1);
      setTransNotes('');
      setAssignedTo('');

      const historyRes = await api.get(`/items/${scannedItem.id}/transactions`);
      setScannedItem((prev: any) => prev ? { ...prev, transactions: historyRes.data.transactions } : null);
    } catch (err: any) {
      console.error('Error al realizar transacción:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al registrar la transacción de inventario.');
      }
    } finally {
      setTransLoading(false);
    }
  };

  const handleDeleteScannedItem = async () => {
    if (!scannedItem) return;
    if (!window.confirm(`¿Está seguro de eliminar el equipo "${scannedItem.name}" del inventario?`)) return;

    try {
      await api.delete(`/items/${scannedItem.id}`);
      setSuccessMessage(`El artículo "${scannedItem.name}" ha sido eliminado del sistema.`);
      setScannedItem(null);
    } catch (err: any) {
      console.error('Error al eliminar:', err);
      alert('Error al eliminar el artículo.');
    }
  };

  const handleOpenMaintenanceModal = () => {
    if (!scannedItem) return;
    let devType = 'Laptop';
    const lower = (scannedItem.name + ' ' + (scannedItem.category || '')).toLowerCase();
    if (lower.includes('tablet')) devType = 'Tablet';
    else if (lower.includes('pc') || lower.includes('minipc')) devType = 'PC';
    else if (lower.includes('zebra')) devType = 'Zebra';
    else if (lower.includes('impresora') || lower.includes('printer')) devType = 'Impresoras';

    const config = MAINTENANCE_MATRIX[devType] || MAINTENANCE_MATRIX['Laptop'];
    setMaintAvailableTasks(config.tasks);
    setMaintSelectedTasks(config.tasks);
    setShowMaintenanceModal(true);
  };

  const toggleMaintTask = (task: string) => {
    if (maintSelectedTasks.includes(task)) {
      setMaintSelectedTasks(maintSelectedTasks.filter((t) => t !== task));
    } else {
      setMaintSelectedTasks([...maintSelectedTasks, task]);
    }
  };



  const handleSaveMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedItem) return;
    setMaintSubmitting(true);

    let devType = 'Laptop';
    const lower = (scannedItem.name + ' ' + (scannedItem.category || '')).toLowerCase();
    if (lower.includes('tablet')) devType = 'Tablet';
    else if (lower.includes('pc') || lower.includes('minipc')) devType = 'PC';
    else if (lower.includes('zebra')) devType = 'Zebra';
    else if (lower.includes('impresora')) devType = 'Impresoras';

    const config = MAINTENANCE_MATRIX[devType] || { days: 30 };

    try {
      await api.post('/maintenance', {
        itemId: scannedItem.id,
        deviceType: devType,
        performedBy: maintPerformedBy,
        checklist: maintSelectedTasks,
        notes: maintNotes,
        frequencyDays: config.days
      });

      setSuccessMessage(`¡Mantenimiento preventivo registrado exitosamente para ${scannedItem.name}!`);
      setShowMaintenanceModal(false);
      setMaintPerformedBy('');
      setMaintNotes('');

      const refreshRes = await api.get(`/items/scan/${encodeURIComponent(scannedItem.sku)}`);
      setScannedItem(refreshRes.data.item);
    } catch (err: any) {
      console.error('Error al guardar mantenimiento:', err);
      alert('Error al guardar el mantenimiento.');
    } finally {
      setMaintSubmitting(false);
    }
  };

  const resetScannerState = () => {
    setScannedItem(null);
    setLastScannedCode(null);
    setError(null);
    setSuccessMessage(null);
    setAssignedTo('');
  };

  const isAssetCategory = scannedItem && (
    scannedItem.category === 'Equipos & Dispositivos' ||
    scannedItem.category === 'Hardware & Lectores' ||
    scannedItem.category === 'Activo Fijo' ||
    scannedItem.category === 'Maquinaria'
  );

  const isSimpleCategory = scannedItem && (
    scannedItem.category === 'Consumibles' ||
    scannedItem.category === 'Herramientas'
  );

  const getMaintenanceCountdown = () => {
    if (!scannedItem) return null;
    const latestMaint = scannedItem.maintenances && scannedItem.maintenances.length > 0 ? scannedItem.maintenances[0] : null;
    if (!latestMaint || !latestMaint.nextDueDate) {
      return { text: 'Mantenimiento (Pendiente)', isOverdue: true, days: 0 };
    }

    const nextDueDate = new Date(latestMaint.nextDueDate);
    const now = new Date();
    const diffTime = nextDueDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return { text: `Mantenimiento (Vencido hace ${Math.abs(daysLeft)} días)`, isOverdue: true, days: daysLeft };
    } else if (daysLeft === 0) {
      return { text: `Mantenimiento (Vence HOY)`, isOverdue: true, days: 0 };
    } else {
      return { text: `Mantenimiento (Próximo: en ${daysLeft} días)`, isOverdue: false, days: daysLeft };
    }
  };

  const maintCountdown = getMaintenanceCountdown();

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
          Escáner y Captura de Códigos QR COFICAB
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Soporte para Pistola Lector Físico y Cámara Móvil (iPhone / Android) (RF-04, RF-05).
        </p>

        {/* Mode Selector */}
        <div style={{
          display: 'inline-flex',
          background: 'var(--bg-card)',
          padding: '0.35rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          marginTop: '1rem',
          gap: '0.5rem'
        }}>
          <button
            className={`btn ${scanMode === 'hardware' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setScanMode('hardware')}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <Keyboard size={18} />
            Pistola Lector Físico
          </button>

          <button
            className={`btn ${scanMode === 'camera' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setScanMode('camera')}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <Camera size={18} />
            Cámara Móvil
          </button>
        </div>
      </div>

      {scanMode === 'hardware' ? (
        <HardwareScanner onScan={handleScanCode} loading={loading} />
      ) : (
        <QRCameraScanner onScan={handleScanCode} loading={loading} />
      )}

      {/* 🔴 NOT FOUND ALERT BANNER */}
      {error && (
        <div className="glass-panel" style={{
          padding: '1.5rem',
          background: 'rgba(244, 63, 94, 0.12)',
          border: '2px solid #f43f5e',
          borderRadius: 'var(--radius-md)',
          color: '#f43f5e',
          marginBottom: '1.5rem',
          boxShadow: '0 8px 24px rgba(244, 63, 94, 0.25)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#f43f5e',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <XCircle size={28} />
            </div>

            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.35rem', color: '#ffffff' }}>
                CÓDIGO NO ENCONTRADO EN SISTEMA
              </h3>
              <p style={{ color: '#fca5a5', fontSize: '0.95rem', marginBottom: '1rem' }}>
                No existe ningún equipo, herramienta o producto registrado con el código: <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>"{lastScannedCode}"</strong>.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/add-item?name=${encodeURIComponent(lastScannedCode || '')}`)}
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                  <PlusCircle size={18} />
                  Registrar Producto Manualmente
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={resetScannerState}
                >
                  <RefreshCw size={18} />
                  Revisar o Reintentar QR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOUND ITEM BANNER */}
      {scannedItem && (
        <div className="glass-panel" style={{
          padding: '1.5rem',
          background: 'rgba(16, 185, 129, 0.14)',
          border: '2px solid #10b981',
          borderRadius: 'var(--radius-md)',
          color: '#10b981',
          marginBottom: '1.5rem',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#10b981',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CheckCircle2 size={30} />
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#34d399' }}>
                  ¡PRODUCTO / EQUIPO / HERRAMIENTA ENCONTRADO!
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff' }}>
                  {scannedItem.name}
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Categoría: <strong style={{ color: '#ffffff' }}>{scannedItem.category}</strong> | Stock: <strong style={{ color: '#34d399' }}>{scannedItem.stock} {scannedItem.unit}s</strong>
                </div>
              </div>
            </div>

            <button className="btn btn-secondary" onClick={resetScannerState} style={{ fontSize: '0.85rem' }}>
              Escanear Otro QR
            </button>
          </div>
        </div>
      )}

      {successMessage && (
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
          <CheckCircle2 size={22} style={{ flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Scanned Item Details Card */}
      {scannedItem && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                <span className="badge badge-inbound">{scannedItem.category || 'General'}</span>
                
                {/* Plant Badge */}
                <span className="badge" style={{
                  background: scannedItem.plant === 'Planta UPCAST' ? 'rgba(201, 138, 75, 0.2)' : 'rgba(37, 99, 235, 0.2)',
                  color: scannedItem.plant === 'Planta UPCAST' ? 'var(--coficab-copper)' : '#60a5fa',
                  border: scannedItem.plant === 'Planta UPCAST' ? '1px solid var(--coficab-copper)' : '1px solid #3b82f6',
                  fontWeight: 800
                }}>
                  {scannedItem.plant || 'Planta 2'}
                </span>

                {/* Warranty Badge */}
                {scannedItem.hasWarranty ? (
                  <span className="badge badge-inbound" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981' }}>
                    <ShieldCheck size={14} /> Garantía Vigente {scannedItem.warrantyExpiration ? `(hasta ${scannedItem.warrantyExpiration})` : ''}
                  </span>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    Sin Garantía
                  </span>
                )}

                {scannedItem.stock <= scannedItem.minStock && (
                  <span className="badge badge-warning">
                    <AlertTriangle size={14} /> Stock Bajo ({scannedItem.stock} ≤ {scannedItem.minStock})
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {scannedItem.name}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                SKU: <strong style={{ color: 'var(--coficab-blue-bright)' }}>{scannedItem.sku}</strong> | QR: <code style={{ color: 'var(--coficab-copper)' }}>{scannedItem.qrCodePayload}</code>
              </p>
            </div>

            {/* Quick Action Toolbar */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={handleOpenMaintenanceModal}
                style={{
                  background: maintCountdown?.isOverdue ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #d97706 0%, #b07238 100%)',
                  fontSize: '0.85rem'
                }}
              >
                <Wrench size={16} />
                {maintCountdown?.text}
              </button>

              {isAdmin && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setTargetPlant(scannedItem.plant === 'Planta 2' ? 'Planta 3' : 'Planta 2');
                    setShowTransferModal(true);
                  }}
                  style={{ fontSize: '0.85rem', borderColor: 'var(--coficab-copper)', color: 'var(--coficab-copper)', fontWeight: 700 }}
                >
                  <RefreshCw size={16} />
                  Mover de Planta
                </button>
              )}

              <button className="btn btn-secondary" onClick={() => setShowQRModal(true)} style={{ fontSize: '0.85rem' }}>
                <QrCode size={16} />
                Ver QR
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => setShowResponsivaModal(true)}
                style={{ fontSize: '0.85rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
              >
                <FileText size={16} />
                Responsiva
              </button>

              <button className="btn btn-danger" onClick={handleDeleteScannedItem} style={{ fontSize: '0.85rem' }}>
                <Trash2 size={16} />
                Eliminar
              </button>
            </div>
          </div>

          {/* Details Grid */}
          {isSimpleCategory ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ background: 'var(--bg-input)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Nombre de Artículo</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.3rem' }}>{scannedItem.name}</div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Stock Disponible (Cantidad)</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: scannedItem.stock <= scannedItem.minStock ? '#d97706' : '#10b981', marginTop: '0.2rem' }}>
                  {scannedItem.stock} <small style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>{scannedItem.unit}s</small>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Stock Disponible</div>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: scannedItem.stock <= scannedItem.minStock ? '#d97706' : '#10b981', marginTop: '0.2rem' }}>
                  {scannedItem.stock} <small style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>{scannedItem.unit}s</small>
                </div>
              </div>

              {scannedItem.model && (
                <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Modelo</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.3rem' }}>{scannedItem.model}</div>
                </div>
              )}

              {scannedItem.serialNumber && (
                <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Número de Serie</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--coficab-blue-bright)', fontFamily: 'monospace', marginTop: '0.3rem' }}>{scannedItem.serialNumber}</div>
                </div>
              )}

              {scannedItem.area && (
                <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Área de Asignación</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.3rem' }}>{scannedItem.area}</div>
                </div>
              )}

              {scannedItem.ipAddress && (
                <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Dirección IP</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace', marginTop: '0.3rem' }}>{scannedItem.ipAddress}</div>
                </div>
              )}

              {scannedItem.location && (
                <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Ubicación Físico-Lógica</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.3rem' }}>{scannedItem.location}</div>
                </div>
              )}
            </div>
          )}

          {/* Faults banner */}
          {scannedItem.faults && (
            <div style={{
              padding: '1.25rem',
              background: 'rgba(217, 119, 6, 0.15)',
              border: '1.5px solid #d97706',
              borderRadius: 'var(--radius-md)',
              color: '#fbbf24',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1rem', marginBottom: '0.3rem' }}>
                <AlertTriangle size={20} /> Fallas / Defectos Registrados:
              </div>
              <div style={{ fontSize: '0.95rem', color: '#ffffff' }}>
                {scannedItem.faults}
              </div>
            </div>
          )}

          {/* Notes banner */}
          {scannedItem.notes && (
            <div style={{
              padding: '1.25rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.3rem', color: 'var(--text-main)' }}>
                <FileText size={18} /> Observaciones & Metadatos del Equipo:
              </div>
              <div style={{ fontSize: '0.92rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                {scannedItem.notes}
              </div>
            </div>
          )}

          {/* Custom Attributes Grid */}
          {(() => {
            if (!scannedItem.customAttributes) return null;
            let parsed: Record<string, string> | null = null;
            try {
              parsed = typeof scannedItem.customAttributes === 'string' ? JSON.parse(scannedItem.customAttributes) : scannedItem.customAttributes;
            } catch (e) {
              return null;
            }
            if (!parsed || Object.keys(parsed).length === 0) return null;

            return (
              <div style={{
                padding: '1.25rem',
                background: 'rgba(201, 138, 75, 0.12)',
                border: '1.5px solid var(--coficab-copper)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.95rem', color: 'var(--coficab-copper)', marginBottom: '0.75rem' }}>
                  <ShieldCheck size={18} /> Atributos y Campos Personalizados Dinámicos
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  {Object.entries(parsed).map(([key, val]) => (
                    <div key={key} style={{ background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--coficab-copper)', textTransform: 'uppercase' }}>{key}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginTop: '0.2rem', wordBreak: 'break-word' }}>{String(val)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Inventory Transaction Box (ADMIN Only) */}
          {isAdmin && (
            <div style={{
              background: 'var(--bg-input)',
              padding: '1.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              marginBottom: '2rem'
            }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RefreshCw size={20} style={{ color: 'var(--primary)' }} />
                Registrar Movimiento de Stock / Asignación
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="form-label">Cantidad ({scannedItem.unit}s)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    value={transQuantity}
                    onChange={(e) => setTransQuantity(parseInt(e.target.value || '1', 10))}
                  />
                </div>

                <div>
                  <label className="form-label">Entregado / Asignado A (Opcional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ej. Juan Pérez (Mantenimiento)"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">Notas de Transacción (Opcional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ej. Entrega de equipo por reemplazo"
                    value={transNotes}
                    onChange={(e) => setTransNotes(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-success"
                  onClick={() => handleTransaction('INBOUND')}
                  disabled={transLoading}
                  style={{ flex: 1, minWidth: '160px' }}
                >
                  <ArrowDownLeft size={18} />
                  Registrar ENTRADA (+{transQuantity})
                </button>

                <button
                  className="btn btn-primary"
                  onClick={() => handleTransaction('OUTBOUND')}
                  disabled={transLoading || scannedItem.stock < transQuantity}
                  style={{ flex: 1, minWidth: '160px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
                >
                  <ArrowUpRight size={18} />
                  Registrar SALIDA (-{transQuantity})
                </button>
              </div>
            </div>
          )}

          {/* Audit History Timeline Section */}
          <div style={{ marginTop: '2rem' }}>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={20} style={{ color: 'var(--coficab-copper)' }} />
              Historial de Cambios, Traslados y Movimientos ({scannedItem.transactions?.length || 0})
            </h4>

            {scannedItem.transactions && scannedItem.transactions.length > 0 ? (
              <div style={{ overflowX: 'auto', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>Fecha / Hora</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>Tipo de Evento</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>Cambio / Cantidad</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>Entregado A</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>Realizado Por</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>Notas / Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scannedItem.transactions.map((tx: any) => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: 'var(--text-dim)' }}>
                          {new Date(tx.createdAt).toLocaleString('es-MX', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {tx.type === 'TRANSFER' ? (
                            <span className="badge" style={{ background: 'rgba(201, 138, 75, 0.2)', color: 'var(--coficab-copper)', border: '1px solid var(--coficab-copper)', fontWeight: 800 }}>
                              Traslado de Planta
                            </span>
                          ) : tx.type === 'CREATION' ? (
                            <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid #3b82f6', fontWeight: 800 }}>
                              Alta Inicial
                            </span>
                          ) : tx.type === 'EDIT' ? (
                            <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid #a855f7', fontWeight: 800 }}>
                              Edición
                            </span>
                          ) : tx.type === 'INBOUND' ? (
                            <span className="badge badge-inbound">
                              <ArrowUpRight size={14} /> Entrada
                            </span>
                          ) : (
                            <span className="badge badge-outbound">
                              <ArrowDownLeft size={14} /> Salida
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: tx.type === 'TRANSFER' ? 'var(--coficab-copper)' : (tx.type === 'INBOUND' ? '#10b981' : '#f43f5e') }}>
                          {tx.type === 'TRANSFER'
                            ? `${tx.fromPlant || 'Planta 2'} ➔ ${tx.toPlant || 'Planta 3'}`
                            : (tx.type === 'INBOUND' ? `+${tx.quantity}` : (tx.type === 'OUTBOUND' ? `-${tx.quantity}` : `Stock: ${tx.quantity}`))}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--coficab-copper)' }}>
                          {tx.assignedTo ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              <UserCheck size={15} />
                              {tx.assignedTo}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {tx.user ? (
                            <div>
                              <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                                {tx.user.name || tx.user.username}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                @{tx.user.username}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Sistema</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          {tx.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                No hay transacciones registradas para este artículo aún.
              </p>
            )}
          </div>

        </div>
      )}

      {/* Maintenance Modal directly from Scanner */}
      {showMaintenanceModal && scannedItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Wrench size={24} style={{ color: 'var(--coficab-copper)' }} />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Registrar Mantenimiento: {scannedItem.name}
                </h3>
              </div>
              <button onClick={() => setShowMaintenanceModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveMaintenance}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Técnico / Responsable *</label>
                <input
                  type="text"
                  className="form-input"
                  value={maintPerformedBy}
                  onChange={(e) => setMaintPerformedBy(e.target.value)}
                  placeholder="ej. Carlos Mendoza (Sistemas)"
                  required
                />
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--coficab-copper)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckSquare size={18} /> Marque o desmarque las tareas realizadas:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {maintAvailableTasks.map((t) => {
                    const isChecked = maintSelectedTasks.includes(t);
                    return (
                      <div
                        key={t}
                        onClick={() => toggleMaintTask(t)}
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
                          {t}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Observaciones del Mantenimiento</label>
                <input
                  type="text"
                  className="form-input"
                  value={maintNotes}
                  onChange={(e) => setMaintNotes(e.target.value)}
                  placeholder="ej. Se realizó limpieza física y actualización..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMaintenanceModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={maintSubmitting}>
                  Guardar Mantenimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Plant Modal */}
      {showTransferModal && scannedItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <RefreshCw size={24} style={{ color: 'var(--coficab-copper)' }} />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Trasladar de Planta: {scannedItem.sku}
                </h3>
              </div>
              <button onClick={() => setShowTransferModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleTransferPlant}>
              <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Planta Actual: <strong style={{ color: '#60a5fa' }}>{scannedItem.plant || 'Planta 2'}</strong>
                </p>

                <label className="form-label" style={{ color: 'var(--coficab-copper)', fontWeight: 800 }}>Seleccionar Planta de Destino *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.5rem' }}>
                  {['Planta 1', 'Planta 2', 'Planta 3', 'Planta UPCAST'].map((p) => (
                    <button
                      type="button"
                      key={p}
                      className={`btn ${targetPlant === p ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setTargetPlant(p)}
                      style={{
                        padding: '0.75rem',
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        border: targetPlant === p ? '2px solid var(--primary)' : '1px solid var(--border-color)'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Notas o Motivo del Traslado (Opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={transferNotesInput}
                  onChange={(e) => setTransferNotesInput(e.target.value)}
                  placeholder="ej. Reasignado a nueva línea de producción en Planta 3"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransferModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={transferSubmitting || scannedItem.plant === targetPlant}>
                  Confirmar Traslado a {targetPlant}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQRModal && scannedItem && (
        <QRModal item={scannedItem} onClose={() => setShowQRModal(false)} />
      )}

      {showResponsivaModal && scannedItem && (
        <ResponsivaModal
          isOpen={showResponsivaModal}
          onClose={() => setShowResponsivaModal(false)}
          item={scannedItem}
        />
      )}
    </div>
  );
};
