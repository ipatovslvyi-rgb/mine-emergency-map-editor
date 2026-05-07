import React, { useRef, useState } from 'react';
import { SchemaFormData } from '@/types/schema';
import PrintDocument from '@/components/editor/PrintDocument';
import Icon from '@/components/ui/icon';
import { exportToExcel } from '@/utils/exportExcel';
import html2canvas from 'html2canvas';

interface Props {
  data: SchemaFormData;
  schemaName: string;
  onClose: () => void;
  onPrint: () => void;
  isDemo?: boolean;
  onActivate?: () => void;
}

const PreviewPage: React.FC<Props> = ({ data, schemaName, onClose, onPrint, isDemo, onActivate }) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const svgUrlToBase64 = (url: string): string => {
    if (url.startsWith('data:image/svg+xml;utf8,')) {
      const svgStr = decodeURIComponent(url.slice('data:image/svg+xml;utf8,'.length));
      const b64 = btoa(unescape(encodeURIComponent(svgStr)));
      return `data:image/svg+xml;base64,${b64}`;
    }
    return url;
  };

  const fetchImageAsBase64 = (url: string): Promise<string> =>
    new Promise((resolve) => {
      if (url.startsWith('data:image/svg+xml;utf8,')) { resolve(svgUrlToBase64(url)); return; }
      if (url.startsWith('data:')) { resolve(url); return; }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth || 64;
        c.height = img.naturalHeight || 64;
        c.getContext('2d')!.drawImage(img, 0, 0);
        try { resolve(c.toDataURL()); } catch { resolve(url); }
      };
      img.onerror = () => resolve(url);
      img.src = url + (url.includes('?') ? '&' : '?') + '_nc=' + Date.now();
    });

  const handleDownloadImage = async () => {
    if (!sheetRef.current) return;
    setExporting(true);
    try {
      await document.fonts.ready;

      // Собираем все уникальные URL картинок
      const allUrls = new Set<string>();
      data.legendItems.forEach(i => i.imageUrl && allUrls.add(i.imageUrl));
      (data.placedSymbols ?? []).forEach(s => s.imageUrl && allUrls.add(s.imageUrl));
      if (data.schemaImageUrl) allUrls.add(data.schemaImageUrl);

      const b64Map: Record<string, string> = {};
      await Promise.all([...allUrls].map(async url => { b64Map[url] = await fetchImageAsBase64(url); }));

      // Создаём offscreen div с фиксированным размером A4 альбомным (px при 96dpi = 297mm*3.7795 x 210mm*3.7795)
      const PW = 3508; const PH = 2480; // A4 альбомный 300dpi
      const container = document.createElement('div');
      container.style.cssText = `position:fixed;left:-9999px;top:0;width:${PW}px;height:${PH}px;background:#fff;overflow:hidden;`;
      document.body.appendChild(container);

      // Рендерим через ReactDOM в offscreen
      const { createRoot } = await import('react-dom/client');
      const { default: PD } = await import('@/components/editor/PrintDocument');
      const React2 = await import('react');

      // Заменяем imageUrl на base64 в данных
      const patchedData = {
        ...data,
        schemaImageUrl: data.schemaImageUrl ? (b64Map[data.schemaImageUrl] || data.schemaImageUrl) : data.schemaImageUrl,
        legendItems: data.legendItems.map(i => ({ ...i, imageUrl: b64Map[i.imageUrl] || i.imageUrl })),
        placedSymbols: (data.placedSymbols ?? []).map(s => ({ ...s, imageUrl: b64Map[s.imageUrl] || s.imageUrl })),
      };

      // Внутренний div с паддингами как в preview
      const inner = document.createElement('div');
      inner.style.cssText = `position:absolute;inset:0;padding:${PH*0.0952}px ${PW*0.0337}px ${PH*0.0952}px ${PW*0.101}px;box-sizing:border-box;`;
      container.appendChild(inner);

      const root = createRoot(inner);
      await new Promise<void>(res => {
        root.render(React2.createElement(PD, { data: patchedData, schemaName, scale: PW / 700 }));
        setTimeout(res, 300);
      });

      const canvas = await html2canvas(container, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: PW,
        height: PH,
      });

      root.unmount();
      document.body.removeChild(container);

      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${schemaName || 'схема'}_${data.date.replace(/\./g, '-')}.png`;
      a.click();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'hsl(var(--background))' }}>

      {/* Панель управления */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-border flex-shrink-0 flex-wrap"
        style={{ background: 'hsl(var(--toolbar-bg))' }}
      >
        <button
          className="flex items-center gap-1.5 text-sm hover:text-foreground transition-colors flex-shrink-0"
          style={{ color: 'hsl(var(--muted-foreground))' }}
          onClick={onClose}
        >
          <Icon name="ChevronLeft" size={15} />
          Назад
        </button>

        <div className="h-4 border-l border-border hidden sm:block" />

        <span className="text-sm font-medium flex-1 hidden sm:block" style={{ color: 'hsl(var(--foreground))' }}>
          Предпросмотр документа
        </span>

        <span className="text-xs px-2 py-0.5 rounded hidden sm:inline" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
          A4 / Альбомная
        </span>

        <div className="flex items-center gap-1.5 ml-auto">
          {isDemo ? (
            <button
              onClick={onActivate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: 'hsl(var(--warning) / 0.15)', color: 'hsl(var(--warning))', border: '1px solid hsl(var(--warning) / 0.4)' }}
            >
              <Icon name="Lock" size={13} />
              Активировать для экспорта
            </button>
          ) : (
            <>
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all hover:opacity-80"
                style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
                onClick={() => exportToExcel(data, schemaName)}
              >
                <Icon name="FileSpreadsheet" size={13} />
                <span className="hidden sm:inline">Excel</span>
              </button>

              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50"
                style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
                onClick={handleDownloadImage}
                disabled={exporting}
              >
                <Icon name={exporting ? 'Loader2' : 'Image'} size={13} />
                <span className="hidden sm:inline">{exporting ? 'Сохранение…' : 'PNG'}</span>
              </button>

              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all hover:opacity-80"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                onClick={onPrint}
              >
                <Icon name="Printer" size={13} />
                <span className="hidden sm:inline">Печать / PDF</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Область предпросмотра */}
      <div
        className="flex-1 overflow-auto"
        style={{ background: 'hsl(216 20% 6%)' }}
      >
        {/* Подсказка для мобильных */}
        <div className="flex items-center justify-center gap-1.5 py-1.5 md:hidden" style={{ color: 'hsl(var(--muted-foreground))', fontSize: 11 }}>
          <Icon name="Move" size={11} />
          Листайте влево-вправо для просмотра схемы
        </div>

        {/* Обёртка с горизонтальной прокруткой на мобиле */}
        <div className="flex items-start justify-start md:justify-center py-2 md:py-8 px-3 md:px-4" style={{ minWidth: 'min-content' }}>
          {/* Лист А4 альбомный — 297×210мм, на мобиле фиксированная ширина для читаемости */}
          <div
            ref={sheetRef}
            style={{
              width: 'min(98vw, 1100px)',
              minWidth: 700,
              aspectRatio: '297 / 210',
              background: '#ffffff',
              boxShadow: '0 8px 40px rgba(0,0,0,0.55)',
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                paddingTop: '9.52%',
                paddingRight: '3.37%',
                paddingBottom: '9.52%',
                paddingLeft: '10.1%',
                boxSizing: 'border-box',
              }}
            >
              <PrintDocument data={data} schemaName={schemaName} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPage;