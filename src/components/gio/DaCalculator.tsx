import React, { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import {
  calcDa, DA_RESERVE, DA_ROUTES, DaInput, DaResult, DaRoute, daReport, fmt1, fmtMin, isDaError, toMPa,
} from '@/lib/gio/da-calc';
import { exportDaDocx, printDa } from '@/lib/gio/ustavDocs';
import SendButton from '@/components/ops/SendButton';
import VoiceCodeCard from '@/components/ops/VoiceCodeCard';
import { encodeDa } from '@/lib/gio/voiceCode';
import type { OpPayload } from '@/lib/ops/types';

const LS_KEY = 'sau-da-form';
const LABELS = ['КО', '№1', '№2', '№3', '№4'];

interface FormState {
  pressures: string[];
  route: DaRoute;
  transport: boolean;
  entryTime: string;
  ctrlMinutes: string;
  ctrlCurrent: string;
  ctrlMember: string;
  object: string;
  place: string;
  performer: string;
}

const DEFAULTS: FormState = {
  pressures: ['', '', '', '', ''],
  route: 'half',
  transport: false,
  entryTime: '',
  ctrlMinutes: '',
  ctrlCurrent: '',
  ctrlMember: '',
  object: '',
  place: '',
  performer: '',
};

const loadForm = (): FormState => {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(LS_KEY) || '') };
  } catch {
    return DEFAULTS;
  }
};

const num = (s: string) => {
  const v = parseFloat(String(s).replace(',', '.'));
  return isNaN(v) ? null : v;
};

const nowHHMM = () => new Date().toTimeString().slice(0, 5);

const inputCls = 'w-full rounded px-3 py-2 text-sm outline-none border border-border focus:border-primary transition-colors font-mono-tech';
const textCls = inputCls.replace(' font-mono-tech', '');
const inputStyle = { background: 'hsl(var(--input))', color: 'hsl(var(--foreground))' };
const btn2 = { background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' };

const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
    {children}
    {hint && <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{hint}</span>}
  </label>
);

