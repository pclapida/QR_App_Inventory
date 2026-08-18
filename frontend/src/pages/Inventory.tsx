import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { Item } from '../services/api';
import { QRModal } from '../components/QRModal';
import { ItemEditModal, ItemEditFormData } from '../components/inventory/ItemEditModal';
import { ItemDetailModal } from '../components/inventory/ItemDetailModal';
import { ExcelImportModal } from '../components/inventory/ExcelImportModal';
import { DecommissionModal } from '../components/inventory/DecommissionModal';
import { AssetTimelineModal } from '../components/inventory/AssetTimelineModal';
import { InventoryReportModal } from '../components/inventory/InventoryReportModal';
import { ThermalLabelModal } from '../components/ThermalLabelModal';
import { printQRLabels } from '../utils/printLabels';
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
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  ShieldCheck,
  User,
  ChevronDown,
  ChevronRight,
  Server,
  Printer,
  MousePointer,
  Wrench,
  Laptop,
  FileText,
  Eye,
  Lock,
  Unlock,
  Shield,
  Monitor,
  Cpu,
  Tag,
  MapPin as MapPinIcon,
  Calendar,
  Hash,
  Clock,
  RotateCcw
} from 'lucide-react';

const CATEGORY_MIN_STOCK: Record<string, number> = {
  'Laptops': 5,
  'Monitores': 5,
  'Mini PCs & Desktops': 3,
  'Tablets': 3,
  'Impresoras Zebra': 2,
  'Scanners': 5,
  'Equipos & Dispositivos': 2,
  'Hardware & Lectores': 5,
  'Maquinaria': 1
};

interface InventoryProps {
  mode?: 'PLANT' | 'IT';
}

