import _ from 'lodash';
import {
  AlertTriangle,
  CheckCircle,
  type Icon as IconType,
  Loader2,
  XCircle,
} from 'lucide-react';

import { Icon, IconMode } from '@@/Icon';

import { DeploymentStatus, EdgeStack, StatusType } from '../../types';

export function EdgeStackStatus({ edgeStack }: { edgeStack: EdgeStack }) {
  const status = Object.values(edgeStack.Status);
  const lastStatus = _.compact(status.map((s) => _.last(s.Status)));

  const { icon, label, mode, spin } = getStatus(
    edgeStack.NumDeployments,
    lastStatus
  );

  return (
    <div className="mx-auto inline-flex items-center gap-2">
      {icon && <Icon icon={icon} spin={spin} mode={mode} />}
      {label}
    </div>
  );
}

function getStatus(
  numDeployments: number,
  envStatus: Array<DeploymentStatus>
): {
  label: string;
  icon?: IconType;
  spin?: boolean;
  mode?: IconMode;
} {
  if (envStatus.length < numDeployments) {
    return {
      label: 'Deploying',
      icon: Loader2,
      spin: true,
      mode: 'primary',
    };
  }

  const allFailed = envStatus.every((s) => s.Type === StatusType.Error);

  if (allFailed) {
    return {
      label: 'Failed',
      icon: XCircle,
      mode: 'danger',
    };
  }

  const allRunning = envStatus.every((s) => s.Type === StatusType.Running);

  if (allRunning) {
    return {
      label: 'Running',
      icon: CheckCircle,
      mode: 'success',
    };
  }

  const hasDeploying = envStatus.some((s) => s.Type === StatusType.Deploying);
  const hasRunning = envStatus.some((s) => s.Type === StatusType.Running);
  const hasFailed = envStatus.some((s) => s.Type === StatusType.Error);

  if (hasRunning && hasFailed && !hasDeploying) {
    return {
      label: 'Partially Running',
      icon: AlertTriangle,
      mode: 'warning',
    };
  }

  return {
    label: 'Deploying',
    icon: Loader2,
    spin: true,
    mode: 'primary',
  };
}
