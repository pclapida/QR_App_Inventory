import React, { useState, useEffect } from 'react';
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
  Layers
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
          area: m.item?.area || 'Planta',
          category: m.deviceType || m.item?.category || '',
          nextDueDate: m.nextDueDate,
          daysLeft
        };
      });

      maintList.sort((a, b) => a.daysLeft - b.daysLeft);
      setUpcomingMaintenances(maintList.slice(0, 6));

      setLastUpdated(new Date());

      const outOfStockItems = fetchedItems.filter((i) => i.stock === 0);
      if (soundEnabled && outOfStockItems.length > 0) {
        playBeepSound();
      }
    } catch (err) {
      console.error('Error al actualizar TV Dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const playBeepSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // AudioContext fallback
    }
  };

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [soundEnabled, dashboardMode]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  // Correct Metrics calculation:
  // Out of stock = stock is 0
  // Low stock = stock > 0 AND minStock > 0 AND stock <= minStock
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
      minHeight: 'calc(100vh - 120px)',
      background: '#060913',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      color: '#ffffff',
      border: '1px solid var(--border-highlight)',
      boxShadow: '0 0 50px rgba(0,0,0,0.8)'
    }}>
      {/* TV Header Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        borderBottom: '2px solid rgba(255,255,255,0.1)',
        paddingBottom: '1.25rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <CoficabLogo height={52} showTagline={true} themeMode="dark" />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #ffffff 0%, #93c5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                MONITOR DE CONTROL EN VIVO
              </h1>
              <span style={{
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }}></span>
                TV KIOSK MODE
              </span>
            </div>

            <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '0.1rem' }}>
              Actualización automática continua en pantalla gigante | Sincronización: {lastUpdated.toLocaleTimeString('es-ES')}
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '0.5rem',
          background: 'rgba(0, 0, 0, 0.4)',
          padding: '0.4rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <button
            className={`btn ${dashboardMode === 'IT' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setDashboardMode('IT')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              fontWeight: 800,
              background: dashboardMode === 'IT' ? 'linear-gradient(135deg, #c98a4b 0%, #b07238 100%)' : undefined,
              borderColor: dashboardMode === 'IT' ? 'var(--coficab-copper)' : 'transparent',
              color: dashboardMode === 'IT' ? '#ffffff' : '#9ca3af'
            }}
          >
            Inventario IT
          </button>
          <button
            className={`btn ${dashboardMode === 'PLANT' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setDashboardMode('PLANT')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              fontWeight: 800,
              borderColor: dashboardMode === 'PLANT' ? 'var(--primary)' : 'transparent',
              color: dashboardMode === 'PLANT' ? '#ffffff' : '#9ca3af'
            }}
          >
            Inventario Plantas
          </button>
        </div>

        {/* Clock & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255,255,255,0.15)',
            padding: '0.5rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'monospace', color: '#60a5fa', letterSpacing: '0.05em' }}>
              {currentTime}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Hora Local Servidor
            </div>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Sonido Activado' : 'Sonido Desactivado'}
            style={{ padding: '0.75rem' }}
          >
            {soundEnabled ? <Volume2 size={22} style={{ color: '#10b981' }} /> : <VolumeX size={22} style={{ color: '#6b7280' }} />}
          </button>

          <button
            className="btn btn-primary"
            onClick={toggleFullscreen}
            style={{ padding: '0.75rem 1.25rem', fontSize: '0.95rem' }}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            {isFullscreen ? 'Salir Pantalla Completa' : 'Modo TV Pantalla Completa'}
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>

        {/* Total Stock Units Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#9ca3af' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL REGISTROS</span>
            <Package size={24} style={{ color: '#6366f1' }} />
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: '#60a5fa', lineHeight: 1.1, marginTop: '0.4rem' }}>
            {totalStockUnits} <small style={{ fontSize: '0.9rem', fontWeight: 500, color: '#9ca3af' }}>equipos</small>
          </div>
        </div>

        {/* Healthy Stock */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.14)',
          border: '1px solid #10b981',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#34d399' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>STOCK EN SERVICIO</span>
            <CheckCircle2 size={24} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: '#10b981', lineHeight: 1.1, marginTop: '0.4rem' }}>
            {healthyItemsCount} <small style={{ fontSize: '0.9rem', fontWeight: 500, color: '#34d399' }}>unidades</small>
          </div>
        </div>

        {/* Low Stock Warning Card */}
        <div style={{
          background: lowStockItems.length > 0 ? 'rgba(245, 158, 11, 0.18)' : 'rgba(15, 23, 42, 0.6)',
          border: lowStockItems.length > 0 ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: lowStockItems.length > 0 ? '#fde047' : '#9ca3af' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>REABASTECIMIENTO</span>
            <AlertTriangle size={24} style={{ color: lowStockItems.length > 0 ? '#f59e0b' : '#6b7280' }} />
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: lowStockItems.length > 0 ? '#f59e0b' : '#ffffff', lineHeight: 1.1, marginTop: '0.4rem' }}>
            {lowStockItems.length} <small style={{ fontSize: '0.9rem', fontWeight: 500, color: '#9ca3af' }}>alertas</small>
          </div>
        </div>

        {/* Out of Stock Card */}
        <div style={{
          background: outOfStockItems.length > 0 ? 'rgba(239, 68, 68, 0.18)' : 'rgba(15, 23, 42, 0.6)',
          border: outOfStockItems.length > 0 ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: outOfStockItems.length > 0 ? '#fca5a5' : '#9ca3af' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AGOTADOS (STOCK 0)</span>
            <Flame size={24} style={{ color: outOfStockItems.length > 0 ? '#ef4444' : '#6b7280' }} />
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: outOfStockItems.length > 0 ? '#ef4444' : '#ffffff', lineHeight: 1.1, marginTop: '0.4rem' }}>
            {outOfStockItems.length}
          </div>
        </div>

      </div>

      {/* Equipment Category Breakdown Bar */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--coficab-copper)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={18} /> DESGLOSE DETALLADO DE EQUIPAMIENTO COFICAB POR TIPO:
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Laptop size={14} /> Laptops</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>{countLaptops}</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MonitorIcon size={14} /> Monitores</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>{countMonitors}</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Cpu size={14} /> PCs / MiniPCs</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>{countPCs}</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Tablet size={14} /> Tablets</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>{countTablets}</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Printer size={14} /> Lectores / Zebras</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>{countZebras}</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Printer size={14} /> Impresoras</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>{countPrinters}</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Headphones size={14} /> Matriz Asignados</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>{countAssignedMatrix}</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Wifi size={14} /> AP & IDF (Redes)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>{countNetwork}</div>
          </div>
        </div>
      </div>

      {/* Main TV Split View: 3 Panels (Urgent Stock, Live Movements, Maintenance Timers) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>

        {/* Panel 1: Urgent Stock Alerts */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.6rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
              <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
              ALERTAS DE REABASTECIMIENTO
            </h2>
          </div>

          {outOfStockItems.length === 0 && lowStockItems.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#10b981' }}>
              <CheckCircle2 size={40} style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>¡Stock de Todos los Equipos en Nivel Óptimo!</div>
              <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '0.2rem' }}>Todos los 799 equipos están en servicio activo.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
              {outOfStockItems.map((item) => (
                <div key={item.id} style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '2px solid #ef4444',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span className="badge badge-outbound" style={{ background: '#ef4444', color: '#ffffff', fontSize: '0.68rem' }}>AGOTADO</span>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#d1d5db' }}>SKU: {item.sku} | Área: {item.location || 'Planta'}</div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ef4444' }}>0</div>
                </div>
              ))}

              {lowStockItems.map((item) => (
                <div key={item.id} style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid #f59e0b',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>STOCK BAJO</span>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#d1d5db' }}>SKU: {item.sku}</div>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f59e0b' }}>{item.stock}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel 2: Maintenance Expiration Timers */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.6rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
              <Wrench size={20} style={{ color: 'var(--coficab-copper)' }} />
              TEMPORIZADORES DE MANTENIMIENTO
            </h2>
            <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Más Próximos a Vencer</span>
          </div>

          {upcomingMaintenances.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#9ca3af' }}>
              <p style={{ fontSize: '0.9rem' }}>No hay temporizadores de mantenimiento registrados.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
              {upcomingMaintenances.map((m) => {
                const isOverdue = m.daysLeft <= 0;
                return (
                  <div key={m.id} style={{
                    background: isOverdue ? 'rgba(239, 68, 68, 0.16)' : 'rgba(245, 158, 11, 0.14)',
                    border: isOverdue ? '1.5 solid #ef4444' : '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>{m.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#d1d5db' }}>
                        SKU: {m.sku} | Área: {m.area}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {isOverdue ? (
                        <span className="badge badge-outbound" style={{ background: '#ef4444', color: '#ffffff', fontSize: '0.75rem' }}>
                          VENCIDO (Hace {Math.abs(m.daysLeft)} d)
                        </span>
                      ) : (
                        <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                          <Calendar size={12} /> Vence en {m.daysLeft} días
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel 3: Live Movements Feed */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.6rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
              <Clock size={20} style={{ color: '#60a5fa' }} />
              ÚLTIMOS MOVIMIENTOS
            </h2>
            <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Feed en Vivo</span>
          </div>

          {recentTransactions.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#9ca3af' }}>
              <p style={{ fontSize: '0.9rem' }}>No hay movimientos recientes.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
              {recentTransactions.map((tx) => (
                <div key={tx.id} style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: tx.type === 'INBOUND' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                      color: tx.type === 'INBOUND' ? '#10b981' : '#f43f5e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {tx.type === 'INBOUND' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                        {tx.type === 'INBOUND' ? 'Entrada' : 'Salida'} de Stock
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                        Por: {tx.user?.name || tx.user?.username || 'Usuario'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '1.15rem',
                      fontWeight: 900,
                      color: tx.type === 'INBOUND' ? '#10b981' : '#f43f5e'
                    }}>
                      {tx.type === 'INBOUND' ? `+${tx.quantity}` : `-${tx.quantity}`}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                      {new Date(tx.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
