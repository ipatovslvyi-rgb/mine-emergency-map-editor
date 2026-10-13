import React from 'react';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { publish, useOps } from '@/lib/ops/store';
import { OpPayload } from '@/lib/ops/types';

const SendButton: React.FC<{ payload: OpPayload | null }> = ({ payload }) => {
  const { session, online } = useOps();
  if (!session || session.role !== 'commander' || !session.active || !payload) return null;

  const send = () => {
    publish(payload);
    toast.success(online ? 'Расчёт передан на базу и КП' : 'Нет связи — расчёт сохранён и уйдёт автоматически');
  };

  return (
    <button onClick={send}
      className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-bold"
      style={{ background: 'hsl(var(--safe))', color: 'hsl(var(--primary-foreground))' }}
      title={`Передать расчёт в операцию ${session.code}`}>
      <Icon name="Send" size={13} /> Передать
    </button>
  );
};

export default SendButton;
