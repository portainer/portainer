import { useTranslation } from 'react-i18next';

import { notifySuccess } from '@/portainer/services/notifications';

import { DeleteButton } from '@@/buttons/DeleteButton';
import { AddButton } from '@@/buttons';

import { EnvironmentGroup } from '../../types';

import { useDeleteEnvironmentGroupsMutation } from './useDeleteEnvironmentGroupsMutation';

export function TableActions({
  selectedItems,
}: {
  selectedItems: EnvironmentGroup[];
}) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteEnvironmentGroupsMutation();

  return (
    <>
      <DeleteButton
        disabled={selectedItems.length === 0}
        confirmMessage={t('env_groups.remove_confirm')}
        onConfirmed={handleRemove}
        data-cy="remove-environment-groups-button"
      />

      <AddButton data-cy="add-environment-group-button">{t('env_groups.add')}</AddButton>
    </>
  );

  function handleRemove() {
    const ids = selectedItems.map((item) => item.Id);
    deleteMutation.mutate(ids, {
      onSuccess() {
        notifySuccess(t('common.success'), t('env_groups.removed'));
      },
    });
  }
}
