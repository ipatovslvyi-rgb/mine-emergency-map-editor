import React from 'react';
import Icon from '@/components/ui/icon';
import LogoSvg from '@/components/ui/LogoSvg';
import openGioWindow from '@/lib/gio/openGioWindow';
import InstallButton from '@/components/pwa/InstallButton';

interface Props {
  onEnter: () => void;
}



const LandingPage: React.FC<Props> = ({ onEnter }) => {

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>

      {/* ── NAV ── */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-border flex-shrink-0" style={{ background: 'hsl(var(--toolbar-bg))' }} aria-label="Основная навигация">
        <div className="flex items-center gap-2.5">
          <LogoSvg className="w-9 h-9 rounded" />
          <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'hsl(var(--warning) / 0.15)', color: 'hsl(var(--warning))', border: '1px solid hsl(var(--warning) / 0.3)' }}>
            v1.003
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openGioWindow}
            aria-label="ГИО — группа инженерного обеспечения, откроется в отдельном окне"
            title="Группа инженерного обеспечения — откроется в отдельном окне"
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium border transition-all hover:border-primary"
            style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', borderColor: 'hsl(var(--border))' }}
          >
            <Icon name="Wrench" size={14} />
            ГИО
            <Icon name="ExternalLink" size={12} />
          </button>
          <button
            onClick={onEnter}
            aria-label="Открыть редактор схем аварийного участка"
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all hover:opacity-90"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            Открыть редактор
            <Icon name="ArrowRight" size={14} />
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative flex-1 min-h-0 flex flex-col items-center justify-center text-center px-6 py-6 overflow-hidden">
        {/* Фоновая сетка */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          opacity: 0.35,
        }} />
        {/* Градиент поверх */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 40%, hsl(var(--primary) / 0.08) 0%, transparent 70%)',
        }} />

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Логотип */}
          <div className="flex justify-center mb-[2.5vh]">
            <LogoSvg style={{ width: 'clamp(48px, 9vh, 80px)', height: 'clamp(48px, 9vh, 80px)', borderRadius: 20, boxShadow: '0 0 40px hsl(var(--primary) / 0.4)' }} />
          </div>
          {/* Бейдж */}
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-[2.5vh] text-xs font-medium" style={{ background: 'hsl(var(--warning) / 0.12)', color: 'hsl(var(--warning))', border: '1px solid hsl(var(--warning) / 0.25)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'hsl(var(--warning))', display: 'inline-block' }} />
            Автоматизированная система оформления документов
          </div>

          <h1 className="font-bold leading-tight mb-4" style={{ fontSize: 'clamp(1.75rem, min(5vw, 6.5vh), 3.5rem)', letterSpacing: '-0.02em' }}>
            Схема<br />
            <span style={{ color: 'hsl(var(--primary))' }}>аварийного участка</span>
          </h1>

          <p className="text-base mb-[4vh] mx-auto" style={{ color: 'hsl(var(--muted-foreground))', maxWidth: 480, lineHeight: 1.7 }}>
            Заполните форму, расставьте условные обозначения на плане,<br />
            получите готовый документ А4 для печати за считанные минуты.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={onEnter}
              aria-label="Начать работу с программой оформления схем аварийного участка"
              className="flex items-center gap-2 px-7 py-3 rounded font-semibold text-base transition-all hover:opacity-90 hover:scale-105"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', boxShadow: '0 0 32px hsl(var(--primary) / 0.35)' }}
            >
              <Icon name="Zap" size={17} />
              Начать работу
            </button>
            <InstallButton className="py-3" />
            <div className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <Icon name="Shield" size={14} />
              Данные хранятся локально
            </div>
          </div>
        </div>
      </section>

      {/* ── СТАТИСТИКА ── */}
      <div className="border-y border-border flex-shrink-0" style={{ background: 'hsl(var(--panel-bg))' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-3 divide-x divide-border">
          {[
            { value: 'А4', label: 'Альбомный формат документа', icon: 'FileText' },
            { value: '20+', label: 'Условных обозначений в библиотеке', icon: 'Layers' },
            { value: '1 клик', label: 'До готового PDF или печати', icon: 'Printer' },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center justify-center gap-1.5 py-8 px-6 text-center">
              <Icon name={s.icon} size={20} style={{ color: 'hsl(var(--primary))' }} />
              <div className="text-2xl font-black" style={{ color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>{s.value}</div>
              <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', lineHeight: 1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="px-8 py-3 border-t border-border flex items-center justify-between text-xs flex-shrink-0" style={{ background: 'hsl(var(--toolbar-bg))', color: 'hsl(var(--muted-foreground))' }}>
        <span>САУ v1.003</span>
        <span className="hidden sm:inline">Автоматизированная система документации. Все права защищены.</span>
        <a href="mailto:work_studio@internet.ru" style={{ color: 'hsl(var(--muted-foreground))' }}>work_studio@internet.ru</a>
      </footer>

    </div>
  );
};

export default LandingPage;