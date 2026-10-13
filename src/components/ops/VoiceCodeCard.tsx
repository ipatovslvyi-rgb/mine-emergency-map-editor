import React from 'react';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { spokenCode } from '@/lib/gio/voiceCode';

const VoiceCodeCard: React.FC<{ code: string }> = ({ code }) => {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Код скопирован');
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  return (
    <div className="rounded-lg border-2 border-dashed p-3 flex flex-wrap items-center gap-x-4 gap-y-2"
      style={{ borderColor: 'hsl(var(--primary) / 0.5)', background: 'hsl(var(--primary) / 0.06)' }}>
      <div className="flex items-center gap-2">
        <Icon name="Mic" size={18} style={{ color: 'hsl(var(--primary))' }} />
        <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Код для передачи голосом</span>
      </div>
      <button onClick={copy} title="Скопировать код"
        className="text-2xl sm:text-3xl font-black font-mono-tech tracking-wide select-all"
        style={{ color: 'hsl(var(--primary))' }}>
        {code}
      </button>
      <div className="w-full text-xs" style={{ color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
        Диктовать: <span style={{ color: 'hsl(var(--foreground))' }}>{spokenCode(code)}</span>. На базе или КП: «Операция» → «Ввести код расчёта».
      </div>
    </div>
  );
};

export default VoiceCodeCard;
