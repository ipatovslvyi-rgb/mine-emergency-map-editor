import React, { useRef, useState, useEffect } from 'react';
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

const SHEET_W = 794;
const SHEET_H = 1123;

function buildPrintHTML(logoUrl: string) {
  return `<!DOCTYPE html>
<html lang="ru"><head>
<meta charset="UTF-8">
<title>САУ — Презентация</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:210mm;font-family:'IBM Plex Sans',Arial,sans-serif;background:#fff;color:#111827;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@page{size:A4 portrait;margin:0}
.sheet{width:210mm;height:297mm;display:flex;flex-direction:column;overflow:hidden}
.header{background:linear-gradient(135deg,#0d1520 0%,#1a2a40 60%,#0f1e30 100%);padding:40px 44px 32px;position:relative;overflow:hidden;flex-shrink:0}
.hgrid{position:absolute;inset:0;background-image:linear-gradient(rgba(249,115,22,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(249,115,22,.07) 1px,transparent 1px);background-size:40px 40px}
.hc1{position:absolute;right:-60px;top:-60px;width:280px;height:280px;border-radius:50%;border:2px solid rgba(249,115,22,.2)}
.hc2{position:absolute;right:-10px;top:-10px;width:160px;height:160px;border-radius:50%;border:1px solid rgba(249,115,22,.12)}
.hi{position:relative;z-index:1}
.lr{display:flex;align-items:center;gap:13px;margin-bottom:24px}
.li{width:52px;height:52px;border-radius:11px}
.ls{color:#f97316;font-size:9px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;margin-bottom:2px}
.le{color:rgba(255,255,255,.45);font-size:9px}
h1{color:#fff;font-size:28px;font-weight:900;line-height:1.15;letter-spacing:-.02em;margin:0 0 12px}
h1 span{color:#f97316}
.hd{color:rgba(255,255,255,.62);font-size:12px;line-height:1.65;max-width:440px;margin:0 0 22px}
.mt{display:flex;border:1px solid rgba(255,255,255,.1);border-radius:7px;overflow:hidden}
.mv{flex:1;padding:10px 8px;text-align:center;border-right:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04)}
.mv:last-child{border-right:none}
.mvv{color:#f97316;font-size:16px;font-weight:900;line-height:1}
.mvl{color:rgba(255,255,255,.45);font-size:8px;margin-top:3px;line-height:1.3}
.body{padding:26px 44px 22px;flex:1;display:flex;flex-direction:column;gap:20px}
.sec .st{display:flex;align-items:center;gap:8px;margin-bottom:9px}
.sb{width:3px;height:16px;background:#f97316;border-radius:2px;flex-shrink:0}
h2{font-size:13px;font-weight:700;color:#111827}
.tp{font-size:11px;line-height:1.65;color:#4b5563}
.fg{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.fi{padding:10px 12px;border:1px solid #e5e7eb;border-radius:6px;background:#fafafa}
.ft{font-size:10px;font-weight:700;color:#111827;margin-bottom:3px;display:flex;align-items:center;gap:6px}
.fd1{width:6px;height:6px;border-radius:50%;background:#f97316;flex-shrink:0}
.fd{font-size:9px;color:#6b7280;line-height:1.45}
.sp{display:flex;position:relative}
.sl{position:absolute;top:16px;left:17px;right:17px;height:2px;background:linear-gradient(90deg,#f97316,#fb923c);border-radius:1px}
.ss{flex:1;text-align:center;position:relative;z-index:1;padding:0 3px}
.sn{width:32px;height:32px;border-radius:50%;background:#f97316;color:#fff;font-size:12px;font-weight:900;display:flex;align-items:center;justify-content:center;margin:0 auto 7px;box-shadow:0 0 0 3px #fff}
.st2{font-size:9px;font-weight:700;color:#111827;margin-bottom:2px}
.sd{font-size:8px;color:#9ca3af;line-height:1.35}
.cta{background:linear-gradient(135deg,#0d1520,#1a2a40);border-radius:8px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:14px}
.ct{color:#fff;font-size:13px;font-weight:700;margin-bottom:4px}
.cd{color:rgba(255,255,255,.5);font-size:10px;line-height:1.55}
.ce{color:#f97316;font-size:11px;font-weight:700;text-align:right}
.footer{border-top:1px solid #e5e7eb;padding:12px 44px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;margin-top:auto}
.footer span{font-size:8px;color:#9ca3af}
</style>
</head><body>
<div class="sheet">
  <div class="header">
    <div class="hgrid"></div><div class="hc1"></div><div class="hc2"></div>
    <div class="hi">
      <div class="lr">
        <img src="${logoUrl}" alt="САУ" class="li">
        <div><div class="ls">Автоматизированная система документации</div><div class="le">work_studio@internet.ru</div></div>
      </div>
      <h1>Схема<br><span>аварийного участка</span></h1>
      <p class="hd">Программный комплекс для оперативного оформления аварийных схем горнодобывающих предприятий в соответствии с требованиями горноспасательной службы.</p>
      <div class="mt">${BENEFITS.map(b => `<div class="mv"><div class="mvv">${b.value}</div><div class="mvl">${b.label}</div></div>`).join('')}</div>
    </div>
  </div>
  <div class="body">
    <div class="sec">
      <div class="st"><div class="sb"></div><h2>Задача</h2></div>
      <p class="tp">При аварийной ситуации горноспасательная служба обязана оперативно подготовить схему аварийного участка — документ строгой формы с условными обозначениями, данными об атмосфере, параметрами выработки. Традиционное ручное оформление занимает значительное время и сопряжено с ошибками.</p>
    </div>
    <div class="sec">
      <div class="st"><div class="sb"></div><h2>Возможности системы</h2></div>
      <div class="fg">${FEATURES.map(f => `<div class="fi"><div class="ft"><div class="fd1"></div>${f.title}</div><div class="fd">${f.desc}</div></div>`).join('')}</div>
    </div>
    <div class="sec">
      <div class="st"><div class="sb"></div><h2>Как это работает</h2></div>
      <div class="sp"><div class="sl"></div>${STEPS.map(s => `<div class="ss"><div class="sn">${s.n}</div><div class="st2">${s.title}</div><div class="sd">${s.desc}</div></div>`).join('')}</div>
    </div>
    <div class="cta">
      <div><div class="ct">Готовы внедрить на предприятии?</div><div class="cd">Свяжитесь с нами для получения лицензионного ключа<br>и технической поддержки.</div></div>
      <div><div class="ce">work_studio@internet.ru</div></div>
    </div>
  </div>
  <div class="footer"><span>САУ v1.001 — Схема аварийного участка</span><span>Все права защищены © 2025</span></div>
</div>
</body></html>`;
}

