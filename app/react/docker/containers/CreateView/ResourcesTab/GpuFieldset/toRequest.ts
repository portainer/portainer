import { DeviceRequest } from 'docker-types/generated/1.41';

import { Values } from './types';

export function toRequest(
  deviceRequests: Array<DeviceRequest>,
  gpu: Values
): Array<DeviceRequest> {
  const driver = 'nvidia';

  const otherDeviceRequests = deviceRequests.filter(
    (deviceRequest) => deviceRequest.Driver !== driver
  );

  if (!gpu.enabled) {
    return otherDeviceRequests;
  }

  const deviceRequest: DeviceRequest = {
    Driver: driver,
    Count: -1,
    DeviceIDs: [], // must be empty if Count != 0 https://github.com/moby/moby/blob/master/daemon/nvidia_linux.go#L50
    Capabilities: [], // array of ORed arrays of ANDed capabilites = [ [c1 AND c2] OR [c1 AND c3] ] : https://github.com/moby/moby/blob/master/api/types/container/host_config.go#L272
  };

  if (gpu.useSpecific) {
    deviceRequest.DeviceIDs = gpu.selectedGPUs;
    deviceRequest.Count = 0;
  }
  deviceRequest.Capabilities = [gpu.capabilities];

  return [...otherDeviceRequests, deviceRequest];
}
