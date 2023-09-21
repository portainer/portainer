import { ContainerJSON } from '../../queries/container';

import { toDevicesViewModel } from './DevicesField';
import { toViewModel as toGpuViewModel } from './Gpu';
import { toViewModelCpu, toViewModelMemory } from './memory-utils';
import { Values } from './ResourcesTab';

export function toViewModel(config: ContainerJSON): Values {
  return {
    runtime: {
      privileged: config.HostConfig?.Privileged || false,
      init: config.HostConfig?.Init || false,
      type: config.HostConfig?.Runtime || '',
    },
    devices: toDevicesViewModel(config.HostConfig?.Devices || []),
    sysctls: Object.entries(config.HostConfig?.Sysctls || {}).map(
      ([name, value]) => ({
        name,
        value,
      })
    ),
    gpu: toGpuViewModel(config.HostConfig?.DeviceRequests || []),
    sharedMemorySize: toViewModelMemory(config.HostConfig?.ShmSize),
    resources: {
      cpu: toViewModelCpu(config.HostConfig?.NanoCpus),
      reservation: toViewModelMemory(config.HostConfig?.MemoryReservation),
      limit: toViewModelMemory(config.HostConfig?.Memory),
    },
  };
}

export function getDefaultViewModel(): Values {
  return {
    runtime: {
      privileged: false,
      init: false,
      type: '',
    },
    devices: [],
    sysctls: [],
    sharedMemorySize: 64,
    gpu: toGpuViewModel(),
    resources: {
      reservation: 0,
      limit: 0,
      cpu: 0,
    },
  };
}
