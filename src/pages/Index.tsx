import React, { useState, useCallback, useEffect } from 'react';
import TopBar from '@/components/editor/TopBar';
import Toolbar from '@/components/editor/Toolbar';
import SymbolLibrary from '@/components/editor/SymbolLibrary';
import Canvas from '@/components/editor/Canvas';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import SchemasPage from './SchemasPage';
import SettingsPage from './SettingsPage';
import HelpPage from './HelpPage';
import { useSchemaStore } from '@/store/schemaStore';
import { ToolType } from '@/types/schema';

const Index: React.FC = () => {
  const [activeView, setActiveView] = useState<string>('editor');
  const { getActiveSchema, zoom, setZoom, undo, redo, deleteSelectedElements, setActiveTool } = useSchemaStore();
  const schema = getActiveSchema();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA'].includes(tag)) return;

      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) { e.preventDefault(); redo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelectedElements();
      if (e.key === 'Escape') useSchemaStore.getState().clearSelection();

      if (!e.ctrlKey && !e.metaKey) {
        const map: Record<string, string> = { v: 'select', h: 'pan', l: 'line', a: 'arrow', r: 'rect', e: 'ellipse', t: 'text', i: 'image' };
        if (map[e.key]) setActiveTool(map[e.key] as ToolType);
      }

      if (e.ctrlKey && e.key === '=') { e.preventDefault(); setZoom(zoom + 0.1); }
      if (e.ctrlKey && e.key === '-') { e.preventDefault(); setZoom(zoom - 0.1); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zoom, undo, redo, deleteSelectedElements, setActiveTool, setZoom]);

  const handleExport = useCallback(async (type: 'pdf' | 'png' | 'print') => {
    if (type === 'print' || type === 'pdf') {
      window.print();
      return;
    }

    if (type === 'png') {
      const schemaEl = document.querySelector('[data-canvas-inner]') as HTMLElement;
      if (!schemaEl) {
        alert('Для экспорта в PNG используйте Ctrl+P и сохраните как PDF, затем конвертируйте.');
        return;
      }
    }
  }, []);

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
            <Toolbar />
            <div className="border-r border-border flex-shrink-0" style={{ background: 'hsl(var(--panel-bg))' }}>
              <SymbolLibrary />
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <Canvas />
            </div>
            <div className="border-l border-border flex-shrink-0" style={{ background: 'hsl(var(--panel-bg))' }}>
              <PropertiesPanel />
            </div>
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
    </div>
  );
};

export default Index;