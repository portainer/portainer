import { useMutation, useQuery, useQueryClient } from 'react-query';
import { compact } from 'lodash';

import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { getNamespaces } from '../namespaces/service';

async function getServices(
  environmentId: EnvironmentId,
  namespace: string,
  lookupApps: boolean
) {
  try {
    const { data: services } = await axios.get(
      `kubernetes/${environmentId}/namespaces/${namespace}/services`,
      {
        params: {
          lookupapplications: lookupApps,
        },
      }
    );
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

export function useMutationDeleteServices(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();
  return useMutation(
    ({
      environmentId,
      data,
    }: {
      environmentId: EnvironmentId;
      data: Record<string, string[]>;
    }) => deleteServices(environmentId, data),
    {
      onSuccess: () =>
        // use the exact same query keys as the useServices hook to invalidate the services list
        queryClient.invalidateQueries([
          'environments',
          environmentId,
          'kubernetes',
          'services',
        ]),
      ...withError('Unable to delete service(s)'),
    }
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
