import { notifySuccess } from '@/portainer/services/notifications';

import { DeleteButton } from '@@/buttons/DeleteButton';
import { AddButton } from '@@/buttons';

import { AccessToken } from '../../access-tokens/types';

import { useDeleteAccessTokensMutation } from './useDeleteAccessTokensMutation';

export function TableActions({
  selectedItems,
  canExit,
}: {
  selectedItems: AccessToken[];
  canExit?: boolean;
}) {
  const deleteMutation = useDeleteAccessTokensMutation();

  return (
    <>
      <DeleteButton
        disabled={selectedItems.length === 0}
        confirmMessage="Do you want to remove the selected access token(s)? Any script or application using these tokens will no longer be able to invoke the Portainer API."
        onConfirmed={handleRemove}
      />

      <AddButton to=".new-access-token" disabled={!canExit}>
        Add access token
      </AddButton>
    </>
  );

  function handleRemove() {
    const ids = selectedItems.map((item) => item.id);
    deleteMutation.mutate(ids, {
      onSuccess() {
        notifySuccess('Success', 'Access token(s) removed');
      },
    });
  }
}
