import {
  AlignmentType, BorderStyle, Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType,
} from 'docx';
import { DA_RESERVE, DA_ROUTES, DaInput, DaResult, fmt1, fmtMin, toMPa } from './da-calc';
import { AtmoLimits, AtmoResult, fmtPct } from './atmo-calc';

export interface UstavDocMeta {
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

type Align = (typeof AlignmentType)[keyof typeof AlignmentType];
const run = (text: string, bold = false, size = SIZE, color?: string) => new TextRun({ text, bold, size, font: FONT, color });
const para = (children: TextRun[], align: Align = AlignmentType.LEFT, after = 80) => new Paragraph({ children, alignment: align, spacing: { after } });
const bd = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
const borders = { top: bd, bottom: bd, left: bd, right: bd };
const cell = (text: string, width: number, bold = false, size = SIZE, align: Align = AlignmentType.LEFT, color?: string) => new TableCell({
  width: { size: width, type: WidthType.PERCENTAGE },
  borders,
  margins: { top: 40, bottom: 40, left: 80, right: 80 },
  children: [para([run(text, bold, size, color)], align, 0)],
});
const kv = (items: [string, string, boolean?][]) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: items.map(([l, v, b]) => new TableRow({ children: [cell(l, 60), cell(v, 40, !!b)] })),
});

const metaRows = (meta: UstavDocMeta, placeLabel: string): [string, string][] => {
  const r: [string, string][] = [];
  if (meta.object) r.push(['Объект', meta.object]);
  if (meta.place) r.push([placeLabel, meta.place]);
  r.push(['Дата и время расчёта', nowStr()]);
  return r;
};

async function save(name: string, children: (Paragraph | Table)[], landscape = false) {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1134, bottom: 1134, left: landscape ? 1134 : 1701, right: 850 },
          ...(landscape ? { size: { orientation: 'landscape' as const, width: 16838, height: 11906 } } : {}),
        },
      },
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

const sign = (p?: string, who = 'Расчёт выполнил') =>
  para([run(`${who}: ${p || '____________________'}          Подпись: ______________`)], AlignmentType.LEFT, 0);

/* ───────────── ДАВЛЕНИЕ ДА ───────────── */

const daRows = (input: DaInput, r: DaResult): { src: [string, string, boolean?][]; calc: [string, string, boolean?][]; ctrl: [string, string, boolean?][] } => {
  const src: [string, string, boolean?][] = [
    ['Показания манометров, кгс/см²', input.members.map(m => `${m.label} — ${m.pressure}`).join('; ')],
    ['Маршрут', DA_ROUTES[input.route].label],
    ['Передвижение на транспорте', input.transport ? 'да — обратный путь из расчёта пешком' : 'нет'],
  ];
  if (input.entryTime) src.push(['Время включения в ДА', input.entryTime]);
  const calc: [string, string, boolean?][] = [
    ['Минимальное давление Pmin', `${r.pmin} кгс/см² (${r.pminMember})`],
    ['Резерв (не расходуется)', `${DA_RESERVE} кгс/см² (5 МПа)`],
    ['Рабочий запас Pраб = Pmin − 50', `${fmt1(r.working)} кгс/см²`],
    ['Доля на движение вперёд', input.route === 'third' ? '1/3' : '1/2'],
    ['Расход на движение вперёд', `${fmt1(r.forwardUse)} кгс/см²`],
    ['Расход на возвращение', `${fmt1(r.backUse)} кгс/см²`],
    ['ДАВЛЕНИЕ ПРЕКРАЩЕНИЯ ДВИЖЕНИЯ ВПЕРЁД', `${fmt1(r.turnPressure)} кгс/см² (${fmt1(toMPa(r.turnPressure))} МПа)`, true],
  ];
  if (!r.control && input.entryTime) {
    calc.push(['Ориентировочное время поворота (средний расход)', r.estTurnClock ?? '—'], ['Ориентировочное время выхода', r.estExitClock ?? '—']);
  }
  const ctrl: [string, string, boolean?][] = [];
  if (r.control) {
    const c = r.control;
    ctrl.push(
      ['Контроль по манометру', c.member],
      ['Прошло с момента включения', `${c.minutes} мин${c.nowClock ? ` (${c.nowClock})` : ''}`],
      ['Давление: начальное / текущее', `${c.start} / ${c.current} кгс/см²`],
      [c.rateReliable ? 'Фактический расход' : 'Расход (средний, данных мало)', `${c.rate.toFixed(2).replace('.', ',')} кгс/см²/мин`],
      ['Время до поворота', c.mustReturn ? 'ПОВОРОТ НАЗАД' : `${fmtMin(c.toTurnMin)}${c.turnClock ? ` (в ${c.turnClock})` : ''}`, true],
      ['Время на возвращение до резерва', fmtMin(c.returnMin)],
      ['Выход на ПБ не позднее', c.exitClock ?? '—', true],
    );
  }
  return { src, calc, ctrl };
};

