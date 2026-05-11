import React, { useEffect, useRef, useState, useCallback } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  imageUrl: string;
  onSave: (newUrl: string) => void;
  onClose: () => void;
}

type FitMode = 'contain' | 'cover' | 'stretch';

const useOrientation = () => {
  const [isLandscape, setIsLandscape] = useState(
    window.matchMedia('(orientation: landscape)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape)');
    const handler = (e: MediaQueryListEvent) => setIsLandscape(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isLandscape;
};

const ImageEditDialog: React.FC<Props> = ({ imageUrl, onSave, onClose }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [fit, setFit] = useState<FitMode>('contain');
  const [rotation, setRotation] = useState(0);

  const [cropMode, setCropMode] = useState(false);
  const [crop, setCrop] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const drawingRef = useRef<{ startX: number; startY: number } | null>(null);

  const [imgSize, setImgSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const isLandscape = useOrientation();

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = imageUrl;
  }, [imageUrl]);

  const getPointerPos = (clientX: number, clientY: number) => {
    if (!previewRef.current) return { x: 0, y: 0 };
    const rect = previewRef.current.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  };

  const startCrop = useCallback((clientX: number, clientY: number) => {
    if (!cropMode) return;
    const pos = getPointerPos(clientX, clientY);
    drawingRef.current = { startX: pos.x, startY: pos.y };
    setCrop({ x: pos.x, y: pos.y, w: 0, h: 0 });
  }, [cropMode]);

  const moveCrop = useCallback((clientX: number, clientY: number) => {
    if (!drawingRef.current) return;
    const pos = getPointerPos(clientX, clientY);
    const nx = Math.min(drawingRef.current.startX, pos.x);
    const ny = Math.min(drawingRef.current.startY, pos.y);
    setCrop({ x: nx, y: ny, w: Math.abs(pos.x - drawingRef.current.startX), h: Math.abs(pos.y - drawingRef.current.startY) });
  }, []);

  const endCrop = useCallback(() => { drawingRef.current = null; }, []);

  const resetAll = () => {
    setScale(1); setOffsetX(0); setOffsetY(0);
    setFit('contain'); setRotation(0);
    setCrop(null); setCropMode(false);
  };

  const applyAndSave = async () => {
    const targetW = imgSize.w || 1600;
    const targetH = imgSize.h || 1200;
    const canvas = document.createElement('canvas');
    canvas.width = targetW; canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.save();
      ctx.translate(targetW / 2 + (offsetX / 100) * targetW, targetH / 2 + (offsetY / 100) * targetH);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);
      let drawW = targetW, drawH = targetH;
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const targetRatio = targetW / targetH;
      if (fit === 'contain') {
        if (imgRatio > targetRatio) { drawW = targetW; drawH = targetW / imgRatio; }
        else { drawH = targetH; drawW = targetH * imgRatio; }
      } else if (fit === 'cover') {
        if (imgRatio > targetRatio) { drawH = targetH; drawW = targetH * imgRatio; }
        else { drawW = targetW; drawH = targetW / imgRatio; }
      }
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
      let finalCanvas = canvas;
      if (crop && crop.w > 1 && crop.h > 1) {
        const cx = (crop.x / 100) * targetW, cy = (crop.y / 100) * targetH;
        const cw = (crop.w / 100) * targetW, ch = (crop.h / 100) * targetH;
        const cropped = document.createElement('canvas');
        cropped.width = cw; cropped.height = ch;
        const cctx = cropped.getContext('2d');
        if (cctx) { cctx.drawImage(canvas, cx, cy, cw, ch, 0, 0, cw, ch); finalCanvas = cropped; }
      }
      onSave(finalCanvas.toDataURL('image/png'));
    };
    img.src = imageUrl;
  };

  const objectFitCss: React.CSSProperties['objectFit'] = fit === 'stretch' ? 'fill' : fit;

  const controls = (
    <div className="flex flex-col gap-4">
      {/* Подгонка */}
      <div>
        <div className="text-xs font-semibold mb-2 flex items-center gap-1">
          <Icon name="Maximize2" size={12} /> Подгонка
        </div>
        <div className="grid grid-cols-3 gap-1">
          {(['contain', 'cover', 'stretch'] as FitMode[]).map(m => (
            <button key={m} onClick={() => setFit(m)}
              className="py-2 text-sm rounded border transition-colors"
              style={{ borderColor: fit === m ? 'hsl(var(--primary))' : 'hsl(var(--border))', background: fit === m ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--background))', color: fit === m ? 'hsl(var(--primary))' : 'inherit' }}
            >
              {m === 'contain' ? 'Вписать' : m === 'cover' ? 'Заполнить' : 'Растянуть'}
            </button>
          ))}
        </div>
      </div>

      {/* Масштаб */}
      <div>
        <div className="text-xs font-semibold mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1"><Icon name="ZoomIn" size={12} /> Масштаб</span>
          <span className="text-muted-foreground">{Math.round(scale * 100)}%</span>
        </div>
        <input type="range" min={0.2} max={3} step={0.05} value={scale} onChange={e => setScale(parseFloat(e.target.value))} className="w-full" style={{ height: 28 }} />
        <div className="flex gap-2 mt-2">
          <button onClick={() => setScale(s => Math.max(0.2, s - 0.1))} className="flex-1 py-2 text-sm rounded border border-border">−</button>
          <button onClick={() => setScale(1)} className="flex-1 py-2 text-sm rounded border border-border">100%</button>
          <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="flex-1 py-2 text-sm rounded border border-border">+</button>
        </div>
      </div>

      {/* Смещение */}
      <div>
        <div className="text-xs font-semibold mb-2 flex items-center gap-1"><Icon name="Move" size={12} /> Смещение</div>
        <div className="text-xs text-muted-foreground mb-1">По горизонтали: {offsetX}%</div>
        <input type="range" min={-50} max={50} step={1} value={offsetX} onChange={e => setOffsetX(parseInt(e.target.value))} className="w-full" style={{ height: 28 }} />
        <div className="text-xs text-muted-foreground mb-1 mt-3">По вертикали: {offsetY}%</div>
        <input type="range" min={-50} max={50} step={1} value={offsetY} onChange={e => setOffsetY(parseInt(e.target.value))} className="w-full" style={{ height: 28 }} />
      </div>

      {/* Поворот */}
      <div>
        <div className="text-xs font-semibold mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1"><Icon name="RotateCw" size={12} /> Поворот</span>
          <span className="text-muted-foreground">{rotation}°</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setRotation(r => r - 90)} className="flex-1 py-2 text-sm rounded border border-border">−90°</button>
          <button onClick={() => setRotation(0)} className="flex-1 py-2 text-sm rounded border border-border">0°</button>
          <button onClick={() => setRotation(r => r + 90)} className="flex-1 py-2 text-sm rounded border border-border">+90°</button>
        </div>
      </div>

      {/* Обрезка */}
      <div>
        <div className="text-xs font-semibold mb-2 flex items-center gap-1"><Icon name="Crop" size={12} /> Обрезка</div>
        <button
          onClick={() => { setCropMode(!cropMode); if (cropMode) setCrop(null); }}
          className="w-full py-2.5 text-sm rounded border transition-colors"
          style={{ borderColor: cropMode ? 'hsl(var(--primary))' : 'hsl(var(--border))', background: cropMode ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--background))', color: cropMode ? 'hsl(var(--primary))' : 'inherit' }}
        >
          {cropMode ? 'Выключить обрезку' : 'Включить обрезку'}
        </button>
        {crop && crop.w > 0 && (
          <button onClick={() => setCrop(null)} className="w-full mt-2 py-2 text-sm rounded border border-border">
            Сбросить выделение
          </button>
        )}
        <div className="text-xs text-muted-foreground mt-2">
          {cropMode ? 'Проведите пальцем по превью' : 'Включите режим и выделите область на превью.'}
        </div>
      </div>

      {/* Сброс */}
      <button onClick={resetAll} className="w-full py-2.5 text-sm rounded border border-border flex items-center justify-center gap-1">
        <Icon name="RotateCcw" size={12} /> Сбросить всё
      </button>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="rounded-lg shadow-2xl flex flex-col"
        style={{
          background: 'hsl(var(--background))',
          width: '100vw',
          maxWidth: isLandscape ? 1100 : 560,
          height: isLandscape ? '100dvh' : '95dvh',
          maxHeight: '100dvh',
          border: '1px solid hsl(var(--border))',
          borderRadius: isLandscape ? 0 : undefined,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="ImageDown" size={18} />
            <h3 className="text-base font-semibold">Редактор изображения</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-muted">
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={`flex flex-1 overflow-hidden ${isLandscape ? 'flex-row' : 'flex-col'}`}>

          {/* Превью */}
          <div
            className="flex items-center justify-center p-2 min-h-0 min-w-0"
            style={{
              background: 'hsl(var(--muted))',
              flex: isLandscape ? '1 1 0' : '0 0 40%',
              minHeight: isLandscape ? 0 : 180,
            }}
          >
            <div
              ref={previewRef}
              className="relative bg-white shadow-lg overflow-hidden"
              style={{
                width: '100%',
                height: '100%',
                maxWidth: isLandscape ? 700 : '100%',
                maxHeight: '100%',
                cursor: cropMode ? 'crosshair' : 'default',
                touchAction: cropMode ? 'none' : 'auto',
              }}
              onMouseDown={e => startCrop(e.clientX, e.clientY)}
              onMouseMove={e => moveCrop(e.clientX, e.clientY)}
              onMouseUp={endCrop}
              onMouseLeave={endCrop}
              onTouchStart={e => { if (cropMode) { e.preventDefault(); startCrop(e.touches[0].clientX, e.touches[0].clientY); } }}
              onTouchMove={e => { if (cropMode) { e.preventDefault(); moveCrop(e.touches[0].clientX, e.touches[0].clientY); } }}
              onTouchEnd={endCrop}
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt="preview"
                draggable={false}
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: objectFitCss,
                  transform: `translate(${offsetX}%, ${offsetY}%) scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: 'center',
                  transition: drawingRef.current ? 'none' : 'transform 0.1s',
                  pointerEvents: 'none',
                }}
              />
              {crop && crop.w > 0 && crop.h > 0 && (
                <div style={{
                  position: 'absolute', left: `${crop.x}%`, top: `${crop.y}%`,
                  width: `${crop.w}%`, height: `${crop.h}%`,
                  border: '2px dashed hsl(var(--primary))',
                  background: 'hsla(var(--primary), 0.1)', pointerEvents: 'none',
                }} />
              )}
              {cropMode && !crop && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-xs px-3 py-2 rounded text-center" style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}>
                    Проведите пальцем по изображению
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Панель управления */}
          <div
            className="overflow-y-auto p-4 border-border"
            style={{
              background: 'hsl(var(--card))',
              flex: isLandscape ? '0 0 280px' : '1 1 auto',
              borderLeft: isLandscape ? '1px solid hsl(var(--border))' : 'none',
              borderTop: isLandscape ? 'none' : '1px solid hsl(var(--border))',
            }}
          >
            {controls}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border flex-shrink-0" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <button onClick={onClose} className="px-5 py-2.5 text-sm rounded border border-border hover:bg-muted">
            Отмена
          </button>
          <button
            onClick={applyAndSave}
            className="px-5 py-2.5 text-sm rounded text-white flex items-center gap-2"
            style={{ background: 'hsl(var(--primary))' }}
          >
            <Icon name="Check" size={14} /> Применить
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageEditDialog;
