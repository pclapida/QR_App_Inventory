import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardCheck, CheckCircle2, Clock, AlertCircle, Lock,
  User, ChevronRight, Loader2, Eye, EyeOff, Shield, Plus, Trash2, Check,
  Bookmark, Save, Settings, X, Layers, FileText, Sparkles
} from 'lucide-react';
import { checklistApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChecklistItem {
  id: number;
  label: string;
  value: 'OK' | 'PTE' | 'N/A' | null;
}

interface ChecklistData {
  sectionA: ChecklistItem[];
  sectionB: ChecklistItem[];
}

interface Signature {
  userId: string;
  userName: string;
  plant?: string;
  role: string;
  timestamp: string;
  sections: string[];
  signed?: boolean;
  signedAt?: string;
  completedChecklist?: boolean;
  completedAt?: string;
}

interface Checklist {
  id: string;
  itemId: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'VOIDED';
  checklistData: string;
  signaturesJson: string;
  completedAt?: string;
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const VALUE_OPTIONS = ['OK', 'PTE', 'N/A'] as const;
type CheckValue = typeof VALUE_OPTIONS[number];

const VALUE_STYLES: Record<CheckValue, { bg: string; text: string; border: string }> = {
  OK: { bg: 'rgba(16,185,129,0.18)', text: '#34d399', border: '#10b981' },
  PTE: { bg: 'rgba(251,191,36,0.18)', text: '#fbbf24', border: '#f59e0b' },
  'N/A': { bg: 'rgba(107,114,128,0.18)', text: '#9ca3af', border: '#6b7280' },
};

// ─── Password Modal ───────────────────────────────────────────────────────────

interface PasswordModalProps {
  title: string;
  subtitle?: string;
  onConfirm: (password: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ title, subtitle, onConfirm, onCancel, loading }) => {
  const [pwd, setPwd] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async () => {
    if (!pwd.trim()) { setErr('Ingresa tu contraseña'); return; }
    try {
      setErr('');
      await onConfirm(pwd);
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Contraseña incorrecta');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'var(--bg-card)', border: '1.5px solid var(--border-color)',
        borderRadius: '16px', padding: '2rem', width: '380px', maxWidth: '95vw'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Shield size={22} style={{ color: 'var(--coficab-copper)' }} />
          <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>{title}</h3>
        </div>
        {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: '0.87rem', marginBottom: '1.25rem' }}>{subtitle}</p>}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <input
            type={show ? 'text' : 'password'}
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Ingresa tu contraseña..."
            autoFocus
            style={{
              width: '100%', padding: '0.75rem 2.5rem 0.75rem 1rem',
              background: 'var(--bg-main)', border: '1.5px solid var(--border-color)',
              borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.95rem',
              outline: 'none', boxSizing: 'border-box'
            }}
          />
          <button onClick={() => setShow(!show)} style={{
            position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
          }}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {err && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{err}</p>}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '0.75rem', background: 'transparent',
            border: '1.5px solid var(--border-color)', borderRadius: '8px',
            color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600
          }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={loading || !pwd.trim()} style={{
            flex: 1, padding: '0.75rem', background: 'var(--coficab-copper)',
            border: 'none', borderRadius: '8px', color: '#fff',
            cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            opacity: loading || !pwd.trim() ? 0.6 : 1
          }}>
            {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Lock size={15} />}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main ChecklistPage Component ────────────────────────────────────────────

interface ChecklistPageProps {
  itemId: string;
  itemName: string;
  itemSku: string;
  onCompleted: () => void;  // callback when checklist is COMPLETED
  onCancel: () => void;
}

export const ChecklistPage: React.FC<ChecklistPageProps> = ({
  itemId, itemName, itemSku, onCompleted, onCancel
}) => {
  const { user } = useAuth();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [data, setData] = useState<ChecklistData | null>(null);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState<null | 'sign' | 'complete'>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Templates state
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showManageTemplatesModal, setShowManageTemplatesModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templatePlant, setTemplatePlant] = useState(user?.plant || 'Planta 2');
  const [templateActionLoading, setTemplateActionLoading] = useState(false);
  const [templateSuccessMsg, setTemplateSuccessMsg] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await checklistApi.getTemplates();
      setTemplates(res.data.templates || []);
    } catch (err) {
      console.error('Error cargando plantillas:', err);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleApplyTemplate = async (templateId: string) => {
    if (!checklist || !templateId) return;
    if (checklist.status !== 'IN_PROGRESS') return;
    
    setSaving(true);
    try {
      const res = await checklistApi.applyTemplate(checklist.id, templateId);
      const updatedCl = res.data.checklist;
      setChecklist(updatedCl);
      setData(JSON.parse(updatedCl.checklistData || '{}'));
      setSelectedTemplateId(templateId);
      setTemplateSuccessMsg('Plantilla cargada exitosamente.');
      setTimeout(() => setTemplateSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al aplicar plantilla');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCurrentAsTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !templateName.trim()) return;

    setTemplateActionLoading(true);
    try {
      await checklistApi.saveTemplate({
        name: templateName.trim(),
        description: templateDesc.trim() || undefined,
        plant: templatePlant || undefined,
        sections: data
      });
      await fetchTemplates();
      setShowSaveTemplateModal(false);
      setTemplateName('');
      setTemplateDesc('');
      setTemplateSuccessMsg(`Plantilla "${templateName.trim()}" guardada exitosamente.`);
      setTimeout(() => setTemplateSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Error al guardar la plantilla');
    } finally {
      setTemplateActionLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar la plantilla "${name}"?`)) return;
    try {
      await checklistApi.deleteTemplate(id);
      await fetchTemplates();
      if (selectedTemplateId === id) setSelectedTemplateId('');
      setTemplateSuccessMsg(`Plantilla "${name}" eliminada.`);
      setTimeout(() => setTemplateSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Error al eliminar la plantilla');
    }
  };

  const sectionALabel = 'Usuario Local (Configuración de PC)';
  const sectionBLabel = 'Usuario Dominio (Configuración de Red/AD)';

  const loadChecklist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await checklistApi.getByItem(itemId);
      const cl: Checklist | null = res.data.checklist;

      if (cl && cl.status !== 'VOIDED') {
        setChecklist(cl);
        setData(JSON.parse(cl.checklistData || '{}'));
        setSignatures(JSON.parse(cl.signaturesJson || '[]'));
      } else {
        // Create a new checklist
        const createRes = await checklistApi.create(itemId);
        const newCl: Checklist = createRes.data.checklist;
        setChecklist(newCl);
        // Get template to build empty data
        const tplRes = await checklistApi.getTemplate();
        const tpl = tplRes.data.template;
        const emptyData: ChecklistData = {
          sectionA: tpl.sectionA.map((i: any) => ({ ...i, value: null })),
          sectionB: tpl.sectionB.map((i: any) => ({ ...i, value: null })),
        };
        setData(emptyData);
        setSignatures([{
          userId: user!.id,
          userName: user!.name || user!.username,
          plant: user!.plant ?? undefined,
          role: user!.role,
          timestamp: new Date().toISOString(),
          sections: []
        }]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar el checklist');
    } finally {
      setLoading(false);
    }
  }, [itemId, user]);

  useEffect(() => { loadChecklist(); }, [loadChecklist]);

  const handleValueChange = async (section: 'sectionA' | 'sectionB', itemId: number, value: CheckValue | null) => {
    if (!data || !checklist) return;
    const newData = {
      ...data,
      [section]: data[section].map((i: any) => i.id === itemId ? { ...i, value } : i)
    };
    setData(newData);
    try {
      await checklistApi.updateItems(checklist.id, newData, section);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleAddItem = async (section: 'sectionA' | 'sectionB', label: string) => {
    if (!data || !checklist || !label.trim()) return;
    const newItem = { id: Date.now(), label: label.trim(), value: null };
    const newData = {
      ...data,
      [section]: [...data[section], newItem]
    };
    setData(newData);
    try {
      await checklistApi.updateItems(checklist.id, newData, section);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleRemoveItem = async (section: 'sectionA' | 'sectionB', itemId: number) => {
    if (!data || !checklist) return;
    const newData = {
      ...data,
      [section]: data[section].filter((i: any) => i.id !== itemId)
    };
    setData(newData);
    try {
      await checklistApi.updateItems(checklist.id, newData, section);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleEditItemLabel = async (section: 'sectionA' | 'sectionB', itemId: number, newLabel: string) => {
    if (!data || !checklist || !newLabel.trim()) return;
    const newData = {
      ...data,
      [section]: data[section].map((i: any) => i.id === itemId ? { ...i, label: newLabel } : i)
    };
    setData(newData);
    try {
      await checklistApi.updateItems(checklist.id, newData, section);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSign = async (password: string) => {
    if (!checklist) return;
    setPasswordLoading(true);
    try {
      const res = await checklistApi.sign(checklist.id, password, user!.id);
      setSignatures(JSON.parse(res.data.checklist.signaturesJson || '[]'));
      setShowPasswordModal(null);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleComplete = async (password: string) => {
    if (!checklist) return;
    setPasswordLoading(true);
    try {
      await checklistApi.complete(checklist.id, password);
      setShowPasswordModal(null);
      onCompleted();
    } finally {
      setPasswordLoading(false);
    }
  };

  // Check if all non-optional items have a value
  const isReadyToComplete = data
    ? [...data.sectionA, ...data.sectionB].every(i => i.value !== null)
    : false;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.75rem', color: 'var(--text-muted)' }}>
      <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} /> Cargando checklist...
    </div>
  );

  if (checklist?.status === 'COMPLETED') return (
    <div style={{ textAlign: 'center', padding: '3rem' }}>
      <CheckCircle2 size={60} style={{ color: '#34d399', marginBottom: '1rem' }} />
      <h3 style={{ color: 'var(--text-main)', fontWeight: 800 }}>Checklist Completado</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Este equipo ya tiene checklist aprobado. Puedes continuar con la asignación.</p>
      <button onClick={onCompleted} style={{
        background: 'var(--coficab-copper)', color: '#fff', border: 'none',
        padding: '0.75rem 2rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer'
      }}>
        Continuar con la Asignación
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
          <ClipboardCheck size={24} style={{ color: 'var(--coficab-copper)' }} />
          <h2 style={{ fontWeight: 900, fontSize: '1.4rem', color: 'var(--text-main)', margin: 0 }}>
            Checklist Pre-Asignación
          </h2>
          {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)', marginLeft: 'auto' }} />}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <strong style={{ color: 'var(--coficab-copper)' }}>{itemSku}</strong> — {itemName}
        </p>
        <p style={{ color: '#fbbf24', fontSize: '0.83rem', marginTop: '0.35rem' }}>
          ⚠️ Este checklist es obligatorio antes de asignar el equipo.queda registrado en el sistema.
        </p>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', marginBottom: '1rem' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Signatures so far */}
      {signatures.length > 0 && (
        <div style={{
          background: 'rgba(30,58,95,0.4)', border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: '10px', padding: '0.85rem 1.2rem', marginBottom: '1.5rem',
          display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center'
        }}>
          <span style={{ color: '#60a5fa', fontSize: '0.83rem', fontWeight: 700 }}>Técnicos participantes:</span>
          {signatures.map((s, i) => (
            <span key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: '20px', padding: '0.2rem 0.7rem', fontSize: '0.82rem', color: '#93c5fd'
            }}>
              <User size={12} />
              {s.userName}
              {s.signed && <CheckCircle2 size={12} style={{ color: '#34d399' }} />}
            </span>
          ))}
        </div>
      )}

      {/* Template Toolbar */}
      {checklist?.status === 'IN_PROGRESS' && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '0.85rem 1.1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--coficab-copper)', fontWeight: 700, fontSize: '0.88rem' }}>
              <Layers size={17} />
              <span>Plantilla:</span>
            </div>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleApplyTemplate(e.target.value)}
              disabled={saving}
              style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.45rem 0.85rem',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                fontWeight: 600,
                outline: 'none',
                minWidth: '220px',
                cursor: 'pointer'
              }}
            >
              <option value="" disabled>-- Cargar plantilla predefinida --</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.isDefault ? `⭐ ${t.name} (Predeterminada)` : `📄 ${t.name}${t.plant ? ` (${t.plant})` : ''}`}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => setShowSaveTemplateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(14, 165, 233, 0.12)',
                border: '1px solid rgba(14, 165, 233, 0.35)',
                color: '#38bdf8',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              title="Guardar la estructura actual como una plantilla reutilizable"
            >
              <Save size={15} />
              Guardar como plantilla
            </button>

            {templates.filter(t => !t.isDefault).length > 0 && (
              <button
                type="button"
                onClick={() => setShowManageTemplatesModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
                title="Administrar o borrar plantillas personalizadas"
              >
                <Settings size={15} />
                Gestionar ({templates.filter(t => !t.isDefault).length})
              </button>
            )}
          </div>
        </div>
      )}

      {templateSuccessMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          color: '#34d399',
          padding: '0.65rem 1rem',
          borderRadius: '8px',
          marginBottom: '1.25rem',
          fontSize: '0.87rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={16} />
          {templateSuccessMsg}
        </div>
      )}

      {data && (
        <>
          {/* Section A */}
          <ChecklistSection
            title={sectionALabel}
            items={data.sectionA}
            section="sectionA"
            disabled={checklist?.status !== 'IN_PROGRESS'}
            onValueChange={handleValueChange}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onEditItemLabel={handleEditItemLabel}
          />

          {/* Section B */}
          <ChecklistSection
            title={sectionBLabel}
            items={data.sectionB}
            section="sectionB"
            disabled={checklist?.status !== 'IN_PROGRESS'}
            onValueChange={handleValueChange}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onEditItemLabel={handleEditItemLabel}
          />
        </>
      )}

      {/* Action buttons */}
      {checklist?.status === 'IN_PROGRESS' && (
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
          <button onClick={onCancel} style={{
            padding: '0.75rem 1.5rem', background: 'transparent',
            border: '1.5px solid var(--border-color)', borderRadius: '8px',
            color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600
          }}>
            Cancelar
          </button>
          <button onClick={() => setShowPasswordModal('sign')} style={{
            padding: '0.75rem 1.5rem', background: 'rgba(59,130,246,0.15)',
            border: '1.5px solid rgba(59,130,246,0.4)', borderRadius: '8px',
            color: '#60a5fa', cursor: 'pointer', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <Shield size={15} /> Registrar mi firma
          </button>
          <button
            onClick={() => setShowPasswordModal('complete')}
            disabled={!isReadyToComplete}
            style={{
              padding: '0.75rem 1.75rem', background: isReadyToComplete ? '#10b981' : 'var(--bg-card)',
              border: `1.5px solid ${isReadyToComplete ? '#10b981' : 'var(--border-color)'}`,
              borderRadius: '8px', color: isReadyToComplete ? '#fff' : 'var(--text-muted)',
              cursor: isReadyToComplete ? 'pointer' : 'not-allowed',
              fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem',
              marginLeft: 'auto', opacity: isReadyToComplete ? 1 : 0.5
            }}
          >
            <CheckCircle2 size={16} />
            {isReadyToComplete ? 'Completar y Firmar Checklist' : 'Completa todos los items primero'}
          </button>
        </div>
      )}

      {/* Password modals */}
      {showPasswordModal === 'sign' && (
        <PasswordModal
          title="Registrar Firma"
          subtitle={`Ingresa tu contraseña para registrar que ${user?.name || user?.username} participó en este checklist.`}
          onConfirm={handleSign}
          onCancel={() => setShowPasswordModal(null)}
          loading={passwordLoading}
        />
      )}
      {showPasswordModal === 'complete' && (
        <PasswordModal
          title="Completar Checklist"
          subtitle="Ingresa tu contraseña para cerrar y aprobar este checklist. Una vez completado, podrás continuar con la asignación del equipo."
          onConfirm={handleComplete}
          onCancel={() => setShowPasswordModal(null)}
          loading={passwordLoading}
        />
      )}
      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1.5px solid var(--border-color)',
            borderRadius: '16px', padding: '1.75rem', width: '450px', maxWidth: '95vw',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bookmark size={20} style={{ color: 'var(--coficab-copper)' }} />
                <h3 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>
                  Guardar Plantilla de Checklist
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveTemplateModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCurrentAsTemplate}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Nombre de la Plantilla *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Laptop Planta 1 - Estándar / UPCAST Mantenimiento"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  style={{
                    width: '100%', padding: '0.65rem 0.85rem', background: 'var(--bg-main)',
                    border: '1.5px solid var(--border-color)', borderRadius: '8px',
                    color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Planta Asociada (Opcional)
                </label>
                <select
                  value={templatePlant}
                  onChange={e => setTemplatePlant(e.target.value)}
                  style={{
                    width: '100%', padding: '0.65rem 0.85rem', background: 'var(--bg-main)',
                    border: '1.5px solid var(--border-color)', borderRadius: '8px',
                    color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
                  }}
                >
                  <option value="Planta 1">Planta 1</option>
                  <option value="Planta 2">Planta 2</option>
                  <option value="Planta 3">Planta 3</option>
                  <option value="Planta UPCAST">Planta UPCAST</option>
                  <option value="">Todas las Plantas (Global)</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Descripción o Notas (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ej. Aplica para laptops administrativas entregadas en Planta 1"
                  value={templateDesc}
                  onChange={e => setTemplateDesc(e.target.value)}
                  style={{
                    width: '100%', padding: '0.65rem 0.85rem', background: 'var(--bg-main)',
                    border: '1.5px solid var(--border-color)', borderRadius: '8px',
                    color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{
                background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px',
                marginBottom: '1.5rem', fontSize: '0.82rem', color: 'var(--text-muted)'
              }}>
                ℹ️ Esta plantilla guardará los {data?.sectionA?.length || 0} ítems de la Sección A y {data?.sectionB?.length || 0} ítems de la Sección B actuales para reutilizarlos en futuros checklists.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowSaveTemplateModal(false)}
                  style={{
                    flex: 1, padding: '0.7rem', background: 'transparent',
                    border: '1.5px solid var(--border-color)', borderRadius: '8px',
                    color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={templateActionLoading || !templateName.trim()}
                  style={{
                    flex: 1.5, padding: '0.7rem', background: 'var(--coficab-copper)',
                    border: 'none', borderRadius: '8px', color: '#fff',
                    cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    opacity: templateActionLoading || !templateName.trim() ? 0.6 : 1
                  }}
                >
                  {templateActionLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                  Guardar Plantilla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Templates Modal */}
      {showManageTemplatesModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1.5px solid var(--border-color)',
            borderRadius: '16px', padding: '1.75rem', width: '550px', maxWidth: '95vw',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)', maxHeight: '80vh', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={20} style={{ color: 'var(--coficab-copper)' }} />
                <h3 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>
                  Gestionar Plantillas de Checklist
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManageTemplatesModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingRight: '0.25rem' }}>
              {templates.map((tpl) => {
                let count = 0;
                try {
                  const s = JSON.parse(tpl.sectionsJson || '{}');
                  count = (s.sectionA?.length || 0) + (s.sectionB?.length || 0);
                } catch { count = 0; }

                return (
                  <div key={tpl.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)', borderRadius: '10px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                          {tpl.name}
                        </span>
                        {tpl.isDefault && (
                          <span style={{
                            fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px',
                            background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: 700
                          }}>
                            Predeterminada
                          </span>
                        )}
                        {tpl.plant && (
                          <span style={{
                            fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px',
                            background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontWeight: 600
                          }}>
                            {tpl.plant}
                          </span>
                        )}
                      </div>
                      {tpl.description && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {tpl.description}
                        </div>
                      )}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                        {count} elementos configurados
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {!tpl.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                          title="Eliminar plantilla"
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#ef4444', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowManageTemplatesModal(false)}
                style={{
                  padding: '0.65rem 1.5rem', background: 'var(--bg-main)',
                  border: '1.5px solid var(--border-color)', borderRadius: '8px',
                  color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Section Component ────────────────────────────────────────────────────────

interface ChecklistSectionProps {
  title: string;
  items: ChecklistItem[];
  section: 'sectionA' | 'sectionB';
  disabled: boolean;
  onValueChange: (section: 'sectionA' | 'sectionB', id: number, value: CheckValue | null) => void;
  onAddItem: (section: 'sectionA' | 'sectionB', label: string) => void;
  onRemoveItem: (section: 'sectionA' | 'sectionB', id: number) => void;
  onEditItemLabel: (section: 'sectionA' | 'sectionB', id: number, label: string) => void;
}

const ChecklistSection: React.FC<ChecklistSectionProps> = ({ title, items, section, disabled, onValueChange, onAddItem, onRemoveItem, onEditItemLabel }) => {
  const [newItemLabel, setNewItemLabel] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const completed = items.filter(i => i.value !== null).length;
  const total = items.length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemLabel.trim()) {
      onAddItem(section, newItemLabel);
      setNewItemLabel('');
    }
  };

  const submitEdit = (id: number) => {
    if (editLabel.trim()) {
      onEditItemLabel(section, id, editLabel);
    }
    setEditingId(null);
  };

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1.5px solid var(--border-color)',
      borderRadius: '12px', overflow: 'hidden', marginBottom: '1.25rem'
    }}>
      {/* Section header */}
      <div style={{
        padding: '0.85rem 1.25rem',
        background: 'rgba(255,255,255,0.04)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', gap: '0.75rem'
      }}>
        <User size={17} style={{ color: 'var(--coficab-copper)', flexShrink: 0 }} />
        <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>{title}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: completed === total ? '#34d399' : 'var(--text-muted)', fontWeight: 700 }}>
          {completed}/{total} completados
        </span>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '2rem 1fr 4rem 4rem 4rem 2rem',
        padding: '0.5rem 1.25rem', gap: '0.5rem',
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid var(--border-color)',
        fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.05em'
      }}>
        <span>#</span><span>Item</span>
        <span style={{ textAlign: 'center' }}>OK</span>
        <span style={{ textAlign: 'center' }}>PTE</span>
        <span style={{ textAlign: 'center' }}>N/A</span>
        <span></span>
      </div>

      {/* Items */}
      {items.map((item, idx) => (
        <div key={item.id} style={{
          display: 'grid', gridTemplateColumns: '2rem 1fr 4rem 4rem 4rem 2rem',
          padding: '0.6rem 1.25rem', gap: '0.5rem', alignItems: 'center',
          borderBottom: idx < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          background: item.value ? `${VALUE_STYLES[item.value as CheckValue]?.bg}33` : 'transparent',
          transition: 'background 0.15s'
        }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>{idx + 1}</span>
          
          {editingId === item.id ? (
            <input
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onBlur={() => submitEdit(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitEdit(item.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              autoFocus
              style={{
                background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
                color: 'var(--text-main)', fontSize: '0.88rem', padding: '0.2rem 0.5rem',
                borderRadius: '4px', width: '100%', outline: 'none'
              }}
            />
          ) : (
            <span 
              style={{ color: 'var(--text-main)', fontSize: '0.88rem', cursor: disabled ? 'default' : 'text' }}
              onClick={() => {
                if (!disabled) {
                  setEditingId(item.id);
                  setEditLabel(item.label);
                }
              }}
              title={disabled ? '' : 'Clic para editar'}
            >
              {item.label}
            </span>
          )}

          {VALUE_OPTIONS.map(opt => {
            const selected = item.value === opt;
            const st = VALUE_STYLES[opt];
            return (
              <div key={opt} style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={() => !disabled && onValueChange(section, item.id, selected ? null : opt)}
                  disabled={disabled}
                  style={{
                    width: '28px', height: '28px', borderRadius: '6px',
                    border: `2px solid ${selected ? st.border : 'var(--border-color)'}`,
                    background: selected ? st.bg : 'transparent',
                    cursor: disabled ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s'
                  }}
                >
                  {selected && <CheckCircle2 size={14} style={{ color: st.text }} />}
                </button>
              </div>
            );
          })}
          
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {!disabled && (
              <button
                onClick={() => onRemoveItem(section, item.id)}
                title="Eliminar elemento"
                style={{
                  background: 'none', border: 'none', color: '#ef4444',
                  cursor: 'pointer', opacity: 0.7, padding: '0.2rem'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Add New Item */}
      {!disabled && (
        <form onSubmit={handleAddSubmit} style={{
          display: 'flex', gap: '0.5rem', padding: '0.75rem 1.25rem',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(255,255,255,0.01)'
        }}>
          <input
            type="text"
            placeholder="Nuevo elemento..."
            value={newItemLabel}
            onChange={(e) => setNewItemLabel(e.target.value)}
            style={{
              flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.85rem',
              background: 'var(--bg-main)', border: '1px solid var(--border-color)',
              borderRadius: '6px', color: 'var(--text-main)', outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={!newItemLabel.trim()}
            style={{
              padding: '0.5rem 1rem', background: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(16,185,129,0.4)', borderRadius: '6px',
              color: '#34d399', cursor: newItemLabel.trim() ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600,
              fontSize: '0.85rem', opacity: newItemLabel.trim() ? 1 : 0.5
            }}
          >
            <Plus size={14} /> Agregar
          </button>
        </form>
      )}
    </div>
  );
};

export default ChecklistPage;
