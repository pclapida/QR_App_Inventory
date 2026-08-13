import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { Item, Transaction } from '../services/api';
import { CoficabLogo } from '../components/CoficabLogo';
import {
  Tv,
  AlertTriangle,
  Flame,
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Maximize2,
  Minimize2,
  RefreshCw,
  MapPin,
  CheckCircle2,
  Volume2,
  VolumeX,
  Wrench,
  Calendar,
  Laptop,
  Monitor as MonitorIcon,
  Cpu,
  Tablet,
  Printer,
  Headphones,
  Wifi,
  Layers,
  LogOut
} from 'lucide-react';

interface MaintenanceItem {
  id: string;
  name: string;
  sku: string;
  area?: string;
  category?: string;
  nextDueDate: string;
  daysLeft: number;
}

export const TVDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [upcomingMaintenances, setUpcomingMaintenances] = useState<MaintenanceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  const [dashboardMode, setDashboardMode] = useState<'IT' | 'PLANT'>('IT');

  const fetchData = async () => {
    try {
      const [itemsRes, maintRes] = await Promise.all([
        api.get('/items', { params: { isITInternal: dashboardMode === 'IT' ? 'true' : 'false' } }),
        api.get('/maintenance')
      ]);

      const fetchedItems: Item[] = itemsRes.data.items || [];
      setItems(fetchedItems);

      // Collect recent transactions across all items
      const allTx: Transaction[] = [];
      fetchedItems.forEach((item) => {
        if (item.transactions) {
          allTx.push(...item.transactions);
        }
      });
      allTx.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentTransactions(allTx.slice(0, 6));

      // Calculate upcoming/overdue maintenances
      const rawMaint: any[] = maintRes.data.maintenances || [];
      const maintList: MaintenanceItem[] = rawMaint.map((m) => {
        const nextDate = new Date(m.nextDueDate);
        const diffTime = nextDate.getTime() - Date.now();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          id: m.id,
          name: m.item?.name || 'Equipo',
          sku: m.item?.sku || '',
          area: m.item?.area || m.item?.location || 'Planta',
          category: m.item?.category || '',
          nextDueDate: m.nextDueDate,
          daysLeft
        };
      });

      // Filter: only upcoming in next 60 days or overdue
      const filteredMaint = maintList.filter((m) => m.daysLeft <= 60);
      filteredMaint.sort((a, b) => a.daysLeft - b.daysLeft);
      setUpcomingMaintenances(filteredMaint.slice(0, 6));

      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('TV Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // 15s polling
    return () => clearInterval(interval);
  }, [dashboardMode]);

  // Live Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const outOfStockItems = items.filter((i) => i.stock === 0);
  const lowStockItems = items.filter((i) => i.stock > 0 && i.minStock > 0 && i.stock <= i.minStock);
  const healthyItemsCount = items.filter((i) => i.stock > 0 && (i.minStock === 0 || i.stock > i.minStock)).length;
  const totalStockUnits = items.reduce((acc, i) => acc + i.stock, 0);

  // Category Breakdown Counts
  const countLaptops = items.filter((i) => i.name.toLowerCase().includes('laptop')).length;
  const countMonitors = items.filter((i) => i.name.toLowerCase().includes('mon') || i.name.toLowerCase().includes('monitor')).length;
  const countPCs = items.filter((i) => (i.name.toLowerCase().includes('pc') || i.name.toLowerCase().includes('minipc')) && !i.name.toLowerCase().includes('upcast')).length;
  const countTablets = items.filter((i) => i.name.toLowerCase().includes('tablet')).length;
  const countZebras = items.filter((i) => i.name.toLowerCase().includes('zebra') || i.name.toLowerCase().includes('scanner')).length;
  const countPrinters = items.filter((i) => i.name.toLowerCase().includes('impresora') || i.name.toLowerCase().includes('camara')).length;
  const countAssignedMatrix = items.filter((i) => i.sku.startsWith('ASG-')).length;
  const countNetwork = items.filter((i) => i.name.toLowerCase().includes('ap') || i.name.toLowerCase().includes('idf')).length;

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'radial-gradient(ellipse at 20% 0%, rgba(37, 99, 235, 0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 100%, rgba(201, 138, 75, 0.15) 0%, transparent 55%), #060a14',
      padding: '1.25rem 2rem 3rem 2rem',
      color: '#ffffff',
      boxSizing: 'border-box'
    }}>
      {/* TV Header Bar */}
      <div className="liquid-glass-card" style={{
        padding: '1rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        borderBottom: '1px solid rgba(255,255,255,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div
            style={{ cursor: 'pointer', transition: 'transform 0.25s ease' }}
            onClick={() => navigate('/inventory')}
            title="Volver al Inventario"
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <CoficabLogo height={52} showTagline={true} themeMode="dark" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{
                fontSize: '1.65rem',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                margin: 0,
                lineHeight: 1.2
              }}>
                MONITOR DE CONTROL EN VIVO
              </h1>
              <span style={{
                background: 'rgba(239, 68, 68, 0.18)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.45)',
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 0 12px rgba(239, 68, 68, 0.3)'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }}></span>
                TV KIOSK MODE
              </span>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '0.15rem' }}>
              Actualización automática continua en pantalla gigante | Sincronización: <strong style={{ color: '#e2e8f0' }}>{lastUpdated.toLocaleTimeString('es-ES')}</strong>
            </p>
          </div>
        </div>

        {/* iOS Style Segmented Mode Switcher */}
        <div style={{
          display: 'flex',
          gap: '0.4rem',
          background: 'rgba(0, 0, 0, 0.45)',
          padding: '0.35rem',
          borderRadius: 'var(--radius-full)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
        }}>
          <button
            onClick={() => setDashboardMode('IT')}
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.9rem',
              fontWeight: 800,
              borderRadius: 'var(--radius-full)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              background: dashboardMode === 'IT' ? 'linear-gradient(135deg, #c98a4b 0%, #a0632a 100%)' : 'transparent',
              color: dashboardMode === 'IT' ? '#ffffff' : '#94a3b8',
              boxShadow: dashboardMode === 'IT' ? '0 4px 14px rgba(201, 138, 75, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)' : 'none'
            }}
          >
            Inventario IT
          </button>
          <button
            onClick={() => setDashboardMode('PLANT')}
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.9rem',
              fontWeight: 800,
              borderRadius: 'var(--radius-full)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              background: dashboardMode === 'PLANT' ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'transparent',
              color: dashboardMode === 'PLANT' ? '#ffffff' : '#94a3b8',
              boxShadow: dashboardMode === 'PLANT' ? '0 4px 14px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)' : 'none'
            }}
          >
            Inventario Plantas
          </button>
        </div>

        {/* Clock & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.9) 0%, rgba(8, 14, 28, 0.95) 100%)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderTop: '1px solid rgba(255,255,255,0.3)',
            padding: '0.5rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(0,0,0,0.4)'
          }}>
            <div style={{
              fontSize: '1.85rem',
              fontWeight: 900,
              fontFamily: 'monospace',
              color: '#60a5fa',
              letterSpacing: '0.06em',
              textShadow: '0 0 12px rgba(96, 165, 250, 0.5)'
            }}>
              {currentTime}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Hora Servidor
            </div>
          </div>

          <button
            className="btn btn-secondary liquid-glass-pill"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Sonido Activado' : 'Sonido Desactivado'}
            style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)' }}
          >
            {soundEnabled ? <Volume2 size={22} style={{ color: '#10b981' }} /> : <VolumeX size={22} style={{ color: '#64748b' }} />}
          </button>

          <button
            className="btn btn-primary"
            onClick={toggleFullscreen}
            style={{
              padding: '0.75rem 1.25rem',
              fontSize: '0.95rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)'
            }}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            {isFullscreen ? 'Salir Pantalla Completa' : 'Modo Pantalla Completa'}
          </button>

          <button
            className="btn btn-secondary liquid-glass-pill"
            onClick={() => navigate('/inventory')}
            style={{ padding: '0.75rem 1.15rem', fontSize: '0.95rem', borderRadius: 'var(--radius-md)' }}
            title="Salir de TV y volver a inventario"
          >
            <LogOut size={18} />
            Volver
          </button>
        </div>
      </div>

      {/* Row 1: 4 Liquid Glass Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>

        {/* 1. Total Stock Units Card */}
        <div
          className="liquid-glass-card"
          style={{
            padding: '1.35rem 1.5rem',
            ['--glow-color' as any]: 'rgba(99, 102, 241, 0.35)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>TOTAL REGISTROS</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.18)', border: '1px solid rgba(99, 102, 241, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
              <Package size={22} />
            </div>
          </div>
          <div style={{ fontSize: '3.2rem', fontWeight: 900, color: '#60a5fa', lineHeight: 1.05, marginTop: '0.6rem', textShadow: '0 0 20px rgba(96, 165, 250, 0.35)' }}>
            {totalStockUnits} <small style={{ fontSize: '0.95rem', fontWeight: 600, color: '#94a3b8' }}>equipos</small>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.4rem' }}>
            {items.length} modelos en catálogo
          </div>
        </div>

        {/* 2. Healthy Stock */}
        <div
          className="liquid-glass-card"
          style={{
            padding: '1.35rem 1.5rem',
            borderLeft: '2px solid #10b981',
            ['--glow-color' as any]: 'rgba(16, 185, 129, 0.35)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#34d399' }}>STOCK EN SERVICIO</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.18)', border: '1px solid rgba(16, 185, 129, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div style={{ fontSize: '3.2rem', fontWeight: 900, color: '#10b981', lineHeight: 1.05, marginTop: '0.6rem', textShadow: '0 0 20px rgba(16, 185, 129, 0.35)' }}>
            {healthyItemsCount} <small style={{ fontSize: '0.95rem', fontWeight: 600, color: '#34d399' }}>unidades</small>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '0.4rem', fontWeight: 600 }}>
            {totalStockUnits > 0 ? `${Math.round((healthyItemsCount / (totalStockUnits || 1)) * 100)}% de disponibilidad óptima` : 'Sin alertas activas'}
          </div>
        </div>

        {/* 3. Low Stock Warning Card */}
        <div
          className="liquid-glass-card"
          style={{
            padding: '1.35rem 1.5rem',
            borderLeft: lowStockItems.length > 0 ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.12)',
            ['--glow-color' as any]: 'rgba(245, 158, 11, 0.4)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: lowStockItems.length > 0 ? '#fde047' : '#94a3b8' }}>REABASTECIMIENTO</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.18)', border: '1px solid rgba(245, 158, 11, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <AlertTriangle size={22} />
            </div>
          </div>
          <div style={{ fontSize: '3.2rem', fontWeight: 900, color: lowStockItems.length > 0 ? '#f59e0b' : '#ffffff', lineHeight: 1.05, marginTop: '0.6rem', textShadow: lowStockItems.length > 0 ? '0 0 20px rgba(245, 158, 11, 0.4)' : 'none' }}>
            {lowStockItems.length} <small style={{ fontSize: '0.95rem', fontWeight: 600, color: '#94a3b8' }}>alertas</small>
          </div>
          <div style={{ fontSize: '0.8rem', color: lowStockItems.length > 0 ? '#d97706' : '#64748b', marginTop: '0.4rem', fontWeight: 600 }}>
            {lowStockItems.length > 0 ? 'Por debajo del umbral mínimo' : 'Nivel de stock bajo control'}
          </div>
        </div>

        {/* 4. Out of Stock Card */}
        <div
          className="liquid-glass-card"
          style={{
            padding: '1.35rem 1.5rem',
            borderLeft: outOfStockItems.length > 0 ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.12)',
            ['--glow-color' as any]: 'rgba(239, 68, 68, 0.4)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: outOfStockItems.length > 0 ? '#fca5a5' : '#94a3b8' }}>AGOTADOS (STOCK 0)</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.18)', border: '1px solid rgba(239, 68, 68, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: outOfStockItems.length > 0 ? '#ef4444' : '#64748b' }}>
              <Flame size={22} />
            </div>
          </div>
          <div style={{ fontSize: '3.2rem', fontWeight: 900, color: outOfStockItems.length > 0 ? '#ef4444' : '#ffffff', lineHeight: 1.05, marginTop: '0.6rem', textShadow: outOfStockItems.length > 0 ? '0 0 20px rgba(239, 68, 68, 0.4)' : 'none' }}>
            {outOfStockItems.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: outOfStockItems.length > 0 ? '#dc2626' : '#64748b', marginTop: '0.4rem', fontWeight: 600 }}>
            {outOfStockItems.length > 0 ? 'Requiere reabastecimiento urgente' : 'Cero equipos agotados'}
          </div>
        </div>

      </div>

      {/* Row 2: Equipment Category Breakdown Bar */}
      <div className="liquid-glass-card" style={{
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        ['--glow-color' as any]: 'rgba(201, 138, 75, 0.25)'
      }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--coficab-copper)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(201, 138, 75, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c98a4b' }}>
            <Layers size={16} />
          </div>
          DESGLOSE DETALLADO DE EQUIPAMIENTO COFICAB POR TIPO:
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem' }}>
          <div className="liquid-glass-pill">
            <div style={{ fontSize: '0.78rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
              <Laptop size={15} /> Laptops
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', marginTop: '0.25rem' }}>{countLaptops}</div>
          </div>

          <div className="liquid-glass-pill">
            <div style={{ fontSize: '0.78rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
              <MonitorIcon size={15} /> Monitores
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', marginTop: '0.25rem' }}>{countMonitors}</div>
          </div>

          <div className="liquid-glass-pill">
            <div style={{ fontSize: '0.78rem', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
              <Cpu size={15} /> PCs / MiniPCs
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', marginTop: '0.25rem' }}>{countPCs}</div>
          </div>

          <div className="liquid-glass-pill">
            <div style={{ fontSize: '0.78rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
              <Tablet size={15} /> Tablets
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', marginTop: '0.25rem' }}>{countTablets}</div>
          </div>

          <div className="liquid-glass-pill">
            <div style={{ fontSize: '0.78rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
              <Printer size={15} /> Lectores / Zebras
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', marginTop: '0.25rem' }}>{countZebras}</div>
          </div>

          <div className="liquid-glass-pill">
            <div style={{ fontSize: '0.78rem', color: '#fb923c', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
              <Printer size={15} /> Impresoras
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', marginTop: '0.25rem' }}>{countPrinters}</div>
          </div>

          <div className="liquid-glass-pill">
            <div style={{ fontSize: '0.78rem', color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
              <Headphones size={15} /> Matriz Asignados
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', marginTop: '0.25rem' }}>{countAssignedMatrix}</div>
          </div>

          <div className="liquid-glass-pill">
            <div style={{ fontSize: '0.78rem', color: '#2dd4bf', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
              <Wifi size={15} /> AP & IDF (Redes)
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', marginTop: '0.25rem' }}>{countNetwork}</div>
          </div>
        </div>
      </div>

      {/* Row 3: Horizontal TV Section 1: Urgent Stock Alerts */}
      <div className="liquid-glass-card" style={{
        padding: '1.35rem 1.5rem',
        marginBottom: '1.35rem',
        borderLeft: outOfStockItems.length > 0 || lowStockItems.length > 0 ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.12)',
        ['--glow-color' as any]: 'rgba(245, 158, 11, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.65rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ffffff' }}>
            <AlertTriangle size={22} style={{ color: '#f59e0b' }} />
            ALERTAS DE REABASTECIMIENTO
            <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500, marginLeft: '0.5rem', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)' }}>
              {outOfStockItems.length + lowStockItems.length} {outOfStockItems.length + lowStockItems.length === 1 ? 'equipo requiere atención' : 'equipos requieren atención'}
            </span>
          </h2>
        </div>

        {outOfStockItems.length === 0 && lowStockItems.length === 0 ? (
          <div style={{ padding: '1rem 1.5rem', background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.85rem', color: '#34d399' }}>
            <CheckCircle2 size={24} style={{ color: '#10b981', flexShrink: 0 }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>¡Stock de Todos los Equipos en Nivel Óptimo! Todos los equipos cuentan con inventario suficiente.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.85rem' }}>
            {outOfStockItems.map((item) => (
              <div key={item.id} className="liquid-glass-interactive-item" style={{
                background: 'linear-gradient(145deg, rgba(239, 68, 68, 0.18) 0%, rgba(185, 28, 28, 0.1) 100%)',
                border: '1.5px solid #ef4444',
                padding: '0.85rem 1.15rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span className="badge badge-outbound" style={{ background: '#ef4444', color: '#ffffff', fontSize: '0.72rem', fontWeight: 800 }}>AGOTADO</span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginTop: '0.3rem' }}>{item.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#d1d5db' }}>SKU: {item.sku} | Área: {item.location || item.area || 'Planta'}</div>
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#ef4444', marginLeft: '1rem', textShadow: '0 0 16px rgba(239, 68, 68, 0.5)' }}>0</div>
              </div>
            ))}

            {lowStockItems.map((item) => (
              <div key={item.id} className="liquid-glass-interactive-item" style={{
                background: 'linear-gradient(145deg, rgba(245, 158, 11, 0.18) 0%, rgba(180, 83, 9, 0.1) 100%)',
                border: '1.5px solid #f59e0b',
                padding: '0.85rem 1.15rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span className="badge badge-warning" style={{ fontSize: '0.72rem', fontWeight: 800 }}>STOCK BAJO</span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginTop: '0.3rem' }}>{item.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#d1d5db' }}>SKU: {item.sku} | {item.category}</div>
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#f59e0b', marginLeft: '1rem', textShadow: '0 0 16px rgba(245, 158, 11, 0.5)' }}>{item.stock}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Row 4: Horizontal TV Section 2: Maintenance Expiration Timers */}
      <div className="liquid-glass-card" style={{
        padding: '1.35rem 1.5rem',
        marginBottom: '1.35rem',
        ['--glow-color' as any]: 'rgba(201, 138, 75, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.65rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ffffff' }}>
            <Wrench size={22} style={{ color: 'var(--coficab-copper)' }} />
            TEMPORIZADORES DE MANTENIMIENTO PREVENTIVO
          </h2>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Equipos más próximos a servicio</span>
        </div>

        {upcomingMaintenances.length === 0 ? (
          <div style={{ padding: '1rem 1.5rem', background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.015) 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.85rem', color: '#94a3b8' }}>
            <CheckCircle2 size={22} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '0.92rem' }}>No hay mantenimientos preventivos pendientes o por vencer en este momento.</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.85rem' }}>
            {upcomingMaintenances.map((m) => {
              const isOverdue = m.daysLeft <= 0;
              return (
                <div key={m.id} className="liquid-glass-interactive-item" style={{
                  background: isOverdue ? 'linear-gradient(145deg, rgba(239, 68, 68, 0.18) 0%, rgba(185, 28, 28, 0.1) 100%)' : 'linear-gradient(145deg, rgba(245, 158, 11, 0.16) 0%, rgba(180, 83, 9, 0.08) 100%)',
                  border: isOverdue ? '1.5px solid #ef4444' : '1px solid rgba(245, 158, 11, 0.45)',
                  padding: '0.85rem 1.15rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>{m.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#d1d5db' }}>
                      SKU: {m.sku} | Área: {m.area || 'Planta'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
                    {isOverdue ? (
                      <span className="badge badge-outbound" style={{ background: '#ef4444', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800 }}>
                        VENCIDO ({Math.abs(m.daysLeft)} d)
                      </span>
                    ) : (
                      <span className="badge badge-warning" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                        <Calendar size={12} /> {m.daysLeft} días
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Row 5: Horizontal TV Section 3: Live Movements Feed */}
      <div className="liquid-glass-card" style={{
        padding: '1.35rem 1.5rem',
        ['--glow-color' as any]: 'rgba(96, 165, 250, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.65rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ffffff' }}>
            <Clock size={22} style={{ color: '#60a5fa' }} />
            ÚLTIMOS MOVIMIENTOS EN VIVO
          </h2>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Feed en tiempo real</span>
        </div>

        {recentTransactions.length === 0 ? (
          <div style={{ padding: '1rem 1.5rem', background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.015) 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.85rem', color: '#94a3b8' }}>
            <Clock size={20} />
            <span style={{ fontSize: '0.92rem' }}>No hay movimientos recientes registrados en esta sesión.</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="liquid-glass-interactive-item" style={{
                padding: '0.85rem 1.15rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: tx.type === 'INBOUND' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                    border: tx.type === 'INBOUND' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(244, 63, 94, 0.35)',
                    color: tx.type === 'INBOUND' ? '#10b981' : '#f43f5e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {tx.type === 'INBOUND' ? <ArrowUpRight size={22} /> : <ArrowDownLeft size={22} />}
                  </div>

                  <div>
                    <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#ffffff' }}>
                      {tx.type === 'INBOUND' ? 'Entrada' : 'Salida'} de Stock
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Por: {tx.user?.name || tx.user?.username || 'Usuario'}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '1.3rem',
                    fontWeight: 900,
                    color: tx.type === 'INBOUND' ? '#10b981' : '#f43f5e',
                    textShadow: tx.type === 'INBOUND' ? '0 0 12px rgba(16, 185, 129, 0.4)' : '0 0 12px rgba(244, 63, 94, 0.4)'
                  }}>
                    {tx.type === 'INBOUND' ? `+${tx.quantity}` : `-${tx.quantity}`}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {new Date(tx.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