const DA_RULE = 'Устав ВГСЧ, п. 22: в баллоне ДА резервируется запас, соответствующий давлению 5 МПа (50 кгс/см²). Рабочий запас расходуется: при передвижении вверх, по горизонтальным выработкам или вниз с углом наклона до 10° — половина на движение вперёд и половина на возвращение; вниз с углом более 10° — одна треть вперёд и две трети на возвращение. При использовании транспорта запас на обратный путь определяется из расчёта возвращения пешком. П. 23: давление определяется по минимальному показанию манометров ДА в отделении.';

export async function exportDaDocx(input: DaInput, r: DaResult, meta: UstavDocMeta = {}) {
  const { src, calc, ctrl } = daRows(input, r);
  const children: (Paragraph | Table)[] = [
    para([run('РАСЧЁТ ДАВЛЕНИЯ ПОВОРОТА ДЫХАТЕЛЬНОГО АППАРАТА', true, 28)], AlignmentType.CENTER, 60),
    para([run('Устав ВГСЧ (приказ МЧС России № 251), п. 22–23', false, 22)], AlignmentType.CENTER, 200),
    kv(metaRows(meta, 'Задание / выработка')),
    para([run('Исходные данные', true)], AlignmentType.LEFT, 80),
    kv(src),
    para([run('Расчёт', true)], AlignmentType.LEFT, 80),
    kv(calc),
    ...(ctrl.length ? [para([run('Контроль в пути', true)], AlignmentType.LEFT, 80), kv(ctrl)] : []),
    para([run('')], AlignmentType.LEFT, 60),
    para([run(r.verdict, true, 26, r.danger ? 'C00000' : undefined)], AlignmentType.CENTER, 160),
    para([run(DA_RULE, false, 20)], AlignmentType.JUSTIFIED, 360),
    sign(meta.performer),
  ];
  await save('Давление поворота ДА', children);
}

/* ───────────── АТМОСФЕРА ───────────── */

const ATMO_HEAD = ['Дата, время', 'CO₂, %', 'O₂, %', 'CO, %', 'H₂, %', 'CH₄, %', 'Другие газы, %', 'Температура воздуха, °C'];
const atmoCells = (r: AtmoResult) => r.rows.map((x, i) => {
  const e = r.evals[i];
  return [
    { v: x.time },
    { v: fmtPct(x.co2), d: !!e.levels.co2 },
    { v: fmtPct(x.o2), d: !!e.levels.o2 },
    { v: fmtPct(x.co), d: !!e.levels.co },
    { v: fmtPct(x.h2), d: !!e.levels.h2 },
    { v: fmtPct(x.ch4), d: !!e.levels.ch4 },
    { v: x.other || '—' },
    { v: `${fmtPct(x.temp)}${e.rise5 !== null && e.rise5 >= 3 ? ` (+${fmtPct(Math.round(e.rise5 * 10) / 10)}/5 мин)` : ''}`, d: !!e.levels.temp },
  ];
});

