import React, { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { decodeVoiceCode, GAS_LETTER_HINT, VOICE_FORMATS } from '@/lib/gio/voiceCode';
import { addVoiceEvent } from '@/lib/ops/store';
import { describePayload } from '@/lib/ops/describe';

const KEYS = ['Т', 'Г', 'З', 'ПТ', 'Л', 'Д', 'А', 'П', 'Н', 'С', 'М', 'В', 'У', 'Э', 'Х', ',', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

const VoiceCodeInput: React.FC<{ full?: boolean }> = ({ full }) => {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');

  const parsed = useMemo(() => (code.trim() ? decodeVoiceCode(code) : null), [code]);
  const preview = parsed?.ok ? describePayload(parsed.payload) : null;

  const add = () => {
    if (!parsed?.ok) return;
    addVoiceEvent(parsed.payload);
    toast.success('Расчёт по голосовому коду добавлен в журнал');
    setCode('');
    setOpen(false);
  };

  const tap = (k: string) => setCode(c => {
    if (k === ',' || /^\d$/.test(k)) return c + k;
    const needDash = c && !c.endsWith('-');
    return c + (needDash ? '-' : '') + k + (!c && ['Т', 'Г', 'З', 'ПТ', 'Л', 'Д', 'А'].includes(k) ? '-' : '');
  });

  return (
    <>
      <button onClick={() => setOpen(true)}
        className={`flex items-center justify-center gap-2 rounded font-semibold text-sm border-2 border-dashed transition-colors hover:border-primary ${full ? 'w-full py-3' : 'px-4 py-2'}`}
        style={{ borderColor: 'hsl(var(--primary) / 0.5)', color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.06)', minHeight: 48 }}>
        <Icon name="Mic" size={18} /> Ввести код расчёта (голосом)
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="Mic" size={20} style={{ color: 'hsl(var(--primary))' }} />
              Код расчёта от командира
            </DialogTitle>
          </DialogHeader>

          <input autoFocus value={code} onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Т-8-1-0,5-12"
            className="w-full rounded px-3 py-3 text-2xl font-mono-tech font-bold text-center outline-none border-2 focus:border-primary"
            style={{ background: 'hsl(var(--input))', color: 'hsl(var(--foreground))', borderColor: parsed && !parsed.ok ? 'hsl(var(--danger))' : 'hsl(var(--border))' }} />

          <div className="grid grid-cols-7 gap-1.5">
            {KEYS.map(k => (
              <button key={k} onClick={() => tap(k)}
                className="py-2.5 rounded font-bold text-base border border-border hover:border-primary"
                style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', minHeight: 44 }}>{k}</button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => setCode(c => (c.endsWith('-') ? c : c + '-'))} className="flex-1 py-2 rounded font-bold border border-border"
              style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', minHeight: 44 }}>—</button>
            <button onClick={() => setCode(c => c.slice(0, -1))} className="flex-1 py-2 rounded border border-border flex items-center justify-center"
              style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', minHeight: 44 }}><Icon name="Delete" size={18} /></button>
            <button onClick={() => setCode('')} className="flex-1 py-2 rounded text-xs border border-border"
              style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', minHeight: 44 }}>Очистить</button>
          </div>

          {parsed && !parsed.ok && (
            <div className="text-xs rounded p-2" style={{ background: 'hsl(var(--danger) / 0.12)', color: 'hsl(var(--danger))' }}>{parsed.error}</div>
          )}
          {preview && (
            <div className="rounded p-3 border-2 text-sm" style={{ borderColor: preview.danger ? 'hsl(var(--danger))' : 'hsl(var(--safe))' }}>
              <div className="font-bold" style={{ color: preview.danger ? 'hsl(var(--danger))' : 'hsl(var(--safe))' }}>
                {preview.danger ? 'ОПАСНО' : 'Расчёт распознан'}
              </div>
              <div className="mt-0.5">{preview.summary}</div>
            </div>
          )}

          <button disabled={!parsed?.ok} onClick={add}
            className="w-full py-3 rounded font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', minHeight: 52 }}>
            <Icon name="Check" size={18} /> Показать расчёт
          </button>

          <div className="text-xs flex flex-col gap-1" style={{ color: 'hsl(var(--muted-foreground))', lineHeight: 1.45 }}>
            {VOICE_FORMATS.map(f => (
              <div key={f.code}><b className="font-mono-tech" style={{ color: 'hsl(var(--foreground))' }}>{f.code}</b> — {f.desc}</div>
            ))}
            <div>Газы: {GAS_LETTER_HINT}.</div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VoiceCodeInput;
