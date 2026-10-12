import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import LogoSvg from '@/components/ui/LogoSvg';
import ZvtCalculator from '@/components/gio/ZvtCalculator';

const TOOLS = [
  { id: 'zvt', label: 'ЗВТ', title: 'Время пребывания в зоне высоких температур', icon: 'Thermometer' },
];

const GioPage: React.FC = () => {
  const { tool } = useParams();
  const navigate = useNavigate();
  const active = TOOLS.find(t => t.id === tool);

  useEffect(() => {
    document.title = active ? `ГИО — ${active.label}` : 'ГИО — группа инженерного обеспечения';
  }, [active]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
      <div className="flex items-center h-12 px-3 gap-2 border-b border-border flex-shrink-0" style={{ background: 'hsl(var(--toolbar-bg))' }}>
        <LogoSvg className="w-7 h-7 rounded" />
        <span className="text-sm font-semibold">ГИО</span>
        <span className="text-xs hidden sm:inline" style={{ color: 'hsl(var(--muted-foreground))' }}>группа инженерного обеспечения</span>
        <div className="h-5 border-l border-border mx-2" />
        {TOOLS.map(t => (
          <button key={t.id}
            className={`tab-btn flex items-center gap-1.5 ${tool === t.id ? 'active' : ''}`}
            onClick={() => navigate(`/gio/${t.id}`)}
            title={t.title}>
            <Icon name={t.icon} size={13} />
            {t.label}
          </button>
        ))}
        {active && (
          <button className="ml-auto flex items-center gap-1 text-xs px-2 py-1 rounded hover:text-foreground"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            onClick={() => navigate('/gio')}>
            <Icon name="LayoutGrid" size={13} /> Все расчёты
          </button>
        )}
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-6xl w-full mx-auto">
        {!active && (
          <>
            <h1 className="text-lg font-semibold mb-1">Расчёты группы инженерного обеспечения</h1>
            <p className="text-sm mb-5" style={{ color: 'hsl(var(--muted-foreground))' }}>Выберите расчёт</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TOOLS.map(t => (
                <button key={t.id}
                  onClick={() => navigate(`/gio/${t.id}`)}
                  className="text-left rounded-lg border border-border p-4 hover:border-primary transition-colors flex gap-3"
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
      </div>
    </div>
  );
};

export default GioPage;
