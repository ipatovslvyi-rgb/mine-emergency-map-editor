import React, { useState } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import {
  apiReady, closeOperation, createOperation, joinOperation, leaveOperation, unlockAudio, useOps,
} from '@/lib/ops/store';
import { OpRole, ROLE_ICONS, ROLE_LABELS } from '@/lib/ops/types';

const inputCls = 'w-full rounded px-3 py-2 text-sm outline-none border border-border focus:border-primary transition-colors';
const inputStyle = { background: 'hsl(var(--input))', color: 'hsl(var(--foreground))' };

const RoleCard: React.FC<{ role: OpRole; active: boolean; onClick: () => void; desc: string }> = ({ role, active, onClick, desc }) => (
  <button onClick={onClick}
    className="flex items-center gap-3 text-left p-3 rounded-lg border-2 transition-colors min-h-[64px]"
    style={{
      borderColor: active ? 'hsl(var(--primary))' : 'hsl(var(--border))',
      background: active ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--card))',
    }}>
    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: active ? 'hsl(var(--primary))' : 'hsl(var(--secondary))', color: active ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))' }}>
      <Icon name={ROLE_ICONS[role]} size={20} />
    </div>
    <div>
      <div className="text-sm font-semibold">{ROLE_LABELS[role]}</div>
      <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{desc}</div>
    </div>
  </button>
);

const timeAgo = (iso: string | null) => {
  if (!iso) return '—';
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 10) return 'только что';
  if (s < 60) return `${s} с назад`;
  return `${Math.round(s / 60)} мин назад`;
};

export const OperationStatus: React.FC = () => {
  const { session, events, online, lastSync, error } = useOps();
  const [confirm, setConfirm] = useState(false);
  if (!session) return null;

  const pending = events.filter(e => !e.sent).length;
  const linked = online && !error;
  const tone = !session.active ? 'hsl(var(--muted-foreground))' : linked ? 'hsl(var(--safe))' : 'hsl(var(--warning))';

  const finish = async () => {
    try {
      await closeOperation();
      toast.success(session.role === 'commander' ? 'Операция завершена' : 'Вы отключились от операции');
    } catch (e) {
      toast.error((e as Error).message);
    }
    setConfirm(false);
  };

  return (
    <div className="rounded-lg border-2 p-3 flex flex-wrap items-center gap-x-4 gap-y-2" style={{ borderColor: tone, background: 'hsl(var(--card))' }}>
      <div className="flex items-center gap-2">
        <Icon name={ROLE_ICONS[session.role]} size={20} style={{ color: 'hsl(var(--primary))' }} />
        <div>
          <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{ROLE_LABELS[session.role]}</div>
          <div className="text-sm font-semibold">{session.title || 'Операция'}</div>
        </div>
      </div>
      <div>
        <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Код</div>
        <div className="text-2xl font-black font-mono-tech tracking-[0.2em]" style={{ color: 'hsl(var(--primary))' }}>{session.code}</div>
      </div>
      <div className="flex items-center gap-1.5 text-xs" style={{ color: tone }}>
        <Icon name={!session.active ? 'CircleSlash' : linked ? 'Wifi' : 'WifiOff'} size={14} />
        {!session.active ? 'Операция завершена' : linked ? `Связь есть · ${timeAgo(lastSync)}` : 'Нет связи — данные сохраняются'}
      </div>
      {session.role === 'commander' && pending > 0 && (
        <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded" style={{ background: 'hsl(var(--warning) / 0.15)', color: 'hsl(var(--warning))' }}>
          <Icon name="CloudUpload" size={14} /> Не передано: {pending}
        </div>
      )}
      <div className="ml-auto flex gap-2">
        {confirm ? (
          <>
            <button onClick={finish} className="px-3 py-2 rounded text-xs font-semibold"
              style={{ background: 'hsl(var(--danger))', color: 'hsl(var(--destructive-foreground))' }}>
              {session.role === 'commander' ? 'Да, завершить' : 'Да, выйти'}
            </button>
            <button onClick={() => setConfirm(false)} className="px-3 py-2 rounded text-xs border border-border"
              style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>Отмена</button>
          </>
        ) : (
          <button onClick={() => (session.active ? setConfirm(true) : leaveOperation())} className="flex items-center gap-1.5 px-3 py-2 rounded text-xs border border-border hover:border-primary"
            style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
            <Icon name="LogOut" size={13} />
            {session.role === 'commander' && session.active ? 'Завершить операцию' : 'Выйти'}
          </button>
        )}
      </div>
    </div>
  );
};

