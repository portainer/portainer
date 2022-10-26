import { useMutation, useQueryClient } from 'react-query';

import { deleteContainerGroup } from '@/react/azure/services/container-groups.service';
import { useEnvironmentId } from '@/portainer/hooks/useEnvironmentId';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { promiseSequence } from '@/portainer/helpers/promise-utils';
import { useContainerGroups } from '@/react/azure/queries/useContainerGroups';
import { useSubscriptions } from '@/react/azure/queries/useSubscriptions';

import { PageHeader } from '@@/PageHeader';
import { TableSettingsProvider } from '@@/datatables/useTableSettings';

import { ContainersDatatable } from './ContainersDatatable';
import { TableSettings } from './types';

export function ListView() {
  const defaultSettings: TableSettings = {
    pageSize: 10,
    sortBy: { id: 'state', desc: false },
  };

  const tableKey = 'containergroups';

  const environmentId = useEnvironmentId();

  const subscriptionsQuery = useSubscriptions(environmentId);

  const groupsQuery = useContainerGroups(
    environmentId,
    subscriptionsQuery.data,
    subscriptionsQuery.isSuccess
  );

  const { handleRemove } = useRemoveMutation(environmentId);

  if (groupsQuery.isLoading || subscriptionsQuery.isLoading) {
    return null;
  }

  return (
    <>
      <PageHeader
        breadcrumbs="Container instances"
        reload
        title="Container list"
      />
      <TableSettingsProvider defaults={defaultSettings} storageKey={tableKey}>
        <ContainersDatatable
          tableKey={tableKey}
          dataset={groupsQuery.containerGroups}
          onRemoveClick={handleRemove}
        />
      </TableSettingsProvider>
    </>
  );
}

function useRemoveMutation(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation(
    (containerGroupIds: string[]) =>
      promiseSequence(
        containerGroupIds.map(
          (id) => () => deleteContainerGroup(environmentId, id)
        )
      ),

    {
      onSuccess() {
        return queryClient.invalidateQueries([
          'azure',
          environmentId,
          'subscriptions',
        ]);
      },
      onError(err) {
        notifyError(
          'Failure',
          err as Error,
          'Unable to remove container groups'
        );
      },
    }
  );

  return { handleRemove };

  async function handleRemove(groupIds: string[]) {
    deleteMutation.mutate(groupIds, {
      onSuccess: () => {
        notifySuccess('Success', 'Container groups successfully removed');
      },
    });
  }
}
