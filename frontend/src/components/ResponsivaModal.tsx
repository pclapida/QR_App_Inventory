import React, { useState, useEffect } from 'react';
import { X, Camera, FileText, CheckCircle2, Printer, ChevronLeft, Eye } from 'lucide-react';
import { Item, responsivasApi } from '../services/api';

interface ResponsivaModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
}

export interface ResponsivaData {
  colaborador: string;
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

// Convert a blob URL to base64 data URL so it survives window.open
async function blobUrlToBase64(url: string): Promise<string> {
  const resp = await fetch(url);
  const blob = await resp.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

// Builds and opens a print-ready HTML page in a new window
export async function openPrintWindow(item: Item, data: ResponsivaData) {
  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, '0')} / ${(today.getMonth() + 1).toString().padStart(2, '0')} / ${today.getFullYear()}`;

  // Convert blob photos to base64 so new window can display them
  const photoBase64s: string[] = [];
  for (const url of data.photoUrls) {
    try {
      const b64 = await blobUrlToBase64(url);
      photoBase64s.push(b64);
    } catch { /* skip if conversion fails */ }
  }

  const photosHtml = photoBase64s.length > 0
    ? `<div class="section-title">Evidencia Fotográfica</div>
       <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;">
         ${photoBase64s.map(src => `<img src="${src}" style="height:130px;object-fit:contain;border:1px solid #ccc;border-radius:4px;" />`).join('')}
       </div>`
    : '';

  const checkbox = (checked: boolean, label: string) =>
    `<span style="display:inline-flex;align-items:center;gap:6px;margin-right:16px;">
       <span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border:1px solid #000;font-size:11px;font-weight:bold;">${checked ? '&#10003;' : '&nbsp;'}</span>
       ${label}
     </span>`;

  const otroHtml = data.accesorios.otro
    ? checkbox(true, `Otro: ${data.accesorios.otroText}`) : '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Responsiva - ${data.colaborador}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #000; background: #fff; padding: 1.5cm; }
  h1 { text-align: center; font-size: 13pt; font-weight: bold; text-transform: uppercase; margin-bottom: 18px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 18px; }
  .section-title { font-weight: bold; font-size: 11pt; margin-top: 16px; margin-bottom: 6px; }
  ul { padding-left: 20px; margin-top: 4px; margin-bottom: 8px; }
  li { margin-bottom: 3px; text-align: justify; }
  p { text-align: justify; margin-bottom: 8px; }
  .datos-block { page-break-inside: avoid; }
  .sig-block { page-break-inside: avoid; }
  .data-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  .data-table td { padding: 5px 0; vertical-align: top; }
  .data-table td:first-child { font-weight: bold; width: 35%; }
  .data-table td:last-child { border-bottom: 1px solid #000; padding-left: 8px; }
  .sig-row { display: flex; justify-content: space-around; margin-top: 60px; gap: 2rem; }
  .sig-box { flex: 1; text-align: center; border-top: 1px solid #000; padding-top: 6px; }
  @media print { @page { margin: 1.5cm; size: letter; } body { padding: 0; } }
</style>
</head>
<body>

<div class="header">
  <div>
    <img src="${window.location.origin}/coficab-logo.png" alt="COFICAB" style="max-height: 40px; margin-bottom: 5px;" onerror="this.outerHTML='<strong style=\\'font-size:14pt;letter-spacing:1px;\\'>COFICAB</strong>'" />
    <br><span style="font-size:9pt;color:#666;">Departamento de Tecnologías de la Información</span>
  </div>
  <div style="text-align:right;font-size:10pt;color:#555;">Fecha de Emisión: ${dateStr}<br>SKU: ${item.sku}</div>
</div>

<h1>Responsiva de Asignación y Política de Uso de Equipo de Cómputo Portátil</h1>

<div class="section-title">1. Objetivo</div>
<p>Establecer las responsabilidades y lineamientos para el uso adecuado de los equipos de cómputo portátiles propiedad de la empresa, con el fin de proteger los activos tecnológicos, preservar la información corporativa y reducir los riesgos de pérdida, robo, daño o uso no autorizado.</p>

<div class="section-title">2. Alcance</div>
<p>Esta política aplica a todo el personal que reciba un equipo portátil propiedad de la empresa para el desempeño de sus funciones.</p>

<div class="section-title">3. Responsabilidades del usuario</div>
<p>Al recibir un equipo de cómputo, el usuario se compromete a:</p>
<ul>
  <li>Utilizar el equipo exclusivamente para actividades laborales.</li>
  <li>Mantener el equipo en buen estado físico y de funcionamiento.</li>
  <li>Proteger la información almacenada en el equipo.</li>
  <li>Resguardar el equipo en todo momento.</li>
  <li>Reportar inmediatamente cualquier incidente relacionado con el equipo.</li>
  <li>Cumplir con las políticas de seguridad establecidas por la empresa.</li>
</ul>

<div class="section-title">4. Uso del equipo</div>
<p>El usuario deberá cumplir con las siguientes disposiciones:</p>
<ul>
  <li>No instalar software sin autorización del Departamento de TI.</li>
  <li>No modificar la configuración de hardware o software.</li>
  <li>No desactivar antivirus, herramientas de seguridad, cifrado del disco o aplicaciones administradas por TI.</li>
  <li>No compartir el equipo con otras personas sin autorización.</li>
  <li>No retirar etiquetas de inventario o números de activo.</li>
  <li>Permitir que únicamente el personal autorizado de TI realice mantenimiento, reparaciones o actualizaciones.</li>
</ul>

<div class="section-title">5. Protección de la información</div>
<p>Para proteger la información corporativa, el usuario deberá:</p>
<ul>
  <li>Mantener la confidencialidad de toda la información de la empresa.</li>
  <li>No compartir contraseñas.</li>
  <li>Bloquear la sesión al ausentarse de su lugar de trabajo.</li>
  <li>No almacenar información corporativa en cuentas personales o servicios de almacenamiento no autorizados.</li>
  <li>Reportar inmediatamente cualquier incidente de seguridad, virus, pérdida de información o intento de acceso no autorizado.</li>
  <li>Realizar respaldos de la información cuando sea requerido por sus actividades o por el Departamento de TI.</li>
</ul>

<div class="section-title">6. Cuidado físico del equipo</div>
<p>El usuario deberá:</p>
<ul>
  <li>No dejar la laptop sin supervisión en lugares públicos.</li>
  <li>Guardar el equipo bajo llave cuando no se encuentre en uso.</li>
  <li>No dejar la laptop dentro de vehículos.</li>
  <li>Transportarla siempre como equipaje de mano durante viajes.</li>
  <li>Evitar golpes, caídas, humedad, líquidos, polvo excesivo y exposición directa al sol.</li>
  <li>No colocar objetos pesados sobre el equipo.</li>
  <li>No levantar la laptop sujetándola por la pantalla.</li>
  <li>Utilizar el equipo sobre superficies firmes que permitan una adecuada ventilación.</li>
  <li>No guardar la laptop en mochilas o estuches mientras permanezca encendida o en modo de suspensión.</li>
</ul>

<div class="section-title">7. Robo, pérdida o daño</div>
<p>En caso de robo, pérdida o daño del equipo, el usuario deberá:</p>
<ul>
  <li>Informar inmediatamente al Departamento de TI y Recursos Humanos.</li>
  <li>Presentar la denuncia correspondiente cuando aplique.</li>
  <li>Colaborar con la investigación del incidente.</li>
</ul>
<p>Cuando se determine que existió negligencia o incumplimiento de esta política, la empresa podrá aplicar las medidas administrativas correspondientes conforme a su reglamento interno y a la legislación vigente.</p>

<div class="section-title">8. Devolución del equipo</div>
<p>El equipo deberá ser devuelto cuando la empresa lo solicite o al término de la relación laboral, incluyendo todos los accesorios entregados, tales como:</p>
<ul>
  <li>Laptop.</li><li>Cargador.</li><li>Mouse.</li><li>Adaptadores y demás accesorios proporcionados.</li>
</ul>
<p>El equipo deberá entregarse en condiciones acordes con el desgaste normal derivado de su uso.</p>

<div class="section-title">9. Incumplimiento</div>
<p>El incumplimiento de esta política podrá dar lugar a acciones administrativas o disciplinarias conforme al Reglamento Interior de Trabajo y demás disposiciones aplicables.</p>

<div class="section-title">10. Aceptación</div>
<p>Declaro haber recibido el equipo descrito en este documento y manifiesto haber leído, comprendido y aceptado las políticas de uso establecidas por la empresa.</p>
<p>Me comprometo a utilizar el equipo de manera responsable, proteger la información corporativa y cumplir con las disposiciones descritas en este documento.</p>
<p>Asimismo, entiendo que el equipo es propiedad de la empresa y podrá ser administrado, monitoreado y auditado por el Departamento de Tecnologías de la Información cuando sea necesario para fines de seguridad, mantenimiento o cumplimiento de las políticas internas.</p>

<hr style="margin:24px 0;border-color:#ccc;" />

<div class="datos-block">
<h1 style="font-size:12pt;margin-bottom:14px;">DATOS DE ENTREGA</h1>

<table class="data-table">
  <tr><td>Nombre del colaborador:</td><td>${data.colaborador}</td></tr>
  <tr><td>Marca y modelo:</td><td>${data.marcaModelo}</td></tr>
  <tr><td>Número de serie:</td><td>${data.serie}</td></tr>
  <tr><td>Identificador (SKU) COFICAB:</td><td>${data.nombreEquipo}</td></tr>
</table>

<div class="section-title">Accesorios entregados</div>
<div style="margin-bottom:16px;">
  ${checkbox(data.accesorios.cargador, 'Cargador')}
  ${checkbox(data.accesorios.mouse, 'Mouse')}
  ${checkbox(data.accesorios.audifonos, 'Audífonos')}
  ${checkbox(data.accesorios.adaptador, 'Adaptador')}
  ${otroHtml}
</div>

<div class="section-title">Estado del equipo al momento de la entrega</div>
<p style="font-style:italic;padding:8px 12px;background:#f8f8f8;border:1px solid #ddd;margin-bottom:16px;">"${data.estado}"</p>

${photosHtml}

<p style="font-weight:bold;margin-bottom:30px;">
  Fecha de entrega:&nbsp;
  <u>&nbsp;${today.getDate().toString().padStart(2,'0')}&nbsp;</u> /
  <u>&nbsp;${(today.getMonth()+1).toString().padStart(2,'0')}&nbsp;</u> /
  <u>&nbsp;${today.getFullYear()}&nbsp;</u>
</p>
</div>

<div class="sig-block">
<div class="sig-row">
  <div class="sig-box"><strong>Firma del colaborador</strong><br>${data.colaborador}</div>
  <div class="sig-box"><strong>Nombre y firma del responsable de TI</strong></div>
</div>
</div>

<script>
  window.onload = function() {
    setTimeout(function() { window.print(); }, 500);
  };
</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    alert('Por favor permite ventanas emergentes en tu navegador para imprimir el documento.');
    return;
  }
  win.document.write(html);
  win.document.close();
}

// ─── Preview Component ───────────────────────────────────────────────────────
const DocumentPreview: React.FC<{
  item: Item;
  data: ResponsivaData;
  onBack: () => void;
}> = ({ item, data, onBack }) => {
  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    setPrinting(true);
    try {
      // Guardar en el historial (si item existe y es nuevo o no lo guardamos todavia)
      // Lo guardamos siempre que generamos una nueva impresión desde el formulario
      await responsivasApi.create({
        itemId: item.id,
        colaborador: data.colaborador,
        marcaModelo: data.marcaModelo,
        serie: data.serie,
        nombreEquipo: data.nombreEquipo,
        accesoriosJson: JSON.stringify(data.accesorios),
        observaciones: data.estado,
        photoUrlsJson: JSON.stringify(data.photoUrls),
      }).catch(err => {
        console.error("No se pudo guardar el historial de la responsiva", err);
      });

      await openPrintWindow(item, data);
    } finally {
      setPrinting(false);
    }
  };

  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

  const Row = ({ label, value }: { label: string; value: string }) => (
    <tr>
      <td style={{ padding: '5px 0', width: '38%', fontWeight: 'bold', verticalAlign: 'top' }}>{label}</td>
      <td style={{ padding: '5px 8px', borderBottom: '1px solid #000', color: value ? '#000' : '#999', fontStyle: value ? 'normal' : 'italic' }}>
        {value || '(sin datos)'}
      </td>
    </tr>
  );

  const CB = ({ checked, label }: { checked: boolean; label: string }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginRight: '14px' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, border: '1px solid #000', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>
        {checked ? '✓' : ''}
      </span>
      {label}
    </span>
  );

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2000, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem', background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, flexWrap: 'wrap' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
          <ChevronLeft size={15} /> Regresar
        </button>
        <span style={{ color: '#9ca3af', fontSize: '0.85rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Vista previa — <strong style={{ color: '#fff' }}>{data.colaborador}</strong>
        </span>
        <button
          onClick={handlePrint}
          className="btn btn-primary"
          disabled={printing}
          style={{ padding: '0.5rem 1.1rem', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Printer size={16} />
          {printing ? 'Preparando...' : 'Imprimir / Guardar PDF'}
        </button>
      </div>

      {/* Scrollable preview */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#374151', padding: '1rem' }}>
        <div style={{ background: '#fff', color: '#000', maxWidth: '820px', margin: '0 auto', padding: '2cm', fontFamily: 'Arial, sans-serif', fontSize: '11pt', lineHeight: 1.5, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: 10, marginBottom: 18 }}>
            <div><strong style={{ fontSize: '14pt', letterSpacing: 1 }}>COFICAB</strong><br/><span style={{ fontSize: '9pt', color: '#666' }}>Departamento de Tecnologías de la Información</span></div>
            <div style={{ textAlign: 'right', fontSize: '10pt', color: '#555' }}>Fecha: {dateStr}<br/>SKU: {item.sku}</div>
          </div>

          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13pt', marginBottom: 18, textTransform: 'uppercase' }}>
            Responsiva de Asignación y Política de Uso de Equipo de Cómputo Portátil
          </div>

          {/* Policies summary for preview */}
          <div style={{ background: '#f8f8f8', border: '1px solid #ddd', padding: '10px 14px', borderRadius: 4, marginBottom: 18, fontSize: '10pt', color: '#555' }}>
            <em>El documento impreso incluirá los 10 puntos completos de políticas (Objetivo, Alcance, Responsabilidades, Uso, Protección de información, Cuidado físico, Robo/pérdida, Devolución, Incumplimiento y Aceptación).</em>
          </div>

          <hr style={{ margin: '18px 0', borderColor: '#ccc' }} />

          {/* DATOS DE ENTREGA - highlighted */}
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', marginBottom: 14, textTransform: 'uppercase' }}>
            Datos de Entrega
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14 }}>
            <tbody>
              <Row label="Nombre del colaborador:" value={data.colaborador} />
              <Row label="Marca y modelo:" value={data.marcaModelo} />
              <Row label="Número de serie:" value={data.serie} />
              <Row label="Identificador (SKU):" value={data.nombreEquipo} />
            </tbody>
          </table>

          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Accesorios entregados</div>
          <div style={{ marginBottom: 16 }}>
            <CB checked={data.accesorios.cargador} label="Cargador" />
            <CB checked={data.accesorios.mouse} label="Mouse" />
            <CB checked={data.accesorios.audifonos} label="Audífonos" />
            <CB checked={data.accesorios.adaptador} label="Adaptador" />
            {data.accesorios.otro && <CB checked label={`Otro: ${data.accesorios.otroText}`} />}
          </div>

          <div style={{ fontWeight: 'bold', marginBottom: 6 }}>Estado del equipo al momento de la entrega</div>
          <div style={{ fontStyle: 'italic', padding: '8px 12px', background: '#f8f8f8', border: '1px solid #ddd', marginBottom: 16 }}>
            "{data.estado}"
          </div>

          {data.photoUrls.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Evidencia Fotográfica:</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {data.photoUrls.map((url, i) => (
                  <img key={i} src={url} alt={`Evidencia ${i+1}`} style={{ height: 130, objectFit: 'contain', border: '1px solid #ccc', borderRadius: 4 }} />
                ))}
              </div>
            </div>
          )}

          <div style={{ fontWeight: 'bold', marginBottom: 50 }}>
            Fecha de entrega: <u>&nbsp;{today.getDate().toString().padStart(2,'0')}&nbsp;</u> / <u>&nbsp;{(today.getMonth()+1).toString().padStart(2,'0')}&nbsp;</u> / <u>&nbsp;{today.getFullYear()}&nbsp;</u>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', gap: '2rem' }}>
            <div style={{ textAlign: 'center', flex: 1, borderTop: '1px solid #000', paddingTop: 6 }}>
              <strong>Firma del colaborador</strong><br/><span style={{ fontSize: '10pt' }}>{data.colaborador}</span>
            </div>
            <div style={{ textAlign: 'center', flex: 1, borderTop: '1px solid #000', paddingTop: 6 }}>
              <strong>Nombre y firma del responsable de TI</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Modal ──────────────────────────────────────────────────────────────
export const ResponsivaModal: React.FC<ResponsivaModalProps> = ({ isOpen, onClose, item }) => {
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [generatedData, setGeneratedData] = useState<ResponsivaData | null>(null);

  const [colaborador, setColaborador] = useState('');
  const [marcaModelo, setMarcaModelo] = useState('');
  const [serie, setSerie] = useState('');
  const [nombreEquipo, setNombreEquipo] = useState('');
  const [accesorios, setAccesorios] = useState({ cargador: false, mouse: false, audifonos: false, adaptador: false, otro: false, otroText: '' });
  const [estado, setEstado] = useState('Buen estado general. Funciona correctamente.');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && item) {
      setColaborador(item.assignedTo || '');
      setMarcaModelo(item.model ? `${item.name} (${item.model})` : item.name || '');
      setSerie(item.serialNumber || '');
      setNombreEquipo(item.sku || '');
      setAccesorios({ cargador: false, mouse: false, audifonos: false, adaptador: false, otro: false, otroText: '' });
      setEstado('Buen estado general. Funciona correctamente.');
      setPhotoUrls([]);
      setStep('form');
      setGeneratedData(null);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newUrls = Array.from(e.target.files).map(f => URL.createObjectURL(f));
      setPhotoUrls(prev => [...prev, ...newUrls].slice(0, 4));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Capture all state values at the time of submit
    const snapshot: ResponsivaData = {
      colaborador: colaborador.trim(),
      marcaModelo: marcaModelo.trim(),
      serie: serie.trim(),
      nombreEquipo: nombreEquipo.trim(),
      accesorios: { ...accesorios },
      estado: estado.trim(),
      photoUrls: [...photoUrls]
    };
    setGeneratedData(snapshot);
    setStep('preview');
  };

  if (step === 'preview' && generatedData) {
    return <DocumentPreview item={item} data={generatedData} onBack={() => setStep('form')} />;
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#0f172a', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '600px', maxHeight: '94vh', overflowY: 'auto', border: '1px solid var(--border-highlight)' }}>

        {/* Header */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#0f172a', zIndex: 10 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
            <FileText size={18} /> Configurar Responsiva
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {/* Equipment data */}
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', padding: '0.9rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
              Datos del Equipo (editables)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Nombre del Colaborador *</label>
                <input type="text" className="form-input" value={colaborador}
                  onChange={e => setColaborador(e.target.value)}
                  placeholder="Ej. Juan Pérez" required />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>
                  Marca y Modelo * <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 400 }}>(ej. Dell Latitude 5550)</span>
                </label>
                <input type="text" className="form-input" value={marcaModelo}
                  onChange={e => setMarcaModelo(e.target.value)}
                  placeholder="ej. Dell Latitude 5550" required
                  style={!marcaModelo.trim() ? { borderColor: 'rgba(239,68,68,0.6)' } : undefined}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>
                    Número de Serie *
                  </label>
                  <input type="text" className="form-input" value={serie}
                    onChange={e => setSerie(e.target.value)}
                    placeholder="ej. PF-54895X" required
                    style={!serie.trim() ? { borderColor: 'rgba(239,68,68,0.6)' } : undefined}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>SKU / Identificador</label>
                  <input type="text" className="form-input" value={nombreEquipo}
                    onChange={e => setNombreEquipo(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Accessories */}
          <div>
            <label className="form-label">Accesorios Entregados</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              {([['cargador', 'Cargador'], ['mouse', 'Mouse'], ['audifonos', 'Audífonos'], ['adaptador', 'Adaptador']] as const).map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={accesorios[key]} onChange={e => setAccesorios({ ...accesorios, [key]: e.target.checked })} />
                  {label}
                </label>
              ))}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', gridColumn: '1 / -1' }}>
                <input type="checkbox" checked={accesorios.otro} onChange={e => setAccesorios({ ...accesorios, otro: e.target.checked })} />
                Otro
              </label>
              {accesorios.otro && (
                <input type="text" className="form-input" style={{ gridColumn: '1 / -1' }} placeholder="Especificar..."
                  value={accesorios.otroText} onChange={e => setAccesorios({ ...accesorios, otroText: e.target.value })} required={accesorios.otro} />
              )}
            </div>
          </div>

          {/* State */}
          <div>
            <label className="form-label">Estado del Equipo al Momento de la Entrega</label>
            <textarea className="form-input" style={{ minHeight: '72px', resize: 'vertical' }}
              value={estado} onChange={e => setEstado(e.target.value)} required />
          </div>

          {/* Photos */}
          <div>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Evidencia Fotográfica (Max 4)</span>
              <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{photoUrls.length}/4</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '0.4rem' }}>
              {photoUrls.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={url} alt={`E${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => setPhotoUrls(p => p.filter((_, i) => i !== idx))}
                    style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', padding: '3px', display: 'flex' }}>
                    <X size={11} />
                  </button>
                </div>
              ))}
              {photoUrls.length < 4 && (
                <label style={{ aspectRatio: '1', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9ca3af', gap: '0.2rem' }}>
                  <Camera size={20} />
                  <span style={{ fontSize: '0.68rem' }}>Agregar</span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} capture="environment" />
                </label>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', paddingTop: '0.25rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, display: 'flex', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }}>
              <Eye size={17} /> Vista Previa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
