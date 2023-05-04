import { Boxes, Sliders } from 'lucide-react';

import { KubernetesApplicationDeploymentTypes } from '@/kubernetes/models/application/models';

import { BoxSelectorOption } from '@@/BoxSelector';

export function getDeploymentOptions(
  supportGlobalDeployment: boolean
): ReadonlyArray<BoxSelectorOption<number>> {
  return [
    {
      id: 'deployment_replicated',
      label: 'Replicated',
      value: KubernetesApplicationDeploymentTypes.REPLICATED,
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
      value: KubernetesApplicationDeploymentTypes.GLOBAL,
      icon: Boxes,
      iconType: 'badge',
    },
  ] as const;
}
