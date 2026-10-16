import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { DaRoute } from '@/lib/gio/da-calc';
import {
  addReading, dismissAlert, fmtClock, fmtLeft, markReturning, startTimer, stopTimer, timerCalc, timerInput, updateTimer, useDaTimer,
} from '@/lib/gio/daTimer';
import { unlockAudio } from '@/lib/ops/store';
import SendButton from '@/components/ops/SendButton';
import { keepAwake, useWakeLockMode } from '@/lib/wakeLock';

const btn2 = { background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' };
const inputStyle = { background: 'hsl(var(--input))', color: 'hsl(var(--foreground))' };
const INTERVALS = [5, 10, 15];
const WARNS = [5, 10];

const num = (s: string) => {
  const v = parseFloat(s.replace(',', '.'));
  return isNaN(v) ? null : v;
};

const ALERT_TEXT = {
  remind: { title: 'Снять показания манометра', text: 'Уточните давление по респираторщику с максимальным расходом (п. 23) и введите его.', icon: 'Gauge', danger: false },
  warn: { title: 'Скоро поворот', text: 'До расчётного времени поворота осталось мало. Подготовить отделение к возвращению.', icon: 'AlarmClock', danger: true },
  turn: { title: 'ПОВОРОТ НАЗАД', text: 'Расчётное давление поворота достигнуто. Прекратить движение вперёд, доложить на ПБ и возвращаться.', icon: 'Undo2', danger: true },
  reserve: { title: 'РЕЗЕРВ', text: 'Давление достигло резерва 50 кгс/см². Немедленный выход на ПБ (Код 2, сообщение 2).', icon: 'OctagonX', danger: true },
};

/** Ввод показания манометра — крупные кнопки для работы в перчатках */
const ReadingInput: React.FC<{ suggest: number; big?: boolean; onDone?: () => void }> = ({ suggest, big, onDone }) => {
  const [v, setV] = useState('');
  const save = (p: number | null) => {
    if (p === null || p < 0 || p > 300) return toast.error('Давление — от 0 до 300 кгс/см²');
    addReading(p);
    setV('');
    onDone?.();
  };
  const s = Math.round(suggest / 5) * 5;
  const quick = [s + 10, s + 5, s, s - 5, s - 10].filter(x => x > 0 && x <= 300);
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-5 gap-1.5">
        {quick.map(q => (
          <button key={q} onClick={() => save(q)}
            className={`rounded font-bold font-mono-tech border border-border hover:border-primary ${big ? 'py-3.5 text-lg' : 'py-2.5 text-base'}`} style={btn2}>{q}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={v} onChange={e => setV(e.target.value)} onKeyDown={e => e.key === 'Enter' && save(num(v))} inputMode="decimal" placeholder="точное значение"
          className="flex-1 min-w-0 rounded px-3 py-2.5 text-base font-mono-tech outline-none border border-border focus:border-primary" style={inputStyle} />
        <button onClick={() => save(num(v))} disabled={!v}
          className="px-4 rounded font-semibold text-sm disabled:opacity-50 flex items-center gap-1.5"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
          <Icon name="Check" size={16} /> Записать
        </button>
      </div>
    </div>
  );
};

/** Полноэкранное оповещение таймера (видно на любой вкладке ГИО) */
export const DaTimerAlertOverlay: React.FC = () => {
  const { state, alert } = useDaTimer();
  if (!state || !alert) return null;
  const a = ALERT_TEXT[alert.kind];
  const c = timerCalc(state);
  const color = a.danger ? 'hsl(var(--danger))' : 'hsl(var(--primary))';
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3" style={{ background: 'hsl(0 0% 0% / 0.6)' }}>
      <div className={`w-full max-w-md rounded-xl border-4 p-4 flex flex-col gap-3 ${a.danger ? 'da-alarm' : ''}`} style={{ borderColor: color, background: 'hsl(var(--card))' }}>
        <div className="flex items-center gap-3">
          <Icon name={a.icon} size={40} style={{ color, flexShrink: 0 }} />
          <div>
            <div className="text-2xl font-black" style={{ color }}>{a.title}</div>
            <div className="text-sm" style={{ lineHeight: 1.45 }}>{a.text}</div>
          </div>
        </div>
        {c && (
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded p-2 border border-border"><div style={{ color: 'hsl(var(--muted-foreground))' }}>Поворот при</div><b className="text-base font-mono-tech">{Math.round(c.turnPressure * 10) / 10}</b></div>
            <div className="rounded p-2 border border-border"><div style={{ color: 'hsl(var(--muted-foreground))' }}>Последнее</div><b className="text-base font-mono-tech">{c.current}</b></div>
            <div className="rounded p-2 border border-border"><div style={{ color: 'hsl(var(--muted-foreground))' }}>Выход до</div><b className="text-base font-mono-tech">{fmtClock(c.exitAt)}</b></div>
          </div>
        )}
        {alert.kind === 'remind' && c && <ReadingInput suggest={c.estNow} big />}
        <div className="flex gap-2">
          {(alert.kind === 'turn' || alert.kind === 'warn' || alert.kind === 'reserve') && !state.returning && (
            <button onClick={markReturning} className="flex-1 py-3 rounded font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: 'hsl(var(--danger))', color: '#fff', minHeight: 52 }}>
              <Icon name="Undo2" size={18} /> Возвращаемся
            </button>
          )}
          <button onClick={dismissAlert} className="flex-1 py-3 rounded font-semibold text-sm border border-border" style={{ ...btn2, minHeight: 52 }}>
            {alert.kind === 'remind' ? 'Позже' : 'Понятно'}
          </button>
        </div>
      </div>
    </div>
  );
};

/** Компактная полоска таймера над содержимым всех вкладок ГИО */
export const DaTimerBar: React.FC = () => {
  const { state, now } = useDaTimer();
  const navigate = useNavigate();
  if (!state) return null;
  const c = timerCalc(state, now);
  const toTurn = c ? c.turnAt - now : 0;
  const red = state.returning || (c && toTurn <= state.warnMin * 60000);
  const color = red ? 'hsl(var(--danger))' : 'hsl(var(--primary))';
  return (
    <button onClick={() => navigate('/gio/da')} className="w-full mb-3 flex items-center gap-3 text-xs px-3 py-2 rounded border-2 text-left"
      style={{ background: 'hsl(var(--card))', borderColor: color }}>
      <Icon name="Timer" size={18} style={{ color }} />
      <span>В ДА <b className="font-mono-tech">{fmtLeft(now - state.startedAt)}</b></span>
      {c && !state.returning && <span>до поворота <b className="font-mono-tech" style={{ color }}>{fmtLeft(toTurn)}</b></span>}
      {c && state.returning && <b style={{ color }}>ВОЗВРАЩЕНИЕ · выход до {fmtClock(c.exitAt)}</b>}
      {c && <span className="ml-auto hidden sm:inline" style={{ color: 'hsl(var(--muted-foreground))' }}>замер через {fmtLeft(Math.max(0, c.nextRemindAt - now))}</span>}
    </button>
  );
};

/** Состояние удержания экрана */
const WakeBadge: React.FC = () => {
  const mode = useWakeLockMode();
  const ok = mode === 'native' || mode === 'video';
  return (
    <button onClick={() => keepAwake(true)} disabled={ok}
      className="flex items-center gap-2 text-xs rounded px-3 py-2 border text-left w-full"
      style={{ borderColor: ok ? 'hsl(var(--safe) / 0.5)' : 'hsl(var(--warning))', background: ok ? 'hsl(var(--safe) / 0.08)' : 'hsl(var(--warning) / 0.1)' }}>
      <Icon name={ok ? 'SunMedium' : 'MoonStar'} size={16} style={{ color: ok ? 'hsl(var(--safe))' : 'hsl(var(--warning))', flexShrink: 0 }} />
      {ok
        ? <span>Экран не гаснет, пока работает таймер. После остановки — как обычно.</span>
        : <span><b>Экран может погаснуть.</b> Нажмите здесь, чтобы не давать ему гаснуть. Если не помогает — увеличьте время отключения экрана в настройках телефона.</span>}
    </button>
  );
};

/** Блок таймера на странице «Давление ДА» */
const DaTimerPanel: React.FC<{ pmin: number | null; route: DaRoute; transport: boolean; member?: string; meta: { object?: string; place?: string; performer?: string } }> = ({ pmin, route, transport, member, meta }) => {
  const { state, now } = useDaTimer();
  const [interval, setIntervalMin] = useState(10);
  const [warn, setWarn] = useState(5);

  if (!state) {
    return (
      <div className="rounded-lg border-2 border-dashed p-4 flex flex-col gap-3" style={{ borderColor: 'hsl(var(--primary) / 0.5)', background: 'hsl(var(--primary) / 0.05)' }}>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Icon name="Timer" size={18} style={{ color: 'hsl(var(--primary))' }} /> Таймер командира
        </div>
        <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
          Запустите в момент включения в ДА. Таймер напомнит снять показания манометра, предупредит перед поворотом и подаст сирену в расчётное время поворота. Пока таймер работает, экран телефона не гаснет. Работает без связи и на любой вкладке ГИО.
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>Напоминать о замере</span>
            <div className="flex gap-1">
              {INTERVALS.map(i => (
                <button key={i} onClick={() => setIntervalMin(i)} className="flex-1 py-2 rounded text-xs font-semibold border"
                  style={interval === i ? { background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', borderColor: 'hsl(var(--primary))' } : { ...btn2, borderColor: 'hsl(var(--border))' }}>{i} мин</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>Предупредить до поворота</span>
            <div className="flex gap-1">
              {WARNS.map(i => (
                <button key={i} onClick={() => setWarn(i)} className="flex-1 py-2 rounded text-xs font-semibold border"
                  style={warn === i ? { background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', borderColor: 'hsl(var(--primary))' } : { ...btn2, borderColor: 'hsl(var(--border))' }}>за {i} мин</button>
              ))}
            </div>
          </div>
        </div>
        <button disabled={!pmin || pmin <= 50}
          onClick={() => { unlockAudio(); startTimer({ pmin: pmin!, route, transport, intervalMin: interval, warnMin: warn, member }); toast.success('Таймер запущен'); }}
          className="py-3.5 rounded font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: 'hsl(var(--safe))', color: 'hsl(var(--primary-foreground))', minHeight: 56 }}>
          <Icon name="Play" size={20} /> Включились в ДА — старт
        </button>
        {(!pmin || pmin <= 50) && <div className="text-[11px] text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>Сначала введите показания манометров выше</div>}
      </div>
    );
  }

  const c = timerCalc(state, now);
  const toTurn = c ? c.turnAt - now : 0;
  const red = state.returning || (c && toTurn <= state.warnMin * 60000);
  const color = red ? 'hsl(var(--danger))' : 'hsl(var(--safe))';
  const payload = { type: 'da' as const, input: timerInput(state), meta };

  return (
    <div className="rounded-lg border-2 p-4 flex flex-col gap-4" style={{ borderColor: color, background: 'hsl(var(--card))' }}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: color }} />
        Таймер командира · включение в {fmtClock(state.startedAt)}
        <span className="ml-auto text-xs font-normal" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {state.route === 'third' ? '⅓ вперёд' : '½ вперёд'}{state.transport ? ' · транспорт' : ''}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg p-3 border border-border">
          <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>В аппарате</div>
          <div className="text-2xl font-black font-mono-tech">{fmtLeft(now - state.startedAt)}</div>
        </div>
        <div className="rounded-lg p-3 border-2" style={{ borderColor: color }}>
          <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{state.returning ? 'Возвращение' : 'До поворота'}</div>
          <div className="text-2xl font-black font-mono-tech" style={{ color }}>
            {state.returning ? 'НАЗАД' : c ? (toTurn <= 0 ? 'СЕЙЧАС' : fmtLeft(toTurn)) : '—'}
          </div>
          {c && !state.returning && <div className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>в {fmtClock(c.turnAt)}</div>}
        </div>
        <div className="rounded-lg p-3 border border-border">
          <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Выход на ПБ до</div>
          <div className="text-2xl font-black font-mono-tech">{c ? fmtClock(c.exitAt) : '—'}</div>
        </div>
        <div className="rounded-lg p-3 border border-border">
          <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Следующий замер</div>
          <div className="text-2xl font-black font-mono-tech">{c ? fmtLeft(Math.max(0, c.nextRemindAt - now)) : '—'}</div>
        </div>
      </div>

      {c && (
        <div className="text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono-tech" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <div>поворот при <b style={{ color: 'hsl(var(--foreground))' }}>{Math.round(c.turnPressure * 10) / 10}</b></div>
          <div>последнее <b style={{ color: 'hsl(var(--foreground))' }}>{c.current}</b></div>
          <div>сейчас ≈ <b style={{ color: 'hsl(var(--foreground))' }}>{Math.round(c.estNow)}</b></div>
          <div>расход <b style={{ color: 'hsl(var(--foreground))' }}>{c.rate.toFixed(2).replace('.', ',')}</b>/мин{c.rateKnown ? '' : ' (средн.)'}</div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <div className="text-xs font-semibold">Показание манометра сейчас, кгс/см²</div>
        <ReadingInput suggest={c?.estNow ?? state.pmin} />
      </div>

      {state.readings.length > 0 && (
        <div className="flex flex-wrap gap-1.5 text-xs font-mono-tech">
          {state.readings.map((r, i) => (
            <span key={i} className="px-2 py-1 rounded border border-border">{fmtClock(r.at)} — <b>{r.pressure}</b></span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Напоминать каждые</span>
        {INTERVALS.map(i => (
          <button key={i} onClick={() => updateTimer({ intervalMin: i })} className="px-2.5 py-1 rounded text-xs border"
            style={state.intervalMin === i ? { background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', borderColor: 'hsl(var(--primary))' } : { ...btn2, borderColor: 'hsl(var(--border))' }}>{i}</button>
        ))}
        <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>мин</span>
      </div>

      <div className="flex flex-wrap gap-2 justify-end">
        <SendButton payload={state.readings.length ? payload : null} />
        {!state.returning && (
          <button onClick={markReturning} className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-bold"
            style={{ background: 'hsl(var(--danger))', color: '#fff' }}>
            <Icon name="Undo2" size={15} /> Возвращаемся
          </button>
        )}
        <button onClick={() => { if (confirm('Остановить таймер? Отделение вышло на ПБ / выключилось из ДА.')) stopTimer(); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded text-sm border border-border hover:border-primary" style={btn2}>
          <Icon name="Square" size={14} /> Вышли на ПБ — стоп
        </button>
      </div>
      <WakeBadge />
      <div className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
        Не блокируйте телефон кнопкой: при заблокированном экране браузер может задержать звук. Таймер переживает перезапуск приложения.
      </div>
    </div>
  );
};

export default DaTimerPanel;
