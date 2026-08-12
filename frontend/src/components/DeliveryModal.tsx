import React, { useState, useEffect } from 'react';
import {
  X, User, Mail, Briefcase, ArrowRight, ChevronLeft,
  Printer, Send, CheckCircle2, Camera, FileText, Loader2
} from 'lucide-react';
import { Item, responsivasApi } from '../services/api';
import { openPrintWindow } from './ResponsivaModal';
import api from '../services/api';
// @ts-ignore
import html2pdf from 'html2pdf.js';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DeliveryFormData {
  colaborador: string;
  email: string;
  puesto: string;
}

interface ResponsivaFormData {
  marcaModelo: string;
  serie: string;
  nombreEquipo: string;
  accesorios: {
    cargador: boolean;
    mouse: boolean;
    audifonos: boolean;
    adaptador: boolean;
    otro: boolean;
    otroText: string;
  };
  estado: string;
  photoUrls: string[];
}

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
}

type Step = 'delivery' | 'responsiva' | 'preview';

// ─── Blob URL to Base64 ───────────────────────────────────────────────────────
async function blobUrlToBase64(url: string): Promise<string> {
  const resp = await fetch(url);
  const blob = await resp.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

// ─── Generate HTML for the responsiva ────────────────────────────────────────
async function buildResponsivaHTML(
  item: Item,
  delivery: DeliveryFormData,
  responsiva: ResponsivaFormData
): Promise<string> {
  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, '0')} / ${(today.getMonth() + 1).toString().padStart(2, '0')} / ${today.getFullYear()}`;

  const photoBase64s: string[] = [];
  for (const url of responsiva.photoUrls) {
    try {
      photoBase64s.push(await blobUrlToBase64(url));
    } catch { /* skip */ }
  }

  const photosHtml = photoBase64s.length > 0
    ? `<div class="section-title">Evidencia Fotográfica</div>
       <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;">
         ${photoBase64s.map(src => `<img src="${src}" style="height:130px;object-fit:contain;border:1px solid #ccc;border-radius:4px;" />`).join('')}
       </div>` : '';

  const cb = (checked: boolean, label: string) =>
    `<span style="display:inline-flex;align-items:center;gap:6px;margin-right:16px;">
       <span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border:1px solid #000;font-size:11px;font-weight:bold;">${checked ? '&#10003;' : '&nbsp;'}</span>
       ${label}
     </span>`;

  const otroHtml = responsiva.accesorios.otro
    ? cb(true, `Otro: ${responsiva.accesorios.otroText}`) : '';

  return `<div id="responsiva-pdf-content">
<style>
  #responsiva-pdf-content { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #000 !important; background: #fff !important; padding: 1.5cm; }
  #responsiva-pdf-content * { box-sizing: border-box; margin: 0; padding: 0; color: #000 !important; }
  #responsiva-pdf-content h1 { text-align: center; font-size: 13pt; font-weight: bold; text-transform: uppercase; margin-bottom: 18px; }
  #responsiva-pdf-content .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 18px; }
  #responsiva-pdf-content .section-title { font-weight: bold; font-size: 11pt; margin-top: 16px; margin-bottom: 6px; }
  #responsiva-pdf-content ul { padding-left: 20px; margin-top: 4px; margin-bottom: 8px; }
  #responsiva-pdf-content li { margin-bottom: 3px; text-align: justify; }
  #responsiva-pdf-content p { text-align: justify; margin-bottom: 8px; }
  #responsiva-pdf-content .data-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  #responsiva-pdf-content .data-table td { padding: 5px 0; vertical-align: top; }
  #responsiva-pdf-content .data-table td:first-child { font-weight: bold; width: 35%; }
  #responsiva-pdf-content .data-table td:last-child { border-bottom: 1px solid #000; padding-left: 8px; }
  #responsiva-pdf-content .sig-row { display: flex; justify-content: space-around; margin-top: 60px; gap: 2rem; }
  #responsiva-pdf-content .sig-box { flex: 1; text-align: center; border-top: 1px solid #000; padding-top: 6px; }
</style>

