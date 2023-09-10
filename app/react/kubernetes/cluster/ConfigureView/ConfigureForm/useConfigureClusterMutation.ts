import { useMutation, useQueryClient } from 'react-query';
import { Operation } from 'fast-json-patch';
import _ from 'lodash';

import { withError } from '@/react-tools/react-query';
import { environmentQueryKeys } from '@/react/portainer/environments/queries/query-keys';
import {
  UpdateEnvironmentPayload,
  updateEnvironment,
} from '@/react/portainer/environments/queries/useUpdateEnvironmentMutation';
import axios from '@/portainer/services/axios';
import { parseKubernetesAxiosError } from '@/react/kubernetes/axiosError';

import { updateIngressControllerClassMap } from '../../ingressClass/useIngressControllerClassMap';
import { IngressControllerClassMapRowData } from '../../ingressClass/types';

export type ConfigureClusterPayloads = {
  id: number;
  updateEnvironmentPayload: Partial<UpdateEnvironmentPayload>;
  initialIngressControllers: IngressControllerClassMapRowData[];
  ingressControllers: IngressControllerClassMapRowData[];
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
      onSuccess: () => {
        // not returning the promise here because we don't want to wait for the invalidateQueries to complete (longer than the mutation itself)
        queryClient.invalidateQueries(environmentQueryKeys.base());
      },
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
    throw parseKubernetesAxiosError(
      e as Error,
      `Unable to patch StorageClass ${name}`
    );
  }
}
