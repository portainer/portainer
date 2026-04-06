import { useTranslation } from 'react-i18next';

import { notifySuccess } from '@/portainer/services/notifications';

import { DeleteButton } from '@@/buttons/DeleteButton';
import { AddButton } from '@@/buttons';

import { AccessToken } from '../../access-tokens/types';

import { useDeleteAccessTokensMutation } from './useDeleteAccessTokensMutation';

export function TableActions({
  selectedItems,
}: {
  selectedItems: AccessToken[];
}) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteAccessTokensMutation();

  return (
    <>
      <DeleteButton
        disabled={selectedItems.length === 0}
        confirmMessage={t('access_tokens.remove_confirm')}
        onConfirmed={handleRemove}
        data-cy="access-tokens-delete-button"
      />

      <AddButton to=".new-access-token" data-cy="access-tokens-add-button">
        {t('access_tokens.add')}
      </AddButton>
    </>
  );

  function handleRemove() {
    const ids = selectedItems.map((item) => item.id);
    deleteMutation.mutate(ids, {
      onSuccess() {
        notifySuccess(t('common.success'), t('access_tokens.remove_success'));
      },
    });
  }
}
