import React from 'react';
import { createRoot } from 'react-dom/client';
import { QRCodeSVG } from 'qrcode.react';
import { Item } from '../services/api';

const LabelRenderer: React.FC<{ items: Item[] }> = ({ items }) => {
  return (
    <>
      <style>{`
        @page {
          size: 50mm 30mm;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, Helvetica, sans-serif;
          background: #fff;
        }
        * {
          box-sizing: border-box;
        }
        .label-page {
          width: 50mm;
          height: 30mm;
          page-break-after: always;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2mm;
          overflow: hidden;
        }
        .label-page:last-child {
          page-break-after: auto;
        }
        .label-content {
          display: flex;
          align-items: center;
          gap: 2mm;
          width: 100%;
          height: 100%;
        }
        .qr-section {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22mm;
          height: 22mm;
          flex-shrink: 0;
        }
        .info-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow: hidden;
        }
        .info-title {
          font-size: 5pt;
          color: #555;
          margin: 0;
          line-height: 1.1;
        }
        .info-value {
          font-size: 6pt;
          font-weight: bold;
          color: #000;
          margin: 0 0 1.5mm 0;
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .info-value:last-child {
          margin-bottom: 0;
        }
      `}</style>

      {items.map((item, index) => (
        <div key={`${item.id}-${index}`} className="label-page">
          <div className="label-content">
            <div className="qr-section">
              <QRCodeSVG
                value={item.qrCodePayload}
                size={80} /* Approximate size in pixels to fit 22mm */
                level="M"
                includeMargin={false}
              />
            </div>
            <div className="info-section">
              <div className="info-title">Equipo:</div>
              <div className="info-value">{item.name}</div>
              
              <div className="info-title">Modelo:</div>
              <div className="info-value">{item.model || 'N/A'}</div>

              <div className="info-title">S/N:</div>
              <div className="info-value">{item.serialNumber || 'N/A'}</div>

              <div className="info-title">SKU:</div>
              <div className="info-value">{item.sku}</div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export const printQRLabels = (items: Item[]) => {
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
      <title>Impresión de Etiquetas QR</title>
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
    
    // We pass a callback to print after rendering, but React 18 createRoot doesn't support a render callback directly.
    // So we use setTimeout.
    root.render(<LabelRenderer items={items} />);

    setTimeout(() => {
      win.print();
    }, 800); // Give it enough time to render SVG and apply CSS
  }
};
