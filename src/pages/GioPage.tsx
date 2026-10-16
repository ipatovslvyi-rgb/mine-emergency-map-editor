import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import LogoSvg from '@/components/ui/LogoSvg';
import ZvtCalculator from '@/components/gio/ZvtCalculator';
import TriangleCalculator from '@/components/gio/TriangleCalculator';
import FireLoadCalculator from '@/components/gio/FireLoadCalculator';
import DaCalculator from '@/components/gio/DaCalculator';
import AtmoCalculator from '@/components/gio/AtmoCalculator';
import InstallButton from '@/components/pwa/InstallButton';
import NetworkBadge from '@/components/pwa/NetworkBadge';
import OperationSetup, { OperationStatus } from '@/components/ops/OperationPanel';
import OperationFeed, { DangerAlert } from '@/components/ops/OperationFeed';
import { startOpsSync, useOps } from '@/lib/ops/store';
import VoiceCodeInput from '@/components/ops/VoiceCodeInput';
import { DaTimerAlertOverlay, DaTimerBar } from '@/components/gio/DaTimer';

const TOOLS = [
  { id: 'zvt', label: 'ЗВТ', short: 'ЗВТ', title: 'Время пребывания в зоне высоких температур', icon: 'Thermometer' },
  { id: 'triangle', label: 'Треугольник', short: 'Треуг.', title: 'Взрываемость рудничной атмосферы (треугольник взрываемости)', icon: 'Triangle' },
  { id: 'da', label: 'Давление ДА', short: 'ДА', title: 'Давление поворота дыхательного аппарата (Устав ВГСЧ, п. 22–23)', icon: 'Gauge' },
  { id: 'atmo', label: 'Атмосфера', short: 'Атмосф.', title: 'Журнал замеров рудничной атмосферы с тревогами (Устав ВГСЧ, Приложение 4)', icon: 'Wind' },
  { id: 'fire', label: 'Пож.нагрузка', short: 'Пожар', title: 'Пожарная нагрузка — мощность пожара техники и конвейерной ленты', icon: 'Flame' },
  { id: 'op', label: 'Операция', short: 'Операция', title: 'Передача расчётов: командир → подземная база и командный пункт', icon: 'RadioTower' },
];

const OpTabBadge: React.FC = () => {
  const { session } = useOps();
  if (!session) return null;
  return <span className="w-2 h-2 rounded-full" style={{ background: session.active ? 'hsl(var(--safe))' : 'hsl(var(--muted-foreground))' }} />;
};

