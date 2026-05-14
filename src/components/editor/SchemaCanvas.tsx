import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PlacedSymbol, LegendItem } from '@/types/schema';
import ImageEditDialog from './ImageEditDialog';
import CanvasSymbolsPalette from './CanvasSymbolsPalette';
import CanvasToolbar, { ActiveTool } from './CanvasToolbar';
import CanvasDrawArea, { DrawStroke } from './CanvasDrawArea';

interface Props {
  imageUrl: string;
  placedSymbols: PlacedSymbol[];
  legendSymbols: { imageUrl: string; label: string; isSample?: boolean }[];
  onImageUpload: (url: string) => void;
  onPlacedChange: (symbols: PlacedSymbol[]) => void;
  onLegendAdd: (item: LegendItem) => void;
  legendItems: LegendItem[];
}

interface DrawPoint { x: number; y: number }

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

  const isDrawing = useRef(false);
  const currentStroke = useRef<DrawPoint[]>([]);
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

    const img = loadedImageRef.current;
    if (img) {
      const scale = Math.min(W / img.naturalWidth, H / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      const dx = (W - dw) / 2;
      const dy = (H - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    strokesRef.current.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.eraser ? '#ffffff' : stroke.color;
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

  const redrawDrawLayer = redrawAll;

  useEffect(() => { redrawDrawLayer(); }, [strokes, redrawDrawLayer]);

  useEffect(() => {
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

    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pts = currentStroke.current;
    if (pts.length < 2) return;

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    if (activeTool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
    } else {
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
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [activeTool]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (activeTool !== 'select') return;
      if (!draggingRef.current) return;
      applyMove(e.clientX, e.clientY);
    };
    const onMouseUp = () => endDragSymbol();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [activeTool]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (placedRef.current.find(s => s.id === selected)) {
          onPlacedRef.current(placedRef.current.filter(s => s.id !== selected));
          setSelected(null);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected]);

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
      size: sym.isSample && sym.label === 'Расстояние' ? 14 : 40,
      arrowWidth: sym.isSample && sym.label === 'Расстояние' ? 160 : undefined,
      rotation: 0,
      isSample: sym.isSample,
      sampleNumber: sym.isSample ? '' : undefined,
    }]);
    if (!legendItems.some(l => l.imageUrl === sym.imageUrl)) {
      onLegendAdd({ imageUrl: sym.imageUrl, label: sym.label });
    }
  };

  const addTextBlock = () => {
    const id = Date.now().toString();
    onPlacedChange([...placedSymbols, {
      id,
      imageUrl: '',
      label: 'Текст',
      x: 20,
      y: 20,
      size: 16,
      rotation: 0,
      isTextBlock: true,
      textContent: 'Текст',
      textColor: '#212121',
    }]);
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

  const resizeArrow = (delta: number) => {
    onPlacedChange(placedSymbols.map(s => {
      if (s.id !== selected) return s;
      const current = s.arrowWidth ?? s.size;
      return { ...s, arrowWidth: Math.max(40, Math.min(600, current + delta)) };
    }));
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

  useEffect(() => {
    const sym = placedSymbols.find(s => s.id === selected);
    setRotationInput(sym ? String(sym.rotation ?? 0) : '0');
  }, [selected]);

  const selectedSym = placedSymbols.find(s => s.id === selected);

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>

      <CanvasSymbolsPalette
        legendSymbols={legendSymbols}
        isMobile={isMobile}
        onAddSymbol={addSymbol}
        onAddTextBlock={addTextBlock}
      />

      <CanvasToolbar
        isMobile={isMobile}
        activeTool={activeTool}
        pencilColor={pencilColor}
        pencilWidth={pencilWidth}
        strokes={strokes}
        selected={selected}
        selectedSym={selectedSym}
        placedSymbols={placedSymbols}
        rotationInput={rotationInput}
        onSetActiveTool={setActiveTool}
        onSetSelected={setSelected}
        onSetPencilColor={setPencilColor}
        onSetPencilWidth={setPencilWidth}
        onUndoStroke={() => setStrokes(prev => prev.slice(0, -1))}
        onClearStrokes={() => setStrokes([])}
        onResizeSelected={resizeSelected}
        onRotateSelected={rotateSelected}
        onRotationInputChange={setRotationInput}
        onApplyRotation={applyRotation}
        onSampleNumberChange={val => onPlacedChange(placedSymbols.map(s => s.id === selected ? { ...s, sampleNumber: val } : s))}
        onResizeArrow={resizeArrow}
        onTextColorChange={color => onPlacedChange(placedSymbols.map(s => s.id === selected ? { ...s, textColor: color } : s))}
        onDeleteSelected={deleteSelected}
      />

      <CanvasDrawArea
        imageUrl={imageUrl}
        placedSymbols={placedSymbols}
        activeTool={activeTool}
        selected={selected}
        isDragging={isDragging}
        dragOver={dragOver}
        isMobile={isMobile}
        editingSampleId={editingSampleId}
        mainCanvasRef={mainCanvasRef}
        containerRef={containerRef}
        onDragOver={() => setDragOver(true)}
        onDragLeave={() => setDragOver(false)}
        onDrop={file => { const r = new FileReader(); r.onload = ev => onImageUpload(ev.target?.result as string); r.readAsDataURL(file); }}
        onCanvasClick={() => { if (activeTool === 'select') setSelected(null); }}
        onStartDraw={startDraw}
        onMoveDraw={moveDraw}
        onEndDraw={endDraw}
        onStartDrag={startDrag}
        onApplyMove={applyMove}
        onEndDragSymbol={endDragSymbol}
        onSelectSymbol={id => setSelected(id)}
        onSetSelected={setSelected}
        onFileClick={() => fileRef.current?.click()}
        onEditImage={() => setShowEditor(true)}
        onRemoveImage={() => onImageUpload('')}
        onPlacedChange={onPlacedChange}
        onSetEditingSampleId={setEditingSampleId}
      />

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