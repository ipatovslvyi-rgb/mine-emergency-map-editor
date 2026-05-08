import React, { useState, useRef } from 'react';
import { useSchemaStore } from '@/store/schemaStore';
import { SchemaData } from '@/types/schema';
import Icon from '@/components/ui/icon';

interface SchemasPageProps {
  onOpen: () => void;
}

const SchemasPage: React.FC<SchemasPageProps> = ({ onOpen }) => {
  const { schemas, activeSchemaId, setActiveSchema, createSchema, deleteSchema, duplicateSchema, renameSchema, importSchema } = useSchemaStore();
  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createSchema(newName.trim());
    setNewName('');
    setShowCreate(false);
    onOpen();
  };

  const handleOpen = (id: string) => {
    setActiveSchema(id);
    onOpen();
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (schemas.length <= 1) return;
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmId) return;
    deleteSchema(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  const handleImportClick = () => {
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
        onOpen();
      } catch {
        setImportError('Файл повреждён или имеет неверный формат');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const schemaToDelete = schemas.find(s => s.id === deleteConfirmId);

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold">Мои схемы</h1>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {schemas.length} схем сохранено
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all hover:opacity-80"
              style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}
              onClick={handleImportClick}
              title="Импортировать схему из файла .json"
            >
              <Icon name="Upload" size={15} />
              Импорт
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all hover:opacity-80"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              onClick={() => setShowCreate(true)}
            >
              <Icon name="Plus" size={15} />
              Новая схема
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />

        {importError && (
          <div className="p-3 rounded-lg mb-4 border text-sm animate-scale-in"
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

        {showCreate && (
          <div className="p-4 rounded-lg mb-4 border animate-scale-in" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <div className="text-sm font-medium mb-2">Создать новую схему</div>
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                placeholder="Название схемы..."
                className="prop-input flex-1"
                style={{ fontSize: 13 }}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowCreate(false); }}
              />
              <button
                className="px-4 py-1.5 rounded text-sm font-medium"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                onClick={handleCreate}
              >Создать</button>
              <button
                className="px-3 py-1.5 rounded text-sm"
                style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}
                onClick={() => setShowCreate(false)}
              >Отмена</button>
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {schemas.map(schema => (
            <div
              key={schema.id}
              className="flex items-center gap-4 p-4 rounded-lg border transition-all hover:border-primary cursor-pointer"
              style={{
                background: 'hsl(var(--card))',
                borderColor: activeSchemaId === schema.id ? 'hsl(var(--primary) / 0.6)' : 'hsl(var(--border))',
              }}
              onClick={() => handleOpen(schema.id)}
            >
              <div className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                <Icon name="Map" size={22} style={{ color: 'hsl(var(--primary))' }} />
              </div>

              <div className="flex-1 min-w-0">
                {renamingId === schema.id ? (
                  <input
                    autoFocus
                    className="prop-input text-sm w-full"
                    value={renameVal}
                    onChange={e => setRenameVal(e.target.value)}
                    onBlur={() => { renameSchema(schema.id, renameVal); setRenamingId(null); }}
                    onKeyDown={e => {
                      e.stopPropagation();
                      if (e.key === 'Enter') { renameSchema(schema.id, renameVal); setRenamingId(null); }
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <div className="font-medium text-sm truncate">{schema.name}</div>
                )}
                <div className="text-xs mt-0.5 flex items-center gap-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <span>{schema.elements.length} элементов</span>
                  <span>v{schema.version}</span>
                  <span>Изм: {formatDate(schema.updatedAt)}</span>
                </div>
              </div>

              {activeSchemaId === schema.id && (
                <span className="text-xs px-2 py-0.5 rounded font-medium"
                  style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.3)' }}>
                  Активна
                </span>
              )}

              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <button
                  className="tool-btn w-8 h-8"
                  title="Переименовать"
                  onClick={() => { setRenamingId(schema.id); setRenameVal(schema.name); }}
                >
                  <Icon name="Pencil" size={13} />
                </button>
                <button
                  className="tool-btn w-8 h-8"
                  title="Дублировать"
                  onClick={() => duplicateSchema(schema.id)}
                >
                  <Icon name="Copy" size={13} />
                </button>
                <button
                  className="tool-btn w-8 h-8"
                  title="Удалить"
                  onClick={(e) => handleDeleteClick(e, schema.id)}
                  style={{ opacity: schemas.length <= 1 ? 0.3 : 1, color: 'hsl(var(--destructive))' }}
                  disabled={schemas.length <= 1}
                >
                  <Icon name="Trash2" size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {deleteConfirmId && schemaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-xl border p-6 w-full max-w-sm shadow-xl animate-scale-in"
            style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'hsl(var(--destructive) / 0.15)' }}>
                <Icon name="Trash2" size={18} style={{ color: 'hsl(var(--destructive))' }} />
              </div>
              <div>
                <div className="font-semibold text-sm">Удалить схему?</div>
                <div className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Это действие нельзя отменить</div>
              </div>
            </div>
            <div className="text-sm mb-4 px-1 py-2 rounded"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}>
              «{schemaToDelete.name}»
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 py-2 rounded text-sm font-medium transition-all hover:opacity-80"
                style={{ background: 'hsl(var(--destructive))', color: 'white' }}
                onClick={handleDeleteConfirm}
              >Удалить</button>
              <button
                className="flex-1 py-2 rounded text-sm transition-all hover:opacity-80"
                style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}
                onClick={() => setDeleteConfirmId(null)}
              >Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchemasPage;
