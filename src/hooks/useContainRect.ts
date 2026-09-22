import { useEffect, useRef, useState } from 'react';
import { computeContainRect, ContainRect } from '@/utils/imageFit';

/**
 * Отслеживает прямоугольник, в который вписывается изображение (object-fit: contain)
 * внутри контейнера containerRef. Пересчитывается при изменении размеров контейнера
 * и при смене изображения.
 */
export function useContainRect(
  containerRef: React.RefObject<HTMLElement>,
  imgUrl: string | undefined
): ContainRect | null {
  const [rect, setRect] = useState<ContainRect | null>(null);
  const imgSizeRef = useRef<{ w: number; h: number } | null>(null);

  const recompute = () => {
    const el = containerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (!w || !h) return;
    const imgSize = imgSizeRef.current;
    setRect(computeContainRect(w, h, imgSize?.w ?? 0, imgSize?.h ?? 0));
  };

  useEffect(() => {
    if (!imgUrl) {
      imgSizeRef.current = null;
      setRect(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      imgSizeRef.current = { w: img.naturalWidth, h: img.naturalHeight };
      recompute();
    };
    img.src = imgUrl;
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgUrl]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => recompute());
    ro.observe(el);
    recompute();
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef.current, imgUrl]);

  return rect;
}
