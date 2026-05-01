import React from 'react';
import { SchemaFormData, AtmosphereData } from '@/types/schema';

interface Props {
  data: SchemaFormData;
  onChange: (data: SchemaFormData) => void;
}

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  wide?: boolean;
  italic?: boolean;
  mono?: boolean;
  small?: boolean;
}> = ({ label, value, onChange, placeholder, wide, italic, mono, small }) => (
  <div className={`flex items-baseline gap-2 ${wide ? 'col-span-2' : ''}`}>
    <span
      className="flex-shrink-0 font-semibold"
      style={{ fontSize: small ? 11 : 12, color: '#1e293b', whiteSpace: 'nowrap' }}
    >
      {label}
    </span>
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600 flex-1"
      style={{
        fontSize: small ? 11 : 12,
        fontStyle: italic ? 'italic' : 'normal',
        fontFamily: mono ? "'IBM Plex Mono', monospace" : 'inherit',
        color: '#1e293b',
        minWidth: 60,
        paddingBottom: 1,
      }}
    />
  </div>
);

const AtmField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
}> = ({ label, value, onChange, unit }) => (
  <div className="flex items-baseline gap-0.5">
    <span style={{ fontSize: 11, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>{label}</span>
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600"
      style={{ fontSize: 11, fontStyle: 'italic', color: '#1e293b', width: 64, paddingBottom: 1 }}
    />
    {unit && <span style={{ fontSize: 11, color: '#1e293b' }}>{unit}</span>}
  </div>
);

const SchemaFormPanel: React.FC<Props> = ({ data, onChange }) => {
  const set = (key: keyof SchemaFormData, val: string) =>
    onChange({ ...data, [key]: val });

  const setAtm = (key: keyof AtmosphereData, val: string) =>
    onChange({ ...data, atmosphere: { ...data.atmosphere, [key]: val } });

  const setLegend = (i: number, val: string) => {
    const items = [...data.legendItems];
    items[i] = val;
    onChange({ ...data, legendItems: items });
  };

  const INP = 'border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600 text-center';

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ background: '#ffffff', color: '#1e293b', fontFamily: "'IBM Plex Sans', 'Times New Roman', serif" }}
    >
      <div style={{ padding: '12px 20px', maxWidth: 960, margin: '0 auto' }}>

        {/* ШАПКА */}
        <div className="flex items-center justify-center gap-3 mb-4 flex-wrap" style={{ borderBottom: '2px solid #1e40af', paddingBottom: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Схема аварийного участка - позиция</span>
          <input
            type="text"
            value={data.position}
            onChange={e => set('position', e.target.value)}
            className={INP}
            style={{ fontSize: 15, fontWeight: 700, width: 50, textAlign: 'center' }}
          />
          <input
            type="text"
            value={data.date}
            onChange={e => set('date', e.target.value)}
            className={INP}
            style={{ fontSize: 15, fontWeight: 700, width: 90 }}
          />
          <input
            type="text"
            value={data.time}
            onChange={e => set('time', e.target.value)}
            className={INP}
            style={{ fontSize: 15, fontWeight: 700, width: 60 }}
          />
          <span style={{ fontSize: 15, fontWeight: 700 }}>(</span>
          <input
            type="text"
            value={data.timezone}
            onChange={e => set('timezone', e.target.value)}
            className={INP}
            style={{ fontSize: 15, fontWeight: 700, width: 40 }}
          />
          <span style={{ fontSize: 15, fontWeight: 700 }}>)</span>
        </div>

        {/* НАИМЕНОВАНИЕ ОБЪЕКТА */}
        <div className="flex items-baseline gap-2 mb-3">
          <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>Наименование обслуживаемого объекта:</span>
          <input
            type="text"
            value={data.objectName}
            onChange={e => set('objectName', e.target.value)}
            placeholder="Введите наименование объекта..."
            className="border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600 flex-1"
            style={{ fontSize: 12, color: '#1e293b', paddingBottom: 1 }}
          />
        </div>

        {/* ВИД АВАРИИ, ДАТА, МЕСТО */}
        <div className="space-y-1.5 mb-3">
          <Field label="Вид аварии:" value={data.accidentType} onChange={v => set('accidentType', v)} placeholder="Пожар" />
          <div className="flex items-baseline gap-3 flex-wrap">
            <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>Дата и время аварии:</span>
            <input
              type="text"
              value={data.accidentDate}
              onChange={e => set('accidentDate', e.target.value)}
              className={`${INP}`}
              style={{ fontSize: 12, width: 90 }}
            />
            <input
              type="text"
              value={data.accidentTime}
              onChange={e => set('accidentTime', e.target.value)}
              className={INP}
              style={{ fontSize: 12, width: 60 }}
            />
            <span style={{ fontSize: 12 }}>(</span>
            <input
              type="text"
              value={data.accidentTimezone}
              onChange={e => set('accidentTimezone', e.target.value)}
              className={INP}
              style={{ fontSize: 12, width: 40 }}
            />
            <span style={{ fontSize: 12 }}>)</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>Место аварии:</span>
            <input
              type="text"
              value={data.accidentLocation}
              onChange={e => set('accidentLocation', e.target.value)}
              placeholder="насосная гор. +210м."
              className="border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600 flex-1"
              style={{ fontSize: 12, fontStyle: 'italic', color: '#1e293b', paddingBottom: 1 }}
            />
          </div>
        </div>

        {/* ПАРАМЕТРЫ + СОСТАВ АТМОСФЕРЫ */}
        <div className="flex gap-4" style={{ borderTop: '1px solid #cbd5e1', paddingTop: 8 }}>

          {/* Левая колонка — параметры */}
          <div className="flex-1 space-y-1.5" style={{ minWidth: 260 }}>
            <div className="flex items-baseline gap-2">
              <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>Количество воздуха в аварийной выработке:</span>
            </div>
            <div className="flex items-baseline gap-1 pl-2">
              <input
                type="text"
                value={data.airVolume}
                onChange={e => set('airVolume', e.target.value)}
                placeholder="4,79"
                className={INP}
                style={{ fontSize: 12, fontStyle: 'italic', width: 60 }}
              />
              <span style={{ fontSize: 11 }}>м³/с</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>Сечение аварийной выработки:</span>
            </div>
            <div className="flex items-baseline gap-1 pl-2">
              <input
                type="text"
                value={data.crossSection}
                onChange={e => set('crossSection', e.target.value)}
                placeholder="10,0"
                className={INP}
                style={{ fontSize: 12, fontStyle: 'italic', width: 60 }}
              />
              <span style={{ fontSize: 11 }}>м²</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>Телефон КП:</span>
              <input
                type="text"
                value={data.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="2-100"
                className="border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600"
                style={{ fontSize: 12, fontStyle: 'italic', width: 80, paddingBottom: 1 }}
              />
            </div>
          </div>

          {/* Правая колонка — состав атмосферы */}
          <div style={{ minWidth: 340 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textDecoration: 'underline', marginBottom: 6 }}>
              Состав рудничной атмосферы:
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              <AtmField label="CO- " value={data.atmosphere.co} onChange={v => setAtm('co', v)} unit="%" />
              <AtmField label="CO₂- " value={data.atmosphere.co2} onChange={v => setAtm('co2', v)} unit="%" />
              <div className="flex items-baseline gap-1">
                <span style={{ fontSize: 11, fontWeight: 600 }}>t-</span>
                <input
                  type="text"
                  value={data.atmosphere.temperature}
                  onChange={e => setAtm('temperature', e.target.value)}
                  className="border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600"
                  style={{ fontSize: 11, fontStyle: 'italic', width: 40, paddingBottom: 1 }}
                />
                <span style={{ fontSize: 11 }}>°</span>
              </div>
              <AtmField label="SO₂- " value={data.atmosphere.so2} onChange={v => setAtm('so2', v)} unit="%" />
              <AtmField label="O₂- " value={data.atmosphere.o2} onChange={v => setAtm('o2', v)} unit="%" />
              <AtmField label="CH₄- " value={data.atmosphere.ch4} onChange={v => setAtm('ch4', v)} unit="%" />
              <AtmField label="NO-NO₂- " value={data.atmosphere.noNo2} onChange={v => setAtm('noNo2', v)} unit="%" />
              <div />
              <AtmField label="SO₂- " value={data.atmosphere.so2_2} onChange={v => setAtm('so2_2', v)} unit="%" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>Степень задымлённости-</span>
              <input
                type="text"
                value={data.atmosphere.smokeLevel}
                onChange={e => setAtm('smokeLevel', e.target.value)}
                placeholder="средняя от 5 до 10м"
                className="border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600 flex-1"
                style={{ fontSize: 11, fontStyle: 'italic', paddingBottom: 1 }}
              />
            </div>
          </div>
        </div>

        {/* ОСНОВНАЯ ОБЛАСТЬ + УСЛОВНЫЕ ОБОЗНАЧЕНИЯ */}
        <div className="flex gap-0 mt-3" style={{ border: '1px solid #94a3b8' }}>
          {/* Основная область схемы */}
          <div
            className="flex-1 flex items-center justify-center"
            style={{ minHeight: 280, borderRight: '1px solid #94a3b8', background: '#f8fafc' }}
          >
            <span style={{ fontSize: 36, color: '#cbd5e1', fontWeight: 300 }}>Страница 1</span>
          </div>

          {/* Условные обозначения */}
          <div style={{ width: 180, padding: '8px 10px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, textDecoration: 'underline', marginBottom: 6, textAlign: 'center' }}>
              Условные обозначения:
            </div>
            {data.legendItems.map((item, i) => (
              <div key={i} style={{ borderBottom: '1px solid #cbd5e1', marginBottom: 2 }}>
                <input
                  type="text"
                  value={item}
                  onChange={e => setLegend(i, e.target.value)}
                  placeholder={i < 4 ? ['Надшахтное здание', 'Пожар', 'Стационарный пункт ВГК', 'Отделение в движении'][i] : ''}
                  className="w-full bg-transparent focus:outline-none"
                  style={{ fontSize: 11, color: '#1e293b', paddingBottom: 2, paddingTop: 1 }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ПОДПИСЬ */}
        <div className="flex items-end gap-3 mt-4" style={{ borderTop: '1px solid #94a3b8', paddingTop: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
            Руководитель горноспасательных работ:
          </span>
          <div className="flex-1 border-b border-gray-400" style={{ minHeight: 18 }} />
          <input
            type="text"
            value={data.supervisor}
            onChange={e => set('supervisor', e.target.value)}
            placeholder="/Ф.И. Фамилия/"
            className="border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600 text-center"
            style={{ fontSize: 12, width: 160, paddingBottom: 1 }}
          />
        </div>

      </div>
    </div>
  );
};

export default SchemaFormPanel;
