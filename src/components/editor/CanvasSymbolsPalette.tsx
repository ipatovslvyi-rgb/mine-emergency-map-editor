import React from 'react';

interface SymbolEntry {
  imageUrl: string;
  label: string;
  isSample?: boolean;
}

interface Props {
  legendSymbols: SymbolEntry[];
  isMobile: boolean;
  onAddSymbol: (sym: SymbolEntry) => void;
}

const CanvasSymbolsPalette: React.FC<Props> = ({ legendSymbols, isMobile, onAddSymbol }) => (
  <div className="flex-shrink-0 border-b border-border" style={{ background: 'hsl(var(--card))', padding: isMobile ? '6px 8px' : '8px' }}>
    <div className="text-xs mb-1.5 font-medium text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
      {isMobile ? 'Нажмите символ:' : 'Нажмите на символ — он появится на схеме:'}
    </div>
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(44px, 1fr))' : 'repeat(auto-fill, minmax(52px, 1fr))',
      gap: 6,
    }}>
      {legendSymbols.map(sym => (
        <button
          key={sym.imageUrl + sym.label}
          title={sym.label}
          onClick={() => onAddSymbol(sym)}
          className="flex flex-col items-center justify-center rounded transition-all hover:border-primary"
          style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', padding: isMobile ? '6px' : '4px', gap: 2, minHeight: isMobile ? 44 : 'auto' }}
        >
          <img src={sym.imageUrl} alt={sym.label} style={{ width: isMobile ? 26 : 28, height: isMobile ? 26 : 28, objectFit: 'contain' }} />
          {!isMobile && (
            <span style={{ fontSize: 8, color: 'hsl(var(--muted-foreground))', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
              {sym.label}
            </span>
          )}
        </button>
      ))}
    </div>
  </div>
);

export default CanvasSymbolsPalette;
