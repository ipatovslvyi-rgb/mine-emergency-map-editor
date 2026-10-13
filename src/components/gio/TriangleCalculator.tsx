import React, { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import {
  GASES, calcGasZone, calcVgschTriangle, gasZoneReport, vgschReport, Point,
} from '@/lib/gio/explosion-triangle-calc';
import { exportGasZoneDocx, exportVgschDocx } from '@/lib/gio/triangleDocx';
import { printGasZone, printVgsch } from '@/lib/gio/trianglePrint';
import SendButton from '@/components/ops/SendButton';
import VoiceCodeCard from '@/components/ops/VoiceCodeCard';
import { encodeGas, encodeVgsch } from '@/lib/gio/voiceCode';

const LS_KEY = 'sau-triangle-form';

type Method = 'vgsch' | 'single';

interface FormState {
  method: Method;
  ch4: string;
  co: string;
  h2: string;
  o2: string;
  gas: string;
  gasPct: string;
  object: string;
  squad: string;
  commander: string;
  performer: string;
}

const DEFAULTS: FormState = { method: 'vgsch', ch4: '', co: '', h2: '', o2: '20.9', gas: 'methane', gasPct: '', object: '', squad: '', commander: '', performer: '' };

const loadForm = (): FormState => {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(LS_KEY) || '') };
  } catch {
    return DEFAULTS;
  }
};

const num = (s: string) => {
  const v = parseFloat(s.replace(',', '.'));
  return isNaN(v) ? NaN : v;
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
    {children}
  </label>
);

const inputCls = 'w-full rounded px-3 py-2 text-sm outline-none border border-border focus:border-primary transition-colors font-mono-tech';
const inputStyle = { background: 'hsl(var(--input))', color: 'hsl(var(--foreground))' };

const W = 520, H = 340, PL = 44, PR = 16, PT = 16, PB = 40;
const XMAX = 35, YMAX = 22;
const sx = (c: number) => PL + (Math.min(c, XMAX) / XMAX) * (W - PL - PR);
const sy = (o: number) => PT + (1 - Math.min(Math.max(o, 0), YMAX) / YMAX) * (H - PT - PB);

export const TriangleChart: React.FC<{ tri: Point[]; point: Point; explosive: boolean }> = ({ tri, point, explosive }) => {
  const color = explosive ? 'hsl(var(--danger))' : 'hsl(var(--safe))';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-lg border border-border" style={{ background: 'hsl(var(--card))' }}>
      {[0, 5, 10, 15, 20, 25, 30, 35].map(x => (
        <g key={`x${x}`}>
          <line x1={sx(x)} y1={PT} x2={sx(x)} y2={H - PB} stroke="hsl(var(--border))" strokeWidth={1} />
          <text x={sx(x)} y={H - PB + 14} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">{x}</text>
        </g>
      ))}
      {[0, 4, 8, 12, 16, 20].map(y => (
        <g key={`y${y}`}>
          <line x1={PL} y1={sy(y)} x2={W - PR} y2={sy(y)} stroke="hsl(var(--border))" strokeWidth={1} />
          <text x={PL - 6} y={sy(y) + 3} textAnchor="end" fontSize={10} fill="hsl(var(--muted-foreground))">{y}</text>
        </g>
      ))}
      <text x={(W + PL) / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="hsl(var(--foreground))">C = CH₄ + CO + H₂, %</text>
      <text x={12} y={(H - PB + PT) / 2} textAnchor="middle" fontSize={11} fill="hsl(var(--foreground))" transform={`rotate(-90 12 ${(H - PB + PT) / 2})`}>O₂, %</text>
      <polygon
        points={tri.map(([c, o]) => `${sx(c)},${sy(o)}`).join(' ')}
        fill="hsl(var(--danger) / 0.18)" stroke="hsl(var(--danger))" strokeWidth={2}
      />
      {tri.map(([c, o], i) => (
        <circle key={i} cx={sx(c)} cy={sy(o)} r={3} fill="hsl(var(--danger))" />
      ))}
      <line x1={sx(point[0])} y1={sy(point[1])} x2={sx(point[0])} y2={H - PB} stroke={color} strokeDasharray="3 3" />
      <line x1={PL} y1={sy(point[1])} x2={sx(point[0])} y2={sy(point[1])} stroke={color} strokeDasharray="3 3" />
      <circle cx={sx(point[0])} cy={sy(point[1])} r={7} fill={color} stroke="hsl(var(--background))" strokeWidth={2} />
    </svg>
  );
};

