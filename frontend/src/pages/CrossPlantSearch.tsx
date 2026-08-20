import React, { useState, useCallback } from 'react';
import { Search, Globe, Package, ArrowRightLeft, Building2, AlertCircle, Loader2, Info } from 'lucide-react';
import { globalSearchApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface GlobalItem {
  id: string;
  sku: string;
  name: string;
  model?: string;
  serialNumber?: string;
  plant: string;
  originPlant?: string;
  status: string;
  assignedTo?: string;
  assignedArea?: string;
  category?: string;
  ipAddress?: string;
  isITInternal?: boolean;
}

const PLANT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Planta 1':      { bg: '#1e3a5f', text: '#60a5fa', border: '#3b82f6' },
  'Planta 2':      { bg: '#1a3a2a', text: '#34d399', border: '#10b981' },
  'Planta 3':      { bg: '#3b1f5e', text: '#c084fc', border: '#a855f7' },
  'Planta UPCAST': { bg: '#4a2000', text: '#fb923c', border: '#f97316' },
};

const getPlantStyle = (plant: string) =>
  PLANT_COLORS[plant] ?? { bg: '#1f2937', text: '#9ca3af', border: '#6b7280' };

export const CrossPlantSearch: React.FC = () => {
  const { currentPlant } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || query.trim().length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await globalSearchApi.search(query.trim());
      setResults(res.data.items ?? []);
      setSearched(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al realizar la búsqueda');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Group results by plant
  const groupedByPlant = results.reduce<Record<string, GlobalItem[]>>((acc, item) => {
    const key = item.plant ?? 'Sin planta';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Globe size={28} style={{ color: 'var(--coficab-copper)' }} />
          Consulta de Inventario entre Plantas
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.3rem' }}>
          Busca equipos en todas las plantas por número de serie, SKU, modelo o nombre. Solo lectura.
          {currentPlant && (
            <span style={{ marginLeft: '0.5rem', color: 'var(--coficab-copper)', fontWeight: 700 }}>
              Tu planta: {currentPlant}
            </span>
          )}
        </p>
      </div>

      {/* Info banner */}
      <div style={{
        background: 'rgba(59,130,246,0.08)',
        border: '1px solid rgba(59,130,246,0.25)',
        borderRadius: '10px',
        padding: '0.85rem 1.2rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        <Info size={18} style={{ color: '#60a5fa', flexShrink: 0, marginTop: '2px' }} />
        <span style={{ fontSize: '0.87rem', color: '#93c5fd', lineHeight: 1.5 }}>
          Esta búsqueda abarca <strong style={{ color: '#fff' }}>las 4 plantas</strong> (Planta 1, 2, 3 y UPCAST) en tiempo real.
          Si un equipo aparece en otra planta, significa que está disponible o asignado allá.
          Contacta al administrador de esa planta si lo necesitas prestado o transferido.
        </span>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{
            position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', pointerEvents: 'none'
          }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar por número de serie, SKU, nombre, modelo o IP..."
            style={{
              width: '100%', padding: '0.85rem 1rem 0.85rem 2.8rem',
              background: 'var(--bg-card)', border: '1.5px solid var(--border-color)',
              borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.95rem',
              outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading || query.trim().length < 2}
          style={{
            padding: '0.85rem 1.75rem',
            background: 'var(--coficab-copper)',
            color: '#fff', border: 'none', borderRadius: '10px',
            fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            opacity: loading || query.trim().length < 2 ? 0.6 : 1
          }}
        >
          {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
          Buscar
        </button>
      </form>

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', marginBottom: '1rem' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* No results */}
      {searched && !loading && results.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '3rem',
          color: 'var(--text-muted)', background: 'var(--bg-card)',
          borderRadius: '12px', border: '1px solid var(--border-color)'
        }}>
          <Package size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>No se encontraron equipos</p>
          <p style={{ fontSize: '0.9rem' }}>Intenta con otro número de serie, SKU o nombre.</p>
        </div>
      )}

      {/* Results grouped by plant */}
      {Object.keys(groupedByPlant).length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Object.entries(groupedByPlant).map(([plant, items]) => {
            const style = getPlantStyle(plant);
            const isMyPlant = plant === currentPlant;
            return (
              <div key={plant} style={{
                background: 'var(--bg-card)',
                border: `1.5px solid ${isMyPlant ? style.border : 'var(--border-color)'}`,
                borderRadius: '14px', overflow: 'hidden'
              }}>
                {/* Plant header */}
                <div style={{
                  padding: '0.75rem 1.25rem',
                  background: style.bg,
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  borderBottom: `1px solid ${style.border}`
                }}>
                  <Building2 size={18} style={{ color: style.text }} />
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: style.text }}>
                    {plant}
                  </span>
                  <span style={{
                    marginLeft: 'auto', fontSize: '0.82rem', fontWeight: 700,
                    background: `${style.border}33`, color: style.text,
                    padding: '0.2rem 0.6rem', borderRadius: '20px'
                  }}>
                    {items.length} equipo{items.length !== 1 ? 's' : ''}
                  </span>
                  {isMyPlant && (
                    <span style={{
                      fontSize: '0.75rem', background: style.border, color: '#fff',
                      padding: '0.15rem 0.5rem', borderRadius: '20px', fontWeight: 700
                    }}>
                      Tu planta
                    </span>
                  )}
                </div>

                {/* Items table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)' }}>
                        {['SKU', 'Nombre / Modelo', 'S/N', 'Asignado a', 'Área', 'Planta Original'].map(h => (
                          <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => {
                        const isCustody = item.originPlant && item.originPlant !== item.plant;
                        return (
                          <tr key={item.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: style.text, whiteSpace: 'nowrap' }}>
                              {item.sku}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-main)' }}>
                              <div style={{ fontWeight: 600 }}>{item.name}</div>
                              {item.model && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.model}</div>}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                              {item.serialNumber ?? '—'}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-main)' }}>
                              {item.assignedTo ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  {item.assignedTo}
                                </span>
                              ) : (
                                <span style={{
                                  background: 'rgba(16,185,129,0.12)', color: '#34d399',
                                  padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem'
                                }}>Disponible</span>
                              )}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.83rem' }}>
                              {item.assignedArea ?? '—'}
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              {isCustody ? (
                                <span style={{
                                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                                  background: 'rgba(249,115,22,0.12)', color: '#fb923c',
                                  padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap'
                                }}>
                                  <ArrowRightLeft size={12} />
                                  {item.originPlant}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Propia</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CrossPlantSearch;