export const Inventory: React.FC<InventoryProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [inventoryTab, setInventoryTab] = useState<'PLANT' | 'IT'>(() => mode || 'PLANT');

  useEffect(() => {
    if (mode) setInventoryTab(mode);
  }, [mode]);

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPlant, setSelectedPlant] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'DECOMMISSIONED' | 'ALL'>('ACTIVE');
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Selected item for QR Modal
  const [selectedQRItem, setSelectedQRItem] = useState<Item | null>(null);

  // Accordion state
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Batch Print state
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Modular Modals State
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [viewingItem, setViewingItem] = useState<Item | null>(null);
  const [timelineItem, setTimelineItem] = useState<Item | null>(null);
  const [decommissionItem, setDecommissionItem] = useState<Item | null>(null);
  const [thermalItems, setThermalItems] = useState<Item[] | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (selectedPlant) params.plant = selectedPlant;
      params.status = statusFilter;
      params.isITInternal = inventoryTab === 'IT' ? 'true' : 'false';

      const res = await api.get('/items', { params });
      let resultItems: Item[] = res.data.items;

      if (onlyLowStock) {
        resultItems = resultItems.filter((item) => (item.stock === 0) || (item.minStock > 0 && item.stock <= item.minStock));
      }

      setItems(resultItems);
    } catch (err: any) {
      console.error('Error al cargar inventario:', err);
      setError('Error al conectar con el servidor para consultar inventario.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchItems();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedCategory, selectedPlant, statusFilter, onlyLowStock, inventoryTab]);

  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`¿Está seguro de eliminar el artículo "${name}"?`)) return;

    try {
      await api.delete(`/items/${id}`);
      setActionSuccessMsg(`Artículo "${name}" eliminado correctamente.`);
      fetchItems();
    } catch (err) {
      console.error('Error al eliminar:', err);
      alert('Error al eliminar el artículo.');
    }
  };

  const handleReactivateItem = async (item: Item) => {
    if (!window.confirm(`¿Desea reactivar el activo "${item.name}" al inventario activo?`)) return;
    try {
      await api.post(`/items/${item.id}/reactivate`, { newStock: 1 });
      setActionSuccessMsg(`¡Activo "${item.name}" reactivado correctamente al inventario!`);
      fetchItems();
    } catch (err: any) {
      console.error('Error al reactivar:', err);
      alert(err.response?.data?.error || 'Error al reactivar el activo.');
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
      location: formData.isITInternal ? 'Taller Interno IT' : formData.area
    });
    setActionSuccessMsg(`Artículo actualizado correctamente.`);
    fetchItems();
  };

  const totalItemsCount = items.length;
  const totalStockSum = items.reduce((acc, item) => acc + item.stock, 0);

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const cat = item.category || 'Sin Categoría';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, Item[]>);

  // Calculate alerts based on category stock
  let lowStockCount = 0;
  
  Object.keys(groupedItems).forEach(cat => {
    const catItems = groupedItems[cat];
    // Consumables use individual item minStock rules
    if (cat === 'Consumibles' || cat === 'Herramientas') {
      const lowItems = catItems.filter((item) => (item.stock === 0) || (item.minStock > 0 && item.stock <= item.minStock)).length;
      lowStockCount += lowItems;
    } else {
      // Serialized assets use aggregate available stock
      const availableStock = catItems.filter(i => i.stock > 0 && !i.assignedTo && !i.area).length;
      const targetMin = CATEGORY_MIN_STOCK[cat] || 2;
      if (availableStock < targetMin) {
        lowStockCount++; // 1 alert per category
      }
    }
  });

  return (
    <div>
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        background: 'var(--bg-input)',
        padding: '0.5rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        flexWrap: 'wrap'
      }}>
        <button
          className={`btn ${inventoryTab === 'PLANT' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setInventoryTab('PLANT');
            setSelectedPlant('');
          }}
          style={{
            fontSize: '0.95rem',
            fontWeight: 800,
            padding: '0.6rem 1.25rem'
          }}
        >
          Inventario Operativo de Plantas
        </button>

        <button
          className={`btn ${inventoryTab === 'IT' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setInventoryTab('IT');
            setSelectedPlant('');
          }}
          style={{
            fontSize: '0.95rem',
            fontWeight: 800,
            padding: '0.6rem 1.25rem',
            background: inventoryTab === 'IT' ? 'linear-gradient(135deg, #c98a4b 0%, #b07238 100%)' : undefined,
            borderColor: inventoryTab === 'IT' ? 'var(--coficab-copper)' : undefined
          }}
        >
          Inventario Interno de IT
        </button>
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {inventoryTab === 'IT' ? 'Inventario Interno del Departamento de IT' : 'Panel de Equipos Operativos en Plantas'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {inventoryTab === 'IT'
              ? 'Stock de taller de Sistemas, equipos de respaldo, refacciones, repuestos, cables, adaptadores y consumibles de IT.'
              : 'Monitoreo y control de equipos y dispositivos en funcionamiento activo en líneas y áreas operativas (Planta 1, 2, 3 u UPCAST).'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowReportModal(true)}
            style={{ borderColor: 'var(--coficab-blue-bright)', color: 'var(--coficab-blue-bright)' }}
            title="Generar reporte para imprimir o exportar a PDF"
          >
            <Printer size={18} />
            Exportar Reporte PDF
          </button>

          {inventoryTab === 'PLANT' && (
            <button className="btn btn-secondary" onClick={() => setShowImportModal(true)} style={{ borderColor: 'var(--border-copper)' }}>
              <FileSpreadsheet size={18} style={{ color: 'var(--coficab-copper)' }} />
              Importar Excel / CSV
            </button>
          )}

          <button className="btn btn-secondary" onClick={() => navigate('/scanner')}>
            <Scan size={18} />
            Escanear QR
          </button>

          <button
            className="btn btn-primary"
            onClick={() => navigate(inventoryTab === 'IT' ? '/add-item?isIT=1' : '/add-item')}
            style={inventoryTab === 'IT' ? { background: 'linear-gradient(135deg, #c98a4b 0%, #b07238 100%)' } : undefined}
          >
            <PlusCircle size={18} />
            {inventoryTab === 'IT' ? 'Nuevo Artículo IT' : 'Nuevo Artículo'}
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div style={{
          padding: '1rem 1.25rem',
          background: 'rgba(16, 185, 129, 0.14)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: 'var(--radius-md)',
          color: '#34d399',
          fontSize: '0.95rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 600
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CheckCircle2 size={20} /> {actionSuccessMsg}
          </div>
          <button onClick={() => setActionSuccessMsg(null)} style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Status Filter Bar (Activos vs Dados de Baja / Scrap) */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.03)',
        padding: '0.4rem 0.6rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', marginLeft: '0.4rem', marginRight: '0.4rem' }}>
          ESTADO DE ACTIVOS:
        </span>
        <button
          className={`btn ${statusFilter === 'ACTIVE' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setStatusFilter('ACTIVE')}
          style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem', fontWeight: 700 }}
        >
          🟢 {inventoryTab === 'IT' ? 'Inventario Activo (En Stock)' : 'Equipos Activos (En Servicio)'}
        </button>
        <button
          className={`btn ${statusFilter === 'DECOMMISSIONED' ? 'btn-danger' : 'btn-secondary'}`}
          onClick={() => setStatusFilter('DECOMMISSIONED')}
          style={{
            padding: '0.35rem 0.85rem',
            fontSize: '0.82rem',
            fontWeight: 700,
            borderColor: statusFilter === 'DECOMMISSIONED' ? '#ef4444' : undefined,
            color: statusFilter === 'DECOMMISSIONED' ? '#ffffff' : '#f87171'
          }}
        >
          🗑️ Historial Dados de Baja / Scrap (Basura)
        </button>
        <button
          className={`btn ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setStatusFilter('ALL')}
          style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem', fontWeight: 700 }}
        >
          📋 Todos los Registros
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>

        <div
          className="glass-panel glass-panel-interactive"
          style={{ padding: '1.25rem', cursor: 'pointer' }}
          onClick={() => setOnlyLowStock(false)}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>{inventoryTab === 'IT' ? 'Total Artículos IT' : 'Total Equipos Registrados'}</span>
            <Package size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            {totalItemsCount}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>{inventoryTab === 'IT' ? 'Stock Total en Almacén IT' : 'Unidades en Operación (Uso)'}</span>
            <Layers size={20} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>
            {totalStockSum}
          </div>
        </div>

        {inventoryTab === 'IT' ? (
          <div
            className="glass-panel glass-panel-interactive"
            style={{
              padding: '1.25rem',
              cursor: 'pointer',
              borderColor: onlyLowStock ? '#f59e0b' : lowStockCount > 0 ? 'rgba(245, 158, 11, 0.4)' : undefined,
              background: onlyLowStock ? 'rgba(245, 158, 11, 0.15)' : undefined
            }}
            onClick={() => setOnlyLowStock(!onlyLowStock)}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <span>Alertas Reabastecimiento</span>
              <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.25rem' }}>
              {lowStockCount} <small style={{ fontSize: '0.75rem', fontWeight: 500 }}>{onlyLowStock ? '(Filtrando)' : '(Clic para filtrar)'}</small>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <span>Equipos con Garantía Activa</span>
              <ShieldCheck size={20} style={{ color: 'var(--coficab-blue-bright)' }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--coficab-blue-bright)', marginTop: '0.25rem' }}>
              {items.filter(i => i.hasWarranty).length}
            </div>
          </div>
        )}

      </div>

      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', marginRight: '0.5rem' }}>
            SELECCIONAR PLANTA:
          </span>
          <button
            className={`btn ${selectedPlant === '' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedPlant('')}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', fontWeight: 700 }}
          >
            Todas las Plantas ({items.length})
          </button>
          <button
            className={`btn ${selectedPlant === 'Planta 1' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedPlant('Planta 1')}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', fontWeight: 700 }}
          >
            Planta 1
          </button>
          <button
            className={`btn ${selectedPlant === 'Planta 2' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedPlant('Planta 2')}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', fontWeight: 700 }}
          >
            Planta 2 (Principal)
          </button>
          <button
            className={`btn ${selectedPlant === 'Planta 3' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedPlant('Planta 3')}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', fontWeight: 700 }}
          >
            Planta 3
          </button>
          <button
            className={`btn ${selectedPlant === 'Planta UPCAST' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedPlant('Planta UPCAST')}
            style={{
              padding: '0.45rem 0.9rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              borderColor: selectedPlant === 'Planta UPCAST' ? 'var(--coficab-copper)' : undefined,
              color: selectedPlant === 'Planta UPCAST' ? '#ffffff' : undefined,
              background: selectedPlant === 'Planta UPCAST' ? 'linear-gradient(135deg, #c98a4b 0%, #b07238 100%)' : undefined
            }}
          >
            Planta UPCAST
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 2, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por Nombre, Modelo, Serie, Área, IP, SKU..."
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          </div>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <select
              className="form-input"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Todas las Categorías</option>
              <option value="Equipos & Dispositivos">Equipos & Dispositivos</option>
              <option value="Hardware & Lectores">Hardware & Lectores</option>
              <option value="Consumibles">Consumibles</option>
              <option value="Maquinaria">Maquinaria</option>
              <option value="Herramientas">Herramientas</option>
            </select>
          </div>

          <button className="btn btn-secondary" onClick={fetchItems} style={{ padding: '0.75rem 1rem' }}>
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1rem' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Cargando inventario...
          </div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#f43f5e' }}>
            {error}
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Package size={48} style={{ color: 'var(--text-dim)', marginBottom: '1rem' }} />
            <p>No se encontraron artículos con el criterio especificado.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.keys(groupedItems).map(cat => {
              const catItems = groupedItems[cat];
              const isExpanded = expandedCategories[cat];
              const isPlantMode = inventoryTab === 'PLANT';
              const isConsumable = cat === 'Consumibles' || cat === 'Herramientas';
              const totalInUse = catItems.reduce((acc, i) => acc + i.stock, 0);

              const availableStock = isConsumable ? 0 : catItems.filter(i => {
                if (i.stock <= 0) return false;
                const assigned = i.assignedTo?.toLowerCase().trim() || '';
                if (assigned && !['it', 'taller interno it', 'sistemas', 'taller it'].includes(assigned)) {
                  return false;
                }
                return true;
              }).length;
              const targetMin = CATEGORY_MIN_STOCK[cat] || 2;
              const isLow = !isConsumable && (availableStock < targetMin);
              const consumablesLow = isConsumable ? catItems.filter((item) => (item.stock === 0) || (item.minStock > 0 && item.stock <= item.minStock)).length : 0;
              
              // Only IT Internal Inventory uses stock replenishment alerts. Plant view is operational equipment in use.
              const hasAlert = !isPlantMode && (isLow || consumablesLow > 0);

              let CatIcon = Package;
              if (cat.toLowerCase().includes('laptop')) CatIcon = Laptop;
              else if (cat.toLowerCase().includes('pc') || cat.toLowerCase().includes('desktop')) CatIcon = Server;
              else if (cat.toLowerCase().includes('impresora') || cat.toLowerCase().includes('zebra')) CatIcon = Printer;
              else if (cat.toLowerCase().includes('scanner') || cat.toLowerCase().includes('lector')) CatIcon = Scan;
              else if (cat.toLowerCase().includes('herramienta')) CatIcon = Wrench;
              else if (cat.toLowerCase().includes('hardware')) CatIcon = MousePointer;

              return (
                <div key={cat} className="glass-panel" style={{ 
                  overflow: 'hidden', 
                  border: hasAlert ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid var(--border-color)' 
                }}>
                  <div 
                    onClick={() => toggleCategory(cat)}
                    style={{ 
                      padding: '1.25rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      background: isExpanded ? 'var(--bg-card-hover)' : 'var(--bg-main)',
                      transition: 'background 0.2s ease',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ 
                        padding: '0.75rem', 
                        borderRadius: 'var(--radius-md)', 
                        background: hasAlert ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0, 43, 144, 0.05)',
                        color: hasAlert ? '#f59e0b' : 'var(--primary)'
                      }}>
                        <CatIcon size={24} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                          {cat}
                        </h3>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {catItems.length} registros totales
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      {isPlantMode ? (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                            Equipos en Operación
                          </div>
                          <div style={{ 
                            fontSize: '1.35rem', 
                            fontWeight: 800, 
                            color: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            justifyContent: 'flex-end'
                          }}>
                            <CheckCircle2 size={18} />
                            {totalInUse} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dim)' }}>en uso</span>
                          </div>
                        </div>
                      ) : isConsumable ? (
                        consumablesLow > 0 && (
                          <span className="badge badge-warning" style={{ padding: '0.4rem 0.75rem' }}>
                            <AlertTriangle size={14} /> {consumablesLow} items con bajo stock
                          </span>
                        )
                      ) : (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                            Disponibles Almacén IT
                          </div>
                          <div style={{ 
                            fontSize: '1.4rem', 
                            fontWeight: 800, 
                            color: isLow ? '#f59e0b' : '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            justifyContent: 'flex-end'
                          }}>
                            {isLow && <AlertTriangle size={18} />}
                            {availableStock} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dim)' }}>/ {targetMin} mín.</span>
                          </div>
                        </div>
                      )}
                      
                      <div style={{ color: 'var(--text-dim)', paddingLeft: '0.5rem', borderLeft: '1px solid var(--border-color)' }}>
                        {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--border-color)' }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left', background: 'var(--bg-card)' }}>
                              <th style={{ padding: '0.75rem 1rem', width: '40px' }}></th>
                              <th style={{ padding: '0.75rem 1rem' }}>Equipo / Modelo</th>
                              <th style={{ padding: '0.75rem 1rem' }}>Planta</th>
                              <th style={{ padding: '0.75rem 1rem' }}>N° Serie & IP</th>
                              <th style={{ padding: '0.75rem 1rem' }}>Garantía</th>
                              <th style={{ padding: '0.75rem 1rem' }}>Área / Asignado</th>
                              <th style={{ padding: '0.75rem 1rem' }}>{isPlantMode ? 'Unidades en Uso' : 'Stock Almacén'}</th>
                              <th style={{ padding: '0.75rem 1rem' }}>Código QR</th>
                              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {catItems.map((item) => {
                              const isLowStock = !isPlantMode && (isConsumable ? ((item.stock === 0) || (item.minStock > 0 && item.stock <= item.minStock)) : false);
                              return (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                  <td style={{ padding: '0.85rem 1rem' }}>
                                    <input 
                                      type="checkbox"
                                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                      checked={selectedItemIds.has(item.id)}
                                      onChange={(e) => {
                                        const newSet = new Set(selectedItemIds);
                                        if (e.target.checked) newSet.add(item.id);
                                        else newSet.delete(item.id);
                                        setSelectedItemIds(newSet);
                                      }}
                                    />
                                  </td>
                                  <td style={{ padding: '0.85rem 1rem' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--coficab-blue-bright)', fontFamily: 'monospace' }}>
                                      SKU: {item.sku} {item.model ? `| Mod: ${item.model}` : ''}
                                    </div>
                                  </td>
                                  <td style={{ padding: '0.85rem 1rem' }}>
                                    {item.isITInternal ? (
                                      <span className="badge" style={{
                                        background: 'rgba(201, 138, 75, 0.25)',
                                        color: 'var(--coficab-copper)',
                                        border: '1px solid var(--coficab-copper)',
                                        fontSize: '0.75rem',
                                        fontWeight: 800
                                      }}>
                                        Interno IT
                                      </span>
                                    ) : (
                                      <span className="badge" style={{
                                        background: item.plant === 'Planta UPCAST' ? 'rgba(201, 138, 75, 0.2)' : 'rgba(37, 99, 235, 0.2)',
                                        color: item.plant === 'Planta UPCAST' ? 'var(--coficab-copper)' : '#60a5fa',
                                        border: item.plant === 'Planta UPCAST' ? '1px solid var(--coficab-copper)' : '1px solid #3b82f6',
                                        fontSize: '0.75rem',
                                        fontWeight: 800
                                      }}>
                                        {item.plant || 'Planta 2'}
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    <div>{item.serialNumber ? `S/N: ${item.serialNumber}` : '-'}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--coficab-copper)', fontFamily: 'monospace' }}>
                                      {item.ipAddress ? `IP: ${item.ipAddress}` : ''}
                                    </div>
                                  </td>
                                  <td style={{ padding: '0.85rem 1rem' }}>
                                    {item.hasWarranty ? (
                                      <span className="badge badge-inbound" style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981' }}>
                                        <ShieldCheck size={12} /> Vigente {item.warrantyExpiration ? `(${item.warrantyExpiration})` : ''}
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                                        Sin Garantía
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    {item.area ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                                        <MapPin size={14} style={{ color: 'var(--primary)' }} />
                                        {item.area}
                                      </div>
                                    ) : null}
                                    {item.assignedTo ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--coficab-copper)', fontWeight: 600 }}>
                                        <User size={14} />
                                        {item.assignedTo}
                                      </div>
                                    ) : null}
                                    {!item.area && !item.assignedTo && '-'}
                                  </td>
                                  <td style={{ padding: '0.85rem 1rem' }}>
                                    {isPlantMode ? (
                                      <span style={{
                                        fontWeight: 800,
                                        fontSize: '0.95rem',
                                        color: item.stock > 0 ? '#10b981' : 'var(--text-muted)'
                                      }}>
                                        {item.stock} {item.stock === 1 ? 'unidad' : 'unidades'}
                                      </span>
                                    ) : (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span style={{
                                          fontWeight: 800,
                                          fontSize: '1rem',
                                          color: isLowStock ? '#d97706' : '#10b981'
                                        }}>
                                          {item.stock} {item.unit || 'unidad'}{item.stock !== 1 ? 's' : ''}
                                        </span>
                                        {isLowStock && (
                                          <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                                            Bajo Stock
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '0.85rem 1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.4rem', flexDirection: 'column' }}>
                                      <button
                                        className="btn btn-secondary"
                                        onClick={() => setSelectedQRItem(item)}
                                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', width: '100%' }}
                                      >
                                        <QrCode size={14} />
                                        Etiqueta QR
                                      </button>

                                    </div>
                                  </td>
                                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                                      <button
                                        className="btn btn-secondary"
                                        onClick={() => setTimelineItem(item)}
                                        title="Ver Línea del Tiempo del Ciclo de Vida"
                                        style={{ padding: '0.35rem 0.55rem' }}
                                      >
                                        <Clock size={15} style={{ color: 'var(--coficab-blue-bright)' }} />
                                      </button>

                                      <button
                                        className="btn btn-secondary"
                                        onClick={() => setViewingItem(item)}
                                        title="Ver detalles completos"
                                        style={{ padding: '0.35rem 0.55rem' }}
                                      >
                                        <Eye size={15} />
                                      </button>

                                      {isAdmin && (
                                        <>
                                          <button
                                            className="btn btn-secondary"
                                            onClick={() => setEditingItem(item)}
                                            title="Editar todas las opciones del equipo"
                                            style={{ padding: '0.35rem 0.55rem' }}
                                          >
                                            <Edit size={15} />
                                          </button>

                                          {item.status !== 'DECOMMISSIONED' ? (
                                            <button
                                              className="btn btn-secondary"
                                              onClick={() => setDecommissionItem(item)}
                                              title="Dar de baja / Enviar a Scrap"
                                              style={{ padding: '0.35rem 0.55rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                                            >
                                              <Trash2 size={15} />
                                            </button>
                                          ) : (
                                            <button
                                              className="btn btn-success"
                                              onClick={() => handleReactivateItem(item)}
                                              title="Reactivar activo al inventario"
                                              style={{ padding: '0.35rem 0.55rem' }}
                                            >
                                              <RotateCcw size={15} />
                                            </button>
                                          )}

                                          <button
                                            className="btn btn-danger"
                                            onClick={() => handleDeleteItem(item.id, item.name)}
                                            title="Eliminar artículo permanentemente"
                                            style={{ padding: '0.35rem 0.55rem' }}
                                          >
                                            <X size={15} />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Excel Import Modal */}
      {showImportModal && (
        <ExcelImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={fetchItems}
        />
      )}

      {/* Inventory Printable / PDF Report Modal */}
      {showReportModal && (
        <InventoryReportModal
          items={items}
          totalCount={items.length}
          filters={{
            category: selectedCategory,
            plant: selectedPlant,
            searchQuery,
            isITInternal: inventoryTab === 'IT',
            status: statusFilter
          }}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Item Detail Modal */}
      {viewingItem && (
        <ItemDetailModal
          item={viewingItem}
          isAdmin={isAdmin}
          onClose={() => setViewingItem(null)}
          onEdit={(item) => {
            setViewingItem(null);
            setEditingItem(item);
          }}
          onOpenTimeline={(item) => {
            setViewingItem(null);
            setTimelineItem(item);
          }}
          onOpenDecommission={(item) => {
            setViewingItem(null);
            setDecommissionItem(item);
          }}
          onReactivate={(item) => {
            setViewingItem(null);
            handleReactivateItem(item);
          }}
        />
      )}

      {/* Decommission Modal */}
      {decommissionItem && (
        <DecommissionModal
          item={decommissionItem}
          onClose={() => setDecommissionItem(null)}
          onSuccess={(updated, msg) => {
            setDecommissionItem(null);
            setActionSuccessMsg(msg);
            fetchItems();
          }}
        />
      )}

      {/* Asset Lifecycle Timeline Modal */}
      {timelineItem && (
        <AssetTimelineModal
          item={timelineItem}
          onClose={() => setTimelineItem(null)}
        />
      )}

      {/* Item Edit Modal */}
      {editingItem && (
        <ItemEditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveItem}
        />
      )}

      {selectedQRItem && (
        <QRModal
          onClose={() => setSelectedQRItem(null)}
          item={selectedQRItem}
        />
      )}

      {/* Thermal Labels Print Modal (Zebra / Dymo) */}
      <ThermalLabelModal
        isOpen={!!thermalItems}
        onClose={() => setThermalItems(null)}
        items={thermalItems || []}
      />

      {selectedItemIds.size > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg-card)',
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius-full)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          zIndex: 100,
          border: '1px solid var(--border-color)',
          flexWrap: 'wrap'
        }}>
          <div style={{ color: 'var(--text-main)', fontWeight: 700 }}>
            {selectedItemIds.size} equipos seleccionados
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary"
              onClick={() => {
                const itemsToPrint = items.filter(i => selectedItemIds.has(i.id));
                setThermalItems(itemsToPrint);
              }}
              style={{ background: 'linear-gradient(135deg, #c98a4b 0%, #b07238 100%)', fontWeight: 800, gap: '0.4rem' }}
            >
              <Tag size={17} />
              Etiquetas Térmicas ({selectedItemIds.size})
            </button>

            <button 
              className="btn btn-secondary"
              onClick={() => {
                const itemsToPrint = items.filter(i => selectedItemIds.has(i.id));
                printQRLabels(itemsToPrint);
                setSelectedItemIds(new Set());
              }}
            >
              <Printer size={18} />
              Imprimir Lote Carta
            </button>

            <button 
              className="btn btn-secondary"
              onClick={() => setSelectedItemIds(new Set())}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
