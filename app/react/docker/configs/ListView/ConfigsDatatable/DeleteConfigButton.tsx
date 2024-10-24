import { useQueryClient, useMutation } from '@tanstack/react-query';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { promiseSequence } from '@/portainer/helpers/promise-utils';
import { withError, withInvalidate } from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { DeleteButton } from '@@/buttons/DeleteButton';

import { ConfigViewModel } from '../../model';
import { queryKeys } from '../queries/queryKeys';
import { deleteConfig } from '../queries/useDeleteConfigMutation';

export function DeleteConfigButton({
  selectedItems,
}: {
  selectedItems: Array<ConfigViewModel>;
}) {
  const environmentId = useEnvironmentId();
  const mutation = useDeleteConfigListMutation(environmentId);

  return (
    <DeleteButton
      data-cy="remove-docker-configs-button"
      onConfirmed={() => {
        mutation.mutate(selectedItems.map((item) => item.Id));
      }}
      confirmMessage="Do you want to remove the selected config(s)?"
      disabled={selectedItems.length === 0}
    />
  );
}

function useDeleteConfigListMutation(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: Array<string>) =>
      promiseSequence(
        ids.map((configId) => () => deleteConfig({ environmentId, configId }))
      ),
    ...withError('Unable to remove configs'),
    ...withInvalidate(queryClient, [queryKeys.base(environmentId)]),
  });
}
