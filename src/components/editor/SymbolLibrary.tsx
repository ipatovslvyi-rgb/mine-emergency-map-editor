import React, { useState } from 'react';
import { SYMBOL_CATEGORIES } from '@/data/mineSymbols';
import { MineSymbol } from '@/types/schema';
import SymbolRenderer from './SymbolRenderer';
import { useSchemaStore } from '@/store/schemaStore';
import Icon from '@/components/ui/icon';

const SymbolLibrary: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { activeTool, setActiveTool, addElement } = useSchemaStore();

  const filteredCategories = SYMBOL_CATEGORIES.map(cat => ({
    ...cat,
    symbols: cat.symbols.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat =>
    (!activeCategory || cat.id === activeCategory) && cat.symbols.length > 0
  );

  const handleSymbolClick = (symbol: MineSymbol) => {
    const schema = useSchemaStore.getState().getActiveSchema();
    if (!schema) return;
    addElement({
      id: Date.now().toString() + Math.random(),
      type: 'symbol',
      x: 100 + Math.random() * 400,
      y: 100 + Math.random() * 300,
      width: 48,
      height: 48,
      symbolId: symbol.id,
      label: symbol.name,
      color: symbol.color,
      zIndex: schema.elements.length,
    });
  };

  return (
    <div className="flex flex-col h-full" style={{ width: 220 }}>
      <div className="px-3 pt-3 pb-2 border-b border-border" style={{ background: 'hsl(var(--toolbar-bg))' }}>
        <div className="section-label mb-2">Условные обозначения</div>
        <div className="relative">
          <Icon name="Search" size={12} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="prop-input pl-6 w-full"
            style={{ fontSize: 11 }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1 px-2 py-2 border-b border-border">
        <button
          className={`px-2 py-0.5 rounded text-xs transition-all ${!activeCategory ? 'bg-primary text-black font-medium' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveCategory(null)}
        >Все</button>
        {SYMBOL_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`px-2 py-0.5 rounded text-xs transition-all ${activeCategory === cat.id ? 'bg-primary text-black font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
          >{cat.name.split(' ')[0]}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
        {filteredCategories.map(cat => (
          <div key={cat.id}>
            <div className="section-label mb-1 px-1" style={{ fontSize: 9 }}>{cat.name}</div>
            <div className="grid grid-cols-4 gap-1">
              {cat.symbols.map(symbol => (
                <button
                  key={symbol.id}
                  className="symbol-item"
                  title={symbol.name}
                  onClick={() => handleSymbolClick(symbol)}
                >
                  <SymbolRenderer content={symbol.content} type={symbol.type} color={symbol.color} size={24} />
                  <span className="text-center leading-tight" style={{ fontSize: 9, color: 'hsl(var(--muted-foreground))', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {symbol.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {filteredCategories.length === 0 && (
          <div className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))', fontSize: 12 }}>
            Обозначения не найдены
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-border text-center" style={{ background: 'hsl(var(--toolbar-bg))' }}>
        <p style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>
          Нажмите на символ, чтобы добавить на схему
        </p>
      </div>
    </div>
  );
};

export default SymbolLibrary;
