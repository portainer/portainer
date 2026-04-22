import { Badge, BadgeType } from '@@/Badge';

import { WorkflowStatus, WorkflowType } from './types';

export function StatusBadge({ status }: { status: WorkflowStatus }) {
  const BADGE_TYPE: Record<WorkflowStatus, BadgeType> = {
    healthy: 'success',
    error: 'danger',
    syncing: 'warn',
    paused: 'muted',
    unknown: 'muted',
  };
  const LABELS: Record<WorkflowStatus, string> = {
    healthy: 'Healthy',
    error: 'Error',
    syncing: 'Syncing',
    paused: 'Paused',
    unknown: 'Unknown',
  };
  return <Badge type={BADGE_TYPE[status]}>● {LABELS[status]}</Badge>;
}

export function TypeBadge({ type }: { type: WorkflowType }) {
  const LABELS: Record<WorkflowType, string> = {
    stack: 'Stack',
    edgeStack: 'Edge Stack',
  };
  return <Badge type="muted">{LABELS[type]}</Badge>;
}
