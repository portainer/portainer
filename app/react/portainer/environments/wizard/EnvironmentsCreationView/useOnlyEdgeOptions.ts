import { EnvironmentCreationTypes } from '@/react/portainer/environments/types';

import { BoxSelectorOption } from '@@/BoxSelector';

import { useCreateEdgeDeviceParam } from '../hooks/useCreateEdgeDeviceParam';

export function useFilterEdgeOptionsIfNeeded<T = EnvironmentCreationTypes>(
  options: BoxSelectorOption<T>[],
  edgeValue: T
) {
  const createEdgeDevice = useCreateEdgeDeviceParam();

  if (!createEdgeDevice) {
    return options;
  }

  return options.filter((option) => option.value === edgeValue);
}
