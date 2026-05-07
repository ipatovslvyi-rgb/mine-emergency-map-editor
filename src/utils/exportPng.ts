import { SchemaFormData } from '@/types/schema';

const SCALE = 3;
const W = 1122; // px ~ A4 297mm at 96dpi
const H = 794;  // px ~ A4 210mm at 96dpi
const CW = W * SCALE;
const CH = H * SCALE;

const PAD_TOP = 0.0952 * H * SCALE;
const PAD_BOT = 0.0952 * H * SCALE;
const PAD_LEFT = 0.101 * W * SCALE;
const PAD_RIGHT = 0.0337 * W * SCALE;

function sc(v: number) { return v * SCALE; }

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  if (!url) return null;
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    if (url.startsWith('data:image/svg+xml;utf8,')) {
      const svgStr = decodeURIComponent(url.slice('data:image/svg+xml;utf8,'.length));
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
    } else if (url.startsWith('data:')) {
      img.src = url;
    } else {
      img.src = url.includes('?') ? url + '&_nc=' + Date.now() : url + '?_nc=' + Date.now();
    }
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function UL(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, minW: number) {
  const t = text?.trim() || '';
  const tw = Math.max(ctx.measureText(t).width, minW);
  ctx.fillText(t || '', x, y);
  ctx.beginPath();
  ctx.moveTo(x, y + sc(1.5));
  ctx.lineTo(x + tw, y + sc(1.5));
  ctx.strokeStyle = '#000';
  ctx.lineWidth = sc(0.5);
  ctx.stroke();
  return tw;
}

