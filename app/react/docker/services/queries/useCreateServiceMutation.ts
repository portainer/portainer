import { Service } from 'docker-types/generated/1.41';
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

export function useCreateServiceMutation(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();

  return useMutation(
    createService,
    mutationOptions(
      withInvalidate(queryClient, [queryKeys.list(environmentId)]),
      withError('Unable to create service')
    )
  );
}

export async function createService({
  environmentId,
  config,
  registryId,
}: {
  environmentId: EnvironmentId;
  config: ServiceUpdateConfig;
  registryId?: number;
}) {
  try {
    const { data } = await axios.post<Service>(
      buildUrl(environmentId, 'create'),
      config,
      {
        headers: {
          version: '1.29', // https://github.com/orgs/portainer/discussions/9407#discussioncomment-6559219
          ...withRegistryAuthHeader(registryId),
        },
      }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to create service');
  }
}
