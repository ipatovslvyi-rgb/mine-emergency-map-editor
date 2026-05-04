import React from 'react';
import { useSchemaStore } from '@/store/schemaStore';
import Icon from '@/components/ui/icon';

const SettingsPage: React.FC = () => {
  const {
    showGrid, setShowGrid, gridSize, setGridSize, zoom, setZoom,
    colorScheme, setColorScheme, paperSize, setPaperSize, orientation, setOrientation,
  } = useSchemaStore();

  const PAPER_SIZES = ['A4', 'A3', 'A2', 'A1'];
  const COLOR_SCHEMES = [
    { id: 'dark', label: 'Тёмная', desc: 'Стандарт для ночных смен' },
    { id: 'light', label: 'Светлая', desc: 'Для печати и дневного использования' },
    { id: 'high-contrast', label: 'Высокий контраст', desc: 'Максимальная видимость' },
  ];

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="p-5 rounded-lg border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        {title}
      </h3>
      {children}
    </div>
  );

  const Row = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: 'hsl(var(--border))' }}>
      <div>
        <div className="text-sm">{label}</div>
        {desc && <div className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{desc}</div>}
      </div>
      {children}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">Настройки</h1>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Параметры редактора и экспорта</p>
        </div>

        <Section title="Холст и сетка">
          <Row label="Показывать сетку" desc="Привязка к сетке при рисовании">
            <button
              className="relative w-10 h-5 rounded-full transition-all"
              style={{ background: showGrid ? 'hsl(var(--primary))' : 'hsl(var(--secondary))' }}
              onClick={() => setShowGrid(!showGrid)}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${showGrid ? 'left-5' : 'left-0.5'}`} />
            </button>
          </Row>
          <Row label="Шаг сетки" desc="Минимальный шаг привязки">
            <select
              className="prop-input"
              style={{ width: 90 }}
              value={gridSize}
              onChange={e => setGridSize(Number(e.target.value))}
            >
              {[5, 10, 20, 25, 40, 50].map(v => (
                <option key={v} value={v}>{v} px</option>
              ))}
            </select>
          </Row>
          <Row label="Масштаб по умолчанию" desc="Начальное увеличение холста">
            <select
              className="prop-input"
              style={{ width: 90 }}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
            >
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(v => (
                <option key={v} value={v}>{v * 100}%</option>
              ))}
            </select>
          </Row>
        </Section>

        <Section title="Параметры страницы">
          <Row label="Формат листа" desc="Для экспорта и печати">
            <div className="flex gap-1">
              {PAPER_SIZES.map(size => (
                <button
                  key={size}
                  className="px-2.5 py-1 rounded text-xs font-medium transition-all"
                  style={{
                    background: paperSize === size ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                    color: paperSize === size ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                  }}
                  onClick={() => setPaperSize(size)}
                >{size}</button>
              ))}
            </div>
          </Row>
          <Row label="Ориентация" desc="Книжная или альбомная">
            <div className="flex gap-1">
              {[{ id: 'portrait', label: 'Книжная' }, { id: 'landscape', label: 'Альбомная' }].map(o => (
                <button
                  key={o.id}
                  className="px-2.5 py-1 rounded text-xs font-medium transition-all"
                  style={{
                    background: orientation === o.id ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                    color: orientation === o.id ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                  }}
                  onClick={() => setOrientation(o.id)}
                >{o.label}</button>
              ))}
            </div>
          </Row>
        </Section>

        <Section title="Цветовая схема">
          <div className="space-y-2">
            {COLOR_SCHEMES.map(cs => (
              <button
                key={cs.id}
                className="w-full flex items-center justify-between p-3 rounded transition-all text-left"
                style={{
                  background: colorScheme === cs.id ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted))',
                  border: `1px solid ${colorScheme === cs.id ? 'hsl(var(--primary) / 0.4)' : 'transparent'}`,
                }}
                onClick={() => setColorScheme(cs.id)}
              >
                <div>
                  <div className="text-sm font-medium">{cs.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{cs.desc}</div>
                </div>
                {colorScheme === cs.id && <Icon name="Check" size={16} style={{ color: 'hsl(var(--primary))' }} />}
              </button>
            ))}
          </div>
        </Section>

        <Section title="О программе">
          <div className="space-y-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <div className="flex justify-between">
              <span>Версия</span>
              <span className="font-mono-tech">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Назначение</span>
              <span>Аварийно-эвакуационные схемы шахт и рудников</span>
            </div>
            <div className="flex justify-between">
              <span>Формат данных</span>
              <span className="font-mono-tech">JSON (локально)</span>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default SettingsPage;