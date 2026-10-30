import React, { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import {
  BELT_DEFAULTS, BeltFireResult, BeltInputs, calcBeltFire, calcMachineFire, fmt, MACHINE_PRESETS, machineMaterials,
  Material, PRESET_MATERIALS, beltFireReport, machineFireReport,
} from '@/lib/gio/fire-load-calc';
import {
  BELT_FORMULAS, BELT_KEY_TIMES, exportBeltDocx, exportMachineDocx, MACHINE_FORMULAS, printBelt, printMachine,
} from '@/lib/gio/fireLoadDocs';
import SendButton from '@/components/ops/SendButton';
import VoiceCodeCard from '@/components/ops/VoiceCodeCard';
import { encodeBelt, encodeMachine } from '@/lib/gio/voiceCode';
import type { OpPayload } from '@/lib/ops/types';

const LS_KEY = 'sau-fire-load-form';

type Method = 'machine' | 'belt';
type Row = { name: string; density: string; mass: string; burnRate: string; heatValue: string };
type BeltForm = Record<keyof BeltInputs, string>;

interface FormState {
  method: Method;
  machine: string;
  materials: Row[];
  machineFlow: string;
  belt: BeltForm;
  object: string;
  place: string;
  performer: string;
}

const toRows = (m: Material[]): Row[] => m.map(x => ({
  name: x.name, density: String(x.density), mass: String(x.mass), burnRate: String(x.burnRate), heatValue: String(x.heatValue),
}));

const BELT_FORM_DEFAULTS: BeltForm = Object.fromEntries(Object.entries(BELT_DEFAULTS).map(([k, v]) => [k, String(v)])) as BeltForm;

const DEFAULTS: FormState = {
  method: 'machine',
  machine: MACHINE_PRESETS[0].name,
  materials: toRows(machineMaterials(MACHINE_PRESETS[0])),
  machineFlow: '',
  belt: BELT_FORM_DEFAULTS,
  object: '',
  place: '',
  performer: '',
};

const loadForm = (): FormState => {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY) || '');
    return { ...DEFAULTS, ...s, belt: { ...BELT_FORM_DEFAULTS, ...(s.belt || {}) } };
  } catch {
    return DEFAULTS;
  }
};

const num = (s: string) => {
  const v = parseFloat(String(s).replace(',', '.'));
  return isNaN(v) ? NaN : v;
};

const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
    {children}
    {hint && <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{hint}</span>}
  </label>
);

const inputCls = 'w-full rounded px-3 py-2 text-sm outline-none border border-border focus:border-primary transition-colors font-mono-tech';
const cellCls = 'w-full rounded px-2 py-1.5 text-sm outline-none border border-border focus:border-primary transition-colors font-mono-tech';
const textCls = inputCls.replace(' font-mono-tech', '');
const inputStyle = { background: 'hsl(var(--input))', color: 'hsl(var(--foreground))' };

