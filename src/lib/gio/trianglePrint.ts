import { GasZoneResult, VgschInput, VgschResult } from './explosion-triangle-calc';
import { chartCanvas, TriangleDocMeta } from './triangleDocx';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const rows = (items: [string, string, boolean?][]) =>
  `<table>${items.map(([l, v, b]) => `<tr><td>${esc(l)}</td><td${b ? ' class="b"' : ''}>${esc(v)}</td></tr>`).join('')}</table>`;

const metaItems = (meta: TriangleDocMeta): [string, string][] => {
  const now = new Date();
  const items: [string, string][] = [];
  if (meta.object) items.push(['Объект', meta.object]);
  if (meta.squad) items.push(['Отделение №', meta.squad]);
  if (meta.commander) items.push(['Командир отделения', meta.commander]);
  items.push(['Дата и время расчёта', `${now.toLocaleDateString('ru-RU')} ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`]);
  return items;
};

const CSS = `
@page{size:A4;margin:20mm 15mm 20mm 30mm}
*{box-sizing:border-box}
body{font-family:'Times New Roman',Times,serif;font-size:13pt;color:#000;margin:0;padding:24px}
h1{font-size:14pt;text-align:center;margin:0 0 4px}
.sub{font-size:11pt;text-align:center;margin:0 0 18px}
h2{font-size:13pt;margin:16px 0 6px}
table{width:100%;border-collapse:collapse}
td{border:1px solid #000;padding:4px 8px;vertical-align:top}
td:first-child{width:60%}
.b{font-weight:bold}
.fig{text-align:center;margin:14px 0 4px}
.fig img{width:150mm;max-width:100%}
.cap{text-align:center;font-size:11pt;margin-bottom:10px}
.verdict{text-align:center;font-weight:bold;font-size:15pt;margin:6px 0}
.concl{text-align:justify}
.sign{margin-top:28px}
@media print{body{padding:0}.fig,.verdict,.concl{break-inside:avoid}}
`;

function openPrint(title: string, body: string) {
  const w = window.open('', '_blank', 'width=820,height=900');
  if (!w) return false;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${CSS}</style></head><body>${body}<script>window.onload=()=>{setTimeout(()=>window.print(),200)}</script></body></html>`);
  w.document.close();
  return true;
}

const header = (subtitle: string) =>
  `<h1>РАСЧЁТ ВЗРЫВАЕМОСТИ РУДНИЧНОЙ АТМОСФЕРЫ</h1><div class="sub">${esc(subtitle)}</div>`;

const conclusion = (explosive: boolean, label: string, text: string) =>
  `<h2>Заключение</h2><div class="verdict" style="color:${explosive ? '#c00000' : '#00803c'}">${esc(label)}</div><div class="concl">${esc(text)}</div>`;

const signature = (performer?: string) =>
  `<div class="sign">Расчёт выполнил: ${esc(performer || '____________________')}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Подпись: ______________</div>`;

export function printVgsch(input: VgschInput, r: VgschResult, meta: TriangleDocMeta = {}) {
  const img = chartCanvas(r.tri, [r.C, r.o2], r.isExplosive).toDataURL('image/png');
  const body = [
    header('Метод треугольников взрываемости (Боевой устав ВГСЧ, Приложение 11)'),
    '<h2>Исходные данные</h2>',
    rows([
      ...metaItems(meta),
      ['Метан CH₄', `${input.ch4} %`],
      ['Оксид углерода CO', `${input.co} %`],
      ['Водород H₂', `${input.h2} %`],
      ['Кислород O₂', `${input.o2} %`],
    ]),
    '<h2>Расчёт</h2>',
    rows([
      ['Сумма горючих C = CH₄ + CO + H₂', `${r.C} %`, true],
      ['Доля метана P_CH = CH₄ / C', String(r.pch)],
      ['Доля оксида углерода P_CO = CO / C', String(r.pco)],
      ['Доля водорода P_H = H₂ / C', String(r.ph)],
      ['Применённый треугольник', `P_CO = ${r.pcoKey}, P_CH = ${r.pchKey}`],
      ['Вершины треугольника (C; O₂)', r.tri.map(([c, o]) => `(${c}; ${o})`).join(', ')],
    ]),
    `<div class="fig"><img src="${img}" alt="График"></div>`,
    '<div class="cap">Рис. 1. Треугольник взрываемости и точка анализируемой смеси</div>',
    conclusion(r.isExplosive, r.isExplosive ? 'СМЕСЬ ВЗРЫВООПАСНА' : 'СМЕСЬ НЕВЗРЫВООПАСНА', r.conclusion),
    signature(meta.performer),
  ].join('');
  return openPrint('Расчёт взрываемости', body);
}

export function printGasZone(r: GasZoneResult, meta: TriangleDocMeta = {}) {
  const body = [
    header('Оценка смеси по пределам взрываемости горючего газа'),
    '<h2>Исходные данные</h2>',
    rows([
      ...metaItems(meta),
      ['Горючий газ', `${r.gas.name} (${r.gas.formula})`],
      [`Концентрация ${r.gas.formula}`, `${r.gasPct} %`],
      ['Кислород O₂', `${r.o2Pct} %`],
    ]),
    '<h2>Пределы взрываемости</h2>',
    rows([
      ['Нижний предел взрываемости (НПВ)', `${r.gas.lel} %`],
      ['Верхний предел взрываемости (ВПВ)', `${r.gas.uel} %`],
      ['Минимальное содержание O₂ для горения', `${r.gas.lol} %`],
    ]),
    conclusion(r.isExplosive, r.label, r.conclusion),
    signature(meta.performer),
  ].join('');
  return openPrint('Расчёт взрываемости', body);
}
