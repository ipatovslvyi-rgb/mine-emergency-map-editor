import React, { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import {
  calcZVT, isZvtError, minsToHHMM, turnBackTime, zvtReport,
  ZVT_TABLE1, ZVT_TABLE2, ZvtMode, ZvtResult,
  ZVT_DEFINITION, ZVT_RULES, ZVT_MAX_NORMAL,
} from '@/lib/gio/zvt-calc';
import exportZvtDocx from '@/lib/gio/zvtDocx';

const LS_KEY = 'sau-zvt-form';

const nowHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const toMins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const minutesUntil = (target: string) => {
  const d = new Date();
  const now = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
  let diff = toMins(target) - now;
  if (diff < -720) diff += 1440;
  return diff;
};

interface FormState {
  entryTime: string;
  temp: string;
  mode: ZvtMode;
  rescue: boolean;
  object: string;
  squad: string;
  commander: string;
  performer: string;
}

const loadForm = (): FormState => {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY) || '');
    return { entryTime: nowHHMM(), temp: '', mode: 'moving', rescue: false, object: '', squad: '', commander: '', performer: '', ...s };
  } catch {
    return { entryTime: nowHHMM(), temp: '', mode: 'moving', rescue: false, object: '', squad: '', commander: '', performer: '' };
  }
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
    {children}
  </label>
);

const inputCls = 'w-full rounded px-3 py-2 text-sm outline-none border border-border focus:border-primary transition-colors';
const inputStyle = { background: 'hsl(var(--input))', color: 'hsl(var(--foreground))' };

const Countdown: React.FC<{ label: string; target: string; tone: string }> = ({ label, target, tone }) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 15000);
    return () => clearInterval(id);
  }, []);
  const left = minutesUntil(target);
  const over = left <= 0;
  return (
    <div className="flex items-center justify-between text-xs px-3 py-2 rounded"
      style={{ background: over ? 'hsl(var(--danger) / 0.15)' : 'hsl(var(--muted))', color: over ? 'hsl(var(--danger))' : 'hsl(var(--foreground))' }}>
      <span>{label}</span>
      <span className="font-mono-tech font-semibold" style={{ color: over ? 'hsl(var(--danger))' : tone }}>
        {over ? 'время вышло' : `через ${minsToHHMM(left)}`}
      </span>
    </div>
  );
};

