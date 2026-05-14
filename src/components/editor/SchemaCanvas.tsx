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
  const containerRef = useRef<HTMLDivElement>(null);
  // Единый canvas — рисуем всё на нём (фон + рисунок)
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);

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
  const [rotationInput, setRotationInput] = useState('0');

  const strokesRef = useRef(strokes);
  useEffect(() => { strokesRef.current = strokes; }, [strokes]);

  // Для сохранения нарисованного поверх фона (без самого фона)
  const drawLayerRef = useRef<HTMLCanvasElement | null>(null);

  const isDrawing = useRef(false);
  const currentStroke = useRef<DrawPoint[]>([]);

  // Загруженное изображение
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      draggingRef.current = null;
      setIsDragging(false);
      redrawAll();
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  // Загружаем imageUrl в Image объект
  useEffect(() => {
    if (!imageUrl) {
      loadedImageRef.current = null;
      redrawAll();
      return;
    }
    const img = new Image();
    img.onload = () => {
      loadedImageRef.current = img;
      redrawAll();
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Рисуем всё на mainCanvas: фон + draw layer
  const redrawAll = useCallback(() => {
    const canvas = mainCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const W = container.clientWidth;
    const H = container.clientHeight;
    if (W === 0 || H === 0) return;

    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);

    // Рисуем фоновое изображение (contain)
    const img = loadedImageRef.current;
    if (img) {
      const scale = Math.min(W / img.naturalWidth, H / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      const dx = (W - dw) / 2;
      const dy = (H - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    // Поверх рисуем draw layer (если есть)
    if (drawLayerRef.current) {
      ctx.drawImage(drawLayerRef.current, 0, 0);
    }
  }, []);

  // Синхронизируем strokes в drawLayer и затем перерисовываем
  const redrawDrawLayer = useCallback(() => {
    const canvas = mainCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const W = container.clientWidth || canvas.width;
    const H = container.clientHeight || canvas.height;

    if (!drawLayerRef.current) {
      drawLayerRef.current = document.createElement('canvas');
    }
    const dl = drawLayerRef.current;
    dl.width = W;
    dl.height = H;
    const ctx = dl.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);

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

    redrawAll();
  }, [redrawAll]);

  useEffect(() => { redrawDrawLayer(); }, [strokes, redrawDrawLayer]);

  // При смене imageUrl сбрасываем draw layer
  useEffect(() => {
    drawLayerRef.current = null;
    setStrokes([]);
  }, [imageUrl]);

  const getRelPoint = (clientX: number, clientY: number): DrawPoint => {
    const canvas = mainCanvasRef.current;
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
    const pt = getRelPoint(clientX, clientY);
    currentStroke.current.push(pt);

    // Live draw прямо на mainCanvas
    const canvas = mainCanvasRef.current;
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
    if (!d || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left - d.offX) / rect.width) * 100;
    const y = ((clientY - rect.top - d.offY) / rect.height) * 100;
    onPlacedRef.current(
      placedRef.current.map(s =>
        s.id === d.id ? { ...s, x: Math.max(0, Math.min(95, x)), y: Math.max(0, Math.min(95, y)) } : s
      )
    );
  };

  const startDrag = (id: string, clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
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
    const onTouchEnd = () => { endDragSymbol(); endDraw(); };
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
      size: sym.isSample && sym.label === 'Расстояние' ? 80 : 40,
      rotation: 0,
      isSample: sym.isSample,
      sampleNumber: sym.isSample ? '' : undefined,
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
      s.id === selected ? { ...s, size: Math.max(16, Math.min(300, s.size + delta)) } : s
    ));
  };

  const applyRotation = (deg: number) => {
    onPlacedChange(placedSymbols.map(s =>
      s.id === selected ? { ...s, rotation: ((deg % 360) + 360) % 360 } : s
    ));
  };

  const rotateSelected = (delta: number) => {
    const sym = placedSymbols.find(s => s.id === selected);
    if (!sym) return;
    const newDeg = (((sym.rotation ?? 0) + delta) % 360 + 360) % 360;
    setRotationInput(String(newDeg));
    applyRotation(newDeg);
  };

  // Синхронизировать инпут угла при смене выбранного
  useEffect(() => {
    const sym = placedSymbols.find(s => s.id === selected);
    setRotationInput(sym ? String(sym.rotation ?? 0) : '0');
  }, [selected]);

  const selectedSym = placedSymbols.find(s => s.id === selected);

  const PENCIL_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#000000', '#ffffff'];

  const isDrawTool = activeTool === 'pencil' || activeTool === 'eraser';

  // Экспортируем dataUrl отрисованного (фон+рисунок) для печати/сохранения
  // (используется внешне через imageUrl — не нужно)

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

      {/* Панель инструментов */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-2 px-3 py-1.5 border-b border-border text-xs" style={{ background: 'hsl(var(--muted))' }}>

        {/* Режимы */}
        <div className="flex gap-1">
          {(['select', 'pencil', 'eraser'] as ActiveTool[]).map(tool => (
            <button
              key={tool}
              onClick={() => { setActiveTool(tool); setSelected(null); }}
              title={tool === 'select' ? 'Выбор / перемещение' : tool === 'pencil' ? 'Карандаш' : 'Ластик (стирает картинку)'}
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
                  flexShrink: 0,
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

        {/* Размер ластика */}
        {activeTool === 'eraser' && (
          <div className="flex items-center gap-1">
            <span style={{ color: 'hsl(var(--muted-foreground))' }}>Размер:</span>
            <select
              value={pencilWidth}
              onChange={e => setPencilWidth(Number(e.target.value))}
              style={{ fontSize: 11, padding: '1px 2px', borderRadius: 3, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
            >
              {[2, 5, 10, 20, 40].map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        )}

        {isDrawTool && strokes.length > 0 && (
          <>
            <button
              onClick={() => setStrokes(prev => prev.slice(0, -1))}
              style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}
            >
              <Icon name="Undo2" size={11} /> Отмена
            </button>
            <button
              onClick={() => setStrokes([])}
              style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--destructive))', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}
            >
              <Icon name="Trash2" size={11} /> Очистить
            </button>
          </>
        )}

        {/* Инструменты выделенного символа */}
        {activeTool === 'select' && selected && selectedSym && (
          <>
            <div className="h-4 w-px" style={{ background: 'hsl(var(--border))' }} />
            <button onClick={() => resizeSelected(-8)} className="px-2 py-0.5 rounded border border-border" style={{ background: 'hsl(var(--card))' }}>−</button>
            <span style={{ color: 'hsl(var(--muted-foreground))' }}>размер</span>
            <button onClick={() => resizeSelected(8)} className="px-2 py-0.5 rounded border border-border" style={{ background: 'hsl(var(--card))' }}>+</button>

            <div className="h-4 w-px" style={{ background: 'hsl(var(--border))' }} />
            <button onClick={() => rotateSelected(-15)} className="px-1.5 py-0.5 rounded border border-border" style={{ background: 'hsl(var(--card))' }} title="−15°">↺</button>
            <button onClick={() => rotateSelected(15)} className="px-1.5 py-0.5 rounded border border-border" style={{ background: 'hsl(var(--card))' }} title="+15°">↻</button>
            <input
              type="number"
              min={0}
              max={359}
              value={rotationInput}
              onChange={e => {
                setRotationInput(e.target.value);
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) applyRotation(v);
              }}
              onClick={e => e.stopPropagation()}
              style={{ width: 46, padding: '1px 4px', fontSize: 11, borderRadius: 3, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', textAlign: 'center' }}
              title="Угол поворота (градусы)"
            />
            <span style={{ color: 'hsl(var(--muted-foreground))' }}>°</span>

            {selectedSym.isSample && (
              <>
                <div className="h-4 w-px" style={{ background: 'hsl(var(--border))' }} />
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {selectedSym.label === 'Расстояние' ? 'м:' : '№:'}
                </span>
                <input
                  type="text"
                  value={selectedSym.sampleNumber ?? ''}
                  onClick={e => e.stopPropagation()}
                  onChange={e => {
                    const val = e.target.value.slice(0, 6);
                    onPlacedChange(placedSymbols.map(s =>
                      s.id === selected ? { ...s, sampleNumber: val } : s
                    ));
                  }}
                  style={{ width: 44, padding: '1px 4px', fontSize: 12, borderRadius: 3, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', textAlign: 'center' }}
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
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{
          background: imageUrl ? '#1e1e1e' : 'hsl(var(--card))',
          cursor: isDrawTool ? (activeTool === 'pencil' ? 'crosshair' : 'cell') : isDragging ? 'grabbing' : 'default',
        }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault(); setDragOver(false);
          const f = e.dataTransfer.files[0];
          if (f) { const r = new FileReader(); r.onload = ev => onImageUpload(ev.target?.result as string); r.readAsDataURL(f); }
        }}
        onClick={() => { if (activeTool === 'select') setSelected(null); }}
      >
        {/* Единый canvas — фон + рисунок ластика/карандаша */}
        {imageUrl ? (
          <canvas
            ref={mainCanvasRef}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              display: 'block',
              cursor: isDrawTool ? (activeTool === 'pencil' ? 'crosshair' : 'cell') : 'default',
              zIndex: 1,
              pointerEvents: isDrawTool ? 'auto' : 'none',
            }}
            onMouseDown={e => {
              if (isDrawTool) { e.preventDefault(); startDraw(e.clientX, e.clientY); }
            }}
            onMouseMove={e => {
              if (isDrawTool) moveDraw(e.clientX, e.clientY);
            }}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={e => {
              if (isDrawTool) { e.preventDefault(); startDraw(e.touches[0].clientX, e.touches[0].clientY); }
            }}
            onTouchMove={e => {
              if (isDrawTool) { e.preventDefault(); moveDraw(e.touches[0].clientX, e.touches[0].clientY); }
            }}
            onTouchEnd={endDraw}
          />
        ) : (
          /* Нет изображения — загрузка */
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

        {/* Кнопки управления картинкой */}
        {imageUrl && (
          <div className="absolute top-2 right-2 flex gap-1" style={{ zIndex: 20 }}>
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
              height: sym.isSample && sym.label === 'Расстояние' ? sym.size * 0.4 : sym.size,
              cursor: activeTool !== 'select' ? 'default' : isDragging && selected === sym.id ? 'grabbing' : 'grab',
              zIndex: selected === sym.id ? 25 : 15,
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
            onMouseMove={e => {
              if (activeTool === 'select' && draggingRef.current) {
                e.preventDefault();
                applyMove(e.clientX, e.clientY);
              }
            }}
            onMouseUp={endDragSymbol}
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
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <img
                  src={sym.imageUrl}
                  alt={sym.label}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', display: 'block' }}
                  draggable={false}
                />
                {/* Редактируемая цифра/текст */}
                {editingSampleId === sym.id ? (
                  <input
                    autoFocus
                    type="text"
                    value={sym.sampleNumber ?? ''}
                    onChange={e => {
                      const val = e.target.value.slice(0, 6);
                      onPlacedChange(placedSymbols.map(s => s.id === sym.id ? { ...s, sampleNumber: val } : s));
                    }}
                    onBlur={() => setEditingSampleId(null)}
                    onClick={e => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      top: sym.label === 'Расстояние' ? '15%' : '45%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '70%',
                      textAlign: 'center',
                      fontSize: Math.max(10, sym.size * 0.22),
                      fontWeight: 900,
                      background: 'rgba(255,255,255,0.92)',
                      border: '1px solid #333',
                      borderRadius: 3,
                      color: '#212121',
                      padding: 0,
                      outline: 'none',
                      zIndex: 5,
                    }}
                  />
                ) : (
                  <span
                    style={{
                      position: 'absolute',
                      top: sym.label === 'Расстояние' ? '12%' : '45%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: Math.max(10, sym.size * 0.22),
                      fontWeight: 900,
                      color: sym.label === 'Расстояние' ? '#212121' : '#e65100',
                      cursor: 'pointer',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'auto',
                    }}
                    onDoubleClick={e => { e.stopPropagation(); setEditingSampleId(sym.id); }}
                    title="Двойной клик — изменить"
                  >
                    {sym.sampleNumber ?? ''}
                  </span>
                )}
              </div>
            ) : (
              <img
                src={sym.imageUrl}
                alt={sym.label}
                style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', display: 'block' }}
                draggable={false}
              />
            )}
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
