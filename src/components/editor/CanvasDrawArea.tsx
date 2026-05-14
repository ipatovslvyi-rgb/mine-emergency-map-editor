import React, { useRef } from 'react';
import { PlacedSymbol } from '@/types/schema';
import Icon from '@/components/ui/icon';
import { ActiveTool } from './CanvasToolbar';

interface DrawPoint { x: number; y: number }
export interface DrawStroke { points: DrawPoint[]; color: string; width: number; eraser: boolean }

interface Props {
  imageUrl: string;
  placedSymbols: PlacedSymbol[];
  activeTool: ActiveTool;
  selected: string | null;
  isDragging: boolean;
  dragOver: boolean;
  isMobile: boolean;
  editingSampleId: string | null;
  mainCanvasRef: React.RefObject<HTMLCanvasElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (file: File) => void;
  onCanvasClick: () => void;
  onStartDraw: (clientX: number, clientY: number) => void;
  onMoveDraw: (clientX: number, clientY: number) => void;
  onEndDraw: () => void;
  onStartDrag: (id: string, clientX: number, clientY: number) => void;
  onApplyMove: (clientX: number, clientY: number) => void;
  onEndDragSymbol: () => void;
  onSelectSymbol: (id: string) => void;
  onSetSelected: (id: string | null) => void;
  onFileClick: () => void;
  onEditImage: () => void;
  onRemoveImage: () => void;
  onPlacedChange: (symbols: PlacedSymbol[]) => void;
  onSetEditingSampleId: (id: string | null) => void;
}