<div class="header">
  <div>
    <img src="${window.location.origin}/coficab-logo.png" alt="COFICAB" style="max-height: 40px; margin-bottom: 5px;" onerror="this.outerHTML='<strong style=\\'font-size:14pt;letter-spacing:1px;\\'>COFICAB</strong>'" />
    <br><span style="font-size:9pt;color:#666;">Departamento de IT</span>
  </div>
  <div style="text-align:right;font-size:10pt;color:#555;">Fecha de Emisión: ${dateStr}<br>SKU: ${item.sku}</div>
</div>

<h1>Responsiva de Asignación y Política de Uso de Equipo de Cómputo Portátil</h1>

<div class="section-title">1. Objetivo</div>
<p>Establecer las responsabilidades y lineamientos para el uso adecuado de los equipos de cómputo portátiles propiedad de la empresa.</p>

<div class="section-title">2. Alcance</div>
<p>Esta política aplica a todo el personal que reciba un equipo portátil propiedad de la empresa para el desempeño de sus funciones.</p>

<div class="section-title">3. Responsabilidades del usuario</div>
<ul>
  <li>Utilizar el equipo exclusivamente para actividades laborales.</li>
  <li>Mantener el equipo en buen estado físico y de funcionamiento.</li>
  <li>Proteger la información almacenada en el equipo.</li>
  <li>Resguardar el equipo en todo momento.</li>
  <li>Reportar inmediatamente cualquier incidente relacionado con el equipo.</li>
  <li>Cumplir con las políticas de seguridad establecidas por la empresa.</li>
</ul>

<div class="section-title">4. Uso del equipo</div>
<ul>
  <li>No instalar software sin autorización del Departamento de TI.</li>
  <li>No modificar la configuración de hardware o software.</li>
  <li>No desactivar antivirus ni herramientas de seguridad.</li>
  <li>No compartir el equipo con otras personas sin autorización.</li>
  <li>Permitir que únicamente el personal autorizado de TI realice mantenimiento.</li>
</ul>

<div class="section-title">5. Devolución del equipo</div>
<p>El equipo deberá ser devuelto cuando la empresa lo solicite o al término de la relación laboral, incluyendo todos los accesorios entregados.</p>

<div class="section-title">6. Aceptación</div>
<p>Declaro haber recibido el equipo descrito en este documento y manifiesto haber leído, comprendido y aceptado las políticas de uso establecidas por la empresa.</p>

<hr style="margin:24px 0;border-color:#ccc;" />

<div style="page-break-inside: avoid;">
<h1 style="font-size:12pt;margin-bottom:14px;">DATOS DE ENTREGA</h1>

<table class="data-table">
  <tr><td>Nombre del colaborador:</td><td>${delivery.colaborador}</td></tr>
  <tr><td>Correo electrónico:</td><td>${delivery.email}</td></tr>
  ${delivery.puesto ? `<tr><td>Puesto / Área:</td><td>${delivery.puesto}</td></tr>` : ''}
  <tr><td>Marca y modelo:</td><td>${responsiva.marcaModelo}</td></tr>
  <tr><td>Número de serie:</td><td>${responsiva.serie}</td></tr>
  <tr><td>Identificador (SKU) COFICAB:</td><td>${responsiva.nombreEquipo}</td></tr>
</table>
</div>

<div class="section-title">Accesorios entregados</div>
<div style="margin-bottom:16px;">
  ${cb(responsiva.accesorios.cargador, 'Cargador')}
  ${cb(responsiva.accesorios.mouse, 'Mouse')}
  ${cb(responsiva.accesorios.audifonos, 'Audífonos')}
  ${cb(responsiva.accesorios.adaptador, 'Adaptador')}
  ${otroHtml}
</div>

<div class="section-title">Estado del equipo al momento de la entrega</div>
<p style="font-style:italic;padding:8px 12px;background:#f8f8f8;border:1px solid #ddd;margin-bottom:16px;">"${responsiva.estado}"</p>

${photosHtml}

<p style="font-weight:bold;margin-bottom:30px;">
  Fecha de entrega:&nbsp;
  <u>&nbsp;${today.getDate().toString().padStart(2,'0')}&nbsp;</u> /
  <u>&nbsp;${(today.getMonth()+1).toString().padStart(2,'0')}&nbsp;</u> /
  <u>&nbsp;${today.getFullYear()}&nbsp;</u>
