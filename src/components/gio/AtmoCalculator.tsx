import React, { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import {
  ATMO_DEFAULT_LIMITS, ATMO_LIMIT_LABELS, AtmoLimits, AtmoResult, AtmoRow, atmoReport, calcAtmo, fmtPct,
} from '@/lib/gio/atmo-calc';
import { exportAtmoDocx, printAtmo } from '@/lib/gio/ustavDocs';
import SendButton from '@/components/ops/SendButton';
import VoiceCodeCard from '@/components/ops/VoiceCodeCard';
import { encodeAtmo } from '@/lib/gio/voiceCode';
import type { OpPayload } from '@/lib/ops/types';

const LS_KEY = 'sau-atmo-form';

type Draft = { time: string; co2: string; o2: string; co: string; h2: string; ch4: string; other: string; temp: string };
const EMPTY: Draft = { time: '', co2: '', o2: '', co: '', h2: '', ch4: '', other: '', temp: '' };

interface FormState {
  rows: AtmoRow[];
  draft: Draft;
  limits: AtmoLimits;
  object: string;
  place: string;
  performer: string;
}

const DEFAULTS: FormState = { rows: [], draft: EMPTY, limits: ATMO_DEFAULT_LIMITS, object: '', place: '', performer: '' };

const loadForm = (): FormState => {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY) || '');
    return { ...DEFAULTS, ...s, limits: { ...ATMO_DEFAULT_LIMITS, ...(s.limits || {}) }, draft: { ...EMPTY, ...(s.draft || {}) } };
  } catch {
    return DEFAULTS;
  }
};

const num = (s: string) => {
  if (!s.trim()) return null;
  const v = parseFloat(s.replace(',', '.'));
  return isNaN(v) ? null : v;
};

const nowHHMM = () => new Date().toTimeString().slice(0, 5);

