import { DeviceRequest } from 'docker-types/generated/1.41';

import { Values } from './types';

export function getDefaultViewModel(): Values {
  return {
    enabled: false,
    useSpecific: false,
    selectedGPUs: ['all'],
    capabilities: ['compute', 'utility'],
  };
}

export function toViewModel(deviceRequests: Array<DeviceRequest> = []): Values {
  const deviceRequest = deviceRequests.find(
    (o) => o.Driver === 'nvidia' || o.Capabilities?.[0]?.[0] === 'gpu'
  );
  if (!deviceRequest) {
    return getDefaultViewModel();
  }

  const useSpecific = deviceRequest.Count !== -1;

  return {
    enabled: true,
    useSpecific,
    selectedGPUs: useSpecific ? deviceRequest.DeviceIDs || [] : ['all'],
    capabilities: deviceRequest.Capabilities?.[0] || [],
  };
}
