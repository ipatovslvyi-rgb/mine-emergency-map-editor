import React, { useRef } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  onBack: () => void;
}

const FEATURES = [
  { title: 'Быстрый ввод данных', desc: 'Все поля документа в одной форме: позиция, вид аварии, состав атмосферы, место, параметры выработки.' },
  { title: 'Схема на плане участка', desc: 'Загрузите изображение плана и расставьте стандартные условные обозначения прямо поверх него.' },
  { title: 'Предпросмотр А4', desc: 'Документ формируется мгновенно — с соблюдением полей, компоновки и правил оформления.' },
  { title: 'Печать и PDF', desc: 'Один клик — готовый документ для передачи, архивирования или отправки по email.' },
  { title: 'Экспорт в Excel', desc: 'Все данные выгружаются в таблицу для ведения журналов, отчётности и архива.' },
  { title: 'Несколько схем', desc: 'Ведите несколько позиций одновременно, мгновенно переключайтесь между схемами.' },
];

const BENEFITS = [
  { value: '5 мин', label: 'на оформление схемы' },
  { value: 'А4', label: 'готовый документ' },
  { value: '10+', label: 'обозначений' },
  { value: '100%', label: 'данные локально' },
];

const STEPS = [
  { n: '1', title: 'Заполните форму', desc: 'Введите данные об аварии и участке' },
  { n: '2', title: 'Загрузите план', desc: 'Добавьте схему и расставьте знаки' },
  { n: '3', title: 'Предпросмотр', desc: 'Проверьте документ формата А4' },
  { n: '4', title: 'Печать / PDF', desc: 'Готовый документ одним кликом' },
];

