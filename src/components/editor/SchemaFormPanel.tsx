import React, { useState } from 'react';
import { SchemaFormData, AtmosphereData, LegendItem } from '@/types/schema';
import SchemaCanvas from './SchemaCanvas';
import Icon from '@/components/ui/icon';

const svgToDataUrl = (svg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const SVG_FIRE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#fff3e0" stroke="#c62828" stroke-width="2.5"/><path d="M32 12 L40 28 L36 30 L44 48 L32 42 L20 48 L28 30 L24 28 Z" fill="#ef5350" stroke="#b71c1c" stroke-width="2" stroke-linejoin="round"/><circle cx="32" cy="38" r="4" fill="#ffeb3b"/></svg>`;

const SVG_EXPLOSION = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#fff8e1" stroke="#e65100" stroke-width="2.5"/><polygon points="32,8 38,24 54,20 44,34 56,42 40,42 36,56 30,42 16,48 22,34 10,26 26,26" fill="#ff9800" stroke="#bf360c" stroke-width="2" stroke-linejoin="round"/><text x="32" y="38" text-anchor="middle" font-family="Arial Black" font-size="14" font-weight="900" fill="#bf360c">B</text></svg>`;

const SVG_GAS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#f3e5f5" stroke="#6a1b9a" stroke-width="2.5"/><path d="M18 38 Q14 32 20 28 Q22 22 30 24 Q34 18 42 22 Q50 22 50 30 Q54 34 50 40 Q46 46 38 44 Q30 48 22 44 Q16 44 18 38 Z" fill="#ba68c8" stroke="#4a148c" stroke-width="1.8"/><text x="32" y="38" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="#fff">CH₄</text></svg>`;

const SVG_BEACON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#e0f7fa" stroke="#006064" stroke-width="2.5"/><rect x="28" y="34" width="8" height="18" fill="#0097a7" stroke="#004d5c" stroke-width="1.5"/><circle cx="32" cy="22" r="8" fill="#00bcd4" stroke="#004d5c" stroke-width="1.8"/><path d="M14 22 Q22 14 32 14" fill="none" stroke="#00bcd4" stroke-width="2"/><path d="M50 22 Q42 14 32 14" fill="none" stroke="#00bcd4" stroke-width="2"/><path d="M10 26 Q22 10 32 10" fill="none" stroke="#00bcd4" stroke-width="1.5" opacity="0.6"/><path d="M54 26 Q42 10 32 10" fill="none" stroke="#00bcd4" stroke-width="1.5" opacity="0.6"/></svg>`;

const SVG_BUILDING = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#eceff1" stroke="#37474f" stroke-width="2.5"/><polygon points="14,40 32,18 50,40" fill="#90a4ae" stroke="#263238" stroke-width="1.8" stroke-linejoin="round"/><rect x="20" y="40" width="24" height="14" fill="#cfd8dc" stroke="#263238" stroke-width="1.8"/><rect x="28" y="44" width="8" height="10" fill="#37474f"/><rect x="22" y="42" width="4" height="4" fill="#fff" stroke="#263238" stroke-width="0.8"/><rect x="38" y="42" width="4" height="4" fill="#fff" stroke="#263238" stroke-width="0.8"/></svg>`;

const SVG_VEHICLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#fffde7" stroke="#f57f17" stroke-width="2.5"/><rect x="12" y="30" width="36" height="14" rx="2" fill="#fbc02d" stroke="#5d4037" stroke-width="1.8"/><polygon points="48,30 56,30 56,40 48,44" fill="#f9a825" stroke="#5d4037" stroke-width="1.8"/><rect x="16" y="22" width="14" height="10" fill="#fff59d" stroke="#5d4037" stroke-width="1.5"/><circle cx="20" cy="48" r="5" fill="#212121" stroke="#000" stroke-width="1"/><circle cx="42" cy="48" r="5" fill="#212121" stroke="#000" stroke-width="1"/><circle cx="20" cy="48" r="2" fill="#9e9e9e"/><circle cx="42" cy="48" r="2" fill="#9e9e9e"/></svg>`;

const SVG_VICTIM_DEAD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#ffebee" stroke="#b71c1c" stroke-width="2.5"/><circle cx="32" cy="22" r="7" fill="#fff" stroke="#b71c1c" stroke-width="2"/><circle cx="29" cy="22" r="1.5" fill="#b71c1c"/><circle cx="35" cy="22" r="1.5" fill="#b71c1c"/><path d="M28 26 L30 24 M30 26 L28 24" stroke="#b71c1c" stroke-width="1.2"/><path d="M34 26 L36 24 M36 26 L34 24" stroke="#b71c1c" stroke-width="1.2"/><path d="M14 50 L50 50" stroke="#b71c1c" stroke-width="3" stroke-linecap="round"/><path d="M22 42 L42 42" stroke="#b71c1c" stroke-width="2.5" stroke-linecap="round"/><path d="M18 50 Q32 32 46 50" fill="none" stroke="#b71c1c" stroke-width="2"/></svg>`;

const SVG_VICTIM_INJURED = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#fff3e0" stroke="#e65100" stroke-width="2.5"/><circle cx="32" cy="20" r="7" fill="#ffcc80" stroke="#5d4037" stroke-width="1.8"/><path d="M22 30 Q32 26 42 30 L42 44 Q32 48 22 44 Z" fill="#ff7043" stroke="#bf360c" stroke-width="1.8" stroke-linejoin="round"/><rect x="29" y="34" width="6" height="2" fill="#fff"/><rect x="31" y="32" width="2" height="6" fill="#fff"/><path d="M22 44 L18 54 M42 44 L46 54" stroke="#bf360c" stroke-width="2.5" stroke-linecap="round"/></svg>`;

const SVG_SQUAD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="28" cy="32" r="22" fill="#e8f5e9" stroke="#1b5e20" stroke-width="2.5"/><text x="28" y="39" text-anchor="middle" font-family="Arial Black,Arial" font-size="22" font-weight="900" fill="#1b5e20">5</text><polyline points="52,24 62,32 52,40" fill="none" stroke="#1b5e20" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SVG_WATER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#e3f2fd" stroke="#0d47a1" stroke-width="2.5"/><path d="M32 14 Q44 28 44 38 A12 12 0 0 1 20 38 Q20 28 32 14 Z" fill="#42a5f5" stroke="#0d47a1" stroke-width="2" stroke-linejoin="round"/><path d="M28 36 Q26 40 28 44" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path d="M14 52 Q20 48 26 52 T38 52 T50 52" fill="none" stroke="#0d47a1" stroke-width="2" stroke-linecap="round"/></svg>`;

/* ── ГОСТ-символы ── */

// Отделение на месте работ: круг с цифрой 5
const SVG_SQUAD_STATIC = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="#e8f5e9" stroke="#1b5e20" stroke-width="2.5"/><text x="32" y="41" text-anchor="middle" font-family="Arial Black,Arial" font-size="26" font-weight="900" fill="#1b5e20">5</text></svg>`;

// Подземная горноспасательная база: прямоугольник «ПБ»
const SVG_BASE_UNDERGROUND = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="8" y="14" width="48" height="36" rx="3" fill="#fff8e1" stroke="#e65100" stroke-width="2.5"/><text x="32" y="38" text-anchor="middle" font-family="Arial Black, Arial" font-size="22" font-weight="900" fill="#e65100">ПБ</text></svg>`;

// Наземная база: прямоугольник «НБ»
const SVG_BASE_GROUND = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="8" y="14" width="48" height="36" rx="3" fill="#e8eaf6" stroke="#283593" stroke-width="2.5"/><text x="32" y="38" text-anchor="middle" font-family="Arial Black, Arial" font-size="22" font-weight="900" fill="#283593">НБ</text></svg>`;

// Пост безопасности: круг с флажком (ГОСТ)
const SVG_SAFETY_POST = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="38" r="14" fill="#fff" stroke="#1a237e" stroke-width="2.5"/><line x1="32" y1="10" x2="32" y2="24" stroke="#1a237e" stroke-width="2.5" stroke-linecap="round"/><polygon points="32,10 46,16 32,22" fill="#1a237e"/></svg>`;

// Место отбора проб: треугольник с номером (ГОСТ)
const SVG_SAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><polygon points="32,8 58,54 6,54" fill="#fff9c4" stroke="#f57f17" stroke-width="2.5" stroke-linejoin="round"/><text x="32" y="48" text-anchor="middle" font-family="Arial Black, Arial" font-size="18" font-weight="900" fill="#e65100">4</text></svg>`;

// Очаг пожара (реалистичное пламя)
const SVG_FIRE_SOURCE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 72"><path d="M32 68 C14 68 8 52 14 40 C17 33 22 30 22 22 C25 28 24 34 27 37 C28 31 30 24 34 16 C37 28 34 34 37 40 C40 34 38 28 41 22 C46 32 49 42 45 52 C48 60 36 70 32 68 Z" fill="#ef4444"/><path d="M32 68 C18 68 16 56 20 47 C22 41 26 38 26 32 C28 36 28 42 30 45 C32 39 33 31 36 25 C39 35 37 41 39 47 C41 41 40 34 43 28 C46 37 47 47 44 56 C45 62 38 70 32 68 Z" fill="#fbbf24"/><path d="M32 66 C22 66 21 57 24 51 C25 46 28 44 28 39 C29 43 30 49 32 51 C34 46 35 40 36 36 C39 43 38 50 40 54 C40 60 36 67 32 66 Z" fill="#fef08a"/><ellipse cx="32" cy="68" rx="14" ry="4" fill="#c62828" opacity="0.3"/></svg>`;

// Нарушенная крепь: ряд треугольников над линией (ГОСТ)
const SVG_BROKEN_SUPPORT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><line x1="4" y1="44" x2="60" y2="44" stroke="#5d4037" stroke-width="2.5" stroke-linecap="round"/><polygon points="10,44 18,24 26,44" fill="none" stroke="#5d4037" stroke-width="2" stroke-linejoin="round"/><polygon points="24,44 32,24 40,44" fill="none" stroke="#5d4037" stroke-width="2" stroke-linejoin="round"/><polygon points="38,44 46,24 54,44" fill="none" stroke="#5d4037" stroke-width="2" stroke-linejoin="round"/></svg>`;

// Зона обрушения: пунктирный эллипс с точками (ГОСТ)
const SVG_COLLAPSE_ZONE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><ellipse cx="32" cy="36" rx="26" ry="14" fill="#efebe9" stroke="#795548" stroke-width="2" stroke-dasharray="4,3"/><circle cx="20" cy="34" r="2" fill="#795548"/><circle cx="28" cy="38" r="2" fill="#795548"/><circle cx="36" cy="34" r="2" fill="#795548"/><circle cx="44" cy="38" r="2" fill="#795548"/><line x1="8" y1="48" x2="56" y2="48" stroke="#795548" stroke-width="2" stroke-linecap="round"/></svg>`;

// Прорыв заиловочной массы/плывунов: стрелка с изгибом коричневая
const SVG_SLUDGE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M44 12 Q50 20 44 30 Q36 40 28 44 L20 52" fill="none" stroke="#6d4c41" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><polygon points="14,48 24,46 20,56" fill="#6d4c41"/><path d="M50 22 Q54 28 50 34 Q44 42 36 46 L28 54" fill="none" stroke="#6d4c41" stroke-width="2" stroke-linecap="round" opacity="0.5"/></svg>`;

// Место выброса газа или горного удара: линия с кружком «В»
const SVG_OUTBURST = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><line x1="8" y1="28" x2="56" y2="28" stroke="#4a148c" stroke-width="2.5" stroke-linecap="round"/><line x1="8" y1="40" x2="56" y2="40" stroke="#4a148c" stroke-width="2.5" stroke-linecap="round"/><circle cx="32" cy="28" r="9" fill="#ede7f6" stroke="#4a148c" stroke-width="2"/><text x="32" y="32" text-anchor="middle" font-family="Arial Black, Arial" font-size="11" font-weight="900" fill="#4a148c">В</text><line x1="32" y1="37" x2="32" y2="45" stroke="#4a148c" stroke-width="2" stroke-linecap="round"/><polygon points="28,43 32,50 36,43" fill="#4a148c"/></svg>`;

// Распространение пожара по выработкам: очаг + пунктир + звёздочки (красный, ГОСТ)
const SVG_FIRE_SPREAD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="14" cy="32" r="10" fill="#ffcdd2" stroke="#c62828" stroke-width="2"/><line x1="14" y1="18" x2="14" y2="22" stroke="#c62828" stroke-width="1.8" stroke-linecap="round"/><line x1="14" y1="42" x2="14" y2="46" stroke="#c62828" stroke-width="1.8" stroke-linecap="round"/><line x1="0" y1="32" x2="4" y2="32" stroke="#c62828" stroke-width="1.8" stroke-linecap="round"/><line x1="24" y1="32" x2="28" y2="32" stroke="#c62828" stroke-width="1.8" stroke-linecap="round"/><line x1="4" y1="22" x2="7" y2="25" stroke="#c62828" stroke-width="1.5" stroke-linecap="round"/><line x1="24" y1="22" x2="21" y2="25" stroke="#c62828" stroke-width="1.5" stroke-linecap="round"/><line x1="4" y1="42" x2="7" y2="39" stroke="#c62828" stroke-width="1.5" stroke-linecap="round"/><line x1="24" y1="42" x2="21" y2="39" stroke="#c62828" stroke-width="1.5" stroke-linecap="round"/><line x1="24" y1="32" x2="54" y2="32" stroke="#c62828" stroke-width="2" stroke-dasharray="4,3" stroke-linecap="round"/><text x="34" y="28" font-family="Arial" font-size="9" fill="#c62828">✶</text><text x="42" y="30" font-family="Arial" font-size="9" fill="#c62828">✶</text><text x="50" y="28" font-family="Arial" font-size="9" fill="#c62828">✶</text></svg>`;

// Направление воздушной струи: стрелка вдоль линии
const SVG_AIRFLOW = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><line x1="6" y1="26" x2="58" y2="26" stroke="#0277bd" stroke-width="2.5" stroke-linecap="round"/><line x1="6" y1="38" x2="58" y2="38" stroke="#0277bd" stroke-width="2.5" stroke-linecap="round"/><polygon points="48,20 62,32 48,44" fill="#0277bd"/></svg>`;

// Вентиляционная перемычка: две параллельные линии с поперечными штрихами
const SVG_VENT_WALL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><line x1="32" y1="6" x2="32" y2="58" stroke="#37474f" stroke-width="4" stroke-linecap="round"/><line x1="22" y1="6" x2="22" y2="58" stroke="#37474f" stroke-width="4" stroke-linecap="round"/><line x1="6" y1="18" x2="22" y2="18" stroke="#37474f" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="28" x2="22" y2="28" stroke="#37474f" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="38" x2="22" y2="38" stroke="#37474f" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="48" x2="22" y2="48" stroke="#37474f" stroke-width="2" stroke-linecap="round"/><line x1="32" y1="18" x2="58" y2="18" stroke="#546e7a" stroke-width="1.5" stroke-linecap="round"/><line x1="32" y1="32" x2="58" y2="32" stroke="#546e7a" stroke-width="1.5" stroke-linecap="round"/><line x1="32" y1="46" x2="58" y2="46" stroke="#546e7a" stroke-width="1.5" stroke-linecap="round"/></svg>`;

// Вентиляционная дверь: линия с просветом и дугой
const SVG_VENT_DOOR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><line x1="32" y1="6" x2="32" y2="24" stroke="#37474f" stroke-width="3.5" stroke-linecap="round"/><line x1="32" y1="40" x2="32" y2="58" stroke="#37474f" stroke-width="3.5" stroke-linecap="round"/><path d="M32 24 A16 16 0 0 1 48 40" fill="none" stroke="#37474f" stroke-width="2.5" stroke-linecap="round"/><line x1="32" y1="24" x2="48" y2="40" stroke="#37474f" stroke-width="1.5" stroke-dasharray="3,2" stroke-linecap="round"/></svg>`;

// Шлюз вентиляционный: прямоугольник с двумя линиями
const SVG_VENT_LOCK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="14" y="14" width="36" height="36" rx="2" fill="#e0f2f1" stroke="#00695c" stroke-width="2.5"/><line x1="14" y1="32" x2="50" y2="32" stroke="#00695c" stroke-width="2"/><line x1="32" y1="14" x2="32" y2="50" stroke="#00695c" stroke-width="2"/><text x="32" y="13" text-anchor="middle" font-family="Arial" font-size="9" fill="#00695c">Ш</text></svg>`;

export const LEGEND_SYMBOLS: { imageUrl: string; label: string }[] = [
  // Существующие
  { imageUrl: svgToDataUrl(SVG_FIRE), label: 'Пожар' },
  { imageUrl: svgToDataUrl(SVG_EXPLOSION), label: 'Место взрыва' },
  { imageUrl: svgToDataUrl(SVG_GAS), label: 'Газовыделение' },
  { imageUrl: svgToDataUrl(SVG_BEACON), label: 'Считыватель системы позиционирования' },
  { imageUrl: svgToDataUrl(SVG_BUILDING), label: 'Надшахтное здание' },
  { imageUrl: svgToDataUrl(SVG_VEHICLE), label: 'Самоходное двигательное оборудование' },
  { imageUrl: svgToDataUrl(SVG_VICTIM_DEAD), label: 'Место обнаружения пострадавшего без признаков жизни' },
  { imageUrl: svgToDataUrl(SVG_VICTIM_INJURED), label: 'Место обнаружения пострадавшего с признаками жизни' },
  { imageUrl: svgToDataUrl(SVG_SQUAD), label: 'Отделение в движении' },
  { imageUrl: svgToDataUrl(SVG_WATER), label: 'Прорыв воды, рассола' },
  // ГОСТ новые
  { imageUrl: svgToDataUrl(SVG_SQUAD_STATIC), label: 'Отделение на месте работ' },
  { imageUrl: svgToDataUrl(SVG_BASE_UNDERGROUND), label: 'Подземная горноспасательная база (ПБ)' },
  { imageUrl: svgToDataUrl(SVG_BASE_GROUND), label: 'Наземная база (НБ)' },
  { imageUrl: svgToDataUrl(SVG_SAFETY_POST), label: 'Пост безопасности' },
  { imageUrl: svgToDataUrl(SVG_SAMPLE), label: 'Место отбора проб' },
  { imageUrl: svgToDataUrl(SVG_FIRE_SOURCE), label: 'Очаг пожара' },
  { imageUrl: svgToDataUrl(SVG_BROKEN_SUPPORT), label: 'Горная выработка с нарушенной крепью' },
  { imageUrl: svgToDataUrl(SVG_COLLAPSE_ZONE), label: 'Зона обрушения горных пород' },
  { imageUrl: svgToDataUrl(SVG_SLUDGE), label: 'Прорыв заиловочной массы и плывунов' },
  { imageUrl: svgToDataUrl(SVG_OUTBURST), label: 'Место выброса (В) или горного удара (У)' },
  { imageUrl: svgToDataUrl(SVG_FIRE_SPREAD), label: 'Распространение пожара по горным выработкам' },
  { imageUrl: svgToDataUrl(SVG_AIRFLOW), label: 'Направление воздушной струи' },
  { imageUrl: svgToDataUrl(SVG_VENT_WALL), label: 'Вентиляционная перемычка' },
  { imageUrl: svgToDataUrl(SVG_VENT_DOOR), label: 'Вентиляционная дверь' },
  { imageUrl: svgToDataUrl(SVG_VENT_LOCK), label: 'Шлюз вентиляционный' },
];

interface Props {
  data: SchemaFormData;
  onChange: (data: SchemaFormData) => void;
}

const ACCIDENT_TYPES = ['Пожар', 'Взрыв', 'Обрушение', 'Загазованность', 'Затопление', 'Прорыв газа', 'Иное'];

const inp = 'w-full bg-transparent border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-primary transition-colors placeholder-muted-foreground';
const lbl = 'block text-xs font-medium mb-0.5';

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; half?: boolean }> = (props) => (
  <div className={props.half ? 'flex-1' : 'w-full'}>
    <label className={lbl} style={{ color: 'hsl(var(--muted-foreground))' }}>{props.label}</label>
    <input type="text" value={props.value} onChange={e => props.onChange(e.target.value)} placeholder={props.placeholder} className={inp} style={{ color: 'hsl(var(--foreground))' }} />
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider"
        style={{ background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))' }}
        onClick={() => setOpen(v => !v)}
      >
        {title}
        <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={12} />
      </button>
      {open && <div className="p-3 space-y-2" style={{ background: 'hsl(var(--background))' }}>{children}</div>}
    </div>
  );
};

