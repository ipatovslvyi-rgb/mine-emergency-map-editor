import React, { useRef } from 'react';
import { SchemaFormData, AtmosphereData } from '@/types/schema';
import Icon from '@/components/ui/icon';

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
            <div className="space-y-1">
              {data.legendItems.map((item, i) => (
                <input
                  key={i}
                  type="text"
                  value={item}
                  onChange={e => {
                    const items = [...data.legendItems];
                    items[i] = e.target.value;
                    onChange({ ...data, legendItems: items });
                  }}
                  placeholder={`Обозначение ${i + 1}`}
                  className={inp}
                  style={{ color: 'hsl(var(--foreground))', fontSize: 12 }}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SchemaFormPanel;