const GioPage: React.FC = () => {
  const { tool } = useParams();
  const navigate = useNavigate();
  const active = TOOLS.find(t => t.id === tool);
  const { session } = useOps();

  useEffect(() => {
    startOpsSync();
  }, []);

  useEffect(() => {
    document.title = active ? `ГИО — ${active.label}` : 'ГИО — группа инженерного обеспечения';
  }, [active]);

  return (
    <div className="gio-root min-h-screen flex flex-col pb-[calc(68px+env(safe-area-inset-bottom))] md:pb-0" style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
      <div className="sticky top-0 z-30 flex items-center h-14 md:h-12 px-3 gap-2 border-b border-border flex-shrink-0" style={{ background: 'hsl(var(--toolbar-bg))', paddingTop: 'env(safe-area-inset-top)' }}>
        <LogoSvg className="w-7 h-7 rounded" />
        <span className="text-sm font-semibold">ГИО</span>
        <span className="text-xs hidden sm:inline md:hidden" style={{ color: 'hsl(var(--muted-foreground))' }}>группа инженерного обеспечения</span>
        <div className="h-5 border-l border-border mx-2 hidden md:block" />
        {TOOLS.map(t => (
          <button key={t.id}
            className={`tab-btn hidden md:flex items-center gap-1.5 whitespace-nowrap ${tool === t.id ? 'active' : ''}`}
            onClick={() => navigate(`/gio/${t.id}`)}
            title={t.title}>
            <Icon name={t.icon} size={13} />
            {t.label}
            {t.id === 'op' && <OpTabBadge />}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <NetworkBadge />
          <InstallButton compact />
          {active && (
            <button className="hidden md:flex items-center gap-1 text-xs px-2 py-1 rounded hover:text-foreground whitespace-nowrap"
              style={{ color: 'hsl(var(--muted-foreground))' }}
              onClick={() => navigate('/gio')}>
              <Icon name="LayoutGrid" size={13} /> <span className="hidden xl:inline">Все расчёты</span>
            </button>
          )}
        </div>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 grid border-t border-border"
        style={{ gridTemplateColumns: `repeat(${TOOLS.length + 1}, 1fr)`, background: 'hsl(var(--toolbar-bg))', paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Расчёты ГИО">
        {[{ id: '', short: 'Все', icon: 'LayoutGrid', title: 'Все расчёты' }, ...TOOLS].map(t => {
          const on = (tool || '') === t.id;
          return (
            <button key={t.id || 'all'}
              onClick={() => navigate(t.id ? `/gio/${t.id}` : '/gio')}
              title={t.title}
              className="flex flex-col items-center justify-center gap-1 h-[68px] text-xs font-semibold transition-colors"
              style={{ color: on ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', background: on ? 'hsl(var(--primary) / 0.1)' : 'transparent', borderTop: on ? '3px solid hsl(var(--primary))' : '3px solid transparent' }}>
              <span className="relative">
                <Icon name={t.icon} size={24} />
                {t.id === 'op' && <span className="absolute -top-0.5 -right-1"><OpTabBadge /></span>}
              </span>
              {t.short}
            </button>
          );
        })}
      </nav>

      <DangerAlert />
      <DaTimerAlertOverlay />

      <main className="gio-touch flex-1 p-3 sm:p-4 md:p-6 max-w-6xl w-full mx-auto">
        {active?.id !== 'da' && <DaTimerBar />}
        {session && active?.id !== 'op' && (
          <button onClick={() => navigate('/gio/op')} className="w-full mb-3 flex items-center gap-2 text-xs px-3 py-2 rounded border border-border text-left"
            style={{ background: 'hsl(var(--card))' }}>
            <Icon name="RadioTower" size={14} style={{ color: 'hsl(var(--primary))' }} />
            <span>Операция <b className="font-mono-tech" style={{ color: 'hsl(var(--primary))' }}>{session.code}</b>{session.title ? ` · ${session.title}` : ''}</span>
            <span className="ml-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {session.role === 'commander' ? 'расчёты можно передавать кнопкой «Передать»' : 'открыть журнал'}
            </span>
          </button>
        )}

        {!active && (
          <>
            <h1 className="text-lg font-semibold mb-1">Расчёты группы инженерного обеспечения</h1>
            <p className="text-sm mb-5" style={{ color: 'hsl(var(--muted-foreground))' }}>Выберите расчёт</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TOOLS.map(t => (
                <button key={t.id}
                  onClick={() => navigate(`/gio/${t.id}`)}
                  className="text-left rounded-lg border border-border p-4 min-h-[84px] hover:border-primary transition-colors flex gap-3"
                  style={{ background: 'hsl(var(--card))' }}>
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>
                    <Icon name={t.icon} size={22} />
                  </div>
                  <div>
                    <div className="text-base font-bold" style={{ color: 'hsl(var(--primary))' }}>{t.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{t.title}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {active?.id === 'zvt' && (
          <>
            <h1 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Icon name="Thermometer" size={20} style={{ color: 'hsl(var(--primary))' }} />
              {active.title}
            </h1>
            <ZvtCalculator />
          </>
        )}

        {active?.id === 'triangle' && (
          <>
            <h1 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Icon name="Triangle" size={20} style={{ color: 'hsl(var(--primary))' }} />
              {active.title}
            </h1>
            <TriangleCalculator />
          </>
        )}

        {active?.id === 'da' && (
          <>
            <h1 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Icon name="Gauge" size={20} style={{ color: 'hsl(var(--primary))' }} />
              {active.title}
            </h1>
            <DaCalculator />
          </>
        )}

        {active?.id === 'atmo' && (
          <>
            <h1 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Icon name="Wind" size={20} style={{ color: 'hsl(var(--primary))' }} />
              {active.title}
            </h1>
            <AtmoCalculator />
          </>
        )}

        {active?.id === 'fire' && (
          <>
            <h1 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Icon name="Flame" size={20} style={{ color: 'hsl(var(--primary))' }} />
              {active.title}
            </h1>
            <FireLoadCalculator />
          </>
        )}

        {active?.id === 'op' && (
          <>
            <h1 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Icon name="RadioTower" size={20} style={{ color: 'hsl(var(--primary))' }} />
              Операция
            </h1>
            {session ? (
              <div className="flex flex-col gap-4">
                <OperationStatus />
                {session.role === 'commander' && session.active && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button onClick={() => navigate('/gio/da')} className="flex items-center justify-center gap-2 py-3 rounded font-semibold text-sm border border-border hover:border-primary"
                      style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
                      <Icon name="Gauge" size={16} /> Давление ДА
                    </button>
                    <button onClick={() => navigate('/gio/atmo')} className="flex items-center justify-center gap-2 py-3 rounded font-semibold text-sm border border-border hover:border-primary"
                      style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
                      <Icon name="Wind" size={16} /> Атмосфера
                    </button>
                    <button onClick={() => navigate('/gio/zvt')} className="flex items-center justify-center gap-2 py-3 rounded font-semibold text-sm border border-border hover:border-primary"
                      style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
                      <Icon name="Thermometer" size={16} /> Расчёт ЗВТ
                    </button>
                    <button onClick={() => navigate('/gio/triangle')} className="flex items-center justify-center gap-2 py-3 rounded font-semibold text-sm border border-border hover:border-primary"
                      style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
                      <Icon name="Triangle" size={16} /> Треугольник
                    </button>
                  </div>
                )}
                {session.role !== 'commander' && <VoiceCodeInput full />}
                <OperationFeed />
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <OperationSetup />
                <div className="rounded-lg border border-border p-4 flex flex-col gap-3" style={{ background: 'hsl(var(--card))' }}>
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <Icon name="Mic" size={16} /> Нет связи с сервером? Примите расчёт голосом
                  </div>
                  <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Командир диктует код расчёта по шахтной связи — введите его, и откроется тот же расчёт с графиком и выводом. Работает без интернета.
                  </div>
                  <VoiceCodeInput full />
                </div>
                <OperationFeed />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default GioPage;
