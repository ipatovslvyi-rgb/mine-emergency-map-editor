import React, { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import {
  buildReport, calcFireArea, calcFireIndex, calcFlood, calcFlow, calcFoam, calcHoseResistance, calcHoses, calcInertGas,
  calcPowder, calcPowderReserve, calcTrunks, calcVolume, FIREFIGHTING_CALCS, GRAHAM_SCALE, INERT_GAS_LABELS, InertGasType,
  MIN_O2_DEFICIT, parseNum, POWDER_MATERIALS, ReportRow, WATER_INTENSITY, YOUNG_SCALE,
} from '@/lib/gio/firefighting-calc';

const LS_KEY = 'sau-firefighting-form';

type Vals = Record<string, string>;

interface Preset { label: string; set: Vals }
interface FieldDef { id: string; label: string; unit?: string; hint?: string; optional?: boolean; presets?: Preset[]; fill?: { label: string; get: (v: Vals) => number | null } }
interface Out { results: ReportRow[]; main: { label: string; value: string; unit?: string }; verdict?: { text: string; danger: boolean; warn?: boolean; note?: string }; extra?: React.ReactNode }
interface CalcDef { key: string; icon: string; fields: FieldDef[]; compute: (v: Vals) => Out | null; select?: { id: string; label: string; options: { value: string; label: string; set?: Vals }[] } }

const n = (v: Vals, k: string) => parseNum(v[k] ?? '');
const f = (x: number, d = 2) => (Math.round(x * 10 ** d) / 10 ** d).toLocaleString('ru-RU', { maximumFractionDigits: d });

const powderM = (v: Vals) => {
  const r = calcPowder({ Sp: n(v, 'Sp'), Jn: n(v, 'JnP'), tau: n(v, 'tau'), K3: n(v, 'K3'), cartridge: n(v, 'cart') });
  return r ? Math.round(r.M * 10) / 10 : null;
};
const volumeV = (v: Vals) => {
  const r = calcVolume({ A: n(v, 'A'), B: n(v, 'B'), C: n(v, 'C') });
  return r ? Math.round(r.V * 10) / 10 : null;
};
const areaSp = (v: Vals) => {
  const r = calcFireArea({ A: n(v, 'aA'), B: n(v, 'aB') });
  return r ? Math.round(r.Sp * 100) / 100 : null;
};
const flowQ = (v: Vals) => {
  const r = calcFlow({ Sp: n(v, 'Sp'), Jn: n(v, 'Jn') });
  return r ? Math.round(r.ls * 100) / 100 : null;
};

const SP_FIELD: FieldDef = { id: 'Sp', label: 'Площадь пожара Sп', unit: 'м²', fill: { label: 'из расчёта площади', get: areaSp } };
const JN_WATER: FieldDef = {
  id: 'Jn', label: 'Нормативная интенсивность Jн', unit: 'л/(с·м²)',
  presets: [
    { label: `негорючая крепь ${f(WATER_INTENSITY.nonCombustibleSupport)}`, set: { Jn: String(WATER_INTENSITY.nonCombustibleSupport) } },
    { label: `горючая крепь ${f(WATER_INTENSITY.combustibleSupport)}`, set: { Jn: String(WATER_INTENSITY.combustibleSupport) } },
  ],
};

const CALCS: CalcDef[] = [
  {
    key: 'area', icon: 'Square',
    fields: [{ id: 'aA', label: 'Длина охваченного участка A', unit: 'м' }, { id: 'aB', label: 'Ширина охваченного участка B', unit: 'м' }],
    compute: v => {
      const r = calcFireArea({ A: n(v, 'aA'), B: n(v, 'aB') });
      if (!r) return null;
      return { main: { label: 'Площадь пожара', value: f(r.Sp), unit: 'м²' }, results: [{ label: 'Площадь пожара Sп', value: f(r.Sp), unit: 'м²' }] };
    },
  },
  {
    key: 'trunks', icon: 'Droplets',
    fields: [SP_FIELD, JN_WATER, { id: 'qStv', label: 'Расход одного ствола qств', unit: 'л/с', hint: 'Водяная завеса на копрах: не менее 7 л/с', presets: [{ label: '3,7 (РС-50)', set: { qStv: '3.7' } }, { label: '7,4 (РС-70)', set: { qStv: '7.4' } }] }],
    compute: v => {
      const r = calcTrunks({ Sp: n(v, 'Sp'), Jn: n(v, 'Jn'), qStv: n(v, 'qStv') });
      if (!r) return null;
      return {
        main: { label: 'Количество стволов', value: String(r.count), unit: 'шт.' },
        results: [{ label: 'Расчётное значение Nств', value: f(r.exact) }, { label: 'Принято стволов (округление вверх)', value: r.count, unit: 'шт.' }],
      };
    },
  },
  {
    key: 'flow', icon: 'Waves',
    fields: [SP_FIELD, JN_WATER],
    compute: v => {
      const r = calcFlow({ Sp: n(v, 'Sp'), Jn: n(v, 'Jn') });
      if (!r) return null;
      return {
        main: { label: 'Требуемый расход воды', value: f(r.ls), unit: 'л/с' },
        results: [{ label: 'Требуемый расход Qтр', value: f(r.ls), unit: 'л/с' }, { label: 'То же', value: f(r.m3h, 1), unit: 'м³/ч' }],
      };
    },
  },
  {
    key: 'hoses', icon: 'Cable',
    fields: [{ id: 'L', label: 'Расстояние от пожара до водоисточника L', unit: 'м' }, { id: 'lp', label: 'Средняя длина рукава lp', unit: 'м', presets: [{ label: '20 м', set: { lp: '20' } }] }],
    compute: v => {
      const r = calcHoses({ L: n(v, 'L'), lp: n(v, 'lp') });
      if (!r) return null;
      return {
        main: { label: 'Количество рукавов', value: String(r.count), unit: 'шт.' },
        results: [{ label: 'Расчётное значение n', value: f(r.exact) }, { label: 'Принято рукавов (округление вверх)', value: r.count, unit: 'шт.' }],
      };
    },
  },
  {
    key: 'resistance', icon: 'ArrowDownToLine',
    fields: [
      { id: 'hn', label: 'Количество рукавов в линии n', unit: 'шт.', fill: { label: 'из расчёта рукавов', get: v => calcHoses({ L: n(v, 'L'), lp: n(v, 'lp') })?.count ?? null } },
      { id: 'Sr', label: 'Сопротивление одного рукава Sp', hint: 'Справочное значение (рукав 20 м): Ø51 — 0,13; Ø66 — 0,034; Ø77 — 0,015', presets: [{ label: 'Ø51 0,13', set: { Sr: '0.13' } }, { label: 'Ø66 0,034', set: { Sr: '0.034' } }, { label: 'Ø77 0,015', set: { Sr: '0.015' } }] },
      { id: 'Q', label: 'Расход воды через линию Q', unit: 'л/с', fill: { label: 'из требуемого расхода', get: flowQ } },
    ],
    compute: v => {
      const r = calcHoseResistance({ n: n(v, 'hn'), Sp: n(v, 'Sr'), Q: n(v, 'Q') });
      if (!r) return null;
      return {
        main: { label: 'Потери напора', value: f(r.h, 1), unit: 'м вод. ст.' },
        results: [{ label: 'Потери напора h', value: f(r.h, 2), unit: 'м вод. ст.' }, { label: 'То же', value: f(r.h / 10, 2), unit: 'кгс/см² (≈ атм)' }],
      };
    },
  },
  {
    key: 'foam', icon: 'Cloud',
    fields: [SP_FIELD, { id: 'JnF', label: 'Нормативная интенсивность подачи раствора Jн', unit: 'л/(с·м²)', presets: [{ label: '0,08', set: { JnF: '0.08' } }, { label: '0,1', set: { JnF: '0.1' } }, { label: '0,15', set: { JnF: '0.15' } }] }],
    compute: v => {
      const r = calcFoam({ Sp: n(v, 'Sp'), Jn: n(v, 'JnF') });
      if (!r) return null;
      return {
        main: { label: 'Расход раствора пенообразователя', value: f(r.ls, 2), unit: 'л/с' },
        results: [{ label: 'Требуемый расход раствора Qтр', value: f(r.ls, 2), unit: 'л/с' }, { label: 'То же', value: f(r.m3h, 2), unit: 'м³/ч' }],
      };
    },
  },
  {
    key: 'powder', icon: 'Sparkles',
    select: {
      id: 'mat', label: 'Горючий материал (справочник)',
      options: [...POWDER_MATERIALS.map(m => ({ value: m.key, label: `${m.label} — Jн ${f(m.Jn)}, K3 ${f(m.K3, 1)}`, set: { JnP: String(m.Jn), K3: String(m.K3) } })), { value: 'custom', label: 'Свои значения' }],
    },
    fields: [
      SP_FIELD,
      { id: 'JnP', label: 'Интенсивность подачи порошка Jн', unit: 'кг/(м²·с)' },
      { id: 'tau', label: 'Расчётное время тушения τ', unit: 'с', presets: [{ label: '60 с', set: { tau: '60' } }] },
      { id: 'K3', label: 'Коэффициент запаса K3' },
      { id: 'cart', label: 'Ёмкость огнетушителя', unit: 'кг', presets: [{ label: '5', set: { cart: '5' } }, { label: '10', set: { cart: '10' } }, { label: '50', set: { cart: '50' } }] },
    ],
    compute: v => {
      const r = calcPowder({ Sp: n(v, 'Sp'), Jn: n(v, 'JnP'), tau: n(v, 'tau'), K3: n(v, 'K3'), cartridge: n(v, 'cart') });
      if (!r) return null;
      return {
        main: { label: 'Требуемое количество порошка', value: f(r.M, 1), unit: 'кг' },
        results: [{ label: 'Количество порошка M', value: f(r.M, 1), unit: 'кг' }, { label: `Огнетушителей по ${f(n(v, 'cart'))} кг`, value: r.N, unit: 'шт.' }],
      };
    },
  },
  {
    key: 'powder-reserve', icon: 'Boxes',
    fields: [
      { id: 'M1', label: 'Расход порошка на 1 очаг M1', unit: 'кг', fill: { label: 'из расчёта порошка', get: powderM } },
      { id: 'Noch', label: 'Одновременных очагов Nоч', unit: 'шт.' },
      { id: 'Kzap', label: 'Коэффициент резерва Kзап', hint: 'Рабочий + базовый + транспортный запас (обычно 3)' },
      { id: 'cart2', label: 'Ёмкость огнетушителя / баллона', unit: 'кг', presets: [{ label: '50', set: { cart2: '50' } }, { label: '10', set: { cart2: '10' } }, { label: '5', set: { cart2: '5' } }] },
    ],
    compute: v => {
      const r = calcPowderReserve({ M1: n(v, 'M1'), Noch: n(v, 'Noch'), Kzap: n(v, 'Kzap'), cartridge: n(v, 'cart2') });
      if (!r) return null;
      return {
        main: { label: 'Нормативный запас порошка', value: f(r.Mun, 1), unit: 'кг' },
        results: [{ label: 'Запас на участок Mун', value: f(r.Mun, 1), unit: 'кг' }, { label: `Огнетушителей / баллонов по ${f(n(v, 'cart2'))} кг`, value: r.N, unit: 'шт.' }],
      };
    },
  },
  {
    key: 'volume', icon: 'Box',
    fields: [{ id: 'A', label: 'Длина выработки A', unit: 'м' }, { id: 'B', label: 'Ширина выработки B', unit: 'м' }, { id: 'C', label: 'Высота выработки C', unit: 'м' }],
    compute: v => {
      const r = calcVolume({ A: n(v, 'A'), B: n(v, 'B'), C: n(v, 'C') });
      if (!r) return null;
      return { main: { label: 'Объём выработки', value: f(r.V, 1), unit: 'м³' }, results: [{ label: 'Объём V', value: f(r.V, 1), unit: 'м³' }] };
    },
  },
  {
    key: 'flood', icon: 'Waves',
    fields: [
      { id: 'V', label: 'Объём выработки V', unit: 'м³', fill: { label: 'из расчёта объёма', get: volumeV } },
      { id: 'q', label: 'Скорость заполнения (приход) q', unit: 'м³/ч' },
    ],
    compute: v => {
      const r = calcFlood({ V: n(v, 'V'), q: n(v, 'q') });
      if (!r) return null;
      const h = Math.floor(r.hours), m = Math.round((r.hours - h) * 60);
      return {
        main: { label: 'Время затопления', value: `${h} ч ${m} мин` },
        results: [{ label: 'Время затопления t', value: f(r.hours, 2), unit: 'ч' }, { label: 'То же', value: f(r.minutes, 0), unit: 'мин' }],
      };
    },
  },
  {
    key: 'fire-index', icon: 'Activity',
    fields: [
      { id: 'CO', label: 'Окись углерода CO', unit: '%' },
      { id: 'O2', label: 'Кислород O₂', unit: '%' },
      { id: 'CO2', label: 'Углекислый газ CO₂', unit: '%' },
      { id: 'N2', label: 'Азот N₂', unit: '%', optional: true, hint: 'Если измерен — дефицит O₂ считается точнее (учитывается разбавление метаном и инертными газами)' },
    ],
    compute: v => {
      const r = calcFireIndex({ CO: n(v, 'CO'), O2: n(v, 'O2'), CO2: n(v, 'CO2'), N2: n(v, 'N2') });
      if (!r) return null;
      const scale = (rows: typeof GRAHAM_SCALE | typeof YOUNG_SCALE, val: number) => (
        <table className="w-full text-xs border-collapse">
          <tbody>
            {rows.map(s => {
              const on = r.dO2 > 0 && (rows as { max: number }[]).find(x => val < x.max) === s;
              return (
                <tr key={s.range} style={on ? { background: 'hsl(var(--primary) / 0.15)', fontWeight: 700 } : undefined}>
                  <td className="border border-border px-2 py-1 font-mono-tech w-20">{s.range}</td>
                  <td className="border border-border px-2 py-1">{s.label}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
      return {
        main: { label: 'Состояние', value: r.fireStage },
        verdict: {
          text: r.fireStage, danger: r.level >= 2, warn: r.level === 1,
          note: !r.reliable
            ? (r.dO2 <= 0 ? 'Дефицита кислорода нет — индексы не определяются. Проверьте замер O₂ (и N₂).' : `Дефицит O₂ всего ${f(r.dO2, 2)} % (меньше ${f(MIN_O2_DEFICIT, 1)} %) — индексы недостоверны, оценивайте по динамике CO и повторным пробам.`)
            : 'Основной показатель — индекс Грэхема; индекс Янга — вспомогательный. Важна динамика: рост индексов между пробами — признак развития пожара.',
        },
        results: [
          { label: `Дефицит кислорода ΔO₂ (${r.byN2 ? '0,265·N₂ − O₂' : '20,93 − O₂'})`, value: f(r.dO2, 2), unit: '%' },
          { label: 'Индекс Грэхема Ig', value: f(r.Ig, 2), unit: '%' }, { label: 'Оценка по Грэхему', value: r.igStatus },
          { label: 'Индекс Янга Iy', value: f(r.Iy, 1), unit: '%' }, { label: 'Оценка по Янгу', value: r.iyStatus },
          { label: 'Достоверность', value: r.reliable ? 'достаточная' : 'низкая (ΔO₂ < 0,3 %)' },
          { label: 'Вывод', value: r.fireStage },
        ],
        extra: (
          <div className="grid sm:grid-cols-2 gap-3">
            <div><div className="text-xs font-semibold mb-1">Шкала Грэхема, % · Ig = {f(r.Ig, 2)}</div>{scale(GRAHAM_SCALE, r.Ig)}</div>
            <div><div className="text-xs font-semibold mb-1">Шкала Янга, % · Iy = {f(r.Iy, 1)}</div>{scale(YOUNG_SCALE, r.Iy)}</div>
          </div>
        ),
      };
    },
  },
  {
    key: 'inert-gas', icon: 'Wind',
    select: { id: 'gas', label: 'Инертный газ', options: (Object.keys(INERT_GAS_LABELS) as InertGasType[]).map(g => ({ value: g, label: INERT_GAS_LABELS[g] })) },
    fields: [
      { id: 'Vi', label: 'Объём изолируемого пространства V', unit: 'м³', fill: { label: 'из расчёта объёма', get: volumeV } },
      { id: 'O2n', label: 'Начальное содержание O₂', unit: '%' },
      { id: 'O2t', label: 'Целевое содержание O₂', unit: '%', hint: 'Обычно не более 2 %' },
      { id: 'qg', label: 'Производительность подачи газа q', unit: 'м³/ч' },
    ],
    compute: v => {
      const r = calcInertGas({ V: n(v, 'Vi'), O2: n(v, 'O2n'), O2t: n(v, 'O2t'), q: n(v, 'qg'), gas: (v.gas as InertGasType) || 'N2' });
      if (!r) return null;
      const h = Math.floor(r.t / 60), m = r.t % 60;
      return {
        main: { label: 'Время инертизации', value: h ? `${h} ч ${m} мин` : `${m} мин` },
        results: [
          { label: 'Газ', value: INERT_GAS_LABELS[r.gas] },
          { label: 'Требуемый объём газа Vin', value: f(r.Vin, 1), unit: 'м³' },
          { label: 'Время подачи t', value: r.t, unit: 'мин' },
          { label: 'Кратность (Vin / V)', value: f(r.kh, 2) },
        ],
      };
    },
  },
];

const DEFAULTS: Vals = {
  aA: '10', aB: '4', Sp: '40', Jn: '0.55', qStv: '3.7', L: '200', lp: '20', hn: '12', Sr: '0.13', Q: '7.4', JnF: '0.08',
  mat: 'wood', JnP: '0.3', tau: '60', K3: '2', cart: '5', M1: '', Noch: '1', Kzap: '3', cart2: '50',
  A: '100', B: '4', C: '3', V: '', q: '50', CO: '0.008', O2: '18.5', CO2: '1.2', N2: '', gas: 'N2', Vi: '', O2n: '20.9', O2t: '2', qg: '600',
};

const loadState = (): { calc: string; vals: Vals; meta: Vals } => {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY) || '');
    return { calc: s.calc || 'area', vals: { ...DEFAULTS, ...(s.vals || {}) }, meta: s.meta || {} };
  } catch {
    return { calc: 'area', vals: DEFAULTS, meta: {} };
  }
};

const inputCls = 'w-full rounded px-3 py-2 text-sm outline-none border border-border focus:border-primary transition-colors';
const inputStyle = { background: 'hsl(var(--input))', color: 'hsl(var(--foreground))' };
const btn2 = { background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' };

const esc = (s: string | number) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const rowsHtml = (rows: ReportRow[]) => `<table>${rows.map(r => `<tr><td>${esc(r.label)}</td><td><b>${esc(r.value)}</b>${r.unit ? ' ' + esc(r.unit) : ''}</td></tr>`).join('')}</table>`;

function printCalc(title: string, formula: string, params: { sym: string; desc: string }[], inputs: ReportRow[], results: ReportRow[], meta: Vals, verdict?: Out['verdict']) {
  const w = window.open('', '_blank', 'width=860,height=900');
  if (!w) return toast.error('Разрешите всплывающие окна для печати');
  const css = `@page{size:A4;margin:16mm 14mm}body{font-family:"Times New Roman",serif;font-size:12pt;color:#000;padding:16px}h1{font-size:14pt;text-align:center;margin:0 0 4px}.sub{text-align:center;margin:0 0 12px;font-size:11pt}h2{font-size:12.5pt;margin:14px 0 6px}table{width:100%;border-collapse:collapse}td{border:1px solid #000;padding:4px 6px;vertical-align:top}td:first-child{width:60%}.f{font-size:13pt;text-align:center;margin:6px 0;font-weight:bold}.p{font-size:10.5pt;margin:2px 0}.v{text-align:center;font-weight:bold;font-size:14pt;margin:14px 0}.sign{margin-top:26px}@media print{body{padding:0}}`;
  const metaRows: ReportRow[] = [
    meta.object && { label: 'Объект', value: meta.object },
    meta.place && { label: 'Выработка / место пожара', value: meta.place },
    { label: 'Дата и время расчёта', value: new Date().toLocaleString('ru-RU') },
  ].filter(Boolean) as ReportRow[];
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${css}</style></head><body>
<h1>${esc(title.toUpperCase())}</h1><div class="sub">Расчёт пожаротушения в горных выработках</div>
${rowsHtml(metaRows)}
<h2>Формула</h2><div class="f">${esc(formula)}</div>${params.map(p => `<div class="p"><b>${esc(p.sym)}</b> — ${esc(p.desc)}</div>`).join('')}
<h2>Исходные данные</h2>${rowsHtml(inputs)}
<h2>Результаты</h2>${rowsHtml(results)}
${verdict ? `<div class="v" style="color:${verdict.danger ? '#c00000' : '#000'}">${esc(verdict.text)}</div>${verdict.note ? `<div class="p">${esc(verdict.note)}</div>` : ''}` : ''}
<div class="sign">Расчёт выполнил: ${esc(meta.performer || '____________________')}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Подпись: ______________</div>
<script>window.onload=()=>{setTimeout(()=>window.print(),200)}</script></body></html>`);
  w.document.close();
}

const FirefightingCalculator: React.FC = () => {
  const [st, setSt] = useState(loadState);
  const { calc, vals, meta } = st;
  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(st)); }, [st]);

  const def = CALCS.find(c => c.key === calc) ?? CALCS[0];
  const info = FIREFIGHTING_CALCS.find(c => c.key === def.key)!;
  const setVals = (patch: Vals) => setSt(s => ({ ...s, vals: { ...s.vals, ...patch } }));
  const setMeta = (k: string, v: string) => setSt(s => ({ ...s, meta: { ...s.meta, [k]: v } }));
  const out = useMemo(() => def.compute(vals), [def, vals]);

  const inputs: ReportRow[] = [
    ...(def.select ? [{ label: def.select.label, value: def.select.options.find(o => o.value === vals[def.select!.id])?.label ?? '' }] : []),
    ...def.fields.filter(fd => vals[fd.id]).map(fd => ({ label: fd.label, value: vals[fd.id].replace('.', ','), unit: fd.unit })),
  ];

  const copy = () => {
    if (!out) return;
    navigator.clipboard.writeText(buildReport(info.title, info.formula, inputs, out.results)).then(() => toast.success('Отчёт скопирован'));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
        {CALCS.map(c => {
          const i = FIREFIGHTING_CALCS.find(x => x.key === c.key)!;
          const on = c.key === def.key;
          return (
            <button key={c.key} onClick={() => setSt(s => ({ ...s, calc: c.key }))} title={i.title}
              className="flex items-center gap-1.5 px-2.5 py-2.5 rounded text-xs font-semibold border text-left transition-colors"
              style={on ? { background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', borderColor: 'hsl(var(--primary))' } : { ...btn2, borderColor: 'hsl(var(--border))' }}>
              <Icon name={c.icon} size={14} style={{ flexShrink: 0 }} /> <span className="leading-tight">{i.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,380px)_1fr] gap-4 items-start">
        <div className="rounded-lg border border-border p-4 flex flex-col gap-3" style={{ background: 'hsl(var(--card))' }}>
          <div className="text-sm font-semibold flex items-center gap-2"><Icon name="ClipboardList" size={16} /> Исходные данные</div>
          {def.select && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{def.select.label}</span>
              <select value={vals[def.select.id]} className={inputCls} style={inputStyle}
                onChange={e => { const o = def.select!.options.find(x => x.value === e.target.value)!; setVals({ [def.select!.id]: o.value, ...(o.set || {}) }); }}>
                {def.select.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          )}
          {def.fields.map(fd => {
            const fillVal = fd.fill?.get(vals);
            return (
              <div key={fd.id} className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {fd.label}{fd.unit ? `, ${fd.unit}` : ''}{fd.optional ? ' (необязательно)' : ''}
                </span>
                <input value={vals[fd.id] ?? ''} inputMode="decimal" className={`${inputCls} font-mono-tech`} style={inputStyle}
                  onChange={e => setVals({ [fd.id]: e.target.value, ...(def.key === 'powder' && (fd.id === 'JnP' || fd.id === 'K3') ? { mat: 'custom' } : {}) })} />
                {(fd.presets || (fd.fill && fillVal)) && (
                  <div className="flex flex-wrap gap-1">
                    {fd.presets?.map(p => (
                      <button key={p.label} onClick={() => setVals(p.set)} className="px-2 py-1 rounded text-[11px] border border-border hover:border-primary" style={btn2}>{p.label}</button>
                    ))}
                    {fd.fill && fillVal ? (
                      <button onClick={() => setVals({ [fd.id]: String(fillVal) })} className="px-2 py-1 rounded text-[11px] border flex items-center gap-1"
                        style={{ borderColor: 'hsl(var(--primary) / 0.6)', color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.08)' }}>
                        <Icon name="Link" size={11} /> {fillVal.toLocaleString('ru-RU')} — {fd.fill.label}
                      </button>
                    ) : null}
                  </div>
                )}
                {fd.hint && <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{fd.hint}</span>}
              </div>
            );
          })}
          <div className="border-t border-border pt-3 grid grid-cols-1 gap-2">
            {[['object', 'Объект (для отчёта)'], ['place', 'Выработка / место пожара'], ['performer', 'Расчёт выполнил']].map(([k, l]) => (
              <input key={k} value={meta[k] || ''} onChange={e => setMeta(k, e.target.value)} placeholder={l} className={inputCls} style={inputStyle} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          <div className="rounded-lg border border-border p-4" style={{ background: 'hsl(var(--card))' }}>
            <div className="text-base font-semibold">{info.title}</div>
            <div className="text-lg font-bold font-mono-tech mt-2" style={{ color: 'hsl(var(--primary))' }}>{info.formula}</div>
            <div className="mt-2 grid gap-0.5 text-xs">
              {info.params.map(p => (
                <div key={p.sym}><b className="font-mono-tech">{p.sym}</b> <span style={{ color: 'hsl(var(--muted-foreground))' }}>— {p.desc}</span></div>
              ))}
            </div>
          </div>

          {!out ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-sm text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Заполните исходные данные положительными числами
            </div>
          ) : (
            <>
              {out.verdict ? (() => {
                const c = out.verdict.danger ? 'hsl(var(--danger))' : out.verdict.warn ? 'hsl(var(--warning))' : 'hsl(var(--safe))';
                return (
                  <div className="rounded-lg p-4 border-2 flex gap-3 items-center" style={{ borderColor: c, background: 'hsl(var(--card))' }}>
                    <Icon name={out.verdict.danger ? 'Flame' : out.verdict.warn ? 'TriangleAlert' : 'ShieldCheck'} size={32} style={{ color: c, flexShrink: 0 }} />
                    <div>
                      <div className="text-xl font-black" style={{ color: c }}>{out.verdict.text}</div>
                      {out.verdict.note && <div className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', lineHeight: 1.45 }}>{out.verdict.note}</div>}
                    </div>
                  </div>
                );
              })() : (
                <div className="rounded-lg p-4 border-2 flex gap-3 items-center" style={{ borderColor: 'hsl(var(--primary))', background: 'hsl(var(--card))' }}>
                  <Icon name={def.icon} size={30} style={{ color: 'hsl(var(--primary))', flexShrink: 0 }} />
                  <div>
                    <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{out.main.label}</div>
                    <div className="text-3xl font-black font-mono-tech" style={{ color: 'hsl(var(--primary))' }}>
                      {out.main.value}{out.main.unit && <span className="text-base font-normal ml-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{out.main.unit}</span>}
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border overflow-hidden" style={{ background: 'hsl(var(--card))' }}>
                <table className="w-full text-sm">
                  <tbody>
                    {out.results.map(r => (
                      <tr key={r.label} className="border-b border-border last:border-0">
                        <td className="px-3 py-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{r.label}</td>
                        <td className="px-3 py-2 text-right font-mono-tech font-semibold">{r.value}{r.unit ? <span className="font-normal" style={{ color: 'hsl(var(--muted-foreground))' }}> {r.unit}</span> : null}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {out.extra}

              <div className="flex flex-wrap gap-2 justify-end">
                <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border border-border hover:border-primary" style={btn2}>
                  <Icon name="Copy" size={13} /> Копировать
                </button>
                <button onClick={() => printCalc(info.title, info.formula, info.params, inputs, out.results, meta, out.verdict)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                  <Icon name="Printer" size={13} /> Печать
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FirefightingCalculator;