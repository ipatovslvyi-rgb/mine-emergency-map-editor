import { create } from 'zustand';
import { SchemaData, SchemaElement, ToolType, SchemaFormData, defaultFormData } from '@/types/schema';

const createEmptySchema = (name: string): SchemaData => ({
  id: Date.now().toString(),
  name,
  description: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  elements: [],
  width: 1200,
  height: 900,
  gridSize: 20,
  showGrid: true,
  version: 1,
  formData: defaultFormData(),
});

const defaultSchema = createEmptySchema('Аварийная схема №1');
defaultSchema.id = '1';

interface SchemaStore {
  schemas: SchemaData[];
  activeSchemaId: string | null;
  selectedElementIds: string[];
  activeTool: ToolType;
  zoom: number;
  showGrid: boolean;
  gridSize: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  fontSize: number;

  setActiveSchema: (id: string) => void;
  createSchema: (name: string) => void;
  deleteSchema: (id: string) => void;
  duplicateSchema: (id: string) => void;
  renameSchema: (id: string, name: string) => void;
  updateFormData: (id: string, formData: SchemaFormData) => void;

  addElement: (element: SchemaElement) => void;
  updateElement: (id: string, updates: Partial<SchemaElement>) => void;
  deleteElement: (id: string) => void;
  deleteSelectedElements: () => void;
  duplicateElement: (id: string) => void;

  setSelectedElements: (ids: string[]) => void;
  clearSelection: () => void;
  setActiveTool: (tool: ToolType) => void;
  setZoom: (zoom: number) => void;
  setShowGrid: (show: boolean) => void;
  setGridSize: (size: number) => void;
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setFontSize: (size: number) => void;

  getActiveSchema: () => SchemaData | undefined;
  getSelectedElements: () => SchemaElement[];
  undo: () => void;
  redo: () => void;

  history: SchemaData[][];
  historyIndex: number;
  pushHistory: () => void;
}

export const useSchemaStore = create<SchemaStore>((set, get) => ({
  schemas: [defaultSchema],
  activeSchemaId: '1',
  selectedElementIds: [],
  activeTool: 'select',
  zoom: 1,
  showGrid: true,
  gridSize: 20,
  strokeColor: '#e2a83a',
  fillColor: 'transparent',
  strokeWidth: 2,
  fontSize: 14,
  history: [[defaultSchema]],
  historyIndex: 0,

  getActiveSchema: () => {
    const { schemas, activeSchemaId } = get();
    return schemas.find(s => s.id === activeSchemaId);
  },

  getSelectedElements: () => {
    const { selectedElementIds, getActiveSchema } = get();
    const schema = getActiveSchema();
    if (!schema) return [];
    return schema.elements.filter(e => selectedElementIds.includes(e.id));
  },

  setActiveSchema: (id) => set({ activeSchemaId: id, selectedElementIds: [] }),

  updateFormData: (id, formData) => {
    set(state => ({
      schemas: state.schemas.map(s =>
        s.id === id ? { ...s, formData, updatedAt: new Date().toISOString() } : s
      )
    }));
  },

  createSchema: (name) => {
    const schema = createEmptySchema(name);
    set(state => ({
      schemas: [...state.schemas, schema],
      activeSchemaId: schema.id,
      selectedElementIds: [],
    }));
  },

  deleteSchema: (id) => {
    set(state => {
      const schemas = state.schemas.filter(s => s.id !== id);
      const activeSchemaId = state.activeSchemaId === id
        ? (schemas[0]?.id ?? null)
        : state.activeSchemaId;
      return { schemas, activeSchemaId };
    });
  },

  duplicateSchema: (id) => {
    const { schemas } = get();
    const original = schemas.find(s => s.id === id);
    if (!original) return;
    const copy: SchemaData = {
      ...original,
      id: Date.now().toString(),
      name: original.name + ' (копия)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      elements: original.elements.map(e => ({ ...e, id: Date.now().toString() + Math.random() })),
    };
    set(state => ({ schemas: [...state.schemas, copy], activeSchemaId: copy.id }));
  },

  renameSchema: (id, name) => {
    set(state => ({
      schemas: state.schemas.map(s => s.id === id ? { ...s, name, updatedAt: new Date().toISOString() } : s)
    }));
  },

  pushHistory: () => {
    const { schemas, activeSchemaId, history, historyIndex } = get();
    const snapshot = schemas.map(s => ({ ...s, elements: [...s.elements] }));
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(snapshot);
    set({ history: newHistory.slice(-50), historyIndex: Math.min(newHistory.length - 1, 49) });
  },

  addElement: (element) => {
    get().pushHistory();
    set(state => ({
      schemas: state.schemas.map(s =>
        s.id === state.activeSchemaId
          ? { ...s, elements: [...s.elements, element], updatedAt: new Date().toISOString() }
          : s
      )
    }));
  },

  updateElement: (id, updates) => {
    set(state => ({
      schemas: state.schemas.map(s =>
        s.id === state.activeSchemaId
          ? { ...s, elements: s.elements.map(e => e.id === id ? { ...e, ...updates } : e), updatedAt: new Date().toISOString() }
          : s
      )
    }));
  },

  deleteElement: (id) => {
    get().pushHistory();
    set(state => ({
      schemas: state.schemas.map(s =>
        s.id === state.activeSchemaId
          ? { ...s, elements: s.elements.filter(e => e.id !== id), updatedAt: new Date().toISOString() }
          : s
      ),
      selectedElementIds: state.selectedElementIds.filter(eid => eid !== id),
    }));
  },

  deleteSelectedElements: () => {
    const { selectedElementIds } = get();
    if (selectedElementIds.length === 0) return;
    get().pushHistory();
    set(state => ({
      schemas: state.schemas.map(s =>
        s.id === state.activeSchemaId
          ? { ...s, elements: s.elements.filter(e => !selectedElementIds.includes(e.id)), updatedAt: new Date().toISOString() }
          : s
      ),
      selectedElementIds: [],
    }));
  },

  duplicateElement: (id) => {
    const schema = get().getActiveSchema();
    if (!schema) return;
    const elem = schema.elements.find(e => e.id === id);
    if (!elem) return;
    const copy = { ...elem, id: Date.now().toString(), x: elem.x + 20, y: elem.y + 20 };
    get().addElement(copy);
    set({ selectedElementIds: [copy.id] });
  },

  setSelectedElements: (ids) => set({ selectedElementIds: ids }),
  clearSelection: () => set({ selectedElementIds: [] }),
  setActiveTool: (tool) => set({ activeTool: tool, selectedElementIds: [] }),
  setZoom: (zoom) => set({ zoom: Math.min(3, Math.max(0.1, zoom)) }),
  setShowGrid: (show) => set({ showGrid: show }),
  setGridSize: (size) => set({ gridSize: size }),
  setStrokeColor: (color) => set({ strokeColor: color }),
  setFillColor: (color) => set({ fillColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setFontSize: (size) => set({ fontSize: size }),

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    set({ schemas: history[newIndex], historyIndex: newIndex });
  },
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    set({ schemas: history[newIndex], historyIndex: newIndex });
  },
}));