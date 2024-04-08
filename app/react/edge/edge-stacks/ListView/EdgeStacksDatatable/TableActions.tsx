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
  const removeMutation = useDeleteEdgeStacksMutation();

  return (
    <div className="flex items-center gap-2">
      <DeleteButton
        disabled={selectedItems.length === 0}
        onConfirmed={() => handleRemove(selectedItems)}
        confirmMessage="Are you sure you want to remove the selected Edge stack(s)?"
        data-cy="edgeStack-removeStackButton"
      />

      <AddButton data-cy="edgeStack-addStackButton">Add stack</AddButton>
    </div>
  );

  async function handleRemove(selectedItems: Array<DecoratedEdgeStack>) {
    const ids = selectedItems.map((item) => item.Id);
    removeMutation.mutate(ids, {
      onSuccess: () => {
        notifySuccess('Success', 'Edge stack(s) removed');
      },
    });
  }
}
