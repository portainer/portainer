import { useQuery, useMutation, useQueryClient } from 'react-query';

import { EnvironmentId } from '@/portainer/environments/types';
import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';

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
  namespaces: string[]
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
      const ingresses: Ingress[] = [];
      for (let i = 0; i < namespaces.length; i += 1) {
        const ings = await getIngresses(environmentId, namespaces[i]);
        if (ings) {
          ingresses.push(...ings);
        }
      }
      return ingresses;
    },
    {
      enabled: namespaces.length > 0,
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
  namespace: string
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
    async () => {
      const ing = await getIngressControllers(environmentId, namespace);
      return ing;
    },
    {
      enabled: !!namespace,
      ...withError('Unable to get ingress controllers'),
    }
  );
}
