import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withGlobalError, withInvalidate } from '@/react-tools/react-query';
import { updateEnvironmentRegistryAccess } from '@/react/portainer/environments/environment.service/registries';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { notifyError } from '@/portainer/services/notifications';

import { IngressControllerClassMap } from '../../cluster/ingressClass/types';
import { updateIngressControllerClassMap } from '../../cluster/ingressClass/useIngressControllerClassMap';
import { Namespaces, NamespacePayload, UpdateRegistryPayload } from '../types';

import { queryKeys } from './queryKeys';

export function useUpdateNamespaceMutation(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();
  return useMutation(
    async ({
      createNamespacePayload,
      updateRegistriesPayload,
      namespaceIngressControllerPayload,
    }: {
      createNamespacePayload: NamespacePayload;
      updateRegistriesPayload: UpdateRegistryPayload[];
      namespaceIngressControllerPayload: IngressControllerClassMap[];
    }) => {
      const { Name: namespaceName } = createNamespacePayload;
      const updatedNamespace = await updateNamespace(
        environmentId,
        namespaceName,
        createNamespacePayload
      );

      // collect promises
      const updateRegistriesPromises = updateRegistriesPayload.map(
        ({ Id, Namespaces }) =>
          updateEnvironmentRegistryAccess(environmentId, Id, {
            Namespaces,
          })
      );
      const updateIngressControllerPromise = updateIngressControllerClassMap(
        environmentId,
        namespaceIngressControllerPayload,
        createNamespacePayload.Name
      );
      const results = await Promise.allSettled([
        updateIngressControllerPromise,
        ...updateRegistriesPromises,
      ]);
      // Check for any failures in the additional updates
      const failures = results.filter((result) => result.status === 'rejected');
      failures.forEach((failure) => {
        notifyError(
          'Unable to update namespace',
          undefined,
          failure.reason as string
        );
      });
      return updatedNamespace;
    },
    {
      ...withGlobalError('Unable to update namespace'),
      ...withInvalidate(queryClient, [queryKeys.list(environmentId)]),
    }
  );
}

// updateNamespace is used to update a namespace using the Portainer backend
async function updateNamespace(
  environmentId: EnvironmentId,
  namespace: string,
  payload: NamespacePayload
) {
  try {
    const { data: ns } = await axios.put<Namespaces>(
      `kubernetes/${environmentId}/namespaces/${namespace}`,
      payload
    );
    return ns;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to create namespace');
  }
}
