import React from 'react';
import { X } from 'lucide-react';
import { ChecklistPage } from '../pages/ChecklistPage';

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemName: string;
  itemSku: string;
  onCompleted: () => void; // Called when checklist is successfully finished
}

export const ChecklistModal: React.FC<ChecklistModalProps> = ({
  isOpen,
  onClose,
  itemId,
  itemName,
  itemSku,
  onCompleted
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        borderRadius: '16px',
        animation: 'scaleUp 0.2s ease',
        background: 'var(--bg-main)', // Solid background for inner content
        padding: '2rem'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.2rem',
            right: '1.2rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.4rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Cerrar (Cancelar)"
        >
          <X size={20} />
        </button>

        <ChecklistPage
          itemId={itemId}
          itemName={itemName}
          itemSku={itemSku}
          onCompleted={() => {
            onCompleted();
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};