const Verdict: React.FC<{ explosive: boolean; label: string; text: string; color?: string }> = ({ explosive, label, text, color }) => {
  const c = color || (explosive ? 'hsl(var(--danger))' : 'hsl(var(--safe))');
  return (
    <div className="rounded-lg p-4 border-2 flex gap-3 items-start" style={{ borderColor: c, background: 'hsl(var(--card))' }}>
      <Icon name={explosive ? 'Flame' : 'ShieldCheck'} size={28} style={{ color: c, flexShrink: 0 }} />
      <div>
        <div className="text-lg font-bold" style={{ color: c }}>{label}</div>
        <div className="text-sm mt-1" style={{ color: 'hsl(var(--foreground))', lineHeight: 1.5 }}>{text}</div>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-lg p-3 border border-border" style={{ background: 'hsl(var(--card))' }}>
    <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</div>
    <div className="text-xl font-bold font-mono-tech" style={{ color: 'hsl(var(--primary))' }}>{value}</div>
  </div>
);

const TriangleCalculator: React.FC = () => {
  const [form, setForm] = useState<FormState>(loadForm);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(form));
  }, [form]);

  const vInput = useMemo(() => ({
    ch4: num(form.ch4) || 0, co: num(form.co) || 0, h2: num(form.h2) || 0, o2: num(form.o2),
  }), [form.ch4, form.co, form.h2, form.o2]);

  const vgsch = useMemo(() => {
    if (form.method !== 'vgsch' || isNaN(vInput.o2)) return null;
    return calcVgschTriangle(vInput);
  }, [form.method, vInput]);

  const single = useMemo(() => {
    if (form.method !== 'single') return null;
    const g = num(form.gasPct), o = num(form.o2);
    if (isNaN(g) || isNaN(o)) return null;
    return calcGasZone(form.gas, g, o);
  }, [form.method, form.gas, form.gasPct, form.o2]);

  const report = vgsch ? vgschReport(vInput, vgsch) : single ? gasZoneReport(single) : '';

  const copyReport = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(report);
    toast.success('Отчёт скопирован');
  };

  const meta = { object: form.object, squad: form.squad, commander: form.commander, performer: form.performer };

  const wordReport = async () => {
    try {
      if (vgsch) await exportVgschDocx(vInput, vgsch, meta);
      else if (single) await exportGasZoneDocx(single, meta);
      else return;
      toast.success('Документ Word сохранён');
    } catch {
      toast.error('Не удалось сформировать документ Word');
    }
  };

  const printReport = () => {
    const opened = vgsch ? printVgsch(vInput, vgsch, meta) : single ? printGasZone(single, meta) : true;
    if (!opened) toast.error('Разрешите всплывающие окна для печати');
  };

  const gasInfo = GASES.find(g => g.key === form.gas);

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-5">
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4 self-start" style={{ background: 'hsl(var(--card))' }}>
        <div className="text-sm font-semibold flex items-center gap-2">
          <Icon name="ClipboardList" size={16} />
          Исходные данные
        </div>

        <Field label="Метод расчёта">
          <div className="grid grid-cols-2 gap-2">
            {([['vgsch', 'Смесь CH₄+CO+H₂', 'Triangle'], ['single', 'Один газ', 'Flame']] as const).map(([m, label, icon]) => (
              <button key={m}
                className="flex items-center justify-center gap-1.5 py-2 rounded text-xs font-medium border transition-colors"
                style={form.method === m
                  ? { background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', borderColor: 'hsl(var(--primary))' }
                  : { background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', borderColor: 'hsl(var(--border))' }}
                onClick={() => set('method', m)}>
                <Icon name={icon} size={14} />
                {label}
              </button>
            ))}
          </div>
        </Field>

        {form.method === 'vgsch' ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Метан CH₄, %">
              <input className={inputCls} style={inputStyle} inputMode="decimal" value={form.ch4} onChange={e => set('ch4', e.target.value)} placeholder="0" />
            </Field>
            <Field label="Оксид углерода CO, %">
              <input className={inputCls} style={inputStyle} inputMode="decimal" value={form.co} onChange={e => set('co', e.target.value)} placeholder="0" />
            </Field>
            <Field label="Водород H₂, %">
              <input className={inputCls} style={inputStyle} inputMode="decimal" value={form.h2} onChange={e => set('h2', e.target.value)} placeholder="0" />
            </Field>
            <Field label="Кислород O₂, %">
              <input className={inputCls} style={inputStyle} inputMode="decimal" value={form.o2} onChange={e => set('o2', e.target.value)} placeholder="20.9" />
            </Field>
          </div>
        ) : (
          <>
            <Field label="Горючий газ">
              <select className={inputCls} style={inputStyle} value={form.gas} onChange={e => set('gas', e.target.value)}>
                {GASES.map(g => <option key={g.key} value={g.key}>{g.name} ({g.formula})</option>)}
              </select>
            </Field>
            {gasInfo && (
              <div className="text-xs rounded px-3 py-2 font-mono-tech" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                НПВ {gasInfo.lel}% · ВПВ {gasInfo.uel}% · мин. O₂ {gasInfo.lol}%
                <div className="font-sans mt-0.5">{gasInfo.description}</div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label={`${gasInfo?.formula ?? 'Газ'}, %`}>
                <input className={inputCls} style={inputStyle} inputMode="decimal" value={form.gasPct} onChange={e => set('gasPct', e.target.value)} placeholder="0" />
              </Field>
              <Field label="Кислород O₂, %">
                <input className={inputCls} style={inputStyle} inputMode="decimal" value={form.o2} onChange={e => set('o2', e.target.value)} placeholder="20.9" />
              </Field>
            </div>
          </>
        )}

        <Field label="Объект (для отчёта)">
          <input className={inputCls.replace(' font-mono-tech', '')} style={inputStyle} value={form.object} onChange={e => set('object', e.target.value)} placeholder="необязательно" />
        </Field>
        <div className="grid grid-cols-[110px_1fr] gap-2">
          <Field label="Отделение №">
            <input className={inputCls.replace(' font-mono-tech', '')} style={inputStyle} value={form.squad} onChange={e => set('squad', e.target.value)} placeholder="№" />
          </Field>
          <Field label="Командир отделения">
            <input className={inputCls.replace(' font-mono-tech', '')} style={inputStyle} value={form.commander} onChange={e => set('commander', e.target.value)} placeholder="ФИО" />
          </Field>
        </div>
        <Field label="Расчёт выполнил">
          <input className={inputCls.replace(' font-mono-tech', '')} style={inputStyle} value={form.performer} onChange={e => set('performer', e.target.value)} placeholder="необязательно" />
        </Field>

        <button
          className="flex items-center justify-center gap-1.5 py-2 rounded text-xs border border-border hover:border-primary transition-colors"
          style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}
          onClick={() => setForm(f => ({ ...DEFAULTS, method: f.method, gas: f.gas, object: f.object, squad: f.squad, commander: f.commander, performer: f.performer }))}>
          <Icon name="RotateCcw" size={13} /> Очистить
        </button>
      </div>

      <div className="flex flex-col gap-4 min-w-0">
        {!vgsch && !single && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <Icon name="Triangle" size={32} className="mx-auto mb-2 opacity-50" />
            {form.method === 'vgsch' ? 'Введите концентрации горючих газов и кислорода' : 'Введите концентрацию газа и кислорода'}
          </div>
        )}

        {vgsch && (
          <>
            <Verdict explosive={vgsch.isExplosive} label={vgsch.isExplosive ? 'ВЗРЫВООПАСНАЯ СМЕСЬ' : 'НЕВЗРЫВООПАСНАЯ СМЕСЬ'} text={vgsch.conclusion} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="C (сумма горючих)" value={`${vgsch.C}%`} />
              <Stat label="P_CH (доля CH₄)" value={String(vgsch.pch)} />
              <Stat label="P_CO (доля CO)" value={String(vgsch.pco)} />
              <Stat label="P_H (доля H₂)" value={String(vgsch.ph)} />
            </div>
            <TriangleChart tri={vgsch.tri} point={[vgsch.C, vgsch.o2]} explosive={vgsch.isExplosive} />
            <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Применён треугольник P_CO = {vgsch.pcoKey}, P_CH = {vgsch.pchKey}. Вершины (C; O₂): {vgsch.tri.map(([c, o]) => `(${c}; ${o})`).join(', ')}.
              Боевой устав ВГСЧ, Приложение 11.
            </div>
          </>
        )}

        {single && (
          <>
            <Verdict explosive={single.isExplosive} label={single.label} text={single.conclusion} color={single.color} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label={`${single.gas.formula}`} value={`${single.gasPct}%`} />
              <Stat label="O₂" value={`${single.o2Pct}%`} />
              <Stat label="НПВ – ВПВ" value={`${single.gas.lel}–${single.gas.uel}%`} />
              <Stat label="Мин. O₂" value={`${single.gas.lol}%`} />
            </div>
          </>
        )}

        {vgsch && <VoiceCodeCard code={encodeVgsch(vInput)} />}
        {single && <VoiceCodeCard code={encodeGas(single.gas.key, single.gasPct, single.o2Pct)} />}

        {report && (
          <div className="flex flex-wrap gap-2 justify-end">
            <SendButton payload={vgsch ? { type: 'vgsch', input: vInput, result: vgsch, meta } : single ? { type: 'gas', result: single, meta } : null} />
            <button onClick={copyReport} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border border-border hover:border-primary"
              style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
              <Icon name="Copy" size={13} /> Копировать
            </button>
            <button onClick={wordReport} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border border-border hover:border-primary"
              style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
              <Icon name="FileText" size={13} /> Word
            </button>
            <button onClick={printReport} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
              <Icon name="Printer" size={13} /> Печать
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TriangleCalculator;
