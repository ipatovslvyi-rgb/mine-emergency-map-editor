import React, { useState, useCallback, useEffect } from 'react';
import TopBar from '@/components/editor/TopBar';
import SchemaFormPanel from '@/components/editor/SchemaFormPanel';
import PrintDocument from '@/components/editor/PrintDocument';
import PreviewPage from './PreviewPage';
import SchemasPage from './SchemasPage';
import SettingsPage from './SettingsPage';
import HelpPage from './HelpPage';
import LandingPage from './LandingPage';
import { useSchemaStore } from '@/store/schemaStore';
import { defaultFormData, SchemaFormData } from '@/types/schema';
import Icon from '@/components/ui/icon';

const Index: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [activeView, setActiveView] = useState<string>('editor');
  const [editorTab, setEditorTab] = useState<'form' | 'preview'>('form');
  const { getActiveSchema, zoom, undo, redo, updateFormData } = useSchemaStore();
  const schema = getActiveSchema();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA'].includes(tag)) return;
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const handleExport = useCallback(async (type: 'pdf' | 'png' | 'print') => {
    if (type === 'preview') { setEditorTab('preview'); return; }
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
        v1.001
      </span>
      {schema && <span style={{ color: 'hsl(var(--foreground))' }}>{schema.name}</span>}
      <span className="flex-1" />
      <span>{new Date().toLocaleDateString('ru-RU')}</span>
    </div>
  );

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
      <TopBar activeView={activeView} onViewChange={setActiveView} onExport={handleExport} onHome={() => setShowLanding(true)} />

      <div className="flex flex-1 overflow-hidden">
        {activeView === 'editor' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Переключатель вкладок */}
            <div className="flex items-center border-b border-border flex-shrink-0" style={{ background: 'hsl(var(--toolbar-bg))' }}>
              <button
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-all ${editorTab === 'form' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                style={{ borderBottomColor: editorTab === 'form' ? 'hsl(var(--primary))' : 'transparent' }}
                onClick={() => setEditorTab('form')}
              >
                <Icon name="ClipboardList" size={13} />
                Ввод данных
              </button>
              <button
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-all ${editorTab === 'preview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                style={{ borderBottomColor: editorTab === 'preview' ? 'hsl(var(--primary))' : 'transparent' }}
                onClick={() => setEditorTab('preview')}
              >
                <Icon name="Eye" size={13} />
                Предпросмотр
              </button>
              {editorTab === 'form' && (
                <div className="flex-1 flex justify-end px-3">
                  <span className="text-xs px-2 py-0.5 rounded hidden sm:inline" style={{ background: 'hsl(var(--safe) / 0.15)', color: 'hsl(var(--safe))', border: '1px solid hsl(var(--safe) / 0.3)' }}>
                    Данные сохраняются автоматически
                  </span>
                </div>
              )}
            </div>

            {editorTab === 'form' ? (
              <div className="flex-1 overflow-hidden">
                <SchemaFormPanel data={formData} onChange={handleFormChange} />
              </div>
            ) : (
              <PreviewPage
                data={formData}
                schemaName={schema?.name ?? ''}
                onClose={() => setEditorTab('form')}
                onPrint={() => window.print()}
              />
            )}
          </div>
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