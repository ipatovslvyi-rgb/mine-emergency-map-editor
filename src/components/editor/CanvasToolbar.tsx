import React from 'react';
import { PlacedSymbol } from '@/types/schema';
import Icon from '@/components/ui/icon';

export type ActiveTool = 'select' | 'pencil' | 'eraser';

const PENCIL_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#000000', '#ffffff'];

interface Props {
  isMobile: boolean;
  activeTool: ActiveTool;
  pencilColor: string;
  pencilWidth: number;
  strokes: unknown[];
  selected: string | null;
  selectedSym: PlacedSymbol | undefined;
  placedSymbols: PlacedSymbol[];
  rotationInput: string;
  onSetActiveTool: (tool: ActiveTool) => void;
  onSetSelected: (id: string | null) => void;
  onSetPencilColor: (c: string) => void;
  onSetPencilWidth: (w: number) => void;
  onUndoStroke: () => void;
  onClearStrokes: () => void;
  onResizeSelected: (delta: number) => void;
  onRotateSelected: (delta: number) => void;
  onRotationInputChange: (val: string) => void;
  onApplyRotation: (deg: number) => void;
  onSampleNumberChange: (val: string) => void;
  onResizeArrow: (delta: number) => void;
  onDeleteSelected: () => void;
}

const CanvasToolbar: React.FC<Props> = ({
  isMobile,
  activeTool,
  pencilColor,
  pencilWidth,
  strokes,
  selected,
  selectedSym,
  rotationInput,
  onSetActiveTool,
  onSetSelected,
  onSetPencilColor,
  onSetPencilWidth,
  onUndoStroke,
  onClearStrokes,
  onResizeSelected,
  onRotateSelected,
  onRotationInputChange,
  onApplyRotation,
  onSampleNumberChange,
  onResizeArrow,
  onDeleteSelected,
  placedSymbols,
}) => {
  const isDrawTool = activeTool === 'pencil' || activeTool === 'eraser';

  return (
    <div className="flex-shrink-0 flex flex-wrap items-center gap-2 px-3 py-1.5 border-b border-border text-xs" style={{ background: 'hsl(var(--muted))' }}>

      {/* Режимы */}
      <div className="flex gap-1">
        {(['select', 'pencil', 'eraser'] as ActiveTool[]).map(tool => (
          <button
            key={tool}
            onClick={() => { onSetActiveTool(tool); onSetSelected(null); }}
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
              onClick={() => onSetPencilColor(c)}
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
            onChange={e => onSetPencilWidth(Number(e.target.value))}
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
            onChange={e => onSetPencilWidth(Number(e.target.value))}
            style={{ fontSize: 11, padding: '1px 2px', borderRadius: 3, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
          >
            {[2, 5, 10, 20, 40].map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
      )}

      {isDrawTool && strokes.length > 0 && (
        <>
          <button
            onClick={onUndoStroke}
            style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}
          >
            <Icon name="Undo2" size={11} /> Отмена
          </button>
          <button
            onClick={onClearStrokes}
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
          <button onClick={() => onResizeSelected(-8)} className="px-2 py-0.5 rounded border border-border" style={{ background: 'hsl(var(--card))' }}>−</button>
          <span style={{ color: 'hsl(var(--muted-foreground))' }}>размер</span>
          <button onClick={() => onResizeSelected(8)} className="px-2 py-0.5 rounded border border-border" style={{ background: 'hsl(var(--card))' }}>+</button>

          <div className="h-4 w-px" style={{ background: 'hsl(var(--border))' }} />
          <button onClick={() => onRotateSelected(-15)} className="px-1.5 py-0.5 rounded border border-border" style={{ background: 'hsl(var(--card))' }} title="−15°">↺</button>
          <button onClick={() => onRotateSelected(15)} className="px-1.5 py-0.5 rounded border border-border" style={{ background: 'hsl(var(--card))' }} title="+15°">↻</button>
          <input
            type="number"
            min={0}
            max={359}
            value={rotationInput}
            onChange={e => {
              onRotationInputChange(e.target.value);
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v)) onApplyRotation(v);
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
                {selectedSym.label === 'Расстояние' ? 'м:' : 'чел:'}
              </span>
              <input
                type="text"
                value={selectedSym.sampleNumber ?? ''}
                onClick={e => e.stopPropagation()}
                onChange={e => onSampleNumberChange(e.target.value.slice(0, 6))}
                style={{ width: 44, padding: '1px 4px', fontSize: 12, borderRadius: 3, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', textAlign: 'center' }}
              />
              {selectedSym.label === 'Расстояние' && (
                <>
                  <div className="h-4 w-px" style={{ background: 'hsl(var(--border))' }} />
                  <button onClick={() => onResizeArrow(-20)} className="px-2 py-0.5 rounded border border-border" style={{ background: 'hsl(var(--card))' }} title="Уменьшить ширину стрелки">−</button>
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>стрелка</span>
                  <button onClick={() => onResizeArrow(20)} className="px-2 py-0.5 rounded border border-border" style={{ background: 'hsl(var(--card))' }} title="Увеличить ширину стрелки">+</button>
                </>
              )}
            </>
          )}

          <div className="flex-1" />
          <button
            onClick={onDeleteSelected}
            className="flex items-center gap-1 px-2 py-0.5 rounded"
            style={{ background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', border: '1px solid hsl(var(--destructive) / 0.3)' }}
          >
            <Icon name="Trash2" size={11} /> Удалить
          </button>
          <button onClick={() => onSetSelected(null)} className="px-2 py-0.5 rounded border border-border">✕</button>
        </>
      )}
    </div>
  );
};

export default CanvasToolbar;