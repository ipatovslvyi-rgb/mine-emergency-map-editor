import React, { useState } from 'react';
import { useSchemaStore } from '@/store/schemaStore';
import Icon from '@/components/ui/icon';

interface SchemasPageProps {
  onOpen: () => void;
}

const SchemasPage: React.FC<SchemasPageProps> = ({ onOpen }) => {
  const { schemas, activeSchemaId, setActiveSchema, createSchema, deleteSchema, duplicateSchema, renameSchema } = useSchemaStore();
  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');

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

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

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
          <button
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all hover:opacity-80"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            onClick={() => setShowCreate(true)}
          >
            <Icon name="Plus" size={15} />
            Новая схема
          </button>
        </div>

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
                  className="tool-btn w-8 h-8 text-danger"
                  title="Удалить"
                  onClick={() => schemas.length > 1 && deleteSchema(schema.id)}
                  style={{ opacity: schemas.length <= 1 ? 0.3 : 1 }}
                >
                  <Icon name="Trash2" size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SchemasPage;
