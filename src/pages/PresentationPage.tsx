import React, { useRef } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  onBack: () => void;
}

const FEATURES = [
  {
    icon: 'ClipboardList',
    title: 'Быстрый ввод данных',
    desc: 'Все поля документа в одной форме: позиция, вид аварии, состав атмосферы, место, параметры выработки.',
  },
  {
    icon: 'ImagePlus',
    title: 'Схема на плане участка',
    desc: 'Загрузите изображение плана и расставьте стандартные условные обозначения прямо поверх него.',
  },
  {
    icon: 'Eye',
    title: 'Предпросмотр А4',
    desc: 'Документ формируется мгновенно — с соблюдением полей, компоновки и правил оформления.',
  },
  {
    icon: 'Printer',
    title: 'Печать и PDF',
    desc: 'Один клик — готовый документ для передачи, архивирования или отправки по email.',
  },
  {
    icon: 'FileSpreadsheet',
    title: 'Экспорт в Excel',
    desc: 'Все данные выгружаются в таблицу для ведения журналов, отчётности и архива.',
  },
  {
    icon: 'FolderOpen',
    title: 'Несколько схем',
    desc: 'Ведите несколько позиций одновременно, мгновенно переключайтесь между схемами.',
  },
];

const BENEFITS = [
  { value: '5 мин', label: 'на оформление одной схемы' },
  { value: 'А4', label: 'готовый документ под печать' },
  { value: '10+', label: 'условных обозначений' },
  { value: '100%', label: 'данные хранятся локально' },
];

const PresentationPage: React.FC<Props> = ({ onBack }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!contentRef.current) return;
    const html = contentRef.current.outerHTML;
    const win = window.open('', '_blank', 'width=900,height=1100');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>САУ — Презентация</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700;900&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #fff; font-family: 'IBM Plex Sans', Arial, sans-serif; }
  @page { size: A4 portrait; margin: 0; }
