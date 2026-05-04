import React, { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';

const ADMIN_URL = 'https://functions.poehali.dev/161f4998-5b86-44ff-833f-3614907240b8';

interface LicenseKey {
  id: number;
  key: string;
  description: string;
  expires_at: string;
  created_at: string;
  is_active: boolean;
  expired: boolean;
}

const AdminLicensePage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [loading, setLoading] = useState(false);

  const [newKey, setNewKey] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newExpires, setNewExpires] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const apiCall = useCallback(async (body?: object, method = 'GET') => {
    const res = await fetch(ADMIN_URL, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': password },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, data: await res.json() };
  }, [password]);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    const { status, data } = await apiCall();
    setLoading(false);
    if (status === 401) { setAuthed(false); setAuthError('Неверный пароль'); return; }
    setKeys(data.keys || []);
  }, [apiCall]);

  const handleLogin = async () => {
    setAuthError('');
    setLoading(true);
    const res = await fetch(ADMIN_URL, {
      method: 'GET',
      headers: { 'X-Admin-Token': password },
    });
    setLoading(false);
    if (res.status === 401) { setAuthError('Неверный пароль'); return; }
    const data = await res.json();
    setKeys(data.keys || []);
    setAuthed(true);
  };

  const handleCreate = async () => {
    if (!newKey.trim() || !newExpires) return;
    setCreating(true);
    setCreateError('');
    const { status, data } = await apiCall({ action: 'create', key: newKey.trim().toUpperCase(), description: newDesc, expires_at: newExpires }, 'POST');
    setCreating(false);
    if (status === 409) { setCreateError('Такой ключ уже существует'); return; }
    if (status !== 200) { setCreateError(data.error || 'Ошибка'); return; }
    setNewKey(''); setNewDesc(''); setNewExpires('');
    loadKeys();
  };

  const handleToggle = async (id: number) => {
    await apiCall({ action: 'toggle', id }, 'POST');
    loadKeys();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить ключ?')) return;
    await apiCall({ action: 'delete', id }, 'POST');
    loadKeys();
  };

  const genKey = () => {
    const part = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    setNewKey(`${part()}-${part()}-${part()}-${part()}`);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (!authed) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-6" style={{ background: 'hsl(var(--background))' }}>
        <div className="w-full max-w-sm rounded-xl border border-border p-6 space-y-4" style={{ background: 'hsl(var(--card))' }}>
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Icon name="ShieldCheck" size={18} style={{ color: 'hsl(var(--primary))' }} />
            Вход в панель администратора
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full rounded-lg px-3 py-2.5 text-sm border border-border focus:outline-none focus:border-primary"
              style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
              placeholder="Введите пароль"
              autoFocus
            />
          </div>
          {authError && (
            <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))' }}>
              {authError}
            </div>
          )}
          <button
            onClick={handleLogin}
            disabled={loading || !password}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            {loading ? <Icon name="Loader2" size={14} className="animate-spin" /> : null}
            Войти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: 'hsl(var(--background))' }}>
      <div className="flex items-center gap-2">
        <Icon name="ShieldCheck" size={18} style={{ color: 'hsl(var(--primary))' }} />
        <span className="font-semibold text-sm">Управление лицензиями</span>
        <button onClick={loadKeys} className="ml-auto" title="Обновить">
          <Icon name="RefreshCw" size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
        </button>
      </div>

      {/* Форма создания */}
      <div className="rounded-xl border border-border p-4 space-y-3" style={{ background: 'hsl(var(--card))' }}>
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Новый ключ</div>
        <div className="flex gap-2">
          <input
            value={newKey}
            onChange={e => setNewKey(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            className="flex-1 rounded-lg px-3 py-2 text-sm font-mono border border-border focus:outline-none focus:border-primary"
            style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
          />
          <button
            onClick={genKey}
            className="px-3 py-2 rounded-lg text-xs border border-border"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            title="Сгенерировать"
          >
            <Icon name="Wand2" size={14} />
          </button>
        </div>
        <input
          value={newDesc}
          onChange={e => setNewDesc(e.target.value)}
          placeholder="Описание (организация, пользователь...)"
          className="w-full rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:border-primary"
          style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
        />
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Срок действия до</label>
            <input
              type="date"
              value={newExpires}
              onChange={e => setNewExpires(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:border-primary"
              style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !newKey.trim() || !newExpires}
            className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            {creating ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Plus" size={13} />}
            Создать
          </button>
        </div>
        {createError && (
          <div className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))' }}>
            {createError}
          </div>
        )}
      </div>

      {/* Список ключей */}
      <div className="space-y-2">
        {loading && (
          <div className="text-center py-8 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <Icon name="Loader2" size={20} className="animate-spin mx-auto mb-2" />
            Загрузка...
          </div>
        )}
        {!loading && keys.length === 0 && (
          <div className="text-center py-8 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Ключей пока нет
          </div>
        )}
        {keys.map(k => (
          <div
            key={k.id}
            className="rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center gap-2"
            style={{
              background: 'hsl(var(--card))',
              borderColor: k.expired ? 'hsl(var(--destructive) / 0.3)' : k.is_active ? 'hsl(var(--border))' : 'hsl(var(--muted-foreground) / 0.2)',
              opacity: !k.is_active ? 0.6 : 1,
            }}
          >
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="font-mono text-sm font-semibold tracking-wider" style={{ color: 'hsl(var(--foreground))' }}>{k.key}</div>
              {k.description && <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{k.description}</div>}
              <div className="flex flex-wrap gap-2 text-xs">
                <span style={{ color: k.expired ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))' }}>
                  до {formatDate(k.expires_at)}
                  {k.expired && ' — истёк'}
                </span>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>создан {k.created_at}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: k.is_active && !k.expired ? 'hsl(var(--safe) / 0.15)' : 'hsl(var(--muted) / 0.5)',
                  color: k.is_active && !k.expired ? 'hsl(var(--safe))' : 'hsl(var(--muted-foreground))',
                }}
              >
                {k.is_active && !k.expired ? 'Активен' : k.expired ? 'Истёк' : 'Отключён'}
              </span>
              <button
                onClick={() => handleToggle(k.id)}
                className="p-1.5 rounded-lg border border-border hover:border-primary transition-colors"
                title={k.is_active ? 'Деактивировать' : 'Активировать'}
              >
                <Icon name={k.is_active ? 'Lock' : 'Unlock'} size={13} style={{ color: 'hsl(var(--muted-foreground))' }} />
              </button>
              <button
                onClick={() => handleDelete(k.id)}
                className="p-1.5 rounded-lg border border-border hover:border-destructive transition-colors"
                title="Удалить"
              >
                <Icon name="Trash2" size={13} style={{ color: 'hsl(var(--destructive))' }} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminLicensePage;
