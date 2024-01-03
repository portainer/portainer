import { Boxes, Sliders } from 'lucide-react';

import { BoxSelectorOption } from '@@/BoxSelector';

import { DeploymentType } from '../types';

export function getDeploymentOptions(
  supportGlobalDeployment: boolean
): ReadonlyArray<BoxSelectorOption<DeploymentType>> {
  return [
    {
      id: 'deployment_replicated',
      label: 'Replicated',
      value: 'Replicated',
      icon: Sliders,
      iconType: 'badge',
      description: 'Run one or multiple instances of this container',
    },
    {
      id: 'deployment_global',
      disabled: () => !supportGlobalDeployment,
      tooltip: () =>
        !supportGlobalDeployment
          ? 'The storage or access policy used for persisted folders cannot be used with this option'
          : '',
      label: 'Global',
      description:
        'Application will be deployed as a DaemonSet with an instance on each node of the cluster',
      value: 'Global',
      icon: Boxes,
      iconType: 'badge',
    },
  ] as const;
}
