import { DetailsTable } from '@@/DetailsTable';

import { DockerSnapshot } from '../snapshots/types';

export function GpuInfo({
  gpus,
  snapshot,
}: {
  gpus: Array<{ name: string }>;
  snapshot?: DockerSnapshot;
}) {
  if (!snapshot) {
    return null;
  }

  const gpuUseAll = snapshot.GpuUseAll;
  const gpuUseList = snapshot.GpuUseList;
  let gpuFreeStr = '';
  if (gpuUseAll) {
    gpuFreeStr = 'none';
  } else {
    gpuFreeStr = buildGpusStr(gpuUseList, gpus);
  }

  return (
    <DetailsTable.Row label={gpus.length <= 1 ? 'GPU' : 'GPUs'}>
      {gpuFreeStr}
    </DetailsTable.Row>
  );

  function buildGpusStr(
    gpuUseList: Array<string>,
    gpus: Array<{ name: string }> = []
  ) {
    if (!gpus.length) {
      return 'none';
    }

    const gpuUseSet = new Set(gpuUseList);
    const gpusAvailable: Record<string, number> = {};
    for (let i = 0; i < gpus.length; i++) {
      if (!gpuUseSet.has(gpus[i].name)) {
        if (gpusAvailable[gpus[i].name]) {
          gpusAvailable[gpus[i].name] += 1;
        } else {
          gpusAvailable[gpus[i].name] = 1;
        }
      }
    }

    const gpusKeys = Object.keys(gpusAvailable);

    if (!gpusKeys.length) {
      return 'none';
    }

    return Object.keys(gpusAvailable)
      .map((gpuAvailable) => `${gpusAvailable[gpuAvailable]} x ${gpuAvailable}`)
      .join(' + ');
  }
}
