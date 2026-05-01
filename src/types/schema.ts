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
  legendItems: string[];
  supervisor: string;
}

export const defaultFormData = (): SchemaFormData => ({
  position: '28',
  date: new Date().toLocaleDateString('ru-RU'),
  time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
  timezone: 'мск',
  objectName: '',
  accidentType: '',
  accidentDate: new Date().toLocaleDateString('ru-RU'),
  accidentTime: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
  accidentTimezone: 'мск',
  accidentLocation: '',
  airVolume: '',
  crossSection: '',
  phone: '',
  atmosphere: {
    co: '',
    co2: '',
    so2: '',
    o2: '',
    ch4: '',
    noNo2: '',
    so2_2: '',
    temperature: '',
    smokeLevel: '',
  },
  legendItems: ['', '', '', '', '', '', '', '', '', ''],
  supervisor: '',
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