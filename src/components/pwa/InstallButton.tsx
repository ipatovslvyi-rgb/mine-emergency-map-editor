import React, { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { promptInstall, usePwa } from '@/lib/pwa';
import { toast } from 'sonner';

interface Props {
  compact?: boolean;
  className?: string;
}

const Step: React.FC<{ n: number; children: React.ReactNode }> = ({ n, children }) => (
  <li className="flex gap-3 items-start">
    <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
      style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>{n}</span>
    <span className="text-sm pt-1" style={{ lineHeight: 1.5 }}>{children}</span>
  </li>
);

const InstallButton: React.FC<Props> = ({ compact, className = '' }) => {
  const { desktop, installed, canPrompt, ios } = usePwa();
  const [open, setOpen] = useState(false);

  if (desktop || installed) return null;

  const onClick = async () => {
    if (canPrompt) {
      const ok = await promptInstall();
      if (ok) toast.success('Приложение САУ установлено');
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={onClick}
        title="Установить САУ на телефон или компьютер — работает без интернета"
        className={`flex items-center justify-center gap-2 rounded font-medium border transition-all hover:border-primary ${compact ? 'px-3 py-2 text-sm' : 'px-4 py-2.5 text-sm'} ${className}`}
        style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', borderColor: 'hsl(var(--border))' }}
      >
        <Icon name="Download" size={15} />
        {compact ? 'Установить' : 'Установить приложение'}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="Smartphone" size={20} style={{ color: 'hsl(var(--primary))' }} />
              Установка САУ
            </DialogTitle>
          </DialogHeader>
          {ios ? (
            <ol className="flex flex-col gap-3 mt-2">
              <Step n={1}>Откройте этот сайт в <b>Safari</b></Step>
              <Step n={2}>Нажмите кнопку <b>«Поделиться»</b> <Icon name="Share" size={14} className="inline -mt-1" /> внизу экрана</Step>
              <Step n={3}>Выберите <b>«На экран „Домой“»</b> и нажмите «Добавить»</Step>
            </ol>
          ) : (
            <ol className="flex flex-col gap-3 mt-2">
              <Step n={1}>Откройте этот сайт в <b>Chrome</b> или <b>Яндекс Браузере</b></Step>
              <Step n={2}>Нажмите меню <b>⋮</b> в правом верхнем углу</Step>
              <Step n={3}>Выберите <b>«Установить приложение»</b> или <b>«Добавить на главный экран»</b></Step>
            </ol>
          )}
          <div className="flex gap-2 items-start text-xs rounded p-3 mt-2"
            style={{ background: 'hsl(var(--safe) / 0.12)', color: 'hsl(var(--foreground))' }}>
            <Icon name="WifiOff" size={16} style={{ color: 'hsl(var(--safe))', flexShrink: 0 }} />
            <span>После первого открытия с интернетом расчёты ЗВТ и «Треугольник» работают <b>без связи</b> — в шахте сеть не нужна.</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstallButton;
