import { useStore } from 'zustand';

import { notifySuccess } from '@/portainer/services/notifications';
import { environmentStore } from '@/react/hooks/current-environment-store';

import { PageHeader } from '@@/PageHeader';
import { confirmDelete } from '@@/modals/confirm';

import { Environment } from '../types';

import { EnvironmentsDatatable } from './EnvironmentsDatatable';
import { useDeleteEnvironmentsMutation } from './useDeleteEnvironmentsMutation';

export function ListView() {
  const constCurrentEnvironmentStore = useStore(environmentStore);
  const deletionMutation = useDeleteEnvironmentsMutation();

  return (
    <>
      <PageHeader
        title="Environments"
        breadcrumbs="Environment management"
        reload
      />

      <EnvironmentsDatatable onRemove={handleRemove} />
    </>
  );

  async function handleRemove(environmentsToDelete: Array<Environment>) {
    const confirmed = await confirmDelete(
      'This action will remove all configurations associated to your environment(s). Continue?'
    );

    if (!confirmed) {
      return;
    }

    const id = constCurrentEnvironmentStore.environmentId;
    // If the current endpoint was deleted, then clean endpoint store
    if (environmentsToDelete.some((e) => e.Id === id)) {
      constCurrentEnvironmentStore.clear();
    }

    deletionMutation.mutate(
      environmentsToDelete.map((e) => ({
        id: e.Id,
        deleteCluster: false,
        name: e.Name,
      })),
      {
        onSuccess() {
          notifySuccess(
            'Environments successfully removed',
            environmentsToDelete.map((e) => e.Name).join(', ')
          );
        },
      }
    );
  }
}