const inputCls = 'w-full rounded px-2 py-2 text-sm outline-none border border-border focus:border-primary transition-colors font-mono-tech';
const textCls = 'w-full rounded px-3 py-2 text-sm outline-none border border-border focus:border-primary transition-colors';
const inputStyle = { background: 'hsl(var(--input))', color: 'hsl(var(--foreground))' };
const btn2 = { background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' };

const LVL_COLOR = { danger: 'hsl(var(--danger))', warn: 'hsl(var(--warning))', info: 'hsl(var(--muted-foreground))', ok: 'hsl(var(--safe))' };

const FIELDS: { k: keyof Draft; label: string; ph: string }[] = [
  { k: 'o2', label: 'O₂, %', ph: '20,9' },
  { k: 'co', label: 'CO, %', ph: '0,0017' },
  { k: 'ch4', label: 'CH₄, %', ph: '0,5' },
  { k: 'temp', label: 't, °C', ph: '24' },
  { k: 'co2', label: 'CO₂, %', ph: '0,1' },
  { k: 'h2', label: 'H₂, %', ph: '0' },
];

const COLS: { k: keyof AtmoRow; label: string; lvl?: 'co2' | 'o2' | 'co' | 'h2' | 'ch4' | 'temp' }[] = [
  { k: 'co2', label: 'CO₂', lvl: 'co2' },
  { k: 'o2', label: 'O₂', lvl: 'o2' },
  { k: 'co', label: 'CO', lvl: 'co' },
  { k: 'h2', label: 'H₂', lvl: 'h2' },
  { k: 'ch4', label: 'CH₄', lvl: 'ch4' },
  { k: 'temp', label: 't, °C', lvl: 'temp' },
];

export const AtmoChart: React.FC<{ r: AtmoResult; limits: AtmoLimits }> = ({ r, limits }) => {
  const pts = r.rows.map((x, i) => ({ m: r.evals[i].minutes, t: x.temp, ch4: x.ch4 })).filter(p => p.t != null || p.ch4 != null);
  if (pts.length < 2) return null;
  const W = 560, H = 220, PL = 38, PR = 38, PT = 14, PB = 34;
  const m0 = pts[0].m, m1 = Math.max(pts[pts.length - 1].m, m0 + 1);
  const temps = pts.map(p => p.t).filter((v): v is number => v != null);
  const ch4s = pts.map(p => p.ch4).filter((v): v is number => v != null);
  const tMin = temps.length ? Math.floor(Math.min(...temps, limits.tempZvt) - 2) : 0;
  const tMax = temps.length ? Math.ceil(Math.max(...temps, limits.tempZvt) + 2) : 1;
  const cMax = ch4s.length ? Math.max(limits.ch4Stop * 1.2, ...ch4s.map(v => v * 1.15)) : 1;
  const sx = (m: number) => PL + ((m - m0) / (m1 - m0)) * (W - PL - PR);
  const st = (t: number) => PT + (1 - (t - tMin) / (tMax - tMin)) * (H - PT - PB);
  const sc = (c: number) => PT + (1 - c / cMax) * (H - PT - PB);
  const line = (k: 't' | 'ch4', f: (v: number) => number) =>
    pts.filter(p => p[k] != null).map((p, i) => `${i ? 'L' : 'M'}${sx(p.m)},${f(p[k] as number)}`).join(' ');
  const fmtT = (m: number) => { const x = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-lg border border-border" style={{ background: 'hsl(var(--card))' }}>
      {temps.length > 0 && (
        <>
          <line x1={PL} x2={W - PR} y1={st(limits.tempZvt)} y2={st(limits.tempZvt)} stroke="hsl(var(--danger))" strokeDasharray="4 4" />
          <text x={PL + 4} y={st(limits.tempZvt) - 4} fontSize={10} fill="hsl(var(--danger))">ЗВТ {limits.tempZvt} °C</text>
          {[tMin, (tMin + tMax) / 2, tMax].map(t => (
            <text key={t} x={PL - 4} y={st(t) + 3} textAnchor="end" fontSize={10} fill="hsl(var(--danger))">{Math.round(t)}</text>
          ))}
        </>
      )}
      {ch4s.length > 0 && [0, cMax / 2, cMax].map(c => (
        <text key={c} x={W - PR + 4} y={sc(c) + 3} fontSize={10} fill="hsl(var(--primary))">{fmtPct(Math.round(c * 10) / 10)}</text>
      ))}
      <line x1={PL} x2={W - PR} y1={H - PB} y2={H - PB} stroke="hsl(var(--border))" />
      {pts.map((p, i) => (i === 0 || i === pts.length - 1 || pts.length <= 8) && (
        <text key={i} x={sx(p.m)} y={H - PB + 14} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">{fmtT(p.m)}</text>
      ))}
      {temps.length > 1 && <path d={line('t', st)} fill="none" stroke="hsl(var(--danger))" strokeWidth={2.5} />}
      {ch4s.length > 1 && <path d={line('ch4', sc)} fill="none" stroke="hsl(var(--primary))" strokeWidth={2.5} />}
      {pts.map((p, i) => (
        <g key={i}>
          {p.t != null && <circle cx={sx(p.m)} cy={st(p.t)} r={3.5} fill="hsl(var(--danger))" />}
          {p.ch4 != null && <circle cx={sx(p.m)} cy={sc(p.ch4)} r={3.5} fill="hsl(var(--primary))" />}
        </g>
      ))}
      <text x={PL} y={H - 4} fontSize={11} fill="hsl(var(--danger))">● температура, °C</text>
      <text x={W - PR} y={H - 4} textAnchor="end" fontSize={11} fill="hsl(var(--primary))">CH₄, % ●</text>
    </svg>
  );
};

export const AtmoTable: React.FC<{ r: AtmoResult; onDelete?: (i: number) => void }> = ({ r, onDelete }) => (
  <div className="rounded-lg border border-border overflow-x-auto" style={{ background: 'hsl(var(--card))' }}>
    <table className="w-full text-xs font-mono-tech whitespace-nowrap">
      <thead>
        <tr style={{ color: 'hsl(var(--muted-foreground))' }}>
          <th className="text-left font-medium px-2 py-2 border-b border-border font-sans">Время</th>
          {COLS.map(c => <th key={c.k} className="text-right font-medium px-2 py-2 border-b border-border font-sans">{c.label}</th>)}
          <th className="text-left font-medium px-2 py-2 border-b border-border font-sans">Другие</th>
          <th className="text-right font-medium px-2 py-2 border-b border-border font-sans">Δt/5 мин</th>
          {onDelete && <th className="border-b border-border" />}
        </tr>
      </thead>
      <tbody>
        {r.rows.map((x, i) => {
          const e = r.evals[i];
          return (
            <tr key={i} className="border-b border-border last:border-0">
              <td className="px-2 py-1.5 font-bold">{x.time}</td>
              {COLS.map(c => {
                const lv = c.lvl ? e.levels[c.lvl] : undefined;
                return (
                  <td key={c.k} className="px-2 py-1.5 text-right"
                    style={lv ? { color: LVL_COLOR[lv], fontWeight: 700, background: lv === 'danger' ? 'hsl(var(--danger) / 0.12)' : undefined } : undefined}>
                    {fmtPct(x[c.k] as number | null)}
                  </td>
                );
              })}
              <td className="px-2 py-1.5 font-sans">{x.other || '—'}</td>
              <td className="px-2 py-1.5 text-right" style={e.rise5 !== null && e.rise5 >= 3 ? { color: LVL_COLOR.danger, fontWeight: 700 } : undefined}>
                {e.rise5 === null ? '—' : `${e.rise5 > 0 ? '+' : ''}${fmtPct(Math.round(e.rise5 * 10) / 10)}`}
              </td>
              {onDelete && (
                <td className="px-1">
                  <button onClick={() => onDelete(i)} className="p-1.5 rounded hover:text-foreground" style={{ color: 'hsl(var(--muted-foreground))' }} title="Удалить замер">
                    <Icon name="X" size={13} />
                  </button>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export const AtmoAlarms: React.FC<{ r: AtmoResult; onlyLast?: boolean }> = ({ r, onlyLast }) => {
  const list = onlyLast ? r.alarms.filter(a => a.rowIndex === r.rows.length - 1) : [...r.alarms].reverse();
  if (!list.length) return null;
  return (
    <div className="flex flex-col gap-1.5">
      {list.map((a, i) => (
        <div key={i} className="flex gap-2 items-start text-xs rounded px-3 py-2 border"
          style={{ borderColor: LVL_COLOR[a.level], background: a.level === 'danger' ? 'hsl(var(--danger) / 0.08)' : 'hsl(var(--card))' }}>
          <Icon name={a.level === 'danger' ? 'Siren' : 'TriangleAlert'} size={14} style={{ color: LVL_COLOR[a.level], flexShrink: 0, marginTop: 1 }} />
          <div><b style={{ color: LVL_COLOR[a.level] }}>{a.title}.</b> {a.text}</div>
        </div>
      ))}
    </div>
  );
};

const AtmoCalculator: React.FC = () => {
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [showLimits, setShowLimits] = useState(false);
  const [showAllAlarms, setShowAllAlarms] = useState(false);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));
  const setD = (k: keyof Draft, v: string) => setForm(f => ({ ...f, draft: { ...f.draft, [k]: v } }));

  useEffect(() => {
    setForm(loadForm());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(LS_KEY, JSON.stringify(form));
  }, [form, loaded]);

  const r = useMemo(() => calcAtmo(form.rows, form.limits), [form.rows, form.limits]);

  const add = () => {
    const d = form.draft;
    const time = d.time || nowHHMM();
    if (!/^\d{1,2}:\d{2}$/.test(time)) return toast.error('Время замера — ЧЧ:ММ');
    const row: AtmoRow = { time, co2: num(d.co2), o2: num(d.o2), co: num(d.co), h2: num(d.h2), ch4: num(d.ch4), temp: num(d.temp), other: d.other.trim() || undefined };
    if ([row.co2, row.o2, row.co, row.h2, row.ch4, row.temp].every(v => v === null) && !row.other) return toast.error('Введите хотя бы одно значение');
    setForm(f => ({ ...f, rows: [...f.rows, row], draft: { ...EMPTY } }));
  };

  const payload: OpPayload | null = r ? { type: 'atmo', rows: form.rows, limits: form.limits, meta: { object: form.object, place: form.place, performer: form.performer } } : null;
  const code = r ? encodeAtmo(r.rows, r.evals[r.evals.length - 1].rise5) : null;
  const meta = { object: form.object, place: form.place, performer: form.performer };

  const copy = async () => {
    if (!r) return;
    await navigator.clipboard.writeText(atmoReport(form.place, r));
    toast.success('Таблица скопирована');
  };
  const word = async () => {
    if (!r) return;
    try {
      await exportAtmoDocx(r, form.limits, meta);
      toast.success('Документ Word сохранён');
    } catch {
      toast.error('Не удалось сформировать документ Word');
    }
  };
  const print = () => {
    if (r && !printAtmo(r, form.limits, meta)) toast.error('Разрешите всплывающие окна для печати');
  };

  const st = r?.status ?? 'ok';
  const stColor = LVL_COLOR[st];

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-5">
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4 self-start" style={{ background: 'hsl(var(--card))' }}>
        <div className="text-sm font-semibold flex items-center gap-2">
          <Icon name="Plus" size={16} /> Новый замер
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Время замера</span>
          <div className="flex gap-2">
            <input type="time" className={inputCls} style={inputStyle} value={form.draft.time} onChange={e => setD('time', e.target.value)} />
            <button onClick={() => setD('time', nowHHMM())} className="px-3 rounded text-xs border border-border hover:border-primary whitespace-nowrap" style={btn2}>Сейчас</button>
          </div>
          <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>Пустое время — подставится текущее</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {FIELDS.map(f => (
            <label key={f.k} className="flex flex-col gap-1">
              <span className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{f.label}</span>
              <input className={inputCls} style={inputStyle} inputMode="decimal" value={form.draft[f.k]} placeholder={f.ph}
                onChange={e => setD(f.k, e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
            </label>
          ))}
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Другие газы / задымлённость</span>
          <input className={textCls} style={inputStyle} value={form.draft.other} placeholder="например NO₂ 0,0002; сильная" onChange={e => setD('other', e.target.value)} />
        </label>
        <button onClick={add} className="flex items-center justify-center gap-2 py-3 rounded font-semibold text-sm"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', minHeight: 48 }}>
          <Icon name="Plus" size={18} /> Записать замер
        </button>

        <div className="border-t border-border pt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Место отбора проб воздуха</span>
            <input className={textCls} style={inputStyle} value={form.place} onChange={e => set('place', e.target.value)} placeholder="например: конв. штрек 5, ПБ" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Объект</span>
            <input className={textCls} style={inputStyle} value={form.object} onChange={e => set('object', e.target.value)} placeholder="необязательно" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Замеры выполнил</span>
            <input className={textCls} style={inputStyle} value={form.performer} onChange={e => set('performer', e.target.value)} placeholder="ФИО" />
          </label>
        </div>

        <button onClick={() => setShowLimits(v => !v)} className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <Icon name={showLimits ? 'ChevronDown' : 'ChevronRight'} size={14} /> Пороги тревог
        </button>
        {showLimits && (
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(ATMO_LIMIT_LABELS) as (keyof AtmoLimits)[]).map(k => (
              <label key={k} className="flex flex-col gap-1">
                <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{ATMO_LIMIT_LABELS[k]}</span>
                <input className={inputCls} style={inputStyle} inputMode="decimal" defaultValue={String(form.limits[k]).replace('.', ',')}
                  onBlur={e => { const v = num(e.target.value); if (v !== null) set('limits', { ...form.limits, [k]: v }); }} />
              </label>
            ))}
            <button className="col-span-2 py-2 rounded text-xs border border-border" style={btn2}
              onClick={() => { set('limits', ATMO_DEFAULT_LIMITS); setShowLimits(false); }}>Сбросить пороги</button>
          </div>
        )}

        {form.rows.length > 0 && (
          <button className="flex items-center justify-center gap-1.5 py-2 rounded text-xs border border-border hover:border-primary" style={btn2}
            onClick={() => { if (confirm('Очистить все замеры журнала?')) set('rows', []); }}>
            <Icon name="Trash2" size={13} /> Новый журнал
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 min-w-0">
        {!r && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))', lineHeight: 1.6 }}>
            <Icon name="Wind" size={32} className="mx-auto mb-2 opacity-50" />
            Записывайте замеры CO, CH₄, O₂ и температуры по ходу движения.<br />
            Журнал сам отследит рост температуры на 3 °C за 5 минут (п. 41), превышение ПДК и взрывоопасность смеси.
          </div>
        )}

        {r && (
          <>
            <div className="rounded-lg p-4 border-2 flex gap-3 items-start" style={{ borderColor: stColor, background: st === 'danger' ? 'hsl(var(--danger) / 0.1)' : 'hsl(var(--card))' }}>
              <Icon name={st === 'danger' ? 'Siren' : st === 'warn' ? 'TriangleAlert' : 'ShieldCheck'} size={30} style={{ color: stColor, flexShrink: 0 }} />
              <div className="min-w-0">
                <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Последний замер {r.last.time}</div>
                <div className="text-xl sm:text-2xl font-black" style={{ color: stColor }}>{r.verdict}</div>
                <div className="text-xs font-mono-tech mt-1 flex flex-wrap gap-x-3">
                  {r.last.o2 != null && <span>O₂ {fmtPct(r.last.o2)}%</span>}
                  {r.last.co != null && <span>CO {fmtPct(r.last.co)}%</span>}
                  {r.last.ch4 != null && <span>CH₄ {fmtPct(r.last.ch4)}%</span>}
                  {r.last.temp != null && <span>t {fmtPct(r.last.temp)} °C</span>}
                </div>
              </div>
            </div>

            <AtmoAlarms r={r} onlyLast={!showAllAlarms} />
            {r.alarms.length > 0 && (
              <button onClick={() => setShowAllAlarms(v => !v)} className="self-start text-xs underline" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {showAllAlarms ? 'Только по последнему замеру' : `Все отклонения за журнал (${r.alarms.length})`}
              </button>
            )}

            <AtmoChart r={r} limits={form.limits} />
            <AtmoTable r={r} onDelete={i => set('rows', form.rows.filter((_, j) => j !== i))} />

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

export default AtmoCalculator;