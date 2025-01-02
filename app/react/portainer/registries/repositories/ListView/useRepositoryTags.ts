import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';

import { Environment } from '@/react/portainer/environments/types';
import axios from '@/portainer/services/axios';

import { Registry } from '../../types/registry';
import { buildUrl } from '../../queries/build-url';
import { queryKeys } from '../../queries/query-keys';

export function useRepositoryTags({
  registryId,
  ...params
}: {
  registryId: Registry['Id'];
  repository: string;
  environmentId?: Environment['Id'];
}) {
  return useQuery({
    queryKey: [...queryKeys.item(registryId), params] as const,
    queryFn: () =>
      getRepositoryTags({
        ...params,
        registryId,
        n: 100,
        last: '',
      }),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export async function getRepositoryTags(
  {
    environmentId,
    registryId,
    repository,
    n,
    last,
  }: {
    registryId: Registry['Id'];
    repository: string;
    environmentId?: Environment['Id'];
    n?: number;
    last?: string;
  },
  acc: { name: string; tags: string[] } = { name: '', tags: [] }
): Promise<{ name: string; tags: string[] }> {
  const { data, headers } = await axios.get<{ name: string; tags: string[] }>(
    `${buildUrl(registryId)}/v2/${repository}/tags/list`,
    {
      params: {
        id: registryId,
        endpointId: environmentId,
        repository,
        n,
        last,
      },
    }
  );
  acc.name = data.name;
  acc.tags = _.concat(acc.tags, data.tags);

  if (headers.link) {
    const last = data.tags[data.tags.length - 1];
    return getRepositoryTags(
      { registryId, repository, n, last, environmentId },
      acc
    );
  }

  return acc;
}