const limitsText = (L: AtmoLimits) =>
  `Пороги: O₂ не менее ${fmtPct(L.o2Min)}%; ПДК CO ${fmtPct(L.coMax)}%; CO₂ не более ${fmtPct(L.co2Max)}%; CH₄ ${fmtPct(L.ch4Warn)}% / ${fmtPct(L.ch4Stop)}%; H₂ не более ${fmtPct(L.h2Max)}%; ЗВТ выше ${L.tempZvt} °C; рост температуры ${L.tempRise} °C и более за 5 мин — прекращение задания (п. 41).`;

export async function exportAtmoDocx(r: AtmoResult, limits: AtmoLimits, meta: UstavDocMeta = {}) {
  const W = [12, 10, 10, 11, 10, 10, 17, 20];
  const children: (Paragraph | Table)[] = [
    para([run('Приложение № 4 к Уставу ВГСЧ', false, 20)], AlignmentType.RIGHT, 120),
    para([run('ТАБЛИЦА ИЗМЕНЕНИЯ СОСТАВА РУДНИЧНОЙ АТМОСФЕРЫ', true, 28)], AlignmentType.CENTER, 120),
    para([run(`Место отбора проб воздуха: ${meta.place || '________________________________'}`)], AlignmentType.LEFT, 60),
    ...(meta.object ? [para([run(`Объект: ${meta.object}`)], AlignmentType.LEFT, 60)] : []),
    para([run(`Дата: ${new Date().toLocaleDateString('ru-RU')}`)], AlignmentType.LEFT, 160),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ tableHeader: true, children: ATMO_HEAD.map((h, i) => cell(h, W[i], true, 20, AlignmentType.CENTER)) }),
        new TableRow({ children: ATMO_HEAD.map((_, i) => cell(String(i + 1), W[i], false, 18, AlignmentType.CENTER)) }),
        ...atmoCells(r).map(row => new TableRow({
          children: row.map((c, i) => cell(c.v, W[i], !!c.d, 20, AlignmentType.CENTER, c.d ? 'C00000' : undefined)),
        })),
      ],
    }),
    para([run('')], AlignmentType.LEFT, 80),
    para([run(`Вывод по последнему замеру (${r.last.time}): ${r.verdict}`, true, SIZE, r.danger ? 'C00000' : undefined)], AlignmentType.LEFT, 80),
    ...r.alarms.map(a => para([run(`• ${a.text}`, a.level === 'danger', 22)], AlignmentType.LEFT, 30)),
    para([run('')], AlignmentType.LEFT, 60),
    para([run(limitsText(limits), false, 18)], AlignmentType.JUSTIFIED, 300),
    sign(meta.performer, 'Замеры выполнил'),
  ];
  await save('Таблица состава рудничной атмосферы', children, true);
}

/* ───────────── ПЕЧАТЬ ───────────── */

const CSS = (landscape: boolean) => `
@page{size:A4 ${landscape ? 'landscape' : 'portrait'};margin:15mm 12mm 15mm ${landscape ? '15mm' : '25mm'}}
*{box-sizing:border-box}
body{font-family:'Times New Roman',Times,serif;font-size:12.5pt;color:#000;margin:0;padding:24px}
.app{text-align:right;font-size:10.5pt}
h1{font-size:14pt;text-align:center;margin:6px 0 4px}
.sub{font-size:11pt;text-align:center;margin:0 0 14px}
h2{font-size:12.5pt;margin:14px 0 6px}
table{width:100%;border-collapse:collapse;margin-bottom:4px}
td,th{border:1px solid #000;padding:4px 6px;vertical-align:top}
th{background:#eee;font-size:10.5pt}
.kv td:first-child{width:60%}
.g td{text-align:center}
.b{font-weight:bold}.r{color:#c00000;font-weight:bold}
.verdict{text-align:center;font-weight:bold;font-size:14pt;margin:14px 0 8px}
.rule{font-size:10pt;text-align:justify;margin-top:10px}
.al{font-size:11pt;margin:2px 0}
.sign{margin-top:26px}
@media print{body{padding:0}}
`;

