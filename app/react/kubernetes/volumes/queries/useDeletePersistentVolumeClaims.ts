import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios from '@/portainer/services/axios/axios';
import { withError } from '@/react-tools/react-query';
import { notifySuccess } from '@/portainer/services/notifications';
import { PersistentVolumeClaim } from '@/react/kubernetes/volumes/ListView/types';

import { queryKeys } from './query-keys';

export function useDeletePersistentVolumeClaims(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (claims: PersistentVolumeClaim[]) =>
      deleteClaims(claims, environmentId),
    onSuccess: () => {
      notifySuccess('Success', 'Persistent volume claim successfully removed');
      queryClient.invalidateQueries(queryKeys.storages(environmentId));
      return queryClient.invalidateQueries(queryKeys.claims(environmentId));
    },
    ...withError('Unable to remove persistent volume claims'),
  });
}

function deleteClaims(
  claims: PersistentVolumeClaim[],
  environmentId: EnvironmentId
) {
  return axios.post(
    `/kubernetes/${environmentId}/persistent_volume_claims/delete`,
    claims.map((c) => ({ name: c.name, namespace: c.namespace }))
  );
}
