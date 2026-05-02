import React from 'react';
import { SchemaFormData } from '@/types/schema';

interface Props {
  data: SchemaFormData;
  schemaName: string;
}

const PrintDocument: React.FC<Props> = ({ data, schemaName }) => {
  const V = (val: string, fallback = '___') => val?.trim() || fallback;
  const LINE = (val: string, width = 120) => (
    <span style={{ display: 'inline-block', borderBottom: '1px solid #000', minWidth: width, paddingBottom: 1 }}>
      {val || '\u00A0'}
    </span>
  );

  return (
    <div className="print-document" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 11, color: '#000', background: '#fff' }}>

      {/* ШАПКА */}
      <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 13, marginBottom: 8, paddingBottom: 6, borderBottom: '2px solid #1e3a8a' }}>
        Схема аварийного участка — позиция&nbsp;&nbsp;
        <u>{V(data.position)}</u>
        &nbsp;&nbsp;&nbsp;
        <u>{V(data.date)}</u>
        &nbsp;&nbsp;&nbsp;
        <u>{V(data.time)}</u>
        &nbsp;&nbsp;(<u>{V(data.timezone, 'мск')}</u>)
      </div>

      {/* НАИМЕНОВАНИЕ ОБЪЕКТА */}
      <table style={{ width: '100%', marginBottom: 6, borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ whiteSpace: 'nowrap', fontWeight: 700, paddingRight: 6, verticalAlign: 'bottom', fontSize: 11 }}>
              Наименование обслуживаемого объекта:
            </td>
            <td style={{ borderBottom: '1px solid #000', width: '100%', verticalAlign: 'bottom', paddingBottom: 1 }}>
              {V(data.objectName, '')}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ВИД АВАРИИ / ДАТА / МЕСТО */}
      <table style={{ width: '100%', marginBottom: 4, borderCollapse: 'collapse', lineHeight: 1.7 }}>
        <tbody>
          <tr>
            <td style={{ whiteSpace: 'nowrap', fontWeight: 700, paddingRight: 6, width: 160 }}>Вид аварии:</td>
            <td>{LINE(data.accidentType, 200)}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Дата и время аварии:</td>
            <td>
              {LINE(data.accidentDate, 90)}&nbsp;&nbsp;
              {LINE(data.accidentTime, 60)}&nbsp;&nbsp;
              ({LINE(data.accidentTimezone || 'мск', 40)})
            </td>
          </tr>
          <tr>
            <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Место аварии:</td>
            <td style={{ fontStyle: 'italic' }}>{LINE(data.accidentLocation, 300)}</td>
          </tr>
        </tbody>
      </table>

      {/* ПАРАМЕТРЫ + АТМОСФЕРА */}
      <div style={{ display: 'flex', gap: 16, borderTop: '1px solid #94a3b8', paddingTop: 6, marginBottom: 4 }}>

        {/* Левая — параметры */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <table style={{ borderCollapse: 'collapse', lineHeight: 1.8, width: '100%' }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700, fontSize: 11, paddingRight: 6, whiteSpace: 'nowrap' }}>
                  Количество воздуха в аварийной выработке:
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontStyle: 'italic' }}>{LINE(data.airVolume, 50)}</span>
                  <span style={{ fontSize: 9, verticalAlign: 'super' }}>м³</span>/с
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap' }}>
                  Сечение аварийной выработки:
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontStyle: 'italic' }}>{LINE(data.crossSection, 50)}</span>
                  <span style={{ fontSize: 9, verticalAlign: 'super' }}>м²</span>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap' }}>Телефон КП:</td>
                <td style={{ fontStyle: 'italic' }}>{LINE(data.phone, 70)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Правая — атмосфера */}
        <div style={{ minWidth: 320 }}>
          <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: 4, fontSize: 11 }}>
            Состав рудничной атмосферы:
          </div>
          <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
            <tbody>
              <tr>
                <td style={{ paddingRight: 16, whiteSpace: 'nowrap' }}>
                  <b>CO-</b> <i>{LINE(data.atmosphere.co, 50)}</i>%
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <b>CO₂-</b> <i>{LINE(data.atmosphere.co2, 50)}</i>%
                </td>
              </tr>
              <tr>
                <td style={{ paddingRight: 16, whiteSpace: 'nowrap' }}>
                  <b>t-</b> <i>{LINE(data.atmosphere.temperature, 40)}</i>°
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <b>SO₂-</b> <i>{LINE(data.atmosphere.so2, 50)}</i>%
                </td>
              </tr>
              <tr>
                <td style={{ paddingRight: 16, whiteSpace: 'nowrap' }}>
                  <b>O₂-</b> <i>{LINE(data.atmosphere.o2, 50)}</i>%
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <b>CH₄-</b> <i>{LINE(data.atmosphere.ch4, 50)}</i>%
                </td>
              </tr>
              <tr>
                <td />
                <td style={{ whiteSpace: 'nowrap' }}>
                  <b>NO-NO₂-</b> <i>{LINE(data.atmosphere.noNo2, 50)}</i>%
                </td>
              </tr>
              <tr>
                <td />
                <td style={{ whiteSpace: 'nowrap' }}>
                  <b>SO₂-</b> <i>{LINE(data.atmosphere.so2_2, 50)}</i>%
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={{ paddingTop: 4, whiteSpace: 'nowrap' }}>
                  <b>Степень задымлённости-</b>&nbsp;
                  <i>{LINE(data.atmosphere.smokeLevel, 160)}</i>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ОСНОВНАЯ ОБЛАСТЬ + УСЛОВНЫЕ ОБОЗНАЧЕНИЯ */}
      <div style={{ display: 'flex', border: '1px solid #64748b', marginBottom: 8, minHeight: 340 }}>

        {/* Область схемы */}
        <div style={{ flex: 1, borderRight: '1px solid #64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 340, overflow: 'hidden' }}>
          {data.schemaImageUrl ? (
            <img src={data.schemaImageUrl} alt="Схема" style={{ maxWidth: '100%', maxHeight: 340, objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: 28, color: '#cbd5e1', fontWeight: 300 }}>
              {schemaName || 'Схема'}
            </span>
          )}
        </div>

        {/* Условные обозначения */}
        <div style={{ width: 175, padding: '6px 8px' }}>
          <div style={{ fontWeight: 700, textDecoration: 'underline', textAlign: 'center', fontSize: 11, marginBottom: 6 }}>
            Условные обозначения:
          </div>
          {data.legendItems.map((item, i) => (
            <div key={i} style={{ borderBottom: '1px solid #94a3b8', fontSize: 11, lineHeight: 1.8, paddingLeft: 2 }}>
              {item || '\u00A0'}
            </div>
          ))}
        </div>
      </div>

      {/* ПОДПИСИ */}
      <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {[
          { lbl: 'Руководитель горноспасательных работ:', val: data.supervisor },
        ].map(({ lbl, val }) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <span style={{ fontWeight: 700, whiteSpace: 'nowrap', fontSize: 10 }}>{lbl}</span>
            <div style={{ flex: 1, borderBottom: '1px solid #000', minHeight: 14 }} />
            <span style={{ fontStyle: 'italic', whiteSpace: 'nowrap', borderBottom: '1px solid #000', minWidth: 140, textAlign: 'center', fontSize: 10 }}>
              {V(val, '\u00A0')}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
};

export default PrintDocument;