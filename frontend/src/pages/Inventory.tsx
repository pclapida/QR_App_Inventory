import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { Item, itemsApi, DeviceLoan, loansApi, isDeviceRequiringChecklist } from '../services/api';
import { QRModal } from '../components/QRModal';
import { ItemEditModal, ItemEditFormData } from '../components/inventory/ItemEditModal';
import { ItemDetailModal } from '../components/inventory/ItemDetailModal';
import { DecommissionModal } from '../components/inventory/DecommissionModal';
import { InventoryTable } from '../components/inventory/InventoryTable';
import { printQRLabels } from '../utils/printLabels';

// Lazy loaded heavy modals
const AssetTimelineModal = lazy(() => import('../components/inventory/AssetTimelineModal').then(module => ({ default: module.AssetTimelineModal })));
const InventoryReportModal = lazy(() => import('../components/inventory/InventoryReportModal').then(module => ({ default: module.InventoryReportModal })));
const ThermalLabelModal = lazy(() => import('../components/ThermalLabelModal').then(module => ({ default: module.ThermalLabelModal })));
const ResponsivaModal = lazy(() => import('../components/ResponsivaModal').then(module => ({ default: module.ResponsivaModal })));
const ChecklistModal = lazy(() => import('../components/ChecklistModal').then(module => ({ default: module.ChecklistModal })));
import {
  Package,
  Search,
  PlusCircle,
  Scan,
  AlertTriangle,
  QrCode,
  Layers,
  Trash2,
  Edit,
  RefreshCw,
  MapPin,
  X,
  Check,
  CheckCircle2,
  ShieldCheck,
  User,
  ChevronDown,
  ChevronRight,
  Printer,
  Wrench,
  Laptop,
  FileText,
  Eye,
  Shield,
  Tag,
  Calendar,
  Clock,
  RotateCcw,
  ArrowRightLeft,
  Truck,
  AlertCircle,
  Undo2,
  Info,
  CheckSquare
} from 'lucide-react';

export type InventoryTabType = 'ASSIGNED' | 'AVAILABLE' | 'LOANS' | 'SCRAP' | 'TRANSFERS' | 'DAMAGED';

interface InventoryProps {
  mode?: 'PLANT' | 'IT';
}

