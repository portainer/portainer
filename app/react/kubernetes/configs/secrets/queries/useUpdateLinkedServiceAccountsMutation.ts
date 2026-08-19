import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { getAllSettledItems } from '@/portainer/helpers/promise-utils';
import { withError } from '@/react-tools/react-query';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { pluralize } from '@/portainer/helpers/strings';
import { queryKeys } from '@/react/kubernetes/more-resources/ServiceAccountsView/queries/query-keys';
import { secretQueryKeys } from '@/react/kubernetes/configs/queries/query-keys';

export type SAImagePullSecretsUpdate = {
  saName: string;
  namespace: string;
  newSecrets: string[];
};

export function useUpdateLinkedServiceAccountsMutation(
  environmentId: EnvironmentId
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: SAImagePullSecretsUpdate[]) =>
      updateLinkedServiceAccounts(updates, environmentId),
    onSuccess: async ({ fulfilledItems, rejectedItems }) => {
      rejectedItems.forEach(({ item, reason }) => {
        notifyError(
          `Failed to update service account '${item.saName}'`,
          new Error(reason)
        );
      });
      if (fulfilledItems.length) {
        notifySuccess(
          `${pluralize(fulfilledItems.length, 'Service account')} updated`,
          fulfilledItems.map((item) => item.saName).join(', ')
        );
      }
      // use await to wait for refetches before showing the mutation as complete
      await queryClient.invalidateQueries(queryKeys.base(environmentId));
      // just trigger the invalidation for secrets without waiting the refetch
      queryClient.invalidateQueries(
        secretQueryKeys.secretsForCluster(environmentId)
      );
    },
    ...withError('Unable to update linked service accounts'),
  });
}

function updateLinkedServiceAccounts(
  updates: Array<SAImagePullSecretsUpdate>,
  environmentId: EnvironmentId
) {
  return getAllSettledItems(updates, updateServiceAccount);

  async function updateServiceAccount({
    saName,
    namespace,
    newSecrets,
  }: SAImagePullSecretsUpdate) {
    try {
      await axios.put(
        `kubernetes/${environmentId}/namespaces/${namespace}/service_accounts/${saName}/image_pull_secrets`,
        { secretNames: newSecrets }
      );
    } catch (e) {
      throw parseAxiosError(e, 'Unable to update service account');
    }
  }
}
