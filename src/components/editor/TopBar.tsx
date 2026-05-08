import React, { useState } from 'react';
import { useSchemaStore } from '@/store/schemaStore';
import Icon from '@/components/ui/icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import logoUrl from '/logo.svg';

interface TopBarProps {
  activeView: string;
  onViewChange: (v: string) => void;
  onExport: (type: 'pdf' | 'png' | 'print' | 'preview') => void;
  onHome?: () => void;
  isDemo?: boolean;
}

function exportSchemaToJson(schema: ReturnType<typeof useSchemaStore.getState>['schemas'][0]) {
  const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${schema.name.replace(/[^a-zA-Zа-яА-Я0-9_\- ]/g, '')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

const NAV_ITEMS = [
  { id: 'file', label: 'Файл', icon: 'FolderOpen' },
  { id: 'editor', label: 'Редактор', icon: 'PenTool' },
  { id: 'schemas', label: 'Схемы', icon: 'Map' },
  { id: 'settings', label: 'Настройки', icon: 'Settings2' },
  { id: 'help', label: 'Справка', icon: 'BookOpen' },
  { id: 'presentation', label: 'Презентация', icon: 'Presentation' },
];

const BACK_VIEWS = ['schemas', 'settings', 'help', 'presentation', 'activate', 'file'];

const TopBar: React.FC<TopBarProps> = ({ activeView, onViewChange, onExport, onHome, isDemo }) => {
  const { getActiveSchema, renameSchema } = useSchemaStore();
  const schema = getActiveSchema();
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const startEdit = () => { setNameVal(schema?.name || ''); setEditing(true); };
  const commitEdit = () => {
    if (schema && nameVal.trim()) renameSchema(schema.id, nameVal.trim());
    setEditing(false);
  };

  const handleNav = (id: string) => {
    onViewChange(id);
    setMenuOpen(false);
  };

  const handleBack = () => {
    onViewChange('editor');
    setMenuOpen(false);
  };

  const activeItem = NAV_ITEMS.find(i => i.id === activeView);
  const canGoBack = BACK_VIEWS.includes(activeView);

  return (
    <>
      <div className="toolbar-bg border-b border-border flex items-center h-12 px-2 md:px-3 gap-1 md:gap-2 flex-shrink-0" style={{ background: 'hsl(var(--toolbar-bg))' }}>

        {/* Лого */}
        <div className="flex items-center gap-1.5 mr-1 md:mr-2 flex-shrink-0">
          <img
            src={logoUrl} alt="САУ"
            className="w-7 h-7 rounded cursor-pointer hover:opacity-80 transition-opacity"
            style={{ objectFit: 'contain' }}
            onClick={onHome}
          />
          <span
            className="text-xs font-mono-tech px-1.5 py-0.5 rounded hidden sm:inline cursor-pointer"
            style={{ background: 'hsl(var(--warning) / 0.15)', color: 'hsl(var(--warning))', border: '1px solid hsl(var(--warning) / 0.3)' }}
            onDoubleClick={() => onViewChange('admin')}
            title="Двойной клик — панель администратора"
          >
            v1.003
          </span>
        </div>

        <div className="h-5 border-l border-border mx-0.5 md:mx-1 hidden md:block" />

        {/* Навигация — десктоп */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`tab-btn flex items-center gap-1.5 ${activeView === item.id ? 'active' : ''}`}
              onClick={() => handleNav(item.id)}
              title={item.label}
            >
              <Icon name={item.icon} size={13} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Мобиле: кнопка назад + текущий раздел */}
        <div className="flex md:hidden items-center gap-2 flex-1 min-w-0">
          {canGoBack && (
            <button
              className="flex items-center justify-center w-9 h-9 rounded transition-colors flex-shrink-0"
              style={{ color: 'hsl(var(--foreground))', background: 'hsl(var(--muted))' }}
              onClick={handleBack}
              aria-label="Назад"
            >
              <Icon name="ChevronLeft" size={18} />
            </button>
          )}
          {activeItem && (
            <span className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>
              {activeItem.label}
            </span>
          )}
          {activeView === 'editor' && schema && (
            <span className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {schema.name}
            </span>
          )}
        </div>

        {/* Название схемы — только десктоп */}
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

        <div className="flex-1 hidden md:block" />

        {/* Демо-бейдж */}
        {isDemo && (
          <button
            onClick={() => handleNav('activate')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold mr-1 transition-all hover:opacity-80"
            style={{ background: 'hsl(var(--warning) / 0.15)', color: 'hsl(var(--warning))', border: '1px solid hsl(var(--warning) / 0.4)' }}
          >
            <Icon name="Lock" size={12} />
            <span className="hidden sm:inline">Активировать</span>
          </button>
        )}

        {/* Кнопки экспорта — десктоп */}
        {activeView === 'editor' && (
          <div className="hidden md:flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all hover:opacity-80"
                  style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
                  onClick={() => onExport('preview')}
                >
                  <Icon name="Eye" size={13} />
                  Предпросмотр
                </button>
              </TooltipTrigger>
              <TooltipContent>Предпросмотр документа</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all hover:opacity-80"
                  style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
                  onClick={() => schema && exportSchemaToJson(schema)}
                >
                  <Icon name="Download" size={13} />
                  JSON
                </button>
              </TooltipTrigger>
              <TooltipContent>Сохранить схему как файл для резервной копии</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all"
                  style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                  onClick={() => onExport('print')}
                >
                  <Icon name="Printer" size={13} />
                  Печать / PDF
                </button>
              </TooltipTrigger>
              <TooltipContent>Сохранить PDF</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Бургер — только мобиле */}
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 rounded transition-colors flex-shrink-0"
          style={{ color: 'hsl(var(--foreground))' }}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Меню"
        >
          <Icon name={menuOpen ? 'X' : 'Menu'} size={20} />
        </button>
      </div>

      {/* Выпадающее мобильное меню */}
      {menuOpen && (
        <>
          {/* Оверлей */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setMenuOpen(false)}
          />
          {/* Панель */}
          <div
            className="fixed top-12 left-0 right-0 z-50 md:hidden border-b border-border overflow-y-auto"
            style={{ background: 'hsl(var(--toolbar-bg))', maxHeight: 'calc(100vh - 48px)' }}
          >
            {/* Кнопка Назад в меню */}
            {canGoBack && (
              <button
                className="w-full flex items-center gap-3 px-4 py-4 text-sm font-medium border-b-2 border-border transition-colors"
                style={{ color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.06)' }}
                onClick={handleBack}
              >
                <Icon name="ChevronLeft" size={18} />
                Назад к редактору
              </button>
            )}

            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                className="w-full flex items-center gap-3 px-4 py-4 text-sm transition-colors border-b border-border last:border-0"
                style={{
                  color: activeView === item.id ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                  background: activeView === item.id ? 'hsl(var(--primary) / 0.08)' : 'transparent',
                }}
                onClick={() => handleNav(item.id)}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
                {activeView === item.id && (
                  <Icon name="Check" size={14} style={{ marginLeft: 'auto', color: 'hsl(var(--primary))' }} />
                )}
              </button>
            ))}

            {/* Кнопки экспорта в меню если редактор */}
            {activeView === 'editor' && (
              <div className="p-3 border-t border-border grid grid-cols-3 gap-2">
                <button
                  className="flex flex-col items-center justify-center gap-1.5 py-3 rounded text-xs font-medium"
                  style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
                  onClick={() => { onExport('preview'); setMenuOpen(false); }}
                >
                  <Icon name="Eye" size={16} />
                  Просмотр
                </button>
                <button
                  className="flex flex-col items-center justify-center gap-1.5 py-3 rounded text-xs font-medium"
                  style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
                  onClick={() => { if (schema) exportSchemaToJson(schema); setMenuOpen(false); }}
                >
                  <Icon name="Download" size={16} />
                  JSON
                </button>
                <button
                  className="flex flex-col items-center justify-center gap-1.5 py-3 rounded text-xs font-medium"
                  style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                  onClick={() => { onExport('print'); setMenuOpen(false); }}
                >
                  <Icon name="Printer" size={16} />
                  Печать
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default TopBar;
