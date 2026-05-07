import React from 'react';
import { SchemaFormData } from '@/types/schema';

interface Props {
  data: SchemaFormData;
  schemaName: string;
  scale?: number;
}

const PrintDocument: React.FC<Props> = ({ data, schemaName, scale = 1 }) => {
  const V = (val: string, fallback = '___') => val?.trim() || fallback;

  const allLegendItems = [
    ...data.legendItems,
    ...(data.placedSymbols ?? [])
      .filter(sym => !data.legendItems.some(l => l.imageUrl === sym.imageUrl))
      .map(sym => ({ imageUrl: sym.imageUrl, label: sym.label })),
  ];

  const s = (v: number) => v * scale;

  const UL = (val: string, minW = 80) => (
    <span style={{ display: 'inline-block', borderBottom: `${s(1)}px solid #000`, minWidth: s(minW), paddingBottom: 0 }}>
      {val?.trim() || '\u00A0'}
    </span>
  );

  const fs = s(9);

  return (
    <div
      className="print-document"
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: fs,
        color: '#000',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* ── ШАПКА ── */}
      <div style={{ textAlign: 'center', fontWeight: 700, fontSize: s(11), paddingBottom: s(4), marginBottom: s(4), borderBottom: `${s(2)}px solid #1e3a8a`, flexShrink: 0 }}>
        Схема аварийного участка&nbsp;—&nbsp;позиция&nbsp;{UL(data.position, 30)}
        &nbsp;&nbsp;{UL(data.date, 70)}&nbsp;&nbsp;{UL(data.time, 40)}&nbsp;({UL(data.timezone || 'мск', 28)})
      </div>

      {/* ── ВЕРХНИЙ БЛОК: левая (реквизиты) + правая (атмосфера) ── */}
      <div style={{ display: 'flex', gap: s(12), flexShrink: 0, marginBottom: s(4) }}>

        {/* Левая — реквизиты */}
        <div style={{ flex: 1 }}>
          {/* Объект */}
          <div style={{ display: 'flex', gap: s(4), marginBottom: s(2), alignItems: 'flex-end' }}>
            <span style={{ fontWeight: 700, whiteSpace: 'nowrap', fontSize: fs }}>Наименование объекта:</span>
            <span style={{ borderBottom: `${s(1)}px solid #000`, flex: 1 }}>{data.objectName || '\u00A0'}</span>
          </div>

          {/* Вид, дата, место — в одну строку */}
          <table style={{ borderCollapse: 'collapse', width: '100%', lineHeight: 1.5 }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700, whiteSpace: 'nowrap', paddingRight: s(4), fontSize: fs }}>Вид аварии:</td>
                <td style={{ borderBottom: `${s(1)}px solid #000`, fontSize: fs }}>{data.accidentType || '\u00A0'}</td>
                <td style={{ fontWeight: 700, whiteSpace: 'nowrap', paddingLeft: s(8), paddingRight: s(4), fontSize: fs }}>Дата/время:</td>
                <td style={{ whiteSpace: 'nowrap', fontSize: fs }}>{UL(data.accidentDate, 60)}&nbsp;{UL(data.accidentTime, 36)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, whiteSpace: 'nowrap', fontSize: fs }}>Место аварии:</td>
                <td colSpan={3} style={{ borderBottom: `${s(1)}px solid #000`, fontStyle: 'italic', fontSize: fs }}>{data.accidentLocation || '\u00A0'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, whiteSpace: 'nowrap', fontSize: fs }}>Кол-во воздуха:</td>
                <td style={{ fontSize: fs }}>{UL(data.airVolume, 40)}&nbsp;м³/с</td>
                <td style={{ fontWeight: 700, whiteSpace: 'nowrap', paddingLeft: s(8), fontSize: fs }}>Сечение:</td>
                <td style={{ fontSize: fs }}>{UL(data.crossSection, 40)}&nbsp;м²</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, whiteSpace: 'nowrap', fontSize: fs }}>Телефон КП:</td>
                <td colSpan={3} style={{ fontSize: fs, fontStyle: 'italic' }}>{UL(data.phone, 60)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Правая — атмосфера */}
        <div style={{ flexShrink: 0, borderLeft: `${s(1)}px solid #94a3b8`, paddingLeft: s(10) }}>
          <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: s(2), fontSize: fs }}>Состав рудничной атмосферы:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: s(12), rowGap: s(1), fontSize: fs }}>
            {[
              ['CO', data.atmosphere.co, '%'],
              ['CO₂', data.atmosphere.co2, '%'],
              ['SO₂', data.atmosphere.so2, '%'],
              ['O₂', data.atmosphere.o2, '%'],
              ['CH₄', data.atmosphere.ch4, '%'],
              ['NO-NO₂', data.atmosphere.noNo2, '%'],
              ['t°', data.atmosphere.temperature, '°C'],
            ].map(([name, val, unit]) => (
              <div key={name} style={{ whiteSpace: 'nowrap' }}>
                <b>{name}-</b>&nbsp;<i>{UL(val, 34)}</i>&nbsp;{unit}
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1', whiteSpace: 'nowrap' }}>
              <b>Задымлённость-</b>&nbsp;<i>{UL(data.atmosphere.smokeLevel, 80)}</i>
            </div>
          </div>
        </div>
      </div>

      {/* ── ОСНОВНАЯ ОБЛАСТЬ (схема + условные обозначения) — растягивается ── */}
      <div style={{ flex: 1, display: 'flex', border: `${s(1)}px solid #64748b`, minHeight: 0 }}>

        {/* Картинка схемы + наложенные символы */}
        <div style={{ flex: 1, position: 'relative', borderRight: `${s(1)}px solid #64748b`, overflow: 'hidden' }}>
          {data.schemaImageUrl ? (
            <>
              <img src={data.schemaImageUrl} alt="Схема" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
              {(data.placedSymbols ?? []).map(sym => (
                <img
                  key={sym.id}
                  src={sym.imageUrl}
                  alt={sym.label}
                  style={{
                    position: 'absolute',
                    left: `${sym.x}%`,
                    top: `${sym.y}%`,
                    width: s(sym.size * 0.6),
                    height: s(sym.size * 0.6),
                    objectFit: 'contain',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              ))}
            </>
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: s(20), color: '#cbd5e1', fontWeight: 300 }}>{schemaName || 'Схема'}</span>
            </div>
          )}
        </div>

        {/* Условные обозначения */}
        <div style={{ width: s(160), flexShrink: 0, padding: `${s(4)}px ${s(6)}px`, overflow: 'hidden' }}>
          <div style={{ fontWeight: 700, textDecoration: 'underline', textAlign: 'center', fontSize: fs, marginBottom: s(4) }}>
            Условные обозначения:
          </div>
          {allLegendItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: s(3), borderBottom: `${s(1)}px solid #e2e8f0`, padding: `${s(2)}px 0`, fontSize: s(8) }}>
              {item.imageUrl && (
                <img src={item.imageUrl} alt={item.label} style={{ width: s(16), height: s(16), objectFit: 'contain', flexShrink: 0 }} />
              )}
              <span style={{ lineHeight: 1.2 }}>{item.label || '\u00A0'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ПОДПИСЬ ── */}
      <div style={{ flexShrink: 0, paddingTop: s(10), display: 'flex', alignItems: 'flex-end', gap: s(6) }}>
        <span style={{ fontWeight: 700, whiteSpace: 'nowrap', fontSize: fs }}>Руководитель горноспасательных работ:</span>
        <div style={{ flex: 1, borderBottom: `${s(1)}px solid #000` }} />
        <span style={{ fontStyle: 'italic', borderBottom: `${s(1)}px solid #000`, minWidth: s(130), textAlign: 'center', fontSize: fs }}>
          {V(data.supervisor, '\u00A0')}
        </span>
      </div>

    </div>
  );
};

export default PrintDocument;