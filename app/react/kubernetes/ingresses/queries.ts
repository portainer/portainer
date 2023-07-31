import { useQuery, useMutation, useQueryClient } from 'react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';
import { getServices } from '@/react/kubernetes/networks/services/service';
import { isFulfilled } from '@/portainer/helpers/promise-utils';

import {
  getIngresses,
  getIngress,
  createIngress,
  deleteIngresses,
  updateIngress,
  getIngressControllers,
} from './service';
import { DeleteIngressesRequest, Ingress } from './types';

const ingressKeys = {
  all: ['environments', 'kubernetes', 'namespace', 'ingress'] as const,
  namespace: (
    environmentId: EnvironmentId,
    namespace: string,
    ingress: string
  ) => [...ingressKeys.all, String(environmentId), namespace, ingress] as const,
};

export function useIngress(
  environmentId: EnvironmentId,
  namespace: string,
  name: string
) {
  return useQuery(
    [
      'environments',
      environmentId,
      'kubernetes',
      'namespace',
      namespace,
      'ingress',
      name,
    ],
    async () => {
      const ing = await getIngress(environmentId, namespace, name);
      return ing;
    },
    {
      ...withError('Unable to get ingress'),
    }
  );
}

export function useIngresses(
  environmentId: EnvironmentId,
  namespaces?: string[]
) {
  return useQuery(
    [
      'environments',
      environmentId,
      'kubernetes',
      'namespace',
      namespaces,
      'ingress',
    ],
    async () => {
      if (!namespaces?.length) {
        return [];
      }
      const settledIngressesPromise = await Promise.allSettled(
        namespaces.map((namespace) => getIngresses(environmentId, namespace))
      );
      const ingresses = settledIngressesPromise
        .filter(isFulfilled)
        ?.map((i) => i.value);
      // flatten the array and remove empty ingresses
      const filteredIngresses = ingresses.flat().filter((ing) => ing);

      // get all services in only the namespaces that the ingresses are in to find missing services
      const uniqueNamespacesWithIngress = [
        ...new Set(filteredIngresses.map((ing) => ing?.Namespace)),
      ];
      const settledServicesPromise = await Promise.allSettled(
        uniqueNamespacesWithIngress.map((ns) => getServices(environmentId, ns))
      );
      const services = settledServicesPromise
        .filter(isFulfilled)
        ?.map((s) => s.value)
        .flat();

      // check if each ingress path service has a service that still exists
      const updatedFilteredIngresses: Ingress[] = filteredIngresses.map(
        (ing) => {
          const servicesInNamespace = services?.filter(
            (service) => service?.Namespace === ing?.Namespace
          );
          const serviceNamesInNamespace = servicesInNamespace?.map(
            (service) => service.Name
          );

          const updatedPaths =
            ing.Paths?.map((path) => {
              const hasService = serviceNamesInNamespace?.includes(
                path.ServiceName
              );
              return { ...path, HasService: hasService };
            }) || null;

          return { ...ing, Paths: updatedPaths };
        }
      );
      return updatedFilteredIngresses;
    },
    {
      enabled: !!namespaces?.length,
      ...withError('Unable to get ingresses'),
    }
  );
}

export function useCreateIngress() {
  const queryClient = useQueryClient();
  return useMutation(
    ({
      environmentId,
      ingress,
    }: {
      environmentId: EnvironmentId;
      ingress: Ingress;
    }) => createIngress(environmentId, ingress),
    mutationOptions(
      withError('Unable to create ingress controller'),
      withInvalidate(queryClient, [ingressKeys.all])
    )
  );
}

export function useUpdateIngress() {
  const queryClient = useQueryClient();
  return useMutation(
    ({
      environmentId,
      ingress,
    }: {
      environmentId: EnvironmentId;
      ingress: Ingress;
    }) => updateIngress(environmentId, ingress),
    mutationOptions(
      withError('Unable to update ingress controller'),
      withInvalidate(queryClient, [ingressKeys.all])
    )
  );
}

export function useDeleteIngresses() {
  const queryClient = useQueryClient();
  return useMutation(
    ({
      environmentId,
      data,
    }: {
      environmentId: EnvironmentId;
      data: DeleteIngressesRequest;
    }) => deleteIngresses(environmentId, data),
    mutationOptions(
      withError('Unable to update ingress controller'),
      withInvalidate(queryClient, [ingressKeys.all])
    )
  );
}

/**
 * Ingress Controllers
 */
export function useIngressControllers(
  environmentId: EnvironmentId,
  namespace?: string
) {
  return useQuery(
    [
      'environments',
      environmentId,
      'kubernetes',
      'namespace',
      namespace,
      'ingresscontrollers',
    ],
    async () =>
      namespace ? getIngressControllers(environmentId, namespace) : [],
    {
      enabled: !!namespace,
      ...withError('Unable to get ingress controllers'),
    }
  );
}
