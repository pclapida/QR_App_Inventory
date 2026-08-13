import React, { useRef, useState } from 'react';
import { FileSpreadsheet, Upload, CheckCircle2, X } from 'lucide-react';
import api from '../../services/api';

interface ExcelImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ onClose, onSuccess }) => {
  const [importing, setImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{ message: string; count: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/items/import-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setImportResult({
        message: res.data.message || 'Importación completada con éxito',
        count: res.data.count || 0,
        errors: res.data.errors || []
      });
      onSuccess();
    } catch (err: any) {
      console.error('Error al importar Excel:', err);
      const errMsg = err.response?.data?.error || 'Error al procesar el archivo Excel en el servidor';
      setImportResult({
        message: errMsg,
        count: 0,
        errors: [errMsg]
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileSpreadsheet size={24} style={{ color: 'var(--coficab-copper)' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Importar Inventario desde Excel
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Seleccione un archivo de hoja de cálculo <strong>.xlsx, .xls o .csv</strong>. El sistema leerá e insertará automáticamente todos los equipos con sus nombres, modelos, números de serie, stock, área e IP, generando sus códigos QR.
        </p>

        <div style={{
          background: 'var(--bg-input)',
          border: '2px dashed var(--border-copper)',
          borderRadius: 'var(--radius-md)',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            ref={fileInputRef}
            onChange={handleExcelUpload}
            style={{ display: 'none' }}
          />

          <Upload size={40} style={{ color: 'var(--coficab-copper)', margin: '0 auto 0.75rem auto' }} />

          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            {importing ? 'Procesando e insertando filas de Excel...' : 'Cargar Archivo de Excel'}
          </h4>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Soporta encabezados: Nombre, Modelo, Serie, Stock, Área, IP, Garantía, Fallas, Observaciones
          </p>

          <button
            className="btn btn-primary btn-lg"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            style={{ background: 'linear-gradient(135deg, #d97706 0%, #b07238 100%)' }}
          >
            <FileSpreadsheet size={20} />
            {importing ? 'Importando Datos...' : 'Seleccionar Archivo Excel (.xlsx)'}
          </button>
        </div>

        {importResult && (
          <div style={{
            padding: '1rem',
            background: importResult.count > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: importResult.count > 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: importResult.count > 0 ? '#10b981' : '#ef4444',
            fontSize: '0.9rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, marginBottom: '0.3rem' }}>
              <CheckCircle2 size={20} /> {importResult.message}
            </div>
            {importResult.errors && importResult.errors.length > 0 && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#f43f5e' }}>
                <strong>Detalles / Observaciones:</strong>
                <ul>
                  {importResult.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