const Stat: React.FC<{ label: string; value: string; unit?: string; accent?: boolean; sub?: string }> = ({ label, value, unit, accent, sub }) => (
  <div className="rounded-lg p-3 border" style={{ background: 'hsl(var(--card))', borderColor: accent ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}>
    <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</div>
    <div className="text-xl sm:text-2xl font-bold font-mono-tech" style={{ color: 'hsl(var(--primary))' }}>
      {value}{unit && <span className="text-sm font-normal ml-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{unit}</span>}
    </div>
    {sub && <div className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{sub}</div>}
  </div>
);

export const DaGauge: React.FC<{ r: DaResult; start: number }> = ({ r, start }) => {
  const W = 560, H = 96, PL = 12, PR = 12;
  const max = Math.max(200, start, r.pmin);
  const x = (p: number) => PL + (Math.min(Math.max(p, 0), max) / max) * (W - PL - PR);
  const cur = r.control?.current;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-lg border border-border" style={{ background: 'hsl(var(--card))' }}>
      <rect x={x(0)} y={30} width={x(DA_RESERVE) - x(0)} height={22} fill="hsl(var(--danger) / 0.55)" />
      <rect x={x(DA_RESERVE)} y={30} width={x(r.turnPressure) - x(DA_RESERVE)} height={22} fill="hsl(var(--warning) / 0.45)" />
      <rect x={x(r.turnPressure)} y={30} width={x(r.pmin) - x(r.turnPressure)} height={22} fill="hsl(var(--safe) / 0.5)" />
      {r.pmin < max && <rect x={x(r.pmin)} y={30} width={x(max) - x(r.pmin)} height={22} fill="hsl(var(--muted) / 0.6)" />}
      <text x={(x(0) + x(DA_RESERVE)) / 2} y={45} textAnchor="middle" fontSize={11} fontWeight={700} fill="hsl(var(--foreground))">резерв</text>
      <text x={(x(DA_RESERVE) + x(r.turnPressure)) / 2} y={45} textAnchor="middle" fontSize={11} fontWeight={700} fill="hsl(var(--foreground))">назад</text>
      <text x={(x(r.turnPressure) + x(r.pmin)) / 2} y={45} textAnchor="middle" fontSize={11} fontWeight={700} fill="hsl(var(--foreground))">вперёд</text>
      {[0, DA_RESERVE, r.turnPressure, r.pmin].map((p, i) => (
        <g key={i}>
          <line x1={x(p)} y1={26} x2={x(p)} y2={58} stroke="hsl(var(--foreground))" strokeWidth={i === 2 ? 2.5 : 1} />
          <text x={x(p)} y={74} textAnchor="middle" fontSize={11} fontWeight={i === 2 ? 700 : 400} fill={i === 2 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}>{fmt1(p)}</text>
        </g>
      ))}
      <text x={W / 2} y={90} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">давление в баллоне, кгс/см²</text>
      {cur !== undefined && (
        <g>
          <polygon points={`${x(cur) - 7},10 ${x(cur) + 7},10 ${x(cur)},24`} fill={r.danger ? 'hsl(var(--danger))' : 'hsl(var(--primary))'} />
          <text x={x(cur)} y={8} textAnchor="middle" fontSize={10} fontWeight={700} fill="hsl(var(--foreground))">сейчас {fmt1(cur)}</text>
        </g>
      )}
    </svg>
  );
};

const DaCalculator: React.FC = () => {
  const [form, setForm] = useState<FormState>(loadForm);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));
  const setP = (i: number, v: string) => setForm(f => ({ ...f, pressures: f.pressures.map((p, j) => (j === i ? v : p)) }));

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(form));
  }, [form]);

  const input: DaInput = useMemo(() => {
    const minutes = num(form.ctrlMinutes), current = num(form.ctrlCurrent);
    return {
      members: form.pressures.map((p, i) => ({ label: LABELS[i], pressure: num(p) })).filter(m => m.pressure !== null),
      route: form.route,
      transport: form.transport,
      entryTime: /^\d{1,2}:\d{2}$/.test(form.entryTime) ? form.entryTime : undefined,
      control: minutes !== null && current !== null && minutes > 0 ? { minutes, current, member: form.ctrlMember || undefined } : null,
    };
  }, [form]);

  const res = useMemo(() => (input.members.length ? calcDa(input) : null), [input]);
  const r = res && !isDaError(res) ? res : null;
  const err = res && isDaError(res) ? res.error : null;

  const meta = { object: form.object, place: form.place, performer: form.performer };
  const payload: OpPayload | null = r ? { type: 'da', input, meta } : null;
  const code = r ? encodeDa(input) : null;

  const elapsed = () => {
    if (!input.entryTime) return toast.error('Сначала укажите время включения в ДА');
    const [h, m] = input.entryTime.split(':').map(Number);
    const now = new Date();
    let d = now.getHours() * 60 + now.getMinutes() - (h * 60 + m);
    if (d < 0) d += 1440;
    set('ctrlMinutes', String(d));
  };

  const copy = async () => {
    if (!r) return;
    await navigator.clipboard.writeText(daReport(input, r));
    toast.success('Отчёт скопирован');
  };
  const word = async () => {
    if (!r) return;
    try {
      await exportDaDocx(input, r, meta);
      toast.success('Документ Word сохранён');
    } catch {
      toast.error('Не удалось сформировать документ Word');
    }
  };
  const print = () => {
    if (r && !printDa(input, r, meta)) toast.error('Разрешите всплывающие окна для печати');
  };

  const color = r?.danger ? 'hsl(var(--danger))' : 'hsl(var(--primary))';

  return (
    <div className="grid lg:grid-cols-[380px_1fr] gap-5">
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4 self-start" style={{ background: 'hsl(var(--card))' }}>
        <div className="text-sm font-semibold flex items-center gap-2">
          <Icon name="ClipboardList" size={16} /> Исходные данные
        </div>

        <Field label="Показания манометров перед включением, кгс/см²" hint="Расчёт ведётся по минимальному показанию в отделении (п. 23)">
          <div className="grid grid-cols-5 gap-1.5">
            {LABELS.map((l, i) => (
              <label key={l} className="flex flex-col gap-0.5">
                <span className="text-[10px] text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>{l}</span>
                <input className={`${inputCls} px-1 text-center`} style={inputStyle} inputMode="decimal" value={form.pressures[i]} onChange={e => setP(i, e.target.value)} placeholder="200" />
              </label>
            ))}
          </div>
        </Field>

        <Field label="Маршрут вперёд">
          <div className="grid gap-2">
            {(Object.keys(DA_ROUTES) as DaRoute[]).map(k => (
              <button key={k} onClick={() => set('route', k)}
                className="flex items-center gap-2 px-3 py-2.5 rounded text-xs font-medium border text-left transition-colors"
                style={form.route === k
                  ? { background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', borderColor: 'hsl(var(--primary))' }
                  : { ...btn2, borderColor: 'hsl(var(--border))' }}>
                <Icon name={k === 'half' ? 'MoveRight' : 'TrendingDown'} size={16} />
                <span className="flex-1">{DA_ROUTES[k].label}</span>
                <b className="font-mono-tech">{DA_ROUTES[k].short}</b>
              </button>
            ))}
          </div>
        </Field>

        <label className="flex items-start gap-2 text-xs cursor-pointer">
          <input type="checkbox" className="mt-0.5 w-4 h-4 accent-[hsl(var(--primary))]" checked={form.transport} onChange={e => set('transport', e.target.checked)} />
          <span>Передвижение на транспорте <span style={{ color: 'hsl(var(--muted-foreground))' }}>— обратный путь считается пешком</span></span>
        </label>

        <Field label="Время включения в ДА">
          <div className="flex gap-2">
            <input type="time" className={inputCls} style={inputStyle} value={form.entryTime} onChange={e => set('entryTime', e.target.value)} />
            <button onClick={() => set('entryTime', nowHHMM())} className="px-3 rounded text-xs border border-border hover:border-primary whitespace-nowrap" style={btn2}>Сейчас</button>
          </div>
        </Field>

        <div className="rounded border border-dashed border-border p-3 flex flex-col gap-3">
          <div className="text-xs font-semibold flex items-center gap-1.5"><Icon name="Gauge" size={14} /> Контроль в пути (необязательно)</div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Прошло, мин">
              <div className="flex gap-1">
                <input className={inputCls} style={inputStyle} inputMode="numeric" value={form.ctrlMinutes} onChange={e => set('ctrlMinutes', e.target.value)} placeholder="20" />
                <button onClick={elapsed} title="Посчитать от времени включения" className="px-2 rounded border border-border hover:border-primary" style={btn2}><Icon name="Timer" size={14} /></button>
              </div>
            </Field>
            <Field label="Давление сейчас">
              <input className={inputCls} style={inputStyle} inputMode="decimal" value={form.ctrlCurrent} onChange={e => set('ctrlCurrent', e.target.value)} placeholder="170" />
            </Field>
          </div>
          <Field label="Респираторщик с максимальным расходом">
            <input className={textCls} style={inputStyle} value={form.ctrlMember} onChange={e => set('ctrlMember', e.target.value)} placeholder="например №2" />
          </Field>
        </div>

        <Field label="Объект (для отчёта)">
          <input className={textCls} style={inputStyle} value={form.object} onChange={e => set('object', e.target.value)} placeholder="необязательно" />
        </Field>
        <Field label="Задание / выработка">
          <input className={textCls} style={inputStyle} value={form.place} onChange={e => set('place', e.target.value)} placeholder="необязательно" />
        </Field>
        <Field label="Расчёт выполнил">
          <input className={textCls} style={inputStyle} value={form.performer} onChange={e => set('performer', e.target.value)} placeholder="ФИО" />
        </Field>
        <button className="flex items-center justify-center gap-1.5 py-2 rounded text-xs border border-border hover:border-primary" style={btn2}
          onClick={() => setForm(f => ({ ...DEFAULTS, object: f.object, performer: f.performer }))}>
          <Icon name="RotateCcw" size={13} /> Новый расчёт
        </button>
      </div>

      <div className="flex flex-col gap-4 min-w-0">
        {!res && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <Icon name="Gauge" size={32} className="mx-auto mb-2 opacity-50" />
            Введите показания манометров ДА отделения
          </div>
        )}
        {err && (
          <div className="rounded-lg p-4 border-2 flex gap-3 items-start" style={{ borderColor: 'hsl(var(--danger))', background: 'hsl(var(--card))' }}>
            <Icon name="OctagonX" size={28} style={{ color: 'hsl(var(--danger))', flexShrink: 0 }} />
            <div className="text-sm font-semibold" style={{ color: 'hsl(var(--danger))' }}>{err}</div>
          </div>
        )}

        {r && (
          <>
            <div className="rounded-lg p-4 border-2 flex gap-3 items-start" style={{ borderColor: color, background: r.danger ? 'hsl(var(--danger) / 0.1)' : 'hsl(var(--card))' }}>
              <Icon name={r.danger ? 'Undo2' : 'Gauge'} size={30} style={{ color, flexShrink: 0 }} />
              <div>
                <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{r.danger ? 'Немедленно' : 'Давление прекращения движения вперёд'}</div>
                <div className="text-2xl sm:text-3xl font-black font-mono-tech" style={{ color }}>
                  {r.danger ? 'ПОВОРОТ НАЗАД' : <>{fmt1(r.turnPressure)} <span className="text-base font-semibold">кгс/см²</span></>}
                </div>
                <div className="text-sm mt-1" style={{ lineHeight: 1.5 }}>
                  {r.danger ? r.verdict : <>{fmt1(toMPa(r.turnPressure))} МПа. {DA_ROUTES[form.route].text[0].toUpperCase() + DA_ROUTES[form.route].text.slice(1)}.</>}
                </div>
              </div>
            </div>

            <DaGauge r={r} start={r.control?.start ?? r.pmin} />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Минимальное давление" value={fmt1(r.pmin)} unit="кгс/см²" sub={r.pminMember} />
              <Stat label="Рабочий запас" value={fmt1(r.working)} unit="кгс/см²" sub={`резерв ${DA_RESERVE} не трогаем`} />
              <Stat label="На путь вперёд" value={fmt1(r.forwardUse)} unit="кгс/см²" />
              <Stat label="На возвращение" value={fmt1(r.backUse)} unit="кгс/см²" />
            </div>

            {r.control ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Фактический расход" value={r.control.rate.toFixed(2).replace('.', ',')} unit="кгс/см²/мин" sub={r.control.member} />
                <Stat label="До поворота" value={r.control.mustReturn ? '0' : fmtMin(r.control.toTurnMin).replace(' мин', '')} unit="мин" accent={!r.control.mustReturn}
                  sub={r.control.turnClock ? `в ${r.control.turnClock}` : undefined} />
                <Stat label="На возвращение" value={fmtMin(r.control.returnMin).replace(' мин', '')} unit="мин" sub="до резерва 50" />
                <Stat label="Выход на ПБ" value={r.control.exitClock ?? '—'} sub="не позднее" accent />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Ориентировочно вперёд" value={String(Math.round(r.estForwardMin))} unit="мин" sub="при среднем расходе" />
                <Stat label="Ориентировочно назад" value={String(Math.round(r.estBackMin))} unit="мин" />
                <Stat label="Поворот около" value={r.estTurnClock ?? '—'} accent />
                <Stat label="Выход около" value={r.estExitClock ?? '—'} />
              </div>
            )}

            <div className="text-xs rounded p-3 border border-border flex flex-col gap-1" style={{ background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
              {!r.control && <div>Время рассчитано по среднему расходу аппарата на 4 часа (200 кгс/см² за 240 мин ≈ 0,83 кгс/см²/мин). Для точного прогноза заполните «Контроль в пути».</div>}
              {r.advice.map(a => <div key={a}>• {a}</div>)}
            </div>

            {code && <VoiceCodeCard code={code} />}

            <div className="flex flex-wrap gap-2 justify-end">
              <SendButton payload={payload} />
              <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border border-border hover:border-primary" style={btn2}>
                <Icon name="Copy" size={13} /> Копировать
              </button>
              <button onClick={word} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border border-border hover:border-primary" style={btn2}>
                <Icon name="FileText" size={13} /> Word
              </button>
              <button onClick={print} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                <Icon name="Printer" size={13} /> Печать
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DaCalculator;
