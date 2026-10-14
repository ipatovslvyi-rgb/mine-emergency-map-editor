import type { ZvtResult } from '@/lib/gio/zvt-calc';
import type { GasZoneResult, VgschInput, VgschResult } from '@/lib/gio/explosion-triangle-calc';
import type { BeltInputs, Material } from '@/lib/gio/fire-load-calc';

export type OpRole = 'commander' | 'base' | 'kp';

export const ROLE_LABELS: Record<OpRole, string> = {
  commander: 'Командир отделения',
  base: 'Подземная база',
  kp: 'Командный пункт',
};

export const ROLE_ICONS: Record<OpRole, string> = {
  commander: 'UserCheck',
  base: 'Warehouse',
  kp: 'RadioTower',
};

export interface OpMeta {
  object?: string;
  squad?: string;
  commander?: string;
  performer?: string;
  place?: string;
}

export type OpPayload =
  | { type: 'zvt'; result: ZvtResult; meta: OpMeta }
  | { type: 'vgsch'; input: VgschInput; result: VgschResult; meta: OpMeta }
  | { type: 'gas'; result: GasZoneResult; meta: OpMeta }
  | { type: 'machine'; name: string; materials: Material[]; flow: number; meta: OpMeta }
  | { type: 'belt'; input: BeltInputs; meta: OpMeta };

export interface OpEvent {
  client_id: string;
  kind: OpPayload['type'];
  danger: boolean;
  summary: string;
  payload: OpPayload;
  created_at: string;
  id?: number;
  received_at?: string;
  sent?: boolean;
  voice?: boolean;
}

export interface OpSession {
  code: string;
  title: string;
  role: OpRole;
  token?: string;
  active: boolean;
  joinedAt: string;
}