/* Полный HTML для печати — чистый, без React-зависимостей */
function buildPrintHTML(logoUrl: string) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>САУ — Презентация</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:210mm;font-family:'IBM Plex Sans',Arial,sans-serif;background:#fff;color:#111827;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  @page{size:A4 portrait;margin:0}
  .sheet{width:210mm;min-height:297mm;display:flex;flex-direction:column}
  /* ШАПКА */
  .header{background:linear-gradient(135deg,#0d1520 0%,#1a2a40 60%,#0f1e30 100%);padding:44px 48px 36px;position:relative;overflow:hidden}
  .header-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(249,115,22,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(249,115,22,.07) 1px,transparent 1px);background-size:40px 40px}
  .header-circle1{position:absolute;right:-60px;top:-60px;width:300px;height:300px;border-radius:50%;border:2px solid rgba(249,115,22,.2)}
  .header-circle2{position:absolute;right:-10px;top:-10px;width:180px;height:180px;border-radius:50%;border:1px solid rgba(249,115,22,.12)}
  .header-inner{position:relative;z-index:1}
  .logo-row{display:flex;align-items:center;gap:14px;margin-bottom:28px}
  .logo-img{width:56px;height:56px;border-radius:12px}
  .logo-sub{color:#f97316;font-size:10px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;margin-bottom:3px}
  .logo-email{color:rgba(255,255,255,.45);font-size:10px}
  h1{color:#fff;font-size:32px;font-weight:900;line-height:1.15;letter-spacing:-.02em;margin:0 0 14px}
  h1 span{color:#f97316}
  .header-desc{color:rgba(255,255,255,.62);font-size:13px;line-height:1.7;max-width:460px;margin:0 0 28px}
  .metrics{display:flex;border:1px solid rgba(255,255,255,.1);border-radius:8px;overflow:hidden}
  .metric{flex:1;padding:12px 10px;text-align:center;border-right:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04)}
  .metric:last-child{border-right:none}
  .metric-val{color:#f97316;font-size:18px;font-weight:900;line-height:1}
  .metric-lbl{color:rgba(255,255,255,.45);font-size:9px;margin-top:3px;line-height:1.3}
  /* ТЕЛО */
  .body{padding:32px 48px 28px;flex:1}
  .section{margin-bottom:28px}
  .section-title{display:flex;align-items:center;gap:9px;margin-bottom:12px}
  .section-bar{width:3px;height:18px;background:#f97316;border-radius:2px;flex-shrink:0}
  h2{font-size:14px;font-weight:700;color:#111827}
  .task-text{font-size:12px;line-height:1.7;color:#4b5563}
  .features{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .feature{padding:12px 14px;border:1px solid #e5e7eb;border-radius:7px;background:#fafafa}
  .feature-title{font-size:11px;font-weight:700;color:#111827;margin-bottom:4px;display:flex;align-items:center;gap:7px}
  .feature-dot{width:8px;height:8px;border-radius:50%;background:#f97316;flex-shrink:0}
  .feature-desc{font-size:10px;color:#6b7280;line-height:1.5}
  .steps{display:flex;position:relative}
  .steps-line{position:absolute;top:17px;left:18px;right:18px;height:2px;background:linear-gradient(90deg,#f97316,#fb923c);border-radius:1px}
  .step{flex:1;text-align:center;position:relative;z-index:1;padding:0 4px}
  .step-n{width:34px;height:34px;border-radius:50%;background:#f97316;color:#fff;font-size:13px;font-weight:900;display:flex;align-items:center;justify-content:center;margin:0 auto 8px;box-shadow:0 0 0 3px #fff}
  .step-title{font-size:10px;font-weight:700;color:#111827;margin-bottom:3px}
  .step-desc{font-size:9px;color:#9ca3af;line-height:1.4}
  .cta{background:linear-gradient(135deg,#0d1520,#1a2a40);border-radius:9px;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px}
  .cta-title{color:#fff;font-size:14px;font-weight:700;margin-bottom:5px}
  .cta-desc{color:rgba(255,255,255,.5);font-size:11px;line-height:1.6}
  .cta-email{color:#f97316;font-size:12px;font-weight:700;text-align:right;margin-bottom:3px}
  /* ФУТЕР */
  .footer{border-top:1px solid #e5e7eb;padding:14px 48px;display:flex;justify-content:space-between;align-items:center;margin-top:auto}
  .footer span{font-size:9px;color:#9ca3af}
</style>
</head>
<body>
<div class="sheet">
  <div class="header">
    <div class="header-grid"></div>
    <div class="header-circle1"></div>
    <div class="header-circle2"></div>
    <div class="header-inner">
      <div class="logo-row">
        <img src="${logoUrl}" alt="САУ" class="logo-img">
        <div>
          <div class="logo-sub">Автоматизированная система документации</div>
          <div class="logo-email">work_studio@internet.ru</div>
        </div>
      </div>
      <h1>Схема<br><span>аварийного участка</span></h1>
      <p class="header-desc">Программный комплекс для оперативного оформления аварийных схем горнодобывающих предприятий в соответствии с требованиями горноспасательной службы.</p>
      <div class="metrics">
        ${BENEFITS.map((b, i) => `<div class="metric" style="${i === BENEFITS.length - 1 ? 'border-right:none' : ''}"><div class="metric-val">${b.value}</div><div class="metric-lbl">${b.label}</div></div>`).join('')}
      </div>
    </div>
  </div>

  <div class="body">
    <div class="section">
      <div class="section-title"><div class="section-bar"></div><h2>Задача</h2></div>
      <p class="task-text">При аварийной ситуации горноспасательная служба обязана оперативно подготовить схему аварийного участка — документ строгой формы с условными обозначениями, данными об атмосфере, параметрами выработки. Традиционное ручное оформление занимает значительное время и сопряжено с ошибками.</p>
    </div>

    <div class="section">
      <div class="section-title"><div class="section-bar"></div><h2>Возможности системы</h2></div>
      <div class="features">
        ${FEATURES.map(f => `<div class="feature"><div class="feature-title"><div class="feature-dot"></div>${f.title}</div><div class="feature-desc">${f.desc}</div></div>`).join('')}
      </div>
    </div>

    <div class="section">
      <div class="section-title"><div class="section-bar"></div><h2>Как это работает</h2></div>
      <div class="steps">
        <div class="steps-line"></div>
        ${STEPS.map(s => `<div class="step"><div class="step-n">${s.n}</div><div class="step-title">${s.title}</div><div class="step-desc">${s.desc}</div></div>`).join('')}
      </div>
    </div>

    <div class="cta">
      <div>
        <div class="cta-title">Готовы внедрить на предприятии?</div>
        <div class="cta-desc">Свяжитесь с нами для получения лицензионного ключа<br>и технической поддержки.</div>
      </div>
      <div>
        <div class="cta-email">work_studio@internet.ru</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <span>САУ v1.001 — Схема аварийного участка</span>
    <span>Все права защищены © 2025</span>
  </div>
</div>
</body>
</html>`;
}

const PresentationPage: React.FC<Props> = ({ onBack }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = () => {
    const logoUrl = window.location.origin + '/logo.svg';
    const html = buildPrintHTML(logoUrl);

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:210mm;height:297mm;border:none;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(html);
    doc.close();
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow!.focus();
        iframe.contentWindow!.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 600);
    };
  };

  const logoUrl = window.location.origin + '/logo.svg';

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'hsl(var(--background))' }}>

      {/* Тулбар */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-border flex-shrink-0"
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
        <div className="h-4 border-l border-border hidden sm:block" />
        <span className="text-sm font-medium hidden sm:block" style={{ color: 'hsl(var(--foreground))' }}>
          Презентация для предприятий
        </span>
        <div className="flex-1" />
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all hover:opacity-90"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
        >
          <Icon name="Printer" size={13} />
          Сохранить PDF
        </button>
      </div>

      {/* Подсказка мобиле */}
      <div className="flex items-center justify-center gap-1.5 py-1.5 sm:hidden" style={{ color: 'hsl(var(--muted-foreground))', fontSize: 11 }}>
        <Icon name="Move" size={11} />
        Листайте для просмотра
      </div>

      {/* Область просмотра */}
      <div className="flex-1 overflow-auto" style={{ background: 'hsl(216 20% 6%)' }}>
        <div className="flex justify-start sm:justify-center py-4 sm:py-8 px-3 sm:px-4" style={{ minWidth: 'min-content' }}>

          {/* Лист А4 — фиксированная ширина для корректного отображения */}
          <div
            ref={iframeRef as React.RefObject<HTMLDivElement>}
            style={{
              width: 794,
              minHeight: 1123,
              background: '#ffffff',
              color: '#111827',
              boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
              borderRadius: 3,
              fontFamily: '"IBM Plex Sans", Arial, sans-serif',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* ШАПКА */}
            <div style={{
              background: 'linear-gradient(135deg, #0d1520 0%, #1a2a40 60%, #0f1e30 100%)',
              padding: '44px 48px 36px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(249,115,22,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(249,115,22,.07) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
              <div style={{ position: 'absolute', right: -60, top: -60, width: 300, height: 300, borderRadius: '50%', border: '2px solid rgba(249,115,22,.2)' }} />
              <div style={{ position: 'absolute', right: -10, top: -10, width: 180, height: 180, borderRadius: '50%', border: '1px solid rgba(249,115,22,.12)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                  <img src={logoUrl} alt="САУ" style={{ width: 56, height: 56, borderRadius: 12, flexShrink: 0 }} />
                  <div>
                    <div style={{ color: '#f97316', fontSize: 10, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 3 }}>Автоматизированная система документации</div>
                    <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 10 }}>work_studio@internet.ru</div>
                  </div>
                </div>
                <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-.02em', margin: '0 0 14px' }}>
                  Схема<br /><span style={{ color: '#f97316' }}>аварийного участка</span>
                </h1>
                <p style={{ color: 'rgba(255,255,255,.62)', fontSize: 13, lineHeight: 1.7, maxWidth: 460, margin: '0 0 28px' }}>
                  Программный комплекс для оперативного оформления аварийных схем горнодобывающих предприятий в соответствии с требованиями горноспасательной службы.
                </p>
                <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, overflow: 'hidden' }}>
                  {BENEFITS.map((b, i) => (
                    <div key={i} style={{ flex: 1, padding: '12px 10px', textAlign: 'center', borderRight: i < BENEFITS.length - 1 ? '1px solid rgba(255,255,255,.1)' : 'none', background: 'rgba(255,255,255,.04)' }}>
                      <div style={{ color: '#f97316', fontSize: 18, fontWeight: 900, lineHeight: 1 }}>{b.value}</div>
                      <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 9, marginTop: 3, lineHeight: 1.3 }}>{b.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ТЕЛО */}
            <div style={{ padding: '32px 48px 28px', flex: 1 }}>
              {/* Задача */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                  <div style={{ width: 3, height: 18, background: '#f97316', borderRadius: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Задача</span>
                </div>
                <p style={{ fontSize: 12, lineHeight: 1.7, color: '#4b5563' }}>
                  При аварийной ситуации горноспасательная служба обязана оперативно подготовить схему аварийного участка — документ строгой формы с условными обозначениями, данными об атмосфере, параметрами выработки. Традиционное ручное оформление занимает значительное время и сопряжено с ошибками.
                </p>
              </div>

              {/* Возможности */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                  <div style={{ width: 3, height: 18, background: '#f97316', borderRadius: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Возможности системы</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {FEATURES.map((f, i) => (
                    <div key={i} style={{ padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fafafa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f97316', flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>{f.title}</span>
                      </div>
                      <div style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.5 }}>{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Шаги */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                  <div style={{ width: 3, height: 18, background: '#f97316', borderRadius: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Как это работает</span>
                </div>
                <div style={{ display: 'flex', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 17, left: 18, right: 18, height: 2, background: 'linear-gradient(90deg, #f97316, #fb923c)', borderRadius: 1 }} />
                  {STEPS.map((s, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 4px' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#f97316', color: '#fff', fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', boxShadow: '0 0 0 3px #fff' }}>{s.n}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#111827', marginBottom: 3 }}>{s.title}</div>
                      <div style={{ fontSize: 9, color: '#9ca3af', lineHeight: 1.4 }}>{s.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div style={{ background: 'linear-gradient(135deg, #0d1520, #1a2a40)', borderRadius: 9, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 5 }}>Готовы внедрить на предприятии?</div>
                  <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, lineHeight: 1.6 }}>Свяжитесь с нами для получения лицензионного ключа<br />и технической поддержки.</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ color: '#f97316', fontSize: 12, fontWeight: 700 }}>work_studio@internet.ru</div>
                </div>
              </div>
            </div>

            {/* ФУТЕР */}
            <div style={{ borderTop: '1px solid #e5e7eb', padding: '14px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
              <span style={{ fontSize: 9, color: '#9ca3af' }}>САУ v1.001 — Схема аварийного участка</span>
              <span style={{ fontSize: 9, color: '#9ca3af' }}>Все права защищены © 2025</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresentationPage;
