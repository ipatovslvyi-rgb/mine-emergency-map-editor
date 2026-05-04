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

const SVG_SQUAD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#e8f5e9" stroke="#1b5e20" stroke-width="2.5"/><circle cx="22" cy="22" r="5" fill="#66bb6a" stroke="#1b5e20" stroke-width="1.5"/><path d="M14 38 Q22 30 30 38 L30 46 Q22 50 14 46 Z" fill="#43a047" stroke="#1b5e20" stroke-width="1.5"/><circle cx="42" cy="22" r="5" fill="#66bb6a" stroke="#1b5e20" stroke-width="1.5"/><path d="M34 38 Q42 30 50 38 L50 46 Q42 50 34 46 Z" fill="#43a047" stroke="#1b5e20" stroke-width="1.5"/><polygon points="32,46 38,52 32,58 26,52" fill="#1b5e20"/></svg>`;

const SVG_WATER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#e3f2fd" stroke="#0d47a1" stroke-width="2.5"/><path d="M32 14 Q44 28 44 38 A12 12 0 0 1 20 38 Q20 28 32 14 Z" fill="#42a5f5" stroke="#0d47a1" stroke-width="2" stroke-linejoin="round"/><path d="M28 36 Q26 40 28 44" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path d="M14 52 Q20 48 26 52 T38 52 T50 52" fill="none" stroke="#0d47a1" stroke-width="2" stroke-linecap="round"/></svg>`;

export const LEGEND_SYMBOLS: { imageUrl: string; label: string }[] = [
  { imageUrl: svgToDataUrl(SVG_FIRE), label: 'Пожар' },
  { imageUrl: svgToDataUrl(SVG_EXPLOSION), label: 'Взрыв' },
  { imageUrl: svgToDataUrl(SVG_GAS), label: 'Газовыделение' },
  { imageUrl: svgToDataUrl(SVG_BEACON), label: 'Считыватель системы позиционирования' },
  { imageUrl: svgToDataUrl(SVG_BUILDING), label: 'Надшахтное здание' },
  { imageUrl: svgToDataUrl(SVG_VEHICLE), label: 'Самоходное двигательное оборудование' },
  { imageUrl: svgToDataUrl(SVG_VICTIM_DEAD), label: 'Местонахождение пострадавшего (смертельно травмированного)' },
  { imageUrl: svgToDataUrl(SVG_VICTIM_INJURED), label: 'Местонахождение пострадавшего (травмированного)' },
  { imageUrl: svgToDataUrl(SVG_SQUAD), label: 'Отделение в движении' },
  { imageUrl: svgToDataUrl(SVG_WATER), label: 'Место проникновения воды в выработку' },
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
  const set = (key: keyof SchemaFormData, val: string) => onChange({ ...data, [key]: val });
  const setAtm = (key: keyof AtmosphereData, val: string) => onChange({ ...data, atmosphere: { ...data.atmosphere, [key]: val } });

  const atmInp = 'flex-1 bg-transparent text-sm focus:outline-none text-right';

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden" style={{ background: 'hsl(var(--background))' }}>

      {/* ЛЕВАЯ КОЛОНКА — поля данных */}
      <div className="overflow-y-auto border-b md:border-b-0 md:border-r border-border p-3 space-y-2 md:flex-shrink-0 w-full md:w-[280px]">

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
      <div className="flex-1 overflow-hidden flex flex-col min-h-[340px] md:min-h-0" style={{ minWidth: 0 }}>
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
  );
};

export default SchemaFormPanel;