function openPrint(title: string, body: string, landscape = false) {
  const w = window.open('', '_blank', 'width=900,height=900');
  if (!w) return false;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${CSS(landscape)}</style></head><body>${body}<script>window.onload=()=>{setTimeout(()=>window.print(),200)}</script></body></html>`);
  w.document.close();
  return true;
}

const kvHtml = (items: [string, string, boolean?][]) =>
  `<table class="kv">${items.map(([l, v, b]) => `<tr><td>${esc(l)}</td><td${b ? ' class="b"' : ''}>${esc(v)}</td></tr>`).join('')}</table>`;
const signHtml = (p?: string, who = 'Расчёт выполнил') =>
  `<div class="sign">${who}: ${esc(p || '____________________')}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Подпись: ______________</div>`;

export function printDa(input: DaInput, r: DaResult, meta: UstavDocMeta = {}) {
  const { src, calc, ctrl } = daRows(input, r);
  return openPrint('Давление поворота ДА', [
    '<h1>РАСЧЁТ ДАВЛЕНИЯ ПОВОРОТА ДЫХАТЕЛЬНОГО АППАРАТА</h1>',
    '<div class="sub">Устав ВГСЧ (приказ МЧС России № 251), п. 22–23</div>',
    kvHtml(metaRows(meta, 'Задание / выработка')),
    '<h2>Исходные данные</h2>', kvHtml(src),
    '<h2>Расчёт</h2>', kvHtml(calc),
    ctrl.length ? `<h2>Контроль в пути</h2>${kvHtml(ctrl)}` : '',
    `<div class="verdict" style="color:${r.danger ? '#c00000' : '#000'}">${esc(r.verdict)}</div>`,
    `<div class="rule">${esc(DA_RULE)}</div>`,
    signHtml(meta.performer),
  ].join(''));
}

export function printAtmo(r: AtmoResult, limits: AtmoLimits, meta: UstavDocMeta = {}) {
  const rows = atmoCells(r).map(row => `<tr>${row.map(c => `<td${c.d ? ' class="r"' : ''}>${esc(c.v)}</td>`).join('')}</tr>`).join('');
  return openPrint('Таблица состава рудничной атмосферы', [
    '<div class="app">Приложение № 4 к Уставу ВГСЧ</div>',
    '<h1>ТАБЛИЦА ИЗМЕНЕНИЯ СОСТАВА РУДНИЧНОЙ АТМОСФЕРЫ</h1>',
    `<div>Место отбора проб воздуха: <b>${esc(meta.place || '________________________________')}</b></div>`,
    meta.object ? `<div>Объект: ${esc(meta.object)}</div>` : '',
    `<div style="margin-bottom:10px">Дата: ${new Date().toLocaleDateString('ru-RU')}</div>`,
    `<table class="g"><tr>${ATMO_HEAD.map(h => `<th>${esc(h)}</th>`).join('')}</tr><tr>${ATMO_HEAD.map((_, i) => `<td style="font-size:9pt">${i + 1}</td>`).join('')}</tr>${rows}</table>`,
    `<h2${r.danger ? ' style="color:#c00000"' : ''}>Вывод по последнему замеру (${esc(r.last.time)}): ${esc(r.verdict)}</h2>`,
    r.alarms.map(a => `<div class="al${a.level === 'danger' ? ' r' : ''}">• ${esc(a.text)}</div>`).join(''),
    `<div class="rule">${esc(limitsText(limits))}</div>`,
    signHtml(meta.performer, 'Замеры выполнил'),
  ].join(''), true);
}
