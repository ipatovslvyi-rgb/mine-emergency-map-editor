export type ToolType = 
  | 'select' 
  | 'pan'
  | 'line' 
  | 'rect' 
  | 'ellipse'
  | 'arrow'
  | 'text'
  | 'image'
  | 'symbol'
  | 'eraser';

export type ElementType = 
  | 'rect'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'text'
  | 'image'
  | 'symbol';

export interface Point {
  x: number;
  y: number;
}

export interface SchemaElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  x2?: number;
  y2?: number;
  text?: string;
  fontSize?: number;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
  opacity?: number;
  symbolId?: string;
  imageUrl?: string;
  label?: string;
  rotation?: number;
  points?: Point[];
  zIndex?: number;
}

export interface SchemaData {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  elements: SchemaElement[];
  width: number;
  height: number;
  gridSize: number;
  showGrid: boolean;
  version: number;
}

export interface MineSymbol {
  id: string;
  name: string;
  category: string;
  description?: string;
  icon: React.ReactNode | string;
  type: 'svg' | 'text' | 'emoji';
  content: string;
  color?: string;
}

export interface SymbolCategory {
  id: string;
  name: string;
  symbols: MineSymbol[];
}
