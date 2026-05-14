import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PlacedSymbol, LegendItem } from '@/types/schema';
import Icon from '@/components/ui/icon';
import ImageEditDialog from './ImageEditDialog';

interface Props {
  imageUrl: string;
  placedSymbols: PlacedSymbol[];
  legendSymbols: { imageUrl: string; label: string; isSample?: boolean }[];
  onImageUpload: (url: string) => void;
  onPlacedChange: (symbols: PlacedSymbol[]) => void;
  onLegendAdd: (item: LegendItem) => void;
  legendItems: LegendItem[];
}

type ActiveTool = 'select' | 'pencil' | 'eraser';

interface DrawPoint { x: number; y: number }
interface DrawStroke { points: DrawPoint[]; color: string; width: number; eraser: boolean }

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
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);

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
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');
  const [pencilColor, setPencilColor] = useState('#ef4444');
  const [pencilWidth, setPencilWidth] = useState(3);
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [editingSampleId, setEditingSampleId] = useState<string | null>(null);
  const strokesRef = useRef(strokes);
  useEffect(() => { strokesRef.current = strokes; }, [strokes]);

  const isDrawing = useRef(false);
  const currentStroke = useRef<DrawPoint[]>([]);

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

  // Перерисовка canvas
  const redrawCanvas = useCallback(() => {
    const canvas = drawCanvasRef.current;
    const container = canvasRef.current;
    if (!canvas || !container) return;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokesRef.current.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.save();
      if (stroke.eraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
      }
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.restore();
    });
  }, []);

  useEffect(() => { redrawCanvas(); }, [strokes, redrawCanvas]);

  const getRelPoint = (clientX: number, clientY: number): DrawPoint => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (clientX: number, clientY: number) => {
    isDrawing.current = true;
    currentStroke.current = [getRelPoint(clientX, clientY)];
  };

  const moveDraw = (clientX: number, clientY: number) => {
    if (!isDrawing.current) return;
    currentStroke.current.push(getRelPoint(clientX, clientY));
    // Live draw
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pts = currentStroke.current;
    if (pts.length < 2) return;
    ctx.save();
    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = pencilColor;
    }
    ctx.lineWidth = activeTool === 'eraser' ? pencilWidth * 4 : pencilWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
    ctx.restore();
  };

  const endDraw = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (currentStroke.current.length > 1) {
      const newStroke: DrawStroke = {
        points: [...currentStroke.current],
        color: pencilColor,
        width: activeTool === 'eraser' ? pencilWidth * 4 : pencilWidth,
        eraser: activeTool === 'eraser',
      };
      setStrokes(prev => [...prev, newStroke]);
    }
    currentStroke.current = [];
  };

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

  const endDragSymbol = () => {
    draggingRef.current = null;
    setIsDragging(false);
  };

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (activeTool !== 'select') return;
      if (!draggingRef.current) return;
      e.preventDefault();
      applyMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => endDragSymbol();
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [activeTool]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onImageUpload(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const addSymbol = (sym: { imageUrl: string; label: string; isSample?: boolean }) => {
    const id = Date.now().toString();
    onPlacedChange([...placedSymbols, {
      id,
      imageUrl: sym.imageUrl,
      label: sym.label,
      x: 10,
      y: 10,
      size: 40,
      rotation: 0,
      isSample: sym.isSample,
      sampleNumber: sym.isSample ? '1' : undefined,
    }]);
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
      s.id === selected ? { ...s, size: Math.max(16, Math.min(200, s.size + delta)) } : s
    ));
  };

  const rotateSelected = (delta: number) => {
    onPlacedChange(placedSymbols.map(s =>
      s.id === selected ? { ...s, rotation: ((s.rotation ?? 0) + delta + 360) % 360 } : s
    ));
  };

  const selectedSym = placedSymbols.find(s => s.id === selected);

  const PENCIL_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#000000', '#ffffff'];

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>

      {/* Панель символов */}
      <div className="flex-shrink-0 border-b border-border" style={{ background: 'hsl(var(--card))', padding: isMobile ? '6px 8px' : '8px' }}>
        <div className="text-xs mb-1.5 font-medium text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {isMobile ? 'Нажмите символ:' : 'Нажмите на символ — он появится на схеме:'}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(44px, 1fr))' : 'repeat(auto-fill, minmax(52px, 1fr))',
          gap: 6,
        }}>
          {legendSymbols.map(sym => (
            <button
              key={sym.imageUrl + sym.label}
              title={sym.label}
              onClick={() => addSymbol(sym)}
              className="flex flex-col items-center justify-center rounded transition-all hover:border-primary"
              style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', padding: isMobile ? '6px' : '4px', gap: 2, minHeight: isMobile ? 44 : 'auto' }}
            >
              <img src={sym.imageUrl} alt={sym.label} style={{ width: isMobile ? 26 : 28, height: isMobile ? 26 : 28, objectFit: 'contain' }} />
              {!isMobile && (
                <span style={{ fontSize: 8, color: 'hsl(var(--muted-foreground))', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
                  {sym.label}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Инструменты */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-2 px-3 py-1.5 border-b border-border text-xs" style={{ background: 'hsl(var(--muted))' }}>
        {/* Режимы */}
        <div className="flex gap-1">
          {(['select', 'pencil', 'eraser'] as ActiveTool[]).map(tool => (
            <button
              key={tool}
              onClick={() => { setActiveTool(tool); setSelected(null); }}
              title={tool === 'select' ? 'Выбор / перемещение' : tool === 'pencil' ? 'Карандаш' : 'Ластик'}
              style={{
                padding: '3px 7px',
                borderRadius: 4,
                border: '1px solid hsl(var(--border))',
                background: activeTool === tool ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                color: activeTool === tool ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                fontWeight: activeTool === tool ? 600 : 400,
                display: 'flex', alignItems: 'center', gap: 3,
              }}
            >
              <Icon name={tool === 'select' ? 'MousePointer2' : tool === 'pencil' ? 'Pencil' : 'Eraser'} size={12} />
              {!isMobile && (tool === 'select' ? 'Выбор' : tool === 'pencil' ? 'Карандаш' : 'Ластик')}
            </button>
          ))}
        </div>

        {/* Цвета карандаша */}
        {activeTool === 'pencil' && (
          <div className="flex items-center gap-1">
            {PENCIL_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setPencilColor(c)}
                style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: c,
                  border: pencilColor === c ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
                  outline: c === '#ffffff' ? '1px solid #ccc' : undefined,
                }}
              />
            ))}
            <select
              value={pencilWidth}
              onChange={e => setPencilWidth(Number(e.target.value))}
              style={{ fontSize: 11, padding: '1px 2px', borderRadius: 3, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
            >
              {[1, 2, 3, 5, 8, 12].map(w => <option key={w} value={w}>{w}px</option>)}
            </select>
          </div>
        )}

        {/* Толщина ластика */}
        {activeTool === 'eraser' && (
          <select
            value={pencilWidth}
            onChange={e => setPencilWidth(Number(e.target.value))}
            style={{ fontSize: 11, padding: '1px 2px', borderRadius: 3, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
          >
            {[2, 5, 10, 20].map(w => <option key={w} value={w}>Размер {w}</option>)}
          </select>
        )}

        {(activeTool === 'pencil' || activeTool === 'eraser') && strokes.length > 0 && (
          <button
            onClick={() => setStrokes(prev => prev.slice(0, -1))}
            style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}
          >
            <Icon name="Undo2" size={11} /> Отмена
          </button>
        )}

        {(activeTool === 'pencil' || activeTool === 'eraser') && strokes.length > 0 && (
          <button
            onClick={() => setStrokes([])}
            style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--destructive))', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}
          >
            <Icon name="Trash2" size={11} /> Очистить
          </button>
        )}

        {/* Инструменты выделенного символа */}
        {activeTool === 'select' && selected && selectedSym && (
          <>
            <div className="h-4 w-px" style={{ background: 'hsl(var(--border))' }} />
            <button onClick={() => resizeSelected(-4)} className="px-2 py-0.5 rounded border border-border" style={{ background: 'hsl(var(--card))' }}>−</button>
            <span style={{ color: 'hsl(var(--muted-foreground))' }}>размер</span>
            <button onClick={() => resizeSelected(4)} className="px-2 py-0.5 rounded border border-border" style={{ background: 'hsl(var(--card))' }}>+</button>

            <div className="h-4 w-px" style={{ background: 'hsl(var(--border))' }} />
            <button onClick={() => rotateSelected(-45)} className="px-2 py-0.5 rounded border border-border" style={{ background: 'hsl(var(--card))' }} title="Повернуть влево">↺</button>
            <button onClick={() => rotateSelected(45)} className="px-2 py-0.5 rounded border border-border" style={{ background: 'hsl(var(--card))' }} title="Повернуть вправо">↻</button>
            <button onClick={() => rotateSelected(90)} className="px-2 py-0.5 rounded border border-border" style={{ background: 'hsl(var(--card))', fontSize: 10 }}>90°</button>

            {selectedSym.isSample && (
              <>
                <div className="h-4 w-px" style={{ background: 'hsl(var(--border))' }} />
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>№:</span>
                <input
                  type="text"
                  value={selectedSym.sampleNumber ?? '1'}
                  onClick={e => e.stopPropagation()}
                  onChange={e => {
                    const val = e.target.value.slice(0, 3);
                    onPlacedChange(placedSymbols.map(s =>
                      s.id === selected ? { ...s, sampleNumber: val } : s
                    ));
                  }}
                  style={{ width: 36, padding: '1px 4px', fontSize: 12, borderRadius: 3, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', textAlign: 'center' }}
                />
              </>
            )}

            <div className="flex-1" />
            <button
              onClick={deleteSelected}
              className="flex items-center gap-1 px-2 py-0.5 rounded"
              style={{ background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', border: '1px solid hsl(var(--destructive) / 0.3)' }}
            >
              <Icon name="Trash2" size={11} /> Удалить
            </button>
            <button onClick={() => setSelected(null)} className="px-2 py-0.5 rounded border border-border">✕</button>
          </>
        )}
      </div>

      {/* Canvas зона */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden"
        style={{ background: imageUrl ? 'transparent' : 'hsl(var(--card))', cursor: activeTool === 'pencil' ? 'crosshair' : activeTool === 'eraser' ? 'cell' : isDragging ? 'grabbing' : 'default' }}
        onMouseMove={e => {
          if (activeTool === 'select' && draggingRef.current) applyMove(e.clientX, e.clientY);
          if (activeTool === 'pencil' || activeTool === 'eraser') moveDraw(e.clientX, e.clientY);
        }}
        onMouseUp={() => {
          endDragSymbol();
          endDraw();
        }}
        onMouseLeave={() => {
          endDragSymbol();
          endDraw();
        }}
        onMouseDown={e => {
          if (activeTool === 'pencil' || activeTool === 'eraser') {
            e.preventDefault();
            startDraw(e.clientX, e.clientY);
          }
        }}
        onClick={() => { if (activeTool === 'select') setSelected(null); }}
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
              cursor: activeTool !== 'select' ? 'default' : isDragging && selected === sym.id ? 'grabbing' : 'grab',
              zIndex: selected === sym.id ? 20 : 10,
              outline: selected === sym.id ? '2px solid hsl(var(--primary))' : '2px solid transparent',
              borderRadius: 4,
              boxSizing: 'border-box',
              transform: `translate(-50%, -50%) rotate(${sym.rotation ?? 0}deg)`,
              touchAction: 'none',
              userSelect: 'none',
              pointerEvents: activeTool !== 'select' ? 'none' : 'auto',
            }}
            onMouseDown={e => {
              if (activeTool !== 'select') return;
              e.preventDefault();
              e.stopPropagation();
              startDrag(sym.id, e.clientX, e.clientY);
            }}
            onClick={e => {
              if (activeTool !== 'select') return;
              e.stopPropagation();
              setSelected(sym.id);
            }}
            onTouchStart={e => {
              if (activeTool !== 'select') return;
              e.stopPropagation();
              startDrag(sym.id, e.touches[0].clientX, e.touches[0].clientY);
            }}
          >
            {sym.isSample ? (
              /* Символ "место отбора проб" с редактируемой цифрой */
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <img src={sym.imageUrl} alt={sym.label} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', display: 'block' }} draggable={false} />
                {editingSampleId === sym.id ? (
                  <input
                    autoFocus
                    type="text"
                    value={sym.sampleNumber ?? '1'}
                    onChange={e => {
                      const val = e.target.value.slice(0, 3);
                      onPlacedChange(placedSymbols.map(s => s.id === sym.id ? { ...s, sampleNumber: val } : s));
                    }}
                    onBlur={() => setEditingSampleId(null)}
                    onClick={e => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      bottom: '18%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '60%',
                      textAlign: 'center',
                      fontSize: sym.size * 0.28,
                      fontWeight: 900,
                      background: 'rgba(255,249,196,0.9)',
                      border: '1px solid #f57f17',
                      borderRadius: 3,
                      color: '#e65100',
                      padding: 0,
                      outline: 'none',
                    }}
                  />
                ) : (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '20%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: sym.size * 0.28,
                      fontWeight: 900,
                      color: '#e65100',
                      cursor: 'pointer',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                    }}
                    onDoubleClick={e => { e.stopPropagation(); setEditingSampleId(sym.id); }}
                    title="Двойной клик — изменить номер"
                  >
                    {sym.sampleNumber ?? '1'}
                  </span>
                )}
              </div>
            ) : (
              <img src={sym.imageUrl} alt={sym.label} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', display: 'block' }} draggable={false} />
            )}
          </div>
        ))}

        {/* Canvas для рисования карандашом/ластиком */}
        <canvas
          ref={drawCanvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: activeTool === 'pencil' || activeTool === 'eraser' ? 'auto' : 'none',
            zIndex: 15,
            cursor: activeTool === 'pencil' ? 'crosshair' : activeTool === 'eraser' ? 'cell' : 'default',
          }}
          onMouseDown={e => {
            if (activeTool === 'pencil' || activeTool === 'eraser') {
              e.preventDefault();
              startDraw(e.clientX, e.clientY);
            }
          }}
          onMouseMove={e => {
            if (activeTool === 'pencil' || activeTool === 'eraser') moveDraw(e.clientX, e.clientY);
          }}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={e => {
            if (activeTool === 'pencil' || activeTool === 'eraser') {
              e.preventDefault();
              startDraw(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchMove={e => {
            if (activeTool === 'pencil' || activeTool === 'eraser') {
              e.preventDefault();
              moveDraw(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchEnd={endDraw}
        />
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
