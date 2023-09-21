import { CreateContainerRequest } from '../types';

import { toRequest as toGPURequest } from './Gpu';
import { toConfigMemory } from './memory-utils';
import { Values } from './ResourcesTab';
import { toRequest as toResourcesRequest } from './ResourcesFieldset';

export function toRequest(
  oldConfig: CreateContainerRequest,
  values: Values
): CreateContainerRequest {
  return {
    ...oldConfig,
    HostConfig: {
      ...oldConfig.HostConfig,
      Privileged: values.runtime.privileged,
      Init: values.runtime.init,
      Runtime: values.runtime.type,
      Devices: values.devices.map((device) => ({
        PathOnHost: device.pathOnHost,
        PathInContainer: device.pathInContainer,
        CgroupPermissions: 'rwm',
      })),
      Sysctls: Object.fromEntries(
        values.sysctls.map((sysctl) => [sysctl.name, sysctl.value])
      ),
      ShmSize: toConfigMemory(values.sharedMemorySize),
      DeviceRequests: toGPURequest(
        oldConfig.HostConfig.DeviceRequests || [],
        values.gpu
      ),
      ...toResourcesRequest(oldConfig.HostConfig, values.resources),
    },
  };
}
