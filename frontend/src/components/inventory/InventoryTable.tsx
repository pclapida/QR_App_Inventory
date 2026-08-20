import React from 'react';
import {
  Search, QrCode, Trash2, Edit, MapPin, Undo2, CheckSquare, FileText, RotateCcw, AlertTriangle, Truck, Package
} from 'lucide-react';
import { Item } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { InventoryTabType } from '../../pages/Inventory';

export interface InventoryTableProps {
  items: Item[];
  activeTab: InventoryTabType;
  permissions: {
    isAdmin: boolean;
    isSuper: boolean;
    isOperator: boolean;
  };
  selection: {
    selectedItemIds: Set<string>;
    setSelectedItemIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  };
  actions: {
    onViewItem: (item: Item) => void;
    onAssign: (item: Item) => void;
    onUnassign: (item: Item) => void;
    onReportFault: (item: Item) => void;
    onRepair: (item: Item) => void;
    onTransfer: (item: Item) => void;
    onReactivate: (item: Item) => void;
    onShowQR: (item: Item) => void;
    onEdit: (item: Item) => void;
    onDecommission: (item: Item) => void;
    onPermanentDelete: (item: Item) => void;
  };
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  activeTab,
  permissions: { isAdmin, isSuper, isOperator },
  selection: { selectedItemIds, setSelectedItemIds },
  actions
}) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPERADMIN';

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = new Set(selectedItemIds);
    items.forEach(i => {
      if (e.target.checked) updated.add(i.id);
      else updated.delete(i.id);
    });
    setSelectedItemIds(updated);
  };

  const isAllSelected = items.length > 0 && items.every(i => selectedItemIds.has(i.id));

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table" style={{ width: '100%', minWidth: '950px' }}>
        <thead>
          <tr>
            <th style={{ padding: '0.75rem 1rem', width: '40px' }}>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleAll}
              />
            </th>
            <th style={{ padding: '0.75rem 1rem' }}>Artículo / SKU</th>
            <th style={{ padding: '0.75rem 1rem' }}>Modelo & Serie</th>
            <th style={{ padding: '0.75rem 1rem' }}>
              {activeTab === 'ASSIGNED' ? 'Colaborador Asignado' : activeTab === 'TRANSFERS' ? 'Ubicación vs Origen' : activeTab === 'SCRAP' ? 'Motivo de Baja' : activeTab === 'DAMAGED' ? 'Falla / Daño Reportado' : 'Stock'}
            </th>
            <th style={{ padding: '0.75rem 1rem' }}>Planta / Área</th>
            <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(
            items.reduce((acc, item) => {
              const cat = item.category || 'General';
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(item);
              return acc;
            }, {} as Record<string, Item[]>)
          )
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, catItems]) => (
              <React.Fragment key={category}>
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(255,255,255,0.04)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {category}
                  </td>
                </tr>
                {catItems.map((item) => {
                  const isOwnPlantItem = isSuperAdmin || !item.originPlant || item.originPlant === user?.plant;
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: selectedItemIds.has(item.id) ? 'rgba(0, 43, 144, 0.08)' : undefined
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <input
                          type="checkbox"
                          checked={selectedItemIds.has(item.id)}
                          onChange={(e) => {
                            const updated = new Set(selectedItemIds);
                            if (e.target.checked) updated.add(item.id);
                            else updated.delete(item.id);
                            setSelectedItemIds(updated);
                          }}
                        />
                      </td>

                      {/* Name & SKU */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div
                          onClick={() => actions.onViewItem(item)}
                          style={{ fontWeight: 800, color: 'var(--text-main)', cursor: 'pointer' }}
                          className="hover-underline"
                        >
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--coficab-copper)', fontWeight: 700 }}>
                          {item.sku}
                        </div>
                      </td>

                      {/* Model & Serial */}
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                        <div>{item.model || 'S/M'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>S/N: {item.serialNumber || 'N/A'}</div>
                      </td>

                      {/* Dynamic Column by Tab */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {activeTab === 'AVAILABLE' && (
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                            <span style={{ color: item.stock === 0 ? '#ef4444' : item.stock <= item.minStock ? '#f59e0b' : '#10b981' }}>
                              {item.stock}
                            </span> / {item.minStock} min
                          </div>
                        )}
                        {activeTab === 'ASSIGNED' && (
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.assignedTo || 'N/A'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.assignedArea}</div>
                          </div>
                        )}
                        {activeTab === 'SCRAP' && (
                          <div>
                            <span className="badge badge-outbound" style={{ fontSize: '0.7rem' }}>Baja / Scrap</span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              {item.decommissionReason || 'Desincorporado'} {item.decommissionActNumber ? `(${item.decommissionActNumber})` : ''}
                            </div>
                          </div>
                        )}
                        {activeTab === 'TRANSFERS' && (
                          <div>
                            <div style={{ color: 'var(--text-main)', fontWeight: 700 }}>{item.plant}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Origen: <strong>{item.originPlant || 'Planta 2'}</strong>
                            </div>
                          </div>
                        )}
                        {activeTab === 'DAMAGED' && (
                          <div>
                            <span className="badge badge-warning" style={{ fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.18)', color: '#f59e0b', borderColor: '#f59e0b' }}>
                              ⚠️ {item.faults || 'Falla / Daño reportado'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Plant / Location */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-main)' }}>
                          <MapPin size={14} style={{ color: 'var(--primary)' }} />
                          <span>{item.plant}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {item.location || item.area || (item.isITInternal ? 'Taller IT' : 'Piso Operativo')}
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.35rem' }}>
                          
                          {/* Action: View Details */}
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => actions.onViewItem(item)}
                            title="Ver Detalles Completos"
                            style={{ padding: '0.35rem 0.55rem' }}
                          >
                            <Search size={14} />
                          </button>

                          {/* Action: Assign to Collaborator (AVAILABLE tab) */}
                          {activeTab === 'AVAILABLE' && isAdmin && isOwnPlantItem && (
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => actions.onAssign(item)}
                              title="Asignar Equipo (Genera Responsiva y Checklist)"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', background: 'var(--coficab-copper)', borderColor: 'var(--coficab-copper)' }}
                            >
                              <FileText size={14} /> Asignar
                            </button>
                          )}

                          {/* Action: Unassign / Return to IT (ASSIGNED tab) */}
                          {activeTab === 'ASSIGNED' && isAdmin && isOwnPlantItem && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => actions.onUnassign(item)}
                              title="Retirar equipo y devolver al taller de IT"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: 'var(--coficab-copper)' }}
                            >
                              <Undo2 size={14} /> Devolver
                            </button>
                          )}

                          {/* Action: Report Fault (AVAILABLE & ASSIGNED tabs) */}
                          {(activeTab === 'AVAILABLE' || activeTab === 'ASSIGNED') && (isAdmin || isOperator) && isOwnPlantItem && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => actions.onReportFault(item)}
                              title="Reportar Daño o Falla Técnica"
                              style={{ padding: '0.35rem 0.55rem', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                            >
                              <AlertTriangle size={14} />
                            </button>
                          )}

                          {/* Action: Repair / Return to Disponible (DAMAGED tab) */}
                          {activeTab === 'DAMAGED' && isAdmin && isOwnPlantItem && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => actions.onRepair(item)}
                              title="Marcar como reparado y regresar al Inventario Disponible"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)', fontWeight: 700 }}
                            >
                              <CheckSquare size={14} /> Reparado
                            </button>
                          )}

                          {/* Action: Plant Transfer */}
                          {activeTab !== 'SCRAP' && isAdmin && isOwnPlantItem && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => actions.onTransfer(item)}
                              title="Trasladar a otra planta"
                              style={{ padding: '0.35rem 0.55rem' }}
                            >
                              <Truck size={14} />
                            </button>
                          )}

                          {/* Action: Reactivate (SCRAP tab only) */}
                          {activeTab === 'SCRAP' && isAdmin && isOwnPlantItem && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => actions.onReactivate(item)}
                              title="Reactivar activo al Inventario Disponible"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                            >
                              <RotateCcw size={14} /> Reactivar
                            </button>
                          )}

                          {/* Action: QR Modal */}
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => actions.onShowQR(item)}
                            title="Ver Código QR"
                            style={{ padding: '0.35rem 0.55rem' }}
                          >
                            <QrCode size={14} />
                          </button>

                          {/* Action: Edit */}
                          {isAdmin && activeTab !== 'SCRAP' && isOwnPlantItem && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => actions.onEdit(item)}
                              title="Editar Artículo"
                              style={{ padding: '0.35rem 0.55rem' }}
                            >
                              <Edit size={14} />
                            </button>
                          )}

                          {/* Action: Decommission / Scrap */}
                          {isAdmin && activeTab !== 'SCRAP' && isOwnPlantItem && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => actions.onDecommission(item)}
                              title="Dar de Baja / Enviar a Scrap"
                              style={{ padding: '0.35rem 0.55rem', color: '#f43f5e' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}

                          {/* Action: Permanent Delete ONLY in SCRAP tab */}
                          {isSuper && activeTab === 'SCRAP' && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => actions.onPermanentDelete(item)}
                              title="Eliminar Definitivamente de la Base de Datos"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderColor: '#ef4444' }}
                            >
                              <Trash2 size={14} /> Purgar BD
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
        </tbody>
      </table>
      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <Package size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <p>No se encontraron equipos.</p>
        </div>
      )}
    </div>
  );
};