export async function exportToPng(data: SchemaFormData, schemaName: string) {
  const canvas = document.createElement('canvas');
  canvas.width = CW;
  canvas.height = CH;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CW, CH);

  const font = (size: number, weight = 'normal', style = 'normal') =>
    `${style} ${weight} ${sc(size)}px Arial, Helvetica, sans-serif`;

  const fs = 9;
  const innerX = PAD_LEFT;
  const innerY = PAD_TOP;
  const innerW = CW - PAD_LEFT - PAD_RIGHT;
  const innerH = CH - PAD_TOP - PAD_BOT;

  let curY = innerY;

  // ── ШАПКА ──
  ctx.font = font(11, 'bold');
  ctx.fillStyle = '#000';
  ctx.textBaseline = 'alphabetic';

  const titleParts = ['Схема аварийного участка — позиция ', data.position || '___', '  ', data.date || '___', '  ', data.time || '___', ' (', data.timezone || 'мск', ')'];
  const titleFull = titleParts.join('');
  const titleW = ctx.measureText(titleFull).width;
  let tx = innerX + (innerW - titleW) / 2;
  const titleY = curY + sc(11);

  const drawUnderlinedPart = (text: string, minW: number) => {
    const tw = Math.max(ctx.measureText(text).width, sc(minW));
    ctx.fillText(text, tx, titleY);
    ctx.beginPath(); ctx.moveTo(tx, titleY + sc(1.5)); ctx.lineTo(tx + tw, titleY + sc(1.5));
    ctx.strokeStyle = '#000'; ctx.lineWidth = sc(0.5); ctx.stroke();
    tx += tw;
  };
  const drawPlainPart = (text: string) => {
    ctx.fillText(text, tx, titleY);
    tx += ctx.measureText(text).width;
  };

  ctx.font = font(11, 'bold');
  drawPlainPart('Схема аварийного участка — позиция ');
  drawUnderlinedPart(data.position || '', 20);
  drawPlainPart('  ');
  drawUnderlinedPart(data.date || '', 50);
  drawPlainPart('  ');
  drawUnderlinedPart(data.time || '', 30);
  drawPlainPart(' (');
  drawUnderlinedPart(data.timezone || 'мск', 20);
  drawPlainPart(')');

  curY = titleY + sc(4);

  // Линия под шапкой
  ctx.beginPath();
  ctx.moveTo(innerX, curY);
  ctx.lineTo(innerX + innerW, curY);
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = sc(2);
  ctx.stroke();
  curY += sc(6);

  // ── ВЕРХНИЙ БЛОК: реквизиты + атмосфера ──
  const rightPanelW = sc(160);
  const leftW = innerW - rightPanelW - sc(12);

  // Правая панель: атмосфера
  const atmX = innerX + leftW + sc(12);
  const atmY = curY;
  ctx.font = font(fs, 'bold');
  ctx.fillStyle = '#000';
  ctx.textBaseline = 'alphabetic';
  const atmTitle = 'Состав рудничной атмосферы:';
  const atmTitleW = ctx.measureText(atmTitle).width;
  ctx.fillText(atmTitle, atmX, atmY + sc(fs));
  ctx.beginPath(); ctx.moveTo(atmX, atmY + sc(fs) + sc(1)); ctx.lineTo(atmX + atmTitleW, atmY + sc(fs) + sc(1));
  ctx.strokeStyle = '#000'; ctx.lineWidth = sc(0.5); ctx.stroke();

  const atmItems = [
    ['CO', data.atmosphere.co, '%'],
    ['CO₂', data.atmosphere.co2, '%'],
    ['SO₂', data.atmosphere.so2, '%'],
    ['O₂', data.atmosphere.o2, '%'],
    ['CH₄', data.atmosphere.ch4, '%'],
    ['NO-NO₂', data.atmosphere.noNo2, '%'],
    ['t°', data.atmosphere.temperature, '°C'],
  ];
  const colW = rightPanelW / 2;
  atmItems.forEach(([name, val, unit], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const ax = atmX + col * colW;
    const ay = atmY + sc(fs) + sc(4) + row * sc(fs + 3) + sc(fs);
    ctx.font = font(fs, 'bold');
    ctx.fillText(`${name}-`, ax, ay);
    const nameW = ctx.measureText(`${name}-`).width;
    ctx.font = font(fs, 'normal', 'italic');
    const ulW = UL(ctx, val || '0,00', ax + nameW + sc(2), ay, sc(28));
    ctx.font = font(fs);
    ctx.fillText(` ${unit}`, ax + nameW + sc(2) + ulW + sc(1), ay);
  });

  // Задымлённость
  const smokeRow = Math.ceil(atmItems.length / 2);
  const smokeY = atmY + sc(fs) + sc(4) + smokeRow * sc(fs + 3) + sc(fs);
  ctx.font = font(fs, 'bold');
  ctx.fillText('Задымлённость-', atmX, smokeY);
  const snW = ctx.measureText('Задымлённость-').width;
  ctx.font = font(fs, 'normal', 'italic');
  UL(ctx, data.atmosphere.smokeLevel || '', atmX + snW + sc(2), smokeY, sc(60));

  // Вертикальная линия
  ctx.beginPath();
  ctx.moveTo(atmX - sc(6), curY);
  ctx.lineTo(atmX - sc(6), curY + sc(80));
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = sc(0.5);
  ctx.stroke();

  // Левая панель: реквизиты
  const lineH = sc(fs + 4);
  let ly = curY + sc(fs);

  // Объект
  ctx.font = font(fs, 'bold');
  const objLabel = 'Наименование объекта:';
  ctx.fillText(objLabel, innerX, ly);
  const olW = ctx.measureText(objLabel).width;
  ctx.font = font(fs);
  const objLineX = innerX + olW + sc(4);
  ctx.fillText(data.objectName || '', objLineX, ly);
  ctx.beginPath(); ctx.moveTo(objLineX, ly + sc(1.5)); ctx.lineTo(innerX + leftW, ly + sc(1.5));
  ctx.strokeStyle = '#000'; ctx.lineWidth = sc(0.5); ctx.stroke();
  ly += lineH;

  // Вид аварии + Дата/время
  ctx.font = font(fs, 'bold');
  ctx.fillText('Вид аварии:', innerX, ly);
  const va = ctx.measureText('Вид аварии:').width;
  ctx.font = font(fs);
  const accTypeX = innerX + va + sc(4);
  const midX = innerX + leftW * 0.5;
  ctx.fillText(data.accidentType || '', accTypeX, ly);
  ctx.beginPath(); ctx.moveTo(accTypeX, ly + sc(1.5)); ctx.lineTo(midX - sc(8), ly + sc(1.5));
  ctx.strokeStyle = '#000'; ctx.lineWidth = sc(0.5); ctx.stroke();

  ctx.font = font(fs, 'bold');
  ctx.fillText('Дата/время:', midX, ly);
  const dtLW = ctx.measureText('Дата/время:').width;
  ctx.font = font(fs);
  let dtx = midX + dtLW + sc(4);
  const dtUlW = UL(ctx, data.accidentDate || '', dtx, ly, sc(50));
  dtx += dtUlW + sc(2);
  ctx.fillText(' ', dtx, ly);
  dtx += sc(2);
  UL(ctx, data.accidentTime || '', dtx, ly, sc(30));
  ly += lineH;

  // Место аварии
  ctx.font = font(fs, 'bold');
  ctx.fillText('Место аварии:', innerX, ly);
  const maW = ctx.measureText('Место аварии:').width;
  ctx.font = font(fs, 'normal', 'italic');
  const maX = innerX + maW + sc(4);
  ctx.fillText(data.accidentLocation || '', maX, ly);
  ctx.beginPath(); ctx.moveTo(maX, ly + sc(1.5)); ctx.lineTo(innerX + leftW, ly + sc(1.5));
  ctx.strokeStyle = '#000'; ctx.lineWidth = sc(0.5); ctx.stroke();
  ly += lineH;

  // Кол-во воздуха + Сечение
  ctx.font = font(fs, 'bold');
  ctx.fillText('Кол-во воздуха:', innerX, ly);
  const kvW = ctx.measureText('Кол-во воздуха:').width;
  ctx.font = font(fs);
  const kvx = innerX + kvW + sc(4);
  const kvUlW = UL(ctx, data.airVolume || '', kvx, ly, sc(35));
  ctx.fillText(' м³/с', kvx + kvUlW + sc(1), ly);

  ctx.font = font(fs, 'bold');
  ctx.fillText('Сечение:', midX, ly);
  const secW = ctx.measureText('Сечение:').width;
  ctx.font = font(fs);
  const secx = midX + secW + sc(4);
  const secUlW = UL(ctx, data.crossSection || '', secx, ly, sc(35));
  ctx.fillText(' м²', secx + secUlW + sc(1), ly);
  ly += lineH;

  // Телефон КП
  ctx.font = font(fs, 'bold');
  ctx.fillText('Телефон КП:', innerX, ly);
  const tpW = ctx.measureText('Телефон КП:').width;
  ctx.font = font(fs, 'normal', 'italic');
  const tpx = innerX + tpW + sc(4);
  UL(ctx, data.phone || '', tpx, ly, sc(50));

  curY += sc(80); // высота блока реквизитов

  // ── ОСНОВНАЯ ОБЛАСТЬ: схема + условные обозначения ──
  const legendW = sc(160);
  const schemaAreaX = innerX;
  const schemaAreaY = curY;
  const schemaAreaW = innerW - legendW;
  const schemaAreaH = innerH - (curY - innerY) - sc(26);

  // Рамка всей области
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = sc(0.5);
  ctx.strokeRect(innerX, schemaAreaY, innerW, schemaAreaH);

  // Вертикальный разделитель
  ctx.beginPath();
  ctx.moveTo(innerX + schemaAreaW, schemaAreaY);
  ctx.lineTo(innerX + schemaAreaW, schemaAreaY + schemaAreaH);
  ctx.stroke();

  // Загружаем и рисуем картинку схемы
  if (data.schemaImageUrl) {
    const schemaImg = await loadImage(data.schemaImageUrl);
    if (schemaImg) {
      const iw = schemaImg.naturalWidth || schemaImg.width;
      const ih = schemaImg.naturalHeight || schemaImg.height;
      const ratio = Math.min(schemaAreaW / iw, schemaAreaH / ih);
      const dw = iw * ratio;
      const dh = ih * ratio;
      const dx = schemaAreaX + (schemaAreaW - dw) / 2;
      const dy = schemaAreaY + (schemaAreaH - dh) / 2;
      ctx.drawImage(schemaImg, dx, dy, dw, dh);

      // Символы поверх схемы
      for (const sym of (data.placedSymbols ?? [])) {
        const symImg = await loadImage(sym.imageUrl);
        if (symImg) {
          const sz = sc(sym.size * 0.6);
          const sx = schemaAreaX + (sym.x / 100) * schemaAreaW - sz / 2;
          const sy = schemaAreaY + (sym.y / 100) * schemaAreaH - sz / 2;
          ctx.drawImage(symImg, sx, sy, sz, sz);
        }
      }
    }
  }

  // Условные обозначения
  const legX = innerX + schemaAreaW + sc(6);
  let legY = schemaAreaY + sc(fs + 4);
  ctx.font = font(fs, 'bold');
  ctx.fillStyle = '#000';
  const legTitle = 'Условные обозначения:';
  const legTitleW = ctx.measureText(legTitle).width;
  ctx.fillText(legTitle, legX + (legendW - sc(12) - legTitleW) / 2, legY);
  ctx.beginPath();
  ctx.moveTo(legX + (legendW - sc(12) - legTitleW) / 2, legY + sc(1.5));
  ctx.lineTo(legX + (legendW - sc(12) - legTitleW) / 2 + legTitleW, legY + sc(1.5));
  ctx.strokeStyle = '#000'; ctx.lineWidth = sc(0.5); ctx.stroke();
  legY += sc(fs + 4);

  const allLegend = [
    ...data.legendItems,
    ...(data.placedSymbols ?? [])
      .filter(sym => !data.legendItems.some(l => l.imageUrl === sym.imageUrl))
      .map(sym => ({ imageUrl: sym.imageUrl, label: sym.label })),
  ];

  const legContentW = legendW - sc(12);
  const labelMaxW = legContentW - sc(20);

  for (const item of allLegend) {
    if (legY > schemaAreaY + schemaAreaH - sc(14)) break;

    if (item.imageUrl) {
      const symImg = await loadImage(item.imageUrl);
      if (symImg) ctx.drawImage(symImg, legX, legY - sc(fs), sc(14), sc(14));
    }
    ctx.font = font(7.5);
    ctx.fillStyle = '#000';
    const lines = wrapText(ctx, item.label || '', labelMaxW);
    let textY = legY;
    for (const line of lines) {
      if (textY > schemaAreaY + schemaAreaH - sc(4)) break;
      ctx.fillText(line, legX + sc(17), textY);
      textY += sc(8.5);
    }
    const blockH = Math.max(sc(fs + 4), lines.length * sc(8.5) + sc(2));
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = sc(0.5);
    ctx.beginPath();
    ctx.moveTo(legX, legY + blockH - sc(2));
    ctx.lineTo(legX + legContentW, legY + blockH - sc(2));
    ctx.stroke();
    legY += blockH;
  }

  // ── ПОДПИСЬ ──
  const signY = innerY + innerH - sc(6);
  ctx.font = font(fs, 'bold');
  ctx.fillStyle = '#000';
  ctx.fillText('Руководитель горноспасательных работ:', innerX, signY);
  const sigLW = ctx.measureText('Руководитель горноспасательных работ:').width;
  ctx.beginPath(); ctx.moveTo(innerX + sigLW + sc(4), signY + sc(1.5));
  ctx.lineTo(innerX + innerW * 0.55, signY + sc(1.5));
  ctx.strokeStyle = '#000'; ctx.lineWidth = sc(0.5); ctx.stroke();
  if (data.supervisor) {
    ctx.font = font(fs);
    ctx.fillText(data.supervisor, innerX + sigLW + sc(6), signY);
  }

  // Ссылка на изображение
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `${schemaName || 'схема'}_${data.date.replace(/\./g, '-')}.png`;
  a.click();
}