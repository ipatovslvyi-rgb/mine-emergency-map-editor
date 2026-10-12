import {
  AlignmentType, BorderStyle, Document, ImageRun, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType,
} from 'docx';
import { GasZoneResult, Point, VgschInput, VgschResult } from './explosion-triangle-calc';

export interface TriangleDocMeta {
  object?: string;
  squad?: string;
  commander?: string;
  performer?: string;
}

const FONT = 'Times New Roman';
const SIZE = 26;

const run = (text: string, bold = false, size = SIZE, color?: string) => new TextRun({ text, bold, size, font: FONT, color });

const para = (children: (TextRun | ImageRun)[], align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT, after = 80) =>
  new Paragraph({ children, alignment: align, spacing: { after } });

const border = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
const borders = { top: border, bottom: border, left: border, right: border };

const cell = (text: string, width: number, bold = false) => new TableCell({
  width: { size: width, type: WidthType.PERCENTAGE },
  borders,
  margins: { top: 60, bottom: 60, left: 100, right: 100 },
  children: [para([run(text, bold)], AlignmentType.LEFT, 0)],
});

const row = (label: string, value: string, bold = false) =>
  new TableRow({ children: [cell(label, 60), cell(value, 40, bold)] });

const table = (rows: TableRow[]) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });

const CW = 1040, CH = 680;

export function chartCanvas(tri: Point[], point: Point, explosive: boolean): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = CW;
  canvas.height = CH;
  const ctx = canvas.getContext('2d')!;
  const PL = 80, PR = 30, PT = 30, PB = 80, XMAX = 35, YMAX = 22;
  const sx = (c: number) => PL + (Math.min(c, XMAX) / XMAX) * (CW - PL - PR);
  const sy = (o: number) => PT + (1 - Math.min(Math.max(o, 0), YMAX) / YMAX) * (CH - PT - PB);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CW, CH);

  ctx.strokeStyle = '#d0d0d0';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#333333';
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  for (let x = 0; x <= 35; x += 5) {
    ctx.beginPath(); ctx.moveTo(sx(x), PT); ctx.lineTo(sx(x), CH - PB); ctx.stroke();
    ctx.fillText(String(x), sx(x), CH - PB + 28);
  }
  ctx.textAlign = 'right';
  for (let y = 0; y <= 20; y += 4) {
    ctx.beginPath(); ctx.moveTo(PL, sy(y)); ctx.lineTo(CW - PR, sy(y)); ctx.stroke();
    ctx.fillText(String(y), PL - 10, sy(y) + 7);
  }
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(PL, PT, CW - PL - PR, CH - PT - PB);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('C = CH₄ + CO + H₂, %', (CW + PL) / 2, CH - 18);
  ctx.save();
  ctx.translate(24, (CH - PB + PT) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('O₂, %', 0, 0);
  ctx.restore();

  ctx.beginPath();
  tri.forEach(([c, o], i) => (i ? ctx.lineTo(sx(c), sy(o)) : ctx.moveTo(sx(c), sy(o))));
  ctx.closePath();
  ctx.fillStyle = 'rgba(220, 38, 38, 0.2)';
  ctx.fill();
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#dc2626';
  tri.forEach(([c, o]) => { ctx.beginPath(); ctx.arc(sx(c), sy(o), 5, 0, Math.PI * 2); ctx.fill(); });

  const pc = explosive ? '#dc2626' : '#16a34a';
  ctx.strokeStyle = pc;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath(); ctx.moveTo(sx(point[0]), sy(point[1])); ctx.lineTo(sx(point[0]), CH - PB); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(PL, sy(point[1])); ctx.lineTo(sx(point[0]), sy(point[1])); ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(sx(point[0]), sy(point[1]), 11, 0, Math.PI * 2);
  ctx.fillStyle = pc;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'left';
  ctx.fillStyle = pc;
  ctx.fillText(`(${point[0]}; ${point[1]})`, Math.min(sx(point[0]) + 16, CW - PR - 140), sy(point[1]) - 14);

  return canvas;
}

async function chartPng(tri: Point[], point: Point, explosive: boolean): Promise<Uint8Array> {
  const canvas = chartCanvas(tri, point, explosive);
  const blob: Blob = await new Promise((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('canvas'))), 'image/png'));
  return new Uint8Array(await blob.arrayBuffer());
}

const metaRows = (meta: TriangleDocMeta) => {
  const rows: TableRow[] = [];
  if (meta.object) rows.push(row('Объект', meta.object));
  if (meta.squad) rows.push(row('Отделение №', meta.squad));
  if (meta.commander) rows.push(row('Командир отделения', meta.commander));
  const now = new Date();
  rows.push(row('Дата и время расчёта', `${now.toLocaleDateString('ru-RU')} ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`));
  return rows;
};

