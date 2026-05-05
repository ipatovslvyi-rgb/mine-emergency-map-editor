import React, { useState } from 'react';
import { useSchemaStore } from '@/store/schemaStore';
import Icon from '@/components/ui/icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TopBarProps {
  activeView: string;
  onViewChange: (v: string) => void;
  onExport: (type: 'pdf' | 'png' | 'print' | 'preview') => void;
  onHome?: () => void;
  isDemo?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ activeView, onViewChange, onExport, onHome, isDemo }) => {
  const { getActiveSchema, renameSchema } = useSchemaStore();
  const schema = getActiveSchema();
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState('');

  const startEdit = () => {
    setNameVal(schema?.name || '');
    setEditing(true);
  };
  const commitEdit = () => {
    if (schema && nameVal.trim()) renameSchema(schema.id, nameVal.trim());
    setEditing(false);
  };

  const NAV_ITEMS = [
    { id: 'home', label: 'Главная', icon: 'House' },
    { id: 'editor', label: 'Редактор', icon: 'PenTool' },
    { id: 'schemas', label: 'Схемы', icon: 'FolderOpen' },
    { id: 'settings', label: 'Настройки', icon: 'Settings2' },
    { id: 'help', label: 'Справка', icon: 'BookOpen' },
  ];

  return (
    <div className="toolbar-bg border-b border-border flex items-center h-11 px-2 md:px-3 gap-1 md:gap-2 flex-shrink-0">
      {/* Лого */}
      <div className="flex items-center gap-1.5 mr-1 md:mr-2 flex-shrink-0">
        <img src="/logo.svg" alt="САУ" className="w-7 h-7 rounded cursor-pointer hover:opacity-80 transition-opacity" style={{ objectFit: 'contain' }} onClick={onHome} />
        <span
          className="text-xs font-mono-tech px-1.5 py-0.5 rounded hidden sm:inline cursor-pointer"
          style={{ background: 'hsl(var(--warning) / 0.15)', color: 'hsl(var(--warning))', border: '1px solid hsl(var(--warning) / 0.3)' }}
          onDoubleClick={() => onViewChange('admin')}
          title="Двойной клик — панель администратора"
        >
          v1.001
        </span>
      </div>

      <div className="h-5 border-l border-border mx-0.5 md:mx-1 hidden sm:block" />

      {/* Навигация — на мобиле только иконки */}
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className={`tab-btn flex items-center gap-1.5 ${activeView === item.id ? 'active' : ''}`}
          onClick={() => onViewChange(item.id)}
          title={item.label}
        >
          <Icon name={item.icon} size={13} />
          <span className="hidden sm:inline">{item.label}</span>
        </button>
      ))}

      {/* Название схемы — скрыто на мобиле */}
      {schema && activeView === 'editor' && (
        <>
          <div className="h-5 border-l border-border mx-0.5 hidden md:block" />
          {editing ? (
            <input
              autoFocus
              className="prop-input text-sm hidden md:block"
              style={{ width: 160 }}
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false); }}
            />
          ) : (
            <button
              className="hidden md:flex items-center gap-1.5 text-sm hover:text-foreground transition-colors px-1"
              style={{ color: 'hsl(var(--muted-foreground))' }}
              onClick={startEdit}
            >
              {schema.name}
              <Icon name="Pencil" size={11} />
            </button>
          )}
        </>
      )}

      <div className="flex-1" />

      {/* Демо-бейдж */}
      {isDemo && (
        <button
          onClick={() => onViewChange('activate')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold mr-1 transition-all hover:opacity-80"
          style={{ background: 'hsl(var(--warning) / 0.15)', color: 'hsl(var(--warning))', border: '1px solid hsl(var(--warning) / 0.4)' }}
        >
          <Icon name="Lock" size={11} />
          <span className="hidden sm:inline">Демо</span>
          <span className="hidden sm:inline">· Активировать</span>
        </button>
      )}

      {/* Кнопки экспорта */}
      {activeView === 'editor' && (
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded text-xs font-medium transition-all hover:opacity-80"
                style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
                onClick={() => onExport('preview')}
              >
                <Icon name="Eye" size={13} />
                <span className="hidden sm:inline">Предпросмотр</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>Предпросмотр документа</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded text-xs font-medium transition-all"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                onClick={() => onExport('print')}
              >
                <Icon name="Printer" size={13} />
                <span className="hidden sm:inline">Печать / PDF</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>Отправить на печать или сохранить PDF</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default TopBar;