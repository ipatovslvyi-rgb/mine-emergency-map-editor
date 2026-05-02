import React, { useRef } from 'react';
import { SchemaFormData, AtmosphereData, LegendItem } from '@/types/schema';
import Icon from '@/components/ui/icon';

const LEGEND_SYMBOLS: { imageUrl: string; label: string }[] = [
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

const inp = 'w-full bg-transparent border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary transition-colors placeholder-muted-foreground';
const label = 'block text-xs font-medium mb-1';

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; half?: boolean }> = (props) => (
  <div className={props.half ? 'flex-1' : 'w-full'}>
    <label className={label} style={{ color: 'hsl(var(--muted-foreground))' }}>{props.label}</label>
    <input type="text" value={props.value} onChange={e => props.onChange(e.target.value)} placeholder={props.placeholder} className={inp} style={{ color: 'hsl(var(--foreground))' }} />
  </div>
);

const AtmRow: React.FC<{ label: string; value: string; onChange: (v: string) => void; unit?: string }> = ({ label: lbl, value, onChange, unit = '%' }) => (
  <div className="flex items-center border-b border-border py-1.5 gap-2">
    <span className="text-xs font-medium flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))', minWidth: 48 }}>{lbl}</span>
    <div className="flex-1 flex items-center gap-1">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm focus:outline-none text-right"
        style={{ color: 'hsl(var(--foreground))' }}
      />
      <span className="text-xs flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>{unit}</span>
    </div>
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-xs font-semibold uppercase tracking-wider mb-2 pb-1 border-b border-border" style={{ color: 'hsl(var(--muted-foreground))' }}>
    {children}
  </div>
);

