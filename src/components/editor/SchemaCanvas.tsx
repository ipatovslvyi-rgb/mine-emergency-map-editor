import React, { useRef, useState, useEffect } from 'react';
import { PlacedSymbol, LegendItem } from '@/types/schema';
import Icon from '@/components/ui/icon';
import ImageEditDialog from './ImageEditDialog';

interface Props {
  imageUrl: string;
  placedSymbols: PlacedSymbol[];
  legendSymbols: { imageUrl: string; label: string }[];
  onImageUpload: (url: string) => void;
  onPlacedChange: (symbols: PlacedSymbol[]) => void;
  onLegendAdd: (item: LegendItem) => void;
  legendItems: LegendItem[];
}

const SchemaCanvas: React.FC<Props> = ({
  imageUrl,
  placedSymbols,
  legendSymbols,
  onImageUpload,
  onPlacedChange,
  onLegendAdd,
  legendItems,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Рефы для drag — чтобы не терять актуальные данные в замыканиях
  const draggingRef = useRef<{ id: string; offX: number; offY: number } | null>(null);
  const placedRef = useRef(placedSymbols);
  const onPlacedRef = useRef(onPlacedChange);

  useEffect(() => { placedRef.current = placedSymbols; }, [placedSymbols]);
  useEffect(() => { onPlacedRef.current = onPlacedChange; }, [onPlacedChange]);

  const [selected, setSelected] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      draggingRef.current = null;
      setIsDragging(false);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  const applyMove = (clientX: number, clientY: number) => {
    const d = draggingRef.current;
    if (!d || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left - d.offX) / rect.width) * 100;
    const y = ((clientY - rect.top - d.offY) / rect.height) * 100;
    onPlacedRef.current(
      placedRef.current.map(s =>
        s.id === d.id ? { ...s, x: Math.max(0, Math.min(95, x)), y: Math.max(0, Math.min(95, y)) } : s
      )
    );
  };

  const startDrag = (id: string, clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sym = placedRef.current.find(s => s.id === id);
    if (!sym) return;
    const absX = (sym.x / 100) * rect.width;
    const absY = (sym.y / 100) * rect.height;
    draggingRef.current = { id, offX: clientX - rect.left - absX, offY: clientY - rect.top - absY };
    setIsDragging(true);
    setSelected(id);
  };

  const endDrag = () => {
    draggingRef.current = null;
    setIsDragging(false);
  };

  // Глобальные нативные touch-слушатели (passive: false чтобы e.preventDefault работал)
  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      applyMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => endDrag();

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onImageUpload(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const addSymbol = (sym: { imageUrl: string; label: string }) => {
    const id = Date.now().toString();
    onPlacedChange([...placedSymbols, { id, imageUrl: sym.imageUrl, label: sym.label, x: 10, y: 10, size: 40 }]);
    if (!legendItems.some(l => l.imageUrl === sym.imageUrl)) {
      onLegendAdd({ imageUrl: sym.imageUrl, label: sym.label });
    }
  };

  const deleteSelected = () => {
    if (!selected) return;
    onPlacedChange(placedSymbols.filter(s => s.id !== selected));
    setSelected(null);
  };

  const resizeSelected = (delta: number) => {
    onPlacedChange(placedSymbols.map(s =>
      s.id === selected ? { ...s, size: Math.max(16, Math.min(120, s.size + delta)) } : s
    ));
  };

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>

      {/* Панель символов */}
      <div className="flex-shrink-0 border-b border-border" style={{ background: 'hsl(var(--card))', padding: isMobile ? '6px 8px' : '8px' }}>
        <div className="text-xs mb-1.5 font-medium text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {isMobile ? 'Нажмите символ:' : 'Нажмите на символ — он появится на схеме:'}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(36px, 1fr))' : 'repeat(auto-fill, minmax(52px, 1fr))',
          gap: isMobile ? 4 : 6,
        }}>
          {legendSymbols.map(sym => (
            <button
              key={sym.imageUrl}
              title={sym.label}
              onClick={() => addSymbol(sym)}
              className="flex flex-col items-center justify-center rounded transition-all hover:border-primary"
              style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', padding: isMobile ? '3px' : '4px', gap: isMobile ? 1 : 2 }}
            >
              <img src={sym.imageUrl} alt={sym.label} style={{ width: isMobile ? 22 : 28, height: isMobile ? 22 : 28, objectFit: 'contain' }} />
              {!isMobile && (
                <span style={{ fontSize: 8, color: 'hsl(var(--muted-foreground))', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
                  {sym.label}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Инструменты выделенного */}
      {selected && (
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 border-b border-border text-xs" style={{ background: 'hsl(var(--muted))' }}>
          <span style={{ color: 'hsl(var(--muted-foreground))' }}>Выбран:</span>
          <button onClick={() => resizeSelected(-4)} className="px-2 py-0.5 rounded border border-border" style={{ background: 'hsl(var(--card))' }}>−</button>
          <span style={{ color: 'hsl(var(--muted-foreground))' }}>размер</span>
          <button onClick={() => resizeSelected(4)} className="px-2 py-0.5 rounded border border-border" style={{ background: 'hsl(var(--card))' }}>+</button>
          <div className="flex-1" />
          <button
            onClick={deleteSelected}
            className="flex items-center gap-1 px-2 py-0.5 rounded"
            style={{ background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', border: '1px solid hsl(var(--destructive) / 0.3)' }}
          >
            <Icon name="Trash2" size={11} /> Удалить
          </button>
          <button onClick={() => setSelected(null)} className="px-2 py-0.5 rounded border border-border">✕</button>
        </div>
      )}

      {/* Canvas зона */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden"
        style={{ background: imageUrl ? 'transparent' : 'hsl(var(--card))', cursor: isDragging ? 'grabbing' : 'default' }}
        onMouseMove={e => { if (draggingRef.current) applyMove(e.clientX, e.clientY); }}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onClick={() => setSelected(null)}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault(); setDragOver(false);
          const f = e.dataTransfer.files[0];
          if (f) { const r = new FileReader(); r.onload = ev => onImageUpload(ev.target?.result as string); r.readAsDataURL(f); }
        }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="Схема" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer"
            style={{ border: dragOver ? '2px solid hsl(var(--primary))' : '2px dashed hsl(var(--border))', background: dragOver ? 'hsl(var(--primary) / 0.05)' : undefined }}
            onClick={() => fileRef.current?.click()}
          >
            <Icon name="ImagePlus" size={48} style={{ color: 'hsl(var(--muted-foreground))' }} />
            <div className="text-sm font-medium text-center px-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Нажмите, чтобы загрузить схему</div>
            <button
              onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
              className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              <Icon name="Upload" size={16} /> Выбрать файл
            </button>
            <div className="text-xs hidden md:block" style={{ color: 'hsl(var(--muted-foreground))' }}>или перетащите PNG, JPG, SVG</div>
          </div>
        )}

        {imageUrl && (
          <div className="absolute top-2 right-2 flex gap-1" style={{ zIndex: 10 }}>
            <button onClick={e => { e.stopPropagation(); setShowEditor(true); }} className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ background: 'rgba(37,99,235,0.85)', color: '#fff' }} title="Редактировать">
              <Icon name="Crop" size={11} /> {isMobile ? '' : 'Редактировать'}
            </button>
            <button onClick={e => { e.stopPropagation(); fileRef.current?.click(); }} className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
              <Icon name="ImagePlus" size={11} /> {isMobile ? '' : 'Сменить'}
            </button>
            <button onClick={e => { e.stopPropagation(); onImageUpload(''); }} className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ background: 'rgba(220,38,38,0.8)', color: '#fff' }}>
              <Icon name="X" size={11} />
            </button>
          </div>
        )}

        {/* Размещённые символы */}
        {placedSymbols.map(sym => (
          <div
            key={sym.id}
            title={sym.label}
            style={{
              position: 'absolute',
              left: `${sym.x}%`,
              top: `${sym.y}%`,
              width: sym.size,
              height: sym.size,
              cursor: isDragging && selected === sym.id ? 'grabbing' : 'grab',
              zIndex: selected === sym.id ? 20 : 10,
              outline: selected === sym.id ? '2px solid hsl(var(--primary))' : '2px solid transparent',
              borderRadius: 4,
              boxSizing: 'border-box',
              transform: 'translate(-50%, -50%)',
              touchAction: 'none',
              userSelect: 'none',
            }}
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); startDrag(sym.id, e.clientX, e.clientY); }}
            onClick={e => { e.stopPropagation(); setSelected(sym.id); }}
            onTouchStart={e => { e.stopPropagation(); startDrag(sym.id, e.touches[0].clientX, e.touches[0].clientY); }}
          >
            <img src={sym.imageUrl} alt={sym.label} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', display: 'block' }} draggable={false} />
          </div>
        ))}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      {showEditor && imageUrl && (
        <ImageEditDialog
          imageUrl={imageUrl}
          onSave={newUrl => { onImageUpload(newUrl); setShowEditor(false); }}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
};

export default SchemaCanvas;