const PresentationPage: React.FC<Props> = ({ onBack }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const logoUrl = window.location.origin + '/logo.svg';

  // Вычисляем масштаб под размер контейнера
  useEffect(() => {
    const calc = () => {
      if (!wrapperRef.current) return;
      const w = wrapperRef.current.clientWidth - 32; // отступы
      const s = Math.min(1, w / SHEET_W);
      setScale(s);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const handlePrint = () => {
    const html = buildPrintHTML(logoUrl);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:210mm;height:297mm;border:none;';
    document.body.appendChild(iframe);
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow!.focus();
        iframe.contentWindow!.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 3000);
      }, 800);
    };
    iframe.src = url;
  };

  const scaledH = SHEET_H * scale;

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'hsl(var(--background))' }}>

      {/* Тулбар */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border flex-shrink-0" style={{ background: 'hsl(var(--toolbar-bg))' }}>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm transition-colors hover:text-foreground" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <Icon name="ChevronLeft" size={15} />
          Назад
        </button>
        <div className="h-4 border-l border-border hidden sm:block" />
        <span className="text-sm font-medium hidden sm:block" style={{ color: 'hsl(var(--foreground))' }}>Презентация для предприятий</span>
        <div className="flex-1" />
        <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all hover:opacity-90" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
          <Icon name="Printer" size={13} />
          Сохранить PDF
        </button>
      </div>

      {/* Область просмотра */}
      <div ref={wrapperRef} className="flex-1 overflow-auto" style={{ background: 'hsl(216 20% 6%)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0', minHeight: scaledH + 32 }}>
          {/* Обёртка для scale — занимает ровно столько места, сколько нужно после масштабирования */}
          <div style={{ width: SHEET_W * scale, height: SHEET_H * scale, flexShrink: 0 }}>
            <div style={{
              width: SHEET_W,
              height: SHEET_H,
              transformOrigin: 'top left',
              transform: `scale(${scale})`,
              background: '#ffffff',
              color: '#111827',
              boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
              borderRadius: 3,
              fontFamily: '"IBM Plex Sans", Arial, sans-serif',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}>

              {/* ШАПКА */}
              <div style={{ background: 'linear-gradient(135deg, #0d1520 0%, #1a2a40 60%, #0f1e30 100%)', padding: '40px 44px 32px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(249,115,22,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(249,115,22,.07) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
                <div style={{ position: 'absolute', right: -60, top: -60, width: 280, height: 280, borderRadius: '50%', border: '2px solid rgba(249,115,22,.2)' }} />
                <div style={{ position: 'absolute', right: -10, top: -10, width: 160, height: 160, borderRadius: '50%', border: '1px solid rgba(249,115,22,.12)' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 24 }}>
                    <img src={logoUrl} alt="САУ" style={{ width: 52, height: 52, borderRadius: 11, flexShrink: 0 }} />
                    <div>
                      <div style={{ color: '#f97316', fontSize: 9, fontWeight: 600, letterSpacing: '.13em', textTransform: 'uppercase', marginBottom: 2 }}>Автоматизированная система документации</div>
                      <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 9 }}>work_studio@internet.ru</div>
                    </div>
                  </div>
                  <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-.02em', margin: '0 0 12px' }}>
                    Схема<br /><span style={{ color: '#f97316' }}>аварийного участка</span>
                  </h1>
                  <p style={{ color: 'rgba(255,255,255,.62)', fontSize: 12, lineHeight: 1.65, maxWidth: 440, margin: '0 0 22px' }}>
                    Программный комплекс для оперативного оформления аварийных схем горнодобывающих предприятий в соответствии с требованиями горноспасательной службы.
                  </p>
                  <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,.1)', borderRadius: 7, overflow: 'hidden' }}>
                    {BENEFITS.map((b, i) => (
                      <div key={i} style={{ flex: 1, padding: '10px 8px', textAlign: 'center', borderRight: i < BENEFITS.length - 1 ? '1px solid rgba(255,255,255,.1)' : 'none', background: 'rgba(255,255,255,.04)' }}>
                        <div style={{ color: '#f97316', fontSize: 16, fontWeight: 900, lineHeight: 1 }}>{b.value}</div>
                        <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 8, marginTop: 3, lineHeight: 1.3 }}>{b.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ТЕЛО */}
              <div style={{ padding: '26px 44px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Задача */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                    <div style={{ width: 3, height: 16, background: '#f97316', borderRadius: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Задача</span>
                  </div>
                  <p style={{ fontSize: 11, lineHeight: 1.65, color: '#4b5563' }}>
                    При аварийной ситуации горноспасательная служба обязана оперативно подготовить схему аварийного участка — документ строгой формы с условными обозначениями, данными об атмосфере, параметрами выработки. Традиционное ручное оформление занимает значительное время и сопряжено с ошибками.
                  </p>
                </div>

                {/* Возможности */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 3, height: 16, background: '#f97316', borderRadius: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Возможности системы</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                    {FEATURES.map((f, i) => (
                      <div key={i} style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fafafa' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f97316', flexShrink: 0 }} />
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#111827' }}>{f.title}</span>
                        </div>
                        <div style={{ fontSize: 9, color: '#6b7280', lineHeight: 1.45 }}>{f.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Шаги */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 3, height: 16, background: '#f97316', borderRadius: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Как это работает</span>
                  </div>
                  <div style={{ display: 'flex', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 16, left: 17, right: 17, height: 2, background: 'linear-gradient(90deg, #f97316, #fb923c)', borderRadius: 1 }} />
                    {STEPS.map((s, i) => (
                      <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 3px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f97316', color: '#fff', fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 7px', boxShadow: '0 0 0 3px #fff' }}>{s.n}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{s.title}</div>
                        <div style={{ fontSize: 8, color: '#9ca3af', lineHeight: 1.35 }}>{s.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div style={{ background: 'linear-gradient(135deg, #0d1520, #1a2a40)', borderRadius: 8, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                  <div>
                    <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Готовы внедрить на предприятии?</div>
                    <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 10, lineHeight: 1.55 }}>Свяжитесь с нами для получения лицензионного ключа<br />и технической поддержки.</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: '#f97316', fontSize: 11, fontWeight: 700 }}>work_studio@internet.ru</div>
                  </div>
                </div>

              </div>

              {/* ФУТЕР */}
              <div style={{ borderTop: '1px solid #e5e7eb', padding: '12px 44px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, marginTop: 'auto' }}>
                <span style={{ fontSize: 8, color: '#9ca3af' }}>САУ v1.001 — Схема аварийного участка</span>
                <span style={{ fontSize: 8, color: '#9ca3af' }}>Все права защищены © 2025</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresentationPage;