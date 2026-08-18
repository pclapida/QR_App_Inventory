import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  Clock,
  Package,
  ShieldAlert,
  Wrench,
  CheckCircle2,
  X,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import api, { itemsApi, loansApi, DeviceLoan, Item } from '../services/api';

export interface SystemNotification {
  id: string;
  type: 'LOAN_OVERDUE' | 'LOW_STOCK' | 'WARRANTY_EXPIRING' | 'MAINTENANCE_DUE';
  title: string;
  description: string;
  link: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: string;
  data?: any;
}

export const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const alertsList: SystemNotification[] = [];
      const now = new Date();

      // 1. Fetch Overdue Loans
      try {
        const loans = await loansApi.getAll();
        loans.forEach((loan: DeviceLoan) => {
          const isOverdue = loan.status === 'OVERDUE' || (loan.status === 'ACTIVE' && new Date(loan.expectedReturn) < now);
          if (isOverdue && loan.status !== 'RETURNED') {
            alertsList.push({
              id: `loan-${loan.id}`,
              type: 'LOAN_OVERDUE',
              title: `Préstamo Vencido: ${loan.item?.name || 'Equipo'}`,
              description: `Solicitado por ${loan.borrowerName} (${loan.borrowerArea || 'Planta'}). Debió entregarse el ${new Date(loan.expectedReturn).toLocaleDateString()}.`,
              link: '/loans',
              severity: 'high',
              timestamp: loan.expectedReturn
            });
          }
        });
      } catch (e) {
        console.error('Error loading loan alerts:', e);
      }

      // 2. Fetch Low Stock & Warranty Alerts from Items
      try {
        const items = await itemsApi.getAll();
        items.forEach((item: Item) => {
          // Low stock alert for consumable / spare parts
          if (item.minStock > 0 && item.stock <= item.minStock && item.status !== 'DECOMMISSIONED') {
            alertsList.push({
              id: `stock-${item.id}`,
              type: 'LOW_STOCK',
              title: `Stock Crítico: ${item.name}`,
              description: `Quedan ${item.stock} ${item.unit} (Mínimo: ${item.minStock}). Requiere reposición.`,
              link: item.isITInternal ? '/inventory-it' : '/inventory',
              severity: item.stock === 0 ? 'high' : 'medium',
              timestamp: item.updatedAt || now.toISOString()
            });
          }

          // Warranty expiring in next 30 days
          if (item.hasWarranty && item.warrantyExpiration && item.status !== 'DECOMMISSIONED') {
            const expDate = new Date(item.warrantyExpiration);
            const daysRemaining = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysRemaining > 0 && daysRemaining <= 30) {
              alertsList.push({
                id: `warranty-${item.id}`,
                type: 'WARRANTY_EXPIRING',
                title: `Garantía por Vencer: ${item.sku}`,
                description: `${item.name} vence en ${daysRemaining} días (${expDate.toLocaleDateString()}).`,
                link: '/inventory',
                severity: daysRemaining <= 7 ? 'high' : 'medium',
                timestamp: item.warrantyExpiration
              });
            }
          }
        });
      } catch (e) {
        console.error('Error loading inventory alerts:', e);
      }

      // Sort by severity (high first) then timestamp
      alertsList.sort((a, b) => {
        if (a.severity === 'high' && b.severity !== 'high') return -1;
        if (b.severity === 'high' && a.severity !== 'high') return 1;
        return 0;
      });

      setNotifications(alertsList);
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Auto-refresh alerts every 60 seconds
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const highSeverityCount = notifications.filter(n => n.severity === 'high').length;

  const handleNotificationClick = (link: string) => {
    setIsOpen(false);
    navigate(link);
  };

  const getIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'LOAN_OVERDUE':
        return <Clock size={16} style={{ color: '#ef4444' }} />;
      case 'LOW_STOCK':
        return <Package size={16} style={{ color: '#f59e0b' }} />;
      case 'WARRANTY_EXPIRING':
        return <ShieldAlert size={16} style={{ color: '#3b82f6' }} />;
      case 'MAINTENANCE_DUE':
        return <Wrench size={16} style={{ color: '#8b5cf6' }} />;
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setIsOpen(!isOpen)}
        title="Centro de Alertas y Notificaciones"
        style={{
          position: 'relative',
          padding: '0.45rem 0.65rem',
          borderRadius: 'var(--radius-md)',
          borderColor: notifications.length > 0 ? 'rgba(239, 68, 68, 0.4)' : undefined,
          background: isOpen ? 'var(--bg-card-hover)' : undefined
        }}
        aria-label="Notificaciones"
      >
        <Bell size={18} style={{ color: notifications.length > 0 ? (highSeverityCount > 0 ? '#ef4444' : 'var(--coficab-copper)') : 'var(--text-muted)' }} />

        {/* Counter Badge */}
        {notifications.length > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            minWidth: '18px',
            height: '18px',
            padding: '0 4px',
            borderRadius: '10px',
            background: highSeverityCount > 0 ? '#ef4444' : 'var(--coficab-copper)',
            color: '#ffffff',
            fontSize: '0.68rem',
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            border: '2px solid var(--bg-nav)'
          }}>
            {notifications.length > 99 ? '99+' : notifications.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '380px',
          maxWidth: '92vw',
          maxHeight: '520px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px var(--border-color)',
          border: '1px solid var(--border-highlight)',
          backdropFilter: 'blur(16px)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease'
        }}>
          {/* Header */}
          <div style={{
            padding: '0.85rem 1rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-input)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={17} style={{ color: 'var(--coficab-copper)' }} />
              <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>Centro de Alertas</strong>
              {notifications.length > 0 && (
                <span className="badge" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', background: highSeverityCount > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(201, 138, 75, 0.2)', color: highSeverityCount > 0 ? '#ef4444' : 'var(--coficab-copper)' }}>
                  {notifications.length} pendiente{notifications.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={fetchAlerts}
                disabled={loading}
                title="Actualizar alertas"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}
              >
                <RefreshCw size={14} className={loading ? 'spinning' : ''} style={loading ? { animation: 'spin 1s linear infinite' } : undefined} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* List of Notifications */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.4rem 0' }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Verificando estado del sistema...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                <CheckCircle2 size={36} style={{ color: '#10b981', margin: '0 auto 0.6rem auto' }} />
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.92rem' }}>¡Todo al día!</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>
                  No hay préstamos vencidos ni alertas críticas pendientes en el sistema.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif.link)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    transition: 'background 0.15s ease',
                    background: notif.severity === 'high' ? 'rgba(239, 68, 68, 0.05)' : undefined
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = notif.severity === 'high' ? 'rgba(239, 68, 68, 0.05)' : 'transparent')}
                >
                  <div style={{
                    marginTop: '2px',
                    padding: '6px',
                    borderRadius: '8px',
                    background: notif.severity === 'high' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    display: 'flex'
                  }}>
                    {getIcon(notif.type)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {notif.title}
                      </strong>
                      {notif.severity === 'high' && (
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
                          Urgente
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                      {notif.description}
                    </p>
                  </div>

                  <ChevronRight size={15} style={{ color: 'var(--text-dim)', alignSelf: 'center', flexShrink: 0 }} />
                </div>
              ))
            )}
          </div>

          {/* Footer with Quick Shortcuts */}
          <div style={{
            padding: '0.6rem 1rem',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-input)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <span>Actualizado: {lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/loans');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--coficab-copper)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              Ver Préstamos <ExternalLink size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