const ResultView: React.FC<{ r: ZvtResult }> = ({ r }) => {
  const turn = turnBackTime(r);
  const fwdPct = r.mode === 'moving' ? 33.33 : 100;
  return (
    <div className="flex flex-col gap-4">
      {r.rescueLimited && (
        <div className="flex items-start gap-2 p-3 rounded text-sm"
          style={{ background: 'hsl(var(--danger) / 0.15)', color: 'hsl(var(--danger))' }}>
          <Icon name="LifeBuoy" size={18} style={{ flexShrink: 0 }} />
          <span>Температура выше +{ZVT_MAX_NORMAL} °C: работы допускаются только для спасения людей и не более 10 минут.</span>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-lg p-3 border border-border" style={{ background: 'hsl(var(--card))' }}>
          <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Макс. время пребывания</div>
          <div className="text-2xl font-bold font-mono-tech" style={{ color: 'hsl(var(--primary))' }}>{Math.round(r.maxTotal)} мин</div>
          <div className="text-xs font-mono-tech" style={{ color: 'hsl(var(--muted-foreground))' }}>{minsToHHMM(r.maxTotal)}</div>
        </div>
        {r.mode === 'moving' && turn && (
          <div className="rounded-lg p-3 border" style={{ background: 'hsl(var(--warning) / 0.08)', borderColor: 'hsl(var(--warning) / 0.4)' }}>
            <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Поворот назад</div>
            <div className="text-2xl font-bold font-mono-tech" style={{ color: 'hsl(var(--warning))' }}>{turn}</div>
            <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>вперёд {Math.round(r.tForward)} мин</div>
          </div>
        )}
        <div className="rounded-lg p-3 border col-span-2 sm:col-span-1" style={{ background: 'hsl(var(--danger) / 0.08)', borderColor: 'hsl(var(--danger) / 0.4)' }}>
          <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Время выхода</div>
          <div className="text-2xl font-bold font-mono-tech" style={{ color: 'hsl(var(--danger))' }}>{r.exitTime}</div>
          <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {r.mode === 'moving' ? `обратно ${Math.round(r.tBack)} мин` : `работа ${Math.round(r.tWork)} мин`}
          </div>
        </div>
      </div>

      <div>
        <div className="flex h-7 rounded overflow-hidden text-xs font-medium">
          <div className="flex items-center justify-center" style={{ width: `${fwdPct}%`, background: 'hsl(var(--warning))', color: 'hsl(var(--primary-foreground))' }}>
            {r.mode === 'moving' ? 'Вперёд 1/3' : 'Работа на месте'}
          </div>
          {r.mode === 'moving' && (
            <div className="flex items-center justify-center flex-1" style={{ background: 'hsl(var(--safe))', color: 'hsl(var(--primary-foreground))' }}>
              Обратный путь 2/3
            </div>
          )}
        </div>
        <div className="flex justify-between text-xs font-mono-tech mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <span>{r.entryTime}</span>
          {turn && <span>{turn}</span>}
          <span>{r.exitTime}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {turn && <Countdown label="До поворота назад" target={turn} tone="hsl(var(--warning))" />}
        <Countdown label="До выхода из ЗВТ" target={r.exitTime} tone="hsl(var(--danger))" />
      </div>
    </div>
  );
};

const ZvtCalculator: React.FC = () => {
  const [form, setForm] = useState<FormState>(loadForm);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(form));
  }, [form]);

  const tempNum = parseFloat(form.temp.replace(',', '.'));
  const result = useMemo(() => {
    if (form.temp.trim() === '' || isNaN(tempNum)) return null;
    return calcZVT(form.entryTime, tempNum, form.mode, form.rescue);
  }, [form.entryTime, form.mode, form.rescue, form.temp, tempNum]);

  const ok = result && !isZvtError(result) ? result : null;

  const copyReport = async () => {
    if (!ok) return;
    await navigator.clipboard.writeText(zvtReport(ok, form.object, form.performer, form.squad, form.commander));
    toast.success('Отчёт скопирован');
  };

  const wordReport = async () => {
    if (!ok) return;
    try {
      await exportZvtDocx(ok, { object: form.object, squad: form.squad, commander: form.commander, performer: form.performer });
      toast.success('Документ Word сохранён');
    } catch {
      toast.error('Не удалось сформировать документ Word');
    }
  };

  const printReport = () => {
    if (!ok) return;
    const text = zvtReport(ok, form.object, form.performer, form.squad, form.commander).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const w = window.open('', '_blank', 'width=700,height=800');
    if (!w) return;
    w.document.write(`<html><head><title>Расчёт ЗВТ</title><style>body{font-family:Arial,sans-serif;padding:32px;font-size:14px;line-height:1.6}pre{font-family:inherit;white-space:pre-wrap}</style></head><body><pre>${text}</pre><script>window.onload=()=>{window.print()}</script></body></html>`);
    w.document.close();
  };

  const activeT1 = ok && !ok.rescueLimited && tempNum > 0 ? tempNum : null;
  const activeT2 = ok && tempNum <= 0 ? ZVT_TABLE2.findIndex(r => (tempNum > r.min && tempNum <= r.max) || (tempNum === -20 && r.min === -20)) : -1;

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-5">
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4" style={{ background: 'hsl(var(--card))' }}>
        <div className="text-sm font-semibold flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
          <Icon name="ClipboardList" size={16} />
          Исходные данные
        </div>

        <Field label="Время входа в ЗВТ">
          <div className="flex gap-2">
            <input type="time" className={inputCls} style={inputStyle} value={form.entryTime} onChange={e => set('entryTime', e.target.value)} />
            <button className="px-3 rounded text-xs border border-border whitespace-nowrap hover:border-primary transition-colors"
              style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}
              onClick={() => set('entryTime', nowHHMM())}>
              Сейчас
            </button>
          </div>
        </Field>

        <Field label="Температура воздуха в ЗВТ, °C">
          <input type="number" step="0.1" inputMode="decimal" placeholder="например, 32" className={inputCls} style={inputStyle}
            value={form.temp} onChange={e => set('temp', e.target.value)} />
        </Field>

        <Field label="Режим">
          <div className="grid grid-cols-2 gap-2">
            {([['moving', 'Передвижение', 'Footprints'], ['stationary', 'На одном месте', 'Hammer']] as const).map(([m, label, icon]) => (
              <button key={m}
                className="flex items-center justify-center gap-1.5 py-2 rounded text-xs font-medium border transition-colors"
                style={form.mode === m
                  ? { background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', borderColor: 'hsl(var(--primary))' }
                  : { background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', borderColor: 'hsl(var(--border))' }}
                onClick={() => set('mode', m)}>
                <Icon name={icon} size={14} />
                {label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Цель работ">
          <div className="grid grid-cols-2 gap-2">
            {([[false, 'Прочие работы', 'HardHat'], [true, 'Спасение людей', 'LifeBuoy']] as const).map(([v, label, icon]) => (
              <button key={String(v)}
                className="flex items-center justify-center gap-1.5 py-2 rounded text-xs font-medium border transition-colors"
                style={form.rescue === v
                  ? { background: v ? 'hsl(var(--danger))' : 'hsl(var(--primary))', color: v ? 'hsl(var(--destructive-foreground))' : 'hsl(var(--primary-foreground))', borderColor: v ? 'hsl(var(--danger))' : 'hsl(var(--primary))' }
                  : { background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', borderColor: 'hsl(var(--border))' }}
                onClick={() => set('rescue', v)}>
                <Icon name={icon} size={14} />
                {label}
              </button>
            ))}
          </div>
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            При +41…+50 °C работы допускаются только для спасения людей — не более 10 минут
          </span>
        </Field>

        <Field label="Объект (для отчёта)">
          <input className={inputCls} style={inputStyle} value={form.object} onChange={e => set('object', e.target.value)} placeholder="необязательно" />
        </Field>
        <div className="grid grid-cols-[110px_1fr] gap-2">
          <Field label="Отделение №">
            <input className={inputCls} style={inputStyle} value={form.squad} onChange={e => set('squad', e.target.value)} placeholder="№" />
          </Field>
          <Field label="Командир отделения">
            <input className={inputCls} style={inputStyle} value={form.commander} onChange={e => set('commander', e.target.value)} placeholder="ФИО" />
          </Field>
        </div>
        <Field label="Расчёт выполнил">
          <input className={inputCls} style={inputStyle} value={form.performer} onChange={e => set('performer', e.target.value)} placeholder="необязательно" />
        </Field>

        <div className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {ZVT_DEFINITION}
        </div>
        <div className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Приказ Ростехнадзора от 11.12.2020 №520, Приложение 6. При передвижении 1/3 времени — вперёд, 2/3 — обратный путь (п. 12).
        </div>
      </div>

      <div className="flex flex-col gap-5 min-w-0">
        <div className="flex items-start gap-2.5 p-3 rounded-lg border text-sm"
          style={{ background: 'hsl(var(--danger) / 0.1)', borderColor: 'hsl(var(--danger) / 0.4)', color: 'hsl(var(--foreground))' }}>
          <Icon name="TriangleAlert" size={18} style={{ color: 'hsl(var(--danger))', flexShrink: 0, marginTop: 1 }} />
          <span>{ZVT_RULES[2]}</span>
        </div>

        <div className="rounded-lg border border-border p-4" style={{ background: 'hsl(var(--card))' }}>
          <div className="flex items-center justify-between mb-4 gap-2">
            <div className="text-sm font-semibold flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <Icon name="Timer" size={16} />
              Результат
            </div>
            {ok && (
              <div className="flex gap-2">
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

          {!result && (
            <div className="text-sm py-8 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Введите температуру воздуха, чтобы получить расчёт
            </div>
          )}
          {result && isZvtError(result) && (
            <div className="flex items-start gap-2 p-3 rounded text-sm"
              style={result.error === 'forbidden'
                ? { background: 'hsl(var(--danger) / 0.15)', color: 'hsl(var(--danger))' }
                : { background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}>
              <Icon name={result.error === 'forbidden' ? 'OctagonAlert' : 'Info'} size={18} />
              <span>{result.message}</span>
            </div>
          )}
          {ok && <ResultView r={ok} />}
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-lg border border-border overflow-hidden" style={{ background: 'hsl(var(--card))' }}>
            <div className="text-xs font-semibold px-3 py-2 border-b border-border" style={{ color: 'hsl(var(--foreground))' }}>
              Таблица №1 — выше 0 °C, мин
            </div>
            <table className="w-full text-xs font-mono-tech">
              <thead>
                <tr style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <th className="text-left px-3 py-1.5 font-medium">t, °C</th>
                  <th className="text-right px-3 py-1.5 font-medium">на месте</th>
                  <th className="text-right px-3 py-1.5 font-medium">передвиж.</th>
                </tr>
              </thead>
              <tbody>
                {ZVT_TABLE1.map((row, i) => {
                  const next = ZVT_TABLE1[i + 1];
                  const hit = activeT1 !== null && (row.temp === activeT1 || (activeT1 > row.temp && next && activeT1 < next.temp));
                  return (
                    <tr key={row.temp} style={hit ? { background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' } : { color: 'hsl(var(--foreground))' }}>
                      <td className="px-3 py-1">{row.temp}</td>
                      <td className="text-right px-3 py-1">{row.stationary}</td>
                      <td className="text-right px-3 py-1">{row.moving}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-border overflow-hidden self-start" style={{ background: 'hsl(var(--card))' }}>
            <div className="text-xs font-semibold px-3 py-2 border-b border-border" style={{ color: 'hsl(var(--foreground))' }}>
              Таблица №2 — 0 °C и ниже, мин
            </div>
            <table className="w-full text-xs font-mono-tech">
              <thead>
                <tr style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <th className="text-left px-3 py-1.5 font-medium">t, °C</th>
                  <th className="text-right px-3 py-1.5 font-medium">на месте</th>
                  <th className="text-right px-3 py-1.5 font-medium">передвиж.</th>
                </tr>
              </thead>
              <tbody>
                {ZVT_TABLE2.map((row, i) => (
                  <tr key={row.label} style={i === activeT2 ? { background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' } : { color: 'hsl(var(--foreground))' }}>
                    <td className="px-3 py-1">{row.label}</td>
                    <td className="text-right px-3 py-1">{row.stationary}</td>
                    <td className="text-right px-3 py-1">{row.moving}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-xs px-3 py-2 border-t border-border" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Между строками таблицы №1 — линейная интерполяция.
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border p-4" style={{ background: 'hsl(var(--card))' }}>
          <div className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: 'hsl(var(--foreground))' }}>
            <Icon name="ShieldAlert" size={16} />
            Правила ведения горноспасательных работ в ЗВТ
          </div>
          <ul className="flex flex-col gap-2">
            {ZVT_RULES.map((rule, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>
                <span className="font-mono-tech font-semibold" style={{ color: 'hsl(var(--primary))' }}>{i + 1}.</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ZvtCalculator;
