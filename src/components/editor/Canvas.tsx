import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useSchemaStore } from '@/store/schemaStore';
import { SchemaElement, Point } from '@/types/schema';
import { getSymbolById } from '@/data/mineSymbols';
import SymbolRenderer from './SymbolRenderer';

const snapToGrid = (val: number, grid: number) => Math.round(val / grid) * grid;

const Canvas: React.FC = () => {
  const {
    getActiveSchema, addElement, updateElement, setSelectedElements, clearSelection,
    selectedElementIds, activeTool, zoom, showGrid, gridSize,
    strokeColor, fillColor, strokeWidth, fontSize,
  } = useSchemaStore();

  const schema = getActiveSchema();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [startPt, setStartPt] = useState<Point>({ x: 0, y: 0 });
  const [currentPt, setCurrentPt] = useState<Point>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const [panStart, setPanStart] = useState<Point | null>(null);
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
  const [textEditing, setTextEditing] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!schema) return <div className="flex-1 canvas-bg flex items-center justify-center text-muted-foreground">Нет активной схемы</div>;

  const getCanvasPoint = (clientX: number, clientY: number): Point => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = (clientX - rect.left) / zoom;
    const y = (clientY - rect.top) / zoom;
    return { x: snapToGrid(x, gridSize), y: snapToGrid(y, gridSize) };
  };

  const handlePointerDown = (clientX: number, clientY: number, button = 0) => {
    if (button !== 0) return;
    const pt = getCanvasPoint(clientX, clientY);

    if (activeTool === 'pan') {
      setPanStart({ x: clientX - panOffset.x, y: clientY - panOffset.y });
      return;
    }
    if (activeTool === 'image') {
      fileInputRef.current?.click();
      return;
    }
    if (activeTool === 'select') {
      clearSelection();
      return;
    }
    if (['line', 'arrow', 'rect', 'ellipse'].includes(activeTool)) {
      setDrawing(true);
      setStartPt(pt);
      setCurrentPt(pt);
    }
    if (activeTool === 'text') {
      const id = Date.now().toString();
      addElement({
        id,
        type: 'text',
        x: pt.x,
        y: pt.y,
        text: 'Введите текст',
        fontSize: fontSize,
        color: strokeColor,
        strokeColor,
        opacity: 1,
        zIndex: schema.elements.length,
      });
      setSelectedElements([id]);
      setTextEditing(id);
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (activeTool === 'pan' && panStart) {
      setPanOffset({ x: clientX - panStart.x, y: clientY - panStart.y });
      return;
    }
    if (drawing) setCurrentPt(getCanvasPoint(clientX, clientY));
    if (dragging) {
      const pt = getCanvasPoint(clientX, clientY);
      updateElement(dragging.id, { x: pt.x - dragging.ox, y: pt.y - dragging.oy });
    }
  };

  const handlePointerUp = (clientX: number, clientY: number) => {
    if (activeTool === 'pan') {
      setPanStart(null);
      return;
    }
    if (drawing) {
      setDrawing(false);
      const pt = getCanvasPoint(clientX, clientY);
      const dx = Math.abs(pt.x - startPt.x);
      const dy = Math.abs(pt.y - startPt.y);
      if (dx < 3 && dy < 3) return;
      const base = {
        id: Date.now().toString(),
        strokeColor,
        strokeWidth,
        fillColor,
        opacity: 1,
        zIndex: schema.elements.length,
      };
      if (activeTool === 'line') {
        addElement({ ...base, type: 'line', x: startPt.x, y: startPt.y, x2: pt.x, y2: pt.y });
      } else if (activeTool === 'arrow') {
        addElement({ ...base, type: 'arrow', x: startPt.x, y: startPt.y, x2: pt.x, y2: pt.y });
      } else if (activeTool === 'rect') {
        const x = Math.min(startPt.x, pt.x);
        const y = Math.min(startPt.y, pt.y);
        addElement({ ...base, type: 'rect', x, y, width: Math.abs(pt.x - startPt.x), height: Math.abs(pt.y - startPt.y) });
      } else if (activeTool === 'ellipse') {
        const x = Math.min(startPt.x, pt.x);
        const y = Math.min(startPt.y, pt.y);
        addElement({ ...base, type: 'ellipse', x, y, width: Math.abs(pt.x - startPt.x), height: Math.abs(pt.y - startPt.y) });
      }
    }
    setDragging(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => handlePointerDown(e.clientX, e.clientY, e.button);
  const handleMouseMove = (e: React.MouseEvent) => handlePointerMove(e.clientX, e.clientY);
  const handleMouseUp = (e: React.MouseEvent) => handlePointerUp(e.clientX, e.clientY);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    handlePointerDown(e.touches[0].clientX, e.touches[0].clientY, 0);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    handlePointerUp(t.clientX, t.clientY);
  };

  const handleElementMouseDown = (e: React.MouseEvent, el: SchemaElement) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    const pt = getCanvasPoint(e.clientX, e.clientY);
    setSelectedElements([el.id]);
    setDragging({ id: el.id, ox: pt.x - el.x, oy: pt.y - el.y });
  };

  const handleElementTouchStart = (e: React.TouchEvent, el: SchemaElement) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    e.preventDefault();
    const pt = getCanvasPoint(e.touches[0].clientX, e.touches[0].clientY);
    setSelectedElements([el.id]);
    setDragging({ id: el.id, ox: pt.x - el.x, oy: pt.y - el.y });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const schema = useSchemaStore.getState().getActiveSchema();
      addElement({
        id: Date.now().toString(),
        type: 'image',
        x: 100,
        y: 100,
        width: 300,
        height: 200,
        imageUrl: ev.target?.result as string,
        opacity: 1,
        zIndex: schema?.elements.length ?? 0,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const renderElement = (el: SchemaElement) => {
    const isSelected = selectedElementIds.includes(el.id);
    const style: React.CSSProperties = {
      position: 'absolute',
      left: el.x,
      top: el.y,
      opacity: el.opacity ?? 1,
      cursor: activeTool === 'select' ? 'move' : 'default',
      outline: isSelected ? '2px dashed hsl(30 95% 55% / 0.9)' : 'none',
      outlineOffset: 3,
    };

    const svgProps = {
      stroke: el.strokeColor || strokeColor,
      strokeWidth: el.strokeWidth || strokeWidth,
      fill: el.fillColor === 'transparent' || !el.fillColor ? 'none' : el.fillColor,
    };

    if (el.type === 'line') {
      const w = Math.abs((el.x2 || el.x) - el.x) || 1;
      const h = Math.abs((el.y2 || el.y) - el.y) || 1;
      const x1 = el.x2 !== undefined && el.x2 < el.x ? w : 0;
      const y1 = el.y2 !== undefined && el.y2 < el.y ? h : 0;
      const x2 = el.x2 !== undefined && el.x2 >= el.x ? Math.abs((el.x2 || el.x) - el.x) : 0;
      const y2 = el.y2 !== undefined && el.y2 >= el.y ? Math.abs((el.y2 || el.y) - el.y) : 0;
      return (
        <svg key={el.id} style={{ ...style, overflow: 'visible', touchAction: 'none' }} width={w + 4} height={h + 4}
          onMouseDown={ev => handleElementMouseDown(ev, el)}
          onTouchStart={ev => handleElementTouchStart(ev, el)}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} {...svgProps} />
        </svg>
      );
    }

    if (el.type === 'arrow') {
      const x2 = el.x2 ?? el.x + 100;
      const y2 = el.y2 ?? el.y;
      const dx = x2 - el.x; const dy = y2 - el.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const ux = dx / len; const uy = dy / len;
      const headSize = 12;
      const ax = x2 - ux * headSize - uy * headSize / 2;
      const ay = y2 - uy * headSize + ux * headSize / 2;
      const bx = x2 - ux * headSize + uy * headSize / 2;
      const by = y2 - uy * headSize - ux * headSize / 2;
      const minX = Math.min(el.x, x2); const minY = Math.min(el.y, y2);
      const w = Math.abs(dx) + 20; const h = Math.abs(dy) + 20;
      const ox = el.x - minX + 10; const oy = el.y - minY + 10;
      return (
        <svg key={el.id} style={{ ...style, overflow: 'visible', left: el.x - ox, top: el.y - oy, touchAction: 'none' }} width={w} height={h}
          onMouseDown={ev => handleElementMouseDown(ev, el)}
          onTouchStart={ev => handleElementTouchStart(ev, el)}>
          <line x1={ox} y1={oy} x2={ox + (x2 - el.x)} y2={oy + (y2 - el.y)} {...svgProps} />
          <polygon points={`${ox + (x2-el.x)},${oy + (y2-el.y)} ${ox + (ax-el.x)},${oy + (ay-el.y)} ${ox + (bx-el.x)},${oy + (by-el.y)}`}
            fill={el.strokeColor || strokeColor} />
        </svg>
      );
    }

    if (el.type === 'rect') {
      return (
        <svg key={el.id} style={{ ...style, overflow: 'visible', touchAction: 'none' }} width={el.width || 100} height={el.height || 60}
          onMouseDown={ev => handleElementMouseDown(ev, el)}
          onTouchStart={ev => handleElementTouchStart(ev, el)}>
          <rect x={0} y={0} width={el.width || 100} height={el.height || 60} rx={2} {...svgProps} />
        </svg>
      );
    }

    if (el.type === 'ellipse') {
      const rx = (el.width || 80) / 2;
      const ry = (el.height || 50) / 2;
      return (
        <svg key={el.id} style={{ ...style, overflow: 'visible', touchAction: 'none' }} width={el.width || 80} height={el.height || 50}
          onMouseDown={ev => handleElementMouseDown(ev, el)}
          onTouchStart={ev => handleElementTouchStart(ev, el)}>
          <ellipse cx={rx} cy={ry} rx={rx} ry={ry} {...svgProps} />
        </svg>
      );
    }

    if (el.type === 'text') {
      return (
        <div key={el.id} style={{ ...style, touchAction: 'none' }}
          onMouseDown={ev => handleElementMouseDown(ev, el)}
          onTouchStart={ev => handleElementTouchStart(ev, el)}
          onDoubleClick={() => setTextEditing(el.id)}
        >
          {textEditing === el.id ? (
            <textarea
              autoFocus
              className="bg-transparent border-none outline-none resize-none font-mono-tech"
              style={{ fontSize: el.fontSize || fontSize, color: el.color || strokeColor, minWidth: 80, minHeight: 24 }}
              value={el.text || ''}
              onChange={e => updateElement(el.id, { text: e.target.value })}
              onBlur={() => setTextEditing(null)}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span style={{ fontSize: el.fontSize || fontSize, color: el.color || strokeColor, whiteSpace: 'pre', fontFamily: "'IBM Plex Mono', monospace" }}>
              {el.text}
            </span>
          )}
        </div>
      );
    }

    if (el.type === 'image') {
      return (
        <div key={el.id} style={{ ...style, width: el.width || 200, height: el.height || 150, touchAction: 'none' }}
          onMouseDown={ev => handleElementMouseDown(ev, el)}
          onTouchStart={ev => handleElementTouchStart(ev, el)}>
          <img src={el.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      );
    }

    if (el.type === 'symbol') {
      const sym = getSymbolById(el.symbolId || '');
      if (!sym) return null;
      return (
        <div key={el.id} style={{ ...style, textAlign: 'center', touchAction: 'none' }}
          onMouseDown={ev => handleElementMouseDown(ev, el)}
          onTouchStart={ev => handleElementTouchStart(ev, el)}>
          <SymbolRenderer content={sym.content} type={sym.type} color={el.color || sym.color} size={el.width || 40} />
          {el.label && (
            <div style={{ fontSize: 10, color: 'hsl(210 20% 75%)', marginTop: 2, whiteSpace: 'nowrap', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {el.label}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const drawingPreview = () => {
    if (!drawing) return null;
    const dx = currentPt.x - startPt.x;
    const dy = currentPt.y - startPt.y;
    const stroke = strokeColor;
    const sw = strokeWidth;
    const fill = fillColor === 'transparent' || !fillColor ? 'none' : fillColor;

    if (activeTool === 'line' || activeTool === 'arrow') {
      const minX = Math.min(startPt.x, currentPt.x);
      const minY = Math.min(startPt.y, currentPt.y);
      const w = Math.abs(dx) || 1; const h = Math.abs(dy) || 1;
      const x1 = startPt.x - minX; const y1 = startPt.y - minY;
      const x2 = currentPt.x - minX; const y2 = currentPt.y - minY;
      return (
        <svg style={{ position: 'absolute', left: minX, top: minY, overflow: 'visible', pointerEvents: 'none' }} width={w} height={h}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={sw} strokeDasharray="5,3" />
        </svg>
      );
    }
    if (activeTool === 'rect') {
      const x = Math.min(startPt.x, currentPt.x);
      const y = Math.min(startPt.y, currentPt.y);
      return (
        <svg style={{ position: 'absolute', left: x, top: y, overflow: 'visible', pointerEvents: 'none' }} width={Math.abs(dx) || 1} height={Math.abs(dy) || 1}>
          <rect x={0} y={0} width={Math.abs(dx)} height={Math.abs(dy)} stroke={stroke} strokeWidth={sw} fill={fill} strokeDasharray="5,3" />
        </svg>
      );
    }
    if (activeTool === 'ellipse') {
      const x = Math.min(startPt.x, currentPt.x);
      const y = Math.min(startPt.y, currentPt.y);
      const w = Math.abs(dx) || 1; const h = Math.abs(dy) || 1;
      return (
        <svg style={{ position: 'absolute', left: x, top: y, overflow: 'visible', pointerEvents: 'none' }} width={w} height={h}>
          <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} stroke={stroke} strokeWidth={sw} fill={fill} strokeDasharray="5,3" />
        </svg>
      );
    }
    return null;
  };

  const gridStyle: React.CSSProperties = showGrid ? {
    backgroundImage: `linear-gradient(hsl(var(--border) / 0.35) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.35) 1px, transparent 1px)`,
    backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`,
  } : {};

  return (
    <div className="flex-1 overflow-hidden relative" style={{ background: 'hsl(var(--canvas-bg))' }}>
      <div
        className="absolute inset-0 overflow-auto"
        style={{ cursor: activeTool === 'pan' ? (panStart ? 'grabbing' : 'grab') : activeTool === 'select' ? 'default' : 'crosshair', touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setDragging(null); setDrawing(false); setPanStart(null); }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: schema.width,
            height: schema.height,
            position: 'relative',
            ...gridStyle,
            border: '1px solid hsl(var(--border) / 0.4)',
            background: showGrid ? undefined : 'hsl(var(--canvas-bg))',
          }}
          ref={canvasRef}
        >
          {[...schema.elements]
            .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
            .map(renderElement)}
          {drawingPreview()}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      <div className="absolute bottom-2 right-3 font-mono-tech" style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>
        {Math.round(zoom * 100)}% | {schema.width}×{schema.height}px | {schema.elements.length} эл.
      </div>
    </div>
  );
};

export default Canvas;