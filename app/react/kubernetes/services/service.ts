import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ServiceList } from 'kubernetes-types/core/v1';

import { withGlobalError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { Service } from '@/react/kubernetes/services/types';

import { parseKubernetesAxiosError } from '../axiosError';

export const queryKeys = {
  clusterServices: (environmentId: EnvironmentId) =>
    ['environments', environmentId, 'kubernetes', 'services'] as const,
};

/**
 * Custom hook to fetch cluster services for a specific environment.
 *
 * @param environmentId - The ID of the environment.
 * @param options - Additional options for fetching services.
 * @param options.autoRefreshRate - The auto refresh rate for refetching services.
 * @param options.withApplications - Whether to lookup applications for the services.
 *
 * @returns The result of the query.
 */
export function useClusterServices(
  environmentId: EnvironmentId,
  options?: { autoRefreshRate?: number; withApplications?: boolean }
) {
  return useQuery(
    queryKeys.clusterServices(environmentId),
    async () => getClusterServices(environmentId, options?.withApplications),
    {
      ...withGlobalError('Unable to get services.'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
    }
  );
}

// get a list of services, based on an array of service names, for a specific namespace
export function useServicesQuery<T extends Service | string = Service>(
  environmentId: EnvironmentId,
  namespace: string,
  serviceNames: string[],
  options?: { yaml?: boolean }
) {
  return useQuery(
    ['environments', environmentId, 'kubernetes', 'services', serviceNames],
    async () => {
      // promise.all is best in this case because I want to return an error if even one service request has an error
      const services = await Promise.all(
        serviceNames.map((serviceName) =>
          getService<T>(environmentId, namespace, serviceName, options?.yaml)
        )
      );
      return services;
    },
    {
      ...withGlobalError('Unable to retrieve services.'),
      enabled: !!serviceNames?.length,
    }
  );
}

export function useMutationDeleteServices(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();
  return useMutation(deleteServices, {
    onSuccess: () =>
      queryClient.invalidateQueries(queryKeys.clusterServices(environmentId)),
    ...withGlobalError('Unable to delete service(s)'),
  });
}

// get a list of services for a specific namespace from the Portainer API
export async function getServices(
  environmentId: EnvironmentId,
  namespace: string,
  withApplications?: boolean
) {
  try {
    const { data: services } = await axios.get<Array<Service>>(
      `kubernetes/${environmentId}/namespaces/${namespace}/services`,
      {
        params: {
          withApplications,
        },
      }
    );
    return services;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve services');
  }
}

export async function getClusterServices(
  environmentId: EnvironmentId,
  withApplications?: boolean
) {
  try {
    const { data: services } = await axios.get<Array<Service>>(
      `kubernetes/${environmentId}/services`,
      {
        params: {
          withApplications,
        },
      }
    );
    return services;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve services');
  }
}

// getNamespaceServices is used to get a list of services for a specific namespace
// it calls the kubernetes api directly and not the portainer api
export async function getNamespaceServices(
  environmentId: EnvironmentId,
  namespace: string,
  queryParams?: Record<string, string>
) {
  try {
    const { data: services } = await axios.get<ServiceList>(
      `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/services`,
      {
        params: queryParams,
      }
    );
    return services.items;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to retrieve services');
  }
}

async function getService<T extends Service | string = Service>(
  environmentId: EnvironmentId,
  namespace: string,
  serviceName: string,
  yaml?: boolean
) {
  try {
    const { data: service } = await axios.get<T>(
      `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/services/${serviceName}`,
      {
        headers: {
          Accept: yaml ? 'application/yaml' : 'application/json',
        },
      }
    );
    return service;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to retrieve service');
  }
}

export async function deleteServices({
  environmentId,
  data,
}: {
  environmentId: EnvironmentId;
  data: Record<string, string[]>;
}) {
  try {
    return await axios.post(
      `kubernetes/${environmentId}/services/delete`,
      data
    );
  } catch (e) {
    throw parseAxiosError(e, 'Unable to delete service(s)');
  }
}
