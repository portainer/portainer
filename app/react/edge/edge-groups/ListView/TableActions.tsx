import { useTranslation } from 'react-i18next';

import { notifySuccess } from '@/portainer/services/notifications';

import { AddButton } from '@@/buttons';
import { DeleteButton } from '@@/buttons/DeleteButton';

import { EdgeGroup } from '../types';

import { useDeleteEdgeGroupsMutation } from './useDeleteEdgeGroupMutation';

export function TableActions({
  selectedItems,
}: {
  selectedItems: Array<EdgeGroup>;
}) {
  const { t } = useTranslation();
  const removeMutation = useDeleteEdgeGroupsMutation();

  return (
    <div className="flex items-center gap-2">
      <DeleteButton
        confirmMessage={t('edge.groups.confirm_remove')}
        disabled={selectedItems.length === 0}
        onConfirmed={() => handleRemove(selectedItems)}
        data-cy="remove-edge-group-button"
      />

      <AddButton data-cy="add-edge-group-button">
        {t('edge.groups.add')}
      </AddButton>
    </div>
  );

  async function handleRemove(selectedItems: Array<EdgeGroup>) {
    const ids = selectedItems.map((item) => item.Id);
    removeMutation.mutate(ids, {
      onSuccess: () => {
        notifySuccess(
          t('common.success'),
          t('edge.groups.notifications.removed')
        );
      },
    });
  }
}
