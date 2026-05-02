import React, { useState } from 'react';
import { SchemaFormData, AtmosphereData, LegendItem } from '@/types/schema';
import SchemaCanvas from './SchemaCanvas';
import Icon from '@/components/ui/icon';

export const LEGEND_SYMBOLS: { imageUrl: string; label: string }[] = [
  { imageUrl: 'https://cdn.poehali.dev/projects/9c8b2d5a-890f-4855-bc05-5374370e1c6d/bucket/b0075aaa-399c-411d-b91e-c4f784ba6460.png', label: 'Пожар' },
  { imageUrl: 'https://cdn.poehali.dev/projects/9c8b2d5a-890f-4855-bc05-5374370e1c6d/bucket/9f37556a-d0f9-405d-a7a2-5636f7819402.png', label: 'Взрыв' },
  { imageUrl: 'https://cdn.poehali.dev/projects/9c8b2d5a-890f-4855-bc05-5374370e1c6d/bucket/7472fb3d-606e-4849-920c-08a6867a6c83.png', label: 'Газовыделение' },
  { imageUrl: 'https://cdn.poehali.dev/projects/9c8b2d5a-890f-4855-bc05-5374370e1c6d/bucket/28db5f8d-85ad-49ce-b53b-da13e168b451.png', label: 'Считыватель системы позиционирования' },
  { imageUrl: 'https://cdn.poehali.dev/projects/9c8b2d5a-890f-4855-bc05-5374370e1c6d/bucket/ff1e6286-8210-4aa2-b3ab-4aa362305c35.png', label: 'Надшахтное здание' },
  { imageUrl: 'https://cdn.poehali.dev/projects/9c8b2d5a-890f-4855-bc05-5374370e1c6d/bucket/60bb06e4-1c22-4c23-8e77-eeaaa86b3c43.png', label: 'Самоходное двигательное оборудование' },
  { imageUrl: 'https://cdn.poehali.dev/projects/9c8b2d5a-890f-4855-bc05-5374370e1c6d/bucket/4d263ba9-11d9-48fc-abd4-45104740f9c7.png', label: 'Местонахождение пострадавшего (смертельно травмированного)' },
  { imageUrl: 'https://cdn.poehali.dev/projects/9c8b2d5a-890f-4855-bc05-5374370e1c6d/bucket/b307c90a-9516-4ccb-81b8-e3129dca9ae3.png', label: 'Местонахождение пострадавшего (травмированного)' },
  { imageUrl: 'https://cdn.poehali.dev/projects/9c8b2d5a-890f-4855-bc05-5374370e1c6d/bucket/4ce54736-a241-4c30-9157-3d5ea526a23e.png', label: 'Отделение в движении' },
  { imageUrl: 'https://cdn.poehali.dev/projects/9c8b2d5a-890f-4855-bc05-5374370e1c6d/bucket/00c2fb18-d9e9-483c-a310-313ef51e2545.png', label: 'Место проникновения воды в выработку' },
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
    <div className="flex h-full overflow-hidden" style={{ background: 'hsl(var(--background))' }}>

      {/* ЛЕВАЯ КОЛОНКА — поля данных, компактная */}
      <div className="overflow-y-auto border-r border-border p-3 space-y-2 flex-shrink-0" style={{ width: 280 }}>

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

      {/* ПРАВАЯ ЧАСТЬ — редактор схемы на весь оставшийся экран */}
      <div className="flex-1 overflow-hidden flex flex-col" style={{ minWidth: 0 }}>
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
