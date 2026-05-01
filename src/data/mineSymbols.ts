import { SymbolCategory } from '@/types/schema';

export const SYMBOL_CATEGORIES: SymbolCategory[] = [
  {
    id: 'emergency',
    name: 'Аварийные зоны',
    symbols: [
      { id: 'fire', name: 'Очаг пожара', category: 'emergency', type: 'text', content: '🔥', color: '#ef4444' },
      { id: 'explosion', name: 'Взрыв / завал', category: 'emergency', type: 'text', content: '💥', color: '#f97316' },
      { id: 'gas', name: 'Загазованность', category: 'emergency', type: 'text', content: '☁', color: '#a855f7' },
      { id: 'flood', name: 'Затопление', category: 'emergency', type: 'text', content: '💧', color: '#3b82f6' },
      { id: 'collapse', name: 'Обрушение', category: 'emergency', type: 'text', content: '⚠', color: '#f59e0b' },
      { id: 'radiation', name: 'Радиация', category: 'emergency', type: 'text', content: '☢', color: '#22c55e' },
      { id: 'toxic', name: 'Токсичная зона', category: 'emergency', type: 'text', content: '☠', color: '#ef4444' },
      { id: 'electric', name: 'Электроопасность', category: 'emergency', type: 'text', content: '⚡', color: '#eab308' },
    ]
  },
  {
    id: 'personnel',
    name: 'Персонал',
    symbols: [
      { id: 'worker', name: 'Рабочий', category: 'personnel', type: 'text', content: '👷', color: '#f59e0b' },
      { id: 'victim', name: 'Пострадавший', category: 'personnel', type: 'text', content: '🚑', color: '#ef4444' },
      { id: 'rescuer', name: 'Спасатель', category: 'personnel', type: 'text', content: '🦺', color: '#f97316' },
      { id: 'commander', name: 'Командир', category: 'personnel', type: 'text', content: '⭐', color: '#eab308' },
      { id: 'medic', name: 'Медик', category: 'personnel', type: 'text', content: '🏥', color: '#22c55e' },
      { id: 'group', name: 'Группа людей', category: 'personnel', type: 'text', content: '👥', color: '#6366f1' },
    ]
  },
  {
    id: 'infrastructure',
    name: 'Инфраструктура',
    symbols: [
      { id: 'shaft', name: 'Шахтный ствол', category: 'infrastructure', type: 'svg', content: 'shaft', color: '#64748b' },
      { id: 'tunnel', name: 'Горная выработка', category: 'infrastructure', type: 'svg', content: 'tunnel', color: '#64748b' },
      { id: 'ventilation', name: 'Вентиляция', category: 'infrastructure', type: 'svg', content: 'vent', color: '#06b6d4' },
      { id: 'pump', name: 'Насосная', category: 'infrastructure', type: 'text', content: '⚙', color: '#64748b' },
      { id: 'substation', name: 'Подстанция', category: 'infrastructure', type: 'text', content: '🔌', color: '#eab308' },
      { id: 'elevator', name: 'Клеть / подъём', category: 'infrastructure', type: 'text', content: '🏗', color: '#64748b' },
      { id: 'storage', name: 'Склад материалов', category: 'infrastructure', type: 'text', content: '🏭', color: '#8b5cf6' },
      { id: 'exit', name: 'Запасной выход', category: 'infrastructure', type: 'text', content: '🚪', color: '#22c55e' },
    ]
  },
  {
    id: 'equipment',
    name: 'Оборудование',
    symbols: [
      { id: 'extinguisher', name: 'Огнетушитель', category: 'equipment', type: 'text', content: '🧯', color: '#ef4444' },
      { id: 'gas_mask', name: 'Самоспасатель', category: 'equipment', type: 'text', content: '😷', color: '#64748b' },
      { id: 'first_aid', name: 'Аптечка', category: 'equipment', type: 'text', content: '🩺', color: '#22c55e' },
      { id: 'excavator', name: 'Экскаватор', category: 'equipment', type: 'text', content: '🚜', color: '#f59e0b' },
      { id: 'drill', name: 'Буровая машина', category: 'equipment', type: 'text', content: '🔩', color: '#64748b' },
      { id: 'camera', name: 'Камера / датчик', category: 'equipment', type: 'text', content: '📡', color: '#06b6d4' },
    ]
  },
  {
    id: 'routes',
    name: 'Маршруты',
    symbols: [
      { id: 'evac_route', name: 'Путь эвакуации', category: 'routes', type: 'text', content: '🏃', color: '#22c55e' },
      { id: 'evac_point', name: 'Сборный пункт', category: 'routes', type: 'text', content: '🎯', color: '#22c55e' },
      { id: 'rescue_route', name: 'Путь спасателей', category: 'routes', type: 'text', content: '🚒', color: '#f97316' },
      { id: 'closed', name: 'Выработка закрыта', category: 'routes', type: 'svg', content: 'blocked', color: '#ef4444' },
      { id: 'fence', name: 'Ограждение', category: 'routes', type: 'svg', content: 'fence', color: '#f59e0b' },
      { id: 'direction', name: 'Направление', category: 'routes', type: 'text', content: '➡', color: '#64748b' },
    ]
  },
  {
    id: 'measurements',
    name: 'Измерения',
    symbols: [
      { id: 'north', name: 'Север (стрелка)', category: 'measurements', type: 'text', content: '🧭', color: '#06b6d4' },
      { id: 'depth_mark', name: 'Отметка глубины', category: 'measurements', type: 'svg', content: 'depth', color: '#6366f1' },
      { id: 'level', name: 'Горизонт', category: 'measurements', type: 'svg', content: 'level', color: '#64748b' },
      { id: 'scale', name: 'Масштаб', category: 'measurements', type: 'svg', content: 'scalebar', color: '#64748b' },
    ]
  }
];

export const getAllSymbols = () => SYMBOL_CATEGORIES.flatMap(c => c.symbols);
export const getSymbolById = (id: string) => getAllSymbols().find(s => s.id === id);
