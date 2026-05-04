import React, { useRef, useState, useCallback } from 'react';
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
  const [dragging, setDragging] = useState<{ id: string; offX: number; offY: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onImageUpload(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const addSymbol = (sym: { imageUrl: string; label: string }) => {
    const id = Date.now().toString();
    const newSym: PlacedSymbol = { id, imageUrl: sym.imageUrl, label: sym.label, x: 10, y: 10, size: 40 };
    onPlacedChange([...placedSymbols, newSym]);
    if (!legendItems.some(l => l.imageUrl === sym.imageUrl)) {
      onLegendAdd({ imageUrl: sym.imageUrl, label: sym.label });
    }
  };

  const onMouseDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sym = placedSymbols.find(s => s.id === id);
    if (!sym) return;
    const pct = (v: number, total: number) => (v / 100) * total;
    const absX = pct(sym.x, rect.width);
    const absY = pct(sym.y, rect.height);
    setDragging({ id, offX: e.clientX - rect.left - absX, offY: e.clientY - rect.top - absY });
    setSelected(id);
  };

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left - dragging.offX) / rect.width) * 100;
    const y = ((e.clientY - rect.top - dragging.offY) / rect.height) * 100;
    onPlacedChange(placedSymbols.map(s =>
      s.id === dragging.id ? { ...s, x: Math.max(0, Math.min(95, x)), y: Math.max(0, Math.min(95, y)) } : s
    ));
  }, [dragging, placedSymbols, onPlacedChange]);

  const onMouseUp = () => setDragging(null);

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
      <div className="flex-shrink-0 border-b border-border p-2" style={{ background: 'hsl(var(--card))' }}>
        <div className="text-xs mb-1.5 font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Нажмите на символ — он появится на схеме:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {legendSymbols.map(sym => (
            <button
              key={sym.imageUrl}
              title={sym.label}
              onClick={() => addSymbol(sym)}
              className="flex flex-col items-center gap-0.5 rounded p-1 transition-all hover:border-primary"
              style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', minWidth: 44 }}
            >
              <img src={sym.imageUrl} alt={sym.label} style={{ width: 28, height: 28, objectFit: 'contain' }} />
              <span style={{ fontSize: 8, color: 'hsl(var(--muted-foreground))', maxWidth: 44, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
                {sym.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Инструменты выделенного */}
      {selected && (
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 border-b border-border text-xs" style={{ background: 'hsl(var(--muted))' }}>
          <span style={{ color: 'hsl(var(--muted-foreground))' }}>Выбран символ:</span>
          <button onClick={() => resizeSelected(-4)} className="px-2 py-0.5 rounded border border-border hover:border-primary" style={{ background: 'hsl(var(--card))' }}>−</button>
          <span style={{ color: 'hsl(var(--muted-foreground))' }}>размер</span>
          <button onClick={() => resizeSelected(4)} className="px-2 py-0.5 rounded border border-border hover:border-primary" style={{ background: 'hsl(var(--card))' }}>+</button>
          <div className="flex-1" />
          <button
            onClick={deleteSelected}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
            style={{ background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', border: '1px solid hsl(var(--destructive) / 0.3)' }}
          >
            <Icon name="Trash2" size={11} /> Удалить
          </button>
          <button onClick={() => setSelected(null)} className="px-2 py-0.5 rounded border border-border text-xs">Снять выбор</button>
        </div>
      )}

      {/* Canvas зона */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden"
        style={{
          background: imageUrl ? 'transparent' : 'hsl(var(--card))',
          cursor: dragging ? 'grabbing' : 'default',
          borderRadius: 0,
        }}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={() => setSelected(null)}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setDragOver(false);
          const files = e.dataTransfer.files;
          if (files[0]) {
            const reader = new FileReader();
            reader.onload = ev => onImageUpload(ev.target?.result as string);
            reader.readAsDataURL(files[0]);
          }
        }}
      >
        {/* Фоновое изображение */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Схема"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
          />
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer"
            style={{
              border: dragOver ? '2px solid hsl(var(--primary))' : '2px dashed hsl(var(--border))',
              background: dragOver ? 'hsl(var(--primary) / 0.05)' : undefined,
            }}
            onClick={() => fileRef.current?.click()}
          >
            <Icon name="ImagePlus" size={48} style={{ color: 'hsl(var(--muted-foreground))' }} />
            <div className="text-sm font-medium text-center px-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Нажмите, чтобы загрузить схему
            </div>
            <button
              onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
              className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              <Icon name="Upload" size={16} />
              Выбрать файл
            </button>
            <div className="text-xs hidden md:block" style={{ color: 'hsl(var(--muted-foreground))' }}>или перетащите PNG, JPG, SVG</div>
          </div>
        )}

        {/* Кнопка смены/удаления картинки */}
        {imageUrl && (
          <div className="absolute top-2 right-2 flex gap-1" style={{ zIndex: 10 }}>
            <button
              onClick={e => { e.stopPropagation(); setShowEditor(true); }}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs"
              style={{ background: 'rgba(37,99,235,0.85)', color: '#fff' }}
              title="Обрезать, масштабировать, повернуть"
            >
              <Icon name="Crop" size={11} /> Редактировать
            </button>
            <button
              onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs"
              style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
            >
              <Icon name="ImagePlus" size={11} /> Сменить
            </button>
            <button
              onClick={e => { e.stopPropagation(); onImageUpload(''); }}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs"
              style={{ background: 'rgba(220,38,38,0.8)', color: '#fff' }}
            >
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
              cursor: 'grab',
              zIndex: selected === sym.id ? 20 : 10,
              outline: selected === sym.id ? '2px solid hsl(var(--primary))' : '2px solid transparent',
              borderRadius: 4,
              boxSizing: 'border-box',
              transform: 'translate(-50%, -50%)',
            }}
            onMouseDown={e => onMouseDown(e, sym.id)}
            onClick={e => { e.stopPropagation(); setSelected(sym.id); }}
          >
            <img src={sym.imageUrl} alt={sym.label} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', display: 'block' }} />
          </div>
        ))}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      {showEditor && imageUrl && (
        <ImageEditDialog
          imageUrl={imageUrl}
          onSave={(newUrl) => {
            onImageUpload(newUrl);
            setShowEditor(false);
          }}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
};

export default SchemaCanvas;