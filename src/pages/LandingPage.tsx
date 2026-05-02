import React, { useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  onEnter: () => void;
}

const FEATURES = [
  { icon: 'ClipboardList', title: 'Ввод данных', desc: 'Заголовок, вид аварии, состав атмосферы, место — всё в одной форме' },
  { icon: 'ImagePlus', title: 'Схема участка', desc: 'Загрузите план и расставьте условные обозначения прямо поверх картинки' },
  { icon: 'Eye', title: 'Предпросмотр А4', desc: 'Документ формируется мгновенно с правильными полями и компоновкой' },
  { icon: 'Printer', title: 'Печать и PDF', desc: 'Один клик — и документ готов к передаче или архивированию' },
  { icon: 'FileSpreadsheet', title: 'Экспорт Excel', desc: 'Все данные выгружаются в таблицу для журналов и отчётности' },
  { icon: 'FolderOpen', title: 'Несколько схем', desc: 'Ведите несколько позиций одновременно, переключайтесь мгновенно' },
];

const SYMBOLS = [
  'https://cdn.poehali.dev/projects/9c8b2d5a-890f-4855-bc05-5374370e1c6d/bucket/b0075aaa-399c-411d-b91e-c4f784ba6460.png',
  'https://cdn.poehali.dev/projects/9c8b2d5a-890f-4855-bc05-5374370e1c6d/bucket/9f37556a-d0f9-405d-a7a2-5636f7819402.png',
  'https://cdn.poehali.dev/projects/9c8b2d5a-890f-4855-bc05-5374370e1c6d/bucket/7472fb3d-606e-4849-920c-08a6867a6c83.png',
  'https://cdn.poehali.dev/projects/9c8b2d5a-890f-4855-bc05-5374370e1c6d/bucket/4d263ba9-11d9-48fc-abd4-45104740f9c7.png',
  'https://cdn.poehali.dev/projects/9c8b2d5a-890f-4855-bc05-5374370e1c6d/bucket/b307c90a-9516-4ccb-81b8-e3129dca9ae3.png',
  'https://cdn.poehali.dev/projects/9c8b2d5a-890f-4855-bc05-5374370e1c6d/bucket/60bb06e4-1c22-4c23-8e77-eeaaa86b3c43.png',
  'https://cdn.poehali.dev/projects/9c8b2d5a-890f-4855-bc05-5374370e1c6d/bucket/ff1e6286-8210-4aa2-b3ab-4aa362305c35.png',
  'https://cdn.poehali.dev/projects/9c8b2d5a-890f-4855-bc05-5374370e1c6d/bucket/00c2fb18-d9e9-483c-a310-313ef51e2545.png',
];

