import React, { useRef, useState } from 'react';
import { useSchemaStore } from '@/store/schemaStore';
import { SchemaData } from '@/types/schema';
import Icon from '@/components/ui/icon';

interface FilePageProps {
  onOpenEditor: () => void;
}

const FilePage: React.FC<FilePageProps> = ({ onOpenEditor }) => {
  const { getActiveSchema, schemas, createSchema, importSchema, renameSchema } = useSchemaStore();
  const schema = getActiveSchema();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [saveAsName, setSaveAsName] = useState('');
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [saved, setSaved] = useState(false);

  const exportSchemaToJson = (s: SchemaData, filename?: string) => {
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(filename || s.name).replace(/[^a-zA-Zа-яА-Я0-9_\- ]/g, '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    if (!schema) return;
    exportSchemaToJson(schema);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveAs = () => {
    if (!schema || !saveAsName.trim()) return;
    exportSchemaToJson(schema, saveAsName.trim());
    setShowSaveAs(false);
    setSaveAsName('');
  };

  const handleOpen = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      setImportError('Выберите файл формата .json');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as SchemaData;
        if (!data.elements || !data.name) throw new Error('Неверный формат');
        importSchema(data);
        onOpenEditor();
      } catch {
        setImportError('Файл повреждён или имеет неверный формат');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const actions = [
    {
      id: 'open',
      icon: 'FolderOpen',
      label: 'Открыть',
      desc: 'Загрузить схему из файла .json',
      shortcut: 'Ctrl+O',
      onClick: handleOpen,
      variant: 'secondary',
    },
    {
      id: 'save',
      icon: 'Save',
      label: 'Сохранить',
      desc: schema ? `Скачать "${schema.name}" как файл .json` : 'Нет активной схемы',
      shortcut: 'Ctrl+S',
      onClick: handleSave,
      disabled: !schema,
      variant: 'primary',
    },
    {
      id: 'saveas',
      icon: 'SaveAll',
      label: 'Сохранить как...',
      desc: 'Сохранить схему под другим именем',
      shortcut: 'Ctrl+Shift+S',
      onClick: () => { setSaveAsName(schema?.name || ''); setShowSaveAs(true); },
      disabled: !schema,
      variant: 'secondary',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto animate-fade-in" style={{ background: 'hsl(var(--background))' }}>
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <h1 className="text-lg font-semibold mb-1">Файл</h1>
        <p className="text-xs mb-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Управление файлами схем
        </p>

        {importError && (
          <div className="p-3 rounded-lg mb-4 border text-sm"
            style={{ background: 'hsl(var(--destructive) / 0.1)', borderColor: 'hsl(var(--destructive) / 0.4)', color: 'hsl(var(--destructive))' }}>
            <div className="flex items-center gap-2">
              <Icon name="AlertCircle" size={14} />
              {importError}
              <button className="ml-auto" onClick={() => setImportError(null)}>
                <Icon name="X" size={12} />
              </button>
            </div>
          </div>
        )}

        {saved && (
          <div className="p-3 rounded-lg mb-4 border text-sm"
            style={{ background: 'hsl(var(--safe) / 0.1)', borderColor: 'hsl(var(--safe) / 0.4)', color: 'hsl(var(--safe))' }}>
            <div className="flex items-center gap-2">
              <Icon name="CheckCircle" size={14} />
              Файл сохранён успешно
            </div>
          </div>
        )}

        {/* Активная схема */}
        {schema && (
          <div className="p-4 rounded-lg border mb-6 flex items-center gap-3"
            style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: 'hsl(var(--primary) / 0.1)', border: '1px solid hsl(var(--primary) / 0.3)' }}>
              <Icon name="FileText" size={18} style={{ color: 'hsl(var(--primary))' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{schema.name}</div>
              <div className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {schema.elements.length} элементов · Активная схема
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded"
              style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.3)' }}>
              Открыта
            </span>
          </div>
        )}

        {/* Действия */}
        <div className="grid gap-3">
          {actions.map(action => (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={action.disabled}
              className="flex items-center gap-4 p-4 rounded-lg border text-left w-full transition-all hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
            >
              <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
                style={{
                  background: action.variant === 'primary' ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted))',
                  border: `1px solid ${action.variant === 'primary' ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--border))'}`,
                }}>
                <Icon name={action.icon} size={18} style={{ color: action.variant === 'primary' ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{action.label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{action.desc}</div>
              </div>
              <span className="text-xs px-2 py-1 rounded font-mono hidden sm:inline"
                style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
                {action.shortcut}
              </span>
            </button>
          ))}
        </div>

        {/* Последние схемы */}
        {schemas.length > 1 && (
          <div className="mt-8">
            <h2 className="text-sm font-medium mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Последние схемы
            </h2>
            <div className="grid gap-2">
              {schemas.slice(0, 5).map(s => (
                <button
                  key={s.id}
                  onClick={() => { useSchemaStore.getState().setActiveSchema(s.id); onOpenEditor(); }}
                  className="flex items-center gap-3 p-3 rounded-lg border text-left w-full transition-all hover:border-primary"
                  style={{
                    background: 'hsl(var(--card))',
                    borderColor: s.id === useSchemaStore.getState().activeSchemaId ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--border))',
                  }}
                >
                  <Icon name="FileJson" size={15} style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <span className="text-sm truncate flex-1">{s.name}</span>
                  {s.id === useSchemaStore.getState().activeSchemaId && (
                    <Icon name="Check" size={13} style={{ color: 'hsl(var(--primary))' }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Модальное окно "Сохранить как" */}
      {showSaveAs && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setShowSaveAs(false)}
          />
          <div
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm p-6 rounded-xl border shadow-xl"
            style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
          >
            <h3 className="text-sm font-semibold mb-4">Сохранить как...</h3>
            <input
              autoFocus
              type="text"
              placeholder="Название файла..."
              className="prop-input w-full mb-4"
              value={saveAsName}
              onChange={e => setSaveAsName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveAs(); if (e.key === 'Escape') setShowSaveAs(false); }}
            />
            <div className="flex gap-2">
              <button
                className="flex-1 py-2 rounded text-sm font-medium"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                onClick={handleSaveAs}
                disabled={!saveAsName.trim()}
              >
                Сохранить
              </button>
              <button
                className="px-4 py-2 rounded text-sm"
                style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}
                onClick={() => setShowSaveAs(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FilePage;
