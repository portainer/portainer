import {
  AlertTriangle,
  CheckCircle,
  type LucideIcon,
  Loader2,
  XCircle,
  MinusCircle,
  PauseCircle,
} from 'lucide-react';

import { Icon, IconMode } from '@@/Icon';
import { Tooltip } from '@@/Tip/Tooltip';

import { DecoratedEdgeStack, StatusSummary, SummarizedStatus } from './types';

export function EdgeStackStatus({
  edgeStack,
}: {
  edgeStack: DecoratedEdgeStack;
}) {
  const { StatusSummary } = edgeStack;

  const { icon, label, mode, spin, tooltip } = getStatus(StatusSummary);

  return (
    <div className="mx-auto inline-flex items-center gap-2">
      {icon && <Icon icon={icon} spin={spin} mode={mode} />}
      {label}
      {tooltip && <Tooltip message={tooltip} />}
    </div>
  );
}

function getStatus(summary?: StatusSummary): {
  label: string;
  icon?: LucideIcon;
  spin?: boolean;
  mode?: IconMode;
  tooltip?: string;
} {
  if (!summary) {
    return {
      label: 'Unavailable',
      icon: MinusCircle,
      mode: 'secondary',
      tooltip: 'Status summary is unavailable',
    };
  }
  const { Status, Reason } = summary;

  switch (Status) {
    case SummarizedStatus.Deploying:
      return {
        label: 'Deploying',
        icon: Loader2,
        spin: true,
        mode: 'primary',
      };
    case SummarizedStatus.Failed:
      return {
        label: 'Failed',
        icon: XCircle,
        mode: 'danger',
      };
    case SummarizedStatus.Paused:
      return {
        label: 'Paused',
        icon: PauseCircle,
        mode: 'warning',
      };
    case SummarizedStatus.PartiallyRunning:
      return {
        label: 'Partially Running',
        icon: AlertTriangle,
        mode: 'warning',
      };
    case SummarizedStatus.Completed:
      return {
        label: 'Completed',
        icon: CheckCircle,
        mode: 'success',
      };
    case SummarizedStatus.Running:
      return {
        label: 'Running',
        icon: CheckCircle,
        mode: 'success',
      };
    case SummarizedStatus.Unavailable:
    default:
      return {
        label: 'Unavailable',
        icon: MinusCircle,
        mode: 'secondary',
        tooltip: Reason,
      };
  }
}
