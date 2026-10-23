import { Badge } from '@@/Badge';
import { StatusDot } from '@@/primitives/StatusDot';

import {
  WorkflowStatus,
  WorkflowType,
  DeploymentPlatform,
} from '../workflows/types';

const BADGE_TYPE = {
  healthy: 'success',
  error: 'danger',
  syncing: 'warn',
  paused: 'muted',
  unknown: 'muted',
} as const;

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  healthy: 'Healthy',
  error: 'Error',
  syncing: 'Syncing',
  paused: 'Paused',
  unknown: 'Unknown',
};

export function StatusBadge({ status }: { status: WorkflowStatus }) {
  return (
    <Badge type={BADGE_TYPE[status]} shape="pill" size="md">
      <StatusDot color={BADGE_TYPE[status]} size="xs" /> {STATUS_LABELS[status]}
    </Badge>
  );
}

const TYPE_LABELS: Record<WorkflowType, string> = {
  stack: 'Stack',
  edgeStack: 'Edge Stack',
};
export function TypeBadge({ type }: { type: WorkflowType }) {
  return <Badge type="muted">{TYPE_LABELS[type]}</Badge>;
}

const PLATFORM_LABELS: Record<DeploymentPlatform, string> = {
  dockerStandalone: 'Docker Standalone',
  dockerSwarm: 'Docker Swarm',
  kubernetes: 'Kubernetes',
};
export function PlatformBadge({
  platform,
}: {
  platform: DeploymentPlatform | undefined;
}) {
  return (
    <Badge type="muted">
      {platform ? PLATFORM_LABELS[platform] : 'Unknown'}
    </Badge>
  );
}
