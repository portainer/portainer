import { BoxSelectorOption } from '@/portainer/components/BoxSelector';
import { EnvironmentCreationTypes } from '@/portainer/environments/types';

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
