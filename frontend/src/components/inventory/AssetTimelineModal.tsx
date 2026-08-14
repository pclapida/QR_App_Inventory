import React, { useState, useEffect } from 'react';
import api, { Item, TimelineEvent } from '../../services/api';
import {
  Clock,
  Package,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Truck,
  Edit,
  Wrench,
  FileText,
  Trash2,
  CheckCircle2,
  Calendar,
  User,
  X,
  MapPin,
  Tag,
  Hash,
  AlertCircle
} from 'lucide-react';

interface AssetTimelineModalProps {
  item: Item;
  onClose: () => void;
}

export const AssetTimelineModal: React.FC<AssetTimelineModalProps> = ({ item, onClose }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/items/${item.id}/timeline`);
        setEvents(res.data.events || []);
      } catch (err: any) {
        console.error('Error al cargar línea de tiempo:', err);
        setError('Error al consultar el historial de vida del activo.');
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [item.id]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'CREATION':
        return <PlusCircle size={18} style={{ color: '#3b82f6' }} />;
      case 'INBOUND':
        return <ArrowUpRight size={18} style={{ color: '#10b981' }} />;
      case 'OUTBOUND':
        return <ArrowDownLeft size={18} style={{ color: '#f43f5e' }} />;
      case 'TRANSFER':
        return <Truck size={18} style={{ color: '#a855f7' }} />;
      case 'EDIT':
        return <Edit size={18} style={{ color: '#60a5fa' }} />;
      case 'RESPONSIVA':
        return <FileText size={18} style={{ color: 'var(--coficab-copper)' }} />;
      case 'MAINTENANCE':
        return <Wrench size={18} style={{ color: '#eab308' }} />;
      case 'DECOMMISSION':
        return <Trash2 size={18} style={{ color: '#ef4444' }} />;
      case 'REACTIVATE':
        return <CheckCircle2 size={18} style={{ color: '#10b981' }} />;
      default:
        return <Clock size={18} style={{ color: '#94a3b8' }} />;
    }
  };

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case 'CREATION':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' };
      case 'INBOUND':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'OUTBOUND':
        return { bg: 'rgba(244, 63, 94, 0.15)', text: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.3)' };
      case 'TRANSFER':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' };
      case 'EDIT':
        return { bg: 'rgba(96, 165, 250, 0.12)', text: '#93c5fd', border: '1px solid rgba(96, 165, 250, 0.25)' };
      case 'RESPONSIVA':
        return { bg: 'rgba(201, 138, 75, 0.18)', text: 'var(--coficab-copper)', border: '1px solid rgba(201, 138, 75, 0.4)' };
      case 'MAINTENANCE':
        return { bg: 'rgba(234, 179, 8, 0.15)', text: '#fde047', border: '1px solid rgba(234, 179, 8, 0.3)' };
      case 'DECOMMISSION':
        return { bg: 'rgba(239, 68, 68, 0.18)', text: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' };
      case 'REACTIVATE':
        return { bg: 'rgba(16, 185, 129, 0.18)', text: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.08)', text: '#cbd5e1', border: '1px solid rgba(255, 255, 255, 0.15)' };
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '780px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(96, 165, 250, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--coficab-blue-bright)'
            }}>
              <Clock size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main)' }}>
                Línea del Tiempo del Ciclo de Vida
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Historial cronológico completo de compras, asignaciones, servicios y movimientos
              </p>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Asset Brief Banner */}
        <div style={{
          padding: '0.9rem 1.2rem',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.015) 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#ffffff' }}>{item.name}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              SKU: <strong style={{ color: 'var(--coficab-blue-bright)', fontFamily: 'monospace' }}>{item.sku}</strong>
              {item.serialNumber && ` | Serie: ${item.serialNumber}`}
              {item.model && ` | Mod: ${item.model}`}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className={`badge ${item.status === 'DECOMMISSIONED' ? 'badge-outbound' : 'badge-inbound'}`} style={{ fontWeight: 800 }}>
              {item.status === 'DECOMMISSIONED' ? 'DADO DE BAJA' : `STOCK: ${item.stock}`}
            </span>
            <span className="badge" style={{ background: 'rgba(37, 99, 235, 0.15)', color: '#60a5fa' }}>
              {item.plant || 'Planta 2'}
            </span>
          </div>
        </div>

        {/* Timeline Content */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Cargando historial de eventos del activo...
            </div>
          ) : error ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#f87171' }}>{error}</div>
          ) : events.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No hay eventos registrados para este equipo.
            </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: '2.5rem', marginLeft: '0.5rem' }}>
              {/* Vertical connector line */}
              <div style={{
                position: 'absolute',
                left: '17px',
                top: '12px',
                bottom: '12px',
                width: '2px',
                background: 'linear-gradient(to bottom, #3b82f6, rgba(201, 138, 75, 0.6), rgba(255, 255, 255, 0.1))'
              }}></div>

              {events.map((evt, idx) => {
                const styleObj = getEventBadgeColor(evt.type);
                const eventDate = new Date(evt.date);
                const formattedDate = eventDate.toLocaleDateString('es-MX', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={evt.id || idx} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    {/* Node Dot / Icon */}
                    <div style={{
                      position: 'absolute',
                      left: '-2.5rem',
                      top: '0',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--bg-card)',
                      border: '2px solid var(--border-color)',
                      boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2
                    }}>
                      {getEventIcon(evt.type)}
                    </div>

                    {/* Event Card */}
                    <div style={{
                      background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.015) 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.9rem 1.15rem',
                      backdropFilter: 'blur(10px)',
                      transition: 'transform 0.2s ease, border-color 0.2s ease'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background: styleObj.bg,
                            color: styleObj.text,
                            border: styleObj.border
                          }}>
                            {evt.type}
                          </span>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
                            {evt.title}
                          </span>
                        </div>

                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Calendar size={12} /> {formattedDate}
                        </span>
                      </div>

                      <p style={{ margin: '0.35rem 0 0.5rem 0', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                        {evt.description}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <User size={12} /> Registrado por: <strong style={{ color: '#e2e8f0' }}>{evt.performedBy}</strong>
                        </span>

                        {evt.meta?.fromPlant && evt.meta?.toPlant && (
                          <span style={{ color: '#a855f7', fontWeight: 600 }}>
                            {evt.meta.fromPlant} ➔ {evt.meta.toPlant}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
