import { EnvironmentId } from '@/react/portainer/environments/types';

import { queryKeys as registriesQueryKeys } from '../../queries/query-keys';
import { RegistryId } from '../../types/registry';

export const queryKeys = {
  base: (registryId: RegistryId) =>
    [...registriesQueryKeys.item(registryId), 'repositories'] as const,
  repository: (registryId: RegistryId, repository: string) =>
    [...queryKeys.base(registryId), repository] as const,
  repositoryTags: (registryId: RegistryId, repository: string) =>
    [...queryKeys.repository(registryId, repository), 'tags'] as const,
  repositoryTag: (registryId: RegistryId, repository: string, tag: string) =>
    [...queryKeys.repository(registryId, repository), 'tags', tag] as const,
  tagDetails: ({
    registryId,
    repository,
    tag,
    ...params
  }: {
    repository: string;
    environmentId?: EnvironmentId;
    registryId: RegistryId;
    tag: string;
  }) =>
    [
      ...queryKeys.repositoryTag(registryId, repository, tag),
      'details',
      params,
    ] as const,
};
