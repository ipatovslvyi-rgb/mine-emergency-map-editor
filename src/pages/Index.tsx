import React, { useState, useCallback, useEffect } from 'react';
import TopBar from '@/components/editor/TopBar';
import Toolbar from '@/components/editor/Toolbar';
import SymbolLibrary from '@/components/editor/SymbolLibrary';
import Canvas from '@/components/editor/Canvas';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import SchemaFormPanel from '@/components/editor/SchemaFormPanel';
import PrintDocument from '@/components/editor/PrintDocument';
import SchemasPage from './SchemasPage';
import SettingsPage from './SettingsPage';
import HelpPage from './HelpPage';
import { useSchemaStore } from '@/store/schemaStore';
import { ToolType, defaultFormData, SchemaFormData } from '@/types/schema';
import Icon from '@/components/ui/icon';

const Index: React.FC = () => {
  const [activeView, setActiveView] = useState<string>('editor');
  const [editorTab, setEditorTab] = useState<'canvas' | 'form'>('form');
  const { getActiveSchema, zoom, setZoom, undo, redo, deleteSelectedElements, setActiveTool, updateFormData } = useSchemaStore();
  const schema = getActiveSchema();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA'].includes(tag)) return;

      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) { e.preventDefault(); redo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelectedElements();
      if (e.key === 'Escape') useSchemaStore.getState().clearSelection();

      if (editorTab === 'canvas' && !e.ctrlKey && !e.metaKey) {
        const map: Record<string, string> = { v: 'select', h: 'pan', l: 'line', a: 'arrow', r: 'rect', e: 'ellipse', t: 'text', i: 'image' };
        if (map[e.key]) setActiveTool(map[e.key] as ToolType);
      }

      if (e.ctrlKey && e.key === '=') { e.preventDefault(); setZoom(zoom + 0.1); }
      if (e.ctrlKey && e.key === '-') { e.preventDefault(); setZoom(zoom - 0.1); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zoom, undo, redo, deleteSelectedElements, setActiveTool, setZoom, editorTab]);

  const handleExport = useCallback(async (type: 'pdf' | 'png' | 'print') => {
    window.print();
  }, []);

  const handleFormChange = (data: SchemaFormData) => {
    if (schema) updateFormData(schema.id, data);
  };

  const formData = schema?.formData ?? defaultFormData();

  const statusBar = (
    <div className="status-bar flex-shrink-0">
      <span className="flex items-center gap-1.5" style={{ color: 'hsl(var(--warning))' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'hsl(var(--warning))', display: 'inline-block', flexShrink: 0 }} />
        АЭМП v1.0
      </span>
      {schema && <span style={{ color: 'hsl(var(--foreground))' }}>{schema.name}</span>}
      <span className="flex-1" />
      <span>Элементов: {schema?.elements.length ?? 0}</span>
      <span className="font-mono-tech">{Math.round(zoom * 100)}%</span>
      <span>{new Date().toLocaleDateString('ru-RU')}</span>
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
      <TopBar activeView={activeView} onViewChange={setActiveView} onExport={handleExport} />

      <div className="flex flex-1 overflow-hidden">
        {activeView === 'editor' ? (
          <>
            {editorTab === 'canvas' && <Toolbar />}
            {editorTab === 'canvas' && (
              <div className="border-r border-border flex-shrink-0" style={{ background: 'hsl(var(--panel-bg))' }}>
                <SymbolLibrary />
              </div>
            )}

            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Переключатель вкладок */}
              <div className="flex items-center border-b border-border flex-shrink-0" style={{ background: 'hsl(var(--toolbar-bg))' }}>
                <button
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-all ${editorTab === 'form' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                  style={{ borderBottomColor: editorTab === 'form' ? 'hsl(var(--primary))' : 'transparent' }}
                  onClick={() => setEditorTab('form')}
                >
                  <Icon name="ClipboardList" size={13} />
                  Данные схемы
                </button>
                <button
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-all ${editorTab === 'canvas' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                  style={{ borderBottomColor: editorTab === 'canvas' ? 'hsl(var(--primary))' : 'transparent' }}
                  onClick={() => setEditorTab('canvas')}
                >
                  <Icon name="PenTool" size={13} />
                  Схема / Чертёж
                </button>
                {editorTab === 'form' && (
                  <div className="flex-1 flex justify-end px-3">
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'hsl(var(--safe) / 0.15)', color: 'hsl(var(--safe))', border: '1px solid hsl(var(--safe) / 0.3)' }}>
                      Данные сохраняются автоматически
                    </span>
                  </div>
                )}
              </div>

              {editorTab === 'form' ? (
                <SchemaFormPanel data={formData} onChange={handleFormChange} />
              ) : (
                <Canvas />
              )}
            </div>

            {editorTab === 'canvas' && (
              <div className="border-l border-border flex-shrink-0" style={{ background: 'hsl(var(--panel-bg))' }}>
                <PropertiesPanel />
              </div>
            )}
          </>
        ) : activeView === 'schemas' ? (
          <SchemasPage onOpen={() => setActiveView('editor')} />
        ) : activeView === 'settings' ? (
          <SettingsPage />
        ) : (
          <HelpPage />
        )}
      </div>

      {statusBar}

      {/* Скрытый блок для печати — виден только при window.print() */}
      <div className="print-wrapper">
        <PrintDocument data={formData} schemaName={schema?.name ?? ''} />
      </div>
    </div>
  );
};

export default Index;