const SchemaFormPanel: React.FC<Props> = ({ data, onChange }) => {
  const [mobileTab, setMobileTab] = React.useState<'data' | 'schema'>('data');
  const set = (key: keyof SchemaFormData, val: string) => onChange({ ...data, [key]: val });
  const setAtm = (key: keyof AtmosphereData, val: string) => onChange({ ...data, atmosphere: { ...data.atmosphere, [key]: val } });

  const atmInp = 'flex-1 bg-transparent text-sm focus:outline-none text-right';

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'hsl(var(--background))' }}>

      {/* Мобильные вкладки — только на маленьких экранах */}
      <div className="flex md:hidden border-b border-border flex-shrink-0" style={{ background: 'hsl(var(--toolbar-bg))' }}>
        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium border-b-2 transition-all ${mobileTab === 'data' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          style={{ borderBottomColor: mobileTab === 'data' ? 'hsl(var(--primary))' : 'transparent' }}
          onClick={() => setMobileTab('data')}
        >
          <Icon name="ClipboardList" size={14} />
          Данные
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium border-b-2 transition-all ${mobileTab === 'schema' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          style={{ borderBottomColor: mobileTab === 'schema' ? 'hsl(var(--primary))' : 'transparent' }}
          onClick={() => setMobileTab('schema')}
        >
          <Icon name="Map" size={14} />
          Схема
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

      {/* ЛЕВАЯ КОЛОНКА — поля данных */}
      <div className={`overflow-y-auto border-b md:border-b-0 md:border-r border-border p-3 space-y-2 md:flex-shrink-0 w-full md:w-[280px] ${mobileTab === 'schema' ? 'hidden md:block' : ''}`}>

        <Section title="Заголовок">
          <Field label="Позиция №" value={data.position} onChange={v => set('position', v)} placeholder="28" />
          <div className="flex gap-1.5">
            <Field label="Дата" value={data.date} onChange={v => set('date', v)} placeholder="02.05.2026" half />
            <Field label="Время" value={data.time} onChange={v => set('time', v)} placeholder="23:26" half />
          </div>
          <Field label="Часовой пояс" value={data.timezone} onChange={v => set('timezone', v)} placeholder="мск" />
        </Section>

        <Section title="Основные сведения">
          <Field label="Наименование объекта" value={data.objectName} onChange={v => set('objectName', v)} placeholder="Рудник..." />
          <div>
            <label className={lbl} style={{ color: 'hsl(var(--muted-foreground))' }}>Вид аварии</label>
            <select value={data.accidentType} onChange={e => set('accidentType', e.target.value)} className={inp} style={{ color: 'hsl(var(--foreground))', background: 'hsl(var(--card))' }}>
              {ACCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-1.5">
            <Field label="Дата аварии" value={data.accidentDate} onChange={v => set('accidentDate', v)} placeholder="02.05.2026" half />
            <Field label="Время" value={data.accidentTime} onChange={v => set('accidentTime', v)} placeholder="23:26" half />
          </div>
          <Field label="Место аварии" value={data.accidentLocation} onChange={v => set('accidentLocation', v)} placeholder="насосная гор. +210м." />
          <div className="flex gap-1.5">
            <Field label="Воздух, м³/с" value={data.airVolume} onChange={v => set('airVolume', v)} placeholder="4,79" half />
            <Field label="Сечение, м²" value={data.crossSection} onChange={v => set('crossSection', v)} placeholder="10,0" half />
          </div>
          <Field label="Телефон КП" value={data.phone} onChange={v => set('phone', v)} placeholder="2-100" />
        </Section>

        <Section title="Атмосфера">
          {([
            ['CO', 'co', '%'], ['CO₂', 'co2', '%'], ['SO₂', 'so2', '%'],
            ['O₂', 'o2', '%'], ['CH₄', 'ch4', '%'], ['NO-NO₂', 'noNo2', '%'], ['t°', 'temperature', '°C'],
          ] as [string, keyof AtmosphereData, string][]).map(([name, key, unit]) => (
            <div key={key} className="flex items-center gap-2 border-b border-border pb-1">
              <span className="text-xs font-medium flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))', minWidth: 44 }}>{name}</span>
              <input type="text" value={data.atmosphere[key]} onChange={e => setAtm(key, e.target.value)} className={atmInp} style={{ color: 'hsl(var(--foreground))' }} />
              <span className="text-xs flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>{unit}</span>
            </div>
          ))}
          <div>
            <label className={lbl} style={{ color: 'hsl(var(--muted-foreground))' }}>Задымлённость</label>
            <input type="text" value={data.atmosphere.smokeLevel} onChange={e => setAtm('smokeLevel', e.target.value)} placeholder="средняя от 5 до 10м" className={inp} style={{ color: 'hsl(var(--foreground))' }} />
          </div>
        </Section>

        <Section title="Подписи">
          <Field label="Руководитель горноспасательных работ" value={data.supervisor} onChange={v => set('supervisor', v)} placeholder="Фамилия И.О." />
        </Section>

        {/* Список условных обозначений */}
        <Section title="Условные обозначения" defaultOpen={false}>
          {data.legendItems.length === 0 ? (
            <div className="text-xs text-center py-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Добавляйте символы на схему справа
            </div>
          ) : (
            <div className="space-y-1">
              {data.legendItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 rounded px-2 py-1" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                  <img src={item.imageUrl} alt={item.label} style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }} />
                  <input
                    type="text"
                    value={item.label}
                    onChange={e => {
                      const items = [...data.legendItems];
                      items[i] = { ...items[i], label: e.target.value };
                      onChange({ ...data, legendItems: items });
                    }}
                    className="flex-1 bg-transparent text-xs focus:outline-none"
                    style={{ color: 'hsl(var(--foreground))' }}
                  />
                  <button
                    onClick={() => onChange({ ...data, legendItems: data.legendItems.filter((_, idx) => idx !== i) })}
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    <Icon name="X" size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

      </div>

      {/* ПРАВАЯ ЧАСТЬ — редактор схемы */}
      <div className={`flex-1 overflow-hidden flex flex-col md:min-h-0 ${mobileTab === 'data' ? 'hidden md:flex' : 'flex'}`} style={{ minWidth: 0, minHeight: 0 }}>
        <SchemaCanvas
          imageUrl={data.schemaImageUrl}
          placedSymbols={data.placedSymbols ?? []}
          legendSymbols={LEGEND_SYMBOLS}
          legendItems={data.legendItems}
          onImageUpload={url => set('schemaImageUrl', url)}
          onPlacedChange={symbols => onChange({ ...data, placedSymbols: symbols })}
          onLegendAdd={item => {
            if (!data.legendItems.some(l => l.imageUrl === item.imageUrl)) {
              onChange({ ...data, legendItems: [...data.legendItems, item] });
            }
          }}
        />
      </div>

      </div>
    </div>
  );
};

export default SchemaFormPanel;