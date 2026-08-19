import { DeviceRequest } from 'docker-types/generated/1.44';
import _ from 'lodash';

import { DetailsTable } from '@@/DetailsTable';

interface GpuRowProps {
  deviceRequests?: Array<DeviceRequest>;
}

export function GpuRow({ deviceRequests }: GpuRowProps) {
  if (!deviceRequests?.length) {
    return null;
  }

  const gpuCommand = computeDockerGPUCommand(deviceRequests);

  if (!gpuCommand) {
    return null;
  }

  return <DetailsTable.Row label="GPUS">{gpuCommand}</DetailsTable.Row>;
}

export function computeDockerGPUCommand(
  deviceRequests: Array<DeviceRequest>
): string | null {
  const gpuOptions = deviceRequests?.find(
    (o) =>
      o.Driver === 'nvidia' ||
      (o.Capabilities &&
        o.Capabilities.length > 0 &&
        o.Capabilities[0].length > 0 &&
        o.Capabilities[0][0] === 'gpu')
  );
  if (!gpuOptions) {
    return 'No GPU config found';
  }

  let gpuStr = 'all';
  if (gpuOptions.Count !== -1) {
    gpuStr = `"device=${_.join(gpuOptions.DeviceIDs, ',')}"`;
  }

  // we only support a single set of capabilities for now
  // creation UI needs to be reworked in order to support OR combinations of AND capabilities
  const capStr = gpuOptions.Capabilities
    ? `"capabilities=${_.join(gpuOptions.Capabilities[0], ',')}"`
    : '';
  return `${gpuStr},${capStr}`;
}
