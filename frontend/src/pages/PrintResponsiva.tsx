import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ResponsivaData } from '../components/ResponsivaModal';
import { Item } from '../services/api';
import { CoficabLogo } from '../components/CoficabLogo';

export const PrintResponsiva: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as { item: Item; data: ResponsivaData } | null;

  useEffect(() => {
    if (!state) {
      navigate('/inventory');
      return;
    }
    // Auto-trigger print dialog after a brief delay to allow images to load
    const timer = setTimeout(() => {
      window.print();
    }, 1000);
    return () => clearTimeout(timer);
  }, [state, navigate]);

  if (!state) return null;

  const { item, data } = state;
  const today = new Date();
  const dateString = `${today.getDate().toString().padStart(2, '0')} / ${(today.getMonth() + 1).toString().padStart(2, '0')} / ${today.getFullYear()}`;

  return (
    <div style={{
      background: '#ffffff',
      color: '#000000',
      minHeight: '100vh',
      padding: '2cm',
      fontFamily: '"Arial", sans-serif',
      fontSize: '11pt',
      lineHeight: '1.4'
    }}>
      <style>
        {`
          @media print {
            body { background: white; margin: 0; padding: 0; }
            #root > nav, .btn, .main-layout-nav, .sidebar { display: none !important; }
            .print-page { padding: 0; margin: 0; }
            @page { margin: 1.5cm; }
            .page-break { page-break-before: always; }
            .no-break { page-break-inside: avoid; }
          }
          .doc-title { text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 20px; text-transform: uppercase; }
          .section-title { font-weight: bold; font-size: 12pt; margin-top: 20px; margin-bottom: 10px; }
          ul { margin-top: 5px; padding-left: 20px; }
          li { margin-bottom: 4px; text-align: justify; }
          p { text-align: justify; margin-bottom: 10px; }
          .signature-box { border-top: 1px solid #000; width: 300px; text-align: center; margin-top: 50px; padding-top: 5px; }
          .checkbox { display: inline-block; width: 14px; height: 14px; border: 1px solid #000; margin-right: 5px; position: relative; top: 2px; }
          .checked::after { content: '✓'; position: absolute; top: -4px; left: 1px; font-size: 12px; font-weight: bold; }
        `}
      </style>

      <div className="print-page">
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px' }}>
          <CoficabLogo height={40} themeMode="light" />
          <div style={{ textAlign: 'right', fontSize: '10pt', color: '#555' }}>
            Fecha: {dateString}
          </div>
        </div>

        <div className="doc-title">
          RESPONSIVA DE ASIGNACIÓN Y POLÍTICA DE USO DE EQUIPO DE CÓMPUTO PORTÁTIL
        </div>

        <div className="section-title">1. Objetivo</div>
        <p>Establecer las responsabilidades y lineamientos para el uso adecuado de los equipos de cómputo portátiles propiedad de la empresa, con el fin de proteger los activos tecnológicos, preservar la información corporativa y reducir los riesgos de pérdida, robo, daño o uso no autorizado.</p>

        <div className="section-title">2. Alcance</div>
        <p>Esta política aplica a todo el personal que reciba un equipo portátil propiedad de la empresa para el desempeño de sus funciones.</p>

        <div className="section-title">3. Responsabilidades del usuario</div>
        <p>Al recibir un equipo de cómputo, el usuario se compromete a:</p>
        <ul>
          <li>Utilizar el equipo exclusivamente para actividades laborales.</li>
          <li>Mantener el equipo en buen estado físico y de funcionamiento.</li>
          <li>Proteger la información almacenada en el equipo.</li>
          <li>Resguardar el equipo en todo momento.</li>
          <li>Reportar inmediatamente cualquier incidente relacionado con el equipo.</li>
          <li>Cumplir con las políticas de seguridad establecidas por la empresa.</li>
        </ul>

        <div className="section-title">4. Uso del equipo</div>
        <p>El usuario deberá cumplir con las siguientes disposiciones:</p>
        <ul>
          <li>No instalar software sin autorización del Departamento de TI.</li>
          <li>No modificar la configuración de hardware o software.</li>
          <li>No desactivar antivirus, herramientas de seguridad, cifrado del disco o aplicaciones administradas por TI.</li>
          <li>No compartir el equipo con otras personas sin autorización.</li>
          <li>No retirar etiquetas de inventario o números de activo.</li>
          <li>Permitir que únicamente el personal autorizado de TI realice mantenimiento, reparaciones o actualizaciones.</li>
        </ul>

        <div className="section-title">5. Protección de la información</div>
        <p>Para proteger la información corporativa, el usuario deberá:</p>
        <ul>
          <li>Mantener la confidencialidad de toda la información de la empresa.</li>
          <li>No compartir contraseñas.</li>
          <li>Bloquear la sesión al ausentarse de su lugar de trabajo.</li>
          <li>No almacenar información corporativa en cuentas personales o servicios de almacenamiento no autorizados.</li>
          <li>Reportar inmediatamente cualquier incidente de seguridad, virus, pérdida de información o intento de acceso no autorizado.</li>
          <li>Realizar respaldos de la información cuando sea requerido por sus actividades o por el Departamento de TI.</li>
        </ul>

        <div className="section-title">6. Cuidado físico del equipo</div>
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

        <div className="section-title">7. Robo, pérdida o daño</div>
        <p>En caso de robo, pérdida o daño del equipo, el usuario deberá:</p>
        <ul>
          <li>Informar inmediatamente al Departamento de TI y Recursos Humanos.</li>
          <li>Presentar la denuncia correspondiente cuando aplique.</li>
          <li>Colaborar con la investigación del incidente.</li>
        </ul>
        <p>Cuando se determine que existió negligencia o incumplimiento de esta política, la empresa podrá aplicar las medidas administrativas correspondientes conforme a su reglamento interno y a la legislación vigente.</p>

        <div className="page-break"></div>

        <div className="section-title">8. Devolución del equipo</div>
        <p>El equipo deberá ser devuelto cuando la empresa lo solicite o al término de la relación laboral, incluyendo todos los accesorios entregados, tales como:</p>
        <ul>
          <li>Laptop.</li>
          <li>Cargador.</li>
          <li>Mouse.</li>
          <li>Adaptadores y demás accesorios proporcionados.</li>
        </ul>
        <p>El equipo deberá entregarse en condiciones acordes con el desgaste normal derivado de su uso.</p>

        <div className="section-title">9. Incumplimiento</div>
        <p>El incumplimiento de esta política podrá dar lugar a acciones administrativas o disciplinarias conforme al Reglamento Interior de Trabajo y demás disposiciones aplicables.</p>

        <div className="section-title">10. Aceptación</div>
        <p>Declaro haber recibido el equipo descrito en este documento y manifiesto haber leído, comprendido y aceptado las políticas de uso establecidas por la empresa.</p>
        <p>Me comprometo a utilizar el equipo de manera responsable, proteger la información corporativa y cumplir con las disposiciones descritas en este documento.</p>
        <p>Asimismo, entiendo que el equipo es propiedad de la empresa y podrá ser administrado, monitoreado y auditado por el Departamento de Tecnologías de la Información cuando sea necesario para fines de seguridad, mantenimiento o cumplimiento de las políticas internas.</p>
        
        <hr style={{ margin: '30px 0', borderColor: '#ccc' }} />

        <div className="no-break">
          <div className="doc-title" style={{ fontSize: '12pt', marginBottom: '15px' }}>DATOS DE ENTREGA</div>
          
          <table style={{ width: '100%', marginBottom: '15px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '5px 0', width: '30%', fontWeight: 'bold' }}>Nombre del colaborador:</td>
                <td style={{ padding: '5px 0', borderBottom: '1px solid #000' }}>{data.colaborador}</td>
              </tr>
              <tr>
                <td style={{ padding: '5px 0', fontWeight: 'bold' }}>Marca y modelo:</td>
                <td style={{ padding: '5px 0', borderBottom: '1px solid #000' }}>{item.model ? `${item.name} (${item.model})` : item.name}</td>
              </tr>
              <tr>
                <td style={{ padding: '5px 0', fontWeight: 'bold' }}>Número de serie:</td>
                <td style={{ padding: '5px 0', borderBottom: '1px solid #000' }}>{item.serialNumber || 'N/A'}</td>
              </tr>
              <tr>
                <td style={{ padding: '5px 0', fontWeight: 'bold' }}>Identificador COFICAB (SKU):</td>
                <td style={{ padding: '5px 0', borderBottom: '1px solid #000' }}>{item.sku}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Accesorios entregados</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            <div><span className={`checkbox ${data.accesorios.cargador ? 'checked' : ''}`}></span> Cargador</div>
            <div><span className={`checkbox ${data.accesorios.mouse ? 'checked' : ''}`}></span> Mouse</div>
            <div><span className={`checkbox ${data.accesorios.audifonos ? 'checked' : ''}`}></span> Audífonos</div>
            <div><span className={`checkbox ${data.accesorios.adaptador ? 'checked' : ''}`}></span> Adaptador</div>
            {data.accesorios.otro && (
              <div style={{ gridColumn: '1 / -1' }}>
                <span className="checkbox checked"></span> Otro: <u>{data.accesorios.otroText}</u>
              </div>
            )}
          </div>

          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Estado del equipo al momento de la entrega</div>
          <p style={{ fontStyle: 'italic', background: '#f8f8f8', padding: '10px', border: '1px solid #ddd' }}>
            "{data.estado}"
          </p>

          {data.photoUrls && data.photoUrls.length > 0 && (
            <div style={{ marginTop: '15px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Evidencia Fotográfica:</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {data.photoUrls.map((url, i) => (
                  <img key={i} src={url} alt={`Evidencia ${i+1}`} style={{ height: '150px', objectFit: 'contain', border: '1px solid #000', padding: '2px' }} />
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px', fontWeight: 'bold' }}>
            Fecha de entrega: <u>&nbsp;&nbsp;{today.getDate().toString().padStart(2, '0')}&nbsp;&nbsp;</u> / <u>&nbsp;&nbsp;{(today.getMonth() + 1).toString().padStart(2, '0')}&nbsp;&nbsp;</u> / <u>&nbsp;&nbsp;{today.getFullYear()}&nbsp;&nbsp;</u>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', gap: '2.5rem', marginTop: '30px' }}>
            <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ height: 75, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', width: '100%', marginBottom: 2 }}>
                {data.signatureData ? (
                  <img
                    src={data.signatureData}
                    alt="Firma del colaborador"
                    style={{ maxHeight: '70px', maxWidth: '220px', objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ height: 70 }}></div>
                )}
              </div>
              <div style={{ width: '100%', borderTop: '1px solid #000', marginBottom: 6 }}></div>
              <strong>Firma del colaborador</strong>
              <span style={{ fontSize: '10pt', marginTop: 2 }}>{data.colaborador}</span>
            </div>
            <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ height: 75, width: '100%', marginBottom: 2 }}></div>
              <div style={{ width: '100%', borderTop: '1px solid #000', marginBottom: 6 }}></div>
              <strong>Nombre y firma del responsable de TI</strong>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
