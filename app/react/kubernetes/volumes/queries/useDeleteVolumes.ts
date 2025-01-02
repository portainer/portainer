import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios from '@/portainer/services/axios';
import { getAllSettledItems } from '@/portainer/helpers/promise-utils';
import { withGlobalError } from '@/react-tools/react-query';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { pluralize } from '@/portainer/helpers/strings';

import { parseKubernetesAxiosError } from '../../axiosError';
import { VolumeViewModel } from '../ListView/types';

import { queryKeys } from './query-keys';

export function useDeleteVolumes(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (volumes: VolumeViewModel[]) =>
      deleteVolumes(volumes, environmentId),
    onSuccess: ({ fulfilledItems, rejectedItems }) => {
      // one error notification per rejected item
      rejectedItems.forEach(({ item, reason }) => {
        notifyError(
          `Failed to remove volume '${item.PersistentVolumeClaim.Name}'`,
          new Error(reason)
        );
      });

      // one success notification for all fulfilled items
      if (fulfilledItems.length) {
        notifySuccess(
          `${pluralize(fulfilledItems.length, 'Volume')} successfully removed`,
          fulfilledItems
            .map((item) => item.PersistentVolumeClaim.Name)
            .join(', ')
        );
      }
      queryClient.invalidateQueries(queryKeys.storages(environmentId));
      queryClient.invalidateQueries(queryKeys.volumes(environmentId));
    },
    ...withGlobalError('Unable to remove volumes'),
  });
}

function deleteVolumes(
  volumes: VolumeViewModel[],
  environmentId: EnvironmentId
) {
  return getAllSettledItems(volumes, deleteVolume);

  async function deleteVolume(volume: VolumeViewModel) {
    try {
      await axios.delete(
        `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${volume.ResourcePool.Namespace.Name}/persistentvolumeclaims/${volume.PersistentVolumeClaim.Name}`
      );
    } catch (error) {
      throw parseKubernetesAxiosError(error, 'Unable to remove volume');
    }
  }
}
