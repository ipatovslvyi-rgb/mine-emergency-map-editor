import React from 'react';
import Icon from '@/components/ui/icon';
import { usePwa } from '@/lib/pwa';

const NetworkBadge: React.FC = () => {
  const { desktop, online, offlineReady } = usePwa();
  if (desktop) return null;

  const tone = online ? 'hsl(var(--safe))' : 'hsl(var(--warning))';
  const label = online ? (offlineReady ? 'Онлайн · готово офлайн' : 'Онлайн') : 'Без связи';
  const title = online
    ? offlineReady ? 'Программа сохранена в телефоне и будет работать без интернета' : 'Программа сохраняется для работы без интернета…'
    : 'Нет связи — расчёты работают, данные сохраняются в телефоне';

  return (
    <span className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full whitespace-nowrap"
      title={title}
      style={{ background: `${tone.replace(')', ' / 0.12)')}`, color: tone, border: `1px solid ${tone.replace(')', ' / 0.35)')}` }}>
      <Icon name={online ? 'Wifi' : 'WifiOff'} size={12} />
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
};

export default NetworkBadge;
