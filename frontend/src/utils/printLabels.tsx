import React from 'react';
import { createRoot } from 'react-dom/client';
import { QRCodeSVG } from 'qrcode.react';
import { Item } from '../services/api';

export type LabelSizeOption = 'brother-24' | '50x25' | '50x30' | '75x50';

interface LabelRendererProps {
  items: Item[];
  size?: LabelSizeOption;
}

const LabelRenderer: React.FC<LabelRendererProps> = ({ items, size = 'brother-24' }) => {
  // Determine page dimensions based on selected format
  let pageWidth = '70mm';
  let pageHeight = '24mm';
  let qrSize = 75; // px
  let isBrother = false;

  if (size === 'brother-24') {
    // Brother P-touch exige configuración vertical (Portrait).
    // Ancho real imprimible de cinta 24mm = 18.1mm.
    // Largo extendido a 90mm para que las letras quepan gigantes.
    pageWidth = '18mm';
    pageHeight = '90mm';
    qrSize = 65;
    isBrother = true;
  } else if (size === '50x25') {
    pageWidth = '50mm';
    pageHeight = '25mm';
    qrSize = 70;
  } else if (size === '50x30') {
    pageWidth = '50mm';
    pageHeight = '30mm';
    qrSize = 85;
  } else if (size === '75x50') {
    pageWidth = '75mm';
    pageHeight = '50mm';
    qrSize = 140;
  }

  return (
    <>
      <style>{`
        @page {
          size: ${pageWidth} ${pageHeight};
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          background: #fff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        * {
          box-sizing: border-box;
        }
        .label-page {
          width: ${pageWidth};
          height: ${pageHeight};
          page-break-after: always;
          position: relative;
          overflow: hidden;
        }
        .label-page:last-child {
          page-break-after: auto;
        }
        .rotated-container {
          ${isBrother ? `
            width: 90mm;
            height: 18mm;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(90deg);
            display: flex;
            align-items: center;
            justify-content: center;
          ` : `
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          `}
        }
        .label-content {
          display: flex;
          align-items: center;
          gap: ${isBrother ? '3mm' : '2.2mm'};
          width: ${isBrother ? '90mm' : '100%'};
          height: ${isBrother ? '18mm' : '100%'};
          padding: ${isBrother ? '0mm 1mm' : '1.2mm 2mm'};
        }
        .qr-section {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          flex-shrink: 0;
        }
        .info-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow: hidden;
          line-height: ${isBrother ? '1.05' : '1.15'};
        }
        .corp-tag {
          font-size: ${isBrother ? '6.5pt' : '5.5pt'};
          font-weight: 900;
          letter-spacing: 0.5px;
          color: #000;
          margin: 0;
          text-transform: uppercase;
        }
        .sku-tag {
          font-size: ${isBrother ? '11pt' : '8pt'};
          font-weight: 900;
          color: #000;
          margin: ${isBrother ? '0.5mm 0' : '0.5mm 0'};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .item-name {
          font-size: ${isBrother ? '8pt' : '6pt'};
          font-weight: 900;
          color: #000;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0;
        }
        .item-sub {
          font-size: ${isBrother ? '6.5pt' : '5pt'};
          font-weight: 900;
          color: #000;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: ${isBrother ? '0.3mm 0 0 0' : '0.3mm 0 0 0'};
        }
      `}</style>

      {items.map((item, index) => (
        <div key={`${item.id}-${index}`} className="label-page">
          <div className="rotated-container">
            <div className="label-content">
              <div className="qr-section">
                <QRCodeSVG
                  value={item.qrCodePayload || `INV-${item.id}`}
                  size={qrSize}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="info-section">
                <div className="corp-tag">COFDG-IT</div>
                <div className="sku-tag">{item.sku}</div>
                {item.assignedTo && (
                  <div className="item-name" style={{ color: isBrother ? '#000' : '#002b90' }}>
                    Asignado a: {item.assignedTo}
                  </div>
                )}
                <div className="item-name">{item.name}</div>
                {item.model && <div className="item-sub">Mod: {item.model}</div>}
                {item.serialNumber && <div className="item-sub">S/N: {item.serialNumber}</div>}
                <div className="item-sub" style={{ fontWeight: isBrother ? 900 : 600, color: isBrother ? '#000' : '#555' }}>
                  {item.plant || 'Planta 2'} {item.area ? `• ${item.area}` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export const printQRLabels = (items: Item[], size: LabelSizeOption = 'brother-24') => {
  if (items.length === 0) return;

  const win = window.open('', '_blank');
  if (!win) {
    alert('Por favor, permite las ventanas emergentes (pop-ups) en tu navegador para poder imprimir.');
    return;
  }

  // Create base HTML document
  win.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Etiquetas QR Brother / Zebra</title>
    </head>
    <body>
      <div id="print-root"></div>
    </body>
    </html>
  `);
  win.document.close();

  // Render React component into the new window
  const container = win.document.getElementById('print-root');
  if (container) {
    const root = createRoot(container);
    root.render(<LabelRenderer items={items} size={size} />);

    setTimeout(() => {
      win.print();
    }, 600);
  }
};
