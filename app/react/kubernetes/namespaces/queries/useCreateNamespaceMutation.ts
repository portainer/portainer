import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withGlobalError, withInvalidate } from '@/react-tools/react-query';
import { updateEnvironmentRegistryAccess } from '@/react/portainer/environments/environment.service/registries';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { IngressControllerClassMap } from '../../cluster/ingressClass/types';
import { updateIngressControllerClassMap } from '../../cluster/ingressClass/useIngressControllerClassMap';
import { Namespaces, NamespacePayload, UpdateRegistryPayload } from '../types';

import { queryKeys } from './queryKeys';

export function useCreateNamespaceMutation(environmentId: EnvironmentId) {
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
      try {
        // create the namespace first, so that it exists before referencing it in the registry access request
        await createNamespace(environmentId, createNamespacePayload);
      } catch (e) {
        throw new Error(e as string);
      }

      // collect promises
      const updateRegistriesPromises = updateRegistriesPayload.map(
        ({ Id, Namespaces }) =>
          updateEnvironmentRegistryAccess(environmentId, Id, {
            Namespaces,
          })
      );
      const updateIngressControllerPromise =
        namespaceIngressControllerPayload.length > 0
          ? updateIngressControllerClassMap(
              environmentId,
              namespaceIngressControllerPayload,
              createNamespacePayload.Name
            )
          : Promise.resolve();

      // return combined promises
      return Promise.allSettled([
        updateIngressControllerPromise,
        ...updateRegistriesPromises,
      ]);
    },
    {
      ...withGlobalError('Unable to create namespace'),
      ...withInvalidate(queryClient, [queryKeys.list(environmentId)]),
    }
  );
}

// createNamespace is used to create a namespace using the Portainer backend
async function createNamespace(
  environmentId: EnvironmentId,
  payload: NamespacePayload
) {
  try {
    const { data: ns } = await axios.post<Namespaces>(
      buildUrl(environmentId),
      payload
    );
    return ns;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to create namespace');
  }
}

function buildUrl(environmentId: EnvironmentId, namespace?: string) {
  let url = `kubernetes/${environmentId}/namespaces`;

  if (namespace) {
    url += `/${namespace}`;
  }

  return url;
}
