import React, { useState, useEffect } from 'react';
import { FileText, Printer, Calendar, User, Search, RefreshCw, Cpu } from 'lucide-react';
import { responsivasApi, ResponsivaHistory } from '../services/api';
import { openPrintWindow } from '../components/ResponsivaModal';

export const ResponsivasHistory: React.FC = () => {
  const [history, setHistory] = useState<ResponsivaHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await responsivasApi.getAll();
      setHistory(data);
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

  const filteredHistory = history.filter(r => 
    r.colaborador.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.nombreEquipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.serie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText size={28} color="var(--primary)" />
            Historial de Responsivas
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Registro de todas las cartas generadas en el sistema.</p>
        </div>
        <button onClick={fetchHistory} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por colaborador, equipo o serie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando historial...</div>
      ) : filteredHistory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
          <FileText size={48} color="var(--border-color)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-color)', marginBottom: '0.5rem' }}>No hay responsivas</h3>
          <p style={{ color: 'var(--text-muted)' }}>No se encontraron registros de cartas responsivas generadas.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Fecha</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Colaborador</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Equipo</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Serie</th>
                <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right', color: 'var(--text-muted)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((record) => (
                <tr key={record.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                      <Calendar size={14} />
                      {new Date(record.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                      <User size={14} color="var(--primary)" />
                      {record.colaborador}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Cpu size={14} color="var(--primary)" />
                      {record.nombreEquipo}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{record.marcaModelo}</div>
                  </td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {record.serie}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button onClick={() => handleReprint(record)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
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
