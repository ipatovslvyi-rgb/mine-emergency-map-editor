import React from 'react';
import Icon from '@/components/ui/icon';
import { useSchemaStore } from '@/store/schemaStore';
import { ToolType } from '@/types/schema';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ToolDef {
  id: ToolType;
  icon: string;
  label: string;
  shortcut?: string;
}

const TOOLS: ToolDef[] = [
  { id: 'select', icon: 'MousePointer2', label: 'Выбор', shortcut: 'V' },
  { id: 'pan', icon: 'Hand', label: 'Перемещение', shortcut: 'H' },
];

const DRAW_TOOLS: ToolDef[] = [
  { id: 'line', icon: 'Minus', label: 'Линия', shortcut: 'L' },
  { id: 'arrow', icon: 'MoveRight', label: 'Стрелка', shortcut: 'A' },
  { id: 'rect', icon: 'Square', label: 'Прямоугольник', shortcut: 'R' },
  { id: 'ellipse', icon: 'Circle', label: 'Эллипс', shortcut: 'E' },
  { id: 'text', icon: 'Type', label: 'Текст', shortcut: 'T' },
  { id: 'image', icon: 'Image', label: 'Изображение', shortcut: 'I' },
];

const Toolbar: React.FC = () => {
  const { activeTool, setActiveTool, undo, redo, deleteSelectedElements, zoom, setZoom } = useSchemaStore();

  const ToolButton = ({ tool, side = 'right' as 'right' | 'top' }: { tool: ToolDef; side?: 'right' | 'top' }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={`tool-btn w-10 h-10 ${activeTool === tool.id ? 'active' : ''}`}
          onClick={() => setActiveTool(tool.id)}
        >
          <Icon name={tool.icon} size={18} />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="text-xs">
        {tool.label} {tool.shortcut && <span className="opacity-60 ml-1">[{tool.shortcut}]</span>}
      </TooltipContent>
    </Tooltip>
  );

  return (
    <>
      {/* Desktop: вертикальная панель слева */}
      <div className="hidden md:flex toolbar-bg border-r border-border flex-col items-center py-3 gap-1 w-12" style={{ minWidth: 48 }}>
        {TOOLS.map(t => <ToolButton key={t.id} tool={t} />)}
        <div className="w-6 border-t border-border my-1" />
        {DRAW_TOOLS.map(t => <ToolButton key={t.id} tool={t} />)}
        <div className="flex-1" />
        <div className="w-6 border-t border-border my-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="tool-btn w-10 h-10" onClick={undo}><Icon name="Undo2" size={16} /></button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">Отменить [Ctrl+Z]</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="tool-btn w-10 h-10" onClick={redo}><Icon name="Redo2" size={16} /></button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">Повторить [Ctrl+Y]</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="tool-btn w-10 h-10 text-danger" onClick={deleteSelectedElements}><Icon name="Trash2" size={16} /></button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">Удалить [Del]</TooltipContent>
        </Tooltip>
        <div className="w-6 border-t border-border my-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="tool-btn w-10 h-8 text-xs font-mono-tech" onClick={() => setZoom(zoom + 0.1)}><Icon name="ZoomIn" size={16} /></button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">Приблизить</TooltipContent>
        </Tooltip>
        <span className="text-xs font-mono-tech" style={{ color: 'hsl(var(--muted-foreground))' }}>{Math.round(zoom * 100)}%</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="tool-btn w-10 h-8 text-xs" onClick={() => setZoom(zoom - 0.1)}><Icon name="ZoomOut" size={16} /></button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">Отдалить</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="tool-btn w-10 h-8 text-xs" onClick={() => setZoom(1)}><Icon name="Maximize2" size={14} /></button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">По размеру</TooltipContent>
        </Tooltip>
      </div>

      {/* Mobile: горизонтальная панель снизу */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 toolbar-bg border-t border-border flex items-center justify-around px-1 py-1" style={{ paddingBottom: 'env(safe-area-inset-bottom, 4px)' }}>
        {[...TOOLS, ...DRAW_TOOLS].map(t => (
          <Tooltip key={t.id}>
            <TooltipTrigger asChild>
              <button
                className={`tool-btn flex-1 h-11 ${activeTool === t.id ? 'active' : ''}`}
                onClick={() => setActiveTool(t.id)}
                style={{ minWidth: 36 }}
              >
                <Icon name={t.icon} size={20} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">{t.label}</TooltipContent>
          </Tooltip>
        ))}
        <div style={{ width: 1, height: 24, background: 'hsl(var(--border))', margin: '0 2px' }} />
        <button className="tool-btn flex-1 h-11" onClick={undo} style={{ minWidth: 36 }}><Icon name="Undo2" size={20} /></button>
        <button className="tool-btn flex-1 h-11" onClick={redo} style={{ minWidth: 36 }}><Icon name="Redo2" size={20} /></button>
        <button className="tool-btn flex-1 h-11 text-danger" onClick={deleteSelectedElements} style={{ minWidth: 36 }}><Icon name="Trash2" size={20} /></button>
        <div style={{ width: 1, height: 24, background: 'hsl(var(--border))', margin: '0 2px' }} />
        <button className="tool-btn flex-1 h-11" onClick={() => setZoom(zoom + 0.1)} style={{ minWidth: 36 }}><Icon name="ZoomIn" size={20} /></button>
        <button className="tool-btn flex-1 h-11" onClick={() => setZoom(zoom - 0.1)} style={{ minWidth: 36 }}><Icon name="ZoomOut" size={20} /></button>
      </div>
    </>
  );
};

export default Toolbar;
