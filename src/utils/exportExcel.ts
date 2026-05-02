import * as XLSX from 'xlsx';
import { SchemaFormData } from '@/types/schema';

export const exportToExcel = (data: SchemaFormData, schemaName: string) => {
  const rows: [string, string][] = [
    ['Схема аварийного участка', schemaName],
    ['', ''],
    ['ЗАГОЛОВОК ДОКУМЕНТА', ''],
    ['Позиция №', data.position],
    ['Дата', data.date],
    ['Время', data.time],
    ['Часовой пояс', data.timezone],
    ['', ''],
    ['ОСНОВНЫЕ СВЕДЕНИЯ', ''],
    ['Наименование объекта', data.objectName],
    ['Вид аварии', data.accidentType],
    ['Дата аварии', data.accidentDate],
    ['Время аварии', data.accidentTime],
    ['Место аварии', data.accidentLocation],
    ['Кол-во воздуха, м³/с', data.airVolume],
    ['Сечение выработки, м²', data.crossSection],
    ['Телефон КП', data.phone],
    ['', ''],
    ['СОСТАВ РУДНИЧНОЙ АТМОСФЕРЫ', ''],
    ['CO, %', data.atmosphere.co],
    ['CO₂, %', data.atmosphere.co2],
    ['SO₂, %', data.atmosphere.so2],
    ['O₂, %', data.atmosphere.o2],
    ['CH₄, %', data.atmosphere.ch4],
    ['NO-NO₂, %', data.atmosphere.noNo2],
    ['Температура, °C', data.atmosphere.temperature],
    ['Степень задымлённости', data.atmosphere.smokeLevel],
    ['', ''],
    ['УСЛОВНЫЕ ОБОЗНАЧЕНИЯ', ''],
    ...data.legendItems
      .filter(i => i.label.trim())
      .map((item, idx): [string, string] => [`Обозначение ${idx + 1}`, item.label]),
    ['', ''],
    ['ПОДПИСИ', ''],
    ['Руководитель горноспасательных работ', data.supervisor],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!cols'] = [{ wch: 42 }, { wch: 40 }];

  const sectionRows = [2, 8, 18, 28, 33];
  sectionRows.forEach(r => {
    const cell = ws[XLSX.utils.encode_cell({ r, c: 0 })];
    if (cell) {
      cell.s = { font: { bold: true }, fill: { fgColor: { rgb: 'D6E4F0' } } };
    }
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Схема');

  const fileName = `${schemaName || 'схема'}_${data.date.replace(/\./g, '-')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};