const SchemaFormPanel: React.FC<Props> = ({ data, onChange }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof SchemaFormData, val: string) => onChange({ ...data, [key]: val });
  const setAtm = (key: keyof AtmosphereData, val: string) => onChange({ ...data, atmosphere: { ...data.atmosphere, [key]: val } });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      set('schemaImageUrl', ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'hsl(var(--background))' }}>
      <div className="flex h-full" style={{ minHeight: 0 }}>

        {/* ЛЕВАЯ КОЛОНКА — ВВОД ДАННЫХ */}
        <div className="flex-1 overflow-y-auto border-r border-border p-4 space-y-4" style={{ minWidth: 0 }}>

          {/* ЗАГОЛОВОК ДОКУМЕНТА */}
          <div>
            <SectionTitle>Заголовок документа</SectionTitle>
            <div className="space-y-2">
              <Field label="Позиция №" value={data.position} onChange={v => set('position', v)} placeholder="28" />
              <div className="flex gap-2">
                <Field label="Дата" value={data.date} onChange={v => set('date', v)} placeholder="02.05.2026" half />
                <Field label="Время" value={data.time} onChange={v => set('time', v)} placeholder="23:26" half />
              </div>
              <Field label="Часовой пояс" value={data.timezone} onChange={v => set('timezone', v)} placeholder="мск" />
            </div>
          </div>

          {/* ОСНОВНЫЕ СВЕДЕНИЯ */}
          <div>
            <SectionTitle>Основные сведения</SectionTitle>
            <div className="space-y-2">
              <Field label="Наименование объекта" value={data.objectName} onChange={v => set('objectName', v)} placeholder="Рудник (месторождение)..." />

              <div>
                <label className={label} style={{ color: 'hsl(var(--muted-foreground))' }}>Вид аварии</label>
                <select
                  value={data.accidentType}
                  onChange={e => set('accidentType', e.target.value)}
                  className={inp}
                  style={{ color: 'hsl(var(--foreground))', background: 'hsl(var(--card))' }}
                >
                  {ACCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="flex gap-2">
                <Field label="Дата аварии" value={data.accidentDate} onChange={v => set('accidentDate', v)} placeholder="02.05.2026" half />
                <Field label="Время аварии" value={data.accidentTime} onChange={v => set('accidentTime', v)} placeholder="23:26" half />
              </div>

              <Field label="Место аварии" value={data.accidentLocation} onChange={v => set('accidentLocation', v)} placeholder="насосная гор. +210м." />

              <div className="flex gap-2">
                <Field label="Кол-во воздуха, м³/с" value={data.airVolume} onChange={v => set('airVolume', v)} placeholder="4,79" half />
                <Field label="Сечение выработки, м²" value={data.crossSection} onChange={v => set('crossSection', v)} placeholder="10,0" half />
              </div>

              <Field label="Телефон КП" value={data.phone} onChange={v => set('phone', v)} placeholder="2-100" />
            </div>
          </div>

          {/* ПОДПИСИ */}
          <div>
            <SectionTitle>Подписи</SectionTitle>
            <div className="space-y-2">
              <Field label="Руководитель горноспасательных работ" value={data.supervisor} onChange={v => set('supervisor', v)} placeholder="Фамилия И.О." />
            </div>
          </div>

        </div>

        {/* ПРАВАЯ КОЛОНКА */}
        <div className="overflow-y-auto p-4 space-y-4 flex-shrink-0" style={{ width: 340 }}>

          {/* СОСТАВ РУДНИЧНОЙ АТМОСФЕРЫ */}
          <div>
            <SectionTitle>Состав рудничной атмосферы</SectionTitle>
            <div>
              <AtmRow label="CO" value={data.atmosphere.co} onChange={v => setAtm('co', v)} />
              <AtmRow label="CO₂" value={data.atmosphere.co2} onChange={v => setAtm('co2', v)} />
              <AtmRow label="SO₂" value={data.atmosphere.so2} onChange={v => setAtm('so2', v)} />
              <AtmRow label="O₂" value={data.atmosphere.o2} onChange={v => setAtm('o2', v)} />
              <AtmRow label="CH₄" value={data.atmosphere.ch4} onChange={v => setAtm('ch4', v)} />
              <AtmRow label="NO-NO₂" value={data.atmosphere.noNo2} onChange={v => setAtm('noNo2', v)} />
              <AtmRow label="t°" value={data.atmosphere.temperature} onChange={v => setAtm('temperature', v)} unit="°C" />
              <div className="pt-2">
                <label className={label} style={{ color: 'hsl(var(--muted-foreground))' }}>Степень задымлённости</label>
                <input
                  type="text"
                  value={data.atmosphere.smokeLevel}
                  onChange={e => setAtm('smokeLevel', e.target.value)}
                  placeholder="средняя от 5 до 10м"
                  className={inp}
                  style={{ color: 'hsl(var(--foreground))' }}
                />
              </div>
            </div>
          </div>

          {/* СХЕМА (КАРТИНКА) УЧАСТКА */}
          <div>
            <SectionTitle>Схема (картинка) участка</SectionTitle>
            <div
              className="rounded border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors hover:border-primary"
              style={{
                borderColor: data.schemaImageUrl ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                background: 'hsl(var(--card))',
                minHeight: 140,
                position: 'relative',
                overflow: 'hidden',
              }}
              onClick={() => fileRef.current?.click()}
            >
              {data.schemaImageUrl ? (
                <>
                  <img src={data.schemaImageUrl} alt="Схема" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }} />
                  <button
                    className="absolute top-1 right-1 w-6 h-6 rounded flex items-center justify-center text-xs"
                    style={{ background: 'hsl(var(--destructive))', color: '#fff' }}
                    onClick={e => { e.stopPropagation(); set('schemaImageUrl', ''); }}
                  >
                    <Icon name="X" size={12} />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <Icon name="ImagePlus" size={28} />
                  <span className="text-xs">Нажмите для загрузки</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          {/* УСЛОВНЫЕ ОБОЗНАЧЕНИЯ */}
          <div>
            <SectionTitle>Условные обозначения</SectionTitle>

            {/* Библиотека символов */}
            <div className="text-xs mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Нажмите на символ для добавления:
            </div>
            <div className="flex flex-wrap gap-2 mb-3 p-2 rounded border border-border" style={{ background: 'hsl(var(--card))' }}>
              {LEGEND_SYMBOLS.map(sym => {
                const already = data.legendItems.some(it => it.imageUrl === sym.imageUrl);
                return (
                  <button
                    key={sym.imageUrl}
                    title={sym.label}
                    onClick={() => {
                      if (already) return;
                      onChange({ ...data, legendItems: [...data.legendItems, { imageUrl: sym.imageUrl, label: sym.label }] });
                    }}
                    className="flex flex-col items-center gap-0.5 rounded p-1 transition-all"
                    style={{
                      opacity: already ? 0.35 : 1,
                      cursor: already ? 'default' : 'pointer',
                      background: already ? 'hsl(var(--muted))' : 'transparent',
                      border: '1px solid hsl(var(--border))',
                      minWidth: 52,
                    }}
                  >
                    <img src={sym.imageUrl} alt={sym.label} style={{ width: 36, height: 36, objectFit: 'contain' }} />
                    <span style={{ fontSize: 9, color: 'hsl(var(--muted-foreground))', textAlign: 'center', lineHeight: 1.2, maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sym.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Список добавленных */}
            {data.legendItems.length === 0 ? (
              <div className="text-xs text-center py-3 rounded border border-dashed border-border" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Добавьте обозначения из библиотеки выше
              </div>
            ) : (
              <div className="space-y-1.5">
                {data.legendItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 rounded px-2 py-1" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                    <img src={item.imageUrl} alt={item.label} style={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0 }} />
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
                      onClick={() => {
                        const items = data.legendItems.filter((_, idx) => idx !== i);
                        onChange({ ...data, legendItems: items });
                      }}
                      className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded hover:opacity-80"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      <Icon name="X" size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default SchemaFormPanel;