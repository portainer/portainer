import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';

import { notifySuccess } from '@/portainer/services/notifications';
import { environmentStore } from '@/react/hooks/current-environment-store';

import { PageHeader } from '@@/PageHeader';
import { confirmDelete } from '@@/modals/confirm';

import { Environment } from '../types';

import { EnvironmentsDatatable } from './EnvironmentsDatatable';
import { useDeleteEnvironmentsMutation } from './useDeleteEnvironmentsMutation';

export function ListView() {
  const { t } = useTranslation();
  const constCurrentEnvironmentStore = useStore(environmentStore);
  const deletionMutation = useDeleteEnvironmentsMutation();

  return (
    <>
      <PageHeader
        title={t('environments.title')}
        breadcrumbs={t('environments.breadcrumbs')}
        reload
      />

      <EnvironmentsDatatable onRemove={handleRemove} />
    </>
  );

  async function handleRemove(environmentsToDelete: Array<Environment>) {
    const confirmed = await confirmDelete(
      t('environments.remove_confirm')
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
            t('environments.remove_success'),
            environmentsToDelete.map((e) => e.Name).join(', ')
          );
        },
      }
    );
  }
}
