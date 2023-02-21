import { useMutation, useQuery, useQueryClient } from 'react-query';
import { compact } from 'lodash';

import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { getNamespaces } from '../namespaces/service';

import { Service } from './types';

const serviceKeys = {
  all: ['environments', 'kubernetes', 'namespace', 'service'] as const,
  namespace: (
    environmentId: EnvironmentId,
    namespace: string,
    service: string
  ) => [...serviceKeys.all, String(environmentId), namespace, service] as const,
};

async function getServices(
  environmentId: EnvironmentId,
  namespace: string,
  lookupApps: boolean
) {
  try {
    let url = `kubernetes/${environmentId}/namespaces/${namespace}/services`;
    if (lookupApps) {
      url += '?lookupapplications=true';
    }

    const { data: services } = await axios.get<Service[]>(url);
    return services;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve services');
  }
}

export function useServices(environmentId: EnvironmentId) {
  return useQuery(
    ['environments', environmentId, 'kubernetes', 'services'],
    async () => {
      const namespaces = await getNamespaces(environmentId);
      const settledServicesPromise = await Promise.allSettled(
        Object.keys(namespaces).map((namespace) =>
          getServices(environmentId, namespace, true)
        )
      );
      return compact(
        settledServicesPromise.filter(isFulfilled).flatMap((i) => i.value)
      );
    },
    withError('Unable to get services.')
  );
}

function isFulfilled<T>(
  input: PromiseSettledResult<T>
): input is PromiseFulfilledResult<T> {
  return input.status === 'fulfilled';
}

export function useDeleteServices() {
  const queryClient = useQueryClient();
  return useMutation(
    ({
      environmentId,
      data,
    }: {
      environmentId: EnvironmentId;
      data: Record<string, string[]>;
    }) => deleteServices(environmentId, data),
    mutationOptions(
      withError('Unable to delete service(s)'),
      withInvalidate(queryClient, [serviceKeys.all])
    )
  );
}

export async function deleteServices(
  environmentId: EnvironmentId,
  data: Record<string, string[]>
) {
  try {
    return await axios.post(
      `kubernetes/${environmentId}/services/delete`,
      data
    );
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to delete service(s)');
  }
}
