import React from 'react';

interface SymbolRendererProps {
  content: string;
  type: 'svg' | 'text' | 'emoji';
  color?: string;
  size?: number;
}

const SVGSymbols: Record<string, React.FC<{ color: string; size: number }>> = {
  shaft: ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <rect x="8" y="4" width="24" height="32" stroke={color} strokeWidth="2.5" fill="none"/>
      <line x1="8" y1="14" x2="32" y2="14" stroke={color} strokeWidth="1.5"/>
      <line x1="8" y1="24" x2="32" y2="24" stroke={color} strokeWidth="1.5"/>
      <line x1="20" y1="4" x2="20" y2="36" stroke={color} strokeWidth="1.5"/>
    </svg>
  ),
  tunnel: ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 40 20">
      <rect x="2" y="2" width="36" height="16" stroke={color} strokeWidth="2" fill="none" rx="1"/>
      <line x1="2" y1="10" x2="38" y2="10" stroke={color} strokeWidth="1" strokeDasharray="4,3"/>
    </svg>
  ),
  vent: ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="16" stroke={color} strokeWidth="2" fill="none"/>
      <path d="M20 4 L20 14 M20 26 L20 36 M4 20 L14 20 M26 20 L36 20" stroke={color} strokeWidth="2"/>
      <circle cx="20" cy="20" r="4" stroke={color} strokeWidth="2" fill="none"/>
    </svg>
  ),
  blocked: ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <rect x="4" y="16" width="32" height="8" fill={color} rx="1"/>
      <line x1="4" y1="8" x2="36" y2="32" stroke={color} strokeWidth="3"/>
      <line x1="36" y1="8" x2="4" y2="32" stroke={color} strokeWidth="3"/>
    </svg>
  ),
  fence: ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 40 20">
      <line x1="2" y1="10" x2="38" y2="10" stroke={color} strokeWidth="2"/>
      {[6, 13, 20, 27, 34].map(x => (
        <g key={x}>
          <line x1={x} y1="2" x2={x} y2="18" stroke={color} strokeWidth="2"/>
          <polyline points={`${x-3},4 ${x},2 ${x+3},4`} stroke={color} strokeWidth="1.5" fill="none"/>
        </g>
      ))}
    </svg>
  ),
  depth: ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <line x1="20" y1="2" x2="20" y2="38" stroke={color} strokeWidth="2"/>
      <polyline points="14,10 20,2 26,10" stroke={color} strokeWidth="2" fill="none"/>
      <polyline points="14,30 20,38 26,30" stroke={color} strokeWidth="2" fill="none"/>
      <line x1="8" y1="20" x2="32" y2="20" stroke={color} strokeWidth="1.5" strokeDasharray="3,3"/>
    </svg>
  ),
  level: ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 40 20">
      <line x1="2" y1="10" x2="38" y2="10" stroke={color} strokeWidth="2.5"/>
      {[4, 10, 16, 22, 28, 34, 40].map((x, i) => (
        <line key={x} x1={x-2} y1="10" x2={x-2} y2={i % 2 === 0 ? "5" : "15"} stroke={color} strokeWidth="1.5"/>
      ))}
    </svg>
  ),
  scalebar: ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 40 20">
      <rect x="4" y="7" width="32" height="6" stroke={color} strokeWidth="1.5" fill="none"/>
      <rect x="4" y="7" width="8" height="6" fill={color}/>
      <rect x="20" y="7" width="8" height="6" fill={color}/>
    </svg>
  ),
  squad_moving: ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="14" stroke={color} strokeWidth="2" fill="none"/>
      <text x="20" y="25" textAnchor="middle" fontSize="16" fontWeight="bold" fill={color} fontFamily="sans-serif">5</text>
      <polyline points="28,12 36,20 28,28" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  squad_static: ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="14" stroke={color} strokeWidth="2" fill="none"/>
      <text x="20" y="25" textAnchor="middle" fontSize="16" fontWeight="bold" fill={color} fontFamily="sans-serif">5</text>
    </svg>
  ),
  fire_realistic: ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 40 48">
      <path d="M20 44 C8 44 4 34 8 26 C10 21 14 19 14 14 C16 18 15 22 17 24 C18 20 19 15 22 10 C24 18 22 22 24 26 C26 22 25 18 27 14 C30 20 32 26 30 32 C32 28 34 24 32 18 C36 24 38 32 34 38 C36 44 28 46 20 44 Z" fill={color} opacity="0.9"/>
      <path d="M20 44 C10 44 8 36 11 30 C13 26 16 24 16 20 C17 23 17 27 19 29 C20 25 21 20 23 16 C25 22 23 26 25 30 C27 26 26 22 28 18 C30 24 31 30 29 36 C30 40 24 45 20 44 Z" fill="#fbbf24" opacity="0.85"/>
      <path d="M20 42 C14 42 13 36 15 32 C16 29 18 28 18 25 C19 28 19 31 21 32 C22 29 22 26 23 23 C25 27 24 31 26 34 C26 38 22 43 20 42 Z" fill="#fef08a" opacity="0.8"/>
      <ellipse cx="20" cy="44" rx="10" ry="3" fill={color} opacity="0.25"/>
    </svg>
  ),
};

const SymbolRenderer: React.FC<SymbolRendererProps> = ({ content, type, color = '#64748b', size = 32 }) => {
  if (type === 'svg') {
    const SvgComp = SVGSymbols[content];
    if (SvgComp) return <SvgComp color={color} size={size} />;
    return <span style={{ fontSize: size * 0.7, color }}>■</span>;
  }
  return <span style={{ fontSize: size * 0.75, lineHeight: 1 }}>{content}</span>;
};

export default SymbolRenderer;