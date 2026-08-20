import React, { useState, useEffect } from 'react';
import api, { adminApi, PLANTS, ROLE_LABELS, UserRole } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  UserPlus,
  Users,
  Package,
  Activity,
  Key,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  Laptop,
  Layers,
  Wrench,
  Search,
  Download,
  Database,
  Server,
  RefreshCw,
  HardDrive
} from 'lucide-react';

interface SystemUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole | 'ADMIN'; // support legacy 'ADMIN' role
  plant?: string | null;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    transactions: number;
  };
}

export const AdminDashboard: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search user filter
  const [userSearch, setUserSearch] = useState<string>('');

  // Modal State for New User
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'OPERATOR' as string,
    plant: 'Planta 2'
  });
  const [createLoading, setCreateLoading] = useState<boolean>(false);

  // Modal State for Edit User
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    email: '',
    role: 'OPERATOR' as string,
    plant: 'Planta 2',
    password: ''
  });
  const [editLoading, setEditLoading] = useState<boolean>(false);

  // DB Backup and Stats State
  const [dbStats, setDbStats] = useState<{
    users: number;
    items: number;
    transactions: number;
    maintenances: number;
    purchaseOrders: number;
    responsivas: number;
    deviceLoans: number;
    totalRecords: number;
  } | null>(null);
  const [backupLoading, setBackupLoading] = useState<boolean>(false);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/users');
      setUsers(res.data.users || []);
    } catch (err: any) {
      console.error('Error al cargar lista de usuarios:', err);
      setError(err.response?.data?.error || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const fetchDbStats = async () => {
    try {
      setStatsLoading(true);
      const stats = await adminApi.getStats();
      setDbStats(stats);
    } catch (err) {
      console.error('Error al obtener estadísticas de DB:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      setBackupLoading(true);
      const blob = await adminApi.downloadBackup();
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `COFICAB_QR_Inventory_Backup_${today}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccessMessage('Respaldo de base de datos generado y descargado exitosamente.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Error al descargar el respaldo:', err);
      setError('Error al generar la descarga del respaldo.');
    } finally {
      setBackupLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDbStats();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await api.post('/users', newUserForm);
      setSuccessMessage(`Usuario "${res.data.user.name}" creado exitosamente.`);
      setShowCreateModal(false);
      setNewUserForm({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'OPERATOR',
        plant: 'Planta 2'
      });
      fetchUsers();
    } catch (err: any) {
      console.error('Error al crear usuario:', err);
      alert(err.response?.data?.error || 'Error al registrar el nuevo usuario');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEditUser = (u: SystemUser) => {
    setEditingUser(u);
    setEditUserForm({
      name: u.name || '',
      email: u.email || '',
      role: u.role || 'OPERATOR',
      plant: u.plant || 'Planta 2',
      password: ''
    });
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload: any = {
        name: editUserForm.name,
        email: editUserForm.email,
        role: editUserForm.role,
        plant: editUserForm.plant
      };
      if (editUserForm.password.trim() !== '') {
        payload.password = editUserForm.password.trim();
      }

      await api.put(`/users/${editingUser.id}`, payload);
      setSuccessMessage(`Usuario "${editUserForm.name}" actualizado correctamente.`);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      console.error('Error al actualizar usuario:', err);
      alert(err.response?.data?.error || 'Error al actualizar usuario');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteUser = async (u: SystemUser) => {
    if (u.id === currentUser?.id) {
      alert('No puede eliminar su propia cuenta de administrador activa.');
      return;
    }

    if (!window.confirm(`¿Está seguro de eliminar al usuario "${u.name}" (@${u.username}) del sistema?`)) {
      return;
    }

    try {
      await api.delete(`/users/${u.id}`);
      setSuccessMessage(`Usuario "${u.name}" eliminado del sistema.`);
      fetchUsers();
    } catch (err: any) {
      console.error('Error al eliminar usuario:', err);
      alert(err.response?.data?.error || 'Error al eliminar usuario');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.plant ?? '').toLowerCase().includes(q)
    );
  });

  const totalAdmins = users.filter((u) => u.role === 'ADMIN' || u.role === 'ADMIN_PLANTA' || u.role === 'SUPERADMIN').length;
  const totalStandardUsers = users.filter((u) => u.role === 'USER' || u.role === 'OPERATOR' || u.role === 'AUDITOR').length;

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
        padding: '1.75rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(168, 85, 247, 0.3)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <Shield size={28} style={{ color: '#c084fc' }} />
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)' }}>
              Panel de Administración Principal & Control de Accesos IT
            </h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Gestión centralizada de cuentas de usuario, roles de seguridad, permisos del sistema y auditoría de transacciones.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', fontWeight: 800 }}
        >
          <UserPlus size={18} />
          Registrar Nuevo Usuario
        </button>
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <div style={{
          padding: '1rem 1.25rem',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          borderRadius: 'var(--radius-md)',
          color: '#10b981',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem'
        }}>
          <CheckCircle2 size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem 1.25rem',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #ef4444',
          borderRadius: 'var(--radius-md)',
          color: '#f87171',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Total Usuarios Registrados</span>
            <Users size={22} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '0.3rem' }}>
            {users.length}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Administradores de IT</span>
            <Shield size={22} style={{ color: '#c084fc' }} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#c084fc', marginTop: '0.3rem' }}>
            {totalAdmins}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Usuarios de Consulta (Operadores)</span>
            <Laptop size={22} style={{ color: '#60a5fa' }} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#60a5fa', marginTop: '0.3rem' }}>
            {totalStandardUsers}
          </div>
        </div>
      </div>

      {/* Database Backup & Health Section */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(192, 132, 252, 0.3)', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(88, 28, 135, 0.15) 100%)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ padding: '0.45rem', borderRadius: 'var(--radius-md)', background: 'rgba(192, 132, 252, 0.2)', color: '#c084fc', display: 'flex' }}>
                <Database size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Seguridad & Respaldo Integral de Base de Datos
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Motor: <strong style={{ color: '#60a5fa' }}>PostgreSQL (qr_inventory)</strong> • Respaldo estructurado JSON de 7 tablas
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={fetchDbStats}
              disabled={statsLoading}
              title="Actualizar conteo de registros"
              style={{ padding: '0.55rem 0.85rem' }}
            >
              <RefreshCw size={16} className={statsLoading ? 'spinning' : ''} style={statsLoading ? { animation: 'spin 1s linear infinite' } : undefined} />
            </button>

            <button
              className="btn btn-primary"
              onClick={handleDownloadBackup}
              disabled={backupLoading}
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                color: '#fff',
                fontWeight: 800,
                padding: '0.65rem 1.35rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(168, 85, 247, 0.35)'
              }}
            >
              <Download size={18} />
              {backupLoading ? 'Generando Respaldo...' : 'Descargar Respaldo 1-Clic (.json)'}
            </button>
          </div>
        </div>

        {/* Database table record metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Equipos / Activos</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{dbStats?.items ?? '...'}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Préstamos IT</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--coficab-copper)' }}>{dbStats?.deviceLoans ?? '...'}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Movimientos Stock</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#60a5fa' }}>{dbStats?.transactions ?? '...'}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Responsivas Firmadas</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>{dbStats?.responsivas ?? '...'}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Mantenimientos</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>{dbStats?.maintenances ?? '...'}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Registros</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#c084fc' }}>{dbStats?.totalRecords ?? '...'}</div>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Directorio de Cuentas y Accesos del Sistema
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Administre las cuentas del personal de IT y usuarios operativos con permisos de lectura.
            </p>
          </div>

          <div style={{ width: '100%', maxWidth: '320px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Buscar por nombre, usuario o rol..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            Cargando directorio de usuarios...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No se encontraron usuarios registrados que coincidan con la búsqueda.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>Nombre Completo</th>
                  <th style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>Usuario</th>
                  <th style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>Correo Electrónico</th>
                  <th style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>Rol / Planta</th>
                  <th style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>Actividad</th>
                  <th style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {u.name}
                      {u.id === currentUser?.id && (
                        <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid #3b82f6' }}>
                          Sesión Actual
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: 'var(--coficab-copper)', fontWeight: 700 }}>
                      @{u.username}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                      {u.email}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {(() => {
                        const roleBadge: Record<string, { bg: string; color: string; border: string; label: string }> = {
                          SUPERADMIN: { bg: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '#d97706', label: '👑 Super Admin Global' },
                          ADMIN_PLANTA: { bg: 'rgba(168,85,247,0.2)', color: '#c084fc', border: '#a855f7', label: '🏢 Admin de Planta' },
                          OPERATOR: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '#3b82f6', label: '🛠️ Operador IT' },
                          AUDITOR: { bg: 'rgba(107,114,128,0.2)', color: '#9ca3af', border: '#6b7280', label: '👁️ Auditor' },
                          ADMIN: { bg: 'rgba(168,85,247,0.2)', color: '#c084fc', border: '#a855f7', label: '🏢 Admin IT (legado)' },
                          USER: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '#3b82f6', label: 'Usuario' },
                        };
                        const rb = roleBadge[u.role] ?? roleBadge['USER'];
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <span className="badge" style={{ background: rb.bg, color: rb.color, border: `1px solid ${rb.border}`, fontWeight: 800, fontSize: '0.75rem' }}>
                              {rb.label}
                            </span>
                            {u.plant && (
                              <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>
                                📍 {u.plant}
                              </span>
                            )}
                            {!u.plant && u.role === 'SUPERADMIN' && (
                              <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>🌐 Todas las plantas</span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{u._count?.transactions || 0}</span> transacciones
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleOpenEditUser(u)}
                          style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem' }}
                          title="Editar usuario o cambiar rol"
                        >
                          <Edit size={14} />
                          Editar Rol
                        </button>

                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteUser(u)}
                          disabled={u.id === currentUser?.id}
                          style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem', opacity: u.id === currentUser?.id ? 0.4 : 1 }}
                          title={u.id === currentUser?.id ? 'No puede eliminar su propia cuenta' : 'Eliminar usuario'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '2rem', animation: 'scaleUp 0.2s ease' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={20} style={{ color: 'var(--primary)' }} />
              Registrar Nuevo Usuario en el Sistema
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Defina el rol y permisos que tendrá la cuenta (Administrador de IT con control total vs Usuario de Consulta).
            </p>

            <form onSubmit={handleCreateUser}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Nombre Completo *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ej. Juan Carlos Pérez"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Nombre de Usuario *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ej. juan.perez"
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Correo Electrónico</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="ej. juan.perez@coficab.com"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Contraseña de Acceso *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ color: '#c084fc', fontWeight: 800 }}>Rol y Nivel de Permisos *</label>
                <select
                  className="form-input"
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value, plant: e.target.value === 'SUPERADMIN' ? '' : newUserForm.plant })}
                  style={{ fontWeight: 700, borderColor: '#a855f7' }}
                >
                  <option value="SUPERADMIN">Super Administrador Global — Acceso total a todas las plantas</option>
                  <option value="ADMIN_PLANTA">Administrador de Planta — Control total de su planta</option>
                  <option value="OPERATOR">Operador / Técnico IT — Préstamos, mantenimiento y escaneo</option>
                  <option value="AUDITOR">Auditor / Solo Lectura — Sin permisos de modificación</option>
                </select>
              </div>

              {newUserForm.role !== 'SUPERADMIN' && (
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ color: '#34d399', fontWeight: 800 }}>Planta Asignada *</label>
                  <select
                    className="form-input"
                    value={newUserForm.plant}
                    onChange={(e) => setNewUserForm({ ...newUserForm, plant: e.target.value })}
                    style={{ fontWeight: 700, borderColor: '#10b981' }}
                    required
                  >
                    {PLANTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={createLoading} style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' }}>
                  {createLoading ? 'Registrando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '2rem', animation: 'scaleUp 0.2s ease' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit size={20} style={{ color: 'var(--coficab-copper)' }} />
              Editar Cuenta: @{editingUser.username}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Actualice el rol de permisos o restablezca la contraseña de esta cuenta.
            </p>

            <form onSubmit={handleSaveEditUser}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Nombre Completo</label>
                <input
                  type="text"
                  className="form-input"
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Correo Electrónico</label>
                <input
                  type="email"
                  className="form-input"
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ color: '#c084fc', fontWeight: 800 }}>Rol de Permisos</label>
                <select
                  className="form-input"
                  value={editUserForm.role}
                  onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value, plant: e.target.value === 'SUPERADMIN' ? '' : editUserForm.plant })}
                  style={{ fontWeight: 700, borderColor: '#a855f7' }}
                >
                  <option value="SUPERADMIN">Super Administrador Global — Acceso total a todas las plantas</option>
                  <option value="ADMIN_PLANTA">Administrador de Planta — Control total de su planta</option>
                  <option value="OPERATOR">Operador / Técnico IT — Préstamos, mantenimiento y escaneo</option>
                  <option value="AUDITOR">Auditor / Solo Lectura — Sin permisos de modificación</option>
                  <option value="ADMIN">ADMIN (legado) — Compatible con versión anterior</option>
                </select>
              </div>

              {editUserForm.role !== 'SUPERADMIN' && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ color: '#34d399', fontWeight: 800 }}>Planta Asignada</label>
                  <select
                    className="form-input"
                    value={editUserForm.plant}
                    onChange={(e) => setEditUserForm({ ...editUserForm, plant: e.target.value })}
                    style={{ fontWeight: 700, borderColor: '#10b981' }}
                  >
                    {PLANTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Restablecer Contraseña (Dejar en blanco para mantener la actual)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Nueva contraseña..."
                  value={editUserForm.password}
                  onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                  {editLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
