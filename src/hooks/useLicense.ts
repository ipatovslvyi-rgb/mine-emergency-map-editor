import { useState, useEffect, useCallback } from 'react';

const LICENSE_URL = 'https://functions.poehali.dev/cd1faf9e-5de7-4980-9f8c-876dc02534c0';
const LS_KEY = 'app_license';

interface LicenseData {
  key: string;
  expires_at: string;
  description?: string;
}

interface LicenseState {
  activated: boolean;
  data: LicenseData | null;
  loading: boolean;
  error: string | null;
}

export function useLicense() {
  const [state, setState] = useState<LicenseState>({
    activated: false,
    data: null,
    loading: true,
    error: null,
  });

  const verifyStored = useCallback(async () => {
    const stored = localStorage.getItem(LS_KEY);
    if (!stored) {
      setState({ activated: false, data: null, loading: false, error: null });
      return;
    }
    try {
      const cached: LicenseData = JSON.parse(stored);
      if (new Date(cached.expires_at) < new Date()) {
        localStorage.removeItem(LS_KEY);
        setState({ activated: false, data: null, loading: false, error: 'Срок действия лицензии истёк' });
        return;
      }
      setState({ activated: true, data: cached, loading: false, error: null });
    } catch {
      localStorage.removeItem(LS_KEY);
      setState({ activated: false, data: null, loading: false, error: null });
    }
  }, []);

  useEffect(() => {
    verifyStored();
  }, [verifyStored]);

  const activate = useCallback(async (key: string): Promise<{ success: boolean; error?: string }> => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(LICENSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        const msg = data.error || 'Неверный ключ';
        setState(s => ({ ...s, loading: false, error: msg }));
        return { success: false, error: msg };
      }
      const licData: LicenseData = { key: data.key, expires_at: data.expires_at, description: data.description };
      localStorage.setItem(LS_KEY, JSON.stringify(licData));
      setState({ activated: true, data: licData, loading: false, error: null });
      return { success: true };
    } catch {
      const msg = 'Ошибка сети. Проверьте подключение.';
      setState(s => ({ ...s, loading: false, error: msg }));
      return { success: false, error: msg };
    }
  }, []);

  const deactivate = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    setState({ activated: false, data: null, loading: false, error: null });
  }, []);

  return { ...state, activate, deactivate };
}
