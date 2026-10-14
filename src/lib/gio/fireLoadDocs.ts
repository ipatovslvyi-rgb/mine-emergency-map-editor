import {
  AlignmentType, BorderStyle, Document, ImageRun, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType,
} from 'docx';
import {
  BELT_HEAT_VALUE, BeltFireResult, BeltInputs, fmt, MachineFireResult, Material,
} from './fire-load-calc';

export interface FireDocMeta {
  object?: string;
  place?: string;
  performer?: string;
}

const FONT = 'Times New Roman';
const SIZE = 24;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const nowStr = () => {
  const d = new Date();
  return `${d.toLocaleDateString('ru-RU')} ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
};

export const MACHINE_FORMULAS: [string, string][] = [
  ['Объём материала', 'S = m / ρmax'],
  ['Радиус условного шара', 'r = (3·S / 4π)^(1/3)'],
  ['Поверхность горения', 'Ro = 4π·r'],
  ['Запас энергии', 'N = m · Qн'],
  ['Время выгорания', 'T1 = m / (Ro · ψ) / 3600'],
  ['Мощность пожара', 'Q = ΣN / max(T1) / 3600'],
  ['Время горения', 'τ = ΣN / Q / 3600'],
  ['Нагрев воздушной струи', 'Δt = Q / (L · 1,25 · 1005)'],
];

export const BELT_FORMULAS: [string, string][] = [
  ['Объём ленты (2 ветви)', 'V = L · w · h · 2'],
  ['Масса / запас энергии', `M = V · ρ;  E = M · Qн (Qн = ${fmt(BELT_HEAT_VALUE, 1)} МДж/кг)`],
  ['Скорость фронта пламени', 'vп = vпл · 60, м/мин'],
  ['Коэффициент выгорания', 'k = ψ · 60 / (2 · ρ · h · 2 · vп)'],
  ['Путь фронта пламени', 'x = min(vп · t, L)'],
  ['Длина выгоревшего участка', 'lb = x · (1 − e^(−k·t))'],
  ['Площадь активного горения', 'S = (x − lb) · w'],
  ['Мощность пожара', 'Q(t) = ψ · S · Qн'],
  ['Нагрев воздушной струи', 'Δt = Q / (L · 1,25 · 1005)'],
];

export const BELT_KEY_TIMES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 51, 60];

const CW = 1040, CH = 560;

export function beltChartCanvas(r: BeltFireResult): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = CW; c.height = CH;
  const ctx = c.getContext('2d')!;
  const PL = 90, PR = 30, PT = 30, PB = 80;
  const ymax = Math.max(1, Math.ceil(Math.max(...r.rows.map(x => x.powerMW)) * 1.15));
  const sx = (t: number) => PL + (t / 60) * (CW - PL - PR);
  const sy = (q: number) => PT + (1 - q / ymax) * (CH - PT - PB);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, CW, CH);
  ctx.strokeStyle = '#d0d0d0'; ctx.lineWidth = 1; ctx.fillStyle = '#333'; ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  for (let t = 0; t <= 60; t += 10) {
    ctx.beginPath(); ctx.moveTo(sx(t), PT); ctx.lineTo(sx(t), CH - PB); ctx.stroke();
    ctx.fillText(String(t), sx(t), CH - PB + 28);
  }
  ctx.textAlign = 'right';
  const step = ymax <= 5 ? 1 : ymax <= 12 ? 2 : Math.ceil(ymax / 6);
  for (let q = 0; q <= ymax; q += step) {
    ctx.beginPath(); ctx.moveTo(PL, sy(q)); ctx.lineTo(CW - PR, sy(q)); ctx.stroke();
    ctx.fillText(String(q), PL - 10, sy(q) + 7);
  }
  ctx.textAlign = 'center'; ctx.font = '22px Arial'; ctx.fillStyle = '#000';
  ctx.fillText('Время от начала пожара, мин', (CW + PL) / 2, CH - 20);
  ctx.save(); ctx.translate(26, (CH - PB + PT) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('Мощность Q, МВт', 0, 0); ctx.restore();
  ctx.strokeStyle = '#c00000'; ctx.lineWidth = 4; ctx.beginPath();
  ctx.moveTo(sx(0), sy(0));
  r.rows.forEach(x => ctx.lineTo(sx(x.t), sy(x.powerMW)));
  ctx.stroke();
  [[30, r.power30], [60, r.power60]].forEach(([t, q]) => {
    ctx.fillStyle = '#c00000'; ctx.beginPath(); ctx.arc(sx(t), sy(q), 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000'; ctx.font = 'bold 20px Arial'; ctx.textAlign = t === 60 ? 'right' : 'center';
    ctx.fillText(`${fmt(q)} МВт`, sx(t) - (t === 60 ? 12 : 0), sy(q) - 16);
  });
  return c;
}

const canvasPng = (c: HTMLCanvasElement) => new Promise<Uint8Array>((resolve, reject) => {
  c.toBlob(b => (b ? b.arrayBuffer().then(a => resolve(new Uint8Array(a))) : reject(new Error('png'))), 'image/png');
});

const run = (text: string, bold = false, size = SIZE, color?: string) => new TextRun({ text, bold, size, font: FONT, color });
const para = (children: (TextRun | ImageRun)[], align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT, after = 80) =>
  new Paragraph({ children, alignment: align, spacing: { after } });
const bd = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
const borders = { top: bd, bottom: bd, left: bd, right: bd };
const cell = (text: string, width: number, bold = false, size = SIZE, align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT) => new TableCell({
  width: { size: width, type: WidthType.PERCENTAGE },
  borders,
  margins: { top: 40, bottom: 40, left: 80, right: 80 },
  children: [para([run(text, bold, size)], align, 0)],
});
const grid = (head: string[], body: string[][], widths: number[], size = 20) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, widths[i], true, size, AlignmentType.CENTER)) }),
    ...body.map(r => new TableRow({ children: r.map((v, i) => cell(v, widths[i], false, size, i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER)) })),
  ],
});
const kv = (items: [string, string, boolean?][]) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: items.map(([l, v, b]) => new TableRow({ children: [cell(l, 60), cell(v, 40, !!b)] })),
});

const metaRows = (meta: FireDocMeta): [string, string][] => {
  const r: [string, string][] = [];
  if (meta.object) r.push(['Объект', meta.object]);
  if (meta.place) r.push(['Место (выработка)', meta.place]);
  r.push(['Дата и время расчёта', nowStr()]);
  return r;
};

async function save(name: string, children: (Paragraph | Table)[]) {
  const doc = new Document({
    sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1701, right: 850 } } }, children }],
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

const conclusionText = (q: number) =>
  `Для расчёта устойчивости вентиляционного режима при возникновении пожара принимаем максимальную величину мощности пожара ${fmt(q)} МВт.`;

const docSign = (performer?: string) =>
  para([run(`Расчёт выполнил: ${performer || '____________________'}          Подпись: ______________`)], AlignmentType.LEFT, 0);

export async function exportMachineDocx(machine: string, mats: Material[], r: MachineFireResult, meta: FireDocMeta = {}) {
  const children: (Paragraph | Table)[] = [
    para([run('Приложение №1', false, 22)], AlignmentType.RIGHT, 120),
    para([run('РАСЧЁТ МОЩНОСТИ ПОЖАРА ТЕХНИКИ', true, 28)], AlignmentType.CENTER, 60),
    para([run(`Техника: ${machine}`, false, 24)], AlignmentType.CENTER, 200),
    kv(metaRows(meta)),
    para([run('Исходные данные', true)], AlignmentType.LEFT, 80),
    grid(['Материал', 'ρ, кг/м³', 'm, кг', 'ψ, кг/(м²·с)', 'Qн, МДж/кг'],
      mats.map(m => [m.name, String(m.density), String(m.mass), String(m.burnRate), String(m.heatValue)]), [32, 17, 17, 17, 17]),
    para([run('')], AlignmentType.LEFT, 60),
    para([run('Расчёт по материалам', true)], AlignmentType.LEFT, 80),
    grid(['Материал', 'S, м³', 'Ro, м²', 'N, МДж', 'T1, ч', 'W1, МВт'],
      r.items.map(i => [i.name, fmt(i.S, 3), fmt(i.Ro, 3), fmt(i.N, 0), fmt(i.T1, 3), fmt(i.W1)]), [25, 15, 15, 15, 15, 15]),
    para([run('')], AlignmentType.LEFT, 60),
    kv([
      ['ρmax, кг/м³', fmt(r.maxDensity, 0)],
      ['Общая масса горючих Σm, кг', fmt(r.totalMass, 0)],
      ['Запас энергии ΣN, МДж', fmt(r.totalEnergy, 0)],
      ['Максимальное время выгорания max(T1), ч', fmt(r.maxT1, 3)],
      ['Мощность пожара Q, МВт', fmt(r.powerMW), true],
      ['Время горения τ', `${fmt(r.timeH)} ч  (${fmt(r.timeMin, 1)} мин)`, true],
      ['Расход воздуха L, м³/с', fmt(r.flowM3s, 1)],
      ['Расчётная температура горения Δt, °C', r.deltaT !== null ? fmt(r.deltaT, 1) : '—', true],
    ]),
    para([run('')], AlignmentType.LEFT, 60),
    para([run('Формулы расчёта', true)], AlignmentType.LEFT, 80),
    ...MACHINE_FORMULAS.map(([l, f]) => para([run(`${l}: `, false, 22), run(f, false, 22)], AlignmentType.LEFT, 20)),
    para([run('')], AlignmentType.LEFT, 80),
    para([run(conclusionText(r.powerMW), true)], AlignmentType.JUSTIFIED, 360),
    docSign(meta.performer),
  ];
  await save(`Мощность пожара техники ${machine}`, children);
}

export async function exportBeltDocx(inp: BeltInputs, r: BeltFireResult, meta: FireDocMeta = {}, fullTable = true) {
  const png = await canvasPng(beltChartCanvas(r));
  const rows = fullTable ? r.rows : r.rows.filter(x => BELT_KEY_TIMES.includes(x.t));
  const children: (Paragraph | Table)[] = [
    para([run('Приложение №3', false, 22)], AlignmentType.RIGHT, 120),
    para([run('РАСЧЁТ МОЩНОСТИ ПОЖАРА КОНВЕЙЕРНОЙ ЛЕНТЫ', true, 28)], AlignmentType.CENTER, 200),
    kv(metaRows(meta)),
    para([run('Исходные данные', true)], AlignmentType.LEFT, 80),
    kv([
      ['Массовая скорость выгорания ψ, кг/(м²·с)', String(inp.burnRate)],
      ['Плотность ленточного полотна ρ, кг/м³', String(inp.density)],
      ['Ширина ленты w, м', String(inp.width)],
      ['Длина конвейера L, м', String(inp.length)],
      ['Толщина ленты h, м', String(inp.thickness)],
      ['Скорость продвижения пламени, м/с', String(inp.flameSpeed)],
      ...(inp.airSpeed !== undefined ? [['Скорость воздуха, м/с', String(inp.airSpeed)] as [string, string]] : []),
      ['Расход воздуха, м³/с', String(inp.flowM3s)],
      ['Объём ленты V, м³', fmt(r.volume, 3)],
      ['Масса ленты M, кг', fmt(r.mass, 1)],
      ['Запас энергии E, МДж', fmt(r.heatTotal, 0)],
    ]),
    para([run('')], AlignmentType.LEFT, 60),
    para([run('Развитие пожара во времени', true)], AlignmentType.LEFT, 80),
    grid(['t, мин', 'Путь пламени, м', 'S горения, м²', 'Масса выгор., кг', 'Объём выгор., м³', 'Длина выгор., м', 'Q, МВт'],
      rows.map(x => [String(x.t), fmt(x.dist), fmt(x.area), fmt(x.massBurned), fmt(x.volBurned, 3), fmt(x.lengthBurned), fmt(x.powerMW)]),
      [10, 15, 15, 16, 15, 15, 14], 18),
    para([new ImageRun({ data: png, transformation: { width: 600, height: 323 }, type: 'png' })], AlignmentType.CENTER, 40),
    para([run('Рис. 1. Мощность пожара конвейерной ленты во времени', false, 20)], AlignmentType.CENTER, 160),
    para([run(`Мощность пожара через 30 минут после возникновения пожара составит ${fmt(r.power30)} МВт.`)], AlignmentType.JUSTIFIED, 40),
    para([run(`Мощность пожара через 60 минут после возникновения пожара составит ${fmt(r.power60)} МВт.`)], AlignmentType.JUSTIFIED, 120),
    para([run(`Расчётная температура горения ленты: мощность ${fmt(r.powerMax)} МВт; расход ${fmt(inp.flowM3s, 1)} м³/с; Δt = ${fmt(r.deltaTmax, 1)} °C.`)], AlignmentType.JUSTIFIED, 120),
    para([run('Формулы расчёта', true)], AlignmentType.LEFT, 80),
    ...BELT_FORMULAS.map(([l, f]) => para([run(`${l}: `, false, 22), run(f, false, 22)], AlignmentType.LEFT, 20)),
    para([run('')], AlignmentType.LEFT, 80),
    para([run(conclusionText(r.powerMax), true)], AlignmentType.JUSTIFIED, 360),
    docSign(meta.performer),
  ];
  await save('Мощность пожара конвейерной ленты', children);
}

const CSS = `
@page{size:A4;margin:15mm 12mm 15mm 25mm}
*{box-sizing:border-box}
body{font-family:'Times New Roman',Times,serif;font-size:12pt;color:#000;margin:0;padding:24px}
.app{text-align:right;font-size:11pt}
h1{font-size:14pt;text-align:center;margin:6px 0 4px}
.sub{font-size:12pt;text-align:center;margin:0 0 14px}
h2{font-size:12.5pt;margin:14px 0 6px}
table{width:100%;border-collapse:collapse;margin-bottom:4px}
td,th{border:1px solid #000;padding:3px 6px;vertical-align:top}
th{background:#eee;font-size:10.5pt}
.g td{text-align:center;font-size:10.5pt}.g td:first-child{text-align:left}
.kv td:first-child{width:60%}
.b{font-weight:bold}
.f{font-size:11pt;margin:2px 0}
.fig{text-align:center;margin:12px 0 4px}.fig img{width:160mm;max-width:100%}
.cap{text-align:center;font-size:10.5pt;margin-bottom:8px}
.concl{font-weight:bold;text-align:justify;margin-top:12px}
.sign{margin-top:26px}
@media print{body{padding:0}.fig,.concl{break-inside:avoid}}
`;

const kvHtml = (items: [string, string, boolean?][]) =>
  `<table class="kv">${items.map(([l, v, b]) => `<tr><td>${esc(l)}</td><td${b ? ' class="b"' : ''}>${esc(v)}</td></tr>`).join('')}</table>`;
const gridHtml = (head: string[], body: string[][]) =>
  `<table class="g"><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr>${body.map(r => `<tr>${r.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</table>`;
const formulasHtml = (f: [string, string][]) => `<h2>Формулы расчёта</h2>${f.map(([l, v]) => `<div class="f">${esc(l)}: <b>${esc(v)}</b></div>`).join('')}`;
const signHtml = (p?: string) => `<div class="sign">Расчёт выполнил: ${esc(p || '____________________')}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Подпись: ______________</div>`;

function openPrint(title: string, body: string) {
  const w = window.open('', '_blank', 'width=860,height=900');
  if (!w) return false;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${CSS}</style></head><body>${body}<script>window.onload=()=>{setTimeout(()=>window.print(),200)}</script></body></html>`);
  w.document.close();
  return true;
}

export function printMachine(machine: string, mats: Material[], r: MachineFireResult, meta: FireDocMeta = {}) {
  return openPrint('Мощность пожара техники', [
    '<div class="app">Приложение №1</div>',
    '<h1>РАСЧЁТ МОЩНОСТИ ПОЖАРА ТЕХНИКИ</h1>',
    `<div class="sub">Техника: ${esc(machine)}</div>`,
    kvHtml(metaRows(meta)),
    '<h2>Исходные данные</h2>',
    gridHtml(['Материал', 'ρ, кг/м³', 'm, кг', 'ψ, кг/(м²·с)', 'Qн, МДж/кг'], mats.map(m => [m.name, String(m.density), String(m.mass), String(m.burnRate), String(m.heatValue)])),
    '<h2>Расчёт по материалам</h2>',
    gridHtml(['Материал', 'S, м³', 'Ro, м²', 'N, МДж', 'T1, ч', 'W1, МВт'], r.items.map(i => [i.name, fmt(i.S, 3), fmt(i.Ro, 3), fmt(i.N, 0), fmt(i.T1, 3), fmt(i.W1)])),
    '<h2>Результат</h2>',
    kvHtml([
      ['Запас энергии ΣN, МДж', fmt(r.totalEnergy, 0)],
      ['Максимальное время выгорания max(T1), ч', fmt(r.maxT1, 3)],
      ['Мощность пожара Q, МВт', fmt(r.powerMW), true],
      ['Время горения τ', `${fmt(r.timeH)} ч  (${fmt(r.timeMin, 1)} мин)`, true],
      ['Расход воздуха L, м³/с', fmt(r.flowM3s, 1)],
      ['Расчётная температура горения Δt, °C', r.deltaT !== null ? fmt(r.deltaT, 1) : '—', true],
    ]),
    formulasHtml(MACHINE_FORMULAS),
    `<div class="concl">${esc(conclusionText(r.powerMW))}</div>`,
    signHtml(meta.performer),
  ].join(''));
}

export function printBelt(inp: BeltInputs, r: BeltFireResult, meta: FireDocMeta = {}, fullTable = true) {
  const img = beltChartCanvas(r).toDataURL('image/png');
  const rows = fullTable ? r.rows : r.rows.filter(x => BELT_KEY_TIMES.includes(x.t));
  return openPrint('Мощность пожара конвейерной ленты', [
    '<div class="app">Приложение №3</div>',
    '<h1>РАСЧЁТ МОЩНОСТИ ПОЖАРА КОНВЕЙЕРНОЙ ЛЕНТЫ</h1><div class="sub">&nbsp;</div>',
    kvHtml(metaRows(meta)),
    '<h2>Исходные данные</h2>',
    kvHtml([
      ['Массовая скорость выгорания ψ, кг/(м²·с)', String(inp.burnRate)],
      ['Плотность ленточного полотна ρ, кг/м³', String(inp.density)],
      ['Ширина / длина / толщина ленты, м', `${inp.width} / ${inp.length} / ${inp.thickness}`],
      ['Скорость продвижения пламени, м/с', String(inp.flameSpeed)],
      ...(inp.airSpeed !== undefined ? [['Скорость воздуха, м/с', String(inp.airSpeed)] as [string, string]] : []),
      ['Расход воздуха, м³/с', String(inp.flowM3s)],
      ['Объём / масса ленты', `${fmt(r.volume, 3)} м³ / ${fmt(r.mass, 1)} кг`],
      ['Запас энергии E, МДж', fmt(r.heatTotal, 0)],
    ]),
    '<h2>Развитие пожара во времени</h2>',
    gridHtml(['t, мин', 'Путь пламени, м', 'S горения, м²', 'Масса выгор., кг', 'Объём выгор., м³', 'Длина выгор., м', 'Q, МВт'],
      rows.map(x => [String(x.t), fmt(x.dist), fmt(x.area), fmt(x.massBurned), fmt(x.volBurned, 3), fmt(x.lengthBurned), fmt(x.powerMW)])),
    `<div class="fig"><img src="${img}" alt="График"></div><div class="cap">Рис. 1. Мощность пожара конвейерной ленты во времени</div>`,
    `<div>Мощность пожара через 30 минут после возникновения пожара составит <b>${fmt(r.power30)} МВт</b>.</div>`,
    `<div>Мощность пожара через 60 минут после возникновения пожара составит <b>${fmt(r.power60)} МВт</b>.</div>`,
    `<div style="margin-top:6px">Расчётная температура горения ленты: мощность ${fmt(r.powerMax)} МВт; расход ${fmt(inp.flowM3s, 1)} м³/с; <b>Δt = ${fmt(r.deltaTmax, 1)} °C</b>.</div>`,
    formulasHtml(BELT_FORMULAS),
    `<div class="concl">${esc(conclusionText(r.powerMax))}</div>`,
    signHtml(meta.performer),
  ].join(''));
}
