import { ServiceUpdateResponse } from 'docker-types/generated/1.41';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';

import { ServiceUpdateConfig } from '../types';
import { withRegistryAuthHeader } from '../../proxy/queries/utils';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

export function useUpdateServiceMutation(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();

  return useMutation(
    updateService,
    mutationOptions(
      withInvalidate(queryClient, [queryKeys.list(environmentId)]),
      withError('Unable to update service')
    )
  );
}

export async function updateService({
  environmentId,
  serviceId,
  config,
  rollback,
  version,
  registryId,
}: {
  environmentId: EnvironmentId;
  serviceId: string;
  config: ServiceUpdateConfig;
  rollback?: 'previous';
  version: number;
  registryId?: number;
}) {
  try {
    const { data } = await axios.post<ServiceUpdateResponse>(
      buildUrl(environmentId, serviceId, 'update'),
      config,
      {
        params: {
          rollback,
          version,
        },
        headers: {
          version: '1.29', // https://github.com/orgs/portainer/discussions/9407#discussioncomment-6559219
          ...withRegistryAuthHeader(registryId),
        },
      }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to update service');
  }
}
