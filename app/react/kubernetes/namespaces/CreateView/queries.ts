import { useMutation, useQuery } from 'react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { notifyError } from '@/portainer/services/notifications';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';
import { updateEnvironmentRegistryAccess } from '@/react/portainer/environments/environment.service/registries';
import { updateIngressControllerClassMap } from '@/react/kubernetes/cluster/ingressClass/useIngressControllerClassMap';
import { IngressControllerClassMap } from '@/react/kubernetes/cluster/ingressClass/types';

import { createNamespace } from '../service';

import { CreateNamespacePayload, UpdateRegistryPayload } from './types';

type K8sNodeLimits = {
  CPU: number;
  Memory: number;
};

export function useResourceLimits(environmentId: EnvironmentId) {
  return useQuery(
    ['environments', environmentId, 'kubernetes', 'max_resource_limits'],
    () => getResourceLimits(environmentId),
    {
      onError: (err) => {
        notifyError('Failure', err as Error, 'Unable to get resource limits');
      },
    }
  );
}

async function getResourceLimits(environmentId: EnvironmentId) {
  try {
    const { data: limits } = await axios.get<K8sNodeLimits>(
      `/kubernetes/${environmentId}/max_resource_limits`
    );
    return limits;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve resource limits');
  }
}

export function useCreateNamespaceMutation(environmentId: EnvironmentId) {
  return useMutation(
    async ({
      createNamespacePayload,
      updateRegistriesPayload,
      namespaceIngressControllerPayload,
    }: {
      createNamespacePayload: CreateNamespacePayload;
      updateRegistriesPayload: UpdateRegistryPayload[];
      namespaceIngressControllerPayload: IngressControllerClassMap[];
    }) => {
      // create the namespace first, so that it exists before referencing it in the registry access request
      await createNamespace(environmentId, createNamespacePayload);

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
      ...withError('Unable to create namespace'),
    }
  );
}