</style></head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 700);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'hsl(var(--background))' }}>

      {/* Управляющая панель — скрывается при печати */}
      <div
        className="presentation-toolbar flex items-center gap-3 px-4 py-2.5 border-b border-border flex-shrink-0"
        style={{ background: 'hsl(var(--toolbar-bg))' }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm transition-colors hover:text-foreground"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          <Icon name="ChevronLeft" size={15} />
          Назад
        </button>

        <div className="h-4 border-l border-border" />
        <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
          Презентация для предприятий
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
        >
          A4 / Книжная
        </span>

        <div className="flex-1" />

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-1.5 rounded text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
        >
          <Icon name="Printer" size={14} />
          Печать / PDF
        </button>
      </div>

      {/* Область предпросмотра */}
      <div
        className="flex-1 overflow-auto flex justify-center py-8 px-4"
        style={{ background: 'hsl(216 20% 6%)' }}
      >
        {/* Лист А4 книжный */}
        <div
          ref={contentRef}
          className="presentation-sheet"
          style={{
            width: 'min(96vw, 794px)',
            minHeight: 1123,
            background: '#ffffff',
            color: '#111827',
            boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
            borderRadius: 3,
            fontFamily: '"IBM Plex Sans", Arial, sans-serif',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {/* ── ОБЛОЖКА / ШАПКА ── */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0d1520 0%, #1a2a40 60%, #0f1e30 100%)',
              padding: '52px 52px 44px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Декоративная сетка */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundImage: 'linear-gradient(rgba(249,115,22,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.07) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
            {/* Декоративная дуга */}
            <div style={{
              position: 'absolute', right: -60, top: -60,
              width: 320, height: 320,
              borderRadius: '50%',
              border: '2px solid rgba(249,115,22,0.2)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', right: -20, top: -20,
              width: 200, height: 200,
              borderRadius: '50%',
              border: '1px solid rgba(249,115,22,0.15)',
              pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Логотип + название */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                <img
                  src="/logo.svg"
                  alt="САУ"
                  style={{ width: 64, height: 64, borderRadius: 14, flexShrink: 0 }}
                />
                <div>
                  <div style={{ color: '#f97316', fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
                    Автоматизированная система документации
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                    work_studio@internet.ru
                  </div>
                </div>
              </div>

              {/* Заголовок */}
              <h1 style={{ color: '#ffffff', fontSize: 36, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.02em', margin: '0 0 16px' }}>
                Схема<br />
                <span style={{ color: '#f97316' }}>аварийного участка</span>
              </h1>

              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.7, maxWidth: 480, margin: '0 0 32px' }}>
                Программный комплекс для оперативного оформления аварийных схем горнодобывающих предприятий в соответствии с требованиями горноспасательной службы.
              </p>

              {/* Метрики */}
              <div style={{ display: 'flex', gap: 0, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden' }}>
                {BENEFITS.map((b, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      textAlign: 'center',
                      borderRight: i < BENEFITS.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                      background: 'rgba(255,255,255,0.04)',
                    }}
                  >
                    <div style={{ color: '#f97316', fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{b.value}</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 4, lineHeight: 1.3 }}>{b.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── ТЕЛО ── */}
          <div style={{ padding: '40px 52px 52px' }}>

            {/* Проблема */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 3, height: 20, background: '#f97316', borderRadius: 2, flexShrink: 0 }} />
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Задача</h2>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.75, color: '#4b5563', margin: 0 }}>
                При аварийной ситуации горноспасательная служба обязана оперативно подготовить схему аварийного участка — документ строгой формы с условными обозначениями, данными об атмосфере, параметрами выработки. Традиционное ручное оформление занимает значительное время и сопряжено с ошибками.
              </p>
            </div>

            {/* Решение */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 3, height: 20, background: '#f97316', borderRadius: 2, flexShrink: 0 }} />
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Возможности системы</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {FEATURES.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '14px 16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      background: '#fafafa',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: 'rgba(249,115,22,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <span style={{ color: '#f97316', fontSize: 13 }}>✦</span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{f.title}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.55 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Как работает */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 3, height: 20, background: '#f97316', borderRadius: 2, flexShrink: 0 }} />
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Как это работает</h2>
              </div>
              <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
                {/* Линия-коннектор */}
                <div style={{ position: 'absolute', top: 18, left: 18, right: 18, height: 2, background: 'linear-gradient(90deg, #f97316, #fb923c)', zIndex: 0, borderRadius: 1 }} />
                {[
                  { n: '1', title: 'Заполните форму', desc: 'Введите данные об аварии и участке' },
                  { n: '2', title: 'Загрузите план', desc: 'Добавьте схему и расставьте знаки' },
                  { n: '3', title: 'Предпросмотр', desc: 'Проверьте документ формата А4' },
                  { n: '4', title: 'Печать / PDF', desc: 'Готовый документ одним кликом' },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 6px' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: '#f97316', color: '#fff',
                      fontSize: 14, fontWeight: 900,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 10px',
                      boxShadow: '0 0 0 4px #fff',
                    }}>{s.n}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{s.title}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af', lineHeight: 1.4 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{
              background: 'linear-gradient(135deg, #0d1520 0%, #1a2a40 100%)',
              borderRadius: 10,
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
            }}>
              <div>
                <div style={{ color: '#ffffff', fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                  Готовы внедрить на предприятии?
                </div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 1.6 }}>
                  Свяжитесь с нами для получения лицензионного ключа<br />и технической поддержки.
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ color: '#f97316', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                  work_studio@internet.ru
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                  Автоматизированная система документации
                </div>
              </div>
            </div>

          </div>

          {/* Футер */}
          <div style={{
            borderTop: '1px solid #e5e7eb',
            padding: '12px 52px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>САУ v1.001 — Схема аварийного участка</span>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>Все права защищены © 2025</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresentationPage;