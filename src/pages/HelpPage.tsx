import React, { useState } from 'react';
import Icon from '@/components/ui/icon';

const SECTIONS = [
  {
    id: 'start',
    icon: 'PlayCircle',
    title: 'Начало работы',
    items: [
      { q: 'Как создать новую схему?', a: 'Перейдите в раздел «Схемы» и нажмите кнопку «Новая схема». Введите название и нажмите «Создать». Схема откроется в редакторе.' },
      { q: 'Как переключаться между схемами?', a: 'В разделе «Схемы» нажмите на нужную схему, чтобы открыть её в редакторе.' },
      { q: 'Как сохранить схему?', a: 'Схема сохраняется автоматически при каждом изменении прямо в браузере.' },
    ]
  },
  {
    id: 'tools',
    icon: 'PenTool',
    title: 'Инструменты рисования',
    items: [
      { q: 'Инструмент Выбор [V]', a: 'Позволяет выбирать, перемещать и редактировать элементы. Кликните на элемент для выбора. Для удаления нажмите Delete.' },
      { q: 'Инструмент Линия [L] и Стрелка [A]', a: 'Нажмите и удерживайте кнопку мыши, потяните в нужном направлении, отпустите.' },
      { q: 'Прямоугольник [R] и Эллипс [E]', a: 'Нажмите и потяните мышью по диагонали, чтобы задать форму и размер.' },
      { q: 'Текст [T]', a: 'Кликните в нужном месте схемы. Двойной клик по существующему тексту — редактирование.' },
      { q: 'Изображение [I]', a: 'Выберите инструмент и кликните на холст — откроется диалог выбора файла.' },
      { q: 'Перемещение холста [H]', a: 'Зажмите и тяните мышью для перемещения рабочей области.' },
    ]
  },
  {
    id: 'symbols',
    icon: 'Layers',
    title: 'Условные обозначения',
    items: [
      { q: 'Как добавить обозначение на схему?', a: 'Найдите нужный символ в библиотеке слева и нажмите на него. Он добавится в центр схемы. Затем перетащите его на нужное место.' },
      { q: 'Как изменить подпись символа?', a: 'Выберите символ инструментом «Выбор», в правой панели «Свойства» измените поле «Подпись».' },
      { q: 'Категории обозначений', a: 'Аварийные зоны, Персонал, Инфраструктура, Оборудование, Маршруты, Измерения — стандартные обозначения горнодобывающей отрасли.' },
    ]
  },
  {
    id: 'export',
    icon: 'Download',
    title: 'Экспорт и печать',
    items: [
      { q: 'Экспорт в PNG', a: 'Нажмите кнопку «PNG» в верхней панели. Изображение будет сохранено на ваш компьютер с прозрачным фоном.' },
      { q: 'Экспорт в PDF', a: 'Нажмите кнопку «PDF» в верхней панели. PDF создаётся через системный диалог печати браузера.' },
      { q: 'Печать', a: 'Нажмите кнопку «Печать» для отправки схемы на принтер. Используйте настройки масштабирования в диалоге печати.' },
    ]
  },
  {
    id: 'shortcuts',
    icon: 'Keyboard',
    title: 'Горячие клавиши',
    items: [
      { q: 'Ctrl+Z / Ctrl+Y', a: 'Отменить / Повторить действие' },
      { q: 'Delete / Backspace', a: 'Удалить выбранный элемент' },
      { q: 'V / H / L / A / R / E / T / I', a: 'Быстрое переключение инструментов: Выбор / Перемещение / Линия / Стрелка / Прямоугольник / Эллипс / Текст / Изображение' },
      { q: 'Ctrl+D', a: 'Дублировать выбранный элемент' },
      { q: 'Esc', a: 'Снять выделение / Отменить текущее действие' },
      { q: 'Колёсико мыши', a: 'Прокрутка холста. Ctrl + колёсико — масштабирование.' },
    ]
  },
];

const HelpPage: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('start');

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">Справочная информация</h1>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Руководство по работе с редактором аварийных схем
          </p>
        </div>

        <div className="p-4 rounded-lg mb-5 border-l-4 flex items-start gap-3"
          style={{ background: 'hsl(var(--warning) / 0.08)', borderColor: 'hsl(var(--warning))', border: '1px solid hsl(var(--warning) / 0.25)', borderLeft: '4px solid hsl(var(--warning))' }}>
          <Icon name="TriangleAlert" size={16} style={{ color: 'hsl(var(--warning))', marginTop: 1, flexShrink: 0 }} />
          <div>
            <div className="text-sm font-medium" style={{ color: 'hsl(var(--warning))' }}>Важное замечание</div>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Данный редактор предназначен для создания аварийно-эвакуационных схем горных выработок.
              Все схемы хранятся локально в браузере. Для долгосрочного хранения экспортируйте схемы в PDF или PNG.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {SECTIONS.map(section => (
            <div key={section.id} className="rounded-lg border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
              <button
                className="w-full flex items-center gap-3 p-4 transition-all text-left"
                style={{ background: openId === section.id ? 'hsl(var(--card))' : 'hsl(var(--muted))' }}
                onClick={() => setOpenId(openId === section.id ? null : section.id)}
              >
                <Icon name={section.icon} size={16} style={{ color: 'hsl(var(--primary))', flexShrink: 0 }} />
                <span className="text-sm font-medium">{section.title}</span>
                <div className="flex-1" />
                <Icon name={openId === section.id ? 'ChevronUp' : 'ChevronDown'} size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
              </button>

              {openId === section.id && (
                <div className="border-t" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                  {section.items.map((item, i) => (
                    <div key={i} className="px-4 py-3 border-b last:border-0" style={{ borderColor: 'hsl(var(--border))' }}>
                      <div className="text-sm font-medium mb-1 flex items-start gap-2">
                        <Icon name="ChevronRight" size={13} style={{ color: 'hsl(var(--primary))', marginTop: 2, flexShrink: 0 }} />
                        {item.q}
                      </div>
                      <p className="text-xs leading-relaxed pl-5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {item.a}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-lg text-center" style={{ background: 'hsl(var(--muted))' }}>
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            САУ v1.001 — Схема аварийного участка опасного производственного объекта
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;