const OperationSetup: React.FC = () => {
  const [role, setRole] = useState<OpRole>('commander');
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const start = async () => {
    unlockAudio();
    setBusy(true);
    try {
      if (role === 'commander') {
        const c = await createOperation(title.trim());
        toast.success(`Операция создана. Код: ${c}`);
      } else {
        await joinOperation(code.trim(), role);
        toast.success('Подключено к операции');
      }
    } catch (e) {
      toast.error((e as Error).message === 'Failed to fetch' || (e as Error).name === 'AbortError' ? 'Нет связи с сервером' : (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const can = role === 'commander' || /^\d{4}$/.test(code.trim());

  return (
    <div className="grid lg:grid-cols-[1fr_1fr] gap-5">
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4" style={{ background: 'hsl(var(--card))' }}>
        <div className="text-sm font-semibold flex items-center gap-2">
          <Icon name="Users" size={16} /> Кто вы в этой операции?
        </div>
        <div className="flex flex-col gap-2">
          <RoleCard role="commander" active={role === 'commander'} onClick={() => setRole('commander')} desc="Делает расчёты и передаёт их" />
          <RoleCard role="base" active={role === 'base'} onClick={() => setRole('base')} desc="Получает расчёты командира" />
          <RoleCard role="kp" active={role === 'kp'} onClick={() => setRole('kp')} desc="Получает расчёты и ведёт журнал" />
        </div>

        {role === 'commander' ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Название операции (необязательно)</span>
            <input className={inputCls} style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="Например: шахта Северная, пожар в лаве 12" />
          </label>
        ) : (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Код операции от командира</span>
            <input className={`${inputCls} font-mono-tech text-center text-3xl tracking-[0.5em]`} style={{ ...inputStyle, minHeight: 64 }}
              inputMode="numeric" maxLength={4} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} placeholder="0000" />
          </label>
        )}

        <button disabled={!can || busy || !apiReady()} onClick={start}
          className="flex items-center justify-center gap-2 py-3 rounded font-semibold text-base transition-opacity disabled:opacity-50"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', minHeight: 52 }}>
          <Icon name={busy ? 'Loader2' : role === 'commander' ? 'Play' : 'LogIn'} size={18} className={busy ? 'animate-spin' : ''} />
          {role === 'commander' ? 'Начать операцию' : 'Подключиться'}
        </button>
        {!apiReady() && (
          <div className="text-xs" style={{ color: 'hsl(var(--warning))' }}>Сервер связи ещё подключается — попробуйте через пару минут.</div>
        )}
      </div>

      <div className="rounded-lg border border-border p-4 text-sm flex flex-col gap-3" style={{ background: 'hsl(var(--card))', lineHeight: 1.55 }}>
        <div className="font-semibold flex items-center gap-2"><Icon name="Info" size={16} /> Как это работает</div>
        <ol className="flex flex-col gap-2 list-decimal pl-5" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <li><b style={{ color: 'hsl(var(--foreground))' }}>Командир</b> нажимает «Начать операцию» и получает код из 4 цифр.</li>
          <li><b style={{ color: 'hsl(var(--foreground))' }}>Подземная база</b> и <b style={{ color: 'hsl(var(--foreground))' }}>командный пункт</b> вводят этот код у себя.</li>
          <li>Командир делает расчёт (ЗВТ, «Треугольник», пожарная нагрузка) и нажимает <b style={{ color: 'hsl(var(--foreground))' }}>«Передать»</b>.</li>
          <li>Расчёт появляется на двух других устройствах через несколько секунд. Опасный результат — со звуком и вибрацией.</li>
        </ol>
        <div className="flex gap-2 items-start text-xs rounded p-3" style={{ background: 'hsl(var(--warning) / 0.1)' }}>
          <Icon name="WifiOff" size={16} style={{ color: 'hsl(var(--warning))', flexShrink: 0 }} />
          <span>Нет связи — расчёт сохранится у командира и отправится сам, когда связь появится.</span>
        </div>
      </div>
    </div>
  );
};

export default OperationSetup;
