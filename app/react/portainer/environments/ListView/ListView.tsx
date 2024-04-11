import { useStore } from 'zustand';

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

  async function handleRemove(environments: Array<Environment>) {
    const confirmed = await confirmDelete(
      'This action will remove all configurations associated to your environment(s). Continue?'
    );

    if (!confirmed) {
      return;
    }

    const id = constCurrentEnvironmentStore.environmentId;
    // If the current endpoint was deleted, then clean endpoint store
    if (environments.some((e) => e.Id === id)) {
      constCurrentEnvironmentStore.clear();
    }

    deletionMutation.mutate(
      environments.map((e) => ({
        id: e.Id,
        deleteCluster: false,
        name: e.Name,
      }))
    );
  }
}
