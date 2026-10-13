import { OpPayload } from './types';

export const KIND_LABELS: Record<OpPayload['type'], string> = {
  zvt: 'ЗВТ',
  vgsch: 'Треугольник',
  gas: 'Взрываемость газа',
};

export const KIND_ICONS: Record<OpPayload['type'], string> = {
  zvt: 'Thermometer',
  vgsch: 'Triangle',
  gas: 'Flame',
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
