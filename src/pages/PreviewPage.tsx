import React from 'react';
import { SchemaFormData } from '@/types/schema';
import PrintDocument from '@/components/editor/PrintDocument';
import Icon from '@/components/ui/icon';
import { exportToExcel } from '@/utils/exportExcel';

interface Props {
  data: SchemaFormData;
  schemaName: string;
  onClose: () => void;
  onPrint: () => void;
}

const PreviewPage: React.FC<Props> = ({ data, schemaName, onClose, onPrint }) => {
  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'hsl(var(--background))' }}>

      {/* Панель управления */}
      <div
        className="flex items-center gap-3 px-4 py-2 border-b border-border flex-shrink-0"
        style={{ background: 'hsl(var(--toolbar-bg))' }}
      >
        <button
          className="flex items-center gap-1.5 text-sm hover:text-foreground transition-colors"
          style={{ color: 'hsl(var(--muted-foreground))' }}
          onClick={onClose}
        >
          <Icon name="ChevronLeft" size={15} />
          Назад
        </button>

        <div className="h-4 border-l border-border" />

        <span className="text-sm font-medium flex-1" style={{ color: 'hsl(var(--foreground))' }}>
          Предпросмотр документа
        </span>

        <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
          A4 / Альбомная
        </span>

        <button
          className="flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium transition-all hover:opacity-80"
          style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
          onClick={() => exportToExcel(data, schemaName)}
        >
          <Icon name="FileSpreadsheet" size={14} />
          Excel
        </button>

        <button
          className="flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium transition-all hover:opacity-80"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          onClick={onPrint}
        >
          <Icon name="Printer" size={14} />
          Печать / PDF
        </button>
      </div>

      {/* Область предпросмотра */}
      <div
        className="flex-1 overflow-auto flex items-start justify-center py-8"
        style={{ background: 'hsl(216 20% 6%)' }}
      >
        {/* Лист А4 альбомный — соотношение 297:210 */}
        <div
          style={{
            width: '90vw',
            maxWidth: 1050,
            aspectRatio: '297 / 210',
            background: '#ffffff',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              padding: '4% 5%',
              boxSizing: 'border-box',
              transformOrigin: 'top left',
            }}
          >
            <PrintDocument data={data} schemaName={schemaName} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPage;