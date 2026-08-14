import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Printer,
  Calendar,
  User,
  Search,
  RefreshCw,
  Cpu,
  Mail,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  Send,
  Building
} from 'lucide-react';
import { responsivasApi, ResponsivaHistory } from '../services/api';
import { openPrintWindow } from '../components/ResponsivaModal';

export const ResponsivasHistory: React.FC = () => {
  const [history, setHistory] = useState<ResponsivaHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SENT' | 'PENDING'>('ALL');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await responsivasApi.getAll();
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching responsiva history', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleReprint = async (record: ResponsivaHistory) => {
    if (!record.item) {
      alert("No se puede reimprimir porque el equipo original ya no existe en la base de datos.");
      return;
    }
    const data = {
      colaborador: record.colaborador,
      marcaModelo: record.marcaModelo,
      serie: record.serie,
      nombreEquipo: record.nombreEquipo,
      accesorios: JSON.parse(record.accesoriosJson || '{}'),
      estado: record.observaciones || '',
      photoUrls: JSON.parse(record.photoUrlsJson || '[]')
    };
    await openPrintWindow(record.item, data);
  };

  const filteredHistory = useMemo(() => {
    return history.filter((r) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q ||
        r.colaborador.toLowerCase().includes(q) ||
        r.nombreEquipo.toLowerCase().includes(q) ||
        r.serie.toLowerCase().includes(q) ||
        r.marcaModelo.toLowerCase().includes(q) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.observaciones && r.observaciones.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'SENT' && r.emailSent) ||
        (statusFilter === 'PENDING' && !r.emailSent);

      return matchesSearch && matchesStatus;
    });
  }, [history, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = history.length;
    const sent = history.filter((r) => r.emailSent).length;
    const pending = total - sent;
    return { total, sent, pending };
  }, [history]);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
            <FileText size={28} color="var(--primary)" />
            Historial de Responsivas Digitales
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            Registro y custodia de cartas de entrega firmadas por colaboradores en todas las plantas.
          </p>
        </div>
        <button onClick={fetchHistory} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="liquid-glass-card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL RESPONSIVAS</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#60a5fa', marginTop: '0.2rem' }}>{stats.total}</div>
        </div>

        <div className="liquid-glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '2px solid #10b981' }}>
          <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>CORREOS ENVIADOS</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#10b981', marginTop: '0.2rem' }}>{stats.sent}</div>
        </div>

        <div className="liquid-glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '2px solid #f59e0b' }}>
          <div style={{ fontSize: '0.75rem', color: '#fde047', fontWeight: 700, textTransform: 'uppercase' }}>CORREOS PENDIENTES</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#f59e0b', marginTop: '0.2rem' }}>{stats.pending}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: 'var(--bg-card)', padding: '1.1rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px', maxWidth: '460px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por colaborador, equipo, serie, modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className={`btn ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('ALL')}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
          >
            Todas ({stats.total})
          </button>
          <button
            className={`btn ${statusFilter === 'SENT' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('SENT')}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
          >
            ✉️ Enviadas ({stats.sent})
          </button>
          <button
            className={`btn ${statusFilter === 'PENDING' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('PENDING')}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
          >
            ⏳ Pendientes ({stats.pending})
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando historial de responsivas...</div>
      ) : filteredHistory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
          <FileText size={48} color="var(--border-color)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>No hay responsivas</h3>
          <p style={{ color: 'var(--text-muted)' }}>No se encontraron registros que coincidan con los criterios de búsqueda.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Fecha</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Colaborador</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Correo</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Equipo & Modelo</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Serie</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Notificación</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((record) => (
                <tr key={record.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      <Calendar size={13} />
                      {new Date(record.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      <User size={14} color="var(--primary)" />
                      {record.colaborador}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {record.email ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: '#94a3b8' }}>
                        <Mail size={13} />
                        {record.email}
                      </div>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '0.78rem', fontStyle: 'italic' }}>Sin correo</span>
                    )}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      <Cpu size={14} color="var(--primary)" />
                      {record.nombreEquipo}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{record.marcaModelo}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--coficab-blue-bright)', fontWeight: 600 }}>
                    {record.serie || '—'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {record.emailSent ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '0.2rem 0.6rem', borderRadius: '999px', border: '1px solid rgba(16,185,129,0.3)' }}>
                        <CheckCircle2 size={12} /> Enviado
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.6rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Clock size={12} /> Pendiente
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleReprint(record)}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: 'var(--coficab-copper)', color: 'var(--coficab-copper)', fontWeight: 700 }}
                    >
                      <Printer size={14} />
                      Reimprimir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
