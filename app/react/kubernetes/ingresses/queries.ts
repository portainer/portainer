import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
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
  options?: {
    autoRefreshRate?: number;
    enabled?: boolean;
    withServices?: boolean;
  }
) {
  const withServices = options?.withServices ?? false;

  return useQuery(
    ['environments', environmentId, 'kubernetes', 'ingress', withServices],
    async () => getIngresses(environmentId, options?.withServices),
    {
      ...withError('Unable to get ingresses'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
      enabled: options?.enabled,
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
  namespace?: string,
  allowedOnly?: boolean
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
      namespace
        ? getIngressControllers(environmentId, namespace, allowedOnly)
        : [],
    {
      enabled: !!namespace,
      ...withError('Unable to get ingress controllers'),
    }
  );
}