import React, { useState } from 'react';
import Icon from '@/components/ui/icon';
import { useLicenseContext } from '@/contexts/LicenseContext';

interface Props {
  onActivated: () => void;
  onBack: () => void;
}

const ActivatePage: React.FC<Props> = ({ onActivated, onBack }) => {
  const [key, setKey] = useState('');
  const { activate, loading, error, activated, data, deactivate } = useLicenseContext();
  const [success, setSuccess] = useState(false);

  const handleActivate = async () => {
    if (!key.trim()) return;
    const result = await activate(key);
    if (result.success) {
      setSuccess(true);
      setTimeout(onActivated, 1200);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const getDaysLeft = (d: string) => {
    const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    return days;
  };

  const formatDaysLeft = (days: number) => {
    if (days <= 0) return 'истёк';
    const word = days === 1 ? 'день' : days >= 2 && days <= 4 ? 'дня' : 'дней';
    return `ещё ${days} ${word}`;
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-6" style={{ background: 'hsl(var(--background))' }}>
      <div className="w-full max-w-md rounded-xl border border-border p-6 space-y-5" style={{ background: 'hsl(var(--card))' }}>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(var(--primary) / 0.15)' }}>
            <Icon name="KeyRound" size={20} style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <div>
            <div className="font-semibold text-sm">Активация лицензии</div>
            <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Введите ключ для разблокировки всех функций</div>
          </div>
        </div>

        <div
          className="rounded-lg px-3 py-2.5 flex items-start gap-2 cursor-pointer"
          style={{ background: 'hsl(var(--primary) / 0.08)', border: '1px dashed hsl(var(--primary) / 0.4)' }}
          onClick={() => setKey('DEMO-DEMO-DEMO-DEMO')}
        >
          <Icon name="Gift" size={14} style={{ color: 'hsl(var(--primary))', marginTop: 2, flexShrink: 0 }} />
          <div>
            <div className="text-xs font-semibold" style={{ color: 'hsl(var(--primary))' }}>Демо-доступ</div>
            <div className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Нажмите, чтобы вставить ключ: <span className="font-mono font-semibold">DEMO-DEMO-DEMO-DEMO</span>
            </div>
          </div>
        </div>

        {activated && data ? (
          <div className="space-y-4">
            <div className="rounded-lg p-4 space-y-2" style={{ background: 'hsl(var(--safe) / 0.1)', border: '1px solid hsl(var(--safe) / 0.3)' }}>
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'hsl(var(--safe))' }}>
                <Icon name="CheckCircle2" size={16} />
                Лицензия активна
              </div>
              <div className="text-xs space-y-1" style={{ color: 'hsl(var(--foreground))' }}>
                <div><span style={{ color: 'hsl(var(--muted-foreground))' }}>Ключ: </span>{data.key}</div>
                {data.description && <div><span style={{ color: 'hsl(var(--muted-foreground))' }}>Описание: </span>{data.description}</div>}
                <div><span style={{ color: 'hsl(var(--muted-foreground))' }}>Действует до: </span>{formatDate(data.expires_at)}</div>
                <div className="pt-1">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold"
                    style={{
                      background: getDaysLeft(data.expires_at) <= 7
                        ? 'hsl(var(--danger) / 0.15)'
                        : getDaysLeft(data.expires_at) <= 30
                          ? 'hsl(var(--warning) / 0.15)'
                          : 'hsl(var(--safe) / 0.15)',
                      color: getDaysLeft(data.expires_at) <= 7
                        ? 'hsl(var(--danger))'
                        : getDaysLeft(data.expires_at) <= 30
                          ? 'hsl(var(--warning))'
                          : 'hsl(var(--safe))',
                    }}
                  >
                    <Icon name="Clock" size={11} />
                    {formatDaysLeft(getDaysLeft(data.expires_at))}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onBack}
                className="flex-1 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                Продолжить работу
              </button>
              <button
                onClick={() => { deactivate(); setSuccess(false); setKey(''); }}
                className="px-3 py-2 rounded-lg text-xs"
                style={{ background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', border: '1px solid hsl(var(--destructive) / 0.3)' }}
              >
                Деактивировать
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Лицензионный ключ
              </label>
              <input
                type="text"
                value={key}
                onChange={e => setKey(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleActivate()}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="w-full rounded-lg px-3 py-2.5 text-sm font-mono tracking-wider border border-border focus:outline-none focus:border-primary transition-colors"
                style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
                disabled={loading || success}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2" style={{ background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', border: '1px solid hsl(var(--destructive) / 0.2)' }}>
                <Icon name="AlertCircle" size={13} />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2" style={{ background: 'hsl(var(--safe) / 0.1)', color: 'hsl(var(--safe))', border: '1px solid hsl(var(--safe) / 0.3)' }}>
                <Icon name="CheckCircle2" size={13} />
                Активировано! Переход...
              </div>
            )}

            <button
              onClick={handleActivate}
              disabled={!key.trim() || loading || success}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              {loading ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Unlock" size={15} />}
              {loading ? 'Проверка...' : 'Активировать'}
            </button>

            <a
              href="https://vk.me/+79625244698"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.3)' }}
            >
              <Icon name="MessageCircle" size={15} />
              Купить лицензию (написать в VK)
            </a>

            <button
              onClick={onBack}
              className="w-full py-2 rounded-lg text-xs"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              Продолжить в демо-режиме
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
        Демо-режим: просмотр без сохранения и экспорта
      </div>
    </div>
  );
};

export default ActivatePage;