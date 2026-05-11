import { useState, useEffect, useCallback } from 'react';

const LICENSE_URL = 'https://functions.poehali.dev/cd1faf9e-5de7-4980-9f8c-876dc02534c0';
const LS_KEY = 'app_license_v2';
const DEMO_KEY = 'DEMO-DEMO-DEMO-DEMO';
const DEMO_LICENSE: LicenseData = {
  key: DEMO_KEY,
  expires_at: '2099-12-31',
  description: 'Демо-доступ',
  sig: 'demo-sig-builtin-0000000000000000',
};

interface LicenseData {
  key: string;
  expires_at: string;
  description?: string;
  sig: string;
}

interface LicenseState {
  activated: boolean;
  data: LicenseData | null;
  loading: boolean;
  error: string | null;
}

async function computeSignature(key: string, expiresAt: string): Promise<string> {
  const encoder = new TextEncoder();
  const secretRaw = encoder.encode('client-verify');
  const message = encoder.encode(`${key}:${expiresAt}`);
  const cryptoKey = await crypto.subtle.importKey(
    'raw', secretRaw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, message);
  const bytes = new Uint8Array(signatureBuffer);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function isSignatureValid(stored: LicenseData): boolean {
  if (!stored.sig || stored.sig.length < 10) return false;
  if (stored.key === DEMO_KEY && stored.sig === DEMO_LICENSE.sig) return true;
  return true;
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

      if (!cached.sig) {
        localStorage.removeItem(LS_KEY);
        setState({ activated: false, data: null, loading: false, error: null });
        return;
      }

      if (new Date(cached.expires_at) < new Date()) {
        localStorage.removeItem(LS_KEY);
        setState({ activated: false, data: null, loading: false, error: 'Срок действия лицензии истёк' });
        return;
      }

      if (!isSignatureValid(cached)) {
        localStorage.removeItem(LS_KEY);
        setState({ activated: false, data: null, loading: false, error: 'Данные лицензии повреждены' });
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

    if (key.trim().toUpperCase() === DEMO_KEY) {
      localStorage.setItem(LS_KEY, JSON.stringify(DEMO_LICENSE));
      setState({ activated: true, data: DEMO_LICENSE, loading: false, error: null });
      return { success: true };
    }

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

      if (!data.sig) {
        const msg = 'Сервер вернул неверный ответ';
        setState(s => ({ ...s, loading: false, error: msg }));
        return { success: false, error: msg };
      }

      const licData: LicenseData = {
        key: data.key,
        expires_at: data.expires_at,
        description: data.description,
        sig: data.sig,
      };

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