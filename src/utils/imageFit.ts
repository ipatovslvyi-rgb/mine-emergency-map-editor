export interface ContainRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Вычисляет прямоугольник, в который вписывается изображение внутри контейнера
 * с сохранением пропорций (аналог CSS object-fit: contain).
 * Если размеры изображения неизвестны — считает, что изображение занимает весь контейнер.
 */
export function computeContainRect(
  containerW: number,
  containerH: number,
  imgW: number,
  imgH: number
): ContainRect {
  if (!containerW || !containerH || !imgW || !imgH) {
    return { x: 0, y: 0, w: containerW || 0, h: containerH || 0 };
  }
  const scale = Math.min(containerW / imgW, containerH / imgH);
  const w = imgW * scale;
  const h = imgH * scale;
  const x = (containerW - w) / 2;
  const y = (containerH - h) / 2;
  return { x, y, w, h };
}
