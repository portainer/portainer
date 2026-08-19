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
  const removeMutation = useDeleteEdgeJobsMutation();

  return (
    <div className="flex items-center gap-2">
      <DeleteButton
        confirmMessage="Do you want to remove the selected Edge Job(s)?"
        disabled={selectedItems.length === 0}
        onConfirmed={() => handleRemove(selectedItems)}
        data-cy="remove-edge-jobs-button"
      />

      <AddButton data-cy="add-edge-job-button">Add Edge job</AddButton>
    </div>
  );

  async function handleRemove(selectedItems: Array<EdgeJob>) {
    const ids = selectedItems.map((item) => item.Id);
    removeMutation.mutate(ids, {
      onSuccess: () => {
        notifySuccess('Success', 'Edge Job(s) removed');
      },
    });
  }
}
