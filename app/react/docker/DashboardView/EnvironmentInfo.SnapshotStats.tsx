import { CpuIcon } from 'lucide-react';

import { humanize } from '@/portainer/filters/filters';
import memoryIcon from '@/assets/ico/memory.svg?c';

import { Icon } from '@@/Icon';

import { DockerSnapshot } from '../snapshots/types';

export function SnapshotStats({
  snapshot,
}: {
  snapshot: DockerSnapshot | undefined;
}) {
  if (!snapshot) {
    return null;
  }

  return (
    <span className="small text-muted flex gap-2">
      <span className="flex gap-1 items-center">
        <Icon icon={CpuIcon} /> {snapshot.TotalCPU}
      </span>
      <span className="flex gap-1 items-center">
        <Icon icon={memoryIcon} />
        {humanize(snapshot.TotalMemory)}
      </span>
    </span>
  );
}