export const Inventory: React.FC<InventoryProps> = ({ mode }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, canEdit, canDelete } = useAuth();
  
  // Backward compatible role check for actions
  const isAdmin = canEdit || user?.role === 'ADMIN';
  const isSuper = canDelete || user?.role === 'ADMIN';
  const isOperator = user?.role === 'OPERATOR';

  // 6 Tabs: ASSIGNED, AVAILABLE, LOANS, SCRAP, TRANSFERS, DAMAGED
  const [activeTab, setActiveTab] = useState<InventoryTabType>(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'available' || mode === 'IT') return 'AVAILABLE';
    if (tabParam === 'loans') return 'LOANS';
    if (tabParam === 'scrap') return 'SCRAP';
    if (tabParam === 'transfers') return 'TRANSFERS';
    if (tabParam === 'damaged') return 'DAMAGED';
    return 'ASSIGNED';
  });

  const [items, setItems] = useState<Item[]>([]);
  const [loans, setLoans] = useState<DeviceLoan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPlant, setSelectedPlant] = useState<string>('');
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit] = useState<number>(50);

  const [error, setError] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Selected item for modals
  const [selectedQRItem, setSelectedQRItem] = useState<Item | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [viewingItem, setViewingItem] = useState<Item | null>(null);
  const [timelineItem, setTimelineItem] = useState<Item | null>(null);
  const [decommissionItem, setDecommissionItem] = useState<Item | null>(null);
  const [checklistPendingItem, setChecklistPendingItem] = useState<Item | null>(null);
  const [assigningItem, setAssigningItem] = useState<Item | null>(null);
  const [transferringItem, setTransferringItem] = useState<Item | null>(null);
  const [permanentDeleteItem, setPermanentDeleteItem] = useState<Item | null>(null);
  const [thermalItems, setThermalItems] = useState<Item[] | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // Report Fault / Damage Modal state
  const [faultReportItem, setFaultReportItem] = useState<Item | null>(null);
  const [faultDescription, setFaultDescription] = useState<string>('');
  const [faultNotes, setFaultNotes] = useState<string>('');
  const [submittingFault, setSubmittingFault] = useState<boolean>(false);

  // Transfer modal state
  const [targetPlant, setTargetPlant] = useState<string>('Planta UPCAST');
  const [transferNotes, setTransferNotes] = useState<string>('');
  const [transferring, setTransferring] = useState<boolean>(false);

  // Loans modal state
  const [loanReturnTarget, setLoanReturnTarget] = useState<DeviceLoan | null>(null);
  const [loanReturnNotes, setLoanReturnNotes] = useState<string>('');
  const [returningLoan, setReturningLoan] = useState<boolean>(false);
  const [showNewLoanModal, setShowNewLoanModal] = useState<boolean>(false);
  const [selectedLoanItemId, setSelectedLoanItemId] = useState<string>('');
  const [borrowerName, setBorrowerName] = useState<string>('');
  const [borrowerArea, setBorrowerArea] = useState<string>('');
  const [borrowerBadge, setBorrowerBadge] = useState<string>('');
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(17, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [loanNotes, setLoanNotes] = useState<string>('');
  const [submittingLoan, setSubmittingLoan] = useState<boolean>(false);

  // Batch Print selection state
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());



  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'LOANS') {
        const loansData = await loansApi.getAll();
        setLoans(loansData);
        const allItemsRes = await itemsApi.getAll();
        const rawItems = Array.isArray(allItemsRes) ? allItemsRes : (allItemsRes?.items || []);
        setItems(rawItems.filter((i: Item) => i.status !== 'DECOMMISSIONED'));
      } else {
        const params: any = {};
        if (searchQuery.trim()) params.q = searchQuery.trim();
        if (selectedCategory) params.category = selectedCategory;
        if (selectedPlant) params.plant = selectedPlant;
        if (onlyLowStock && activeTab === 'AVAILABLE') params.lowStock = 'true';
        
        params.page = currentPage;
        params.limit = limit;
        params.tab = activeTab;

        const res = await itemsApi.getAll(params);
        let resultItems: Item[] = Array.isArray(res) ? res : (res?.items || []);
        
        if (res && res.totalPages) {
          setTotalPages(res.totalPages);
        } else {
          setTotalPages(1);
        }

        setItems(resultItems);
      }
    } catch (err: any) {
      console.error('Error al cargar inventario:', err);
      setError('Error al conectar con el servidor para consultar inventario.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedPlant, onlyLowStock, activeTab]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchItems();
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedCategory, selectedPlant, onlyLowStock, activeTab, currentPage]);

  // Handle Unassign (Return to IT Available)
  const handleUnassignItem = async (item: Item) => {
    const reason = window.prompt(`¿Desea retirar el equipo "${item.name}" asignado a ${item.assignedTo || 'colaborador'} y devolverlo al Inventario Disponible de IT?\n\n(Opcional) Ingrese observaciones:`, 'Retiro por cambio / reubicación');
    if (reason === null) return;

    try {
      await itemsApi.unassign(item.id, { notes: reason });
      setActionSuccessMsg(`Equipo "${item.name}" retornado exitosamente al Inventario Disponible de IT.`);
      fetchItems();
    } catch (err: any) {
      console.error('Error al desasignar:', err);
      alert(err.response?.data?.error || 'Error al devolver el equipo al inventario disponible.');
    }
  };

  // Handle Report Fault
  const handleExecuteReportFault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faultReportItem || !faultDescription.trim()) return;
    setSubmittingFault(true);
    try {
      await itemsApi.reportFault(faultReportItem.id, {
        faults: faultDescription.trim(),
        notes: faultNotes.trim() || undefined
      });
      setActionSuccessMsg(`Falla registrada para "${faultReportItem.name}". Trasladado a la pestaña Dañados.`);
      setFaultReportItem(null);
      setFaultDescription('');
      setFaultNotes('');
      fetchItems();
    } catch (err: any) {
      console.error('Error al reportar daño:', err);
      alert(err.response?.data?.error || 'Error al reportar daño.');
    } finally {
      setSubmittingFault(false);
    }
  };

  // Handle Repair / Mark Resolved (Returns item to Disponible)
  const handleRepairItem = async (item: Item) => {
    const notes = window.prompt(`¿Desea marcar como reparado el activo "${item.name}" y retornarlo al Inventario Disponible de IT?\n\n(Opcional) Ingrese observaciones de la reparación:`, 'Reparación completada / Mantenimiento correctivo aplicado');
    if (notes === null) return;

    try {
      await itemsApi.repair(item.id, { notes });
      setActionSuccessMsg(`¡Activo "${item.name}" reparado exitosamente y devuelto a Disponible!`);
      fetchItems();
    } catch (err: any) {
      console.error('Error al reparar equipo:', err);
      alert(err.response?.data?.error || 'Error al procesar la reparación.');
    }
  };

  // Handle Reactivate from Scrap
  const handleReactivateItem = async (item: Item) => {
    if (!window.confirm(`¿Desea reactivar el activo "${item.name}" (${item.sku}) y regresarlo al Inventario Disponible de IT?`)) return;
    try {
      await itemsApi.reactivate(item.id, { newStock: 1 });
      setActionSuccessMsg(`¡Activo "${item.name}" reactivado correctamente al Inventario Disponible!`);
      fetchItems();
    } catch (err: any) {
      console.error('Error al reactivar:', err);
      alert(err.response?.data?.error || 'Error al reactivar el activo.');
    }
  };

  // Handle Permanent Delete (ONLY permitted in SCRAP)
  const handleConfirmPermanentDelete = async () => {
    if (!permanentDeleteItem) return;
    try {
      await itemsApi.deletePermanent(permanentDeleteItem.id);
      setActionSuccessMsg(`Activo "${permanentDeleteItem.name}" eliminado permanentemente de la base de datos.`);
      setPermanentDeleteItem(null);
      fetchItems();
    } catch (err: any) {
      console.error('Error al eliminar permanentemente:', err);
      alert(err.response?.data?.error || 'Error al eliminar el activo.');
    }
  };

  // Handle Plant Transfer
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringItem) return;
    setTransferring(true);
    try {
      await itemsApi.transfer(transferringItem.id, {
        targetPlant,
        notes: transferNotes.trim() || undefined
      });
      setActionSuccessMsg(`Equipo trasladado exitosamente a ${targetPlant}.`);
      setTransferringItem(null);
      setTransferNotes('');
      fetchItems();
    } catch (err: any) {
      console.error('Error al transferir:', err);
      alert(err.response?.data?.error || 'Error al procesar el traslado de planta.');
    } finally {
      setTransferring(false);
    }
  };

  // Handle Loan Return
  const handleConfirmLoanReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanReturnTarget) return;
    setReturningLoan(true);
    try {
      await loansApi.returnLoan(loanReturnTarget.id, loanReturnNotes.trim() || undefined);
      setActionSuccessMsg(`Préstamo devuelto correctamente por ${loanReturnTarget.borrowerName}.`);
      setLoanReturnTarget(null);
      setLoanReturnNotes('');
      fetchItems();
    } catch (err: any) {
      console.error('Error al registrar devolución:', err);
      alert(err.response?.data?.error || 'Error al devolver préstamo.');
    } finally {
      setReturningLoan(false);
    }
  };

  // Handle New Loan Creation
  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanItemId || !borrowerName.trim()) {
      alert('Por favor seleccione el equipo y capture el nombre del solicitante.');
      return;
    }
    setSubmittingLoan(true);
    try {
      await loansApi.create({
        itemId: selectedLoanItemId,
        borrowerName: borrowerName.trim(),
        borrowerArea: borrowerArea.trim() || undefined,
        borrowerBadge: borrowerBadge.trim() || undefined,
        expectedReturn: new Date(expectedReturnDate).toISOString(),
        loanNotes: loanNotes.trim() || undefined
      });
      setActionSuccessMsg(`Préstamo registrado exitosamente a ${borrowerName.trim()}.`);
      setShowNewLoanModal(false);
      setSelectedLoanItemId('');
      setBorrowerName('');
      setBorrowerArea('');
      setBorrowerBadge('');
      setLoanNotes('');
      fetchItems();
    } catch (err: any) {
      console.error('Error al crear préstamo:', err);
      alert(err.response?.data?.error || 'Error al registrar el préstamo.');
    } finally {
      setSubmittingLoan(false);
    }
  };

  const handleSaveItem = async (itemId: string, formData: ItemEditFormData, customFields: { key: string; value: string }[]) => {
    const customAttributesObj: Record<string, string> = {};
    customFields.forEach((f) => {
      if (f.key.trim()) {
        customAttributesObj[f.key.trim()] = f.value.trim();
      }
    });

    await api.put(`/items/${itemId}`, {
      ...formData,
      customAttributes: Object.keys(customAttributesObj).length > 0 ? customAttributesObj : null,
      location: formData.isITInternal ? 'Taller Interno IT' : (formData.area || formData.plant)
    });
    setActionSuccessMsg(`Artículo actualizado correctamente.`);
    fetchItems();
  };

  // KPI Calculations
  const totalCount = items.length;
  const totalStockSum = items.reduce((acc, i) => acc + i.stock, 0);
  const lowStockCount = useMemo(() => {
    return items.filter(i => (i.stock === 0) || (i.minStock > 0 && i.stock <= i.minStock)).length;
  }, [items]);



  // Filtered loans list for LOANS tab
  const filteredLoans = useMemo(() => {
    if (activeTab !== 'LOANS') return [];
    return loans.filter((loan) => {
      const matchesSearch =
        loan.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (loan.borrowerArea && loan.borrowerArea.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (loan.item && loan.item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (loan.item && loan.item.sku.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [loans, searchQuery, activeTab]);

  return (
    <div>
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div style={{
          padding: '0.85rem 1.25rem',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: 'var(--radius-md)',
          color: '#10b981',
          fontSize: '0.9rem',
          fontWeight: 600,
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 6-TAB NAVIGATION BAR */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.4rem',
        padding: '0.4rem',
        background: 'var(--bg-input)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        marginBottom: '1.5rem'
      }}>
        {/* Tab 1: Asignado */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('ASSIGNED');
            setSearchParams({ tab: 'assigned' });
          }}
          style={{
            flex: '1 1 auto',
            minWidth: '130px',
            padding: '0.65rem 0.9rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'ASSIGNED' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'ASSIGNED' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: activeTab === 'ASSIGNED' ? 800 : 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'ASSIGNED' ? '0 4px 12px rgba(0, 43, 144, 0.4)' : 'none'
          }}
        >
          <Package size={16} />
          <span>1. Asignado</span>
        </button>

        {/* Tab 2: Disponible (IT) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('AVAILABLE');
            setSearchParams({ tab: 'available' });
          }}
          style={{
            flex: '1 1 auto',
            minWidth: '130px',
            padding: '0.65rem 0.9rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'AVAILABLE' ? 'var(--coficab-copper)' : 'transparent',
            color: activeTab === 'AVAILABLE' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: activeTab === 'AVAILABLE' ? 800 : 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'AVAILABLE' ? '0 4px 12px rgba(201, 138, 75, 0.4)' : 'none'
          }}
        >
          <Laptop size={16} />
          <span>2. Disponible (IT)</span>
        </button>

        {/* Tab 3: Préstamos */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('LOANS');
            setSearchParams({ tab: 'loans' });
          }}
          style={{
            flex: '1 1 auto',
            minWidth: '120px',
            padding: '0.65rem 0.9rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'LOANS' ? '#6366f1' : 'transparent',
            color: activeTab === 'LOANS' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: activeTab === 'LOANS' ? 800 : 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'LOANS' ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none'
          }}
        >
          <ArrowRightLeft size={16} />
          <span>3. Préstamos</span>
        </button>

        {/* Tab 4: Bajas / Scrap */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('SCRAP');
            setSearchParams({ tab: 'scrap' });
          }}
          style={{
            flex: '1 1 auto',
            minWidth: '120px',
            padding: '0.65rem 0.9rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'SCRAP' ? '#f43f5e' : 'transparent',
            color: activeTab === 'SCRAP' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: activeTab === 'SCRAP' ? 800 : 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'SCRAP' ? '0 4px 12px rgba(244, 63, 94, 0.4)' : 'none'
          }}
        >
          <Trash2 size={16} />
          <span>4. Bajas / Scrap</span>
        </button>

        {/* Tab 5: Transferencias */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('TRANSFERS');
            setSearchParams({ tab: 'transfers' });
          }}
          style={{
            flex: '1 1 auto',
            minWidth: '120px',
            padding: '0.65rem 0.9rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'TRANSFERS' ? '#0ea5e9' : 'transparent',
            color: activeTab === 'TRANSFERS' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: activeTab === 'TRANSFERS' ? 800 : 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'TRANSFERS' ? '0 4px 12px rgba(14, 165, 233, 0.4)' : 'none'
          }}
        >
          <Truck size={16} />
          <span>5. Transferencias</span>
        </button>

        {/* Tab 6: Dañado */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('DAMAGED');
            setSearchParams({ tab: 'damaged' });
          }}
          style={{
            flex: '1 1 auto',
            minWidth: '120px',
            padding: '0.65rem 0.9rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'DAMAGED' ? '#f59e0b' : 'transparent',
            color: activeTab === 'DAMAGED' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: activeTab === 'DAMAGED' ? 800 : 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'DAMAGED' ? '0 4px 12px rgba(245, 158, 11, 0.4)' : 'none'
          }}
        >
          <AlertTriangle size={16} />
          <span>6. Dañado</span>
        </button>
      </div>

      {/* HEADER ACTIONS & TITLE */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {activeTab === 'ASSIGNED' && <><Package style={{ color: 'var(--primary)' }} /> Inventario Asignado</>}
            {activeTab === 'AVAILABLE' && <><Laptop style={{ color: 'var(--coficab-copper)' }} /> Inventario Disponible (Almacén IT)</>}
            {activeTab === 'LOANS' && <><ArrowRightLeft style={{ color: '#6366f1' }} /> Préstamos Temporales de IT</>}
            {activeTab === 'SCRAP' && <><Trash2 style={{ color: '#f43f5e' }} /> Bajas de Activos & Scrap</>}
            {activeTab === 'TRANSFERS' && <><Truck style={{ color: '#0ea5e9' }} /> Transferencias entre Plantas</>}
            {activeTab === 'DAMAGED' && <><AlertTriangle style={{ color: '#f59e0b' }} /> Equipos Dañados & Con Fallas</>}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '0.2rem' }}>
            {activeTab === 'ASSIGNED' && 'Equipos operativos entregados y asignados formalmente a colaboradores o departamentos.'}
            {activeTab === 'AVAILABLE' && 'Equipos en stock del taller de IT listos para ser asignados con responsiva o prestados.'}
            {activeTab === 'LOANS' && 'Control de préstamos temporales de laptops, proyectores y accesorios con fecha de devolución.'}
            {activeTab === 'SCRAP' && 'Histórico de equipos desincorporados por daño, obsolescencia o disposición E-Waste.'}
            {activeTab === 'TRANSFERS' && 'Equipos trasladados físicamente entre plantas (Planta 1, Planta 2, Planta 3, UPCAST) con trazabilidad de planta de origen.'}
            {activeTab === 'DAMAGED' && 'Equipos reportados con fallas técnicas o daños físicos en espera de reparación o dictamen técnico.'}
          </p>
        </div>

        {/* Action Buttons based on Active Tab */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.6rem' }}>
          {/* Add Item button: ONLY active in AVAILABLE tab */}
          {isAdmin && activeTab === 'AVAILABLE' && (
            <button
              className="btn btn-primary"
              onClick={() => navigate('/add-item')}
              style={{ fontWeight: 700 }}
            >
              <PlusCircle size={18} />
              + Registrar Activo en IT
            </button>
          )}

          {isAdmin && activeTab === 'AVAILABLE' && (
            <div title="Para asignar un equipo, búscalo en esta tabla y usa la opción 'Asignar' en la columna de Acciones">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setActiveTab('AVAILABLE');
                  setActionSuccessMsg('Selecciona un equipo de Inventario Disponible y presiona "Asignar (📋)" para generar su responsiva.');
                }}
                style={{ opacity: 0.9, borderColor: 'var(--coficab-copper)', color: 'var(--coficab-copper)', fontWeight: 600 }}
              >
                <Info size={16} />
                ¿Cómo asignar un equipo?
              </button>
            </div>
          )}

          {isAdmin && activeTab === 'LOANS' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowNewLoanModal(true)}
              style={{ fontWeight: 700, background: '#6366f1' }}
            >
              <PlusCircle size={18} />
              + Nuevo Préstamo
            </button>
          )}

          <button className="btn btn-secondary" onClick={() => setShowReportModal(true)}>
            <FileText size={17} />
            Reporte PDF / QR
          </button>

          <button className="btn btn-secondary" onClick={fetchItems} title="Recargar">
            <RefreshCw size={17} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        <div className="glass-panel" style={{ padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            <span>
              {activeTab === 'ASSIGNED' && 'Equipos Asignados'}
              {activeTab === 'AVAILABLE' && 'Artículos en Stock IT'}
              {activeTab === 'LOANS' && 'Préstamos Totales'}
              {activeTab === 'SCRAP' && 'Activos en Bajas/Scrap'}
              {activeTab === 'TRANSFERS' && 'Equipos Transferidos'}
              {activeTab === 'DAMAGED' && 'Equipos con Daño / Falla'}
            </span>
            <Package size={19} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '0.2rem' }}>
            {activeTab === 'LOANS' ? loans.length : totalCount}
          </div>
        </div>

        {activeTab === 'AVAILABLE' && (
          <>
            <div className="glass-panel" style={{ padding: '1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                <span>Unidades Físicas en Almacén</span>
                <Layers size={19} style={{ color: '#10b981' }} />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#10b981', marginTop: '0.2rem' }}>
                {totalStockSum}
              </div>
            </div>

            <div
              className="glass-panel glass-panel-interactive"
              style={{
                padding: '1.1rem',
                cursor: 'pointer',
                borderColor: onlyLowStock ? '#f59e0b' : undefined,
                background: onlyLowStock ? 'rgba(245, 158, 11, 0.12)' : undefined
              }}
              onClick={() => setOnlyLowStock(!onlyLowStock)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                <span>Stock Crítico / Bajo</span>
                <AlertTriangle size={19} style={{ color: '#f59e0b' }} />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#f59e0b', marginTop: '0.2rem' }}>
                {lowStockCount}
              </div>
            </div>
          </>
        )}

        {activeTab === 'LOANS' && (
          <>
            <div className="glass-panel" style={{ padding: '1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                <span>Préstamos Activos</span>
                <Clock size={19} style={{ color: '#3b82f6' }} />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#3b82f6', marginTop: '0.2rem' }}>
                {loans.filter(l => l.status === 'ACTIVE' && !l.isOverdue).length}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                <span>Préstamos Vencidos</span>
                <AlertTriangle size={19} style={{ color: '#ef4444' }} />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#ef4444', marginTop: '0.2rem' }}>
                {loans.filter(l => l.status === 'OVERDUE' || l.isOverdue).length}
              </div>
            </div>
          </>
        )}

        {activeTab === 'ASSIGNED' && (
          <div className="glass-panel" style={{ padding: '1.1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              <span>Colaboradores con Equipo</span>
              <User size={19} style={{ color: 'var(--coficab-copper)' }} />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--coficab-copper)', marginTop: '0.2rem' }}>
              {new Set(items.map(i => i.assignedTo).filter(Boolean)).size}
            </div>
          </div>
        )}

        {activeTab === 'DAMAGED' && (
          <div className="glass-panel" style={{ padding: '1.1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              <span>Atención Prioritaria</span>
              <Wrench size={19} style={{ color: '#f59e0b' }} />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#f59e0b', marginTop: '0.2rem' }}>
              {items.length}
            </div>
          </div>
        )}
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'center' }}>
        {/* Search Bar */}
        <div style={{ flex: '1 1 280px', position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            placeholder={activeTab === 'LOANS' ? 'Buscar por solicitante, área, nómina o equipo...' : 'Buscar por nombre, SKU, modelo, serie, responsable, falla...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
          <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Planta Filter (All plants available) */}
        {activeTab !== 'LOANS' && (
          <div style={{ width: '180px' }}>
            <select
              className="form-input"
              value={selectedPlant}
              onChange={(e) => setSelectedPlant(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="">Todas las Plantas</option>
              <option value="Planta 1">Planta 1</option>
              <option value="Planta 2">Planta 2 (Principal)</option>
              <option value="Planta 3">Planta 3</option>
              <option value="Planta UPCAST">Planta UPCAST</option>
            </select>
          </div>
        )}

        {/* Category Filter */}
        {activeTab !== 'LOANS' && (
          <div style={{ width: '190px' }}>
            <select
              className="form-input"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="">Todas las Categorías</option>
              <option value="Paneles">Paneles</option>
              <option value="Laptops & Cómputo">Laptops & Cómputo</option>
              <option value="Monitores & Pantallas">Monitores & Pantallas</option>
              <option value="Tablets">Tablets</option>
              <option value="Impresoras Zebra">Impresoras Zebra</option>
              <option value="Equipos & Dispositivos">Equipos & Dispositivos</option>
              <option value="Hardware & Lectores">Hardware & Lectores</option>
              <option value="Consumibles">Consumibles</option>
              <option value="Herramientas">Herramientas</option>
              <option value="Refacciones IT">Refacciones IT</option>
            </select>
          </div>
        )}

        {/* Batch Print Thermal Labels Action Button */}
        {selectedItemIds.size > 0 && activeTab !== 'LOANS' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const selectedItems = items.filter(i => selectedItemIds.has(i.id));
              setThermalItems(selectedItems);
            }}
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', fontWeight: 700, gap: '0.35rem' }}
          >
            <Printer size={15} />
            Imprimir {selectedItemIds.size} Etiquetas
          </button>
        )}
      </div>

      {/* TAB CONTENT RENDER */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={36} className="spinning" style={{ margin: '0 auto 1rem auto', color: 'var(--primary)' }} />
          <div>Cargando inventario...</div>
        </div>
      ) : activeTab === 'LOANS' ? (
        /* ========================================================================= */
        /* TAB 3: LOANS TABLE                                                        */
        /* ========================================================================= */
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          {filteredLoans.length === 0 ? (
            <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <ArrowRightLeft size={44} style={{ color: 'var(--text-dim)', margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.05rem' }}>No hay préstamos registrados</div>
              <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>
                Utiliza el botón "+ Nuevo Préstamo" para prestar un equipo disponible a un colaborador.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Equipo Prestado</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Solicitante / Área</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Fecha Préstamo</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Fecha Límite</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Estado</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.map((loan) => {
                    const isOverdue = loan.status === 'OVERDUE' || (loan.status === 'ACTIVE' && new Date(loan.expectedReturn) < new Date());
                    return (
                      <tr key={loan.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <strong style={{ color: 'var(--text-main)' }}>{loan.item?.name || 'Equipo'}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {loan.item?.sku || 'N/A'}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <strong style={{ color: 'var(--text-main)' }}>{loan.borrowerName}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{loan.borrowerArea || 'Planta'} {loan.borrowerBadge ? `• #${loan.borrowerBadge}` : ''}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                          {new Date(loan.loanDate).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <strong style={{ color: isOverdue && loan.status !== 'RETURNED' ? '#ef4444' : 'var(--text-main)' }}>
                            {new Date(loan.expectedReturn).toLocaleDateString()}
                          </strong>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          {loan.status === 'RETURNED' ? (
                            <span className="badge badge-inbound">Devuelto</span>
                          ) : isOverdue ? (
                            <span className="badge badge-outbound">Vencido</span>
                          ) : (
                            <span className="badge badge-warning">En Préstamo</span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          {loan.status !== 'RETURNED' && isAdmin && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setLoanReturnTarget(loan)}
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                            >
                              <CheckCircle2 size={14} /> Devolver
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* TABS 1, 2, 4, 5, 6: ITEM TABLES                                           */
        /* ========================================================================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <InventoryTable 
              items={items}
              activeTab={activeTab}
              permissions={{ isAdmin, isSuper, isOperator }}
              selection={{ selectedItemIds, setSelectedItemIds }}
              actions={{
                onViewItem: setViewingItem,
                onAssign: (item: Item) => {
                  if (isDeviceRequiringChecklist(item)) {
                    setChecklistPendingItem(item);
                  } else {
                    setAssigningItem(item);
                  }
                },
                onUnassign: handleUnassignItem,
                onReportFault: setFaultReportItem,
                onRepair: handleRepairItem,
                onTransfer: setTransferringItem,
                onReactivate: handleReactivateItem,
                onShowQR: setSelectedQRItem,
                onEdit: setEditingItem,
                onDecommission: setDecommissionItem,
                onPermanentDelete: setPermanentDeleteItem,
              }}
            />
          </div>
          
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              <button 
                className="btn btn-secondary" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Página <strong style={{ color: 'var(--text-main)' }}>{currentPage}</strong> de {totalPages}
              </span>
              <button 
                className="btn btn-secondary" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS SECTION                                                            */}
      {/* ========================================================================= */}

      <Suspense fallback={null}>

      {/* 0. Checklist Modal (Pre-Assignment Flow) */}
      {checklistPendingItem && (
        <ChecklistModal
          isOpen={Boolean(checklistPendingItem)}
          onClose={() => setChecklistPendingItem(null)}
          itemId={checklistPendingItem.id}
          itemName={checklistPendingItem.name}
          itemSku={checklistPendingItem.sku}
          onCompleted={() => {
            const item = checklistPendingItem;
            setChecklistPendingItem(null);
            // Proceed to responsiva assignment
            setAssigningItem(item);
          }}
        />
      )}

      {/* 1. Responsiva Modal (Assignment Flow) */}
      {assigningItem && (
        <ResponsivaModal
          isOpen={Boolean(assigningItem)}
          onClose={() => setAssigningItem(null)}
          item={assigningItem}
          onSuccess={() => {
            setAssigningItem(null);
            setActionSuccessMsg(`¡Equipo asignado exitosamente y trasladado a Inventario Asignado!`);
            fetchItems();
          }}
        />
      )}
      </Suspense>

      {/* 2. QR Modal */}
      {selectedQRItem && (
        <QRModal
          onClose={() => setSelectedQRItem(null)}
          item={selectedQRItem}
        />
      )}

      {/* 3. Item Detail Modal */}
      {viewingItem && (
        <ItemDetailModal
          item={viewingItem}
          isAdmin={isAdmin}
          onClose={() => setViewingItem(null)}
          onEdit={(it: Item) => {
            setViewingItem(null);
            setEditingItem(it);
          }}
          onOpenTimeline={(it: Item) => {
            setViewingItem(null);
            setTimelineItem(it);
          }}
          onOpenDecommission={(it: Item) => {
            setViewingItem(null);
            setDecommissionItem(it);
          }}
          onReactivate={(it: Item) => {
            setViewingItem(null);
            handleReactivateItem(it);
          }}
        />
      )}

      {/* 4. Item Edit Modal */}
      {editingItem && (
        <ItemEditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveItem}
        />
      )}

      {/* 5. Decommission / Scrap Modal */}
      {decommissionItem && (
        <DecommissionModal
          item={decommissionItem}
          onClose={() => setDecommissionItem(null)}
          onSuccess={() => {
            setDecommissionItem(null);
            setActionSuccessMsg(`Equipo enviado a Bajas / Scrap correctamente.`);
            fetchItems();
          }}
        />
      )}

      <Suspense fallback={null}>

      {/* 6. Timeline Modal */}
      {timelineItem && (
        <AssetTimelineModal
          item={timelineItem}
          onClose={() => setTimelineItem(null)}
        />
      )}

      {/* 7. Thermal Label Modal */}
      {thermalItems && (
        <ThermalLabelModal
          isOpen={Boolean(thermalItems)}
          onClose={() => setThermalItems(null)}
          items={thermalItems}
        />
      )}

      {/* 8. Inventory Report Modal */}
      {showReportModal && (
        <InventoryReportModal
          items={items}
          totalCount={items.length}
          filters={{
            category: selectedCategory || undefined,
            plant: selectedPlant || undefined,
            searchQuery: searchQuery || undefined,
            isITInternal: activeTab === 'AVAILABLE',
            status: activeTab === 'SCRAP' ? 'DECOMMISSIONED' : 'ACTIVE'
          }}
          onClose={() => setShowReportModal(false)}
        />
      )}
      </Suspense>

      {/* 9. Plant Transfer Modal */}
      {transferringItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Truck size={20} style={{ color: '#0ea5e9' }} /> Traslado de Planta
              </h3>
              <button onClick={() => setTransferringItem(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer}>
              <div style={{ marginBottom: '1rem', padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{transferringItem.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--coficab-copper)', marginTop: '0.15rem' }}>SKU: {transferringItem.sku}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Planta Actual: <strong>{transferringItem.plant}</strong> | Origen: <strong>{transferringItem.originPlant || 'Planta 2'}</strong>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Planta de Destino *</label>
                <select
                  className="form-input"
                  value={targetPlant}
                  onChange={(e) => setTargetPlant(e.target.value)}
                  required
                >
                  <option value="Planta 1">Planta 1</option>
                  <option value="Planta 2">Planta 2 (Principal)</option>
                  <option value="Planta 3">Planta 3</option>
                  <option value="Planta UPCAST">Planta UPCAST</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Motivo u Observaciones del Traslado</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="ej. Reubicación temporal por soporte técnico..."
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setTransferringItem(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={transferring} style={{ background: '#0ea5e9', fontWeight: 700 }}>
                  {transferring ? 'Trasladando...' : 'Confirmar Traslado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Permanent Delete Safety Confirmation Modal (ONLY in SCRAP) */}
      {permanentDeleteItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px', borderColor: '#ef4444' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#ef4444', marginBottom: '1rem' }}>
              <AlertTriangle size={26} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>¿Eliminar Definitivamente?</h3>
            </div>

            <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Estás a punto de eliminar de forma <strong>irreversible</strong> el activo <strong style={{ color: '#ef4444' }}>{permanentDeleteItem.name} ({permanentDeleteItem.sku})</strong> y todo su historial de la base de datos PostgreSQL.
            </div>

            <div style={{ padding: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: '#ef4444', marginBottom: '1.5rem' }}>
              ⚠️ Esta acción no se puede deshacer. Todos los registros de transacciones, mantenimientos y responsivas asociadas a este activo serán eliminados permanentemente.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setPermanentDeleteItem(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmPermanentDelete}
                style={{ background: '#ef4444', borderColor: '#ef4444', fontWeight: 800 }}
              >
                Sí, Eliminar de la Base de Datos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. New Loan Modal */}
      {showNewLoanModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <ArrowRightLeft size={20} style={{ color: '#6366f1' }} /> Registrar Préstamo de Equipo IT
              </h3>
              <button onClick={() => setShowNewLoanModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateLoan}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Seleccionar Equipo a Prestar *</label>
                <select
                  className="form-input"
                  value={selectedLoanItemId}
                  onChange={(e) => setSelectedLoanItemId(e.target.value)}
                  required
                >
                  <option value="">-- Seleccione un equipo disponible --</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} ({it.sku}) - {it.plant}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Nombre del Solicitante *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ej. Juan Perez"
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nómina / Badge</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ej. 10452"
                    value={borrowerBadge}
                    onChange={(e) => setBorrowerBadge(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Área / Departamento</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ej. Calidad / Mantenimiento"
                    value={borrowerArea}
                    onChange={(e) => setBorrowerArea(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha y Hora de Devolución *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Notas del Préstamo</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="ej. Se entrega con cargador y mouse..."
                  value={loanNotes}
                  onChange={(e) => setLoanNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewLoanModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingLoan} style={{ background: '#6366f1', fontWeight: 700 }}>
                  {submittingLoan ? 'Guardando...' : 'Confirmar Préstamo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 12. Loan Return Modal */}
      {loanReturnTarget && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <CheckCircle2 size={20} style={{ color: '#10b981' }} /> Confirmar Devolución de Préstamo
              </h3>
              <button onClick={() => setLoanReturnTarget(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmLoanReturn}>
              <div style={{ padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                <div>Equipo: <strong style={{ color: 'var(--text-main)' }}>{loanReturnTarget.item?.name}</strong></div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Solicitante: <strong>{loanReturnTarget.borrowerName}</strong> ({loanReturnTarget.borrowerArea || 'Planta'})</div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Estado del Equipo al Recibir / Observaciones</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="ej. Equipo entregado en perfecto estado con accesorios completos..."
                  value={loanReturnNotes}
                  onChange={(e) => setLoanReturnNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setLoanReturnTarget(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={returningLoan} style={{ background: '#10b981', fontWeight: 700 }}>
                  {returningLoan ? 'Guardando...' : 'Confirmar Devolución'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 13. Report Fault / Damage Modal */}
      {faultReportItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px', borderColor: '#f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <AlertTriangle size={20} style={{ color: '#f59e0b' }} /> Reportar Falla o Daño de Equipo
              </h3>
              <button onClick={() => setFaultReportItem(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleExecuteReportFault}>
              <div style={{ padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{faultReportItem.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--coficab-copper)', marginTop: '0.15rem' }}>SKU: {faultReportItem.sku} | S/N: {faultReportItem.serialNumber || 'N/A'}</div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ color: '#f59e0b', fontWeight: 800 }}>Descripción del Daño / Falla *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ej. Pantalla estrellada, no enciende, teclado dañado..."
                  value={faultDescription}
                  onChange={(e) => setFaultDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Detalles u Observaciones Adicionales</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="ej. Ocurrió por caída en piso de producción..."
                  value={faultNotes}
                  onChange={(e) => setFaultNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setFaultReportItem(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingFault} style={{ background: '#f59e0b', borderColor: '#f59e0b', fontWeight: 700 }}>
                  {submittingFault ? 'Registrando...' : 'Registrar Falla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
