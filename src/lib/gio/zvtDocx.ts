import {
  AlignmentType, BorderStyle, Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType,
} from 'docx';
import { minsToHHMM, turnBackTime, ZvtResult } from './zvt-calc';

export interface ZvtDocMeta {
  object?: string;
  squad?: string;
  commander?: string;
  performer?: string;
}

const FONT = 'Times New Roman';
const SIZE = 26;

const run = (text: string, bold = false, size = SIZE) => new TextRun({ text, bold, size, font: FONT });

const para = (children: TextRun[], align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT, after = 80) =>
  new Paragraph({ children, alignment: align, spacing: { after } });

const border = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
const borders = { top: border, bottom: border, left: border, right: border };

const row = (label: string, value: string, bold = false) =>
  new TableRow({
    children: [
      new TableCell({
        width: { size: 60, type: WidthType.PERCENTAGE },
        borders,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [para([run(label)], AlignmentType.LEFT, 0)],
      }),
      new TableCell({
        width: { size: 40, type: WidthType.PERCENTAGE },
        borders,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [para([run(value, bold)], AlignmentType.LEFT, 0)],
      }),
    ],
  });

const table = (rows: TableRow[]) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });

export async function exportZvtDocx(r: ZvtResult, meta: ZvtDocMeta = {}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('ru-RU');

  const info: TableRow[] = [];
  if (meta.object) info.push(row('Объект', meta.object));
  if (meta.squad) info.push(row('Отделение №', meta.squad));
  if (meta.commander) info.push(row('Командир отделения', meta.commander));
  info.push(
    row('Дата', dateStr),
    row('Температура воздуха в ЗВТ', `${r.temp} °C`),
    row('Режим', r.mode === 'moving' ? 'передвижение по горным выработкам' : 'работа на одном месте'),
    row('Цель работ', r.rescue ? 'спасение людей' : 'прочие горноспасательные работы'),
    row('Время входа в ЗВТ', r.entryTime),
  );

  const turn = turnBackTime(r);
  const res: TableRow[] = [
    row('Максимальное время пребывания', `${Math.round(r.maxTotal)} мин (${minsToHHMM(r.maxTotal)})`, true),
  ];
  if (r.mode === 'moving') {
    res.push(
      row('Движение вперёд (1/3)', `${Math.round(r.tForward)} мин`),
      row('Время поворота назад', turn ?? '—', true),
      row('Обратный путь (2/3)', `${Math.round(r.tBack)} мин`),
    );
  } else {
    res.push(row('Работа на месте', `${Math.round(r.tWork)} мин`));
  }
  res.push(row('Расчётное время выхода', r.exitTime, true));

  const children: (Paragraph | Table)[] = [
    para([run('РАСЧЁТ ВРЕМЕНИ ПРЕБЫВАНИЯ В ЗОНЕ ВЫСОКИХ ТЕМПЕРАТУР (ЗВТ)', true, 28)], AlignmentType.CENTER, 60),
    para([run('Приказ Ростехнадзора от 11.12.2020 №520, Приложение 6', false, 22)], AlignmentType.CENTER, 240),
    para([run('Исходные данные', true)], AlignmentType.LEFT, 100),
    table(info),
    para([], AlignmentType.LEFT, 200),
    para([run('Результат расчёта', true)], AlignmentType.LEFT, 100),
    table(res),
  ];

  if (r.rescueLimited) {
    children.push(
      para([], AlignmentType.LEFT, 120),
      para([run('Температура выше +40 °C: работы допускаются только для спасения людей и не более 10 минут.', true)]),
    );
  }

  children.push(
    para([], AlignmentType.LEFT, 360),
    para([run(`Расчёт выполнил: ${meta.performer || '____________________'}`), run('          Подпись: ______________')]),
  );

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1701, right: 850 } } },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Расчёт ЗВТ ${dateStr} ${r.entryTime.replace(':', '-')}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default exportZvtDocx;
