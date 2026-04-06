import { useTranslation } from 'react-i18next';

import { notifySuccess } from '@/portainer/services/notifications';

import { AddButton } from '@@/buttons';
import { DeleteButton } from '@@/buttons/DeleteButton';

import { EdgeJob } from '../types';

import { useDeleteEdgeJobsMutation } from './useDeleteEdgeJobsMutation';

export function TableActions({
  selectedItems,
}: {
  selectedItems: Array<EdgeJob>;
}) {
  const { t } = useTranslation();
  const removeMutation = useDeleteEdgeJobsMutation();

  return (
    <div className="flex items-center gap-2">
      <DeleteButton
        confirmMessage={t('edge.jobs.confirm_remove')}
        disabled={selectedItems.length === 0}
        onConfirmed={() => handleRemove(selectedItems)}
        data-cy="remove-edge-jobs-button"
      />

      <AddButton data-cy="add-edge-job-button">{t('edge.jobs.add')}</AddButton>
    </div>
  );

  async function handleRemove(selectedItems: Array<EdgeJob>) {
    const ids = selectedItems.map((item) => item.Id);
    removeMutation.mutate(ids, {
      onSuccess: () => {
        notifySuccess(t('common.success'), t('edge.jobs.notifications.removed'));
      },
    });
  }
}