const CanvasDrawArea: React.FC<Props> = ({
  imageUrl,
  placedSymbols,
  activeTool,
  selected,
  isDragging,
  dragOver,
  isMobile,
  editingSampleId,
  mainCanvasRef,
  containerRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onCanvasClick,
  onStartDraw,
  onMoveDraw,
  onEndDraw,
  onStartDrag,
  onApplyMove,
  onEndDragSymbol,
  onSelectSymbol,
  onSetSelected,
  onFileClick,
  onEditImage,
  onRemoveImage,
  onPlacedChange,
  onSetEditingSampleId,
}) => {
  const isDrawTool = activeTool === 'pencil' || activeTool === 'eraser';

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden"
      style={{
        background: imageUrl ? '#1e1e1e' : 'hsl(var(--card))',
        cursor: isDrawTool ? (activeTool === 'pencil' ? 'crosshair' : 'cell') : isDragging ? 'grabbing' : 'default',
      }}
      onDragOver={e => { e.preventDefault(); onDragOver(); }}
      onDragLeave={onDragLeave}
      onDrop={e => {
        e.preventDefault(); onDragLeave();
        const f = e.dataTransfer.files[0];
        if (f) onDrop(f);
      }}
      onClick={() => { if (activeTool === 'select') onSetSelected(null); }}
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
            if (isDrawTool) { e.preventDefault(); onStartDraw(e.clientX, e.clientY); }
          }}
          onMouseMove={e => {
            if (isDrawTool) onMoveDraw(e.clientX, e.clientY);
          }}
          onMouseUp={onEndDraw}
          onMouseLeave={onEndDraw}
          onTouchStart={e => {
            if (isDrawTool) { e.preventDefault(); onStartDraw(e.touches[0].clientX, e.touches[0].clientY); }
          }}
          onTouchMove={e => {
            if (isDrawTool) { e.preventDefault(); onMoveDraw(e.touches[0].clientX, e.touches[0].clientY); }
          }}
          onTouchEnd={onEndDraw}
        />
      ) : (
        /* Нет изображения — загрузка */
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer"
          style={{ border: dragOver ? '2px solid hsl(var(--primary))' : '2px dashed hsl(var(--border))', background: dragOver ? 'hsl(var(--primary) / 0.05)' : undefined }}
          onClick={onFileClick}
        >
          <Icon name="ImagePlus" size={48} style={{ color: 'hsl(var(--muted-foreground))' }} />
          <div className="text-sm font-medium text-center px-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Нажмите, чтобы загрузить схему</div>
          <button
            onClick={e => { e.stopPropagation(); onFileClick(); }}
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
          <button onClick={e => { e.stopPropagation(); onEditImage(); }} className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ background: 'rgba(37,99,235,0.85)', color: '#fff' }} title="Редактировать">
            <Icon name="Crop" size={11} /> {isMobile ? '' : 'Редактировать'}
          </button>
          <button onClick={e => { e.stopPropagation(); onFileClick(); }} className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
            <Icon name="ImagePlus" size={11} /> {isMobile ? '' : 'Сменить'}
          </button>
          <button onClick={e => { e.stopPropagation(); onRemoveImage(); }} className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ background: 'rgba(220,38,38,0.8)', color: '#fff' }}>
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
            width: sym.isSample && sym.label === 'Расстояние' ? sym.size : sym.size,
            height: sym.isSample && sym.label === 'Расстояние' ? Math.round(sym.size * 0.5) : sym.size,
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
            onStartDrag(sym.id, e.clientX, e.clientY);
          }}
          onMouseMove={e => {
            if (activeTool === 'select' && isDragging) {
              e.preventDefault();
              onApplyMove(e.clientX, e.clientY);
            }
          }}
          onMouseUp={onEndDragSymbol}
          onClick={e => {
            if (activeTool !== 'select') return;
            e.stopPropagation();
            onSelectSymbol(sym.id);
          }}
          onTouchStart={e => {
            if (activeTool !== 'select') return;
            e.stopPropagation();
            onStartDrag(sym.id, e.touches[0].clientX, e.touches[0].clientY);
          }}
        >
          {sym.isSample ? (
            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {sym.label === 'Расстояние' ? (
                /* Текст сверху + стрелка снизу, пропорционально sym.size */
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  {/* Текст */}
                  {editingSampleId === sym.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={sym.sampleNumber ?? ''}
                      onChange={e => {
                        const val = e.target.value.slice(0, 8);
                        onPlacedChange(placedSymbols.map(s => s.id === sym.id ? { ...s, sampleNumber: val } : s));
                      }}
                      onBlur={() => onSetEditingSampleId(null)}
                      onClick={e => e.stopPropagation()}
                      style={{
                        width: '90%',
                        textAlign: 'center',
                        fontSize: Math.max(9, Math.round(sym.size * 0.22)),
                        fontWeight: 700,
                        background: 'rgba(255,255,255,0.95)',
                        border: '1px solid #333',
                        borderRadius: 3,
                        color: '#212121',
                        padding: '0 2px',
                        outline: 'none',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: Math.max(9, Math.round(sym.size * 0.22)),
                        fontWeight: 700,
                        color: '#212121',
                        cursor: 'pointer',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                      onDoubleClick={e => { e.stopPropagation(); onSetEditingSampleId(sym.id); }}
                      title="Двойной клик — изменить"
                    >
                      {sym.sampleNumber || '—'}
                    </span>
                  )}
                  {/* Стрелка */}
                  <img
                    src={sym.imageUrl}
                    alt={sym.label}
                    style={{ width: '100%', height: Math.max(10, Math.round(sym.size * 0.22)), objectFit: 'fill', pointerEvents: 'none', display: 'block', flexShrink: 0 }}
                    draggable={false}
                  />
                </div>
              ) : (
                <>
                  <img
                    src={sym.imageUrl}
                    alt={sym.label}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', display: 'block' }}
                    draggable={false}
                  />
                  {editingSampleId === sym.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={sym.sampleNumber ?? ''}
                      onChange={e => {
                        const val = e.target.value.slice(0, 6);
                        onPlacedChange(placedSymbols.map(s => s.id === sym.id ? { ...s, sampleNumber: val } : s));
                      }}
                      onBlur={() => onSetEditingSampleId(null)}
                      onClick={e => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        top: '45%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '60%',
                        textAlign: 'center',
                        fontSize: Math.max(10, sym.size * 0.28),
                        fontWeight: 900,
                        background: 'rgba(255,249,196,0.95)',
                        border: '1px solid #f57f17',
                        borderRadius: 3,
                        color: '#e65100',
                        padding: 0,
                        outline: 'none',
                        zIndex: 5,
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        position: 'absolute',
                        top: '45%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: Math.max(10, sym.size * 0.28),
                        fontWeight: 900,
                        color: '#e65100',
                        cursor: 'pointer',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'auto',
                      }}
                      onDoubleClick={e => { e.stopPropagation(); onSetEditingSampleId(sym.id); }}
                      title="Двойной клик — изменить"
                    >
                      {sym.sampleNumber ?? ''}
                    </span>
                  )}
                </>
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
  );
};

export default CanvasDrawArea;