const LandingPage: React.FC<Props> = ({ onEnter }) => {
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tickerRef.current;
    if (!el) return;
    let x = 0;
    const speed = 0.4;
    const w = el.scrollWidth / 2;
    const tick = () => {
      x -= speed;
      if (Math.abs(x) >= w) x = 0;
      el.style.transform = `translateX(${x}px)`;
      requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>

      {/* ── NAV ── */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-border flex-shrink-0" style={{ background: 'hsl(var(--toolbar-bg))' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
            <Icon name="TriangleAlert" size={16} />
          </div>
          <span className="font-bold text-base tracking-tight">МинПлан</span>
          <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'hsl(var(--warning) / 0.15)', color: 'hsl(var(--warning))', border: '1px solid hsl(var(--warning) / 0.3)' }}>
            АЭМП
          </span>
        </div>
        <button
          onClick={onEnter}
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all hover:opacity-90"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
        >
          Открыть редактор
          <Icon name="ArrowRight" size={14} />
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-24 overflow-hidden flex-shrink-0">
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
          {/* Бейдж */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-medium" style={{ background: 'hsl(var(--warning) / 0.12)', color: 'hsl(var(--warning))', border: '1px solid hsl(var(--warning) / 0.25)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'hsl(var(--warning))', display: 'inline-block' }} />
            Автоматизированная система оформления документов
          </div>

          <h1 className="font-bold leading-tight mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.02em' }}>
            Схема<br />
            <span style={{ color: 'hsl(var(--primary))' }}>аварийного участка</span>
          </h1>

          <p className="text-base mb-10 mx-auto" style={{ color: 'hsl(var(--muted-foreground))', maxWidth: 480, lineHeight: 1.7 }}>
            Заполните форму, расставьте условные обозначения на плане,<br />
            получите готовый документ А4 для печати за считанные минуты.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={onEnter}
              className="flex items-center gap-2 px-7 py-3 rounded font-semibold text-base transition-all hover:opacity-90 hover:scale-105"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', boxShadow: '0 0 32px hsl(var(--primary) / 0.35)' }}
            >
              <Icon name="Zap" size={17} />
              Начать работу
            </button>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <Icon name="Shield" size={14} />
              Данные хранятся локально
            </div>
          </div>
        </div>
      </section>

      {/* ── БЕГУЩАЯ СТРОКА СИМВОЛОВ ── */}
      <div className="overflow-hidden py-4 border-y border-border flex-shrink-0" style={{ background: 'hsl(var(--panel-bg))' }}>
        <div ref={tickerRef} className="flex gap-6 items-center" style={{ width: 'max-content' }}>
          {[...SYMBOLS, ...SYMBOLS].map((url, i) => (
            <div key={i} className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(var(--card))' }}>
              <img src={url} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── ВОЗМОЖНОСТИ ── */}
      <section className="px-8 py-20 flex-shrink-0">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">Всё необходимое в одном инструменте</h2>
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Разработан специально для горноспасательных служб</p>
          </div>

          <div className="grid grid-cols-1 gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="rounded-lg p-5 border transition-all hover:border-primary/50 group"
                style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-all group-hover:scale-110" style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}>
                  <Icon name={f.icon} size={18} />
                </div>
                <div className="font-semibold text-sm mb-1.5">{f.title}</div>
                <div className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── КАК ЭТО РАБОТАЕТ ── */}
      <section className="px-8 py-16 flex-shrink-0 border-t border-border" style={{ background: 'hsl(var(--panel-bg))' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Как это работает</h2>
          <div className="flex flex-col gap-0">
            {[
              { n: '01', title: 'Заполните форму', desc: 'Введите позицию, вид аварии, состав атмосферы, место и параметры выработки.' },
              { n: '02', title: 'Загрузите план', desc: 'Добавьте изображение схемы участка и расставьте условные обозначения поверх плана.' },
              { n: '03', title: 'Откройте предпросмотр', desc: 'Проверьте готовый документ в формате А4 с соблюдением всех полей.' },
              { n: '04', title: 'Печать или PDF', desc: 'Распечатайте документ или сохраните в PDF одним нажатием.' },
            ].map((step, i) => (
              <div key={i} className="flex gap-6 items-start py-6" style={{ borderBottom: i < 3 ? '1px solid hsl(var(--border))' : 'none' }}>
                <div className="text-4xl font-black flex-shrink-0" style={{ color: 'hsl(var(--primary) / 0.2)', lineHeight: 1, minWidth: 56 }}>{step.n}</div>
                <div>
                  <div className="font-semibold mb-1">{step.title}</div>
                  <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', lineHeight: 1.6 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-8 py-20 flex-shrink-0 flex flex-col items-center text-center border-t border-border" style={{ background: 'hsl(var(--background))' }}>
        <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', boxShadow: '0 0 40px hsl(var(--primary) / 0.4)' }}>
          <Icon name="TriangleAlert" size={24} />
        </div>
        <h2 className="text-2xl font-bold mb-3">Готовы начать?</h2>
        <p className="text-sm mb-8" style={{ color: 'hsl(var(--muted-foreground))', maxWidth: 360, lineHeight: 1.6 }}>
          Первая схема создаётся уже при открытии — просто заполните поля.
        </p>
        <button
          onClick={onEnter}
          className="flex items-center gap-2 px-8 py-3.5 rounded font-semibold text-base transition-all hover:opacity-90"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', boxShadow: '0 0 32px hsl(var(--primary) / 0.3)' }}
        >
          Открыть редактор
          <Icon name="ArrowRight" size={16} />
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-8 py-4 border-t border-border flex items-center justify-between text-xs flex-shrink-0" style={{ background: 'hsl(var(--toolbar-bg))', color: 'hsl(var(--muted-foreground))' }}>
        <span>МинПлан АЭМП v1.0</span>
        <span>Автоматизированная система горноспасательной документации</span>
      </footer>

    </div>
  );
};

export default LandingPage;