const Stat: React.FC<{ label: string; value: string; unit?: string; accent?: boolean }> = ({ label, value, unit, accent }) => (
  <div className="rounded-lg p-3 border" style={{ background: 'hsl(var(--card))', borderColor: accent ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}>
    <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</div>
    <div className="text-xl sm:text-2xl font-bold font-mono-tech" style={{ color: 'hsl(var(--primary))' }}>
      {value}{unit && <span className="text-sm font-normal ml-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{unit}</span>}
    </div>
  </div>
);

const Formulas: React.FC<{ items: [string, string][] }> = ({ items }) => (
  <details className="rounded-lg border border-border p-3 text-xs" style={{ background: 'hsl(var(--card))' }}>
    <summary className="cursor-pointer font-semibold text-sm flex items-center gap-2">
      <Icon name="Sigma" size={14} /> Формулы расчёта
    </summary>
    <div className="mt-2 grid gap-1">
      {items.map(([l, f]) => (
        <div key={l} className="flex flex-wrap gap-x-2">
          <span style={{ color: 'hsl(var(--muted-foreground))' }}>{l}:</span>
          <span className="font-mono-tech" style={{ color: 'hsl(var(--foreground))' }}>{f}</span>
        </div>
      ))}
    </div>
  </details>
);

const Conclusion: React.FC<{ q: number; dt: number | null }> = ({ q, dt }) => (
  <div className="rounded-lg p-4 border-2 flex gap-3 items-start" style={{ borderColor: 'hsl(var(--danger))', background: 'hsl(var(--card))' }}>
    <Icon name="Flame" size={28} style={{ color: 'hsl(var(--danger))', flexShrink: 0 }} />
    <div>
      <div className="text-lg font-bold" style={{ color: 'hsl(var(--danger))' }}>Мощность пожара {fmt(q)} МВт</div>
      <div className="text-sm mt-1" style={{ lineHeight: 1.5 }}>
        Для расчёта устойчивости вентиляционного режима при возникновении пожара принимаем максимальную величину мощности пожара <b>{fmt(q)} МВт</b>.
        {dt !== null && <> Нагрев воздушной струи <b>Δt = {fmt(dt, 1)} °C</b>.</>}
      </div>
    </div>
  </div>
);

const BeltChart: React.FC<{ r: BeltFireResult }> = ({ r }) => {
  const W = 560, H = 280, PL = 44, PR = 14, PT = 16, PB = 40;
  const ymax = Math.max(1, Math.ceil(Math.max(...r.rows.map(x => x.powerMW)) * 1.15));
  const step = ymax <= 5 ? 1 : ymax <= 12 ? 2 : Math.ceil(ymax / 6);
  const sx = (t: number) => PL + (t / 60) * (W - PL - PR);
  const sy = (q: number) => PT + (1 - q / ymax) * (H - PT - PB);
  const path = `M${sx(0)},${sy(0)} ` + r.rows.map(x => `L${sx(x.t)},${sy(x.powerMW)}`).join(' ');
  const yTicks: number[] = [];
  for (let q = 0; q <= ymax; q += step) yTicks.push(q);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-lg border border-border" style={{ background: 'hsl(var(--card))' }}>
      {[0, 10, 20, 30, 40, 50, 60].map(t => (
        <g key={t}>
          <line x1={sx(t)} y1={PT} x2={sx(t)} y2={H - PB} stroke="hsl(var(--border))" />
          <text x={sx(t)} y={H - PB + 14} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">{t}</text>
        </g>
      ))}
      {yTicks.map(q => (
        <g key={q}>
          <line x1={PL} y1={sy(q)} x2={W - PR} y2={sy(q)} stroke="hsl(var(--border))" />
          <text x={PL - 6} y={sy(q) + 3} textAnchor="end" fontSize={10} fill="hsl(var(--muted-foreground))">{q}</text>
        </g>
      ))}
      <text x={(W + PL) / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="hsl(var(--foreground))">Время от начала пожара, мин</text>
      <text x={12} y={(H - PB + PT) / 2} textAnchor="middle" fontSize={11} fill="hsl(var(--foreground))" transform={`rotate(-90 12 ${(H - PB + PT) / 2})`}>Q, МВт</text>
      <path d={`${path} L${sx(60)},${sy(0)} Z`} fill="hsl(var(--danger) / 0.12)" />
      <path d={path} fill="none" stroke="hsl(var(--danger))" strokeWidth={2.5} />
      {([[30, r.power30], [60, r.power60]] as const).map(([t, q]) => (
        <g key={t}>
          <line x1={sx(t)} y1={sy(q)} x2={sx(t)} y2={H - PB} stroke="hsl(var(--primary))" strokeDasharray="3 3" />
          <circle cx={sx(t)} cy={sy(q)} r={5} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth={2} />
          <text x={sx(t) - (t === 60 ? 8 : 0)} y={sy(q) - 10} textAnchor={t === 60 ? 'end' : 'middle'} fontSize={11} fontWeight={700} fill="hsl(var(--foreground))">{fmt(q)} МВт</text>
        </g>
      ))}
    </svg>
  );
};

const ActionBar: React.FC<{ onCopy: () => void; onWord: () => void; onPrint: () => void; extra?: React.ReactNode; payload: OpPayload | null }> = ({ onCopy, onWord, onPrint, extra, payload }) => (
  <div className="flex flex-wrap gap-2 justify-end items-center">
    {extra}
    <SendButton payload={payload} />
    <button onClick={onCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border border-border hover:border-primary"
      style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
      <Icon name="Copy" size={13} /> Копировать
    </button>
    <button onClick={onWord} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border border-border hover:border-primary"
      style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
      <Icon name="FileText" size={13} /> Word
    </button>
    <button onClick={onPrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium"
      style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
      <Icon name="Printer" size={13} /> Печать
    </button>
  </div>
);

const FireLoadCalculator: React.FC = () => {
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [fullTable, setFullTable] = useState(false);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));
  const setBelt = (k: keyof BeltInputs, v: string) => setForm(f => ({ ...f, belt: { ...f.belt, [k]: v } }));
  const setRow = (i: number, k: keyof Row, v: string) =>
    setForm(f => ({ ...f, materials: f.materials.map((r, j) => (j === i ? { ...r, [k]: v } : r)) }));

  useEffect(() => {
    setForm(loadForm());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(LS_KEY, JSON.stringify(form));
  }, [form, loaded]);

  const pickMachine = (name: string) => {
    const p = MACHINE_PRESETS.find(m => m.name === name);
    setForm(f => ({ ...f, machine: name, materials: p ? toRows(machineMaterials(p)) : f.materials }));
  };

  const addMaterial = (name: string) => {
    const p = PRESET_MATERIALS.find(m => m.name === name);
    if (!p) return;
    setForm(f => ({ ...f, materials: [...f.materials, toRows([{ ...p, mass: 0 }])[0]] }));
  };

  const mats: Material[] = useMemo(() => form.materials.map(r => ({
    name: r.name.trim() || 'Материал', density: num(r.density) || 0, mass: num(r.mass) || 0, burnRate: num(r.burnRate) || 0, heatValue: num(r.heatValue) || 0,
  })).filter(m => m.mass > 0), [form.materials]);

  const machine = useMemo(() => {
    if (form.method !== 'machine' || !mats.length) return null;
    const r = calcMachineFire(mats, num(form.machineFlow) || 0);
    return r && r.powerMW > 0 ? r : null;
  }, [form.method, mats, form.machineFlow]);

  const beltInp: BeltInputs = useMemo(() => ({
    burnRate: num(form.belt.burnRate), density: num(form.belt.density), width: num(form.belt.width), length: num(form.belt.length),
    thickness: num(form.belt.thickness), flameSpeed: num(form.belt.flameSpeed), flowM3s: num(form.belt.flowM3s) || 0,
    airSpeed: form.belt.airSpeed?.trim() ? num(form.belt.airSpeed) : undefined,
  }), [form.belt]);

  const belt = useMemo(() => (form.method === 'belt' ? calcBeltFire(beltInp) : null), [form.method, beltInp]);

  const meta = { object: form.object, place: form.place, performer: form.performer };
  const machineName = form.machine || 'Техника';
  const machineFlow = num(form.machineFlow) || 0;

  const payload: OpPayload | null = machine
    ? { type: 'machine', name: machineName, materials: mats, flow: machineFlow, meta }
    : belt ? { type: 'belt', input: beltInp, meta } : null;
  const machineCode = machine ? encodeMachine(machineName, mats, machineFlow) : null;

  const copy = async () => {
    const text = machine ? machineFireReport(machineName, mats, machine, form.performer) : belt ? beltFireReport(beltInp, belt, form.performer) : '';
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success('Отчёт скопирован');
  };

  const word = async () => {
    try {
      if (machine) await exportMachineDocx(machineName, mats, machine, meta);
      else if (belt) await exportBeltDocx(beltInp, belt, meta, fullTable);
      else return;
      toast.success('Документ Word сохранён');
    } catch {
      toast.error('Не удалось сформировать документ Word');
    }
  };

  const print = () => {
    const ok = machine ? printMachine(machineName, mats, machine, meta) : belt ? printBelt(beltInp, belt, meta, fullTable) : true;
    if (!ok) toast.error('Разрешите всплывающие окна для печати');
  };

  const beltRows = belt ? (fullTable ? belt.rows : belt.rows.filter(x => BELT_KEY_TIMES.includes(x.t))) : [];
  const isPreset = MACHINE_PRESETS.some(m => m.name === form.machine);

  return (
    <div className="grid lg:grid-cols-[400px_1fr] gap-5">
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4 self-start" style={{ background: 'hsl(var(--card))' }}>
        <div className="text-sm font-semibold flex items-center gap-2">
          <Icon name="ClipboardList" size={16} /> Исходные данные
        </div>

        <Field label="Объект пожара">
          <div className="grid grid-cols-2 gap-2">
            {([['machine', 'Техника', 'Truck'], ['belt', 'Конвейерная лента', 'GalleryHorizontal']] as const).map(([m, label, icon]) => (
              <button key={m}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded text-xs font-medium border transition-colors"
                style={form.method === m
                  ? { background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', borderColor: 'hsl(var(--primary))' }
                  : { background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', borderColor: 'hsl(var(--border))' }}
                onClick={() => set('method', m)}>
                <Icon name={icon} size={14} /> {label}
              </button>
            ))}
          </div>
        </Field>

        {form.method === 'machine' ? (
          <>
            <Field label="Техника (справочник)">
              <select className={textCls} style={inputStyle} value={isPreset ? form.machine : ''} onChange={e => pickMachine(e.target.value)}>
                {!isPreset && <option value="">— своя техника —</option>}
                {MACHINE_PRESETS.map(m => (
                  <option key={m.name} value={m.name}>{m.name} — {m.type}{m.capacity !== '—' ? `, ${m.capacity}` : ''}</option>
                ))}
              </select>
            </Field>
            <Field label="Наименование в отчёте">
              <input className={textCls} style={inputStyle} value={form.machine} onChange={e => set('machine', e.target.value)} />
            </Field>

            <div className="flex flex-col gap-2">
              <div className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Горючие материалы</div>
              {form.materials.map((r, i) => (
                <div key={i} className="rounded border border-border p-2 flex flex-col gap-1.5" style={{ background: 'hsl(var(--background) / 0.4)' }}>
                  <div className="flex gap-1.5 items-center">
                    <input className={`${cellCls} font-sans font-semibold`} style={inputStyle} value={r.name} onChange={e => setRow(i, 'name', e.target.value)} />
                    <button onClick={() => set('materials', form.materials.filter((_, j) => j !== i))}
                      className="p-2 rounded hover:text-foreground flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} title="Удалить">
                      <Icon name="X" size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {([['mass', 'm, кг'], ['density', 'ρ, кг/м³'], ['burnRate', 'ψ'], ['heatValue', 'Qн, МДж']] as const).map(([k, l]) => (
                      <label key={k} className="flex flex-col gap-0.5">
                        <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{l}</span>
                        <input className={cellCls} style={inputStyle} inputMode="decimal" value={r[k]} onChange={e => setRow(i, k, e.target.value)} />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <select className={textCls} style={inputStyle} value="" onChange={e => addMaterial(e.target.value)}>
                <option value="">+ Добавить материал…</option>
                {PRESET_MATERIALS.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
              </select>
              <div className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>ψ — массовая скорость выгорания, кг/(м²·с); Qн — низшая теплота сгорания, МДж/кг</div>
            </div>

            <Field label="Расход воздуха в выработке L, м³/с" hint="Нужен для расчёта нагрева воздушной струи Δt">
              <input className={inputCls} style={inputStyle} inputMode="decimal" value={form.machineFlow} onChange={e => set('machineFlow', e.target.value)} placeholder="например 39,6" />
            </Field>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {([
              ['burnRate', 'Скорость выгорания ψ, кг/(м²·с)'],
              ['density', 'Плотность ленты ρ, кг/м³'],
              ['width', 'Ширина ленты, м'],
              ['length', 'Длина конвейера, м'],
              ['thickness', 'Толщина ленты, м'],
              ['flameSpeed', 'Скорость пламени, м/с'],
              ['flowM3s', 'Расход воздуха, м³/с'],
              ['airSpeed', 'Скорость воздуха, м/с'],
            ] as const).map(([k, l]) => (
              <Field key={k} label={l}>
                <input className={inputCls} style={inputStyle} inputMode="decimal" value={form.belt[k] ?? ''} onChange={e => setBelt(k, e.target.value)} />
              </Field>
            ))}
            <button className="col-span-2 flex items-center justify-center gap-1.5 py-2 rounded text-xs border border-border hover:border-primary"
              style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}
              onClick={() => set('belt', BELT_FORM_DEFAULTS)}>
              <Icon name="RotateCcw" size={13} /> Значения по умолчанию
            </button>
          </div>
        )}

        <Field label="Объект (для отчёта)">
          <input className={textCls} style={inputStyle} value={form.object} onChange={e => set('object', e.target.value)} placeholder="необязательно" />
        </Field>
        <Field label="Место (выработка)">
          <input className={textCls} style={inputStyle} value={form.place} onChange={e => set('place', e.target.value)} placeholder="необязательно" />
        </Field>
        <Field label="Расчёт выполнил">
          <input className={textCls} style={inputStyle} value={form.performer} onChange={e => set('performer', e.target.value)} placeholder="ФИО" />
        </Field>
      </div>

      <div className="flex flex-col gap-4 min-w-0">
        {form.method === 'machine' && !machine && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <Icon name="Truck" size={32} className="mx-auto mb-2 opacity-50" />
            Выберите технику или введите массы горючих материалов
          </div>
        )}
        {form.method === 'belt' && !belt && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <Icon name="GalleryHorizontal" size={32} className="mx-auto mb-2 opacity-50" />
            Заполните параметры ленты — все значения должны быть больше нуля
          </div>
        )}

        {machine && (
          <>
            <Conclusion q={machine.powerMW} dt={machine.deltaT} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Мощность пожара" value={fmt(machine.powerMW)} unit="МВт" accent />
              <Stat label="Время горения" value={fmt(machine.timeMin, 0)} unit="мин" />
              <Stat label="Нагрев струи Δt" value={machine.deltaT !== null ? fmt(machine.deltaT, 1) : '—'} unit="°C" />
              <Stat label="Запас энергии" value={fmt(machine.totalEnergy, 0)} unit="МДж" />
            </div>
            {machine.deltaT === null && (
              <div className="text-xs flex items-center gap-2" style={{ color: 'hsl(var(--warning))' }}>
                <Icon name="Info" size={14} /> Укажите расход воздуха, чтобы рассчитать нагрев воздушной струи
              </div>
            )}
            <div className="rounded-lg border border-border overflow-x-auto" style={{ background: 'hsl(var(--card))' }}>
              <table className="w-full text-xs font-mono-tech">
                <thead>
                  <tr style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {['Материал', 'S, м³', 'Ro, м²', 'N, МДж', 'T1, ч', 'W1, МВт'].map(h => <th key={h} className="text-left font-medium px-3 py-2 border-b border-border font-sans">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {machine.items.map(i => (
                    <tr key={i.name} className="border-b border-border last:border-0">
                      <td className="px-3 py-1.5 font-sans">{i.name}</td>
                      <td className="px-3 py-1.5">{fmt(i.S, 3)}</td>
                      <td className="px-3 py-1.5">{fmt(i.Ro, 3)}</td>
                      <td className="px-3 py-1.5">{fmt(i.N, 0)}</td>
                      <td className="px-3 py-1.5" style={i.T1 === machine.maxT1 ? { color: 'hsl(var(--primary))', fontWeight: 700 } : undefined}>{fmt(i.T1, 3)}</td>
                      <td className="px-3 py-1.5">{fmt(i.W1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Formulas items={MACHINE_FORMULAS} />
            {machineCode ? <VoiceCodeCard code={machineCode} /> : (
              <div className="text-xs flex items-start gap-2 rounded p-3 border border-dashed border-border" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <Icon name="MicOff" size={14} className="flex-shrink-0 mt-0.5" />
                Голосовой код доступен для техники из справочника или для набора «резина + дизель + масло» со стандартными свойствами. Для изменённого состава материалов используйте кнопку «Передать».
              </div>
            )}
            <ActionBar onCopy={copy} onWord={word} onPrint={print} payload={payload} />
          </>
        )}

        {belt && (
          <>
            <Conclusion q={belt.powerMax} dt={beltInp.flowM3s > 0 ? belt.deltaTmax : null} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Через 30 мин" value={fmt(belt.power30)} unit="МВт" />
              <Stat label="Через 60 мин" value={fmt(belt.power60)} unit="МВт" />
              <Stat label="Принимаемая" value={fmt(belt.powerMax)} unit="МВт" accent />
              <Stat label="Нагрев струи Δt" value={beltInp.flowM3s > 0 ? fmt(belt.deltaTmax, 1) : '—'} unit="°C" />
            </div>
            <div className="text-xs font-mono-tech" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Объём ленты {fmt(belt.volume, 3)} м³ · масса {fmt(belt.mass, 1)} кг · запас энергии {fmt(belt.heatTotal, 0)} МДж
            </div>
            <BeltChart r={belt} />
            <div className="rounded-lg border border-border overflow-x-auto" style={{ background: 'hsl(var(--card))' }}>
              <table className="w-full text-xs font-mono-tech whitespace-nowrap">
                <thead>
                  <tr style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {['t, мин', 'Путь пламени, м', 'S гор., м²', 'Выгорело, кг', 'Выгорело, м³', 'Длина выгор., м', 'Q, МВт'].map(h =>
                      <th key={h} className="text-right font-medium px-3 py-2 border-b border-border font-sans first:text-left">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {beltRows.map(x => {
                    const key = x.t === 30 || x.t === 60;
                    return (
                      <tr key={x.t} className="border-b border-border last:border-0" style={key ? { background: 'hsl(var(--primary) / 0.1)' } : undefined}>
                        <td className="px-3 py-1 font-bold">{x.t}</td>
                        <td className="px-3 py-1 text-right">{fmt(x.dist)}</td>
                        <td className="px-3 py-1 text-right">{fmt(x.area)}</td>
                        <td className="px-3 py-1 text-right">{fmt(x.massBurned)}</td>
                        <td className="px-3 py-1 text-right">{fmt(x.volBurned, 3)}</td>
                        <td className="px-3 py-1 text-right">{fmt(x.lengthBurned)}</td>
                        <td className="px-3 py-1 text-right font-bold" style={{ color: key ? 'hsl(var(--primary))' : undefined }}>{fmt(x.powerMW)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Formulas items={BELT_FORMULAS} />
            <VoiceCodeCard code={encodeBelt(beltInp)} />
            <ActionBar onCopy={copy} onWord={word} onPrint={print} payload={payload} extra={
              <button onClick={() => setFullTable(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border border-border hover:border-primary mr-auto"
                style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
                <Icon name={fullTable ? 'ListCollapse' : 'List'} size={13} />
                {fullTable ? 'Ключевые точки' : 'Вся таблица (48 строк)'}
              </button>
            } />
          </>
        )}
      </div>
    </div>
  );
};

export default FireLoadCalculator;