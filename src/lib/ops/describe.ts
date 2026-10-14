import { OpPayload } from './types';
import { calcBeltFire, calcMachineFire, fmt } from '@/lib/gio/fire-load-calc';

export const KIND_LABELS: Record<OpPayload['type'], string> = {
  zvt: 'ЗВТ',
  vgsch: 'Треугольник',
  gas: 'Взрываемость газа',
  machine: 'Пожар техники',
  belt: 'Пожар ленты',
};

export const KIND_ICONS: Record<OpPayload['type'], string> = {
  zvt: 'Thermometer',
  vgsch: 'Triangle',
  gas: 'Flame',
  machine: 'Truck',
  belt: 'GalleryHorizontal',
};

export function describePayload(p: OpPayload): { danger: boolean; summary: string } {
  if (p.type === 'zvt') {
    const r = p.result;
    const turn = r.mode === 'moving' ? `, поворот ${addMin(r.entryTime, r.tForward)}` : '';
    return {
      danger: r.rescueLimited || r.temp > 40,
      summary: `t = ${r.temp} °C, вход ${r.entryTime}${turn}, выход ${r.exitTime} (${Math.round(r.maxTotal)} мин)`,
    };
  }
  if (p.type === 'vgsch') {
    const { input, result } = p;
    return {
      danger: result.isExplosive,
      summary: `${result.isExplosive ? 'ВЗРЫВООПАСНА' : 'Невзрывоопасна'}: CH₄ ${input.ch4}%, CO ${input.co}%, H₂ ${input.h2}%, O₂ ${input.o2}%`,
    };
  }
  if (p.type === 'machine') {
    const r = calcMachineFire(p.materials, p.flow);
    if (!r) return { danger: false, summary: `${p.name}: нет данных` };
    return {
      danger: false,
      summary: `${p.name}: Q = ${fmt(r.powerMW)} МВт, ${fmt(r.timeMin, 0)} мин${r.deltaT !== null ? `, Δt = ${fmt(r.deltaT, 1)} °C` : ''}`,
    };
  }
  if (p.type === 'belt') {
    const r = calcBeltFire(p.input);
    if (!r) return { danger: false, summary: 'Лента: нет данных' };
    return {
      danger: false,
      summary: `Лента ${p.input.length} м: Q30 = ${fmt(r.power30)}, Q60 = ${fmt(r.power60)} МВт${p.input.flowM3s > 0 ? `, Δt = ${fmt(r.deltaTmax, 1)} °C` : ''}`,
    };
  }
  const r = p.result;
  return {
    danger: r.isExplosive,
    summary: `${r.label}: ${r.gas.formula} ${r.gasPct}%, O₂ ${r.o2Pct}%`,
  };
}

function addMin(hhmm: string, mins: number) {
  const [h, m] = hhmm.split(':').map(Number);
  const t = (h * 60 + m + Math.round(mins)) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}
