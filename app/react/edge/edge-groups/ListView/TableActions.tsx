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
  const removeMutation = useDeleteEdgeGroupsMutation();

  return (
    <div className="flex items-center gap-2">
      <DeleteButton
        confirmMessage="Do you want to remove the selected Edge Group(s)?"
        disabled={selectedItems.length === 0}
        onConfirmed={() => handleRemove(selectedItems)}
        data-cy="remove-edge-group-button"
      />

      <AddButton data-cy="add-edge-group-button">Add Edge group</AddButton>
    </div>
  );

  async function handleRemove(selectedItems: Array<EdgeGroup>) {
    const ids = selectedItems.map((item) => item.Id);
    removeMutation.mutate(ids, {
      onSuccess: () => {
        notifySuccess('Success', 'Edge Group(s) removed');
      },
    });
  }
}
