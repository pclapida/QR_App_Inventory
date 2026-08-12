import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { Item } from '../services/api';
import { QRModal } from '../components/QRModal';
import { ResponsivaModal } from '../components/ResponsivaModal';
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
  FileText
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
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Selected item for QR Modal
  const [selectedQRItem, setSelectedQRItem] = useState<Item | null>(null);

  // Responsiva Modal State
  const [responsivaItem, setResponsivaItem] = useState<Item | null>(null);

  // Accordion state
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Batch Print state
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Excel Import Modal State
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{ message: string; count: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Edit Item Modal State with ALL registration fields
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editCustomFields, setEditCustomFields] = useState<{ key: string; value: string }[]>([]);
  const [editForm, setEditForm] = useState<any>({
    name: '',
    model: '',
    serialNumber: '',
    stock: 1,
    minStock: 5,
    area: '',
    ipAddress: '',
    hasWarranty: false,
    warrantyExpiration: '',
    faults: '',
    notes: '',
    sku: '',
    category: 'Equipos & Dispositivos',
    plant: 'Planta 2',
    isITInternal: false,
    assignedTo: '',
    unit: 'unidad',
    location: '',
    description: ''
  });
  const [editLoading, setEditLoading] = useState<boolean>(false);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (selectedPlant) params.plant = selectedPlant;
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
  }, [searchQuery, selectedCategory, selectedPlant, onlyLowStock, inventoryTab]);

  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`¿Está seguro de eliminar el artículo "${name}"?`)) return;

    try {
      await api.delete(`/items/${id}`);
      fetchItems();
    } catch (err) {
      console.error('Error al eliminar:', err);
      alert('Error al eliminar el artículo.');
    }
  };

  const handleOpenEdit = (item: Item) => {
    setEditingItem(item);

    let initialFields: { key: string; value: string }[] = [];
    if (item.customAttributes) {
      try {
        const parsed = typeof item.customAttributes === 'string' ? JSON.parse(item.customAttributes) : item.customAttributes;
        if (parsed && typeof parsed === 'object') {
          initialFields = Object.entries(parsed).map(([k, v]) => ({ key: k, value: String(v) }));
        }
      } catch (e) {
        console.error('Error parsing customAttributes:', e);
      }
    }
    setEditCustomFields(initialFields);

    setEditForm({
      name: item.name || '',
      model: item.model || '',
      serialNumber: item.serialNumber || '',
      stock: item.stock || 0,
      minStock: item.minStock || 1,
      area: item.area || item.location || '',
      ipAddress: item.ipAddress || '',
      hasWarranty: !!item.hasWarranty,
      warrantyExpiration: item.warrantyExpiration || '',
      faults: item.faults || '',
      notes: item.notes || '',
      sku: item.sku || '',
      category: item.category || 'Equipos & Dispositivos',
      plant: item.plant || 'Planta 2',
      isITInternal: !!item.isITInternal,
      assignedTo: item.assignedTo || '',
      unit: item.unit || 'unidad',
      location: item.location || item.area || '',
      description: item.description || ''
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setEditLoading(true);

    try {
      const customAttributesObj: Record<string, string> = {};
      editCustomFields.forEach((f: { key: string; value: string }) => {
        if (f.key.trim()) {
          customAttributesObj[f.key.trim()] = f.value.trim();
        }
      });

      await api.put(`/items/${editingItem.id}`, {
        ...editForm,
        customAttributes: Object.keys(customAttributesObj).length > 0 ? customAttributesObj : null,
        location: editForm.isITInternal ? 'Taller Interno IT' : editForm.area
      });
      setEditingItem(null);
      fetchItems();
    } catch (err: any) {
      console.error('Error al editar artículo:', err);
      alert(err.response?.data?.error || 'Error al actualizar el artículo');
    } finally {
      setEditLoading(false);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/items/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setImportResult({
        message: res.data.message,
        count: res.data.importedCount,
        errors: res.data.errors || []
      });
      fetchItems();
    } catch (err: any) {
      console.error('Error al importar Excel:', err);
      alert(err.response?.data?.error || 'Error al procesar la plantilla Excel');
    } finally {
      setImporting(false);
      if (e.target) e.target.value = '';
    }
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
            {inventoryTab === 'IT' ? 'Inventario Interno del Departamento de IT' : 'Panel General de Inventario Operativo COFICAB'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {inventoryTab === 'IT'
              ? 'Stock de taller de Sistemas, equipos de respaldo, refacciones, repuestos, cables, adaptadores y consumibles de IT.'
              : 'Gestión completa de existencias, garantías de equipos y etiquetas QR en Planta 1, 2, 3 u UPCAST.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>

        <div
          className="glass-panel glass-panel-interactive"
          style={{ padding: '1.25rem', cursor: 'pointer' }}
          onClick={() => setOnlyLowStock(false)}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Total Artículos</span>
            <Package size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            {totalItemsCount}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Stock Unidades Total</span>
            <Layers size={20} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>
            {totalStockSum}
          </div>
        </div>

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
              const isConsumable = cat === 'Consumibles' || cat === 'Herramientas';
              const availableStock = isConsumable ? 0 : catItems.filter(i => {
                if (i.stock <= 0) return false;
                const assigned = i.assignedTo?.toLowerCase().trim() || '';
                // Considerarlo disponible en el almacén de IT si no está asignado o está asignado genéricamente a IT
                if (assigned && !['it', 'taller interno it', 'sistemas', 'taller it'].includes(assigned)) {
                  return false;
                }
                return true;
              }).length;
              const targetMin = CATEGORY_MIN_STOCK[cat] || 2;
              const isLow = !isConsumable && (availableStock < targetMin);
              const consumablesLow = isConsumable ? catItems.filter((item) => (item.stock === 0) || (item.minStock > 0 && item.stock <= item.minStock)).length : 0;
              const hasAlert = isLow || consumablesLow > 0;

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
                      {isConsumable ? (
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
                              <th style={{ padding: '0.75rem 1rem' }}>Stock</th>
                              <th style={{ padding: '0.75rem 1rem' }}>Código QR</th>
                              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {catItems.map((item) => {
                              const isLowStock = isConsumable ? ((item.stock === 0) || (item.minStock > 0 && item.stock <= item.minStock)) : false;
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <span style={{
                                        fontWeight: 800,
                                        fontSize: '1rem',
                                        color: isLowStock ? '#d97706' : '#10b981'
                                      }}>
                                        {item.stock} {item.unit}s
                                      </span>
                                      {isLowStock && (
                                        <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                                          Bajo
                                        </span>
                                      )}
                                    </div>
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
                                      {item.isITInternal && (
                                        <button
                                          className="btn btn-secondary"
                                          onClick={() => setResponsivaItem(item)}
                                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', width: '100%', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                                          title="Generar documento de asignación (Responsiva)"
                                        >
                                          <FileText size={14} />
                                          Responsiva
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                                      <button
                                        className="btn btn-secondary"
                                        onClick={() => navigate(`/scanner?code=${encodeURIComponent(item.sku)}`)}
                                        title="Ver detalles o consultar trazabilidad"
                                        style={{ padding: '0.35rem 0.55rem' }}
                                      >
                                        <Scan size={15} />
                                      </button>
                                      {isAdmin && (
                                        <>
                                          <button
                                            className="btn btn-secondary"
                                            onClick={() => handleOpenEdit(item)}
                                            title="Editar todas las opciones del equipo"
                                            style={{ padding: '0.35rem 0.55rem' }}
                                          >
                                            <Edit size={15} />
                                          </button>
                                          <button
                                            className="btn btn-danger"
                                            onClick={() => handleDeleteItem(item.id, item.name)}
                                            title="Eliminar artículo"
                                            style={{ padding: '0.35rem 0.55rem' }}
                                          >
                                            <Trash2 size={15} />
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
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FileSpreadsheet size={24} style={{ color: 'var(--coficab-copper)' }} />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Importar Inventario desde Excel
                </h3>
              </div>
              <button onClick={() => setShowImportModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Seleccione un archivo de hoja de cálculo <strong>.xlsx, .xls o .csv</strong>. El sistema leerá e insertará automáticamente todos los equipos con sus nombres, modelos, números de serie, stock, área e IP, generando sus códigos QR.
            </p>

            <div style={{
              background: 'var(--bg-input)',
              border: '2px dashed var(--border-copper)',
              borderRadius: 'var(--radius-md)',
              padding: '2rem 1.5rem',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                ref={fileInputRef}
                onChange={handleExcelUpload}
                style={{ display: 'none' }}
              />

              <Upload size={40} style={{ color: 'var(--coficab-copper)', margin: '0 auto 0.75rem auto' }} />

              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                {importing ? 'Procesando e insertando filas de Excel...' : 'Cargar Archivo de Excel'}
              </h4>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Soporta encabezados: Nombre, Modelo, Serie, Stock, Área, IP, Garantía, Fallas, Observaciones
              </p>

              <button
                className="btn btn-primary btn-lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                style={{ background: 'linear-gradient(135deg, #d97706 0%, #b07238 100%)' }}
              >
                <FileSpreadsheet size={20} />
                {importing ? 'Importando Datos...' : 'Seleccionar Archivo Excel (.xlsx)'}
              </button>
            </div>

            {importResult && (
              <div style={{
                padding: '1rem',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: '#10b981',
                fontSize: '0.9rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, marginBottom: '0.3rem' }}>
                  <CheckCircle2 size={20} /> {importResult.message}
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#f43f5e' }}>
                    <strong>Advertencias / Errores en filas:</strong>
                    <ul>
                      {importResult.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowImportModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Editar Equipo / Artículo: {editingItem.sku}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Modifique cualquiera de las opciones y atributos guardados.
                </p>
              </div>
              <button onClick={() => setEditingItem(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem' }}>

                {/* 1. Nombre */}
                <div className="form-group">
                  <label className="form-label">1. Nombre del Equipo / Artículo *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>

                {/* 2. Modelo */}
                <div className="form-group">
                  <label className="form-label">
                    2. Modelo {editingItem?.isITInternal ? <span style={{ color: '#ef4444', fontWeight: 800 }}>* (Obligatorio IT)</span> : ''}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.model}
                    onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                    required={editingItem?.isITInternal}
                    style={editingItem?.isITInternal && !editForm.model ? { borderColor: 'rgba(239,68,68,0.5)' } : undefined}
                  />
                </div>

                {/* 3. Número de Serie */}
                <div className="form-group">
                  <label className="form-label">
                    3. Número de Serie {editingItem?.isITInternal ? <span style={{ color: '#ef4444', fontWeight: 800 }}>* (Obligatorio IT)</span> : ''}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.serialNumber}
                    onChange={(e) => setEditForm({ ...editForm, serialNumber: e.target.value })}
                    required={editingItem?.isITInternal}
                    style={editingItem?.isITInternal && !editForm.serialNumber ? { borderColor: 'rgba(239,68,68,0.5)' } : undefined}
                  />
                </div>

                {/* 4. Stock */}
                <div className="form-group">
                  <label className="form-label">4. Stock (Cantidad)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value || '0', 10) })}
                    min="0"
                    required
                  />
                </div>

                {/* 5. Área */}
                <div className="form-group">
                  <label className="form-label">5. Área / Ubicación</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.area}
                    onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                  />
                </div>

                {/* 6. Dirección IP */}
                <div className="form-group">
                  <label className="form-label">6. Dirección IP</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.ipAddress}
                    onChange={(e) => setEditForm({ ...editForm, ipAddress: e.target.value })}
                  />
                </div>

                {/* Garantía */}
                <div className="form-group" style={{ gridColumn: '1 / -1', background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <label className="form-label" style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
                    <ShieldCheck size={18} /> ¿Cuenta con Garantía Vigente?
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                      <input
                        type="radio"
                        name="editHasWarranty"
                        checked={editForm.hasWarranty}
                        onChange={() => setEditForm({ ...editForm, hasWarranty: true })}
                      />
                      Sí (Con Garantía)
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      <input
                        type="radio"
                        name="editHasWarranty"
                        checked={!editForm.hasWarranty}
                        onChange={() => setEditForm({ ...editForm, hasWarranty: false, warrantyExpiration: '' })}
                      />
                      No / Vencida
                    </label>
                  </div>

                  {editForm.hasWarranty && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Fecha de Vencimiento de la Garantía</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.warrantyExpiration}
                        onChange={(e) => setEditForm({ ...editForm, warrantyExpiration: e.target.value })}
                        placeholder="ej. 29/06/2026 o 18/12/2026"
                      />
                    </div>
                  )}
                </div>

                {/* 7. SKU / Código Interno */}
                <div className="form-group">
                  <label className="form-label">7. SKU / Código Interno</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.sku}
                    onChange={(e) => setEditForm({ ...editForm, sku: e.target.value.toUpperCase() })}
                    required
                  />
                </div>

                {/* Categoría */}
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select
                    className="form-input"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  >
                    <option value="Equipos & Dispositivos">Equipos & Dispositivos</option>
                    <option value="Hardware & Lectores">Hardware & Lectores</option>
                    <option value="Consumibles">Consumibles</option>
                    <option value="Maquinaria">Maquinaria</option>
                    <option value="Herramientas">Herramientas</option>
                  </select>
                </div>

                {/* Planta COFICAB */}
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 800 }}>Planta COFICAB</label>
                  <select
                    className="form-input"
                    value={editForm.plant}
                    onChange={(e) => setEditForm({ ...editForm, plant: e.target.value })}
                    style={{ fontWeight: 700, borderColor: 'var(--primary)' }}
                  >
                    <option value="Planta 1">Planta 1</option>
                    <option value="Planta 2">Planta 2 (Principal)</option>
                    <option value="Planta 3">Planta 3</option>
                    <option value="Planta UPCAST">Planta UPCAST</option>
                  </select>
                </div>

                {/* Stock Mínimo */}
                <div className="form-group">
                  <label className="form-label">Stock Mínimo (Alerta)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.minStock}
                    onChange={(e) => setEditForm({ ...editForm, minStock: parseInt(e.target.value || '0', 10) })}
                    min="0"
                    required
                  />
                </div>

                {/* Unidad de Medida */}
                <div className="form-group">
                  <label className="form-label">Unidad de Medida</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.unit}
                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    required
                  />
                </div>

                {/* 8. Fallas */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <AlertTriangle size={15} /> 8. Fallas / Defectos Reportados
                  </label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={editForm.faults}
                    onChange={(e) => setEditForm({ ...editForm, faults: e.target.value })}
                    placeholder="Describa fallas o problemas si aplica..."
                  />
                </div>

                {/* Asignado a */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Responsable / Asignado a</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nombre de la persona (ej. Juan Perez)"
                    value={editForm.assignedTo}
                    onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
                  />
                </div>

                {/* 9. Observaciones */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">9. Observaciones / Notas Adicionales</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Observaciones de mantenimiento o notas generales..."
                  />
                </div>

                {/* Dynamic Custom Fields Section */}
                <div style={{ gridColumn: '1 / -1', background: 'var(--bg-input)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <label className="form-label" style={{ color: 'var(--coficab-copper)', fontWeight: 800, fontSize: '0.95rem', marginBottom: 0 }}>
                        Campos y Atributos Personalizados Dinámicos
                      </label>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                        Agregue o elimine libremente nuevos campos (ej. Clave Bitlocker, N° Factura, Proveedor, Voltaje, Licencia, MAC Address, etc.).
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setEditCustomFields([...editCustomFields, { key: '', value: '' }])}
                      style={{ fontSize: '0.82rem', borderColor: 'var(--coficab-copper)', color: 'var(--coficab-copper)', fontWeight: 700 }}
                    >
                      <PlusCircle size={16} />
                      Añadir Nuevo Campo
                    </button>
                  </div>

                  {editCustomFields.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {editCustomFields.map((field: { key: string; value: string }, idx: number) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Nombre del Campo (ej. Clave Bitlocker / Proveedor)"
                            value={field.key}
                            onChange={(e) => {
                              const updated = [...editCustomFields];
                              updated[idx].key = e.target.value;
                              setEditCustomFields(updated);
                            }}
                            style={{ flex: 1, minWidth: '180px', fontWeight: 700 }}
                          />
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Valor (ej. 81135362 / Dell México)"
                            value={field.value}
                            onChange={(e) => {
                              const updated = [...editCustomFields];
                              updated[idx].value = e.target.value;
                              setEditCustomFields(updated);
                            }}
                            style={{ flex: 1, minWidth: '180px' }}
                          />
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => setEditCustomFields(editCustomFields.filter((_: any, i: number) => i !== idx))}
                            style={{ padding: '0.55rem', borderRadius: 'var(--radius-sm)' }}
                            title="Eliminar este campo"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontStyle: 'italic', background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                      No ha añadido ningún campo personalizado adicional. Presione "Añadir Nuevo Campo" para agregar un nuevo dato a este registro.
                    </div>
                  )}
                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingItem(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-lg" disabled={editLoading}>
                  <Check size={18} />
                  {editLoading ? 'Guardando...' : 'Guardar Todos los Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedQRItem && (
        <QRModal
          onClose={() => setSelectedQRItem(null)}
          item={selectedQRItem}
        />
      )}

      <ResponsivaModal
        isOpen={!!responsivaItem}
        onClose={() => setResponsivaItem(null)}
        item={responsivaItem}
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
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ color: 'var(--text-main)', fontWeight: 700 }}>
            {selectedItemIds.size} equipos seleccionados
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              className="btn btn-primary"
              onClick={() => {
                const itemsToPrint = items.filter(i => selectedItemIds.has(i.id));
                printQRLabels(itemsToPrint);
                setSelectedItemIds(new Set());
              }}
            >
              <Printer size={18} />
              Imprimir Lote QR
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
