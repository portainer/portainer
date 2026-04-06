import { useTranslation } from 'react-i18next';

import { notifySuccess } from '@/portainer/services/notifications';

import { AddButton } from '@@/buttons';
import { DeleteButton } from '@@/buttons/DeleteButton';

import { useDeleteEdgeStacksMutation } from './useDeleteEdgeStacksMutation';
import { DecoratedEdgeStack } from './types';

export function TableActions({
  selectedItems,
}: {
  selectedItems: Array<DecoratedEdgeStack>;
}) {
  const { t } = useTranslation();
  const removeMutation = useDeleteEdgeStacksMutation();

  return (
    <div className="flex items-center gap-2">
      <DeleteButton
        disabled={selectedItems.length === 0}
        onConfirmed={() => handleRemove(selectedItems)}
        confirmMessage={t('edge.stacks.confirm_remove')}
        data-cy="edgeStack-removeStackButton"
      />

      <AddButton data-cy="edgeStack-addStackButton">{t('edge.stacks.add')}</AddButton>
    </div>
  );

  async function handleRemove(selectedItems: Array<DecoratedEdgeStack>) {
    const ids = selectedItems.map((item) => item.Id);
    removeMutation.mutate(ids, {
      onSuccess: () => {
        notifySuccess(t('common.success'), t('edge.stacks.notifications.removed'));
      },
    });
  }
}
