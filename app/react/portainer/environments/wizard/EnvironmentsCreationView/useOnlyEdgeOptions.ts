import { EnvironmentCreationTypes } from '@/react/portainer/environments/types';

import { Value, BoxSelectorOption } from '@@/BoxSelector/types';

import { useCreateEdgeDeviceParam } from '../hooks/useCreateEdgeDeviceParam';

export function useFilterEdgeOptionsIfNeeded<
  T extends Value = EnvironmentCreationTypes
>(options: BoxSelectorOption<T>[], edgeValue: T) {
  const createEdgeDevice = useCreateEdgeDeviceParam();

  if (!createEdgeDevice) {
    return options;
  }

  return options.filter((option) => option.value === edgeValue);
}