</p>

<div class="sig-row">
  <div class="sig-box"><strong>Firma del colaborador</strong><br>${delivery.colaborador}</div>
  <div class="sig-box"><strong>Nombre y firma del responsable de TI</strong></div>
</div>
</div>`;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const DeliveryModal: React.FC<DeliveryModalProps> = ({ isOpen, onClose, item }) => {
  const [step, setStep] = useState<Step>('delivery');
  const [savedId, setSavedId] = useState<string | null>(null);

  // Step 1: delivery data
  const [delivery, setDelivery] = useState<DeliveryFormData>({ 
    colaborador: item?.assignedTo || '', 
    email: '', 
    puesto: '' 
  });

  // Step 2: responsiva data
  const [responsiva, setResponsiva] = useState<ResponsivaFormData>({
    marcaModelo: item?.model ? `${item.name} (${item.model})` : (item?.name || ''),
    serie: item?.serialNumber || '',
    nombreEquipo: item?.sku || '',
    accesorios: { cargador: false, mouse: false, audifonos: false, adaptador: false, otro: false, otroText: '' },
    estado: 'Buen estado general. Funciona correctamente.',
    photoUrls: []
  });

  // Step 3: actions
  const [printing, setPrinting] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen || !item) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newUrls = Array.from(e.target.files).map(f => URL.createObjectURL(f));
      setResponsiva(prev => ({ ...prev, photoUrls: [...prev.photoUrls, ...newUrls].slice(0, 4) }));
    }
  };

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('responsiva');
  };

  const handleResponsivaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Save to DB
    try {
      const saved = await responsivasApi.create({
        itemId: item.id,
        colaborador: delivery.colaborador,
        marcaModelo: responsiva.marcaModelo,
        serie: responsiva.serie,
        nombreEquipo: responsiva.nombreEquipo,
        accesoriosJson: JSON.stringify(responsiva.accesorios),
        observaciones: responsiva.estado,
        photoUrlsJson: JSON.stringify(responsiva.photoUrls),
        email: delivery.email
      });
      setSavedId(saved.id || null);
    } catch (err) {
      console.error('No se pudo guardar el historial', err);
    }
    setStep('preview');
  };

  const handlePrint = async () => {
    if (!item) return;
    setPrinting(true);
    try {
      const html = await buildResponsivaHTML(item, delivery, responsiva);
      const opt = {
        margin:       10,
        filename:     `Responsiva_${item.sku}_${delivery.colaborador.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' as const }
      };
      // Forzar la descarga del PDF sin abrir ventana emergente
      await html2pdf().set(opt).from(html).save();
    } catch (err) {
      console.error('Error generando PDF', err);
      alert('Hubo un error al generar el PDF.');
    } finally {
      setPrinting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!item) return;
    setSendingEmail(true);
    setEmailResult(null);
    try {
      const html = await buildResponsivaHTML(item, delivery, responsiva);
      const opt = {
        margin:       10,
        filename:     'Responsiva.pdf',
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' as const }
      };
      
      // Generar PDF en Base64
      const pdfBase64 = await html2pdf().set(opt).from(html).outputPdf('datauristring');

      const res = await api.post('/responsivas/send-email', {
        responsivaId: savedId,
        pdfBase64: pdfBase64,
        toEmail: delivery.email,
        colaborador: delivery.colaborador,
        nombreEquipo: responsiva.nombreEquipo
      });
      setEmailResult({ success: true, message: res.data.message || `Correo enviado a ${delivery.email}` });
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al enviar el correo.';
      setEmailResult({ success: false, message: msg });
    } finally {
      setSendingEmail(false);
    }
  };

  // ── Step 1: Delivery form ────────────────────────────────────────────────────
  if (step === 'delivery') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
        <div style={{ background: '#0f172a', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '480px', border: '1px solid var(--border-highlight)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(99,102,241,0.1)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
              <User size={18} /> Entregar Equipo IT
            </h2>
            <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={20} /></button>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', padding: '0.75rem 1.25rem', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>① Datos del receptor</span>
            <span style={{ color: '#374151' }}>→</span>
            <span style={{ color: '#6b7280' }}>② Carta responsiva</span>
            <span style={{ color: '#374151' }}>→</span>
            <span style={{ color: '#6b7280' }}>③ Imprimir / Enviar</span>
          </div>

          <form onSubmit={handleDeliverySubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.07)', fontSize: '0.85rem', color: '#9ca3af' }}>
              Equipo: <strong style={{ color: '#fff' }}>{item.name}</strong> — SKU: <code style={{ color: 'var(--primary)' }}>{item.sku}</code>
            </div>

            <div>
              <label className="form-label">Nombre completo del colaborador *</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                <input type="text" className="form-input" style={{ paddingLeft: '2.25rem' }}
                  placeholder="ej. Juan Pérez García"
                  value={delivery.colaborador}
                  onChange={e => setDelivery({ ...delivery, colaborador: e.target.value })}
                  required />
              </div>
            </div>

            <div>
              <label className="form-label">Correo electrónico *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                <input type="email" className="form-input" style={{ paddingLeft: '2.25rem' }}
                  placeholder="ej. juan.perez@coficab.com"
                  value={delivery.email}
                  onChange={e => setDelivery({ ...delivery, email: e.target.value })}
                  required />
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.35rem' }}>
                La carta responsiva será enviada a este correo.
              </p>
            </div>

            <div>
              <label className="form-label">Puesto / Área (Opcional)</label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                <input type="text" className="form-input" style={{ paddingLeft: '2.25rem' }}
                  placeholder="ej. Producción - Línea 3"
                  value={delivery.puesto}
                  onChange={e => setDelivery({ ...delivery, puesto: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', paddingTop: '0.25rem' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2, display: 'flex', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }}>
                Continuar <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── Step 2: Responsiva form ──────────────────────────────────────────────────
  if (step === 'responsiva') {
    const ACCESSORY_KEYS: Array<[keyof typeof responsiva.accesorios, string]> = [
      ['cargador', 'Cargador'], ['mouse', 'Mouse'], ['audifonos', 'Audífonos'], ['adaptador', 'Adaptador']
    ];

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
        <div style={{ background: '#0f172a', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '600px', maxHeight: '94vh', overflowY: 'auto', border: '1px solid var(--border-highlight)' }}>
          {/* Header */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#0f172a', zIndex: 10 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
              <FileText size={18} /> Carta Responsiva
            </h2>
            <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={20} /></button>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', padding: '0.75rem 1.25rem', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.8rem' }}>
            <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Datos del receptor</span>
            <span style={{ color: '#374151' }}>→</span>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>② Carta responsiva</span>
            <span style={{ color: '#374151' }}>→</span>
            <span style={{ color: '#6b7280' }}>③ Imprimir / Enviar</span>
          </div>

          <form onSubmit={handleResponsivaSubmit} style={{ padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Equipment data (editable) */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', padding: '0.9rem', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                Datos del Equipo (editables)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Marca y Modelo *</label>
                  <input type="text" className="form-input" value={responsiva.marcaModelo}
                    onChange={e => setResponsiva({ ...responsiva, marcaModelo: e.target.value })}
                    placeholder="ej. Dell Latitude 5550" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Número de Serie *</label>
                    <input type="text" className="form-input" value={responsiva.serie}
                      onChange={e => setResponsiva({ ...responsiva, serie: e.target.value })} required />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>SKU / Identificador *</label>
                    <input type="text" className="form-input" value={responsiva.nombreEquipo}
                      onChange={e => setResponsiva({ ...responsiva, nombreEquipo: e.target.value })} required />
                  </div>
                </div>
              </div>
            </div>

            {/* Accessories */}
            <div>
              <label className="form-label">Accesorios Entregados</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.4rem' }}>
                {ACCESSORY_KEYS.map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: responsiva.accesorios[key] ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${responsiva.accesorios[key] ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.15s' }}>
                    <input type="checkbox" checked={responsiva.accesorios[key] as boolean}
                      onChange={e => setResponsiva({ ...responsiva, accesorios: { ...responsiva.accesorios, [key]: e.target.checked } })} />
                    {label}
                  </label>
                ))}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', gridColumn: '1 / -1', background: responsiva.accesorios.otro ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${responsiva.accesorios.otro ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}` }}>
                  <input type="checkbox" checked={responsiva.accesorios.otro}
                    onChange={e => setResponsiva({ ...responsiva, accesorios: { ...responsiva.accesorios, otro: e.target.checked } })} />
                  Otro
                </label>
                {responsiva.accesorios.otro && (
                  <input type="text" className="form-input" style={{ gridColumn: '1 / -1' }} placeholder="Especificar..."
                    value={responsiva.accesorios.otroText}
                    onChange={e => setResponsiva({ ...responsiva, accesorios: { ...responsiva.accesorios, otroText: e.target.value } })}
                    required={responsiva.accesorios.otro} />
                )}
              </div>
            </div>

            {/* State */}
            <div>
              <label className="form-label">Estado del Equipo al Momento de la Entrega</label>
              <textarea className="form-input" style={{ minHeight: '72px', resize: 'vertical' }}
                value={responsiva.estado} onChange={e => setResponsiva({ ...responsiva, estado: e.target.value })} required />
            </div>

            {/* Photos */}
            <div>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Evidencia Fotográfica (Max 4)</span>
                <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{responsiva.photoUrls.length}/4</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '0.4rem' }}>
                {responsiva.photoUrls.map((url, idx) => (
                  <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={url} alt={`E${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => setResponsiva(prev => ({ ...prev, photoUrls: prev.photoUrls.filter((_, i) => i !== idx) }))}
                      style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', padding: '3px', display: 'flex' }}>
                      <X size={11} />
                    </button>
                  </div>
                ))}
                {responsiva.photoUrls.length < 4 && (
                  <label style={{ aspectRatio: '1', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9ca3af', gap: '0.2rem' }}>
                    <Camera size={20} />
                    <span style={{ fontSize: '0.68rem' }}>Agregar</span>
                    <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} capture="environment" />
                  </label>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', paddingTop: '0.25rem' }}>
              <button type="button" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => setStep('delivery')}>
                <ChevronLeft size={16} /> Regresar
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }}>
                Ver Vista Previa <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── Step 3: Preview & Actions ────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#0f172a', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '480px', border: '1px solid var(--border-highlight)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16,185,129,0.1)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
            <CheckCircle2 size={18} /> Entrega Registrada
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', padding: '0.75rem 1.25rem', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.8rem' }}>
          <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Datos del receptor</span>
          <span style={{ color: '#374151' }}>→</span>
          <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Carta responsiva</span>
          <span style={{ color: '#374151' }}>→</span>
          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>③ Imprimir / Enviar</span>
        </div>

        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Summary */}
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>Resumen de entrega</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{delivery.colaborador}</div>
            <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>{delivery.email}</div>
            {delivery.puesto && <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '0.2rem' }}>{delivery.puesto}</div>}
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>{responsiva.marcaModelo}</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Serie: {responsiva.serie}</div>
          </div>

          {/* Email result message */}
          {emailResult && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: emailResult.success ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${emailResult.success ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, color: emailResult.success ? '#10b981' : '#f87171', fontSize: '0.88rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              {emailResult.success ? <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '1px' }} /> : <X size={16} style={{ flexShrink: 0, marginTop: '1px' }} />}
              {emailResult.message}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <button
              className="btn btn-primary"
              onClick={handlePrint}
              disabled={printing}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
            >
              {printing ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Printer size={16} />}
              {printing ? 'Preparando...' : 'Imprimir / Guardar PDF'}
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleSendEmail}
              disabled={sendingEmail || emailResult?.success === true}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontWeight: 700, borderColor: '#6366f1', color: '#818cf8' }}
            >
              {sendingEmail ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
              {sendingEmail ? 'Enviando...' : emailResult?.success ? '✓ Correo enviado' : `Enviar a ${delivery.email}`}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1, fontSize: '0.85rem' }} onClick={() => setStep('responsiva')}>
              <ChevronLeft size={15} /> Editar
            </button>
            <button type="button" className="btn btn-secondary" style={{ flex: 1, fontSize: '0.85rem' }} onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
