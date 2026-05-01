import React from 'react';
import { useSchemaStore } from '@/store/schemaStore';
import Icon from '@/components/ui/icon';

const COLOR_PRESETS = [
  '#e2a83a', '#ef4444', '#f97316', '#22c55e', '#3b82f6', '#8b5cf6',
  '#06b6d4', '#ffffff', '#94a3b8', '#1e293b',
];

const PropertiesPanel: React.FC = () => {
  const {
    getSelectedElements, updateElement, deleteElement, duplicateElement,
    strokeColor, fillColor, strokeWidth, fontSize,
    setStrokeColor, setFillColor, setStrokeWidth, setFontSize,
    getActiveSchema, showGrid, setShowGrid, gridSize, setGridSize,
  } = useSchemaStore();

  const selected = getSelectedElements();
  const schema = getActiveSchema();

  const applyToSelected = (updates: Record<string, unknown>) => {
    selected.forEach(el => updateElement(el.id, updates));
  };

  return (
    <div className="flex flex-col h-full" style={{ width: 200 }}>
      <div className="px-3 pt-3 pb-2 border-b border-border" style={{ background: 'hsl(var(--toolbar-bg))' }}>
        <div className="section-label">Свойства</div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selected.length > 0 ? (
          <div className="px-3 py-3 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">
                {selected.length === 1 ? 'Элемент' : `Элементов: ${selected.length}`}
              </span>
              <div className="flex gap-1">
                {selected.length === 1 && (
                  <button
                    className="tool-btn w-7 h-7"
                    onClick={() => duplicateElement(selected[0].id)}
                    title="Дублировать"
                  >
                    <Icon name="Copy" size={12} />
                  </button>
                )}
                <button
                  className="tool-btn w-7 h-7 text-danger"
                  onClick={() => selected.forEach(el => deleteElement(el.id))}
                  title="Удалить"
                >
                  <Icon name="Trash2" size={12} />
                </button>
              </div>
            </div>

            {selected.length === 1 && (
              <>
                <div>
                  <div className="section-label mb-1" style={{ fontSize: 9 }}>Позиция</div>
                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      <label className="prop-label" style={{ fontSize: 9 }}>X</label>
                      <input
                        type="number"
                        className="prop-input"
                        value={Math.round(selected[0].x)}
                        onChange={e => applyToSelected({ x: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="prop-label" style={{ fontSize: 9 }}>Y</label>
                      <input
                        type="number"
                        className="prop-input"
                        value={Math.round(selected[0].y)}
                        onChange={e => applyToSelected({ y: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                {(selected[0].width !== undefined) && (
                  <div>
                    <div className="section-label mb-1" style={{ fontSize: 9 }}>Размер</div>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <label className="prop-label" style={{ fontSize: 9 }}>Ш</label>
                        <input
                          type="number"
                          className="prop-input"
                          value={Math.round(selected[0].width || 0)}
                          onChange={e => applyToSelected({ width: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="prop-label" style={{ fontSize: 9 }}>В</label>
                        <input
                          type="number"
                          className="prop-input"
                          value={Math.round(selected[0].height || 0)}
                          onChange={e => applyToSelected({ height: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selected[0].type === 'text' && (
                  <div>
                    <div className="section-label mb-1" style={{ fontSize: 9 }}>Текст</div>
                    <textarea
                      className="prop-input w-full resize-none"
                      rows={3}
                      value={selected[0].text || ''}
                      onChange={e => applyToSelected({ text: e.target.value })}
                    />
                    <div className="mt-1">
                      <label className="prop-label" style={{ fontSize: 9 }}>Размер шрифта</label>
                      <input
                        type="number"
                        className="prop-input"
                        value={selected[0].fontSize || 14}
                        onChange={e => applyToSelected({ fontSize: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                )}

                {selected[0].type === 'symbol' && (
                  <div>
                    <div className="section-label mb-1" style={{ fontSize: 9 }}>Подпись</div>
                    <input
                      type="text"
                      className="prop-input w-full"
                      value={selected[0].label || ''}
                      onChange={e => applyToSelected({ label: e.target.value })}
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <div className="section-label mb-1" style={{ fontSize: 9 }}>Цвет линии</div>
              <div className="flex flex-wrap gap-1 mb-1">
                {COLOR_PRESETS.map(c => (
                  <button
                    key={c}
                    className="w-5 h-5 rounded-sm border transition-transform hover:scale-110"
                    style={{ background: c, borderColor: strokeColor === c ? 'hsl(var(--primary))' : 'hsl(var(--border))', outline: strokeColor === c ? '2px solid hsl(var(--primary) / 0.5)' : 'none' }}
                    onClick={() => { setStrokeColor(c); applyToSelected({ strokeColor: c }); }}
                  />
                ))}
              </div>
              <input
                type="color"
                className="w-full h-7 rounded cursor-pointer border border-border"
                value={strokeColor}
                onChange={e => { setStrokeColor(e.target.value); applyToSelected({ strokeColor: e.target.value }); }}
              />
            </div>

            {['rect', 'ellipse', 'symbol'].includes(selected[0]?.type) && (
              <div>
                <div className="section-label mb-1" style={{ fontSize: 9 }}>Заливка</div>
                <div className="flex flex-wrap gap-1 mb-1">
                  <button
                    className="w-5 h-5 rounded-sm border text-xs flex items-center justify-center"
                    style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                    onClick={() => { setFillColor('transparent'); applyToSelected({ fillColor: 'transparent' }); }}
                    title="Без заливки"
                  >∅</button>
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c}
                      className="w-5 h-5 rounded-sm border transition-transform hover:scale-110"
                      style={{ background: c, borderColor: fillColor === c ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
                      onClick={() => { setFillColor(c); applyToSelected({ fillColor: c }); }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  className="w-full h-7 rounded cursor-pointer border border-border"
                  value={fillColor === 'transparent' ? '#000000' : fillColor}
                  onChange={e => { setFillColor(e.target.value); applyToSelected({ fillColor: e.target.value }); }}
                />
              </div>
            )}

            <div>
              <div className="section-label mb-1" style={{ fontSize: 9 }}>Толщина линии</div>
              <input
                type="range"
                min="1" max="10"
                value={strokeWidth}
                className="w-full"
                onChange={e => { setStrokeWidth(Number(e.target.value)); applyToSelected({ strokeWidth: Number(e.target.value) }); }}
              />
              <span className="font-mono-tech" style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>{strokeWidth}px</span>
            </div>

            <div>
              <div className="section-label mb-1" style={{ fontSize: 9 }}>Прозрачность</div>
              <input
                type="range"
                min="0.1" max="1" step="0.05"
                value={selected[0]?.opacity ?? 1}
                className="w-full"
                onChange={e => applyToSelected({ opacity: Number(e.target.value) })}
              />
              <span className="font-mono-tech" style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>
                {Math.round((selected[0]?.opacity ?? 1) * 100)}%
              </span>
            </div>
          </div>
        ) : (
          <div className="px-3 py-3 space-y-4 animate-fade-in">
            <div>
              <div className="section-label mb-2">Холст</div>
              {schema && (
                <div className="space-y-2">
                  <div className="prop-row">
                    <span className="prop-label">Ширина</span>
                    <span className="font-mono-tech text-xs">{schema.width}px</span>
                  </div>
                  <div className="prop-row">
                    <span className="prop-label">Высота</span>
                    <span className="font-mono-tech text-xs">{schema.height}px</span>
                  </div>
                  <div className="prop-row">
                    <span className="prop-label">Элементов</span>
                    <span className="font-mono-tech text-xs">{schema.elements.length}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="section-label mb-2">Сетка</div>
              <div className="prop-row">
                <span className="prop-label">Показать</span>
                <button
                  className={`w-8 h-4 rounded-full transition-all ${showGrid ? 'bg-primary' : 'bg-secondary'}`}
                  onClick={() => setShowGrid(!showGrid)}
                >
                  <div className={`w-3 h-3 rounded-full bg-white mx-0.5 transition-all ${showGrid ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="prop-row">
                <span className="prop-label">Шаг</span>
                <select
                  className="prop-input"
                  style={{ width: 70 }}
                  value={gridSize}
                  onChange={e => setGridSize(Number(e.target.value))}
                >
                  <option value={10}>10px</option>
                  <option value={20}>20px</option>
                  <option value={40}>40px</option>
                  <option value={50}>50px</option>
                </select>
              </div>
            </div>

            <div>
              <div className="section-label mb-2">Стиль рисования</div>
              <div className="space-y-2">
                <div>
                  <label className="prop-label" style={{ fontSize: 9 }}>Цвет линии</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {COLOR_PRESETS.map(c => (
                      <button
                        key={c}
                        className="w-5 h-5 rounded-sm border transition-transform hover:scale-110"
                        style={{ background: c, borderColor: strokeColor === c ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
                        onClick={() => setStrokeColor(c)}
                      />
                    ))}
                  </div>
                </div>
                <div className="prop-row">
                  <span className="prop-label">Толщина</span>
                  <input
                    type="number"
                    className="prop-input"
                    style={{ width: 50 }}
                    value={strokeWidth}
                    onChange={e => setStrokeWidth(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
