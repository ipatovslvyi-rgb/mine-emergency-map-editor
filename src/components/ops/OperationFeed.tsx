import React, { useState } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { clearVoiceEvents, dismissDanger, useOps } from '@/lib/ops/store';
import { encodePayload } from '@/lib/gio/voiceCode';
import { KIND_ICONS, KIND_LABELS } from '@/lib/ops/describe';
import { OpEvent } from '@/lib/ops/types';
import { ResultView } from '@/components/gio/ZvtCalculator';
import { TriangleChart } from '@/components/gio/TriangleCalculator';
import exportZvtDocx from '@/lib/gio/zvtDocx';
import { exportGasZoneDocx, exportVgschDocx } from '@/lib/gio/triangleDocx';
import { printGasZone, printVgsch } from '@/lib/gio/trianglePrint';

const fmtTime = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '');

const Detail: React.FC<{ ev: OpEvent }> = ({ ev }) => {
  const p = ev.payload;

  const word = async () => {
    try {
      if (p.type === 'zvt') await exportZvtDocx(p.result, p.meta);
      else if (p.type === 'vgsch') await exportVgschDocx(p.input, p.result, p.meta);
      else await exportGasZoneDocx(p.result, p.meta);
      toast.success('Документ Word сохранён');
    } catch {
      toast.error('Не удалось сформировать документ');
    }
  };

  const print = () => {
    if (p.type === 'vgsch') printVgsch(p.input, p.result, p.meta);
    else if (p.type === 'gas') printGasZone(p.result, p.meta);
  };

  return (
    <div className="flex flex-col gap-3 pt-3">
      {p.type === 'zvt' && <ResultView r={p.result} />}
      {p.type === 'vgsch' && (
        <>
          <div className="text-sm" style={{ lineHeight: 1.5 }}>{p.result.conclusion}</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono-tech">
            <div>C = <b>{p.result.C}%</b></div>
            <div>P_CH = <b>{p.result.pch}</b></div>
            <div>P_CO = <b>{p.result.pco}</b></div>
            <div>P_H = <b>{p.result.ph}</b></div>
          </div>
          <TriangleChart tri={p.result.tri} point={[p.result.C, p.result.o2]} explosive={p.result.isExplosive} />
        </>
      )}
      {p.type === 'gas' && <div className="text-sm" style={{ lineHeight: 1.5 }}>{p.result.conclusion}</div>}
      {(p.meta.object || p.meta.commander || p.meta.squad) && (
        <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {[p.meta.object, p.meta.squad && `отд. №${p.meta.squad}`, p.meta.commander].filter(Boolean).join(' · ')}
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <button onClick={word} className="flex items-center gap-1.5 px-3 py-2 rounded text-xs border border-border hover:border-primary"
          style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
          <Icon name="FileText" size={13} /> Word
        </button>
        {p.type !== 'zvt' && (
          <button onClick={print} className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
            <Icon name="Printer" size={13} /> Печать
          </button>
        )}
      </div>
    </div>
  );
};

const Row: React.FC<{ ev: OpEvent; open: boolean; onToggle: () => void; latest: boolean }> = ({ ev, open, onToggle, latest }) => {
  const c = ev.danger ? 'hsl(var(--danger))' : 'hsl(var(--safe))';
  return (
    <div className="rounded-lg border-2 p-3" style={{ borderColor: latest ? c : 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
      <button onClick={onToggle} className="w-full flex items-start gap-3 text-left">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${c.replace(')', ' / 0.15)')}`, color: c }}>
          <Icon name={ev.danger ? 'TriangleAlert' : KIND_ICONS[ev.kind]} size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold">{KIND_LABELS[ev.kind]}</span>
            <span className="text-xs font-mono-tech" style={{ color: 'hsl(var(--muted-foreground))' }}>{fmtTime(ev.created_at)}</span>
            {ev.voice && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1" style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>
                <Icon name="Mic" size={10} /> ГОЛОСОМ
              </span>
            )}
            {latest && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: c, color: 'hsl(var(--background))' }}>ПОСЛЕДНИЙ</span>}
            {ev.sent === false && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1" style={{ background: 'hsl(var(--warning) / 0.2)', color: 'hsl(var(--warning))' }}>
                <Icon name="Clock" size={10} /> НЕ ПЕРЕДАН
              </span>
            )}
          </div>
          <div className="text-sm mt-0.5" style={{ color: ev.danger ? c : 'hsl(var(--foreground))', fontWeight: ev.danger ? 600 : 400 }}>{ev.summary}</div>
          <div className="text-xs font-mono-tech mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{encodePayload(ev.payload)}</div>
        </div>
        <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={18} style={{ color: 'hsl(var(--muted-foreground))', flexShrink: 0 }} />
      </button>
      {open && <Detail ev={ev} />}
    </div>
  );
};

export const DangerAlert: React.FC = () => {
  const { lastDanger } = useOps();
  if (!lastDanger) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-50 p-3 animate-in slide-in-from-top" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
      <div className="max-w-2xl mx-auto rounded-lg p-4 flex items-start gap-3 shadow-2xl border-2"
        style={{ background: 'hsl(var(--danger))', color: 'hsl(var(--destructive-foreground))', borderColor: 'hsl(var(--destructive-foreground) / 0.4)' }}>
        <Icon name="Siren" size={32} className="animate-pulse flex-shrink-0" />
        <div className="flex-1">
          <div className="font-black text-lg">ОПАСНО · {KIND_LABELS[lastDanger.kind]}</div>
          <div className="text-sm mt-0.5" style={{ lineHeight: 1.45 }}>{lastDanger.summary}</div>
        </div>
        <button onClick={dismissDanger} className="px-4 py-3 rounded font-bold text-sm flex-shrink-0"
          style={{ background: 'hsl(var(--destructive-foreground))', color: 'hsl(var(--danger))' }}>
          Принято
        </button>
      </div>
    </div>
  );
};

const OperationFeed: React.FC = () => {
  const { events, session } = useOps();
  const sorted = [...events].reverse();
  const [openId, setOpenId] = useState<string | null>(null);
  const latestId = sorted[0]?.client_id;
  const effectiveOpen = openId ?? latestId ?? null;

  if (!session && !events.length) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold flex items-center gap-2">
          <Icon name="ListOrdered" size={16} /> Журнал расчётов
          <span className="text-xs font-normal" style={{ color: 'hsl(var(--muted-foreground))' }}>({events.length})</span>
        </div>
        {!session && (
          <button onClick={clearVoiceEvents} className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:text-foreground" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <Icon name="Trash2" size={12} /> Очистить
          </button>
        )}
      </div>
      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <Icon name={session?.role === 'commander' ? 'Send' : 'Radio'} size={32} className="mx-auto mb-2 opacity-50" />
          {session?.role === 'commander'
            ? 'Сделайте расчёт в ЗВТ или «Треугольнике» и нажмите «Передать»'
            : 'Ожидание расчётов от командира отделения…'}
        </div>
      ) : (
        sorted.map(ev => (
          <Row key={ev.client_id} ev={ev} latest={ev.client_id === latestId}
            open={effectiveOpen === ev.client_id}
            onToggle={() => setOpenId(effectiveOpen === ev.client_id ? '' : ev.client_id)} />
        ))
      )}
    </div>
  );
};

export default OperationFeed;
