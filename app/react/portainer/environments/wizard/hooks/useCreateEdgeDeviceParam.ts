import { useCurrentStateAndParams } from '@uirouter/react';

export function useCreateEdgeDeviceParam() {
  const {
    params: { edgeDevice: edgeDeviceParam },
  } = useCurrentStateAndParams();

  const createEdgeDevice = edgeDeviceParam ? edgeDeviceParam === 'true' : false;

  return createEdgeDevice;
}
