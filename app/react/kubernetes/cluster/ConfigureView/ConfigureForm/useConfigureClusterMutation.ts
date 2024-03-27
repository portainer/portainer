import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Operation } from 'fast-json-patch';
import _ from 'lodash';

import { withError, withInvalidate } from '@/react-tools/react-query';
import { environmentQueryKeys } from '@/react/portainer/environments/queries/query-keys';
import {
  UpdateEnvironmentPayload,
  updateEnvironment,
} from '@/react/portainer/environments/queries/useUpdateEnvironmentMutation';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { updateIngressControllerClassMap } from '../../ingressClass/useIngressControllerClassMap';
import { IngressControllerClassMap } from '../../ingressClass/types';

export type ConfigureClusterPayloads = {
  id: number;
  updateEnvironmentPayload: Partial<UpdateEnvironmentPayload>;
  initialIngressControllers: IngressControllerClassMap[];
  ingressControllers: IngressControllerClassMap[];
  storageClassPatches: {
    name: string;
    patch: Operation[];
  }[];
};

// useConfigureClusterMutation updates the environment, the ingress classes and the storage classes
export function useConfigureClusterMutation() {
  const queryClient = useQueryClient();
  return useMutation(
    async ({
      id,
      updateEnvironmentPayload,
      initialIngressControllers,
      ingressControllers,
      storageClassPatches,
    }: ConfigureClusterPayloads) => {
      await updateEnvironment({ id, payload: updateEnvironmentPayload });
      await Promise.all(
        storageClassPatches.map(({ name, patch }) =>
          patchStorageClass(id, name, patch)
        )
      );
      // only update the ingress classes if they have changed
      if (!_.isEqual(initialIngressControllers, ingressControllers)) {
        await updateIngressControllerClassMap(id, ingressControllers);
      }
    },
    {
      ...withInvalidate(queryClient, [environmentQueryKeys.base()], {
        skipRefresh: true,
      }),
      ...withError('Unable to apply configuration', 'Failure'),
    }
  );
}

async function patchStorageClass(
  environmentId: number,
  name: string,
  storageClassPatch: Operation[]
) {
  try {
    await axios.patch(
      `/endpoints/${environmentId}/kubernetes/apis/storage.k8s.io/v1/storageclasses/${name}`,
      storageClassPatch,
      {
        headers: {
          'Content-Type': 'application/json-patch+json',
        },
      }
    );
  } catch (e) {
    throw parseAxiosError(e, `Unable to patch StorageClass ${name}`);
  }
}
