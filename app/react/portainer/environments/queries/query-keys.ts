import { EnvironmentId } from '../types';

export const environmentQueryKeys = {
  base: () => ['environments'] as const,
  item: (id: EnvironmentId) => [...environmentQueryKeys.base(), id] as const,
  registries: (environmentId: EnvironmentId, namespace?: string) =>
    [
      ...environmentQueryKeys.base(),
      environmentId,
      'registries',
      namespace,
    ] as const,
};
