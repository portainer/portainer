import { KubernetesSnapshot } from '@/react/portainer/environments/types';
import { humanize } from '@/portainer/filters/filters';
import { addPlural } from '@/portainer/helpers/strings';

import { EnvironmentStatsItem } from '@@/EnvironmentStatsItem';

interface Props {
  snapshot?: KubernetesSnapshot;
}

export function EnvironmentStatsKubernetes({ snapshot }: Props) {
  if (!snapshot) {
    return <>No snapshot available</>;
  }

  return (
    <>
      <EnvironmentStatsItem
        icon="cpu"
        featherIcon
        value={`${snapshot.TotalCPU} CPU`}
      />

      <EnvironmentStatsItem
        icon="svg-memory"
        featherIcon
        value={`${humanize(snapshot.TotalMemory)} RAM`}
      />

      <EnvironmentStatsItem
        value={addPlural(snapshot.NodeCount, 'node')}
        icon="hard-drive"
        featherIcon
      />
    </>
  );
}
