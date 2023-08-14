import _ from 'lodash';
import {
  AlertTriangle,
  CheckCircle,
  type Icon as IconType,
  Loader2,
  XCircle,
  MinusCircle,
} from 'lucide-react';

import { useEnvironmentList } from '@/react/portainer/environments/queries';
import { isVersionSmaller } from '@/react/common/semver-utils';

import { Icon, IconMode } from '@@/Icon';
import { Tooltip } from '@@/Tip/Tooltip';

import { DeploymentStatus, EdgeStack, StatusType } from '../../types';

export function EdgeStackStatus({ edgeStack }: { edgeStack: EdgeStack }) {
  const status = Object.values(edgeStack.Status);
  const lastStatus = _.compact(status.map((s) => _.last(s.Status)));

  const environmentsQuery = useEnvironmentList({ edgeStackId: edgeStack.Id });

  if (environmentsQuery.isLoading) {
    return null;
  }

  const hasOldVersion = environmentsQuery.environments.some((env) =>
    isVersionSmaller(env.Agent.Version, '2.19.0')
  );

  const { icon, label, mode, spin, tooltip } = getStatus(
    edgeStack.NumDeployments,
    lastStatus,
    hasOldVersion
  );

  return (
    <div className="mx-auto inline-flex items-center gap-2">
      {icon && <Icon icon={icon} spin={spin} mode={mode} />}
      {label}
      {tooltip && <Tooltip message={tooltip} />}
    </div>
  );
}

function getStatus(
  numDeployments: number,
  envStatus: Array<DeploymentStatus>,
  hasOldVersion: boolean
): {
  label: string;
  icon?: IconType;
  spin?: boolean;
  mode?: IconMode;
  tooltip?: string;
} {
  if (!numDeployments || hasOldVersion) {
    return {
      label: 'Unavailable',
      icon: MinusCircle,
      mode: 'secondary',
      tooltip: getUnavailableTooltip(),
    };
  }

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

  const allRunning = envStatus.every(
    (s) =>
      s.Type === StatusType.Running ||
      (s.Type === StatusType.DeploymentReceived && hasOldVersion)
  );

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

  function getUnavailableTooltip() {
    if (!numDeployments) {
      return 'Your edge stack is currently unavailable due to the absence of an available environment in your edge group';
    }

    if (hasOldVersion) {
      return 'Please note that the new status feature for the Edge stack is only available for Edge Agent versions 2.19.0 and above. To access the status of your edge stack, it is essential to upgrade your Edge Agent to a corresponding version that is compatible with your Portainer server.';
    }

    return '';
  }
}
