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

export interface AtmosphereData {
  co: string;
  co2: string;
  so2: string;
  o2: string;
  ch4: string;
  noNo2: string;
  so2_2: string;
  temperature: string;
  smokeLevel: string;
}

export interface LegendItem {
  imageUrl: string;
  label: string;
}

export interface PlacedSymbol {
  id: string;
  imageUrl: string;
  label: string;
  x: number;
  y: number;
  size: number;
  rotation?: number;
  sampleNumber?: string;
  isSample?: boolean;
  drawingData?: string;
}

export interface SchemaFormData {
  position: string;
  date: string;
  time: string;
  timezone: string;
  objectName: string;
  accidentType: string;
  accidentDate: string;
  accidentTime: string;
  accidentTimezone: string;
  accidentLocation: string;
  airVolume: string;
  crossSection: string;
  phone: string;
  atmosphere: AtmosphereData;
  legendItems: LegendItem[];
  supervisor: string;
  deputyCommander: string;
  commanderOnDuty: string;
  schemaImageUrl: string;
  placedSymbols: PlacedSymbol[];
}

export const defaultFormData = (): SchemaFormData => ({
  position: '28',
  date: new Date().toLocaleDateString('ru-RU'),
  time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
  timezone: 'мск',
  objectName: '',
  accidentType: 'Пожар',
  accidentDate: new Date().toLocaleDateString('ru-RU'),
  accidentTime: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
  accidentTimezone: 'мск',
  accidentLocation: 'насосная гор. +210м.',
  airVolume: '4,79',
  crossSection: '10,0',
  phone: '2-100',
  atmosphere: {
    co: '0,00',
    co2: '0,00',
    so2: '0,00',
    o2: '0,00',
    ch4: '0,00',
    noNo2: '0,00',
    so2_2: '0,00',
    temperature: '0,00',
    smokeLevel: 'средняя от 5 до 10м.',
  },
  legendItems: [],
  supervisor: '',
  deputyCommander: '',
  commanderOnDuty: '',
  schemaImageUrl: '',
  placedSymbols: [],
});

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
  formData?: SchemaFormData;
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