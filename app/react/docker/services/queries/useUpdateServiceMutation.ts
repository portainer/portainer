import {
  TaskSpec,
  ServiceSpec,
  ServiceUpdateResponse,
} from 'docker-types/generated/1.41';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { mutationOptions, withError } from '@/react-tools/react-query';

import { encodeRegistryCredentials } from '../../images/queries/encodeRegistryCredentials';
import { urlBuilder } from '../axios/urlBuilder';

import { queryKeys } from './query-keys';

export function useUpdateServiceMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    updateService,
    mutationOptions(
      {
        onSuccess(data, { environmentId }) {
          return queryClient.invalidateQueries(queryKeys.list(environmentId));
        },
      },
      withError('Unable to update service')
    )
  );
}

async function updateService({
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
      urlBuilder(environmentId, serviceId, 'update'),
      config,
      {
        params: {
          rollback,
          version,
        },
        ...(registryId
          ? {
              headers: {
                'X-Registry-Id': encodeRegistryCredentials(registryId),
              },
            }
          : {}),
      }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to update service');
  }
}

export interface ServiceUpdateConfig {
  Name: string;
  Labels: Record<string, string>;
  TaskTemplate: TaskSpec;
  Mode: ServiceSpec['Mode'];
  UpdateConfig: ServiceSpec['UpdateConfig'];
  Networks: ServiceSpec['Networks'];
  EndpointSpec: ServiceSpec['EndpointSpec'];
}