const verdict = (explosive: boolean, label: string, text: string) => [
  para([run(label, true, 30, explosive ? 'C00000' : '00803C')], AlignmentType.CENTER, 100),
  para([run(text)], AlignmentType.JUSTIFIED, 120),
];

const signature = (performer?: string) => [
  para([], AlignmentType.LEFT, 240),
  para([run(`Расчёт выполнил: ${performer || '____________________'}`), run('          Подпись: ______________')]),
];

async function save(children: (Paragraph | Table)[], name: string) {
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
  a.download = `${name} ${new Date().toLocaleDateString('ru-RU')}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const header = (subtitle: string) => [
  para([run('РАСЧЁТ ВЗРЫВАЕМОСТИ РУДНИЧНОЙ АТМОСФЕРЫ', true, 28)], AlignmentType.CENTER, 60),
  para([run(subtitle, false, 22)], AlignmentType.CENTER, 240),
];

export async function exportVgschDocx(input: VgschInput, r: VgschResult, meta: TriangleDocMeta = {}) {
  const png = await chartPng(r.tri, [r.C, r.o2], r.isExplosive);
  const children: (Paragraph | Table)[] = [
    ...header('Метод треугольников взрываемости (Боевой устав ВГСЧ, Приложение 11)'),
    para([run('Исходные данные', true)], AlignmentType.LEFT, 100),
    table([
      ...metaRows(meta),
      row('Метан CH₄', `${input.ch4} %`),
      row('Оксид углерода CO', `${input.co} %`),
      row('Водород H₂', `${input.h2} %`),
      row('Кислород O₂', `${input.o2} %`),
    ]),
    para([], AlignmentType.LEFT, 200),
    para([run('Расчёт', true)], AlignmentType.LEFT, 100),
    table([
      row('Сумма горючих C = CH₄ + CO + H₂', `${r.C} %`, true),
      row('Доля метана P_CH = CH₄ / C', String(r.pch)),
      row('Доля оксида углерода P_CO = CO / C', String(r.pco)),
      row('Доля водорода P_H = H₂ / C', String(r.ph)),
      row('Применённый треугольник', `P_CO = ${r.pcoKey}, P_CH = ${r.pchKey}`),
      row('Вершины треугольника (C; O₂)', r.tri.map(([c, o]) => `(${c}; ${o})`).join(', ')),
    ]),
    para([], AlignmentType.LEFT, 160),
    para([new ImageRun({ type: 'png', data: png, transformation: { width: 560, height: 366 } })], AlignmentType.CENTER, 60),
    para([run('Рис. 1. Треугольник взрываемости и точка анализируемой смеси', false, 22)], AlignmentType.CENTER, 200),
    para([run('Заключение', true)], AlignmentType.LEFT, 100),
    ...verdict(r.isExplosive, r.isExplosive ? 'СМЕСЬ ВЗРЫВООПАСНА' : 'СМЕСЬ НЕВЗРЫВООПАСНА', r.conclusion),
    ...signature(meta.performer),
  ];
  await save(children, 'Расчёт взрываемости');
}

export async function exportGasZoneDocx(r: GasZoneResult, meta: TriangleDocMeta = {}) {
  const children: (Paragraph | Table)[] = [
    ...header('Оценка смеси по пределам взрываемости горючего газа'),
    para([run('Исходные данные', true)], AlignmentType.LEFT, 100),
    table([
      ...metaRows(meta),
      row('Горючий газ', `${r.gas.name} (${r.gas.formula})`),
      row(`Концентрация ${r.gas.formula}`, `${r.gasPct} %`),
      row('Кислород O₂', `${r.o2Pct} %`),
    ]),
    para([], AlignmentType.LEFT, 200),
    para([run('Пределы взрываемости', true)], AlignmentType.LEFT, 100),
    table([
      row('Нижний предел взрываемости (НПВ)', `${r.gas.lel} %`),
      row('Верхний предел взрываемости (ВПВ)', `${r.gas.uel} %`),
      row('Минимальное содержание O₂ для горения', `${r.gas.lol} %`),
    ]),
    para([], AlignmentType.LEFT, 200),
    para([run('Заключение', true)], AlignmentType.LEFT, 100),
    ...verdict(r.isExplosive, r.label, r.conclusion),
    ...signature(meta.performer),
  ];
  await save(children, 'Расчёт взрываемости');
}
