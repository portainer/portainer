import { Cpu, HardDrive } from 'lucide-react';

import { KubernetesSnapshot } from '@/react/portainer/environments/types';
import { humanize } from '@/portainer/filters/filters';
import { addPlural } from '@/portainer/helpers/strings';
import Memory from '@/assets/ico/memory.svg?c';

import { StatsItem } from '@@/StatsItem';

interface Props {
  snapshot?: KubernetesSnapshot;
}

export function EnvironmentStatsKubernetes({ snapshot }: Props) {
  if (!snapshot) {
    return <>No snapshot available</>;
  }

  return (
    <>
      <StatsItem icon={Cpu} value={`${snapshot.TotalCPU} CPU`} />

      <StatsItem
        icon={Memory}
        value={`${humanize(snapshot.TotalMemory)} RAM`}
      />

      <StatsItem
        value={addPlural(snapshot.NodeCount, 'node')}
        icon={HardDrive}
      />
    </>
  );
}
